TOKEN = '6828027394:AAHHrIvwkxmf1GX_Bi9WEoBqndKb-wn8Fg8'
ADMIN_IDS = ['1431390352']

# Настройки базы данных
DATABASE_NAME = 'running_bot.db'  # База данных в корне проекта
DATABASE_URL = f'sqlite:///{DATABASE_NAME}'

# Настройки Stability AI
STABILITY_API_HOST = 'https://api.stability.ai'
STABILITY_API_KEY = 'sk-R4NRtaGn4CoNOgtOlFRwJ1I1W0PjjpMFOI8gcC7lLwY5pLn4'
STABLE_DIFFUSION_ENGINE_ID = 'stable-diffusion-xl-1024-v1-0'

# Настройки аутентификации
AUTH_SECRET_KEY = "your-secret-key-please-change-in-production"  # TODO: Изменить в продакшене
AUTH_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 30 