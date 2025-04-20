# LinkedIn Profile Finder - Full Project Flow (Frontend + API + Firebase + AI Search)

## 🚀 Overview
This document outlines the complete flow, components, and development plan to build a LinkedIn Profile Finder web application. The app allows users to upload a CSV or search for a single person, automatically finding verified LinkedIn profiles using AI-enhanced search. Users are required to sign up to receive 50 free tokens and are charged 1 token per successful match.

---

## 🧩 Core Components

### 1. **Frontend (React + TypeScript)**
- **User Authentication** (Login / Signup with Firebase)
- **Token Balance UI**
- **CSV Upload Page**
- **Single Search Form**
- **Search Results Display**
- **Dashboard Summary (History, Usage)**
- **About & Contact Section**

### 2. **API Integration (External Service)**
- **CSV Upload Endpoint** (`/api/upload-csv`)
- **Single Search Endpoint** (`/api/search-single`)
- **Response Parsing and Display**
- **Token Deduction Triggers**
- **Error/Success Handling**

### 3. **Firebase Services**
- **Authentication**: Email/Password-based signup/login
- **Firestore**:
  - Users Collection (email, uid, tokens, signup date)
  - History Collection (query, result, date, type: single/csv)

---

## 🔄 Full Workflow Breakdown

### 🔐 **Authentication Flow**
1. User lands on landing page
2. Clicks Sign Up → enters email/password
3. Firebase Auth creates user → assigns 50 tokens
4. User redirected to dashboard

---

### 📤 **CSV Upload Flow**
1. User uploads `.csv` with [Name, Company, Position]
2. Frontend sends file → API Endpoint (`/api/upload-csv`)
3. API:
   - Parses CSV into objects
   - Searches each using smart Google queries
   - Validates profiles with AI
   - Deduplicates and formats result
   - Counts successful matches
4. Tokens deducted = number of successful matches
5. Returns Excel/CSV file + Summary Report
6. Frontend shows result and updated token count
7. Saves history in Firestore

---

### 🔍 **Single Search Flow**
1. User enters: Name, Company, Position
2. Request sent to `/api/search-single`
3. API:
   - Performs Google search
   - Verifies using AI
   - Returns profile URL or failure
4. Deducts 1 token on success
5. Updates Firestore history

---

### 📊 **Dashboard**
- Displays:
  - Token balance
  - Usage history (date, query, results)
  - Button to buy tokens (future)

---

### 📢 **Landing / About Section**
- Introduction to what the tool does
- Benefits & use cases
- How the token system works
- Contact form / email

---

## ✅ Todo Checklist by Phase

### 🔧 Phase 1: Setup
- [ ] Create Firebase Project (Auth + Firestore)
- [ ] Initialize React + Vite + TypeScript project
- [ ] Connect frontend to Firebase Auth
- [ ] Create User schema in Firestore

### 🧠 Phase 2: API & Search Logic
- [ ] Setup connection with external API
- [ ] Handle file upload and send to `/api/upload-csv`
- [ ] Handle single user lookup `/api/search-single`
- [ ] Display results & errors appropriately

### 🏗️ Phase 3: Functional Pages
- [ ] CSV Upload Page (drag-drop, file preview)
- [ ] Single Search Page
- [ ] Dashboard UI (tokens, history)
- [ ] About & Contact

### 🔁 Phase 4: Token & History Logic
- [ ] Token deduction based on API response
- [ ] History writing to Firestore
- [ ] Real-time token balance sync

### 📦 Phase 5: Packaging & Deployment
- [ ] Error handling & fallback UIs
- [ ] Responsive design + mobile testing
- [ ] Deploy frontend (e.g., Vercel/Netlify)

---

## 🛠️ Tech Stack Summary
| Area        | Tech                              |
|-------------|-----------------------------------|
| Frontend    | React, TypeScript, TailwindCSS    |
| API         | External Node.js API (readonly)   |
| Auth/DB     | Firebase Auth, Firestore          |
| File Upload | Firebase Storage / Base64         |
| AI          | OpenAI API / Custom LLM           |
| Excel       | ExcelJS / SheetJS                 |

---

## 📬 Contact
Want to reach out or suggest a feature?
- Email: `yourname@yourdomain.com`
- LinkedIn: `linkedin.com/in/yourprofile`

---

Let’s make manual profile searching extinct. 🦖

