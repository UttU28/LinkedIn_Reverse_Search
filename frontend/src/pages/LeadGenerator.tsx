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
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import Footer from "../components/Footer";
import LinkedInIcon from "../assets/icons/LinkedInIcon";

// Define interface for lead result
interface LeadResult {
  id: number;
  name: string;
  company: string;
  position: string;
  profileUrl: string;
  isExactMatch: boolean;
}

const LeadGenerator: React.FC = () => {
  const { userData, logout } = useAuth();
  const { toast } = useToast();
  const [searchForm, setSearchForm] = useState({
    company: "",
    position: "Recruitment",
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LeadResult[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Mock data for the search results
  const mockResults: LeadResult[] = [
    {
      id: 1,
      name: "Sarah Johnson",
      company: "TalentSphere Inc",
      position: "Senior Recruitment Manager",
      profileUrl: "https://www.example.com/profile/sarah-johnson-12345",
      isExactMatch: true,
    },
    {
      id: 2,
      name: "Michael Thompson",
      company: "TalentSphere Inc",
      position: "Talent Acquisition Specialist",
      profileUrl: "https://www.example.com/profile/michael-thompson-67890",
      isExactMatch: true,
    },
    {
      id: 3,
      name: "Jennifer Richards",
      company: "TalentSphere Inc",
      position: "HR Director",
      profileUrl: "https://www.example.com/profile/jennifer-richards-54321",
      isExactMatch: true,
    },
    {
      id: 4,
      name: "David Clark",
      company: "Apex Recruiting",
      position: "Technical Recruiter",
      profileUrl: "https://www.example.com/profile/david-clark-09876",
      isExactMatch: false,
    },
    {
      id: 5,
      name: "Amanda Lee",
      company: "Global Talent Solutions",
      position: "Recruitment Lead",
      profileUrl: "https://www.example.com/profile/amanda-lee-24680",
      isExactMatch: false,
    },
    {
      id: 6,
      name: "Robert Wilson",
      company: "TalentSphere Inc",
      position: "VP of Talent Acquisition",
      profileUrl: "https://www.example.com/profile/robert-wilson-13579",
      isExactMatch: true,
    },
    {
      id: 7,
      name: "Emily Davis",
      company: "NextGen Staffing",
      position: "Recruitment Consultant",
      profileUrl: "https://www.example.com/profile/emily-davis-97531",
      isExactMatch: false,
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchForm.company.trim()) {
      toast({
        title: "Company name required",
        description: "Please enter a company name to search for leads",
        variant: "destructive",
      });
      return;
    }

    // Check if user has enough credits
    if (userData?.linkCredits === undefined || userData.linkCredits < 1) {
      toast({
        title: "Insufficient credits",
        description: "You don't have enough credits to perform this search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);

    // Simulate API call with timeout
    setTimeout(() => {
      setSearchResults(mockResults);
      setShowResults(true);
      setIsSearching(false);
    }, 2000);
  };

  const handleCopyLink = (url: string, index: number) => {
    navigator.clipboard.writeText(url).then(
      () => {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
        toast({
          title: "Link copied",
          description: "Professional profile link copied to clipboard",
          variant: "default",
        });
      },
      () => {
        toast({
          title: "Copy failed",
          description: "Failed to copy link to clipboard",
          variant: "destructive",
        });
      },
    );
  };

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

  const tableRowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
      },
    }),
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
                <form onSubmit={handleSearch} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">
                        Company Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="company-name"
                        placeholder="e.g., TalentSphere Inc"
                        value={searchForm.company}
                        onChange={(e) =>
                          setSearchForm({
                            ...searchForm,
                            company: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="position-title">
                        Position Title{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={searchForm.position}
                        onValueChange={(value) =>
                          setSearchForm({ ...searchForm, position: value })
                        }
                      >
                        <SelectTrigger id="position-title">
                          <SelectValue placeholder="Select a position" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Recruitment">
                            Recruitment
                          </SelectItem>
                          <SelectItem value="Investment">Investment</SelectItem>
                          <SelectItem value="C-Level">C-Level</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="bg-primary hover:bg-accent-hover text-primary-foreground w-full sm:w-auto"
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <div className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                          Searching...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Search className="mr-2 h-4 w-4" />
                          Find People
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Legal Disclaimer */}
          <motion.div className="mb-8" variants={itemVariants}>
            <div className="bg-card/50 border border-border/50 rounded-lg p-4">
              <p className="text-sm text-secondary-text text-center">
                This tool identifies publicly accessible professional profiles based on user-provided inputs. 
                Users are responsible for complying with all applicable laws and third-party platform terms.
              </p>
            </div>
          </motion.div>

          {/* Results Section */}
          <AnimatePresence>
            {showResults && (
              <motion.div
                className="mb-8"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <Card className="bg-card border-border/50 overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-xl text-primary-text">
                      Search Results{" "}
                      <span className="text-primary">
                        ({searchResults.length})
                      </span>
                    </CardTitle>
                    <CardDescription>
                      Professionals found for {searchForm.position} at{" "}
                      {searchForm.company}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Tabs defaultValue="all" className="w-full">
                      <div className="px-6 border-b border-border">
                        <TabsList className="bg-background/20 my-2">
                          <TabsTrigger value="all">
                            All Results ({searchResults.length})
                          </TabsTrigger>
                          <TabsTrigger value="exact">
                            Exact Matches (
                            {searchResults.filter((r) => r.isExactMatch).length}
                            )
                          </TabsTrigger>
                          <TabsTrigger value="similar">
                            Similar (
                            {
                              searchResults.filter((r) => !r.isExactMatch)
                                .length
                            }
                            )
                          </TabsTrigger>
                        </TabsList>
                      </div>

                      <TabsContent value="all" className="m-0">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-border">
                            <thead className="bg-background/30">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                                  Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                                  Company
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                                  Position
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                                  Profile
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-background/10 divide-y divide-border">
                              {searchResults.map((result, index) => (
                                <motion.tr
                                  key={result.id}
                                  className={
                                    result.isExactMatch
                                      ? ""
                                      : "bg-background/30"
                                  }
                                  variants={tableRowVariants}
                                  initial="hidden"
                                  animate="visible"
                                  custom={index}
                                  whileHover={{
                                    backgroundColor:
                                      "rgba(var(--primary), 0.05)",
                                  }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-medium text-primary">
                                          {result.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")}
                                        </span>
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-medium text-primary-text">
                                          {result.name}
                                        </div>
                                        {!result.isExactMatch && (
                                          <div className="text-xs text-secondary-text">
                                            Similar match
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-primary-text">
                                      {result.company}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-secondary-text">
                                      {result.position}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-text">
                                    <div className="flex items-center space-x-2">
                                      <a
                                        href={result.profileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:text-primary-hover"
                                      >
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-primary hover:text-primary-hover hover:bg-primary/10"
                                        >
                                          <ExternalLink className="h-4 w-4" />
                                        </Button>
                                      </a>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-primary hover:text-primary-hover hover:bg-primary/10"
                                        onClick={() =>
                                          handleCopyLink(
                                            result.profileUrl,
                                            index,
                                          )
                                        }
                                      >
                                        {copiedIndex === index ? (
                                          <Check className="h-4 w-4" />
                                        ) : (
                                          <Copy className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>

                      <TabsContent value="exact" className="m-0">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-border">
                            <thead className="bg-background/30">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                                  Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                                  Company
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                                  Position
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                                  Profile
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-background/10 divide-y divide-border">
                              {searchResults
                                .filter((r) => r.isExactMatch)
                                .map((result, index) => (
                                  <motion.tr
                                    key={result.id}
                                    variants={tableRowVariants}
                                    initial="hidden"
                                    animate="visible"
                                    custom={index}
                                    whileHover={{
                                      backgroundColor:
                                        "rgba(var(--primary), 0.05)",
                                    }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                          <span className="text-sm font-medium text-primary">
                                            {result.name
                                              .split(" ")
                                              .map((n) => n[0])
                                              .join("")}
                                          </span>
                                        </div>
                                        <div className="ml-4">
                                          <div className="text-sm font-medium text-primary-text">
                                            {result.name}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-primary-text">
                                        {result.company}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-secondary-text">
                                        {result.position}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-text">
                                      <div className="flex items-center space-x-2">
                                        <a
                                          href={result.profileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-primary hover:text-primary-hover"
                                        >
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-primary hover:text-primary-hover hover:bg-primary/10"
                                          >
                                            <ExternalLink className="h-4 w-4" />
                                          </Button>
                                        </a>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-primary hover:text-primary-hover hover:bg-primary/10"
                                          onClick={() =>
                                            handleCopyLink(
                                              result.profileUrl,
                                              index,
                                            )
                                          }
                                        >
                                          {copiedIndex === index ? (
                                            <Check className="h-4 w-4" />
                                          ) : (
                                            <Copy className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </div>
                                    </td>
                                  </motion.tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>

                      <TabsContent value="similar" className="m-0">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-border">
                            <thead className="bg-background/30">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                                  Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                                  Company
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                                  Position
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                                  Profile
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-background/10 divide-y divide-border">
                              {searchResults
                                .filter((r) => !r.isExactMatch)
                                .map((result, index) => (
                                  <motion.tr
                                    key={result.id}
                                    variants={tableRowVariants}
                                    initial="hidden"
                                    animate="visible"
                                    custom={index}
                                    whileHover={{
                                      backgroundColor:
                                        "rgba(var(--primary), 0.05)",
                                    }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                          <span className="text-sm font-medium text-primary">
                                            {result.name
                                              .split(" ")
                                              .map((n) => n[0])
                                              .join("")}
                                          </span>
                                        </div>
                                        <div className="ml-4">
                                          <div className="text-sm font-medium text-primary-text">
                                            {result.name}
                                          </div>
                                          <div className="text-xs text-secondary-text">
                                            Similar match
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-primary-text">
                                        {result.company}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-secondary-text">
                                        {result.position}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-text">
                                      <div className="flex items-center space-x-2">
                                        <a
                                          href={result.profileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-primary hover:text-primary-hover"
                                        >
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-primary hover:text-primary-hover hover:bg-primary/10"
                                          >
                                            <ExternalLink className="h-4 w-4" />
                                          </Button>
                                        </a>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-primary hover:text-primary-hover hover:bg-primary/10"
                                          onClick={() =>
                                            handleCopyLink(
                                              result.profileUrl,
                                              index,
                                            )
                                          }
                                        >
                                          {copiedIndex === index ? (
                                            <Check className="h-4 w-4" />
                                          ) : (
                                            <Copy className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </div>
                                    </td>
                                  </motion.tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default LeadGenerator;
