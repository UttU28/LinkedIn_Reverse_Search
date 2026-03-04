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

interface CompanyWebsiteSingleParams {
  userID: string;
  companyName: string;
}

interface CompanyWebsiteSingleResponse {
  success: boolean;
  message: string;
  websiteUrl: string;
  fromCache: boolean;
  historyId?: string | null;
}

interface CompanyWebsiteBulkParams {
  userID: string;
  companies: string[];
  fileName?: string;
}

interface CompanyWebsiteBulkResult {
  companyName: string;
  websiteUrl: string;
  fromCache: boolean;
}

interface CompanyWebsiteBulkResponse {
  success: boolean;
  message: string;
  historyId?: string | null;
  results: CompanyWebsiteBulkResult[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3008';

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
    
    const rawResult = await response.json();
    console.log('Backend single contact response:', rawResult);
    
    // Standardize the response format
    let result: SearchResponse;
    
    // Handle newer format with success flag
    if (rawResult.hasOwnProperty('success')) {
      result = {
        status: rawResult.success ? 'success' : 'error',
        message: rawResult.message || (rawResult.success ? 'Profile found successfully' : 'No profile found'),
        data: {
          userID: params.userID,
          searchName: params.searchName,
          searchCompany: params.searchCompany,
          searchPosition: params.searchPosition,
          linkedinProfileUrl: rawResult.linkedInUrl || '',
          foundData: rawResult.success ? 1 : 0
        }
      };
    }
    // Handle older format with status field
    else if (rawResult.hasOwnProperty('status')) {
      result = rawResult as SearchResponse;
    }
    // Handle unexpected format
    else {
      throw new Error('Invalid response format from server');
    }
    
    console.log('Standardized single contact response:', result);
    
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
    
    const rawResult = await response.json();
    console.log('Batch process raw response:', rawResult);
    
    // Standardize the response format
    let result: BatchResponse;
    
    // Handle newer format with success flag
    if (rawResult.hasOwnProperty('success')) {
      // Transform to expected format
      result = {
        status: rawResult.success ? 'success' : 'error',
        message: rawResult.message || (rawResult.success ? 'Batch processing started' : 'Batch processing failed'),
        data: {
          userID: params.userID,
          contactsCount: params.contacts.length,
          contacts: Array.isArray(rawResult.contacts) ? rawResult.contacts.map((contact: any) => ({
            batchId: params.batchId,
            searchName: contact.searchName || '',
            searchCompany: contact.searchCompany || '',
            searchPosition: contact.searchPosition || '',
            linkedinProfileUrl: contact.linkedinProfileUrl || contact.linkedInUrl || '',
            foundData: contact.foundData || (contact.success ? 1 : 0)
          })) : []
        }
      };
    }
    // Handle older format with status field
    else if (rawResult.hasOwnProperty('status')) {
      result = rawResult as BatchResponse;
    }
    // Handle unexpected format
    else {
      throw new Error('Invalid response format from server');
    }
    
    console.log('Standardized batch process response:', result);
    
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
    
    const rawResult = await response.json();
    console.log('Targeted leads raw response:', rawResult);
    
    // Standardize the response format to match what frontend components expect
    let result;
    
    // Check if we have the newer format with 'success' flag and 'leads' array
    if (rawResult.hasOwnProperty('success') && Array.isArray(rawResult.leads)) {
      result = {
        status: rawResult.success ? 'success' : 'error',
        message: rawResult.message || (rawResult.success ? 'Found leads successfully' : 'Failed to find leads'),
        data: {
          results: rawResult.leads.map((lead: any, index: number) => ({
            id: `lead-${index}-${Date.now()}`,
            name: lead.fullName || '',
            position: lead.position || '',
            company: lead.company || '',
            location: '',
            linkedinUrl: lead.linkedinUrl || '',
            exactMatch: true
          })),
          historyId: rawResult.historyId || null
        }
      };
    } 
    // Handle the older format which already has status/data structure
    else if (rawResult.hasOwnProperty('status')) {
      result = rawResult;
    }
    // If neither format is detected, create a default error response
    else {
      result = {
        status: 'error',
        message: 'Invalid response format from server',
        data: { results: [] }
      };
    }
    
    console.log('Standardized leads response:', result);
    
    // Check if the result indicates an error
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
 * Service for finding a single company website
 */
export const findSingleCompanyWebsite = async (
  params: CompanyWebsiteSingleParams
): Promise<CompanyWebsiteSingleResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/companyWebsiteSingle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const raw = await response.json();
    return {
      success: !!raw.success,
      message: raw.message || '',
      websiteUrl: raw.websiteUrl || '',
      fromCache: !!raw.fromCache,
      historyId: raw.historyId ?? null
    };
  } catch (error) {
    console.error('Company website single error:', error);
    throw error;
  }
};

/**
 * Service for finding company websites in bulk
 */
export const findBulkCompanyWebsites = async (
  params: CompanyWebsiteBulkParams
): Promise<CompanyWebsiteBulkResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/companyWebsiteBulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const raw = await response.json();

    return {
      success: !!raw.success,
      message: raw.message || '',
      historyId: raw.historyId ?? null,
      results: Array.isArray(raw.results)
        ? raw.results.map((r: any) => ({
            companyName: r.companyName || '',
            websiteUrl: r.websiteUrl || '',
            fromCache: !!r.fromCache
          }))
        : []
    };
  } catch (error) {
    console.error('Company website bulk error:', error);
    throw error;
  }
};

 