const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3008';

// Create a simple event emitter for search history updates
type Listener = () => void;
class SearchHistoryEventEmitter {
  private listeners: Listener[] = [];
  
  subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  emit(): void {
    this.listeners.forEach(listener => listener());
  }
}

// Singleton instance of the event emitter
export const searchHistoryEvents = new SearchHistoryEventEmitter();

// Define interface for typed data
export interface SearchHistoryResult {
  id: string;
  type: 'single' | 'bulk' | 'recruiters' | 'team';
  status: string;
  inputMeta?: {
    name?: string;
    company?: string;
    position?: string;
    fileName?: string;
    companyUrl?: string;
  };
  totalRecords: number;
  resultRefPath?: string;
  resultIds?: string[];
  linkedinUrl?: string | null;
  createdAt: Date;
  completedAt?: Date;
}

// Function to fetch user's search history
export const fetchSearchHistory = async (userId: string) => {
  try {
    const result = {
      searchHistory: [] as SearchHistoryResult[],
    };

    // Check if user ID is valid
    if (!userId) {
      console.error("Invalid user ID provided");
      return result;
    }

    // Fetch from backend API
    try {
      const response = await fetch(`${API_BASE_URL}/search-history/${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data?.searchHistory) {
        const searchHistoryData = data.data.searchHistory.map((item: any) => {
          let createdAt: Date;
          if (item.createdAt && typeof item.createdAt === 'object') {
            if (item.createdAt.toDate) {
              createdAt = item.createdAt.toDate();
            } else if (item.createdAt.seconds) {
              createdAt = new Date(item.createdAt.seconds * 1000);
            } else {
              createdAt = new Date(item.createdAt);
            }
          } else {
            createdAt = new Date(item.createdAt || Date.now());
          }
          
          let completedAt: Date | undefined;
          if (item.completedAt && typeof item.completedAt === 'object') {
            if (item.completedAt.toDate) {
              completedAt = item.completedAt.toDate();
            } else if (item.completedAt.seconds) {
              completedAt = new Date(item.completedAt.seconds * 1000);
            } else {
              completedAt = new Date(item.completedAt);
            }
          } else if (item.completedAt) {
            completedAt = new Date(item.completedAt);
          }
          
          return {
            id: item.id || item._id || '',
            type: item.type || 'single',
            status: item.status || 'pending',
            inputMeta: item.inputMeta || {},
            totalRecords: item.totalRecords || 0,
            resultRefPath: item.resultRefPath || '',
            resultIds: item.resultIds || [],
            linkedinUrl: item.linkedinUrl || null,
            createdAt,
            completedAt
          } as SearchHistoryResult;
        });
        
        result.searchHistory = searchHistoryData;
      }
    } catch (err) {
      console.error("Error fetching search history from API:", err);
    }

    return result;
  } catch (error) {
    console.error('Error fetching search history:', error);
    throw error;
  }
};

// Function to trigger a refresh of search history
export const refreshSearchHistory = () => {
  searchHistoryEvents.emit();
};

// Function to manually refresh search history for a specific user
export const refreshUserSearchHistory = async (userId: string) => {
  try {
    const result = await fetchSearchHistory(userId);
    searchHistoryEvents.emit();
    return result;
  } catch (error) {
    console.error('Error refreshing user search history:', error);
    throw error;
  }
}; 