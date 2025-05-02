const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

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
        log(`Google Search API rate limit exceeded: ${error.message}`, 'error');
        this.rateLimiter.recordError();
        
        // Wait with exponential backoff before retrying
        await new Promise(resolve => setTimeout(
          resolve, 
          Math.min(1000 * Math.pow(2, this.rateLimiter.consecutiveErrors), 60000)
        ));
        
        // Retry the request
        return this.search(query, num);
      }
      
      log(`Google Search error: ${error.message}`, 'error');
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
      log("OpenAI API key not found in environment variables", 'error');
      return null;
    }
    
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
      log(`Found nested placeholders: ${matches.join(', ')}`, 'debug');
      matches.forEach(match => {
        const propertyPath = match.slice(12, -1); // Extract property path without {json_input. and }
        log(`Replacing placeholder ${match} with property ${propertyPath}`, 'debug');
        if (jsonData && jsonData[propertyPath] !== undefined) {
          userPromptWithData = userPromptWithData.replace(match, jsonData[propertyPath]);
          log(`Placeholder replaced successfully`, 'debug');
        } else {
          log(`Property ${propertyPath} not found in jsonData`, 'warn');
        }
      });
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
      log(`OpenAI API rate limit exceeded: ${error.message}`, 'error');
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

/**
 * Extract JSON from a string response with multiple fallback strategies
 * @param {string} response - The string containing potential JSON
 * @returns {object|array|null} - Parsed JSON object/array or null if parsing fails
 */
function extractJsonFromResponse(response) {
  if (!response) return null;
  
  try {
    // First attempt: Try to parse the entire response as JSON
    return JSON.parse(response);
  } catch (error) {
    // Second attempt: Look for JSON within code blocks
    try {
      const jsonPattern = /```(?:json)?\s*([\s\S]*?)\s*```/;
      const match = response.match(jsonPattern);
      
      if (match && match[1]) {
        return JSON.parse(match[1]);
      }
    } catch (nestedError) {
      log(`Failed to parse JSON in code blocks: ${nestedError.message}`, 'debug');
      // Continue to next attempt
    }
    
    // Third attempt: Look for array/object patterns
    try {
      const arrayPattern = /(\[[\s\S]*?\])/;
      const objectPattern = /(\{[\s\S]*?\})/;
      
      const arrayMatch = response.match(arrayPattern);
      const objectMatch = response.match(objectPattern);
      
      if (arrayMatch && arrayMatch[1]) {
        return JSON.parse(arrayMatch[1]);
      } else if (objectMatch && objectMatch[1]) {
        return JSON.parse(objectMatch[1]);
      }
    } catch (nestedError) {
      log(`Failed to parse JSON with pattern matching: ${nestedError.message}`, 'debug');
    }
    
    log(`All JSON parsing attempts failed for response: ${response.substring(0, 100)}...`, 'warn');
    return null;
  }
}

/**
 * Standard error handler function to centralize error handling
 * @param {string} context - Context where the error occurred (function/service name)
 * @param {Error} error - The error object
 * @param {string} defaultMessage - Default message if error doesn't have one
 * @param {string} level - Log level: 'error', 'warn', 'info', 'debug'
 * @returns {object} - Standardized error response object
 */
function handleError(context, error, defaultMessage = 'An unexpected error occurred', level = 'error') {
  const errorMessage = error.message || defaultMessage;
  log(`[${context}] ${errorMessage}`, level);
  
  return {
    success: false,
    message: errorMessage,
    error: errorMessage
  };
}

module.exports = {
  log,
  RateLimiter,
  GoogleCustomSearch,
  extractEssentialData,
  callOpenAI,
  extractUrlFromResponse,
  extractJsonFromResponse,
  handleError
}; 