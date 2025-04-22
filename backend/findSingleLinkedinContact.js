const axios = require('axios');
const dotenv = require('dotenv');
const { SYSTEM_PROMPT, USER_PROMPT } = require('./prompts');

dotenv.config();

const printStatus = (message) => {
  console.log(message);
};

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
      printStatus(`Search error: ${error.message}`);
      return [];
    }
  }
}

const extractEssentialData = (results) => {
  return results.map(item => ({
    title: item.title,
    link: item.link,
    snippet: item.snippet
  }));
};

async function callOpenAI(jsonData) {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      printStatus("Error: OpenAI API key not found in environment variables");
      return null;
    }
    
    const userPromptWithData = USER_PROMPT.replace("{json_input}", JSON.stringify(jsonData, null, 2));
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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
    printStatus(`Error calling OpenAI: ${error.message}`);
    return null;
  }
}

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

async function findSingleLinkedinContact(fullName, company, position) {
  try {
    printStatus(`Searching for LinkedIn profile: ${fullName} at ${company}`);
    
    const API_KEY = process.env.GOOGLE_API_KEY;
    const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    if (!API_KEY || !SEARCH_ENGINE_ID) {
      printStatus("Error: Missing API credentials in environment variables");
      return {
        success: false,
        linkedInUrl: "",
        message: "API credentials not configured"
      };
    }
    
    const searchClient = new GoogleCustomSearch(API_KEY, SEARCH_ENGINE_ID);
    
    const searchStrategies = [
      `site:linkedin.com/in ${fullName}, ${company}, ${position}`,
      `site:linkedin.com/in ${fullName}, ${company}`
    ];
    
    let results = [];
    
    for (const strategy of searchStrategies) {
      results = await searchClient.search(strategy, 10);
      
      if (results && results.length > 0) {
        break;
      }
    }
    
    if (!results || results.length === 0) {
      return {
        success: false,
        linkedInUrl: "",
        message: "No search results found"
      };
    }
    
    const essentialData = extractEssentialData(results);
    
    const jsonData = {
      metadata: {
        fullName: fullName,
        companyName: company
      },
      search_results: essentialData
    };
    
    const aiResponse = await callOpenAI(jsonData);
    
    if (aiResponse !== null) {
      const extractedUrl = extractUrlFromResponse(aiResponse);
      
      if (extractedUrl) {
        return {
          success: true,
          linkedInUrl: extractedUrl,
          message: "LinkedIn profile found"
        };
      } else {
        return {
          success: false,
          linkedInUrl: "",
          message: "No matching LinkedIn profile found"
        };
      }
    }
    
    return {
      success: false,
      linkedInUrl: "",
      message: "Failed to process search results"
    };
  } catch (error) {
    printStatus(`Error finding LinkedIn contact: ${error.message}`);
    return {
      success: false,
      linkedInUrl: "",
      message: `Error: ${error.message}`,
      error: error.message
    };
  }
}

module.exports = { findSingleLinkedinContact }; 