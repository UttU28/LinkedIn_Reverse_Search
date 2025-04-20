import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import FeatureList from '../components/FeatureList';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';

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
        
        {/* Features Section */}
        <FeatureList />
        
        {/* Testimonials/Features */}
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
            Powerful Features
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
                  <i className="ri-google-line text-xl text-accent"></i>
                </div>
                <div>
                  <h3 className="text-lg font-heading font-medium text-primary-text mb-2">Smart Search Technology</h3>
                  <p className="text-secondary-text">Our algorithms construct precise search queries that find the right profiles faster.</p>
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
                  <i className="ri-robot-line text-xl text-accent"></i>
                </div>
                <div>
                  <h3 className="text-lg font-heading font-medium text-primary-text mb-2">AI-powered Verification</h3>
                  <p className="text-secondary-text">Advanced AI ensures the profiles we find match your search criteria with high confidence.</p>
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
                  <i className="ri-bar-chart-line text-xl text-accent"></i>
                </div>
                <div>
                  <h3 className="text-lg font-heading font-medium text-primary-text mb-2">High-Accuracy Results</h3>
                  <p className="text-secondary-text">Get reliable matches with confidence ratings to help prioritize your outreach efforts.</p>
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
                  <i className="ri-file-upload-line text-xl text-accent"></i>
                </div>
                <div>
                  <h3 className="text-lg font-heading font-medium text-primary-text mb-2">CSV/Excel Bulk Upload</h3>
                  <p className="text-secondary-text">Flexible options for both bulk processing and individual high-priority searches.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;
