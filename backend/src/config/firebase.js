const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

// Development mode flag
const DEV_MODE = process.env.NODE_ENV !== 'production';

// Mock Firebase admin for development if no service account is available
if (DEV_MODE) {
  console.log('Running in development mode with mock Firebase Admin');
  
  // Create a mock Firebase Admin interface
  const mockDb = {
    collection: (name) => ({
      doc: (id) => ({
        set: async (data) => console.log(`[MOCK] Creating ${name} document for ${id}:`, data),
        update: async (data) => console.log(`[MOCK] Updating ${name} document for ${id}:`, data),
        get: async () => ({
          exists: true,
          data: () => ({
            name: 'Mock User',
            username: 'mockuser',
            email: 'mock@example.com',
            createdAt: new Date(),
            lastLogin: new Date(),
            linkCredits: 50,
            totalSearched: 0,
            totalFound: 0
          })
        })
      })
    })
  };
  
  const mockAuth = {
    // Mock auth methods here if needed
  };
  
  module.exports = { 
    admin: { 
      apps: [{}] // Pretend initialized
    }, 
    db: mockDb, 
    auth: mockAuth 
  };
  
} else {
  // Production mode - use real Firebase Admin SDK
  try {
    // Try to load from file if it exists
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
    const serviceAccount = require(path.resolve(serviceAccountPath));
    
    // Initialize Firebase Admin
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
      });
    }
    
    const db = admin.firestore();
    const auth = admin.auth();
    
    module.exports = { admin, db, auth };
    
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
} 