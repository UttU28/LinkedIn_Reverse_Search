import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, Calendar, Clock, ExternalLink, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface TeamSearchHistoryProps {
  refresh?: number;
}

interface TeamSearch {
  id: string;
  url: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Timestamp;
  teamUrl: string | null;
}

interface CompanySearch {
  id: string;
  teamId: string;
  timestamp: Timestamp;
  cost: number | null;
  status: 'pending' | 'completed' | 'failed';
}

// Combined interface for displaying history
interface CombinedSearchItem {
  id: string;
  url: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Timestamp;
  teamUrl: string | null;
  companySearchId: string;
}

const TeamSearchHistory: React.FC<TeamSearchHistoryProps> = ({ refresh = 0 }) => {
  const { user } = useAuthStore();
  const [searchHistory, setSearchHistory] = useState<CombinedSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    
    const fetchSearchHistory = async () => {
      setIsLoading(true);
      try {
        // Get user's company search history
        const companySearchRef = collection(db, 'users', user.uid, 'teamSearch');
        const companySearchQuery = query(
          companySearchRef,
          orderBy('timestamp', 'desc'),
          limit(10)
        );
        
        const companySearchSnapshot = await getDocs(companySearchQuery);
        const companySearches = companySearchSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CompanySearch[];
        
        // Get the team IDs from the company searches
        const teamIds = companySearches.map(search => search.teamId);
        
        if (teamIds.length === 0) {
          setSearchHistory([]);
          setIsLoading(false);
          return;
        }
        
        // Get the team search details
        const teamsRef = collection(db, 'teams');
        const teamsQuery = query(
          teamsRef,
          where('__name__', 'in', teamIds)
        );
        
        const teamsSnapshot = await getDocs(teamsQuery);
        const teamSearchMap = new Map<string, TeamSearch>();
        
        teamsSnapshot.docs.forEach(doc => {
          teamSearchMap.set(doc.id, {
            id: doc.id,
            ...doc.data()
          } as TeamSearch);
        });
        
        // Combine the data
        const combinedData: CombinedSearchItem[] = companySearches
          .filter(cs => teamSearchMap.has(cs.teamId)) // Filter out any without team data
          .map(cs => {
            const teamSearch = teamSearchMap.get(cs.teamId)!;
            return {
              id: teamSearch.id,
              url: teamSearch.url,
              status: cs.status, // Use status from companySearch
              timestamp: cs.timestamp || teamSearch.timestamp,
              teamUrl: teamSearch.teamUrl,
              companySearchId: cs.id
            };
          });
        
        // Sort by timestamp (descending)
        combinedData.sort((a, b) => {
          const aTime = a.timestamp?.toMillis() || 0;
          const bTime = b.timestamp?.toMillis() || 0;
          return bTime - aTime;
        });
        
        setSearchHistory(combinedData);
      } catch (error) {
        console.error('Error fetching team search history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSearchHistory();
  }, [user?.uid, refresh]);

  if (isLoading) {
    return (
      <div className="animate-pulse mt-8">
        <div className="h-6 bg-card/70 rounded w-48 mb-4"></div>
        <div className="h-24 bg-card/70 rounded-lg w-full"></div>
      </div>
    );
  }

  if (searchHistory.length === 0) {
    return (
      <motion.div 
        className="mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-lg font-heading font-semibold text-primary-text mb-4 flex items-center">
          <Link className="mr-2 h-5 w-5 text-primary/70" />
          Recent Team Member Searches
        </h3>
        <Card className="bg-card/70 border-border/50">
          <CardContent className="p-6 text-center">
            <p className="text-secondary-text">
              Your team member search history will appear here
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="mt-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="text-lg font-heading font-semibold text-primary-text mb-4 flex items-center">
        <Link className="mr-2 h-5 w-5 text-primary/70" />
        Recent Team Member Searches
      </h3>
      
      <div className="space-y-3">
        {searchHistory.map((search) => (
          <motion.div
            key={search.id}
            className="bg-card/70 border border-border/50 rounded-lg p-3 sm:p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-medium text-primary-text mb-1 truncate max-w-[400px]">
                  {search.url}
                </div>
                <div className="flex items-center text-xs text-secondary-text space-x-3">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>
                      {search.timestamp?.toDate().toLocaleDateString() || 'Unknown date'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>
                      {search.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Unknown time'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <StatusBadge status={search.status} />
                
                {search.teamUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => window.open(search.teamUrl!, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Results
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// Helper component to display status badge
const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'completed':
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
          Completed
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
          Failed
        </Badge>
      );
    case 'pending':
    default:
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
          Processing
        </Badge>
      );
  }
};

export default TeamSearchHistory; 