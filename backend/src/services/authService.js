const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const userService = require('./userService');
const { admin, firebaseInitialized } = require('../config/firebase');

// Secret for JWT tokens - should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-development';

/**
 * Verifies a Firebase ID token
 * @param {string} token - The Firebase ID token to verify
 * @returns {Promise} - Promise resolving to the decoded token
 */
const verifyFirebaseToken = async (token) => {
  try {
    // If Firebase Admin SDK is not initialized, use a mock verification
    if (!firebaseInitialized || !admin) {
      console.log('Firebase not initialized - using mock verification');
      // In development, simply decode the token without verification
      // This is NOT secure but allows for development without Firebase
      try {
        const decoded = jwt.decode(token);
        return {
          uid: decoded?.uid || 'mock-user-id',
          email: decoded?.email || 'mock@example.com',
          name: decoded?.name || 'Mock User'
        };
      } catch (e) {
        // If we can't even decode, create a mock user
        return {
          uid: 'mock-user-' + uuidv4().slice(0, 8),
          email: 'mock@example.com',
          name: 'Mock User'
        };
      }
    }
    
    // Use Firebase Admin to verify the token
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    throw new Error('Invalid or expired token');
  }
};

/**
 * Creates a session token after successful authentication
 * @param {Object} userData - User data from Firebase
 * @returns {string} - JWT token
 */
const createSessionToken = (userData) => {
  // Create a JWT that expires in 24 hours
  return jwt.sign(
    {
      uid: userData.uid,
      email: userData.email
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

/**
 * Authenticates a user with a Firebase token and creates or updates user data
 * @param {string} token - Firebase ID token
 * @returns {Promise} - Promise resolving to session data
 */
const authenticateUser = async (token) => {
  try {
    // Verify the token with Firebase
    const decodedToken = await verifyFirebaseToken(token);
    
    const { uid, email, name } = decodedToken;
    const fullName = name || decodedToken.displayName || email.split('@')[0];
    const username = decodedToken.username || email.split('@')[0];
    
    // Update the last login timestamp
    await userService.updateLastLogin(uid);
    
    // Create session token
    const sessionToken = createSessionToken({
      uid,
      email,
      fullName
    });
    
    return {
      token: sessionToken,
      user: {
        uid,
        email,
        fullName,
        username
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

/**
 * Creates a new user account
 * @param {string} token - Firebase ID token
 * @param {string} username - User's selected username
 * @returns {Promise} - Promise resolving to session data
 */
const createUserAccount = async (token, username) => {
  try {
    // Verify the token with Firebase
    const decodedToken = await verifyFirebaseToken(token);
    
    const { uid, email, name } = decodedToken;
    const fullName = name || decodedToken.displayName || email.split('@')[0];
    
    // Create user in the database
    const userData = await userService.createUser(uid, email, fullName, username);
    
    // Create session token
    const sessionToken = createSessionToken({
      uid,
      email,
      fullName
    });
    
    return {
      token: sessionToken,
      user: userData
    };
  } catch (error) {
    console.error('Error creating user account:', error);
    throw error;
  }
};

/**
 * Verifies a session token
 * @param {string} token - JWT session token
 * @returns {Promise} - Promise resolving to the decoded token
 */
const verifySessionToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Error verifying session token:', error);
    throw new Error('Invalid or expired session');
  }
};

module.exports = {
  authenticateUser,
  createUserAccount,
  verifySessionToken
}; 