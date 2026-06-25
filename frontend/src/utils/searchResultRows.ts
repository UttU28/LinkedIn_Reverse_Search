import { FULL_COLUMN_HEADERS, type SpreadsheetRow } from './spreadsheetColumns';
import type { SearchResultData } from './excelExporter';

export const searchResultsToNormalizedRows = (items: SearchResultData[]): SpreadsheetRow[] =>
  items.map((item) => ({
    [FULL_COLUMN_HEADERS.name]: item.name || '',
    [FULL_COLUMN_HEADERS.company]: item.company || '',
    [FULL_COLUMN_HEADERS.website]:
      item.website && typeof item.website === 'string' ? item.website : '',
    [FULL_COLUMN_HEADERS.position]: item.title || '',
    [FULL_COLUMN_HEADERS.linkedin]:
      (item.linkedinUrl as string) || (item.linkedin as string) || '',
  }));
