from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    telegram_id: Optional[str] = None

class UserLogin(UserBase):
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int

class UserProfile(UserBase):
    user_id: str
    auth_type: str
    last_login: Optional[datetime] = None
    failed_login_attempts: int = 0
    last_failed_login: Optional[datetime] = None
    account_locked_until: Optional[datetime] = None
    last_password_change: Optional[datetime] = None

    class Config:
        from_attributes = True 