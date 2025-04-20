import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useModalStore } from '../store/modalStore';
import Navbar from '../components/Navbar';
import DashboardCard from '../components/DashboardCard';
import SearchCard from '../components/SearchCard';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { 
  Coins, 
  Search, 
  Percent, 
  History, 
  ExternalLink, 
  ArrowRight,
  Check,
  Users,
  Filter,
  DollarSign,
  Briefcase,
  Building
} from 'lucide-react';
import LinkedInIcon from '../assets/icons/LinkedInIcon';

// Dummy results for Lead Generator demonstration
const dummyLeadResults = [
  { id: 1, name: 'Sarah Johnson', company: 'TechCorp', position: 'VP of Recruitment', exactMatch: true },
  { id: 2, name: 'Michael Chen', company: 'TechCorp', position: 'Senior Recruitment Manager', exactMatch: true },
  { id: 3, name: 'Emily Rodriguez', company: 'TechCorp', position: 'Talent Acquisition Lead', exactMatch: true },
  { id: 4, name: 'James Wilson', company: 'GlobalHR', position: 'Recruitment Director', exactMatch: false },
  { id: 5, name: 'Aisha Patel', company: 'TalentSphere', position: 'Head of Recruitment', exactMatch: false },
  { id: 6, name: 'Robert Kim', company: 'TechCorp', position: 'Technical Recruiter', exactMatch: true },
  { id: 7, name: 'Jessica Smith', company: 'JobMatch', position: 'Recruitment Specialist', exactMatch: false },
];

const Dashboard: React.FC = () => {
  const { userData, fetchUserData } = useAuthStore();
  const { openModal } = useModalStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'lead'>('profile');
  
  // State for lead generator
  const [company, setCompany] = useState('');
  const [positionTitle, setPositionTitle] = useState('recruitment');
  const [isLoading, setIsLoading] = useState(false);
  const [showLeadResults, setShowLeadResults] = useState(false);
  const [leadResults, setLeadResults] = useState(dummyLeadResults);
  const [leadSearchCriteria, setLeadSearchCriteria] = useState<{company: string, position: string}>({
    company: 'TechCorp',
    position: 'Recruiter'
  });
  
  const positionOptions = [
    { value: 'recruitment', label: 'Recruitment' },
    { value: 'investment', label: 'Investment' },
    { value: 'c-level', label: 'C-Level' }
  ];
  
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);
  
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
    setActiveTab(value as 'profile' | 'lead');
  };
  
  const handleLeadSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !positionTitle) return;
    
    setIsLoading(true);
    
    // Update the search criteria
    setLeadSearchCriteria({
      company: company,
      position: positionTitle === 'recruitment' ? 'Recruiter' : 
                positionTitle === 'investment' ? 'Investor' : 'Executive'
    });
    
    // Simulate API call
    setTimeout(() => {
      // Filter results based on position selection
      let filteredResults = [...dummyLeadResults];
      
      if (positionTitle === 'recruitment') {
        filteredResults = dummyLeadResults.filter(r => r.position.toLowerCase().includes('recruit'));
      } else if (positionTitle === 'investment') {
        // Replace with investment-related positions in a real app
        filteredResults = dummyLeadResults.slice(0, 3);
      } else if (positionTitle === 'c-level') {
        // Replace with c-level positions in a real app
        filteredResults = dummyLeadResults.slice(3, 6);
      }
      
      setLeadResults(filteredResults);
      setShowLeadResults(true);
      setIsLoading(false);
    }, 1500);
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
                  : "Find targeted professionals for your next opportunity."}
              </p>
              
              <Tabs 
                value={activeTab} 
                onValueChange={handleContentSwitch}
              >
                <TabsList className="grid grid-cols-2 h-10 w-[300px]">
                  <TabsTrigger 
                    value="profile" 
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Find Profiles
                  </TabsTrigger>
                  <TabsTrigger 
                    value="lead" 
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Lead Generator
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
          ) : (
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
                  
                  <form onSubmit={handleLeadSearch} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="company-name" className="flex items-center">
                          <Building className="mr-2 h-4 w-4 text-primary/70" />
                          Company Name <span className="text-destructive ml-1">*</span>
                        </Label>
                        <Input
                          id="company-name"
                          placeholder="Enter target company name"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          required
                          className="bg-background/50"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="position-title" className="flex items-center">
                          <Briefcase className="mr-2 h-4 w-4 text-primary/70" />
                          Position Title <span className="text-destructive ml-1">*</span>
                        </Label>
                        <Select 
                          value={positionTitle} 
                          onValueChange={setPositionTitle}
                          required
                        >
                          <SelectTrigger className="bg-background/50">
                            <SelectValue placeholder="Select position category" />
                          </SelectTrigger>
                          <SelectContent>
                            {positionOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-accent-hover"
                      disabled={isLoading || !company || !positionTitle}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Searching...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Search className="mr-2 h-4 w-4" />
                          Find People
                        </div>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.section>
          )}
        </AnimatePresence>
        
        {/* Results Sections */}
        <AnimatePresence>
          {/* Lead Generator Results */}
          {activeTab === 'lead' && showLeadResults && (
            <motion.section 
              key="lead-results"
              className="mb-6 sm:mb-10 md:mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-heading font-semibold text-primary-text flex items-center">
                  <Users className="mr-2 h-5 w-5 text-primary" />
                  Lead Results
                </h2>
                <div className="text-sm text-secondary-text">
                  <span className="text-primary font-medium">{leadResults.length}</span> leads found
                </div>
              </div>
              
              <div className="overflow-x-auto custom-scrollbar rounded-xl border border-border/50 bg-card/70 mb-10">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-background/30">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                        Company
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                        Position
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-background/10 divide-y divide-border">
                    {/* Exact matches first */}
                    {leadResults.filter(result => result.exactMatch).map((result) => (
                      <motion.tr 
                        key={result.id}
                        className="hover:bg-background/30 transition-colors duration-150"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td className="px-4 py-4 whitespace-nowrap align-middle">
                          <div className="flex items-center">
                            <a 
                              href="https://linkedin.com/in/example" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="h-8 w-8 rounded-full bg-primary/20 mr-3 flex items-center justify-center hover:bg-primary/40 transition-colors duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                // In a real app, would use actual LinkedIn URL from API response
                                window.open(`https://linkedin.com/in/${result.name.toLowerCase().replace(/\s+/g, '-')}`, '_blank');
                              }}
                            >
                              <LinkedInIcon className="h-4 w-4 text-primary" />
                            </a>
                            <a
                              href="https://linkedin.com/in/example" 
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-primary-text hover:text-primary cursor-pointer transition-colors duration-200"
                              onClick={(e) => {
                                e.preventDefault();
                                // In a real app, would use actual LinkedIn URL
                                window.open(`https://linkedin.com/in/${result.name.toLowerCase().replace(/\s+/g, '-')}`, '_blank');
                              }}
                            >
                              {result.name}
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap align-middle">
                          <div className="text-sm text-secondary-text">
                            {result.company}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <div className="text-sm text-secondary-text max-w-[200px] truncate">
                            {result.position}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                    
                    {/* Separator for related results */}
                    {leadResults.some(result => !result.exactMatch) && (
                      <tr className="bg-background/30">
                        <td colSpan={3} className="px-4 py-2">
                          <div className="text-xs font-medium text-secondary-text uppercase tracking-wider flex items-center">
                            <span className="mr-2">Additional Results Found For You</span>
                            <div className="h-px flex-grow bg-border"></div>
                          </div>
                        </td>
                      </tr>
                    )}
                    
                    {/* Related matches second */}
                    {leadResults.filter(result => !result.exactMatch).map((result) => (
                      <motion.tr 
                        key={result.id}
                        className="hover:bg-background/30 transition-colors duration-150"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td className="px-4 py-4 whitespace-nowrap align-middle">
                          <div className="flex items-center">
                            <a 
                              href="https://linkedin.com/in/example" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="h-8 w-8 rounded-full bg-accent/20 mr-3 flex items-center justify-center hover:bg-accent/40 transition-colors duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                // In a real app, would use actual LinkedIn URL
                                window.open(`https://linkedin.com/in/${result.name.toLowerCase().replace(/\s+/g, '-')}`, '_blank');
                              }}
                            >
                              <LinkedInIcon className="h-4 w-4 text-accent" />
                            </a>
                            <a
                              href="https://linkedin.com/in/example" 
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-primary-text hover:text-primary cursor-pointer transition-colors duration-200"
                              onClick={(e) => {
                                e.preventDefault();
                                // In a real app, would use actual LinkedIn URL
                                window.open(`https://linkedin.com/in/${result.name.toLowerCase().replace(/\s+/g, '-')}`, '_blank');
                              }}
                            >
                              {result.name}
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap align-middle">
                          <div className="text-sm text-secondary-text">
                            {result.company}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <div className="text-sm text-secondary-text max-w-[200px] truncate">
                            {result.position}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
        
        {/* Recent Searches */}
        <motion.section 
          className="bg-card rounded-xl border border-border/50 p-3 sm:p-4 md:p-6 mb-6 md:mb-12"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-lg sm:text-xl font-heading font-medium text-primary-text">
              {activeTab === 'profile' ? 'Recent Searches' : 'Recent Lead Results'}
            </h3>
            <button className="text-secondary-text hover:text-accent text-xs sm:text-sm flex items-center">
              View All <ExternalLink className="ml-1" size={14} />
            </button>
          </div>
          
          {userData?.totalSearched === 0 && activeTab === 'profile' ? (
            <div className="py-6 md:py-8 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <History className="text-secondary-text" size={20} />
              </div>
              <p className="text-secondary-text text-sm">No recent searches yet. Start your first search!</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <div className="min-w-full inline-block align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full table-fixed divide-y divide-border">
                    <thead className="bg-background/30">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-secondary-text uppercase tracking-wider w-[100px] sm:w-[120px]">Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-secondary-text uppercase tracking-wider w-[100px] sm:w-[120px]">Company</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-secondary-text uppercase tracking-wider w-[130px] sm:w-[160px]">Position</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-secondary-text uppercase tracking-wider w-[70px]">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-secondary-text uppercase tracking-wider w-[90px]">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background/10">
                      {/* For Lead Generator tab, show the current lead results if available */}
                      {activeTab === 'lead' && showLeadResults ? (
                        // Show the first 3 lead results from the current search
                        leadResults.slice(0, 3).map((result) => (
                          <tr key={`recent-${result.id}`} className="hover:bg-background/30 transition-colors duration-150">
                            <td className="px-3 py-3 text-sm text-primary-text align-middle">
                              <div className="overflow-hidden text-ellipsis whitespace-nowrap flex items-center">
                                <a 
                                  href="https://linkedin.com/in/example" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="h-6 w-6 rounded-full bg-primary/20 mr-2 flex items-center justify-center hover:bg-primary/40 transition-colors duration-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // In a real app, would use actual LinkedIn URL
                                    window.open(`https://linkedin.com/in/${result.name.toLowerCase().replace(/\s+/g, '-')}`, '_blank');
                                  }}
                                >
                                  <LinkedInIcon className="h-3 w-3 text-primary" />
                                </a>
                                <a 
                                  href="https://linkedin.com/in/example" 
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-primary cursor-pointer transition-colors duration-200"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    window.open(`https://linkedin.com/in/${result.name.toLowerCase().replace(/\s+/g, '-')}`, '_blank');
                                  }}
                                >
                                  {result.name}
                                </a>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-sm text-secondary-text align-middle">
                              <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                                <span className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-primary-text mr-1">
                                  Search: {leadSearchCriteria?.company || 'TechCorp'}
                                </span>
                                {result.company}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-sm text-secondary-text align-middle">
                              <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                                <span className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-primary-text mr-1">
                                  Search: {leadSearchCriteria?.position || 'Recruiter'}
                                </span>
                                {result.position}
                              </div>
                            </td>
                            <td className="px-3 py-3 align-middle">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${result.exactMatch ? 'bg-success/20 text-success' : 'bg-accent/20 text-accent'}`}>
                                {result.exactMatch ? 'Exact' : 'Related'}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-sm text-secondary-text align-middle">
                              <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                                {new Date().toLocaleDateString()}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : activeTab === 'profile' ? (
                        // Default profile search history
                        <>
                          <tr className="hover:bg-background/30 transition-colors duration-150">
                            <td className="px-3 py-3 text-sm text-primary-text align-middle">
                              <div className="overflow-hidden text-ellipsis whitespace-nowrap flex items-center">
                                <a 
                                  href="https://linkedin.com/in/example" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="h-6 w-6 rounded-full bg-primary/20 mr-2 flex items-center justify-center hover:bg-primary/40 transition-colors duration-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open("https://linkedin.com/in/john-smith", '_blank');
                                  }}
                                >
                                  <LinkedInIcon className="h-3 w-3 text-primary" />
                                </a>
                                <a 
                                  href="https://linkedin.com/in/john-smith" 
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-primary cursor-pointer transition-colors duration-200"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    window.open("https://linkedin.com/in/john-smith", '_blank');
                                  }}
                                >
                                  John Smith
                                </a>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-sm text-secondary-text align-middle">
                              <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                                Acme Inc
                              </div>
                            </td>
                            <td className="px-3 py-3 text-sm text-secondary-text align-middle">
                              <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                                Marketing Director
                              </div>
                            </td>
                            <td className="px-3 py-3 align-middle">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success/20 text-success">Found</span>
                            </td>
                            <td className="px-3 py-3 text-sm text-secondary-text align-middle">
                              <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                                {new Date().toLocaleDateString()}
                              </div>
                            </td>
                          </tr>
                          <tr className="hover:bg-background/30 transition-colors duration-150">
                            <td className="px-3 py-3 text-sm text-primary-text align-middle">
                              <div className="overflow-hidden text-ellipsis whitespace-nowrap flex items-center">
                                <a 
                                  href="https://linkedin.com/in/example" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="h-6 w-6 rounded-full bg-primary/20 mr-2 flex items-center justify-center hover:bg-primary/40 transition-colors duration-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open("https://linkedin.com/in/sarah-johnson", '_blank');
                                  }}
                                >
                                  <LinkedInIcon className="h-3 w-3 text-primary" />
                                </a>
                                <a 
                                  href="https://linkedin.com/in/sarah-johnson" 
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-primary cursor-pointer transition-colors duration-200"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    window.open("https://linkedin.com/in/sarah-johnson", '_blank');
                                  }}
                                >
                                  Sarah Johnson
                                </a>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-sm text-secondary-text align-middle">
                              <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                                TechCorp
                              </div>
                            </td>
                            <td className="px-3 py-3 text-sm text-secondary-text align-middle">
                              <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                                Software Engineer
                              </div>
                            </td>
                            <td className="px-3 py-3 align-middle">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success/20 text-success">Found</span>
                            </td>
                            <td className="px-3 py-3 text-sm text-secondary-text align-middle">
                              <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                                {new Date().toLocaleDateString()}
                              </div>
                            </td>
                          </tr>
                        </>
                      ) : (
                        // Default view for lead tab when no search has been performed
                        <tr>
                          <td colSpan={5} className="px-3 py-6 text-center text-secondary-text">
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
          )}
        </motion.section>
      </motion.main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
