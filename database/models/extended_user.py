from sqlalchemy import (
    Column, String, Float, Boolean, REAL, DateTime, 
    ForeignKey, Table, Integer, JSON
)
from sqlalchemy.orm import Session, relationship
from datetime import datetime, timedelta
from database.base import Base, get_db
from database.models.user import User
import config.config as cfg

class ExtendedUser(Base):
    __tablename__ = "extended_users"

    # Связь с основной моделью пользователя
    user_id = Column(String, ForeignKey('users.user_id'), primary_key=True, index=True)
    base_user = relationship("User", backref="extended_profile")

    # Дополнительные поля для аутентификации
    email = Column(String, unique=True, nullable=True, index=True)
    password_hash = Column(String, nullable=True)
    auth_type = Column(String, default='telegram')  # telegram/email
    
    # Поля для кода авторизации
    auth_code = Column(String, nullable=True)
    auth_code_expires = Column(DateTime, nullable=True)
    
    # Поля для безопасности
    last_login = Column(DateTime, nullable=True)
    last_password_change = Column(DateTime, nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    is_locked = Column(Boolean, default=False)
    
    # Дополнительные настройки
    notification_preferences = Column(JSON, default={})
    privacy_settings = Column(JSON, default={})
    timezone = Column(String, nullable=True)
    language = Column(String, default='ru')

    # Метаданные
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @classmethod
    def get_by_user_id(cls, user_id: str) -> 'ExtendedUser':
        """Получить расширенный профиль по ID пользователя"""
        db = next(get_db())
        return db.query(cls).filter(cls.user_id == user_id).first()

    @classmethod
    def get_by_email(cls, email: str) -> 'ExtendedUser':
        """Получить пользователя по email"""
        db = next(get_db())
        return db.query(cls).filter(cls.email == email).first()

    @classmethod
    def create(cls, user_id: str, **kwargs) -> 'ExtendedUser':
        """Создать новый расширенный профиль"""
        db = next(get_db())
        extended_user = cls(user_id=user_id, **kwargs)
        db.add(extended_user)
        db.commit()
        db.refresh(extended_user)
        return extended_user

    def update(self, **kwargs):
        """Обновить атрибуты расширенного профиля"""
        db = next(get_db())
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.updated_at = datetime.utcnow()
        db.add(self)
        db.commit()
        db.refresh(self)

    def record_login(self, successful: bool = True):
        """Записать попытку входа"""
        if successful:
            self.last_login = datetime.utcnow()
            self.failed_login_attempts = 0
            self.is_locked = False
        else:
            self.failed_login_attempts += 1
            if self.failed_login_attempts >= cfg.MAX_LOGIN_ATTEMPTS:
                self.is_locked = True
        self.update()

    def is_account_locked(self) -> bool:
        """Проверить, заблокирован ли аккаунт"""
        if not self.is_locked:
            return False
            
        # Если аккаунт заблокирован, проверяем не истек ли срок блокировки
        if self.last_login:
            lockout_time = self.last_login + timedelta(minutes=cfg.LOCKOUT_MINUTES)
            if datetime.utcnow() > lockout_time:
                # Срок блокировки истек, разблокируем аккаунт
                self.is_locked = False
                self.failed_login_attempts = 0
                self.update()
                return False
        return True

    def reset_login_attempts(self):
        """Сбросить счетчик неудачных попыток входа"""
        self.failed_login_attempts = 0
        self.is_locked = False
        self.update() 