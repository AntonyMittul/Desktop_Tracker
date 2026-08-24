import sqlite3
import os
from datetime import datetime

DB_PATH = 'focuslens_local.db'

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS activity_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            application TEXT NOT NULL,
            window_title TEXT NOT NULL,
            started_at DATETIME NOT NULL,
            ended_at DATETIME NOT NULL,
            duration_seconds INTEGER NOT NULL,
            idle BOOLEAN NOT NULL DEFAULT 0,
            synced BOOLEAN NOT NULL DEFAULT 0
        )
    ''')
    # Try to add synced column if it doesn't exist (for existing databases)
    try:
        cursor.execute('ALTER TABLE activity_events ADD COLUMN synced BOOLEAN NOT NULL DEFAULT 0')
    except sqlite3.OperationalError:
        pass # Column already exists
    
    conn.commit()
    conn.close()

def insert_event(application, window_title, started_at, ended_at, duration_seconds, idle=False):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO activity_events (application, window_title, started_at, ended_at, duration_seconds, idle, synced)
        VALUES (?, ?, ?, ?, ?, ?, 0)
    ''', (application, window_title, started_at.isoformat(), ended_at.isoformat(), duration_seconds, idle))
    conn.commit()
    conn.close()

def get_unsynced_events(limit=50):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM activity_events WHERE synced = 0 LIMIT ?', (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def mark_events_synced(event_ids):
    if not event_ids: return
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    placeholders = ','.join(['?'] * len(event_ids))
    cursor.execute(f'UPDATE activity_events SET synced = 1 WHERE id IN ({placeholders})', event_ids)
    conn.commit()
    conn.close()

def get_events():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM activity_events')
    rows = cursor.fetchall()
    conn.close()
    return rows
