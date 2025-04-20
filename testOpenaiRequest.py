import openai
from service.prompts import SYSTEM_PROMPT, USER_PROMPT
import os
import json
from colorama import init, Fore, Style
from dotenv import load_dotenv

# Initialize colorama and load environment variables
init()
load_dotenv()

def printStatus(message: str, color: str = Fore.WHITE):
    print(f"{color}{message}{Style.RESET_ALL}")

def callOpenaiGpt(systemPrompt, userPrompt):
    try:
        openai.api_key = os.getenv('OPENAI_API_KEY')
        if not openai.api_key:
            raise ValueError("OpenAI API key not found in environment variables")
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": systemPrompt},
                {"role": "user", "content": userPrompt}
            ],
            temperature=0,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0
        )
        
        # Get OpenAI responses directory from environment variable
        responsesDir = os.getenv('OPENAI_RESPONSES_DIR', 'openaiResponses')
        os.makedirs(responsesDir, exist_ok=True)
        outputFile = os.path.join(responsesDir, 'response.txt')
        
        with open(outputFile, 'w', encoding='utf-8') as f:
            f.write(f"System Prompt:\n{systemPrompt}\n\n")
            f.write(f"User Prompt:\n{userPrompt}\n\n")
            f.write(f"Response:\n{response['choices'][0]['message']['content']}")
        
        return response["choices"][0]["message"]["content"]
    
    except Exception as e:
        printStatus(f"Error making OpenAI request: {str(e)}", Fore.RED)
        return None

def testExtraction():
    testData = {
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
    
    userPrompt = USER_PROMPT.replace("{json_input}", json.dumps(testData, indent=2))
    response = callOpenaiGpt(SYSTEM_PROMPT, userPrompt)
    
    printStatus("\nTest extraction result:", Fore.CYAN)
    printStatus(response, Fore.GREEN)

if __name__ == "__main__":
    testExtraction()
