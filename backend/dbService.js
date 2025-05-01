const { db, firebaseInitialized } = require('./firebase');
const { log } = require('./utils');
const admin = require('firebase-admin');

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
      
      // Convert resultIds to resultKeys if present
      if (historyData.resultIds && !historyData.resultKeys) {
        historyData.resultKeys = historyData.resultIds;
        delete historyData.resultIds;
      }
      
      // Initialize empty resultKeys array if not present
      if (!historyData.resultKeys) {
        historyData.resultKeys = [];
      }
      
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
      
      // Handle special case for resultKeys array
      if (updateData.resultKeys && updateData.resultKeys.__proto__.constructor.name === 'FieldValue') {
        // This is a FieldValue.arrayUnion operation, so we apply it directly
        await historyDocRef.update({
          resultKeys: updateData.resultKeys
        });
        
        // Remove from updateData to prevent duplicate update
        delete updateData.resultKeys;
      }
      
      // Only update if there's data remaining to update
      if (Object.keys(updateData).length > 0) {
        // Convert legacy resultIds to resultKeys if present
        if (updateData.resultIds && !updateData.resultKeys) {
          updateData.resultKeys = updateData.resultIds;
          delete updateData.resultIds;
        }
        
        // Update the document
        await historyDocRef.update(updateData);
      }
      
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
      
      // Update search history with status
      const updatePayload = {
        status: historyStatus,
        completedAt: status === 'completed' || status === 'failed' ? new Date() : null,
        resultsCount: progress?.successful || 0
      };
      
      // Update search history
      await this.updateSearchHistory(userID, historyId, updatePayload);
      
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
   * @returns {Promise<string|null>} - Result searchKey or null if failed
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
      
      // Map the data based on the type and format expected
      const name = type === 'single' ? searchData.name : (searchData.searchName || searchData.name);
      const company = type === 'single' ? searchData.company : (searchData.searchCompany || searchData.company);
      const position = type === 'single' ? searchData.position : (searchData.searchPosition || searchData.position);
      
      // Create normalized fields for indexing and lookups - only use name and company
      const nameNormalized = name.toLowerCase().trim();
      const companyNormalized = company.toLowerCase().trim();
      
      // Create a composite search key using only name and company for more consistent matching
      const searchKey = `${nameNormalized}-${companyNormalized}`;
      
      // Log what we're storing
      this.log(`Storing result - Name: ${name}, Company: ${company}, Position: ${position}, SearchKey: ${searchKey}`);
      
      // Check if document already exists
      const docRef = searchResultsRef.doc(searchKey);
      const doc = await docRef.get();
      
      if (doc.exists) {
        // Document exists, update access stats only
        await docRef.update({
          accessCount: admin.firestore.FieldValue.increment(1),
          lastAccessed: new Date()
        });
        
        // Add this search to the user's search history reference
        await this.updateSearchHistory(userId, historyId, {
          resultKeys: admin.firestore.FieldValue.arrayUnion(searchKey)
        });
        
        this.log(`Updated existing search result with key: ${searchKey}`);
        return searchKey;
      }
      
      // Prepare the data in the requested format with flattened structure
      const resultData = {
        type: type,
        name: name,
        company: company,
        position: position,
        linkedinUrl: linkedinUrl || null,
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 1
      };
      
      // Debug log to see what we're trying to store
      console.log('Storing search result:', JSON.stringify(resultData, null, 2));
      
      // Set document with searchKey as the document ID
      await docRef.set(resultData);
      
      // Add this search to the user's search history reference
      await this.updateSearchHistory(userId, historyId, {
        resultKeys: admin.firestore.FieldValue.arrayUnion(searchKey)
      });
      
      this.log(`Added search result with key: ${searchKey} for history: ${historyId}`);
      return searchKey;
    } catch (error) {
      this.logError('Error adding search result', error);
      return null;
    }
  }
  
  /**
   * Find existing search result
   * @param {string} name - Person's name
   * @param {string} company - Company name
   * @param {string} position - Position/title
   * @returns {Promise<object|null>} - Existing result or null if not found
   */
  async findExistingSearchResult(name, company, position) {
    try {
      if (!this.isAvailable()) {
        this.log('Firestore not available - cannot check for existing results');
        return null;
      }
      
      // Normalize inputs for consistent searching - only use name and company
      const nameNormalized = name.toLowerCase().trim();
      const companyNormalized = company.toLowerCase().trim();
      
      // Create search key without position for more flexible matching
      const searchKey = `${nameNormalized}-${companyNormalized}`;
      
      // Get document directly by searchKey (used as document ID)
      const searchResultsRef = this.db.collection('searchResults');
      const docRef = searchResultsRef.doc(searchKey);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        this.log(`No existing search result found for ${name} at ${company}`);
        return null;
      }
      
      const resultData = doc.data();
      
      // Update usage statistics atomically
      await docRef.update({
        accessCount: admin.firestore.FieldValue.increment(1),
        lastAccessed: new Date()
      });
      
      this.log(`Found existing search result for ${name} at ${company}: ${resultData.linkedinUrl || 'Not found'}`);
      
      return {
        id: doc.id,
        ...resultData,
        createdAt: resultData.createdAt?.toDate() || new Date()
      };
    } catch (error) {
      this.logError('Error finding existing search result', error);
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

  /**
   * Find similar search results
   * @param {string} name - Person's name
   * @param {string} company - Company name
   * @param {string} position - Position/title (optional)
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<Array<object>>} - Array of similar results
   */
  async findSimilarSearchResults(name, company, position = "", limit = 5) {
    try {
      if (!this.isAvailable()) {
        this.log('Firestore not available - cannot search for similar results');
        return [];
      }
      
      // Normalize inputs for consistent searching
      const nameNormalized = name.toLowerCase().trim();
      const companyNormalized = company.toLowerCase().trim();
      
      // Query searchResults collection for direct company match
      const searchResultsRef = this.db.collection('searchResults');
      
      // First look for exact match results with single type
      let query = searchResultsRef.where('type', '==', 'single')
                                 .where('company', '==', company)
                                 .limit(limit);
      
      let snapshot = await query.get();
      
      // If no results with company, try with name
      if (snapshot.empty) {
        query = searchResultsRef.where('type', '==', 'single')
                               .where('name', '==', name)
                               .limit(limit);
        snapshot = await query.get();
      }
      
      // If still no results, return empty array
      if (snapshot.empty) {
        this.log(`No similar search results found for ${name} or ${company}`);
        return [];
      }
      
      // Map documents to objects
      const results = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Unknown',
          company: data.company || 'Unknown',
          position: data.position || '',
          linkedinUrl: data.linkedinUrl || null,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      });
      
      this.log(`Found ${results.length} similar search results for ${name} at ${company}`);
      return results;
    } catch (error) {
      this.logError('Error finding similar search results', error);
      return [];
    }
  }

  /**
   * Find existing company leads
   * @param {string} company - Company name
   * @param {string} positionType - Position type (recruitment, investment, etc.)
   * @returns {Promise<object|null>} - Existing result or null if not found
   */
  async findExistingCompanyLeads(company, positionType) {
    try {
      if (!this.isAvailable()) {
        this.log('Firestore not available - cannot check for existing leads');
        return null;
      }
      
      // Normalize inputs for consistent searching
      const companyNormalized = company.toLowerCase().trim();
      const positionTypeNormalized = positionType.toLowerCase().trim();
      
      // Create search key
      const searchKey = `leads-${companyNormalized}-${positionTypeNormalized}`;
      
      // Get document directly by searchKey
      const searchResultsRef = this.db.collection('searchResults');
      const docRef = searchResultsRef.doc(searchKey);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        this.log(`No existing leads found for ${company} (${positionType})`);
        return null;
      }
      
      const resultData = doc.data();
      
      // Update usage statistics
      await docRef.update({
        accessCount: admin.firestore.FieldValue.increment(1),
        lastAccessed: new Date()
      });
      
      this.log(`Found existing leads for ${company} (${positionType}): ${resultData.leads?.length || 0} leads`);
      
      return {
        id: doc.id,
        ...resultData,
        createdAt: resultData.createdAt?.toDate() || new Date()
      };
    } catch (error) {
      this.logError('Error finding existing leads', error);
      return null;
    }
  }

  /**
   * Find existing team members for a company website
   * @param {string} companyUrl - Company website URL
   * @returns {Promise<object|null>} - Existing result or null if not found
   */
  async findExistingTeamMembers(companyUrl) {
    try {
      if (!this.isAvailable()) {
        this.log('Firestore not available - cannot check for existing team members');
        return null;
      }
      
      // Normalize URL by removing protocol, www, and trailing slashes
      let normalizedUrl = companyUrl.toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '');
      
      // Create search key
      const searchKey = `team-${normalizedUrl}`;
      
      // Get document directly by searchKey
      const searchResultsRef = this.db.collection('searchResults');
      const docRef = searchResultsRef.doc(searchKey);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        this.log(`No existing team members found for ${companyUrl}`);
        return null;
      }
      
      const resultData = doc.data();
      
      // Update usage statistics
      await docRef.update({
        accessCount: admin.firestore.FieldValue.increment(1),
        lastAccessed: new Date()
      });
      
      this.log(`Found existing team members for ${companyUrl}: ${resultData.members?.length || 0} members`);
      
      return {
        id: doc.id,
        ...resultData,
        createdAt: resultData.createdAt?.toDate() || new Date()
      };
    } catch (error) {
      this.logError('Error finding existing team members', error);
      return null;
    }
  }

  /**
   * Add company leads to search results
   * @param {string} userId - User ID
   * @param {string} historyId - Search history ID
   * @param {string} company - Company name
   * @param {string} positionType - Position type
   * @param {Array<object>} leads - Array of lead objects
   * @returns {Promise<string|null>} - Result searchKey or null if failed
   */
  async addCompanyLeads(userId, historyId, company, positionType, leads) {
    try {
      if (!this.isAvailable()) {
        this.log('Firestore not available - skipping company leads storage');
        return null;
      }
      
      if (!historyId) {
        this.log('Cannot add company leads: historyId is missing');
        return null;
      }
      
      // Create a reference to the searchResults collection
      const searchResultsRef = this.db.collection('searchResults');
      
      // Normalize inputs for consistent searching
      const companyNormalized = company.toLowerCase().trim();
      const positionTypeNormalized = positionType.toLowerCase().trim();
      
      // Create a composite search key
      const searchKey = `leads-${companyNormalized}-${positionTypeNormalized}`;
      
      // Log what we're storing
      this.log(`Storing leads - Company: ${company}, Position Type: ${positionType}, Leads: ${leads.length}`);
      
      // Check if document already exists
      const docRef = searchResultsRef.doc(searchKey);
      const doc = await docRef.get();
      
      if (doc.exists) {
        // Document exists, update access stats only
        await docRef.update({
          accessCount: admin.firestore.FieldValue.increment(1),
          lastAccessed: new Date()
        });
        
        // Add this search to the user's search history reference
        await this.updateSearchHistory(userId, historyId, {
          resultKeys: admin.firestore.FieldValue.arrayUnion(searchKey)
        });
        
        this.log(`Updated existing company leads with key: ${searchKey}`);
        return searchKey;
      }
      
      // Prepare the data
      const resultData = {
        type: 'leads',
        company: company,
        position: positionType,
        leads: leads,
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 1
      };
      
      // Add document with the search result data using the search key as ID
      await docRef.set(resultData);
      
      // Add this search to the user's search history reference
      await this.updateSearchHistory(userId, historyId, {
        resultKeys: admin.firestore.FieldValue.arrayUnion(searchKey)
      });
      
      this.log(`Added company leads with key: ${searchKey} for history: ${historyId}`);
      return searchKey;
    } catch (error) {
      this.logError('Error adding company leads', error);
      return null;
    }
  }

  /**
   * Add team members to search results
   * @param {string} userId - User ID
   * @param {string} historyId - Search history ID
   * @param {string} companyUrl - Company URL
   * @param {Array<object>} members - Array of team member objects
   * @returns {Promise<string|null>} - Result searchKey or null if failed
   */
  async addTeamMembers(userId, historyId, companyUrl, members) {
    try {
      if (!this.isAvailable()) {
        this.log('Firestore not available - skipping team members storage');
        return null;
      }
      
      if (!historyId) {
        this.log('Cannot add team members: historyId is missing');
        return null;
      }
      
      // Create a reference to the searchResults collection
      const searchResultsRef = this.db.collection('searchResults');
      
      // Normalize URL by removing protocol, www, and trailing slashes
      let normalizedUrl = companyUrl.toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '');
      
      // Create a composite search key
      const searchKey = `team-${normalizedUrl}`;
      
      // Log what we're storing
      this.log(`Storing team members - URL: ${companyUrl}, Members: ${members.length}`);
      
      // Check if document already exists
      const docRef = searchResultsRef.doc(searchKey);
      const doc = await docRef.get();
      
      if (doc.exists) {
        // Document exists, update access stats only
        await docRef.update({
          accessCount: admin.firestore.FieldValue.increment(1),
          lastAccessed: new Date()
        });
        
        // Add this search to the user's search history reference
        await this.updateSearchHistory(userId, historyId, {
          resultKeys: admin.firestore.FieldValue.arrayUnion(searchKey)
        });
        
        this.log(`Updated existing team members with key: ${searchKey}`);
        return searchKey;
      }
      
      // Prepare the data
      const resultData = {
        type: 'team',
        company: companyUrl,  // Store the URL in the company field
        members: members,
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 1
      };
      
      // Add document with the search result data using the search key as ID
      await docRef.set(resultData);
      
      // Add this search to the user's search history reference
      await this.updateSearchHistory(userId, historyId, {
        resultKeys: admin.firestore.FieldValue.arrayUnion(searchKey)
      });
      
      this.log(`Added team members with key: ${searchKey} for history: ${historyId}`);
      return searchKey;
    } catch (error) {
      this.logError('Error adding team members', error);
      return null;
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