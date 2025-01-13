import random
import string
from datetime import datetime, timedelta
from database.models.extended_user import ExtendedUser
from database.base import get_db

class AuthCodeService:
    CODE_LENGTH = 6
    CODE_EXPIRY_MINUTES = 15

    @staticmethod
    def generate_code() -> str:
        """Генерирует случайный 6-значный код"""
        return ''.join(random.choices(string.digits, k=AuthCodeService.CODE_LENGTH))

    @classmethod
    def create_auth_code(cls, user_id: str) -> str:
        """Создает новый код авторизации для пользователя"""
        db = next(get_db())
        user = db.query(ExtendedUser).filter(ExtendedUser.user_id == user_id).first()
        
        if not user:
            user = ExtendedUser(user_id=user_id)
            db.add(user)
        
        code = cls.generate_code()
        user.auth_code = code
        user.auth_code_expires = datetime.utcnow() + timedelta(minutes=cls.CODE_EXPIRY_MINUTES)
        
        db.commit()
        return code

    @classmethod
    def verify_code(cls, user_id: str, code: str) -> bool:
        """Проверяет код авторизации"""
        db = next(get_db())
        user = db.query(ExtendedUser).filter(ExtendedUser.user_id == user_id).first()
        
        if not user or not user.auth_code or not user.auth_code_expires:
            return False
            
        if datetime.utcnow() > user.auth_code_expires:
            return False
            
        if user.auth_code != code:
            return False
            
        # Очищаем код после успешной проверки
        user.auth_code = None
        user.auth_code_expires = None
        db.commit()
        
        return True 