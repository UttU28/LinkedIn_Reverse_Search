const express = require('express');
const router = express.Router();
const { db, firebaseInitialized } = require('../config/firebase');
const { updateCreditUsage } = require('../services/userService');
const { fetchLinkedInProfile } = require('../services/linkedinService');
const { isAuthenticated } = require('../middleware/auth');

/**
 * @route POST /api/search
 * @description Search for a user by email, name, or company
 * @access Private
 */
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { query, type } = req.body;
    const userId = req.user.uid;
    
    if (!query || !type) {
      return res.status(400).json({ success: false, error: 'Missing search parameters' });
    }
    
    // Handle case where Firebase is not initialized
    if (!db || !firebaseInitialized) {
      console.warn('Search attempted while Firebase is not available');
      return res.status(200).json({
        success: true,
        results: [],
        message: 'Firebase database not available - returning empty results',
        creditsRemaining: 100
      });
    }
    
    // Update credit usage for this search
    const creditUpdate = await updateCreditUsage(userId);
    
    if (!creditUpdate.creditsUpdated) {
      return res.status(400).json({ 
        success: false, 
        error: 'Could not update credits',
        details: creditUpdate.error
      });
    }
    
    if (creditUpdate.creditsRemaining <= 0) {
      return res.status(403).json({ 
        success: false, 
        error: 'No credits remaining. Please upgrade your account.',
        creditsRemaining: 0
      });
    }
    
    // Perform search based on type
    let results = [];
    
    switch (type) {
      case 'email':
        // Search for exact email match
        const emailSnapshot = await db.collection('linkedinProfiles')
          .where('email', '==', query.toLowerCase())
          .limit(10)
          .get();
          
        results = emailSnapshot.docs.map(doc => doc.data());
        break;
        
      case 'name':
        // Search for name containing the query
        const nameSnapshot = await db.collection('linkedinProfiles')
          .where('nameLowercase', '>=', query.toLowerCase())
          .where('nameLowercase', '<=', query.toLowerCase() + '\uf8ff')
          .limit(10)
          .get();
          
        results = nameSnapshot.docs.map(doc => doc.data());
        break;
        
      case 'company':
        // Search for current company containing the query
        const companySnapshot = await db.collection('linkedinProfiles')
          .where('currentCompanyLowercase', '>=', query.toLowerCase())
          .where('currentCompanyLowercase', '<=', query.toLowerCase() + '\uf8ff')
          .limit(10)
          .get();
          
        results = companySnapshot.docs.map(doc => doc.data());
        break;
        
      default:
        return res.status(400).json({ success: false, error: 'Invalid search type' });
    }
    
    return res.status(200).json({
      success: true,
      results,
      creditsRemaining: creditUpdate.creditsRemaining
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ success: false, error: 'Server error during search' });
  }
});

/**
 * @route POST /api/search/linkedin
 * @description Search LinkedIn directly for a profile
 * @access Private
 */
router.post('/linkedin', isAuthenticated, async (req, res) => {
  try {
    const { profileUrl } = req.body;
    const userId = req.user.uid;
    
    if (!profileUrl) {
      return res.status(400).json({ success: false, error: 'Missing LinkedIn profile URL' });
    }
    
    // Handle case where Firebase is not initialized
    if (!db || !firebaseInitialized) {
      console.warn('LinkedIn search attempted while Firebase is not available');
      return res.status(200).json({
        success: true,
        profile: null,
        message: 'Firebase database not available',
        creditsRemaining: 100
      });
    }
    
    // Update credit usage for this search (more expensive than regular search)
    const creditUpdate = await updateCreditUsage(userId, 3);
    
    if (!creditUpdate.creditsUpdated) {
      return res.status(400).json({ 
        success: false, 
        error: 'Could not update credits',
        details: creditUpdate.error
      });
    }
    
    if (creditUpdate.creditsRemaining <= 0) {
      return res.status(403).json({ 
        success: false, 
        error: 'No credits remaining. Please upgrade your account.',
        creditsRemaining: 0
      });
    }
    
    // Try to fetch LinkedIn profile
    const profile = await fetchLinkedInProfile(profileUrl);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Could not fetch LinkedIn profile',
        creditsRemaining: creditUpdate.creditsRemaining
      });
    }
    
    // Save the profile to our database
    if (profile.email) {
      // Only save if we got an email
      await db.collection('linkedinProfiles').doc(profile.linkedinId).set({
        ...profile,
        nameLowercase: profile.name.toLowerCase(),
        currentCompanyLowercase: profile.currentCompany ? profile.currentCompany.toLowerCase() : '',
        fetchedAt: new Date().toISOString()
      });
    }
    
    return res.status(200).json({
      success: true,
      profile,
      creditsRemaining: creditUpdate.creditsRemaining
    });
  } catch (error) {
    console.error('LinkedIn search error:', error);
    return res.status(500).json({ success: false, error: 'Server error during LinkedIn search' });
  }
});

// Get search history for a user
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // Mock history for when Firebase is not initialized
    if (!firebaseInitialized) {
      console.warn('Firebase not initialized. Returning mock search history');
      return res.json({
        success: true,
        message: 'Mock search history (Firebase not initialized)',
        history: [
          {
            id: 'mock-search-1',
            query: 'software engineer',
            timestamp: new Date().toISOString(),
            resultCount: 25
          },
          {
            id: 'mock-search-2',
            query: 'product manager',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            resultCount: 15
          }
        ]
      });
    }

    // Get user's search history
    const historyRef = db.collection('searchHistory');
    const snapshot = await historyRef.where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();
    
    if (snapshot.empty) {
      return res.json({
        success: true,
        history: []
      });
    }
    
    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Get search history error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router; 