import ExcelJS from 'exceljs';
import { format } from 'date-fns';

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

    // Create a workbook and worksheet using ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('LinkedIn Results');

    // Define columns (headers, keys, widths)
    worksheet.columns = [
      { header: 'Full Name', key: 'name', width: 25 },
      { header: 'Company', key: 'company', width: 25 },
      { header: 'Website', key: 'website', width: 35 },
      { header: 'Position', key: 'title', width: 25 },
      { header: 'LinkedIn', key: 'linkedin', width: 40 },
    ];

    // Add rows of data
    const tableRows = detailedData.map(item => {
      const website =
        item.website && typeof item.website === 'string' ? item.website : '';
      const linkedin =
        (item.linkedinUrl as string) ||
        (item.linkedin as string) ||
        '';

      return {
        name: item.name || '',
        company: item.company || '',
        website,
        title: item.title || '',
        linkedin,
      };
    });

    tableRows.forEach(row => worksheet.addRow(row));

    // Build an Excel "Table" with banded rows & header style
    const rowCount = tableRows.length + 1; // +1 for header row
    if (rowCount > 1) {
      worksheet.addTable({
        name: 'LinkedInResultsTable',
        ref: 'A1',
        headerRow: true,
        totalsRow: false,
        style: {
          theme: 'TableStyleMedium9', // blue header + striped rows
          showRowStripes: true,
        },
        columns: [
          { name: 'Full Name', filterButton: true },
          { name: 'Company', filterButton: true },
          { name: 'Website', filterButton: true },
          { name: 'Position', filterButton: true },
          { name: 'LinkedIn', filterButton: true },
        ],
        rows: tableRows.map(row => [
          row.name,
          row.company,
          row.website,
          row.title,
          row.linkedin,
        ]),
      });
    }

    // Apply hyperlink styling to Website (D) and LinkedIn (E) columns
    for (let i = 0; i < tableRows.length; i++) {
      const excelRowIndex = i + 2; // data starts at row 2
      const row = tableRows[i];

      // Website: column C (3)
      if (row.website) {
        const normalizedWebsite =
          row.website.startsWith('http') ? row.website : `https://${row.website}`;
        const cell = worksheet.getCell(`C${excelRowIndex}`);
        cell.value = {
          text: row.website,
          hyperlink: normalizedWebsite,
        };
        cell.font = {
          color: { argb: 'FF0563C1' },
          underline: true,
        };
      }

      // LinkedIn: column E (5)
      if (row.linkedin) {
        const normalizedLinkedin = row.linkedin.startsWith('http')
          ? row.linkedin
          : `https://${row.linkedin}`;
        const cell = worksheet.getCell(`E${excelRowIndex}`);
        cell.value = {
          text: row.linkedin,
          hyperlink: normalizedLinkedin,
        };
        cell.font = {
          color: { argb: 'FF0563C1' },
          underline: true,
        };
      }
    }

    // Generate filename based on search data (e.g. "Ceraweek Mar 3.xlsx")
    const rawTitle = searchInfo.title || 'results';
    const titleWithoutExt = rawTitle.replace(/\.[^.\s]{1,5}$/i, '');
    const safeTitle = titleWithoutExt.replace(/[^\w\s-]/gi, '').trim() || 'results';
    const shortDate = format(new Date(searchInfo.timestamp), 'MMM d');
    const fileName = `${safeTitle} ${shortDate}.xlsx`;

    // Write workbook to a buffer and trigger browser download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
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