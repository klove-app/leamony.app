from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from api.routers import auth, profile, auth_code
import os

app = FastAPI(
    title="Running Bot API",
    description="API для веб-интерфейса Running Bot",
    version="1.0.0"
)

# Настройка CORS
origins = [
    "http://localhost:3000",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "https://runconnect.app",
    "https://*.railway.app",
    "https://api-server-production-39f0.up.railway.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Создаем API роутер
api_router = APIRouter(prefix="/api")

# Подключаем роутеры к API роутеру
api_router.include_router(auth.router)
api_router.include_router(profile.router)
api_router.include_router(auth_code.router)

# Подключаем API роутер к приложению
app.include_router(api_router)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "message": "Running Bot API is working",
        "environment": os.getenv("ENVIRONMENT", "development")
    } 