const { db } = require('../config/firebase');

/**
 * Create a new user in Firestore
 */
async function createUser(userData) {
  try {
    const { uid, email, fullName, username } = userData;
    
    const userRef = db.collection('users').doc(uid);
    
    await userRef.set({
      name: fullName,
      username: username,
      email: email,
      createdAt: new Date(),
      lastLogin: new Date(),
      linkCredits: 50,
      totalSearched: 0,
      totalFound: 0
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error creating user in Firestore:', error);
    throw error;
  }
}

/**
 * Update user's last login timestamp
 */
async function updateLastLogin(uid) {
  try {
    const userRef = db.collection('users').doc(uid);
    
    await userRef.update({
      lastLogin: new Date()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating last login:', error);
    throw error;
  }
}

/**
 * Update user's credit usage
 */
async function updateCreditUsage(uid, creditsUsed, resultsFound) {
  try {
    const userRef = db.collection('users').doc(uid);
    
    // Get current user data
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    
    // Update credits and stats
    await userRef.update({
      linkCredits: userData.linkCredits - creditsUsed,
      totalSearched: userData.totalSearched + creditsUsed,
      totalFound: userData.totalFound + resultsFound
    });
    
    return { 
      success: true,
      linkCredits: userData.linkCredits - creditsUsed,
      totalSearched: userData.totalSearched + creditsUsed,
      totalFound: userData.totalFound + resultsFound
    };
  } catch (error) {
    console.error('Error updating credit usage:', error);
    throw error;
  }
}

module.exports = {
  createUser,
  updateLastLogin,
  updateCreditUsage
}; 