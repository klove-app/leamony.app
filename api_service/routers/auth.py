from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from api.schemas.auth import UserCreate, UserLogin, Token, UserProfile
from api.dependencies.auth import get_current_user
from services.auth_service import AuthService
from database.models.extended_user import ExtendedUser
from datetime import datetime

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

@router.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Получение токена доступа"""
    user = await AuthService.authenticate_user(form_data.username, form_data.password)
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
        "token_type": "bearer",
        "expires_in": AuthService.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(current_user: ExtendedUser = Depends(get_current_user)):
    """Получение профиля текущего пользователя"""
    return current_user

@router.post("/logout")
async def logout(current_user: ExtendedUser = Depends(get_current_user)):
    """Выход из системы"""
    # В будущем здесь можно добавить инвалидацию токена
    return {"message": "Успешный выход из системы"} 