const crypto = require('crypto');
const { db, firebaseInitialized } = require('./firebase');
const { log } = require('./utils');
const admin = require('firebase-admin');

/** Normalize name+company for cache key (lowercase, trim, collapse whitespace) */
function normalizeCacheKey(name, company) {
  const n = (name || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const c = (company || '').trim().toLowerCase().replace(/\s+/g, ' ');
  return `${n}|${c}`;
}

/** Generate Firestore doc ID for contact cache */
function contactCacheDocId(name, company) {
  const key = normalizeCacheKey(name, company);
  return crypto.createHash('sha256').update(key).digest('hex');
}

/** Normalize company name for site cache key */
function normalizeCompanyKey(company) {
  return (company || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Generate Firestore doc ID for company site cache */
function companyCacheDocId(company) {
  const key = normalizeCompanyKey(company);
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Database Service
 * Centralizes all database operations for the application
 */
class DbService {
  /**
   * Constructor
   */
  constructor() {
    this.db = db;
    this.initialized = firebaseInitialized;
    
    // Log database status
    if (this.initialized) {
      log('Database service initialized successfully');
    } else {
      log('Database service initialized but Firestore is not available', 'warn');
    }
  }
  
  /**
   * Log a message with a prefix
   * @param {string} message - The message to log
   * @param {string} level - Log level
   */
  log(message, level = 'info') {
    log(`[DbService] ${message}`, level);
  }
  
  /**
   * Log an error message with a prefix
   * @param {string} message - The error message to log
   * @param {Error} error - The error object
   */
  logError(message, error) {
    log(`[DbService] ${message}: ${error.message}`, 'error');
  }
  
  /**
   * Check if database is available
   * @returns {boolean} - Database status
   */
  isAvailable() {
    return this.initialized && this.db != null;
  }

  /**
   * Add a search history entry
   * @param {string} userId - User ID
   * @param {object} historyData - Search history data
   * @param {object} [options] - { quiet: true } to log at debug level
   * @returns {Promise<string|null>} - History ID or null if failed
   */
  async addSearchHistory(userId, historyData, options = {}) {
    try {
      if (!userId) {
        this.log('Cannot add search history: userId is missing', 'warn');
        return null;
      }
      
      // If db is not available, skip adding history
      if (!this.isAvailable()) {
        this.log('Firestore not available - skipping search history', 'warn');
        return null;
      }
      
      // Create a reference to the user's searchHistory collection
      const userRef = this.db.collection('users').doc(userId);
      const searchHistoryRef = userRef.collection('searchHistory');
      
      // Add timestamp manually
      const timestamp = new Date();
      
      // Add document with auto-generated ID, including default cost
      const docRef = await searchHistoryRef.add({
        ...historyData,
        costCredits: 0, // Initialize cost to 0, will be updated later
        createdAt: timestamp
      });
      
      this.log(`Added search history entry with ID: ${docRef.id} for user: ${userId}`, options.quiet ? 'debug' : 'info');
      return docRef.id;
    } catch (error) {
      this.logError('Error adding search history', error);
      return null;
    }
  }
  
  /**
   * Update a search history entry
   * @param {string} userId - User ID
   * @param {string} historyId - Search history document ID
   * @param {object} updateData - Data to update
   * @returns {Promise<boolean>} - Success status
   */
  async updateSearchHistory(userId, historyId, updateData) {
    try {
      if (!userId || !historyId) {
        this.log(`Cannot update search history: userId or historyId is missing`, 'warn');
        return false;
      }
      
      // If db is not available, skip updating history
      if (!this.isAvailable()) {
        this.log(`Firestore not available - skipping search history update`, 'warn');
        return false;
      }
      
      // Create a reference to the user's searchHistory document
      const userRef = this.db.collection('users').doc(userId);
      const historyDocRef = userRef.collection('searchHistory').doc(historyId);
      
      // Update the document
      await historyDocRef.update({
        ...updateData,
      });
      
      this.log(`Updated search history entry ID: ${historyId} for user: ${userId}`, 'debug');
      return true;
    } catch (error) {
      this.logError(`Error updating search history`, error);
      return false;
    }
  }
  
  /**
   * Update search cost and deduct credits
   * @param {string} userId - User ID
   * @param {string} historyId - Search history document ID
   * @param {string} searchType - Type of search (single, bulk, recruiters)
   * @param {number} resultsCount - Number of results found (for charging)
   * @param {object} [options] - { quiet: true } to log at debug level
   * @returns {Promise<object|null>} - Updated user data or null if failed
   */
  async updateSearchCost(userId, historyId, searchType, resultsCount, options = {}) {
    try {
      if (!userId || !historyId) {
        this.log(`Cannot update search cost: userId or historyId is missing`, 'warn');
        return null;
      }
      
      if (!this.isAvailable()) {
        this.log('Firestore not available - cannot update search cost');
        return null;
      }
      
      // Calculate cost based on search type and results
      let costCredits = 0;
      
      switch (searchType) {
        case 'single':
          costCredits = resultsCount > 0 ? 1 : 0;
          break;
        case 'bulk':
          costCredits = resultsCount || 0;
          break;
        case 'recruiters':
          costCredits = resultsCount || 0;
          break;
        case 'companySitesBulk':
          costCredits = resultsCount || 0;
          break;
        case 'companySitesSingle':
          costCredits = resultsCount > 0 ? 1 : 0;
          break;
        default:
          costCredits = resultsCount > 0 ? 1 : 0;
      }
      
      // Update search history with cost information
      await this.updateSearchHistory(userId, historyId, {
        costCredits: costCredits
      });
      
      // Only proceed with deducting credits if there's a cost
      if (costCredits <= 0) {
        this.log(`No credits to deduct for search ${historyId}`, 'debug');
        return {
          deductedCredits: 0
        };
      }
      
      // Deduct credits from user account
      const userRef = this.db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        this.log(`User not found: ${userId}`);
        return null;
      }
      
      const userData = userDoc.data();
      const currentLinkCredits = userData.linkCredits || 0;
      
      // Calculate new credits (don't go below 0)
      const newLinkCredits = Math.max(0, currentLinkCredits - costCredits);
      
      // Update user with new credit balance
      await userRef.update({
        linkCredits: newLinkCredits,
        lastCreditUpdate: new Date()
      });
      
      this.log(`Deducted ${costCredits} credits from user ${userId}. New balance: ${newLinkCredits}`, options.quiet ? 'debug' : 'info');

      return {
        userId,
        previousCredits: currentLinkCredits,
        deductedCredits: costCredits,
        newCredits: newLinkCredits
      };
    } catch (error) {
      this.logError('Error updating search cost', error);
      return null;
    }
  }
  
  /**
   * Update batch processing status
   * @param {object} updateData - Batch status data
   * @returns {Promise<boolean>} - Success status
   */
  async updateBatchStatus(updateData) {
    try {
      const { userID, historyId, status, progress, error } = updateData;
      
      if (!userID || !historyId) {
        this.log(`Cannot update batch status: userID or historyId is missing`, 'warn');
        return false;
      }
      
      // Log the update for debugging
      this.log(`Batch Update (${status}): Processed: ${progress?.processed || 0}/${progress?.total || 0}`, 'debug');
      
      // If database is not initialized, just log the update
      if (!this.isAvailable()) {
        this.log(`Firestore not available - skipping batch status update`, 'warn');
        return false;
      }
      
      // Map the status to search history status
      let historyStatus = status;
      if (status === 'processing') historyStatus = 'pending';
      if (status === 'error') historyStatus = 'failed';
      
      // Update search history
      await this.updateSearchHistory(userID, historyId, {
        status: historyStatus,
        completedAt: status === 'completed' || status === 'failed' ? new Date() : null,
        resultsCount: progress?.successful || 0
      });
      
      return true;
    } catch (error) {
      this.logError(`Error updating batch status`, error);
      return false;
    }
  }
  
  /**
   * Add a search result
   * @param {string} userId - User ID
   * @param {string} historyId - Search history ID
   * @param {string} type - Search type (single, bulk, etc.)
   * @param {object} searchData - Search data (name, company, position)
   * @param {string|null} linkedinUrl - LinkedIn profile URL or null if not found
   * @param {string|null} [companyUrl] - Company website URL or null (when includeCompanyLinks was used)
   * @returns {Promise<string|null>} - Result ID or null if failed
   */
  async addSearchResult(userId, historyId, type, searchData, linkedinUrl, companyUrl = null) {
    try {
      if (!this.isAvailable()) {
        this.log('Firestore not available - skipping search result storage', 'warn');
        return null;
      }
      
      if (!historyId) {
        this.log('Cannot add search result: historyId is missing', 'warn');
        return null;
      }
      
      // Create a reference to the searchResults collection
      const searchResultsRef = this.db.collection('searchResults');
      
      // Map the data based on the type and format expected with fallbacks for undefined
      const name = (type === 'single' ? searchData.name : (searchData.searchName || searchData.name)) || '';
      const company = (type === 'single' ? searchData.company : (searchData.searchCompany || searchData.company)) || '';
      const position = (type === 'single' ? searchData.position : (searchData.searchPosition || searchData.position)) || '';
      
      // Special case for 'recruiters' type to use the proper structure
      let inputTitle = position || '';
      if (type === 'recruiters') {
        inputTitle = position || ''; // For recruiters, use position as title
      }
      
      // Log what we're storing
      this.log(`Storing result - Name: ${name}, Company: ${company}, Position: ${position}`, 'debug');
      
      // Prepare the data in the requested format - use historyId as searchId
      const resultData = {
        userId: userId,
        searchId: historyId,
        type: type,
        inputData: {
          name: name,
          company: company,
          title: inputTitle
        },
        linkedinUrl: linkedinUrl || null,
        companyUrl: companyUrl || null,
        createdAt: new Date()
      };
      
      // Add document with the search result data
      const docRef = await searchResultsRef.add(resultData);
      
      this.log(`Added search result with ID: ${docRef.id} for history: ${historyId}`, 'debug');
      return docRef.id;
    } catch (error) {
      this.logError('Error adding search result', error);
      return null;
    }
  }

  /**
   * Look up a company website in the global cache by company name.
   * Only returns cached entry if websiteUrl is present.
   * @param {string} company - Company name
   * @returns {Promise<{websiteUrl: string}|null>} - Cached result or null
   */
  async getCompanySiteFromCache(company) {
    try {
      if (!this.isAvailable()) return null;
      const docId = companyCacheDocId(company);
      const docRef = this.db.collection('companySitesCache').doc(docId);
      const doc = await docRef.get();
      if (!doc.exists) return null;
      const data = doc.data();
      if (!data || !data.websiteUrl) return null;
      this.log(`Company site cache HIT: ${company}`, 'debug');
      return { websiteUrl: data.websiteUrl };
    } catch (error) {
      this.logError('Error reading company site cache', error);
      return null;
    }
  }

  /**
   * Store a found company website in the global cache.
   * @param {string} company - Company name
   * @param {string} websiteUrl - Official website URL
   * @returns {Promise<boolean>} - Success status
   */
  async addCompanySiteToCache(company, websiteUrl) {
    try {
      if (!this.isAvailable() || !websiteUrl) return false;
      const docId = companyCacheDocId(company);
      const docRef = this.db.collection('companySitesCache').doc(docId);
      await docRef.set(
        {
          company: (company || '').trim(),
          websiteUrl: websiteUrl.trim(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        { merge: true }
      );
      this.log(`Company site cache STORED: ${company}`, 'debug');
      return true;
    } catch (error) {
      this.logError('Error writing company site cache', error);
      return false;
    }
  }

  /**
   * Look up a contact in the global cache by name + company.
   * Only returns cached entry if linkedinUrl is present (we don't cache "not found").
   * @param {string} name - Full name
   * @param {string} company - Company name
   * @returns {Promise<{linkedinUrl: string}|null>} - Cached result or null
   */
  async getContactFromCache(name, company) {
    try {
      if (!this.isAvailable()) return null;
      const docId = contactCacheDocId(name, company);
      const docRef = this.db.collection('contactCache').doc(docId);
      const doc = await docRef.get();
      if (!doc.exists) return null;
      const data = doc.data();
      if (!data || !data.linkedinUrl) return null;
      this.log(`Contact cache HIT: ${name} at ${company}`, 'debug');
      return { linkedinUrl: data.linkedinUrl };
    } catch (error) {
      this.logError('Error reading contact cache', error);
      return null;
    }
  }

  /**
   * Store a found contact in the global cache for faster future lookups.
   * @param {string} name - Full name
   * @param {string} company - Company name
   * @param {string} linkedinUrl - LinkedIn profile URL
   * @returns {Promise<boolean>} - Success status
   */
  async addContactToCache(name, company, linkedinUrl) {
    try {
      if (!this.isAvailable() || !linkedinUrl) return false;
      const docId = contactCacheDocId(name, company);
      const docRef = this.db.collection('contactCache').doc(docId);
      await docRef.set({
        name: (name || '').trim(),
        company: (company || '').trim(),
        linkedinUrl: linkedinUrl.trim(),
        createdAt: new Date(),
        updatedAt: new Date()
      }, { merge: true });
      this.log(`Contact cache STORED: ${name} at ${company}`, 'debug');
      return true;
    } catch (error) {
      this.logError('Error writing contact cache', error);
      return false;
    }
  }
  
  /**
   * Store a company website result row for a bulk search.
   * @param {string} userId
   * @param {string} historyId
   * @param {string} companyName
   * @param {string} websiteUrl
   * @param {boolean} fromCache
   */
  async addCompanySiteResult(userId, historyId, companyName, websiteUrl, fromCache) {
    try {
      if (!this.isAvailable() || !historyId || !websiteUrl) return null;
      const resultsRef = this.db.collection('companySitesResults');
      const docRef = await resultsRef.add({
        userId: userId || null,
        historyId,
        companyName: (companyName || '').trim(),
        websiteUrl: websiteUrl.trim(),
        fromCache: !!fromCache,
        createdAt: new Date()
      });
      this.log(`Added company site result with ID: ${docRef.id} for history: ${historyId}`, 'debug');
      return docRef.id;
    } catch (error) {
      this.logError('Error adding company site result', error);
      return null;
    }
  }

  /**
   * Fetch company website results for a given historyId.
   * @param {string} historyId
   * @returns {Promise<Array<{companyName: string, websiteUrl: string, fromCache: boolean}>>}
   */
  async getCompanySiteResultsByHistoryId(historyId) {
    try {
      if (!this.isAvailable() || !historyId) return [];
      const resultsRef = this.db.collection('companySitesResults');
      const snapshot = await resultsRef.where('historyId', '==', historyId).get();
      if (snapshot.empty) return [];
      const items = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          companyName: data.companyName || '',
          websiteUrl: data.websiteUrl || '',
          fromCache: !!data.fromCache
        });
      });
      return items;
    } catch (error) {
      this.logError('Error fetching company site results by historyId', error);
      return [];
    }
  }
  
  /**
   * Get a user document by ID
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} - User data or null if not found
   */
  async getUserData(userId) {
    try {
      if (!this.isAvailable()) {
        this.log('Firestore not available - cannot get user data');
        return null;
      }
      
      if (!userId) {
        this.log('Cannot get user data: userId is missing');
        return null;
      }
      
      // Get user document
      const userRef = this.db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        this.log(`User not found: ${userId}`);
        return null;
      }
      
      return userDoc.data();
    } catch (error) {
      this.logError('Error getting user data', error);
      return null;
    }
  }
  
  /**
   * Update user credits
   * @param {string} userId - User ID
   * @param {number} creditsUsed - Number of credits used
   * @param {number} resultsFound - Number of results found
   * @returns {Promise<object|null>} - Updated user data or null if failed
   */
  async updateUserCredits(userId, creditsUsed, resultsFound) {
    try {
      if (!this.isAvailable()) {
        this.log('Firestore not available - cannot update user credits');
        return {
          linkCredits: 100,
          totalSearched: 1,
          totalFound: resultsFound || 0
        };
      }
      
      if (!userId) {
        this.log('Cannot update user credits: userId is missing');
        return null;
      }
      
      // Get user document
      const userRef = this.db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        this.log(`User not found: ${userId}`);
        return null;
      }
      
      const userData = userDoc.data();
      const currentLinkCredits = userData.linkCredits || 100;
      const currentTotalSearched = userData.totalSearched || 0;
      const currentTotalFound = userData.totalFound || 0;
      
      // Calculate new values
      const newLinkCredits = Math.max(0, currentLinkCredits - (creditsUsed || 1));
      const newTotalSearched = currentTotalSearched + 1;
      const newTotalFound = currentTotalFound + (resultsFound || 0);
      
      // Update user record
      await userRef.update({ 
        linkCredits: newLinkCredits,
        totalSearched: newTotalSearched,
        totalFound: newTotalFound,
        lastUpdated: new Date()
      });
      
      return {
        linkCredits: newLinkCredits,
        totalSearched: newTotalSearched,
        totalFound: newTotalFound
      };
    } catch (error) {
      this.logError('Error updating user credits', error);
      return null;
    }
  }

  /**
   * Update user preference (e.g. includeCompanyLinks for profile search).
   * @param {string} userId - User ID
   * @param {object} preference - { includeCompanyLinks?: boolean }
   * @returns {Promise<boolean>}
   */
  async updateUserPreference(userId, preference) {
    try {
      if (!this.isAvailable() || !userId) return false;
      const userRef = this.db.collection('users').doc(userId);
      await userRef.set(
        { ...preference, lastPreferenceUpdate: new Date() },
        { merge: true }
      );
      return true;
    } catch (error) {
      this.logError('Error updating user preference', error);
      return false;
    }
  }
  
  /**
   * Create a new user
   * @param {object} userData - User data
   * @returns {Promise<string|null>} - User ID or null if failed
   */
  async createUser(userData) {
    try {
      if (!this.isAvailable()) {
        this.log('Firestore not available - cannot create user');
        return null;
      }
      
      if (!userData.email) {
        this.log('Cannot create user: email is missing');
        return null;
      }
      
      // Add default values
      const userDataWithDefaults = {
        ...userData,
        linkCredits: userData.linkCredits || 10,
        createdAt: new Date()
      };
      
      // Create user document with the provided UID as document ID
      const usersRef = this.db.collection('users');
      
      // If uid is provided, use it as the document ID
      if (userData.uid) {
        await usersRef.doc(userData.uid).set(userDataWithDefaults);
        this.log(`Created user with ID: ${userData.uid}`);
        return userData.uid;
      } else {
        // Fallback to auto-generated ID if uid is not provided
        const newUserRef = await usersRef.add(userDataWithDefaults);
        this.log(`Created user with auto-generated ID: ${newUserRef.id}`);
        return newUserRef.id;
      }
    } catch (error) {
      this.logError('Error creating user', error);
      return null;
    }
  }
  
  /**
   * Find a user by email
   * @param {string} email - User email
   * @returns {Promise<{id: string, data: object}|null>} - User ID and data or null if not found
   */
  async findUserByEmail(email) {
    try {
      if (!this.isAvailable()) {
        this.log('Firestore not available - cannot find user');
        return null;
      }
      
      if (!email) {
        this.log('Cannot find user: email is missing');
        return null;
      }
      
      // Query users collection
      const usersRef = this.db.collection('users');
      const snapshot = await usersRef.where('email', '==', email).get();
      
      if (snapshot.empty) {
        this.log(`No user found with email: ${email}`);
        return null;
      }
      
      // Get the first matching user
      const userDoc = snapshot.docs[0];
      
      return {
        id: userDoc.id,
        data: userDoc.data()
      };
    } catch (error) {
      this.logError('Error finding user', error);
      return null;
    }
  }
  
  /**
   * Get recent search history for a user
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array<object>|null>} - Array of search history entries or null if failed
   */
  async getRecentSearchHistory(userId, limit = 20) {
    try {
      if (!this.isAvailable()) {
        this.log('Firestore not available - cannot get search history');
        return [];
      }
      
      if (!userId) {
        this.log('Cannot get search history: userId is missing');
        return [];
      }
      
      // Query search history collection
      const searchHistoryRef = this.db.collection('users').doc(userId).collection('searchHistory');
      const query = searchHistoryRef.orderBy('createdAt', 'desc').limit(limit);
      const snapshot = await query.get();
      
      if (snapshot.empty) {
        this.log(`No search history found for user: ${userId}`);
        return [];
      }
      
      // Map documents to objects and process them
      const searchHistoryItems = [];
      
      for (const doc of snapshot.docs) {
        const historyData = doc.data();
        const historyItem = {
          id: doc.id,
          ...historyData,
          createdAt: historyData.createdAt?.toDate() || new Date(),
          completedAt: historyData.completedAt?.toDate() || null
        };
        
        // For single searches, try to fetch the LinkedIn URL from the first result
        // if it's not already in the history item
        if (historyItem.type === 'single' && !historyItem.linkedinUrl && 
            historyItem.resultIds && historyItem.resultIds.length > 0) {
          try {
            // Get the first result ID
            const resultId = historyItem.resultIds[0];
            // Query the search result
            const resultRef = this.db.collection('searchResults').doc(resultId);
            const resultDoc = await resultRef.get();
            
            if (resultDoc.exists) {
              const resultData = resultDoc.data();
              // Add linkedinUrl to the history item if found
              if (resultData.linkedinUrl) {
                historyItem.linkedinUrl = resultData.linkedinUrl;
                
                // Also update the history document with the LinkedIn URL for future queries
                await searchHistoryRef.doc(doc.id).update({
                  linkedinUrl: resultData.linkedinUrl
                });
              }
            }
          } catch (resultError) {
            this.log(`Error retrieving search result for history ${doc.id}: ${resultError.message}`, 'warn');
            // Continue processing other history items even if this one fails
          }
        }

        // For company website single searches, if websiteUrl is missing,
        // try to backfill it from the company site cache and persist it.
        if (historyItem.type === 'companySitesSingle' &&
            (!historyItem.websiteUrl || historyItem.websiteUrl === '') &&
            historyItem.inputMeta?.company) {
          try {
            const companyName = historyItem.inputMeta.company;
            const cachedSite = await this.getCompanySiteFromCache(companyName);
            if (cachedSite && cachedSite.websiteUrl) {
              historyItem.websiteUrl = cachedSite.websiteUrl;
              if (this.isAvailable()) {
                await searchHistoryRef.doc(doc.id).update({
                  websiteUrl: cachedSite.websiteUrl
                });
              }
            }
          } catch (cacheError) {
            this.log(`Error backfilling company website for history ${doc.id}: ${cacheError.message}`, 'warn');
          }
        }
        
        searchHistoryItems.push(historyItem);
      }
      
      return searchHistoryItems;
    } catch (error) {
      this.logError('Error getting search history', error);
      return [];
    }
  }

  /**
   * Completed bulk-style searches that can be stitched from history (paginated).
   * @param {string} userId
   * @param {{ limit?: number, cursorId?: string|null }} options
   */
  async getStitchableSearches(userId, { limit = 10, cursorId = null } = {}) {
    const STITCHABLE_TYPES = new Set(['bulk', 'team', 'recruiters']);
    const BATCH_SIZE = 30;

    const isStitchable = (data) =>
      data.status === 'completed' &&
      STITCHABLE_TYPES.has(data.type) &&
      Array.isArray(data.resultIds) &&
      data.resultIds.length > 0;

    const titleFor = (data) => {
      if (data.type === 'bulk' || data.type === 'team') {
        return data.inputMeta?.fileName || (data.type === 'team' ? 'Team Search' : 'Bulk Search');
      }
      if (data.type === 'recruiters') {
        return `${data.inputMeta?.company || 'Unknown'} Recruiters`;
      }
      return 'Search';
    };

    try {
      if (!this.isAvailable()) {
        this.log('Firestore not available - cannot get stitchable searches');
        return { items: [], nextCursor: null, hasMore: false };
      }

      if (!userId) {
        this.log('Cannot get stitchable searches: userId is missing');
        return { items: [], nextCursor: null, hasMore: false };
      }

      const searchHistoryRef = this.db.collection('users').doc(userId).collection('searchHistory');
      const items = [];
      let scanAfterId = cursorId;
      let exhausted = false;

      while (items.length < limit) {
        let query = searchHistoryRef.orderBy('createdAt', 'desc').limit(BATCH_SIZE);
        if (scanAfterId) {
          const cursorDoc = await searchHistoryRef.doc(scanAfterId).get();
          if (!cursorDoc.exists) {
            exhausted = true;
            break;
          }
          query = query.startAfter(cursorDoc);
        }

        const snapshot = await query.get();
        if (snapshot.empty) {
          exhausted = true;
          break;
        }

        for (const doc of snapshot.docs) {
          scanAfterId = doc.id;
          const historyData = doc.data();
          if (!isStitchable(historyData)) continue;

          items.push({
            id: doc.id,
            type: historyData.type,
            title: titleFor(historyData),
            totalRecords: historyData.totalRecords || historyData.resultIds.length,
            resultIds: historyData.resultIds,
            createdAt: historyData.createdAt?.toDate() || new Date(),
            completedAt: historyData.completedAt?.toDate() || null,
          });

          if (items.length >= limit) break;
        }

        if (snapshot.size < BATCH_SIZE) {
          exhausted = true;
          break;
        }
      }

      return {
        items: items.slice(0, limit),
        nextCursor: exhausted ? null : scanAfterId,
        hasMore: !exhausted,
      };
    } catch (error) {
      this.logError('Error getting stitchable searches', error);
      return { items: [], nextCursor: null, hasMore: false };
    }
  }

  /**
   * Get search results by their IDs
   * @param {string[]} resultIds - Array of result document IDs
   * @returns {Promise<Array>} - Array of search result documents
   */
  async getSearchResultsByIds(resultIds) {
    try {
      if (!resultIds || !Array.isArray(resultIds) || resultIds.length === 0) {
        this.log('No result IDs provided', 'warn');
        return [];
      }

      if (!this.isAvailable()) {
        this.log('Firestore not available - cannot fetch search results', 'warn');
        return [];
      }

      const results = [];
      
      // Firestore has a limit of 10 items for 'in' queries, so we need to batch
      const batchSize = 10;
      
      for (let i = 0; i < resultIds.length; i += batchSize) {
        const batch = resultIds.slice(i, i + batchSize);
        
        try {
          const searchResultsRef = this.db.collection('searchResults');
          const query = searchResultsRef.where('__name__', 'in', batch);
          const querySnapshot = await query.get();
          
          this.log(`Batch ${Math.floor(i/batchSize) + 1}: Found ${querySnapshot.docs.length} documents`, 'debug');
          
          querySnapshot.forEach(doc => {
            const data = doc.data();
            
            // Handle the inputData field structure from the database
            const inputData = data.inputData || {};
            
            // Create a result object with properly extracted fields
            const resultItem = {
              id: doc.id,
              name: inputData.name || '',
              company: inputData.company || '',
              title: inputData.position || inputData.title || '',
              linkedin: data.linkedinUrl || data.linkedin || inputData.linkedin || '',
              website: data.companyUrl || data.website || inputData.website || '',
              createdAt: data.createdAt || null,
              type: data.type || 'unknown'
            };
            
            results.push(resultItem);
          });
        } catch (batchError) {
          this.logError(`Error fetching batch ${Math.floor(i/batchSize) + 1}`, batchError);
        }
      }
      
      this.log(`Successfully fetched ${results.length} search results`, 'debug');
      return results;
    } catch (error) {
      this.logError('Error getting search results by IDs', error);
      return [];
    }
  }

  /**
   * Cleanup interrupted searches on startup
   * Marks all pending searches as failed (since they were interrupted by server restart)
   * @returns {Promise<number>} - Number of searches cleaned up
   */
  async cleanupInterruptedSearches() {
    try {
      if (!this.isAvailable()) {
        this.log('Firestore not available - skipping cleanup of interrupted searches', 'warn');
        return 0;
      }

      this.log('Starting cleanup of interrupted searches...', 'info');
      
      let totalCleaned = 0;
      
      // Get all users
      const usersRef = this.db.collection('users');
      const usersSnapshot = await usersRef.get();
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        
        // Get all search history for this user that are still pending
        const searchHistoryRef = userDoc.ref.collection('searchHistory');
        const pendingQuery = searchHistoryRef.where('status', '==', 'pending');
        const pendingSnapshot = await pendingQuery.get();
        
        if (pendingSnapshot.empty) {
          continue; // No interrupted searches for this user
        }
        
        this.log(`Found ${pendingSnapshot.docs.length} pending searches for user ${userId}`, 'debug');
        
        // Update each interrupted search
        const batch = this.db.batch();
        
        pendingSnapshot.docs.forEach(doc => {
          const searchData = doc.data();
          batch.update(doc.ref, {
            status: 'failed',
            errorMessage: 'Search interrupted by server restart',
            completedAt: new Date(),
            updatedAt: new Date()
          });
          
          this.log(`Marking search ${doc.id} (${searchData.type}) as failed due to server restart`, 'debug');
          totalCleaned++;
        });
        
        // Commit the batch update for this user
        await batch.commit();
      }
      
      if (totalCleaned > 0) {
        this.log(`Cleanup completed: marked ${totalCleaned} interrupted searches as failed`, 'info');
      } else {
        this.log('No interrupted searches found to cleanup', 'info');
      }
      
      return totalCleaned;
    } catch (error) {
      this.logError('Error during cleanup of interrupted searches', error);
      return 0;
    }
  }
}

// Create and export a singleton instance
const dbService = new DbService();

// Add credits to user account from payment
const addCreditsToUser = async (userId, creditsToAdd) => {
  try {
    // Validate inputs
    if (!userId || !creditsToAdd || isNaN(creditsToAdd)) {
      console.error('Invalid input for addCreditsToUser:', { userId, creditsToAdd });
      return null;
    }

    // Get Firebase Firestore instance
    const db = admin.firestore();
    
    // Reference to the user document
    const userRef = db.collection('users').doc(userId);
    
    // Get the current user data
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.error(`User ${userId} not found for adding credits`);
      return null;
    }
    
    const userData = userDoc.data();
    const currentCredits = userData.linkCredits || 0;
    const newCredits = currentCredits + creditsToAdd;
    
    // Create a timestamp for now
    const timestamp = new Date();
    
    // Update the user document with new credits
    await userRef.update({
      linkCredits: newCredits,
      lastCreditUpdate: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`Added ${creditsToAdd} credits to user ${userId}. New balance: ${newCredits}`);
    
    return {
      userId,
      previousCredits: currentCredits,
      addedCredits: creditsToAdd,
      newCredits: newCredits
    };
  } catch (error) {
    console.error('Error adding credits to user:', error);
    return null;
  }
};

/**
 * Update payment status in the database
 * @param {string} paymentId - The Stripe payment ID or session ID
 * @param {string} status - The payment status (completed, processing, failed, requires_action)
 * @param {string} errorMessage - Optional error message for failed payments
 * @param {object} paymentDetails - Additional payment details (amount, credits, etc.)
 * @returns {Promise<object|null>} - Updated payment data or null if failed
 */
const updatePaymentStatus = async (paymentId, status, errorMessage = null, paymentDetails = {}) => {
  try {
    if (!paymentId || !status) {
      console.error('Invalid input for updatePaymentStatus:', { paymentId, status });
      return null;
    }

    // Get Firebase Firestore instance
    const db = admin.firestore();
    
    // Create a timestamp for now
    const timestamp = new Date();
    
    // Extract payment details with defaults
    const { 
      userId = null,
      creditsPurchased = 0,
      amountUSD = 0, 
      planName = null,
      paymentProvider = 'Stripe'
    } = paymentDetails;
    
    // Create the payment data object
    const paymentData = {
      userId: userId,
      creditsPurchased: creditsPurchased,
      amountUSD: amountUSD,
      paymentProvider: paymentProvider,
      planName: planName,
      status: status,
      errorMessage: errorMessage || '',
      paymentId: paymentId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // 1. Add/update record in the top-level paymentResults collection
    const paymentResultsRef = db.collection('paymentResults');
    
    // Try to find existing payment record first
    const query = paymentResultsRef.where('paymentId', '==', paymentId);
    const snapshot = await query.get();
    
    let paymentResultId = null;
    
    if (snapshot.empty) {
      // Payment record doesn't exist yet, create a new one
      console.log(`Payment record not found for ID: ${paymentId}. Creating new record.`);
      
      // Add the new payment record
      const docRef = await paymentResultsRef.add(paymentData);
      paymentResultId = docRef.id;
      console.log(`Created new payment record with ID: ${paymentResultId}`);
    } else {
      // Payment record exists, update it
      const paymentDoc = snapshot.docs[0];
      paymentResultId = paymentDoc.id;
      
      // Update existing record (only non-null fields)
      await paymentDoc.ref.update({
        status: status,
        errorMessage: errorMessage || paymentDoc.data().errorMessage || '',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`Updated payment status to ${status} for payment ID: ${paymentId}`);
    }
    
    // 2. Add to user's paymentHistory subcollection if userId is provided
    if (userId) {
      try {
        // Reference to the user's paymentHistory collection
        const userRef = db.collection('users').doc(userId);
        const paymentHistoryRef = userRef.collection('paymentHistory');
        
        // Create the payment history entry
        const paymentHistoryData = {
          ...paymentData,
          paymentResultId: paymentResultId,  // reference to top-level collection document
          timestamp: timestamp
        };
        
        // Try to find existing record in user's payment history
        const userPaymentQuery = paymentHistoryRef.where('paymentId', '==', paymentId);
        const userPaymentSnapshot = await userPaymentQuery.get();
        
        if (userPaymentSnapshot.empty) {
          // Add new entry to user's payment history
          const historyRef = await paymentHistoryRef.add(paymentHistoryData);
          console.log(`Added payment to user's history with ID: ${historyRef.id}`);
        } else {
          // Update existing entry
          const historyDoc = userPaymentSnapshot.docs[0];
          await historyDoc.ref.update({
            status: status,
            errorMessage: errorMessage || historyDoc.data().errorMessage || '',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`Updated payment in user's history with ID: ${historyDoc.id}`);
        }
      } catch (error) {
        console.error('Error updating user payment history:', error);
        // Continue with the main function even if this part fails
      }
    }
    
    return {
      id: paymentResultId,
      ...paymentData
    };
  } catch (error) {
    console.error('Error updating payment status:', error);
    return null;
  }
};

// Add the new function to the dbService object
dbService.addCreditsToUser = addCreditsToUser;
dbService.updatePaymentStatus = updatePaymentStatus;

module.exports = dbService; 