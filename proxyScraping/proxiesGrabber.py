import json
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
import sys

api_url = "https://proxylist.geonode.com/api/proxy-list?limit=250&page=1&sort_by=lastChecked&sort_type=desc"

threshold = 100

pass_count = 0
fail_count = 0

def test_proxy(proxy):
    global pass_count, fail_count
    proxy_address = f"{proxy.get('protocols')[0]}://{proxy.get('ip')}:{proxy.get('port')}"
    try:
        response = requests.get("http://example.com", proxies={proxy.get('protocols')[0]: proxy_address}, timeout=5)
        if response.status_code == 200:
            pass_count += 1
            update_counter(pass_count, fail_count)
            return {
                "ip": proxy.get("ip"),
                "port": proxy.get("port"),
                "protocols": proxy.get("protocols")
            }
    except Exception:
        fail_count += 1
        update_counter(pass_count, fail_count)
    return None

def update_counter(pass_count, fail_count):
    sys.stdout.write(f"\rPassed: {pass_count} | Failed: {fail_count}")
    sys.stdout.flush()

try:
    response = requests.get(api_url)
    response.raise_for_status()
    proxies_json = response.json().get('data', [])
    print(f"Fetched {len(proxies_json)} proxies from the API.")
except Exception as e:
    print(f"Failed to fetch proxies from API: {str(e)}")
    proxies_json = []

working_proxies = []

with ThreadPoolExecutor(max_workers=5) as executor:
    future_to_proxy = {executor.submit(test_proxy, proxy): proxy for proxy in proxies_json}
    
    for future in as_completed(future_to_proxy):
        result = future.result()
        if result:
            working_proxies.append(result)
            if len(working_proxies) >= threshold:
                print(f"\nReached the threshold of {threshold} working proxies. Stopping.")
                break

output_file = "proxies.json"
try:
    with open(output_file, "w") as file:
        json.dump(working_proxies, file, indent=4)
    print(f"\nWorking proxies have been saved to {output_file}.")
except Exception as e:
    print(f"\nFailed to save working proxies to file: {str(e)}")
