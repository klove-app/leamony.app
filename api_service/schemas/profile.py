from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class ProfileUpdate(BaseModel):
    language: Optional[str] = Field(None, pattern="^[a-z]{2}$")
    timezone: Optional[str]
    notification_settings: Optional[dict] = None

class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=8)
    new_password: str = Field(..., min_length=8)

class NotificationSettings(BaseModel):
    email_notifications: bool = True
    telegram_notifications: bool = True
    notification_time: str = Field(..., pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    notification_timezone: str

class ProfileResponse(BaseModel):
    user_id: str
    email: EmailStr
    language: str
    timezone: str
    notification_settings: Optional[dict]
    updated_at: datetime

    class Config:
        from_attributes = True 