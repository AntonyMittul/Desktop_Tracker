import threading
import sys
import logging

# Set up logging for the combined app
logging.basicConfig(
    filename='tracker_agent.log', 
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Import the two modules
import main as tracker_main
import widget as tracker_widget

def start_tracker():
    try:
        tracker_main.main()
    except Exception as e:
        logging.error(f"Tracker thread failed: {e}")

if __name__ == "__main__":
    logging.info("Starting Desktop Tracker & Widget...")
    
    # Start the tracker in a daemon thread
    tracker_thread = threading.Thread(target=start_tracker, daemon=True)
    tracker_thread.start()
    
    # Start the widget in the main thread (required for Tkinter)
    try:
        app = tracker_widget.ScreentimeWidget()
        app.root.mainloop()
    except Exception as e:
        logging.error(f"Widget failed: {e}")
