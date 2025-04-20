import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/use-toast';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Info, Search, Upload, FileUp, File, X, Check, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';

interface CSVRow {
  Name?: string;
  Company?: string;
  Position?: string;
  Title?: string;
  [key: string]: string | undefined;
}

interface ColumnValidation {
  name: boolean;
  company: boolean;
  position: boolean;
  isValid: boolean;
}

const SearchCard: React.FC = () => {
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
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isProcessingSingle, setIsProcessingSingle] = useState(false);
  
  // CSV upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CSVRow[]>([]);
  const [isProcessingCSV, setIsProcessingCSV] = useState(false);
  const [columnValidation, setColumnValidation] = useState<ColumnValidation>({
    name: false,
    company: false,
    position: false,
    isValid: false
  });
  
  // Calculate if either the single search or file upload is active
  const isSingleSearchActive = 
    searchForm.name.trim() !== '' || 
    searchForm.company.trim() !== '' || 
    searchForm.position.trim() !== '';
  
  const isBulkSearchActive = selectedFile !== null;
  
  // Single search handlers
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset validation errors
    setValidationErrors({});
    
    // Validate form
    let hasErrors = false;
    const errors: Record<string, string> = {};
    
    if (!searchForm.name.trim()) {
      errors.name = 'Name is required';
      hasErrors = true;
    }
    
    if (!searchForm.company.trim()) {
      errors.company = 'Company is required';
      hasErrors = true;
    }
    
    if (!searchForm.position.trim()) {
      errors.position = 'Position is required';
      hasErrors = true;
    }
    
    if (hasErrors) {
      setValidationErrors(errors);
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
    
    try {
      // In a real app, this would call an API endpoint
      // For now we'll simulate a successful search after a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update credits
      await updateCreditUsage(1, 1);
      
      toast({
        title: "Search successful",
        description: "We found a matching profile!",
        variant: "default"
      });
      
      // Reset form
      setSearchForm({
        name: '',
        company: '',
        position: '',
        title: ''
      });
      
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "There was a problem with your search",
        variant: "destructive"
      });
    } finally {
      setIsProcessingSingle(false);
    }
  };
  
  // CSV upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
  
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setParsedData([]);
    // Reset column validation
    setColumnValidation({
      name: false,
      company: false,
      position: false,
      isValid: false
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / 1048576) + ' MB';
  };
  
  // Validates which required columns are present in the data
  const validateColumns = (data: CSVRow[]): ColumnValidation => {
    if (!data.length) return { name: false, company: false, position: false, isValid: false };
    
    // Get all column headers from the first row
    const headers = Object.keys(data[0]).map(h => h.toLowerCase());
    
    // Check for name column (variations)
    const hasName = headers.some(h => 
      h === 'name' || h === 'fullname' || h === 'full name' || h === 'full_name' || h.includes('name')
    );
    
    // Check for company column (variations)
    const hasCompany = headers.some(h => 
      h === 'company' || h === 'companyname' || h === 'company name' || h === 'company_name' || h.includes('company')
    );
    
    // Check for position/title column (variations)
    const hasPosition = headers.some(h => 
      h === 'position' || h === 'title' || h === 'jobtitle' || h === 'job title' || 
      h === 'job_title' || h === 'currentposition' || h === 'current position' || 
      h === 'current_position' || h === 'currenttitle' || h === 'current title' || 
      h === 'current_title' || h.includes('position') || h.includes('title')
    );
    
    // All required columns must be present
    const isValid = hasName && hasCompany && hasPosition;
    
    return { name: hasName, company: hasCompany, position: hasPosition, isValid };
  };
  
  // Effect to validate columns whenever parsed data changes
  useEffect(() => {
    if (parsedData.length > 0) {
      const validation = validateColumns(parsedData);
      setColumnValidation(validation);
      
      if (!validation.isValid) {
        toast({
          title: "Missing required columns",
          description: "Your file must include columns for Name, Company, and Position/Title.",
          variant: "destructive"
        });
      }
    }
  }, [parsedData, toast]);

  const handleCSVSubmit = async () => {
    if (!selectedFile) return;
    
    // Check if columns are valid
    if (!columnValidation.isValid) {
      toast({
        title: "Missing required columns",
        description: "Your file must include columns for Name, Company, and Position/Title.",
        variant: "destructive"
      });
      return;
    }
    
    // Check credits
    const recordCount = parsedData.length || 5; // Default to 5 if we can't determine
    
    if (userData?.linkCredits === undefined || userData.linkCredits < recordCount) {
      toast({
        title: "Insufficient credits",
        description: `You need ${recordCount} credits but only have ${userData?.linkCredits || 0}`,
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessingCSV(true);
    
    try {
      // In a real app, this would call an API endpoint
      // For now we'll simulate processing after a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Assume 80% success rate
      const successCount = Math.floor(recordCount * 0.8);
      
      // Update credits
      await updateCreditUsage(recordCount, successCount);
      
      toast({
        title: "Processing complete",
        description: `Successfully found ${successCount} out of ${recordCount} profiles`,
        variant: "default"
      });
      
      // Reset form
      handleRemoveFile();
      
    } catch (error) {
      console.error('CSV processing error:', error);
      toast({
        title: "Processing failed",
        description: "There was a problem processing your file",
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
      handleCSVSubmit();
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
    <motion.div 
      className="bg-card rounded-xl border border-border/50 p-6 hover:border-accent/50 transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Heading */}
      <motion.h3 
        className="text-xl font-heading font-medium text-primary-text mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Find LinkedIn Profiles
      </motion.h3>
      
      <form onSubmit={handleSearch} className="space-y-6">
        {/* Single Search Section */}
        <motion.div 
          className="space-y-4"
          variants={containerAnimation}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={itemAnimation} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search-name" className="text-sm">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="search-name"
                placeholder="John Smith"
                value={searchForm.name}
                onChange={(e) => setSearchForm({...searchForm, name: e.target.value})}
                className={validationErrors.name ? 'border-destructive' : ''}
              />
              {validationErrors.name && (
                <p className="text-xs text-destructive">{validationErrors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="search-company" className="text-sm">
                Company Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="search-company"
                placeholder="Acme Inc"
                value={searchForm.company}
                onChange={(e) => setSearchForm({...searchForm, company: e.target.value})}
                className={validationErrors.company ? 'border-destructive' : ''}
              />
              {validationErrors.company && (
                <p className="text-xs text-destructive">{validationErrors.company}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="search-position" className="text-sm">
                Job Title / Position <span className="text-destructive">*</span>
              </Label>
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
                className={validationErrors.position ? 'border-destructive' : ''}
              />
              {validationErrors.position && (
                <p className="text-xs text-destructive">{validationErrors.position}</p>
              )}
            </div>
          </motion.div>
          
          {/* OR Divider */}
          <motion.div variants={itemAnimation} className="relative flex items-center py-4">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink-0 mx-4 text-secondary-text font-medium px-4 py-1 rounded-full bg-background/50">OR</span>
            <div className="flex-grow border-t border-border"></div>
          </motion.div>
          
          {/* Bulk Upload Section */}
          <motion.div variants={itemAnimation}>
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
                  className="border-2 border-dashed border-border rounded-lg p-5 text-center hover:border-accent/50 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-3">
                    <Upload className="text-accent" size={20} />
                  </div>
                  <p className="text-secondary-text text-sm mb-3">Upload a CSV or Excel file with multiple profiles</p>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-accent/20 hover:bg-accent/30 text-accent hover:text-primary-text border border-accent/40"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <FileUp className="mr-2 h-4 w-4" />
                    Browse Files
                  </Button>
                </div>
                
                <div className="bg-primary/10 rounded-lg p-3 text-sm">
                  <p className="font-medium text-secondary-text mb-2">Your file should include these columns:</p>
                  <ul className="text-secondary-text list-disc pl-5 space-y-1 text-sm">
                    <li>Name (required)</li>
                    <li>Company (required)</li>
                    <li>Position (required) - Job title/position at the company</li>
                  </ul>
                  <p className="text-secondary-text mt-2 text-xs">Note: Position and Title are treated as the same field. Each row will use 1 credit.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-background/70 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <File className="text-accent mr-3 shrink-0" size={24} />
                    <div className="flex-grow">
                      <p className="text-primary-text font-medium">{selectedFile.name}</p>
                      <p className="text-secondary-text text-sm">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <button 
                      type="button"
                      className="text-secondary-text hover:text-destructive"
                      onClick={handleRemoveFile}
                    >
                      <X size={18} />
                    </button>
                  </div>
                  
                  {parsedData.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 pt-4 pb-2 border-t border-border">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full mb-2 flex items-center justify-center shadow-md 
                          ${columnValidation.name 
                            ? 'bg-primary/20 border border-primary/60' 
                            : 'bg-destructive/20 border border-destructive/60'}`}>
                          {columnValidation.name ? (
                            <Check size={18} className="text-primary" />
                          ) : (
                            <X size={18} className="text-destructive" />
                          )}
                        </div>
                        <span className={`text-sm font-medium text-center ${columnValidation.name ? 'text-primary-text' : 'text-secondary-text'}`}>
                          Full Name
                        </span>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full mb-2 flex items-center justify-center shadow-md 
                          ${columnValidation.company 
                            ? 'bg-primary/20 border border-primary/60' 
                            : 'bg-destructive/20 border border-destructive/60'}`}>
                          {columnValidation.company ? (
                            <Check size={18} className="text-primary" />
                          ) : (
                            <X size={18} className="text-destructive" />
                          )}
                        </div>
                        <span className={`text-sm font-medium text-center ${columnValidation.company ? 'text-primary-text' : 'text-secondary-text'}`}>
                          Company
                        </span>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full mb-2 flex items-center justify-center shadow-md 
                          ${columnValidation.position 
                            ? 'bg-primary/20 border border-primary/60' 
                            : 'bg-destructive/20 border border-destructive/60'}`}>
                          {columnValidation.position ? (
                            <Check size={18} className="text-primary" />
                          ) : (
                            <X size={18} className="text-destructive" />
                          )}
                        </div>
                        <span className={`text-sm font-medium text-center ${columnValidation.position ? 'text-primary-text' : 'text-secondary-text'}`}>
                          Position/Title
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {parsedData.length > 0 && !columnValidation.isValid && (
                    <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start">
                      <AlertCircle size={16} className="text-destructive shrink-0 mr-2 mt-0.5" />
                      <span className="text-xs sm:text-sm text-destructive">
                        Required columns missing. Please ensure your file has columns for Full Name, Company, and Position/Title.
                      </span>
                    </div>
                  )}
                </div>
                
                {parsedData.length > 0 && (
                  <div className="bg-background/50 rounded-lg overflow-hidden">
                    <div className="p-3 border-b border-border">
                      <p className="text-sm text-primary-text font-medium">
                        Preview: {parsedData.length} records detected
                      </p>
                    </div>
                    
                    <div className="p-2 overflow-x-auto max-h-48 custom-scrollbar">
                      <div className="w-full inline-block align-middle">
                        <div className="min-w-full overflow-hidden">
                          <table className="min-w-full table-fixed divide-y divide-border text-sm">
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
                                      className="px-3 py-2 text-left text-xs font-medium text-secondary-text uppercase tracking-wider sticky top-0 bg-background/90 backdrop-blur-sm"
                                      style={{ width: colWidth, minWidth: "120px" }}
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
                                        className="px-3 py-2 text-primary-text overflow-hidden text-ellipsis"
                                        style={{ maxWidth: "1px" }} // This forces text-ellipsis to work with table layout
                                      >
                                        <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                                          {value as string || '-'}
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                              {parsedData.length > 5 && (
                                <tr>
                                  <td colSpan={Object.keys(parsedData[0] || {}).length} className="px-3 py-2 text-center text-secondary-text italic">
                                    + {parsedData.length - 5} more records
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {parsedData.length > 0 && columnValidation.isValid && (
                  <div className="bg-success/10 rounded-lg p-3 border border-success/20">
                    <div className="flex items-start">
                      <Check className="text-success shrink-0 mt-0.5 mr-2 h-4 w-4" />
                      <p className="text-xs sm:text-sm text-secondary-text">
                        Ready to process <span className="text-primary font-medium">{parsedData.length} record{parsedData.length !== 1 ? 's' : ''}</span>.
                        This will use <span className="text-primary font-medium">{parsedData.length} credit{parsedData.length !== 1 ? 's' : ''}</span> from your account.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
        
        {/* Search Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            type="submit"
            className="bg-primary hover:bg-accent-hover w-full"
            disabled={isSearchButtonDisabled()}
          >
            {getButtonText()}
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
};

export default SearchCard;