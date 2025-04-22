const express = require('express');
const router = express.Router();
const { db, firebaseInitialized } = require('../config/firebase');

// Get user profile by ID
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    
    // Return mock user data if Firebase is not initialized
    if (!firebaseInitialized) {
      console.warn('Firebase not initialized. Returning mock user data');
      return res.json({
        success: true,
        message: 'Mock user data (Firebase not initialized)',
        user: {
          id: userId,
          email: 'mock@example.com',
          name: 'Mock User',
          credits: 50,
          plan: 'free',
          createdAt: new Date().toISOString()
        }
      });
    }
    
    // Get user from database
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    res.json({
      success: true,
      user: {
        id: userDoc.id,
        ...userData
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update user details
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    
    // Return mock success if Firebase is not initialized
    if (!firebaseInitialized) {
      console.warn('Firebase not initialized. Returning mock update success');
      return res.json({
        success: true,
        message: 'Mock user update (Firebase not initialized)',
        user: {
          id: userId,
          ...updateData,
          updatedAt: new Date().toISOString()
        }
      });
    }
    
    // Remove any fields that should not be updated directly
    const sanitizedData = { ...updateData };
    delete sanitizedData.credits;
    delete sanitizedData.role;
    delete sanitizedData.createdAt;
    
    // Update the user in the database
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    await userRef.update({
      ...sanitizedData,
      updatedAt: new Date().toISOString()
    });
    
    // Get the updated user data
    const updatedUserDoc = await userRef.get();
    const updatedUserData = updatedUserDoc.data();
    
    res.json({
      success: true,
      user: {
        id: updatedUserDoc.id,
        ...updatedUserData
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Add credits to user account
router.post('/:userId/credits', async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, paymentId } = req.body;
    
    if (!userId || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and credit amount are required' 
      });
    }
    
    // Return mock success if Firebase is not initialized
    if (!firebaseInitialized) {
      console.warn('Firebase not initialized. Returning mock credits addition');
      return res.json({
        success: true,
        message: 'Mock credits added (Firebase not initialized)',
        credits: {
          added: amount,
          total: 50 + parseInt(amount),
          transaction: paymentId || 'mock-transaction-id'
        }
      });
    }
    
    // Update the user's credits in the database
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const userData = userDoc.data();
    const currentCredits = userData.credits || 0;
    const newCredits = currentCredits + parseInt(amount);
    
    // Update the user's credits
    await userRef.update({
      credits: newCredits,
      updatedAt: new Date().toISOString()
    });
    
    // Record the transaction
    await db.collection('transactions').add({
      userId,
      amount,
      type: 'credit',
      paymentId: paymentId || null,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      credits: {
        added: parseInt(amount),
        total: newCredits,
        transaction: paymentId || null
      }
    });
  } catch (error) {
    console.error('Add credits error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router; 