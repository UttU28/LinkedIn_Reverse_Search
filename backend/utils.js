const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// Which LLM provider to use: "openai" (default) or "gemini"
const USE_LLM_MODEL = (process.env.USE_LLM_MODEL || 'openai').toLowerCase();

/**
 * Standardized logging function with log levels
 * @param {string} message - Message to log
 * @param {string} level - Log level: 'info', 'debug', 'warn', 'error'
 */
function log(message, level = 'info') {
  // Get log level from environment or default to 'info'
  const configuredLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
  const logLevels = { error: 0, warn: 1, info: 2, debug: 3 };
  
  // Skip logs based on configured level
  if (logLevels[level] > logLevels[configuredLevel]) {
    return;
  }

  const timestamp = new Date().toISOString().split('T')[1].split('.')[0]; // HH:MM:SS format
  
  // Format: timestamp in brackets, level in uppercase, then message
  switch(level) {
    case 'error':
      console.error(`[${timestamp}] ERROR: ${message}`);
      break;
    case 'warn':
      console.warn(`[${timestamp}] WARN: ${message}`);
      break;
    case 'debug':
      console.log(`[${timestamp}] DEBUG: ${message}`);
      break;
    case 'info':
    default:
      console.log(`[${timestamp}] INFO: ${message}`);
  }
}

/**
 * Rate limiter using token bucket algorithm with exponential backoff and jitter
 */
class RateLimiter {
  constructor(requestsPerMinute, name = 'API') {
    this.maxTokens = requestsPerMinute;
    this.tokens = requestsPerMinute;
    this.lastRefill = Date.now();
    this.refillRate = requestsPerMinute / 60000; // tokens per millisecond
    this.name = name;
    this.waitingPromises = [];
    this.consecutiveErrors = 0;
  }

  async acquire() {
    // Refill tokens based on elapsed time
    this._refillTokens();
    
    // If we have a token available, consume it immediately
    if (this.tokens >= 1) {
      this.tokens -= 1;
      // Only log rate limiting at debug level
      log(`${this.name} token acquired (${this.tokens.toFixed(2)} remaining)`, 'debug');
      return;
    }
    
    // Calculate time until next token is available
    const timeToWait = this._calculateWaitTime();
    
    log(`${this.name} rate limited. Waiting ${Math.round(timeToWait/1000)}s before retry.`, 'warn');
    
    // Wait for the required time
    await new Promise(resolve => setTimeout(resolve, timeToWait));
    
    // Try again (recursive call)
    return this.acquire();
  }

  _refillTokens() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const newTokens = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
    this.lastRefill = now;
  }

  _calculateWaitTime() {
    // Base wait time - time until we have one token
    const baseWait = (1 - this.tokens) / this.refillRate;
    
    // Add jitter - random value between 0 and 1
    const jitter = Math.random();
    
    // Calculate exponential backoff factor based on consecutive error count
    // 1, 2, 4, 8, 16, etc. up to a maximum
    const backoffFactor = this.consecutiveErrors > 0 
      ? Math.min(Math.pow(2, this.consecutiveErrors - 1), 16) 
      : 1;
    
    // Apply exponential backoff and jitter
    return Math.ceil(baseWait * backoffFactor * (1 + jitter * 0.5));
  }

  // Track errors for exponential backoff
  recordError() {
    this.consecutiveErrors += 1;
    log(`${this.name} error #${this.consecutiveErrors}, increasing backoff`, 'warn');
  }

  recordSuccess() {
    if (this.consecutiveErrors > 0) {
      this.consecutiveErrors = 0;
      log(`${this.name} recovered after errors`, 'debug');
    }
  }
}

/**
 * Google Custom Search API wrapper with rate limiting
 */
class GoogleCustomSearch {
  constructor(apiKey, searchEngineId) {
    this.apiKey = apiKey;
    this.searchEngineId = searchEngineId;
    this.baseUrl = 'https://www.googleapis.com/customsearch/v1';
    this.rateLimiter = new RateLimiter(
      parseInt(process.env.GOOGLE_REQUESTS_PER_MINUTE || 30),
      'Google Search'
    );
  }

  async search(query, num = 10) {
    try {
      await this.rateLimiter.acquire();
      
      const response = await axios.get(this.baseUrl, {
        params: {
          key: this.apiKey,
          cx: this.searchEngineId,
          q: query,
          num: num
        }
      });
      
      this.rateLimiter.recordSuccess();
      return response.data.items || [];
    } catch (error) {
      if (error.response && (error.response.status === 429 || 
          (error.response.data && error.response.data.error && 
           error.response.data.error.message && 
           error.response.data.error.message.includes('quota')))) {
        log(`Google Search API rate limit exceeded: ${error.message}`, 'error');
        this.rateLimiter.recordError();
        
        await new Promise(resolve => setTimeout(
          resolve, 
          Math.min(1000 * Math.pow(2, this.rateLimiter.consecutiveErrors), 60000)
        ));
        
        return this.search(query, num);
      }
      
      if (error.response) {
        log(
          `Google Search error: ${error.message} (status: ${error.response.status} ${error.response.statusText || ''})`,
          'error'
        );
        if (error.response.data) {
          const body = JSON.stringify(error.response.data);
          log(`Google Search response body: ${body.slice(0, 1000)}`, 'error');
        }
      } else {
        log(`Google Search error: ${error.message}`, 'error');
      }
      return [];
    }
  }
}

/**
 * Extract essential data from search results
 */
function extractEssentialData(results) {
  return results.map(item => ({
    title: item.title,
    link: item.link,
    snippet: item.snippet
  }));
}

/**
 * Internal helper to call Google Gemini API (via Google Generative Language)
 * Respects the same interface as the OpenAI caller.
 */
async function callGemini(jsonData, systemPrompt, userPromptWithData) {
  // Create a static rate limiter for Gemini requests
  if (!callGemini.rateLimiter) {
    callGemini.rateLimiter = new RateLimiter(
      parseInt(
        process.env.GEMINI_REQUESTS_PER_MINUTE ||
        process.env.OPENAI_REQUESTS_PER_MINUTE ||
        30
      ),
      'Gemini'
    );
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    log("Gemini API key (GEMINI_API_KEY) not found in environment variables", 'error');
    return null;
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

  try {
    await callGemini.rateLimiter.acquire();

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${userPromptWithData}` }]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    callGemini.rateLimiter.recordSuccess();

    const candidates = response.data && response.data.candidates;
    if (!candidates || !candidates.length) {
      log('Gemini response did not contain any candidates', 'warn');
      return null;
    }

    const parts = candidates[0].content && candidates[0].content.parts;
    if (!parts || !parts.length) {
      log('Gemini response candidate did not contain any parts', 'warn');
      return null;
    }

    const aiResponse = parts
      .map(part => part.text || '')
      .join('\n')
      .trim();

    return aiResponse || null;
  } catch (error) {
    if (error.response && (error.response.status === 429 || error.response.status === 500)) {
      log(`Gemini API rate limit / transient error: ${error.message}`, 'error');
      callGemini.rateLimiter.recordError();

      const backoffMs = Math.min(
        1000 * Math.pow(2, callGemini.rateLimiter.consecutiveErrors),
        60000
      );
      log(`Backing off Gemini API for ${Math.round(backoffMs / 1000)}s before retry`, 'warn');

      await new Promise(resolve => setTimeout(resolve, backoffMs));

      return callGemini(jsonData, systemPrompt, userPromptWithData);
    }

    log(`Gemini API error: ${error.message}`, 'error');
    return null;
  }
}

/**
 * Call LLM (OpenAI or Gemini) to analyze search results with rate limiting.
 * The provider is selected via USE_LLM_MODEL env: "openai" (default) or "gemini".
 */
async function callOpenAI(jsonData, systemPrompt, userPrompt) {
  try {
    // New logic to handle nested placeholders like {json_input.googleSearchResults}
    let userPromptWithData = userPrompt;
    
    // Replace simple {json_input} placeholder
    if (userPromptWithData.includes("{json_input}")) {
      userPromptWithData = userPromptWithData.replace("{json_input}", JSON.stringify(jsonData, null, 2));
    }
    
    // Replace nested placeholders like {json_input.googleSearchResults}
    const nestedPlaceholderRegex = /\{json_input\.([^}]+)\}/g;
    const matches = userPromptWithData.match(nestedPlaceholderRegex);
    
    if (matches) {
      matches.forEach(match => {
        const propertyPath = match.slice(12, -1); // Extract property path without {json_input. and }
        if (jsonData && jsonData[propertyPath] !== undefined) {
          userPromptWithData = userPromptWithData.replace(match, jsonData[propertyPath]);
        } else {
          log(`Property ${propertyPath} not found in jsonData`, 'warn');
        }
      });
    }

    const provider = USE_LLM_MODEL === 'gemini' ? 'gemini' : 'openai';

    if (provider === 'gemini') {
      return await callGemini(jsonData, systemPrompt, userPromptWithData);
    }

    if (!callOpenAI.rateLimiter) {
      callOpenAI.rateLimiter = new RateLimiter(
        parseInt(process.env.OPENAI_REQUESTS_PER_MINUTE || 30),
        'OpenAI'
      );
    }
    
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      log("OpenAI API key not found in environment variables", 'error');
      return null;
    }
    
    // Acquire a token from the rate limiter before making the request
    await callOpenAI.rateLimiter.acquire();
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPromptWithData }
        ],
        temperature: 0,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
      }
    );
    
    // Record successful request
    callOpenAI.rateLimiter.recordSuccess();
    
    const aiResponse = response.data.choices[0].message.content;
    return aiResponse;
  } catch (error) {
    // Check if this is a rate limit error
    if (error.response && (error.response.status === 429 || 
        error.response.status === 500 || 
        (error.response.data && error.response.data.error && 
         error.response.data.error.type === 'rate_limit_exceeded'))) {
      log(`OpenAI API error / rate limit: ${error.message}`, 'error');

      if (!callOpenAI.rateLimiter) {
        callOpenAI.rateLimiter = new RateLimiter(
          parseInt(process.env.OPENAI_REQUESTS_PER_MINUTE || 30),
          'OpenAI'
        );
      }

      callOpenAI.rateLimiter.recordError();
      
      // Wait with exponential backoff before retrying
      const backoffMs = Math.min(1000 * Math.pow(2, callOpenAI.rateLimiter.consecutiveErrors), 60000);
      log(`Backing off OpenAI API for ${Math.round(backoffMs/1000)}s before retry`, 'warn');
      
      await new Promise(resolve => setTimeout(resolve, backoffMs));
      
      // Retry the request
      return callOpenAI(jsonData, systemPrompt, userPrompt);
    }
    
    log(`OpenAI API error: ${error.message}`, 'error');
    return null;
  }
}

/**
 * Extract URL from OpenAI response
 */
function extractUrlFromResponse(response) {
  if (!response) return "";
  
  if (response.trim().startsWith('http') && !response.includes('\n')) {
    return response.trim();
  }
  
  const urlRegex = /(https?:\/\/[^\s"]+)/;
  const match = response.match(urlRegex);
  
  if (match && match[1]) {
    return match[1].replace(/["`]/g, '');
  }
  
  return "";
}

module.exports = {
  log,
  RateLimiter,
  GoogleCustomSearch,
  extractEssentialData,
  callGemini,
  callOpenAI,
  extractUrlFromResponse
}; 