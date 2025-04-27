import { Link, useLocation } from 'wouter';
import { Link2, Twitter, Facebook, Shield, Info } from 'lucide-react';
import LinkedInIcon from '../assets/icons/LinkedInIcon';
import TridentIcon from '../assets/icons/TridentIcon';

const Footer: React.FC = () => {
  const [location] = useLocation();
  const currentYear = new Date().getFullYear();

  // Function to determine if the link is active
  const isActiveLink = (path: string) => {
    // For home page, only exact match should return true
    if (path === '/') {
      return location === path;
    }
    // For other pages, check if the current location starts with the path
    return location.startsWith(path);
  };

  return (
    <footer className="bg-card/50 border-t border-border py-6 sm:py-8 px-4 sm:px-6 lg:px-8 z-10 relative">
      <div className="max-w-7xl mx-auto">
        {/* Main Navigation Links */}
        <div className="flex flex-col md:flex-row justify-center md:justify-between md:items-start text-center md:text-left">
          {/* Logo and Description */}
          <div className="mb-8 md:mb-0 flex flex-col items-center md:items-start max-w-xs mx-auto md:mx-0">
            <h3 className="font-heading font-semibold text-lg text-primary-text mb-3 sm:mb-4 flex items-center">
              <Link2 className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-accent" />
              Link It Up
            </h3>
            <p className="text-xs sm:text-sm text-secondary-text">Your AI-powered professional profile finder that utilizes publicly available information to facilitate connections.</p>
          </div>
          
          {/* Center Navigation Sections */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 md:gap-16 justify-center mx-auto md:mx-0">
            {/* Product Section */}
            <div>
              <h4 className="font-heading font-medium text-primary-text mb-3 sm:mb-4 text-sm sm:text-base">Product</h4>
              <ul className="space-y-2">
                <li>
                  <Link 
                    href="/features" 
                    className={`transition-colors duration-200 text-xs sm:text-sm py-1 block ${
                      isActiveLink('/features') 
                        ? 'text-primary font-medium' 
                        : 'text-secondary-text hover:text-accent'
                    }`}
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/pricing" 
                    className={`transition-colors duration-200 text-xs sm:text-sm py-1 block ${
                      isActiveLink('/pricing') 
                        ? 'text-primary font-medium' 
                        : 'text-secondary-text hover:text-accent'
                    }`}
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/faq" 
                    className={`transition-colors duration-200 text-xs sm:text-sm py-1 block ${
                      isActiveLink('/faq') 
                        ? 'text-primary font-medium' 
                        : 'text-secondary-text hover:text-accent'
                    }`}
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Company Section */}
            <div>
              <h4 className="font-heading font-medium text-primary-text mb-3 sm:mb-4 text-sm sm:text-base">Company</h4>
              <ul className="space-y-2">
                <li>
                  <Link 
                    href="/about" 
                    className={`transition-colors duration-200 text-xs sm:text-sm py-1 block ${
                      isActiveLink('/about') 
                        ? 'text-primary font-medium' 
                        : 'text-secondary-text hover:text-accent'
                    }`}
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/marketing" 
                    className={`transition-colors duration-200 text-xs sm:text-sm py-1 block ${
                      isActiveLink('/marketing') 
                        ? 'text-primary font-medium' 
                        : 'text-secondary-text hover:text-accent'
                    }`}
                  >
                    Marketing
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/contact" 
                    className={`transition-colors duration-200 text-xs sm:text-sm py-1 block ${
                      isActiveLink('/contact') 
                        ? 'text-primary font-medium' 
                        : 'text-secondary-text hover:text-accent'
                    }`}
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Legal Section */}
            <div className="col-span-2 sm:col-span-1 mt-6 sm:mt-0">
              <h4 className="font-heading font-medium text-primary-text mb-3 sm:mb-4 text-sm sm:text-base">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link 
                    href="/privacy" 
                    className={`transition-colors duration-200 text-xs sm:text-sm py-1 block ${
                      isActiveLink('/privacy') 
                        ? 'text-primary font-medium' 
                        : 'text-secondary-text hover:text-accent'
                    }`}
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/terms" 
                    className={`transition-colors duration-200 text-xs sm:text-sm py-1 block ${
                      isActiveLink('/terms') 
                        ? 'text-primary font-medium' 
                        : 'text-secondary-text hover:text-accent'
                    }`}
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Legal Disclaimer */}
        <div className="border-t border-border mt-6 sm:mt-8 pt-6 pb-6">
          <div className="text-center">
            <p className="text-xs text-secondary-text mb-2 max-w-4xl mx-auto">
              <Shield className="inline-block h-3 w-3 mr-1 text-primary" />
              This service facilitates the discovery of publicly available professional profiles. Users are solely responsible for compliance with all applicable third-party platform terms and data protection regulations. Link It Up does not store or process personal information beyond what is necessary to provide the service.
            </p>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="border-t border-border pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div className="text-center sm:text-left order-2 sm:order-1">
              <p className="text-[10px] sm:text-xs text-secondary-text">
                &copy; {currentYear} Link It Up. All rights reserved. "Link It Up" and all associated logos are trademarks of Link It Up Inc.
              </p>
            </div>
            
            <div className="flex justify-center items-center order-1 sm:order-2 mb-4 sm:mb-0">
              <TridentIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary mr-2" />
              <p className="text-xs sm:text-sm text-secondary-text font-bold">Yatra Tatra Sarvatra Shiva</p>
              <TridentIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary ml-2" />
            </div>
            
            <div className="flex items-center justify-center sm:justify-end order-3 mb-2 sm:mb-0">
              <div className="flex space-x-5 sm:space-x-4">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-secondary-text hover:text-accent p-1">
                  <Twitter size={18} />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-secondary-text hover:text-accent p-1">
                  <LinkedInIcon className="h-5 w-5" />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-secondary-text hover:text-accent p-1">
                  <Facebook size={18} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
