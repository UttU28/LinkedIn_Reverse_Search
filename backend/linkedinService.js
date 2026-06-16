const { log, GoogleCustomSearch, extractEssentialData, callOpenAI, extractUrlFromResponse } = require('./utils');
const { SINGLE_BULK_SYSTEM_PROMPT, SINGLE_BULK_USER_PROMPT } = require('./prompts');
const dbService = require('./dbService');
const { getCompanyWebsiteForProfileSearch } = require('./companyWebsiteService');

const RATE_LIMIT_AFTER = 50;
const RATE_LIMIT_SLEEP_MS = 90000;

/**
 * Find a single LinkedIn contact with proper credit tracking
 * @param {string} fullName - Full name to search for
 * @param {string} company - Company name
 * @param {string} position - Position title
 * @param {string} userID - User ID for database operations (optional)
 * @param {string} historyId - History ID for existing search operations (optional)
 * @param {object} [options] - { includeCompanyLinks: boolean }
 */
async function findSingleLinkedinContact(fullName, company, position, userID = null, historyId = null, options = {}) {
  const includeCompanyLinks = !!options.includeCompanyLinks;
  try {
    log(`Searching for profile: ${fullName} at ${company}`);

    // Check contact cache first for faster fetching (no API/credits used)
    const cached = await dbService.getContactFromCache(fullName, company);
    if (cached && cached.linkedinUrl) {
      log(`Cache hit: ${fullName} at ${company}`, 'debug');
      let companyUrl = '';
      if (includeCompanyLinks && company) {
        const siteResult = await getCompanyWebsiteForProfileSearch(company);
        companyUrl = siteResult.websiteUrl || '';
      }
      let resolvedHistoryId = null;
      if (userID) {
        const quiet = { quiet: true };
        resolvedHistoryId = historyId || await dbService.addSearchHistory(userID, {
          type: "single",
          status: "processing",
          inputMeta: { name: fullName, company: company, position: position, includeCompanyLinks },
          totalRecords: 0,
          resultRefPath: "searchResults",
          startedAt: new Date()
        }, quiet);
        const resultId = await dbService.addSearchResult(userID, resolvedHistoryId, "single",
          { name: fullName, company: company, position: position },
          cached.linkedinUrl,
          companyUrl || null
        );
        await dbService.updateSearchHistory(userID, resolvedHistoryId, {
          status: "completed",
          totalRecords: 1,
          resultsCount: 1,
          resultIds: resultId ? [resultId] : [],
          linkedinUrl: cached.linkedinUrl,
          completedAt: new Date()
        });
        const credits = 1 + (companyUrl ? 1 : 0);
        await dbService.updateSearchCost(userID, resolvedHistoryId, "single", credits, quiet);
      }
      return {
        success: true,
        linkedInUrl: cached.linkedinUrl,
        companyUrl: companyUrl || '',
        message: "LinkedIn profile found (cached)",
        historyId: resolvedHistoryId,
        fromCache: true
      };
    }

    const API_KEY = process.env.GOOGLE_API_KEY;
    const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!API_KEY || !SEARCH_ENGINE_ID) {
      log("Missing API credentials in environment variables", 'error');
      return {
        success: false,
        linkedInUrl: "",
        message: "API credentials not configured",
        fromCache: false
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
          position: position,
          includeCompanyLinks
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
        historyId,
        fromCache: false
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
      log(`No response from LLM for ${fullName}`, 'warn');
      
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
        historyId,
        fromCache: false
      };
    }

    const linkedInUrl = extractUrlFromResponse(aiResponse);

    // Store in contact cache for faster future lookups (only when we found a profile)
    if (linkedInUrl) {
      await dbService.addContactToCache(fullName, company, linkedInUrl);
    }

    let companyUrl = '';
    if (includeCompanyLinks && company && (userID || linkedInUrl)) {
      try {
        const siteResult = await getCompanyWebsiteForProfileSearch(company);
        companyUrl = siteResult.websiteUrl || '';
      } catch (err) {
        log(`Company website fetch failed for ${company}: ${err.message}`, 'warn');
      }
    }

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
        linkedInUrl || null,
        companyUrl || null
      );

      // Update search history with LinkedIn URL included directly for easier access
      await dbService.updateSearchHistory(userID, historyId, {
        status: "completed",
        totalRecords: linkedInUrl ? 1 : 0,
        resultsCount: linkedInUrl ? 1 : 0,
        resultIds: resultId ? [resultId] : [],
        linkedinUrl: linkedInUrl || null,
        completedAt: new Date()
      });

      // Charge: 1 for LinkedIn found, +1 for company URL when requested and found
      const credits = (linkedInUrl ? 1 : 0) + (companyUrl && includeCompanyLinks ? 1 : 0);
      if (credits > 0) {
        await dbService.updateSearchCost(userID, historyId, "single", credits);
      }
    }

    return {
      success: !!linkedInUrl,
      linkedInUrl: linkedInUrl || "",
      companyUrl: companyUrl || "",
      message: linkedInUrl ? "LinkedIn profile found" : "No LinkedIn profile found",
      historyId,
      fromCache: false
    };
  } catch (error) {
    log(`Error finding LinkedIn contact: ${error.message}`, 'error');
    
    // Update search history if we have userID and historyId
    if (arguments[3] && arguments[4]) { // userID and historyId would be the 4th and 5th arguments
      await dbService.updateSearchHistory(arguments[3], arguments[4], {
        status: "error",
        errorMessage: error.message,
        completedAt: new Date()
      });
    }
    
    return {
      success: false,
      linkedInUrl: "",
      message: `Error finding LinkedIn profile: ${error.message}`,
      historyId: arguments[4] || null,
      fromCache: false
    };
  }
}

/**
 * Process a batch of contacts in the background
 * @param {Array} contacts - Array of contact objects with search details
 * @param {string} userID - User ID for database operations
 * @param {string} historyId - History ID to update
 * @param {object} [options] - { includeCompanyLinks: boolean }
 */
async function processBatchInBackground(contacts, userID, historyId, options = {}) {
  const includeCompanyLinks = !!options.includeCompanyLinks;
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
    
    log(`Starting batch processing for ${contacts.length} contacts${includeCompanyLinks ? ' (with company links)' : ''}`, 'info');
    
    // Initialize counters
    let processedCount = 0;
    let successCount = 0;
    let companyFoundCount = 0;
    let fromCacheCount = 0;
    let humans = [];
    let results = [];

    let nonCachedSincePause = 0;
    let nonCachedSincePauseCompany = 0;

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
    
    for (const contact of contacts) {
      const { searchName, searchCompany, searchPosition, contactId } = contact;

      try {
        // Search for LinkedIn profile only (company URL fetched separately to keep rate-limit counters distinct)
        const result = await findSingleLinkedinContact(searchName, searchCompany, searchPosition, null, null, { includeCompanyLinks: false });

        let companyUrl = '';
        if (includeCompanyLinks && searchCompany) {
          try {
            const siteResult = await getCompanyWebsiteForProfileSearch(searchCompany);
            companyUrl = siteResult.websiteUrl || '';
            if (companyUrl) companyFoundCount++;
            if (!siteResult.fromCache) {
              nonCachedSincePauseCompany++;
            }
          } catch (err) {
            log(`Company website fetch failed for ${searchCompany}: ${err.message}`, 'warn');
          }
        }

        // Create result object
        const processedContact = {
          contactId,
          searchName,
          searchCompany,
          searchPosition,
          linkedinProfileUrl: result.linkedInUrl || "",
          companyUrl: companyUrl || "",
          foundData: result.success ? 1 : 0
        };

        results.push(processedContact);
        processedCount++;
        if (result.success) {
          successCount++;
          if (result.fromCache) fromCacheCount++;
        }

        if (!result.fromCache) {
          nonCachedSincePause++;
        }

        // Add search result to database (with company URL when requested)
        const resultId = await dbService.addSearchResult(
          userID, 
          historyId, 
          "bulk", 
          { 
            name: searchName || "", 
            company: searchCompany || "", 
            position: searchPosition || "" 
          }, 
          result.linkedInUrl || null,
          companyUrl || null
        );
        
        // Store the ID in humans array if it exists
        if (resultId) {
          humans.push(resultId);
        }
        
        // Log progress and update database only every 10 contacts or at end
        if (processedCount % 10 === 0 || processedCount === contacts.length) {
          log(`Progress: ${processedCount}/${contacts.length} contacts, found ${successCount} profiles${includeCompanyLinks ? `, ${companyFoundCount} company links` : ''}`, 'info');

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

        results.push({
          contactId,
          searchName,
          searchCompany,
          searchPosition,
          linkedinProfileUrl: "",
          companyUrl: "",
          foundData: 0,
          error: contactError.message
        });

        processedCount++;
      }

      // Rate limit: sleep after 50 non-cached LinkedIn lookups (cache hits not counted)
      if (nonCachedSincePause >= RATE_LIMIT_AFTER && processedCount < contacts.length) {
        log(`Pausing ${RATE_LIMIT_SLEEP_MS / 1000}s after ${nonCachedSincePause} non-cached LinkedIn lookups...`, 'info');
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_SLEEP_MS));
        nonCachedSincePause = 0;
      }
      // Rate limit: sleep after 50 non-cached company lookups (separate counter)
      if (nonCachedSincePauseCompany >= RATE_LIMIT_AFTER && processedCount < contacts.length) {
        log(`Pausing ${RATE_LIMIT_SLEEP_MS / 1000}s after ${nonCachedSincePauseCompany} non-cached company lookups...`, 'info');
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_SLEEP_MS));
        nonCachedSincePauseCompany = 0;
      }
    }
    
    // Final update with resultIds
    await dbService.updateBatchStatus({
      userID,
      historyId,
      status: 'completed',
      progress: {
        total: contacts.length,
        processed: processedCount,
        successful: successCount
      }
    });
    
    // Update search history with resultIds and ensure status is completed
    await dbService.updateSearchHistory(userID, historyId, {
      status: "completed",
      resultIds: humans,
      completedAt: new Date()
    });
    
    const totalCredits = successCount + (includeCompanyLinks ? companyFoundCount : 0);
    await dbService.updateSearchCost(userID, historyId, "bulk", totalCredits);

    const newlyCached = successCount - fromCacheCount;
    log(`Batch completed: ${processedCount} contacts, ${successCount} profiles found (${fromCacheCount} from cache, ${newlyCached} newly cached)`, 'info');
    
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
      error: error.message
    });
    
    const failedCredits = (successCount || 0) + (includeCompanyLinks ? (companyFoundCount || 0) : 0);
    await dbService.updateSearchCost(userID, historyId, "bulk", failedCredits);
    
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
 * @param {object} [options] - { includeCompanyLinks: boolean }
 */
function startBatchProcessing(contacts, userID, batchInfo, historyId, options = {}) {
  // Start the background processing without awaiting completion
  processBatchInBackground(contacts, userID, historyId, options)
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