from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import auth, profile
import uvicorn

app = FastAPI(
    title="RunTracker API",
    description="API для системы аутентификации и личного кабинета RunTracker",
    version="1.0.0"
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене заменить на список разрешенных доменов
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(auth.router)
app.include_router(profile.router)

@app.get("/")
async def root():
    """Корневой эндпоинт для проверки работоспособности API"""
    return {
        "status": "ok",
        "message": "RunTracker API работает",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 