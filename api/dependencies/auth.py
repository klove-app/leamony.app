from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional

from ..middleware.jwt import jwt_bearer
from services.auth_service import AuthService
from database.models.extended_user import ExtendedUser
from .database import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token", auto_error=False)

async def get_current_user(
    token: str = Depends(jwt_bearer),
    db: Session = Depends(get_db)
) -> ExtendedUser:
    """Получение текущего пользователя по JWT токену"""
    user_id = AuthService.verify_token(token)
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user = ExtendedUser.get_by_user_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return user

async def get_optional_user(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[ExtendedUser]:
    """Получение текущего пользователя (если есть)"""
    if not token:
        return None
    try:
        return await get_current_user(token)
    except HTTPException:
        return None 