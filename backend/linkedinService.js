const { log, GoogleCustomSearch, extractEssentialData, callOpenAI, extractUrlFromResponse } = require('./utils');
const { SINGLE_BULK_SYSTEM_PROMPT, SINGLE_BULK_USER_PROMPT } = require('./prompts');
const dbService = require('./dbService');

/**
 * Find a single LinkedIn contact
 * Core function that handles the search logic for both single and batch operations
 */
async function findSingleLinkedinContact(fullName, company, position) {
  try {
    log(`Searching for LinkedIn profile: ${fullName} at ${company}`);
    
    const API_KEY = process.env.GOOGLE_API_KEY;
    const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    if (!API_KEY || !SEARCH_ENGINE_ID) {
      log("Error: Missing API credentials in environment variables");
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
    
    const aiResponse = await callOpenAI(jsonData, SINGLE_BULK_SYSTEM_PROMPT, SINGLE_BULK_USER_PROMPT);
    
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
    log(`Error finding LinkedIn contact: ${error.message}`);
    return {
      success: false,
      linkedInUrl: "",
      message: `Error: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Process a batch of LinkedIn profile searches in the background
 * Stores contact IDs in 'humans' array and updates database only at end
 */
async function processBatchInBackground(contacts, userID, historyId) {
  try {
    log(`Starting background processing of batch with ${contacts.length} contacts`);
    
    // Update initial status
    await dbService.updateBatchStatus({
      userID,
      historyId,
      status: 'processing',
      progress: {
        total: contacts.length,
        processed: 0,
        successful: 0
      }
    });
    
    const results = [];
    const humans = []; // Array to store all result IDs
    let successCount = 0; // Number of LinkedIn profiles actually found
    let processedCount = 0; // Total number of contacts processed
    
    // Process each contact and collect results without updating DB each time
    for (const contact of contacts) {
      const { searchName, searchCompany, searchPosition, contactId } = contact;
      
      // Search for LinkedIn profile using the core function
      const result = await findSingleLinkedinContact(searchName, searchCompany, searchPosition);
      
      // Create result object
      const processedContact = {
        contactId,
        searchName,
        searchCompany,
        searchPosition,
        linkedinProfileUrl: result.linkedInUrl || "",
        foundData: result.success ? 1 : 0
      };
      
      // Add to results array
      results.push(processedContact);
      
      // Increment counters
      processedCount++;
      // Only increment successCount if a LinkedIn profile was actually found
      if (result.success) {
        successCount++;
      }
      
      // Store the search result in the searchResults collection 
      // and get the generated ID
      const resultId = await dbService.addSearchResult(
        userID, 
        historyId, 
        "bulk", 
        { searchName, searchCompany, searchPosition }, 
        result.linkedInUrl || null
      );
      
      // Store the ID in humans array if it exists
      if (resultId) {
        humans.push(resultId);
      }
      
      // Log progress but don't update database each time
      log(`Processed contact ${processedCount}/${contacts.length}, found LinkedIn profile: ${result.success ? "Yes" : "No"}`);
      
      // Add a small delay to avoid rate limiting
      if (processedCount < contacts.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Final status update
    log(`Completed batch processing. Found ${successCount}/${contacts.length} LinkedIn profiles`);
    log(`Stored ${humans.length} result IDs in 'humans' array`);
    
    // Final database update with stored humans array
    await dbService.updateSearchHistory(userID, historyId, {
      status: 'completed',
      resultsCount: successCount, // Number of LinkedIn profiles actually found
      resultIds: humans // Store the humans array in the database
    });
    
    // Final batch status update
    await dbService.updateBatchStatus({
      userID,
      historyId,
      status: 'completed',
      progress: {
        total: contacts.length,
        processed: processedCount,
        successful: successCount // Number of LinkedIn profiles actually found
      },
      results,
      humans // Include the humans array in final status
    });
    
    return {
      success: true,
      totalContacts: contacts.length,
      foundProfiles: successCount, // Number of LinkedIn profiles actually found
      results,
      humans // Return the humans array
    };
  } catch (error) {
    log(`Error processing batch: ${error.message}`);
    
    // Update error status in database
    await dbService.updateBatchStatus({
      userID,
      historyId,
      status: 'error',
      progress: {
        total: contacts.length,
        processed: 0,
        successful: 0
      },
      error: error.message
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Start batch processing in the background and return immediately
 */
function startBatchProcessing(contacts, userID, batchInfo, historyId) {
  // Start the background processing without awaiting completion
  processBatchInBackground(contacts, userID, historyId)
    .then(finalResult => {
      log(`BACKGROUND PROCESSING COMPLETE`);
      log(`Found ${finalResult.foundProfiles}/${finalResult.totalContacts} LinkedIn profiles`);
      log(`Stored ${finalResult.humans.length} result IDs in 'humans' array`);
    })
    .catch(error => {
      log(`BACKGROUND PROCESSING ERROR: ${error.message}`);
    });
  
  // Return immediately with initial status
  return {
    userID,
    fileName: batchInfo.fileName || 'Unknown',
    timestamp: batchInfo.timestamp || Date.now(),
    contactsCount: contacts.length,
    status: 'processing',
    message: `Started processing ${contacts.length} contacts in the background`
  };
}

module.exports = {
  findSingleLinkedinContact,
  processBatchInBackground,
  startBatchProcessing
}; 