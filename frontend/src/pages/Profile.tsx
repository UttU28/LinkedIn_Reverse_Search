import { motion } from 'framer-motion';
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
import { LogOut, User, CreditCard, Clock, Settings, Mail, Phone, Building, CalendarClock, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

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

  // Fetch payment history
  useEffect(() => {
    const fetchPaymentHistory = async () => {
      if (!user?.uid) return;
      
      setIsLoading(true);
      try {
        const response = await axios.get(`http://localhost:3005/payment-history/${user.uid}`);
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
  const usedCredits = userData?.totalSearched || 0;
  
  // Calculate usage percentage out of total allocated
  const totalAllocation = availableCredits + usedCredits;
  const usedPercent = totalAllocation > 0 ? Math.min(100, Math.round((usedCredits / totalAllocation) * 100)) : 0;

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
      return payment.creditsPurchased ? `+${payment.creditsPurchased}` : '0';
    }
    return payment.status === 'failed' ? 'Failed' : payment.status;
  };

  return (
    <div className="min-h-screen flex flex-col grainy-bg">
      <Navbar />
      
      <motion.main 
        className="flex-grow z-10 relative pt-4 sm:pt-6 md:pt-8 pb-12 md:pb-20 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-primary-text">
            My Profile
          </h1>
          <p className="text-secondary-text">Manage your account and preferences</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="border border-border/50 bg-card shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20 border-2 border-primary/20">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-primary/20 text-primary text-xl">
                        {userData?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-2xl font-heading">{userData?.name || 'User'}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Mail className="h-4 w-4 mr-1" /> {userData?.email || 'user@example.com'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge variant="outline" className="text-xs px-3 py-1 bg-primary/10 text-primary border-primary/20 whitespace-nowrap">
                      {usedCredits > 50 ? 'Power User' : 'Basic User'}
                    </Badge>
                    <Badge variant="outline" className="text-xs px-3 py-1 bg-accent/10 text-accent border-accent/20 whitespace-nowrap">
                      Member since {userData?.createdAt ? formatDate(userData.createdAt) : 'Recently'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <Separator />
              
              <CardContent className="pt-6">
                {/* Profile Section */}
                <div className="mb-8">
                  <div className="flex items-center mb-6">
                    <User className="h-5 w-5 mr-2 text-primary" />
                    <h2 className="text-xl font-heading font-medium text-primary-text">Profile Information</h2>
                  </div>
                
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-secondary-text mb-1">Full Name</h3>
                        <p className="text-primary-text font-medium">{userData?.name || 'User'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-secondary-text mb-1">Username</h3>
                        <p className="text-primary-text font-medium">@{userData?.username || 'username'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-secondary-text mb-1">Email Address</h3>
                        <p className="text-primary-text font-medium">{userData?.email || 'user@example.com'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-secondary-text mb-1">Member Since</h3>
                        <p className="text-primary-text font-medium flex items-center">
                          <CalendarClock className="h-4 w-4 mr-1 text-primary/70" />
                          {userData?.createdAt ? formatDate(userData.createdAt) : 'Recently'}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-secondary-text mb-1">Last Login</h3>
                        <p className="text-primary-text font-medium flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-primary/70" />
                          {'Today'}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-secondary-text mb-1">Account Status</h3>
                        <Badge className="bg-success/20 text-success hover:bg-success/30">Active</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4">
                    <Button 
                      variant="outline" 
                      className="flex items-center border-border/80 hover:bg-background/60"
                    >
                      <Settings className="h-4 w-4 mr-2" /> Edit Profile
                    </Button>
                    
                    <Button 
                      variant="destructive" 
                      className="flex items-center bg-destructive/80 hover:bg-destructive"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4 mr-2" /> Sign Out
                    </Button>
                  </div>
                </div>

                {/* Visible Divider */}
                <div className="my-8">
                  <Separator className="mb-2" />
                  <h2 className="text-center text-secondary-text text-sm font-medium">CREDITS AND USAGE</h2>
                  <Separator className="mt-2" />
                </div>
                
                {/* Credits Section */}
                <div>
                  <div className="flex items-center mb-6">
                    <CreditCard className="h-5 w-5 mr-2 text-primary" />
                    <h2 className="text-xl font-heading font-medium text-primary-text">Credits Information</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-card/50 border-border/50">
                      <CardContent className="p-4">
                        <div className="text-3xl font-bold text-primary mb-1">{userData?.linkCredits || 0}</div>
                        <div className="text-sm text-secondary-text">Available Credits</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-card/50 border-border/50">
                      <CardContent className="p-4">
                        <div className="text-3xl font-bold text-primary mb-1">{userData?.totalSearched || 0}</div>
                        <div className="text-sm text-secondary-text">Used Credits</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-card/50 border-border/50">
                      <CardContent className="p-4">
                        <div className="text-3xl font-bold text-primary mb-1">{userData?.totalFound || 0}</div>
                        <div className="text-sm text-secondary-text">Profiles Found</div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-secondary-text">Credit Usage</h3>
                      <span className="text-xs text-secondary-text">{usedCredits} of {totalAllocation} used</span>
                    </div>
                    <Progress value={usedPercent} className="h-2" />
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-md font-medium text-primary-text mb-3">Recent Transactions</h3>
                    <div className="border border-border/50 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-border">
                        <thead className="bg-background/40">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Amount</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-secondary-text uppercase tracking-wider">Credits</th>
                          </tr>
                        </thead>
                        <tbody className="bg-card/30 divide-y divide-border">
                          {isLoading ? (
                            <tr>
                              <td colSpan={3} className="px-4 py-8 text-center">
                                <div className="flex items-center justify-center">
                                  <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
                                  <span className="text-secondary-text">Loading transactions...</span>
                                </div>
                              </td>
                            </tr>
                          ) : paymentHistory.length > 0 ? (
                            paymentHistory.map(payment => (
                              <tr key={payment.id} className="hover:bg-background/30 transition-colors duration-150">
                                <td className="px-4 py-3 text-sm text-secondary-text whitespace-nowrap">
                                  {formatDate(payment.createdAt || payment.timestamp)}
                                </td>
                                <td className="px-4 py-3 text-sm text-primary-text whitespace-nowrap">
                                  {formatAmount(payment)}
                                </td>
                                <td className="px-4 py-3 text-sm text-right whitespace-nowrap font-medium text-success">
                                  {formatCredits(payment)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} className="px-4 py-6 text-center text-secondary-text">
                                No transactions found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-6">
                    <Button 
                      className="flex items-center bg-primary hover:bg-accent-hover mx-auto"
                      onClick={navigateToPricing}
                    >
                      <CreditCard className="h-4 w-4 mr-2" /> Purchase Credits
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Stats Card */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <Card className="border border-border/50 bg-card shadow-sm h-full">
              <CardHeader>
                <CardTitle className="text-xl font-heading">Account Statistics</CardTitle>
                <CardDescription>Your activity and performance</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-secondary-text">Success Rate</h3>
                    <span className="text-primary font-medium">
                      {userData?.totalSearched ? Math.round((userData.totalFound / userData.totalSearched) * 100) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={userData?.totalSearched ? Math.round((userData.totalFound / userData.totalSearched) * 100) : 0} 
                    className="h-2"
                  />
                </div>
                
                <div className="pt-2 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-secondary-text">Profiles Searched</span>
                    <span className="text-primary-text font-medium">{userData?.totalSearched || 0}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-secondary-text">Profiles Found</span>
                    <span className="text-primary-text font-medium">{userData?.totalFound || 0}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-secondary-text">Not Found</span>
                    <span className="text-primary-text font-medium">
                      {userData?.totalSearched ? userData.totalSearched - userData.totalFound : 0}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between pt-2">
                    <span className="text-secondary-text">Account Type</span>
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                      {usedCredits > 50 ? 'Power User' : 'Basic User'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-secondary-text">Recent Credits Added</span>
                    <span className="text-primary-text font-medium">
                      {paymentHistory.length > 0 
                        ? paymentHistory
                            .filter(p => p.status === 'completed' || p.status === 'succeeded')
                            .reduce((total, p) => total + (p.creditsPurchased || 0), 0)
                        : 0}
                    </span>
                  </div>
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