import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { Link } from "wouter";
import { useToast } from "../hooks/use-toast";
import {
  Link2,
  Home,
  Coins,
  Search,
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  LogOut,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import Footer from "../components/Footer";
import LinkedInIcon from "../assets/icons/LinkedInIcon";
import LeadSearchForm from "../components/LeadSearchForm";
import LeadResultsTable from "../components/LeadResultsTable";
import { LeadResult } from "../components/LeadSearchForm";

const LeadGenerator: React.FC = () => {
  const { userData, logout } = useAuth();
  const { toast } = useToast();
  const [searchResults, setSearchResults] = useState<LeadResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState({
    company: "",
    position: "",
  });

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

  const handleSearchComplete = (results: LeadResult[]) => {
    setSearchResults(results);
    setShowResults(true);
  };

  const handleSearchStart = () => {
    // Get the current search criteria
    const searchPosition = document.querySelector('#position-title')?.textContent || '';
    const searchCompany = (document.querySelector('#company-name') as HTMLInputElement)?.value || '';
    
    setSearchCriteria({
      company: searchCompany,
      position: searchPosition
    });
  };

  return (
    <div className="min-h-screen flex flex-col grainy-bg">
      {/* Navigation Bar */}
      <nav className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <Link
                to="/"
                className="font-heading font-bold text-xl text-primary-text flex items-center"
              >
                <Link2 className="text-primary mr-2 h-5 w-5" />
                Link It Up
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-secondary-text bg-background/50 py-1 px-3 rounded-full text-sm">
                <Coins className="inline-block text-primary mr-1 h-4 w-4" />
                <span>{userData?.linkCredits || 0}</span> credits
              </div>

              <div className="flex items-center space-x-2">
                <Link
                  to="/dashboard"
                  className="text-secondary-text hover:text-primary transition-colors duration-200 p-2 rounded-md flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow z-10 relative pt-6 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          className="max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Page Header */}
          <motion.div className="mb-8 text-center" variants={itemVariants}>
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-primary-text mb-4">
              Your Professional Lead Generator
            </h1>
            <p className="text-secondary-text max-w-2xl mx-auto">
              Find the perfect professional connections hiding like needles in a
              haystack. Discover high-value leads for your next big opportunity
              with precision and ease.
            </p>
          </motion.div>

          {/* Credit Balance Card */}
          <motion.div className="mb-8" variants={itemVariants}>
            <Card className="bg-card/70 border-border/50">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4">
                      <Coins className="text-primary h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-secondary-text text-sm">
                        Available Credits
                      </p>
                      <p className="text-3xl font-heading font-semibold text-primary-text">
                        {userData?.linkCredits || 0}
                      </p>
                    </div>
                  </div>

                  <div className="text-center sm:text-right">
                    <p className="text-secondary-text text-sm mb-2">
                      Need more credits?
                    </p>
                    <Button className="bg-primary hover:bg-accent-hover text-primary-foreground">
                      Buy Credits
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Search Form */}
          <motion.div className="mb-8" variants={itemVariants}>
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="text-xl text-primary-text">
                  Find Leads
                </CardTitle>
                <CardDescription>
                  Search for professionals by company name and position
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LeadSearchForm
                  onSearchComplete={handleSearchComplete}
                  onSearchStart={handleSearchStart}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Results Section */}
          <AnimatePresence>
            {showResults && (
              <LeadResultsTable
                results={searchResults}
                searchCriteria={searchCriteria}
                isVisible={showResults}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default LeadGenerator;
