import sqlite3
import os
from typing import List, Dict, Any
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'chat_history.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # ENABLE WAL MODE
    cursor.execute("PRAGMA journal_mode=WAL;")
    cursor.execute("PRAGMA synchronous=NORMAL;")

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS threads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            thread_id TEXT UNIQUE NOT NULL,
            user_id TEXT NOT NULL,
            title TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            thread_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (thread_id) REFERENCES threads (thread_id) ON DELETE CASCADE
        )
    ''')

    conn.commit()
    conn.close()


def save_thread(user_id: str, thread_id: str, title: str = None):
    """Save or update a thread."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('''
        INSERT OR IGNORE INTO threads (thread_id, user_id, title, updated_at)
        VALUES (?, ?, ?, ?)
    ''', (thread_id, user_id, title or f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}", datetime.now()))

    conn.commit()
    conn.close()

def save_message(thread_id: str, role: str, content: str):
    """Save a message to the database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO messages (thread_id, role, content)
        VALUES (?, ?, ?)
    ''', (thread_id, role, content))

    conn.commit()
    conn.close()

def get_user_threads(user_id: str) -> List[Dict[str, Any]]:
    """Get all threads for a user."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('''
        SELECT thread_id, title, created_at, updated_at
        FROM threads
        WHERE user_id = ?
        ORDER BY updated_at DESC
    ''', (user_id,))

    threads = []
    for row in cursor.fetchall():
        threads.append({
            'thread_id': row[0],
            'title': row[1],
            'created_at': row[2],
            'updated_at': row[3]
        })

    conn.close()
    return threads

def get_thread_messages(thread_id: str) -> List[Dict[str, Any]]:
    """Get all messages for a thread."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('''
        SELECT role, content, timestamp
        FROM messages
        WHERE thread_id = ?
        ORDER BY timestamp ASC
    ''', (thread_id,))

    messages = []
    for row in cursor.fetchall():
        messages.append({
            'role': row[0],
            'content': row[1],
            'timestamp': row[2]
        })

    conn.close()
    return messages

def delete_thread(thread_id: str):
    """Delete a thread and its messages."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('DELETE FROM threads WHERE thread_id = ?', (thread_id,))
    cursor.execute('DELETE FROM messages WHERE thread_id = ?', (thread_id,))

    conn.commit()
    conn.close()

# Initialize DB on import
init_db()
