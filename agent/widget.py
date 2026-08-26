import tkinter as tk
from tkinter import ttk
import requests
import threading
import time
from datetime import datetime
import json
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

API_URL = "http://127.0.0.1:8000/activity/today?user_id=1"
POLL_INTERVAL = 10 # seconds

def flatten_events(events_data):
    filtered_data = [e for e in events_data if e.get('application', '').lower() != 'lockapp.exe']
    
    points = []
    # Create a mapping for quick lookup
    event_map = {e['id']: e for e in filtered_data if 'id' in e}
    
    for e in filtered_data:
        start_str = e['started_at']
        if not start_str.endswith('Z') and '+' not in start_str:
            start_str += 'Z'
        try:
            start_time = datetime.fromisoformat(start_str.replace('Z', '+00:00')).timestamp()
        except ValueError:
            continue
            
        end_time = start_time + e.get('duration_seconds', 0)
        if start_time >= end_time:
            continue
            
        is_desktop = e.get('application') != 'Google Chrome'
        points.append({'time': start_time, 'type': 'start', 'event_id': e['id'], 'is_desktop': is_desktop})
        points.append({'time': end_time, 'type': 'end', 'event_id': e['id'], 'is_desktop': is_desktop})
        
    points.sort(key=lambda x: x['time'])
    
    active_desktop = set()
    active_chrome = set()
    flattened = []
    
    current_event_id = None
    current_start_time = 0
    
    for pt in points:
        event_id = pt['event_id']
        if pt['type'] == 'start':
            if pt['is_desktop']:
                active_desktop.add(event_id)
            else:
                active_chrome.add(event_id)
        else:
            if pt['is_desktop']:
                active_desktop.discard(event_id)
            else:
                active_chrome.discard(event_id)
                
        winner_id = None
        if active_desktop:
            # Sort by started_at descending
            winner_id = sorted(list(active_desktop), key=lambda x: datetime.fromisoformat(event_map[x]['started_at'].replace('Z', '+00:00')).timestamp(), reverse=True)[0]
        elif active_chrome:
            winner_id = sorted(list(active_chrome), key=lambda x: datetime.fromisoformat(event_map[x]['started_at'].replace('Z', '+00:00')).timestamp(), reverse=True)[0]
            
        if winner_id != current_event_id:
            if current_event_id and current_start_time < pt['time']:
                duration = round(pt['time'] - current_start_time)
                if duration > 0:
                    ev_copy = event_map[current_event_id].copy()
                    ev_copy['duration_seconds'] = duration
                    flattened.append(ev_copy)
            current_event_id = winner_id
            current_start_time = pt['time']
            
    return flattened

class FocusWidget:
    def __init__(self, root):
        self.root = root
        self.root.overrideredirect(True) # Borderless
        
        # Warm neutral colors
        self.bg_color = "#FAF9F6"
        self.text_color = "#292524"
        
        self.root.configure(bg=self.bg_color)
        
        # Initial position (Top Right)
        screen_width = self.root.winfo_screenwidth()
        window_width = 160
        window_height = 50
        x = screen_width - window_width - 20
        y = 20
        self.root.geometry(f"{window_width}x{window_height}+{x}+{y}")
        
        # Create a frame for padding and border effect
        self.frame = tk.Frame(self.root, bg=self.bg_color, highlightbackground="#E5E5E5", highlightthickness=1)
        self.frame.pack(fill=tk.BOTH, expand=True)
        
        self.label_title = tk.Label(self.frame, text="Active Screentime", font=("Segoe UI", 8), bg=self.bg_color, fg="#78716C")
        self.label_title.pack(pady=(4, 0))
        
        self.label_time = tk.Label(self.frame, text="Loading...", font=("Segoe UI", 12, "bold"), bg=self.bg_color, fg=self.text_color)
        self.label_time.pack(pady=(0, 4))
        
        # Draggable setup
        self.frame.bind("<ButtonPress-1>", self.start_move)
        self.frame.bind("<B1-Motion>", self.do_move)
        self.label_title.bind("<ButtonPress-1>", self.start_move)
        self.label_title.bind("<B1-Motion>", self.do_move)
        self.label_time.bind("<ButtonPress-1>", self.start_move)
        self.label_time.bind("<B1-Motion>", self.do_move)
        
        # Add a subtle right-click context menu to close
        self.menu = tk.Menu(self.root, tearoff=0)
        self.menu.add_command(label="Close Widget", command=self.root.destroy)
        self.frame.bind("<Button-3>", self.show_menu)
        self.label_title.bind("<Button-3>", self.show_menu)
        self.label_time.bind("<Button-3>", self.show_menu)
        
        # Start fetch loop
        self.running = True
        self.thread = threading.Thread(target=self.fetch_data_loop, daemon=True)
        self.thread.start()
        
        self.root.update()
        self.pin_to_desktop()
        
    def pin_to_desktop(self):
        try:
            import ctypes
            hwnd = ctypes.windll.user32.GetParent(self.root.winfo_id())
            
            progman = ctypes.windll.user32.FindWindowW("Progman", None)
            ctypes.windll.user32.SendMessageTimeoutW(progman, 0x052C, 0, 0, 0, 1000, None)
            
            workerw = 0
            def enum_windows(hwnd_w, lParam):
                nonlocal workerw
                p = ctypes.windll.user32.FindWindowExW(hwnd_w, 0, "SHELLDLL_DefView", None)
                if p != 0:
                    workerw = ctypes.windll.user32.FindWindowExW(0, hwnd_w, "WorkerW", None)
                return True
            
            WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_int, ctypes.c_int)
            ctypes.windll.user32.EnumWindows(WNDENUMPROC(enum_windows), 0)
            
            if workerw:
                ctypes.windll.user32.SetParent(hwnd, workerw)
            elif progman:
                ctypes.windll.user32.SetParent(hwnd, progman)
        except Exception as e:
            print("Failed to pin to desktop:", e)
            
    def start_move(self, event):
        self.x = event.x
        self.y = event.y

    def do_move(self, event):
        x = self.root.winfo_x() - self.x + event.x
        y = self.root.winfo_y() - self.y + event.y
        self.root.geometry(f"+{x}+{y}")
        
    def show_menu(self, event):
        self.menu.post(event.x_root, event.y_root)

    def format_duration(self, seconds):
        hrs = int(seconds // 3600)
        mins = int((seconds % 3600) // 60)
        if hrs > 0:
            return f"{hrs}h {mins}m"
        return f"{mins}m"

    def fetch_data_loop(self):
        while self.running:
            try:
                response = requests.get(API_URL, timeout=5)
                if response.status_code == 200:
                    events = response.json()
                    flattened = flatten_events(events)
                    
                    total_seconds = sum(e.get('duration_seconds', 0) for e in flattened)
                    idle_seconds = sum(e.get('duration_seconds', 0) for e in flattened if e.get('idle', False))
                    active_seconds = total_seconds - idle_seconds
                    
                    self.root.after(0, self.update_label, self.format_duration(active_seconds))
            except Exception as e:
                logging.error(f"Error fetching data: {e}")
                
            time.sleep(POLL_INTERVAL)
            
    def update_label(self, text):
        self.label_time.config(text=text)

if __name__ == "__main__":
    root = tk.Tk()
    app = FocusWidget(root)
    root.mainloop()
