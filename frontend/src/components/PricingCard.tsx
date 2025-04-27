import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { loadStripe } from '@stripe/stripe-js';

// Load the Stripe publishable key from environment variables
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
// API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3008";

interface PricingCardProps {
  plan: {
    name: string;
    description: string;
    price: number;
    credits: number;
    bonusCredits?: number;
    buttonText: string;
    color: string;
    accent: string;
    cardChip: string;
  };
  index: number;
  onButtonClick: (planName: string) => void;
  isAuthenticated?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, index, onButtonClick, isAuthenticated = false }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  // Generates a unique pattern of dots for the chip
  const generateChipPattern = () => {
    return Array(4).fill(0).map((_, i) => (
      <div key={i} className="w-1 h-1 bg-white/30 rounded-full"></div>
    ));
  };

  const handleBuyNowClick = async () => {
    const totalCredits = plan.credits + (plan.bonusCredits || 0);
    
    // Log plan details to console
    console.log({
      planName: plan.name,
      price: plan.price,
      credits: plan.credits,
      bonusCredits: plan.bonusCredits || 0,
      totalCredits: totalCredits
    });
    
    if (!isAuthenticated) {
      // If not logged in, inform user they need to sign in
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase credits.",
        variant: "default",
      });
      onButtonClick(plan.name);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create a checkout session
      const response = await axios.post(`${API_URL}/create-checkout-session`, {
        planName: plan.name,
        price: plan.price,
        credits: plan.credits,
        bonusCredits: plan.bonusCredits || 0,
        userId: user?.uid || null
      });
      
      // Load Stripe
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }
      
      // Redirect to Stripe checkout
      const result = await stripe.redirectToCheckout({
        sessionId: response.data.sessionId,
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Checkout Failed",
        description: "There was an error starting the checkout process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      variants={itemVariants}
      className="relative"
    >
      {/* Card Container with metallic effect */}
      <div className="relative h-full rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
        {/* Metallic background with subtle gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${plan.color} opacity-80`}></div>
        
        {/* Light reflection overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50 pointer-events-none"></div>
        
        {/* Card content */}
        <div className="relative h-full p-8 flex flex-col">
          {/* Apple card style chip */}
          <div className="absolute top-8 left-8">
            <div className={`w-12 h-8 rounded-md bg-gradient-to-br ${plan.accent} flex flex-wrap justify-center items-center gap-1 p-1`}>
              {generateChipPattern()}
            </div>
          </div>
          
          {/* Card issuer (top right) */}
          <div className="absolute top-8 right-8 font-medium tracking-wide text-white/70 text-sm uppercase">
            GET MORE !!
          </div>

          {/* Card number (middle) */}
          <div className="mt-16 mb-3 text-white/90 font-mono tracking-widest text-base opacity-80">
            **** **** **** {1000 + index * 1234}
          </div>
          
          {/* Name and validity (like Apple Card) */}
          <div className="mt-auto">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="text-xl font-medium text-white opacity-90 uppercase tracking-wide">{plan.name}</h3>
                {/* <p className="text-sm text-white/70 mt-1 tracking-wide">{plan.description}</p> */}
              </div>
              <div className="text-right">
                {/* <p className="text-xs text-white/70 mb-1 uppercase tracking-wide">Price</p> */}
                <p className="text-3xl font-light text-white">${plan.price}</p>
              </div>
            </div>
            
            {/* Credit information in Apple Card style */}
            <div className="flex justify-between items-center border-t border-white/10 pt-4">
              <div className="text-white/90">
                <span className="text-2xl font-light">
                  ₹ {plan.credits}
                  {plan.bonusCredits && (
                    <span className="text-white/70 ml-2 text-base">+{plan.bonusCredits}</span>
                  )}
                </span>
                <span className="text-xs text-white/70 ml-2 uppercase tracking-wide">Credits</span>
              </div>
              <button 
                className={`py-2 px-4 rounded-lg bg-white/10 backdrop-blur-sm text-white text-sm flex items-center justify-center hover:bg-white/20 transition-colors relative z-10 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={handleBuyNowClick}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></span>
                    Processing...
                  </>
                ) : (
                  <>
                Buy Now
                <ChevronRight className="ml-1 h-3 w-3" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Subtle shine effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
      </div>
    </motion.div>
  );
};

export default PricingCard; 