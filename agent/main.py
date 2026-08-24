import time
from datetime import datetime, timezone
import logging
from tracker import get_active_window_info, get_idle_time_seconds
from db import init_db, insert_event, get_unsynced_events, mark_events_synced
import api_client

# Configuration
POLL_INTERVAL_SECONDS = 2
IDLE_THRESHOLD_SECONDS = 300  # 5 minutes
SYNC_INTERVAL_SECONDS = 10

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def main():
    logging.info("Initializing FocusLens Desktop Agent...")
    init_db()
    logging.info("Database initialized.")
    
    device_id = None
    # Try to register device
    device_id = api_client.register_device()
    
    current_app = None
    current_title = None
    session_start_time = None
    accumulated_duration = 0.0
    is_currently_idle = False
    last_sync_time = time.time()
    last_tick_time = time.time()
    
    logging.info("Starting monitoring loop. Press Ctrl+C to stop.")
    
    try:
        while True:
            app_name, win_title = get_active_window_info()
            idle_time = get_idle_time_seconds()
            now = datetime.now(timezone.utc)
            
            # Calculate time since last tick
            now_tick = time.time()
            tick_duration = now_tick - last_tick_time
            last_tick_time = now_tick
            
            # If the tick took way too long, the PC probably slept. Cap it.
            if tick_duration > POLL_INTERVAL_SECONDS * 3:
                logging.info(f"System likely slept. Tick took {tick_duration:.1f}s. Capping to {POLL_INTERVAL_SECONDS}s.")
                tick_duration = POLL_INTERVAL_SECONDS
            
            now_idle = idle_time >= IDLE_THRESHOLD_SECONDS
            
            # Ignore certain apps (Chrome handled by extension, LockApp is not real usage)
            if app_name and app_name.lower() in ['lockapp.exe', 'chrome.exe']:
                app_name = None
                win_title = None
            
            state_changed = (
                current_app != app_name or
                current_title != win_title or
                is_currently_idle != now_idle
            )
            
            if state_changed:
                if current_app is not None and session_start_time is not None:
                    if accumulated_duration >= 1.0:
                        insert_event(
                            application=current_app,
                            window_title=current_title if current_title else "Unknown",
                            started_at=session_start_time,
                            ended_at=now,
                            duration_seconds=int(accumulated_duration),
                            idle=is_currently_idle
                        )
                        logging.info(f"Logged locally: {current_app} | {current_title} | Duration: {int(accumulated_duration)}s | Idle: {is_currently_idle}")
                
                # Start new session
                current_app = app_name
                current_title = win_title
                session_start_time = now
                accumulated_duration = 0.0
                is_currently_idle = now_idle
            else:
                # Accumulate time for the ongoing session
                accumulated_duration += tick_duration
                
            # API Sync
            if device_id and time.time() - last_sync_time > SYNC_INTERVAL_SECONDS:
                unsynced = get_unsynced_events()
                if unsynced:
                    logging.info(f"Attempting to sync {len(unsynced)} events to backend...")
                    success = api_client.sync_events(device_id, unsynced)
                    if success:
                        mark_events_synced([e['id'] for e in unsynced])
                        logging.info(f"Successfully synced {len(unsynced)} events.")
                last_sync_time = time.time()
                
            time.sleep(POLL_INTERVAL_SECONDS)
            
    except KeyboardInterrupt:
        logging.info("Stopping FocusLens Desktop Agent...")
        if current_app is not None and session_start_time is not None:
            if accumulated_duration >= 1.0:
                now = datetime.now(timezone.utc)
                insert_event(
                    application=current_app,
                    window_title=current_title if current_title else "Unknown",
                    started_at=session_start_time,
                    ended_at=now,
                    duration_seconds=int(accumulated_duration),
                    idle=is_currently_idle
                )
                logging.info(f"Final session logged locally: {current_app} | Duration: {int(accumulated_duration)}s")
                
                
        # Final sync attempt
        if device_id:
            unsynced = get_unsynced_events()
            if unsynced:
                if api_client.sync_events(device_id, unsynced):
                    mark_events_synced([e['id'] for e in unsynced])
                    logging.info("Final sync successful.")

if __name__ == "__main__":
    main()
