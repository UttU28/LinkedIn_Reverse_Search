import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export interface CompanySiteResult {
  companyName: string;
  websiteUrl: string;
  fromCache?: boolean;
}

export interface CompanySitesSearchInfo {
  id: string; // historyId
  title: string;
  timestamp: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3008';

export const fetchCompanySitesByHistoryId = async (
  historyId: string
): Promise<CompanySiteResult[]> => {
  if (!historyId) return [];

  const response = await fetch(`${API_BASE_URL}/company-sites-results`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ historyId })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || 'Failed to fetch company site results');
  }

  return (result.data || []).map((item: any) => ({
    companyName: item.companyName || '',
    websiteUrl: item.websiteUrl || '',
    fromCache: !!item.fromCache
  }));
};

export const exportCompanySitesToCSV = async (
  searchInfo: CompanySitesSearchInfo,
  onProgress?: (stage: 'fetching' | 'creating' | 'complete' | 'error', count?: number) => void
): Promise<void> => {
  try {
    if (onProgress) onProgress('fetching');

    const data = await fetchCompanySitesByHistoryId(searchInfo.id);
    if (!data.length) {
      throw new Error('No company sites found to export');
    }

    const headers = ['Company', 'Website'];
    let csvContent = headers.join(',') + '\n';

    data.forEach((row) => {
      const cols = [row.companyName || '', row.websiteUrl || ''];
      const line = cols
        .map((value) => {
          const v = value.replace(/"/g, '""');
          return /[",\n]/.test(v) ? `"${v}"` : v;
        })
        .join(',');
      csvContent += line + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = format(new Date(searchInfo.timestamp), 'yyyy-MM-dd');
    const fileName = `${searchInfo.title.replace(/[^\w\s]/gi, '') || 'company-websites'}_${timestamp}.csv`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (onProgress) onProgress('complete', data.length);
  } catch (error) {
    console.error('Error exporting company sites to CSV:', error);
    if (onProgress) onProgress('error');
    throw error;
  }
};

export const exportCompanySitesToExcel = async (
  searchInfo: CompanySitesSearchInfo,
  onProgress?: (stage: 'fetching' | 'creating' | 'complete' | 'error', count?: number) => void
): Promise<void> => {
  try {
    if (onProgress) onProgress('fetching');

    const data = await fetchCompanySitesByHistoryId(searchInfo.id);
    if (!data.length) {
      throw new Error('No company sites found to export');
    }

    const wb = XLSX.utils.book_new();
    const headers = ['Company', 'Website'];
    const wsData: any[][] = [headers];

    data.forEach((row) => {
      wsData.push([row.companyName || '', row.websiteUrl || '']);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 30 }, { wch: 40 }];

    const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
      ws[cellRef].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4F46E5' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }

    const timestamp = format(new Date(searchInfo.timestamp), 'yyyy-MM-dd');
    const fileName = `${searchInfo.title.replace(/[^\w\s]/gi, '') || 'company-websites'}_${timestamp}.xlsx`;

    XLSX.utils.book_append_sheet(wb, ws, 'Company Websites');
    XLSX.writeFile(wb, fileName);

    if (onProgress) onProgress('complete', data.length);
  } catch (error) {
    console.error('Error exporting company sites to Excel:', error);
    if (onProgress) onProgress('error');
    throw error;
  }
};

