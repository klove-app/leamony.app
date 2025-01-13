from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from api_service.database.models.extended_user import ExtendedUser
from api_service.config.config import (
    AUTH_SECRET_KEY,
    AUTH_ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    MAX_LOGIN_ATTEMPTS,
    LOCKOUT_MINUTES
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    SECRET_KEY = AUTH_SECRET_KEY
    ALGORITHM = AUTH_ALGORITHM
    ACCESS_TOKEN_EXPIRE_MINUTES = ACCESS_TOKEN_EXPIRE_MINUTES
    MAX_LOGIN_ATTEMPTS = MAX_LOGIN_ATTEMPTS
    LOCKOUT_MINUTES = LOCKOUT_MINUTES

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Проверка пароля"""
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password: str) -> str:
        """Хеширование пароля"""
        return pwd_context.hash(password)

    @classmethod
    def create_access_token(cls, data: dict) -> str:
        """Создание JWT токена"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=cls.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, cls.SECRET_KEY, algorithm=cls.ALGORITHM)

    @classmethod
    def decode_token(cls, token: str) -> dict:
        """Декодирование JWT токена"""
        try:
            payload = jwt.decode(token, cls.SECRET_KEY, algorithms=[cls.ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            raise ValueError("Token has expired")
        except jwt.JWTError:
            raise ValueError("Invalid token")

    @classmethod
    async def authenticate_user(cls, email: str, password: str) -> ExtendedUser:
        """Аутентификация пользователя по email и паролю"""
        user = ExtendedUser.get_by_email(email)
        if not user:
            return None

        # Проверяем, не заблокирован ли аккаунт
        if user.is_account_locked():
            raise ValueError("Account is locked due to too many failed attempts")

        # Проверяем пароль
        if not cls.verify_password(password, user.password_hash):
            user.record_login(successful=False)
            return None

        user.record_login(successful=True)
        return user

    @classmethod
    def register_user(cls, email: str, password: str, telegram_id: str = None) -> ExtendedUser:
        """Регистрация нового пользователя"""
        # Проверяем, существует ли пользователь
        if ExtendedUser.get_by_email(email):
            raise ValueError("User with this email already exists")

        # Создаем расширенный профиль
        user_id = telegram_id if telegram_id else f"email_{email}"
        extended_user = ExtendedUser.create(
            user_id=user_id,
            email=email,
            password_hash=cls.get_password_hash(password),
            auth_type='email'
        )

        return extended_user

    @staticmethod
    def change_password(user: ExtendedUser, new_password: str) -> bool:
        """Изменение пароля пользователя"""
        try:
            user.password_hash = pwd_context.hash(new_password)
            user.last_password_change = datetime.utcnow()
            user.update()
            return True
        except Exception:
            return False 