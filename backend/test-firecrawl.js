/**
 * Firecrawl Connection Test Script
 * 
 * This script tests if the Firecrawl API is accessible and working properly.
 * It makes a simple request to the map endpoint with a test URL.
 */

const axios = require('axios');

// Configuration - update these values as needed
const FIRECRAWL_HOSTS = [
  'http://172.19.0.4:3002',      // Direct IP we identified
  'http://firecrawl-api-1:3002', // Docker service name
  'http://api:3002',             // Short service name
  'http://localhost:3002'        // Local connection
];

const TEST_URL = 'https://www.example.com';
const API_ENDPOINT = '/v1/map';

// Function to test connection to a specific host
async function testFirecrawlConnection(host) {
  try {
    console.log(`\nTesting connection to: ${host}${API_ENDPOINT}`);
    
    const startTime = Date.now();
    const response = await axios.post(
      `${host}${API_ENDPOINT}`,
      { url: TEST_URL },
      { 
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000 // 5 second timeout
      }
    );
    const endTime = Date.now();
    
    if (response.status === 200) {
      console.log('✅ Connection successful!');
      console.log(`   Response time: ${endTime - startTime}ms`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Success: ${response.data.success}`);
      console.log(`   Links found: ${response.data.links?.length || 0}`);
      return true;
    } else {
      console.log('❌ Request failed with status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    if (error.code) {
      console.log(`   Error code: ${error.code}`);
    }
    return false;
  }
}

// Main function to test all hosts
async function runTests() {
  console.log('=== FIRECRAWL CONNECTION TEST ===');
  console.log('Testing connection to Firecrawl API...');
  
  let anySuccessful = false;
  
  // Test each host
  for (const host of FIRECRAWL_HOSTS) {
    const success = await testFirecrawlConnection(host);
    if (success) {
      anySuccessful = true;
      console.log(`\n✅ SUCCESS: Firecrawl is accessible at ${host}`);
      console.log('   You should update the FIRECRAWL_URL in teamMembers.js to use this URL');
    }
  }
  
  // Final result
  console.log('\n=== TEST SUMMARY ===');
  if (anySuccessful) {
    console.log('✅ Firecrawl is working and accessible from at least one URL');
  } else {
    console.log('❌ Failed to connect to Firecrawl from any tested URL');
    console.log('   Possible issues:');
    console.log('   1. Firecrawl containers are not running');
    console.log('   2. Network connectivity issues between containers');
    console.log('   3. Docker network configuration problems');
    
    console.log('\n   Try these commands to troubleshoot:');
    console.log('   - docker ps (to check if containers are running)');
    console.log('   - docker network inspect firecrawl_backend');
    console.log('   - docker network connect firecrawl_backend link-backend');
  }
}

// Run the tests
runTests().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
}); 