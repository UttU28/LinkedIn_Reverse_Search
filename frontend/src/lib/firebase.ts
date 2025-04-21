import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, UserCredential, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp, Timestamp, collection, addDoc } from "firebase/firestore";

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

// Auth functions
export const registerUser = async (
  email: string,
  password: string,
  fullName: string,
  username: string,
): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with display name
    await updateProfile(userCredential.user, {
      displayName: fullName,
    });

    // Create user document in Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      name: fullName,
      username: username,
      email: email,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      linkCredits: 50,
      totalSearched: 0,
      totalFound: 0
    });

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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Update last login timestamp
    await updateDoc(doc(db, "users", userCredential.user.uid), {
      lastLogin: serverTimestamp()
    });
    
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

// Export all the Firebase functions needed
export { auth, db, onAuthStateChanged, collection, addDoc, serverTimestamp, doc, setDoc };
