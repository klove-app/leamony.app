import os
import sys
import traceback
from datetime import datetime

# Добавляем текущую директорию в PATH
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# Импорты
from bot_instance import bot
from database.base import Base, engine
from database.logger import logger
import config.config as cfg

# Импортируем обработчики
from handlers.chat_handlers import register_chat_handlers
from handlers.challenge_handlers import register_handlers as register_challenge_handlers
from handlers.team_handlers import register_handlers as register_team_handlers
from handlers.stats_handlers import register_handlers as register_stats_handlers
from handlers.goal_handlers import register_handlers as register_goal_handlers
from handlers.chat_goal_handlers import register_handlers as register_chat_goal_handlers
from handlers.reset_handlers import ResetHandler
from handlers.admin_handlers import AdminHandler
from handlers.donate_handlers import DonateHandler
from handlers import message_handlers, private_handlers

if __name__ == "__main__":
    # Создаем таблицы в базе данных
    Base.metadata.create_all(engine)
    
    # Регистрируем обработчики
    register_chat_handlers(bot)
    register_challenge_handlers(bot)
    register_team_handlers(bot)
    register_stats_handlers(bot)
    register_goal_handlers(bot)
    register_chat_goal_handlers(bot)
    message_handlers.register_handlers(bot)
    private_handlers.register_handlers(bot)
    
    # Создаем и регистрируем обработчики
    reset_handler = ResetHandler(bot)
    reset_handler.register()
    
    admin_handler = AdminHandler(bot)
    admin_handler.register()
    
    donate_handler = DonateHandler(bot)
    donate_handler.register()
    
    logger.info("Bot handlers registered")
    logger.info("Bot is running...")
    
    # Запускаем бота
    bot.infinity_polling()