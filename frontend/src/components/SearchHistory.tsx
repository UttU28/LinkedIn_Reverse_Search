import { useState, useEffect } from 'react';
import { Linkedin, Copy, ExternalLink, History, Calendar, FileText, Download, Upload, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { format } from 'date-fns';
import { useToast } from '../hooks/use-toast';
import { useAuthStore } from '../store/authStore';
import { 
  fetchSearchHistory, 
  fetchBatchData, 
  fetchContactsData,
  SingleSearchResult,
  BulkSearchResult
} from '../lib/searchService';
import { motion } from 'framer-motion';

interface SearchHistoryProps {
  refresh?: number; // A value to trigger refreshes when changed
}

// Helper for consistent date formatting
const formatShortDate = (date: Date) => {
  return format(date, 'MMM d');
};

const SearchHistory: React.FC<SearchHistoryProps> = ({ refresh = 0 }) => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [singleSearches, setSingleSearches] = useState<SingleSearchResult[]>([]);
  const [bulkSearches, setBulkSearches] = useState<BulkSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Copy to clipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Fetch search history from service
  useEffect(() => {
    const loadSearchHistory = async () => {
      if (!user?.uid) return;

      setIsLoading(true);
      try {
        const result = await fetchSearchHistory(user.uid);
        setSingleSearches(result.singleSearches);
        setBulkSearches(result.bulkSearches);
      } catch (error) {
        console.error('Error fetching search history:', error);
        toast({
          title: "Failed to load search history",
          description: "There was a problem retrieving your search history",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSearchHistory();
  }, [user?.uid, refresh, toast]);

  // Handler for download button click
  const handleDownloadClick = async (batchId: string) => {
    try {
      console.log('Batch ID document reference:', batchId);
      
      // Fetch batch data
      const batchData = await fetchBatchData(batchId);
      
      if (batchData) {
        // Log batch details
        console.log('Batch data retrieved:');
        console.log('Batch ID:', batchData.batchId);
        console.log('Status:', batchData.status);
        console.log('Contact IDs:', batchData.contactIds);
        console.log('Total Records:', batchData.recordCount);
        console.log('Success Count:', batchData.successCount || 0);
        
        if (batchData.contactIds && batchData.contactIds.length > 0) {
          console.log(`Found ${batchData.contactIds.length} contact IDs in this batch`);
          
          // Fetch and display contact data
          console.log('Retrieving contact details...');
          const contactsData = await fetchContactsData(batchData.contactIds);
          
          console.log('All contact data:');
          console.table(contactsData);
        } else {
          console.log('No contact IDs found in this batch');
        }
      } else {
        toast({
          title: "Batch not found",
          description: `Could not find batch with ID: ${batchId}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing download:', error);
      toast({
        title: "Error retrieving data",
        description: "There was a problem accessing the batch information",
        variant: "destructive"
      });
    }
  };

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
          
          <TabsList className="w-full max-w-[300px] text-xs sm:text-sm">
            <TabsTrigger value="bulk" className="flex items-center px-2 sm:px-4">
              <Upload className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Bulk Searches</span>
            </TabsTrigger>
            <TabsTrigger value="single" className="flex items-center px-2 sm:px-4">
              <User className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Single Searches</span>
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
                        {search.status === 'failed' ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-destructive/20 text-destructive">
                            FAILED
                          </span>
                        ) : search.status === 'completed' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="px-2 py-1 h-auto text-xs font-semibold text-primary border-primary/30 hover:bg-primary/10"
                            onClick={() => handleDownloadClick(search.batchId)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        ) : (
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            search.status === 'pending' 
                              ? 'bg-warning/20 text-warning' 
                              : search.status === 'processing'
                                ? 'bg-primary/20 text-primary'
                                : 'bg-destructive/20 text-destructive'
                          }`}>
                            {search.status.charAt(0).toUpperCase() + search.status.slice(1)}
                          </span>
                        )}
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