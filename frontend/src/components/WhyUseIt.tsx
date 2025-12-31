import { motion } from 'framer-motion';
import { Clock, Database, Scale } from 'lucide-react';

const WhyUseIt: React.FC = () => {
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
  );
};

export default WhyUseIt;
