const { log, GoogleCustomSearch, callOpenAI, extractJsonFromResponse, handleError } = require('./utils');
const { LINKEDIN_EXTRACTION_SYSTEM_PROMPT, LINKEDIN_EXTRACTION_USER_PROMPT } = require('./prompts');
const dbService = require('./dbService');
const axios = require('axios');

/**
 * Find professionals at a specific company
 * Core function to handle professional search
 */
async function findRecruitersAtCompany(companyName, userID, positionTitle = 'recruitment') {
  let historyId = null;
  
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
    historyId = await dbService.addSearchHistory(userID, {
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
        data: [],
        historyId
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
        data: [],
        historyId
      };
    }
    
    // Step 4: Save results to database and collect resultIds
    const resultIds = [];
    const matchedCompanyLeads = []; // Keep track of leads matching the exact company
    
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
          
          // Check if this lead matches the exact company name (case-insensitive)
          const leadCompany = (person.company || '').toLowerCase();
          const targetCompany = companyName.toLowerCase();
          if (leadCompany.includes(targetCompany) || targetCompany.includes(leadCompany)) {
            matchedCompanyLeads.push(resultId);
          }
        }
      }
    }
    
    // Step 5: Update history with completed status
    await dbService.updateSearchHistory(userID, historyId, {
      status: "completed",
      totalRecords: extractedData.length,
      resultsCount: resultIds.length,
      resultIds: resultIds,
      matchedCompanyCount: matchedCompanyLeads.length,
      completedAt: new Date()
    });
    
    // Step 6: Apply cost based on results found
    // For lead generator search, charge ONLY based on company-matching results
    if (matchedCompanyLeads.length > 0) {
      await dbService.updateSearchCost(userID, historyId, "recruiters", matchedCompanyLeads.length);
    }
    
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
    
    // Update history with error status
    if (historyId) {
      await dbService.updateSearchHistory(userID, historyId, {
        status: "error",
        errorMessage: error.message
      });
    }
    
    return {
      success: false,
      message: `Error finding professionals: ${error.message}`,
      error: error.message,
      data: [],
      historyId
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
    
    // Use centralized JSON extraction function
    const extractedData = extractJsonFromResponse(aiResponse);
    if (!extractedData) {
      throw new Error('Failed to parse data from OpenAI response');
    }
    
    return extractedData;
  } catch (error) {
    // Use centralized error handling
    log(`LinkedIn data extraction failed: ${error.message}`, 'error');
    
    // Check for specific API-related errors
    if (error.message.includes('rate limit') || error.message.includes('quota')) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }
    
    throw error;
  }
}

module.exports = {
  findRecruitersAtCompany
}; 