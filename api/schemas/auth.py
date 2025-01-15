from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    """Базовая схема пользователя"""
    email: Optional[EmailStr] = None
    telegram_id: Optional[str] = None

class UserCreate(UserBase):
    """Схема для создания пользователя"""
    password: str = Field(..., min_length=8)
    email: EmailStr

class UserLogin(BaseModel):
    """Схема для входа пользователя"""
    email: EmailStr
    password: str

class Token(BaseModel):
    """Схема токена доступа"""
    access_token: str
    token_type: str = "bearer"
    expires_in: Optional[int] = None

class AuthCodeVerification(BaseModel):
    """Схема для проверки кода авторизации"""
    auth_code: str = Field(..., min_length=6, max_length=6)
    telegram_id: str

class UserProfile(UserBase):
    """Схема профиля пользователя"""
    user_id: str
    auth_type: str
    last_login: Optional[datetime] = None
    language: str = "ru"
    timezone: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    """Схема для обновления профиля"""
    email: Optional[EmailStr] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    notification_preferences: Optional[dict] = None
    privacy_settings: Optional[dict] = None 