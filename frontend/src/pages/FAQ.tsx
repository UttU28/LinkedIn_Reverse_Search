import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'wouter';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Search, HelpCircle, Mail, MessageSquare, FileText, ShieldCheck, CreditCard, Database, Users, Lock, Zap } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const { toast } = useToast();

  const showServiceInDevelopment = () => {
    toast({
      title: "Service in development",
      description: "This feature is currently being developed. Please check back later.",
      variant: "default",
    });
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

  const faqCategories = [
    { id: 'all', name: 'All Questions', icon: <HelpCircle className="h-4 w-4" /> },
    { id: 'general', name: 'General', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'account', name: 'Account', icon: <Users className="h-4 w-4" /> },
    { id: 'billing', name: 'Billing', icon: <CreditCard className="h-4 w-4" /> },
    { id: 'features', name: 'Features', icon: <Zap className="h-4 w-4" /> },
    { id: 'data', name: 'Data & Privacy', icon: <Lock className="h-4 w-4" /> },
    { id: 'technical', name: 'Technical', icon: <Database className="h-4 w-4" /> }
  ];

  const faqItems = [
    {
      id: 1,
      question: "What is Link It Up?",
      answer: "Link It Up is an AI-powered platform designed to help professionals discover public professional profiles based on name, company, and position information. Our advanced algorithms analyze multiple data points to match individuals with their public profiles, saving you hours of manual searching and research.",
      category: "general"
    },
    {
      id: 2,
      question: "How accurate is the profile matching?",
      answer: "Our system achieves an average accuracy rate of 85-95%, depending on the quality and completeness of your input data. We use multiple matching factors including name variations, company information, job titles, and professional history to ensure the highest possible accuracy. Each match is also given a confidence score to help you prioritize your outreach efforts.",
      category: "features"
    },
    {
      id: 3,
      question: "Can I upload my own contact lists?",
      answer: "Yes, you can upload contact lists in CSV or Excel format. Our system will automatically process the data and attempt to find the corresponding professional profiles from public sources. We support various column structures and our intelligent mapping system will organize your data during import for optimal results.",
      category: "features"
    },
    {
      id: 4,
      question: "How does the credit system work?",
      answer: "Each professional profile search consumes one credit from your account balance. Your available credits are displayed on your dashboard and can be purchased in packages. New accounts start with 50 free credits to help you experience the full value of our platform. Unlike subscription services, our credits never expire.",
      category: "billing"
    },
    {
      id: 5,
      question: "Do you offer a free trial?",
      answer: "Yes! We provide 50 free credits to all new users upon signup. This allows you to thoroughly test our platform's accuracy and features before purchasing additional credits. No credit card is required to claim your free credits.",
      category: "billing"
    },
    {
      id: 6,
      question: "How do I create an account?",
      answer: "Creating an account is simple. Click the 'Sign Up' button in the top right corner, enter your email address and create a password, or sign up with your Google account. Once registered, you'll have immediate access to your dashboard and 50 free credits to start searching.",
      category: "account"
    },
    {
      id: 7,
      question: "What is your pricing model?",
      answer: "We offer a pay-as-you-go credit system rather than recurring subscriptions. You purchase credit packages based on your needs, starting at $10 for 100 credits. Larger packages include bonus credits, offering better value. Your credits never expire, so you only pay for what you use.",
      category: "billing"
    },
    {
      id: 8,
      question: "Is my data secure?",
      answer: "Yes, we take data security very seriously. All data is encrypted both in transit and at rest using industry-standard encryption protocols. We never share your search history or uploaded data with third parties. For more details, please review our Privacy Policy.",
      category: "data"
    },
    {
      id: 9,
      question: "What data do you collect about me?",
      answer: "We collect information necessary to provide our service, including account information, search history, and usage metrics. This helps us improve the platform and provide better support. We never sell your personal data or search history to third parties. For complete information, please see our Privacy Policy.",
      category: "data"
    },
    {
      id: 10,
      question: "How does the Lead Generator feature work?",
      answer: "The Lead Generator allows you to search for professionals based on company and position criteria rather than specific names. Enter a target company and position category, and our AI-powered search will find matching professional profiles of individuals in those roles from publicly available sources. This is particularly useful for sales prospecting and recruitment.",
      category: "features"
    },
    {
      id: 11,
      question: "Can multiple team members use the same account?",
      answer: "Individual plans are designed for single users. For team collaboration, we offer Team and Business plans that include multi-user access, shared workspaces, and administrative controls. These plans allow team members to share credits and search results while providing usage analytics for administrators.",
      category: "account"
    },
    {
      id: 12,
      question: "What happens if the system can't find a profile?",
      answer: "If our system can't find a match with high confidence, we'll indicate this in the results. You won't be charged credits for searches that don't yield results. Our continuous improvement process means our match rates increase over time, and you can help by providing feedback on specific searches.",
      category: "technical"
    },
    {
      id: 14,
      question: "How do I export search results?",
      answer: "You can export your search results in multiple formats including CSV, Excel, and JSON. The export includes all found profiles with their URLs and confidence scores. This makes it easy to import the data into your CRM or other business tools for seamless workflow integration.",
      category: "features"
    },
    {
      id: 15,
      question: "What support options are available?",
      answer: "We offer multiple support channels depending on your needs. All users have access to our knowledge base and email support. Users with larger credit packages receive priority support with faster response times. Enterprise customers also receive dedicated account managers and personalized onboarding assistance.",
      category: "general"
    },
    {
      id: 16,
      question: "What is your refund policy?",
      answer: "We stand behind the quality of our service. If you're not satisfied with the results within 14 days of your first credit purchase, please contact our support team to discuss refund options. After this period, we generally don't provide refunds for credit purchases, but we're always happy to help resolve any issues you're experiencing.",
      category: "billing"
    },
    {
      id: 17,
      question: "How do you source the professional profiles?",
      answer: "Link It Up uses AI-powered search technology to identify publicly available professional information. Our system respects all platform terms of service and privacy regulations. We only access public information through ethical means, never employing scraping, crawling, or other automated data collection methods that would violate terms of service of any platform.",
      category: "data"
    },
    {
      id: 18,
      question: "What browsers and devices are supported?",
      answer: "Link It Up works on all modern browsers including Chrome, Firefox, Safari, and Edge. Our platform is fully responsive and works on desktop computers, laptops, tablets, and mobile devices. For the best experience, we recommend using the latest version of Chrome or Firefox on a desktop or laptop.",
      category: "technical"
    },
    {
      id: 19,
      question: "Is using Link It Up compliant with professional networking sites' terms?",
      answer: "Yes. Link It Up is designed to be fully compliant with terms of service of professional networking platforms. We use legitimate search techniques to discover publicly available information rather than unauthorized access methods. Users are still responsible for how they use the information and should always comply with all applicable terms of service and laws.",
      category: "legal"
    },
    {
      id: 20,
      question: "How is Link It Up different from manually searching for professionals?",
      answer: "Link It Up automates and enhances what would otherwise be a manual, time-consuming process. Our AI algorithms construct sophisticated search queries and validate results with higher accuracy than manual searching. What might take you hours of research can be accomplished in seconds, with better results and confidence scoring to guide your outreach priorities.",
      category: "general"
    }
  ];

  // Filter FAQ items based on search query and active category
  const filteredFaqs = faqItems.filter(item => {
    const matchesQuery = searchQuery === '' || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    
    return matchesQuery && matchesCategory;
  });

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
          className="max-w-7xl mx-auto text-center mb-16"
          variants={itemVariants}
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-primary-text mb-6 leading-tight">
            Frequently Asked <span className="text-primary">Questions</span>
          </h1>
          <p className="text-xl text-secondary-text max-w-3xl mx-auto mb-10">
            Find answers to common questions about Link It Up and how it can help you find the right professional profiles.
          </p>
          
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-text" />
            <Input 
              type="text"
              placeholder="Search for answers..."
              className="pl-10 py-6 bg-card border-border/50 rounded-xl focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.div>

        {/* FAQ Categories and Content */}
        <motion.div 
          className="max-w-6xl mx-auto mb-20"
          variants={itemVariants}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Categories Sidebar */}
            <div className="lg:col-span-3">
              <div className="bg-card border border-border/50 rounded-xl p-4 sticky top-24">
                <h3 className="text-lg font-heading font-medium text-primary-text mb-4">Categories</h3>
                <Tabs defaultValue="categories" className="w-full">
                  <TabsList className="hidden">
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                  </TabsList>
                  <TabsContent value="categories">
                    <nav className="space-y-1">
                      {faqCategories.map(category => (
                        <button
                          key={category.id}
                          className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                            activeCategory === category.id
                              ? 'bg-primary text-white font-medium'
                              : 'text-secondary-text hover:bg-background/80'
                          }`}
                          onClick={() => setActiveCategory(category.id)}
                        >
                          <span className="mr-2">{category.icon}</span>
                          {category.name}
                          {category.id === 'all' && (
                            <span className="ml-auto bg-background/20 text-white text-xs rounded-full px-2 py-0.5">
                              {faqItems.length}
                            </span>
                          )}
                          {category.id !== 'all' && (
                            <span className="ml-auto bg-background/20 text-white text-xs rounded-full px-2 py-0.5">
                              {faqItems.filter(item => item.category === category.id).length}
                            </span>
                          )}
                        </button>
                      ))}
                    </nav>
                  </TabsContent>
                </Tabs>
                
                <div className="mt-8 pt-6 border-t border-border/50">
                  <h3 className="text-lg font-heading font-medium text-primary-text mb-4">Need More Help?</h3>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left"
                      onClick={showServiceInDevelopment}
                    >
                      <Mail className="mr-2 h-4 w-4" /> Contact Support
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* FAQ Content */}
            <div className="lg:col-span-9">
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-12 bg-card/50 rounded-xl border border-border/50">
                  <HelpCircle className="h-12 w-12 text-secondary-text mx-auto mb-4" />
                  <h3 className="text-xl font-heading font-medium text-primary-text mb-2">
                    No results found
                  </h3>
                  <p className="text-secondary-text max-w-md mx-auto">
                    We couldn't find any questions matching "{searchQuery}". Try a different search term or browse all categories.
                  </p>
                  <Button
                    className="mt-6"
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('all');
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-heading font-semibold text-primary-text">
                      {activeCategory === 'all' ? 'All Questions' : faqCategories.find(c => c.id === activeCategory)?.name}
                    </h2>
                    <span className="text-sm text-secondary-text">
                      Showing {filteredFaqs.length} of {faqItems.length} questions
                    </span>
                  </div>
                  
                  {/* Legal Disclaimer */}
                  <div className="bg-card/50 border border-border/50 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <ShieldCheck className="h-5 w-5 text-primary mt-0.5 mr-3" />
                      <p className="text-sm text-secondary-text">
                        This tool identifies publicly accessible professional profiles based on user-provided inputs. Users are responsible for complying with all applicable laws and third-party platform terms.
                      </p>
                    </div>
                  </div>

                  <Accordion type="single" collapsible className="w-full space-y-4">
                    {filteredFaqs.map((item) => (
                      <AccordionItem 
                        key={item.id} 
                        value={`item-${item.id}`} 
                        className="border border-border/50 rounded-lg bg-card/50 overflow-hidden transition-all duration-200 hover:shadow-sm"
                      >
                        <AccordionTrigger className="px-6 py-4 hover:bg-background/30 hover:no-underline">
                          <div className="flex items-center text-left">
                            <HelpCircle className="h-5 w-5 text-primary mr-3 shrink-0" />
                            <span className="text-primary-text font-medium">{item.question}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-4 text-secondary-text">
                          <div className="pl-8 space-y-3">
                            <p>{item.answer}</p>
                            <div className="text-xs inline-flex items-center text-primary-text/60 pt-2">
                              <span className="capitalize">Category: {item.category}</span>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}
              
              {/* Quick Links */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card/70 border border-border/50 rounded-xl p-6 flex items-start">
                  <div className="bg-primary/10 p-2 rounded-lg mr-4">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading font-medium text-primary-text mb-1">
                      Privacy & Security
                    </h3>
                    <p className="text-sm text-secondary-text mb-3">
                      Learn about how we secure your data and respect your privacy.
                    </p>
                    <Link href="/privacy">
                      <Button variant="link" className="p-0 h-auto text-primary">
                        Read Privacy Policy
                      </Button>
                    </Link>
                  </div>
                </div>
                
                <div className="bg-card/70 border border-border/50 rounded-xl p-6 flex items-start">
                  <div className="bg-primary/10 p-2 rounded-lg mr-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading font-medium text-primary-text mb-1">
                      Terms of Service
                    </h3>
                    <p className="text-sm text-secondary-text mb-3">
                      Review our terms of service and user agreement.
                    </p>
                    <Link href="/terms">
                      <Button variant="link" className="p-0 h-auto text-primary">
                        Read Terms
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.section 
          className="max-w-5xl mx-auto text-center bg-card/70 rounded-3xl p-10 border border-border/50"
          variants={itemVariants}
        >
          <h2 className="text-2xl md:text-3xl font-heading font-semibold text-primary-text mb-4">
            Still have questions?
          </h2>
          <p className="text-lg text-secondary-text mb-8 max-w-2xl mx-auto">
            Our support team is ready to help you with any questions or issues you might have. Get in touch and we'll respond as soon as possible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-primary hover:bg-accent-hover"
              onClick={showServiceInDevelopment}
            >
              <Mail className="mr-2 h-4 w-4" /> Contact Support
            </Button>
            <Button 
              variant="outline" 
              className="border-primary/30 hover:bg-primary/10 text-primary"
              onClick={showServiceInDevelopment}
            >
              <MessageSquare className="mr-2 h-4 w-4" /> Start Live Chat
            </Button>
          </div>
        </motion.section>
      </motion.main>
      
      <Footer />
    </div>
  );
};

export default FAQ;