import React, { useState, useEffect, useCallback } from 'react';
import { useSearchStore } from '../store/searchStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { 
  History, 
  ExternalLink, 
  Search, 
  Users, 
  Link as LinkIcon, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  FileSpreadsheet,
  FileText,
  Download,
  Linkedin
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fetchSearchHistory, SearchHistoryResult, searchHistoryEvents } from '../lib/searchService';
import { useAuthStore } from '../store/authStore';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import { exportToExcel, SearchInfo } from '../utils/excelExporter';
import { exportToCSV } from '../utils/csvExporter';

// Define a unified search result interface for display
interface UnifiedSearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  status: string; // Allow any string for status
  timestamp: number;
  url?: string;
  icon: JSX.Element;
  resultIds?: string[]; // Use resultIds property name to match database
  originalData?: any; // Store the full original data
}

// Interface for search result data
interface SearchResultData {
  name?: string;
  company?: string;
  title?: string;
  linkedin?: string;
  createdAt?: Date;
  [key: string]: any;
}

const RecentSearches: React.FC = () => {
  const { recentSearches } = useSearchStore();
  const { user, userData, loading: authLoading } = useAuthStore();
  const [searchResults, setSearchResults] = useState<UnifiedSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState<{id: string, type: 'excel'|'csv'} | null>(null);
  const [expandedDownloadMenu, setExpandedDownloadMenu] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Number of items to show initially
  const initialCount = 5;

  // Handle click on search card
  const handleCardClick = (searchResult: UnifiedSearchResult) => {
    // Close any open download menus when clicking the card
    setExpandedDownloadMenu(null);
  };

  // Toggle the download menu expansion
  const toggleDownloadMenu = (e: React.MouseEvent, searchId: string) => {
    e.stopPropagation(); // Prevent card click
    if (expandedDownloadMenu === searchId) {
      setExpandedDownloadMenu(null);
    } else {
      setExpandedDownloadMenu(searchId);
    }
  };

  // Generic handler for file downloads
  const handleDownload = async (
    e: React.MouseEvent, 
    searchResult: UnifiedSearchResult, 
    type: 'excel' | 'csv'
  ) => {
    e.stopPropagation(); // Prevent card click event from firing
    
    // Close the menu
    setExpandedDownloadMenu(null);
    
    if (!searchResult.originalData?.resultIds?.length) {
      toast({
        title: "No data to download",
        description: "This search doesn't have any result IDs to download.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setDownloadLoading({id: searchResult.id, type});
      
      // Prepare search info for the exporter
      const searchInfo: SearchInfo = {
        id: searchResult.id,
        title: searchResult.title,
        timestamp: searchResult.timestamp,
        resultIds: searchResult.originalData.resultIds
      };
      
      // Progress callback for toast notifications
      const onProgress = (stage: 'fetching' | 'creating' | 'complete' | 'error', count?: number) => {
        if (stage === 'fetching') {
          toast({
            title: `Preparing ${type.toUpperCase()} download`,
            description: "Fetching data from database...",
            variant: "default"
          });
        } 
        // Removed 'creating' toast to avoid duplicate notifications
        else if (stage === 'complete' && count) {
          toast({
            title: "Download complete",
            description: `Successfully downloaded ${count} records as ${type.toUpperCase()} file.`,
            variant: "default"
          });
        } else if (stage === 'error') {
          toast({
            title: "Download failed",
            description: `There was a problem downloading the ${type.toUpperCase()} file.`,
            variant: "destructive"
          });
        }
      };
      
      // Call the appropriate export function with progress updates
      if (type === 'excel') {
        await exportToExcel(searchInfo, onProgress);
      } else {
        await exportToCSV(searchInfo, onProgress);
      }
    } catch (error) {
      console.error(`Error downloading ${type} file:`, error);
      toast({
        title: "Download failed",
        description: `There was a problem downloading the ${type.toUpperCase()} file.`,
        variant: "destructive"
      });
    } finally {
      setDownloadLoading(null);
    }
  };

  // Handle clicking outside to close the expanded menu
  useEffect(() => {
    const handleClickOutside = () => {
      setExpandedDownloadMenu(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Create a memoized loadSearchHistory function to avoid recreating it on each render
  const loadSearchHistory = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      setError(null);
      const searchHistory = await fetchSearchHistory(user.uid);
      
      // Convert Firestore search history to unified format
      const unifiedResults: UnifiedSearchResult[] = [];
      
      // Process all searchHistory items
      if (searchHistory?.searchHistory?.length) {
        searchHistory.searchHistory.forEach(item => {
          try {
            // Process based on type
            let title = '';
            let subtitle = '';
            let url = undefined;
            let icon = <Search className="h-4 w-4" />;
            
            switch (item.type) {
              case 'single':
                title = item.inputMeta?.name || 'Unknown Person';
                subtitle = [
                  item.inputMeta?.company || '',
                  item.inputMeta?.position || ''
                ].filter(Boolean).join(' • ');
                icon = <Search className="h-4 w-4" />;
                // For single searches, include the direct linkedinUrl if available
                url = item.linkedinUrl || undefined;
                break;
                
              case 'bulk':
                title = item.inputMeta?.fileName || 'Bulk Search';
                subtitle = `${item.totalRecords || 0} records`;
                icon = <Users className="h-4 w-4" />;
                break;
                
              case 'recruiters':
                title = `${item.inputMeta?.company || 'Unknown'} Recruiters`;
                subtitle = `${item.totalRecords || 0} leads found`;
                icon = <Filter className="h-4 w-4" />;
                break;
                
              default:
                title = `Search: ${item.id}`;
                subtitle = `Type: ${item.type}`;
            }
            
            unifiedResults.push({
              id: item.id,
              type: item.type,
              title,
              subtitle,
              status: item.status || 'Pending',
              timestamp: item.createdAt.getTime(),
              url,
              icon,
              resultIds: item.resultIds || [], // Include resultIds directly
              originalData: item // Store the full original data
            });
          } catch (err) {
            console.error("Error processing search history item:", err, item);
          }
        });
      }
      
      // Process recent searches from store (in-memory)
      recentSearches.forEach(search => {
        unifiedResults.push({
          id: search.id,
          type: 'single',
          title: search.name,
          subtitle: [search.company, search.position].filter(Boolean).join(' • '),
          status: search.status,
          timestamp: search.timestamp,
          url: search.linkedinProfileUrl,
          icon: <Search className="h-4 w-4" />
        });
      });
      
      // Sort by timestamp (newest first)
      const sortedResults = unifiedResults.sort((a, b) => b.timestamp - a.timestamp);
      
      setSearchResults(sortedResults);
    } catch (error) {
      console.error('Error loading search history:', error);
      setError('Failed to load search history');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, recentSearches]);

  useEffect(() => {
    if (authLoading) return;
    if (user?.uid) {
      loadSearchHistory();
      const unsubscribe = searchHistoryEvents.subscribe(() => {
        loadSearchHistory();
      });
      
      return () => {
        unsubscribe();
      };
    } else {
      setLoading(false);
    }
  }, [user?.uid, loadSearchHistory, authLoading]);

  // Polling effect for processing searches
  useEffect(() => {
    if (!user?.uid || authLoading) return;
    
    // Check if there are any processing searches
    const hasProcessingSearches = searchResults.some(search => 
      search.status === 'pending' || search.status === 'processing'
    );
    
    if (!hasProcessingSearches) return;
    
    // Set up polling every 5 seconds for processing searches
    const pollInterval = setInterval(() => {
      console.log('Polling for search status updates...');
      loadSearchHistory();
    }, 5000); // Poll every 5 seconds for faster updates
    
    return () => {
      clearInterval(pollInterval);
    };
  }, [user?.uid, authLoading, searchResults, loadSearchHistory]);

  // Format time ago string with status prefix
  const formatTimeAgo = (timestamp: number, status: string): string => {
    try {
      const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true });
      
      // Map status to display text
      let displayStatus = "Unknown";
      if (status === 'completed') displayStatus = "Found";
      else if (status === 'pending') displayStatus = "Finding";
      else if (status === 'failed') displayStatus = "Failed";
      else displayStatus = status; // Fallback to original status
      
      // Replace "about " prefix with status
      return `${displayStatus} ${timeAgo.replace('about ', '')}`;
    } catch (error) {
      console.error("Error formatting time:", error);
      return `Unknown time ago`;
    }
  };

  // Toggle expanded view
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Determine which items to display based on expanded state
  const displayedResults = expanded 
    ? searchResults 
    : searchResults.slice(0, initialCount);

  // Update the rendered button section
  const renderDownloadButton = (search: UnifiedSearchResult) => {
    // Show download button for 'bulk', 'team', or 'recruiters' type searches that have resultIds
    if ((search.type !== 'bulk' && search.type !== 'team' && search.type !== 'recruiters') || !search.originalData?.resultIds?.length) return null;
    
    return (
      <div className="relative ml-2" onClick={(e) => e.stopPropagation()}>
        {/* Main download button */}
        <button
          className="p-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
          onClick={(e) => toggleDownloadMenu(e, search.id)}
          title="Download options"
          disabled={downloadLoading !== null}
        >
          {downloadLoading?.id === search.id ? (
            <Loader className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
        </button>
        
        {/* Expanded options */}
        {expandedDownloadMenu === search.id && (
          <div 
            className="absolute top-0 left-full ml-3 flex items-center h-full z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex rounded-md shadow-md overflow-hidden">
              {/* Excel option */}
              <button
                className="px-4 py-1 flex items-center gap-1.5 bg-card hover:bg-card/80 border-r border-border/50 transition-colors"
                onClick={(e) => handleDownload(e, search, 'excel')}
                disabled={downloadLoading !== null}
              >
                <FileSpreadsheet className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Excel</span>
              </button>
              
              {/* CSV option */}
              <button
                className="px-4 py-1 flex items-center gap-1.5 bg-card hover:bg-card/80 transition-colors"
                onClick={(e) => handleDownload(e, search, 'csv')}
                disabled={downloadLoading !== null}
              >
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">CSV</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Add LinkedIn icon component
  const renderLinkedInIcon = (search: UnifiedSearchResult) => {
    // Only show for single searches
    if (search.type !== 'single') return null;
    
    // Check multiple possible locations for LinkedIn URL
    const linkedInUrl = 
      search.url || 
      (search.originalData?.linkedinUrl) ||  // First check for direct linkedinUrl in search history
      (search.originalData?.inputMeta?.linkedin) ||
      (search.originalData?.linkedin) || 
      (search.originalData?.linkedInUrl) || 
      (search.originalData?.linkedinProfileUrl);
    
    const hasLinkedIn = !!linkedInUrl;
    
    return (
      <div className="ml-2" onClick={(e) => e.stopPropagation()}>
        <a 
          href={hasLinkedIn ? linkedInUrl : '#'} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`inline-flex p-1.5 rounded-full transition-colors ${
            hasLinkedIn 
              ? 'text-[#0A66C2] hover:bg-[#0A66C2]/10 cursor-pointer' 
              : 'text-gray-400/50 cursor-not-allowed'
          }`}
          onClick={(e) => {
            if (!hasLinkedIn) {
              e.preventDefault();
            }
          }}
          title={hasLinkedIn ? "View LinkedIn Profile" : "No LinkedIn Profile Found"}
        >
          <Linkedin className="h-5 w-5" />
        </a>
      </div>
    );
  };

  // Loading state
  if (loading || authLoading) {
    return (
      <Card className="bg-card border border-border/50 h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-lg">
            <History className="mr-2 h-5 w-5 text-primary" />
            Recent Searches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-muted-foreground text-sm">
              {authLoading ? 'Authenticating...' : 'Loading recent searches...'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Card className="bg-card border border-border/50 h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-lg">
            <History className="mr-2 h-5 w-5 text-primary" />
            Recent Searches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (searchResults.length === 0) {
    return (
      <Card className="bg-card border border-border/50 h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-lg">
            <History className="mr-2 h-5 w-5 text-primary" />
            Recent Searches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Search className="h-8 w-8 text-muted-foreground/60 mb-2" />
            <p className="text-muted-foreground text-sm">
              No recent searches yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Results state
  return (
    <Card className="bg-card border border-border/50 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <History className="mr-2 h-5 w-5 text-primary" />
          Recent Searches
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {displayedResults.map((search, index) => (
              <motion.div
                key={search.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: index * 0.05 }}
                className="grid grid-cols-5 gap-2 items-center p-3 rounded-md bg-background/50 border border-border/30 hover:bg-background transition-colors overflow-hidden cursor-pointer"
                onClick={() => handleCardClick(search)}
              >
                {/* Left Column - Icon and Title (3/5 width) */}
                <div className="col-span-3 flex items-center space-x-3 overflow-hidden">
                  <div className="flex-shrink-0">
                    <div className="p-2 rounded-full bg-primary/10">
                      {React.cloneElement(search.icon as React.ReactElement, { className: "h-5 w-5" })}
                    </div>
                  </div>
                  <div className="min-w-0 flex items-center">
                    <span className="font-medium text-base truncate block">{search.title}</span>
                    
                    {/* LinkedIn Icon */}
                    {renderLinkedInIcon(search)}
                    
                    {/* Add download button if resultIds are available */}
                    {renderDownloadButton(search)}
                  </div>
                </div>
                
                {/* Middle Column - Subtitle (1/5 width) */}
                <div className="col-span-1 overflow-hidden">
                  <div className="text-sm text-secondary-text truncate">
                    {search.subtitle}
                  </div>
                </div>
                
                {/* Right Column - Time Ago with Status Icon (1/5 width) */}
                <div className="col-span-1 flex items-center justify-end">
                  <div className="text-sm flex items-center whitespace-nowrap">
                    {search.status === 'completed' ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1.5" />
                        <span className="text-green-500">{formatTimeAgo(search.timestamp, search.status)}</span>
                      </>
                    ) : search.status === 'pending' ? (
                      <>
                        <Loader className="h-4 w-4 text-amber-500 animate-spin mr-1.5" />
                        <span className="text-amber-500/80">{formatTimeAgo(search.timestamp, search.status)}</span>
                      </>
                    ) : search.status === 'failed' ? (
                      <>
                        <XCircle className="h-4 w-4 text-destructive mr-1.5" />
                        <span className="text-destructive/80">{formatTimeAgo(search.timestamp, search.status)}</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 text-secondary-text mr-1.5" />
                        <span className="text-secondary-text">{formatTimeAgo(search.timestamp, search.status || 'Unknown')}</span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
      
      {/* Show More/Less Button - Only show if there are more than initialCount items */}
      {searchResults.length > initialCount && (
        <CardFooter className="pt-0 pb-4 flex justify-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleExpanded}
            className="text-primary hover:text-primary-dark flex items-center gap-1"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                <span>Show Less</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                <span>Show More ({searchResults.length - initialCount} more)</span>
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default RecentSearches; 