import { useState } from 'react';
import { Search, Link } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/use-toast';
import axios from 'axios';
import { createTeamSearch, createCompanySearchRecord } from '../lib/teamFirebase';

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
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidUrl, setIsValidUrl] = useState(true);

  const validateUrl = (value: string) => {
    // General URL validation pattern
    const urlPattern = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)([\/?#].*)?$/;
    return value === '' || urlPattern.test(value);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    setIsValidUrl(validateUrl(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !isValidUrl) return;
    
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

      // Create team search record in Firestore
      const teamId = await createTeamSearch(url);
      
      // Create company search record for the user
      const companySearchId = await createCompanySearchRecord(userID, teamId);

      // Call the backend API
      const response = await axios.post('http://localhost:3000/teamMembers', {
        userID,
        url,
        teamId, // Pass the teamId to the backend
        companySearchId // Also pass the companySearchId
      });
      
      // Check if the response is successful
      if (response.data) {
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
        console.error('Error fetching team members:', response.data);
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
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      <div className="space-y-2">
        {showLabels && (
          <Label htmlFor="company-url" className="flex items-center">
            <Link className="mr-2 h-4 w-4 text-primary/70" />
            Company URL <span className="text-destructive ml-1">*</span>
          </Label>
        )}
        <Input
          id="company-url"
          placeholder="https://example.com"
          value={url}
          onChange={handleUrlChange}
          required
          className={`bg-background/50 ${!isValidUrl ? 'border-destructive' : ''}`}
        />
        {!isValidUrl && (
          <p className="text-destructive text-sm mt-1">
            Please enter a valid URL
          </p>
        )}
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-accent-hover"
        disabled={isLoading || !url || !isValidUrl}
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
    </form>
  );
};

export default TeamMembersForm; 