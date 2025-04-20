import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useModalStore } from '../store/modalStore';
import { registerUser, loginUser, logoutUser } from '../lib/firebase';
import { FirebaseError } from 'firebase/app';
import { useToast } from './use-toast';
import { useLocation } from 'wouter';

export const useAuth = () => {
  const { user, userData, loading, fetchUserData } = useAuthStore();
  const { closeModal } = useModalStore();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [, setLocation] = useLocation();

  const validateEmail = (email: string): boolean => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const register = async (
    fullName: string,
    username: string,
    email: string,
    password: string,
    termsAgreed: boolean,
  ) => {
    // Reset validation errors
    setValidationErrors({});
    
    // Validate inputs
    let hasErrors = false;
    const errors: Record<string, string> = {};
    
    if (!fullName.trim()) {
      errors.fullName = 'Full name is required';
      hasErrors = true;
    }
    
    if (!username.trim()) {
      errors.username = 'Username is required';
      hasErrors = true;
    }
    
    if (!email.trim()) {
      errors.email = 'Email is required';
      hasErrors = true;
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
      hasErrors = true;
    }
    
    if (!password.trim()) {
      errors.password = 'Password is required';
      hasErrors = true;
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      hasErrors = true;
    }
    
    if (!termsAgreed) {
      errors.terms = 'You must agree to the Terms of Service and Privacy Policy';
      hasErrors = true;
    }
    
    if (hasErrors) {
      setValidationErrors(errors);
      return false;
    }
    
    // Proceed with registration
    setIsProcessing(true);
    
    try {
      await registerUser(email, password, fullName, username);
      toast({
        title: "Account created",
        description: "Welcome to Link It Up!",
      });
      closeModal();
      await fetchUserData();
      // Manual redirect to dashboard
      setTimeout(() => {
        setLocation('/dashboard');
      }, 500);
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            setValidationErrors({ email: 'This email is already in use' });
            break;
          case 'auth/invalid-email':
            setValidationErrors({ email: 'Invalid email format' });
            break;
          case 'auth/weak-password':
            setValidationErrors({ password: 'Password is too weak' });
            break;
          default:
            toast({
              title: "Registration failed",
              description: error.message,
              variant: "destructive",
            });
        }
      } else {
        toast({
          title: "Registration failed",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      }
      
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const login = async (email: string, password: string) => {
    // Reset validation errors
    setValidationErrors({});
    
    // Validate inputs
    let hasErrors = false;
    const errors: Record<string, string> = {};
    
    if (!email.trim()) {
      errors.emailOrUsername = 'Email is required';
      hasErrors = true;
    } else if (!validateEmail(email)) {
      errors.emailOrUsername = 'Please enter a valid email address';
      hasErrors = true;
    }
    
    if (!password.trim()) {
      errors.password = 'Password is required';
      hasErrors = true;
    }
    
    if (hasErrors) {
      setValidationErrors(errors);
      return false;
    }
    
    // Proceed with login
    setIsProcessing(true);
    
    try {
      await loginUser(email, password);
      toast({
        title: "Welcome back!",
        description: "You're now logged in",
      });
      closeModal();
      await fetchUserData();
      // Manual redirect to dashboard
      setTimeout(() => {
        setLocation('/dashboard');
      }, 500);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            setValidationErrors({ 
              auth: 'Invalid email or password' 
            });
            break;
          case 'auth/invalid-email':
            setValidationErrors({ 
              emailOrUsername: 'Invalid email format' 
            });
            break;
          case 'auth/too-many-requests':
            setValidationErrors({ 
              auth: 'Too many failed login attempts. Please try again later.' 
            });
            break;
          default:
            toast({
              title: "Login failed",
              description: error.message,
              variant: "destructive",
            });
        }
      } else {
        toast({
          title: "Login failed",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      }
      
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      toast({
        title: "Logged out",
        description: "You've been logged out successfully",
      });
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "Failed to log out",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    user,
    userData,
    loading,
    isProcessing,
    validationErrors,
    register,
    login,
    logout,
    isAuthenticated: !!user,
  };
};
