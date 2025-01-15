from fastapi import APIRouter, HTTPException, Depends
from api.schemas.auth import AuthCodeVerification
from services.auth_code_service import AuthCodeService
from services.auth_service import AuthService
from database.models.extended_user import ExtendedUser
from api.dependencies.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/verify-code")
async def verify_auth_code(
    verification: AuthCodeVerification,
    current_user: ExtendedUser = Depends(get_current_user)
):
    """Проверяет код авторизации и связывает аккаунты"""
    is_valid = AuthCodeService.verify_code(
        user_id=verification.telegram_id,
        code=verification.auth_code
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail="Неверный код или срок его действия истек"
        )
    
    # Связываем telegram_id с текущим пользователем
    current_user.telegram_id = verification.telegram_id
    current_user.auth_type = "telegram"
    
    return {"status": "success", "message": "Аккаунты успешно связаны"} 