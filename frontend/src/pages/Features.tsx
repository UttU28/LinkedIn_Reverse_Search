import { motion } from 'framer-motion';
import { Link } from 'wouter';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Search, Database, LineChart, CloudLightning, Target, Filter, Upload, Gauge, Workflow, Users, Shield, BookOpen, Layers, Boxes } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useModalStore } from '../store/modalStore';
import { useToast } from '@/hooks/use-toast';

const Features = () => {
  const { isAuthenticated } = useAuth();
  const { openModal } = useModalStore();
  const { toast } = useToast();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      // Show toast for already signed up users
      toast({
        title: "Already signed up",
        description: "You greedy person, you already signed up!",
        variant: "default",
      });
    } else {
      // Open auth modal for new users
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

  const features = [
    {
      title: "Advanced AI Search Algorithm",
      description: "Our sophisticated algorithms construct precise search queries using multiple data points to find the right professional profiles with high accuracy.",
      icon: <Search className="h-6 w-6 text-primary" />
    },
    {
      title: "Batch Processing",
      description: "Upload CSV files containing hundreds of contacts to process in bulk, saving hours of manual searching.",
      icon: <Database className="h-6 w-6 text-primary" />
    },
    {
      title: "High-Performance Analytics",
      description: "Track your success rate and optimize your outreach strategies with detailed performance metrics.",
      icon: <LineChart className="h-6 w-6 text-primary" />
    },
    {
      title: "Real-Time Results",
      description: "Get professional profile links in seconds, not hours, significantly accelerating your workflow.",
      icon: <CloudLightning className="h-6 w-6 text-primary" />
    },
    {
      title: "Smart Lead Generation",
      description: "Target professionals based on company and position criteria for precise prospecting.",
      icon: <Target className="h-6 w-6 text-primary" />
    },
    {
      title: "Advanced Filtering",
      description: "Filter results by relevance, company, position, and match confidence for better targeting.",
      icon: <Filter className="h-6 w-6 text-primary" />
    }
  ];

  const advancedFeatures = [
    {
      title: "Intelligent CSV/Excel Processing",
      description: "Our system intelligently maps your CSV columns and validates the data structure before processing.",
      icon: <Upload className="h-6 w-6 text-primary" />
    },
    {
      title: "Confidence Scoring",
      description: "Each match is given a confidence score based on multiple factors to help prioritize your outreach.",
      icon: <Gauge className="h-6 w-6 text-primary" />
    },
    {
      title: "Automated Workflows",
      description: "Set up recurring searches and automations to keep your database up-to-date without manual effort.",
      icon: <Workflow className="h-6 w-6 text-primary" />
    },
    {
      title: "Team Collaboration",
      description: "Share search results and collaborate with team members for more efficient prospecting (coming soon).",
      icon: <Users className="h-6 w-6 text-primary" />
    },
    {
      title: "Enterprise-Grade Security",
      description: "Your data is secured with industry-standard encryption and security protocols.",
      icon: <Shield className="h-6 w-6 text-primary" />
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
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-primary-text mb-6 leading-tight">
            Powerful Features for <span className="text-primary">Professional Networking</span>
          </h1>
          <p className="text-xl text-secondary-text max-w-3xl mx-auto mb-8">
            Link It Up offers a comprehensive suite of tools to find, connect with, and engage the right professionals for your business needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-primary hover:bg-accent-hover text-lg px-8 py-6" 
              size="lg"
              onClick={handleGetStarted}
            >
              Get 50 Free Credits
            </Button>
            <Button variant="outline" className="border-primary/30 hover:bg-primary/10 text-primary text-lg px-8 py-6" size="lg">
              View Demo
            </Button>
          </div>
        </motion.div>

        {/* Core Features Section */}
        <motion.section 
          className="max-w-7xl mx-auto mb-20"
          variants={itemVariants}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold text-primary-text mb-4">
              Core Features
            </h2>
            <p className="text-secondary-text max-w-2xl mx-auto">
              Our platform is designed to make professional profile discovery effortless and efficient, helping you find the right professionals quickly.
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

        {/* How It Works Section */}
        <motion.section 
          className="max-w-7xl mx-auto mb-20 py-16 px-4 sm:px-6 lg:px-10 bg-card/30 rounded-3xl border border-border/30"
          variants={itemVariants}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold text-primary-text mb-4">
              How It Works
            </h2>
            <p className="text-secondary-text max-w-2xl mx-auto">
              A simple three-step process to find the professional profiles you need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
            <motion.div
              variants={itemVariants}
              className="text-center relative"
            >
              <div className="relative mb-10">
                <div className="bg-primary/10 h-24 w-24 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-white text-lg font-bold h-9 w-9 rounded-full flex items-center justify-center">
                  1
                </div>
              </div>
              <h3 className="text-xl font-heading font-medium text-primary-text mb-3">
                Input Your Data
              </h3>
              <p className="text-secondary-text">
                Enter individual details or upload a CSV/Excel file with names, companies, and positions.
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="text-center relative"
            >
              <div className="relative mb-10">
                <div className="bg-primary/10 h-24 w-24 rounded-full flex items-center justify-center mx-auto">
                  <Layers className="h-8 w-8 text-primary" />
                </div>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-white text-lg font-bold h-9 w-9 rounded-full flex items-center justify-center">
                  2
                </div>
              </div>
              <h3 className="text-xl font-heading font-medium text-primary-text mb-3">
                AI Processing
              </h3>
              <p className="text-secondary-text">
                Our AI algorithms search and match profiles using multiple data points for accuracy.
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="text-center relative"
            >
              <div className="relative mb-10">
                <div className="bg-primary/10 h-24 w-24 rounded-full flex items-center justify-center mx-auto">
                  <Boxes className="h-8 w-8 text-primary" />
                </div>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-white text-lg font-bold h-9 w-9 rounded-full flex items-center justify-center">
                  3
                </div>
              </div>
              <h3 className="text-xl font-heading font-medium text-primary-text mb-3">
                Get Results
              </h3>
              <p className="text-secondary-text">
                Review and export accurate professional profile links with confidence ratings.
              </p>
            </motion.div>
          </div>

          {/* Legal Disclaimer */}
          <div className="max-w-3xl mx-auto mt-12 bg-card/50 rounded-lg p-4 border border-border/50">
            <p className="text-sm text-secondary-text text-center">
              This tool identifies publicly accessible professional profiles based on user-provided inputs. Users are responsible for complying with all applicable laws and third-party platform terms.
            </p>
          </div>
        </motion.section>

        {/* Advanced Features Section */}
        <motion.section 
          className="max-w-7xl mx-auto mb-20"
          variants={itemVariants}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold text-primary-text mb-4">
              Advanced Capabilities
            </h2>
            <p className="text-secondary-text max-w-2xl mx-auto">
              Harness powerful enterprise-grade features to supercharge your prospecting efforts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advancedFeatures.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-card border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="bg-accent/10 p-3 rounded-lg w-fit mb-4">
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

        {/* Testimonial/CTA Section */}
        <motion.section 
          className="max-w-6xl mx-auto text-center bg-card/70 rounded-3xl p-10 border border-border/50 mb-20"
          variants={itemVariants}
        >
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <div className="flex justify-center space-x-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <CheckCircle2 key={i} className="h-6 w-6 text-primary" />
                ))}
              </div>
              <p className="text-xl italic text-primary-text mb-6">
                "Link It Up has completely transformed our sales prospecting process. We're connecting with the right decision-makers in half the time it used to take us. The AI accuracy is impressive!"
              </p>
              <div>
                <p className="font-heading font-medium text-primary-text">
                  Sarah Johnson
                </p>
                <p className="text-sm text-secondary-text">
                  VP of Sales, TechCorp
                </p>
              </div>
            </div>
            <Button 
              className="bg-primary hover:bg-accent-hover text-lg px-6 py-3 mt-4"
              onClick={handleGetStarted}
            >
              Get 50 Free Credits
            </Button>
          </div>
        </motion.section>

        {/* FAQ Teaser */}
        <motion.section 
          className="max-w-4xl mx-auto text-center"
          variants={itemVariants}
        >
          <h2 className="text-2xl md:text-3xl font-heading font-semibold text-primary-text mb-4">
            Have Questions?
          </h2>
          <p className="text-secondary-text mb-6">
            Check out our comprehensive FAQ section for answers to commonly asked questions.
          </p>
          <Link href="/faq">
            <Button variant="outline" className="border-primary/30 hover:bg-primary/10 text-primary">
              <BookOpen className="mr-2 h-4 w-4" /> Visit FAQ
            </Button>
          </Link>
        </motion.section>
      </motion.main>
      
      <Footer />
    </div>
  );
};

export default Features;