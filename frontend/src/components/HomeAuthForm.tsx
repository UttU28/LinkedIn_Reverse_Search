import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';

const HomeAuthForm: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
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
    username: '',
    email: '',
    password: '',
    termsAgreed: false
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(loginForm.emailOrUsername, loginForm.password);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register(
      signupForm.fullName,
      signupForm.username,
      signupForm.email,
      signupForm.password,
      signupForm.termsAgreed
    );
  };

  const formVariants = {
    hidden: { 
      opacity: 0,
      x: activeTab === 'login' ? -20 : 20
    },
    visible: { 
      opacity: 1,
      x: 0,
      transition: { 
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0,
      x: activeTab === 'login' ? 20 : -20,
      transition: { 
        duration: 0.2,
        ease: "easeIn"
      }
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-lg overflow-hidden">
      <div className="p-4 sm:p-6">
        <h2 className="text-xl font-heading font-semibold text-primary-text mb-6">
          {activeTab === 'login' ? 'Log in to your account' : 'Create an account'}
        </h2>
        
        <AnimatePresence mode="wait">
          {activeTab === 'login' ? (
            <motion.form 
              key="login-form"
              onSubmit={handleLoginSubmit} 
              className="space-y-4"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={formVariants}
            >
              <div className="space-y-2">
                <Label htmlFor="home-login-email">Email</Label>
                <Input
                  id="home-login-email"
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
                <Label htmlFor="home-login-password">Password</Label>
                <Input
                  id="home-login-password"
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
                    id="home-remember-me" 
                    checked={loginForm.rememberMe}
                    onCheckedChange={(checked) => setLoginForm({...loginForm, rememberMe: checked as boolean})}
                  />
                  <label 
                    htmlFor="home-remember-me" 
                    className="text-xs sm:text-sm text-secondary-text cursor-pointer"
                  >
                    Remember me
                  </label>
                </div>
                <a href="#" className="text-xs sm:text-sm font-medium text-primary hover:text-primary-hover">
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
            </motion.form>
          ) : (
            <motion.form 
              key="signup-form"
              onSubmit={handleSignupSubmit} 
              className="space-y-4"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={formVariants}
            >
              <div className="space-y-2">
                <Label htmlFor="home-signup-fullname">Full Name</Label>
                <Input
                  id="home-signup-fullname"
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
                <Label htmlFor="home-signup-username">Username</Label>
                <Input
                  id="home-signup-username"
                  type="text"
                  placeholder="Choose a username"
                  value={signupForm.username}
                  onChange={(e) => setSignupForm({...signupForm, username: e.target.value})}
                  className={validationErrors.username ? 'border-destructive' : ''}
                />
                {validationErrors.username && (
                  <p className="text-sm text-destructive">{validationErrors.username}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="home-signup-email">Email</Label>
                <Input
                  id="home-signup-email"
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
                <Label htmlFor="home-signup-password">Password</Label>
                <Input
                  id="home-signup-password"
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
                    id="home-terms-agree" 
                    checked={signupForm.termsAgreed}
                    onCheckedChange={(checked) => setSignupForm({...signupForm, termsAgreed: checked as boolean})}
                    className={validationErrors.terms ? 'border-destructive' : ''}
                  />
                  <label 
                    htmlFor="home-terms-agree" 
                    className="text-xs sm:text-sm text-secondary-text"
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
            </motion.form>
          )}
        </AnimatePresence>
      </div>
      
      <div className="bg-background/50 px-4 sm:px-6 py-4 text-center">
        {activeTab === 'login' ? (
          <p className="text-secondary-text text-sm">
            New here? <button 
              onClick={() => setActiveTab('signup')} 
              className="text-primary hover:text-primary-hover hover:underline font-medium"
            >
              Sign up
            </button>
          </p>
        ) : (
          <p className="text-secondary-text text-sm">
            Already have an account? <button 
              onClick={() => setActiveTab('login')} 
              className="text-primary hover:text-primary-hover hover:underline font-medium"
            >
              Log in
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default HomeAuthForm;