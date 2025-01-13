import os
import sqlite3
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

# Загружаем .env файл из корня проекта
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)
print(f"Loading .env from: {env_path}")

# Получаем DATABASE_URL из переменных окружения
DATABASE_URL = os.getenv('DATABASE_URL')
print(f"DATABASE_URL: {DATABASE_URL}")

def get_sqlite_connection():
    """Создает подключение к SQLite базе данных"""
    db_path = Path(__file__).parent.parent / 'running_bot.db'
    return sqlite3.connect(db_path)

def get_postgres_connection():
    """Создает подключение к PostgreSQL базе данных"""
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL not found in environment variables")
    if DATABASE_URL.startswith('sqlite'):
        raise ValueError("DATABASE_URL is still set to SQLite")
    return psycopg2.connect(DATABASE_URL)

def convert_user_row(row):
    """Конвертирует типы данных для строки из таблицы users"""
    user_id, username, yearly_goal, yearly_progress, is_active, goal_km, chat_type = row
    return (
        user_id,
        username,
        float(yearly_goal) if yearly_goal else 0.0,
        float(yearly_progress) if yearly_progress else 0.0,
        bool(is_active),
        float(goal_km) if goal_km else 0.0,
        chat_type or 'group'
    )

def migrate_users():
    """Мигрирует данные из таблицы users"""
    sqlite_conn = get_sqlite_connection()
    pg_conn = get_postgres_connection()
    
    try:
        # Получаем данные из SQLite
        sqlite_cur = sqlite_conn.cursor()
        sqlite_cur.execute("SELECT user_id, username, yearly_goal, yearly_progress, is_active, goal_km, chat_type FROM users")
        rows = sqlite_cur.fetchall()
        
        if not rows:
            print("No users to migrate")
            return
        
        # Вставляем данные в PostgreSQL
        pg_cur = pg_conn.cursor()
        for row in rows:
            converted_row = convert_user_row(row)
            pg_cur.execute("""
                INSERT INTO users (user_id, username, yearly_goal, yearly_progress, is_active, goal_km, chat_type)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (user_id) DO UPDATE SET
                    username = EXCLUDED.username,
                    yearly_goal = EXCLUDED.yearly_goal,
                    yearly_progress = EXCLUDED.yearly_progress,
                    is_active = EXCLUDED.is_active,
                    goal_km = EXCLUDED.goal_km,
                    chat_type = EXCLUDED.chat_type
            """, converted_row)
        
        pg_conn.commit()
        print(f"Migrated {len(rows)} users")
        
    except Exception as e:
        print(f"Error during migration: {str(e)}")
        pg_conn.rollback()
    finally:
        sqlite_conn.close()
        pg_conn.close()

def migrate_extended_users():
    """Мигрирует данные из таблицы extended_users"""
    sqlite_conn = get_sqlite_connection()
    pg_conn = get_postgres_connection()
    
    try:
        # Получаем данные из SQLite
        sqlite_cur = sqlite_conn.cursor()
        sqlite_cur.execute("""
            SELECT user_id, email, password_hash, auth_type, auth_code, auth_code_expires,
                   last_login, last_password_change, failed_login_attempts, is_locked,
                   notification_preferences, privacy_settings, timezone, language,
                   created_at, updated_at
            FROM extended_users
        """)
        rows = sqlite_cur.fetchall()
        
        if not rows:
            print("No extended users to migrate")
            return
        
        # Вставляем данные в PostgreSQL
        pg_cur = pg_conn.cursor()
        for row in rows:
            pg_cur.execute("""
                INSERT INTO extended_users (
                    user_id, email, password_hash, auth_type, auth_code, auth_code_expires,
                    last_login, last_password_change, failed_login_attempts, is_locked,
                    notification_preferences, privacy_settings, timezone, language,
                    created_at, updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (user_id) DO UPDATE SET
                    email = EXCLUDED.email,
                    password_hash = EXCLUDED.password_hash,
                    auth_type = EXCLUDED.auth_type,
                    auth_code = EXCLUDED.auth_code,
                    auth_code_expires = EXCLUDED.auth_code_expires,
                    last_login = EXCLUDED.last_login,
                    last_password_change = EXCLUDED.last_password_change,
                    failed_login_attempts = EXCLUDED.failed_login_attempts,
                    is_locked = EXCLUDED.is_locked,
                    notification_preferences = EXCLUDED.notification_preferences,
                    privacy_settings = EXCLUDED.privacy_settings,
                    timezone = EXCLUDED.timezone,
                    language = EXCLUDED.language,
                    created_at = EXCLUDED.created_at,
                    updated_at = EXCLUDED.updated_at
            """, row)
        
        pg_conn.commit()
        print(f"Migrated {len(rows)} extended users")
        
    except Exception as e:
        print(f"Error during migration: {str(e)}")
        pg_conn.rollback()
    finally:
        sqlite_conn.close()
        pg_conn.close()

if __name__ == "__main__":
    print("Starting migration...")
    migrate_users()
    migrate_extended_users()
    print("Migration completed") 