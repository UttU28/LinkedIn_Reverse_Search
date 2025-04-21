import { motion } from 'framer-motion';
import { Upload, Layers, Boxes } from 'lucide-react';

interface HowItWorksProps {
  className?: string;
}

const HowItWorks: React.FC<HowItWorksProps> = ({ className }) => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.section 
      className={`max-w-7xl mx-auto mb-20 py-16 px-4 sm:px-6 lg:px-10 bg-card/30 rounded-3xl border border-border/30 ${className || ''}`}
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
  );
};

export default HowItWorks; 