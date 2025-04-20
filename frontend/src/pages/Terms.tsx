import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Clock, Scale, Shield, Ban, CreditCard, AlertTriangle, Eye, ThumbsUp } from 'lucide-react';
import { Link } from 'wouter';

const Terms = () => {
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
              <FileText className="h-8 w-8 text-primary mr-2" />
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary-text">
                Terms of Service
              </h1>
            </div>
            <div className="flex items-center text-sm text-secondary-text">
              <Clock className="h-5 w-5 mr-1" />
              <span>Last updated: April 1, 2025</span>
            </div>
          </motion.div>
          
          <motion.div className="prose prose-lg dark:prose-invert max-w-none mb-8" variants={itemVariants}>
            <p className="text-lg text-secondary-text">
              Welcome to Link It Up. These Terms of Service ("Terms") govern your access to and use of the Link It Up website, products, and services ("Services"). Please read these Terms carefully before using our Services.
            </p>
            <p className="text-lg text-secondary-text">
              By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Services.
            </p>
          </motion.div>
          
          <Separator className="my-8" />
          
          <motion.section className="mb-12" variants={itemVariants}>
            <div className="flex items-center mb-4">
              <Eye className="h-7 w-7 text-primary mr-2" />
              <h2 className="text-2xl font-heading font-semibold text-primary-text">
                1. Using Our Services
              </h2>
            </div>
            
            <div className="pl-7 space-y-4">
              <div>
                <h3 className="text-lg font-medium text-primary-text mb-2">1.1 Account Registration</h3>
                <p className="text-secondary-text">
                  To access certain features of our Services, you may be required to register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-primary-text mb-2">1.2 Account Security</h3>
                <p className="text-secondary-text">
                  You are responsible for safeguarding your account and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account or any other breach of security. We cannot and will not be liable for any loss or damage arising from your failure to comply with this section.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-primary-text mb-2">1.3 Age Restrictions</h3>
                <p className="text-secondary-text">
                  You must be at least 18 years old to use our Services. By using our Services, you represent and warrant that you are at least 18 years old.
                </p>
              </div>
            </div>
          </motion.section>
          
          <motion.section className="mb-12" variants={itemVariants}>
            <div className="flex items-center mb-4">
              <ThumbsUp className="h-7 w-7 text-primary mr-2" />
              <h2 className="text-2xl font-heading font-semibold text-primary-text">
                2. Acceptable Use
              </h2>
            </div>
            
            <div className="pl-7 space-y-4">
              <div>
                <h3 className="text-lg font-medium text-primary-text mb-2">2.1 Compliance with Laws and Regulations</h3>
                <p className="text-secondary-text">
                  You agree to use our Services only for lawful purposes and in accordance with these Terms. You agree not to use our Services:
                </p>
                <ul className="list-disc pl-5 mt-2 text-secondary-text">
                  <li>In any way that violates any applicable federal, state, local, or international law or regulation</li>
                  <li>To engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Services</li>
                  <li>To impersonate or attempt to impersonate Link It Up, a company employee, another user, or any other person or entity</li>
                  <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Services, or which may harm Link It Up or users of the Services</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-primary-text mb-2">2.2 Third-Party Platform Compliance</h3>
                <p className="text-secondary-text">
                  When using our Services to find professional profiles, you acknowledge and agree that:
                </p>
                <ul className="list-disc pl-5 mt-2 text-secondary-text">
                  <li>Our Services identify publicly accessible professional profiles using AI-powered search technology</li>
                  <li>You are responsible for complying with all terms of service, platform policies, and applicable laws when accessing any third-party platforms or profiles discovered through our Services</li>
                  <li>You will only use the information obtained through our Services for legitimate business purposes in compliance with applicable laws, regulations, and third-party platform terms</li>
                  <li>You will not use our Services to engage in automated scraping, crawling, or data harvesting of any professional networking platforms</li>
                  <li>You understand that our Services do not provide access to any data that is not already publicly available</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-primary-text mb-2">2.3 Legal Responsibility</h3>
                <p className="text-secondary-text">
                  You are solely responsible for your compliance with all applicable laws, regulations, and third-party terms of service when using information obtained through our Services. We cannot and will not be liable for any misuse of the information provided by our Services or any violation of third-party platform terms.
                </p>
              </div>
            </div>
          </motion.section>
          
          <motion.section className="mb-12" variants={itemVariants}>
            <div className="flex items-center mb-4">
              <Scale className="h-7 w-7 text-primary mr-2" />
              <h2 className="text-2xl font-heading font-semibold text-primary-text">
                3. Intellectual Property Rights
              </h2>
            </div>
            
            <div className="pl-7 space-y-4">
              <div>
                <h3 className="text-lg font-medium text-primary-text mb-2">3.1 Our Intellectual Property</h3>
                <p className="text-secondary-text">
                  The Services and their entire contents, features, and functionality (including but not limited to all information, software, text, displays, images, video, and audio, and the design, selection, and arrangement thereof) are owned by Link It Up, its licensors, or other providers of such material and are protected by United States and international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-primary-text mb-2">3.2 Limited License</h3>
                <p className="text-secondary-text">
                  Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, and revocable license to access and use the Services for your personal or internal business purposes. This license does not include:
                </p>
                <ul className="list-disc pl-5 mt-2 text-secondary-text">
                  <li>The right to reproduce, distribute, publicly display, or publicly perform the Services</li>
                  <li>The right to modify, create derivative works from, or otherwise exploit the Services</li>
                  <li>Any resale or commercial use of the Services or their contents</li>
                  <li>Any downloading or copying of account information for the benefit of another merchant</li>
                  <li>Any use of data mining, robots, or similar data gathering and extraction tools</li>
                </ul>
              </div>
            </div>
          </motion.section>
          
          <motion.section className="mb-12" variants={itemVariants}>
            <div className="flex items-center mb-4">
              <CreditCard className="h-7 w-7 text-primary mr-2" />
              <h2 className="text-2xl font-heading font-semibold text-primary-text">
                4. Credits and Billing
              </h2>
            </div>
            
            <div className="pl-7 space-y-4">
              <div>
                <h3 className="text-lg font-medium text-primary-text mb-2">4.1 Credit-Based System</h3>
                <p className="text-secondary-text">
                  Our Services operate on a credit-based system. By purchasing credits, you agree to pay the applicable fees as they become due. Credit purchases are non-refundable, except as expressly provided in these Terms or as required by applicable law.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-primary-text mb-2">4.2 Credit Validity</h3>
                <p className="text-secondary-text">
                  Once purchased, credits remain valid in your account indefinitely until used. Unused credits are not eligible for refund. Each professional profile search consumes one credit from your account balance.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-primary-text mb-2">4.3 Price Changes</h3>
                <p className="text-secondary-text">
                  We may change the fees for our Services at any time. Price changes will not affect credits that have already been purchased. Your continued use of the Services after price changes are posted constitutes your agreement to pay the updated fees for any future credit purchases.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-primary-text mb-2">4.4 Payment Processing</h3>
                <p className="text-secondary-text">
                  We use third-party payment processors to handle all financial transactions. By making a purchase, you agree to comply with these processors' terms of service and provide accurate billing information.
                </p>
              </div>
            </div>
          </motion.section>
          
          <motion.section className="mb-12" variants={itemVariants}>
            <div className="flex items-center mb-4">
              <Shield className="h-7 w-7 text-primary mr-2" />
              <h2 className="text-2xl font-heading font-semibold text-primary-text">
                5. Privacy
              </h2>
            </div>
            
            <div className="pl-7">
              <p className="text-secondary-text">
                Your privacy is important to us. Our Privacy Policy describes how we collect, use, and share your personal information. By using our Services, you agree to the collection, use, and sharing of your information as described in our Privacy Policy.
              </p>
              <p className="text-secondary-text mt-2">
                It's important to understand that our Services only identify publicly accessible professional profiles. We do not provide access to any data that is not already publicly available, and we do not engage in unauthorized data collection practices.
              </p>
            </div>
          </motion.section>
          
          <motion.section className="mb-12" variants={itemVariants}>
            <div className="flex items-center mb-4">
              <Ban className="h-7 w-7 text-primary mr-2" />
              <h2 className="text-2xl font-heading font-semibold text-primary-text">
                6. Disclaimers and Limitations of Liability
              </h2>
            </div>
            
            <div className="pl-7 space-y-4">
              <div>
                <h3 className="text-lg font-medium text-primary-text mb-2">6.1 Disclaimer of Warranties</h3>
                <p className="text-secondary-text">
                  THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED OR ERROR-FREE, THAT DEFECTS WILL BE CORRECTED, OR THAT THE SERVICES OR THE SERVERS THAT MAKE THEM AVAILABLE ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-primary-text mb-2">6.2 Limitation of Liability</h3>
                <p className="text-secondary-text">
                  IN NO EVENT WILL LINK IT UP, ITS AFFILIATES, OR THEIR LICENSORS, SERVICE PROVIDERS, EMPLOYEES, AGENTS, OFFICERS, OR DIRECTORS BE LIABLE FOR DAMAGES OF ANY KIND, UNDER ANY LEGAL THEORY, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OR INABILITY TO USE THE SERVICES, INCLUDING ANY DIRECT, INDIRECT, SPECIAL, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO, PERSONAL INJURY, PAIN AND SUFFERING, EMOTIONAL DISTRESS, LOSS OF REVENUE, LOSS OF PROFITS, LOSS OF BUSINESS OR ANTICIPATED SAVINGS, LOSS OF USE, LOSS OF GOODWILL, LOSS OF DATA, AND WHETHER CAUSED BY TORT (INCLUDING NEGLIGENCE), BREACH OF CONTRACT, OR OTHERWISE, EVEN IF FORESEEABLE.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-primary-text mb-2">6.3 Third-Party Platforms</h3>
                <p className="text-secondary-text">
                  WE ARE NOT RESPONSIBLE FOR ANY CONTENT OR PRACTICES OF THIRD-PARTY PLATFORMS WHOSE PROFILES MAY BE IDENTIFIED THROUGH OUR SERVICES. YOUR INTERACTIONS WITH SUCH PLATFORMS ARE GOVERNED BY THEIR RESPECTIVE TERMS OF SERVICE AND PRIVACY POLICIES. WE MAKE NO WARRANTIES OR REPRESENTATIONS REGARDING SUCH PLATFORMS AND EXPRESSLY DISCLAIM ANY LIABILITY ARISING FROM YOUR USE OF OR INTERACTIONS WITH THEM.
                </p>
              </div>
              
              <div className="flex items-center bg-accent/10 p-4 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-accent shrink-0 mr-3" />
                <p className="text-primary-text text-sm">
                  <strong>Important:</strong> Some jurisdictions do not allow the exclusion of implied warranties or limitations on liability for certain types of damages, so some of the above limitations may not apply to you.
                </p>
              </div>
            </div>
          </motion.section>
          
          <motion.section className="mb-12" variants={itemVariants}>
            <div className="flex items-center mb-4">
              <Scale className="h-7 w-7 text-primary mr-2" />
              <h2 className="text-2xl font-heading font-semibold text-primary-text">
                7. Indemnification
              </h2>
            </div>
            
            <div className="pl-7">
              <p className="text-secondary-text">
                You agree to defend, indemnify, and hold harmless Link It Up, its affiliates, licensors, and service providers, and its and their respective officers, directors, employees, contractors, agents, licensors, suppliers, successors, and assigns from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms or your use of the Services.
              </p>
              <p className="text-secondary-text mt-2">
                This includes, but is not limited to, any claims arising from your access to or use of third-party platforms or profiles identified through our Services, your violation of any third-party terms of service, or your violation of any applicable laws or regulations.
              </p>
            </div>
          </motion.section>
          
          <motion.section className="mb-12" variants={itemVariants}>
            <div className="flex items-center mb-4">
              <FileText className="h-7 w-7 text-primary mr-2" />
              <h2 className="text-2xl font-heading font-semibold text-primary-text">
                8. Changes to These Terms
              </h2>
            </div>
            
            <div className="pl-7">
              <p className="text-secondary-text">
                We may revise and update these Terms from time to time in our sole discretion. All changes are effective immediately when we post them, and apply to all access to and use of the Services thereafter. Your continued use of the Services following the posting of revised Terms means that you accept and agree to the changes.
              </p>
            </div>
          </motion.section>
          
          <motion.section className="mb-12" variants={itemVariants}>
            <div className="flex items-center mb-4">
              <FileText className="h-7 w-7 text-primary mr-2" />
              <h2 className="text-2xl font-heading font-semibold text-primary-text">
                9. Governing Law and Jurisdiction
              </h2>
            </div>
            
            <div className="pl-7">
              <p className="text-secondary-text">
                These Terms and any dispute or claim arising out of or related to them, their subject matter or their formation (in each case, including non-contractual disputes or claims) shall be governed by and construed in accordance with the laws of the State of California, without giving effect to any choice or conflict of law provision or rule. Any legal suit, action, or proceeding arising out of, or related to, these Terms or the Services shall be instituted exclusively in the federal courts of the United States or the courts of the State of California, in each case located in the City of San Francisco and County of San Francisco, although we retain the right to bring any suit, action, or proceeding against you for breach of these Terms in your country of residence or any other relevant country.
              </p>
            </div>
          </motion.section>
          
          <motion.section className="mb-12" variants={itemVariants}>
            <div className="flex items-center mb-4">
              <FileText className="h-7 w-7 text-primary mr-2" />
              <h2 className="text-2xl font-heading font-semibold text-primary-text">
                10. Contact Us
              </h2>
            </div>
            
            <div className="pl-7">
              <p className="text-secondary-text mb-4">
                If you have any questions about these Terms, please contact us at:
              </p>
              
              <div className="bg-card/70 border border-border/50 rounded-lg p-4">
                <p className="text-primary-text font-medium">Link It Up, Inc.</p>
                <p className="text-secondary-text">123 Tech Plaza, Suite 500</p>
                <p className="text-secondary-text">San Francisco, CA 94103</p>
                <p className="text-secondary-text mt-2">Email: legal@linkitup.com</p>
                <p className="text-secondary-text">Phone: +1 (800) 555-1234</p>
              </div>
            </div>
          </motion.section>
          
          <motion.div className="text-center bg-card/70 p-4 rounded-lg border border-border/50 mb-8" variants={itemVariants}>
            <p className="text-secondary-text font-medium">
              By using our Services, you acknowledge that you have read and understood these Terms and agree to be bound by them. You are responsible for ensuring your use of our Services complies with all applicable laws and third-party platform terms.
            </p>
          </motion.div>
        </div>
      </motion.main>
      
      <Footer />
    </div>
  );
};

export default Terms;