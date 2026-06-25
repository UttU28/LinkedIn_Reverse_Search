export type ProfileColumnKey = 'name' | 'company' | 'website' | 'position' | 'linkedin';

export const FULL_COLUMN_HEADERS: Record<ProfileColumnKey, string> = {
  name: 'Full Name',
  company: 'Company',
  website: 'Website',
  position: 'Position',
  linkedin: 'LinkedIn',
};

export const COLUMN_BADGE_LABELS: Record<ProfileColumnKey, string> = {
  name: 'N',
  company: 'C',
  website: 'W',
  position: 'P',
  linkedin: 'L',
};

export interface ProfileColumnValidation {
  name: boolean;
  company: boolean;
  website: boolean;
  position: boolean;
  linkedin: boolean;
  isValid: boolean;
  detectedHeaders: Partial<Record<ProfileColumnKey, string>>;
}

export type SpreadsheetRow = Record<string, string>;

const normalizeHeader = (header: string) => header.trim().toLowerCase();

const NAME_ALIASES = ['n', 'name', 'full name', 'fullname', 'full_name'];
const COMPANY_ALIASES = ['c', 'company', 'company name', 'companyname', 'company_name'];
const WEBSITE_ALIASES = ['w', 'website', 'web', 'site', 'url', 'company website', 'company_website'];
const POSITION_ALIASES = [
  'p',
  'position',
  'title',
  'job title',
  'jobtitle',
  'job_title',
  'current position',
  'currentposition',
  'current_position',
  'current title',
  'currenttitle',
  'current_title',
];
const LINKEDIN_ALIASES = [
  'l',
  'linkedin',
  'linkedin url',
  'linkedinurl',
  'linkedin_url',
  'linkedin profile',
  'linkedinprofile',
];

const findHeader = (headers: string[], aliases: string[]): string | undefined => {
  const normalized = headers.map((raw) => ({ raw, norm: normalizeHeader(raw) }));

  for (const alias of aliases) {
    const exact = normalized.find((entry) => entry.norm === alias);
    if (exact) return exact.raw;
  }

  return undefined;
};

export const validateProfileColumns = (data: SpreadsheetRow[]): ProfileColumnValidation => {
  const empty: ProfileColumnValidation = {
    name: false,
    company: false,
    website: false,
    position: false,
    linkedin: false,
    isValid: false,
    detectedHeaders: {},
  };

  if (!data.length) return empty;

  const headers = Object.keys(data[0]);
  const nameHeader = findHeader(headers, NAME_ALIASES);
  const companyHeader = findHeader(headers, COMPANY_ALIASES);
  const websiteHeader = findHeader(headers, WEBSITE_ALIASES);
  const positionHeader = findHeader(headers, POSITION_ALIASES);
  const linkedinHeader = findHeader(headers, LINKEDIN_ALIASES);

  const detectedHeaders: Partial<Record<ProfileColumnKey, string>> = {};
  if (nameHeader) detectedHeaders.name = nameHeader;
  if (companyHeader) detectedHeaders.company = companyHeader;
  if (websiteHeader) detectedHeaders.website = websiteHeader;
  if (positionHeader) detectedHeaders.position = positionHeader;
  if (linkedinHeader) detectedHeaders.linkedin = linkedinHeader;

  return {
    name: !!nameHeader,
    company: !!companyHeader,
    website: !!websiteHeader,
    position: !!positionHeader,
    linkedin: !!linkedinHeader,
    isValid: !!nameHeader && !!companyHeader && !!positionHeader,
    detectedHeaders,
  };
};

export const validateCompanyColumn = (
  data: SpreadsheetRow[]
): { company: boolean; isValid: boolean; detectedCompanyHeader?: string } => {
  if (!data.length) {
    return { company: false, isValid: false };
  }

  const header = findHeader(Object.keys(data[0]), COMPANY_ALIASES);
  return {
    company: !!header,
    isValid: !!header,
    detectedCompanyHeader: header,
  };
};

export const normalizeProfileRows = (
  data: SpreadsheetRow[],
  validation: ProfileColumnValidation
): SpreadsheetRow[] => {
  if (!data.length) return [];

  const mapKey = (key: ProfileColumnKey) => validation.detectedHeaders[key];

  return data.map((row) => ({
    [FULL_COLUMN_HEADERS.name]: mapKey('name') ? String(row[mapKey('name')!] ?? '').trim() : '',
    [FULL_COLUMN_HEADERS.company]: mapKey('company') ? String(row[mapKey('company')!] ?? '').trim() : '',
    [FULL_COLUMN_HEADERS.website]: mapKey('website') ? String(row[mapKey('website')!] ?? '').trim() : '',
    [FULL_COLUMN_HEADERS.position]: mapKey('position') ? String(row[mapKey('position')!] ?? '').trim() : '',
    [FULL_COLUMN_HEADERS.linkedin]: mapKey('linkedin') ? String(row[mapKey('linkedin')!] ?? '').trim() : '',
  }));
};

export const rowHasLinkedIn = (row: SpreadsheetRow): boolean =>
  Boolean(row[FULL_COLUMN_HEADERS.linkedin]?.trim());
