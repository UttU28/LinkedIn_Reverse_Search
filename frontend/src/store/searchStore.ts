import { create } from 'zustand';

export interface F {
  id: string;
  name: string;
  company: string;
  position: string;
  linkedinProfileUrl?: string;
  status: 'Found' | 'Not Found';
  timestamp: number;
  batchId?: string;
}

interface SearchState {
  recentSearches: SearchResult[];
  addRecentSearch: (result: Omit<SearchResult, 'id' | 'timestamp'>) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  recentSearches: [],
  addRecentSearch: (result) => set((state) => ({
    recentSearches: [
      {
        ...result,
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
      },
      ...state.recentSearches.slice(0, 9) // Keep only the 10 most recent searches
    ]
  })),
})); 