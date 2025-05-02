const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const { firebaseInitialized } = require('./firebase');
const { findSingleLinkedinContact, startBatchProcessing } = require('./linkedinService');
const { findRecruitersAtCompany } = require('./leadGenerator');
const { findTeamMembersFromWebsite } = require('./teamMembers');
const dbService = require('./dbService');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');
const { log } = require('./utils');

const app = express();
const PORT = process.env.PORT || 3008;

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
    log(`Processing webhook event: ${event.type}`);
    
    switch (event.type) {
      case 'checkout.session.completed':
        // Payment is successful and the subscription is created
        log('Checkout session completed:', dataObject.id);
        log('Payment status:', dataObject.payment_status);
        
        // If payment was successful
        if (dataObject.payment_status === 'paid') {
          const { userId, totalCredits, planName } = dataObject.metadata;
          
          // Only process if we have a real user
          if (userId && userId !== 'guest') {
            // Add credits to user account
            await dbService.addCreditsToUser(userId, parseInt(totalCredits));
            log(`Added ${totalCredits} credits to user ${userId}`);
            
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
        log('Payment intent succeeded:', dataObject.id);
        
        // If you have metadata attached to the payment intent
        if (dataObject.metadata && dataObject.metadata.userId) {
          const userId = dataObject.metadata.userId;
          const creditsPurchased = parseInt(dataObject.metadata.totalCredits || 0);
          const planName = dataObject.metadata.planName || 'Credit Purchase';
          
          log(`Payment succeeded for user: ${userId}`);
          
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
        log('Payment intent processing:', dataObject.id);
        
        // If you have metadata attached to the payment intent
        if (dataObject.metadata && dataObject.metadata.userId) {
          const userId = dataObject.metadata.userId;
          const creditsPurchased = parseInt(dataObject.metadata.totalCredits || 0);
          const planName = dataObject.metadata.planName || 'Credit Purchase';
          
          log(`Payment processing for user: ${userId}`);
          
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
        log('Payment intent failed:', dataObject.id);
        log('Failure reason:', dataObject.last_payment_error?.message);
        
        // If you have metadata attached to the payment intent
        if (dataObject.metadata && dataObject.metadata.userId) {
          const userId = dataObject.metadata.userId;
          const creditsPurchased = parseInt(dataObject.metadata.totalCredits || 0);
          const planName = dataObject.metadata.planName || 'Credit Purchase';
          const errorMessage = dataObject.last_payment_error?.message || 'Payment failed';
          
          log(`Payment failed for user: ${userId}`);
          
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
        log('Payment intent requires action:', dataObject.id);
        
        // If you have metadata attached to the payment intent
        if (dataObject.metadata && dataObject.metadata.userId) {
          const userId = dataObject.metadata.userId;
          const creditsPurchased = parseInt(dataObject.metadata.totalCredits || 0);
          const planName = dataObject.metadata.planName || 'Credit Purchase';
          
          log(`Payment requires action for user: ${userId}`);
          
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
        log(`Unhandled event type: ${event.type}`);
    }
    
    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
  } catch (err) {
    log(`Webhook Error: ${err.message}`);
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
    log('Error getting payment history:', error);
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
    log('Error getting user credits:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error getting user credits', 
      error: error.message 
    });
  }
});

// Refresh user credits - used after searches to update the frontend
app.get('/refresh-credits/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }
    
    // Get user data from Firestore
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
    
    // Return the latest credit information
    return res.status(200).json({
      success: true,
      data: {
        userId: userId,
        linkCredits: userData.linkCredits || 0,
        lastCreditUpdate: userData.lastCreditUpdate?.toDate() || null
      }
    });
  } catch (error) {
    log('Error refreshing user credits:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error refreshing user credits', 
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
    log('Error getting payment details:', error);
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
    log('Error getting payment status:', error);
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
    log('Error creating checkout session:', error);
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
    log('Error verifying payment:', error);
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
      log('Firebase not initialized. Using mock authentication.');
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
    log('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// Signup route
app.post('/signup', async (req, res) => {
  try {
    const { email, password, name, uid } = req.body;
    
    if (!firebaseInitialized) {
      log('Firebase not initialized. Using mock signup.');
      // Mock success response for development when Firebase is not available
      return res.status(200).json({
        success: true,
        userId: 'mock-user-' + Date.now(),
        message: 'Mock signup successful (Firebase not initialized)',
        linkCredits: 50
      });
    }
    
    // Check if user already exists
    const existingUser = await dbService.findUserByEmail(email);
    
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    // Create new user - remove username field
    const userData = {
      email,
      password, // In a real app, you'd hash this password
      name,
      uid, // Pass the Firebase Auth UID to be used as document ID
      linkCredits: 50, // Default credits for new users
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
    log('Signup error:', error);
    return res.status(500).json({ success: false, message: 'Server error during signup' });
  }
});

// Update credits route
app.post('/updateCredits', async (req, res) => {
  try {
    // This route is now deprecated - credits are handled by updateSearchCost
    // Returning a message to let clients know
    return res.status(200).json({
      success: true,
      message: 'Credit deduction is now handled automatically per search',
      data: {
        linkCredits: null,
        totalSearched: null,
        totalFound: null,
        info: 'This endpoint is deprecated'
      }
    });
    
    /* DEPRECATED IMPLEMENTATION
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
    */
  } catch (error) {
    log('Update credits error:', error);
    return res.status(500).json({ success: false, message: 'Server error during credit update' });
  }
});

// Find single contact route
app.post('/findSingleContact', async (req, res) => {
  const { userID, searchName, searchCompany, searchPosition } = req.body;
  
  log(`[SINGLE CONTACT] ${searchName} at ${searchCompany}`, 'info');
  
  // Use our LinkedIn search functionality to find the actual profile
  try {
    // Find the LinkedIn contact - pass userID to properly track history and credits
    const result = await findSingleLinkedinContact(searchName, searchCompany, searchPosition, userID);
  
    // Log the result status
    if (result.success) {
      log(`Result: Found`, 'info');
    } else {
      log(`Result: Not found`, 'info');
    }
    
    // Return the search result
    return res.json({
      success: true,
      linkedInUrl: result.linkedInUrl || "",
      message: result.message,
      historyId: result.historyId
    });
  } catch (error) {
    // Handle errors
    return res.status(500).json({
      success: false,
      message: `Error: ${error.message}`
    });
  }
});

// Find batch contacts route
app.post('/findBatchContact', async (req, res) => {
  const { userID, fileName, timestamp, contacts } = req.body;
  
  log(`[BATCH CONTACT] ${fileName} with ${contacts?.length || 0} contacts`, 'info');
  
  // Generate batch info
  const batchInfo = {
    fileName: fileName || 'Unknown File',
    timestamp: timestamp || Date.now()
  };
  
  let historyId = null;
  
  try {
    // Create search history entry
    historyId = await dbService.addSearchHistory(userID, {
      type: "bulk",
      status: "pending",
      inputMeta: {
        fileName: batchInfo.fileName,
        totalContacts: contacts?.length || 0
      },
      totalRecords: contacts?.length || 0,
      resultsCount: 0,
      resultRefPath: "searchResults",
      startedAt: new Date()
    });
    
    log(`Created history entry with ID: ${historyId}`, 'debug');
  } catch (err) {
    log('Error in search history: ' + err.message, 'error');
    // Continue processing - don't fail the whole request
  }
  
  // Start batch processing in the background
  const processingInfo = startBatchProcessing(contacts, userID, batchInfo, historyId);
  
  // Return immediate response with processing status
  return res.json({
    success: true,
    message: processingInfo.message,
    historyId: historyId
  });
});

// Find targeted leads route
app.post('/findTargetedLeads', async (req, res) => {
  const { userID, company, positionTitle, pipelineId, leadDocId } = req.body;
  
  log(`[TARGETED LEADS] ${positionTitle} at ${company}`, 'info');
  
  try {
    // Call the lead generator service to find recruiters
    const results = await findRecruitersAtCompany(company, userID, positionTitle);
    
    log(`Found ${results.data.length} leads`, 'info');
    
    // Format the results for frontend compatibility
    return res.json({
      success: true,
      message: results.message,
      leads: results.data,
      historyId: results.historyId
    });
  } catch (error) {
    log(`Error in targeted leads search: ${error.message}`, 'error');
    
    // Return error response
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Team Members route
app.post('/findTeamMembers', async (req, res) => {
  const { userID, url, teamId, companySearchId } = req.body;
  
  log(`[TEAM MEMBERS] URL: ${url}`, 'info');
  
  try {
    // Call the findTeamMembersFromWebsite function from teamMembers.js
    const results = await findTeamMembersFromWebsite(url, userID);
    
    log(`Found ${results.data.length} team members`, 'info');
    
    // Format the team members for the frontend
    return res.json({
      success: true,
      message: results.message,
      teamMembers: results.data,
      historyId: results.historyId
    });
  } catch (error) {
    log(`Error in team members search: ${error.message}`, 'error');
    
    // Return error response
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  log(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    error: err.message
  });
});

// Start the server
app.listen(PORT, () => {
  log(`Server running on http://localhost:${PORT}`);
  log(`Available routes:`);
  log(`- GET /`);
  log(`- POST /login`);
  log(`- POST /signup`);
  log(`- POST /updateCredits`);
  log(`- POST /findSingleContact`);
  log(`- POST /findBatchContact`);
  log(`- POST /findTargetedLeads`);
  log(`- POST /findTeamMembers`);
});