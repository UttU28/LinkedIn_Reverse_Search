import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, CreditCard, Clock, Settings, Mail, Phone, Building, CalendarClock, Loader2, Copy, Check } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

// API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3008";

// Define the payment history interface
interface PaymentHistory {
  id: string;
  userId: string;
  creditsPurchased: number;
  amountUSD: number;
  planName: string;
  paymentProvider: string;
  status: string;
  paymentId: string;
  createdAt: any; // Use any for Timestamp compatibility
  timestamp?: any; // Use any for Timestamp compatibility
}

const Profile = () => {
  const { user, userData } = useAuthStore();
  const { logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
  const [isAvatarClicked, setIsAvatarClicked] = useState(false);
  
  // Animation reset timeout
  useEffect(() => {
    if (isAvatarClicked) {
      const timeout = setTimeout(() => {
        setIsAvatarClicked(false);
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [isAvatarClicked]);

  // Fetch payment history
  useEffect(() => {
    const fetchPaymentHistory = async () => {
      if (!user?.uid) return;
      
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_URL}/payment-history/${user.uid}`);
        if (response.data.success) {
          setPaymentHistory(response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching payment history:', error);
        toast({
          title: 'Error',
          description: 'Could not load payment history',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentHistory();
  }, [user?.uid]);

  // Handle Copy Payment ID
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedId(text);
        setTimeout(() => setCopiedId(null), 2000);
        toast({
          title: "Copied!",
          description: "Payment ID copied to clipboard",
          duration: 2000,
        });
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
        toast({
          title: "Error",
          description: "Failed to copy to clipboard",
          variant: "destructive",
        });
      });
  };

  const handleSignOut = async () => {
    const success = await logout();
    if (success) {
      setLocation('/');
    }
  };

  const navigateToPricing = () => {
    setLocation('/pricing');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  // Calculate credit metrics
  const availableCredits = userData?.linkCredits || 0;
  
  // Calculate total credits purchased from all successful transactions
  const totalCreditsPurchased = paymentHistory
    .filter(payment => payment.status === 'completed' || payment.status === 'succeeded')
    .reduce((sum, payment) => sum + (payment.creditsPurchased || 0), 0);
  
  // Calculate used credits as difference between total purchased and current available
  const usedCredits = Math.max(0, totalCreditsPurchased - availableCredits);
  
  // Calculate usage percentage out of total purchased
  const usedPercent = totalCreditsPurchased > 0 ? Math.min(100, Math.round((usedCredits / totalCreditsPurchased) * 100)) : 0;

  // Format date for display
  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'N/A';
    // Handle both string dates and Firestore timestamps
    const date = typeof dateValue === 'string' 
      ? new Date(dateValue) 
      : dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get transaction description based on status
  const getTransactionDescription = (payment: PaymentHistory) => {
    if (payment.status === 'completed' || payment.status === 'succeeded') {
      return `${payment.planName} purchase`;
    }
    return payment.status === 'failed' ? 'Payment failed' : `Payment ${payment.status}`;
  };

  // Format amount for display (USD)
  const formatAmount = (payment: PaymentHistory) => {
    return payment.amountUSD ? `$${payment.amountUSD.toFixed(2)}` : 'N/A';
  };

  // Format credits for display
  const formatCredits = (payment: PaymentHistory) => {
    if (payment.status === 'completed' || payment.status === 'succeeded') {
      return payment.creditsPurchased ? `+ ₹ ${payment.creditsPurchased}` : '0';
    }
    return payment.status === 'failed' ? 'Failed' : payment.status;
  };

  return (
    <div className="min-h-screen flex flex-col grainy-bg">
      <Navbar />
      
      <motion.main 
        className="flex-grow z-10 relative pt-3 pb-8 px-3 sm:px-5 max-w-5xl mx-auto w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary-text">
            My Profile
          </h1>
          <p className="text-secondary-text text-sm">Manage your account and preferences</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4">
          {/* Profile Information */}
          <motion.div variants={itemVariants}>
            <Card className="border border-border/50 bg-card shadow-sm overflow-hidden">
              <CardHeader className="pb-3 px-4 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <motion.div
                      initial={{ scale: 1 }}
                      animate={{ 
                        scale: isAvatarClicked ? 1.1 : [0.98, 1.02, 0.98],
                        rotate: isAvatarClicked ? [0, -10, 10, -5, 5, 0] : [0, 1, 0, -1, 0],
                        y: isAvatarClicked ? 0 : [0, -2, 0]
                      }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 400, 
                        damping: 15,
                        rotate: { duration: 5, repeat: Infinity, repeatType: "mirror" },
                        scale: { duration: 3, repeat: Infinity, repeatType: "mirror" },
                        y: { duration: 2.5, repeat: Infinity, repeatType: "mirror" }
                      }}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setIsAvatarClicked(true)}
                      className="cursor-pointer"
                    >
                      <Avatar className="h-16 w-16 relative overflow-visible">
                        <motion.div
                          className="absolute inset-0"
                          animate={{ 
                            opacity: [0.1, 0.3, 0.1], 
                            scale: [1, 1.15, 1]
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
                          id="profileAvatar"
                          src={`https://api.dicebear.com/7.x/bottts/svg?seed=${userData?.email || 'default'}`} 
                          alt={userData?.name || 'User'}
                        />
                        <AvatarFallback className="bg-primary/20 text-primary text-lg">
                          {userData?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                    <div>
                      <CardTitle className="text-xl font-heading">{userData?.name || 'User'}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Mail className="h-3.5 w-3.5 mr-1" /> {userData?.email || 'user@example.com'}
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="flex items-center bg-red-600 hover:bg-red-700 text-white font-bold border-2 border-red-600"
                    onClick={handleSignOut}
                    size="sm"
                  >
                    <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign Out
                  </Button>
                </div>
              </CardHeader>
              
              <Separator />
              
              <CardContent className="pt-4 px-4 pb-4">
                {/* Credits Section */}
                <div>
                  <div className="flex items-center mb-3">
                    <CreditCard className="h-4 w-4 mr-2 text-primary" />
                    <h2 className="text-base font-heading font-medium text-primary-text">Credits Information</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-sm overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-sm text-secondary-text mb-1">Available Credits</span>
                              <span className="text-3xl font-bold text-primary">₹ {userData?.linkCredits || 0}</span>
                            </div>
                            <div className="bg-primary/10 p-2 rounded-full">
                              <CreditCard className="h-5 w-5 text-primary" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20 shadow-sm overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-sm text-secondary-text mb-1">Used Credits</span>
                              <span className="text-3xl font-bold text-purple-500">₹ {usedCredits}</span>
                            </div>
                            <div className="bg-purple-500/10 p-2 rounded-full">
                              <Clock className="h-5 w-5 text-purple-500" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20 shadow-sm overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-sm text-secondary-text mb-1">Total Credits Purchased</span>
                              <span className="text-3xl font-bold text-green-500">₹ {totalCreditsPurchased || 0}</span>
                            </div>
                            <div className="bg-green-500/10 p-2 rounded-full">
                              <User className="h-5 w-5 text-green-500" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    </div>
                  </div>
                  
                  <motion.div 
                    className="mt-6 bg-card/40 p-4 rounded-lg border border-border/50"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-primary-text">Credit Usage</h3>
                      <Badge variant="outline" className="bg-background/50">
                        ₹ {usedCredits} of ₹ {totalCreditsPurchased} used
                      </Badge>
                    </div>
                    <Progress value={usedPercent} className="h-2.5 rounded-full" 
                      style={{
                        background: 'linear-gradient(to right, rgba(var(--background), 0.4), rgba(var(--background), 0.1))'
                      }}
                    />
                    <div className="mt-1 flex justify-between text-xs text-secondary-text">
                      <span>0%</span>
                      <span>{usedPercent}% used</span>
                      <span>100%</span>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="mt-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-primary-text flex items-center">
                        <CalendarClock className="h-4 w-4 mr-1.5" />
                        Recent Transactions
                      </h3>
                      <Badge variant="outline" className="text-xs bg-primary/5">
                        {paymentHistory.length} transactions
                      </Badge>
                    </div>
                    <div className="border border-border/50 rounded-lg overflow-hidden shadow-sm">
                      <table className="min-w-full divide-y divide-border">
                        <thead className="bg-background/40">
                          <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Date</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Amount</th>
                            <th className="px-4 py-2.5 text-right text-xs font-medium text-secondary-text uppercase tracking-wider">Credits</th>
                            <th className="px-4 py-2.5 text-right text-xs font-medium text-secondary-text uppercase tracking-wider">Payment ID</th>
                          </tr>
                        </thead>
                        <tbody className="bg-card/30 divide-y divide-border">
                          {isLoading ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-4 text-center">
                                <div className="flex items-center justify-center">
                                  <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
                                  <span className="text-secondary-text">Loading transactions...</span>
                                </div>
                              </td>
                            </tr>
                          ) : paymentHistory.length > 0 ? (
                            paymentHistory.map((payment, index) => (
                              <motion.tr 
                                key={payment.id} 
                                className="hover:bg-background/30 transition-colors duration-150"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + (index * 0.05) }}
                              >
                                <td className="px-4 py-3 text-sm text-secondary-text whitespace-nowrap">
                                  {formatDate(payment.createdAt || payment.timestamp)}
                                </td>
                                <td className="px-4 py-3 text-sm text-primary-text whitespace-nowrap font-medium">
                                  {formatAmount(payment)}
                                </td>
                                <td className="px-4 py-3 text-sm text-right whitespace-nowrap font-medium text-success">
                                  {formatCredits(payment)}
                                </td>
                                <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                                  {payment.paymentId ? (
                                    <div className="flex items-center justify-end">
                                      <span 
                                        className="text-secondary-text font-mono cursor-pointer hover:text-primary-text"
                                        title={payment.paymentId}
                                      >
                                        {'...' + payment.paymentId.substring(payment.paymentId.length - 8)}
                                      </span>
                                      <motion.button
                                        onClick={() => copyToClipboard(payment.paymentId)}
                                        className="ml-2 text-secondary-text hover:text-primary focus:outline-none"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        title="Copy payment ID"
                                      >
                                        {copiedId === payment.paymentId ? (
                                          <Check className="h-4 w-4 text-success" />
                                        ) : (
                                          <Copy className="h-4 w-4" />
                                        )}
                                      </motion.button>
                                    </div>
                                  ) : (
                                    <span className="text-secondary-text">N/A</span>
                                  )}
                                </td>
                              </motion.tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-4 py-6 text-center">
                                <div className="flex flex-col items-center justify-center text-secondary-text">
                                  <CreditCard className="h-8 w-8 mb-2 opacity-20" />
                                  <p>No transactions found</p>
                                  <p className="text-xs mt-1">Purchase credits to see your transactions here</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="flex justify-center pt-6"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      className="flex items-center bg-primary hover:bg-primary/90 text-white shadow-md px-6"
                      onClick={navigateToPricing}
                    >
                      <CreditCard className="h-4 w-4 mr-2" /> Purchase Credits
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.main>
      
      <Footer />
    </div>
  );
};

export default Profile;