const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let firebaseInitialized = false;
let db = null;

try {
  // Try to load service account file
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
                            path.join(__dirname, './firebaseServiceAccountKey.json');
  
  console.log(`Attempting to load Firebase service account from: ${serviceAccountPath}`);
  
  let serviceAccount;
  
  // Check if service account file exists
  if (fs.existsSync(serviceAccountPath)) {
    try {
      serviceAccount = require(serviceAccountPath);
      console.log('Firebase service account file loaded successfully');
    } catch (fileError) {
      console.error('Error loading Firebase service account file:', fileError.message);
    }
  } else {
    console.warn(`Firebase service account file not found at ${serviceAccountPath}`);
  }
  
  // If we have a service account, initialize with it
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseInitialized = true;
    console.log('Firebase initialized with service account');
  } 
  // If we have environment variables for Firebase, use those
  else if (process.env.FIREBASE_PROJECT_ID && 
           process.env.FIREBASE_PRIVATE_KEY && 
           process.env.FIREBASE_CLIENT_EMAIL) {
    
    // Fix private key if it's a string with escaped newlines
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
      })
    });
    firebaseInitialized = true;
    console.log('Firebase initialized with environment variables');
  } 
  else {
    console.error('No Firebase credentials available. Cannot initialize Firebase.');
    firebaseInitialized = false;
  }
  
  if (firebaseInitialized) {
    try {
      db = admin.firestore();
      console.log('Firestore database initialized successfully');
    } catch (firestoreError) {
      console.error('Failed to initialize Firestore:', firestoreError);
      db = null;
      firebaseInitialized = false;
    }
  } else {
    console.warn('Firestore database was not initialized');
  }
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  firebaseInitialized = false;
}

// Export the database instance and status
module.exports = {
  admin: firebaseInitialized ? admin : null,
  db,
  firebaseInitialized
}; 