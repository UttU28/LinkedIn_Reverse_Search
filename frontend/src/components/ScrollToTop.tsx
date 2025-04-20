import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * ScrollToTop component that scrolls the window to the top on route changes
 * Add this component at the root of your app or in the layout component
 */
const ScrollToTop = () => {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location]);
  
  return null;
};

export default ScrollToTop; 