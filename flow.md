# LinkedIn Profile Finder - Full Project Flow (Frontend + API + Firebase + AI Search)

## 🚀 Overview
This document outlines the complete flow, components, and development plan to build a LinkedIn Profile Finder web application. The app allows users to search for LinkedIn profiles in multiple ways: single person search, CSV batch upload, targeted lead generation, and team members from company pages. Users are required to sign up to receive 50 free tokens and are charged 1 token per successful match.

---

## 🧩 Core Components

### 1. **Frontend (React + TypeScript)**
- **User Authentication** (Login / Signup with Firebase)
- **Token Balance UI**
- **Dashboard with Multiple Search Options**
  - Single Search Form
  - CSV Upload Page
  - Lead Generator (targeted professionals)
  - Team Members Finder
- **Search Results Display**
- **Dashboard Summary (History, Usage)**
- **About & Contact Section**
- **Pricing System with Stripe Integration**
- **User Profile & Account Management**
- **Search Results Export (Excel/CSV)**
- **Toast Notification System**

### 2. **API Integration (Node.js Backend)**
- **Single Search Endpoint** (`/findSingleContact`)
- **CSV Upload Endpoint** (`/findBatchContact`)
- **Targeted Leads Endpoint** (`/findTargetedLeads`)
- **Team Members Endpoint** (`/findTeamMembers`)
- **Response Parsing and Display**
- **Token Deduction Triggers**
- **Error/Success Handling**
- **Stripe Payment Processing Endpoints**
  - `/create-checkout-session` - Create payment session
  - `/verify-payment/:sessionId` - Verify successful payments
  - `/webhook` - Process Stripe webhook events
  - `/payment-history/:userId` - Get user payment history
  - `/user-credits/:userId` - Get user credit balance

### 3. **Firebase Services**
- **Authentication**: Email/Password-based signup/login
- **Firestore**:
  - Users Collection (email, uid, tokens, signup date)
  - Search History Collection (query details, result, date, type: single/bulk/recruiters/team)
  - Payment Results Collection (payment status, user details, plan purchased)
  - User Payment History Subcollection (payment records for each user)

---

## 🔄 Full Workflow Breakdown

### 🔐 **Authentication Flow**
1. User lands on landing page
2. Clicks Sign Up → enters email/password
3. Firebase Auth creates user → assigns 50 tokens
4. User redirected to dashboard

---

### 🔍 **Single Search Flow**
1. User enters: Name, Company, Position
2. Request sent to `/findSingleContact`
3. API:
   - Performs Google search
   - Verifies using AI
   - Returns profile URL or failure
4. Deducts 1 token on success
5. Updates Firestore search history with type "single"
6. Toast notification shows success/failure status
7. Recent searches component updates in real-time

---

### 📤 **CSV Upload Flow**
1. User uploads `.csv` with [Name, Company, Position]
2. Frontend sends file → API Endpoint (`/findBatchContact`)
3. API:
   - Parses CSV into objects
   - Searches each using smart Google queries
   - Validates profiles with AI
   - Deduplicates and formats result
   - Counts successful matches
4. Tokens deducted = number of successful matches
5. Returns results with LinkedIn URLs for matches
6. Frontend shows result and updated token count
7. Saves history in Firestore with type "bulk"
8. User can export results to Excel or CSV format

---

### 🎯 **Lead Generator Flow**
1. User selects company name and position type (Recruitment, Investment, C-Level)
2. Request sent to `/findTargetedLeads`
3. API:
   - Searches for professionals matching the criteria
   - Returns a list of targeted leads with LinkedIn profiles
4. Deducts 1 token regardless of number of results
5. Updates Firestore search history with type "recruiters"
6. Frontend displays results in a table format

---

### 👥 **Team Members Flow**
1. User enters a LinkedIn company page URL
2. Request sent to `/findTeamMembers`
3. API:
   - Extracts team members from the company page
   - Returns list of found team members with their positions
4. Deducts 1 token per search
5. Updates Firestore search history with type "team"
6. Frontend shows processing status and completion notification

---

### 💰 **Credit Purchase Flow**
1. User navigates to Pricing page
2. Selects a pricing package (Starter: $10/100 credits, Professional: $25/250+50 credits, Premium: $50/500+150 credits)
3. Clicks "Buy Now" on a package card
4. If not authenticated, user is redirected to login/signup
5. If authenticated, creates Stripe checkout session via `/create-checkout-session`
6. User is redirected to Stripe-hosted checkout page
7. After payment:
   - Success: Redirected to `/payment-success` with sessionId parameter
   - Cancel: Redirected back to pricing page
8. On success page:
   - Verifies payment with `/verify-payment/:sessionId`
   - Shows payment details and updated credit balance
9. Stripe webhook (`/webhook`) processes payment events:
   - Updates payment status in `paymentResults` collection
   - Updates user credit balance in Firestore
   - Records payment in user's `paymentHistory` subcollection
10. User can view payment history in Profile page

---

### 📊 **Dashboard & History**
- Central dashboard with tabs for different search types
- Real-time search history updates after any search
- History displays all search types (single, bulk, recruiters, team)
- Each history item shows:
  - Search type
  - Query information
  - Timestamp
  - Status (pending, completed, failed)
  - Number of results found
  - Download options for bulk searches (Excel/CSV)
  - Link to LinkedIn (when available)
- Visual status indicators with color coding (success, pending, failed)

---

### 👤 **Profile & Account Management**
1. User navigates to Profile page
2. Views account statistics:
   - Available credits
   - Used credits
   - Profiles found
   - Success rate
3. Views payment history with transaction details
4. Can purchase additional credits via direct link to Pricing page

---

### 🔄 **Export Functionality**
1. User views search history in Dashboard
2. For bulk searches, export options are available
3. User selects Excel or CSV format
4. System fetches all search results associated with the search
5. Generates and downloads the file in the selected format
6. Toast notification confirms successful download

---

### 📢 **Landing / About Section**
- Introduction to what the tool does
- Benefits & use cases
- How the token system works
- Contact form / email

---

## ✅ Todo Checklist by Phase

### 🔧 Phase 1: Setup
- [x] Create Firebase Project (Auth + Firestore)
- [x] Initialize React + Vite + TypeScript project
- [x] Connect frontend to Firebase Auth
- [x] Create User schema in Firestore

### 🧠 Phase 2: API & Search Logic
- [x] Setup connection with backend API
- [x] Handle single user lookup `/findSingleContact`
- [x] Handle file upload and send to `/findBatchContact`
- [x] Implement targeted leads search `/findTargetedLeads`
- [x] Implement team members search `/findTeamMembers`
- [x] Display results & errors appropriately

### 🏗️ Phase 3: Functional Pages
- [x] Dashboard with tabbed interface
- [x] Single Search Form
- [x] CSV Upload with preview
- [x] Lead Generator Form
- [x] Team Members Search Form
- [x] Recent Search History component
- [x] About & Contact
- [x] Profile page with account statistics

### 🔁 Phase 4: Token & History Logic
- [x] Token deduction based on API response
- [x] History writing to Firestore
- [x] Real-time search history updates
- [x] History categorization by search type
- [x] Export functionality for search results

### 💲 Phase 5: Payment Integration
- [x] Implement Stripe payment processing
- [x] Create pricing page with package options
- [x] Implement checkout process
- [x] Handle payment webhooks
- [x] Update user credits on successful payment
- [x] Payment history display
- [x] Success/failure page

### 📦 Phase 6: Final Touches & Deployment
- [x] Error handling & fallback UIs
- [x] Toast notification system
- [x] Responsive design + mobile testing
- [ ] Deploy frontend (e.g., Vercel/Netlify)
- [ ] Deploy backend API

---

## 🛠️ Tech Stack Summary
| Area        | Tech                              |
|-------------|-----------------------------------|
| Frontend    | React, TypeScript, TailwindCSS    |
| Backend     | Node.js, Express                  |
| Auth/DB     | Firebase Auth, Firestore          |
| Search      | Google Custom Search API, OpenAI  |
| File Upload | CSV/Excel parsing                 |
| UI Library  | Shadcn UI components              |
| Animation   | Framer Motion                     |
| Payments    | Stripe                            |
| Data Export | Excel, CSV                        |

---

## 🗄️ Database Structure

### Firebase Firestore Collections

#### 1. `users` Collection
Main collection that stores user information
- **Document ID**: User's Firebase Auth UID
- **Fields**:
  - `email` (string): User's email address
  - `name` (string): User's full name
  - `linkCredits` (number): Current balance of search tokens
  - `totalSearched` (number): Total number of searches performed
  - `totalFound` (number): Total number of profiles found
  - `createdAt` (timestamp): Account creation date
  - `lastLoginAt` (timestamp): Last login timestamp
  - `role` (string): User role (e.g., "free", "premium")
  - `lastCreditUpdate` (timestamp): When credits were last updated
  - `lastUpdated` (timestamp): General last update timestamp

#### 2. `users/{userId}/searchHistory` Subcollection
Stores search history for each user
- **Document ID**: Auto-generated ID
- **Fields**:
  - `type` (string): Search type ("single", "bulk", "recruiters", "team")
  - `status` (string): Status of search ("pending", "completed", "failed")
  - `inputMeta` (object): Input data for the search
    - `name` (string, optional): For single search
    - `company` (string, optional): For single/lead search
    - `position` (string, optional): For single search
    - `fileName` (string, optional): For bulk search
    - `companyUrl` (string, optional): For team search
    - `linkedin` (string, optional): LinkedIn URL if found
  - `totalRecords` (number): Number of records in search
  - `resultsCount` (number): Number of successful results found
  - `resultIds` (array): Array of result document IDs
  - `resultRefPath` (string): Reference path to results collection
  - `createdAt` (timestamp): When search was initiated
  - `completedAt` (timestamp, optional): When search was completed
  - `startedAt` (timestamp, optional): When batch processing started

#### 3. `searchResults` Collection
Stores detailed search results that can be referenced by multiple searches
- **Document ID**: Auto-generated ID
- **Fields**:
  - `userId` (string): ID of user who performed the search
  - `searchId` (string): Reference to search history document
  - `type` (string): Type of search result ("single", "bulk", "recruiters", "team")
  - `inputData` (object): Original search input
    - `name` (string): Person's name
    - `company` (string): Company name
    - `title` (string): Position/title
  - `linkedinUrl` (string, optional): Found LinkedIn profile URL
  - `data` (object, optional): Additional data about the result
  - `createdAt` (timestamp): When result was created

#### 4. `paymentResults` Collection
Stores payment processing information
- **Document ID**: Auto-generated ID
- **Fields**:
  - `userId` (string): ID of user who made the payment
  - `paymentId` (string): Stripe payment ID or session ID
  - `creditsPurchased` (number): Number of credits purchased
  - `amountUSD` (number): Payment amount in USD
  - `planName` (string): Name of purchased plan 
  - `paymentProvider` (string): Payment provider (e.g., "Stripe")
  - `status` (string): Payment status ("completed", "processing", "failed", "requires_action")
  - `errorMessage` (string, optional): Error message for failed payments
  - `createdAt` (timestamp): When payment was initiated
  - `updatedAt` (timestamp): Last payment status update

#### 5. `users/{userId}/paymentHistory` Subcollection
Stores payment history for each user
- **Document ID**: Auto-generated ID
- **Fields**:
  - Same fields as paymentResults
  - `paymentResultId` (string): Reference to document in paymentResults collection
  - `timestamp` (timestamp): Payment timestamp

#### Relationships
- Each user has many search history records (1:N)
- Each search history can have multiple search results (1:N)
- Search results reference back to both user and search history
- Each user has many payment history records (1:N)
- Payment history references paymentResults collection

---

## 📬 Contact
Want to reach out or suggest a feature?
- Email: `yourname@yourdomain.com`
- LinkedIn: `linkedin.com/in/yourprofile`

---

Let's make manual profile searching extinct. 🦖


---

I am wokring on creating a simple web app that allows users to signup/login into the webapp, 

for Signup the user will have to provide name, email and password. After signup the user will be redirected to the login page.
for Login the user will have to provide email and password. After login the user will be redirected to the home page.


for the webapp the user will have option to call any of these 4 apis:
1. Search for LinkedIn URL of a single person by Name, Company and Title
input: Name, Company and Title
output: Name, Company, Title and LinkedIn URL (single person)
2. Search for Batch of LinkedIn URLs of people by Name, Company and Title. The user will have to provide a csv file with the list of names, companies and titles and the csv will be read all the data and send the array of data to the api.
input: Name, Company and Title
output: Name, Company, Title and LinkedIn URL (multiple persons, array of objects)
3. Search for Name, Company, Title and LinkedIn URL of many people by Company and Title
input: Company and Title
output: Name, Company, Title and LinkedIn URL (multiple persons, array of objects)
4. Search for Name, Company, Title and LinkedIn URL of many people by Company
input: Company 
output: Name, Company, Title and LinkedIn URL (multiple persons, array of objects)


In the backend when the request is received based on the api the request will be processed and the response will be sent to the frontend.

1. Will take Name, Company and Title as input
Then it will make an Google Custom Search API call to search for the LinkedIn URL of the person.
And will send the response to the OpenAI API to scrape and validate the LinkedIn URL of the person.
And will send the Name, Company, Title and LinkedIn URL to the frontend.

2. Will take Name, Company and Title as input for the complete array of objects
Then it will make an Google Custom Search API call to search for the LinkedIn URL of the person.
And will send the response to the OpenAI API to scrape and validate the LinkedIn URL of the person.
And will send the response to the frontend for the complete array of objects.

3. Will take Company and Title as input
Then it will make an Google Custom Search API call to search for people by Company and Title to find all the people who have worked at the company with the title.
And will send the response to the OpenAI API to scrape and validate the Name, Company, Title and LinkedIn URL of the person.
And will send the response to the frontend for the complete array of objects.

4. Will take Company as input
5. Then it will make a API call to Firecrawl API to scrape the company website for about section and get the list of people who have worked at the company.
And will send the response to the OpenAI API to scrape and validate the Name, Company, Title and LinkedIn URL of the person.
And will send the response to the frontend for the complete array of objects.



Now we are using Database to store all the queries made by the user.
Also we are storing all the input and output data in the database for future reference and the data model for all the data scraped form the backend will be the same for all 4 apis. Just the input will be different for each api but the end output will be the same. So we wannastore the data in the same model for all the 4 apis in an efficient way.

We want to create a pipeline in the backend that will be used to scrape the batch data for the 2

