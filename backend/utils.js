const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// Which LLM provider to use: "local", "ollama" (default), "openai", or "gemini"
const USE_LLM_MODEL = (process.env.USE_LLM_MODEL || 'ollama').toLowerCase();

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
    const baseWait = Math.max(0, (1 - this.tokens) / this.refillRate);
    const jitter = Math.random();
    const backoffFactor = this.consecutiveErrors > 0
      ? Math.min(Math.pow(2, this.consecutiveErrors - 1), 16)
      : 1;
    let waitMs = Math.ceil(baseWait * backoffFactor * (1 + jitter * 0.5));
    // Enforce minimum 2s when we've had API errors (rate limit), so we actually slow down
    const MIN_WAIT_MS = 2000;
    if (this.consecutiveErrors > 0 && waitMs < MIN_WAIT_MS) {
      waitMs = MIN_WAIT_MS + Math.floor(Math.random() * 1000);
    }
    return waitMs;
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

/** Max retries for rate-limited LLM calls. 1 initial + 3 retries = 4 total attempts per contact. */
const LLM_MAX_RETRIES = parseInt(process.env.LLM_MAX_RETRIES || '3', 10);
/** Abort the full pipeline after this many consecutive LLM failures (no Google/company lookups once open). */
const LLM_CONSECUTIVE_FAIL_LIMIT = parseInt(process.env.LLM_CONSECUTIVE_FAIL_LIMIT || '5', 10);

class LlmUnavailableError extends Error {
  constructor(message) {
    super(message || `LLM unavailable after ${LLM_CONSECUTIVE_FAIL_LIMIT} consecutive failures`);
    this.name = 'LlmUnavailableError';
  }
}

const llmCircuitBreaker = {
  consecutiveFailures: 0,
  reset() {
    this.consecutiveFailures = 0;
  },
  isOpen() {
    return this.consecutiveFailures >= LLM_CONSECUTIVE_FAIL_LIMIT;
  },
  assertAvailable() {
    if (this.isOpen()) {
      throw new LlmUnavailableError();
    }
  },
  recordSuccess() {
    this.consecutiveFailures = 0;
  },
  recordFailure() {
    this.consecutiveFailures += 1;
    const open = this.isOpen();
    if (open) {
      log(
        `LLM circuit open after ${this.consecutiveFailures} consecutive failures — stopping pipeline`,
        'error'
      );
    }
    return open;
  }
};
/** Backoff delays in ms for each retry (2s, 4s, 8s). Override via LLM_RETRY_DELAYS_MS comma-separated. */
const LLM_RETRY_DELAYS_MS = (() => {
  const env = process.env.LLM_RETRY_DELAYS_MS;
  if (!env) return [2000, 4000, 8000];
  const parsed = env.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
  return parsed.length > 0 ? parsed : [2000, 4000, 8000];
})();

function isRateLimitOrTransientError(error) {
  if (error.response) {
    const status = error.response.status;
    if (status === 429 || status === 500 || status === 503 || status === 502) return true;
  }
  const msg = (error.message || '').toLowerCase();
  return /429|rate limit|resource exhausted|quota|too many requests/i.test(msg);
}

/**
 * Internal helper to call Google Gemini API (via Google Generative Language)
 * Respects the same interface as the OpenAI caller.
 * Retries up to LLM_MAX_RETRIES times on rate limit/transient errors with increasing backoff.
 */
async function callGemini(jsonData, systemPrompt, userPromptWithData, retryCount = 0) {
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

    // Check for rate-limit/error in 200 response body (Gemini may return error in body)
    const err = response.data && response.data.error;
    if (err) {
      const code = err.code;
      const statusStr = (err.status || '').toUpperCase();
      const msg = (err.message || '').toLowerCase();
      const isRateLimit = code === 429 ||
        statusStr === 'RESOURCE_EXHAUSTED' ||
        /resource exhausted|rate limit|quota|exhausted/i.test(msg);
      if (isRateLimit) {
        const e = new Error(err.message || 'Rate limit (from response body)');
        e.response = { status: 429, data: err };
        throw e;
      }
    }

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
    if (isRateLimitOrTransientError(error) && retryCount < LLM_MAX_RETRIES) {
      const delayMs = LLM_RETRY_DELAYS_MS[retryCount] ?? LLM_RETRY_DELAYS_MS[LLM_RETRY_DELAYS_MS.length - 1] ?? 2000;
      const delaySec = Math.round(delayMs / 1000);
      log(`Gemini API rate limit (retry ${retryCount + 1}/${LLM_MAX_RETRIES}). Sleeping ${delaySec}s before retry...`, 'warn');
      callGemini.rateLimiter.recordError();

      await new Promise((resolve) => setTimeout(resolve, delayMs));

      log(`Gemini retry ${retryCount + 1} after ${delaySec}s wait`, 'info');
      return callGemini(jsonData, systemPrompt, userPromptWithData, retryCount + 1);
    }

    if (isRateLimitOrTransientError(error)) {
      log(`Gemini API: exhausted ${LLM_MAX_RETRIES} retries after rate limit. Last error: ${error.message}`, 'error');
    } else {
      log(`Gemini API error: ${error.message}`, 'error');
    }
    return null;
  }
}

/**
 * Build the user prompt by substituting JSON placeholders.
 */
function buildUserPromptWithData(jsonData, userPrompt) {
  let userPromptWithData = userPrompt;

  if (userPromptWithData.includes("{json_input}")) {
    userPromptWithData = userPromptWithData.replace("{json_input}", JSON.stringify(jsonData, null, 2));
  }

  const nestedPlaceholderRegex = /\{json_input\.([^}]+)\}/g;
  const matches = userPromptWithData.match(nestedPlaceholderRegex);

  if (matches) {
    matches.forEach(match => {
      const propertyPath = match.slice(12, -1);
      if (jsonData && jsonData[propertyPath] !== undefined) {
        userPromptWithData = userPromptWithData.replace(match, jsonData[propertyPath]);
      } else {
        log(`Property ${propertyPath} not found in jsonData`, 'warn');
      }
    });
  }

  return userPromptWithData;
}

/**
 * Local OpenAI-compatible LLM (vLLM / Saral homelab at :8000/v1).
 */
async function callLocalLlm(jsonData, systemPrompt, userPromptWithData, retryCount = 0) {
  if (!callLocalLlm.rateLimiter) {
    callLocalLlm.rateLimiter = new RateLimiter(
      parseInt(process.env.LOCAL_LLM_REQUESTS_PER_MINUTE || process.env.OLLAMA_REQUESTS_PER_MINUTE || 30, 10),
      'Local LLM'
    );
  }

  const baseUrl = (process.env.LOCAL_LLM_BASE_URL || 'http://12.216.3.116:8000/v1').replace(/\/$/, '');
  const model = process.env.LOCAL_LLM_MODEL || '/root/.cache/huggingface/Gemma-4-31B-IT-NVFP4';
  const timeoutMs = parseInt(process.env.LOCAL_LLM_TIMEOUT_MS || process.env.OLLAMA_TIMEOUT_MS || '180000', 10);
  const apiKey = process.env.LOCAL_LLM_API_KEY || process.env.OPENAI_API_KEY || 'local';

  try {
    await callLocalLlm.rateLimiter.acquire();

    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPromptWithData }
        ],
        temperature: 0,
        max_tokens: 512
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        timeout: timeoutMs
      }
    );

    callLocalLlm.rateLimiter.recordSuccess();

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content || !content.trim()) {
      log('Local LLM response did not contain any content', 'warn');
      return null;
    }

    return content.trim();
  } catch (error) {
    const isRetryable = isRateLimitOrTransientError(error) ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT';

    if (isRetryable && retryCount < LLM_MAX_RETRIES) {
      const delayMs = LLM_RETRY_DELAYS_MS[retryCount] ?? LLM_RETRY_DELAYS_MS[LLM_RETRY_DELAYS_MS.length - 1] ?? 2000;
      const delaySec = Math.round(delayMs / 1000);
      log(`Local LLM unavailable (retry ${retryCount + 1}/${LLM_MAX_RETRIES}). Sleeping ${delaySec}s before retry...`, 'warn');
      callLocalLlm.rateLimiter.recordError();

      await new Promise((resolve) => setTimeout(resolve, delayMs));

      log(`Local LLM retry ${retryCount + 1} after ${delaySec}s wait`, 'info');
      return callLocalLlm(jsonData, systemPrompt, userPromptWithData, retryCount + 1);
    }

    if (error.response && error.response.data) {
      const body = JSON.stringify(error.response.data);
      log(`Local LLM API error: ${error.message} - ${body.slice(0, 500)}`, 'error');
    } else {
      log(`Local LLM API error: ${error.message}`, 'error');
    }
    return null;
  }
}

/**
 * Internal helper to call a local Ollama instance.
 */
async function callOllama(jsonData, systemPrompt, userPromptWithData, retryCount = 0) {
  if (!callOllama.rateLimiter) {
    callOllama.rateLimiter = new RateLimiter(
      parseInt(process.env.OLLAMA_REQUESTS_PER_MINUTE || 60, 10),
      'Ollama'
    );
  }

  const baseUrl = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
  const model = process.env.OLLAMA_MODEL || 'qwen2.5:7b';
  const timeoutMs = parseInt(process.env.OLLAMA_TIMEOUT_MS || '120000', 10);

  try {
    await callOllama.rateLimiter.acquire();

    const response = await axios.post(
      `${baseUrl}/api/chat`,
      {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPromptWithData }
        ],
        stream: false,
        options: {
          temperature: 0
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: timeoutMs
      }
    );

    callOllama.rateLimiter.recordSuccess();

    const content = response.data && response.data.message && response.data.message.content;
    if (!content || !content.trim()) {
      log('Ollama response did not contain any content', 'warn');
      return null;
    }

    return content.trim();
  } catch (error) {
    const isRetryable = isRateLimitOrTransientError(error) ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT';

    if (isRetryable && retryCount < LLM_MAX_RETRIES) {
      const delayMs = LLM_RETRY_DELAYS_MS[retryCount] ?? LLM_RETRY_DELAYS_MS[LLM_RETRY_DELAYS_MS.length - 1] ?? 2000;
      const delaySec = Math.round(delayMs / 1000);
      log(`Ollama unavailable (retry ${retryCount + 1}/${LLM_MAX_RETRIES}). Sleeping ${delaySec}s before retry...`, 'warn');
      callOllama.rateLimiter.recordError();

      await new Promise((resolve) => setTimeout(resolve, delayMs));

      log(`Ollama retry ${retryCount + 1} after ${delaySec}s wait`, 'info');
      return callOllama(jsonData, systemPrompt, userPromptWithData, retryCount + 1);
    }

    if (error.response && error.response.data) {
      const body = JSON.stringify(error.response.data);
      log(`Ollama API error: ${error.message} - ${body.slice(0, 500)}`, 'error');
    } else {
      log(`Ollama API error: ${error.message}`, 'error');
    }
    return null;
  }
}

/**
 * OpenAI chat-completions provider (internal; retries handled here).
 */
async function callOpenAIProvider(jsonData, systemPrompt, userPromptWithData, retryCount = 0) {
  try {
    if (!callOpenAIProvider.rateLimiter) {
      callOpenAIProvider.rateLimiter = new RateLimiter(
        parseInt(process.env.OPENAI_REQUESTS_PER_MINUTE || 30),
        'OpenAI'
      );
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      log("OpenAI API key not found in environment variables", 'error');
      return null;
    }

    await callOpenAIProvider.rateLimiter.acquire();

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

    callOpenAIProvider.rateLimiter.recordSuccess();
    return response.data.choices[0].message.content;
  } catch (error) {
    const isRetryable = error.response && (
      error.response.status === 429 ||
      error.response.status === 500 ||
      error.response.status === 503 ||
      error.response.status === 502 ||
      (error.response.data && error.response.data.error &&
       error.response.data.error.type === 'rate_limit_exceeded')
    );

    if (isRetryable && retryCount < LLM_MAX_RETRIES) {
      const delayMs = LLM_RETRY_DELAYS_MS[retryCount] ?? LLM_RETRY_DELAYS_MS[LLM_RETRY_DELAYS_MS.length - 1] ?? 2000;
      const delaySec = Math.round(delayMs / 1000);
      log(`OpenAI API rate limit (retry ${retryCount + 1}/${LLM_MAX_RETRIES}). Sleeping ${delaySec}s before retry...`, 'warn');
      callOpenAIProvider.rateLimiter.recordError();

      await new Promise((resolve) => setTimeout(resolve, delayMs));

      log(`OpenAI retry ${retryCount + 1} after ${delaySec}s wait`, 'info');
      return callOpenAIProvider(jsonData, systemPrompt, userPromptWithData, retryCount + 1);
    }

    if (isRetryable) {
      log(`OpenAI API: exhausted ${LLM_MAX_RETRIES} retries after rate limit. Last error: ${error.message}`, 'error');
    } else {
      log(`OpenAI API error: ${error.message}`, 'error');
    }
    return null;
  }
}

/**
 * Call LLM (local, Ollama, OpenAI, or Gemini) to analyze search results with rate limiting.
 * The provider is selected via USE_LLM_MODEL env: "local", "ollama" (default), "openai", or "gemini".
 * Retries up to LLM_MAX_RETRIES times on rate limit/transient errors.
 * After LLM_CONSECUTIVE_FAIL_LIMIT consecutive null responses, throws LlmUnavailableError.
 */
async function callOpenAI(jsonData, systemPrompt, userPrompt) {
  llmCircuitBreaker.assertAvailable();

  const userPromptWithData = buildUserPromptWithData(jsonData, userPrompt);
  let result = null;

  if (USE_LLM_MODEL === 'gemini') {
    result = await callGemini(jsonData, systemPrompt, userPromptWithData);
  } else if (USE_LLM_MODEL === 'local') {
    result = await callLocalLlm(jsonData, systemPrompt, userPromptWithData);
  } else if (USE_LLM_MODEL === 'ollama') {
    result = await callOllama(jsonData, systemPrompt, userPromptWithData);
  } else {
    result = await callOpenAIProvider(jsonData, systemPrompt, userPromptWithData);
  }

  if (!result) {
    if (llmCircuitBreaker.recordFailure()) {
      throw new LlmUnavailableError();
    }
    return null;
  }

  llmCircuitBreaker.recordSuccess();
  return result;
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
  callOllama,
  callOpenAI,
  extractUrlFromResponse,
  LlmUnavailableError,
  llmCircuitBreaker
}; 