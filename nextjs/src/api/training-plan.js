import { getToken } from '../utils/auth.js';

/**
 * Получение текущего плана тренировок
 * @returns {Promise<import('../types/training-plan.js').TrainingPlan>}
 */
export async function getCurrentPlan() {
    const response = await fetch('/api/v1/training-plan/current', {
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}

/**
 * Генерация нового плана тренировок
 * @param {Object} params - Параметры для генерации плана
 * @param {Object} params.athlete_context - Контекст атлета
 * @param {string} params.athlete_context.current_level - Текущий уровень
 * @param {number} params.athlete_context.weekly_mileage - Недельный километраж
 * @param {number[]} params.athlete_context.preferred_days - Предпочитаемые дни
 * @param {string} params.athlete_context.goal_type - Тип цели
 * @param {string} [params.athlete_context.preferred_workout_time] - Предпочитаемое время
 * @param {string} [params.athlete_context.injuries] - Ограничения по здоровью
 * @param {string} params.start_date - Дата начала (YYYY-MM-DD)
 * @param {string} params.end_date - Дата окончания (YYYY-MM-DD)
 * @param {Array} [params.workout_history] - История тренировок
 * @returns {Promise<{status: string, plan_id?: string}>}
 */
export async function generatePlan(params) {
    const response = await fetch('/api/v1/training-plan/generate', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}

/**
 * Проверка статуса генерации плана
 * @returns {Promise<{status: string, plan?: import('../types/training-plan.js').TrainingPlan}>}
 */
export async function checkPlanStatus() {
    const response = await fetch('/api/v1/training-plan/status', {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}

/**
 * Обновление статуса тренировки
 * @param {string} workoutId - ID тренировки
 * @param {string} status - Новый статус
 * @param {Object} [details] - Детали выполнения
 * @returns {Promise<void>}
 */
export async function updateWorkoutStatus(workoutId, status, details = {}) {
    const response = await fetch(`/api/v1/training-plan/workouts/${workoutId}/status`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, ...details })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
}

/**
 * Получение статистики по плану
 * @returns {Promise<Object>}
 */
export async function getPlanStats() {
    const response = await fetch('/api/v1/training-plan/stats', {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}

/**
 * Экспорт плана в календарь
 * @param {string} format - Формат экспорта ('ical' | 'google')
 * @returns {Promise<{url: string}>}
 */
export async function exportPlan(format) {
    const response = await fetch(`/api/v1/training-plan/export?format=${format}`, {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}

/**
 * Получение рекомендаций по адаптации плана
 * @param {Object} params - Параметры для получения рекомендаций
 * @returns {Promise<Object>}
 */
export async function getPlanAdaptation(params) {
    const response = await fetch('/api/v1/training-plan/adapt', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
} 