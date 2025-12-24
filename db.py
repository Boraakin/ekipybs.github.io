import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).with_name("gallery.db")

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS admin_user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_plain TEXT NOT NULL
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS artwork (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        year INTEGER NOT NULL,
        medium TEXT NOT NULL,
        dimensions TEXT NOT NULL,
        category TEXT NOT NULL,
        color_tag TEXT NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT NOT NULL,
        featured INTEGER NOT NULL DEFAULT 0
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS exhibition (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        date_range TEXT NOT NULL,
        statement TEXT NOT NULL,
        cover_image_url TEXT NOT NULL
    )
    """)

    conn.commit()
    conn.close()
