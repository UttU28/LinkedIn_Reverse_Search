const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

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
  
  const linkedinProfileUrl = `https://www.linkedin.com/in/${searchName.toLowerCase().replace(/\s+/g, '-')}`;
//   const linkedinProfileUrl = ``;

  console.log('Single Contact Search Request:');
  console.log('User ID:', userID);
  console.log('Search Name:', searchName);
  console.log('Search Company:', searchCompany);
  console.log('Search Position:', searchPosition);
  console.log('LinkedIn Profile URL:', linkedinProfileUrl);

  let foundData = 0;
  if (linkedinProfileUrl) {
    foundData = 0;
    // foundData = 1;
  }

  // For now, just return the received data
  res.json({
    status: 'success',
    message: 'Single contact search received',
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
  
  console.log('========== BATCH CONTACT SEARCH REQUEST ==========');
  console.log('User ID:', userID);
  console.log('File Name:', fileName);
  console.log('Timestamp:', new Date(timestamp).toLocaleString());
  console.log('Batch ID:', batchId);
  console.log('Number of contacts:', contacts?.length || 0);
  console.log('================================================');
  
  // Process each contact and generate LinkedIn URLs
  const processedContacts = contacts.map(contact => {
    const {searchName, searchCompany, searchPosition} = contact;
    
    console.log(`Processing contact: ${searchName} - ${searchCompany} - ${searchPosition}`);
    
    const linkedinProfileUrl = `https://www.linkedin.com/in/${searchName.toLowerCase().replace(/\s+/g, '-')}`;
    
    const foundData = Math.random() > 0.3 ? 1 : 0;
    
    console.log(`Result for ${searchName}: ${foundData > 0 ? 'Found' : 'Not Found'}`);
    
    return {
      batchId,
      searchName,
      searchCompany,
      searchPosition,
      linkedinProfileUrl: foundData ? linkedinProfileUrl : undefined,
      foundData
    };
  });
  
  console.log('========== BATCH PROCESSING COMPLETE ==========');
  console.log(`Found ${processedContacts.filter(c => c.foundData > 0).length} out of ${processedContacts.length} profiles`);
  
  // For now, just return the processed contacts
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
  const { userID, company, positionTitle } = req.body;
  
  console.log('========== TARGETED LEADS SEARCH REQUEST ==========');
  console.log('User ID:', userID);
  console.log('Company:', company);
  console.log('Position Title:', positionTitle);
  console.log('================================================');
  
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
    filteredResults = dummyLeadResults.slice(0, 3);
  } else if (positionTitle === 'c-level') {
    // Replace with c-level positions in a real app
    filteredResults = dummyLeadResults.slice(3, 6);
  }
  
  // Add the company name from the search to the response
  const responseData = {
    company,
    position: positionTitle === 'recruitment' ? 'Recruiter' : 
              positionTitle === 'investment' ? 'Investor' : 'Executive',
    results: filteredResults
  };
  
  // Return the search results
  res.json({
    status: 'success',
    message: 'Targeted leads search processed',
    data: responseData
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
  console.log(`- POST /findSingleContact`);
  console.log(`- POST /findBatchContact`);
  console.log(`- POST /findTargetedLeads`);
}); 