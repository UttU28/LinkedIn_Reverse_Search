import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Clock, Shield, LockKeyhole, EyeOff, Eye, Network, Mail } from 'lucide-react';
import { Link } from 'wouter';

const Privacy = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
        duration: 0.3,
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
        <div className="max-w-4xl mx-auto">
          <motion.div className="mb-8" variants={itemVariants}>
            <Link href="/">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            </Link>
            <div className="flex items-center mb-2">
              <Shield className="h-6 w-6 text-primary mr-2" />
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary-text">
                Privacy Policy
              </h1>
            </div>
            <div className="flex items-center text-sm text-secondary-text">
              <Clock className="h-4 w-4 mr-1" />
              <span>Last updated: April 1, 2025</span>
            </div>
          </motion.div>
          
          <motion.div className="prose prose-lg dark:prose-invert max-w-none mb-8" variants={itemVariants}>
            <p className="text-lg text-secondary-text">
              At Link It Up, we take your privacy seriously. This Privacy Policy describes how we collect, use, and share your personal information when you use our website and services.
            </p>
            <p className="text-lg text-secondary-text">
              By using Link It Up, you agree to the collection and use of information in accordance with this policy.
            </p>
          </motion.div>
          
          <Separator className="my-8" />
          
          <motion.section className="mb-12" variants={itemVariants}>
            <div className="flex items-center mb-4">
              <Eye className="h-5 w-5 text-primary mr-2" />
              <h2 className="text-2xl font-heading font-semibold text-primary-text">
                1. Information We Collect
              </h2>
            </div>
            
            <div className="pl-7 space-y-4">
              <div>
                <h3 className="text-lg font-medium text-primary-text mb-2">1.1 Information You Provide</h3>
                <p className="text-secondary-text">
                  We collect information you provide directly to us when you:
                </p>
                <ul className="list-disc pl-5 mt-2 text-secondary-text space-y-2">
                  <li>Create an account (name, email address, password)</li>
                  <li>Complete your profile (professional information, company details)</li>
                  <li>Upload contact lists for processing</li>
                  <li>Contact our support team</li>
                  <li>Subscribe to our newsletter</li>
                  <li>Respond to surveys or provide feedback</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-primary-text mb-2">1.2 Information We Collect Automatically</h3>
                <p className="text-secondary-text">
                  When you use our services, we automatically collect certain information, including:
                </p>
                <ul className="list-disc pl-5 mt-2 text-secondary-text space-y-2">
                  <li>Log data (IP address, browser type, pages visited, time spent)</li>
                  <li>Device information (device type, operating system)</li>
                  <li>Usage data (features used, search queries, actions taken)</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-primary-text mb-2">1.3 Information From Third Parties</h3>
                <p className="text-secondary-text">
                  We may receive information about you from third-party sources, such as:
                </p>
                <ul className="list-disc pl-5 mt-2 text-secondary-text space-y-2">
                  <li>Business partners</li>
                  <li>Identity verification services</li>
                  <li>Public databases</li>
                  <li>Social media platforms when you connect your account</li>
                </ul>
              </div>
            </div>
          </motion.section>
          
          <motion.section className="mb-12" variants={itemVariants}>
            <div className="flex items-center mb-4">
              <FileText className="h-5 w-5 text-primary mr-2" />
              <h2 className="text-2xl font-heading font-semibold text-primary-text">
                2. How We Use Your Information
              </h2>
            </div>
            
            <div className="pl-7 space-y-4">
              <p className="text-secondary-text">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-5 mt-2 text-secondary-text space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process your requests and transactions</li>
                <li>Personalize your experience</li>
                <li>Communicate with you about services, updates, and promotions</li>
                <li>Monitor and analyze usage patterns and trends</li>
                <li>Detect, prevent, and address technical issues and security breaches</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>
          </motion.section>
          
          <motion.section className="mb-12" variants={itemVariants}>
            <div className="flex items-center mb-4">
              <Network className="h-5 w-5 text-primary mr-2" />
              <h2 className="text-2xl font-heading font-semibold text-primary-text">
                3. How We Share Your Information
              </h2>
            </div>
            
            <div className="pl-7 space-y-4">
              <p className="text-secondary-text">
                We may share your information with:
              </p>
              <div>
                <h3 className="text-lg font-medium text-primary-text mb-2">3.1 Service Providers</h3>
                <p className="text-secondary-text">
                  We share information with third-party vendors, consultants, and other service providers who perform services on our behalf, such as:
                </p>
                <ul className="list-disc pl-5 mt-2 text-secondary-text space-y-2">
                  <li>Cloud hosting providers</li>
                  <li>Payment processors</li>
                  <li>Analytics services</li>
                  <li>Customer support tools</li>
                  <li>Email delivery services</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-primary-text mb-2">3.2 Business Transfers</h3>
                <p className="text-secondary-text">
                  If we are involved in a merger, acquisition, financing, reorganization, bankruptcy, or sale of company assets, your information may be transferred as part of that transaction. We will notify you of any such change in ownership or control of your personal information.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-primary-text mb-2">3.3 Legal Requirements</h3>
                <p className="text-secondary-text">
                  We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency).
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-primary-text mb-2">3.4 Protection of Rights</h3>
                <p className="text-secondary-text">
                  We may disclose your information when we believe in good faith that disclosure is necessary to protect our rights, protect your safety or the safety of others, investigate fraud, or respond to a government request.
                </p>
              </div>
            </div>
          </motion.section>
          
          <motion.section className="mb-12" variants={itemVariants}>
            <div className="flex items-center mb-4">
              <LockKeyhole className="h-5 w-5 text-primary mr-2" />
              <h2 className="text-2xl font-heading font-semibold text-primary-text">
                4. Data Security
              </h2>
            </div>
            
            <div className="pl-7 space-y-4">
              <p className="text-secondary-text">
                We implement appropriate technical and organizational measures to protect the security of your personal information. However, please be aware that no method of transmission over the Internet or method of electronic storage is 100% secure.
              </p>
              <p className="text-secondary-text">
                Our security measures include:
              </p>
              <ul className="list-disc pl-5 mt-2 text-secondary-text space-y-2">
                <li>Encryption of sensitive data at rest and in transit</li>
                <li>Regular security assessments and penetration testing</li>
                <li>Access controls and authentication requirements</li>
                <li>Regular security training for our team</li>
                <li>Monitoring for suspicious activities</li>
              </ul>
            </div>
          </motion.section>
          
          <motion.section className="mb-12" variants={itemVariants}>
            <div className="flex items-center mb-4">
              <EyeOff className="h-5 w-5 text-primary mr-2" />
              <h2 className="text-2xl font-heading font-semibold text-primary-text">
                5. Your Privacy Rights
              </h2>
            </div>
            
            <div className="pl-7 space-y-4">
              <p className="text-secondary-text">
                Depending on your location, you may have certain rights regarding your personal information, including:
              </p>
              <ul className="list-disc pl-5 mt-2 text-secondary-text space-y-2">
                <li><strong>Access:</strong> You can request a copy of the personal information we hold about you.</li>
                <li><strong>Correction:</strong> You can request that we correct inaccurate or incomplete information.</li>
                <li><strong>Deletion:</strong> You can request that we delete your personal information in certain circumstances.</li>
                <li><strong>Restriction:</strong> You can request that we restrict the processing of your information in certain circumstances.</li>
                <li><strong>Data Portability:</strong> You can request a copy of your information in a structured, commonly used, and machine-readable format.</li>
                <li><strong>Objection:</strong> You can object to our processing of your personal information in certain circumstances.</li>
              </ul>
              <p className="text-secondary-text">
                To exercise any of these rights, please contact us using the information provided at the end of this policy.
              </p>
            </div>
          </motion.section>
          
          <motion.section className="mb-12" variants={itemVariants}>
            <div className="flex items-center mb-4">
              <FileText className="h-5 w-5 text-primary mr-2" />
              <h2 className="text-2xl font-heading font-semibold text-primary-text">
                6. Cookies and Tracking Technologies
              </h2>
            </div>
            
            <div className="pl-7 space-y-4">
              <p className="text-secondary-text">
                We use cookies and similar tracking technologies to track activity on our service and hold certain information. Cookies are files with a small amount of data that may include an anonymous unique identifier.
              </p>
              <p className="text-secondary-text">
                We use the following types of cookies:
              </p>
              <ul className="list-disc pl-5 mt-2 text-secondary-text space-y-2">
                <li><strong>Essential Cookies:</strong> Required for the operation of our website.</li>
                <li><strong>Analytical/Performance Cookies:</strong> Allow us to recognize and count the number of visitors and see how visitors move around our website.</li>
                <li><strong>Functionality Cookies:</strong> Used to recognize you when you return to our website.</li>
                <li><strong>Targeting Cookies:</strong> Record your visit to our website, the pages you have visited, and the links you have followed.</li>
              </ul>
              <p className="text-secondary-text">
                You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
              </p>
            </div>
          </motion.section>
          
          <motion.section className="mb-12" variants={itemVariants}>
            <div className="flex items-center mb-4">
              <FileText className="h-5 w-5 text-primary mr-2" />
              <h2 className="text-2xl font-heading font-semibold text-primary-text">
                7. Children's Privacy
              </h2>
            </div>
            
            <div className="pl-7 space-y-4">
              <p className="text-secondary-text">
                Our service is not intended for use by children under the age of 18. We do not knowingly collect personally identifiable information from children under 18. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us so that we can take necessary actions.
              </p>
            </div>
          </motion.section>
          
          <motion.section className="mb-12" variants={itemVariants}>
            <div className="flex items-center mb-4">
              <FileText className="h-5 w-5 text-primary mr-2" />
              <h2 className="text-2xl font-heading font-semibold text-primary-text">
                8. Changes to This Privacy Policy
              </h2>
            </div>
            
            <div className="pl-7 space-y-4">
              <p className="text-secondary-text">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top of this Privacy Policy.
              </p>
              <p className="text-secondary-text">
                You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
              </p>
            </div>
          </motion.section>
          
          <motion.section className="mb-12" variants={itemVariants}>
            <div className="flex items-center mb-4">
              <Mail className="h-5 w-5 text-primary mr-2" />
              <h2 className="text-2xl font-heading font-semibold text-primary-text">
                9. Contact Us
              </h2>
            </div>
            
            <div className="pl-7">
              <p className="text-secondary-text mb-4">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              
              <div className="bg-card/70 border border-border/50 rounded-lg p-4">
                <p className="text-primary-text font-medium">Link It Up, Inc.</p>
                <p className="text-secondary-text">123 Tech Plaza, Suite 500</p>
                <p className="text-secondary-text">San Francisco, CA 94103</p>
                <p className="text-secondary-text mt-2">Email: privacy@linkitup.com</p>
                <p className="text-secondary-text">Phone: +1 (800) 555-1234</p>
              </div>
            </div>
          </motion.section>
          
          <motion.div className="text-center" variants={itemVariants}>
            <p className="text-secondary-text">
              By using our services, you acknowledge that you have read and understood this Privacy Policy.
            </p>
          </motion.div>
        </div>
      </motion.main>
      
      <Footer />
    </div>
  );
};

export default Privacy;