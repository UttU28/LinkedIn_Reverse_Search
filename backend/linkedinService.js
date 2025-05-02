const { log, GoogleCustomSearch, extractEssentialData, callOpenAI, extractUrlFromResponse, handleError } = require('./utils');
const { SINGLE_BULK_SYSTEM_PROMPT, SINGLE_BULK_USER_PROMPT } = require('./prompts');
const dbService = require('./dbService');

/**
 * Find a single LinkedIn contact with proper credit tracking
 * @param {string} fullName - Full name to search for
 * @param {string} company - Company name
 * @param {string} position - Position title
 * @param {string} userID - User ID for database operations (optional)
 * @param {string} historyId - History ID for existing search operations (optional)
 */
async function findSingleLinkedinContact(fullName, company, position, userID = null, historyId = null) {
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
    
    // Create history entry if userID is provided but historyId is not
    if (userID && !historyId) {
      historyId = await dbService.addSearchHistory(userID, {
        type: "single",
        status: "processing",
        inputMeta: {
          name: fullName,
          company: company,
          position: position
        },
        totalRecords: 0,
        resultRefPath: "searchResults",
        startedAt: new Date()
      });
      
      log(`Created search history: ${historyId}`, 'debug');
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
      
      // Update search history if we have userID and historyId
      if (userID && historyId) {
        await dbService.updateSearchHistory(userID, historyId, {
          status: "failed",
          errorMessage: "No search results found",
          completedAt: new Date()
        });
      }
      
      return {
        success: false,
        linkedInUrl: "",
        message: "No search results found",
        historyId
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
    
    if (!aiResponse) {
      log(`No response from OpenAI for ${fullName}`, 'warn');
      
      // Update search history if we have userID and historyId
      if (userID && historyId) {
        await dbService.updateSearchHistory(userID, historyId, {
          status: "failed",
          errorMessage: "Failed to process search results",
          completedAt: new Date()
        });
      }
      
      return {
        success: false,
        linkedInUrl: "",
        message: "Failed to process search results",
        historyId
      };
    }
    
    const linkedInUrl = extractUrlFromResponse(aiResponse);
    
    // If we have a user ID, save this search result
    if (userID && historyId) {
      // Add search result to database
      const resultId = await dbService.addSearchResult(
        userID,
        historyId,
        "single",
        {
          name: fullName || "",
          company: company || "",
          position: position || ""
        },
        linkedInUrl || null
      );
      
      // Update search history with LinkedIn URL included directly for easier access
      await dbService.updateSearchHistory(userID, historyId, {
        status: "completed",
        totalRecords: linkedInUrl ? 1 : 0,
        resultsCount: linkedInUrl ? 1 : 0,
        resultIds: resultId ? [resultId] : [],
        linkedinUrl: linkedInUrl || null, // Add the LinkedIn URL directly to search history
        completedAt: new Date()
      });
      
      // Only charge if a LinkedIn profile was found
      if (linkedInUrl) {
        await dbService.updateSearchCost(userID, historyId, "single", 1);
      }
    }
    
    return {
      success: !!linkedInUrl,
      linkedInUrl: linkedInUrl || "",
      message: linkedInUrl ? "LinkedIn profile found" : "No LinkedIn profile found",
      historyId
    };
  } catch (error) {
    log(`Error finding LinkedIn contact: ${error.message}`, 'error');
    
    // Update search history if we have userID and historyId
    if (userID && historyId) {
      await dbService.updateSearchHistory(userID, historyId, {
        status: "error",
        errorMessage: error.message,
        completedAt: new Date()
      });
    }
    
    return {
      success: false,
      linkedInUrl: "",
      message: `Error finding LinkedIn profile: ${error.message}`,
      historyId: historyId || null
    };
  }
}

/**
 * Process a batch of contacts in the background
 * @param {Array} contacts - Array of contact objects with search details
 * @param {string} userID - User ID for database operations
 * @param {string} historyId - History ID to update
 */
async function processBatchInBackground(contacts, userID, historyId) {
  try {
    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      log("No contacts provided for batch processing", 'warn');
      
      await dbService.updateBatchStatus({
        userID,
        historyId,
        status: 'failed',
        progress: {
          total: 0,
          processed: 0,
          successful: 0
        },
        error: "No contacts provided for batch processing"
      });
      
      return;
    }
    
    log(`Starting batch processing for ${contacts.length} contacts`, 'info');
    
    // Initialize counters
    let processedCount = 0;
    let successCount = 0;
    let humans = [];
    let results = [];
    
    // Update progress status
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
    
    // Process each contact
    for (const contact of contacts) {
      const { searchName, searchCompany, searchPosition, contactId } = contact;
      
      try {
        // Search for LinkedIn profile using the core function - don't pass userID & historyId
        // to avoid creating individual histories for each search
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
      } catch (contactError) {
        log(`Error processing contact ${searchName}: ${contactError.message}`, 'error');
        
        // Add to results array with error
        results.push({
          contactId,
          searchName,
          searchCompany,
          searchPosition,
          linkedinProfileUrl: "",
          foundData: 0,
          error: contactError.message
        });
        
        // Increment processed counter but not success counter
        processedCount++;
      }
    }
    
    // Final update
    await dbService.updateBatchStatus({
      userID,
      historyId,
      status: 'completed',
      progress: {
        total: contacts.length,
        processed: processedCount,
        successful: successCount
      },
      resultIds: humans
    });
    
    // Apply credit cost based on successful results found
    // For bulk search, only charge if successful results were found
    if (successCount > 0) {
      await dbService.updateSearchCost(userID, historyId, "bulk", successCount);
    }
    
    log(`Batch processing completed: ${processedCount}/${contacts.length} processed, ${successCount} successful`, 'info');
    
    // Return in case this is used as a synchronous function in the future
    return {
      processed: processedCount,
      successful: successCount,
      results,
      resultIds: humans
    };
  } catch (error) {
    log(`Batch processing error: ${error.message}`, 'error');
    
    // Update with error status
    await dbService.updateBatchStatus({
      userID,
      historyId,
      status: 'failed',
      progress: null,
      error: error.message,
      resultIds: humans || [] // Include any resultIds that were collected before error
    });
    
    // Even on full batch error, charge for any successful searches that were completed
    const successCount = (results || []).filter(r => r.foundData === 1).length;
    if (successCount > 0) {
      await dbService.updateSearchCost(userID, historyId, "bulk", successCount);
    }
    
    // Return error info in case this is used as a synchronous function
    return {
      error: error.message,
      processed: processedCount || 0,
      successful: successCount || 0
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
      log(`Batch processing complete: ${finalResult.successful}/${finalResult.processed} profiles found`);
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