import requests
import datetime
from pprint import pprint

BASE_URL = "http://localhost:8000"

def test_api():
    try:
        print("Testing Root:")
        res = requests.get(f"{BASE_URL}/")
        pprint(res.json())
        
        print("\nRegistering User:")
        res = requests.post(f"{BASE_URL}/auth/register", json={"email": "test@example.com", "password": "password"})
        if res.status_code == 200:
            pprint(res.json())
        else:
            print("User registration failed or already exists:", res.json())
            
        print("\nRegistering Device:")
        res = requests.post(f"{BASE_URL}/devices/register", json={"user_id": 1, "device_name": "Test Laptop", "os": "Windows"})
        pprint(res.json())
        device_id = res.json().get('id', 1)
        
        print("\nSending Event:")
        now = datetime.datetime.utcnow().isoformat()
        res = requests.post(f"{BASE_URL}/activity/events?device_id={device_id}", json=[{
            "application": "Code.exe",
            "window_title": "test_api.py - VS Code",
            "started_at": now,
            "ended_at": now,
            "duration_seconds": 60,
            "idle": False
        }])
        pprint(res.json())
        
    except Exception as e:
        print("Failed to run tests:", e)

if __name__ == '__main__':
    test_api()
