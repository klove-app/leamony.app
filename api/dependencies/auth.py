from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from services.auth_service import AuthService
from database.models.extended_user import ExtendedUser
from typing import Optional
import jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> ExtendedUser:
    """Получение текущего пользователя из токена"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Неверные учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = AuthService.decode_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Токен истек",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTError:
        raise credentials_exception

    user = ExtendedUser.get_by_user_id(user_id)
    if user is None:
        raise credentials_exception
    
    if user.is_account_locked():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Аккаунт заблокирован"
        )
    
    return user

async def get_optional_user(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[ExtendedUser]:
    """Получение текущего пользователя (если есть)"""
    if not token:
        return None
    try:
        return await get_current_user(token)
    except HTTPException:
        return None 