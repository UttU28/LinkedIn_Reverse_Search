# LinkedIn Reverse Search API

This backend API provides functionality to search for LinkedIn profiles based on a person's name, company, and position.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the backend directory with the following variables:
   ```
   # Firebase Configuration (if using Firebase)
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebaseServiceAccountKey.json
   
   # Google Custom Search API for LinkedIn Profile Search
   GOOGLE_API_KEY=your-google-api-key
   GOOGLE_SEARCH_ENGINE_ID=your-custom-search-engine-id
   
   # OpenAI API for LinkedIn Profile Extraction
   OPENAI_API_KEY=your-openai-api-key
   ```

3. Get API Keys:
   - Google Custom Search API: Create a project in [Google Cloud Console](https://console.cloud.google.com/) and enable the Custom Search API. Create an API key.
   - Google Custom Search Engine ID: Create a custom search engine at [Google Programmable Search Engine](https://programmablesearchengine.google.com/) and get the search engine ID.
   - OpenAI API: Sign up for an API key at [OpenAI](https://platform.openai.com/).

## API Endpoints

### Find Single LinkedIn Contact

**Endpoint:** `POST /findSingleContact`

**Request Body:**
```json
{
  "userID": "user-id-here",
  "searchName": "John Doe",
  "searchCompany": "Example Corp",
  "searchPosition": "Software Engineer"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "LinkedIn profile found",
  "data": {
    "userID": "user-id-here",
    "searchName": "John Doe",
    "searchCompany": "Example Corp",
    "searchPosition": "Software Engineer",
    "linkedinProfileUrl": "https://www.linkedin.com/in/john-doe-12345",
    "foundData": 1,
    "historyId": "history-id-here"
  }
}
```

### Find Batch LinkedIn Contacts

**Endpoint:** `POST /findBatchContact`

**Request Body:**
```json
{
  "userID": "user-id-here",
  "fileName": "contacts-file.csv",
  "timestamp": 1689283200000,
  "batchId": "optional-custom-batch-id",
  "contacts": [
    {
      "contactId": "contact-1",
      "searchName": "John Doe",
      "searchCompany": "Example Corp",
      "searchPosition": "Software Engineer"
    },
    {
      "contactId": "contact-2",
      "searchName": "Jane Smith",
      "searchCompany": "Tech Inc",
      "searchPosition": "Product Manager"
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Batch contact search started in background",
  "data": {
    "userID": "user-id-here",
    "batchId": "batch-1689283200000",
    "fileName": "contacts-file.csv",
    "timestamp": 1689283200000,
    "contactsCount": 2,
    "status": "processing",
    "message": "Started processing 2 contacts in the background",
    "historyId": "history-id-here"
  }
}
```

**Notes:**
- Batch processing happens asynchronously in the background
- The API returns immediately with a processing status
- Progress and results are stored in the database for the client to check
- In a real implementation, you would have a separate endpoint to check the status of a batch

## How It Works

1. The API receives a request with the person's name, company, and position.
2. It uses Google Custom Search API to search for LinkedIn profiles matching the criteria.
3. The search results are processed by OpenAI to extract the most relevant LinkedIn profile URL.
4. The API returns the LinkedIn profile URL and success status.

### Background Processing for Batch Requests

For batch requests, the API:
1. Immediately returns a response with a batch ID and processing status
2. Processes each contact one by one in the background
3. Updates the database with progress information
4. Marks the batch as completed when all contacts are processed

## Development

Run the server in development mode:

```
npm run dev
```

The server will be available at http://localhost:3008.
