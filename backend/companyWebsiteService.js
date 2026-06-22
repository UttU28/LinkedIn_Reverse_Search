const {
  log,
  GoogleCustomSearch,
  extractEssentialData,
  callOpenAI,
  extractUrlFromResponse,
  LlmUnavailableError,
  llmCircuitBreaker
} = require('./utils');
const dbService = require('./dbService');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Prompts for extracting the official company website from Google results
const COMPANY_WEBSITE_SYSTEM_PROMPT = `
You are an assistant that picks the **official primary website** for a company from Google search results.

You will be given a JSON object with:
- "metadata": { "companyName": string }
- "search_results": array of objects with:
  - "title": string
  - "link": string
  - "snippet": string (short text from the page)

Your task:
1. Carefully inspect the search results and determine which link is the company's **official main website**.
2. Prefer:
   - Domains that clearly match the company name.
   - The company's own domain over third‑party sites (news, LinkedIn, Crunchbase, etc.).
   - The global corporate/homepage (e.g. "https://company.com/"), not subpages, unless only a subpage exists.
3. If you are **not reasonably sure** which result is the official site, return an empty string "".

Output rules (very important):
- Return **only** the URL of the official website, like:
  https://example.com
- If no official site can be confidently identified, return exactly:
  ""
- Do not add explanations, comments, or any extra text.
`;

const COMPANY_WEBSITE_USER_PROMPT = `
Here are Google search results for a company. Decide if you can confidently identify the company's **official primary website**.

JSON input:

\`\`\`json
{json_input}
\`\`\`

Remember:
- Prefer the company's own domain.
- If unsure, return "".
`;

async function findOfficialCompanyWebsite(companyName) {
  try {
    if (!companyName || !companyName.trim()) {
      throw new Error('Company name is required');
    }

    const API_KEY = process.env.GOOGLE_API_KEY;
    const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!API_KEY || !SEARCH_ENGINE_ID) {
      throw new Error('Missing GOOGLE_API_KEY or GOOGLE_SEARCH_ENGINE_ID in environment');
    }

    llmCircuitBreaker.assertAvailable();

    const searchClient = new GoogleCustomSearch(API_KEY, SEARCH_ENGINE_ID);

    const searchQueries = [
      `${companyName} official website`,
      `${companyName} company website`,
      `${companyName} homepage`
    ];

    let results = [];

    for (const query of searchQueries) {
      log(`Company website search: "${query}"`, 'info');
      const batch = await searchClient.search(query, 10);
      if (batch && batch.length > 0) {
        results = batch;
        break;
      }
    }

    if (!results || results.length === 0) {
      log(`No Google search results for company: ${companyName}`, 'warn');
      return {
        success: false,
        websiteUrl: '',
        message: 'No Google search results found'
      };
    }

    const essentialData = extractEssentialData(results);

    const jsonData = {
      metadata: {
        companyName: companyName
      },
      search_results: essentialData
    };

    const aiResponse = await callOpenAI(
      jsonData,
      COMPANY_WEBSITE_SYSTEM_PROMPT,
      COMPANY_WEBSITE_USER_PROMPT
    );

    if (!aiResponse) {
      log(`LLM returned no response for company: ${companyName}`, 'warn');
      return {
        success: false,
        websiteUrl: '',
        message: 'LLM did not return a response'
      };
    }

    const websiteUrl = (extractUrlFromResponse(aiResponse) || '').trim();

    if (!websiteUrl) {
      log(`LLM could not confidently identify official site for: ${companyName}`, 'info');
      return {
        success: false,
        websiteUrl: '',
        message: 'No official website confidently identified'
      };
    }

    return {
      success: true,
      websiteUrl,
      message: 'Official company website found'
    };
  } catch (error) {
    if (error instanceof LlmUnavailableError) {
      throw error;
    }
    log(`Error in findOfficialCompanyWebsite: ${error.message}`, 'error');
    return {
      success: false,
      websiteUrl: '',
      message: `Error: ${error.message}`
    };
  }
}

/**
 * Find official website for a single company, with caching and credit tracking.
 */
async function findSingleCompanySite(companyName, userID = null) {
  let historyId = null;

  try {
    const trimmed = (companyName || '').trim();
    if (!trimmed) {
      throw new Error('Company name is required');
    }

    // Check cache first
    const cached = await dbService.getCompanySiteFromCache(trimmed);
    if (cached && cached.websiteUrl) {
      log(`[COMPANY SITE] Cache hit for ${trimmed}`, 'debug');

      if (userID) {
        historyId =
          (await dbService.addSearchHistory(userID, {
            type: 'companySitesSingle',
            status: 'completed',
            inputMeta: { company: trimmed },
            totalRecords: 1,
            resultsCount: 1,
            resultRefPath: 'companySites',
            websiteUrl: cached.websiteUrl,
            startedAt: new Date(),
            completedAt: new Date()
          })) || null;

        await dbService.updateSearchCost(userID, historyId, 'companySitesSingle', 1, {
          quiet: true
        });
      }

      return {
        success: true,
        websiteUrl: cached.websiteUrl,
        fromCache: true,
        historyId,
        message: 'Official company website found (cache)'
      };
    }

    // Create history record if we have a user
    if (userID) {
      historyId =
        (await dbService.addSearchHistory(userID, {
          type: 'companySitesSingle',
          status: 'processing',
          inputMeta: { company: trimmed },
          totalRecords: 1,
          resultRefPath: 'companySites',
          startedAt: new Date()
        })) || null;
    }

    const result = await findOfficialCompanyWebsite(trimmed);

    const websiteUrl = (result && result.websiteUrl) || '';
    const success = !!websiteUrl;

    if (success) {
      await dbService.addCompanySiteToCache(trimmed, websiteUrl);
    }

    if (userID && historyId) {
      await dbService.updateSearchHistory(userID, historyId, {
        status: success ? 'completed' : 'failed',
        totalRecords: 1,
        resultsCount: success ? 1 : 0,
        websiteUrl: success ? websiteUrl : '',
        completedAt: new Date()
      });

      if (success) {
        await dbService.updateSearchCost(userID, historyId, 'companySitesSingle', 1);
      }
    }

    return {
      success,
      websiteUrl,
      fromCache: false,
      historyId,
      message: success ? 'Official company website found' : 'No official website found'
    };
  } catch (error) {
    if (error instanceof LlmUnavailableError) {
      throw error;
    }
    log(`Error in findSingleCompanySite: ${error.message}`, 'error');

    if (userID && historyId) {
      await dbService.updateSearchHistory(userID, historyId, {
        status: 'error',
        errorMessage: error.message,
        completedAt: new Date()
      });
    }

    return {
      success: false,
      websiteUrl: '',
      fromCache: false,
      historyId,
      message: `Error finding company website: ${error.message}`
    };
  }
}

/**
 * Bulk company website finder with de-duplication, caching and rate limiting.
 * Processes unique companies sequentially, pausing 120s after every 50 lookups.
 */
async function findBulkCompanySites(companies, userID = null, fileName = null) {
  const safeList = Array.isArray(companies) ? companies : [];
  const cleaned = safeList
    .map((c) => (c || '').trim())
    .filter((c) => c.length > 0);

  if (!cleaned.length) {
    return {
      success: false,
      message: 'No valid company names provided',
      historyId: null,
      results: []
    };
  }

  // De-duplicate while preserving first spelling
  const seen = new Map();
  for (const name of cleaned) {
    const key = name.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, name);
    }
  }
  const uniqueCompanies = Array.from(seen.values());

  let historyId = null;

  try {
    llmCircuitBreaker.reset();

    if (userID) {
      historyId =
        (await dbService.addSearchHistory(userID, {
          type: 'companySitesBulk',
          status: 'processing',
          inputMeta: {
            fileName: fileName || null,
            totalCompaniesProvided: cleaned.length,
            totalUniqueCompanies: uniqueCompanies.length
          },
          totalRecords: uniqueCompanies.length,
          resultsCount: 0,
          resultRefPath: 'companySites',
          startedAt: new Date()
        })) || null;
    }

    const results = [];
    let processedCount = 0;
    let successCount = 0;
    let fromCacheCount = 0;
    let skippedCount = 0;
    let nonCachedSincePause = 0;

    for (const company of uniqueCompanies) {
      let websiteUrl = '';
      let fromCache = false;

      try {
        const cached = await dbService.getCompanySiteFromCache(company);
        if (cached && cached.websiteUrl) {
          websiteUrl = cached.websiteUrl;
          fromCache = true;
          fromCacheCount += 1;
        } else {
          const result = await findOfficialCompanyWebsite(company);
          websiteUrl = (result && result.websiteUrl) || '';
          fromCache = false;

          if (websiteUrl) {
            await dbService.addCompanySiteToCache(company, websiteUrl);
          }
        }
      } catch (innerError) {
        if (innerError instanceof LlmUnavailableError) {
          log(`Aborting company site bulk: ${innerError.message}`, 'error');
          throw innerError;
        }
        log(`Error processing company "${company}": ${innerError.message}`, 'error');
      }

      if (websiteUrl) {
        successCount += 1;
      } else {
        skippedCount += 1;
      }

      processedCount += 1;
      results.push({
        companyName: company,
        websiteUrl,
        fromCache
      });

      // Persist per-company result row for dashboard exports
      if (userID && historyId && websiteUrl) {
        await dbService.addCompanySiteResult(userID, historyId, company, websiteUrl, fromCache);
      }

      if (!fromCache) {
        nonCachedSincePause += 1;
      }

      if (nonCachedSincePause >= 50 && processedCount < uniqueCompanies.length) {
        log(
          `[COMPANY SITES BULK] Processed ${processedCount} companies (${nonCachedSincePause} external lookups), sleeping 90s to respect limits`,
          'info'
        );
        await sleep(90000);
        nonCachedSincePause = 0;
      }
    }

    if (userID && historyId) {
      await dbService.updateSearchHistory(userID, historyId, {
        status: 'completed',
        totalRecords: uniqueCompanies.length,
        resultsCount: successCount,
        completedAt: new Date()
      });

      if (successCount > 0) {
        await dbService.updateSearchCost(userID, historyId, 'companySitesBulk', successCount);
      }
    }

    const newlyCached = successCount - fromCacheCount;
    log(
      `[COMPANY SITES BULK] Completed: ${processedCount} companies total. ` +
        `${successCount} sites found, ${skippedCount} skipped (no confident site). ` +
        `${fromCacheCount} from cache, ${newlyCached} newly cached.`,
      'info'
    );

    return {
      success: true,
      message: `Processed ${processedCount} companies, found ${successCount} websites`,
      historyId,
      results
    };
  } catch (error) {
    log(`Bulk company site search error: ${error.message}`, 'error');

    if (userID && historyId) {
      await dbService.updateSearchHistory(userID, historyId, {
        status: 'failed',
        errorMessage: error.message,
        completedAt: new Date()
      });
    }

    return {
      success: false,
      message: `Error processing company sites: ${error.message}`,
      historyId,
      results: []
    };
  }
}

/**
 * Get company website for embedding in profile search (no separate history/cost).
 * Uses cache; on miss calls findOfficialCompanyWebsite and caches result.
 * @param {string} companyName
 * @returns {Promise<{ websiteUrl: string, fromCache: boolean }>}
 */
async function getCompanyWebsiteForProfileSearch(companyName) {
  const trimmed = (companyName || '').trim();
  if (!trimmed) {
    return { websiteUrl: '', fromCache: false };
  }
  const cached = await dbService.getCompanySiteFromCache(trimmed);
  if (cached && cached.websiteUrl) {
    log(`[COMPANY SITE] Cache hit for profile search: ${trimmed}`, 'debug');
    return { websiteUrl: cached.websiteUrl, fromCache: true };
  }
  const result = await findOfficialCompanyWebsite(trimmed);
  const websiteUrl = (result && result.websiteUrl) || '';
  if (websiteUrl) {
    await dbService.addCompanySiteToCache(trimmed, websiteUrl);
  }
  return { websiteUrl, fromCache: false };
}

module.exports = {
  findSingleCompanySite,
  findBulkCompanySites,
  getCompanyWebsiteForProfileSearch
};

