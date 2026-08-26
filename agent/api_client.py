import requests
import logging
import platform

import os

BASE_URL = os.getenv("API_URL", "http://localhost:8000")
def register_device(user_id=1):
    try:
        # In a real app, user_id would be configured after login
        device_name = platform.node()
        os_name = platform.system()
        
        logging.info(f"Registering device {device_name} with API...")
        res = requests.post(f"{BASE_URL}/devices/register", json={
            "user_id": user_id,
            "device_name": device_name,
            "os": os_name
        })
        
        if res.status_code == 200:
            device_id = res.json().get('id')
            logging.info(f"Device registered with ID: {device_id}")
            return device_id
        else:
            logging.error(f"Failed to register device: {res.text}")
            return None
    except Exception as e:
        logging.error(f"Error connecting to API: {e}")
        return None

def sync_events(device_id, events):
    if not events: return True
    
    payload = []
    for e in events:
        payload.append({
            "application": e["application"],
            "window_title": e["window_title"],
            "started_at": e["started_at"],
            "ended_at": e["ended_at"],
            "duration_seconds": e["duration_seconds"],
            "idle": bool(e["idle"])
        })
        
    try:
        res = requests.post(f"{BASE_URL}/activity/events?device_id={device_id}", json=payload)
        if res.status_code == 200:
            return True
        else:
            logging.error(f"Failed to sync events: {res.text}")
            return False
    except Exception as e:
        logging.error(f"Error syncing events to API: {e}")
        return False
