import logging
from datetime import datetime
from telebot import types
from database.models.user import User
from database.models.running_log import RunningLog
from database.base import SessionLocal
import traceback
from handlers.base_handler import BaseHandler
import calendar
from telebot.apihelper import ApiTelegramException

logger = logging.getLogger(__name__)

class StatsHandler(BaseHandler):
    @staticmethod
    def register_handlers(bot):
        """Регистрирует обработчики статистики"""
        logger.info("Registering stats handlers")
        
        # Регистрируем обработчики команд напрямую
        bot.register_message_handler(
            StatsHandler.handle_stats,
            commands=['stats', 'mystats']
        )
        
        bot.register_message_handler(
            StatsHandler.handle_top,
            commands=['top']
        )
        
        bot.register_message_handler(
            StatsHandler.handle_profile,
            commands=['me', 'profile']
        )
        
        # Регистрируем обработчики callback-ов от кнопок
        bot.register_callback_query_handler(
            StatsHandler.handle_set_goal_callback,
            func=lambda call: call.data.startswith('set_goal_') or 
                            call.data.startswith('adjust_goal_') or 
                            call.data.startswith('confirm_goal_') or
                            call.data == 'set_goal_precise'
        )
        
        bot.register_callback_query_handler(
            StatsHandler.handle_detailed_stats_callback,
            func=lambda call: call.data == 'show_detailed_stats'
        )
        
        bot.register_callback_query_handler(
            StatsHandler.handle_edit_runs_callback,
            func=lambda call: call.data == 'edit_runs'
        )
        
        bot.register_callback_query_handler(
            StatsHandler.handle_back_to_profile_callback,
            func=lambda call: call.data == 'back_to_profile'
        )
        
        bot.register_callback_query_handler(
            StatsHandler.handle_edit_run_callback,
            func=lambda call: call.data.startswith('edit_run_')
        )
        
        bot.register_callback_query_handler(
            StatsHandler.handle_delete_run_callback,
            func=lambda call: call.data.startswith('delete_run_')
        )
        
        bot.register_callback_query_handler(
            StatsHandler.handle_confirm_delete_callback,
            func=lambda call: call.data.startswith('confirm_delete_')
        )
        
        bot.register_callback_query_handler(
            StatsHandler.handle_adjust_run_callback,
            func=lambda call: call.data.startswith('adjust_run_')
        )
        
        bot.register_callback_query_handler(
            StatsHandler.handle_new_run_callback,
            func=lambda call: call.data == 'new_run' or call.data.startswith('quick_run_')
        )
        
        logger.info("Stats handlers registered successfully")

    @staticmethod
    def handle_stats(message: types.Message):
        """Показывает статистику пользователя"""
        logger.info(f"Stats command from user {message.from_user.id}")
        try:
            user_id = str(message.from_user.id)
            logger.info(f"Getting user {user_id} from database")
            user = User.get_by_id(user_id)
            if not user:
                logger.info(f"User {user_id} not found")
                bot.reply_to(message, "❌ Вы еще не зарегистрированы. Отправьте боту свою первую пробежку!")
                return

            current_year = datetime.now().year
            logger.info(f"Getting stats for user {user_id} for year {current_year}")
            stats = RunningLog.get_user_stats(user_id, current_year)
            logger.info(f"Got stats: {stats}")
            best_stats = RunningLog.get_best_stats(user_id)
            logger.info(f"Got best stats: {best_stats}")

            response = f"📊 Статистика {user.username}\n\n"
            response += f"За {current_year} год:\n"
            response += f"🏃‍♂️ Пробежек: {stats['runs_count']}\n"
            response += f"📏 Всего: {stats['total_km']:.2f} км\n"
            response += f"📈 Средняя дистанция: {stats['avg_km']:.2f} км\n"
            
            if user.goal_km > 0:
                progress = (stats['total_km'] / user.goal_km * 100)
                response += f"\n🎯 Цель на год: {user.goal_km:.2f} км\n"
                response += f"✨ Прогресс: {progress:.2f}%\n"
            
            response += f"\n🏆 Лучшие показатели:\n"
            response += f"💪 Лучшая пробежка: {best_stats['best_run']:.2f} км\n"
            response += f"🌟 Общая дистанция: {best_stats['total_km']:.2f} км"

            logger.info(f"Sending response: {response}")
            bot.reply_to(message, response)
            logger.info(f"Sent stats to user {user_id}")
        except Exception as e:
            logger.error(f"Error in handle_stats: {e}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            bot.reply_to(message, "❌ Произошла ошибка при получении статистики")

    @staticmethod
    def handle_top(message: types.Message):
        """Показывает топ бегунов и статистику чата"""
        logger.info(f"Top command from user {message.from_user.id}")
        try:
            current_year = datetime.now().year
            current_month = datetime.now().month
            
            # Получаем топ бегунов
            top_runners = RunningLog.get_top_runners(limit=10, year=current_year)
            logger.info(f"Got top runners: {top_runners}")
            
            if not top_runners:
                bot.reply_to(message, "📊 Пока нет данных о пробежках")
                return
            
            response = f"📊 Статистика за {current_year} год\n\n"
            
            # Если сообщение из группового чата, добавляем статистику чата
            if message.chat.type in ['group', 'supergroup']:
                chat_id = str(message.chat.id)
                logger.info(f"Getting stats for chat {chat_id}")
                
                year_stats = RunningLog.get_chat_stats(chat_id, year=current_year)
                logger.info(f"Got year stats: {year_stats}")
                
                month_stats = RunningLog.get_chat_stats(chat_id, year=current_year, month=current_month)
                logger.info(f"Got month stats: {month_stats}")
                
                response += f"Общая статистика чата:\n"
                response += f"👥 Участников: {year_stats['users_count']}\n"
                response += f"🏃‍♂️ Пробежек: {year_stats['runs_count']}\n"
                response += f"📏 Общая дистанция: {year_stats['total_km']:.2f} км\n"
                response += f"💪 Лучшая пробежка: {year_stats['best_run']:.2f} км\n\n"
                
                month_name = calendar.month_name[current_month]
                response += f"За {month_name}:\n"
                response += f"📏 Общая дистанция: {month_stats['total_km']:.2f} км\n"
                response += f"🏃‍♂️ Пробежек: {month_stats['runs_count']}\n\n"
            
            # Добавляем топ бегунов
            response += f"🏆 Топ бегунов:\n\n"
            
            for i, runner in enumerate(top_runners, 1):
                user = User.get_by_id(runner['user_id'])
                username = user.username if user else "Unknown"
                
                response += f"{i}. {username}\n"
                response += f"├ Дистанция: {runner['total_km']:.2f} км\n"
                response += f"├ Пробежек: {runner['runs_count']}\n"
                response += f"├ Средняя: {runner['avg_km']:.2f} км\n"
                response += f"└ Лучшая: {runner['best_run']:.2f} км\n\n"
            
            logger.info(f"Sending response: {response}")
            bot.reply_to(message, response)
            
        except Exception as e:
            logger.error(f"Error in handle_top: {e}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            bot.reply_to(message, "❌ Произошла ошибка при получении топа бегунов")

    @staticmethod
    def handle_profile(message: types.Message, user_id=None, db=None):
        """Показывает личный кабинет пользователя"""
        logger.info(f"Profile command from user {message.from_user.id}")
        try:
            # Если user_id не передан, берем из сообщения
            if user_id is None:
                user_id = str(message.from_user.id)
            
            logger.info(f"Getting profile for user {user_id}")
            
            # Используем переданную сессию или создаем новую
            if db is None:
                logger.debug("Creating new database session")
                db = SessionLocal()
            else:
                logger.debug("Using existing database session")
            
            try:
                # Получаем или создаем пользователя
                user = db.query(User).filter(User.user_id == user_id).first()
                logger.debug(f"Found user in database: {user is not None}")
                
                if not user:
                    username = message.from_user.username or message.from_user.first_name
                    chat_type = message.chat.type if message.chat else 'private'
                    logger.info(f"Creating new user: {username}, chat_type: {chat_type}")
                    user = User(user_id=user_id, username=username, chat_type=chat_type)
                    db.add(user)
                    db.commit()
                
                current_year = datetime.now().year
                current_month = datetime.now().month
                
                # Получаем статистику
                logger.debug(f"Getting year stats for user {user_id}")
                year_stats = RunningLog.get_user_stats(user_id, current_year, db=db)
                logger.debug(f"Year stats: {year_stats}")
                
                logger.debug(f"Getting month stats for user {user_id}")
                month_stats = RunningLog.get_user_stats(user_id, current_year, current_month, db=db)
                logger.debug(f"Month stats: {month_stats}")
                
                logger.debug(f"Getting best stats for user {user_id}")
                best_stats = RunningLog.get_best_stats(user_id, db=db)
                logger.debug(f"Best stats: {best_stats}")
                
                # Формируем профиль с HTML-форматированием
                response = f"<b>👤 Профиль {user.username}</b>\n\n"
                
                # Прогресс к цели
                if user.goal_km > 0:
                    progress = (year_stats['total_km'] / user.goal_km * 100)
                    progress_bar = StatsHandler._generate_progress_bar(progress)
                    response += f"🎯 Цель на {current_year}: {user.goal_km:.2f} км\n"
                    response += f"{progress_bar} {progress:.2f}%\n"
                    response += f"📊 Пройдено: {year_stats['total_km']:.2f} км\n"
                    response += f"⭐️ Осталось: {user.goal_km - year_stats['total_km']:.2f} км\n\n"
                else:
                    response += "🎯 Цель на год не установлена\n\n"
                
                # Статистика за текущий месяц
                month_name = calendar.month_name[current_month]
                response += f"📅 <b>{month_name}</b>\n"
                response += f"├ Пробежек: {month_stats['runs_count']}\n"
                response += f"├ Дистанция: {month_stats['total_km']:.2f} км\n"
                if month_stats['runs_count'] > 0:
                    response += f"└ Средняя: {month_stats['avg_km']:.2f} км\n\n"
                else:
                    response += f"└ Средняя: 0.0 км\n\n"
                
                # Статистика по типам чатов
                if year_stats.get('chat_stats'):
                    response += f"📊 <b>Статистика по чатам</b>\n"
                    for chat_type, stats in year_stats['chat_stats'].items():
                        chat_type_display = chat_type.capitalize() if chat_type else "Неизвестно"
                        response += f"<b>{chat_type_display}</b>\n"
                        response += f"├ Пробежек: {stats['runs_count']}\n"
                        response += f"├ Дистанция: {stats['total_km']:.2f} км\n"
                        response += f"└ Средняя: {stats['avg_km']:.2f} км\n\n"
                
                # Лучшие результаты
                response += f"🏆 <b>Лучшие результаты</b>\n"
                response += f"├ Пробежка: {best_stats['best_run']:.2f} км\n"
                response += f"└ Всего: {best_stats['total_runs']} пробежек\n"
                
                logger.debug(f"Generated response: {response}")
                
                # Создаем клавиатуру
                markup = types.InlineKeyboardMarkup()
                
                # Основные действия
                markup.row(
                    types.InlineKeyboardButton("📝 Подробная статистика", callback_data="show_detailed_stats"),
                    types.InlineKeyboardButton("✏️ Редактировать пробежки", callback_data="edit_runs")
                )
                
                # Кнопка установки цели
                if user.goal_km == 0:
                    markup.row(types.InlineKeyboardButton("🎯 Установить цель", callback_data="set_goal_0"))
                else:
                    markup.row(types.InlineKeyboardButton("🎯 Изменить цель", callback_data="set_goal_0"))
                
                # Отправляем сообщение с клавиатурой
                logger.info("Sending profile message")
                bot.reply_to(message, response, reply_markup=markup, parse_mode='HTML')
                logger.info("Profile message sent successfully")
                
            finally:
                if db is not None:
                    logger.debug("Closing database session")
                    db.close()
                    
        except Exception as e:
            logger.error(f"Error in handle_profile: {e}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            bot.reply_to(message, "❌ Произошла ошибка при получении профиля")

    @staticmethod
    def _generate_progress_bar(percentage: float, length: int = 10) -> str:
        """Генерирует прогресс-бар"""
        filled = int(percentage / (100 / length))
        empty = length - filled
        return '▰' * filled + '▱' * empty

    @staticmethod
    def handle_detailed_stats(message: types.Message, user_id: str = None):
        """Показывает расширенную статистику пользователя в виде статьи"""
        try:
            if not user_id:
                user_id = str(message.from_user.id)
            
            user = User.get_by_id(user_id)
            if not user:
                return "❌ Пользователь не найден"
            
            current_year = datetime.now().year
            current_month = datetime.now().month
            month_name = calendar.month_name[current_month]
            
            year_stats = RunningLog.get_user_stats(user_id, current_year)
            month_stats = RunningLog.get_user_stats(user_id, current_year, current_month)
            best_stats = RunningLog.get_best_stats(user_id)
            
            # Формируем текст статьи
            article = f"📊 Подробная статистика {user.username}\n\n"
            
            # Годовая статистика
            article += f"<b>Статистика за {current_year} год</b>\n"
            article += f"🏃‍♂️ Количество пробежек: {year_stats['runs_count']}\n"
            article += f"📏 Общая дистанция: {year_stats['total_km']:.2f} км\n"
            article += f"📈 Средняя дистанция: {year_stats['avg_km']:.2f} км\n"
            if year_stats['runs_count'] > 0:
                article += f"🔥 Темп роста: {year_stats['total_km'] / (current_month):.2f} км/месяц\n"
            
            # Цель и прогресс
            if user.goal_km > 0:
                progress = (year_stats['total_km'] / user.goal_km * 100)
                article += f"\n<b>Цель на {current_year} год</b>\n"
                article += f"🎯 Цель: {user.goal_km:.2f} км\n"
                article += f"✨ Текущий прогресс: {progress:.2f}%\n"
                article += f"📊 Осталось: {user.goal_km - year_stats['total_km']:.2f} км\n"
            
            # Статистика по типам чатов
            if year_stats.get('chat_stats'):
                article += f"\n<b>Статистика по типам чатов</b>\n"
                for chat_type, stats in year_stats['chat_stats'].items():
                    article += f"\n{chat_type.capitalize()}\n"
                    article += f"├ Количество пробежек: {stats['runs_count']}\n"
                    article += f"├ Общая дистанция: {stats['total_km']:.2f} км\n"
                    article += f"└ Средняя дистанция: {stats['avg_km']:.2f} км\n"
            
            # Месячная статистика
            article += f"\n<b>Статистика за {month_name}</b>\n"
            article += f"🏃‍♂️ Количество пробежек: {month_stats['runs_count']}\n"
            article += f"📏 Общая дистанция: {month_stats['total_km']:.2f} км\n"
            if month_stats['runs_count'] > 0:
                article += f"📈 Средняя дистанция: {month_stats['avg_km']:.2f} км\n"
            
                # Статистика по типам чатов за месяц
                if month_stats.get('chat_stats'):
                    article += f"\nПо типам чатов:\n"
                    for chat_type, stats in month_stats['chat_stats'].items():
                        article += f"{chat_type.capitalize()}: {stats['runs_count']} пробежек, {stats['total_km']:.2f} км\n"
            
            # Лучшие показатели
            article += f"\n<b>Лучшие показатели за все время</b>\n"
            article += f"💪 Лучшая пробежка: {best_stats['best_run']:.2f} км\n"
            article += f"🌟 Общая дистанция: {best_stats['total_km']:.2f} км\n"
            article += f"📊 Всего пробежек: {best_stats['total_runs']}\n"
            
            return article
            
        except Exception as e:
            logger.error(f"Error in handle_detailed_stats: {e}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return "❌ Произошла ошибка при получении расширенной статистики"

    @staticmethod
    def handle_set_goal_callback(call):
        """Обрабатывает нажатия на кнопки установки цели"""
        try:
            user_id = str(call.from_user.id)
            
            # Используем одну сессию для всех операций
            db = SessionLocal()
            try:
                # Получаем или создаем пользователя
                user = db.query(User).filter(User.user_id == user_id).first()
                if not user:
                    username = call.from_user.username or call.from_user.first_name
                    user = User(user_id=user_id, username=username)
                    db.add(user)
                    db.commit()

                if call.data == "set_goal_custom":
                    # Получаем статистику за прошлый год
                    last_year = datetime.now().year - 1
                    last_year_stats = RunningLog.get_user_stats(user_id, last_year, db=db)
                    
                    markup = types.InlineKeyboardMarkup()
                    
                    # Если есть статистика за прошлый год, предлагаем цели на её основе
                    if last_year_stats['total_km'] > 0:
                        last_year_km = last_year_stats['total_km']
                        markup.row(
                            types.InlineKeyboardButton(
                                f"🎯 Как в {last_year} году: {last_year_km:.0f} км",
                                callback_data=f"set_goal_{last_year_km}"
                            )
                        )
                        markup.row(
                            types.InlineKeyboardButton(
                                f"🔥 +10% к {last_year}: {last_year_km * 1.1:.0f} км",
                                callback_data=f"set_goal_{last_year_km * 1.1}"
                            )
                        )
                        markup.row(
                            types.InlineKeyboardButton(
                                f"💪 +25% к {last_year}: {last_year_km * 1.25:.0f} км",
                                callback_data=f"set_goal_{last_year_km * 1.25}"
                            )
                        )
                    
                    # Стандартные варианты целей
                    markup.row(
                        types.InlineKeyboardButton("500 км", callback_data="set_goal_500"),
                        types.InlineKeyboardButton("1000 км", callback_data="set_goal_1000"),
                        types.InlineKeyboardButton("1500 км", callback_data="set_goal_1500")
                    )
                    
                    # Кнопка для точной настройки
                    markup.row(
                        types.InlineKeyboardButton(
                            "🎯 Точная настройка",
                            callback_data="set_goal_precise"
                        )
                    )
                    
                    # Кнопка возврата
                    markup.row(
                        types.InlineKeyboardButton(
                            "◀️ Вернуться к профилю",
                            callback_data="back_to_profile"
                        )
                    )
                    
                    response = "Выберите цель на год:\n\n"
                    if last_year_stats['total_km'] > 0:
                        response += f"📊 В {last_year} году вы пробежали: {last_year_stats['total_km']:.2f} км\n"
                        response += f"🏃‍♂️ Количество пробежек: {last_year_stats['runs_count']}\n"
                        response += f"📈 Средняя дистанция: {last_year_stats['avg_km']:.2f} км\n\n"
                    
                    response += "Выберите один из вариантов или настройте точное значение:"
                    
                    try:
                        bot.edit_message_text(
                            chat_id=call.message.chat.id,
                            message_id=call.message.message_id,
                            text=response,
                            reply_markup=markup
                        )
                    except ApiTelegramException as e:
                        if "message is not modified" not in str(e):
                            raise
                    return
                
                elif call.data == "set_goal_precise":
                    # Показываем интерактивный выбор с кнопками +/-
                    current_goal = user.goal_km if user.goal_km else 1000
                    markup = types.InlineKeyboardMarkup()
                    
                    # Кнопки изменения значения
                    markup.row(
                        types.InlineKeyboardButton("➖ 100", callback_data=f"adjust_goal_{current_goal - 100}"),
                        types.InlineKeyboardButton("➖ 50", callback_data=f"adjust_goal_{current_goal - 50}"),
                        types.InlineKeyboardButton("➖ 10", callback_data=f"adjust_goal_{current_goal - 10}")
                    )
                    markup.row(
                        types.InlineKeyboardButton("➕ 10", callback_data=f"adjust_goal_{current_goal + 10}"),
                        types.InlineKeyboardButton("➕ 50", callback_data=f"adjust_goal_{current_goal + 50}"),
                        types.InlineKeyboardButton("➕ 100", callback_data=f"adjust_goal_{current_goal + 100}")
                    )
                    
                    # Кнопки подтверждения и отмены
                    markup.row(
                        types.InlineKeyboardButton("✅ Подтвердить", callback_data=f"confirm_goal_{current_goal}"),
                        types.InlineKeyboardButton("◀️ Назад", callback_data="set_goal_custom")
                    )
                    
                    response = f"🎯 Настройка цели на год\n\n"
                    response += f"Текущее значение: {current_goal:.0f} км\n\n"
                    response += "Используйте кнопки для изменения значения:"
                    
                    try:
                        bot.edit_message_text(
                            chat_id=call.message.chat.id,
                            message_id=call.message.message_id,
                            text=response,
                            reply_markup=markup
                        )
                    except ApiTelegramException as e:
                        if "message is not modified" not in str(e):
                            raise
                    return
                
                elif call.data.startswith("adjust_goal_"):
                    # Обрабатываем изменение значения цели
                    new_goal = float(call.data.split('_')[2])
                    if new_goal <= 0:
                        bot.answer_callback_query(
                            call.id,
                            "❌ Цель должна быть больше 0"
                        )
                        return
                    
                    markup = types.InlineKeyboardMarkup()
                    markup.row(
                        types.InlineKeyboardButton("➖ 100", callback_data=f"adjust_goal_{new_goal - 100}"),
                        types.InlineKeyboardButton("➖ 50", callback_data=f"adjust_goal_{new_goal - 50}"),
                        types.InlineKeyboardButton("➖ 10", callback_data=f"adjust_goal_{new_goal - 10}")
                    )
                    markup.row(
                        types.InlineKeyboardButton("➕ 10", callback_data=f"adjust_goal_{new_goal + 10}"),
                        types.InlineKeyboardButton("➕ 50", callback_data=f"adjust_goal_{new_goal + 50}"),
                        types.InlineKeyboardButton("➕ 100", callback_data=f"adjust_goal_{new_goal + 100}")
                    )
                    markup.row(
                        types.InlineKeyboardButton("✅ Подтвердить", callback_data=f"confirm_goal_{new_goal}"),
                        types.InlineKeyboardButton("◀️ Назад", callback_data="set_goal_custom")
                    )
                    
                    response = f"🎯 Настройка цели на год\n\n"
                    response += f"Текущее значение: {new_goal:.0f} км\n\n"
                    response += "Используйте кнопки для изменения значения:"
                    
                    try:
                        bot.edit_message_text(
                            chat_id=call.message.chat.id,
                            message_id=call.message.message_id,
                            text=response,
                            reply_markup=markup
                        )
                    except ApiTelegramException as e:
                        if "message is not modified" not in str(e):
                            raise
                    return
                
                elif call.data.startswith("confirm_goal_") or call.data.startswith("set_goal_"):
                    # Устанавливаем выбранную цель
                    if call.data.startswith("confirm_goal_"):
                        goal = float(call.data.split('_')[2])
                    else:
                        goal = float(call.data.split('_')[2])
                    
                    # Обновляем цель пользователя
                    user.goal_km = goal
                    db.commit()
                    
                    # Отправляем подтверждение
                    bot.answer_callback_query(
                        call.id,
                        "✅ Цель успешно установлена"
                    )
                    
                    # Создаем новое сообщение
                    try:
                        # Сначала удаляем старое сообщение
                        bot.delete_message(
                            chat_id=call.message.chat.id,
                            message_id=call.message.message_id
                        )
                    except:
                        pass
                    
                    # Отправляем новое сообщение с профилем
                    response = f"👤 Профиль {user.username}\n\n"
                    
                    # Получаем статистику
                    current_year = datetime.now().year
                    year_stats = RunningLog.get_user_stats(user_id, current_year, db=db)
                    
                    # Статистика за текущий год
                    response += f"📊 Статистика за {current_year} год:\n"
                    response += f"├ 🏃‍♂️ Пробежек: {year_stats['runs_count']}\n"
                    response += f"├ 📏 Всего: {year_stats['total_km']:.2f} км\n"
                    if year_stats['runs_count'] > 0:
                        response += f"└ 📈 Средняя: {year_stats['avg_km']:.2f} км\n\n"
                    else:
                        response += f"└ 📈 Средняя: 0.0 км\n\n"
                    
                    # Цель и прогресс
                    if goal > 0:
                        progress = (year_stats['total_km'] / goal * 100)
                        response += f"🎯 Цель на {current_year} год: {goal:.2f} км\n"
                        response += f"✨ Прогресс: {progress:.2f}%\n"
                    else:
                        response += "🎯 Цель на год не установлена\n"
                    
                    # Создаем клавиатуру
                    markup = types.InlineKeyboardMarkup()
                    markup.row(
                        types.InlineKeyboardButton(
                            "📝 Изменить цель на 2025",
                            callback_data="set_goal_custom"
                        )
                    )
                    markup.row(
                        types.InlineKeyboardButton(
                            "📊 Расширенная статистика",
                            callback_data="show_detailed_stats"
                        )
                    )
                    markup.row(
                        types.InlineKeyboardButton(
                            "✏️ Редактировать пробежки",
                            callback_data="edit_runs"
                        )
                    )
                    
                    # Отправляем новое сообщение
                    bot.send_message(
                        chat_id=call.message.chat.id,
                        text=response,
                        reply_markup=markup
                    )
            finally:
                db.close()
            
        except Exception as e:
            logger.error(f"Error in handle_set_goal_callback: {e}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            try:
                bot.answer_callback_query(
                    call.id,
                    "❌ Произошла ошибка при установке цели"
                )
            except:
                pass

    @staticmethod
    def handle_detailed_stats_callback(call):
        """Обрабатывает нажатие на кнопку расширенной статистики"""
        try:
            user_id = str(call.from_user.id)
            article = StatsHandler.handle_detailed_stats(call.message, user_id)
            
            # Создаем кнопку возврата к профилю
            markup = types.InlineKeyboardMarkup()
            markup.row(
                types.InlineKeyboardButton(
                    "◀️ Вернуться к профилю",
                    callback_data="back_to_profile"
                )
            )
            
            # Отправляем статью с расширенной статистикой
            bot.edit_message_text(
                chat_id=call.message.chat.id,
                message_id=call.message.message_id,
                text=article,
                reply_markup=markup,
                parse_mode='HTML'
            )
            
        except Exception as e:
            logger.error(f"Error in handle_detailed_stats_callback: {e}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            bot.answer_callback_query(
                call.id,
                "❌ Произошла ошибка при получении расширенной статистики"
            )
    
    @staticmethod
    def handle_edit_runs_callback(call):
        """Обрабатывает нажатие на кнопку редактирования пробежек"""
        try:
            user_id = str(call.from_user.id)
            
            # Получаем последние пробежки пользователя
            runs = RunningLog.get_user_runs(user_id, limit=5)
            
            if not runs:
                bot.answer_callback_query(
                    call.id,
                    "У вас пока нет пробежек для редактирования"
                )
                return
            
            response = "🏃‍♂️ Ваши последние пробежки:\n\n"
            
            markup = types.InlineKeyboardMarkup()
            
            for run in runs:
                run_date = run.date_added.strftime("%d.%m")
                response += f"📅 {run_date}: {run.km:.2f} км\n"
                markup.row(
                    types.InlineKeyboardButton(
                        f"✏️ {run_date} ({run.km:.2f} км)",
                        callback_data=f"edit_run_{run.log_id}"
                    ),
                    types.InlineKeyboardButton(
                        "❌",
                        callback_data=f"delete_run_{run.log_id}"
                    )
                )
            
            markup.row(
                types.InlineKeyboardButton(
                    "◀️ Вернуться к профилю",
                    callback_data="back_to_profile"
                )
            )
            
            bot.edit_message_text(
                chat_id=call.message.chat.id,
                message_id=call.message.message_id,
                text=response,
                reply_markup=markup
            )
            
        except Exception as e:
            logger.error(f"Error in handle_edit_runs_callback: {e}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            bot.answer_callback_query(
                call.id,
                "❌ Произошла ошибка при получении списка пробежек"
            )

    @staticmethod
    def handle_edit_run_callback(call):
        """Обрабатывает нажатие на кнопку редактирования конкретной пробежки"""
        try:
            run_id = int(call.data.split('_')[2])
            user_id = str(call.from_user.id)
            
            # Получаем пробежку из базы
            db = SessionLocal()
            try:
                run = db.query(RunningLog).filter(
                    RunningLog.log_id == run_id,
                    RunningLog.user_id == user_id
                ).first()
                
                if not run:
                    bot.answer_callback_query(
                        call.id,
                        "❌ Пробежка не найдена"
                    )
                    return
                
                # Создаем клавиатуру с кнопками изменения дистанции
                markup = types.InlineKeyboardMarkup()
                current_km = run.km
                
                # Кнопки для изменения на ±0.5, ±1, ±2 км
                markup.row(
                    types.InlineKeyboardButton(f"➖ 2км", callback_data=f"adjust_run_{run_id}_{current_km - 2}"),
                    types.InlineKeyboardButton(f"➖ 1км", callback_data=f"adjust_run_{run_id}_{current_km - 1}"),
                    types.InlineKeyboardButton(f"➖ 0.5км", callback_data=f"adjust_run_{run_id}_{current_km - 0.5}")
                )
                markup.row(
                    types.InlineKeyboardButton(f"➕ 0.5км", callback_data=f"adjust_run_{run_id}_{current_km + 0.5}"),
                    types.InlineKeyboardButton(f"➕ 1км", callback_data=f"adjust_run_{run_id}_{current_km + 1}"),
                    types.InlineKeyboardButton(f"➕ 2км", callback_data=f"adjust_run_{run_id}_{current_km + 2}")
                )
                
                # Кнопки навигации
                markup.row(
                    types.InlineKeyboardButton("◀️ Назад", callback_data="edit_runs"),
                    types.InlineKeyboardButton("❌ Удалить", callback_data=f"delete_run_{run_id}")
                )
                
                response = (
                    f"📝 Редактирование пробежки\n\n"
                    f"📅 Дата: {run.date_added.strftime('%d.%m.%Y')}\n"
                    f"📅 Текущая дистанция: {current_km:.2f} км\n\n"
                    f"Выберите изменение дистанции:"
                )
                
                bot.edit_message_text(
                    chat_id=call.message.chat.id,
                    message_id=call.message.message_id,
                    text=response,
                    reply_markup=markup
                )
                
            finally:
                db.close()
            
        except Exception as e:
            logger.error(f"Error in handle_edit_run_callback: {e}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            bot.answer_callback_query(
                call.id,
                "❌ Произошла ошибка при редактировании пробежки"
            )

    @staticmethod
    def handle_adjust_run_callback(call):
        """Обрабатывает нажатие на кнопку изменения дистанции пробежки"""
        try:
            # Формат: adjust_run_ID_DISTANCE
            parts = call.data.split('_')
            run_id = int(parts[2])
            new_distance = float(parts[3])
            user_id = str(call.from_user.id)
            
            if new_distance <= 0:
                bot.answer_callback_query(
                    call.id,
                    "❌ Дистанция должна быть больше 0"
                )
                return
            
            # Проверяем максимальную дистанцию
            if new_distance > 100:
                bot.answer_callback_query(
                    call.id,
                    "❌ Максимальная дистанция - 100 км"
                )
                return
            
            # Обновляем дистанцию пробежки
            db = SessionLocal()
            try:
                run = db.query(RunningLog).filter(
                    RunningLog.log_id == run_id,
                    RunningLog.user_id == user_id
                ).first()
                
                if not run:
                    bot.answer_callback_query(
                        call.id,
                        "❌ Пробежка не найдена"
                    )
                    return
                
                old_distance = run.km
                run.km = new_distance
                db.commit()
                
                bot.answer_callback_query(
                    call.id,
                    f"✅ Дистанция изменена: {old_distance:.2f} → {new_distance:.2f} км"
                )
                
                # Возвращаемся к списку пробежек
                StatsHandler.handle_edit_runs_callback(call)
                
            finally:
                db.close()
            
        except Exception as e:
            logger.error(f"Error in handle_adjust_run_callback: {e}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            bot.answer_callback_query(
                call.id,
                "❌ Произошла ошибка при изменении дистанции"
            )

    @staticmethod
    def handle_delete_run_callback(call):
        """Обрабатывает нажатие на кнопку удаления пробежки"""
        try:
            run_id = int(call.data.split('_')[2])
            
            # Создаем клавиатуру для подтверждения удаления
            markup = types.InlineKeyboardMarkup()
            markup.row(
                types.InlineKeyboardButton(
                    "✅ Да, удалить",
                    callback_data=f"confirm_delete_{run_id}"
                ),
                types.InlineKeyboardButton(
                    "❌ Нет, отмена",
                    callback_data="edit_runs"
                )
            )
            
            bot.edit_message_text(
                chat_id=call.message.chat.id,
                message_id=call.message.message_id,
                text="❗️ Вы уверены, что хотите удалить эту пробежку?",
                reply_markup=markup
            )
            
        except Exception as e:
            logger.error(f"Error in handle_delete_run_callback: {e}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            bot.answer_callback_query(
                call.id,
                "❌ Произошла ошибка при удалении пробежки"
            )

    @staticmethod
    def handle_back_to_profile_callback(call):
        """Обрабатывает нажатие на кнопку возврата к профилю"""
        try:
            # Создаем новое сообщение профиля
            db = SessionLocal()
            try:
                user_id = str(call.from_user.id)
                StatsHandler.handle_profile(call.message, user_id, db)
            finally:
                db.close()
            
        except Exception as e:
            logger.error(f"Error in handle_back_to_profile_callback: {e}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            bot.answer_callback_query(
                call.id,
                "❌ Произошла ошибка при возврате к профилю"
            )

    @staticmethod
    def handle_confirm_delete_callback(call):
        """Обрабатывает подтверждение удаления пробежки"""
        try:
            run_id = int(call.data.split('_')[2])
            user_id = str(call.from_user.id)
            
            # Удаляем пробежку
            db = SessionLocal()
            try:
                run = db.query(RunningLog).filter(
                    RunningLog.log_id == run_id,
                    RunningLog.user_id == user_id
                ).first()
                
                if not run:
                    bot.answer_callback_query(
                        call.id,
                        "❌ Пробежка не найдена"
                    )
                    return
                
                db.delete(run)
                db.commit()
            finally:
                db.close()
            
            bot.answer_callback_query(
                call.id,
                "✅ Пробежка успешно удалена"
            )
            
            # Возвращаемся к списку пробежек
            StatsHandler.handle_edit_runs_callback(call)
            
        except Exception as e:
            logger.error(f"Error in handle_confirm_delete_callback: {e}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            bot.answer_callback_query(
                call.id,
                "❌ Произошла ошибка при удалении пробежки"
            )

    @staticmethod
    def handle_new_run_callback(call):
        """Обрабатывает нажатие на кнопку новой пробежки"""
        try:
            if call.data == 'new_run':
                markup = types.InlineKeyboardMarkup()
                
                # Популярные дистанции
                markup.row(
                    types.InlineKeyboardButton("5 км", callback_data="quick_run_5"),
                    types.InlineKeyboardButton("7.5 км", callback_data="quick_run_7.5"),
                    types.InlineKeyboardButton("10 км", callback_data="quick_run_10")
                )
                markup.row(
                    types.InlineKeyboardButton("15 км", callback_data="quick_run_15"),
                    types.InlineKeyboardButton("21.1 км", callback_data="quick_run_21.1"),
                    types.InlineKeyboardButton("42.2 км", callback_data="quick_run_42.2")
                )
                
                # Кнопка возврата
                markup.row(
                    types.InlineKeyboardButton("◀️ Назад", callback_data="back_to_profile")
                )
                
                response = (
                    "🏃‍♂️ <b>Новая пробежка</b>\n\n"
                    "Выберите дистанцию или отправьте сообщением:\n"
                    "• Просто километраж (например: 5.2)\n"
                    "• Километраж и заметку (5.2 Утренняя)\n"
                    "• Фото с подписью, содержащей километраж"
                )
                
                bot.edit_message_text(
                    chat_id=call.message.chat.id,
                    message_id=call.message.message_id,
                    text=response,
                    reply_markup=markup,
                    parse_mode='HTML'
                )
                
            elif call.data.startswith('quick_run_'):
                km = float(call.data.split('_')[2])
                user_id = str(call.from_user.id)
                chat_id = str(call.message.chat.id) if call.message.chat.type != 'private' else None
                chat_type = call.message.chat.type if call.message.chat else 'private'
                
                logger.info(f"Adding quick run: {km} km for user {user_id}")
                logger.debug(f"Chat info - id: {chat_id}, type: {chat_type}")
                
                # Добавляем пробежку
                if RunningLog.add_entry(
                    user_id=user_id,
                    km=km,
                    date_added=datetime.now().date(),
                    chat_id=chat_id,
                    chat_type=chat_type
                ):
                    logger.info("Run entry added successfully")
                    
                    # Получаем статистику пользователя
                    logger.debug("Getting user information")
                    user = User.get_by_id(user_id)
                    
                    logger.debug("Getting total km")
                    total_km = RunningLog.get_user_total_km(user_id)
                    logger.debug(f"Total km: {total_km}")
                    
                    response = f"✅ Записана пробежка {km:.2f} км!\n"
                    if user and user.goal_km > 0:
                        progress = (total_km / user.goal_km * 100)
                        response += f"📊 Прогресс: {total_km:.2f} из {user.goal_km:.2f} км ({progress:.2f}%)"
                    
                    logger.debug(f"Generated response: {response}")
                    
                    bot.answer_callback_query(
                        call.id,
                        "✅ Пробежка успешно записана"
                    )
                    
                    # Возвращаемся к профилю
                    logger.info("Updating profile view")
                    StatsHandler.handle_profile(call.message)
                else:
                    logger.error("Failed to add run entry")
                    bot.answer_callback_query(
                        call.id,
                        "❌ Не удалось сохранить пробежку"
                    )
            
        except Exception as e:
            logger.error(f"Error in handle_new_run_callback: {e}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            bot.answer_callback_query(
                call.id,
                "❌ Произошла ошибка при добавлении пробежки"
            ) 