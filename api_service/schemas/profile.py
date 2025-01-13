from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class ProfileUpdate(BaseModel):
    """Схема для обновления профиля"""
    email: Optional[EmailStr] = None
    telegram_id: Optional[str] = None

class PasswordChange(BaseModel):
    """Схема для смены пароля"""
    current_password: str
    new_password: str

class NotificationSettings(BaseModel):
    """Схема настроек уведомлений"""
    email_notifications: bool = True
    telegram_notifications: bool = True

class ProfileResponse(BaseModel):
    """Схема ответа с данными профиля"""
    user_id: str
    email: EmailStr
    telegram_id: Optional[str] = None
    auth_type: str
    last_login: Optional[datetime] = None
    notification_settings: Optional[NotificationSettings] = None

    class Config:
        from_attributes = True 