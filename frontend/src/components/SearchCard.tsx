import React, { useState, useRef, ChangeEvent, FormEvent, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/use-toast';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { 
  Search, 
  Upload, 
  X, 
  Linkedin, 
  Copy,
  FileUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CircleCheck as Check,
  CircleX as XCircle,
  FileIcon as FileComponent
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { findSingleContact, findBatchContacts } from '../services/apiService';
import { refreshSearchHistory } from '../lib/searchService';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import ColumnAvailabilityBadges from './ColumnAvailabilityBadges';
import { validateProfileColumns, type ProfileColumnValidation } from '../utils/spreadsheetColumns';

// Temporary type definitions until the real files are created
interface SearchResponse {
  data: any;
  status: string;
}

interface SearchResult {
  linkedinProfileUrl?: string;
  searchName?: string;
  searchCompany?: string;
  searchPosition?: string;
  foundData?: number;
}

// Temporary utility functions until the real files are created
const parseCSVorExcel = (file: File) => {
  // This is just a stub - implement or import the real function
  return Promise.resolve([]);
};

const generateId = () => {
  return `id-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

interface CSVRow {
  Name?: string;
  Company?: string;
  Position?: string;
  Title?: string;
  [key: string]: string | undefined;
}

// At the top of the file, add an interface for the props
interface SearchCardProps {
  onSearchComplete?: () => void;
}

const SearchCard: React.FC<SearchCardProps> = ({ onSearchComplete }) => {
  const { updateCreditUsage, userData } = useAuthStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Single search state
  const [searchForm, setSearchForm] = useState({
    name: '',
    company: '',
    position: '',
    title: ''
  });
  
  // Single search response state
  const [searchResponse, setSearchResponse] = useState<{
    linkedinProfileUrl?: string;
    companyUrl?: string;
    searchName?: string;
    searchCompany?: string;
    searchPosition?: string;
    foundData?: number;
  } | null>(null);
  
  // UI visibility states
  const [showCSVUpload, setShowCSVUpload] = useState(true);
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isProcessingSingle, setIsProcessingSingle] = useState(false);
  
  // CSV upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CSVRow[]>([]);
  const [isProcessingCSV, setIsProcessingCSV] = useState(false);
  const [columnValidation, setColumnValidation] = useState<ProfileColumnValidation>({
    name: false,
    company: false,
    website: false,
    position: false,
    linkedin: false,
    isValid: false,
    detectedHeaders: {},
  });
  
  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  
  // Bulk search response state
  const [bulkSearchResults, setBulkSearchResults] = useState<Array<{
    searchName: string;
    searchCompany: string;
    searchPosition: string;
    linkedinProfileUrl?: string;
    foundData: number;
  }> | null>(null);

  // Company links preference (synced with DB and localStorage)
  const [includeCompanyLinks, setIncludeCompanyLinks] = useState(false);
  
  // Calculate if either the single search or file upload is active
  const isSingleSearchActive = 
    searchForm.name.trim() !== '' || 
    searchForm.company.trim() !== '' || 
    searchForm.position.trim() !== '';
  
  const isBulkSearchActive = selectedFile !== null;
  
  // Effect to control CSV upload visibility based on single search form state
  useEffect(() => {
    if (isSingleSearchActive) {
      setShowCSVUpload(false);
    } else {
      setShowCSVUpload(true);
    }
  }, [isSingleSearchActive]);

  // Load company links preference from DB (userData) or localStorage
  useEffect(() => {
    if (userData?.includeCompanyLinks !== undefined) {
      setIncludeCompanyLinks(!!userData.includeCompanyLinks);
      return;
    }
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('includeCompanyLinks');
    if (stored !== null) setIncludeCompanyLinks(stored === 'true');
  }, [userData?.includeCompanyLinks]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('includeCompanyLinks', includeCompanyLinks ? 'true' : 'false');
  }, [includeCompanyLinks]);

  const handleCompanyLinksToggle = (value: boolean) => {
    setIncludeCompanyLinks(value);
    const uid = useAuthStore.getState().user?.uid;
    if (uid) {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:9221';
      fetch(`${API_BASE}/user-preference/${uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeCompanyLinks: value })
      }).catch(() => {});
    }
  };
  
  // Function to clear the single search form without clearing results
  const clearSearchFormOnly = () => {
    setSearchForm({
      name: '',
      company: '',
      position: '',
      title: ''
    });
    setValidationErrors({});
  };

  // Function to clear file upload without clearing results
  const resetFileUploadOnly = () => {
    setSelectedFile(null);
    setParsedData([]);
    // Reset column validation
    setColumnValidation({
      name: false,
      company: false,
      website: false,
      position: false,
      linkedin: false,
      isValid: false,
      detectedHeaders: {},
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Show the single search form again when CSV is removed
    setShowCSVUpload(true);
  };

  // Complete reset function that clears everything including results
  const clearSearchForm = () => {
    clearSearchFormOnly();
    setSearchResponse(null);
  };
  
  const handleRemoveFile = () => {
    resetFileUploadOnly();
    setBulkSearchResults(null);
  };
  
  // Single search handlers
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all required fields
    if (!searchForm.name.trim()) {
      setValidationErrors({ name: 'Full name is required' });
      return;
    }
    
    if (!searchForm.company.trim()) {
      setValidationErrors({ company: 'Company name is required' });
      return;
    }
    
    if (!searchForm.position.trim()) {
      setValidationErrors({ position: 'Position/title is required' });
      return;
    }
    
    // Check if user has enough credits
    if (userData?.linkCredits === undefined || userData.linkCredits < 1) {
      toast({
        title: "Insufficient credits",
        description: "You don't have enough credits to perform this search",
        variant: "destructive"
      });
      return;
    }
    
    // Process search
    setIsProcessingSingle(true);
    
    // Get user ID from auth store
    const userID = useAuthStore.getState().user?.uid || 'unknown';
    
    try {
      // Use the API service to find contact
      const result = await findSingleContact({
        userID,
        searchName: searchForm.name,
        searchCompany: searchForm.company,
        searchPosition: searchForm.position,
        includeCompanyLinks
      });
      
      // Refresh credits from backend to get the real value
      await useAuthStore.getState().refreshCredits();
      
      // Clear bulk search results when setting new single search response
      setBulkSearchResults(null);
      
      // Set search response
      setSearchResponse(result.data);
      
      toast({
        title: "Search successful",
        description: result.data.foundData === 1 ? "We found a matching profile!" : "No exact match found. No credits were used.",
        variant: "default"
      });
      
      // Call the callback after the search is complete
      if (onSearchComplete) {
        onSearchComplete();
      }
      
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "There was a problem with your search",
        variant: "destructive"
      });
    } finally {
      setIsProcessingSingle(false);
      // Show both forms again after search is complete
      setShowCSVUpload(true);
    }
  };
  
  // Function to copy LinkedIn URL to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "LinkedIn URL has been copied to your clipboard",
        variant: "default"
      });
    }, (err) => {
      toast({
        title: "Copy failed",
        description: "Could not copy text to clipboard",
        variant: "destructive"
      });
    });
  };
  
  // CSV upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Clear previous search results when uploading a new file
      setSearchResponse(null);
      
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv') && 
          file.type !== 'application/vnd.ms-excel' && 
          file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        toast({
          title: "Invalid file format",
          description: "Please upload a CSV or Excel file",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Parse CSV file
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            // Process data to ensure position and title are treated as the same
            const processedData = (results.data as CSVRow[]).map(row => {
              // If Position exists, use it for Title; if Title exists but Position doesn't, use Title for Position
              if (row.Position && !row.Title) {
                row.Title = row.Position;
              } else if (row.Title && !row.Position) {
                row.Position = row.Title;
              }
              return row;
            });
            setParsedData(processedData);
          },
          error: (error) => {
            console.error('CSV parsing error:', error);
            toast({
              title: "Parsing error",
              description: "Could not parse the CSV file",
              variant: "destructive"
            });
          }
        });
      } else {
        // For Excel files
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            if (!data) {
              throw new Error("Failed to read file");
            }
            
            const workbook = XLSX.read(data, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convert worksheet to JSON
            const jsonData = XLSX.utils.sheet_to_json<CSVRow>(worksheet, { raw: false });
            
            // Process data to ensure position and title fields are synchronized
            const processedData = jsonData.map(row => {
              // Convert all keys to proper case (first letter capital)
              const processedRow: CSVRow = {};
              
              Object.entries(row).forEach(([key, value]) => {
                // Normalize key names (convert to Title Case)
                const normalizedKey = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
                  .replace(/position/i, 'Position')
                  .replace(/company/i, 'Company')
                  .replace(/name/i, 'Name')
                  .replace(/title/i, 'Title');
                
                processedRow[normalizedKey] = value as string;
              });
              
              // If Position exists, use it for Title; if Title exists but Position doesn't, use Title for Position
              if (processedRow.Position && !processedRow.Title) {
                processedRow.Title = processedRow.Position;
              } else if (processedRow.Title && !processedRow.Position) {
                processedRow.Position = processedRow.Title;
              }
              
              return processedRow;
            });
            
            setParsedData(processedData);
          } catch (error) {
            console.error('Excel parsing error:', error);
            toast({
              title: "Parsing error",
              description: "Could not parse the Excel file",
              variant: "destructive"
            });
          }
        };
        
        reader.onerror = () => {
          toast({
            title: "File error",
            description: "Could not read the Excel file",
            variant: "destructive"
          });
        };
        
        reader.readAsBinaryString(file);
      }
    }
  };

  // Drag and Drop Handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
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
      // Simulate the file input change event
      const mockEvent = {
        target: { files: [file] }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(mockEvent);
    }
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / 1048576) + ' MB';
  };
  
  // Validates which columns are present in the data
  // Effect to validate columns whenever parsed data changes
  useEffect(() => {
    if (parsedData.length > 0) {
      const validation = validateProfileColumns(parsedData);
      setColumnValidation(validation);
      
      if (!validation.isValid) {
        toast({
          title: "Missing required columns",
          description: "Your file must include N, C, and P (Name, Company, Position). W and L are optional.",
          variant: "destructive"
        });
      } else {
        const { detectedHeaders } = validation;
        
        // Log the content when all required fields are found
        console.log("CSV/Excel Upload - Found all required fields:");
        parsedData.forEach((row, index) => {
          console.log(`Record ${index + 1}:`, {
            "Full Name": detectedHeaders.name ? row[detectedHeaders.name] || "" : "",
            "Company": detectedHeaders.company ? row[detectedHeaders.company] || "" : "",
            "Position": detectedHeaders.position ? row[detectedHeaders.position] || "" : ""
          });
        });
        
        const recordCount = parsedData.length;
        const userCredits = userData?.linkCredits || 0;
        
        if (userCredits < recordCount) {
          toast({
            title: "Insufficient credits for bulk search",
            description: `You have ₹ ${userCredits} credits but need ₹ ${recordCount} for ${recordCount} records`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "File ready for bulk search",
            description: `You have ₹ ${userCredits} credits for ${recordCount} records (₹ ${userCredits - recordCount} remaining)`,
            variant: "default"
          });
        }
      }
    }
  }, [parsedData, toast]);

  // Generate a unique 9-digit batch ID using timestamp and userID
  const generateBatchId = (userId: string) => {
    const currentTime = Date.now().toString();
    const userPart = userId ? userId.slice(0, 4).replace(/\W/g, '') : 'user';
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const combinedId = (userPart + currentTime.slice(-4) + randomPart).slice(0, 9);
    
    return combinedId;
  };

  // Use a function to handle bulk search after file validation is complete
  const handleBulkSearch = async () => {
    if (!selectedFile || !parsedData.length) return;
    
    // Check if user has enough credits for bulk search
    const recordCount = parsedData.length;
    if (userData?.linkCredits === undefined || userData.linkCredits < recordCount) {
      toast({
        title: "Insufficient credits",
        description: `You need ${recordCount} credits but only have ₹ ${userData?.linkCredits || 0}`,
        variant: "destructive"
      });
      return;
    }
    
    // Get user ID from auth store
    const userID = useAuthStore.getState().user?.uid || 'unknown';
    
    // Generate a unique batch ID
    const batchId = `batch-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // Format contacts for batch processing
    const { detectedHeaders } = columnValidation;
    const contacts = parsedData.map((row, index) => ({
      searchName: detectedHeaders.name ? row[detectedHeaders.name] || "" : "",
      searchCompany: detectedHeaders.company ? row[detectedHeaders.company] || "" : "",
      searchPosition: detectedHeaders.position ? row[detectedHeaders.position] || "" : "",
      contactId: `temp-${index}` // Use temporary IDs
    }));
    
    setIsProcessingCSV(true);
    
    try {
      // Call the API service with the data
      const result = await findBatchContacts({
        userID,
        fileName: selectedFile.name,
        timestamp: Date.now(),
        batchId,
        contacts,
        includeCompanyLinks
      });
      
      // Clear single search response when setting new bulk results
      setSearchResponse(null);
      
      // Since processing happens in background, we don't have immediate results
      // Clear any previous bulk search results
      setBulkSearchResults(null);
      
      // Show processing started message
      toast({
        title: "Batch search started",
        description: `Processing ${contacts.length} contacts in the background. Check Dashboard History for results.`,
        variant: "default"
      });
      
      // Refresh search history to show the new entry
      refreshSearchHistory();
      
      // Reset the file input
      resetFileUploadOnly();
      
      // Call the callback if specified
      if (onSearchComplete) {
        onSearchComplete();
      }
    } catch (error) {
      console.error('Batch search error:', error);
      toast({
        title: "Batch search failed",
        description: "There was a problem with your search",
        variant: "destructive"
      });
    } finally {
      setIsProcessingCSV(false);
    }
  };

  // Determine whether to use single search or CSV search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSingleSearchActive && !isBulkSearchActive) {
      handleSingleSubmit(e);
    } else if (isBulkSearchActive && columnValidation.isValid) {
      handleBulkSearch();
    }
  };

  // Determine button text based on which search is active
  const getButtonText = () => {
    if (isProcessingSingle || isProcessingCSV) {
      return (
        <div className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {isProcessingSingle ? "Searching..." : "Processing..."}
        </div>
      );
    }
    
    if (isSingleSearchActive && !isBulkSearchActive) {
      return (
        <div className="flex items-center">
          <Search className="mr-2 h-4 w-4" />
          Find LinkedIn Profile
        </div>
      );
    }
    
    if (isBulkSearchActive && columnValidation.isValid) {
      return (
        <div className="flex items-center">
          <Upload className="mr-2 h-4 w-4" />
          Process {parsedData.length} Records
        </div>
      );
    }
    
    return (
      <div className="flex items-center">
        <Search className="mr-2 h-4 w-4" />
        Find LinkedIn Profile(s)
      </div>
    );
  };
  
  // Determine if the search button should be disabled
  const isSearchButtonDisabled = () => {
    if (isProcessingSingle || isProcessingCSV) return true;
    
    if (isSingleSearchActive && !isBulkSearchActive) {
      return (
        !searchForm.name.trim() || 
        !searchForm.company.trim() || 
        !searchForm.position.trim()
      );
    }
    
    if (isBulkSearchActive) {
      return !columnValidation.isValid;
    }
    
    return true; // Disable if neither search type is active
  };

  // Animations for sections
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
    <div className="space-y-6">
      {/* Combined Results Card - Positioned above the search form */}
      <AnimatePresence>
        {(searchResponse || (bulkSearchResults && bulkSearchResults.length > 0)) && (
          <motion.div 
            className="bg-card rounded-xl border border-border/50 p-4 sm:p-6 hover:border-accent/50 transition-all duration-300"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-2">
              <h3 className="text-lg sm:text-xl font-heading font-medium text-primary-text">
                Search Results
              </h3>
              <div className="flex items-center gap-3">
                {searchResponse && (
                  <span className={`px-3 py-1 text-xs rounded-full ${(searchResponse.foundData ?? 0) > 0 ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                    {(searchResponse.foundData ?? 0) > 0 ? '1 Profile Found' : 'No Match Found'}
                  </span>
                )}
                {bulkSearchResults && bulkSearchResults.length > 0 && (
                  <span className="bg-primary/20 text-primary text-xs px-3 py-1 rounded-full">
                    {bulkSearchResults.filter(r => r.foundData > 0).length} of {bulkSearchResults.length} Found
                  </span>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-secondary-text hover:text-destructive border-secondary-text hover:border-destructive h-8 w-8 p-0"
                  onClick={() => {
                    setSearchResponse(null);
                    setBulkSearchResults(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Single Search Result */}
            {searchResponse && (
              <div className="mb-4">
                {(searchResponse.foundData ?? 0) > 0 ? (
                  <div className="border border-border/30 rounded-lg overflow-hidden bg-card">
                    <div className="p-4 pt-2">
                      {/* Single result row - improved mobile layout */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center space-x-2 w-full sm:w-1/4">
                          <a 
                            href={searchResponse.linkedinProfileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#0077b5] hover:text-[#0077b5]/80"
                          >
                            <Linkedin className="h-5 w-5" />
                          </a>
                          <a 
                            href={searchResponse.linkedinProfileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium truncate"
                          >
                            {searchResponse.searchName}
                          </a>
                        </div>
                        <div className="w-full sm:w-1/4 truncate">
                          <span className="text-xs sm:text-sm text-secondary-text">
                            <span className="sm:hidden">Company: </span>
                            {searchResponse.searchCompany}
                          </span>
                        </div>
                        <div className="w-full sm:w-1/4 truncate">
                          <span className="text-xs sm:text-sm text-secondary-text">
                            <span className="sm:hidden">Position: </span>
                            {searchResponse.searchPosition}
                          </span>
                        </div>
                        <div className="w-full sm:w-1/4 flex items-center justify-start sm:justify-end space-x-2">
                          {searchResponse.linkedinProfileUrl && (
                            <>
                              <a 
                                href={searchResponse.linkedinProfileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 text-xs sm:text-sm truncate max-w-[150px] sm:max-w-[180px]"
                              >
                                {searchResponse.linkedinProfileUrl.split('.com/in/')[1].replace(/\/$/, '')}
                              </a>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-secondary-text hover:text-primary-text flex-shrink-0 h-6 w-6"
                                onClick={() => copyToClipboard(searchResponse.linkedinProfileUrl || '')}
                                title="Copy to clipboard"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      {searchResponse.companyUrl && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-secondary-text">Website:</span>
                          <a
                            href={searchResponse.companyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline truncate max-w-[200px] sm:max-w-none"
                          >
                            {searchResponse.companyUrl.replace(/^https?:\/\//, '')}
                          </a>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={() => copyToClipboard(searchResponse.companyUrl || '')}
                            title="Copy website"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <div className="text-xs text-secondary-text mt-4 pb-1">
                        <p>
                          This search used ₹ {(searchResponse.foundData ?? 0)} credit{(searchResponse.foundData ?? 0) !== 1 ? 's' : ''} from your account.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-border/30 rounded-lg overflow-hidden bg-card/90 bg-opacity-80">
                    <div className="p-4 pt-2">
                      {/* No match result row - improved for mobile */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center space-x-2 w-full sm:w-1/4">
                          <span className="text-secondary-text/70 h-5 w-5">
                            <Linkedin className="h-5 w-5 opacity-50" />
                          </span>
                          <span className="text-secondary-text truncate">
                            {searchResponse.searchName}
                          </span>
                        </div>
                        <div className="w-full sm:w-1/4 truncate">
                          <span className="text-xs sm:text-sm text-secondary-text">
                            <span className="sm:hidden">Company: </span>
                            {searchResponse.searchCompany}
                          </span>
                        </div>
                        <div className="w-full sm:w-1/4 truncate">
                          <span className="text-xs sm:text-sm text-secondary-text">
                            <span className="sm:hidden">Position: </span>
                            {searchResponse.searchPosition}
                          </span>
                        </div>
                        <div className="w-full sm:w-1/4 flex items-center justify-start sm:justify-end">
                          <span className="text-destructive text-xs sm:text-sm">Not Found</span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-secondary-text mt-4 pb-1">
                        <p>₹ 0 credits used from your account.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Bulk Search Results - improve scrolling on mobile */}
            {bulkSearchResults && bulkSearchResults.length > 0 && (
              <div className="border border-border/30 rounded-lg overflow-hidden bg-card">
                <div className="border-t border-border/30 max-h-96 overflow-y-auto">
                  {bulkSearchResults.map((result, index) => (
                    <div 
                      key={index} 
                      className={`p-4 ${index !== bulkSearchResults.length - 1 ? 'border-b border-border/30' : ''} ${result.foundData > 0 ? '' : 'bg-destructive/5'}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center space-x-2 w-full sm:w-1/4">
                          <a 
                            href={result.linkedinProfileUrl || "#"} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`h-6 w-6 rounded-full ${result.foundData > 0 ? 'bg-primary/20' : 'bg-destructive/20'} mr-2 flex items-center justify-center hover:bg-primary/40 transition-colors duration-200 ${!result.linkedinProfileUrl && 'pointer-events-none opacity-50'}`}
                            onClick={(e) => {
                              if (!result.linkedinProfileUrl) {
                                e.preventDefault();
                                return;
                              }
                            }}
                          >
                            <Linkedin className={`h-3 w-3 ${result.foundData > 0 ? 'text-primary' : 'text-destructive'}`} />
                          </a>
                          <a 
                            href={result.linkedinProfileUrl || "#"} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`hover:text-primary transition-colors duration-200 text-sm truncate ${!result.linkedinProfileUrl && 'pointer-events-none text-secondary-text'}`}
                            onClick={(e) => {
                              if (!result.linkedinProfileUrl) {
                                e.preventDefault();
                                return;
                              }
                            }}
                          >
                            {result.searchName}
                          </a>
                        </div>
                        <div className="w-full sm:w-1/4 truncate">
                          <span className="text-xs sm:text-sm text-secondary-text">
                            <span className="sm:hidden">Company: </span>
                            {result.searchCompany}
                          </span>
                        </div>
                        <div className="w-full sm:w-1/4 truncate">
                          <span className="text-xs sm:text-sm text-secondary-text">
                            <span className="sm:hidden">Position: </span>
                            {result.searchPosition}
                          </span>
                        </div>
                        <div className="w-full sm:w-1/4 flex items-center justify-start sm:justify-end">
                          {result.foundData > 0 ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success/20 text-success">
                              Found
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-destructive/20 text-destructive">
                              Not Found
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="px-4 py-3 border-t border-border/30 bg-background/20">
                  <p className="text-xs text-secondary-text">
                    This search used ₹ {bulkSearchResults.filter(r => r.foundData > 0).length} credit{bulkSearchResults.filter(r => r.foundData > 0).length !== 1 ? 's' : ''} from your account.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    
      {/* Main Search Form Card */}
    <motion.div 
      className="bg-card rounded-xl border border-border/50 p-4 sm:p-6 hover:border-accent/50 transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Heading */}
      <motion.h3 
        className="text-lg sm:text-xl font-heading font-medium text-primary-text mb-4 sm:mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Find LinkedIn Profiles
      </motion.h3>
      
      <form onSubmit={handleSearch} className="space-y-4 sm:space-y-6">
        {/* Single Search Section */}
        <motion.div 
          className="space-y-4"
          variants={containerAnimation}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={itemAnimation} className={`grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 ${isBulkSearchActive ? 'hidden' : 'block'}`}>
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="search-name" className="text-sm">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="search-name"
                  placeholder="John Smith"
                  value={searchForm.name}
                  onChange={(e) => setSearchForm({...searchForm, name: e.target.value})}
                  className={`h-10 ${validationErrors.name ? 'border-destructive' : ''}`}
                />
                {searchForm.name && (
                  <button 
                    type="button"
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text"
                    onClick={() => setSearchForm({...searchForm, name: ''})}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {validationErrors.name && (
                <p className="text-xs text-destructive">{validationErrors.name}</p>
              )}
            </div>
            
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="search-company" className="text-sm">
                Company Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="search-company"
                  placeholder="Acme Inc"
                  value={searchForm.company}
                  onChange={(e) => setSearchForm({...searchForm, company: e.target.value})}
                  className={`h-10 ${validationErrors.company ? 'border-destructive' : ''}`}
                />
                {searchForm.company && (
                  <button 
                    type="button"
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text"
                    onClick={() => setSearchForm({...searchForm, company: ''})}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {validationErrors.company && (
                <p className="text-xs text-destructive">{validationErrors.company}</p>
              )}
            </div>
            
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="search-position" className="text-sm">
                Job Title / Position <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="search-position"
                  placeholder="Marketing Director, Software Engineer, etc."
                  value={searchForm.position}
                  onChange={(e) => {
                    setSearchForm({
                      ...searchForm, 
                      position: e.target.value,
                      // Set title same as position since they're equivalent
                      title: e.target.value
                    });
                  }}
                  className={`h-10 ${validationErrors.position ? 'border-destructive' : ''}`}
                />
                {searchForm.position && (
                  <button 
                    type="button"
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text"
                    onClick={() => setSearchForm({...searchForm, position: '', title: ''})}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {validationErrors.position && (
                <p className="text-xs text-destructive">{validationErrors.position}</p>
              )}
            </div>
          </motion.div>
          
          {/* OR Divider */}
          {showCSVUpload && !isBulkSearchActive && (
            <motion.div variants={itemAnimation} className="relative flex items-center py-2 sm:py-4">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink-0 mx-2 sm:mx-4 text-secondary-text font-medium px-3 sm:px-4 py-1 rounded-full bg-background/50 text-xs sm:text-sm">OR</span>
              <div className="flex-grow border-t border-border"></div>
            </motion.div>
          )}
          
          {/* Bulk Upload Section - Improve file upload UI */}
          {showCSVUpload && (
            <motion.div variants={itemAnimation} className={isBulkSearchActive ? 'block' : 'block'}>
              <input
                type="file"
                ref={fileInputRef}
                id="csv-file-input"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
              />
              
              {!selectedFile ? (
                <div className="space-y-4">
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
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-200 ${
                      isDragging 
                        ? 'bg-accent/20 scale-110' 
                        : 'bg-accent/10'
                    }`}>
                      <Upload className={`h-4 w-4 sm:h-5 sm:w-5 transition-all duration-200 ${
                        isDragging 
                          ? 'text-accent scale-110 animate-bounce' 
                          : 'text-accent'
                      }`} />
                    </div>
                    <p className="text-secondary-text text-xs sm:text-sm mb-3">
                      {isDragging 
                        ? "Drop your file here to upload" 
                        : "Drag & drop or click to upload a CSV or Excel file with N, C, P columns (W, L optional)"
                      }
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-accent/20 hover:bg-accent/30 text-accent hover:text-primary-text border border-accent/40 h-9 px-3 sm:px-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      <FileComponent className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      Browse Files
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-background/70 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center mb-3">
                      <FileComponent className="text-accent mr-3 shrink-0 h-5 w-5" />
                      <div className="flex-grow min-w-0">
                        <p className="text-primary-text font-medium text-sm truncate">{selectedFile.name}</p>
                        <p className="text-secondary-text text-xs">{formatFileSize(selectedFile.size)}</p>
                      </div>
                      <button 
                        type="button"
                        className="text-secondary-text hover:text-destructive ml-2 flex-shrink-0"
                        onClick={handleRemoveFile}
                      >
                        <X size={18} />
                      </button>
                    </div>
                    
                    {parsedData.length > 0 && (
                      <div className="pt-3 sm:pt-4 pb-2 border-t border-border">
                        <ColumnAvailabilityBadges validation={columnValidation} />
                      </div>
                    )}
                    
                    {parsedData.length > 0 && !columnValidation.isValid && (
                      <div className="mt-3 p-2 sm:p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start">
                        <AlertCircle size={14} className="text-destructive shrink-0 mr-2 mt-0.5" />
                        <span className="text-xs text-destructive">
                          Required columns missing. Use N, C, and P (or full names: Name, Company, Position).
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {parsedData.length > 0 && (
                    <div className="bg-background/50 rounded-lg overflow-hidden">
                      <div className="p-2 sm:p-3 border-b border-border">
                        <p className="text-xs sm:text-sm text-primary-text font-medium">
                          Preview: {parsedData.length} records detected
                        </p>
                      </div>
                      
                      {/* Make the table scrollable horizontally on small screens */}
                      <div className="p-2 max-h-48 overflow-y-auto custom-scrollbar">
                        <div className="overflow-x-auto custom-scrollbar -mx-2 px-2">
                          <table className="min-w-full divide-y divide-border text-xs sm:text-sm">
                            <thead className="bg-background/70">
                              <tr>
                                {Object.keys(parsedData[0] || {}).map((header, index) => {
                                  // Calculate width dynamically based on column type
                                  let colWidth = "200px"; // Default width
                                  if (header.toLowerCase().includes('url')) {
                                    colWidth = "180px"; // URLs can be longer
                                  } else if (header.toLowerCase().includes('name')) {
                                    colWidth = "150px"; // Names
                                  } else if (header.toLowerCase().includes('position') || header.toLowerCase().includes('title')) {
                                    colWidth = "200px"; // Position/Title can be longer
                                  } else if (header.toLowerCase().includes('company')) {
                                    colWidth = "140px"; // Company names
                                  }
                                  
                                  return (
                                    <th 
                                      key={index} 
                                      className="px-2 py-1 sm:px-3 sm:py-2 text-left text-xs font-medium text-secondary-text uppercase tracking-wider sticky top-0 bg-background/90 backdrop-blur-sm"
                                      style={{ width: colWidth, minWidth: "100px" }}
                                    >
                                      {header}
                                    </th>
                                  );
                                })}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {parsedData.slice(0, 5).map((row, rowIndex) => (
                                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-background/30' : 'bg-background/10'}>
                                  {Object.entries(row).map(([key, value], cellIndex) => {
                                    // Determine if this is a URL column
                                    const isUrl = key.toLowerCase().includes('url');
                                    
                                    return (
                                      <td 
                                        key={cellIndex} 
                                        className="px-2 py-1 sm:px-3 sm:py-2 text-primary-text overflow-hidden text-ellipsis whitespace-nowrap"
                                      >
                                        <div className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px] sm:max-w-full">
                                          {value as string || '-'}
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                              {parsedData.length > 5 && (
                                <tr>
                                  <td colSpan={Object.keys(parsedData[0] || {}).length} className="px-2 py-1 sm:px-3 sm:py-2 text-center text-secondary-text italic text-xs">
                                    + {parsedData.length - 5} more records
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {parsedData.length > 0 && columnValidation.isValid && (
                    <div className="bg-success/10 rounded-lg p-2 sm:p-3 border border-success/20">
                      <div className="flex items-start">
                        <Check className="text-success shrink-0 mt-0.5 mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <p className="text-xs text-secondary-text">
                          Ready to process <span className="text-primary font-medium">{parsedData.length} record{parsedData.length !== 1 ? 's' : ''}</span>.
                          This will use <span className="text-primary font-medium">₹ {parsedData.length} credit{parsedData.length !== 1 ? 's' : ''}</span> from your account.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Company links toggle - applies to single & bulk search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-between gap-4 p-3 sm:p-4 rounded-lg border border-border/50 bg-background/40"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary-text">Include company website links</p>
            <p className="text-xs text-secondary-text mt-0.5">Also fetch company links using existing logic when searching</p>
          </div>
          <Switch
            checked={includeCompanyLinks}
            onCheckedChange={handleCompanyLinksToggle}
            aria-label="Include company website links in results"
            className="flex-shrink-0"
          />
        </motion.div>
        
        {/* Search Button - improve touch target */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-2"
        >
          <Button
            type="submit"
            className="bg-primary hover:bg-accent-hover w-full h-10 sm:h-11"
            disabled={isSearchButtonDisabled()}
          >
            {getButtonText()}
          </Button>
          
          {isSingleSearchActive && (
            <Button
              type="button"
              variant="outline"
              className="flex-shrink-0 h-10 sm:h-11 w-10 p-0"
              onClick={clearSearchFormOnly}
              title="Clear form"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </motion.div>
      </form>
    </motion.div>
    </div>
  );
};

export default SearchCard;