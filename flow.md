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

### 2. **API Integration (Node.js Backend)**
- **Single Search Endpoint** (`/findSingleContact`)
- **CSV Upload Endpoint** (`/findBatchContact`)
- **Targeted Leads Endpoint** (`/findTargetedLeads`)
- **Team Members Endpoint** (`/findTeamMembers`)
- **Response Parsing and Display**
- **Token Deduction Triggers**
- **Error/Success Handling**

### 3. **Firebase Services**
- **Authentication**: Email/Password-based signup/login
- **Firestore**:
  - Users Collection (email, uid, tokens, signup date)
  - Search History Collection (query details, result, date, type: single/bulk/recruiters/team)

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
  - Download options for bulk searches
  - Link to LinkedIn (when available)

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

### 🔁 Phase 4: Token & History Logic
- [x] Token deduction based on API response
- [x] History writing to Firestore
- [x] Real-time search history updates
- [x] History categorization by search type

### 📦 Phase 5: Packaging & Deployment
- [ ] Error handling & fallback UIs
- [ ] Responsive design + mobile testing
- [ ] Deploy frontend (e.g., Vercel/Netlify)

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
  - `totalRecords` (number): Number of records in search
  - `resultIds` (array): Array of result document IDs
  - `resultRefPath` (string): Reference path to results collection
  - `createdAt` (timestamp): When search was initiated
  - `completedAt` (timestamp, optional): When search was completed

#### 3. `searchResults` Collection
Stores detailed search results that can be referenced by multiple searches
- **Document ID**: Auto-generated ID
- **Fields**:
  - `userId` (string): ID of user who performed the search
  - `searchId` (string): Reference to search history document
  - `type` (string): Type of search result
  - `inputData` (object): Original search input
  - `linkedinUrl` (string, optional): Found LinkedIn profile URL
  - `data` (object, optional): Additional data about the result
  - `createdAt` (timestamp): When result was created

#### Relationships
- Each user has many search history records (1:N)
- Each search history can have multiple search results (1:N)
- Search results reference back to both user and search history

---

## 📬 Contact
Want to reach out or suggest a feature?
- Email: `yourname@yourdomain.com`
- LinkedIn: `linkedin.com/in/yourprofile`

---

Let's make manual profile searching extinct. 🦖

