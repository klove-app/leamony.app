/**
 * @typedef {Object} TrainingPlan
 * @property {string} id - Уникальный идентификатор плана
 * @property {string} start_date - Дата начала плана (YYYY-MM-DD)
 * @property {string} end_date - Дата окончания плана (YYYY-MM-DD)
 * @property {('pending'|'completed'|'error')} status - Статус плана
 * @property {number} current_week - Текущая неделя плана
 * @property {string} summary - Общее описание плана
 * @property {WeeklyStructure} weekly_structure - Структура плана по неделям
 * @property {Recommendations} recommendations - Общие рекомендации
 * @property {PlannedWorkout[]} planned_workouts - Запланированные тренировки
 */

/**
 * @typedef {Object} WeeklyStructure
 * @property {WeekData} week_1
 * @property {WeekData} week_2
 * @property {WeekData} week_3
 * @property {WeekData} week_4
 */

/**
 * @typedef {Object} WeekData
 * @property {string} focus - Фокус и цели недели
 * @property {number} total_distance - Общая дистанция на неделю
 * @property {IntensityDistribution} intensity_distribution - Распределение интенсивности
 */

/**
 * @typedef {Object} IntensityDistribution
 * @property {string} easy - Процент легких тренировок
 * @property {string} moderate - Процент тренировок средней интенсивности
 * @property {string} hard - Процент тяжелых тренировок
 */

/**
 * @typedef {Object} Recommendations
 * @property {string[]} nutrition - Рекомендации по питанию
 * @property {string[]} recovery - Рекомендации по восстановлению
 * @property {string[]} adaptation - Рекомендации по адаптации
 */

/**
 * @typedef {Object} PlannedWorkout
 * @property {string} id - Уникальный идентификатор тренировки
 * @property {string} scheduled_date - Дата тренировки
 * @property {('pending'|'completed'|'skipped'|'failed')} status - Статус тренировки
 * @property {number} distance_km - Дистанция в километрах
 * @property {number} duration_minutes - Длительность в минутах
 * @property {string} intensity_type - Тип интенсивности
 * @property {string} description - Описание тренировки
 * @property {string} notes - Дополнительные заметки
 * @property {TargetZones} target_zones - Целевые зоны
 * @property {Interval[]} [intervals] - Интервалы (опционально)
 * @property {WorkoutType} workout_type - Тип тренировки
 * @property {WorkoutDetails} details - Детали тренировки
 */

/**
 * @typedef {Object} TargetZones
 * @property {string} warmup - Зона разминки
 * @property {string} main - Основная зона
 * @property {string} cooldown - Зона заминки
 * @property {string} [warmup_pace] - Темп разминки
 * @property {string} [main_pace] - Основной темп
 * @property {string} [cooldown_pace] - Темп заминки
 */

/**
 * @typedef {Object} Interval
 * @property {string} distance - Дистанция интервала
 * @property {string} pace - Целевой темп
 * @property {string} recovery - Восстановление
 * @property {number} repetitions - Количество повторений
 */

/**
 * @typedef {Object} WorkoutType
 * @property {string} id - Идентификатор типа тренировки
 * @property {string} name - Название типа тренировки
 * @property {string} description - Описание типа тренировки
 * @property {string} intensity_level - Уровень интенсивности
 */

/**
 * @typedef {Object} WorkoutDetails
 * @property {WarmupCooldown} warmup - Разминка
 * @property {WarmupCooldown} cooldown - Заминка
 * @property {NutritionStrategy} nutrition - Стратегия питания
 * @property {RecoveryStrategy} recovery - Стратегия восстановления
 * @property {Equipment} [equipment] - Необходимое снаряжение
 */

/**
 * @typedef {Object} WarmupCooldown
 * @property {string} description - Описание разминки/заминки
 */

/**
 * @typedef {Object} NutritionStrategy
 * @property {string[]} pre_workout - Питание перед тренировкой
 * @property {string[]} during - Питание во время тренировки
 * @property {string[]} post_workout - Питание после тренировки
 */

/**
 * @typedef {Object} RecoveryStrategy
 * @property {('low'|'medium'|'high')} priority - Приоритет восстановления
 * @property {string[]} recommendations - Рекомендации по восстановлению
 * @property {string} next_workout - Информация о следующей тренировке
 */

/**
 * @typedef {Object} Equipment
 * @property {string[]} required - Обязательное снаряжение
 * @property {string[]} optional - Опциональное снаряжение
 */

export {}; 