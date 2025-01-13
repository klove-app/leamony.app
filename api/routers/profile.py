from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from ..schemas.profile import ProfileUpdate, PasswordChange, NotificationSettings, ProfileResponse
from ..models.user import ExtendedUser
from ..services.auth import AuthService
from ..dependencies.database import get_db
from ..dependencies.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["profile"])

@router.patch("/profile", response_model=ProfileResponse)
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: ExtendedUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновление профиля пользователя"""
    for field, value in profile_data.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    db.commit()
    return current_user

@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: ExtendedUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Смена пароля пользователя"""
    if not AuthService.verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Неверный текущий пароль")
    
    current_user.password_hash = AuthService.get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Пароль успешно изменен"}

@router.put("/notifications", response_model=NotificationSettings)
async def update_notifications(
    settings: NotificationSettings,
    current_user: ExtendedUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновление настроек уведомлений"""
    current_user.notification_settings = settings.dict()
    db.commit()
    return settings 