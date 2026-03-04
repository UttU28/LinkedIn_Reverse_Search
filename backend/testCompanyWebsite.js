const {
  log,
  GoogleCustomSearch,
  extractEssentialData,
  callOpenAI,
  extractUrlFromResponse
} = require('./utils');

// Simple prompts tailored for extracting the official company website
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

    const searchClient = new GoogleCustomSearch(API_KEY, SEARCH_ENGINE_ID);

    // Simple search strategies focused on the official website
    const searchQueries = [
      `${companyName} official website`,
      `${companyName} company website`,
      `${companyName} homepage`
    ];

    let results = [];

    for (const query of searchQueries) {
      log(`Company website test search: "${query}"`, 'info');
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
    log(`Error in findOfficialCompanyWebsite: ${error.message}`, 'error');
    return {
      success: false,
      websiteUrl: '',
      message: `Error: ${error.message}`
    };
  }
}

// Simple CLI for manual testing:
//   node testCompanyWebsite.js "Company Name"
if (require.main === module) {
  const companyName = process.argv.slice(2).join(' ').trim();

  if (!companyName) {
    // eslint-disable-next-line no-console
    console.error('Usage: node testCompanyWebsite.js "Company Name"');
    process.exit(1);
  }

  findOfficialCompanyWebsite(companyName)
    .then((result) => {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Unexpected error:', err);
      process.exit(1);
    });
}

module.exports = {
  findOfficialCompanyWebsite
};

