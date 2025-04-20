import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Link, useLocation } from 'wouter';
import { Link2, Briefcase, LogOut, Users, CreditCard } from 'lucide-react';

const Navbar: React.FC = () => {
  const { isAuthenticated, userData, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();

  // Handle closing the user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  };

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="font-heading font-bold text-xl text-primary-text flex items-center">
              <Link2 className="text-primary mr-2 h-5 w-5" />
              <span className="hidden xs:inline">Link It Up</span>
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
              <div className="relative ml-4" ref={menuRef}>
                <div className="flex items-center text-primary-text ml-2">
                  <Link to="/profile" className="mr-2 text-sm uppercase hover:text-primary transition-colors">
                    {userData?.name || 'User'}
                  </Link>
                  <button 
                    className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <span className="text-xs font-semibold">{userData?.linkCredits || 0}</span>
                  </button>
                </div>
                
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-card border border-border overflow-hidden"
                    >
                      <div className="py-1">
                        <Link to="/dashboard" className="flex items-center px-4 py-2 text-sm text-secondary-text hover:bg-background hover:text-primary-text">
                          <span className="mr-2 font-bold">Dashboard</span>
                        </Link>
                        <Link to="/profile" className="flex items-center px-4 py-2 text-sm text-secondary-text hover:bg-background hover:text-primary-text">
                          <Briefcase className="mr-2 h-4 w-4" />
                          Your Profile
                        </Link>
                        <Link to="/pricing" className="flex items-center px-4 py-2 text-sm text-secondary-text hover:bg-background hover:text-primary-text">
                          <CreditCard className="mr-2 h-4 w-4" />
                          Buy Credits
                        </Link>
                        <button 
                          onClick={handleLogout}
                          className="w-full text-left flex items-center px-4 py-2 text-sm text-destructive hover:bg-background"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            
            {/* Login button for non-authenticated users */}
            {!isAuthenticated && (
              <div className="ml-4">
                <Link to="/login" className="bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors">
                  Log In
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile navigation button */}
          <div className="flex md:hidden items-center">
            {isAuthenticated && (
              <button 
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-2"
              >
                <span className="text-xs font-semibold">{userData?.linkCredits || 0}</span>
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-secondary-text hover:text-primary-text focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-card border-t border-border"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link to="/" className={`block px-3 py-2 rounded-md text-base font-medium ${location === "/" ? "bg-primary/10 text-primary" : "text-secondary-text hover:bg-background"}`}>
                Home
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className={`block px-3 py-2 rounded-md text-base font-medium ${location === "/dashboard" ? "bg-primary/10 text-primary" : "text-secondary-text hover:bg-background"}`}>
                    Dashboard
                  </Link>
                  <Link to="/profile" className={`block px-3 py-2 rounded-md text-base font-medium ${location === "/profile" ? "bg-primary/10 text-primary" : "text-secondary-text hover:bg-background"}`}>
                    Profile
                  </Link>
                  <Link to="/pricing" className={`block px-3 py-2 rounded-md text-base font-medium ${location === "/pricing" ? "bg-primary/10 text-primary" : "text-secondary-text hover:bg-background"}`}>
                    Buy Credits
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-destructive hover:bg-background"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/pricing" className={`block px-3 py-2 rounded-md text-base font-medium ${location === "/pricing" ? "bg-primary/10 text-primary" : "text-secondary-text hover:bg-background"}`}>
                    Pricing
                  </Link>
                  <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium bg-primary text-white">
                    Log In
                  </Link>
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
