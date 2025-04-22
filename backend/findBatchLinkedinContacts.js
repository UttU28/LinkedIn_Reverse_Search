const axios = require('axios');
const dotenv = require('dotenv');
const { findSingleLinkedinContact } = require('./findSingleLinkedinContact');
const { db, firebaseInitialized } = require('./firebase');

dotenv.config();

const printStatus = (message) => {
  console.log(message);
};

/**
 * Update the search history record in Firestore
 * @param {string} userId - User ID
 * @param {string} historyId - Search history document ID
 * @param {object} updateData - Data to update
 * @returns {Promise<boolean>} - Success status
 */
const updateSearchHistory = async (userId, historyId, updateData) => {
  try {
    if (!userId || !historyId) {
      printStatus(`Cannot update search history: userId or historyId is missing`);
      return false;
    }
    
    // If db is not available, skip updating history
    if (!db || !firebaseInitialized) {
      printStatus(`Firestore not available - skipping search history update`);
      return false;
    }
    
    // Create a reference to the user's searchHistory document
    const userRef = db.collection('users').doc(userId);
    const historyDocRef = userRef.collection('searchHistory').doc(historyId);
    
    // Update the document
    await historyDocRef.update({
      ...updateData,
      lastUpdated: new Date()
    });
    
    printStatus(`Updated search history entry ID: ${historyId} for user: ${userId}`);
    return true;
  } catch (error) {
    printStatus(`Error updating search history: ${error.message}`);
    return false;
  }
};

/**
 * Update the batch status in Firestore
 * @param {object} updateData - Batch status data
 * @returns {Promise<boolean>} - Success status
 */
const updateBatchStatus = async (updateData) => {
  try {
    const { userID, batchId, historyId, status, progress, results, error } = updateData;
    
    if (!userID || !batchId) {
      printStatus(`Cannot update batch status: userID or batchId is missing`);
      return false;
    }
    
    // Log the update for debugging
    printStatus(`BATCH UPDATE (${status}): Batch ${batchId}, Processed: ${progress?.processed || 0}/${progress?.total || 0}`);
    
    // If Firebase is not initialized, just log the update
    if (!db || !firebaseInitialized) {
      printStatus(`Firestore not available - skipping batch status update`);
      return false;
    }
    
    // Create batch data to store in Firestore
    const batchData = {
      status,
      lastUpdated: new Date()
    };
    
    // Add progress data if available
    if (progress) {
      batchData.progress = progress;
    }
    
    // Add error info if available
    if (error) {
      batchData.error = error;
    }
    
    // Add completed timestamp if we're done
    if (status === 'completed' || status === 'failed') {
      batchData.completedAt = new Date();
    }
    
    // Save the latest results if we have them
    if (results) {
      batchData.results = results;
    }
    
    // Update the batch document
    await db.collection('batches').doc(batchId).set(batchData, { merge: true });
    
    // If we have a history ID, update the search history too
    if (historyId) {
      // Map the status to search history status
      let historyStatus = status;
      if (status === 'processing') historyStatus = 'pending';
      if (status === 'error') historyStatus = 'failed';
      
      await updateSearchHistory(userID, historyId, {
        status: historyStatus,
        completedAt: status === 'completed' || status === 'failed' ? new Date() : null,
        resultsCount: progress?.successful || 0
      });
    }
    
    return true;
  } catch (error) {
    printStatus(`Error updating batch status: ${error.message}`);
    return false;
  }
};

/**
 * Process a batch of LinkedIn profile searches in the background
 * @param {Array} contacts - Array of contact objects with name, company, position
 * @param {string} userID - User ID for tracking
 * @param {string} batchId - Batch ID for tracking
 * @param {string} historyId - History document ID for updates
 * @returns {Promise<void>}
 */
async function processBatchInBackground(contacts, userID, batchId, historyId) {
  try {
    printStatus(`Starting background processing of batch ${batchId} with ${contacts.length} contacts`);
    
    // Update initial status
    await updateBatchStatus({
      userID,
      batchId,
      historyId,
      status: 'processing',
      progress: {
        total: contacts.length,
        processed: 0,
        successful: 0
      }
    });
    
    const results = [];
    let successCount = 0;
    let processedCount = 0;
    
    // Process each contact sequentially
    for (const contact of contacts) {
      const { searchName, searchCompany, searchPosition, contactId } = contact;
      
      // Search for LinkedIn profile
      const result = await findSingleLinkedinContact(searchName, searchCompany, searchPosition);
      
      // Create result object
      const processedContact = {
        batchId,
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
      if (result.success) {
        successCount++;
      }
      
      // Update progress in database
      await updateBatchStatus({
        userID,
        batchId,
        historyId,
        status: 'processing', // Keep as processing until all are completed
        progress: {
          total: contacts.length,
          processed: processedCount,
          successful: successCount
        },
        latestResult: processedContact
      });
      
      // Add a small delay to avoid rate limiting
      if (processedCount < contacts.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Final status update
    printStatus(`Completed batch ${batchId} processing. Found ${successCount}/${contacts.length} LinkedIn profiles`);
    
    // Final database update
    await updateBatchStatus({
      userID,
      batchId,
      historyId,
      status: 'completed',
      progress: {
        total: contacts.length,
        processed: processedCount,
        successful: successCount
      },
      results
    });
    
    return {
      success: true,
      totalContacts: contacts.length,
      foundProfiles: successCount,
      results
    };
  } catch (error) {
    printStatus(`Error processing batch ${batchId}: ${error.message}`);
    
    // Update error status in database
    await updateBatchStatus({
      userID,
      batchId,
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
 * @param {Array} contacts - Array of contact objects
 * @param {string} userID - User ID for tracking
 * @param {Object} batchInfo - Info about the batch (fileName, timestamp, etc.)
 * @param {string} historyId - Search history document ID for updates
 * @returns {Object} - Initial response with batch status info
 */
function startBatchProcessing(contacts, userID, batchInfo, historyId) {
  // Generate a unique batch ID if not provided
  const batchId = batchInfo.batchId || `batch-${Date.now()}`;
  
  // Start the background processing without awaiting completion
  processBatchInBackground(contacts, userID, batchId, historyId)
    .then(finalResult => {
      printStatus(`BACKGROUND PROCESSING COMPLETE: Batch ${batchId}`);
      printStatus(`Found ${finalResult.foundProfiles}/${finalResult.totalContacts} LinkedIn profiles`);
    })
    .catch(error => {
      printStatus(`BACKGROUND PROCESSING ERROR: Batch ${batchId}: ${error.message}`);
    });
  
  // Return immediately with initial status
  return {
    userID,
    batchId,
    fileName: batchInfo.fileName || 'Unknown',
    timestamp: batchInfo.timestamp || Date.now(),
    contactsCount: contacts.length,
    status: 'processing',
    message: `Started processing ${contacts.length} contacts in the background`
  };
}

module.exports = { startBatchProcessing }; 