from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from database.base import Base

class ExtendedUser(Base):
    __tablename__ = 'extended_users'

    id = Column(Integer, primary_key=True)
    user_id = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    auth_type = Column(String, default='email')
    language = Column(String, default='ru')
    timezone = Column(String, default='UTC')
    notification_settings = Column(JSON, default={})
    is_active = Column(Boolean, default=True)
    failed_login_attempts = Column(Integer, default=0)
    last_failed_login = Column(DateTime)
    last_login = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def record_login(self, successful: bool):
        if successful:
            self.failed_login_attempts = 0
            self.last_login = datetime.utcnow()
        else:
            self.failed_login_attempts += 1
            self.last_failed_login = datetime.utcnow()

    def is_account_locked(self) -> bool:
        if not self.last_failed_login or self.failed_login_attempts < 5:
            return False
        
        lockout_duration = datetime.utcnow() - self.last_failed_login
        return lockout_duration.total_seconds() < 1800  # 30 минут 