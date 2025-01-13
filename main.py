import os
import sys
import traceback
from datetime import datetime
import time
import logging

# Добавляем текущую директорию в PATH
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# Импорты
from bot_instance import bot
from database.base import Base, engine
from database.logger import logger
import config.config as cfg
from database.models.user import User
from database.models.running_log import RunningLog
from database.models.challenge import Challenge
from database.models.extended_user import ExtendedUser
from handlers.admin_handlers import AdminHandler
from handlers.chat_handlers import ChatHandler
from handlers.challenge_handlers import ChallengeHandler
from handlers.stats_handlers import StatsHandler
from handlers.achievement_handlers import AchievementHandler
from handlers.auth_handlers import AuthHandler
from handlers.message_handlers import register_handlers as register_message_handlers
from handlers.private_handlers import register_handlers as register_private_handlers

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

def main():
    """Основная функция запуска бота"""
    while True:
        try:
            logger.info("Запуск бота...")
            
            # Регистрация хендлеров
            register_message_handlers(bot)
            register_private_handlers(bot)
            AdminHandler.register_handlers(bot)
            ChatHandler.register_handlers(bot)
            ChallengeHandler.register_handlers(bot)
            StatsHandler.register_handlers(bot)
            AchievementHandler.register_handlers(bot)
            AuthHandler.register_handlers(bot)
            
            # Запуск бота
            bot.infinity_polling()
            
        except Exception as e:
            if "Conflict: terminated by other getUpdates request" in str(e):
                logger.warning("Обнаружен конфликт с другим экземпляром бота. Ожидание 10 секунд перед повторной попыткой...")
                time.sleep(10)
                continue
            
            logger.error(f"Произошла ошибка: {e}")
            time.sleep(5)

if __name__ == '__main__':
    main()