import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database.base import Base
from models.user import ExtendedUser
from models.running_log import RunningLog

# SQLite подключение (старая база)
sqlite_engine = create_engine('sqlite:///running_bot.db')
SQLiteSession = sessionmaker(bind=sqlite_engine)
sqlite_session = SQLiteSession()

# PostgreSQL подключение (новая база)
postgres_url = os.getenv('DATABASE_URL')
if not postgres_url:
    raise ValueError("DATABASE_URL не установлен")

postgres_engine = create_engine(postgres_url)
PostgresSession = sessionmaker(bind=postgres_engine)
postgres_session = PostgresSession()

def migrate_users():
    print("Миграция пользователей...")
    users = sqlite_session.query(ExtendedUser).all()
    for user in users:
        # Создаем копию пользователя для PostgreSQL
        new_user = ExtendedUser(
            id=user.id,
            email=user.email,
            password_hash=user.hashed_password,
            user_id=str(user.telegram_id),
            is_active=user.is_active
        )
        postgres_session.add(new_user)
    postgres_session.commit()
    print(f"Перенесено {len(users)} пользователей")

def migrate_running_logs():
    print("Миграция записей о пробежках...")
    logs = sqlite_session.query(RunningLog).all()
    for log in logs:
        # Создаем копию записи для PostgreSQL
        new_log = RunningLog(
            id=log.id,
            user_id=log.user_id,
            km=log.km,
            date_added=log.date_added,
            notes=log.notes,
            chat_id=log.chat_id
        )
        postgres_session.add(new_log)
    postgres_session.commit()
    print(f"Перенесено {len(logs)} записей о пробежках")

if __name__ == "__main__":
    try:
        # Создаем таблицы в PostgreSQL если их нет
        Base.metadata.create_all(postgres_engine)
        
        # Мигрируем данные
        migrate_users()
        migrate_running_logs()
        
        print("Миграция успешно завершена!")
    except Exception as e:
        print(f"Ошибка при миграции: {e}")
    finally:
        sqlite_session.close()
        postgres_session.close() 