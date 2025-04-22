import { useState } from 'react';
import { Search, Building, Briefcase } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/use-toast';
import axios from 'axios';

// Define the lead result interface
export interface LeadResult {
  id: number;
  name: string;
  company: string;
  position: string;
  exactMatch: boolean;
}

interface LeadSearchFormProps {
  onSearchComplete?: (results: LeadResult[]) => void;
  onSearchStart?: () => void;
  className?: string;
  showLabels?: boolean;
}

const LeadSearchForm: React.FC<LeadSearchFormProps> = ({
  onSearchComplete,
  onSearchStart,
  className = '',
  showLabels = true
}) => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [company, setCompany] = useState('');
  const [positionTitle, setPositionTitle] = useState('recruitment');
  const [isLoading, setIsLoading] = useState(false);

  const positionOptions = [
    { value: 'recruitment', label: 'Recruitment' },
    { value: 'investment', label: 'Investment' },
    { value: 'c-level', label: 'C-Level Executives' }
  ];

  const handleLeadSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !positionTitle) return;
    
    setIsLoading(true);
    if (onSearchStart) onSearchStart();
    
    // Get user ID from auth store
    const userID = useAuthStore.getState().user?.uid || 'unknown';
    
    try {
      // Check if user has enough credits
      const userData = useAuthStore.getState().userData;
      if (userData?.linkCredits === undefined || userData.linkCredits < 1) {
        toast({
          title: "Insufficient credits",
          description: "You don't have enough credits to perform this search",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Generate IDs for tracking
      const pipelineId = `pipeline-${Date.now()}`;
      const leadDocId = `lead-${Date.now()}`;
      
      console.log('Generated IDs for tracking:', pipelineId, 'leadDocId:', leadDocId);
      
      // Call the backend API
      const response = await axios.post('http://localhost:3000/findTargetedLeads', {
        userID,
        company,
        positionTitle,
        pipelineId,
        leadDocId
      });
      
      // Check if the response is successful
      if (response.data.status === 'success') {
        // Update credit usage
        await useAuthStore.getState().updateCreditUsage(1, response.data.data.results.length);
        
        // Call the onSearchComplete callback with the results
        if (onSearchComplete) {
          onSearchComplete(response.data.data.results);
        }
        
        toast({
          title: "Search completed",
          description: `Found ${response.data.data.results.length} leads for ${company}`,
          variant: "default"
        });
      } else {
        // Handle error
        console.error('Error fetching leads:', response.data.message);
        toast({
          title: "Search failed",
          description: "There was a problem fetching lead results",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Search failed",
        description: "There was a problem processing your search",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLeadSearch} className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          {showLabels && (
            <Label htmlFor="company-name" className="flex items-center">
              <Building className="mr-2 h-4 w-4 text-primary/70" />
              Company Name <span className="text-destructive ml-1">*</span>
            </Label>
          )}
          <Input
            id="company-name"
            placeholder="Enter target company name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
            className="bg-background/50"
          />
        </div>
        
        <div className="space-y-2">
          {showLabels && (
            <Label htmlFor="position-title" className="flex items-center">
              <Briefcase className="mr-2 h-4 w-4 text-primary/70" />
              Position Title <span className="text-destructive ml-1">*</span>
            </Label>
          )}
          <Select 
            value={positionTitle} 
            onValueChange={setPositionTitle}
            required
          >
            <SelectTrigger className="bg-background/50" id="position-title">
              <SelectValue placeholder="Select position category" />
            </SelectTrigger>
            <SelectContent>
              {positionOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-accent-hover"
        disabled={isLoading || !company || !positionTitle}
      >
        {isLoading ? (
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
            Find People
          </div>
        )}
      </Button>
    </form>
  );
};

export default LeadSearchForm; 