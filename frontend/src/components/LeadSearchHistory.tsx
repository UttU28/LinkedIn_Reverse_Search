import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, Clock, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { LeadRecord, getRecentLeadSearches } from '../lib/leadFirebase';
import { collection, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

interface LeadSearchHistoryProps {
  refresh?: number;
}

interface PipelineData {
  id: string;
  company: string;
  position: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Timestamp;
}

interface LeadSearchItem extends LeadRecord {
  pipelineData?: PipelineData;
}

const LeadSearchHistory: React.FC<LeadSearchHistoryProps> = ({ refresh = 0 }) => {
  const { user } = useAuthStore();
  const [searchHistory, setSearchHistory] = useState<LeadSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    
    const fetchSearchHistory = async () => {
      setIsLoading(true);
      try {
        // Get user's lead search history
        const leadSearches = await getRecentLeadSearches(user.uid);
        
        // Get pipeline data for each lead search
        const leadSearchWithPipelines: LeadSearchItem[] = [];
        
        for (const leadSearch of leadSearches) {
          try {
            // Get pipeline data
            const pipelineRef = doc(db, 'pipelines', leadSearch.pipelineId);
            const pipelineSnap = await getDoc(pipelineRef);
            
            if (pipelineSnap.exists()) {
              const pipelineData = {
                id: pipelineSnap.id,
                ...pipelineSnap.data()
              } as PipelineData;
              
              leadSearchWithPipelines.push({
                ...leadSearch,
                pipelineData
              });
            } else {
              // Add with just the lead search data if pipeline not found
              leadSearchWithPipelines.push(leadSearch);
            }
          } catch (error) {
            console.error(`Error fetching pipeline ${leadSearch.pipelineId}:`, error);
            leadSearchWithPipelines.push(leadSearch);
          }
        }
        
        setSearchHistory(leadSearchWithPipelines);
      } catch (error) {
        console.error('Error fetching lead search history:', error);
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
          <Users className="mr-2 h-5 w-5 text-primary/70" />
          Recent Lead Searches
        </h3>
        <Card className="bg-card/70 border-border/50">
          <CardContent className="p-6 text-center">
            <p className="text-secondary-text">
              No lead searches yet. Try searching for some leads!
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
        <Users className="mr-2 h-5 w-5 text-primary/70" />
        Recent Lead Searches
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
                <div className="font-medium text-primary-text mb-1">
                  {search.pipelineData ? (
                    <>
                      <span className="font-bold">{search.pipelineData.company}</span> / {search.pipelineData.position}
                    </>
                  ) : (
                    `Pipeline ID: ${search.pipelineId}`
                  )}
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
              
              <StatusBadge status={search.status} />
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

export default LeadSearchHistory; 