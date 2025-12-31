import { motion } from 'framer-motion';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link } from "wouter";
import { useModalStore } from '../store/modalStore';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  UserCheck, 
  FileUp, 
  Zap, 
  Clock, 
  Target, 
  Database, 
  BarChart4, 
  Globe, 
  LineChart, 
  Link as LinkIcon, 
  Users, 
  ArrowRight, 
  CheckCircle, 
  CreditCard,
  Rocket,
  ChevronsUp,
  DollarSign,
  Timer 
} from 'lucide-react';

const Marketing = () => {
  const { isAuthenticated } = useAuth();
  const { openModal } = useModalStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('ceos');

  const handleGetStarted = () => {
    if (isAuthenticated) {
      toast({
        title: "Already signed up",
        description: "You're already enjoying our platform. Head to your dashboard to continue.",
        variant: "default",
      });
    } else {
      openModal('auth');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
        duration: 0.3,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  // Target audiences with their specific benefits
  const targetAudiences = [
    {
      id: 'ceos',
      title: 'CEOs & Founders',
      icon: <ChevronsUp />,
      benefits: [
        "Build relationships with key industry players",
        "Identify strategic hires with specific expertise",
        "Discover new business opportunities quickly",
        "Connect with potential partners and investors",
        "Stay ahead of industry trends with real-time data"
      ]
    },
    {
      id: 'vcs',
      title: 'VCs & Investors',
      icon: <DollarSign />,
      benefits: [
        "Find high-potential startups in your investment niche",
        "Connect with promising entrepreneurs before competitors",
        "Efficiently analyze team structures of potential investments",
        "Build stronger networks in specific industries",
        "Validate founding team credentials instantly"
      ]
    },
    {
      id: 'sales',
      title: 'Sales Teams',
      icon: <BarChart4 />,
      benefits: [
        "Accelerate lead generation with verified contacts",
        "Quickly identify decision-makers at target companies",
        "Upload prospect lists and get LinkedIn profiles in bulk",
        "Enhance your CRM data with accurate LinkedIn information",
        "Improve connection request acceptance rates"
      ]
    },
    {
      id: 'recruiters',
      title: 'Recruiters & HR',
      icon: <UserCheck />,
      benefits: [
        "Discover top talent faster with precision targeting",
        "Reduce manual searching time by up to 80%",
        "Generate team composition insights for competitive analysis",
        "Validate candidate information across platforms",
        "Build talent pools with accurate professional profiles"
      ]
    }
  ];

  // Feature cards for the platform
  const features = [
    {
      title: "Instant Profile Search",
      description: "Find professional profiles with just a name, position, or company in seconds using our AI-powered search technology.",
      icon: <Search className="h-8 w-8 text-primary" />
    },
    {
      title: "Bulk CSV Upload",
      description: "Upload CSV files with hundreds of contacts and let our system process them all at once, saving hours of manual searching.",
      icon: <FileUp className="h-8 w-8 text-primary" />
    },
    {
      title: "AI Verification",
      description: "Our advanced algorithms ensure you get accurate and relevant results by verifying each profile match with high confidence.",
      icon: <CheckCircle className="h-8 w-8 text-primary" />
    },
    {
      title: "Targeted Lead Generation",
      description: "Generate lists of targeted professionals based on company, position, and industry criteria for precise prospecting.",
      icon: <Target className="h-8 w-8 text-primary" />
    },
    {
      title: "Team Discovery",
      description: "Identify entire teams at companies of interest, perfect for competitive analysis or recruitment initiatives.",
      icon: <Users className="h-8 w-8 text-primary" />
    },
    {
      title: "Export Capabilities",
      description: "Download your search results in CSV/Excel format for easy integration with your CRM or outreach tools.",
      icon: <Database className="h-8 w-8 text-primary" />
    }
  ];

  // How it works steps
  const howItWorksSteps = [
    {
      number: "01",
      title: "Sign Up & Get Credits",
      description: "Create an account and receive 50 free credits instantly. No credit card required to start searching.",
      icon: <CreditCard className="h-8 w-8 text-primary" />
    },
    {
      number: "02",
      title: "Search for Profiles",
      description: "Use our intuitive dashboard to search by name, company, position, or upload CSV files for bulk processing.",
      icon: <Search className="h-8 w-8 text-primary" />
    },
    {
      number: "03",
      title: "Get Verified Results",
      description: "Receive accurate professional profile links with confidence scores to help prioritize your outreach.",
      icon: <LinkIcon className="h-8 w-8 text-primary" />
    },
    {
      number: "04",
      title: "Export & Analyze",
      description: "Download your results for easy integration with your existing workflow and tools.",
      icon: <LineChart className="h-8 w-8 text-primary" />
    }
  ];

  return (
    <div className="min-h-screen flex flex-col grainy-bg">
      <Navbar />
      
      <motion.main 
        className="flex-grow z-10 relative pt-16 pb-20 px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.div 
          className="max-w-7xl mx-auto text-center mb-16 md:mb-24"
          variants={itemVariants}
        >
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-4 py-1 mb-4 text-sm">
            Revolutionize Your Lead Generation
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-primary-text mb-6 leading-tight">
            Unlock Smarter <span className="text-primary">Professional Networking</span>
          </h1>
          <p className="text-xl text-secondary-text max-w-3xl mx-auto mb-8">
            Your all-in-one solution for lead generation and talent discovery. Find the right professionals, 
            leads, and team members without the manual searching.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-primary hover:bg-accent-hover text-lg px-8 py-6" 
              size="lg"
              onClick={handleGetStarted}
            >
              Get 50 Free Credits
            </Button>
            <Link href="/">
              <Button variant="outline" className="border-primary/30 hover:bg-primary/10 text-primary text-lg px-8 py-6" size="lg">
                See How It Works
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* What We Provide Section */}
        <motion.section 
          className="max-w-7xl mx-auto mb-20"
          variants={itemVariants}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold text-primary-text mb-4">
              What We Provide
            </h2>
            <p className="text-secondary-text max-w-2xl mx-auto">
              Our platform simplifies finding professional profiles using AI and automated search technology, 
              saving you time and effort.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-card border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-heading font-medium text-primary-text mb-3">
                  {feature.title}
                </h3>
                <p className="text-secondary-text">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Perfect For Section with Tabs */}
        <motion.section 
          className="max-w-7xl mx-auto mb-20 bg-card/20 rounded-3xl p-8 border border-border/30"
          variants={itemVariants}
        >
          <div className="text-center mb-12">
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 px-4 py-1 mb-4 text-sm">
              Target Audiences
            </Badge>
            <h2 className="text-3xl md:text-4xl font-heading font-semibold text-primary-text mb-4">
              Perfect For Your Industry
            </h2>
            <p className="text-secondary-text max-w-2xl mx-auto">
              See how our platform delivers specific benefits for professionals in your role.
            </p>
          </div>

          <Tabs defaultValue="ceos" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-8 bg-card/50 p-1">
              {targetAudiences.map((audience) => (
                <TabsTrigger 
                  key={audience.id} 
                  value={audience.id}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 py-3"
                >
                  <div className="flex items-center justify-center">
                    <span className="mr-2">{audience.icon}</span>
                    <span>{audience.title}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {targetAudiences.map((audience) => (
              <TabsContent key={audience.id} value={audience.id}>
                <div className="bg-card border border-border/50 rounded-xl p-6">
                  <h3 className="text-2xl font-heading font-medium text-primary-text mb-6 flex items-center">
                    <div className="bg-primary/10 p-2 rounded-full mr-3">
                      {audience.icon}
                    </div>
                    Benefits for {audience.title}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {audience.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start">
                        <div className="mt-1 mr-3 text-primary">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                        <p className="text-secondary-text">{benefit}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 flex justify-center">
                    <Button onClick={handleGetStarted}>
                      Start Your Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </motion.section>

        {/* How It Works Section */}
        <motion.section 
          className="max-w-7xl mx-auto mb-20"
          variants={itemVariants}
        >
          <div className="text-center mb-12">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-4 py-1 mb-4 text-sm">
              Simple Process
            </Badge>
            <h2 className="text-3xl md:text-4xl font-heading font-semibold text-primary-text mb-4">
              How It Works
            </h2>
            <p className="text-secondary-text max-w-2xl mx-auto">
              Get started in minutes with our easy-to-use platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorksSteps.map((step, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-card border border-border/50 rounded-xl p-6 relative"
              >
                <div className="absolute -top-3 -left-3 bg-primary text-white text-lg font-bold w-10 h-10 rounded-full flex items-center justify-center">
                  {step.number}
                </div>
                <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4 mt-4">
                  {step.icon}
                </div>
                <h3 className="text-xl font-heading font-medium text-primary-text mb-3">
                  {step.title}
                </h3>
                <p className="text-secondary-text">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Benefits Section */}
        <motion.section 
          className="max-w-7xl mx-auto mb-20"
          variants={itemVariants}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 px-4 py-1 mb-4 text-sm">
                Competitive Edge
              </Badge>
              <h2 className="text-3xl md:text-4xl font-heading font-semibold text-primary-text mb-6">
                Why Choose Our Platform?
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-success/20 p-2 rounded-full mr-4 mt-1">
                    <Timer className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-medium text-primary-text mb-2">Save Time</h3>
                    <p className="text-secondary-text">
                      Automate the tedious process of searching for professionals manually. 
                      What takes hours can now be done in seconds.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-primary/20 p-2 rounded-full mr-4 mt-1">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-medium text-primary-text mb-2">Increase Efficiency</h3>
                    <p className="text-secondary-text">
                      Let AI handle profile validation so you can focus on what matters – building relationships 
                      and closing deals.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-accent/20 p-2 rounded-full mr-4 mt-1">
                    <Globe className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-medium text-primary-text mb-2">Unlock Insights</h3>
                    <p className="text-secondary-text">
                      Whether you're recruiting, prospecting, or networking, our tool gives you the insights 
                      you need to succeed.
                    </p>
                  </div>
                </div>
              </div>
              
              <Button 
                className="mt-8 bg-primary hover:bg-accent-hover"
                onClick={handleGetStarted}
              >
                Start with 50 Free Credits
              </Button>
            </div>
            
            <div className="bg-card/30 rounded-xl p-8 border border-border/50">
              <div className="flex items-center mb-6">
                <Rocket className="h-8 w-8 text-primary mr-3" />
                <h3 className="text-2xl font-heading font-semibold text-primary-text">Key Metrics</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-secondary-text">Time Saved on Manual Searches</span>
                    <span className="text-primary font-bold">85%</span>
                  </div>
                  <div className="w-full bg-background/50 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-secondary-text">Profile Match Accuracy</span>
                    <span className="text-primary font-bold">92%</span>
                  </div>
                  <div className="w-full bg-background/50 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-secondary-text">Bulk Processing Speed</span>
                    <span className="text-primary font-bold">78%</span>
                  </div>
                  <div className="w-full bg-background/50 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="text-center">
                <p className="text-xl font-medium text-primary-text mb-4">
                  "This tool has completely transformed our sales prospecting process!"
                </p>
                <p className="text-secondary-text italic">
                  Sarah Johnson, VP of Sales at TechCorp
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Call to Action */}
        <motion.section 
          className="max-w-6xl mx-auto text-center bg-primary/10 rounded-3xl p-10 border border-primary/20 mb-10"
          variants={itemVariants}
        >
          <Rocket className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-primary-text mb-4">
            Ready to Transform Your Professional Networking?
          </h2>
          <p className="text-lg text-secondary-text mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who are saving time and making better connections with our platform.
            Start with 50 free credits today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-primary hover:bg-accent-hover text-lg px-8 py-6" 
              size="lg"
              onClick={handleGetStarted}
            >
              Get Started for Free
            </Button>
            <Link href="/contact">
              <Button variant="outline" className="border-primary/30 hover:bg-primary/10 text-primary text-lg px-8 py-6" size="lg">
                Contact Sales for Enterprise
              </Button>
            </Link>
          </div>
        </motion.section>
      </motion.main>
      
      <Footer />
    </div>
  );
};

export default Marketing; 