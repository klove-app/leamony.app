from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Optional
from datetime import datetime

from database.models.user import User
from services.auth_service import AuthService
from schemas.auth import UserCreate, Token, UserProfile
from database.base import get_db

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Неверные учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    user_id = AuthService.verify_token(token)
    if not user_id:
        raise credentials_exception
        
    user = User.get_by_id(user_id)
    if not user:
        raise credentials_exception
        
    return user

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

@router.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Получение токена доступа"""
    user = AuthService.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = AuthService.create_access_token(
        data={"sub": user.user_id}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Получение профиля текущего пользователя"""
    return current_user 