import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/use-toast';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Info, Search, Upload, FileUp, File, X, Check, AlertCircle, ExternalLink, Copy, Linkedin } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { findSingleContact, findBatchContacts } from '../services/apiService';
import { db, collection, addDoc, doc, setDoc, serverTimestamp, updateDoc } from '../lib/firebase';

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

// Firestore helper function with error handling for development
const safeFirestoreOperation = async (operation: () => Promise<any>, fallback: any = null) => {
  try {
    return await operation();
  } catch (error) {
    console.warn('Firestore operation failed (continuing anyway):', error);
    return fallback;
  }
};

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
  
  // Single search response state
  const [searchResponse, setSearchResponse] = useState<{
    linkedinProfileUrl?: string;
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
  const [columnValidation, setColumnValidation] = useState<ColumnValidation>({
    name: false,
    company: false,
    position: false,
    isValid: false
  });
  
  // Bulk search response state
  const [bulkSearchResults, setBulkSearchResults] = useState<Array<{
    searchName: string;
    searchCompany: string;
    searchPosition: string;
    linkedinProfileUrl?: string;
    foundData: number;
  }> | null>(null);
  
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
      position: false,
      isValid: false
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
    
    // Reset validation errors and search response
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
    
    // Get user ID from auth store
    const userID = useAuthStore.getState().user?.uid || 'unknown';
    
    try {
      // First, add contact to Firestore
      const contactData = {
        name: searchForm.name,
        company: searchForm.company,
        position: searchForm.position,
        createdAt: serverTimestamp()
      };
      
      // Add to contacts collection and get auto-generated ID
      let contactID = 'temp-' + Date.now();
      await safeFirestoreOperation(async () => {
        const contactRef = await addDoc(collection(db, 'contacts'), contactData);
        contactID = contactRef.id;
        console.log('Contact saved with ID:', contactID);
      });
      
      // Use the API service to find contact
      const result = await findSingleContact({
        userID,
        searchName: searchForm.name,
        searchCompany: searchForm.company,
        searchPosition: searchForm.position
      });
      
      // Update user's search history in Firestore
      const searchData = {
        contactID,
        timestamp: serverTimestamp(),
        searchName: searchForm.name,
        searchCompany: searchForm.company,
        searchPosition: searchForm.position,
        linkedinProfileUrl: result.data.foundData > 0 ? result.data.linkedinProfileUrl : null,
        foundData: result.data.foundData || 0
      };
      
      // Add to users/{userID}/singleSearch with auto-generated document ID
      await safeFirestoreOperation(async () => {
        // Create a reference to the singleSearch collection
        const singleSearchCollectionRef = collection(db, 'users', userID, 'singleSearch');
        
        // Add document with auto-generated ID
        const searchDocRef = await addDoc(singleSearchCollectionRef, searchData);
        console.log('Search history added for user with ID:', searchDocRef.id);
      });
      
      // Update credits only if profiles were found
      if (result.data.foundData > 0) {
        // Deduct credits equal to foundData value
        await updateCreditUsage(result.data.foundData, result.data.foundData);
        
        // Clear form inputs but keep results displayed
        clearSearchFormOnly();
      }
      
      // Clear bulk search results when setting new single search response
      setBulkSearchResults(null);
      
      // Set search response
      setSearchResponse(result.data);
      
      toast({
        title: "Search successful",
        description: result.data.foundData === 1 ? "We found a matching profile!" : "No exact match found. No credits were used.",
        variant: "default"
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
      } else {
        // Find the actual column names that matched our patterns
        const headers = Object.keys(parsedData[0]);
        const nameField = headers.find(h => 
          h.toLowerCase() === 'name' || 
          h.toLowerCase() === 'fullname' || 
          h.toLowerCase() === 'full name' || 
          h.toLowerCase() === 'full_name' || 
          h.toLowerCase().includes('name')
        );
        
        const companyField = headers.find(h => 
          h.toLowerCase() === 'company' || 
          h.toLowerCase() === 'companyname' || 
          h.toLowerCase() === 'company name' || 
          h.toLowerCase() === 'company_name' || 
          h.toLowerCase().includes('company')
        );
        
        const positionField = headers.find(h => 
          h.toLowerCase() === 'position' || 
          h.toLowerCase() === 'title' || 
          h.toLowerCase() === 'jobtitle' || 
          h.toLowerCase() === 'job title' || 
          h.toLowerCase() === 'job_title' || 
          h.toLowerCase() === 'currentposition' || 
          h.toLowerCase() === 'current position' || 
          h.toLowerCase() === 'current_title' || 
          h.toLowerCase().includes('position') || 
          h.toLowerCase().includes('title')
        );
        
        // Log the content when all three fields are found
        console.log("CSV/Excel Upload - Found all required fields:");
        parsedData.forEach((row, index) => {
          console.log(`Record ${index + 1}:`, {
            "Full Name": nameField ? row[nameField] || "" : "",
            "Company": companyField ? row[companyField] || "" : "",
            "Position": positionField ? row[positionField] || "" : ""
          });
        });
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
      // Get user ID from auth store
      const userID = useAuthStore.getState().user?.uid || 'unknown';
      
      // Generate a unique batch ID
      const batchId = generateBatchId(userID);
      
      // Find the actual column names that matched our patterns
      const headers = Object.keys(parsedData[0]);
      const nameField = headers.find(h => 
        h.toLowerCase() === 'name' || 
        h.toLowerCase() === 'fullname' || 
        h.toLowerCase() === 'full name' || 
        h.toLowerCase() === 'full_name' || 
        h.toLowerCase().includes('name')
      );
      
      const companyField = headers.find(h => 
        h.toLowerCase() === 'company' || 
        h.toLowerCase() === 'companyname' || 
        h.toLowerCase() === 'company name' || 
        h.toLowerCase() === 'company_name' || 
        h.toLowerCase().includes('company')
      );
      
      const positionField = headers.find(h => 
        h.toLowerCase() === 'position' || 
        h.toLowerCase() === 'title' || 
        h.toLowerCase() === 'jobtitle' || 
        h.toLowerCase() === 'job title' || 
        h.toLowerCase() === 'job_title' || 
        h.toLowerCase() === 'currentposition' || 
        h.toLowerCase() === 'current position' || 
        h.toLowerCase() === 'current_title' || 
        h.toLowerCase().includes('position') || 
        h.toLowerCase().includes('title')
      );
      
      // STEP 1: Bulk create contacts and store their IDs
      const contactIds: string[] = [];
      
      await safeFirestoreOperation(async () => {
        for (const row of parsedData) {
          // Create contact data
          const contactData = {
            name: nameField ? row[nameField] || "" : "",
            company: companyField ? row[companyField] || "" : "",
            position: positionField ? row[positionField] || "" : "",
            createdAt: serverTimestamp()
          };
          
          // Add to contacts collection
          const contactRef = await addDoc(collection(db, 'contacts'), contactData);
          contactIds.push(contactRef.id);
        }
        console.log(`Created ${contactIds.length} contacts in Firestore`);
      });
      
      // STEP 2: Create a document in the 'batches' collection
      let batchDocId = '';
      await safeFirestoreOperation(async () => {
        const batchData = {
          userID,
          contactIds,
          batchId,
          fileName: selectedFile.name,
          recordCount: parsedData.length,
          status: 'pending', // Status options: pending, processing, completed, failed
          createdAt: serverTimestamp()
        };
        
        const batchDocRef = await addDoc(collection(db, 'batches'), batchData);
        batchDocId = batchDocRef.id;
        console.log('Batch record created with ID:', batchDocId);
      });
      
      // STEP 3: Create a document in users/{userID}/bulkSearch
      let bulkSearchDocId = '';
      await safeFirestoreOperation(async () => {
        const bulkSearchData = {
          batchId: batchDocId,
          foundData: null, // Will be updated after API response
          totalData: parsedData.length,
          fileName: selectedFile.name,
          timestamp: serverTimestamp(),
          status: 'pending' // Status options: pending, processing, completed, failed
        };
        
        const bulkSearchRef = await addDoc(collection(db, 'users', userID, 'bulkSearch'), bulkSearchData);
        bulkSearchDocId = bulkSearchRef.id;
        console.log('Bulk search record created with ID:', bulkSearchDocId);
      });
      
      // Format contacts for batch processing
      const contacts = parsedData.map((row, index) => ({
        searchName: nameField ? row[nameField] || "" : "",
        searchCompany: companyField ? row[companyField] || "" : "",
        searchPosition: positionField ? row[positionField] || "" : "",
        contactId: contactIds[index] || `temp-${index}`
      }));
      
      // Update batch status to processing
      await safeFirestoreOperation(async () => {
        await updateDoc(doc(db, 'batches', batchDocId), { 
          status: 'processing'
        });
      });
      
      // Call the API service with additional info
      const result = await findBatchContacts({
        userID,
        fileName: selectedFile.name,
        timestamp: Date.now(),
        batchId,
        contacts
      });
      
      // Clear single search response when setting new bulk results
      setSearchResponse(null);
      
      // Store bulk search results
      setBulkSearchResults(result.data.contacts);
      
      // Get found count
      const successCount = result.data.contacts.filter(c => c.foundData > 0).length;
      
      // STEP 4: Update the bulkSearch document with the found count
      await safeFirestoreOperation(async () => {
        await updateDoc(doc(db, 'users', userID, 'bulkSearch', bulkSearchDocId), {
          foundData: successCount,
          status: 'completed',
          completedAt: serverTimestamp()
        });
        console.log(`Updated bulkSearch record with foundData: ${successCount}`);
      });
      
      // Update batch status to completed
      await safeFirestoreOperation(async () => {
        await updateDoc(doc(db, 'batches', batchDocId), { 
          status: 'completed', 
          successCount,
          completedAt: serverTimestamp()
        });
      });
      
      // Update credits
      await updateCreditUsage(recordCount, successCount);
      
      toast({
        title: "Processing complete",
        description: `Successfully found ${successCount} out of ${recordCount} profiles. Batch ID: ${batchId}`,
        variant: "default"
      });
      
      // Reset form inputs but keep results displayed
      resetFileUploadOnly();
      
      // Show both forms again after processing is complete
      setShowCSVUpload(true);
      
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
    <div className="space-y-6">
      {/* Combined Results Card - Positioned above the search form */}
      <AnimatePresence>
        {(searchResponse || (bulkSearchResults && bulkSearchResults.length > 0)) && (
          <motion.div 
            className="bg-card rounded-xl border border-border/50 p-6 hover:border-accent/50 transition-all duration-300"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-heading font-medium text-primary-text">
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
                  className="text-secondary-text hover:text-destructive border-secondary-text hover:border-destructive"
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
                      {/* Single result row */}
                      <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-3">
                        <div className="flex items-center space-x-2 w-full md:w-1/4">
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
                        <div className="w-full md:w-1/4 truncate">
                          <span className="text-secondary-text">{searchResponse.searchCompany}</span>
                        </div>
                        <div className="w-full md:w-1/4 truncate">
                          <span className="text-secondary-text">{searchResponse.searchPosition}</span>
                        </div>
                        <div className="w-full md:w-1/4 flex items-center justify-end space-x-2">
                          {searchResponse.linkedinProfileUrl && (
                            <>
                              <a 
                                href={searchResponse.linkedinProfileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 text-sm truncate"
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
                      
                      <div className="text-xs text-secondary-text mt-4 pb-1">
                        <p>
                          This search used {(searchResponse.foundData ?? 0)} credit{(searchResponse.foundData ?? 0) !== 1 ? 's' : ''} from your account.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-border/30 rounded-lg overflow-hidden bg-card/90 bg-opacity-80">
                    <div className="p-4 pt-2">
                      {/* No match result row */}
                      <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-3">
                        <div className="flex items-center space-x-2 w-full md:w-1/4">
                          <span className="text-secondary-text/70 h-5 w-5">
                            <Linkedin className="h-5 w-5 opacity-50" />
                          </span>
                          <span className="text-secondary-text truncate">
                            {searchResponse.searchName}
                          </span>
                        </div>
                        <div className="w-full md:w-1/4 truncate">
                          <span className="text-secondary-text">{searchResponse.searchCompany}</span>
                        </div>
                        <div className="w-full md:w-1/4 truncate">
                          <span className="text-secondary-text">{searchResponse.searchPosition}</span>
                        </div>
                        <div className="w-full md:w-1/4 flex items-center justify-end">
                          <span className="text-destructive text-sm">Not Found</span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-secondary-text mt-4 pb-1">
                        <p>0 credits used from your account.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Bulk Search Results */}
            {bulkSearchResults && bulkSearchResults.length > 0 && (
              <div className="border border-border/30 rounded-lg overflow-hidden bg-card">
                <div className="border-t border-border/30 max-h-96 overflow-y-auto">
                  {bulkSearchResults.map((result, index) => (
                    <div 
                      key={index} 
                      className={`p-4 ${index !== bulkSearchResults.length - 1 ? 'border-b border-border/30' : ''} ${result.foundData > 0 ? '' : 'bg-destructive/5'}`}
                    >
                      <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-3">
                        <div className="flex items-center space-x-2 w-full md:w-1/4">
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
                            className={`hover:text-primary transition-colors duration-200 ${!result.linkedinProfileUrl && 'pointer-events-none text-secondary-text'}`}
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
                        <div className="w-full md:w-1/4 truncate">
                          <span className="text-secondary-text">{result.searchCompany}</span>
                        </div>
                        <div className="w-full md:w-1/4 truncate">
                          <span className="text-secondary-text">{result.searchPosition}</span>
                        </div>
                        <div className="w-full md:w-1/4 flex items-center justify-end">
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
                    This search used {bulkSearchResults.filter(r => r.foundData > 0).length} credit{bulkSearchResults.filter(r => r.foundData > 0).length !== 1 ? 's' : ''} from your account.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    
      {/* Main Search Form Card */}
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
            <motion.div variants={itemAnimation} className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${isBulkSearchActive ? 'hidden' : 'block'}`}>
            <div className="space-y-2">
              <Label htmlFor="search-name" className="text-sm">
                Full Name <span className="text-destructive">*</span>
              </Label>
                <div className="relative">
              <Input
                id="search-name"
                placeholder="John Smith"
                value={searchForm.name}
                onChange={(e) => setSearchForm({...searchForm, name: e.target.value})}
                className={validationErrors.name ? 'border-destructive' : ''}
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
            
            <div className="space-y-2">
              <Label htmlFor="search-company" className="text-sm">
                Company Name <span className="text-destructive">*</span>
              </Label>
                <div className="relative">
              <Input
                id="search-company"
                placeholder="Acme Inc"
                value={searchForm.company}
                onChange={(e) => setSearchForm({...searchForm, company: e.target.value})}
                className={validationErrors.company ? 'border-destructive' : ''}
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
            
            <div className="space-y-2">
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
                className={validationErrors.position ? 'border-destructive' : ''}
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
          <motion.div variants={itemAnimation} className="relative flex items-center py-4">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink-0 mx-4 text-secondary-text font-medium px-4 py-1 rounded-full bg-background/50">OR</span>
            <div className="flex-grow border-t border-border"></div>
          </motion.div>
            )}
          
          {/* Bulk Upload Section */}
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
            )}
        </motion.div>
        
        {/* Search Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
            className="flex items-center gap-2"
        >
          <Button
            type="submit"
            className="bg-primary hover:bg-accent-hover w-full"
            disabled={isSearchButtonDisabled()}
          >
            {getButtonText()}
          </Button>
            
            {isSingleSearchActive && (
              <Button
                type="button"
                variant="outline"
                className="flex-shrink-0"
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