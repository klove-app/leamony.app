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

class Token(BaseModel):
    """Схема токена доступа"""
    access_token: str
    token_type: str = "bearer"

class UserProfile(BaseModel):
    """Схема профиля пользователя"""
    user_id: str
    username: str
    email: Optional[EmailStr] = None
    auth_type: str
    yearly_goal: Optional[float] = None
    yearly_progress: Optional[float] = None
    goal_km: Optional[float] = 0
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 