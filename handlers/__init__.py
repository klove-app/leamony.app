"""
Инициализация пакета обработчиков
"""
from config.config import TELEGRAM_BOT_TOKEN as TOKEN

# Экспортируем TOKEN для использования в обработчиках
__all__ = ['TOKEN']
