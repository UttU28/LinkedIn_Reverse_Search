import React, { useRef, useState, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../hooks/use-toast';
import { Button } from './ui/button';
import { Label } from './ui/label';
import {
  Upload,
  X,
  FileIcon as FileComponent,
  AlertCircle,
  CircleCheck as Check,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { refreshSearchHistory } from '../lib/searchService';
import { findSingleCompanyWebsite, findBulkCompanyWebsites } from '../services/apiService';

interface CompanyCSVRow {
  [key: string]: string | undefined;
}

interface CompanyColumnValidation {
  company: boolean;
  detectedCompanyHeader?: string;
  isValid: boolean;
}

const CompanySearchCard: React.FC = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, userData } = useAuthStore();
  const credits = userData?.linkCredits ?? 0;

  const [singleCompany, setSingleCompany] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CompanyCSVRow[]>([]);
  const [validation, setValidation] = useState<CompanyColumnValidation>({
    company: false,
    detectedCompanyHeader: undefined,
    isValid: false
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [isProcessingSingle, setIsProcessingSingle] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [singleResult, setSingleResult] = useState<{
    companyName: string;
    websiteUrl: string;
    fromCache: boolean;
  } | null>(null);
  const [bulkResults, setBulkResults] = useState<
    { companyName: string; websiteUrl: string; fromCache: boolean }[]
  >([]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / 1048576)} MB`;
  };

  const resetFile = () => {
    setSelectedFile(null);
    setParsedData([]);
    setValidation({
      company: false,
      detectedCompanyHeader: undefined,
      isValid: false
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      file.type !== 'text/csv' &&
      !file.name.endsWith('.csv') &&
      file.type !== 'application/vnd.ms-excel' &&
      file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      toast({
        title: 'Invalid file format',
        description: 'Please upload a CSV or Excel file',
        variant: 'destructive'
      });
      return;
    }

    setSelectedFile(file);

    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setParsedData(results.data as CompanyCSVRow[]);
        },
        error: () => {
          toast({
            title: 'Parsing error',
            description: 'Could not parse the CSV file',
            variant: 'destructive'
          });
        }
      });
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = ev.target?.result;
          if (!data) throw new Error('Failed to read file');

          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json<CompanyCSVRow>(worksheet, { raw: false });
          setParsedData(jsonData);
        } catch {
          toast({
            title: 'Parsing error',
            description: 'Could not parse the Excel file',
            variant: 'destructive'
          });
        }
      };
      reader.onerror = () => {
        toast({
          title: 'File error',
          description: 'Could not read the Excel file',
          variant: 'destructive'
        });
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => prev + 1);
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => prev - 1);
    if (dragCounter <= 1) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const mockEvent = {
        target: { files: [file] }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(mockEvent);
    }
  };

  const validateCompanyColumn = (data: CompanyCSVRow[]): CompanyColumnValidation => {
    if (!data.length) {
      return {
        company: false,
        detectedCompanyHeader: undefined,
        isValid: false
      };
    }

    const headers = Object.keys(data[0]);
    const lowerHeaders = headers.map((h) => h.toLowerCase());

    const idx = lowerHeaders.findIndex(
      (h) =>
        h === 'company' ||
        h === 'companyname' ||
        h === 'company name' ||
        h === 'company_name' ||
        h.includes('company')
    );

    if (idx === -1) {
      return {
        company: false,
        detectedCompanyHeader: undefined,
        isValid: false
      };
    }

    return {
      company: true,
      detectedCompanyHeader: headers[idx],
      isValid: true
    };
  };

  const getUniqueCompanyCount = () => {
    if (!parsedData.length || !validation.detectedCompanyHeader) return 0;
    const header = validation.detectedCompanyHeader;
    const seen = new Set<string>();
    parsedData.forEach((row) => {
      const name = (row[header] || '').toString().trim();
      if (name) seen.add(name.toLowerCase());
    });
    return seen.size;
  };

  useEffect(() => {
    if (!parsedData.length) {
      setValidation({
        company: false,
        detectedCompanyHeader: undefined,
        isValid: false
      });
      return;
    }

    const nextValidation = validateCompanyColumn(parsedData);
    setValidation(nextValidation);

    if (!nextValidation.isValid) {
      toast({
        title: 'Company column not found',
        description: 'Please ensure your file has a Company or Company Name column.',
        variant: 'destructive'
      });
    } else if (nextValidation.detectedCompanyHeader) {
      const header = nextValidation.detectedCompanyHeader;
      const seen = new Set<string>();
      parsedData.forEach((row) => {
        const name = (row[header] || '').toString().trim();
        if (name) seen.add(name.toLowerCase());
      });
      const uniqueCount = seen.size;
      if (uniqueCount > 0 && credits < uniqueCount) {
        toast({
          title: 'Insufficient credits for this file',
          description: `You need ₹ ${uniqueCount} credits for ${uniqueCount} companies but have ₹ ${credits}. Please purchase more credits.`,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'File ready',
          description: `Detected company column: "${nextValidation.detectedCompanyHeader}".${uniqueCount > 0 && credits >= uniqueCount ? ` You have ₹ ${credits} credits for ${uniqueCount} companies.` : ''}`,
          variant: 'default'
        });
      }
    }
  }, [parsedData, toast, credits]);

  const handleSingleProcessClick = async () => {
    if (!singleCompany.trim()) {
      toast({
        title: 'Company name required',
        description: 'Please enter a company name first.',
        variant: 'destructive'
      });
      return;
    }

    const userId = user?.uid;
    if (!userId) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in again to search for company websites.',
        variant: 'destructive'
      });
      return;
    }

    if (credits < 1) {
      toast({
        title: 'Insufficient credits',
        description: "You don't have enough credits. Please purchase credits to search for company websites.",
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsProcessingSingle(true);
      setSingleResult(null);

      const response = await findSingleCompanyWebsite({
        userID: userId,
        companyName: singleCompany.trim()
      });

      setSingleResult({
        companyName: singleCompany.trim(),
        websiteUrl: response.websiteUrl,
        fromCache: response.fromCache
      });

      if (!response.websiteUrl) {
        toast({
          title: 'No official site found',
          description: 'We could not confidently identify an official website for this company.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: response.fromCache ? 'Found in cache' : 'Official website found',
          description: response.websiteUrl,
          variant: 'default'
        });
      }

      // Refresh credits after backend has applied charges
      await useAuthStore.getState().refreshCredits();
      // Refresh search history so Dashboard Overview updates live
      refreshSearchHistory();
    } catch (error) {
      console.error('Single company website error:', error);
      toast({
        title: 'Search failed',
        description: error instanceof Error ? error.message : 'There was a problem finding the company website.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessingSingle(false);
    }
  };

  const containerAnimation = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemAnimation = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div
      className="bg-card rounded-xl border border-border/50 p-4 sm:p-6 hover:border-accent/50 transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h3
        className="text-lg sm:text-xl font-heading font-medium text-primary-text mb-4 sm:mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Company Finder (Upload CSV / Excel)
      </motion.h3>

      <motion.div
        className="space-y-6 sm:space-y-8"
        variants={containerAnimation}
        initial="hidden"
        animate="show"
      >
        {/* Single company input */}
        <motion.div variants={itemAnimation} className="space-y-3">
          <Label htmlFor="single-company-input" className="text-sm">
            Single Company Name
          </Label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="single-company-input"
              className="flex-1 h-10 rounded-md border border-border bg-background px-3 text-sm text-primary-text placeholder:text-secondary-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
              placeholder="Acme Inc"
              value={singleCompany}
              onChange={(e) => setSingleCompany(e.target.value)}
            />
            <Button
              type="button"
              className="bg-primary hover:bg-accent-hover h-10 sm:h-11 px-4 sm:px-6 flex-shrink-0"
              disabled={!singleCompany.trim() || isProcessingSingle || credits < 1}
              onClick={handleSingleProcessClick}
            >
              {isProcessingSingle ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </span>
              ) : (
                'Process Single Company'
              )}
            </Button>
          </div>
          {singleResult && (
            <div className="mt-3 text-xs">
              {singleResult.websiteUrl ? (
                <a
                  href={singleResult.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="font-medium text-primary-text hover:text-accent hover:underline">
                    {singleResult.companyName}
                  </div>
                  <div className="mt-0.5 text-accent hover:text-accent/80 hover:underline break-all">
                    {singleResult.websiteUrl}
                  </div>
                </a>
              ) : (
                <div>
                  <div className="font-medium text-primary-text">{singleResult.companyName}</div>
                  <div className="mt-0.5 text-secondary-text">
                    No official website found for this company.
                  </div>
                </div>
              )}
              <div className="mt-1 text-secondary-text">
                {singleResult.websiteUrl
                  ? 'This search used ₹ 1 credit from your account.'
                  : '₹ 0 credits used from your account.'}
              </div>
            </div>
          )}
        </motion.div>

        {/* Divider */}
        <motion.div variants={itemAnimation} className="relative flex items-center py-1 sm:py-2">
          <div className="flex-grow border-t border-border" />
          <span className="flex-shrink-0 mx-3 text-secondary-text text-xs uppercase tracking-wide">
            Or upload a file
          </span>
          <div className="flex-grow border-t border-border" />
        </motion.div>

        {/* CSV / Excel upload */}
        <motion.div variants={itemAnimation}>
          <Label className="text-sm mb-2 block">
            Upload a file with a <span className="font-semibold">Company</span> or{' '}
            <span className="font-semibold">Company Name</span> column.
          </Label>

          <input
            type="file"
            ref={fileInputRef}
            id="company-file-input"
            className="hidden"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
          />

          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-4 sm:p-5 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center ${
                isDragging
                  ? 'border-accent bg-accent/10 scale-105'
                  : 'border-border hover:border-accent/50 hover:bg-accent/5'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-200 ${
                  isDragging ? 'bg-accent/20 scale-110' : 'bg-accent/10'
                }`}
              >
                <Upload
                  className={`h-4 w-4 sm:h-5 sm:w-5 transition-all duration-200 ${
                    isDragging ? 'text-accent scale-110 animate-bounce' : 'text-accent'
                  }`}
                />
              </div>
              <p className="text-secondary-text text-xs sm:text-sm mb-3">
                {isDragging
                  ? 'Drop your file here to upload'
                  : 'Drag & drop or click to upload a CSV or Excel file with company names.'}
              </p>
              <Button
                type="button"
                size="sm"
                className="bg-accent/20 hover:bg-accent/30 text-accent hover:text-primary-text border border-accent/40 h-9 px-3 sm:px-4"
                onClick={(event) => {
                  event.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <FileComponent className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Browse Files
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-background/70 rounded-lg p-3 sm:p-4">
                <div className="flex items-center mb-3">
                  <FileComponent className="text-accent mr-3 shrink-0 h-5 w-5" />
                  <div className="flex-grow min-w-0">
                    <p className="text-primary-text font-medium text-sm truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-secondary-text text-xs">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <button
                    type="button"
                    className="text-secondary-text hover:text-destructive ml-2 flex-shrink-0"
                    onClick={resetFile}
                  >
                    <X size={18} />
                  </button>
                </div>

                {parsedData.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 pt-3 sm:pt-4 pb-2 border-t border-border">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full mb-1 sm:mb-2 flex items-center justify-center shadow-md ${
                          validation.company
                            ? 'bg-primary/20 border border-primary/60'
                            : 'bg-destructive/20 border border-destructive/60'
                        }`}
                      >
                        {validation.company ? (
                          <Check size={16} className="text-primary" />
                        ) : (
                          <X size={16} className="text-destructive" />
                        )}
                      </div>
                      <span
                        className={`text-xs sm:text-sm font-medium text-center ${
                          validation.company ? 'text-primary-text' : 'text-secondary-text'
                        }`}
                      >
                        Company column
                      </span>
                    </div>
                  </div>
                )}

                {parsedData.length > 0 && !validation.isValid && (
                  <div className="mt-3 p-2 sm:p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start">
                    <AlertCircle size={14} className="text-destructive shrink-0 mr-2 mt-0.5" />
                    <span className="text-xs text-destructive">
                      We could not find a Company or Company Name column. Please update your file and
                      upload again.
                    </span>
                  </div>
                )}
              </div>

              {parsedData.length > 0 && (
                <div className="bg-background/50 rounded-lg overflow-hidden">
                  <div className="p-2 sm:p-3 border-b border-border">
                    <p className="text-xs sm:text-sm text-primary-text font-medium">
                      Preview: {parsedData.length} row{parsedData.length !== 1 ? 's' : ''} detected
                    </p>
                    {validation.detectedCompanyHeader && (
                      <p className="text-xs text-secondary-text mt-1">
                        Using column <span className="font-semibold">{validation.detectedCompanyHeader}</span>{' '}
                        as Company.
                      </p>
                    )}
                  </div>

                  <div className="p-2 max-h-48 overflow-y-auto custom-scrollbar">
                    <div className="overflow-x-auto custom-scrollbar -mx-2 px-2">
                      <table className="min-w-full divide-y divide-border text-xs sm:text-sm">
                        <thead className="bg-background/70">
                          <tr>
                            {Object.keys(parsedData[0] || {}).map((header, index) => (
                              <th
                                key={index}
                                className="px-2 py-1 sm:px-3 sm:py-2 text-left text-xs font-medium text-secondary-text uppercase tracking-wider sticky top-0 bg-background/90 backdrop-blur-sm"
                                style={{ minWidth: '120px' }}
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {parsedData.slice(0, 5).map((row, rowIndex) => (
                            <tr
                              key={rowIndex}
                              className={rowIndex % 2 === 0 ? 'bg-background/30' : 'bg-background/10'}
                            >
                              {Object.entries(row).map(([_, value], cellIndex) => (
                                <td
                                  key={cellIndex}
                                  className="px-2 py-1 sm:px-3 sm:py-2 text-primary-text overflow-hidden text-ellipsis whitespace-nowrap"
                                >
                                  <div className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px] sm:max-w-full">
                                    {value as string || '-'}
                                  </div>
                                </td>
                              ))}
                            </tr>
                          ))}
                          {parsedData.length > 5 && (
                            <tr>
                              <td
                                colSpan={Object.keys(parsedData[0] || {}).length}
                                className="px-2 py-1 sm:px-3 sm:py-2 text-center text-secondary-text italic text-xs"
                              >
                                + {parsedData.length - 5} more rows
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-2"
        >
          <Button
            type="button"
            className="bg-primary hover:bg-accent-hover w-full h-10 sm:h-11"
            disabled={
              !selectedFile ||
              !validation.isValid ||
              isProcessingBulk ||
              (getUniqueCompanyCount() > 0 && credits < getUniqueCompanyCount())
            }
            onClick={async () => {
              if (!selectedFile || !validation.isValid || !validation.detectedCompanyHeader) {
                return;
              }

              const userId = user?.uid;
              if (!userId) {
                toast({
                  title: 'Sign in required',
                  description: 'Please sign in again to process company lists.',
                  variant: 'destructive'
                });
                return;
              }

              const header = validation.detectedCompanyHeader;
              const companiesRaw = parsedData
                .map((row) => (row[header] || '').toString().trim())
                .filter((name) => name.length > 0);

              if (!companiesRaw.length) {
                toast({
                  title: 'No companies found',
                  description: 'We could not read any company names from the selected column.',
                  variant: 'destructive'
                });
                return;
              }

              const seen = new Map<string, string>();
              companiesRaw.forEach((name) => {
                const key = name.toLowerCase();
                if (!seen.has(key)) {
                  seen.set(key, name);
                }
              });
              const uniqueCompanies = Array.from(seen.values());

              if (credits < uniqueCompanies.length) {
                toast({
                  title: 'Insufficient credits',
                  description: `You need ₹ ${uniqueCompanies.length} credits for ${uniqueCompanies.length} companies but have ₹ ${credits}. Please purchase more credits.`,
                  variant: 'destructive'
                });
                return;
              }

              try {
                setIsProcessingBulk(true);

                const response = await findBulkCompanyWebsites({
                  userID: userId,
                  companies: uniqueCompanies,
                  fileName: selectedFile.name
                });

                setBulkResults(response.results);

                toast({
                  title: response.success ? 'Bulk company processing complete' : 'Bulk processing failed',
                  description: response.message,
                  variant: response.success ? 'default' : 'destructive'
                });

                // Refresh credits after backend charges for successful websites
                if (response.success) {
                  await useAuthStore.getState().refreshCredits();
                  refreshSearchHistory();
                }
              } catch (error) {
                console.error('Bulk company website error:', error);
                toast({
                  title: 'Bulk processing failed',
                  description: error instanceof Error ? error.message : 'There was a problem processing the company list.',
                  variant: 'destructive'
                });
              } finally {
                setIsProcessingBulk(false);
              }
            }}
          >
            {isProcessingBulk ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing Companies...
              </span>
            ) : (
              'Process Companies'
            )}
          </Button>
        </motion.div>

        {/* Bulk results and download options */}
        {bulkResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-sm text-primary-text font-medium">
                Processed {bulkResults.length} unique compan{bulkResults.length === 1 ? 'y' : 'ies'}.
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const headers = ['Company', 'Website'];
                    const rows = bulkResults.map((row) => [
                      row.companyName,
                      row.websiteUrl
                    ]);

                    const lines = [headers, ...rows]
                      .map((cols) =>
                        cols
                          .map((col) => {
                            const value = col || '';
                            const escaped = value.replace(/"/g, '""');
                            return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
                          })
                          .join(',')
                      )
                      .join('\n');

                    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'company-websites.csv';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download CSV
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const headers = ['Company', 'Website'];
                    const wsData = [
                      headers,
                      ...bulkResults.map((row) => [
                        row.companyName,
                        row.websiteUrl
                      ])
                    ];

                    const wb = XLSX.utils.book_new();
                    const ws = XLSX.utils.aoa_to_sheet(wsData);
                    XLSX.utils.book_append_sheet(wb, ws, 'Company Websites');
                    XLSX.writeFile(wb, 'company-websites.xlsx');
                  }}
                >
                  Download Excel
                </Button>
              </div>
            </div>

            <div className="bg-background/50 rounded-lg overflow-hidden">
              <div className="p-2 max-h-56 overflow-y-auto custom-scrollbar">
                <div className="overflow-x-auto custom-scrollbar -mx-2 px-2">
                  <table className="min-w-full divide-y divide-border text-xs sm:text-sm">
                    <thead className="bg-background/70">
                      <tr>
                        <th className="px-2 py-1 sm:px-3 sm:py-2 text-left text-xs font-medium text-secondary-text uppercase tracking-wider sticky top-0 bg-background/90 backdrop-blur-sm">
                          Company
                        </th>
                        <th className="px-2 py-1 sm:px-3 sm:py-2 text-left text-xs font-medium text-secondary-text uppercase tracking-wider sticky top-0 bg-background/90 backdrop-blur-sm">
                          Website
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {bulkResults.map((row, index) => (
                        <tr
                          key={`${row.companyName}-${index}`}
                          className={index % 2 === 0 ? 'bg-background/30' : 'bg-background/10'}
                        >
                          <td className="px-2 py-1 sm:px-3 sm:py-2 text-primary-text whitespace-nowrap">
                            {row.companyName}
                          </td>
                      <td className="px-2 py-1 sm:px-3 sm:py-2 text-primary-text whitespace-nowrap">
                        {row.websiteUrl ? (
                          <a
                            href={row.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:text-accent/80 hover:underline break-all"
                          >
                            {row.websiteUrl}
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default CompanySearchCard;

