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
 * Rate limiter class to control API call frequency
 */
class RateLimiter {
  constructor(requestsPerMinute) {
    this.requestsPerMinute = requestsPerMinute;
    this.queue = [];
    this.processing = false;
    this.lastRequestTime = 0;
    this.minTimeBetweenRequests = (60 * 1000) / requestsPerMinute; // in milliseconds
  }

  async schedule(fn, ...args) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        fn,
        args,
        resolve,
        reject,
        retryCount: 0 // Initialize retry counter for each request
      });
      
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const now = Date.now();
    const timeToWait = Math.max(0, this.lastRequestTime + this.minTimeBetweenRequests - now);

    await new Promise(resolve => setTimeout(resolve, timeToWait));

    const request = this.queue.shift();
    const { fn, args, resolve, reject, retryCount } = request;
    this.lastRequestTime = Date.now();

    try {
      const result = await fn(...args);
      resolve(result);
    } catch (error) {
      // If rate limit error, add back to queue with exponential backoff
      if (error.response && (error.response.status === 429 || error.response.status === 403)) {
        // Increment retry count
        const newRetryCount = retryCount + 1;
        const maxRetries = 10; // Maximum number of retries
        
        if (newRetryCount <= maxRetries) {
          // Calculate exponential backoff with jitter
          const baseDelay = 2000; // 2 seconds base
          const exponentialPart = Math.pow(2, Math.min(newRetryCount - 1, 8)); // Cap at 2^8
          const maxDelay = baseDelay * exponentialPart;
          const jitter = 0.3; // 30% randomness
          const backoffTime = maxDelay * (1 - jitter + Math.random() * jitter);
          
          log(`Rate limit hit, retry #${newRetryCount}. Backing off for ${Math.round(backoffTime/1000)} seconds`);
          await new Promise(r => setTimeout(r, backoffTime));
          
          // Put the request back in the queue with increased retry count
          this.queue.unshift({
            fn,
            args,
            resolve,
            reject,
            retryCount: newRetryCount
          });
        } else {
          log(`Maximum retries (${maxRetries}) exceeded. Giving up.`);
          reject(error);
        }
      } else {
        reject(error);
      }
    }

    // Process next item in queue
    setTimeout(() => this.processQueue(), 0);
  }
}

// Create rate limiters for Google and OpenAI
// Google Custom Search has a limit of 100 queries per day (~ 0.07 per minute) for free tier
// Let's be conservative with 30 per minute as default, configurable via env vars
const googleRateLimiter = new RateLimiter(
  process.env.GOOGLE_REQUESTS_PER_MINUTE ? parseInt(process.env.GOOGLE_REQUESTS_PER_MINUTE) : 30
);

// OpenAI has different rate limits by tier, default to 20 RPM which is conservative
// for most tiers but configurable via env vars
const openaiRateLimiter = new RateLimiter(
  process.env.OPENAI_REQUESTS_PER_MINUTE ? parseInt(process.env.OPENAI_REQUESTS_PER_MINUTE) : 30
);

/**
 * Google Custom Search API wrapper
 */
class GoogleCustomSearch {
  constructor(apiKey, searchEngineId) {
    this.apiKey = apiKey;
    this.searchEngineId = searchEngineId;
    this.baseUrl = 'https://www.googleapis.com/customsearch/v1';
  }

  async search(query, num = 10) {
    try {
      // Use rate limiter for Google API calls
      return await googleRateLimiter.schedule(async () => {
        const response = await axios.get(this.baseUrl, {
          params: {
            key: this.apiKey,
            cx: this.searchEngineId,
            q: query,
            num: num
          }
        });
        
        return response.data.items || [];
      });
    } catch (error) {
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
 * Call OpenAI API to analyze search results
 */
async function callOpenAI(jsonData, systemPrompt, userPrompt) {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      log("Error: OpenAI API key not found in environment variables");
      return null;
    }
    
    const userPromptWithData = userPrompt.replace("{json_input}", JSON.stringify(jsonData, null, 2));
    
    // Use rate limiter for OpenAI API calls
    return await openaiRateLimiter.schedule(async () => {
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
      
      return response.data.choices[0].message.content;
    });
  } catch (error) {
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
  GoogleCustomSearch,
  extractEssentialData,
  callOpenAI,
  extractUrlFromResponse
}; 