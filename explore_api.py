import requests
import json

BASE_URL = "https://bukhorcha-backend-zuiy.onrender.com/api/admin"

def login():
    url = f"{BASE_URL}/auth/login"
    payload = {
        "username": "admin",
        "password": "admin123"
    }
    headers = {"Content-Type": "application/json"}
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Login Status: {response.status_code}")
        if response.status_code == 201 or response.status_code == 200:
            data = response.json()
            # Handle potentially different response structures
            if "result" in data and "accessToken" in data["result"]:
                return data["result"]["accessToken"]
            elif "accessToken" in data:
                return data["accessToken"]
            else:
                print("Token not found in response keys: ", data.keys())
                return None
        else:
            print(f"Login failed: {response.text}")
            return None
    except Exception as e:
        print(f"Login Exception: {e}")
        return None

def test_endpoint(endpoint, token):
    url = f"{BASE_URL}{endpoint}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    print(f"\nTesting {url} ...")
    try:
        # Try GET
        response_get = requests.get(url, headers=headers)
        print(f"GET {endpoint}: {response_get.status_code}")
        if response_get.status_code == 200:
            print(f"GET Content Sample: {str(response_get.json())[:200]}")
        
        # If GET fails with 404, maybe it requires POST (RPC style)?
        if response_get.status_code == 404:
             pass # keeping it simple for now, but could try POST if needed
             
    except Exception as e:
        print(f"Request Exception: {e}")

def main():
    token = login()
    if token:
        print("Token obtained successfully.")
        endpoints = [
            "/management",
            "/users",
            "/news",
            "/tours",
            "/birthdays",
            "/statistic",
            "/statistics",
            "/upload",
            "/uploads"
        ]
        for ep in endpoints:
            test_endpoint(ep, token)
    else:
        print("Failed to obtain token. Exiting.")

if __name__ == "__main__":
    main()
