import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { Mail, Phone, MapPin, MessageSquare, User, Building, Send, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  company: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const Contact = () => {
  const { user, userData } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      message: "",
    },
  });
  
  // Auto-fill form with user data if logged in
  useEffect(() => {
    if (userData) {
      form.setValue('name', userData.name || '');
      form.setValue('email', userData.email || '');
    }
  }, [userData, form]);

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Create a new document in the messages collection
      const messageData = {
        name: data.name,
        email: data.email,
        company: data.company || null,
        message: data.message,
        userId: user?.uid || null, // Include user ID if available
        timestamp: serverTimestamp(),
        status: 'new',
      };
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'messages'), messageData);
      
      console.log("Message submitted with ID:", docRef.id);
      
      toast({
        title: "Message sent!",
        description: "Thank you! We'll get back to you as soon as possible.",
        variant: "default"
      });
      
      // Reset form
      form.reset();
      
      // If user is logged in, restore their data in the form after reset
      if (userData) {
        setTimeout(() => {
          form.setValue('name', userData.name || '');
          form.setValue('email', userData.email || '');
        }, 100);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error sending message",
        description: "There was a problem sending your message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
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
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen flex flex-col grainy-bg">
      <Navbar />
      
      <motion.main 
        className="flex-grow z-10 relative pt-16 pb-20 px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <motion.div 
            className="text-center mb-16"
            variants={itemVariants}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-primary-text mb-6 leading-tight">
              Get in <span className="text-primary">Touch</span>
            </h1>
            <p className="text-xl text-secondary-text max-w-3xl mx-auto">
              Have questions about our platform or need help with your account? Our team is ready to assist you.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-20">
            {/* Contact Information */}
            <motion.div
              className="lg:col-span-1"
              variants={itemVariants}
            >
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-heading font-semibold text-primary-text mb-4">Contact Information</h2>
                  <p className="text-secondary-text mb-6">
                    Reach out to us directly through any of these channels:
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Mail className="h-5 w-5 text-primary mt-1 shrink-0 mr-3" />
                      <div>
                        <h3 className="text-lg font-medium text-primary-text">Email</h3>
                        <p className="text-secondary-text">support@linkitup.com</p>
                        <p className="text-secondary-text">sales@linkitup.com</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Phone className="h-5 w-5 text-primary mt-1 shrink-0 mr-3" />
                      <div>
                        <h3 className="text-lg font-medium text-primary-text">Phone</h3>
                        <p className="text-secondary-text">+1 (800) 555-1234</p>
                        <p className="text-xs text-secondary-text">Monday-Friday, 9am-5pm PT</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-primary mt-1 shrink-0 mr-3" />
                      <div>
                        <h3 className="text-lg font-medium text-primary-text">Address</h3>
                        <p className="text-secondary-text">Link It Up, Inc.</p>
                        <p className="text-secondary-text">123 Tech Plaza, Suite 500</p>
                        <p className="text-secondary-text">San Francisco, CA 94103</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4">
                  <p className="text-sm text-secondary-text">
                    For urgent support outside of business hours, please email <span className="text-primary">urgent@linkitup.com</span>
                  </p>
                </div>
              </div>
            </motion.div>
            
            {/* Contact Form */}
            <motion.div 
              className="lg:col-span-2"
              variants={itemVariants}
            >
              <Card className="border border-border/50">
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-heading font-semibold text-primary-text mb-6">Send us a Message</h2>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center">
                                <User className="h-4 w-4 mr-2 text-primary/70" />
                                Your Name
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center">
                                <Mail className="h-4 w-4 mr-2 text-primary/70" />
                                Email
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              <Building className="h-4 w-4 mr-2 text-primary/70" />
                              Company (Optional)
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your company name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              <MessageSquare className="h-4 w-4 mr-2 text-primary/70" />
                              Message
                            </FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="How can we help you?"
                                className="min-h-32"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Please provide as much detail as possible so we can better assist you.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          
          {/* FAQ Section */}
          <motion.div variants={itemVariants} className="text-center mb-8">
            <h2 className="text-3xl font-heading font-semibold text-primary-text mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-secondary-text max-w-3xl mx-auto">
              Can't find the answer you're looking for? Please contact us directly.
            </p>
          </motion.div>
          
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16"
          >
            <div className="bg-card/50 border border-border/50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-primary-text mb-2">
                How do I get started with the platform?
              </h3>
              <p className="text-secondary-text">
                Simply sign up for an account, choose a subscription plan, and you can immediately start using our services to find LinkedIn profiles.
              </p>
            </div>
            
            <div className="bg-card/50 border border-border/50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-primary-text mb-2">
                Can I upload a CSV file with multiple contacts?
              </h3>
              <p className="text-secondary-text">
                Yes, our platform supports bulk uploads. You can upload a CSV or Excel file with multiple entries and we'll process them all at once.
              </p>
            </div>
            
            <div className="bg-card/50 border border-border/50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-primary-text mb-2">
                How accurate is your LinkedIn profile matching?
              </h3>
              <p className="text-secondary-text">
                Our AI-powered matching system typically achieves over 90% accuracy when provided with accurate name, company, and position information.
              </p>
            </div>
            
            <div className="bg-card/50 border border-border/50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-primary-text mb-2">
                Do you offer enterprise solutions?
              </h3>
              <p className="text-secondary-text">
                Yes, we offer customized enterprise solutions for larger organizations. Please contact our sales team at sales@linkitup.com to discuss your specific requirements.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.main>
      
      <Footer />
    </div>
  );
};

export default Contact;