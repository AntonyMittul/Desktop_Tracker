import win32gui
import win32process
import win32api
import psutil
import time

def get_active_window_info():
    """
    Returns a tuple of (application_name, window_title) for the currently active foreground window.
    Returns (None, None) if it cannot be determined.
    """
    try:
        hwnd = win32gui.GetForegroundWindow()
        if not hwnd:
            return None, None
            
        window_title = win32gui.GetWindowText(hwnd)
        
        # Get the process ID
        _, pid = win32process.GetWindowThreadProcessId(hwnd)
        
        # Get the process name
        process = psutil.Process(pid)
        application_name = process.name()
        
        return application_name, window_title
    except Exception as e:
        # Ignore errors (e.g., process terminating while we query it, or access denied)
        return None, None

def get_idle_time_seconds():
    """
    Returns the number of seconds since the last user input (mouse move or keypress).
    """
    try:
        last_input_info = win32api.GetLastInputInfo()
        current_tick = win32api.GetTickCount()
        
        elapsed_ms = current_tick - last_input_info
        return elapsed_ms / 1000.0
    except Exception as e:
        return 0
