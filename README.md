# ScreenTime Analytics (Tracker)

A fully automated, privacy-first local screentime tracker built to help you understand and optimize your digital habits. 

## The Problem
In the modern digital age, it's incredibly easy to lose hours of time context-switching between productive work and distracting websites. Most existing screen time tools are either:
1. **Inaccurate**: They fail to understand when you are actually active versus when you just walked away from your computer. 
2. **Intrusive**: They block your screen or act as a "nanny," rather than simply providing you with clear data.
3. **Invasive**: They send your personal browsing habits to a cloud server.

## The Solution
**ScreenTime Analytics** solves this by running entirely locally on your machine. It precisely tracks the active window on your desktop and the exact URL you are viewing in Chrome. It intelligently handles idle time (even knowing the difference between walking away from your computer versus sitting back to watch a 30-minute YouTube video).

## Key Features

- 🎯 **Pinpoint Accuracy**: Uses a background Python agent to track active Windows applications and a Chrome Extension to track specific URLs and Tabs.
- 🧠 **Smart Idle Detection**: Automatically stops tracking if you walk away from your PC, but intelligently stays active if a tab is playing audio or video (like YouTube or Spotify).
- 📊 **Beautiful Live Dashboard**: A React/Next.js web dashboard that provides a clean, calming UI to view your daily and historical screentime, updating live every 5 seconds.
- 📌 **Always-On Desktop Widget**: Features a sleek floating widget that uses native Windows APIs to pin itself perfectly to your desktop wallpaper. It never gets in the way of your work and never disappears when you minimize your windows.
- 🔒 **100% Local & Private**: All data is stored in a local PostgreSQL database via a FastAPI backend. Your data never leaves your machine.

## Tech Stack
- **Frontend**: Next.js, React, Recharts, Tailwind CSS
- **Backend**: FastAPI (Python), PostgreSQL, SQLAlchemy
- **Desktop Agent**: Python (PyGetWindow), PyInstaller, Win32 APIs
- **Browser**: Custom Chrome Extension (Manifest V3)

## Installation & Setup

1. **Start the Backend**
   Ensure Docker is running, then spin up the database and API:
   ```bash
   cd backend
   docker-compose up -d
   uvicorn main:app --reload --port 8000
   ```

2. **Start the Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Install the Chrome Extension**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `chrome-extension` folder.

4. **Run the Desktop Agent**
   - The desktop agent has been compiled into a standalone executable. 
   - Run `agent/dist/run_tracker.exe` to start the background tracker and launch the desktop widget.
   - *Note: A script is included (`setup_startup.py`) to automatically add this executable to your Windows Startup folder.*