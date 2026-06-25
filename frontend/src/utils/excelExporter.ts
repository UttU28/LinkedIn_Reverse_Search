import { format } from 'date-fns';
import { FULL_COLUMN_HEADERS } from './spreadsheetColumns';
import { buildProfileExcelBlob } from './profileExcelBuilder';

// Interface for search result data
export interface SearchResultData {
  name?: string;
  company?: string;
  title?: string;
  linkedin?: string;
  website?: string;
  createdAt?: Date;
  [key: string]: any;
}

// Interface for the search information
export interface SearchInfo {
  id: string;
  title: string;
  timestamp: number;
  resultIds: string[];
}

/**
 * Fetches search result data from backend API using result IDs
 * @param resultIds - Array of document IDs to fetch from searchResults collection
 * @returns Promise resolving to array of search result data
 */
export const fetchSearchResultData = async (resultIds: string[]): Promise<SearchResultData[]> => {
  if (!resultIds.length) return [];
  
  try {
    console.log('Fetching search results with IDs:', resultIds);
    
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9221';
    
    const response = await fetch(`${API_BASE_URL}/search-results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resultIds }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch search results');
    }
    
    console.log('API response:', result);
    
    // Transform the data to match the expected interface
    const transformedResults: SearchResultData[] = result.data.map((item: any) => ({
      id: item.id,
      name: item.name || '',
      company: item.company || '',
      title: item.title || '',
      linkedin: item.linkedin || '',
      website: item.website || '',
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    }));
    
    console.log('Transformed results:', transformedResults);
    return transformedResults;
  } catch (error) {
    console.error('Error fetching search result data:', error);
    throw error;
  }
};

/**
 * Exports search results to Excel file
 * @param searchInfo - Information about the search
 * @param onProgress - Optional callback to report progress
 * @returns Promise that resolves when export is complete
 */
export const exportToExcel = async (
  searchInfo: SearchInfo,
  onProgress?: (stage: 'fetching' | 'creating' | 'complete' | 'error', count?: number) => void
): Promise<void> => {
  try {
    // Notify start of data fetching
    if (onProgress) onProgress('fetching');
    
    // Fetch detailed data from searchResults collection
    const detailedData = await fetchSearchResultData(searchInfo.resultIds);
    
    if (detailedData.length === 0) {
      throw new Error('No search results found to export');
    }
    
    // Skip notifying about Excel creation to avoid duplicate toasts
    // if (onProgress) onProgress('creating', detailedData.length);

    // Map to normalized profile rows (same column order as Utils split/stitch + CSV export)
    const normalizedRows = detailedData.map((item) => ({
      [FULL_COLUMN_HEADERS.name]: item.name || '',
      [FULL_COLUMN_HEADERS.company]: item.company || '',
      [FULL_COLUMN_HEADERS.website]:
        item.website && typeof item.website === 'string' ? item.website : '',
      [FULL_COLUMN_HEADERS.position]: item.title || '',
      [FULL_COLUMN_HEADERS.linkedin]:
        (item.linkedinUrl as string) || (item.linkedin as string) || '',
    }));

    const blob = await buildProfileExcelBlob(normalizedRows);
    const rawTitle = searchInfo.title || 'results';
    const titleWithoutExt = rawTitle.replace(/\.[^.\s]{1,5}$/i, '');
    const safeTitle = titleWithoutExt.replace(/[^\w\s-]/gi, '').trim() || 'results';
    const shortDate = format(new Date(searchInfo.timestamp), 'MMM d');
    const fileName = `${safeTitle} ${shortDate}.xlsx`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Notify completion
    if (onProgress) onProgress('complete', detailedData.length);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    if (onProgress) onProgress('error');
    throw error;
  }
}; 