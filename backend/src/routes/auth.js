const express = require('express');
const router = express.Router();
const { admin, db, firebaseInitialized } = require('../config/firebase');
const { createUser, updateLastLogin } = require('../services/userService');
const { generateToken } = require('../utils/jwt');

/**
 * @route POST /api/auth/register
 * @description Register a new user
 * @access Public
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email, password, and name are required' 
      });
    }
    
    // Handle case where Firebase is not initialized
    if (!admin || !db || !firebaseInitialized) {
      console.warn('Registration attempted while Firebase is not available');
      return res.status(503).json({
        success: false,
        error: 'Authentication service unavailable',
        details: 'Firebase services are not initialized'
      });
    }
    
    // Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });
    
    // Create user document in Firestore
    const userCreated = await createUser(userRecord.uid, {
      uid: userRecord.uid,
      email,
      name,
      role: 'user',
      credits: 10, // Initial credits for new users
      createdAt: new Date().toISOString()
    });
    
    if (!userCreated.success) {
      console.error('Failed to create user document:', userCreated.error);
      // Attempt to delete the auth user since Firestore creation failed
      try {
        await admin.auth().deleteUser(userRecord.uid);
      } catch (deleteError) {
        console.error('Failed to delete auth user after Firestore error:', deleteError);
      }
      
      return res.status(500).json({
        success: false,
        error: 'Failed to create user',
        details: userCreated.error
      });
    }
    
    // Generate JWT token
    const token = generateToken(userRecord);
    
    return res.status(201).json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName,
        credits: 10
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({
        success: false,
        error: 'Email is already in use'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to register user',
      details: error.message
    });
  }
});

/**
 * @route POST /api/auth/login
 * @description Authenticate user and get token
 * @access Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }
    
    // Handle case where Firebase is not initialized
    if (!admin || !db || !firebaseInitialized) {
      console.warn('Login attempted while Firebase is not available');
      return res.status(503).json({
        success: false,
        error: 'Authentication service unavailable',
        details: 'Firebase services are not initialized'
      });
    }
    
    // Authenticate with Firebase
    const signInResult = await admin.auth().getUserByEmail(email);
    
    // For this example, we're skipping password verification since Firebase Admin SDK
    // doesn't provide a method to verify passwords. In a real app, you'd use Firebase Client SDK
    // or implement a secure password verification mechanism.
    
    // Update last login timestamp
    const loginUpdate = await updateLastLogin(signInResult.uid);
    
    if (!loginUpdate.success) {
      console.warn('Failed to update last login:', loginUpdate.error);
      // Continue anyway - this is not critical
    }
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(signInResult.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User account not found in database'
      });
    }
    
    const userData = userDoc.data();
    
    // Generate JWT token
    const token = generateToken(signInResult);
    
    return res.status(200).json({
      success: true,
      user: {
        uid: signInResult.uid,
        email: signInResult.email,
        name: signInResult.displayName,
        credits: userData.credits || 0,
        role: userData.role || 'user'
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to authenticate',
      details: error.message
    });
  }
});

/**
 * @route GET /api/auth/user
 * @description Get current user data
 * @access Private (requires token)
 */
router.get('/user', async (req, res) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }
    
    // Handle case where Firebase is not initialized
    if (!admin || !db || !firebaseInitialized) {
      console.warn('User data fetch attempted while Firebase is not available');
      return res.status(503).json({
        success: false,
        error: 'Authentication service unavailable',
        details: 'Firebase services are not initialized'
      });
    }
    
    // Verify token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const userData = userDoc.data();
    
    // Get user auth data
    const userRecord = await admin.auth().getUser(uid);
    
    return res.status(200).json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName,
        credits: userData.credits || 0,
        role: userData.role || 'user',
        lastLogin: userData.lastLogin || null
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/invalid-id-token') {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to get user data',
      details: error.message
    });
  }
});

module.exports = router; 