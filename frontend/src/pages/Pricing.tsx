import { motion } from 'framer-motion';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, HelpCircle, Zap, Gift } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { useModalStore } from '../store/modalStore';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

const Pricing = () => {
  const { isAuthenticated } = useAuth();
  const { openModal } = useModalStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleGetStarted = (plan: string) => {
    if (isAuthenticated) {
      // In a real app, this would navigate to checkout or upgrade flow
      setLocation('/dashboard');
    } else {
      openModal('auth');
    }
  };

  const handleGetFreeCredits = () => {
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

  // Define credit packages
  const creditPackages = [
    {
      name: "Starter",
      description: "Perfect for testing the waters",
      price: 10,
      credits: 100, // 10 credits per dollar
      features: [
        "100 search credits",
        "CSV upload (limited)",
        "Standard accuracy",
        "Email support",
        "50 bonus credits on signup"
      ],
      popular: false,
      buttonText: "Buy Credits"
    },
    {
      name: "Professional",
      description: "Best value for active users",
      price: 25,
      credits: 250, // 10 credits per dollar
      bonusCredits: 50, // Bonus credits (20% extra)
      features: [
        "250 search credits",
        "50 bonus credits (20% extra)",
        "CSV upload (up to 100 contacts)",
        "High accuracy matching",
        "Priority email support",
        "Basic analytics dashboard"
      ],
      popular: true,
      buttonText: "Buy Credits"
    },
    {
      name: "Premium",
      description: "For power users with high volume needs",
      price: 50,
      credits: 500, // 10 credits per dollar
      bonusCredits: 150, // Bonus credits (30% extra)
      features: [
        "500 search credits",
        "150 bonus credits (30% extra)",
        "Unlimited CSV uploads",
        "Highest accuracy matching",
        "Priority support",
        "Advanced analytics dashboard"
      ],
      popular: false,
      buttonText: "Buy Credits"
    }
  ];

  // FAQ items
  const faqItems = [
    {
      question: "How accurate is Link It Up in finding LinkedIn profiles?",
      answer: "Link It Up uses advanced AI algorithms to achieve an average accuracy rate of 85-95% for profile matching, depending on the quality and completeness of your input data. Our system uses multiple matching factors including name, company, position, and other professional data points to ensure the highest possible accuracy."
    },
    {
      question: "How do credits work?",
      answer: "Each LinkedIn profile search consumes one credit. New users receive 50 credits as a signup bonus. You can purchase additional credits at a rate of 10 credits per dollar, with bonus credits on larger packages offering better value."
    },
    {
      question: "Can I upload my own contact lists?",
      answer: "Yes, you can upload contact lists in CSV or Excel format. Our system will automatically process and validate the data, then attempt to find the corresponding LinkedIn profiles. The system supports various column formats and will intelligently map them during import."
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
        {/* Hero Section */}
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

        {/* Pricing Cards */}
        <motion.div 
          className="max-w-7xl mx-auto mb-20"
          variants={itemVariants}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {creditPackages.map((plan, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                className={`relative ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-5 inset-x-0 flex justify-center">
                    <Badge className="bg-primary text-white">Best Value</Badge>
                  </div>
                )}
                
                <Card className={`h-full border ${plan.popular ? 'border-primary shadow-lg' : 'border-border/50 shadow-sm'}`}>
                  <CardHeader className={`pb-8 ${plan.popular ? 'bg-primary/5' : ''}`}>
                    <CardTitle className="text-2xl font-heading">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-primary-text">
                        ${plan.price}
                      </span>
                    </div>
                    <div className="mt-2 text-lg font-medium text-primary">
                      {plan.credits} credits
                      {plan.bonusCredits && (
                        <span className="text-accent ml-1">+ {plan.bonusCredits} bonus</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-primary-text mb-3">What's included:</h4>
                      <ul className="space-y-3">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start">
                            <Check className="h-5 w-5 text-primary shrink-0 mr-2" />
                            <span className="text-secondary-text text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : 'bg-card hover:bg-background border border-border'}`}
                      onClick={() => handleGetStarted(plan.name)}
                    >
                      {plan.buttonText}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Credit Calculation Table */}
        <motion.section 
          className="max-w-6xl mx-auto mb-20 bg-card/70 rounded-3xl p-8 border border-border/50"
          variants={itemVariants}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-heading font-semibold text-primary-text mb-2">
              Credit System
            </h2>
            <p className="text-secondary-text">
              Our simple credit-based system gives you full control
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-secondary-text uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-secondary-text uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-secondary-text uppercase tracking-wider">
                    Base Credits
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-secondary-text uppercase tracking-wider">
                    Bonus Credits
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-secondary-text uppercase tracking-wider">
                    Total Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background/40 divide-y divide-border">
                <tr>
                  <td className="px-6 py-4 text-sm text-primary-text">
                    New User Bonus
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-secondary-text">
                    Free
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-secondary-text">
                    0
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-accent">
                    50
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-secondary-text">
                    $5
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-primary-text">
                    Starter Pack
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-secondary-text">
                    $10
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-secondary-text">
                    100
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-accent">
                    0
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-secondary-text">
                    $10
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-primary-text">
                    Professional Pack
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-secondary-text">
                    $25
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-secondary-text">
                    250
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-accent">
                    50
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-secondary-text">
                    $30
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-primary-text">
                    Premium Pack
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-secondary-text">
                    $50
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-secondary-text">
                    500
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-accent">
                    150
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-secondary-text">
                    $65
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* FAQ Section */}
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

        {/* CTA Section */}
        <motion.section 
          className="max-w-6xl mx-auto text-center bg-primary/10 rounded-3xl p-10 border border-primary/20"
          variants={itemVariants}
        >
          <div className="max-w-3xl mx-auto">
            <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-primary-text mb-4">
              Ready to supercharge your LinkedIn prospecting?
            </h2>
            <p className="text-lg text-secondary-text mb-8">
              Sign up today and get 50 free credits to start finding the right connections on LinkedIn.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                className="bg-primary hover:bg-accent-hover text-lg px-8 py-6" 
                size="lg"
                onClick={handleGetFreeCredits}
              >
                Get 50 Free Credits
              </Button>
              <Button variant="outline" className="border-primary/30 hover:bg-primary/10 text-primary text-lg px-8 py-6" size="lg">
                View Demo
              </Button>
            </div>
          </div>
        </motion.section>
      </motion.main>
      
      <Footer />
    </div>
  );
};

export default Pricing;