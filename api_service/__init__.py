"""
Инициализация API пакета
"""

from api_service.database import models
from api_service.services import auth_service
from api_service.routers import auth, profile
from api_service.schemas import auth as auth_schemas
from api_service.dependencies import auth as auth_dependencies 