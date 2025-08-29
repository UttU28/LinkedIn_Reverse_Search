import * as XLSX from 'xlsx';
import { format } from 'date-fns';

// Interface for search result data
export interface SearchResultData {
  name?: string;
  company?: string;
  title?: string;
  linkedin?: string;
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
    
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3008';
    
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
    
    // Create a workbook
    const wb = XLSX.utils.book_new();
    
    // Define the headers and fields to include in the Excel file
    const headers = ['Full Name', 'Company', 'Position', 'LinkedIn'];
    const fieldMap = {
      'Full Name': 'name',
      'Company': 'company',
      'Position': 'title',
      'LinkedIn': 'linkedin'
    };
    
    // Prepare the data for the worksheet
    const wsData = [headers];
    
    // Add data rows
    detailedData.forEach(item => {
      const row = headers.map(header => {
        const fieldName = fieldMap[header as keyof typeof fieldMap];
        
        // Special case for LinkedIn URLs - ensure we get the value from the correct field
        if (header === 'LinkedIn') {
          return item[fieldName] || item.linkedinUrl || item.linkedin || '';
        }
        
        return item[fieldName] || '';
      });
      wsData.push(row);
    });
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    const colWidths = [
      { wch: 25 }, // Full Name
      { wch: 25 }, // Company
      { wch: 25 }, // Position
      { wch: 40 }  // LinkedIn
    ];
    ws['!cols'] = colWidths;
    
    // Style the header row
    const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
      
      // Add style properties to the header cells
      ws[cellRef].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F46E5" } }, // Indigo color
        alignment: { horizontal: "center", vertical: "center" }
      };
    }
    
    // Generate filename based on search data
    const timestamp = format(new Date(searchInfo.timestamp), 'yyyy-MM-dd');
    const fileName = `${searchInfo.title.replace(/[^\w\s]/gi, '')}_${timestamp}.xlsx`;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'LinkedIn Results');
    
    // Write to file and trigger download
    XLSX.writeFile(wb, fileName);
    
    // Notify completion
    if (onProgress) onProgress('complete', detailedData.length);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    if (onProgress) onProgress('error');
    throw error;
  }
}; 