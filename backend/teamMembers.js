const { log, callOpenAI } = require('./utils');
const { TEAM_MEMBERS_SYSTEM_PROMPT, TEAM_MEMBERS_USER_PROMPT, TEAM_MEMBERS_MARKDOWN_USER_PROMPT } = require('./prompts');
const dbService = require('./dbService');
const axios = require('axios');
const { URL } = require('url');

// Configuration
const FIRECRAWL_URL = process.env.FIRECRAWL_URL || 'http://firecrawl-api:3002';
const API_BASE = `${FIRECRAWL_URL}/v1`;

/**
 * Find team members at a specific company from their website
 * @param {string} companyUrl - Company website URL
 * @param {string} userID - User ID for database operations
 */
async function findTeamMembersFromWebsite(companyUrl, userID) {
  let historyId = null;
  
  try {
    // Validate URL format
    try {
      new URL(companyUrl);
    } catch (urlError) {
      throw new Error('Invalid URL format. Please enter a valid website URL.');
    }
    
    log(`Searching for team members: ${companyUrl}`);
    
    // Create historyId to track this search operation
    historyId = await dbService.addSearchHistory(userID, {
      type: "team",
      status: "processing",
      inputMeta: {
        companyUrl: companyUrl
      },
      totalRecords: 0, // Will update once we have results
      resultRefPath: "searchResults",
      startedAt: new Date()
    });
    
    log(`Created search history: ${historyId}`, 'debug');
    
    // Step 1: Map all URLs from the company website
    try {
      const teamPages = await mapUrlsFromCompany(companyUrl);
      
      if (!teamPages || teamPages.length === 0) {
        await dbService.updateSearchHistory(userID, historyId, {
          status: "failed",
          errorMessage: "No team/about pages found on the company website"
        });
        
        return {
          success: false,
          message: "No team/about pages found on the company website. Try a different URL that includes 'About' or 'Team' pages.",
          data: [],
          historyId
        };
      }
      
      log(`Found ${teamPages.length} potential team/about pages`);
      
      // Step 2: Scrape the first team page
      const teamPageUrl = teamPages[0];
      const markdownContent = await scrapePageMarkdown(teamPageUrl);
      
      if (!markdownContent) {
        await dbService.updateSearchHistory(userID, historyId, {
          status: "failed",
          errorMessage: "Failed to scrape team page content"
        });
        
        return {
          success: false,
          message: "Failed to extract content from the team page. The page might be using JavaScript to load content or blocking scraping.",
          data: [],
          historyId
        };
      }
      
      // Step 3: Extract team members using OpenAI
      const teamMembers = await extractTeamMembersFromMarkdown(markdownContent);
      
      if (!teamMembers || !Array.isArray(teamMembers) || teamMembers.length === 0) {
        await dbService.updateSearchHistory(userID, historyId, {
          status: "failed",
          errorMessage: "No team members found on the page"
        });
        
        return {
          success: false,
          message: "No team members could be identified on the page. The page might not be a typical team/about page.",
          data: [],
          historyId
        };
      }
      
      // Step 4: Save individual results to database and collect resultIds
      const resultIds = [];
      const processedResults = [];
      
      for (const member of teamMembers) {
        // Only store if we have a name
        if (member.name) {
          // Extract company name from URL for database
          const companyDomain = new URL(companyUrl).hostname.replace(/^www\./, '');
          
          const searchData = {
            name: member.name,
            position: member.position || "",
            company: companyDomain
          };
          
          const resultId = await dbService.addSearchResult(
            userID,
            historyId,
            "team",
            searchData,
            member.linkedin || null
          );
          
          if (resultId) {
            resultIds.push(resultId);
            
            // Add to processed results (note: we don't store email in DB as requested)
            processedResults.push({
              name: member.name,
              position: member.position || "",
              linkedin: member.linkedin || null
            });
          }
        }
      }
      
      // Step 5: Store the entire set of team members as a single cached result
      const teamResultId = await dbService.addTeamMembers(
        userID,
        historyId,
        companyUrl,
        processedResults
      );
      
      // Include the team members result ID in the result IDs if it exists
      if (teamResultId) {
        resultIds.push(teamResultId);
      }
      
      // Step 6: Update history with completed status
      await dbService.updateSearchHistory(userID, historyId, {
        status: "completed",
        totalRecords: teamMembers.length,
        resultsCount: resultIds.length,
        resultIds: resultIds,
        completedAt: new Date()
      });
      
      log(`Found ${processedResults.length} team members at ${companyUrl}`);
      
      // Return formatted response
      return {
        success: true,
        message: `Found ${processedResults.length} team members at ${companyUrl}`,
        data: processedResults,
        historyId: historyId
      };
    } catch (serviceError) {
      // Handle service-specific errors
      const errorMessage = serviceError.message || 'Unknown error occurred';
      
      // Update the history with the specific error
      await dbService.updateSearchHistory(userID, historyId, {
        status: "error",
        errorMessage: errorMessage
      });
      
      return {
        success: false,
        message: errorMessage,
        error: errorMessage,
        data: [],
        historyId
      };
    }
  } catch (error) {
    log(`Error finding team members: ${error.message}`, 'error');
    
    // Update history with error status
    if (historyId) {
      await dbService.updateSearchHistory(userID, historyId, {
        status: "error",
        errorMessage: error.message
      });
    }
    
    return {
      success: false,
      message: `Error finding team members: ${error.message}`,
      error: error.message,
      data: [],
      historyId: historyId
    };
  }
}

/**
 * Maps all URLs from a company website and filters for team/about pages
 * @param {string} url - Company website URL
 * @returns {Promise<string[]>} - Array of team/about page URLs
 */
async function mapUrlsFromCompany(url) {
  try {
    log(`Mapping URLs from: ${url}`, 'debug');
    
    // Check if FireCrawl API is available
    try {
      const response = await axios.post(
        `${API_BASE}/map`,
        { url },
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000 // 30 second timeout
        }
      );
      
      if (!response.data.success && response.data.status !== 'success') {
        throw new Error('Failed to map URLs from company website');
      }
      
      const allLinks = response.data.links || [];
      log(`Total URLs mapped: ${allLinks.length}`, 'debug');
      
      const teamPages = filterAboutAndTeamPages(allLinks);
      return teamPages;
    } catch (apiError) {
      // Check if this is a connection error to the FireCrawl service
      if (apiError.code === 'ECONNREFUSED' || apiError.code === 'ETIMEDOUT' || apiError.code === 'ECONNABORTED') {
        log(`FireCrawl service unavailable: ${apiError.message}`, 'error');
        throw new Error('Company website mapping service unavailable. Please try again later.');
      }
      
      // Re-throw the original error
      throw apiError;
    }
  } catch (error) {
    log(`Error mapping URLs: ${error.message}`, 'error');
    return [];
  }
}

/**
 * Scrapes markdown content from a webpage
 * @param {string} url - URL to scrape
 * @returns {Promise<string|null>} - Markdown content
 */
async function scrapePageMarkdown(url) {
  try {
    log(`Scraping page: ${url}`, 'debug');
    
    try {
      const response = await axios.post(
        `${API_BASE}/scrape`,
        { url, formats: ['markdown'] },
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 45000 // 45 second timeout for scraping which can take longer
        }
      );
      
      if (!response.data.success) {
        throw new Error('Failed to scrape page content');
      }
      
      if (!response.data.data || !response.data.data.markdown) {
        log('No markdown content returned from scraper', 'warn');
        return null;
      }
      
      const markdownContent = response.data.data.markdown;
      return removeImagesFromMarkdown(markdownContent);
    } catch (apiError) {
      // Check if this is a connection error to the FireCrawl service
      if (apiError.code === 'ECONNREFUSED' || apiError.code === 'ETIMEDOUT' || apiError.code === 'ECONNABORTED') {
        log(`FireCrawl service unavailable for scraping: ${apiError.message}`, 'error');
        throw new Error('Website scraping service unavailable. Please try again later.');
      }
      
      // Re-throw the original error
      throw apiError;
    }
  } catch (error) {
    log(`Error scraping page: ${error.message}`, 'error');
    return null;
  }
}

/**
 * Filters URLs to find About/Team/Leadership pages
 * @param {string[]} urls - Array of URLs
 * @returns {string[]} - Filtered list of team/about pages
 */
function filterAboutAndTeamPages(urls) {
  const mainTeamPagePatterns = [
    /\/team\/?$/i, /\/about\/?$/i, /\/leadership\/?$/i,
    /\/management\/?$/i, /\/our-team\/?$/i, /\/about-us\/?$/i,
    /\/company\/team\/?$/i, /\/company\/about\/?$/i, /\/who-we-are\/?$/i
  ];

  const mainTeamPages = urls.filter(url => {
    const urlPath = new URL(url).pathname.toLowerCase();
    return mainTeamPagePatterns.some(pattern => pattern.test(urlPath));
  });

  if (mainTeamPages.length > 0) {
    return mainTeamPages;
  }

  const targetKeywords = [
    'about', 'team', 'leadership', 'people', 'who-we-are', 
    'our-company', 'founders', 'executive', 'management', 
    'board', 'staff', 'directors'
  ];

  const excludePatterns = [
    /\/blog\//i, /\/press\//i, /\/podcast\//i,
    /\/(team|people)-member\//i, /\/author\//i, /\/tag\//i, /\/category\//i
  ];

  return urls.filter(link => {
    const lowerLink = link.toLowerCase();
    if (excludePatterns.some(pattern => pattern.test(lowerLink))) return false;
    return targetKeywords.some(keyword => lowerLink.includes(keyword));
  });
}

/**
 * Extracts team members from markdown content using OpenAI
 * @param {string} markdownContent - Markdown content to analyze
 * @returns {Promise<Array|null>} - Array of team member objects
 */
async function extractTeamMembersFromMarkdown(markdownContent) {
  if (!markdownContent) {
    log("No markdown content provided to extract team members", 'warn');
    return [];
  }
  
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    log("OpenAI API key not found in environment variables", 'error');
    throw new Error("OpenAI API key not configured. Please check your environment setup.");
  }

  // Truncate the content if it's too long (OpenAI has token limits)
  const MAX_CHARS = 32000;
  let processedMarkdown = markdownContent.length > MAX_CHARS
    ? markdownContent.substring(0, MAX_CHARS)
    : markdownContent;

  // Create a JSON object for callOpenAI function
  const jsonData = {
    markdownData: processedMarkdown
  };

  try {
    log("Analyzing page content with OpenAI", 'debug');
    const aiResponse = await callOpenAI(
      jsonData,
      TEAM_MEMBERS_SYSTEM_PROMPT,
      TEAM_MEMBERS_MARKDOWN_USER_PROMPT
    );

    if (!aiResponse) {
      throw new Error('No response received from OpenAI API');
    }

    // Try to parse the JSON response
    try {
      // Direct parsing if it's a clean JSON response
      return JSON.parse(aiResponse);
    } catch (parseError) {
      // Look for JSON array within the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const parsedData = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsedData)) {
            return parsedData;
          }
        } catch (nestedError) {
          log(`Error parsing extracted JSON: ${nestedError.message}`, 'error');
        }
      }
      
      // If we get here, we couldn't parse the response
      log(`OpenAI response was not valid JSON: ${aiResponse.substring(0, 100)}...`, 'error');
      throw new Error('Failed to parse team member data from OpenAI response');
    }
  } catch (error) {
    log(`Error extracting team members with OpenAI: ${error.message}`, 'error');
    if (error.message.includes('rate limit') || error.message.includes('quota')) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }
    throw new Error(`Team member extraction failed: ${error.message}`);
  }
}

/**
 * Removes images from markdown content
 * @param {string} markdown - Markdown content
 * @returns {string} - Cleaned markdown
 */
function removeImagesFromMarkdown(markdown) {
  if (!markdown) return '';

  let cleanedMarkdown = markdown.replace(/!\[.*?\]\(.*?\)/g, '');
  cleanedMarkdown = cleanedMarkdown.replace(/<img[^>]*>/g, '');
  cleanedMarkdown = cleanedMarkdown.replace(/<img[\s\S]*?>/g, '');
  cleanedMarkdown = cleanedMarkdown.replace(/\n\s*\n\s*\n/g, '\n\n');

  return cleanedMarkdown;
}

module.exports = {
  findTeamMembersFromWebsite
}; 