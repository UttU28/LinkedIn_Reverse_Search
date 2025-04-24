import { motion } from 'framer-motion';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, HelpCircle, Zap, Gift, CreditCard, Star, ChevronRight } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { useModalStore } from '../store/modalStore';
import { useAuth } from '../hooks/useAuth';
import { useLocation, Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import PricingCard from '@/components/PricingCard';

const Pricing = () => {
  const { isAuthenticated } = useAuth();
  const { openModal } = useModalStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleGetStarted = (plan: string) => {
    if (isAuthenticated) {
      setLocation('/dashboard');
    } else {
      toast({
        title: "Authentication Required",
        description: "Hold up! Unlock your professional networking powers by logging in first. Your credits are waiting!",
        variant: "default",
      });
      setLocation('/');
    }
  };

  const handleGetFreeCredits = () => {
    if (isAuthenticated) {
      toast({
        title: "Already signed up",
        description: "You're already signed up and enjoying your credits!",
        variant: "default",
      });
    } else {
      setLocation('/');
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

  const creditPackages = [
    {
      name: "Starter",
      description: "Perfect for testing the waters",
      price: 10,
      credits: 100,
      popular: false,
      buttonText: "Buy 100 credit for $10",
      color: "from-purple-500/20 to-indigo-500/20",
      accent: "bg-indigo-500",
      cardChip: "#7c3aed"
    },
    {
      name: "Professional",
      description: "Best value for active users",
      price: 25,
      credits: 250,
      bonusCredits: 50,
      popular: true,
      buttonText: "Buy 300 credit for $25",
      color: "from-primary/20 to-accent/20",
      accent: "bg-primary",
      cardChip: "#3b82f6"
    },
    {
      name: "Premium",
      description: "For power users with high volume needs",
      price: 50,
      credits: 500,
      bonusCredits: 150,
      popular: false,
      buttonText: "Buy 650 credit for $50",
      color: "from-amber-500/20 to-rose-500/20",
      accent: "bg-amber-500",
      cardChip: "#f59e0b"
    }
  ];

  const faqItems = [
    {
      question: "How accurate is Link It Up in finding professional profiles?",
      answer: "Link It Up uses advanced AI algorithms to achieve an average accuracy rate of 85-95% for profile matching, depending on the quality and completeness of your input data. Our system uses multiple matching factors including name, company, position, and other professional data points to ensure the highest possible accuracy."
    },
    {
      question: "How do credits work?",
      answer: "Each professional profile search consumes one credit. New users receive 50 credits as a signup bonus. You can purchase additional credits at a rate of 10 credits per dollar, with bonus credits on larger packages offering better value."
    },
    {
      question: "Can I upload my own contact lists?",
      answer: "Yes, you can upload contact lists in CSV or Excel format. Our system will automatically process and validate the data, then attempt to find the corresponding professional profiles from public sources. The system supports various column formats and will intelligently map them during import."
    },
    {
      question: "What happens if I run out of credits?",
      answer: "When you exhaust your credits, you'll need to purchase more to continue searching. We offer various credit packages with different bonus rates to suit your needs."
    },
    {
      question: "Do credits expire?",
      answer: "No, your purchased credits don't expire. They remain in your account until you use them."
    },
    {
      question: "How does team collaboration work?",
      answer: "Our Team and Business packages offer collaborative features including shared workspaces, search history, and results. Team members can access a central dashboard, and administrators can manage permissions, view team analytics, and control resource allocation."
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
        <motion.div 
          className="max-w-7xl mx-auto text-center mb-16"
          variants={itemVariants}
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-primary-text mb-6 leading-tight">
            Simple, Transparent <span className="text-primary">Pricing</span>
          </h1>
          <p className="text-xl text-secondary-text max-w-3xl mx-auto mb-4">
            Choose the credit package that fits your needs. No hidden fees, no subscriptions.
          </p>
          <div className="flex items-center justify-center mb-3">
            <Gift className="h-5 w-5 text-primary mr-2" />
            <p className="text-lg font-semibold text-primary">50 free credits with every new account!</p>
          </div>
          <p className="text-secondary-text max-w-2xl mx-auto mb-8">
            Get 10 credits for every dollar spent, plus bonus credits on larger packages.
          </p>
        </motion.div>

        <motion.div 
          className="max-w-7xl mx-auto mb-20"
          variants={itemVariants}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
            {creditPackages.map((plan, index) => (
                <div 
                  key={index}
                className={`w-full max-w-[420px] ${index === 2 ? 'sm:col-span-2 lg:col-span-1 sm:mx-auto' : ''}`} 
                >
                  <PricingCard 
                    plan={plan}
                    index={index}
                    onButtonClick={handleGetStarted}
                    isAuthenticated={isAuthenticated}
                  />
                </div>
              ))}
          </div>
        </motion.div>

        <motion.div 
          className="max-w-4xl mx-auto mb-10 bg-card/50 border border-border/50 rounded-lg p-4" 
          variants={itemVariants}
        >
          <p className="text-sm text-secondary-text text-center">
            This tool identifies publicly accessible professional profiles based on user-provided inputs. Users are responsible for complying with all applicable laws and third-party platform terms.
          </p>
        </motion.div>

        <motion.section 
          className="max-w-4xl mx-auto mb-20"
          variants={itemVariants}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-heading font-semibold text-primary-text mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-secondary-text">
              Everything you need to know about our pricing and credits
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border border-border/50 rounded-lg bg-card/50 overflow-hidden">
                <AccordionTrigger className="px-6 py-4 hover:bg-background/30 hover:no-underline">
                  <div className="flex items-center text-left">
                    <HelpCircle className="h-5 w-5 text-primary mr-3 shrink-0" />
                    <span className="text-primary-text font-medium">{item.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-secondary-text">
                  <div className="pl-8">{item.answer}</div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.section>

        <motion.section 
          className="max-w-6xl mx-auto text-center bg-primary/10 rounded-3xl p-10 border border-primary/20"
          variants={itemVariants}
        >
          <div className="max-w-3xl mx-auto">
            <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-primary-text mb-4">
              Ready to supercharge your professional prospecting?
            </h2>
            <p className="text-lg text-secondary-text mb-8">
              Sign up today and get 50 free credits to start finding the right professional connections.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                className="bg-primary hover:bg-accent-hover text-lg px-8 py-6" 
                size="lg"
                onClick={handleGetFreeCredits}
              >
                Get 50 Free Credits
              </Button>
              <Link href="/demo">
                <Button variant="outline" className="border-primary/30 hover:bg-primary/10 text-primary text-lg px-8 py-6" size="lg">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </motion.section>
      </motion.main>

      <Footer />
    </div>
  );
};

export default Pricing;
