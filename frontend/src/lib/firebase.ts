import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, UserCredential, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, getDoc, Timestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:9221";

export const registerUser = async (
  email: string,
  password: string,
  fullName: string,
): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    await updateProfile(userCredential.user, {
      displayName: fullName,
    });

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
          uid: userCredential.user.uid,
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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
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
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      throw new Error("User data not found");
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    return {
      name: auth.currentUser?.displayName || "User",
      email: auth.currentUser?.email || "",
      linkCredits: 10,
      totalSearched: 0,
      totalFound: 0
    };
  }
};

export interface UserData {
  name: string;
  email: string;
  createdAt?: Timestamp;
  lastLogin?: Timestamp;
  linkCredits: number;
  totalSearched: number;
  totalFound: number;
  includeCompanyLinks?: boolean;
}

export { 
  auth, 
  db, 
  onAuthStateChanged, 
  doc, 
  getDoc
};
