const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const { firebaseInitialized } = require('./firebase');
const { findSingleLinkedinContact, startBatchProcessing } = require('./linkedinService');
const dbService = require('./dbService');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3005;

// Important: The webhook route needs raw body for signature verification
// This route must be defined before JSON body parser middleware
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    // Always use the raw body for webhook signature verification
    event = stripe.webhooks.constructEvent(
      req.body, 
      signature, 
      endpointSecret
    );
    
    // Extract the object from the event
    const dataObject = event.data.object;
    console.log(`Processing webhook event: ${event.type}`);
    
    switch (event.type) {
      case 'checkout.session.completed':
        // Payment is successful and the subscription is created
        console.log('Checkout session completed:', dataObject.id);
        console.log('Payment status:', dataObject.payment_status);
        
        // If payment was successful
        if (dataObject.payment_status === 'paid') {
          const { userId, totalCredits, planName } = dataObject.metadata;
          
          // Only process if we have a real user
          if (userId && userId !== 'guest') {
            // Add credits to user account
            await dbService.addCreditsToUser(userId, parseInt(totalCredits));
            console.log(`Added ${totalCredits} credits to user ${userId}`);
            
            // Update payment status in database with details
            const paymentDetails = {
              userId: userId,
              creditsPurchased: parseInt(totalCredits),
              amountUSD: dataObject.amount_total / 100, // Convert from cents to dollars
              planName: planName || 'Credit Purchase',
              paymentProvider: 'Stripe'
            };
            
            await dbService.updatePaymentStatus(
              dataObject.id, 
              'completed', 
              null, 
              paymentDetails
            );
          }
        }
        break;
        
      case 'payment_intent.succeeded':
        // Payment was successful
        console.log('Payment intent succeeded:', dataObject.id);
        
        // If you have metadata attached to the payment intent
        if (dataObject.metadata && dataObject.metadata.userId) {
          const userId = dataObject.metadata.userId;
          const creditsPurchased = parseInt(dataObject.metadata.totalCredits || 0);
          const planName = dataObject.metadata.planName || 'Credit Purchase';
          
          console.log(`Payment succeeded for user: ${userId}`);
          
          // Update payment status in database with details
          const paymentDetails = {
            userId: userId,
            creditsPurchased: creditsPurchased,
            amountUSD: dataObject.amount / 100, // Convert from cents to dollars
            planName: planName,
            paymentProvider: 'Stripe'
          };
          
          await dbService.updatePaymentStatus(
            dataObject.id, 
            'succeeded', 
            null, 
            paymentDetails
          );
        }
        break;
        
      case 'payment_intent.processing':
        // Payment is processing (for payment methods that take time)
        console.log('Payment intent processing:', dataObject.id);
        
        // If you have metadata attached to the payment intent
        if (dataObject.metadata && dataObject.metadata.userId) {
          const userId = dataObject.metadata.userId;
          const creditsPurchased = parseInt(dataObject.metadata.totalCredits || 0);
          const planName = dataObject.metadata.planName || 'Credit Purchase';
          
          console.log(`Payment processing for user: ${userId}`);
          
          // Update payment status in database with details
          const paymentDetails = {
            userId: userId,
            creditsPurchased: creditsPurchased,
            amountUSD: dataObject.amount / 100, // Convert from cents to dollars
            planName: planName,
            paymentProvider: 'Stripe'
          };
          
          await dbService.updatePaymentStatus(
            dataObject.id, 
            'processing', 
            null, 
            paymentDetails
          );
        }
        break;
        
      case 'payment_intent.payment_failed':
        // Payment attempt failed
        console.log('Payment intent failed:', dataObject.id);
        console.log('Failure reason:', dataObject.last_payment_error?.message);
        
        // If you have metadata attached to the payment intent
        if (dataObject.metadata && dataObject.metadata.userId) {
          const userId = dataObject.metadata.userId;
          const creditsPurchased = parseInt(dataObject.metadata.totalCredits || 0);
          const planName = dataObject.metadata.planName || 'Credit Purchase';
          const errorMessage = dataObject.last_payment_error?.message || 'Payment failed';
          
          console.log(`Payment failed for user: ${userId}`);
          
          // Update payment status in database with details
          const paymentDetails = {
            userId: userId,
            creditsPurchased: creditsPurchased,
            amountUSD: dataObject.amount / 100, // Convert from cents to dollars
            planName: planName,
            paymentProvider: 'Stripe'
          };
          
          await dbService.updatePaymentStatus(
            dataObject.id, 
            'failed', 
            errorMessage, 
            paymentDetails
          );
        }
        break;
        
      case 'payment_intent.requires_action':
        // Additional action needed (like 3D Secure)
        console.log('Payment intent requires action:', dataObject.id);
        
        // If you have metadata attached to the payment intent
        if (dataObject.metadata && dataObject.metadata.userId) {
          const userId = dataObject.metadata.userId;
          const creditsPurchased = parseInt(dataObject.metadata.totalCredits || 0);
          const planName = dataObject.metadata.planName || 'Credit Purchase';
          
          console.log(`Payment requires action for user: ${userId}`);
          
          // Update payment status in database with details
          const paymentDetails = {
            userId: userId,
            creditsPurchased: creditsPurchased,
            amountUSD: dataObject.amount / 100, // Convert from cents to dollars
            planName: planName,
            paymentProvider: 'Stripe'
          };
          
          await dbService.updatePaymentStatus(
            dataObject.id, 
            'requires_action', 
            null, 
            paymentDetails
          );
        }
        break;
        
      default:
        // Unhandled event type
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Middleware - AFTER the webhook route
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.send('Hello Duniya');
});

// Get user payment history
app.get('/payment-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }
    
    // Get payment history from user's subcollection
    const db = admin.firestore();
    const paymentHistoryRef = db.collection('users').doc(userId).collection('paymentHistory');
    const query = paymentHistoryRef.orderBy('createdAt', 'desc').limit(50);
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return res.status(200).json({ 
        success: true,
        message: 'No payment history found',
        data: []
      });
    }
    
    // Map payment history documents to objects
    const paymentHistory = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || null,
      updatedAt: doc.data().updatedAt?.toDate() || null,
      timestamp: doc.data().timestamp || null
    }));
    
    return res.status(200).json({
      success: true,
      data: paymentHistory
    });
  } catch (error) {
    console.error('Error getting payment history:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error getting payment history', 
      error: error.message 
    });
  }
});

// Get user's credits
app.get('/user-credits/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }
    
    // Get user data
    const db = admin.firestore();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const userData = userDoc.data();
    
    // Return user's credits
    return res.status(200).json({
      success: true,
      data: {
        userId: userId,
        linkCredits: userData.linkCredits || 0,
        lastCreditUpdate: userData.lastCreditUpdate?.toDate() || null
      }
    });
  } catch (error) {
    console.error('Error getting user credits:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error getting user credits', 
      error: error.message 
    });
  }
});

// Get single payment details
app.get('/payment-details/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    if (!paymentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment ID is required' 
      });
    }
    
    // Get payment details from paymentResults collection
    const db = admin.firestore();
    const paymentResultsRef = db.collection('paymentResults');
    const query = paymentResultsRef.where('paymentId', '==', paymentId);
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }
    
    // Get the payment document
    const paymentDoc = snapshot.docs[0];
    const paymentData = paymentDoc.data();
    
    // Return payment details
    return res.status(200).json({
      success: true,
      data: {
        id: paymentDoc.id,
        ...paymentData,
        createdAt: paymentData.createdAt?.toDate() || null,
        updatedAt: paymentData.updatedAt?.toDate() || null
      }
    });
  } catch (error) {
    console.error('Error getting payment details:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error getting payment details', 
      error: error.message 
    });
  }
});

// Get payment status endpoint
app.get('/payment-status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    if (!paymentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment ID is required' 
      });
    }
    
    // Get payment status from database
    const db = admin.firestore();
    const paymentsRef = db.collection('payments');
    const query = paymentsRef.where('paymentId', '==', paymentId);
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }
    
    // Get the payment document
    const paymentDoc = snapshot.docs[0];
    const paymentData = paymentDoc.data();
    
    // Return payment status
    return res.status(200).json({
      success: true,
      data: {
        id: paymentDoc.id,
        paymentId: paymentData.paymentId,
        status: paymentData.status,
        errorMessage: paymentData.errorMessage || null,
        updatedAt: paymentData.updatedAt?.toDate() || null,
        createdAt: paymentData.createdAt?.toDate() || null,
        statusHistory: paymentData.statusHistory?.map(item => ({
          status: item.status,
          timestamp: item.timestamp?.toDate() || null,
          errorMessage: item.errorMessage || null
        })) || []
      }
    });
  } catch (error) {
    console.error('Error getting payment status:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error getting payment status', 
      error: error.message 
    });
  }
});

// Stripe payment routes
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { planName, price, credits, bonusCredits, userId } = req.body;
    const totalCredits = credits + (bonusCredits || 0);
    
    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${planName} Credit Package`,
              description: `${credits} credits${bonusCredits ? ` + ${bonusCredits} bonus credits` : ''}`,
            },
            unit_amount: price * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pricing`,
      metadata: {
        userId: userId || 'guest',
        credits: credits.toString(),
        bonusCredits: (bonusCredits || 0).toString(),
        totalCredits: totalCredits.toString(),
        planName: planName
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Payment Success Verification
app.get('/verify-payment/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Retrieve the session to verify payment was successful
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      // Payment was successful
      const { userId, credits, bonusCredits, totalCredits } = session.metadata;
      
      // If userId is provided (user is logged in), add credits to their account
      if (userId && userId !== 'guest') {
        // Add credits to user account
        const creditsToAdd = parseInt(totalCredits);
        await dbService.addCreditsToUser(userId, creditsToAdd);
        
        return res.status(200).json({
          success: true,
          message: 'Payment verified and credits added successfully',
          data: {
            userId,
            creditsAdded: creditsToAdd,
            planName: session.metadata.planName
          }
        });
      } else {
        return res.status(200).json({
          success: true,
          message: 'Payment verified, but no user was logged in to add credits',
          data: {
            planName: session.metadata.planName,
            totalCredits
          }
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Payment has not been completed',
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
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
        linkCredits: 100
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
      linkCredits: user.data.linkCredits || 0
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// Signup route
app.post('/signup', async (req, res) => {
  try {
    const { email, password, name, uid } = req.body;
    
    if (!firebaseInitialized) {
      console.warn('Firebase not initialized. Using mock signup.');
      // Mock success response for development when Firebase is not available
      return res.status(200).json({
        success: true,
        userId: 'mock-user-' + Date.now(),
        message: 'Mock signup successful (Firebase not initialized)',
        linkCredits: 10
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
      uid, // Pass the Firebase Auth UID to be used as document ID
      linkCredits: 10, // Default credits for new users
      createdAt: new Date()
    };
    
    const userId = await dbService.createUser(userData);
    
    return res.status(200).json({
      success: true,
      userId: userId,
      message: 'Signup successful',
      linkCredits: userData.linkCredits
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
      status: "pending", // Change from "pending" to "completed" since we're using dummy data
      inputMeta: {
        company: company,
        position: positionTitle
      },
      totalRecords: filteredResults.length,
      resultRefPath: "searchResults", // Reference to global collection (placeholder)
      completedAt: new Date() // Mark as completed immediately for dummy data
    });
    
    // Store exact match results in searchResults collection
    if (historyId) {
      // Find exact matches
      const exactMatches = filteredResults.filter(result => result.exactMatch === true);
      console.log(`Storing ${exactMatches.length} exact matches in searchResults collection`);
      
      // Array to collect all resultIds
      const resultIds = [];
      
      // Loop through exact matches and store them
      for (const match of exactMatches) {
        // Format the search data to match what addSearchResult expects
        const searchData = {
          name: match.name,
          company: match.company,
          position: match.position
        };
        
        // Generate a LinkedIn URL (dummy for now)
        // In a real app, this would come from actual search results
        const formattedName = match.name.toLowerCase().replace(/\s+/g, '-');
        const linkedinUrl = match.linkedinUrl || `https://www.linkedin.com/in/${formattedName}`;
        
        // Store in searchResults collection using historyId as searchId
        const resultId = await dbService.addSearchResult(
          userID, 
          historyId, 
          "recruiters", 
          searchData,
          linkedinUrl
        );
        
        // Store the resultId in our array if it exists
        if (resultId) {
          resultIds.push(resultId);
        }
        
        console.log(`Stored search result with ID: ${resultId}`);
      }
      
      // Update the search history with resultIds array and set status to completed
      await dbService.updateSearchHistory(userID, historyId, {
        status: "completed",
        resultsCount: exactMatches.length,
        resultIds: resultIds // Store the array of resultIds in the database
      });
      
      console.log(`Updated search history with ${resultIds.length} result IDs`);
    }
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
  
  // Generate dummy team member data - moved outside the try block so it's accessible in the response
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
  
  // Add to search history first to get the history ID - handle the response gracefully if it fails
  let historyId = null;
  try {
    historyId = await dbService.addSearchHistory(userID, {
      type: "team",
      status: "pending", // Start as pending
      inputMeta: {
        companyUrl: url
      },
      totalRecords: 0, // Will update this once we know the count
      resultRefPath: "searchResults", // Reference to global collection
      startedAt: new Date()
    });
    
    console.log(`Created search history entry with ID: ${historyId}`);
    
    // If history ID was created successfully, store team members in searchResults collection
    if (historyId) {
      // Array to collect all resultIds
      const resultIds = [];
      
      // Loop through team members and store them
      for (const member of teamMembers) {
        // Format the search data
        const searchData = {
          name: member.name,
          company: url, // Use the URL as company name as requested
          position: member.position
        };
        
        // Store in searchResults collection
        const resultId = await dbService.addSearchResult(
          userID, 
          historyId, 
          "team",  // Type is "team"
          searchData,
          member.linkedinUrl
        );
        
        // Store the resultId in our array if it exists
        if (resultId) {
          resultIds.push(resultId);
        }
        
        console.log(`Stored team member with ID: ${resultId}`);
      }
      
      // Update the search history with resultIds array and set status to completed
      await dbService.updateSearchHistory(userID, historyId, {
        status: "completed",
        totalRecords: teamMembers.length,
        resultsCount: teamMembers.length,
        resultIds: resultIds, // Store the array of resultIds in the database
        completedAt: new Date()
      });
      
      console.log(`Updated search history with ${resultIds.length} result IDs`);
    }
  } catch (err) {
    console.error('Error in team members search:', err);
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
      teamMembers: teamMembers, // Now it's accessible here
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