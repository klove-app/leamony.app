/**
 * Форматирование даты тренировки
 * @param {string} date - Дата в формате YYYY-MM-DD
 * @returns {string} Отформатированная дата
 */
export function formatWorkoutDate(date) {
    return new Date(date).toLocaleDateString('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });
}

/**
 * Перевод типа тренировки
 * @param {string} type - Тип тренировки
 * @returns {string} Переведенный тип
 */
export function translateWorkoutType(type) {
    const types = {
        'base_building': 'Базовая тренировка',
        'long_run': 'Длительная пробежка',
        'tempo': 'Темповая тренировка',
        'intervals': 'Интервальная тренировка',
        'recovery': 'Восстановительная пробежка',
        'easy': 'Легкая пробежка',
        'threshold': 'Пороговая тренировка',
        'speed': 'Скоростная тренировка',
        'fartlek': 'Фартлек',
        'hills': 'Тренировка в гору'
    };
    return types[type] || type;
}

/**
 * Перевод интенсивности
 * @param {string} intensity - Интенсивность
 * @returns {string} Переведенная интенсивность
 */
export function translateIntensity(intensity) {
    const intensities = {
        'low': 'Низкая интенсивность',
        'moderate': 'Средняя интенсивность',
        'high': 'Высокая интенсивность',
        'very_high': 'Очень высокая интенсивность'
    };
    return intensities[intensity] || intensity;
}

/**
 * Перевод фазы тренировки
 * @param {string} phase - Фаза
 * @returns {string} Переведенная фаза
 */
export function translatePhase(phase) {
    const phases = {
        'pre_workout': 'Перед тренировкой',
        'during_workout': 'Во время тренировки',
        'post_workout': 'После тренировки',
        'recovery_day': 'В день отдыха',
        'race_day': 'В день соревнований'
    };
    return phases[phase] || phase;
}

/**
 * Перевод приоритета восстановления
 * @param {string} priority - Приоритет
 * @returns {string} Переведенный приоритет
 */
export function translateRecoveryPriority(priority) {
    const priorities = {
        'low': 'Низкий',
        'medium': 'Средний',
        'high': 'Высокий'
    };
    return priorities[priority] || priority;
}

/**
 * Получение CSS класса для статуса тренировки
 * @param {string} status - Статус
 * @returns {string} CSS класс
 */
export function getWorkoutStatusClass(status) {
    const statusClasses = {
        'pending': 'workout-pending',
        'completed': 'workout-completed',
        'skipped': 'workout-skipped',
        'failed': 'workout-failed'
    };
    return statusClasses[status] || 'workout-pending';
}

/**
 * Форматирование темпа
 * @param {string} pace - Темп в формате MM:SS
 * @returns {string} Отформатированный темп
 */
export function formatPace(pace) {
    if (!pace) return '';
    const [minutes, seconds] = pace.split(':');
    return `${minutes}:${seconds.padStart(2, '0')} мин/км`;
}

/**
 * Группировка тренировок по неделям
 * @param {import('../types/training-plan').PlannedWorkout[]} workouts - Тренировки
 * @returns {Object.<string, import('../types/training-plan').PlannedWorkout[]>} Тренировки, сгруппированные по неделям
 */
export function groupWorkoutsByWeek(workouts) {
    return workouts.reduce((weeks, workout) => {
        const date = new Date(workout.scheduled_date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay() + 1);
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeks[weekKey]) {
            weeks[weekKey] = [];
        }
        weeks[weekKey].push(workout);
        return weeks;
    }, {});
}

/**
 * Расчет прогресса плана
 * @param {import('../types/training-plan').TrainingPlan} plan - План тренировок
 * @returns {Object} Статистика прогресса
 */
export function calculatePlanProgress(plan) {
    const total = plan.planned_workouts.length;
    const completed = plan.planned_workouts.filter(w => w.status === 'completed').length;
    const skipped = plan.planned_workouts.filter(w => w.status === 'skipped').length;
    const failed = plan.planned_workouts.filter(w => w.status === 'failed').length;
    const pending = total - completed - skipped - failed;
    
    return {
        total,
        completed,
        skipped,
        failed,
        pending,
        completionRate: (completed / total) * 100,
        successRate: (completed / (completed + failed)) * 100
    };
}

/**
 * Проверка, является ли тренировка ключевой
 * @param {import('../types/training-plan').PlannedWorkout} workout - Тренировка
 * @returns {boolean} Является ли тренировка ключевой
 */
export function isKeyWorkout(workout) {
    const keyTypes = ['long_run', 'tempo', 'intervals', 'threshold', 'speed'];
    return keyTypes.includes(workout.workout_type.id);
}

/**
 * Получение рекомендаций по темпу на основе целевых зон
 * @param {import('../types/training-plan').TargetZones} zones - Целевые зоны
 * @returns {Object} Рекомендации по темпу
 */
export function getPaceRecommendations(zones) {
    return {
        warmup: zones.warmup_pace ? formatPace(zones.warmup_pace) : 'Комфортный темп',
        main: zones.main_pace ? formatPace(zones.main_pace) : 'По ощущениям',
        cooldown: zones.cooldown_pace ? formatPace(zones.cooldown_pace) : 'Легкий темп'
    };
} 