const { log, GoogleCustomSearch, extractEssentialData, callOpenAI, extractUrlFromResponse } = require('./utils');
const { SINGLE_BULK_SYSTEM_PROMPT, SINGLE_BULK_USER_PROMPT } = require('./prompts');
const dbService = require('./dbService');

/**
 * Find a single LinkedIn contact
 * Core function that handles the search logic for both single and batch operations
 */
async function findSingleLinkedinContact(fullName, company, position) {
  try {
    log(`Searching for profile: ${fullName} at ${company}`);
    
    const API_KEY = process.env.GOOGLE_API_KEY;
    const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    if (!API_KEY || !SEARCH_ENGINE_ID) {
      log("Missing API credentials in environment variables", 'error');
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
      log(`Trying search strategy: ${strategy}`, 'debug');
      results = await searchClient.search(strategy, 10);
      
      if (results && results.length > 0) {
        break;
      }
    }
    
    if (!results || results.length === 0) {
      log(`No results found for ${fullName}`, 'debug');
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
        log(`Found LinkedIn URL for ${fullName}: ${extractedUrl}`, 'debug');
        return {
          success: true,
          linkedInUrl: extractedUrl,
          message: "LinkedIn profile found"
        };
      } else {
        log(`No matching profile for ${fullName}`, 'debug');
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
    log(`Error finding LinkedIn contact: ${error.message}`, 'error');
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
    log(`Starting batch processing: ${contacts.length} contacts`);
    
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
      
      try {
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
        
        // Add search result to database
        const resultId = await dbService.addSearchResult(
          userID, 
          historyId, 
          "bulk", 
          { 
            name: searchName || "", 
            company: searchCompany || "", 
            title: searchPosition || "" 
          }, 
          result.linkedInUrl || null
        );
        
        // Store the ID in humans array if it exists
        if (resultId) {
          humans.push(resultId);
        }
        
        // Log progress and update database only every 10 contacts or at end
        if (processedCount % 10 === 0 || processedCount === contacts.length) {
          log(`Progress: ${processedCount}/${contacts.length} contacts, found ${successCount} profiles`, 'info');
          
          // Periodic database update
          await dbService.updateBatchStatus({
            userID,
            historyId,
            status: 'processing',
            progress: {
              total: contacts.length,
              processed: processedCount,
              successful: successCount
            }
          });
        }
      } catch (error) {
        // Handle individual contact errors without failing the entire batch
        log(`Error processing contact ${searchName}: ${error.message}`, 'error');
        
        // Add failed result to the results array
        results.push({
          contactId,
          searchName,
          searchCompany,
          searchPosition,
          linkedinProfileUrl: "",
          foundData: 0,
          error: error.message
        });
        
        processedCount++;
      }
    }
    
    // Final status update
    log(`Batch complete: ${successCount}/${contacts.length} LinkedIn profiles found`);
    
    // Final database update with stored humans array
    await dbService.updateSearchHistory(userID, historyId, {
      status: 'completed',
      resultsCount: successCount,
      resultIds: humans 
    });
    
    // Final batch status update
    await dbService.updateBatchStatus({
      userID,
      historyId,
      status: 'completed',
      progress: {
        total: contacts.length,
        processed: processedCount,
        successful: successCount
      },
      results,
      humans
    });
    
    return {
      success: true,
      totalContacts: contacts.length,
      foundProfiles: successCount,
      results,
      humans
    };
  } catch (error) {
    log(`Batch processing error: ${error.message}`, 'error');
    
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
      log(`Batch processing complete: ${finalResult.foundProfiles}/${finalResult.totalContacts} profiles found`);
    })
    .catch(error => {
      log(`Batch processing error: ${error.message}`, 'error');
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