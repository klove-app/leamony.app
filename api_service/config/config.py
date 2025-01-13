import os

# JWT Authentication settings
AUTH_SECRET_KEY = os.getenv("AUTH_SECRET_KEY", "your-secret-key")
AUTH_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Security settings
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 15 