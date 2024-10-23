import requests
sss = "https://www.linkedin.com/in/garyzhu/"

url = f"https://api-public.salesql.com/v1/persons/enrich/?linkedin_url={sss}"
headers = {
    "accept": "application/json",
    "Authorization": "Bearer ZAuOYiUjklVmhWoVVUKqoXzboZ9XSQ7s"
}

response = requests.get(url, headers=headers)

print(response.text)