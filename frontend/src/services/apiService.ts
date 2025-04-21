import { toast } from '@/hooks/use-toast';

interface SearchParams {
  userID: string;
  searchName: string;
  searchCompany: string;
  searchPosition: string;
}

interface SearchResponse {
  status: string;
  message: string;
  data: {
    userID: string;
    searchName: string;
    searchCompany: string;
    searchPosition: string;
    linkedinProfileUrl?: string;
    foundData: number;
  };
}

interface BatchContactsParams {
  userID: string;
  fileName: string;
  timestamp: number;
  contacts: Array<{
    searchName: string;
    searchCompany: string;
    searchPosition: string;
  }>;
}

interface BatchResponse {
  status: string;
  message: string;
  data: {
    userID: string;
    contactsCount: number;
    contacts: Array<{
      searchName: string;
      searchCompany: string; 
      searchPosition: string;
      linkedinProfileUrl?: string;
      foundData: number;
    }>;
  };
}

const API_BASE_URL = 'http://localhost:3000';

/**
 * Service for finding a single LinkedIn contact
 */
export const findSingleContact = async (params: SearchParams): Promise<SearchResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/findSingleContact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const result = await response.json();
    console.log('Backend response:', result);
    
    if (result.status !== 'success') {
      throw new Error(result.message || 'Unknown error');
    }
    
    return result;
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};

/**
 * Service for finding multiple LinkedIn contacts via batch processing
 */
export const findBatchContacts = async (params: BatchContactsParams): Promise<BatchResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/findBatchContact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const result = await response.json();
    console.log('Batch process response:', result);
    
    if (result.status !== 'success') {
      throw new Error(result.message || 'Unknown error');
    }
    
    return result;
  } catch (error) {
    console.error('Batch process error:', error);
    throw error;
  }
}; 