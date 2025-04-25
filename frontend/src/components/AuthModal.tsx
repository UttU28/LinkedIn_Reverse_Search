import { useState, useEffect } from 'react';
import { useModalStore } from '../store/modalStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { X } from 'lucide-react';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const modalVariants = {
  hidden: { 
    opacity: 0,
    y: -20,
    scale: 0.95
  },
  visible: { 
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { 
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

const AuthModal: React.FC = () => {
  const { activeModal, authTab, closeModal, setAuthTab } = useModalStore();
  const { 
    login, 
    register, 
    isProcessing, 
    validationErrors 
  } = useAuth();

  // Form state
  const [loginForm, setLoginForm] = useState({
    emailOrUsername: '',
    password: '',
    rememberMe: false
  });

  const [signupForm, setSignupForm] = useState({
    fullName: '',
    email: '',
    password: '',
    termsAgreed: false
  });

  // Reset form state when modal opens/closes
  useEffect(() => {
    if (activeModal !== 'auth') {
      // Reset forms with timeout to avoid visual jank when closing
      setTimeout(() => {
        setLoginForm({
          emailOrUsername: '',
          password: '',
          rememberMe: false
        });
        
        setSignupForm({
          fullName: '',
          email: '',
          password: '',
          termsAgreed: false
        });
      }, 300);
    }
  }, [activeModal]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(loginForm.emailOrUsername, loginForm.password);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register(
      signupForm.fullName,
      signupForm.email,
      signupForm.password,
      signupForm.termsAgreed
    );
  };

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Close modal when clicking outside content area
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  // Early return if modal is not active
  if (activeModal !== 'auth') return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={backdropVariants}
        onClick={handleOutsideClick}
      >
        <div className="fixed inset-0 bg-background/75 backdrop-blur-sm" aria-hidden="true" />
        
        <motion.div 
          className="relative bg-card rounded-lg max-w-md w-full mx-4 overflow-hidden shadow-xl border border-border"
          variants={modalVariants}
        >
          <div className="p-6">
            {/* Tabs */}
            <div className="flex border-b border-border mb-6">
              <button 
                className={`px-4 py-2 font-medium ${authTab === 'login' ? 'text-primary-text border-b-2 border-primary' : 'text-secondary-text hover:text-primary-text'}`}
                onClick={() => setAuthTab('login')}
              >
                Login
              </button>
              <button 
                className={`px-4 py-2 font-medium ${authTab === 'signup' ? 'text-primary-text border-b-2 border-primary' : 'text-secondary-text hover:text-primary-text'}`}
                onClick={() => setAuthTab('signup')}
              >
                Sign Up
              </button>
              
              <button
                className="ml-auto text-secondary-text hover:text-primary-text"
                onClick={closeModal}
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Login Form */}
            {authTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email address"
                    value={loginForm.emailOrUsername}
                    onChange={(e) => setLoginForm({...loginForm, emailOrUsername: e.target.value})}
                    className={validationErrors.emailOrUsername || validationErrors.auth ? 'border-destructive' : ''}
                  />
                  {validationErrors.emailOrUsername && (
                    <p className="text-sm text-destructive">{validationErrors.emailOrUsername}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    className={validationErrors.password || validationErrors.auth ? 'border-destructive' : ''}
                  />
                  {validationErrors.password && (
                    <p className="text-sm text-destructive">{validationErrors.password}</p>
                  )}
                </div>
                
                {validationErrors.auth && (
                  <p className="text-sm text-destructive">{validationErrors.auth}</p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember-me" 
                      checked={loginForm.rememberMe}
                      onCheckedChange={(checked) => setLoginForm({...loginForm, rememberMe: checked as boolean})}
                    />
                    <label 
                      htmlFor="remember-me" 
                      className="text-sm text-secondary-text cursor-pointer"
                    >
                      Remember me
                    </label>
                  </div>
                  <a href="#" className="text-sm font-medium text-primary hover:text-primary-hover">
                    Forgot password?
                  </a>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-accent-hover text-primary-text font-medium"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            )}
            
            {/* Signup Form */}
            {authTab === 'signup' && (
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-fullname">Full Name</Label>
                  <Input
                    id="signup-fullname"
                    type="text"
                    placeholder="Enter your full name"
                    value={signupForm.fullName}
                    onChange={(e) => setSignupForm({...signupForm, fullName: e.target.value})}
                    className={validationErrors.fullName ? 'border-destructive' : ''}
                  />
                  {validationErrors.fullName && (
                    <p className="text-sm text-destructive">{validationErrors.fullName}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
                    className={validationErrors.email ? 'border-destructive' : ''}
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-destructive">{validationErrors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password (min. 6 characters)"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({...signupForm, password: e.target.value})}
                    className={validationErrors.password ? 'border-destructive' : ''}
                  />
                  {validationErrors.password && (
                    <p className="text-sm text-destructive">{validationErrors.password}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="terms-agree" 
                      checked={signupForm.termsAgreed}
                      onCheckedChange={(checked) => setSignupForm({...signupForm, termsAgreed: checked as boolean})}
                      className={validationErrors.terms ? 'border-destructive' : ''}
                    />
                    <label 
                      htmlFor="terms-agree" 
                      className="text-sm text-secondary-text"
                    >
                      I agree to the <a href="#" className="text-primary hover:text-primary-hover">Terms of Service</a> and <a href="#" className="text-primary hover:text-primary-hover">Privacy Policy</a>
                    </label>
                  </div>
                  {validationErrors.terms && (
                    <p className="text-sm text-destructive">{validationErrors.terms}</p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-accent-hover text-primary-text font-medium"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Creating Account...' : 'Create Account & Continue to Login'}
                </Button>
              </form>
            )}
          </div>
          
          <div className="bg-background/50 px-6 py-4 flex justify-end">
            <Button 
              variant="outline" 
              onClick={closeModal}
            >
              Close
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;
