import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Linkedin,
  Globe2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fetchSearchHistory, SearchHistoryResult, searchHistoryEvents } from '../lib/searchService';
import { useAuthStore } from '../store/authStore';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import { exportToExcel, SearchInfo } from '../utils/excelExporter';
import { exportToCSV } from '../utils/csvExporter';
import { exportCompanySitesToExcel, exportCompanySitesToCSV, CompanySitesSearchInfo } from '../utils/companySitesExporter';

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
  includeCompanyLinks?: boolean;
  processedCount?: number;
  resultsCount?: number;
  totalRecords?: number;
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

  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLoadRef = useRef<number>(0);
  const hasLoadedOnceRef = useRef(false);
  const DEBOUNCE_MS = 800;
  const MIN_INTERVAL_MS = 2000;

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
    
    if (
      searchResult.type !== 'companySitesBulk' &&
      !searchResult.originalData?.resultIds?.length
    ) {
      toast({
        title: "No data to download",
        description: "This search doesn't have any result IDs to download.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setDownloadLoading({id: searchResult.id, type});
      
      // Progress callback for toast notifications
      const onProgress = (
        stage: 'fetching' | 'creating' | 'complete' | 'error',
        count?: number
      ) => {
        if (stage === 'fetching') {
          toast({
            title: `Preparing ${type.toUpperCase()} download`,
            description: 'Fetching data from database...',
            variant: 'default'
          });
        } else if (stage === 'complete' && count) {
          toast({
            title: 'Download complete',
            description: `Successfully downloaded ${count} records as ${type.toUpperCase()} file.`,
            variant: 'default'
          });
        } else if (stage === 'error') {
          toast({
            title: 'Download failed',
            description: `There was a problem downloading the ${type.toUpperCase()} file.`,
            variant: 'destructive'
          });
        }
      };

      if (searchResult.type === 'companySitesBulk') {
        const companySearchInfo: CompanySitesSearchInfo = {
          id: searchResult.id,
          title: searchResult.title,
          timestamp: searchResult.timestamp
        };
        if (type === 'excel') {
          await exportCompanySitesToExcel(companySearchInfo, onProgress);
        } else {
          await exportCompanySitesToCSV(companySearchInfo, onProgress);
        }
      } else {
        const searchInfo: SearchInfo = {
          id: searchResult.id,
          title: searchResult.title,
          timestamp: searchResult.timestamp,
          resultIds: searchResult.originalData.resultIds
        };
        if (type === 'excel') {
          await exportToExcel(searchInfo, onProgress);
        } else {
          await exportToCSV(searchInfo, onProgress);
        }
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
  const loadSearchHistory = useCallback(async (options?: { silent?: boolean }) => {
    if (!user?.uid) return;
    
    try {
      if (!options?.silent) {
        setLoading(true);
      }
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
            const includeCompanyLinks = !!item.inputMeta?.includeCompanyLinks;
            
            switch (item.type) {
              case 'single':
                title = item.inputMeta?.name || 'Unknown Person';
                {
                  const pieces = [
                    item.inputMeta?.company || '',
                    item.inputMeta?.position || ''
                  ].filter(Boolean);
                  if (includeCompanyLinks || item.websiteUrl) {
                    pieces.push('Website');
                  }
                  subtitle = pieces.join(' • ');
                }
                icon = <Search className="h-4 w-4" />;
                // For single searches, include the direct linkedinUrl if available
                url = item.linkedinUrl || undefined;
                break;
                
              case 'bulk':
                title = item.inputMeta?.fileName || 'Bulk Search';
                if (item.status === 'processing' || item.status === 'pending') {
                  const processed = item.processedCount ?? 0;
                  const total = item.totalRecords || 0;
                  const found = item.resultsCount ?? 0;
                  subtitle = total > 0 ? `${processed}/${total} processed · ${found} found` : `${total} records`;
                } else {
                  subtitle = `${item.resultsCount ?? item.totalRecords ?? 0} found`;
                }
                icon = <Users className="h-4 w-4" />;
                break;
                
              case 'recruiters':
                title = `${item.inputMeta?.company || 'Unknown'} Recruiters`;
                subtitle = `${item.totalRecords || 0} leads found`;
                icon = <Filter className="h-4 w-4" />;
                break;
              
              case 'companySitesBulk':
                title = item.inputMeta?.fileName || 'Company Website Search';
                subtitle = `${item.totalRecords || 0} companies`;
                icon = <Globe2 className="h-4 w-4" />;
                break;

              case 'companySitesSingle':
                title = item.inputMeta?.company || 'Company Search';
                subtitle = 'Company Search';
                icon = <Globe2 className="h-4 w-4" />;
                url = item.websiteUrl || undefined;
                break;
                
              default:
                title = `Search: ${item.id}`;
                subtitle = '';
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
              includeCompanyLinks,
              resultIds: item.resultIds || [], // Include resultIds directly
              processedCount: item.processedCount,
              resultsCount: item.resultsCount,
              totalRecords: item.totalRecords,
              originalData: item // Store the full original data
            });
          } catch (err) {
            console.error("Error processing search history item:", err, item);
          }
        });
      }
      
      // Process recent searches from store (in-memory) - read fresh to avoid dependency churn
      const fromStore = useSearchStore.getState().recentSearches;
      fromStore.forEach(search => {
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
      hasLoadedOnceRef.current = true;
    } catch (error) {
      console.error('Error loading search history:', error);
      if (!options?.silent) {
        setError('Failed to load search history');
      }
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [user?.uid]);

  const loadRef = useRef(loadSearchHistory);
  loadRef.current = loadSearchHistory;

  const scheduledLoad = useCallback((silent = false) => {
    if (!user?.uid) return;
    const now = Date.now();
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    const elapsed = now - lastLoadRef.current;
    const isFirstLoad = lastLoadRef.current === 0;
    const runLoad = () => {
      lastLoadRef.current = Date.now();
      loadRef.current({ silent: silent || hasLoadedOnceRef.current });
    };
    if (isFirstLoad || elapsed >= MIN_INTERVAL_MS) {
      runLoad();
      return;
    }
    loadTimeoutRef.current = setTimeout(() => {
      loadTimeoutRef.current = null;
      runLoad();
    }, DEBOUNCE_MS);
  }, [user?.uid]);

  useEffect(() => {
    if (authLoading) return;
    if (user?.uid) {
      scheduledLoad();
      const unsubscribe = searchHistoryEvents.subscribe(() => {
        scheduledLoad();
      });
      const pollInterval = setInterval(() => {
        setSearchResults((current) => {
          const hasProcessing = current.some(
            (item) => item.status === 'processing' || item.status === 'pending'
          );
          if (hasProcessing) {
            scheduledLoad(true);
          }
          return current;
        });
      }, 5000);
      return () => {
        unsubscribe();
        clearInterval(pollInterval);
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
          loadTimeoutRef.current = null;
        }
      };
    } else {
      setLoading(false);
    }
  }, [user?.uid, scheduledLoad, authLoading]);

  // Format time ago string with status prefix
  const formatTimeAgo = (timestamp: number, status: string, search?: UnifiedSearchResult): string => {
    try {
      if (
        search &&
        (status === 'pending' || status === 'processing') &&
        search.totalRecords &&
        (search.processedCount ?? 0) > 0
      ) {
        return `${search.processedCount}/${search.totalRecords}`;
      }

      const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true });
      
      // Map status to display text
      let displayStatus = "Unknown";
      if (status === 'completed') displayStatus = "Found";
      else if (status === 'pending' || status === 'processing') displayStatus = "Finding";
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
    // Show download button for:
    // - 'bulk', 'team', 'recruiters' with resultIds
    // - 'companySitesBulk' (uses separate exporter)
    const isStandardBulk =
      (search.type === 'bulk' || search.type === 'team' || search.type === 'recruiters') &&
      search.originalData?.resultIds?.length;
    const isCompanySitesBulk = search.type === 'companySitesBulk';
    if (!isStandardBulk && !isCompanySitesBulk) return null;
    
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

  // Add link icon component (LinkedIn for profiles, globe for company website searches)
  const renderLinkIcon = (search: UnifiedSearchResult) => {
    if (search.type !== 'single' && search.type !== 'companySitesSingle') return null;

    let href: string | undefined;
    let title = '';
    let iconEl: JSX.Element;

    if (search.type === 'single') {
      const linkedInUrl =
        search.url ||
        search.originalData?.linkedinUrl ||
        search.originalData?.inputMeta?.linkedin ||
        search.originalData?.linkedin ||
        search.originalData?.linkedInUrl ||
        search.originalData?.linkedinProfileUrl;

      href = linkedInUrl;
      title = linkedInUrl ? 'View LinkedIn Profile' : 'No LinkedIn Profile Found';
      iconEl = <Linkedin className="h-5 w-5" />;
    } else {
      const websiteUrl = search.url || search.originalData?.websiteUrl;
      href = websiteUrl;
      title = websiteUrl ? 'Open Company Website' : 'No Company Website Found';
      iconEl = <Globe2 className="h-5 w-5" />;
    }

    const hasUrl = !!href;

    return (
      <div className="ml-2" onClick={(e) => e.stopPropagation()}>
        <a
          href={hasUrl ? href : '#'}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex p-1.5 rounded-full transition-colors ${
            hasUrl
              ? 'text-primary hover:bg-primary/10 cursor-pointer'
              : 'text-gray-400/50 cursor-not-allowed'
          }`}
          onClick={(e) => {
            if (!hasUrl) {
              e.preventDefault();
            }
          }}
          title={title}
        >
          {iconEl}
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
                    {search.includeCompanyLinks && (
                      <Badge variant="outline" className="ml-2 text-[0.7rem] px-1.5 py-0">
                        + URLs
                      </Badge>
                    )}
                    
                    {/* Link Icon (LinkedIn or Website) */}
                    {renderLinkIcon(search)}
                    
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
                    ) : search.status === 'pending' || search.status === 'processing' ? (
                      <>
                        <Loader className="h-4 w-4 text-amber-500 animate-spin mr-1.5" />
                        <span className="text-amber-500/80">{formatTimeAgo(search.timestamp, search.status, search)}</span>
                      </>
                    ) : search.status === 'failed' ? (
                      <>
                        <XCircle className="h-4 w-4 text-destructive mr-1.5" />
                        <span className="text-destructive/80">{formatTimeAgo(search.timestamp, search.status, search)}</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 text-secondary-text mr-1.5" />
                        <span className="text-secondary-text">{formatTimeAgo(search.timestamp, search.status || 'Unknown', search)}</span>
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