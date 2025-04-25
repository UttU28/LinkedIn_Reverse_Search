const { GoogleCustomSearch, callOpenAI, log } = require('./backend/utils');
require('dotenv').config();

// Get user input from command line arguments
const userInput = process.argv.slice(2).join(' ');

if (!userInput) {
  console.error('Please provide a search query as a command line argument');
  console.error('Usage: node testScript.js "your search query here"');
  process.exit(1);
}

// Dummy prompts for testing
const DUMMY_SYSTEM_PROMPT = `
You are a helpful assistant that summarizes search results. 
Given a search query and results from Google, provide a concise summary
of the information found.

Please format your response as follows:
1. Original Query: [repeat the user's query]
2. Key Findings: [2-3 bullet points with the most relevant information]
3. Summary: [A short paragraph summarizing the results]
`;

const DUMMY_USER_PROMPT = `
Here is the search query:
"[SEARCH_QUERY]"

And here are the search results:
[SEARCH_RESULTS]

Please provide a helpful summary of this information.
`;

/**
 * Main function to run the test
 */
async function runTest() {
  try {
    console.log(`\n=== Testing Script Started ===`);
    console.log(`Search Query: "${userInput}"`);

    // Check for API keys
    const API_KEY = process.env.GOOGLE_API_KEY;
    const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!API_KEY || !SEARCH_ENGINE_ID) {
      console.error('Error: Missing Google API credentials in environment variables');
      process.exit(1);
    }

    if (!OPENAI_API_KEY) {
      console.error('Error: Missing OpenAI API key in environment variables');
      process.exit(1);
    }

    // Step 1: Perform Google search
    console.log('\nPerforming Google search...');
    const searchClient = new GoogleCustomSearch(API_KEY, SEARCH_ENGINE_ID);
    const searchResults = await searchClient.search(userInput, 5);
    
    if (!searchResults || searchResults.length === 0) {
      console.error('No search results found');
      process.exit(1);
    }
    
    console.log(`Found ${searchResults.length} search results`);
    
    // Step 2: Format search results for the prompt
    const formattedResults = searchResults.map((result, index) => {
      return `Result ${index + 1}:
Title: ${result.title}
Link: ${result.link}
Snippet: ${result.snippet || 'No snippet available'}
`;
    }).join('\n');
    
    // Step 3: Create the user prompt with the search query and results
    const filledUserPrompt = DUMMY_USER_PROMPT
      .replace('[SEARCH_QUERY]', userInput)
      .replace('[SEARCH_RESULTS]', formattedResults);
    
    // Step 4: Create JSON data for OpenAI
    const jsonData = {
      searchQuery: userInput,
      searchResults: searchResults.map(result => ({
        title: result.title,
        link: result.link,
        snippet: result.snippet
      }))
    };
    
    // Step 5: Call OpenAI API
    console.log('\nSending to OpenAI for analysis...');
    const aiResponse = await callOpenAI(jsonData, DUMMY_SYSTEM_PROMPT, filledUserPrompt);
    
    if (!aiResponse) {
      console.error('Failed to get response from OpenAI');
      process.exit(1);
    }
    
    // Step 6: Print the response
    console.log('\n=== OpenAI Response ===\n');
    console.log(aiResponse);
    console.log('\n=== End of Response ===');
    
  } catch (error) {
    console.error(`Error in test script: ${error.message}`);
    console.error(error.stack);
  }
}

// Run the test
runTest(); 