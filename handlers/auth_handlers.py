from datetime import datetime, timedelta
import logging
from services.auth_code_service import AuthCodeService
from database.logger import logger

class AuthHandler:
    @staticmethod
    def register_handlers(bot):
        """Регистрация обработчиков авторизации"""
        logger.info("Starting auth handlers registration...")

        @bot.message_handler(commands=['link'])
        def cmd_link(message):
            """Обработчик команды /link для получения кода авторизации"""
            try:
                user_id = str(message.from_user.id)
                code = AuthCodeService.create_auth_code(user_id)
                
                response = (
                    "🔗 Код для связывания аккаунтов:\n\n"
                    f"<code>{code}</code>\n\n"
                    "⚠️ Код действителен в течение 15 минут\n"
                    "Используйте его для подключения вашего веб-аккаунта к боту"
                )
                
                bot.reply_to(message, response, parse_mode='HTML')
                logger.info(f"Auth code generated for user {user_id}")
                
            except Exception as e:
                logger.error(f"Error in cmd_link: {e}")
                bot.reply_to(message, "❌ Произошла ошибка при генерации кода авторизации")

        logger.info("Auth handlers registered successfully") 