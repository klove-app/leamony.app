import os
from dotenv import load_dotenv

load_dotenv()

# База данных
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///running_bot.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# JWT
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Telegram
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
ADMIN_IDS = list(map(int, os.getenv("ADMIN_IDS", "").split(","))) if os.getenv("ADMIN_IDS") else []

# Stability AI
STABILITY_API_KEY = os.getenv("STABILITY_API_KEY")
STABILITY_API_HOST = os.getenv("STABILITY_API_HOST", "https://api.stability.ai") 