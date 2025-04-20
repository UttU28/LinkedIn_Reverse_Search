import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalStore } from '../store/modalStore';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/use-toast';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { X, Info, Search } from 'lucide-react';

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

const SingleSearchModal: React.FC = () => {
  const { activeModal, closeModal } = useModalStore();
  const { updateCreditUsage, userData } = useAuthStore();
  const { toast } = useToast();
  
  const [searchForm, setSearchForm] = useState({
    name: '',
    company: '',
    position: '',
    title: ''
  });
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
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
    setIsProcessing(true);
    
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
      
      // Close modal
      closeModal();
      
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "There was a problem with your search",
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

  // Reset form when modal closes
  const handleClose = () => {
    setSearchForm({
      name: '',
      company: '',
      position: '',
      title: '' // Title will match position, but reset both for clarity
    });
    setValidationErrors({});
    closeModal();
  };
  
  if (activeModal !== 'singleSearch') return null;

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
              Find a LinkedIn Profile
            </h3>
            <button
              onClick={handleClose}
              className="text-secondary-text hover:text-primary-text"
            >
              <X size={18} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search-name">
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
                  <p className="text-sm text-destructive">{validationErrors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="search-company">
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
                  <p className="text-sm text-destructive">{validationErrors.company}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="search-position">
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
                  <p className="text-sm text-destructive">{validationErrors.position}</p>
                )}
                <p className="text-sm text-secondary-text">Enter the person's job title or position at the company</p>
              </div>
              
              <div className="bg-primary/10 rounded-lg p-4">
                <div className="flex items-start">
                  <Info className="text-primary mt-1 mr-2 h-4 w-4" />
                  <p className="text-sm text-secondary-text">
                    This search will use <span className="text-primary font-medium">1 credit</span> from your account balance.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-accent-hover"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </div>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SingleSearchModal;
