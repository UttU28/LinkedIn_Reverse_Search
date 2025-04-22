const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { SYSTEM_PROMPT, USER_PROMPT } = require('./prompts');

dotenv.config();

const printStatus = (message) => {
  console.log(message);
};

const TEMP_STORAGE_DIR = path.join(__dirname, 'temp');
const getStorageFilePath = (batchId) => path.join(TEMP_STORAGE_DIR, `linkedin_results_${batchId}.json`);

const initLocalStorage = (batchId) => {
  if (!fs.existsSync(TEMP_STORAGE_DIR)) {
    fs.mkdirSync(TEMP_STORAGE_DIR, { recursive: true });
  }
  
  const storageFilePath = getStorageFilePath(batchId);
  fs.writeFileSync(storageFilePath, JSON.stringify([]));
  return storageFilePath;
};

const saveResultToStorage = (result, batchId) => {
  try {
    const storageFilePath = getStorageFilePath(batchId);
    const existingResults = JSON.parse(fs.readFileSync(storageFilePath, 'utf8'));
    existingResults.push(result);
    fs.writeFileSync(storageFilePath, JSON.stringify(existingResults));
  } catch (error) {
    printStatus(`Warning: Failed to save result to local storage: ${error.message}`);
  }
};

const getResultsFromStorage = (batchId) => {
  try {
    const storageFilePath = getStorageFilePath(batchId);
    return JSON.parse(fs.readFileSync(storageFilePath, 'utf8'));
  } catch (error) {
    printStatus(`Warning: Failed to read results from local storage: ${error.message}`);
    return [];
  }
};

const cleanupStorage = (batchId) => {
  try {
    const storageFilePath = getStorageFilePath(batchId);
    if (fs.existsSync(storageFilePath)) {
      fs.unlinkSync(storageFilePath);
    }
  } catch (error) {
    printStatus(`Warning: Failed to clean up local storage: ${error.message}`);
  }
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

async function processProfile(profileData, searchClient, batchId = null) {
  try {
    const searchStrategies = [
      `site:linkedin.com/in ${profileData.fullName}, ${profileData.company}, ${profileData.position}`,
      `site:linkedin.com/in ${profileData.fullName}, ${profileData.company}`
    ];
    
    let results = [];
    
    for (const strategy of searchStrategies) {
      results = await searchClient.search(strategy, 10);
      
      if (results && results.length > 0) {
        break;
      }
    }
    
    if (!results || results.length === 0) {
      const resultObj = {
        profile: profileData,
        linkedInUrl: "",
        success: false
      };
      
      if (batchId) {
        saveResultToStorage(resultObj, batchId);
      }
      
      return resultObj;
    }
    
    const essentialData = extractEssentialData(results);
    
    const jsonData = {
      metadata: {
        fullName: profileData.fullName,
        companyName: profileData.company
      },
      search_results: essentialData
    };
    
    const aiResponse = await callOpenAI(jsonData);
    
    if (aiResponse !== null) {
      const extractedUrl = extractUrlFromResponse(aiResponse);
      
      const resultObj = {
        profile: profileData,
        linkedInUrl: extractedUrl || "",
        success: !!extractedUrl
      };
      
      if (batchId) {
        saveResultToStorage(resultObj, batchId);
      }
      
      return resultObj;
    }
    
    const resultObj = {
      profile: profileData,
      linkedInUrl: "",
      success: false
    };
    
    if (batchId) {
      saveResultToStorage(resultObj, batchId);
    }
    
    return resultObj;
  } catch (error) {
    printStatus(`Error processing profile: ${error.message}`);
    
    const resultObj = {
      profile: profileData,
      linkedInUrl: "",
      success: false,
      error: error.message
    };
    
    if (batchId) {
      saveResultToStorage(resultObj, batchId);
    }
    
    return resultObj;
  }
}

async function processBatchOfProfiles(profiles) {
  try {
    const API_KEY = process.env.GOOGLE_API_KEY;
    const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    if (!API_KEY || !SEARCH_ENGINE_ID) {
      printStatus("Error: Missing API credentials in environment variables");
      return [];
    }
    
    const batchId = Date.now().toString();
    initLocalStorage(batchId);
    
    const searchClient = new GoogleCustomSearch(API_KEY, SEARCH_ENGINE_ID);
    const results = [];
    let successCount = 0;
    
    for (let i = 0; i < profiles.length; i++) {
      const existingResults = getResultsFromStorage(batchId);
      if (existingResults.length > i) {
        results.push(existingResults[i]);
        if (existingResults[i].success) {
          successCount++;
        }
        continue;
      }
      
      const result = await processProfile(profiles[i], searchClient, batchId);
      results.push(result);
      
      if (result.success) {
        successCount++;
      }
      
      if (i < profiles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    printStatus(`LinkedIn profiles found: ${successCount}/${profiles.length}`);
    cleanupStorage(batchId);
    
    return results;
  } catch (error) {
    printStatus(`Error in batch processing: ${error.message}`);
    return [];
  }
}

async function searchLinkedinProfile() {
  const profileData = {
    fullName: "Utsav Chaudhary",
    company: "Binghamton University",
    position: "Software Engineer"
  };
  
  const API_KEY = process.env.GOOGLE_API_KEY;
  const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
  
  if (!API_KEY || !SEARCH_ENGINE_ID) {
    printStatus("Error: Missing API credentials in environment variables");
    return;
  }
  
  const searchClient = new GoogleCustomSearch(API_KEY, SEARCH_ENGINE_ID);
  const result = await processProfile(profileData, searchClient);
  
  printStatus("\n===== LinkedIn Profile Search Result =====");
  console.log(JSON.stringify(result, null, 2));
}

async function searchMultipleProfiles() {
  const profiles = [
    {
      fullName: "Utsav Chaudhary",
      company: "Binghamton University",
      position: "Software Engineer"
    },
    {
      fullName: "Hemanth Sargadam",
      company: "Labs196",
      position: "Python Engineer"
    }
  ];
  
  printStatus("Searching LinkedIn profiles...");
  const results = await processBatchOfProfiles(profiles);
  
  printStatus("\n===== LinkedIn Profiles Search Results =====");
  console.log(JSON.stringify(results, null, 2));
}

// searchMultipleProfiles(); 
searchLinkedinProfile();