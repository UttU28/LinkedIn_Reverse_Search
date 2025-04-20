import { Link } from 'wouter';
import { Link2, Twitter, Linkedin, Facebook } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-card/50 border-t border-border py-8 px-4 sm:px-6 lg:px-8 z-10 relative">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-heading font-semibold text-lg text-primary-text mb-4 flex items-center">
              <Link2 className="h-5 w-5 mr-2 text-accent" />
              Link It Up
            </h3>
            <p className="text-secondary-text text-sm">Your AI-powered LinkedIn profile finder that saves hours of manual searching.</p>
          </div>
          <div>
            <h4 className="font-heading font-medium text-primary-text mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/features" className="text-secondary-text hover:text-accent">Features</Link></li>
              <li><Link href="/pricing" className="text-secondary-text hover:text-accent">Pricing</Link></li>
              <li><Link href="/faq" className="text-secondary-text hover:text-accent">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-medium text-primary-text mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-secondary-text hover:text-accent">About Us</Link></li>
              <li><Link href="/contact" className="text-secondary-text hover:text-accent">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-medium text-primary-text mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="text-secondary-text hover:text-accent">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-secondary-text hover:text-accent">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-secondary-text text-sm">&copy; {new Date().getFullYear()} Link It Up. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-secondary-text hover:text-accent">
              <Twitter size={18} />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-secondary-text hover:text-accent">
              <Linkedin size={18} />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-secondary-text hover:text-accent">
              <Facebook size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
