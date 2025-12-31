import { motion } from "framer-motion";
import HomeAuthForm from "./HomeAuthForm";
import { Search, Database, LineChart, CloudLightning, FileUp } from "lucide-react";
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
    <section className="relative pt-6 lg:pt-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Professional Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/3 rounded-full blur-3xl"></div>
      </div>
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col xl:flex-row items-center justify-between gap-12 lg:gap-20">
          <div className="w-full xl:w-3/5 text-center xl:text-left">
            {/* Hero Badge */}
            <motion.div 
              className="inline-flex items-center space-x-2 bg-card-elevated border border-border-elevated rounded-full px-4 py-2 mb-8"
              variants={itemVariants}
            >
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-muted-foreground">
                Trusted by 1000+ professionals
              </span>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-6xl xl:text-7xl font-bold text-foreground mb-8 leading-[1.1] tracking-tight"
              variants={itemVariants}
            >
              Find LinkedIn profiles with{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI precision
              </span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-muted-foreground max-w-2xl xl:max-w-none mx-auto xl:mx-0 mb-12 leading-relaxed"
              variants={itemVariants}
            >
              Transform your professional networking with advanced AI that finds accurate LinkedIn 
              profiles in seconds, not hours. Save time, increase accuracy, scale your outreach.
            </motion.p>

            {/* Professional Features Grid */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12"
              variants={itemVariants}
            >
              {[
                {
                  icon: Search,
                  title: "AI-Powered Matching",
                  description: "Advanced algorithms analyze multiple data points for 95% accuracy in profile matching"
                },
                {
                  icon: Database,
                  title: "Bulk Processing",
                  description: "Process hundreds of contacts simultaneously with enterprise-grade performance"
                },
                {
                  icon: LineChart,
                  title: "Advanced Analytics",
                  description: "Comprehensive insights and success metrics to optimize your networking strategy"
                },
                {
                  icon: CloudLightning,
                  title: "Lightning Fast",
                  description: "Get results in under 10 seconds per profile with our optimized infrastructure"
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="group flex items-start space-x-4 p-6 rounded-2xl bg-card-elevated border border-border-elevated hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex-shrink-0 relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
                    <div className="relative bg-gradient-to-br from-primary/20 to-accent/20 p-3 rounded-xl border border-primary/20">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            {/* Professional CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center xl:justify-start"
              variants={itemVariants}
            >
              <Link href="/pricing">
                <Button className="btn-primary text-lg px-8 py-4 min-w-[200px] group">
                  <span className="mr-2">Pricing Plans</span>
                  <CloudLightning className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/">
                <Button className="btn-secondary text-lg px-8 py-4 min-w-[200px] group">
                  <span className="mr-2">How It Works</span>
                  <LineChart className="h-5 w-5 group-hover:scale-110 transition-transform" />
                </Button>
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div 
              className="flex items-center justify-center xl:justify-start space-x-8 mt-12 pt-8 border-t border-border-elevated"
              variants={itemVariants}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">95%</div>
                <div className="text-sm text-muted-foreground">Match Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">10s</div>
                <div className="text-sm text-muted-foreground">Avg Response</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">1000+</div>
                <div className="text-sm text-muted-foreground">Happy Users</div>
              </div>
            </motion.div>
          </div>

          <div className="w-full xl:w-2/5">
            <motion.div 
              variants={illustrationVariants} 
              className="relative"
            >
              {isAuthenticated ? (
                <div className="relative">
                  {/* Enhanced Quick Access Card for Authenticated Users */}
                  <div className="glass-card rounded-3xl shadow-2xl border border-border-elevated p-2">
                    <div className="bg-card rounded-2xl p-8">
                      <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                          <Search className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">
                          Quick Access
                        </h3>
                        <p className="text-muted-foreground">
                          Jump right into your LinkedIn profile discovery
                        </p>
                      </div>
                      
                      {/* Quick Action Buttons */}
                      <div className="space-y-3">
                        <Link to="/dashboard">
                          <Button className="btn-primary w-full text-lg py-4 group">
                            <Database className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                            Start Lead Generation
                          </Button>
                        </Link>
                      </div>
                      
                      {/* Trust badges */}
                      <div className="mt-8 pt-6 border-t border-border-elevated">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="space-y-1">
                            <div className="text-lg font-bold text-success">95%</div>
                            <div className="text-xs text-muted-foreground">Accuracy</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-lg font-bold text-primary">10s</div>
                            <div className="text-xs text-muted-foreground">Avg Response</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-lg font-bold text-accent">1000+</div>
                            <div className="text-xs text-muted-foreground">Happy Users</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating elements */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
                  <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/5 rounded-full blur-2xl"></div>
                </div>
              ) : (
                <div className="relative">
                  {/* Enhanced Auth Form Container */}
                  <div className="glass-card rounded-3xl shadow-2xl border border-border-elevated p-2">
                    <div className="bg-card rounded-2xl p-8">
                      <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                          <Database className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">
                          Get Started Today
                        </h3>
                        <p className="text-muted-foreground">
                          Join 1000+ professionals already using Link It Up
                        </p>
                      </div>
                      
                      <HomeAuthForm />
                      
                      {/* Trust badges */}
                      <div className="mt-8 pt-6 border-t border-border-elevated">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="space-y-1">
                            <div className="text-lg font-bold text-primary">50</div>
                            <div className="text-xs text-muted-foreground">Free Credits</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-lg font-bold text-primary">24/7</div>
                            <div className="text-xs text-muted-foreground">Support</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-lg font-bold text-primary">SSL</div>
                            <div className="text-xs text-muted-foreground">Secured</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating elements */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
                  <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/5 rounded-full blur-2xl"></div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
