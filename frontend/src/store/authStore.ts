import { create } from 'zustand';
import { auth, db, getUserData, UserData } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, updateDoc, increment } from 'firebase/firestore';

interface AuthState {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  fetchUserData: () => Promise<void>;
  updateCreditUsage: (creditsUsed: number, resultsFound: number) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userData: null,
  loading: true,
  error: null,
  initialized: false,
  
  fetchUserData: async () => {
    console.log("Fetching user data called");
    const { user } = get();
    if (!user) {
      console.log("No user found in store, setting userData to null");
      set({ userData: null });
      return;
    }
    
    try {
      console.log("User found, fetching data for:", user.uid);
      set({ loading: true, error: null });
      const userData = await getUserData(user.uid) as UserData;
      console.log("User data fetched:", userData);
      set({ userData, loading: false });
    } catch (error) {
      console.error("Error fetching user data:", error);
      set({ error: "Failed to load user data.", loading: false });
    }
  },
  
  updateCreditUsage: async (creditsUsed: number, resultsFound: number) => {
    const { user, userData } = get();
    if (!user || !userData) return;
    
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        linkCredits: increment(-creditsUsed),
        totalSearched: increment(creditsUsed),
        totalFound: increment(resultsFound)
      });
      
      // Update local state
      set({
        userData: {
          ...userData,
          linkCredits: userData.linkCredits - creditsUsed,
          totalSearched: userData.totalSearched + creditsUsed,
          totalFound: userData.totalFound + resultsFound
        }
      });
    } catch (error) {
      console.error("Error updating credit usage:", error);
      set({ error: "Failed to update credit usage." });
    }
  }
}));

// Set up auth state listener
onAuthStateChanged(auth, async (user) => {
  console.log("Auth state changed:", user ? "User logged in" : "No user");
  const state = useAuthStore.getState();
  
  if (user) {
    console.log("Setting user in store and fetching user data");
    useAuthStore.setState({ user, loading: true });
    try {
      await state.fetchUserData();
      console.log("User data fetched successfully");
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      useAuthStore.setState({ loading: false });
    }
  } else {
    console.log("Setting user to null in store");
    useAuthStore.setState({ user: null, userData: null, loading: false });
  }
  
  // Set initialized to true after first auth check
  if (!state.initialized) {
    console.log("Initializing auth store");
    useAuthStore.setState({ initialized: true });
  }
});
