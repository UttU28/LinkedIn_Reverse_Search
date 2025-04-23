import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, UserCredential, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, getDoc, Timestamp } from "firebase/firestore";

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

    // Backend will handle database operations
    try {
      await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name: fullName,
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
    
    // Backend handles login tracking
    try {
      await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
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
    // Directly use Firestore for user data
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      throw new Error("User data not found");
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Return some default data to prevent UI from breaking
    return {
      name: auth.currentUser?.displayName || "User",
      username: auth.currentUser?.email?.split('@')[0] || "user",
      email: auth.currentUser?.email || "",
      linkCredits: 10,
      totalSearched: 0,
      totalFound: 0
    };
  }
};

export interface UserData {
  name: string;
  username?: string;
  email: string;
  createdAt?: Timestamp;
  lastLogin?: Timestamp;
  linkCredits: number;
  totalSearched: number;
  totalFound: number;
}

// Export required Firebase functions
export { 
  auth, 
  db, 
  onAuthStateChanged, 
  doc, 
  getDoc
};
