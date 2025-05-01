const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Standardized logging function
 * @param {string} message - Message to log
 */
function log(message) {
  console.log(message);
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
      log(`${this.name} rate limiter: Token acquired (${this.tokens.toFixed(2)} remaining)`);
      return;
    }
    
    // Calculate time until next token is available
    const timeToWait = this._calculateWaitTime();
    
    log(`${this.name} rate limiter: Rate limited. Waiting ${timeToWait}ms before retry.`);
    
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
    log(`${this.name} rate limiter: Recorded error #${this.consecutiveErrors}, increasing backoff`);
  }

  recordSuccess() {
    if (this.consecutiveErrors > 0) {
      this.consecutiveErrors = 0;
      log(`${this.name} rate limiter: Reset error count after successful request`);
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
      // Acquire a token from the rate limiter before making the request
      await this.rateLimiter.acquire();
      
      const response = await axios.get(this.baseUrl, {
        params: {
          key: this.apiKey,
          cx: this.searchEngineId,
          q: query,
          num: num
        }
      });
      
      // Record successful request
      this.rateLimiter.recordSuccess();
      return response.data.items || [];
    } catch (error) {
      // Check if this is a rate limit error (HTTP 429 or quota exceeded)
      if (error.response && (error.response.status === 429 || 
          (error.response.data && error.response.data.error && 
           error.response.data.error.message && 
           error.response.data.error.message.includes('quota')))) {
        log(`Google Search API rate limit exceeded: ${error.message}`);
        this.rateLimiter.recordError();
        
        // Wait with exponential backoff before retrying
        await new Promise(resolve => setTimeout(
          resolve, 
          Math.min(1000 * Math.pow(2, this.rateLimiter.consecutiveErrors), 60000)
        ));
        
        // Retry the request
        return this.search(query, num);
      }
      
      log(`Search error: ${error.message}`);
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
 * Call OpenAI API to analyze search results with rate limiting
 */
async function callOpenAI(jsonData, systemPrompt, userPrompt) {
  // Create a static rate limiter for OpenAI requests
  if (!callOpenAI.rateLimiter) {
    callOpenAI.rateLimiter = new RateLimiter(
      parseInt(process.env.OPENAI_REQUESTS_PER_MINUTE || 30),
      'OpenAI'
    );
  }
  
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      log("Error: OpenAI API key not found in environment variables");
      return null;
    }
    
    const userPromptWithData = userPrompt.replace("{json_input}", JSON.stringify(jsonData, null, 2));
    
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
      log(`OpenAI API rate limit exceeded: ${error.message}`);
      callOpenAI.rateLimiter.recordError();
      
      // Wait with exponential backoff before retrying
      const backoffMs = Math.min(1000 * Math.pow(2, callOpenAI.rateLimiter.consecutiveErrors), 60000);
      log(`Backing off OpenAI API for ${backoffMs}ms before retry`);
      
      await new Promise(resolve => setTimeout(resolve, backoffMs));
      
      // Retry the request
      return callOpenAI(jsonData, systemPrompt, userPrompt);
    }
    
    log(`Error calling OpenAI: ${error.message}`);
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
  callOpenAI,
  extractUrlFromResponse
}; 