import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../hooks/useAuth";
import { motion } from "framer-motion";
import { Check, ArrowRight, CreditCard, AlertTriangle } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

// API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3005";

interface UserData {
  credits?: number;
  uid?: string;
  [key: string]: any;
}

interface PaymentStatusHistory {
  status: string;
  timestamp: string;
  errorMessage: string | null;
}

interface PaymentStatus {
  id: string;
  paymentId: string;
  status: string;
  errorMessage: string | null;
  updatedAt: string;
  createdAt: string;
  statusHistory: PaymentStatusHistory[];
}

const PaymentSuccess = () => {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [pollingCount, setPollingCount] = useState(0);
  
  // Get the session_id from URL params
  const location = useLocation();
  const params = new URLSearchParams(location[0].split("?")[1]);
  const sessionId = params.get("session_id");

  // Function to check payment status
  const checkPaymentStatus = async (paymentId: string) => {
    try {
      const response = await axios.get(`${API_URL}/payment-status/${paymentId}`);
      if (response.data.success) {
        setPaymentStatus(response.data.data);
        return response.data.data.status;
      }
      return null;
    } catch (error) {
      console.error("Error checking payment status:", error);
      return null;
    }
  };

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await axios.get(`${API_URL}/verify-payment/${sessionId}`);
        
        if (response.data.success) {
          setPaymentDetails(response.data.data);
          
          // Update user credits in local state if user is authenticated
          if (isAuthenticated && user) {
            const userData = user as UserData;
            const newCredits = (userData.credits || 0) + parseInt(response.data.data.creditsAdded || 0);
            setUserCredits(newCredits);
          }
          
          // Check initial payment status
          await checkPaymentStatus(sessionId);
          
          toast({
            title: "Payment Successful!",
            description: `Your purchase of ${response.data.data.planName} plan was successful.`,
            variant: "default",
          });
        } else {
          toast({
            title: "Payment Not Complete",
            description: "Your payment has not been completed. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        toast({
          title: "Verification Failed",
          description: "We couldn't verify your payment. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
    
    // Set up polling for payment status updates (every 3 seconds, max 10 times)
    if (sessionId) {
      const pollInterval = setInterval(async () => {
        if (pollingCount >= 10) {
          clearInterval(pollInterval);
          return;
        }
        
        const status = await checkPaymentStatus(sessionId);
        setPollingCount(prev => prev + 1);
        
        // If payment is in a final state, stop polling
        if (status === 'succeeded' || status === 'completed' || status === 'failed') {
          clearInterval(pollInterval);
          
          // Show toast for failed payments
          if (status === 'failed') {
            toast({
              title: "Payment Failed",
              description: "Your payment was not successful. Please try again or contact support.",
              variant: "destructive",
            });
          }
        }
      }, 3005);
      
      // Clean up interval on component unmount
      return () => clearInterval(pollInterval);
    }
  }, [sessionId, isAuthenticated, user, toast, pollingCount]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
        duration: 0.3,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };
  
  // Get payment status display details
  const getStatusDisplay = () => {
    if (!paymentStatus) return { color: "bg-gray-200", text: "Unknown" };
    
    switch (paymentStatus.status) {
      case 'succeeded':
      case 'completed':
        return { color: "bg-green-500", text: "Completed" };
      case 'processing':
        return { color: "bg-blue-500", text: "Processing" };
      case 'requires_action':
        return { color: "bg-yellow-500", text: "Action Required" };
      case 'failed':
        return { color: "bg-red-500", text: "Failed" };
      default:
        return { color: "bg-gray-500", text: "Pending" };
    }
  };
  
  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen flex flex-col grainy-bg">
      <Navbar />

      <motion.main 
        className="flex-grow flex items-center justify-center py-20 px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="max-w-md w-full p-8 bg-card border border-border rounded-xl shadow-lg"
          variants={itemVariants}
        >
          {isLoading ? (
            <div className="flex flex-col items-center py-10">
              <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
              <p className="text-secondary-text">Verifying your payment...</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <div className={`h-16 w-16 ${paymentStatus?.status === 'failed' ? 'bg-red-500/20' : 'bg-primary/20'} rounded-full flex items-center justify-center`}>
                  {paymentStatus?.status === 'failed' ? (
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  ) : (
                    <Check className="h-8 w-8 text-primary" />
                  )}
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-center mb-2">
                {paymentStatus?.status === 'failed' ? 'Payment Failed' : 'Payment Successful!'}
              </h1>
              
              <p className="text-secondary-text text-center mb-6">
                {paymentStatus?.status === 'failed' 
                  ? "Your payment was not successful. Please try again."
                  : isAuthenticated 
                    ? "Your credits have been added to your account."
                    : "Create an account to claim your credits."}
              </p>
              
              {/* Payment Status Badge */}
              {paymentStatus && (
                <div className="flex justify-center mb-4">
                  <div className={`px-3 py-1 rounded-full ${statusDisplay.color} text-white text-xs font-medium`}>
                    {statusDisplay.text}
                  </div>
                </div>
              )}
              
              {paymentDetails && (
                <div className="mb-6 p-4 bg-background rounded-lg border border-border/50">
                  <div className="flex items-center mb-2">
                    <CreditCard className="h-5 w-5 text-primary mr-2" />
                    <h3 className="font-medium">Purchase Details</h3>
                  </div>
                  <div className="space-y-1 text-sm text-secondary-text">
                    <p><span className="font-medium">Plan:</span> {paymentDetails.planName}</p>
                    {paymentDetails.creditsAdded && (
                      <p><span className="font-medium">Credits Added:</span> {paymentDetails.creditsAdded}</p>
                    )}
                    {!isAuthenticated && paymentDetails.totalCredits && (
                      <p><span className="font-medium">Credits to Claim:</span> {paymentDetails.totalCredits}</p>
                    )}
                    
                    {/* Show error message if payment failed */}
                    {paymentStatus?.status === 'failed' && paymentStatus.errorMessage && (
                      <p className="text-red-500 mt-2">
                        <span className="font-medium">Error:</span> {paymentStatus.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  onClick={() => setLocation('/dashboard')}
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                <Link href="/pricing">
                  <Button variant="outline" className="w-full">
                    Back to Pricing
                  </Button>
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </motion.main>

      <Footer />
    </div>
  );
};

export default PaymentSuccess; 