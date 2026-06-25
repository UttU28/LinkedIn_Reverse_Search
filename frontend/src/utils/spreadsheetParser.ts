import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { SpreadsheetRow } from './spreadsheetColumns';

export type SpreadsheetFileExtension = 'csv' | 'xlsx';

export const getSpreadsheetExtension = (file: File): SpreadsheetFileExtension | null => {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.csv')) return 'csv';
  if (lower.endsWith('.xlsx')) return 'xlsx';
  return null;
};

export const isAcceptedSpreadsheet = (file: File) => getSpreadsheetExtension(file) !== null;

const normalizeParsedRows = (rows: SpreadsheetRow[]): SpreadsheetRow[] =>
  rows
    .map((row) => {
      const normalized: SpreadsheetRow = {};
      Object.entries(row).forEach(([key, value]) => {
        if (key.trim()) {
          normalized[key.trim()] = value == null ? '' : String(value).trim();
        }
      });
      return normalized;
    })
    .filter((row) => Object.values(row).some((value) => value !== ''));

export const parseSpreadsheetFile = (file: File): Promise<SpreadsheetRow[]> =>
  new Promise((resolve, reject) => {
    const ext = getSpreadsheetExtension(file);
    if (!ext) {
      reject(new Error('Please upload a .csv or .xlsx file only'));
      return;
    }

    if (ext === 'csv') {
      Papa.parse<SpreadsheetRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(normalizeParsedRows(results.data)),
        error: (error) => reject(error),
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) throw new Error('Failed to read file');

        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<SpreadsheetRow>(worksheet, { raw: false });
        resolve(normalizeParsedRows(jsonData));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Could not read the Excel file'));
    reader.readAsArrayBuffer(file);
  });
