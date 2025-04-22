const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import Firebase services
let createUser, updateLastLogin, updateCreditUsage;

try {
  // Try loading Firebase services
  const userService = require('./src/services/userService');
  createUser = userService.createUser;
  updateLastLogin = userService.updateLastLogin;
  updateCreditUsage = userService.updateCreditUsage;
  console.log('Firebase services loaded successfully');
} catch (error) {
  console.error('Error loading Firebase services:', error);
  // Create dummy functions for development
  console.log('Using mock Firebase services for development');
  createUser = async (userData) => {
    console.log('[MOCK] Creating user:', userData);
    return { 
      success: true, 
      mockData: true,
      ...userData
    };
  };
  
  updateLastLogin = async (uid) => {
    console.log('[MOCK] Updating last login for:', uid);
    return { 
      success: true, 
      mockData: true,
      uid
    };
  };
  
  updateCreditUsage = async (uid, creditsUsed, resultsFound) => {
    console.log('[MOCK] Updating credits for user:', uid);
    console.log('Credits used:', creditsUsed);
    console.log('Results found:', resultsFound);
    return { 
      success: true, 
      mockData: true,
      linkCredits: 50 - creditsUsed,
      totalSearched: creditsUsed,
      totalFound: resultsFound
    };
  };
}

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.send('Hello Duniya');
});

// Find single contact route
app.post('/findSingleContact', (req, res) => {
  const { userID, searchName, searchCompany, searchPosition } = req.body;
  
  console.log('\n========== SINGLE CONTACT SEARCH REQUEST ==========');
  console.log('User ID:', userID);
  console.log('Search Name:', searchName);
  console.log('Search Company:', searchCompany);
  console.log('Search Position:', searchPosition);
  console.log('================================================\n');

  // For demonstration, create a LinkedIn profile URL
  const linkedinProfileUrl = `https://www.linkedin.com/in/${searchName.toLowerCase().replace(/\s+/g, '-')}`;
  
  // Simulate found data - in real implementation, this would be from actual search
  let foundData = Math.random() > 0.4 ? 1 : 0;

  console.log('SEARCH RESULT:');
  console.log('LinkedIn Profile URL:', linkedinProfileUrl);
  console.log('Found Data:', foundData);
  console.log('================================================\n');

  // Return the search result to the frontend
  res.json({
    status: 'success',
    message: 'Single contact search completed',
    data: {
      userID,
      searchName,
      searchCompany,
      searchPosition,
      linkedinProfileUrl,
      foundData
    }
  });
});

// Find batch contacts route
app.post('/findBatchContact', (req, res) => {
  const { userID, fileName, timestamp, batchId, contacts } = req.body;
  
  console.log('\n========== BATCH CONTACT SEARCH REQUEST ==========');
  console.log('User ID:', userID);
  console.log('File Name:', fileName);
  console.log('Timestamp:', new Date(timestamp).toLocaleString());
  console.log('Batch ID:', batchId);
  console.log('Number of contacts:', contacts?.length || 0);
  
  // Log first 3 contacts for debugging
  if (contacts && contacts.length > 0) {
    console.log('\nSample contacts:');
    contacts.slice(0, 3).forEach((contact, index) => {
      console.log(`\nContact ${index + 1}:`);
      console.log('- Name:', contact.searchName);
      console.log('- Company:', contact.searchCompany);
      console.log('- Position:', contact.searchPosition);
      console.log('- Contact ID:', contact.contactId);
    });
    if (contacts.length > 3) {
      console.log(`... and ${contacts.length - 3} more contacts`);
    }
  }
  console.log('================================================\n');
  
  // Process each contact and generate LinkedIn URLs
  const processedContacts = contacts.map(contact => {
    const {searchName, searchCompany, searchPosition, contactId} = contact;
    
    // For demonstration purposes, create a LinkedIn URL
    const linkedinProfileUrl = `https://www.linkedin.com/in/${searchName.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Simulate found data - 70% chance of finding profile
    const foundData = Math.random() > 0.3 ? 1 : 0;
    
    return {
      batchId,
      contactId,
      searchName,
      searchCompany,
      searchPosition,
      linkedinProfileUrl: foundData ? linkedinProfileUrl : undefined,
      foundData
    };
  });
  
  console.log('BATCH PROCESSING RESULT:');
  console.log(`Processed ${processedContacts.length} contacts`);
  console.log(`Found ${processedContacts.filter(c => c.foundData > 0).length} profiles`);
  console.log('================================================\n');
  
  // Return the processed contacts
  res.json({
    status: 'success',
    message: 'Batch contact search processed',
    data: {
      userID,
      fileName,
      timestamp,
      contactsCount: contacts?.length || 0,
      contacts: processedContacts
    }
  });
});

// Find targeted leads route
app.post('/findTargetedLeads', (req, res) => {
  const { userID, company, positionTitle, pipelineId, leadDocId } = req.body;
  
  console.log('\n========== TARGETED LEADS SEARCH REQUEST ==========');
  console.log('User ID:', userID);
  console.log('Company:', company);
  console.log('Position Title:', positionTitle);
  console.log('Pipeline ID:', pipelineId);
  console.log('Lead Doc ID:', leadDocId);
  console.log('================================================\n');
  
  // Dummy lead data (same as used in frontend before)
  const dummyLeadResults = [
    { id: 1, name: 'Sarah Johnson', company: 'TechCorp', position: 'VP of Recruitment', exactMatch: true },
    { id: 2, name: 'Michael Chen', company: 'TechCorp', position: 'Senior Recruitment Manager', exactMatch: true },
    { id: 3, name: 'Emily Rodriguez', company: 'TechCorp', position: 'Talent Acquisition Lead', exactMatch: true },
    { id: 4, name: 'James Wilson', company: 'GlobalHR', position: 'Recruitment Director', exactMatch: false },
    { id: 5, name: 'Aisha Patel', company: 'TalentSphere', position: 'Head of Recruitment', exactMatch: false },
    { id: 6, name: 'Robert Kim', company: 'TechCorp', position: 'Technical Recruiter', exactMatch: true },
    { id: 7, name: 'Jessica Smith', company: 'JobMatch', position: 'Recruitment Specialist', exactMatch: false },
  ];
  
  // Filter results based on position selection (similar to what was done on frontend)
  let filteredResults = [...dummyLeadResults];
  
  if (positionTitle === 'recruitment') {
    filteredResults = dummyLeadResults.filter(r => r.position.toLowerCase().includes('recruit'));
  } else if (positionTitle === 'investment') {
    // Replace with investment-related positions in a real app
    filteredResults = dummyLeadResults.slice(0, 3).map(r => ({
      ...r,
      position: r.position.replace('Recruitment', 'Investment')
    }));
  } else if (positionTitle === 'c-level') {
    // Replace with c-level positions in a real app
    filteredResults = dummyLeadResults.slice(3, 6).map(r => ({
      ...r,
      position: 'C' + r.position
    }));
  }
  
  console.log('LEAD SEARCH RESULT:');
  console.log(`Found ${filteredResults.length} leads for ${company}`);
  console.log('Sample leads:');
  filteredResults.slice(0, 3).forEach((lead, index) => {
    console.log(`\nLead ${index + 1}:`);
    console.log('- Name:', lead.name);
    console.log('- Company:', lead.company);
    console.log('- Position:', lead.position);
    console.log('- Exact Match:', lead.exactMatch);
  });
  console.log('================================================\n');
  
  // Add the company name from the search to the response
  const responseData = {
    company,
    position: positionTitle === 'recruitment' ? 'Recruiter' : 
              positionTitle === 'investment' ? 'Investor' : 'Executive',
    results: filteredResults,
    pipelineId,
    leadDocId
  };
  
  // Return the search results
  res.json({
    status: 'success',
    message: 'Targeted leads search processed',
    data: responseData
  });
});

// Team Members route
app.post('/teamMembers', (req, res) => {
  const { userID, url, teamId, companySearchId } = req.body;
  
  // Log the received data
  console.log('\n========== TEAM MEMBERS SEARCH REQUEST ==========');
  console.log('User ID:', userID);
  console.log('Company URL:', url);
  console.log('Team ID:', teamId);
  console.log('Company Search ID:', companySearchId);
  console.log('================================================\n');
  
  // Generate dummy team member data
  const teamMembers = [
    { id: 1, name: 'John Smith', position: 'CEO', linkedinUrl: 'https://linkedin.com/in/john-smith' },
    { id: 2, name: 'Emily Johnson', position: 'CTO', linkedinUrl: 'https://linkedin.com/in/emily-johnson' },
    { id: 3, name: 'Michael Chen', position: 'VP of Engineering', linkedinUrl: 'https://linkedin.com/in/michael-chen' },
    { id: 4, name: 'Sophia Garcia', position: 'Head of Marketing', linkedinUrl: 'https://linkedin.com/in/sophia-garcia' },
    { id: 5, name: 'David Kim', position: 'CFO', linkedinUrl: 'https://linkedin.com/in/david-kim' }
  ];
  
  console.log('TEAM MEMBER SEARCH RESULT:');
  console.log(`Found ${teamMembers.length} team members for ${url}`);
  console.log('================================================\n');
  
  // For now, just return the data as is with dummy team member data
  res.json({ 
    status: 'success',
    message: 'Team members search request received',
    data: { 
      userID, 
      url, 
      teamId, 
      companySearchId,
      teamMembers
    } 
  });
});

// Login route
app.post('/login', async (req, res) => {
  const { uid, email } = req.body;
  
  console.log('Login request received:');
  console.log('User ID:', uid);
  console.log('Email:', email);
  
  try {
    // Update last login timestamp in Firestore
    await updateLastLogin(uid);
    
    res.json({
      status: 'success',
      message: 'Login successful, user data updated',
      data: { uid, email }
    });
  } catch (error) {
    console.error('Error updating last login:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update login timestamp',
      error: error.message
    });
  }
});

// Signup route
app.post('/signup', async (req, res) => {
  const { uid, email, fullName, username } = req.body;
  
  console.log('Signup request received:');
  console.log('User ID:', uid);
  console.log('Email:', email);
  console.log('Full Name:', fullName);
  console.log('Username:', username);
  
  try {
    // Create user in Firestore
    await createUser({ uid, email, fullName, username });
    
    res.json({
      status: 'success',
      message: 'User created successfully',
      data: { 
        uid, 
        email, 
        fullName, 
        username,
        linkCredits: 50,  // Initial credits
        totalSearched: 0,
        totalFound: 0
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create user',
      error: error.message
    });
  }
});

// Update credits route
app.post('/updateCredits', async (req, res) => {
  const { uid, creditsUsed, resultsFound } = req.body;
  
  console.log('Update credits request received:');
  console.log('User ID:', uid);
  console.log('Credits Used:', creditsUsed);
  console.log('Results Found:', resultsFound);
  
  try {
    // Update user credits in Firestore
    const result = await updateCreditUsage(uid, creditsUsed, resultsFound);
    
    res.json({
      status: 'success',
      message: 'User credits updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating credits:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update credits',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    error: err.message
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Available routes:`);
  console.log(`- GET /`);
  console.log(`- POST /login`);
  console.log(`- POST /signup`);
  console.log(`- POST /updateCredits`);
  console.log(`- POST /findSingleContact`);
  console.log(`- POST /findBatchContact`);
  console.log(`- POST /findTargetedLeads`);
  console.log(`- POST /teamMembers`);
}); 