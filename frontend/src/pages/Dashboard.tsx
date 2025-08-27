import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/use-toast';
import {
  Search,
  Users,
  Filter,
  UserCheck,
  Clock
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import SearchCard from '../components/SearchCard';
import LeadSearchForm from '../components/LeadSearchForm';
import LeadResultsTable from '../components/LeadResultsTable';
import { LeadResult } from '../components/LeadSearchForm';
import RecentSearches from '../components/RecentSearches';

const Dashboard: React.FC = () => {
  const { userData, refreshCredits } = useAuthStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'leadSearch'>('profile');
  useEffect(() => {
    if (userData) {
      refreshCredits();
    }
  }, [userData, refreshCredits]);
  
  // Lead search states
  const [leadResults, setLeadResults] = useState<LeadResult[]>([]);
  const [showLeadResults, setShowLeadResults] = useState(false);
  const [leadSearchCriteria, setLeadSearchCriteria] = useState({
    company: '',
    position: ''
  });
  
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  const handleContentSwitch = (value: string) => {
    setActiveTab(value as 'profile' | 'leadSearch');
  };
  
  const handleLeadSearchComplete = (results: LeadResult[]) => {
    setLeadResults(results);
    setShowLeadResults(true);
  };
  
  const handleLeadSearchStart = () => {
    // Update this to capture the current search criteria
    // This information will be displayed in the results table header
    const searchPosition = document.querySelector('#position-title')?.textContent || '';
    const searchCompany = (document.querySelector('#company-name') as HTMLInputElement)?.value || '';
    
    setLeadSearchCriteria({
      company: searchCompany,
      position: searchPosition
    });
  };


  
  return (
    <div className="min-h-screen flex flex-col grainy-bg">
      <Navbar />
      
      <motion.main 
        className="flex-grow z-10 relative pt-4 sm:pt-6 md:pt-8 pb-12 md:pb-20 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Welcome Section */}
        <motion.section variants={itemVariants} className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col items-start justify-between">
            <div>
                              <h1 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-primary-text">
                  Welcome back, <span className="text-primary">{userData?.name?.split(' ')[0] || 'User'}</span>!
                </h1>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm sm:text-base text-secondary-text">
                  {activeTab === 'profile'
                    ? "Ready to find some LinkedIn profiles today?"
                    : "Find targeted professionals for your next opportunity."}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Credits:</span>
                  <span className="font-bold text-primary">₹ {userData?.linkCredits || 0}</span>
                </div>
              </div>
            </div>
            
            <div className="w-full mb-4">
              <Tabs 
                value={activeTab} 
                onValueChange={handleContentSwitch}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 h-auto min-h-12 w-full text-[10px] xxs:text-xs sm:text-sm">
                  <TabsTrigger 
                    value="profile" 
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 py-3 px-2 sm:px-4 flex items-center justify-center gap-1 sm:gap-2"
                  >
                    <div className="flex items-center justify-center">
                      <Search className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="ml-1 sm:ml-2">
                        <span className="xxs:hidden">Profiles</span>
                        <span className="hidden xxs:inline">Find Profiles</span>
                      </span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="leadSearch" 
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 py-3 px-2 sm:px-4 flex items-center justify-center gap-1 sm:gap-2"
                  >
                    <div className="flex items-center justify-center">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="ml-1 sm:ml-2">
                        <span className="xxs:hidden">Leads</span>
                        <span className="hidden xxs:inline">Lead Generator</span>
                      </span>
                    </div>
                  </TabsTrigger>

                </TabsList>
              </Tabs>
            </div>
          </div>
        </motion.section>
        
        {/* Search Forms */}
        <AnimatePresence mode="wait">
          {activeTab === 'profile' ? (
            /* Profile Search Card */
            <motion.section 
              key="profile-search"
              className="mb-6 sm:mb-10 md:mb-16"
              variants={itemVariants}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SearchCard />
            </motion.section>
          ) : activeTab === 'leadSearch' ? (
            /* Lead Generator Search Card */
            <motion.section 
              key="lead-generator"
              className="mb-6 sm:mb-10 md:mb-16"
              variants={itemVariants}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-card border border-border/50 shadow-md overflow-hidden">
                <CardContent className="p-6">
                  <h2 className="text-xl font-heading font-semibold text-primary-text mb-6 flex items-center">
                    <Filter className="mr-2 h-5 w-5 text-primary" />
                    Find Targeted Leads
                  </h2>
                  
                  <LeadSearchForm 
                    onSearchComplete={handleLeadSearchComplete}
                    onSearchStart={handleLeadSearchStart}
                  />
                </CardContent>
              </Card>
            </motion.section>
          ) : null}
        </AnimatePresence>
        
        {/* Results Sections */}
        <AnimatePresence>
          {/* Lead Generator Results */}
          {activeTab === 'leadSearch' && showLeadResults && (
            <LeadResultsTable 
              results={leadResults}
              searchCriteria={leadSearchCriteria}
              isVisible={showLeadResults}
            />
          )}
          

        </AnimatePresence>

        {/* Recent Searches Section */}
        <motion.section
          className="mb-6"
          variants={itemVariants}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h2 className="text-xl font-heading font-semibold text-primary-text mb-4 flex items-center">
            <Clock className="mr-2 h-5 w-5 text-primary" />
            Dashboard Overview
          </h2>
          <div className="w-full">
            <RecentSearches />
          </div>
        </motion.section>
      </motion.main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
