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
  const { userID, fileName, timestamp, contacts } = req.body;
  
  console.log('========== BATCH CONTACT SEARCH REQUEST ==========');
  console.log('User ID:', userID);
  console.log('File Name:', fileName);
  console.log('Timestamp:', new Date(timestamp).toLocaleString());
  console.log('Number of contacts:', contacts?.length || 0);
  console.log('================================================');
  
  // Process each contact and generate LinkedIn URLs
  const processedContacts = contacts.map(contact => {
    const {searchName, searchCompany, searchPosition} = contact;
    
    // Log each contact being processed
    console.log(`Processing contact: ${searchName} - ${searchCompany} - ${searchPosition}`);
    
    // Generate LinkedIn URL (simplified for demo)
    const linkedinProfileUrl = `https://www.linkedin.com/in/${searchName.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Simulate finding profiles (in a real app, this would call an actual search service)
    // For demo purposes, we'll randomly determine if a profile is found
    const foundData = Math.random() > 0.3 ? 1 : 0;
    
    console.log(`Result for ${searchName}: ${foundData > 0 ? 'Found' : 'Not Found'}`);
    
    return {
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
}); 