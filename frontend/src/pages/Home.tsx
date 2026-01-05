import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import WhatItDoes from '../components/WhatItDoes';
import WhyUseIt from '../components/WhyUseIt';
import HowItWorks from '../components/HowItWorks';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { useModalStore } from '../store/modalStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'wouter';
import { ArrowRight, Zap, CheckCircle, Sparkles, X, Award, Star } from 'lucide-react';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { openModal } = useModalStore();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if banner was dismissed
    const bannerDismissed = localStorage.getItem('freeCreditsBannerDismissed');
    if (!bannerDismissed && !isAuthenticated) {
      setShowBanner(true);
    }
  }, [isAuthenticated]);

  const handleDismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('freeCreditsBannerDismissed', 'true');
  };

  const handleGetStarted = () => {
    openModal('auth');
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
        duration: 0.3,
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col grainy-bg">
      <Navbar />
      
      {/* Free Credits Banner for Logged Out Users */}
      <AnimatePresence>
        {showBanner && !isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="relative z-20 px-4 sm:px-6 lg:px-8 pt-4"
          >
            <div className="max-w-7xl mx-auto">
              <Card className="bg-gradient-to-r from-primary/20 via-primary/10 to-accent/10 border-primary/30 shadow-lg">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1">
                      <div className="bg-primary/20 p-2 sm:p-3 rounded-lg">
                        <Award className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Star className="h-4 w-4 text-primary fill-primary" />
                          <h3 className="text-base sm:text-lg font-semibold text-primary-text">
                            Get 50 Free Credits on Signup
                          </h3>
                        </div>
                        <p className="text-sm sm:text-base text-secondary-text">
                          Start finding LinkedIn profiles instantly. No credit card required.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Button
                        onClick={handleGetStarted}
                        className="bg-primary hover:bg-accent-hover text-white text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-2.5 whitespace-nowrap"
                      >
                        Get Started
                      </Button>
                      <button
                        onClick={handleDismissBanner}
                        className="p-1.5 sm:p-2 hover:bg-background/20 rounded-lg transition-colors"
                        aria-label="Dismiss banner"
                      >
                        <X className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-text" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Top Welcome Section for Authenticated Users */}
      {isAuthenticated && (
        <motion.section 
          className="pt-6 pb-4 px-4 sm:px-6 lg:px-8 z-10 relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-7xl mx-auto">
            <Card className="glass-card border-border-elevated shadow-xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                  {/* Welcome Content */}
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-glow">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background animate-pulse"></div>
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                        Welcome Back!
                      </h2>
                      <p className="text-muted-foreground text-sm sm:text-base">
                        Ready to discover more LinkedIn profiles?
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Section */}
                  <div className="flex items-center space-x-4">
                    <Link to="/dashboard">
                      <Button className="bg-primary hover:bg-accent text-white font-semibold px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <Zap className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                        Go to Dashboard
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>
      )}
      
      <main className="flex-grow z-10 relative">
        <HeroSection />
        <WhatItDoes />
        <WhyUseIt />
        <HowItWorks />
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;
