import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Link, useLocation } from 'wouter';
import { Menu, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import logoIcon from '../assets/icons/logo.png';

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
    <nav className="glass-navbar sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 lg:h-18">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="group flex items-center space-x-4 hover:opacity-95 transition-all duration-300">
              {/* Enhanced Logo Container */}
              <div className="relative">
                {/* Animated background glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-primary/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 animate-pulse"></div>
                
                {/* Logo background with better styling */}
                {/* <div className="relative bg-gradient-to-br from-primary via-accent to-primary p-3 rounded-2xl shadow-xl border border-primary/20 group-hover:shadow-2xl group-hover:shadow-primary/25 transition-all duration-300"> */}
                  <img 
                    src={logoIcon} 
                    alt="Link It Up Logo" 
                    className="h-10 w-10 object-contain drop-shadow-lg filter brightness-110 group-hover:scale-105 transition-transform duration-300"
                  />
                {/* </div> */}
                
                {/* Corner accent */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              
              {/* Enhanced Brand Text */}
              <div className="hidden sm:flex flex-col">
                <div className="text-2xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent tracking-tight leading-none">
                  Link It Up
                </div>
                <div className="text-sm text-muted-foreground font-medium tracking-wide opacity-90 leading-tight mt-0.5">
                  Professional Network Discovery
                </div>
              </div>
              
              {/* Mobile-only simplified text */}
              <div className="sm:hidden flex flex-col">
                <div className="text-lg font-bold text-foreground tracking-tight">
                  Link It Up
                </div>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center">
            {/* Links for all users */}
            <div className="flex items-center space-x-1 mr-6">
              <Link 
                to="/" 
                className={`nav-link px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  location === "/" 
                    ? "bg-primary/10 text-primary shadow-glow" 
                    : "text-muted-foreground hover:text-foreground hover:bg-card-elevated"
                }`}
              >
                Home
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/dashboard" 
                    className={`nav-link px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      location === "/dashboard" 
                        ? "bg-primary/10 text-primary shadow-glow" 
                        : "text-muted-foreground hover:text-foreground hover:bg-card-elevated"
                    }`}
                  >
                    Dashboard
                  </Link>
                  
                  <Link 
                    to="/pricing" 
                    className={`nav-link px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      location === "/pricing" 
                        ? "bg-primary/10 text-primary shadow-glow" 
                        : "text-muted-foreground hover:text-foreground hover:bg-card-elevated"
                    }`}
                  >
                    Credits
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/pricing" 
                    className={`nav-link px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      location === "/pricing" 
                        ? "bg-primary/10 text-primary shadow-glow" 
                        : "text-muted-foreground hover:text-foreground hover:bg-card-elevated"
                    }`}
                  >
                    Pricing
                  </Link>
                  
                  <Link 
                    to="/features" 
                    className={`nav-link px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      location === "/features" 
                        ? "bg-primary/10 text-primary shadow-glow" 
                        : "text-muted-foreground hover:text-foreground hover:bg-card-elevated"
                    }`}
                  >
                    Features
                  </Link>
                </>
              )}
            </div>
            
            {/* User menu for authenticated users */}
            {isAuthenticated && (
              <div className="flex items-center space-x-4">
                {/* Credits Display */}
                <div className="hidden lg:flex items-center space-x-2 bg-card-elevated px-4 py-2 rounded-xl border border-border-elevated">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-muted-foreground">₹</span>
                  <span className="text-lg font-bold text-foreground">
                    {userData?.linkCredits || 0}
                  </span>
                </div>
                
                {/* User Avatar */}
                <Link to="/profile" className="group flex items-center space-x-3 hover:opacity-90 transition-all duration-200">
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
                    onClick={() => setIsAvatarClicked(true)}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
                    <Avatar className="h-10 w-10 relative border-2 border-primary/20 shadow-lg">
                      <AvatarImage 
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${userData?.email || 'default'}`} 
                        alt={userData?.name || 'User'}
                        className="rounded-full"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                </Link>
              </div>
            )}
            
            {/* Login button for non-authenticated users - only show on non-home pages */}
            {!isAuthenticated && location !== "/" && (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/" 
                  className="btn-secondary text-sm"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile navigation */}
          <div className="flex md:hidden items-center space-x-3">
            {isAuthenticated && (
              <>
                {/* Mobile Credits */}
                <div className="flex items-center space-x-2 bg-card-elevated px-3 py-1.5 rounded-lg border border-border-elevated">
                  <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                  <span className="text-sm font-bold text-foreground">
                    {userData?.linkCredits || 0}
                  </span>
                </div>
                
                {/* Mobile Avatar */}
                <Link to="/profile">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Avatar className="h-8 w-8 border-2 border-primary/20">
                      <AvatarImage 
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${userData?.email || 'default'}`} 
                        alt={userData?.name || 'User'}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xs font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                </Link>
              </>
            )}
            
            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="relative p-2.5 rounded-xl bg-card-elevated border border-border-elevated text-muted-foreground hover:text-foreground focus:outline-none transition-all duration-200"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={mobileMenuOpen ? "open" : "closed"}
                variants={{
                  open: { rotate: 90 },
                  closed: { rotate: 0 }
                }}
                transition={{ duration: 0.2 }}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </motion.div>
            </motion.button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            className="md:hidden glass-card border-t border-border-elevated"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="px-4 py-6 space-y-2">
              <Link 
                to="/" 
                className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                  location === "/" 
                    ? "bg-primary/10 text-primary shadow-glow" 
                    : "text-muted-foreground hover:text-foreground hover:bg-card-elevated"
                }`}
              >
                Home
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/dashboard" 
                    className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                      location === "/dashboard" 
                        ? "bg-primary/10 text-primary shadow-glow" 
                        : "text-muted-foreground hover:text-foreground hover:bg-card-elevated"
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/profile" 
                    className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                      location === "/profile" 
                        ? "bg-primary/10 text-primary shadow-glow" 
                        : "text-muted-foreground hover:text-foreground hover:bg-card-elevated"
                    }`}
                  >
                    Profile
                  </Link>
                  <Link 
                    to="/pricing" 
                    className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                      location === "/pricing" 
                        ? "bg-primary/10 text-primary shadow-glow" 
                        : "text-muted-foreground hover:text-foreground hover:bg-card-elevated"
                    }`}
                  >
                    Credits
                  </Link>
                  
                  {/* Mobile User Info Card */}
                  <div className="pt-4 mt-4 border-t border-border-elevated">
                    <div className="bg-card-elevated p-4 rounded-xl border border-border-elevated">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarImage 
                            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${userData?.email || 'default'}`} 
                            alt={userData?.name || 'User'}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="text-base font-semibold text-foreground">
                            {userData?.name || 'User'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {userData?.linkCredits || 0} Credits Available
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link 
                    to="/pricing" 
                    className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                      location === "/pricing" 
                        ? "bg-primary/10 text-primary shadow-glow" 
                        : "text-muted-foreground hover:text-foreground hover:bg-card-elevated"
                    }`}
                  >
                    Pricing
                  </Link>
                  <Link 
                    to="/features" 
                    className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                      location === "/features" 
                        ? "bg-primary/10 text-primary shadow-glow" 
                        : "text-muted-foreground hover:text-foreground hover:bg-card-elevated"
                    }`}
                  >
                    Features
                  </Link>
                  
                  {/* Only show Sign In button on non-home pages */}
                  {location !== "/" && (
                    <div className="pt-4 mt-4 border-t border-border-elevated">
                      <Link to="/" className="btn-secondary w-full text-center block">
                        Sign In
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
