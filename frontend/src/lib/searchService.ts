import { db } from './firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

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
    console.log(`Fetching search history for user ID: ${userId}`);
    const result = {
      searchHistory: [] as SearchHistoryResult[],
    };

    // Check if user ID is valid
    if (!userId) {
      console.error("Invalid user ID provided");
      return result;
    }

    // Fetch from consolidated searchHistory collection
    try {
      const searchHistoryRef = collection(db, 'users', userId, 'searchHistory');
      const searchHistoryQuery = query(searchHistoryRef, orderBy('createdAt', 'desc'), limit(20));
      const searchHistorySnapshot = await getDocs(searchHistoryQuery);
      
      console.log(`Found ${searchHistorySnapshot.docs.length} search history entries`);
      
      if (!searchHistorySnapshot.empty) {
        const searchHistoryData = searchHistorySnapshot.docs.map(doc => {
          const data = doc.data();
          
          // Convert to our internal format
          return {
            id: doc.id,
            type: data.type || 'single',
            status: data.status || 'pending',
            inputMeta: data.inputMeta || {},
            totalRecords: data.totalRecords || 0,
            resultRefPath: data.resultRefPath || '',
            resultIds: data.resultIds || [],
            linkedinUrl: data.linkedinUrl || null,
            createdAt: data.createdAt?.toDate() || new Date(),
            completedAt: data.completedAt?.toDate() || null
          } as SearchHistoryResult;
        });
        
        result.searchHistory = searchHistoryData;
      }
    } catch (err) {
      console.error("Error fetching search history:", err);
    }

    return result;
  } catch (error) {
    console.error('Error fetching search history:', error);
    throw error;
  }
};

// Function to trigger a refresh of search history
export const refreshSearchHistory = () => {
  console.log('Triggering search history refresh');
  searchHistoryEvents.emit();
}; 