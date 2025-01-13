# Running Bot

Телеграм бот для отслеживания пробежек с веб-интерфейсом.

## Деплой на Railway

1. Создайте новый проект на Railway
2. Добавьте сервис PostgreSQL
3. Подключите GitHub репозиторий
4. Настройте переменные окружения:
   - `DATABASE_URL` (автоматически от PostgreSQL)
   - `SECRET_KEY` (для JWT токенов)
   - `TELEGRAM_BOT_TOKEN` (от @BotFather)
   - `STABILITY_API_KEY` (от Stability AI)

5. Запустите миграции:
```bash
alembic upgrade head
```

6. Для миграции данных из SQLite:
```bash
python scripts/migrate_to_postgres.py
```

## Локальная разработка

1. Создайте виртуальное окружение:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate  # Windows
```

2. Установите зависимости:
```bash
pip install -r requirements.txt
```

3. Создайте файл .env из примера:
```bash
cp .env.example .env
```

4. Запустите миграции:
```bash
alembic upgrade head
```

5. Запустите приложение:
```bash
# В одном терминале
uvicorn api.main:app --reload

# В другом терминале
python bot.py