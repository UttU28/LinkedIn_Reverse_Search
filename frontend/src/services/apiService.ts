import { toast } from '@/hooks/use-toast';
import { refreshSearchHistory } from '../lib/searchService';

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
  batchId: string;
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
      batchId: string;
      searchName: string;
      searchCompany: string; 
      searchPosition: string;
      linkedinProfileUrl?: string;
      foundData: number;
    }>;
  };
}

interface TargetedLeadsParams {
  userID: string;
  company: string;
  positionTitle: string;
  pipelineId: string;
  leadDocId: string;
}

interface TeamMembersParams {
  userID: string;
  url: string;
  teamId: string;
  companySearchId: string;
}

// Use environment variable for API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';

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
    
    // Refresh search history after successful response
    refreshSearchHistory();
    
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
    
    // Refresh search history after successful response
    refreshSearchHistory();
    
    return result;
  } catch (error) {
    console.error('Batch process error:', error);
    throw error;
  }
};

/**
 * Service for finding targeted leads (recruiters, investors, etc.)
 */
export const findTargetedLeads = async (params: TargetedLeadsParams): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/findTargetedLeads`, {
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
    console.log('Targeted leads response:', result);
    
    if (result.status !== 'success') {
      throw new Error(result.message || 'Unknown error');
    }
    
    // Refresh search history after successful response
    refreshSearchHistory();
    
    return result;
  } catch (error) {
    console.error('Targeted leads error:', error);
    throw error;
  }
};

/**
 * Service for finding team members from a company page
 */
export const findTeamMembers = async (params: TeamMembersParams): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/findTeamMembers`, {
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
    console.log('Team members response:', result);
    
    if (result.status !== 'success') {
      throw new Error(result.message || 'Unknown error');
    }
    
    // Refresh search history after successful response
    refreshSearchHistory();
    
    return result;
  } catch (error) {
    console.error('Team members error:', error);
    throw error;
  }
}; 