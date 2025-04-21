import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';
import { Users, Building, ExternalLink } from 'lucide-react';

// Lead search record interface
interface LeadSearchRecord {
  id: string;
  pipelineId: string;
  time: Date;
  cost: number | null;
  company: string;
  position: string;
}

interface LeadSearchHistoryProps {
  refresh?: number; // A value to trigger refreshes when changed
}

const LeadSearchHistory: React.FC<LeadSearchHistoryProps> = ({ refresh = 0 }) => {
  const { user } = useAuthStore();
  const [leadSearches, setLeadSearches] = useState<LeadSearchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch lead searches from Firestore
  useEffect(() => {
    const fetchLeadSearches = async () => {
      if (!user?.uid) return;

      setIsLoading(true);
      try {
        // Fetch lead searches
        const leadRef = collection(db, 'users', user.uid, 'leadSearch');
        const leadQuery = query(leadRef, orderBy('time', 'desc'), limit(10));
        const leadSnapshot = await getDocs(leadQuery);
        
        const leadData = leadSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            pipelineId: data.pipelineId || '',
            time: data.time?.toDate() || new Date(),
            cost: data.cost,
            company: data.company || '',
            position: data.position || ''
          };
        });
        
        setLeadSearches(leadData);
      } catch (error) {
        console.error('Error fetching lead search history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeadSearches();
  }, [user?.uid, refresh]); // Re-fetch when refresh changes

  // Variants for animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.section 
      className="bg-card rounded-xl border border-border/50 p-3 sm:p-4 md:p-6 mb-6 md:mb-12"
      variants={itemVariants}
    >
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h3 className="text-lg sm:text-xl font-heading font-medium text-primary-text">
          Recent Lead Results
        </h3>
        <button className="text-secondary-text hover:text-accent text-xs sm:text-sm flex items-center">
          View All <ExternalLink className="ml-1" size={14} />
        </button>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-full inline-block align-middle">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-background/30">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                    Company / Position
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-secondary-text uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-secondary-text">
                      <div className="py-4">
                        <svg
                          className="animate-spin h-8 w-8 mx-auto mb-3 text-primary"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <p>Loading lead search history...</p>
                      </div>
                    </td>
                  </tr>
                ) : leadSearches.length > 0 ? (
                  leadSearches.map((search) => (
                    <tr key={`lead-${search.id}`} className="hover:bg-background/30 transition-colors duration-150">
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-background flex items-center justify-center">
                            <Building className="h-4 w-4 text-primary" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-primary-text">{search.company}</div>
                            <div className="text-xs text-secondary-text">{search.position}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-secondary-text">{format(search.time, 'MMM dd, yyyy')}</div>
                      </td>
                      <td className="px-3 py-3 align-middle text-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${search.cost !== null ? 'bg-success/20 text-success' : 'bg-yellow-500/20 text-yellow-500'}`}>
                          {search.cost !== null ? 'Completed' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-secondary-text">
                      <div className="py-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Users className="text-secondary-text h-6 w-6" />
                        </div>
                        <p>No lead searches yet. Try searching for some leads!</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default LeadSearchHistory; 