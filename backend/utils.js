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
      const response = await axios.get(this.baseUrl, {
        params: {
          key: this.apiKey,
          cx: this.searchEngineId,
          q: query,
          num: num
        }
      });
      
      return response.data.items || [];
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
    
    const aiResponse = response.data.choices[0].message.content;
    return aiResponse;
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