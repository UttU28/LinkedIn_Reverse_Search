import { useState } from 'react';
import { Search, Link } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/use-toast';
import { findTeamMembers } from '../services/apiService';

interface TeamMembersFormProps {
  onSearchComplete?: (results: any) => void;
  onSearchStart?: () => void;
  className?: string;
  showLabels?: boolean;
}

const TeamMembersForm: React.FC<TeamMembersFormProps> = ({
  onSearchComplete,
  onSearchStart,
  className = '',
  showLabels = true
}) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };
  
  const handleValidation = (url: string): boolean => {
    // Basic validation for LinkedIn company URL
    const linkedinPattern = /^https?:\/\/(?:www\.)?linkedin\.com\/company\/[a-zA-Z0-9_-]+\/?.*$/i;
    return linkedinPattern.test(url);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast({
        title: "URL required",
        description: "Please enter a LinkedIn company URL",
        variant: "destructive"
      });
      return;
    }
    
    // Validate URL
    if (!handleValidation(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid LinkedIn company URL (e.g., https://www.linkedin.com/company/companyname)",
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

      // Generate tracking IDs
      const userID = useAuthStore.getState().user?.uid || 'unknown';
      const teamId = `team-${Date.now()}`;
      const companySearchId = `company-search-${Date.now()}`;

      // Call the backend API through our service
      const response = await findTeamMembers({
        userID,
        url,
        teamId,
        companySearchId
      });
      
      // Check if the response is successful
      if (response) {
        // Update credit usage
        await useAuthStore.getState().updateCreditUsage(1, 0);
        
        // Call the onSearchComplete callback with the results
        if (onSearchComplete) {
          // Include the original URL, teamId and companySearchId in the results
          const results = {
            ...response.data,
            originalUrl: url,
            teamId,
            companySearchId
          };
          onSearchComplete(results);
        }
        
        toast({
          title: "Search submitted",
          description: "Team members search has been submitted successfully",
        });
      } else {
        // Handle error
        console.error('Error fetching team members:', response);
        toast({
          title: "Search failed",
          description: "There was a problem submitting your search",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
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
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-4">
        <div className="space-y-2">
          {showLabels && (
            <Label htmlFor="company-url" className="flex items-center">
              <Link className="mr-2 h-4 w-4 text-primary/70" />
              LinkedIn Company URL <span className="text-destructive ml-1">*</span>
            </Label>
          )}
          <Input
            id="company-url"
            placeholder="https://www.linkedin.com/company/companyname"
            value={url}
            onChange={handleUrlChange}
            required
            className="bg-background/50"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Enter the URL of the LinkedIn company page to find team members
          </p>
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-primary hover:bg-accent-hover"
          disabled={isLoading || !url}
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
              Find Team Members
            </div>
          )}
        </Button>
      </div>
    </form>
  );
};

export default TeamMembersForm; 