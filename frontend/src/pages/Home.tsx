import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import FeatureList from '../components/FeatureList';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { Gift, Search, FileUp, Target, Users } from 'lucide-react';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
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
      
      <main className="flex-grow z-10 relative">
        {/* Hero Section with Auth Form */}
        <HeroSection />
        
        {/* Promotion Banner */}
        {!isAuthenticated && (
          <motion.div 
            className="max-w-7xl mx-auto mb-14 px-4 sm:px-6 lg:px-8 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-gradient-to-r from-accent/20 to-primary/20 rounded-xl p-6 border border-accent/30 flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-accent/30 rounded-full flex items-center justify-center">
                <Gift className="text-accent" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-heading font-medium text-primary-text">New User Bonus!</h3>
                <p className="text-secondary-text">Register now and receive 50 tokens for free to start finding professional profiles.</p>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Features Section */}
        <FeatureList />
        
        {/* Search Options Section */}
        <motion.section 
          className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-card/30 rounded-3xl mb-12 sm:mb-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
        >
          <motion.h2 
            className="text-2xl md:text-3xl font-heading font-semibold text-primary-text mb-8 sm:mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Multiple Search Options
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            <motion.div 
              className="bg-card p-4 sm:p-6 rounded-xl border border-border/50"
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-start">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center mr-4">
                  <Search className="text-accent" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-medium text-primary-text mb-2">Single Profile Search</h3>
                  <p className="text-secondary-text">Quickly find individual professional profiles by name, company, and position.</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-card p-4 sm:p-6 rounded-xl border border-border/50"
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-start">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center mr-4">
                  <FileUp className="text-accent" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-medium text-primary-text mb-2">CSV Batch Upload</h3>
                  <p className="text-secondary-text">Process multiple profile searches at once by uploading a CSV file with names, companies, and positions.</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-card p-4 sm:p-6 rounded-xl border border-border/50"
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-start">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center mr-4">
                  <Target className="text-accent" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-medium text-primary-text mb-2">Targeted Lead Generator</h3>
                  <p className="text-secondary-text">Find professionals by industry, position type, and company to build targeted lead lists.</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-card p-4 sm:p-6 rounded-xl border border-border/50"
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex items-start">
                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center mr-4">
                  <Users className="text-accent" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-medium text-primary-text mb-2">Team Members Finder</h3>
                  <p className="text-secondary-text">Discover team members from specific companies to enhance your networking and outreach.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* How It Works Section */}
        <motion.section 
          className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-12 sm:mb-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
        >
          <motion.h2 
            className="text-2xl md:text-3xl font-heading font-semibold text-primary-text mb-8 sm:mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            How It Works
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              className="bg-card p-6 rounded-xl border border-border/50 flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-accent font-heading font-bold text-xl">1</span>
              </div>
              <h3 className="text-lg font-heading font-medium text-primary-text mb-2">Create an Account</h3>
              <p className="text-secondary-text">Sign up for free and receive 50 complimentary tokens to start searching.</p>
            </motion.div>
            
            <motion.div 
              className="bg-card p-6 rounded-xl border border-border/50 flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-accent font-heading font-bold text-xl">2</span>
              </div>
              <h3 className="text-lg font-heading font-medium text-primary-text mb-2">Choose Search Method</h3>
              <p className="text-secondary-text">Select from single search, CSV upload, lead generation, or team finder options.</p>
            </motion.div>
            
            <motion.div 
              className="bg-card p-6 rounded-xl border border-border/50 flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-accent font-heading font-bold text-xl">3</span>
              </div>
              <h3 className="text-lg font-heading font-medium text-primary-text mb-2">Get Results</h3>
              <p className="text-secondary-text">Receive verified profile links with our advanced matching technology. One token per successful match.</p>
            </motion.div>
          </div>
        </motion.section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;
