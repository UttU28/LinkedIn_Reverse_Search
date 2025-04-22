import React, { useState, useEffect } from 'react';
import { useSearchStore, SearchResult } from '../store/searchStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { History, ExternalLink, Search, Users, Link as LinkIcon, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { fetchSearchHistory, SearchHistoryResult } from '../lib/searchService';
import { useAuthStore } from '../store/authStore';
import { Badge } from './ui/badge';

// Define a unified search result interface for display
interface UnifiedSearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  status: 'Found' | 'Not Found' | 'Pending';
  timestamp: number;
  url?: string;
  icon: JSX.Element;
}

const RecentSearches: React.FC = () => {
  const { recentSearches } = useSearchStore();
  const { user } = useAuthStore();
  const [searchResults, setSearchResults] = useState<UnifiedSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  
  // Number of items to show initially
  const initialCount = 5;

  useEffect(() => {
    const loadSearchHistory = async () => {
      if (!user?.uid) return;
      
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching search history for user:", user.uid);
        const searchHistory = await fetchSearchHistory(user.uid);
        console.log("Search history response:", searchHistory);
        
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
                  
                case 'team':
                  title = `${item.inputMeta?.company || 'Company'} Team`;
                  subtitle = item.inputMeta?.companyUrl || '';
                  url = item.inputMeta?.companyUrl;
                  icon = <LinkIcon className="h-4 w-4" />;
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
                status: item.completedAt 
                  ? 'Found' 
                  : item.status === 'pending' 
                    ? 'Pending' 
                    : 'Not Found',
                timestamp: item.createdAt.getTime(),
                url,
                icon
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
        
        console.log("Processed unified search results:", unifiedResults);
        
        // Sort by timestamp (newest first)
        const sortedResults = unifiedResults.sort((a, b) => b.timestamp - a.timestamp);
        
        setSearchResults(sortedResults);
      } catch (error) {
        console.error('Error loading search history:', error);
        setError('Failed to load search history');
      } finally {
        setLoading(false);
      }
    };
    
    loadSearchHistory();
  }, [user?.uid, recentSearches]);

  // Toggle expanded view
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Determine which items to display based on expanded state
  const displayedResults = expanded 
    ? searchResults 
    : searchResults.slice(0, initialCount);

  // Loading state
  if (loading) {
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
            <p className="text-muted-foreground text-sm">Loading recent searches...</p>
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
                className="grid grid-cols-3 items-center p-3 rounded-md bg-background/50 border border-border/30 hover:bg-background transition-colors overflow-hidden"
              >
                {/* Left Column - Icon and Title */}
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="flex-shrink-0">
                    <div className="p-2 rounded-full bg-primary/10">
                      {React.cloneElement(search.icon as React.ReactElement, { className: "h-5 w-5" })}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <span className="font-medium text-base truncate block">{search.title}</span>
                  </div>
                </div>
                
                {/* Middle Column - Subtitle (Centered) */}
                <div className="flex justify-center">
                  <div className="text-sm text-secondary-text truncate max-w-[90%] text-center">
                    {search.subtitle}
                  </div>
                </div>
                
                {/* Right Column - Status Badge */}
                <div className="flex justify-end">
                  <Badge 
                    variant={search.status === 'Found' ? 'default' : search.status === 'Pending' ? 'secondary' : 'destructive'} 
                    className="text-sm px-3 py-1 whitespace-nowrap"
                  >
                    {search.status}
                  </Badge>
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