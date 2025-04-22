const { db, firebaseInitialized } = require('../config/firebase');

/**
 * Creates a new user in the database
 * @param {string} uid - User ID
 * @param {string} email - User email
 * @param {string} fullName - User's full name
 * @param {string} username - User's selected username
 * @returns {Promise} - Promise resolving to the user data
 */
const createUser = async (uid, email, fullName, username) => {
  try {
    // If Firebase is not available, log and return minimal user data
    if (!db || !firebaseInitialized) {
      console.log('Skipping user creation - Firebase not available');
      return { uid, email, fullName, username };
    }

    // Set up user data
    const userData = {
      uid,
      email,
      fullName,
      username,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      creditsUsed: 0,
      totalSearches: 0,
      // Default credit values
      credits: {
        total: 100, // Starting credits
        used: 0,
        remaining: 100
      }
    };

    // Create user document
    await db.collection('users').doc(uid).set(userData);
    console.log(`User created: ${uid}`);
    return userData;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Updates the last login timestamp for a user
 * @param {string} uid - User ID
 * @returns {Promise} - Promise resolving when update is complete
 */
const updateLastLogin = async (uid) => {
  try {
    // If Firebase is not available, just log and return
    if (!db || !firebaseInitialized) {
      console.log('Skipping last login update - Firebase not available');
      return;
    }

    const lastLogin = new Date().toISOString();
    
    // Update user document
    await db.collection('users').doc(uid).update({
      lastLogin
    });
    
    console.log(`Updated last login for user: ${uid}`);
  } catch (error) {
    console.error('Error updating last login:', error);
    // Don't throw the error to avoid disrupting auth flow
    // Just log it and continue
  }
};

/**
 * Updates credit usage for a user
 * @param {string} uid - User ID
 * @param {number} creditsUsed - Number of credits used in this operation
 * @returns {Promise} - Promise resolving to updated credit information
 */
const updateCreditUsage = async (uid, creditsUsed = 1) => {
  try {
    // If Firebase is not available, just log and return mock data
    if (!db || !firebaseInitialized) {
      console.log('Skipping credit update - Firebase not available');
      return {
        creditsUpdated: false,
        creditsRemaining: 100,
        creditsUsed: 0
      };
    }

    // Get current user data
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      console.log(`User ${uid} not found for credit update`);
      return {
        creditsUpdated: false,
        error: 'User not found'
      };
    }
    
    const userData = userDoc.data();
    
    // Calculate new credit values
    const currentCredits = userData.credits || { total: 100, used: 0, remaining: 100 };
    const newUsed = (currentCredits.used || 0) + creditsUsed;
    const newRemaining = Math.max(0, (currentCredits.total || 100) - newUsed);
    const totalSearches = (userData.totalSearches || 0) + 1;
    
    // Update user document
    await db.collection('users').doc(uid).update({
      'credits.used': newUsed,
      'credits.remaining': newRemaining,
      creditsUsed: newUsed,
      totalSearches
    });
    
    console.log(`Updated credits for user ${uid}: remaining=${newRemaining}, used=${newUsed}`);
    
    return {
      creditsUpdated: true,
      creditsRemaining: newRemaining,
      creditsUsed: newUsed
    };
  } catch (error) {
    console.error('Error updating credit usage:', error);
    return {
      creditsUpdated: false,
      error: error.message
    };
  }
};

module.exports = {
  createUser,
  updateLastLogin,
  updateCreditUsage
}; 