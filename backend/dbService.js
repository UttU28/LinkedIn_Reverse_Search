const { db, firebaseInitialized } = require('./firebase');
const { log } = require('./utils');

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
      log('Database service initialized but Firestore is not available');
    }
  }
  
  /**
   * Log a message with a prefix
   * @param {string} message - The message to log
   */
  log(message) {
    log(`[DbService] ${message}`);
  }
  
  /**
   * Log an error message with a prefix
   * @param {string} message - The error message to log
   * @param {Error} error - The error object
   */
  logError(message, error) {
    console.error(`[DbService] ${message}:`, error);
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
   * @returns {Promise<string|null>} - History ID or null if failed
   */
  async addSearchHistory(userId, historyData) {
    try {
      if (!userId) {
        this.log('Cannot add search history: userId is missing');
        return null;
      }
      
      // If db is not available, skip adding history
      if (!this.isAvailable()) {
        this.log('Firestore not available - skipping search history');
        return null;
      }
      
      // Create a reference to the user's searchHistory collection
      const userRef = this.db.collection('users').doc(userId);
      const searchHistoryRef = userRef.collection('searchHistory');
      
      // Add timestamp manually
      const timestamp = new Date();
      
      // Add document with auto-generated ID
      const docRef = await searchHistoryRef.add({
        ...historyData,
        createdAt: timestamp
      });
      
      this.log(`Added search history entry with ID: ${docRef.id} for user: ${userId}`);
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
        this.log(`Cannot update search history: userId or historyId is missing`);
        return false;
      }
      
      // If db is not available, skip updating history
      if (!this.isAvailable()) {
        this.log(`Firestore not available - skipping search history update`);
        return false;
      }
      
      // Create a reference to the user's searchHistory document
      const userRef = this.db.collection('users').doc(userId);
      const historyDocRef = userRef.collection('searchHistory').doc(historyId);
      
      // Update the document
      await historyDocRef.update({
        ...updateData,
        lastUpdated: new Date()
      });
      
      this.log(`Updated search history entry ID: ${historyId} for user: ${userId}`);
      return true;
    } catch (error) {
      this.logError(`Error updating search history`, error);
      return false;
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
        this.log(`Cannot update batch status: userID or historyId is missing`);
        return false;
      }
      
      // Log the update for debugging
      this.log(`Batch Update (${status}): Processed: ${progress?.processed || 0}/${progress?.total || 0}`);
      
      // If database is not initialized, just log the update
      if (!this.isAvailable()) {
        this.log(`Firestore not available - skipping batch status update`);
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
   * @returns {Promise<string|null>} - Result ID or null if failed
   */
  async addSearchResult(userId, historyId, type, searchData, linkedinUrl) {
    try {
      if (!this.isAvailable()) {
        this.log('Firestore not available - skipping search result storage');
        return null;
      }
      
      if (!historyId) {
        this.log('Cannot add search result: historyId is missing');
        return null;
      }
      
      // Create a reference to the searchResults collection
      const searchResultsRef = this.db.collection('searchResults');
      
      // Add document with the search result data
      const docRef = await searchResultsRef.add({
        searchId: historyId,
        userId: userId,
        type: type,
        name: type === 'single' ? searchData.name : searchData.searchName || null,
        company: type === 'single' ? searchData.company : searchData.searchCompany || null,
        title: type === 'single' ? searchData.position : searchData.searchPosition || null,
        linkedin: linkedinUrl || null,
        createdAt: new Date()
      });
      
      this.log(`Added search result with ID: ${docRef.id} for history: ${historyId}`);
      return docRef.id;
    } catch (error) {
      this.logError('Error adding search result', error);
      return null;
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
        credits: userData.credits || 10,
        createdAt: new Date()
      };
      
      // Create user document
      const usersRef = this.db.collection('users');
      const newUserRef = await usersRef.add(userDataWithDefaults);
      
      this.log(`Created user with ID: ${newUserRef.id}`);
      return newUserRef.id;
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
      
      // Map documents to objects
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate() || null
      }));
    } catch (error) {
      this.logError('Error getting search history', error);
      return [];
    }
  }
}

// Create and export a singleton instance
const dbService = new DbService();
module.exports = dbService; 