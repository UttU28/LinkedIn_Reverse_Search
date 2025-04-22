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
      const response = await axios.get(this.baseUrl, {
        params: {
          key: this.apiKey,
          cx: this.searchEngineId,
          q: query,
          num: num
        }
      });
      
      if (!response.data.items || response.data.items.length === 0) {
        printStatus("No search results found", chalk.yellow);
      } else {
        printStatus(`Found ${response.data.items.length} results`, chalk.green);
      }
      
      return response.data.items || [];
    } catch (error) {
      printStatus(`Search error: ${error.message}`, chalk.red);
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
    
    printStatus("Calling OpenAI...", chalk.cyan);
    
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
    return null;
  }
}

function extractUrlFromResponse(response) {
  if (!response) return "";
  
  // First, try to see if the response is already a clean URL
  if (response.trim().startsWith('http') && !response.includes('\n')) {
    return response.trim();
  }
  
  // Try to extract a URL using regex
  const urlRegex = /(https?:\/\/[^\s"]+)/;
  const match = response.match(urlRegex);
  
  if (match && match[1]) {
    return match[1].replace(/["`]/g, ''); // Remove any quotes or backticks
  }
  
  return "";
}

async function processProfile(profileData, searchClient) {
  try {
    printStatus(`Processing: ${profileData.fullName} (${profileData.company})`, chalk.cyan);
    
    const searchStrategies = [
      `site:linkedin.com/in ${profileData.fullName}, ${profileData.company}, ${profileData.position}`,
      `site:linkedin.com/in ${profileData.fullName}, ${profileData.company}`
    ];
    
    let results = [];
    
    // Try search strategies until we find results
    for (const strategy of searchStrategies) {
      results = await searchClient.search(strategy, 10);
      
      if (results && results.length > 0) {
        break;
      }
    }
    
    if (!results || results.length === 0) {
      printStatus(`No results found for ${profileData.fullName}`, chalk.yellow);
      return {
        profile: profileData,
        linkedInUrl: "",
        success: false
      };
    }
    
    const essentialData = extractEssentialData(results);
    
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
      // Extract URL using our helper function
      const extractedUrl = extractUrlFromResponse(aiResponse);
      
      if (extractedUrl === "") {
        printStatus(`No matching LinkedIn profile found for ${profileData.fullName}`, chalk.yellow);
        return {
          profile: profileData,
          linkedInUrl: "",
          success: false
        };
      } else {
        printStatus(`Found LinkedIn URL: ${extractedUrl}`, chalk.green);
        return {
          profile: profileData,
          linkedInUrl: extractedUrl,
          success: true
        };
      }
    }
    
    return {
      profile: profileData,
      linkedInUrl: "",
      success: false
    };
  } catch (error) {
    printStatus(`Error: ${error.message}`, chalk.red);
    return {
      profile: profileData,
      linkedInUrl: "",
      success: false,
      error: error.message
    };
  }
}

async function processBatchOfProfiles(profiles) {
  try {
    const API_KEY = process.env.GOOGLE_API_KEY;
    const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    if (!API_KEY || !SEARCH_ENGINE_ID) {
      printStatus("Error: Missing API credentials in environment variables", chalk.red);
      return [];
    }
    
    const searchClient = new GoogleCustomSearch(API_KEY, SEARCH_ENGINE_ID);
    const results = [];
    let successCount = 0;
    
    printStatus(`Starting batch processing of ${profiles.length} profiles`, chalk.cyan);
    
    // Process one profile at a time
    for (let i = 0; i < profiles.length; i++) {
      printStatus(`Profile ${i+1}/${profiles.length}`, chalk.cyan);
      
      const result = await processProfile(profiles[i], searchClient);
      results.push(result);
      
      if (result.success) {
        successCount++;
      }
      
      // Add a small delay between profiles to avoid hitting rate limits
      if (i < profiles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    printStatus(`Completed: Found ${successCount} LinkedIn URLs out of ${profiles.length} profiles`, chalk.green);
    
    return results;
  } catch (error) {
    printStatus(`Error in batch processing: ${error.message}`, chalk.red);
    return [];
  }
}

// Example usage for a single profile
async function searchLinkedinProfile() {
  const profileData = {
    fullName: "Utsav Chaudhary",
    company: "Binghamton University",
    position: "Software Engineer"
  };
  
  const API_KEY = process.env.GOOGLE_API_KEY;
  const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
  
  if (!API_KEY || !SEARCH_ENGINE_ID) {
    printStatus("Error: Missing API credentials in environment variables", chalk.red);
    return;
  }
  
  const searchClient = new GoogleCustomSearch(API_KEY, SEARCH_ENGINE_ID);
  const result = await processProfile(profileData, searchClient);
  
  printStatus("Result:", chalk.green);
  console.log(JSON.stringify(result, null, 2));
}

// Example for processing multiple profiles
async function searchMultipleProfiles() {
  // Sample batch of profiles
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
  
  // Process the profiles
  const results = await processBatchOfProfiles(profiles);
  
  printStatus("Results:", chalk.green);
  console.log(JSON.stringify(results, null, 2));
  
  printStatus("\nRecommendation for Processing 100 Profiles:", chalk.green);
  printStatus("1. Process profiles one by one rather than batching all Google searches first", chalk.white);
  printStatus("2. Add delay between API calls to avoid rate limits", chalk.white);
  printStatus("3. Implement proper error handling and retries", chalk.white);
  printStatus("4. Consider saving results to disk after each profile", chalk.white);
}

// Choose which function to run:
// For a single profile example:
// searchLinkedinProfile();

// For multiple profiles with recommendations:
searchMultipleProfiles(); 