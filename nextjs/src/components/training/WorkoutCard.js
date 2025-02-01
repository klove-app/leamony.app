import { formatWorkoutDate, translateWorkoutType, translateIntensity, translatePhase,
    translateRecoveryPriority, getWorkoutStatusClass, isKeyWorkout } from '../utils/training-plan.js';
import { updateWorkoutStatus } from '../api/training-plan.js';

export class WorkoutCard {
    /**
     * @param {import('../types/training-plan').PlannedWorkout} workout - Тренировка
     */
    constructor(workout) {
        this.workout = workout;
    }

    render() {
        const statusClass = getWorkoutStatusClass(this.workout.status);
        const isKey = isKeyWorkout(this.workout);

        return `
            <div class="workout-card ${statusClass} ${isKey ? 'key-workout' : ''}" 
                data-status="${this.workout.status}" 
                data-workout-id="${this.workout.id}">
                <div class="workout-header">
                    <div class="workout-date">
                        ${formatWorkoutDate(this.workout.scheduled_date)}
                    </div>
                    <div class="workout-status">
                        ${this.renderStatus()}
                    </div>
                </div>

                <div class="workout-body">
                    <div class="workout-type">
                        ${translateWorkoutType(this.workout.workout_type.name)}
                        ${isKey ? '<span class="key-badge">Ключевая</span>' : ''}
                    </div>

                    <div class="workout-stats">
                        ${this.workout.distance_km ? `
                            <div class="stat">
                                <i class="fas fa-running"></i>
                                ${this.workout.distance_km} км
                            </div>
                        ` : ''}
                        ${this.workout.duration_minutes ? `
                            <div class="stat">
                                <i class="fas fa-clock"></i>
                                ${this.workout.duration_minutes} мин
                            </div>
                        ` : ''}
                        <div class="stat">
                            <i class="fas fa-tachometer-alt"></i>
                            ${translateIntensity(this.workout.intensity_type)}
                        </div>
                    </div>

                    <div class="workout-zones">
                        <div class="zone">
                            <span class="zone-label">Разминка:</span>
                            <span class="zone-value">${this.workout.target_zones.warmup}</span>
                            ${this.workout.target_zones.warmup_pace ? `
                                <span class="zone-pace">${this.workout.target_zones.warmup_pace}</span>
                            ` : ''}
                        </div>
                        <div class="zone">
                            <span class="zone-label">Основная часть:</span>
                            <span class="zone-value">${this.workout.target_zones.main}</span>
                            ${this.workout.target_zones.main_pace ? `
                                <span class="zone-pace">${this.workout.target_zones.main_pace}</span>
                            ` : ''}
                        </div>
                        <div class="zone">
                            <span class="zone-label">Заминка:</span>
                            <span class="zone-value">${this.workout.target_zones.cooldown}</span>
                            ${this.workout.target_zones.cooldown_pace ? `
                                <span class="zone-pace">${this.workout.target_zones.cooldown_pace}</span>
                            ` : ''}
                        </div>
                    </div>

                    ${this.workout.intervals ? `
                        <div class="workout-intervals">
                            <h4>Интервалы</h4>
                            <div class="intervals-list">
                                ${this.workout.intervals.map(interval => `
                                    <div class="interval">
                                        <div class="interval-main">
                                            ${interval.repetitions}x ${interval.distance}
                                            @ ${interval.pace}
                                        </div>
                                        ${interval.recovery ? `
                                            <div class="interval-recovery">
                                                Отдых: ${interval.recovery}
                                            </div>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <div class="workout-details">
                        <div class="details-section">
                            <h4>Описание</h4>
                            <p>${this.workout.description}</p>
                        </div>

                        <div class="details-section">
                            <h4>Питание</h4>
                            <div class="nutrition-phases">
                                ${Object.entries(this.workout.details.nutrition).map(([phase, items]) => `
                                    <div class="nutrition-phase">
                                        <h5>${translatePhase(phase)}</h5>
                                        <ul>
                                            ${items.map(item => `<li>${item}</li>`).join('')}
                                        </ul>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="details-section">
                            <h4>Восстановление</h4>
                            <div class="recovery-info">
                                <div class="recovery-priority">
                                    Приоритет: ${translateRecoveryPriority(this.workout.details.recovery.priority)}
                                </div>
                                <ul>
                                    ${this.workout.details.recovery.recommendations.map(rec => `
                                        <li>${rec}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        </div>

                        ${this.workout.details.equipment ? `
                            <div class="details-section">
                                <h4>Снаряжение</h4>
                                <div class="equipment-list">
                                    ${this.workout.details.equipment.required.length > 0 ? `
                                        <div class="required-equipment">
                                            <h5>Обязательно</h5>
                                            <ul>
                                                ${this.workout.details.equipment.required.map(item => `
                                                    <li>${item}</li>
                                                `).join('')}
                                            </ul>
                                        </div>
                                    ` : ''}
                                    ${this.workout.details.equipment.optional.length > 0 ? `
                                        <div class="optional-equipment">
                                            <h5>Опционально</h5>
                                            <ul>
                                                ${this.workout.details.equipment.optional.map(item => `
                                                    <li>${item}</li>
                                                `).join('')}
                                            </ul>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="workout-actions">
                    ${this.renderActions()}
                </div>
            </div>
        `;
    }

    renderStatus() {
        const statusText = {
            'pending': 'Предстоит',
            'completed': 'Выполнено',
            'skipped': 'Пропущено',
            'failed': 'Не выполнено'
        };

        return `
            <span class="status-badge ${this.workout.status}">
                ${statusText[this.workout.status]}
            </span>
        `;
    }

    renderActions() {
        if (this.workout.status === 'pending') {
            return `
                <button class="action-btn complete-btn" onclick="completeWorkout('${this.workout.id}')">
                    <i class="fas fa-check"></i> Выполнено
                </button>
                <button class="action-btn skip-btn" onclick="skipWorkout('${this.workout.id}')">
                    <i class="fas fa-forward"></i> Пропустить
                </button>
            `;
        }

        return `
            <button class="action-btn reset-btn" onclick="resetWorkout('${this.workout.id}')">
                <i class="fas fa-undo"></i> Сбросить
            </button>
        `;
    }

    static addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .workout-card {
                background: white;
                border-radius: 12px;
                padding: 1.5rem;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                transition: all 0.3s ease;
            }

            .workout-card.key-workout {
                border-left: 4px solid var(--primary-purple);
            }

            .workout-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }

            .workout-date {
                font-weight: 500;
                color: #333;
            }

            .status-badge {
                padding: 0.25rem 0.75rem;
                border-radius: 12px;
                font-size: 0.9rem;
            }

            .status-badge.pending {
                background: #FFF3E0;
                color: #FF9800;
            }

            .status-badge.completed {
                background: #E8F5E9;
                color: #4CAF50;
            }

            .status-badge.skipped {
                background: #F5F5F5;
                color: #9E9E9E;
            }

            .status-badge.failed {
                background: #FFEBEE;
                color: #F44336;
            }

            .workout-type {
                font-size: 1.1rem;
                font-weight: 500;
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .key-badge {
                background: var(--light-purple);
                color: var(--primary-purple);
                padding: 0.25rem 0.5rem;
                border-radius: 12px;
                font-size: 0.8rem;
            }

            .workout-stats {
                display: flex;
                gap: 1rem;
                margin-bottom: 1rem;
            }

            .stat {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: #666;
            }

            .workout-zones {
                background: #f8f9fa;
                padding: 1rem;
                border-radius: 8px;
                margin-bottom: 1rem;
            }

            .zone {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.5rem;
            }

            .zone-label {
                font-weight: 500;
                min-width: 120px;
            }

            .zone-pace {
                color: #666;
                font-size: 0.9rem;
            }

            .workout-intervals {
                margin: 1rem 0;
            }

            .interval {
                background: #f8f9fa;
                padding: 0.75rem;
                border-radius: 8px;
                margin-bottom: 0.5rem;
            }

            .interval-recovery {
                font-size: 0.9rem;
                color: #666;
                margin-top: 0.25rem;
            }

            .details-section {
                margin: 1rem 0;
            }

            .details-section h4 {
                margin-bottom: 0.5rem;
                color: #333;
            }

            .nutrition-phases,
            .recovery-info {
                background: #f8f9fa;
                padding: 1rem;
                border-radius: 8px;
            }

            .nutrition-phase {
                margin-bottom: 1rem;
            }

            .nutrition-phase h5 {
                color: #666;
                margin-bottom: 0.5rem;
            }

            .recovery-priority {
                font-weight: 500;
                margin-bottom: 0.5rem;
            }

            .equipment-list {
                display: grid;
                gap: 1rem;
            }

            .workout-actions {
                display: flex;
                gap: 0.5rem;
                margin-top: 1rem;
                padding-top: 1rem;
                border-top: 1px solid #eee;
            }

            .action-btn {
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                transition: all 0.2s ease;
            }

            .complete-btn {
                background: var(--primary-purple);
                color: white;
            }

            .skip-btn {
                background: #f5f5f5;
                color: #666;
            }

            .reset-btn {
                background: #fff3e0;
                color: #ff9800;
            }

            .action-btn:hover {
                opacity: 0.9;
            }

            @media (max-width: 768px) {
                .workout-stats {
                    flex-direction: column;
                }

                .zone {
                    flex-direction: column;
                    align-items: flex-start;
                }

                .workout-actions {
                    flex-direction: column;
                }

                .action-btn {
                    width: 100%;
                    justify-content: center;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Добавляем глобальные функции для обработки действий
window.completeWorkout = async (workoutId) => {
    try {
        await updateWorkoutStatus(workoutId, 'completed');
        location.reload(); // Обновляем страницу для отображения изменений
    } catch (error) {
        console.error('Error completing workout:', error);
        alert('Не удалось отметить тренировку как выполненную');
    }
};

window.skipWorkout = async (workoutId) => {
    try {
        await updateWorkoutStatus(workoutId, 'skipped');
        location.reload();
    } catch (error) {
        console.error('Error skipping workout:', error);
        alert('Не удалось отметить тренировку как пропущенную');
    }
};

window.resetWorkout = async (workoutId) => {
    try {
        await updateWorkoutStatus(workoutId, 'pending');
        location.reload();
    } catch (error) {
        console.error('Error resetting workout:', error);
        alert('Не удалось сбросить статус тренировки');
    }
}; 