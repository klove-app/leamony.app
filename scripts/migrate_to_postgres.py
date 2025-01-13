import sqlite3
import psycopg2
from psycopg2.extras import execute_values
import os
from dotenv import load_dotenv

load_dotenv()

def get_sqlite_connection():
    return sqlite3.connect('running_bot.db')

def get_postgres_connection():
    return psycopg2.connect(os.getenv('DATABASE_URL'))

def migrate_users():
    sqlite_conn = get_sqlite_connection()
    pg_conn = get_postgres_connection()
    
    try:
        # Получаем данные из SQLite
        sqlite_cur = sqlite_conn.cursor()
        sqlite_cur.execute('SELECT * FROM users')
        users = sqlite_cur.fetchall()
        
        # Вставляем в PostgreSQL
        pg_cur = pg_conn.cursor()
        execute_values(
            pg_cur,
            'INSERT INTO users (user_id, username, first_name, last_name, created_at) VALUES %s',
            users
        )
        pg_conn.commit()
        
        print(f"Migrated {len(users)} users")
        
    finally:
        sqlite_conn.close()
        pg_conn.close()

def migrate_extended_users():
    sqlite_conn = get_sqlite_connection()
    pg_conn = get_postgres_connection()
    
    try:
        sqlite_cur = sqlite_conn.cursor()
        sqlite_cur.execute('SELECT * FROM extended_users')
        users = sqlite_cur.fetchall()
        
        pg_cur = pg_conn.cursor()
        execute_values(
            pg_cur,
            '''INSERT INTO extended_users 
               (user_id, email, password_hash, auth_type, auth_code, auth_code_expires,
                last_login, notification_preferences, privacy_settings, timezone, language)
               VALUES %s''',
            users
        )
        pg_conn.commit()
        
        print(f"Migrated {len(users)} extended users")
        
    finally:
        sqlite_conn.close()
        pg_conn.close()

def migrate_running_log():
    sqlite_conn = get_sqlite_connection()
    pg_conn = get_postgres_connection()
    
    try:
        sqlite_cur = sqlite_conn.cursor()
        sqlite_cur.execute('SELECT * FROM running_log')
        logs = sqlite_cur.fetchall()
        
        pg_cur = pg_conn.cursor()
        execute_values(
            pg_cur,
            '''INSERT INTO running_log 
               (id, user_id, distance, description, created_at, chat_id, chat_type)
               VALUES %s''',
            logs
        )
        pg_conn.commit()
        
        print(f"Migrated {len(logs)} running logs")
        
    finally:
        sqlite_conn.close()
        pg_conn.close()

if __name__ == '__main__':
    print("Starting migration...")
    migrate_users()
    migrate_extended_users()
    migrate_running_log()
    print("Migration completed!") 