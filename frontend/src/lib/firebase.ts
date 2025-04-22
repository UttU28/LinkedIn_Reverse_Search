import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, UserCredential, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, Timestamp, collection, addDoc, serverTimestamp, updateDoc, setDoc, getDocs, query, orderBy, limit } from "firebase/firestore";

// Fallback to hardcoded values if environment variables aren't available
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAm371QG8npgLnw3wZtIuL537X9HT7vPyo",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "link-it-up-bac0d"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "link-it-up-bac0d",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "link-it-up-bac0d"}.firebasestorage.googleapis.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "600724348351",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:600724348351:web:381de9ee8873f93a24150a"
};

// Log the config being used (excluding sensitive values)
console.log("Firebase initialized with project:", firebaseConfig.projectId);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Backend API url
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Auth functions
export const registerUser = async (
  email: string,
  password: string,
  fullName: string,
  username: string,
): Promise<UserCredential> => {
  try {
    // Handle Firebase authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with display name
    await updateProfile(userCredential.user, {
      displayName: fullName,
    });

    // Try to create a user document in Firestore directly as well
    // This is just for development - in production the backend would handle this
    try {
      const userRef = doc(db, "users", userCredential.user.uid);
      await setDoc(userRef, {
        name: fullName,
        username: username,
        email: email,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        linkCredits: 50,
        totalSearched: 0,
        totalFound: 0
      });
      console.log("Dev mode: Created user document in Firestore");
    } catch (firestoreError) {
      console.warn("Could not create user document in Firestore directly. This is expected in production:", firestoreError);
    }

    // Backend will handle database operations (this will work in production)
    try {
      await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: userCredential.user.uid,
          email,
          fullName,
          username,
        }),
      });
    } catch (backendError) {
      console.warn("Could not communicate with backend API:", backendError);
    }

    return userCredential;
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (
  email: string,
  password: string,
): Promise<UserCredential> => {
  try {
    // Handle Firebase authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Create a last login update in Firestore directly
    // This is just for development - in production the backend would handle this
    try {
      const userRef = doc(db, "users", userCredential.user.uid);
      const docSnap = await getDoc(userRef);
      
      if (!docSnap.exists()) {
        // If the user document doesn't exist, create it
        await setDoc(userRef, {
          name: userCredential.user.displayName || 'User',
          username: email.split('@')[0],
          email: userCredential.user.email || email,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          linkCredits: 50,
          totalSearched: 0,
          totalFound: 0
        });
        console.log("Dev mode: Created missing user document during login");
      } else {
        // Otherwise just update the last login
        await updateDoc(userRef, {
          lastLogin: serverTimestamp()
        });
        console.log("Dev mode: Updated last login in Firestore");
      }
    } catch (firestoreError) {
      console.warn("Could not update last login in Firestore directly. This is expected in production:", firestoreError);
    }
    
    // Backend will handle updating login timestamp (this will work in production)
    try {
      await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: userCredential.user.uid,
          email,
        }),
      });
    } catch (backendError) {
      console.warn("Could not communicate with backend API:", backendError);
    }
    
    return userCredential;
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export const getUserData = async (userId: string) => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      throw new Error("User data not found");
    }
  } catch (error) {
    throw error;
  }
};

export interface UserData {
  name: string;
  username: string;
  email: string;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  linkCredits: number;
  totalSearched: number;
  totalFound: number;
}

// Export all required Firebase functions
// Note: These are for READ-ONLY operations from the frontend
// All write operations should go through the backend API
export { 
  auth, 
  db, 
  onAuthStateChanged, 
  doc, 
  getDoc,
  // Re-add these exports for component compatibility
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit
};
