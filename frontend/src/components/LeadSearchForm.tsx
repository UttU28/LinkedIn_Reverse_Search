import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Briefcase, Users, Building } from 'lucide-react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '../hooks/use-toast';
import { findTargetedLeads } from '../services/apiService';

// Define the result structure
export interface LeadResult {
  id: string;
  name: string;
  position: string;
  company: string;
  location: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  exactMatch: boolean;
}

interface LeadSearchFormProps {
  onSearchComplete?: (results: LeadResult[]) => void;
  onSearchStart?: () => void;
  className?: string;
}

const LeadSearchForm: React.FC<LeadSearchFormProps> = ({
  onSearchComplete,
  onSearchStart,
  className = ''
}) => {
  const [company, setCompany] = useState('');
  const [positionTitle, setPositionTitle] = useState('recruitment');
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();
  
  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompany(e.target.value);
  };
  
  const handlePositionChange = (value: string) => {
    setPositionTitle(value);
  };
  
  const handleLeadSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!company) {
      toast({
        title: "Company name required",
        description: "Please enter a company name to search for leads",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    // Call onSearchStart callback if provided
    if (onSearchStart) {
      onSearchStart();
    }
    
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
      const userID = useAuthStore.getState().user?.uid || 'unknown';
      const pipelineId = `pipeline-${Date.now()}`;
      const leadDocId = `lead-${Date.now()}`;
      
      console.log('Generated IDs for tracking:', pipelineId, 'leadDocId:', leadDocId);
      
      // Call the backend API using our service function
      const response = await findTargetedLeads({
        userID,
        company,
        positionTitle,
        pipelineId,
        leadDocId
      });
      
      // Check if the response is successful
      if (response.status === 'success') {
        // Update credit usage
        await useAuthStore.getState().updateCreditUsage(1, response.data.results.length);
        
        // Call the onSearchComplete callback with the results
        if (onSearchComplete) {
          onSearchComplete(response.data.results);
        }
        
        toast({
          title: "Search completed",
          description: `Found ${response.data.results.length} leads for ${company}`,
          variant: "default"
        });
      } else {
        // Handle error
        console.error('Error fetching leads:', response.message);
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
    <form onSubmit={handleLeadSearch} className={className}>
      <div className="space-y-4">
        {/* Inputs in one line */}
        <div className="flex flex-row gap-4">
          {/* Company Input */}
          <div className="flex-1">
            <Label htmlFor="company-name" className="text-sm font-medium block mb-2">
              Company Name
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Building className="w-5 h-5 text-gray-500" />
              </div>
              <Input
                id="company-name"
                type="text"
                placeholder="Enter company name..."
                value={company}
                onChange={handleCompanyChange}
                className="pl-10 w-full"
              />
            </div>
          </div>
          
          {/* Position Selector */}
          <div className="flex-1">
            <Label htmlFor="position-title" className="text-sm font-medium block mb-2">
              Position Title
            </Label>
            <Select value={positionTitle} onValueChange={handlePositionChange}>
              <SelectTrigger id="position-title" className="pl-10 relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Briefcase className="w-5 h-5 text-gray-500" />
                </div>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recruitment">Recruitment</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
                <SelectItem value="c-level">C-Level Executives</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Search Button */}
        <Button 
          type="submit" 
          className="w-full bg-primary hover:bg-primary/90 text-white"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              Searching...
            </>
          ) : (
            <>
              <Users className="mr-2 h-5 w-5" />
              Find Leads
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default LeadSearchForm; 