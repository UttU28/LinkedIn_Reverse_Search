import { create } from 'zustand';
import { auth, db, getUserData, UserData } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// Backend API url
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3008";

interface AuthState {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  refreshingCredits: boolean;
  fetchUserData: () => Promise<void>;
  updateCreditUsage: (creditsUsed: number, resultsFound: number) => Promise<void>;
  refreshCredits: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userData: null,
  loading: true,
  error: null,
  initialized: false,
  refreshingCredits: false,
  
  fetchUserData: async () => {
    const { user } = get();
    if (!user) {
      set({ userData: null });
      return;
    }
    
    try {
      set({ loading: true, error: null });
      const userData = await getUserData(user.uid) as UserData;
      set({ userData, loading: false });
      
      try {
        await get().refreshCredits();
      } catch (error) {
        console.error("Error refreshing credits after fetch:", error);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      set({ error: "Failed to load user data.", loading: false });
    }
  },
  
  updateCreditUsage: async (creditsUsed: number, resultsFound: number) => {
    const { user, userData } = get();
    if (!user || !userData) return;
    
    try {
      // The /updateCredits endpoint is now deprecated, so after using it, we'll refresh credits
      // to get the actual values from the database
      await get().refreshCredits();
    } catch (error) {
      console.error("Error updating credit usage:", error);
      set({ error: "Failed to update credit usage." });
    }
  },
  
  refreshCredits: async () => {
    const { user, userData, refreshingCredits } = get();
    
    // Prevent concurrent calls
    if (!user || refreshingCredits) return;
    
    try {
      set({ refreshingCredits: true });
      
      // Use the new endpoint to get fresh credit information
      const response = await fetch(`${API_URL}/refresh-credits/${user.uid}`);
      
      if (!response.ok) {
        throw new Error(`Failed to refresh credits: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && userData) {
        set({
          userData: {
            ...userData,
            linkCredits: result.data.linkCredits,
            ...(result.data.includeCompanyLinks !== undefined && { includeCompanyLinks: result.data.includeCompanyLinks })
          }
        });
      }
    } catch (error) {
      console.error("Error refreshing credits:", error);
    } finally {
      set({ refreshingCredits: false });
    }
  }
}));

// Set up auth state listener
onAuthStateChanged(auth, async (user) => {
  const state = useAuthStore.getState();
  
  if (user) {
    useAuthStore.setState({ user, loading: true });
    try {
      await state.fetchUserData();
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      useAuthStore.setState({ loading: false });
    }
  } else {
    useAuthStore.setState({ user: null, userData: null, loading: false });
  }
  
  // Set initialized to true after first auth check
  if (!state.initialized) {
    useAuthStore.setState({ initialized: true });
  }
});
