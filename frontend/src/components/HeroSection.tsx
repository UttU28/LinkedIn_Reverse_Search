import { motion } from "framer-motion";
import HomeAuthForm from "./HomeAuthForm";
import { Search, Database, LineChart, CloudLightning } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/button";
import { Link } from "wouter";

const HeroSection: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
        duration: 0.6,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  const illustrationVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.7,
        delay: 0.3,
      },
    },
  };

  return (
    <section className="pt-10 lg:pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col lg:flex-row items-center justify-between">
          <div className="w-full lg:w-1/2 lg:pr-8 text-center lg:text-left">
            <motion.h1
              className="text-3xl md:text-5xl font-heading font-bold text-primary-text mb-6 leading-tight"
              variants={itemVariants}
            >
              Find LinkedIn profiles with{" "}
              <span className="text-primary">AI precision</span>
            </motion.h1>

            <motion.div
              className="text-secondary-text max-w-2xl lg:max-w-none mx-auto text-base sm:text-lg mb-6 space-y-4"
              variants={itemVariants}
            >
              <p>
                Link It Up uses advanced AI algorithms to find accurate LinkedIn
                profiles for your target professionals, saving you hours of
                manual searching.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="flex items-start">
                  <div className="bg-primary/10 p-2 rounded-lg mr-3">
                    <Search className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-primary-text font-medium text-base">
                      Intelligent Matching
                    </h3>
                    <p className="text-sm text-secondary-text">
                      Our AI processes multiple data points to ensure accurate
                      profile matches.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-primary/10 p-2 rounded-lg mr-3">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-primary-text font-medium text-base">
                      Bulk Processing
                    </h3>
                    <p className="text-sm text-secondary-text">
                      Upload CSV files with hundreds of contacts to process at
                      once.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-primary/10 p-2 rounded-lg mr-3">
                    <LineChart className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-primary-text font-medium text-base">
                      Detailed Analytics
                    </h3>
                    <p className="text-sm text-secondary-text">
                      Track your success rate and optimize your outreach.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-primary/10 p-2 rounded-lg mr-3">
                    <CloudLightning className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-primary-text font-medium text-base">
                      Rapid Results
                    </h3>
                    <p className="text-sm text-secondary-text">
                      Get LinkedIn profile links in seconds, not hours.
                    </p>
                  </div>
                </div>
              </div>
              
              <motion.div 
                className="pt-6 flex flex-col sm:flex-row gap-4 justify-center"
                variants={itemVariants}
              >
                <Link href="/pricing">
                  <Button className="px-6 py-5 text-base bg-primary hover:bg-accent-hover">
                    View Pricing
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button variant="outline" className="px-6 py-5 text-base border-primary/30 hover:bg-primary/10 text-primary">
                    View Demo
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>

          <div className="w-full lg:w-1/2 lg:pl-4 mt-8 lg:mt-0">
            <motion.div variants={itemVariants} className="lg:max-w-md mx-auto">
              {isAuthenticated ? (
                <div className="bg-card border border-border/50 p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-heading font-semibold text-primary-text mb-4">
                    Welcome Back!
                  </h3>
                  <p className="text-secondary-text mb-6">
                    You're already logged in to Link It Up. Go to your dashboard to continue searching for LinkedIn profiles.
                  </p>
                  <Link to="/dashboard">
                    <Button className="w-full bg-primary hover:bg-accent-hover">
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>
              ) : (
                <HomeAuthForm />
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
