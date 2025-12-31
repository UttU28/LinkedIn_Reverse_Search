import { motion } from 'framer-motion';
import { CloudUpload, Search, Brain, Clock, Database, Scale } from 'lucide-react';

const FeatureList: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <>
      {/* What It Does Section */}
      <motion.section 
        className="my-16 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-card/30 rounded-3xl mb-20"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.h2 
          className="text-2xl md:text-3xl font-heading font-semibold text-primary-text mb-6 text-center"
          variants={itemVariants}
        >
          What It Does
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div 
            className="bg-card p-6 rounded-xl border border-border/50 hover:border-accent/30 transition-all duration-300"
            variants={itemVariants}
          >
            <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
              <CloudUpload className="text-accent" size={24} />
            </div>
            <h3 className="text-xl font-heading font-medium text-primary-text mb-3">Upload a CSV</h3>
            <p className="text-secondary-text">Bulk upload your prospect list with names, companies, and positions for efficient processing.</p>
          </motion.div>
          
          <motion.div 
            className="bg-card p-6 rounded-xl border border-border/50 hover:border-accent/30 transition-all duration-300"
            variants={itemVariants}
          >
            <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
              <Search className="text-accent" size={24} />
            </div>
            <h3 className="text-xl font-heading font-medium text-primary-text mb-3">Lead Generation</h3>
            <p className="text-secondary-text">Find individual and bulk LinkedIn profiles with precision using our intelligent search algorithm.</p>
          </motion.div>
          
          <motion.div 
            className="bg-card p-6 rounded-xl border border-border/50 hover:border-accent/30 transition-all duration-300"
            variants={itemVariants}
          >
            <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
              <Brain className="text-accent" size={24} />
            </div>
            <h3 className="text-xl font-heading font-medium text-primary-text mb-3">AI Verification</h3>
            <p className="text-secondary-text">Our AI verifies and returns the best LinkedIn match with high confidence scores.</p>
          </motion.div>
        </div>
      </motion.section>

      {/* Why Use It Section */}
      <motion.section 
        className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.h2 
          className="text-2xl md:text-3xl font-heading font-semibold text-primary-text mb-6 text-center"
          variants={itemVariants}
        >
          Why Use Link It Up
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div 
            className="text-center p-6"
            variants={itemVariants}
          >
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="text-accent" size={24} />
            </div>
            <h3 className="text-xl font-heading font-medium text-primary-text mb-3">Saves Hours</h3>
            <p className="text-secondary-text">Eliminate manual searching and save countless hours finding the right profiles.</p>
          </motion.div>
          
          <motion.div 
            className="text-center p-6"
            variants={itemVariants}
          >
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="text-accent" size={24} />
            </div>
            <h3 className="text-xl font-heading font-medium text-primary-text mb-3">CRM-Ready Data</h3>
            <p className="text-secondary-text">Get clean, verified data that's ready to import into your CRM system.</p>
          </motion.div>
          
          <motion.div 
            className="text-center p-6"
            variants={itemVariants}
          >
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Scale className="text-accent" size={24} />
            </div>
            <h3 className="text-xl font-heading font-medium text-primary-text mb-3">Scales to Thousands</h3>
            <p className="text-secondary-text">Process thousands of profiles with consistent accuracy and reliability.</p>
          </motion.div>
        </div>
      </motion.section>
    </>
  );
};

export default FeatureList;
