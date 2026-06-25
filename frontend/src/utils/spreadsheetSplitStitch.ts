import {
  FULL_COLUMN_HEADERS,
  normalizeProfileRows,
  type ProfileColumnValidation,
  type SpreadsheetRow,
} from './spreadsheetColumns';
import type { SpreadsheetFileExtension } from './spreadsheetParser';
import { buildProfileExcelBlob } from './profileExcelBuilder';

const OUTPUT_HEADERS = [
  FULL_COLUMN_HEADERS.name,
  FULL_COLUMN_HEADERS.company,
  FULL_COLUMN_HEADERS.website,
  FULL_COLUMN_HEADERS.position,
  FULL_COLUMN_HEADERS.linkedin,
];

/** Matches AdvancedScraping `split_csv_chunks(..., rows_per_file=40)` default. */
export const DEFAULT_SPLIT_ROWS_PER_FILE = 40;

export interface OutputFileBlob {
  fileName: string;
  blob: Blob;
}

const rowsToSheetData = (rows: SpreadsheetRow[]) => [
  OUTPUT_HEADERS,
  ...rows.map((row) => OUTPUT_HEADERS.map((header) => row[header] ?? '')),
];

const buildCsvBlob = (rows: SpreadsheetRow[]): Blob => {
  const sheetData = rowsToSheetData(rows);
  const csv = sheetData
    .map((line) =>
      line
        .map((cell) => {
          const value = String(cell ?? '');
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    )
    .join('\n');

  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
};

const buildBlob = async (
  rows: SpreadsheetRow[],
  ext: SpreadsheetFileExtension,
  tableSuffix?: string
): Promise<Blob> => {
  if (ext === 'csv') {
    return buildCsvBlob(rows);
  }

  const safeSuffix = tableSuffix?.replace(/[^a-zA-Z0-9]/g, '') || 'Export';
  return buildProfileExcelBlob(rows, {
    tableName: `LinkedInResults_${safeSuffix}`,
  });
};

export const splitNormalizedRows = async (
  rows: SpreadsheetRow[],
  stem: string,
  ext: SpreadsheetFileExtension,
  rowsPerFile = DEFAULT_SPLIT_ROWS_PER_FILE
): Promise<OutputFileBlob[]> => {
  if (!rows.length) return [];

  const chunkSize = Math.max(1, Math.floor(rowsPerFile));
  const chunks: OutputFileBlob[] = [];
  const totalChunks = Math.ceil(rows.length / chunkSize);

  for (let index = 0; index < totalChunks; index += 1) {
    const chunkRows = rows.slice(index * chunkSize, (index + 1) * chunkSize);
    const fileName = `${stem}-${index + 1}.${ext}`;
    const blob = await buildBlob(chunkRows, ext, `${stem}_${index + 1}`);
    chunks.push({ fileName, blob });
  }

  return chunks;
};

export const stitchNormalizedRows = async (
  fileRows: SpreadsheetRow[][],
  fileName: string,
  ext: SpreadsheetFileExtension
): Promise<OutputFileBlob> => {
  const merged = fileRows.flat();
  const stem = fileName.replace(/\.[^.]+$/, '');
  const blob = await buildBlob(merged, ext, stem);
  return { fileName, blob };
};

export const prepareNormalizedRows = (
  data: SpreadsheetRow[],
  validation: ProfileColumnValidation
) => normalizeProfileRows(data, validation);

export const downloadOutputFile = (file: OutputFileBlob) => {
  const url = URL.createObjectURL(file.blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const downloadOutputFiles = async (files: OutputFileBlob[]) => {
  for (let index = 0; index < files.length; index += 1) {
    if (index > 0) {
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
    downloadOutputFile(files[index]);
  }
};
