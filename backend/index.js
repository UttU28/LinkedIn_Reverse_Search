const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const { firebaseInitialized } = require('./firebase');
const { findSingleLinkedinContact, startBatchProcessing } = require('./linkedinService');
const dbService = require('./dbService');

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

// Login route
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!firebaseInitialized) {
      console.warn('Firebase not initialized. Using mock authentication.');
      // Mock success response for development when Firebase is not available
      return res.status(200).json({
        success: true,
        userId: 'mock-user-123',
        message: 'Mock login successful (Firebase not initialized)',
        credits: 100
      });
    }
    
    // Find user by email
    const user = await dbService.findUserByEmail(email);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Simple password check (in a real app, you'd use proper password hashing)
    if (user.data.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    return res.status(200).json({
      success: true,
      userId: user.id,
      message: 'Login successful',
      credits: user.data.credits || 0
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// Signup route
app.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!firebaseInitialized) {
      console.warn('Firebase not initialized. Using mock signup.');
      // Mock success response for development when Firebase is not available
      return res.status(200).json({
        success: true,
        userId: 'mock-user-' + Date.now(),
        message: 'Mock signup successful (Firebase not initialized)',
        credits: 10
      });
    }
    
    // Check if user already exists
    const existingUser = await dbService.findUserByEmail(email);
    
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    // Create new user
    const userData = {
      email,
      password, // In a real app, you'd hash this password
      name,
      credits: 10, // Default credits for new users
      createdAt: new Date()
    };
    
    const userId = await dbService.createUser(userData);
    
    return res.status(200).json({
      success: true,
      userId: userId,
      message: 'Signup successful',
      credits: userData.credits
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ success: false, message: 'Server error during signup' });
  }
});

// Update credits route
app.post('/updateCredits', async (req, res) => {
  try {
    const { uid, creditsUsed, resultsFound } = req.body;
    
    if (!uid) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    
    // Update user credits
    const updatedData = await dbService.updateUserCredits(uid, creditsUsed, resultsFound);
    
    if (!updatedData) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Credits updated successfully',
      data: updatedData
    });
  } catch (error) {
    console.error('Update credits error:', error);
    return res.status(500).json({ success: false, message: 'Server error during credit update' });
  }
});

// Find single contact route
app.post('/findSingleContact', async (req, res) => {
  const { userID, searchName, searchCompany, searchPosition } = req.body;
  
  console.log('\n========== SINGLE CONTACT SEARCH REQUEST ==========');
  console.log('User ID:', userID);
  console.log('Search Name:', searchName);
  console.log('Search Company:', searchCompany);
  console.log('Search Position:', searchPosition);
  console.log('================================================\n');

  // Use our LinkedIn search functionality to find the actual profile
  const result = await findSingleLinkedinContact(searchName, searchCompany, searchPosition);
  
  // Set found data based on the search result
  const foundData = result.success ? 1 : 0;
  const linkedinProfileUrl = result.linkedInUrl || '';

  console.log('SEARCH RESULT:');
  console.log('LinkedIn Profile URL:', linkedinProfileUrl);
  console.log('Found Data:', foundData);
  console.log('Search Message:', result.message);
  console.log('================================================\n');

  // Add to search history - handle the response gracefully if it fails
  let historyId = null;
  try {
    historyId = await dbService.addSearchHistory(userID, {
      type: "single",
      status: foundData > 0 ? "completed" : "failed",
      inputMeta: {
        name: searchName,
        company: searchCompany,
        position: searchPosition,
        linkedin: linkedinProfileUrl
      },
      totalRecords: 1,
      resultRefPath: "searchResults", // Reference to global collection (placeholder)
      completedAt: foundData > 0 ? new Date() : null // Only set completed if found
    });
    
    // Store search result data if we have a history ID
    if (historyId) {
      const searchData = {
        name: searchName,
        company: searchCompany,
        position: searchPosition
      };
      
      await dbService.addSearchResult(userID, historyId, "single", searchData, linkedinProfileUrl);
    }
  } catch (err) {
    console.error('Error in search history:', err);
    // Continue processing - don't fail the whole request
  }

  // Return the search result to the frontend
  res.json({
    status: 'success',
    message: result.message || 'Single contact search completed',
    data: {
      userID,
      searchName,
      searchCompany,
      searchPosition,
      linkedinProfileUrl,
      foundData,
      historyId // This will be null if history creation failed
    }
  });
});

// Find batch contacts route
app.post('/findBatchContact', async (req, res) => {
  const { userID, fileName, timestamp, contacts } = req.body;
  
  console.log('\n========== BATCH CONTACT SEARCH REQUEST ==========');
  console.log('User ID:', userID);
  console.log('File Name:', fileName);
  console.log('Timestamp:', new Date(timestamp).toLocaleString());
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
  
  // Generate batch info
  const batchInfo = {
    fileName,
    timestamp: timestamp || Date.now()
  };
  
  // Add to search history first to get the history ID
  let historyId = null;
  try {
    historyId = await dbService.addSearchHistory(userID, {
      type: "bulk",
      status: "pending", // Start as pending since we're processing in background
      inputMeta: {
        fileName: fileName
      },
      totalRecords: contacts.length,
      resultRefPath: "searchResults", // Reference to global collection (placeholder)
      startedAt: new Date()
    });
    
    console.log(`Created search history entry with ID: ${historyId}`);
  } catch (err) {
    console.error('Error in search history:', err);
    // Continue processing - don't fail the whole request
  }
  
  // Start the batch processing with the history ID
  const processingInfo = startBatchProcessing(contacts, userID, batchInfo, historyId);
  
  // Return the initial response to the frontend immediately
  // Include an empty contacts array for backwards compatibility with frontend
  res.json({
    status: 'success',
    message: 'Batch contact search started in background',
    data: {
      ...processingInfo,
      contacts: [], // Add empty contacts array for backwards compatibility
      historyId // Include the history ID in the response
    }
  });
});

// Find targeted leads route
app.post('/findTargetedLeads', async (req, res) => {
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
  
  // Add to search history - handle the response gracefully if it fails
  let historyId = null;
  try {
    historyId = await dbService.addSearchHistory(userID, {
      type: "recruiters",
      status: "pending", // Start as pending
      inputMeta: {
        company: company
      },
      totalRecords: filteredResults.length,
      resultRefPath: "searchResults", // Reference to global collection (placeholder)
      completedAt: filteredResults.length > 0 ? new Date() : null
    });
  } catch (err) {
    console.error('Error in search history:', err);
    // Continue processing - don't fail the whole request
  }
  
  // Add the company name from the search to the response
  const responseData = {
    company,
    position: positionTitle === 'recruitment' ? 'Recruiter' : 
              positionTitle === 'investment' ? 'Investor' : 'Executive',
    results: filteredResults,
    pipelineId,
    leadDocId,
    historyId // This will be null if history creation failed
  };
  
  // Return the search results
  res.json({
    status: 'success',
    message: 'Targeted leads search processed',
    data: responseData
  });
});

// Team Members route
app.post('/findTeamMembers', async (req, res) => {
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
  
  // Add to search history - handle the response gracefully if it fails
  let historyId = null;
  try {
    historyId = await dbService.addSearchHistory(userID, {
      type: "team",
      status: "pending", // Start as pending
      inputMeta: {
        companyUrl: url
      },
      totalRecords: teamMembers.length,
      resultRefPath: "searchResults", // Reference to global collection (placeholder)
      completedAt: teamMembers.length > 0 ? new Date() : null
    });
  } catch (err) {
    console.error('Error in search history:', err);
    // Continue processing - don't fail the whole request
  }
  
  // For now, just return the data as is with dummy team member data
  res.json({ 
    status: 'success',
    message: 'Team members search request received',
    data: { 
      userID, 
      url, 
      teamId, 
      companySearchId,
      teamMembers,
      historyId // This will be null if history creation failed
    } 
  });
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
  console.log(`- POST /findTeamMembers`);
}); 