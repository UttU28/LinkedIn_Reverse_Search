import ExcelJS from 'exceljs';
import { FULL_COLUMN_HEADERS, type SpreadsheetRow } from './spreadsheetColumns';

export const PROFILE_EXCEL_SHEET_NAME = 'LinkedIn Results';
export const PROFILE_EXCEL_TABLE_NAME = 'LinkedInResultsTable';

interface ProfileTableRow {
  name: string;
  company: string;
  website: string;
  title: string;
  linkedin: string;
}

const toTableRow = (row: SpreadsheetRow): ProfileTableRow => ({
  name: row[FULL_COLUMN_HEADERS.name] || '',
  company: row[FULL_COLUMN_HEADERS.company] || '',
  website: row[FULL_COLUMN_HEADERS.website] || '',
  title: row[FULL_COLUMN_HEADERS.position] || '',
  linkedin: row[FULL_COLUMN_HEADERS.linkedin] || '',
});

const normalizeUrl = (value: string) => (value.startsWith('http') ? value : `https://${value}`);

/**
 * Build a styled .xlsx blob matching profile search export:
 * Full Name, Company, Website, Position, LinkedIn — table stripes + URL hyperlinks.
 */
export const buildProfileExcelBlob = async (
  rows: SpreadsheetRow[],
  options?: {
    sheetName?: string;
    tableName?: string;
  }
): Promise<Blob> => {
  const sheetName = options?.sheetName ?? PROFILE_EXCEL_SHEET_NAME;
  const tableName = options?.tableName ?? PROFILE_EXCEL_TABLE_NAME;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = [
    { header: FULL_COLUMN_HEADERS.name, key: 'name', width: 25 },
    { header: FULL_COLUMN_HEADERS.company, key: 'company', width: 25 },
    { header: FULL_COLUMN_HEADERS.website, key: 'website', width: 35 },
    { header: FULL_COLUMN_HEADERS.position, key: 'title', width: 25 },
    { header: FULL_COLUMN_HEADERS.linkedin, key: 'linkedin', width: 40 },
  ];

  const tableRows = rows.map(toTableRow);
  tableRows.forEach((row) => worksheet.addRow(row));

  const rowCount = tableRows.length + 1;
  if (rowCount > 1) {
    worksheet.addTable({
      name: tableName,
      ref: 'A1',
      headerRow: true,
      totalsRow: false,
      style: {
        theme: 'TableStyleMedium9',
        showRowStripes: true,
      },
      columns: [
        { name: FULL_COLUMN_HEADERS.name, filterButton: true },
        { name: FULL_COLUMN_HEADERS.company, filterButton: true },
        { name: FULL_COLUMN_HEADERS.website, filterButton: true },
        { name: FULL_COLUMN_HEADERS.position, filterButton: true },
        { name: FULL_COLUMN_HEADERS.linkedin, filterButton: true },
      ],
      rows: tableRows.map((row) => [row.name, row.company, row.website, row.title, row.linkedin]),
    });
  }

  for (let i = 0; i < tableRows.length; i += 1) {
    const excelRowIndex = i + 2;
    const row = tableRows[i];

    if (row.website) {
      const cell = worksheet.getCell(`C${excelRowIndex}`);
      cell.value = { text: row.website, hyperlink: normalizeUrl(row.website) };
      cell.font = { color: { argb: 'FF0563C1' }, underline: true };
    }

    if (row.linkedin) {
      const cell = worksheet.getCell(`E${excelRowIndex}`);
      cell.value = { text: row.linkedin, hyperlink: normalizeUrl(row.linkedin) };
      cell.font = { color: { argb: 'FF0563C1' }, underline: true };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
};
