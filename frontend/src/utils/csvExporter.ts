import { format } from 'date-fns';
import { fetchSearchResultData, SearchInfo, SearchResultData } from './excelExporter';

/**
 * Converts data to CSV format
 * @param data - Array of search result data
 * @returns CSV string
 */
export const convertToCSV = (data: SearchResultData[]): string => {
  if (data.length === 0) return '';
  
  // Define headers with friendly names
  const headers = ['Full Name', 'Company', 'Position', 'LinkedIn'];
  
  // Map to actual data fields
  const fieldMap = {
    'Full Name': 'name',
    'Company': 'company',
    'Position': 'title',
    'LinkedIn': 'linkedin'
  };
  
  // Create CSV header row
  let csvContent = headers.join(',') + '\n';
  
  // Add data rows
  data.forEach(item => {
    const row = headers.map(header => {
      // Get the corresponding field name from our map
      const fieldName = fieldMap[header as keyof typeof fieldMap];
      const value = item[fieldName];
      
      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      } else if (typeof value === 'string') {
        // Escape quotes and wrap in quotes if it contains comma, quote or newline
        const escaped = value.replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') 
          ? `"${escaped}"` 
          : escaped;
      } else {
        return String(value);
      }
    }).join(',');
    
    csvContent += row + '\n';
  });
  
  return csvContent;
};

/**
 * Exports search results to CSV file
 * @param searchInfo - Information about the search
 * @param onProgress - Optional callback to report progress
 * @returns Promise that resolves when export is complete
 */
export const exportToCSV = async (
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
    
    // Skip notifying about CSV creation to avoid duplicate toasts
    // if (onProgress) onProgress('creating', detailedData.length);
    
    // Convert data to CSV
    const csvContent = convertToCSV(detailedData);
    
    // Create a blob with the CSV data
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element for download
    const a = document.createElement('a');
    a.href = url;
    
    // Generate filename based on search data
    const timestamp = format(new Date(searchInfo.timestamp), 'yyyy-MM-dd');
    const fileName = `${searchInfo.title.replace(/[^\w\s]/gi, '')}_${timestamp}.csv`;
    a.download = fileName;
    
    // Trigger the download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Notify completion
    if (onProgress) onProgress('complete', detailedData.length);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    if (onProgress) onProgress('error');
    throw error;
  }
}; 