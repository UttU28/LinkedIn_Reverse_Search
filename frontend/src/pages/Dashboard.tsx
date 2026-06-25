import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import {
  Search,
  Users,
  Clock,
  Building2,
  Wrench
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SearchCard from '../components/SearchCard';
import LeadSearchForm from '../components/LeadSearchForm';
import LeadResultsTable from '../components/LeadResultsTable';
import { LeadResult } from '../components/LeadSearchForm';
import RecentSearches from '../components/RecentSearches';
import CompanySearchCard from '../components/CompanySearchCard';
import UtilsCard from '../components/UtilsCard';

const Dashboard: React.FC = () => {
  const { userData, refreshCredits } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'leadSearch' | 'companyFinder' | 'utils'>('profile');
  const hasRefreshedCredits = useRef(false);
  
  useEffect(() => {
    if (userData && !hasRefreshedCredits.current) {
      hasRefreshedCredits.current = true;
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
        className="flex-grow z-10 relative pt-8 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Professional Header */}
        <motion.section variants={itemVariants} className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
                Welcome back, <span className="text-primary">{userData?.name?.split(' ')[0] || 'User'}</span>!
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl">
                {activeTab === 'profile'
                  ? "Ready to discover LinkedIn profiles with AI precision"
                  : activeTab === 'leadSearch'
                    ? "Find targeted professionals for your networking goals"
                    : activeTab === 'companyFinder'
                      ? "Upload company lists to prepare for website discovery"
                      : "Split or stitch CSV and Excel files for your workflows"}
              </p>
            </div>
          </div>
          
          {/* Professional Tab Navigation */}
          <div className="flex bg-card-elevated rounded-2xl p-2 border border-border-elevated overflow-x-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 min-w-[7rem] flex items-center justify-center space-x-2 sm:space-x-3 py-4 px-3 sm:px-6 rounded-xl text-sm sm:text-base font-medium transition-all duration-300 ${
                activeTab === 'profile'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card'
              }`}
            >
              <Search className="h-5 w-5" />
              <span className="hidden sm:inline">Profile Search</span>
              <span className="sm:hidden">Profiles</span>
            </button>
            <button
              onClick={() => setActiveTab('leadSearch')}
              className={`flex-1 min-w-[7rem] flex items-center justify-center space-x-2 sm:space-x-3 py-4 px-3 sm:px-6 rounded-xl text-sm sm:text-base font-medium transition-all duration-300 ${
                activeTab === 'leadSearch'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card'
              }`}
            >
              <Users className="h-5 w-5" />
              <span className="hidden sm:inline">Lead Generator</span>
              <span className="sm:hidden">Leads</span>
            </button>
            <button
              onClick={() => setActiveTab('companyFinder')}
              className={`flex-1 min-w-[7rem] flex items-center justify-center space-x-2 sm:space-x-3 py-4 px-3 sm:px-6 rounded-xl text-sm sm:text-base font-medium transition-all duration-300 ${
                activeTab === 'companyFinder'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card'
              }`}
            >
              <Building2 className="h-5 w-5" />
              <span className="hidden sm:inline">Company Finding</span>
              <span className="sm:hidden">Companies</span>
            </button>
            <button
              onClick={() => setActiveTab('utils')}
              className={`flex-1 min-w-[7rem] flex items-center justify-center space-x-2 sm:space-x-3 py-4 px-3 sm:px-6 rounded-xl text-sm sm:text-base font-medium transition-all duration-300 ${
                activeTab === 'utils'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card'
              }`}
            >
              <Wrench className="h-5 w-5" />
              <span className="hidden sm:inline">Utils</span>
              <span className="sm:hidden">Utils</span>
            </button>
          </div>
        </motion.section>
        
        {/* Professional Search Interface */}
        <AnimatePresence mode="wait">
          {activeTab === 'profile' ? (
            <motion.section 
              key="profile-search"
              className="mb-16"
              variants={itemVariants}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="glass-card rounded-3xl border border-border-elevated shadow-xl p-8">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="p-3 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl border border-primary/20">
                    <Search className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Profile Search</h2>
                    <p className="text-muted-foreground">Find LinkedIn profiles with AI precision</p>
                  </div>
                </div>
                <SearchCard />
              </div>
            </motion.section>
          ) : activeTab === 'leadSearch' ? (
            <motion.section 
              key="lead-generator"
              className="mb-16"
              variants={itemVariants}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="glass-card rounded-3xl border border-border-elevated shadow-xl p-8">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="p-3 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl border border-primary/20">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Lead Generator</h2>
                    <p className="text-muted-foreground">Find targeted professionals at specific companies</p>
                  </div>
                </div>
                <LeadSearchForm 
                  onSearchComplete={handleLeadSearchComplete}
                  onSearchStart={handleLeadSearchStart}
                />
              </div>
            </motion.section>
          ) : activeTab === 'companyFinder' ? (
            <motion.section
              key="company-finder"
              className="mb-16"
              variants={itemVariants}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="glass-card rounded-3xl border border-border-elevated shadow-xl p-8">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="p-3 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl border border-primary/20">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Company Finding</h2>
                    <p className="text-muted-foreground">
                      Upload company lists and verify the Company column before processing
                    </p>
                  </div>
                </div>
                <CompanySearchCard />
              </div>
            </motion.section>
          ) : (
            <motion.section
              key="utils"
              className="mb-16"
              variants={itemVariants}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="glass-card rounded-3xl border border-border-elevated shadow-xl p-8">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="p-3 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl border border-primary/20">
                    <Wrench className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Utils</h2>
                    <p className="text-muted-foreground">
                      Split one file or stitch multiple CSV / Excel files together
                    </p>
                  </div>
                </div>
                <UtilsCard />
              </div>
            </motion.section>
          )}
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

        {/* Professional Dashboard Overview */}
        <motion.section
          className="mb-6"
          variants={itemVariants}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="glass-card rounded-3xl border border-border-elevated shadow-xl p-8">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl border border-primary/20">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
                <p className="text-muted-foreground">Your recent activity and search history</p>
              </div>
            </div>
            <RecentSearches />
          </div>
        </motion.section>
      </motion.main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
