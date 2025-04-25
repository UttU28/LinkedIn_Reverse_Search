import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalStore } from '../store/modalStore';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/use-toast';
import { Button } from './ui/button';
import { X, Info, Upload, FileUp, File } from 'lucide-react';
import Papa from 'papaparse';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const modalVariants = {
  hidden: { 
    opacity: 0,
    y: -20,
    scale: 0.95
  },
  visible: { 
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { 
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

interface CSVRow {
  Name?: string;
  Company?: string;
  Position?: string;
  Title?: string;
  [key: string]: string | undefined;
}

const CSVUploadModal: React.FC = () => {
  const { activeModal, closeModal } = useModalStore();
  const { updateCreditUsage, userData } = useAuthStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CSVRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
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
            setParsedData(results.data as CSVRow[]);
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
        // For Excel files, would need a different parser in a real app
        // For now, we'll just pretend it worked
        setParsedData([]);
        toast({
          title: "Excel support",
          description: "Excel parsing would be implemented in production",
          variant: "default"
        });
      }
    }
  };
  
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setParsedData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / 1048576) + ' MB';
  };
  
  const handleSubmit = async () => {
    if (!selectedFile) return;
    
    // Check credits
    const recordCount = parsedData.length || 5; // Default to 5 if we can't determine
    
    if (userData?.linkCredits === undefined || userData.linkCredits < recordCount) {
      toast({
        title: "Insufficient credits",
        description: `You need ${recordCount} credits but only have ₹ ${userData?.linkCredits || 0}`,
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    
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
      
      // Close modal
      closeModal();
      
    } catch (error) {
      console.error('CSV processing error:', error);
      toast({
        title: "Processing failed",
        description: "There was a problem processing your file",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };
  
  if (activeModal !== 'csvUpload') return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={backdropVariants}
        onClick={handleOutsideClick}
      >
        <div className="fixed inset-0 bg-background/75 backdrop-blur-sm" aria-hidden="true" />
        
        <motion.div 
          className="relative bg-card rounded-lg max-w-md w-full mx-4 overflow-hidden shadow-xl border border-border"
          variants={modalVariants}
        >
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="text-lg font-heading font-medium text-primary-text">
              Upload CSV or Excel File
            </h3>
            <button
              onClick={closeModal}
              className="text-secondary-text hover:text-primary-text"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="p-4">
            <input
              type="file"
              ref={fileInputRef}
              id="csv-file-input"
              className="hidden"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
            />
            
            {!selectedFile ? (
              <div 
                className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent/50 transition-all duration-200 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                  <Upload className="text-accent" size={24} />
                </div>
                <p className="text-secondary-text mb-4">Drag and drop your CSV or Excel file here, or click to browse</p>
                <Button
                  type="button"
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
            ) : (
              <div className="mb-6">
                <div className="bg-background/70 rounded-lg p-4 flex items-center">
                  <File className="text-accent mr-3" size={24} />
                  <div className="flex-grow">
                    <p className="text-primary-text font-medium">{selectedFile.name}</p>
                    <p className="text-secondary-text text-sm">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <button 
                    className="text-secondary-text hover:text-destructive"
                    onClick={handleRemoveFile}
                  >
                    <X size={18} />
                  </button>
                </div>
                
                {parsedData.length > 0 && (
                  <div className="mt-4 p-4 bg-background/50 rounded-lg">
                    <p className="text-sm text-primary-text mb-2 font-medium">
                      Preview: {parsedData.length} records detected
                    </p>
                    <div className="text-xs text-secondary-text">
                      {/* Show sample of data headers */}
                      {Object.keys(parsedData[0] || {}).join(', ')}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="bg-background/50 p-4 flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-primary hover:bg-accent-hover"
              disabled={!selectedFile || isProcessing}
              onClick={handleSubmit}
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                'Upload and Process'
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CSVUploadModal;
