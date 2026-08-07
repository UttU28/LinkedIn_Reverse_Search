const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9221';

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
  type: 'single' | 'bulk' | 'recruiters' | 'team' | 'companySitesSingle' | 'companySitesBulk';
  status: string;
  inputMeta?: {
    name?: string;
    company?: string;
    position?: string;
    fileName?: string;
    companyUrl?: string;
    includeCompanyLinks?: boolean;
  };
  totalRecords: number;
  resultsCount?: number;
  processedCount?: number;
  resultRefPath?: string;
  resultIds?: string[];
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  createdAt: Date;
  completedAt?: Date;
}

export interface StitchableSearch {
  id: string;
  type: 'bulk' | 'team' | 'recruiters';
  title: string;
  totalRecords: number;
  resultIds: string[];
  createdAt: Date;
  completedAt?: Date | null;
}

export interface StitchableSearchesPage {
  items: StitchableSearch[];
  nextCursor: string | null;
  hasMore: boolean;
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
            type: (item.type || 'single') as SearchHistoryResult['type'],
            status: item.status || 'pending',
            inputMeta: item.inputMeta || {},
            totalRecords: item.totalRecords || 0,
            resultsCount: item.resultsCount ?? 0,
            processedCount: item.processedCount ?? 0,
            resultRefPath: item.resultRefPath || '',
            resultIds: item.resultIds || [],
            linkedinUrl: item.linkedinUrl || null,
            websiteUrl: item.websiteUrl || null,
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

// Paginated completed searches for Utils stitch
export const fetchStitchableSearches = async (
  userId: string,
  options: { limit?: number; cursor?: string | null } = {}
): Promise<StitchableSearchesPage> => {
  const empty: StitchableSearchesPage = { items: [], nextCursor: null, hasMore: false };

  if (!userId) return empty;

  const limit = options.limit ?? 10;
  const params = new URLSearchParams({ limit: String(limit) });
  if (options.cursor) params.set('cursor', options.cursor);

  try {
    const response = await fetch(`${API_BASE_URL}/stitchable-searches/${userId}?${params}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    if (!data.success || !data.data) return empty;

    const items: StitchableSearch[] = (data.data.items || []).map((item: any) => ({
      id: item.id,
      type: item.type,
      title: item.title || 'Search',
      totalRecords: item.totalRecords || item.resultIds?.length || 0,
      resultIds: item.resultIds || [],
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      completedAt: item.completedAt ? new Date(item.completedAt) : null,
    }));

    return {
      items,
      nextCursor: data.data.nextCursor || null,
      hasMore: !!data.data.hasMore,
    };
  } catch (error) {
    console.error('Error fetching stitchable searches:', error);
    return empty;
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