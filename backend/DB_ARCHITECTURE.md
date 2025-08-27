# Database Architecture Diagram

## Visual Database Structure

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    FIRESTORE DATABASE                              │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    COLLECTIONS                                    │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ 1. USERS COLLECTION                                                               │
│ ┌─────────────────────────────────────────────────────────────────────────────┐   │
│ │ Document ID: {userId} (Firebase Auth UID)                                 │   │
│ ├─────────────────────────────────────────────────────────────────────────────┤   │
│ │ email: "user@example.com"                                                 │   │
│ │ password: "hashed_password"                                                │   │
│ │ name: "User Full Name"                                                     │   │
│ │ uid: "firebase_auth_uid"                                                   │   │
│ │ linkCredits: 100                                                           │   │
│ │ totalSearched: 0                                                           │   │
│ │ totalFound: 0                                                              │   │
│ │ lastCreditUpdate: "2024-01-01T00:00:00.000Z"                              │   │
│ │ lastUpdated: "2024-01-01T00:00:00.000Z"                                   │   │
│ │ createdAt: "2024-01-01T00:00:00.000Z"                                     │   │
│ └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1:N Relationship
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ 2. SEARCH HISTORY SUBCOLLECTION                                                  │
│ ┌─────────────────────────────────────────────────────────────────────────────┐   │
│ │ Collection Path: users/{userId}/searchHistory/{historyId}                  │   │
│ ├─────────────────────────────────────────────────────────────────────────────┤   │
│ │ type: "single|bulk|team|recruiters"                                       │   │
│ │ status: "pending|processing|completed|failed|error"                       │   │
│ │ inputMeta: {                                                               │   │
│ │   name: "John Doe",                                                        │   │
│ │   company: "Example Corp",                                                 │   │
│ │   position: "Software Engineer"                                            │   │
│ │ }                                                                          │   │
│ │ totalRecords: 1                                                            │   │
│ │ resultsCount: 1                                                            │   │
│ │ resultIds: ["resultId1", "resultId2"]                                     │   │
│ │ resultRefPath: "searchResults"                                             │   │
│ │ costCredits: 1                                                             │   │
│ │ startedAt: "2024-01-01T00:00:00.000Z"                                    │   │
│ │ completedAt: "2024-01-01T00:00:00.000Z"                                  │   │
│ │ createdAt: "2024-01-01T00:00:00.000Z"                                    │   │
│ │ errorMessage: "Error description if failed"                               │   │
│ └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ References (resultIds array)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ 3. SEARCH RESULTS COLLECTION                                                    │
│ ┌─────────────────────────────────────────────────────────────────────────────┐   │
│ │ Collection Path: /searchResults/{resultId}                                 │   │
│ ├─────────────────────────────────────────────────────────────────────────────┤   │
│ │ userId: "user123"                                                          │   │
│ │ searchId: "historyId123"                                                   │   │
│ │ type: "single|bulk|team|recruiters"                                       │   │
│ │ inputData: {                                                               │   │
│ │   name: "John Doe",                                                        │   │
│ │   company: "Example Corp",                                                 │   │
│ │   title: "Software Engineer"                                               │   │
│ │ }                                                                          │   │
│ │ linkedinUrl: "https://linkedin.com/in/johndoe"                            │   │
│ │ createdAt: "2024-01-01T00:00:00.000Z"                                    │   │
│ └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ 4. PAYMENT RESULTS COLLECTION                                                   │
│ ┌─────────────────────────────────────────────────────────────────────────────┐   │
│ │ Collection Path: /paymentResults/{paymentId}                               │   │
│ ├─────────────────────────────────────────────────────────────────────────────┤   │
│ │ userId: "user123"                                                          │   │
│ │ creditsPurchased: 100                                                      │   │
│ │ amountUSD: 29.99                                                           │   │
│ │ paymentProvider: "Stripe"                                                  │   │
│ │ planName: "Starter Pack"                                                   │   │
│ │ status: "completed|processing|failed|requires_action"                      │   │
│ │ errorMessage: "Payment error description if failed"                        │   │
│ │ paymentId: "stripe_payment_id"                                             │   │
│ │ updatedAt: "2024-01-01T00:00:00.000Z"                                     │   │
│ │ createdAt: "2024-01-01T00:00:00.000Z"                                     │   │
│ └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Referenced by
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ 5. USER PAYMENT HISTORY SUBCOLLECTION                                          │
│ ┌─────────────────────────────────────────────────────────────────────────────┐   │
│ │ Collection Path: users/{userId}/paymentHistory/{historyId}                 │   │
│ ├─────────────────────────────────────────────────────────────────────────────┤   │
│ │ userId: "user123"                                                          │   │
│ │ creditsPurchased: 100                                                      │   │
│ │ amountUSD: 29.99                                                           │   │
│ │ paymentProvider: "Stripe"                                                  │   │
│ │ planName: "Starter Pack"                                                   │   │
│ │ status: "completed"                                                        │   │
│ │ errorMessage: ""                                                           │   │
│ │ paymentId: "stripe_payment_id"                                             │   │
│ │ paymentResultId: "paymentResultId123"                                      │   │
│ │ timestamp: "2024-01-01T00:00:00.000Z"                                     │   │
│ │ updatedAt: "2024-01-01T00:00:00.000Z"                                     │   │
│ │ createdAt: "2024-01-01T00:00:00.000Z"                                     │   │
│ └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    RELATIONSHIPS                                 │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ USER → SEARCH HISTORY: 1:N                                                       │
│ • One user can have multiple search history entries                               │
│ • Each search history entry belongs to exactly one user                          │
│                                                                                   │
│ SEARCH HISTORY → SEARCH RESULTS: 1:N                                             │
│ • One search history entry can reference multiple search results                 │
│ • Each search result belongs to exactly one search history entry                 │
│                                                                                   │
│ USER → PAYMENT HISTORY: 1:N                                                      │
│ • One user can have multiple payment history entries                             │
│ • Each payment history entry belongs to exactly one user                         │
│                                                                                   │
│ PAYMENT RESULTS → USER PAYMENT HISTORY: 1:1                                      │
│ • One payment result can be referenced by one user payment history entry         │
│ • Each user payment history entry references exactly one payment result          │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    DATA FLOW                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ SINGLE PROFILE SEARCH FLOW                                                       │
│ ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│ │ User Input  │───▶│Search      │───▶│Google      │───▶│OpenAI      │        │
│ │ (name,      │    │History     │    │Search API  │    │Analysis    │        │
│ │  company,   │    │Created     │    │            │    │            │        │
│ │  position)  │    │            │    │            │    │            │        │
│ └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘        │
│                           │                   │                   │              │
│                           ▼                   ▼                   ▼              │
│                    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│                    │Search       │    │Search       │    │LinkedIn    │        │
│                    │Result       │    │Results      │    │URL         │        │
│                    │Stored       │    │Found        │    │Extracted   │        │
│                    └─────────────┘    └─────────────┘    └─────────────┘        │
│                           │                                                      │
│                           ▼                                                      │
│                    ┌─────────────┐                                              │
│                    │Credit       │                                              │
│                    │Deducted     │                                              │
│                    │(if found)   │                                              │
│                    └─────────────┘                                              │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ BULK PROFILE SEARCH FLOW                                                          │
│ ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                           │
│ │CSV/Excel   │───▶│Batch Search │───▶│Background   │                           │
│ │Upload      │    │History      │    │Processing   │                           │
│ │            │    │Created      │    │Started      │                           │
│ └─────────────┘    └─────────────┘    └─────────────┘                           │
│                           │                   │                                  │
│                           ▼                   ▼                                  │
│                    ┌─────────────┐    ┌─────────────┐                           │
│                    │Immediate    │    │For Each     │                           │
│                    │Response     │    │Contact:     │                           │
│                    │(Processing) │    │• Individual │                           │
│                    └─────────────┘    │  Search     │                           │
│                                       │• Result     │                           │
│                                       │  Storage    │                           │
│                                       │• Progress   │                           │
│                                       │  Update     │                           │
│                                       └─────────────┘                           │
│                                                   │                              │
│                                                   ▼                              │
│                                            ┌─────────────┐                      │
│                                            │Final       │                      │
│                                            │Status      │                      │
│                                            │Update      │                      │
│                                            └─────────────┘                      │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ CREDIT SYSTEM FLOW                                                                │
│ ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│ │User        │───▶│Search      │───▶│Results     │───▶│Credit      │        │
│ │Performs    │    │Completed   │    │Found       │    │Deduction   │        │
│ │Search      │    │            │    │            │    │            │        │
│ └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘        │
│                           │                   │                   │              │
│                           ▼                   ▼                   ▼              │
│                    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│                    │Search       │    │Count        │    │Update User │        │
│                    │History      │    │Successful   │    │Credit      │        │
│                    │Updated      │    │Results      │    │Balance     │        │
│                    └─────────────┘    └─────────────┘    └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ PAYMENT FLOW                                                                       │
│ ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│ │Stripe      │───▶│Payment     │───▶│Webhook     │───▶│Credits     │        │
│ │Payment     │    │Completed   │    │Received    │    │Added to    │        │
│ │            │    │            │    │            │    │User        │        │
│ └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘        │
│                           │                   │                   │              │
│                           ▼                   ▼                   ▼              │
│                    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│                    │Payment      │    │Payment      │    │User        │        │
│                    │Result       │    │History      │    │Payment     │        │
│                    │Stored       │    │Updated      │    │History     │        │
│                    └─────────────┘    └─────────────┘    └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    KEY FEATURES                                  │
└─────────────────────────────────────────────────────────────────────────────────────┘

• **User Isolation**: Each user can only access their own data
• **Credit Tracking**: Credits are deducted only when results are found
• **Search History**: Complete audit trail of all searches performed
• **Payment Integration**: Stripe webhook processing for credit purchases
• **Background Processing**: Bulk searches processed asynchronously
• **Error Handling**: Comprehensive error tracking and status management
• **Rate Limiting**: API rate limiting to prevent quota exhaustion
• **Scalability**: Firestore's NoSQL structure allows for horizontal scaling
