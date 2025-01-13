import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from config.config import DATABASE_URL

def get_connection():
    """Создает и возвращает соединение с базой данных"""
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    return Session()

# Остальные функции больше не нужны, так как используется SQLAlchemy 