from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from api_service.schemas.profile import ProfileUpdate, PasswordChange, NotificationSettings, ProfileResponse
from api_service.database.models.extended_user import ExtendedUser
from api_service.services.auth_service import AuthService
from api_service.database.base import get_db
from api_service.dependencies.auth import get_current_user

router = APIRouter(tags=["profile"])

@router.get("/me", response_model=ProfileResponse)
async def get_profile(current_user: ExtendedUser = Depends(get_current_user)):
    """Получение профиля текущего пользователя"""
    return current_user

@router.patch("/me", response_model=ProfileResponse)
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: ExtendedUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновление профиля пользователя"""
    # Проверяем, не занят ли email
    if profile_data.email and profile_data.email != current_user.email:
        if ExtendedUser.get_by_email(profile_data.email):
            raise HTTPException(status_code=400, detail="Email уже используется")
    
    # Обновляем поля
    for field, value in profile_data.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    current_user.update()
    return current_user

@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: ExtendedUser = Depends(get_current_user)
):
    """Смена пароля пользователя"""
    if not AuthService.verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Неверный текущий пароль")
    
    if AuthService.change_password(current_user, password_data.new_password):
        return {"message": "Пароль успешно изменен"}
    else:
        raise HTTPException(status_code=500, detail="Ошибка при смене пароля")

@router.put("/notifications", response_model=NotificationSettings)
async def update_notifications(
    settings: NotificationSettings,
    current_user: ExtendedUser = Depends(get_current_user)
):
    """Обновление настроек уведомлений"""
    current_user.notification_settings = settings.dict()
    current_user.update()
    return settings 