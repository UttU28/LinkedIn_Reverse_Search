import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col grainy-bg bg-background">
      <Navbar />
      
      <motion.div 
        className="flex-grow flex items-center justify-center px-4 py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md border border-border/50 shadow-md bg-card">
          <CardContent className="pt-8 pb-6">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              
              <h1 className="text-3xl font-heading font-bold text-primary-text mb-2">
                404
              </h1>
              
              <p className="text-xl font-medium text-primary-text mb-4">
                Page Not Found
              </p>
              
              <p className="text-secondary-text mb-8">
                The page you're looking for doesn't exist or has been moved.
              </p>
              
              <Button 
                onClick={() => navigate("/")}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <Footer />
    </div>
  );
}
