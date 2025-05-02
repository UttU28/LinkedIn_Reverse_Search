const { log, GoogleCustomSearch, callOpenAI } = require('./utils');
const { LINKEDIN_EXTRACTION_SYSTEM_PROMPT, LINKEDIN_EXTRACTION_USER_PROMPT } = require('./prompts');
const dbService = require('./dbService');
const axios = require('axios');

/**
 * Find professionals at a specific company
 * Core function to handle professional search
 */
async function findRecruitersAtCompany(companyName, userID, positionTitle = 'recruitment') {
  try {
    // Determine the appropriate term based on position type
    let positionTerm;
    switch (positionTitle.toLowerCase()) {
      case 'investment':
        positionTerm = 'investment professionals';
        break;
      case 'c-level':
        positionTerm = 'executive leaders';
        break;
      case 'recruitment':
      default:
        positionTerm = 'recruiters';
        break;
    }
    
    log(`Searching for ${positionTerm} at: ${companyName}`);
    
    // API keys from environment variables
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    if (!GOOGLE_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
      log("Missing API credentials", 'error');
      return {
        success: false,
        message: "API credentials not configured",
        data: []
      };
    }
    
    // Create historyId first to track this search operation
    const historyId = await dbService.addSearchHistory(userID, {
      type: "recruiters",
      status: "processing",
      inputMeta: {
        company: companyName,
        position: positionTitle
      },
      totalRecords: 0, // Will update this once we have results
      resultRefPath: "searchResults",
      startedAt: new Date()
    });
    
    log(`Created search history: ${historyId}`, 'debug');
    
    // Step 1: Perform Google search for the specified position type
    const searchResults = await searchRecruiters(companyName, GOOGLE_API_KEY, GOOGLE_SEARCH_ENGINE_ID, positionTitle);
    
    if (!searchResults || !searchResults.items || searchResults.items.length === 0) {
      await dbService.updateSearchHistory(userID, historyId, {
        status: "failed",
        errorMessage: "No search results found"
      });
      
      return {
        success: false,
        message: `No search results found for ${positionTerm} at this company`,
        data: []
      };
    }
    
    // Step 2: Format search results for extraction
    const formattedResults = formatGoogleResultsForExtraction(searchResults);
    
    // Step 3: Extract LinkedIn data using OpenAI
    const extractedData = await extractLinkedInData(formattedResults);
    
    if (!extractedData || !Array.isArray(extractedData) || extractedData.length === 0) {
      await dbService.updateSearchHistory(userID, historyId, {
        status: "failed",
        errorMessage: "Failed to extract professional data"
      });
      
      return {
        success: false,
        message: `No ${positionTerm} found at this company`,
        data: []
      };
    }
    
    // Step 4: Save results to database and collect resultIds
    const resultIds = [];
    
    for (const person of extractedData) {
      // Store only if we have a name and either position or company
      if (person.fullName && (person.position || person.company)) {
        const searchData = {
          name: person.fullName,
          company: person.company || companyName,
          position: person.position || ""
        };
        
        const resultId = await dbService.addSearchResult(
          userID,
          historyId,
          "recruiters",
          searchData,
          person.linkedinUrl || null
        );
        
        if (resultId) {
          resultIds.push(resultId);
        }
      }
    }
    
    // Step 5: Update history with completed status
    await dbService.updateSearchHistory(userID, historyId, {
      status: "completed",
      totalRecords: extractedData.length,
      resultsCount: resultIds.length,
      resultIds: resultIds,
      completedAt: new Date()
    });
    
    log(`Found ${extractedData.length} ${positionTerm} at ${companyName}`);
    
    // Return formatted response
    return {
      success: true,
      message: `Found ${extractedData.length} ${positionTerm} at ${companyName}`,
      data: extractedData,
      historyId: historyId
    };
  } catch (error) {
    log(`Error finding professionals: ${error.message}`, 'error');
    
    // Update history with error status if we have a historyId
    if (arguments[2]) { // historyId would be the third argument if passed
      await dbService.updateSearchHistory(userID, arguments[2], {
        status: "error",
        errorMessage: error.message
      });
    }
    
    return {
      success: false,
      message: `Error finding professionals: ${error.message}`,
      error: error.message,
      data: []
    };
  }
}

/**
 * Search for professionals at a specific company on LinkedIn based on position type
 */
async function searchRecruiters(companyName, apiKey, cseId, positionType = 'recruitment') {
  if (!companyName || companyName.trim() === '') {
    throw new Error('Company name cannot be empty for search');
  }
  
  // Create a search query based on position type
  let query = '';
  
  switch (positionType.toLowerCase()) {
    case 'investment':
      // Search for investment professionals
      query = `site:linkedin.com/in/ -intitle:"profiles" -inurl:"dir/" ("Investment Manager" OR "Investment Director" OR "Investor" OR "Venture Capitalist" OR "Investment Associate" OR "Portfolio Manager" OR "Private Equity" OR "Investment Partner") AND ("${companyName}")`;
      break;
      
    case 'c-level':
      // Search for executive/C-level professionals
      query = `site:linkedin.com/in/ -intitle:"profiles" -inurl:"dir/" ("CEO" OR "CTO" OR "CFO" OR "COO" OR "Chief Executive" OR "Chief Technology" OR "Chief Financial" OR "Chief Operating" OR "President" OR "Executive Director" OR "Managing Director" OR "VP" OR "Vice President") AND ("${companyName}")`;
      break;
      
    case 'recruitment':
    default:
      // Default: search for recruitment professionals
      query = `site:linkedin.com/in/ -intitle:"profiles" -inurl:"dir/" ("Recruiter" OR "Talent Acquisition" OR "Hiring Manager" OR "HR Business Partner" OR "Recruitment Coordinator" OR "People Operations" OR "Technical Recruiter" OR "HR Manager") AND ("${companyName}")`;
      break;
  }
  
  log(`Search query: ${positionType} at ${companyName}`, 'debug');
  
  try {
    // Use the GoogleCustomSearch class which now includes rate limiting
    const searchClient = new GoogleCustomSearch(apiKey, cseId);
    const results = await searchClient.search(query, 10);
    
    // Structure results to match the expected format
    return {
      items: results
    };
  } catch (error) {
    throw new Error(`Failed to search for ${positionType} professionals at company "${companyName}": ${error.message}`);
  }
}

/**
 * Convert Google search results to a simple text format
 */
function formatGoogleResultsForExtraction(googleResults) {
  if (!googleResults.items || googleResults.items.length === 0) {
    return "No results found.";
  }
  
  let formattedText = "";
  googleResults.items.forEach((item, index) => {
    formattedText += `Result ${index + 1}:\n`;
    formattedText += `Title: ${item.title || 'N/A'}\n`;
    formattedText += `Link: ${item.link || 'N/A'}\n`;
    formattedText += `Snippet: ${item.snippet || 'N/A'}\n\n`;
  });
  
  return formattedText;
}

/**
 * Extract LinkedIn data from search results using OpenAI
 */
async function extractLinkedInData(searchResults) {
  try {
    log('Extracting LinkedIn data from search results', 'debug');
    
    // Create a simple JSON object for the callOpenAI function
    const jsonData = {
      googleSearchResults: searchResults
    };
    
    // Use the callOpenAI function from utils which includes rate limiting
    const aiResponse = await callOpenAI(
      jsonData,
      LINKEDIN_EXTRACTION_SYSTEM_PROMPT,
      LINKEDIN_EXTRACTION_USER_PROMPT
    );
    
    if (!aiResponse) {
      throw new Error('Failed to get response from OpenAI');
    }
    
    // Parse JSON from response
    try {
      return extractJsonFromResponse(aiResponse);
    } catch (parseError) {
      log(`JSON parsing error: ${parseError.message}`, 'error');
      throw new Error(`Failed to parse OpenAI response as JSON: ${parseError.message}`);
    }
  } catch (error) {
    log(`LinkedIn data extraction failed: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Extract JSON from a string response
 */
function extractJsonFromResponse(response) {
  try {
    // First attempt: Try to parse the entire response as JSON
    return JSON.parse(response);
  } catch (error) {
    // Second attempt: Look for JSON within code blocks
    try {
      const jsonPattern = /```(?:json)?\s*(\[[\s\S]*?\]|\{[\s\S]*?\})\s*```/;
      const match = response.match(jsonPattern);
      
      if (match && match[1]) {
        return JSON.parse(match[1]);
      }
    } catch (nestedError) {
      // Silent fail, continue to next attempt
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
      // Silent fail
    }
    
    // If all parsing attempts failed, throw an error
    throw new Error('Failed to parse JSON from response');
  }
}

module.exports = {
  findRecruitersAtCompany
}; 