const axios = require('axios');
const dotenv = require('dotenv');
const chalk = require('chalk');
const { SYSTEM_PROMPT, USER_PROMPT } = require('./prompts');

dotenv.config({ path: '.example.env' });

const printStatus = (message, color) => {
  console.log(color(message));
};

class GoogleCustomSearch {
  constructor(apiKey, searchEngineId) {
    this.apiKey = apiKey;
    this.searchEngineId = searchEngineId;
    this.baseUrl = 'https://www.googleapis.com/customsearch/v1';
  }

  async search(query, num = 10) {
    try {
      printStatus(`Making API request with query: ${query}`, chalk.blue);
      const response = await axios.get(this.baseUrl, {
        params: {
          key: this.apiKey,
          cx: this.searchEngineId,
          q: query,
          num: num
        }
      });
      
      printStatus(`Response status: ${response.status}`, chalk.blue);
      printStatus(`Total results: ${response.data.searchInformation?.totalResults || 'unknown'}`, chalk.blue);
      
      if (!response.data.items || response.data.items.length === 0) {
        printStatus("API returned successfully but found no matching items", chalk.yellow);
      } else {
        printStatus(`Found ${response.data.items.length} results`, chalk.green);
      }
      
      return response.data.items || [];
    } catch (error) {
      printStatus(`Search error: ${error.message}`, chalk.red);
      if (error.response) {
        printStatus(`Error status: ${error.response.status}`, chalk.red);
        printStatus(`Error data: ${JSON.stringify(error.response.data)}`, chalk.red);
      }
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
      printStatus("Error: OpenAI API key not found in environment variables", chalk.red);
      return null;
    }
    
    printStatus("\nCalling OpenAI to extract LinkedIn URL...", chalk.cyan);
    
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
    printStatus(`Error calling OpenAI: ${error.message}`, chalk.red);
    if (error.response) {
      printStatus(`OpenAI Error status: ${error.response.status}`, chalk.red);
      printStatus(`OpenAI Error data: ${JSON.stringify(error.response.data)}`, chalk.red);
    }
    return null;
  }
}

async function searchLinkedinProfile() {
  try {
    const API_KEY = process.env.GOOGLE_API_KEY;
    const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    if (!API_KEY || !SEARCH_ENGINE_ID) {
      printStatus("Error: Missing API credentials in environment variables", chalk.red);
      return;
    }
    
    const profileData = {
      fullName: "Utsav Chaudhary",
      company: "Binghamton University",
      position: "Software Engineer"
    };
    
    printStatus("\nSearching for LinkedIn profile...", chalk.cyan);
    printStatus(`Name: ${profileData.fullName}`, chalk.cyan);
    printStatus(`Company: ${profileData.company}`, chalk.cyan);
    printStatus(`Position: ${profileData.position}`, chalk.cyan);
    
    const searchClient = new GoogleCustomSearch(API_KEY, SEARCH_ENGINE_ID);
    
    const searchStrategies = [
      `site:linkedin.com/in ${profileData.fullName}, ${profileData.company}, ${profileData.position}`,
      `site:linkedin.com/in ${profileData.fullName}, ${profileData.company}`
    ];
    
    let results = [];
    
    for (const strategy of searchStrategies) {
      printStatus(`\nTrying search query: "${strategy}"`, chalk.yellow);
      
      results = await searchClient.search(strategy, 10);
      
      if (results && results.length > 0) {
        printStatus(`Success! Found ${results.length} results with query: "${strategy}"`, chalk.green);
        break;
      } else {
        printStatus(`No results found with this query method.`, chalk.yellow);
      }
    }
    
    if (!results || results.length === 0) {
      printStatus("\nFailed to find results with any search strategy.", chalk.red);
      return;
    }
    
    const essentialData = extractEssentialData(results);
    
    printStatus("\nSearch Results:", chalk.green);
    console.log(JSON.stringify(essentialData, null, 2));
    
    // Format data for OpenAI
    const jsonData = {
      metadata: {
        fullName: profileData.fullName,
        companyName: profileData.company
      },
      search_results: essentialData
    };
    
    // Call OpenAI to extract LinkedIn URL
    const aiResponse = await callOpenAI(jsonData);
    
    if (aiResponse !== null) {
      printStatus("\nOpenAI Response:", chalk.magenta);
      console.log(aiResponse);
      
      if (aiResponse.trim() === "") {
        printStatus("\nNo matching LinkedIn profile URL found.", chalk.yellow);
      } else {
        printStatus("\nExtracted LinkedIn URL:", chalk.green);
        console.log(aiResponse);
      }
    }
  } catch (error) {
    printStatus(`An error occurred: ${error.message}`, chalk.red);
    console.error(error);
  }
}

searchLinkedinProfile(); 