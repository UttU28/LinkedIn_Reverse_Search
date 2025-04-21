import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, limit, DocumentData } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import { Linkedin, Copy, ExternalLink, History, Calendar, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { format } from 'date-fns';

interface SingleSearchResult {
  id: string;
  searchName: string;
  searchCompany: string;
  searchPosition: string;
  linkedinProfileUrl: string | null;
  foundData: number;
  timestamp: Date;
}

interface BulkSearchResult {
  id: string;
  batchId: string;
  fileName: string;
  totalData: number;
  foundData: number;
  timestamp: Date;
  status: string;
}

// Helper for consistent date formatting
const formatShortDate = (date: Date) => {
  return format(date, 'MMM d');
};

const SearchHistory = () => {
  const { user } = useAuthStore();
  const [singleSearches, setSingleSearches] = useState<SingleSearchResult[]>([]);
  const [bulkSearches, setBulkSearches] = useState<BulkSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Copy to clipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Fetch search history from Firestore
  useEffect(() => {
    const fetchSearchHistory = async () => {
      if (!user?.uid) return;

      setIsLoading(true);
      try {
        // Fetch single searches
        const singleSearchRef = collection(db, 'users', user.uid, 'singleSearch');
        const singleSearchQuery = query(singleSearchRef, orderBy('timestamp', 'desc'), limit(10));
        const singleSearchSnapshot = await getDocs(singleSearchQuery);
        const singleSearchData = singleSearchSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        })) as SingleSearchResult[];
        setSingleSearches(singleSearchData);

        // Fetch bulk searches
        const bulkSearchRef = collection(db, 'users', user.uid, 'bulkSearch');
        const bulkSearchQuery = query(bulkSearchRef, orderBy('timestamp', 'desc'), limit(10));
        const bulkSearchSnapshot = await getDocs(bulkSearchQuery);
        const bulkSearchData = bulkSearchSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        })) as BulkSearchResult[];
        setBulkSearches(bulkSearchData);
      } catch (error) {
        console.error('Error fetching search history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchHistory();
  }, [user?.uid]);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-secondary-text">Loading search history...</p>
      </div>
    );
  }

  return (
    <motion.section 
      className="bg-card rounded-xl border border-border/50 p-3 sm:p-4 md:p-6 mb-6 md:mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Tabs defaultValue="bulk" className="w-full">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h3 className="text-lg sm:text-xl font-heading font-medium text-primary-text">
            Search History
          </h3>
          
          <TabsList>
            <TabsTrigger value="bulk" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Bulk Searches
            </TabsTrigger>
            <TabsTrigger value="single" className="flex items-center">
              <Linkedin className="mr-2 h-4 w-4" />
              Individual Searches
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Bulk Search Results Tab */}
        <TabsContent value="bulk">
          {bulkSearches.length === 0 ? (
            <div className="py-6 md:py-8 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <FileText className="text-secondary-text" size={20} />
              </div>
              <p className="text-secondary-text text-sm mb-1">No bulk searches found.</p>
              <p className="text-primary font-medium text-sm">Upload a CSV file to perform bulk searches!</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-background/30">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-secondary-text uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-secondary-text uppercase tracking-wider">
                      File Name
                    </th>
                    <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-secondary-text uppercase tracking-wider">
                      Total Records
                    </th>
                    <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-secondary-text uppercase tracking-wider">
                      Found
                    </th>
                    <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-secondary-text uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {bulkSearches.map((search) => (
                    <tr key={search.id} className="hover:bg-background/30 transition-colors duration-150">
                      <td className="px-3 py-3 text-sm text-secondary-text align-middle whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <Calendar className="h-3 w-3 mr-1 text-secondary-text/70" />
                          <span>{formatShortDate(search.timestamp)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-primary-text align-middle text-center">
                        <div className="flex items-center justify-center">
                          <FileText className="h-4 w-4 mr-2 text-accent" />
                          <span className="truncate max-w-[200px]">{search.fileName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-secondary-text align-middle text-center">
                        {search.totalData}
                      </td>
                      <td className="px-3 py-3 text-sm text-secondary-text align-middle text-center">
                        {search.foundData !== null ? (
                          <span className="text-primary font-medium">{search.foundData}</span>
                        ) : (
                          <span className="text-secondary-text">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 align-middle text-center">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          search.status === 'completed' 
                            ? 'bg-success/20 text-success' 
                            : search.status === 'pending' 
                              ? 'bg-warning/20 text-warning' 
                              : search.status === 'processing'
                                ? 'bg-primary/20 text-primary'
                                : 'bg-destructive/20 text-destructive'
                        }`}>
                          {search.status.charAt(0).toUpperCase() + search.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Single Search Results Tab */}
        <TabsContent value="single">
          {singleSearches.length === 0 ? (
            <div className="py-6 md:py-8 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <History className="text-secondary-text" size={20} />
              </div>
              <p className="text-secondary-text text-sm mb-1">Your search history is empty.</p>
              <p className="text-primary font-medium text-sm">Start searching for LinkedIn profiles!</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-background/30">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-secondary-text uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-secondary-text uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-secondary-text uppercase tracking-wider">
                      Company
                    </th>
                    <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-secondary-text uppercase tracking-wider">
                      Position
                    </th>
                    <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-secondary-text uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {singleSearches.map((search) => (
                    <tr key={search.id} className="hover:bg-background/30 transition-colors duration-150">
                      <td className="px-3 py-3 text-sm text-secondary-text align-middle whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <Calendar className="h-3 w-3 mr-1 text-secondary-text/70" />
                          <span>{formatShortDate(search.timestamp)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-primary-text align-middle whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          {search.linkedinProfileUrl ? (
                            <a 
                              href={search.linkedinProfileUrl} 
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0077b5] hover:text-[#0077b5]/80 mr-2"
                              title="View on LinkedIn"
                            >
                              <Linkedin className="h-4 w-4" />
                            </a>
                          ) : (
                            <span className="text-secondary-text/50 mr-2">
                              <Linkedin className="h-4 w-4" />
                            </span>
                          )}
                          <span className="truncate max-w-[120px]">{search.searchName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-secondary-text align-middle whitespace-nowrap text-center">
                        <span className="truncate max-w-[120px] inline-block">{search.searchCompany}</span>
                      </td>
                      <td className="px-3 py-3 text-sm text-secondary-text align-middle text-center">
                        <span className="truncate max-w-[150px] inline-block">{search.searchPosition}</span>
                      </td>
                      <td className="px-3 py-3 align-middle text-center">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          search.foundData > 0 
                            ? 'bg-success/20 text-success' 
                            : 'bg-destructive/20 text-destructive'
                        }`}>
                          {search.foundData > 0 ? 'Found' : 'Not Found'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.section>
  );
};

export default SearchHistory; 