from sqlalchemy import (
    Column, String, Float, Boolean, REAL, DateTime, 
    ForeignKey, Table, Integer, JSON
)
from sqlalchemy.orm import Session, relationship
from datetime import datetime, timedelta
from api_service.database.base import Base, get_db
from api_service.database.models.user import User
from api_service.config.config import AUTH_SECRET_KEY

class ExtendedUser(Base):
    __tablename__ = "extended_users"
    __table_args__ = {'extend_existing': True}

    # Связь с основной моделью пользователя
    user_id = Column(String, ForeignKey('users.user_id'), primary_key=True, index=True)
    # Основные поля
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    auth_type = Column(String)  # 'email', 'google', 'apple'
    telegram_id = Column(String, unique=True, nullable=True)
    
    # Поля для аутентификации
    last_login = Column(DateTime, default=datetime.utcnow)
    failed_login_attempts = Column(Integer, default=0)
    last_failed_login = Column(DateTime, nullable=True)
    account_locked_until = Column(DateTime, nullable=True)
    last_password_change = Column(DateTime, default=datetime.utcnow)
    
    # Настройки уведомлений
    notification_settings = Column(JSON, default=lambda: {
        "email_notifications": True,
        "telegram_notifications": True
    })

    # Методы из оригинальной модели
    def is_account_locked(self) -> bool:
        if self.account_locked_until and self.account_locked_until > datetime.utcnow():
            return True
        return False

    def record_login(self, successful: bool):
        if successful:
            self.failed_login_attempts = 0
            self.last_login = datetime.utcnow()
            self.account_locked_until = None
        else:
            self.failed_login_attempts += 1
            self.last_failed_login = datetime.utcnow()
            if self.failed_login_attempts >= 5:  # MAX_LOGIN_ATTEMPTS
                self.account_locked_until = datetime.utcnow() + timedelta(minutes=15)  # LOCKOUT_MINUTES

    @classmethod
    def get_by_email(cls, email: str) -> "ExtendedUser":
        db = next(get_db())
        return db.query(cls).filter(cls.email == email).first()

    @classmethod
    def get_by_user_id(cls, user_id: str) -> "ExtendedUser":
        db = next(get_db())
        return db.query(cls).filter(cls.user_id == user_id).first()

    @classmethod
    def create(cls, user_id: str, email: str, password_hash: str, auth_type: str = 'email', telegram_id: str = None) -> "ExtendedUser":
        db = next(get_db())
        user = cls(
            user_id=user_id,
            email=email,
            password_hash=password_hash,
            auth_type=auth_type,
            telegram_id=telegram_id
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def update(self):
        db = next(get_db())
        db.add(self)
        db.commit()
        db.refresh(self) 