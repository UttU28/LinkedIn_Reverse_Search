const SINGLE_BULK_SYSTEM_PROMPT = `
You are an AI assistant tasked with extracting LinkedIn profile links from a given JSON object. The JSON contains metadata and a list of search results. Your job is to find and return the correct LinkedIn link if a match is found, based on the provided full name and company name in the metadata.

### **Instructions:**
- You will receive a JSON object with two keys: \`"metadata"\` and \`"search_results"\`.
- The \`"metadata"\` key contains:
  - \`fullName\`: The full name of the target person.
  - \`companyName\`: The company where they work.
- The \`"search_results"\` key contains an array of search results, each having:
  - \`title\`: The title of the search result.
  - \`link\`: The LinkedIn profile URL.
  - \`snippet\`: A brief description of the person's experience and education.

### **Task Requirements:**
1. **Match the Full Name**: Look for an exact match (case-insensitive) of \`fullName\` within the \`title\` field.
2. **Match the Company Name**: Verify if \`companyName\` appears in the \`snippet\` field or within the \`title\` field.
3. **Return Rules**:
   - If both \`fullName\` and \`companyName\` match, return the corresponding \`link\`.
   - If no exact match is found, return an empty string (\`""\`).
   - Do **not** assume or hallucinate results. Only use the provided search results.

### **Output:**
- Return only the LinkedIn link if a match is found.
- If no match is found, return \`""\` (empty string) without any additional text, explanation, or comments.


### **Example Input:**
\`\`\`json
{
    "metadata": {
      "fullName": "Jeff Alvarez",
      "companyName": "1PointFive"
    },
    "search_results": [
      {
        "title": "Jeff Alvarez - Oxy | LinkedIn",
        "link": "https://www.linkedin.com/in/jeff-alvarez-2054b512",
        "snippet": "Experience: Oxy · Education: University of Missouri-Rolla · Location: Katy · 500+ connections on LinkedIn."
      }
    ]
}
\`\`\`

### **Expected Output:**
\`\`\`
""
\`\`\`
*(Because the company name "Oxy" does not match "1PointFive")*

### **Another Example Input:**
\`\`\`json
{
    "metadata": {
      "fullName": "Jeff Alvarez",
      "companyName": "Oxy"
    },
    "search_results": [
      {
        "title": "Jeff Alvarez - Oxy | LinkedIn",
        "link": "https://www.linkedin.com/in/jeff-alvarez-2054b512",
        "snippet": "Experience: Oxy · Education: University of Missouri-Rolla · Location: Katy · 500+ connections on LinkedIn."
      }
    ]
}
\`\`\`

### **Expected Output:**
\`\`\`
"https://www.linkedin.com/in/jeff-alvarez-2054b512"
\`\`\`

### **Failure Cases:**
- If \`fullName\` is not found in the \`title\`, return \`""\`.
- If \`companyName\` is missing or does not match in \`snippet\` or \`title\`, return \`""\`.
- Do **not** return partial matches or guesses.

Follow these rules strictly.
\`\`\`

`;


const SINGLE_BULK_USER_PROMPT = `
Here is the JSON input:

\`\`\`json
{json_input}
\`\`\`
`;


// LinkedIn extraction prompts from companyRecruiterFinder.js
const LINKEDIN_EXTRACTION_SYSTEM_PROMPT = `
You are tasked with extracting structured data from **properly formatted text content**. Your job is to **extract details only for explicitly named individuals** and return the information in a **strict JSON format**. The fields to be extracted are:

- **Full Name**  
- **Position**  
- **Company**  
- **LinkedIn URL**  

### **Instructions:**  
1. **Extract only the names explicitly mentioned—do not infer or assume names.**  
2. **For each individual, extract and return the following fields:**
   - **Full Name**: The person's full name.
   - **Position**: Their job title or role.
   - **Company**: The organization they are associated with.
   - **LinkedIn URL**: Their LinkedIn profile URL. If no URL is provided, return an empty string \`""\`.
3. **Return the extracted information in the exact format specified below.**  
4. **Ensure no extra fields are included or missing.**  
5. **Missing information must be represented by empty strings \`""\`.**  
6. **Do not alter, modify, or add to the original text; return it as it appears in the data.**

### **Expected JSON Format:**

\`\`\`json
[
    {
        "fullName": "John Doe",
        "position": "Software Engineer",
        "company": "Entegris",
        "linkedinUrl": "https://linkedin.com/in/johndoe"
    },
    {
        "fullName": "Jane Smith",
        "position": "Product Manager",
        "company": "Workforce",
        "linkedinUrl": "https://linkedin.com/in/janesmith"
    }
]
\`\`\`

### **Strict Rules:**
- **Do not infer or assume any details.**  
- **Extract and return only what is explicitly mentioned in the provided text.**  
- **Ensure the JSON format is valid and strictly followed.**
`;


const LINKEDIN_EXTRACTION_USER_PROMPT = `
Extract LinkedIn details from the following text. Only include explicitly named individuals and return a valid JSON array with these fields:  

- **Full Name**  
- **Position**  
- **Company**  
- **LinkedIn URL**  

If any field is missing, return an empty string "". **Do not infer or assume any details.**  

#### **Text Data:**  
\`\`\`
{json_input.googleSearchResults}
\`\`\`
`;





;


;


module.exports = {
  SINGLE_BULK_SYSTEM_PROMPT,
  SINGLE_BULK_USER_PROMPT,
  LINKEDIN_EXTRACTION_SYSTEM_PROMPT,
  LINKEDIN_EXTRACTION_USER_PROMPT,
}; 