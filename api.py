from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from api.routers import auth, profile

app = FastAPI(
    title="RunConnect API",
    description="API for RunConnect - Running Tracking Application",
    version="1.0.0"
)

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене заменить на конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(profile.router, prefix="/profile", tags=["profile"])

# Подключаем статические файлы
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/health")
def health_check():
    """Проверка работоспособности API"""
    return {"status": "ok", "message": "API is working"} 