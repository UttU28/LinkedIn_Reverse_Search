import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'wouter';
import { useToast } from '../hooks/use-toast';
import {
  Home,
  Search,
  CreditCard,
  Users,
  Bell,
  ChevronRight,
  User,
  Building,
  Briefcase,
  Filter,
  ExternalLink,
  UserCheck,
  Clock,
  Calendar,
  ArrowUp,
  Filter as FilterIcon,
  Bookmark,
  ChevronDown,
  Download,
  Link as LinkIcon
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
} from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import SearchCard from '../components/SearchCard';
import SearchHistory from '../components/SearchHistory';
import LeadSearchHistory from '../components/LeadSearchHistory';
import TeamSearchHistory from '../components/TeamSearchHistory';
import axios from 'axios';
import { createPipeline, updatePipelineCompletion } from '../lib/leadFirebase';
import LinkedInIcon from '../assets/icons/LinkedInIcon';
import LeadSearchForm from '../components/LeadSearchForm';
import LeadResultsTable from '../components/LeadResultsTable';
import { LeadResult } from '../components/LeadSearchForm';
import TeamMembersForm from '../components/TeamMembersForm';
import { Badge } from '../components/ui/badge';

const Dashboard: React.FC = () => {
  const { user, userData } = useAuthStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'leadSearch' | 'teamMembers'>('profile');
  
  // Lead search states
  const [leadResults, setLeadResults] = useState<LeadResult[]>([]);
  const [showLeadResults, setShowLeadResults] = useState(false);
  const [leadSearchCriteria, setLeadSearchCriteria] = useState({
    company: '',
    position: ''
  });
  
  // Team members states
  const [teamSearchResults, setTeamSearchResults] = useState<any>(null);
  const [showTeamSearchResults, setShowTeamSearchResults] = useState(false);
  
  // Refresh states for history components
  const [refreshLeadHistory, setRefreshLeadHistory] = useState(0);
  const [refreshProfileHistory, setRefreshProfileHistory] = useState(0);
  const [refreshTeamHistory, setRefreshTeamHistory] = useState(0);
  
  const positionOptions = [
    { value: 'recruitment', label: 'Recruitment' },
    { value: 'investment', label: 'Investment' },
    { value: 'c-level', label: 'C-Level Executives' }
  ];
  
  useEffect(() => {
    // Empty effect to replace removed fetchUserData call
  }, []);
  
  // Calculate success rate
  const getSuccessRate = (): string => {
    if (!userData) return '0%';
    
    if (userData.totalSearched === 0) return '0%';
    
    const rate = (userData.totalFound / userData.totalSearched) * 100;
    return `${Math.round(rate)}%`;
  };
  
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
    setActiveTab(value as 'profile' | 'leadSearch' | 'teamMembers');
  };
  
  const handleLeadSearchComplete = (results: LeadResult[]) => {
    setLeadResults(results);
    setShowLeadResults(true);
    setRefreshLeadHistory(prev => prev + 1);
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

  const handleTeamSearchComplete = (results: any) => {
    setTeamSearchResults(results);
    setShowTeamSearchResults(true);
    setRefreshTeamHistory(prev => prev + 1);
  };
  
  const handleTeamSearchStart = () => {
    // Any setup needed before team search
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
              <p className="text-sm sm:text-base text-secondary-text mb-4">
                {activeTab === 'profile'
                  ? "Ready to find some LinkedIn profiles today?"
                  : activeTab === 'leadSearch'
                  ? "Find targeted professionals for your next opportunity."
                  : "Discover team members from company pages."}
              </p>
            </div>
            
            <div className="w-full mb-4">
              <Tabs 
                value={activeTab} 
                onValueChange={handleContentSwitch}
                className="w-full"
              >
                <TabsList className="grid grid-cols-3 h-auto min-h-12 w-full text-[10px] xxs:text-xs sm:text-sm">
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
                  <TabsTrigger 
                    value="teamMembers" 
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 py-3 px-2 sm:px-4 flex items-center justify-center gap-1 sm:gap-2"
                  >
                    <div className="flex items-center justify-center">
                      <LinkIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="ml-1 sm:ml-2">
                        <span className="xxs:hidden">Team</span>
                        <span className="hidden xxs:inline">Team Members</span>
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
              <SearchCard onSearchComplete={() => setRefreshProfileHistory(prev => prev + 1)} />
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
          ) : (
            /* Team Members Search Card */
            <motion.section 
              key="team-members"
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
                    <LinkIcon className="mr-2 h-5 w-5 text-primary" />
                    Find Team Members
                  </h2>
                  
                  <TeamMembersForm 
                    onSearchComplete={handleTeamSearchComplete}
                    onSearchStart={handleTeamSearchStart}
                  />
                </CardContent>
              </Card>
            </motion.section>
          )}
        </AnimatePresence>
        
        {/* Results Sections */}
        <AnimatePresence>
          {/* Lead Generator Results */}
          {activeTab === 'leadSearch' && (
            <LeadResultsTable 
              results={leadResults}
              searchCriteria={leadSearchCriteria}
              isVisible={showLeadResults}
            />
          )}
          
          {/* Team Members Results - Show submitted search */}
          {activeTab === 'teamMembers' && showTeamSearchResults && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-card/70 border-border/50">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <LinkIcon className="h-8 w-8 text-primary/70" />
                </div>
                    <h3 className="text-xl font-heading font-semibold text-primary-text">
                      Team Members Search Submitted
                    </h3>
                    
                    <div className="flex items-center justify-center">
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30 ml-2">
                        Processing
                      </Badge>
                          </div>
                    
                    <div className="max-w-lg">
                      <p className="text-secondary-text mb-2">
                        We're processing your request for:
                      </p>
                      <div className="bg-background/50 rounded-md p-3 text-primary-text font-mono text-sm break-all">
                        {teamSearchResults?.originalUrl}
                          </div>
                      <p className="text-secondary-text mt-4 text-sm">
                        Team member information will be available soon. We'll update you when it's ready.
                      </p>
                          </div>
                          </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Recent Searches */}
        {activeTab === 'profile' ? (
          <SearchHistory refresh={refreshProfileHistory} />
        ) : activeTab === 'leadSearch' ? (
          <LeadSearchHistory refresh={refreshLeadHistory} />
        ) : (
          <TeamSearchHistory refresh={refreshTeamHistory} />
        )}
      </motion.main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
