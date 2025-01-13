from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, profile
import uvicorn
import os

app = FastAPI(
    title="RunTracker API",
    description="API для системы аутентификации и личного кабинета RunTracker",
    version="1.0.0"
)

# Настройка CORS
origins = [
    "http://localhost:3000",     # React development
    "http://localhost:5000",     # Flask development
    "https://runtracker.app",    # Production domain (пример)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Set-Cookie", "Access-Control-Allow-Headers", 
                  "Access-Control-Allow-Origin", "Authorization"],
)

# Подключаем роутеры
app.include_router(auth.router)
app.include_router(profile.router)

@app.get("/health")
async def health_check():
    """Эндпоинт для проверки работоспособности API"""
    return {
        "status": "ok",
        "message": "RunTracker API работает",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True) 