import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Award, Users, Target, Link, Zap, ChevronRight } from 'lucide-react';
import { Link as WouterLink } from 'wouter';

const AboutUs = () => {
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

  // Team members data
  const teamMembers = [
    {
      name: "Alex Rodriguez",
      role: "Founder & CEO",
      bio: "Former Google and LinkedIn engineer with 15+ years experience in AI and search technology.",
      image: ""
    },
    {
      name: "Sarah Chen",
      role: "Chief Technology Officer",
      bio: "AI specialist with a PhD in Computer Science and 10+ years in machine learning and data processing.",
      image: ""
    },
    {
      name: "Michael Johnson",
      role: "Head of Product",
      bio: "Product leader with experience at top tech companies, focused on creating intuitive user experiences.",
      image: ""
    },
    {
      name: "Emma Williams",
      role: "Customer Success Lead",
      bio: "Passionate about helping customers achieve their goals with 8+ years in customer success roles.",
      image: ""
    }
  ];

  // Company values
  const companyValues = [
    {
      title: "Innovation",
      description: "We constantly push boundaries to create cutting-edge solutions that solve real problems.",
      icon: <Lightbulb className="h-8 w-8 text-primary" />
    },
    {
      title: "Excellence",
      description: "We are committed to delivering the highest quality in everything we do, from code to customer service.",
      icon: <Award className="h-8 w-8 text-primary" />
    },
    {
      title: "Collaboration",
      description: "We believe the best results come from working together with our team and our customers.",
      icon: <Users className="h-8 w-8 text-primary" />
    },
    {
      title: "Integrity",
      description: "We operate with transparency and honesty in all our interactions and business practices.",
      icon: <Target className="h-8 w-8 text-primary" />
    }
  ];

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
              About <span className="text-primary">Link It Up</span>
            </h1>
            <p className="text-xl text-secondary-text max-w-3xl mx-auto">
              We're on a mission to make professional networking smarter, faster, and more efficient for everyone.
            </p>
          </motion.div>
          
          {/* Our Story Section */}
          <motion.section className="mb-20" variants={itemVariants}>
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="md:w-1/2">
                <h2 className="text-3xl font-heading font-semibold text-primary-text mb-4">Our Story</h2>
                <div className="space-y-4 text-secondary-text">
                  <p>
                    Link It Up was founded in 2024 by a team of engineers and data scientists who were frustrated with the time-consuming process of finding professional contacts and maintaining accurate network data.
                  </p>
                  <p>
                    After years of manually searching for LinkedIn profiles and dealing with outdated contact information, we knew there had to be a better way. We built a prototype AI tool for our own use, and when colleagues started asking to use it too, we realized we had something special.
                  </p>
                  <p>
                    Today, Link It Up has grown into a comprehensive platform that helps professionals, sales teams, recruiters, and marketers efficiently find and connect with the right people, saving them countless hours of manual searching and data entry.
                  </p>
                </div>
                
                <div className="flex items-center mt-8 space-x-4">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    Founded 2024
                  </Badge>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    San Francisco, CA
                  </Badge>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    15+ Team Members
                  </Badge>
                </div>
              </div>
              
              <div className="md:w-1/2 bg-card/30 rounded-lg p-8 border border-border/50">
                <div className="relative pt-8">
                  <div className="absolute -top-2 -left-2 bg-primary/10 rounded-full p-3">
                    <Link className="h-6 w-6 text-primary" />
                  </div>
                  
                  <h3 className="text-2xl font-heading font-medium text-primary-text my-6">Our Mission</h3>
                  <blockquote className="text-lg italic text-secondary-text mb-6">
                    "To empower professionals to build meaningful connections by removing the friction from finding and connecting with the right people."
                  </blockquote>
                  
                  <Separator className="my-6" />
                  
                  <h3 className="text-2xl font-heading font-medium text-primary-text mb-6">Our Vision</h3>
                  <p className="text-secondary-text">
                    We envision a future where building and maintaining your professional network is effortless, allowing you to focus on what truly matters: creating meaningful professional relationships and achieving your goals.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
          
          {/* Company Values Section */}
          <motion.section className="mb-20" variants={itemVariants}>
            <h2 className="text-3xl font-heading font-semibold text-primary-text mb-8 text-center">Our Values</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {companyValues.map((value, index) => (
                <Card key={index} className="border border-border/50 bg-card/50">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-4 p-3 bg-primary/10 rounded-full">
                        {value.icon}
                      </div>
                      <h3 className="text-xl font-heading font-medium text-primary-text mb-2">{value.title}</h3>
                      <p className="text-secondary-text">{value.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.section>
          
          {/* What Sets Us Apart Section */}
          <motion.section className="mb-20" variants={itemVariants}>
            <div className="bg-card/30 rounded-lg p-8 border border-border/50">
              <h2 className="text-3xl font-heading font-semibold text-primary-text mb-8 text-center">What Sets Us Apart</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4 p-2 bg-primary/10 rounded-full">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-medium text-primary-text mb-2">Advanced AI Technology</h3>
                    <p className="text-secondary-text">
                      Our proprietary algorithm achieves industry-leading matching accuracy by analyzing multiple data points beyond just names and companies.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4 p-2 bg-primary/10 rounded-full">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-medium text-primary-text mb-2">User-Centric Design</h3>
                    <p className="text-secondary-text">
                      Every feature is designed with user feedback at its core, ensuring an intuitive and efficient experience.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4 p-2 bg-primary/10 rounded-full">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-medium text-primary-text mb-2">Ethical Data Practices</h3>
                    <p className="text-secondary-text">
                      We're committed to responsible data usage and maintain the highest standards of privacy and compliance.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4 p-2 bg-primary/10 rounded-full">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-medium text-primary-text mb-2">Exceptional Support</h3>
                    <p className="text-secondary-text">
                      Our dedicated customer success team ensures you get the most value from our platform with personalized assistance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
          
          {/* Meet Our Team Section */}
          <motion.section className="mb-16" variants={itemVariants}>
            <h2 className="text-3xl font-heading font-semibold text-primary-text mb-8 text-center">Meet Our Team</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {teamMembers.map((member, index) => (
                <Card key={index} className="border border-border/50">
                  <CardContent className="pt-6 flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 border-2 border-primary/20 mb-4">
                      <AvatarImage src={member.image} />
                      <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-heading font-medium text-primary-text">{member.name}</h3>
                    <p className="text-primary mb-2">{member.role}</p>
                    <p className="text-secondary-text text-sm">{member.bio}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.section>
          
          {/* Call to Action */}
          <motion.section variants={itemVariants}>
            <div className="bg-primary/10 rounded-lg p-8 border border-primary/20 text-center">
              <h2 className="text-3xl font-heading font-semibold text-primary-text mb-4">Ready to transform your networking?</h2>
              <p className="text-secondary-text max-w-2xl mx-auto mb-6">
                Join thousands of professionals who are saving time and making better connections with Link It Up.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <WouterLink href="/pricing">
                  <Button size="lg" className="font-medium">
                    View Pricing
                  </Button>
                </WouterLink>
                <WouterLink href="/contact">
                  <Button size="lg" variant="outline" className="font-medium">
                    Contact Us <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </WouterLink>
              </div>
            </div>
          </motion.section>
        </div>
      </motion.main>
      
      <Footer />
    </div>
  );
};

export default AboutUs;