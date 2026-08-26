import os
import sys
import getpass

def add_to_startup(executable_path):
    abs_path = os.path.abspath(executable_path)
    
    # Path to the Windows Startup folder
    startup_dir = os.path.join(os.getenv('APPDATA'), r'Microsoft\Windows\Start Menu\Programs\Startup')
    bat_path = os.path.join(startup_dir, 'FocusLensTracker.bat')
    
    try:
        # Create a batch script in the startup folder that launches the executable
        with open(bat_path, "w") as bat_file:
            bat_file.write(f'@echo off\nstart "" "{abs_path}"\n')
            
        print(f"Successfully added shortcut to Windows Startup folder: {bat_path}")
    except Exception as e:
        print(f"Failed to add to startup folder: {e}")

if __name__ == "__main__":
    exe_path = os.path.join("dist", "run_tracker.exe")
    if os.path.exists(exe_path):
        add_to_startup(exe_path)
    else:
        print(f"Executable not found at {exe_path}. Ensure pyinstaller finished.")
