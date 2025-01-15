from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserProfile(BaseModel):
    email: Optional[EmailStr]
    user_id: str
    auth_type: str
    username: Optional[str]
    language: str
    timezone: Optional[str]
    last_login: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 