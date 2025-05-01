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
  try {
    log(`Searching for team members from website: ${companyUrl}`);
    
    // Create historyId to track this search operation
    const historyId = await dbService.addSearchHistory(userID, {
      type: "team",
      status: "processing",
      inputMeta: {
        companyUrl: companyUrl
      },
      totalRecords: 0, // Will update once we have results
      resultRefPath: "searchResults",
      startedAt: new Date()
    });
    
    log(`Created search history with ID: ${historyId}`);
    
    // Step 1: Map all URLs from the company website
    const teamPages = await mapUrlsFromCompany(companyUrl);
    
    if (!teamPages || teamPages.length === 0) {
      await dbService.updateSearchHistory(userID, historyId, {
        status: "failed",
        errorMessage: "No team/about pages found on the company website"
      });
      
      return {
        success: false,
        message: "No team/about pages found on the company website",
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
        message: "Failed to scrape team page content",
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
        message: "No team members found on the page",
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
            // Email is intentionally excluded as requested
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
    
    log(`Search completed. Found ${processedResults.length} team members at ${companyUrl}`);
    
    // Return formatted response
    return {
      success: true,
      message: `Found ${processedResults.length} team members at ${companyUrl}`,
      data: processedResults,
      historyId: historyId
    };
  } catch (error) {
    log(`Error finding team members: ${error.message}`);
    
    // Update history with error status if historyId exists
    if (arguments[2]) {
      await dbService.updateSearchHistory(userID, arguments[2], {
        status: "error",
        errorMessage: error.message
      });
    }
    
    return {
      success: false,
      message: `Error finding team members: ${error.message}`,
      error: error.message,
      data: [],
      historyId: arguments[2] || null
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
    log(`Mapping URLs from: ${url}`);
    
    const response = await axios.post(
      `${API_BASE}/map`,
      { url },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (!response.data.success && response.data.status !== 'success') {
      throw new Error('Failed to map URLs from company website');
    }
    
    const allLinks = response.data.links;
    log(`Total URLs mapped: ${allLinks.length}`);
    
    const teamPages = filterAboutAndTeamPages(allLinks);
    log(`Found ${teamPages.length} About/Team/Leadership pages`);
    
    return teamPages;
  } catch (error) {
    log(`Error mapping URLs: ${error.message}`);
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
    log(`Scraping markdown from: ${url}`);
    
    const response = await axios.post(
      `${API_BASE}/scrape`,
      { url, formats: ['markdown'] },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (!response.data.success) {
      throw new Error('Failed to scrape page content');
    }
    
    const markdownContent = response.data.data.markdown;
    return removeImagesFromMarkdown(markdownContent);
  } catch (error) {
    log(`Error scraping page: ${error.message}`);
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
  if (!markdownContent) return null;
  
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    log("Error: OpenAI API key not found in environment variables");
    return null;
  }

  const MAX_CHARS = 32000;
  let processedMarkdown = markdownContent.length > MAX_CHARS
    ? markdownContent.substring(0, MAX_CHARS)
    : markdownContent;

  // Create a JSON object for callOpenAI function
  const jsonData = {
    markdownData: processedMarkdown
  };

  // Use the callOpenAI function from utils which now includes rate limiting
  try {
    const aiResponse = await callOpenAI(
      jsonData,
      TEAM_MEMBERS_SYSTEM_PROMPT,
      TEAM_MEMBERS_MARKDOWN_USER_PROMPT
    );

    if (!aiResponse) {
      throw new Error('No response from OpenAI API');
    }

    try {
      return JSON.parse(aiResponse);
    } catch {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Failed to parse OpenAI response as JSON');
    }
  } catch (error) {
    log(`Error extracting team members: ${error.message}`);
    return [];
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