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
    <div className="w-full">
      {/* Professional Tab Switch */}
      <div className="flex bg-card-elevated rounded-2xl p-1 mb-8 border border-border-elevated">
        <button
          onClick={() => setActiveTab('login')}
          className={`flex-1 py-3 px-6 rounded-xl text-sm font-medium transition-all duration-200 ${
            activeTab === 'login'
              ? 'bg-primary text-white shadow-lg'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setActiveTab('signup')}
          className={`flex-1 py-3 px-6 rounded-xl text-sm font-medium transition-all duration-200 ${
            activeTab === 'signup'
              ? 'bg-primary text-white shadow-lg'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Create Account
        </button>
      </div>
        
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
              <div className="space-y-3">
                <Label htmlFor="home-login-email" className="text-sm font-medium text-foreground">
                  Email Address
                </Label>
                <Input
                  id="home-login-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={loginForm.emailOrUsername}
                  onChange={(e) => setLoginForm({...loginForm, emailOrUsername: e.target.value})}
                  className={`input-professional ${validationErrors.emailOrUsername || validationErrors.auth ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''}`}
                />
                {validationErrors.emailOrUsername && (
                  <p className="text-sm text-destructive flex items-center space-x-1">
                    <span>⚠️</span>
                    <span>{validationErrors.emailOrUsername}</span>
                  </p>
                )}
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="home-login-password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <Input
                  id="home-login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className={`input-professional ${validationErrors.password || validationErrors.auth ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''}`}
                />
                {validationErrors.password && (
                  <p className="text-sm text-destructive flex items-center space-x-1">
                    <span>⚠️</span>
                    <span>{validationErrors.password}</span>
                  </p>
                )}
              </div>
              
              {validationErrors.auth && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                  <p className="text-sm text-destructive flex items-center space-x-2">
                    <span>⚠️</span>
                    <span>{validationErrors.auth}</span>
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="home-remember-me" 
                    checked={loginForm.rememberMe}
                    onCheckedChange={(checked) => setLoginForm({...loginForm, rememberMe: checked as boolean})}
                    className="border-border-elevated"
                  />
                  <label 
                    htmlFor="home-remember-me" 
                    className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  >
                    Remember me
                  </label>
                </div>
                <a href="#" className="text-sm font-medium text-primary hover:text-primary-hover transition-colors">
                  Forgot password?
                </a>
              </div>
              
              <Button 
                type="submit" 
                className="btn-primary w-full text-base py-4 mt-6"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
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
              <div className="space-y-3">
                <Label htmlFor="home-signup-fullname" className="text-sm font-medium text-foreground">
                  Full Name
                </Label>
                <Input
                  id="home-signup-fullname"
                  type="text"
                  placeholder="Enter your full name"
                  value={signupForm.fullName}
                  onChange={(e) => setSignupForm({...signupForm, fullName: e.target.value})}
                  className={`input-professional ${validationErrors.fullName ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''}`}
                />
                {validationErrors.fullName && (
                  <p className="text-sm text-destructive flex items-center space-x-1">
                    <span>⚠️</span>
                    <span>{validationErrors.fullName}</span>
                  </p>
                )}
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="home-signup-email" className="text-sm font-medium text-foreground">
                  Email Address
                </Label>
                <Input
                  id="home-signup-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
                  className={`input-professional ${validationErrors.email ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''}`}
                />
                {validationErrors.email && (
                  <p className="text-sm text-destructive flex items-center space-x-1">
                    <span>⚠️</span>
                    <span>{validationErrors.email}</span>
                  </p>
                )}
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="home-signup-password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <Input
                  id="home-signup-password"
                  type="password"
                  placeholder="Create a secure password (min. 6 characters)"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({...signupForm, password: e.target.value})}
                  className={`input-professional ${validationErrors.password ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''}`}
                />
                {validationErrors.password && (
                  <p className="text-sm text-destructive flex items-center space-x-1">
                    <span>⚠️</span>
                    <span>{validationErrors.password}</span>
                  </p>
                )}
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="flex items-start space-x-3 p-4 bg-card-elevated rounded-xl border border-border-elevated">
                  <Checkbox 
                    id="home-terms-agree" 
                    checked={signupForm.termsAgreed}
                    onCheckedChange={(checked) => setSignupForm({...signupForm, termsAgreed: checked as boolean})}
                    className={`border-border-elevated ${validationErrors.terms ? 'border-destructive' : ''}`}
                  />
                  <label 
                    htmlFor="home-terms-agree" 
                    className="text-sm text-muted-foreground leading-relaxed"
                  >
                    I agree to the{' '}
                    <a href="#" className="text-primary hover:text-primary-hover font-medium transition-colors">
                      Terms of Service
                    </a>
                    {' '}and{' '}
                    <a href="#" className="text-primary hover:text-primary-hover font-medium transition-colors">
                      Privacy Policy
                    </a>
                  </label>
                </div>
                {validationErrors.terms && (
                  <p className="text-sm text-destructive flex items-center space-x-1">
                    <span>⚠️</span>
                    <span>{validationErrors.terms}</span>
                  </p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="btn-primary w-full text-base py-4 mt-6"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  'Create Account'
                )}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
    </div>
  );
};

export default HomeAuthForm;