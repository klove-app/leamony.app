from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import logging

# Настройка логгера
logger = logging.getLogger('running_bot')
logger.setLevel(logging.INFO)

# Путь к базе данных
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'running_bot.db')
logger.info(f"Database path: {DB_PATH}")

# URL для подключения к базе данных
DATABASE_URL = f"sqlite:///{DB_PATH}"
logger.info(f"Database URL: {DATABASE_URL}")

# Создание движка базы данных
engine = create_engine(DATABASE_URL)
logger.info("Database engine created")

# Создание фабрики сессий
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
logger.info("Session factory created")

# Создание базового класса для моделей
Base = declarative_base()
logger.info("Base model class created")

# Глобальная сессия для использования в методах моделей
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

logger.info("Global session created") 