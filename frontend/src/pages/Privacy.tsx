import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Clock, Shield, LockKeyhole, EyeOff, Eye, Network, Mail, AlertTriangle } from 'lucide-react';
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
                <ArrowLeft className="mr-2 h-5 w-5" /> Back
              </Button>
            </Link>
            <div className="flex items-center mb-2">
              <Shield className="h-8 w-8 text-primary mr-2" />
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary-text">
                Privacy Policy
              </h1>
            </div>
            <div className="flex items-center text-sm text-secondary-text">
              <Clock className="h-5 w-5 mr-1" />
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
          
          <motion.section className="mb-8 bg-accent/10 p-4 rounded-lg border border-accent/30" variants={itemVariants}>
            <div className="flex items-start">
              <AlertTriangle className="h-6 w-6 text-accent mt-0.5 mr-3 shrink-0" />
              <p className="text-sm text-primary-text">
                <strong>Important Notice:</strong> Link It Up is designed to help you find publicly accessible professional profiles using AI-powered search technology. We do not scrape, crawl, or otherwise extract data from third-party platforms in violation of their terms of service. All information provided through our service is sourced from public sources that are freely accessible on the internet.
              </p>
            </div>
          </motion.section>
          
          <motion.section className="mb-12" variants={itemVariants}>
            <div className="flex items-center mb-4">
              <Eye className="h-7 w-7 text-primary mr-2" />
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
                <h3 className="text-lg font-medium text-primary-text mb-2">1.3 Information From Public Sources</h3>
                <p className="text-secondary-text">
                  Our service identifies publicly available professional information that already exists on the internet. This information may include:
                </p>
                <ul className="list-disc pl-5 mt-2 text-secondary-text space-y-2">
                  <li>Public professional profiles</li>
                  <li>Public business information</li>
                  <li>Publicly available contact information</li>
                  <li>Other information that individuals have made publicly accessible</li>
                </ul>
                <p className="text-secondary-text mt-2">
                  We do not collect, store, or process non-public information from third-party platforms. Our service operates by directing you to information that is already publicly available.
                </p>
              </div>
            </div>
          </motion.section>
          
          <motion.section className="mb-12" variants={itemVariants}>
            <div className="flex items-center mb-4">
              <FileText className="h-7 w-7 text-primary mr-2" />
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
              <p className="text-secondary-text mt-2">
                We maintain records of your search history within your account to provide you with better service, but we do not share this history with other users or third parties (except as described in Section 3).
              </p>
            </div>
          </motion.section>
          
          <motion.section className="mb-12" variants={itemVariants}>
            <div className="flex items-center mb-4">
              <Network className="h-7 w-7 text-primary mr-2" />
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
              
              <div>
                <h3 className="text-lg font-medium text-primary-text mb-2">3.5 Third-Party Platform Information</h3>
                <p className="text-secondary-text">
                  Our service may direct you to publicly available profiles or information on third-party platforms. We do not control these third-party platforms or their privacy practices. When you interact with these platforms, their privacy policies will apply to their collection, use, and disclosure of your information. We encourage you to review the privacy policies of any third-party platforms you visit.
                </p>
              </div>
            </div>
          </motion.section>
          
          <motion.section className="mb-12" variants={itemVariants}>
            <div className="flex items-center mb-4">
              <LockKeyhole className="h-7 w-7 text-primary mr-2" />
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
              <p className="text-secondary-text mt-2">
                We retain your personal information only for as long as necessary to fulfill the purposes for which we collected it, including for the purposes of satisfying any legal, accounting, or reporting requirements.
              </p>
            </div>
          </motion.section>
          
          <motion.section className="mb-12" variants={itemVariants}>
            <div className="flex items-center mb-4">
              <EyeOff className="h-7 w-7 text-primary mr-2" />
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
              <p className="text-secondary-text mt-2">
                For residents of California, the California Consumer Privacy Act (CCPA) provides additional rights. For residents of the European Economic Area (EEA), the General Data Protection Regulation (GDPR) applies.
              </p>
            </div>
          </motion.section>
          
          <motion.section className="mb-12" variants={itemVariants}>
            <div className="flex items-center mb-4">
              <FileText className="h-7 w-7 text-primary mr-2" />
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
              <FileText className="h-7 w-7 text-primary mr-2" />
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
              <FileText className="h-7 w-7 text-primary mr-2" />
              <h2 className="text-2xl font-heading font-semibold text-primary-text">
                8. Legal Basis for Processing (EEA Users)
              </h2>
            </div>
            
            <div className="pl-7 space-y-4">
              <p className="text-secondary-text">
                If you are in the European Economic Area (EEA), our legal basis for collecting and using your personal information depends on the specific information concerned and the context in which we collect it. We generally rely on the following legal bases for processing:
              </p>
              <ul className="list-disc pl-5 mt-2 text-secondary-text space-y-2">
                <li><strong>Contractual Necessity:</strong> To perform our contractual obligations to you, including providing our services.</li>
                <li><strong>Legitimate Interests:</strong> We may process your information where it is in our legitimate interests to do so, provided these interests are not overridden by your rights and interests.</li>
                <li><strong>Consent:</strong> In some cases, we may process your information based on your specific consent.</li>
                <li><strong>Legal Obligation:</strong> We may process your information to comply with a legal obligation.</li>
              </ul>
              <p className="text-secondary-text mt-2">
                If you have questions about the legal basis for processing, please contact us using the information provided at the end of this policy.
              </p>
            </div>
          </motion.section>
          
          <motion.section className="mb-12" variants={itemVariants}>
            <div className="flex items-center mb-4">
              <FileText className="h-7 w-7 text-primary mr-2" />
              <h2 className="text-2xl font-heading font-semibold text-primary-text">
                9. Changes to This Privacy Policy
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
              <Mail className="h-7 w-7 text-primary mr-2" />
              <h2 className="text-2xl font-heading font-semibold text-primary-text">
                10. Contact Us
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
          
          <motion.div className="text-center bg-card/70 p-4 rounded-lg border border-border/50 mb-8" variants={itemVariants}>
            <p className="text-secondary-text font-medium">
              By using our services, you acknowledge that you have read and understood this Privacy Policy. You understand that our service helps you find publicly available professional profiles and information, and that you are responsible for your use of this information in compliance with all applicable laws and third-party terms of service.
            </p>
          </motion.div>
        </div>
      </motion.main>
      
      <Footer />
    </div>
  );
};

export default Privacy;