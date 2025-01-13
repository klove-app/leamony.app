from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from api.schemas.auth import UserCreate, UserLogin, Token, UserProfile, AuthCodeVerification
from api.dependencies.auth import get_current_user
from api.dependencies.database import get_db
from services.auth_service import AuthService
from services.auth_code_service import AuthCodeService
from database.models.extended_user import ExtendedUser
from datetime import datetime
from sqlalchemy.orm import Session
from typing import Optional

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
    responses={404: {"description": "Not found"}},
)

@router.post("/register", response_model=UserProfile)
async def register(user_data: UserCreate):
    """Регистрация нового пользователя"""
    try:
        user = AuthService.register_user(
            email=user_data.email,
            password=user_data.password,
            telegram_id=user_data.telegram_id
        )
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Авторизация пользователя по email и паролю"""
    user = AuthService.authenticate_user(user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )
    
    access_token = AuthService.create_access_token({"sub": user.user_id})
    return Token(access_token=access_token, token_type="bearer")

@router.post("/verify-code", response_model=Token)
async def verify_auth_code(
    verification_data: AuthCodeVerification,
    db: Session = Depends(get_db)
):
    """Проверка кода авторизации и связывание аккаунтов"""
    user = AuthCodeService.verify_code(
        verification_data.telegram_id,
        verification_data.auth_code
    )
    
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authorization code"
        )
    
    access_token = AuthService.create_access_token({"sub": user.user_id})
    return Token(access_token=access_token, token_type="bearer")

@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(current_user: ExtendedUser = Depends(get_current_user)):
    """Получение профиля текущего пользователя"""
    return current_user

@router.post("/logout")
async def logout(current_user: ExtendedUser = Depends(get_current_user)):
    """Выход из системы"""
    # В будущем здесь можно добавить инвалидацию токена
    return {"message": "Успешный выход из системы"} 