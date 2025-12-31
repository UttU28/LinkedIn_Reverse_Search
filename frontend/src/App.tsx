import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { useAuthStore } from "./store/authStore";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/not-found";
import Profile from "./pages/Profile";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import FAQ from "./pages/FAQ";
import AboutUs from "./pages/AboutUs";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import PaymentSuccess from "./pages/PaymentSuccess";
import Marketing from "./pages/Marketing";
import { Loader2 } from "lucide-react";
import ScrollToTop from "./components/ScrollToTop";

// Protected route component
const ProtectedRoute = ({ component: Component }: { component: React.ComponentType<any> }) => {
  const { user } = useAuthStore();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (!user) {
      // Redirect to home if not authenticated
      setLocation("/");
    }
  }, [user, setLocation]);
  
  // If user is authenticated, render the component
  // If not, this will redirect via the useEffect above
  return <Component />;
};

function App() {
  const { user, initialized } = useAuthStore();
  const [location, setLocation] = useLocation();

  // Redirect based on auth state
  useEffect(() => {
    if (!initialized) return;
    
    // List of routes that require authentication
    const protectedRoutes = ["/dashboard", "/profile"];
    
    // Check if current location is a protected route
    if (!user && protectedRoutes.includes(location)) {
      setLocation("/");
    }
  }, [user, location, initialized, setLocation]);

  // Show loading state while auth is initializing
  if (!initialized) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="mt-4 text-primary-text">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app grainy-bg bg-background">
      <ScrollToTop />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard">
          {() => <ProtectedRoute component={Dashboard} />}
        </Route>
        <Route path="/profile">
          {() => <ProtectedRoute component={Profile} />}
        </Route>
        <Route path="/features" component={Features} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/faq" component={FAQ} />
        <Route path="/about" component={AboutUs} />
        <Route path="/contact" component={Contact} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route path="/marketing" component={Marketing} />
        <Route path="/payment-success" component={PaymentSuccess} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

export default App;
