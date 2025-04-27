import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Link, useLocation } from 'wouter';
import { Link2, LogOut, Menu, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Navbar: React.FC = () => {
  const { isAuthenticated, userData } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAvatarClicked, setIsAvatarClicked] = useState(false);
  const [location] = useLocation();

  // Animation reset timeout
  useEffect(() => {
    if (isAvatarClicked) {
      const timeout = setTimeout(() => {
        setIsAvatarClicked(false);
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [isAvatarClicked]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const getUserInitials = (): string => {
    if (!userData?.name) return '';
    
    return userData.name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  return (
    <nav className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="font-heading font-bold text-lg sm:text-xl text-primary-text flex items-center">
              <Link2 className="text-primary mr-1 sm:mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              <span>Link It Up</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center">
            {/* Links for all users */}
            <div className="flex items-center space-x-2">
              <Link to="/" className={`text-secondary-text hover:text-primary transition-colors duration-200 p-2 rounded-md ${location === "/" ? "bg-primary/10 text-primary" : ""}`}>
                <span className="font-bold">Home</span>
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className={`text-secondary-text hover:text-primary transition-colors duration-200 p-2 rounded-md ${location === "/dashboard" ? "bg-primary/10 text-primary" : ""}`}>
                    <span className="font-bold">Dashboard</span>
                  </Link>
                  
                  <Link to="/pricing" className={`text-secondary-text hover:text-primary transition-colors duration-200 p-2 rounded-md ${location === "/pricing" ? "bg-primary/10 text-primary" : ""}`}>
                    <span className="font-bold">Buy Credits</span>
                  </Link>
                </>
              ) : (
                <Link to="/pricing" className={`text-secondary-text hover:text-primary transition-colors duration-200 p-2 rounded-md ${location === "/pricing" ? "bg-primary/10 text-primary" : ""}`}>
                  <span className="font-bold">Pricing</span>
                </Link>
              )}
            </div>
            
            {/* User menu for authenticated users */}
            {isAuthenticated && (
              <div className="relative ml-4">
                <div className="flex items-center text-primary-text ml-2">
                  <Link to="/profile" className="flex items-center hover:opacity-90 transition-opacity">
                    <span className="mr-2 font-medium text-primary">₹ {userData?.linkCredits || 0}</span>
                    <motion.div
                      initial={{ scale: 1 }}
                      animate={{ 
                        scale: isAvatarClicked ? 1.1 : 1,
                        rotate: isAvatarClicked ? [0, -10, 10, -5, 5, 0] : 0
                      }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 400, 
                        damping: 15
                      }}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => {
                        setIsAvatarClicked(true);
                      }}
                      className="cursor-pointer"
                    >
                      <Avatar className="h-9 w-9 relative overflow-visible">
                        <motion.div
                          className="absolute inset-0"
                          animate={{ 
                            opacity: [0.1, 0.2, 0.1], 
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ 
                            duration: 3,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut"
                          }}
                          style={{
                            borderRadius: "100%",
                            background: "radial-gradient(circle, rgba(138,43,226,0.15) 0%, rgba(138,43,226,0) 70%)"
                          }}
                        />
                        <AvatarImage 
                          src={`https://api.dicebear.com/7.x/bottts/svg?seed=${userData?.email || 'default'}`} 
                          alt={userData?.name || 'User'}
                        />
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                  </Link>
                </div>
              </div>
            )}
            
            {/* Login button for non-authenticated users */}
            {!isAuthenticated && (
              <div className="ml-4">
                <Link to="/" className="bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors">
                  Log In
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile navigation button */}
          <div className="flex md:hidden items-center">
            {isAuthenticated && (
              <Link to="/profile" className="flex items-center mr-3">
                <span className="mr-2 font-medium text-primary text-sm">₹ {userData?.linkCredits || 0}</span>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={`https://api.dicebear.com/7.x/bottts/svg?seed=${userData?.email || 'default'}`} 
                      alt={userData?.name || 'User'}
                    />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-secondary-text hover:text-primary-text focus:outline-none hover:bg-background/50 active:bg-background/70 transition-colors"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <motion.div 
          className="md:hidden bg-card border-t border-border"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="px-2 py-3 space-y-1">
            <Link to="/" className={`block px-3 py-3 rounded-md text-base font-medium ${location === "/" ? "bg-primary/10 text-primary" : "text-secondary-text hover:bg-background"}`}>
              Home
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className={`block px-3 py-3 rounded-md text-base font-medium ${location === "/dashboard" ? "bg-primary/10 text-primary" : "text-secondary-text hover:bg-background"}`}>
                  Dashboard
                </Link>
                <Link to="/profile" className={`block px-3 py-3 rounded-md text-base font-medium ${location === "/profile" ? "bg-primary/10 text-primary" : "text-secondary-text hover:bg-background"}`}>
                  Profile
                </Link>
                <Link to="/pricing" className={`block px-3 py-3 rounded-md text-base font-medium ${location === "/pricing" ? "bg-primary/10 text-primary" : "text-secondary-text hover:bg-background"}`}>
                  Buy Credits
                </Link>
                <div className="pt-2 mt-3 border-t border-border/30">
                  <Link to="/profile"
                    className="block w-full text-left px-3 py-3 rounded-md text-base font-medium bg-primary hover:bg-primary/90 text-white transition-colors"
                  >
                    My Account
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Link to="/pricing" className={`block px-3 py-3 rounded-md text-base font-medium ${location === "/pricing" ? "bg-primary/10 text-primary" : "text-secondary-text hover:bg-background"}`}>
                  Pricing
                </Link>
                <div className="pt-2 mt-3 border-t border-border/30">
                  <Link to="/" className="block px-3 py-3 rounded-md text-base font-medium bg-primary text-white hover:bg-primary/90 transition-colors">
                    Log In
                  </Link>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
