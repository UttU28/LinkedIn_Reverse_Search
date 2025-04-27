const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { TEAM_MEMBERS_SYSTEM_PROMPT, TEAM_MEMBERS_MARKDOWN_USER_PROMPT } = require('./prompts');

const FIRECRAWL_URL = 'http://localhost:3002';
const API_BASE = `${FIRECRAWL_URL}/v1`;
const OPENAI_API_KEY = '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';

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
    'about', 'team', 'leadership', 'people', 'who-we-are', 'our-company', 'founders', 'executive', 'management', 'board', 'staff', 'directors'
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

async function extractTeamMembersFromMarkdown(markdownContent) {
  if (!OPENAI_API_KEY) return null;

  const MAX_CHARS = 32000;
  let processedMarkdown = markdownContent.length > MAX_CHARS
    ? markdownContent.substring(0, MAX_CHARS)
    : markdownContent;

  const compiledUserPrompt = TEAM_MEMBERS_MARKDOWN_USER_PROMPT.replace("{markdownData}", processedMarkdown);

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: TEAM_MEMBERS_SYSTEM_PROMPT },
          { role: "user", content: compiledUserPrompt }
        ],
        temperature: 0,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content;

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
    return [];
  }
}

async function mapAndScrape(url) {
  try {
    const mapResponse = await axios.post(
      `${API_BASE}/map`,
      { url },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!mapResponse.data.success && mapResponse.data.status !== 'success') return;

    const allLinks = mapResponse.data.links;
    const teamPages = filterAboutAndTeamPages(allLinks);

    if (teamPages.length === 0) return;

    const teamPageUrl = teamPages[0];

    const scrapeResponse = await axios.post(
      `${API_BASE}/scrape`,
      { url: teamPageUrl, formats: ['markdown'] },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!scrapeResponse.data.success) return;

    const markdownContent = scrapeResponse.data.data.markdown;

    const outputDir = 'outputs';
    fs.mkdirSync(outputDir, { recursive: true });

    const markdownWithoutImages = removeImagesFromMarkdown(markdownContent);
    const markdownWithHeader = `\n# Team Page from: ${teamPageUrl}\n\n${markdownWithoutImages}\n\n---\n\n`;
    const outputFilePath = path.join(outputDir, 'output.md');

    fs.appendFileSync(outputFilePath, markdownWithHeader);

    const teamMembers = await extractTeamMembersFromMarkdown(markdownWithoutImages);

    if (teamMembers && teamMembers.length > 0) {
      const teamDataPath = path.join(outputDir, 'team_data.json');
      fs.writeFileSync(teamDataPath, JSON.stringify(teamMembers, null, 2));
    }
  } catch (error) {
    return;
  }
}

function removeImagesFromMarkdown(markdown) {
  if (!markdown) return '';

  let cleanedMarkdown = markdown.replace(/!\[.*?\]\(.*?\)/g, '');
  cleanedMarkdown = cleanedMarkdown.replace(/<img[^>]*>/g, '');
  cleanedMarkdown = cleanedMarkdown.replace(/<img[\s\S]*?>/g, '');
  cleanedMarkdown = cleanedMarkdown.replace(/\n\s*\n\s*\n/g, '\n\n');

  return cleanedMarkdown;
}

if (require.main === module) {
  const targetUrl = "https://shadow.vc/";
  mapAndScrape(targetUrl);
}

module.exports = { mapAndScrape, filterAboutAndTeamPages };
