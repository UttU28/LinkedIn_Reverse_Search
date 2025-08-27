# Database Schema Documentation

## Overview
This document outlines the database schema for the LinkedIn Profile Search Backend application, focusing on Users and Find Profiles functionality.

## Database Technology
- **Primary Database**: Firebase Firestore (NoSQL)
- **Backup/Alternative**: Can operate without database (mock mode)

## Collections Structure

### 1. Users Collection (`users`)

**Collection Path**: `/users/{userId}`

**Document Structure**:
```json
{
  "email": "user@example.com",
  "password": "hashed_password",
  "name": "User Full Name",
  "uid": "firebase_auth_uid",
  "linkCredits": 100,
  "totalSearched": 0,
  "totalFound": 0,
  "lastCreditUpdate": "2024-01-01T00:00:00.000Z",
  "lastUpdated": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Field Descriptions**:
- `email`: User's email address (unique identifier)
- `password`: Hashed password for authentication
- `name`: User's full name
- `uid`: Firebase Authentication UID (used as document ID)
- `linkCredits`: Available credits for searches (default: 10 for new users)
- `totalSearched`: Total number of searches performed
- `totalFound`: Total number of successful profile finds
- `lastCreditUpdate`: Timestamp of last credit update
- `lastUpdated`: Timestamp of last user data update
- `createdAt`: User account creation timestamp

### 2. Search History Collection (`users/{userId}/searchHistory`)

**Collection Path**: `/users/{userId}/searchHistory/{historyId}`

**Document Structure**:
```json
{
  "type": "single|bulk|team|recruiters",
  "status": "pending|processing|completed|failed|error",
  "inputMeta": {
    "name": "John Doe",
    "company": "Example Corp",
    "position": "Software Engineer"
  },
  "totalRecords": 1,
  "resultsCount": 1,
  "resultIds": ["resultId1", "resultId2"],
  "resultRefPath": "searchResults",
  "costCredits": 1,
  "startedAt": "2024-01-01T00:00:00.000Z",
  "completedAt": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "errorMessage": "Error description if failed"
}
```

**Field Descriptions**:
- `type`: Type of search operation
  - `single`: Individual profile search
  - `bulk`: Batch profile search
  - `team`: Team member extraction
  - `recruiters`: Lead generation
- `status`: Current status of the search
  - `pending`: Search queued but not started
  - `processing`: Search in progress
  - `completed`: Search finished successfully
  - `failed`: Search failed
  - `error`: Search encountered an error
- `inputMeta`: Search input parameters
  - `name`: Person's name to search for
  - `company`: Company name
  - `position`: Job position/title
- `totalRecords`: Expected number of records to process
- `resultsCount`: Number of successful results found
- `resultIds`: Array of result document IDs
- `resultRefPath`: Reference path to results collection
- `costCredits`: Credits consumed for this search
- `startedAt`: When search processing began
- `completedAt`: When search processing finished
- `createdAt`: When search was created
- `errorMessage`: Error description if search failed

### 3. Search Results Collection (`searchResults`)

**Collection Path**: `/searchResults/{resultId}`

**Document Structure**:
```json
{
  "userId": "user123",
  "searchId": "historyId123",
  "type": "single|bulk|team|recruiters",
  "inputData": {
    "name": "John Doe",
    "company": "Example Corp",
    "title": "Software Engineer"
  },
  "linkedinUrl": "https://linkedin.com/in/johndoe",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Field Descriptions**:
- `userId`: Reference to the user who performed the search
- `searchId`: Reference to the search history document
- `type`: Type of search that generated this result
- `inputData`: Original search parameters
  - `name`: Person's name searched for
  - `company`: Company name searched for
  - `title`: Job title/position searched for
- `linkedinUrl`: Found LinkedIn profile URL (null if not found)
- `createdAt`: When this result was created

### 4. Payment Results Collection (`paymentResults`)

**Collection Path**: `/paymentResults/{paymentId}`

**Document Structure**:
```json
{
  "userId": "user123",
  "creditsPurchased": 100,
  "amountUSD": 29.99,
  "paymentProvider": "Stripe",
  "planName": "Starter Pack",
  "status": "completed|processing|failed|requires_action",
  "errorMessage": "Payment error description if failed",
  "paymentId": "stripe_payment_id",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Field Descriptions**:
- `userId`: Reference to the user who made the payment
- `creditsPurchased`: Number of credits purchased
- `amountUSD`: Payment amount in USD
- `paymentProvider`: Payment service provider (e.g., "Stripe")
- `planName`: Name of the credit package purchased
- `status`: Payment status
  - `completed`: Payment successful
  - `processing`: Payment being processed
  - `failed`: Payment failed
  - `requires_action`: Additional action required
- `errorMessage`: Error description if payment failed
- `paymentId`: External payment service ID
- `updatedAt`: Last update timestamp
- `createdAt`: Payment creation timestamp

### 5. User Payment History Collection (`users/{userId}/paymentHistory`)

**Collection Path**: `/users/{userId}/paymentHistory/{historyId}`

**Document Structure**:
```json
{
  "userId": "user123",
  "creditsPurchased": 100,
  "amountUSD": 29.99,
  "paymentProvider": "Stripe",
  "planName": "Starter Pack",
  "status": "completed",
  "errorMessage": "",
  "paymentId": "stripe_payment_id",
  "paymentResultId": "paymentResultId123",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Field Descriptions**:
- `userId`: Reference to the user
- `creditsPurchased`: Number of credits purchased
- `amountUSD`: Payment amount in USD
- `paymentProvider`: Payment service provider
- `planName`: Name of the credit package
- `status`: Payment status
- `errorMessage`: Error description if failed
- `paymentId`: External payment service ID
- `paymentResultId`: Reference to main payment result document
- `timestamp`: Payment timestamp
- `updatedAt`: Last update timestamp
- `createdAt`: Payment creation timestamp

## Database Relationships

### User Search Flow
```
User (users/{userId})
├── Search History (users/{userId}/searchHistory/{historyId})
│   ├── References: searchResults collection
│   └── Tracks: search progress and status
└── Payment History (users/{userId}/paymentHistory/{historyId})
    └── References: paymentResults collection
```

### Search Result Flow
```
Search History (users/{userId}/searchHistory/{historyId})
├── Contains: resultIds array
└── References: searchResults collection documents
```

### Payment Flow
```
Payment Results (paymentResults/{paymentId})
├── Main payment record
└── Referenced by: users/{userId}/paymentHistory/{historyId}
```

## Credit System

### Credit Deduction Rules
- **Single Search**: 1 credit when LinkedIn profile is found
- **Bulk Search**: 1 credit per successful result found
- **Team Search**: 1 credit per team member found
- **Lead Generator**: 1 credit per company-matching lead found

### Credit Management
- Credits are deducted only when results are found
- Failed searches don't consume credits
- Credits can be purchased through Stripe integration
- Credit balance is tracked in user document

## Data Flow Examples

### Single Profile Search
1. User submits search request
2. System creates search history entry with status "processing"
3. Google Search API finds potential matches
4. OpenAI analyzes results and extracts LinkedIn URL
5. System creates search result document
6. System updates search history with status "completed"
7. System deducts 1 credit from user account
8. System updates search history with cost information

### Bulk Profile Search
1. User uploads CSV/Excel file
2. System creates search history entry with status "pending"
3. System starts background processing
4. For each contact:
   - Perform individual search
   - Create search result document
   - Update progress
5. System updates search history with final status
6. System deducts credits based on successful results found

## Indexes and Performance

### Recommended Firestore Indexes
- `users` collection: `email` field (for user lookup)
- `searchResults` collection: `userId` and `searchId` fields
- `paymentResults` collection: `paymentId` field (for webhook processing)

### Query Optimization
- Use document references for related data
- Implement pagination for large result sets
- Cache frequently accessed user data

## Security Rules

### Firestore Security Rules (Recommended)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow access to subcollections
      match /searchHistory/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /paymentHistory/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Search results are user-specific
    match /searchResults/{resultId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Payment results are user-specific
    match /paymentResults/{paymentId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## Backup and Recovery

### Data Backup Strategy
- Firestore provides automatic backups
- Export data periodically using Firestore Admin SDK
- Maintain payment records for audit purposes
- Log all credit transactions for reconciliation

### Disaster Recovery
- Firestore automatically replicates data across regions
- Implement retry logic for failed operations
- Store critical data in multiple collections for redundancy

## Monitoring and Analytics

### Key Metrics to Track
- Total searches performed per user
- Success rate of profile finds
- Credit consumption patterns
- Payment success rates
- API usage and rate limiting

### Logging Strategy
- Log all database operations with appropriate levels
- Track credit transactions for audit trails
- Monitor search performance and success rates
- Alert on payment failures or credit issues
