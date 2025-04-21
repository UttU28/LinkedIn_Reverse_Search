import { motion } from 'framer-motion';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HowItWorks from '../components/HowItWorks';
import { Button } from '@/components/ui/button';
import { ExternalLink, ChevronDown } from 'lucide-react';

const Demo = () => {
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

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

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
            See <span className="text-primary">Link It Up</span> in Action
          </h1>
          <p className="text-xl text-secondary-text max-w-3xl mx-auto mb-8">
            Watch our product demo to see how easy it is to find professional profiles using our platform.
          </p>
        </motion.div>

        {/* Video Demo Section */}
        <motion.section 
          className="max-w-5xl mx-auto mb-24"
          variants={itemVariants}
        >
          <div className="relative rounded-2xl overflow-hidden border-2 border-primary/20 shadow-xl shadow-primary/10">
            {/* YouTube Embedded Video */}
            <div className="aspect-video w-full">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/VxY1LKMRqz4?rel=0" 
                title="Link It Up Product Demo" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
                className="w-full h-full object-cover"
              ></iframe>
            </div>
            
            {/* Video info bar */}
            <div className="p-4 bg-card/80 backdrop-blur-sm border-t border-primary/10 flex justify-between items-center">
              <div className="text-primary-text font-medium">
                Link It Up - Product Demo
              </div>
              <a 
                href="https://www.youtube.com/watch?v=VxY1LKMRqz4" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary hover:text-accent transition-colors"
              >
                Watch on YouTube <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          
          {/* Demo highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            <div className="bg-card/50 p-5 rounded-xl border border-border/50">
              <h3 className="font-medium text-lg text-primary-text mb-2">Quick Setup</h3>
              <p className="text-secondary-text text-sm">See how to set up your account and start searching in less than 2 minutes.</p>
            </div>
            <div className="bg-card/50 p-5 rounded-xl border border-border/50">
              <h3 className="font-medium text-lg text-primary-text mb-2">Batch Processing</h3>
              <p className="text-secondary-text text-sm">Learn how to upload and process multiple contacts at once for maximum efficiency.</p>
            </div>
            <div className="bg-card/50 p-5 rounded-xl border border-border/50">
              <h3 className="font-medium text-lg text-primary-text mb-2">Export Results</h3>
              <p className="text-secondary-text text-sm">Discover the various export options to integrate with your existing workflow.</p>
            </div>
          </div>
        </motion.section>

        {/* How It Works Section */}
        <div id="how-it-works">
          <HowItWorks className="bg-card/20" />
        </div>

        {/* CTA Section */}
        <motion.section 
          className="max-w-4xl mx-auto text-center mt-10"
          variants={itemVariants}
        >
          <h2 className="text-2xl md:text-3xl font-heading font-semibold text-primary-text mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-secondary-text max-w-2xl mx-auto mb-8">
            Sign up today and get 50 free credits to start finding professional profiles.
          </p>
          <Button 
            className="bg-primary hover:bg-accent-hover text-lg px-8 py-3" 
            size="lg"
          >
            Try for Free
          </Button>
        </motion.section>
      </motion.main>
      
      <Footer />
    </div>
  );
};

export default Demo; 