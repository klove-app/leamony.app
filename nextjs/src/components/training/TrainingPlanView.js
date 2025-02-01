import { formatWorkoutDate, translateWorkoutType, translateIntensity, translatePhase, 
    translateRecoveryPriority, getWorkoutStatusClass, calculatePlanProgress, 
    groupWorkoutsByWeek, isKeyWorkout } from '../utils/training-plan.js';
import { WorkoutCard } from './WorkoutCard.js';

export class TrainingPlanView {
    /**
     * @param {HTMLElement} container - Контейнер для отображения плана
     * @param {import('../types/training-plan').TrainingPlan} plan - План тренировок
     */
    constructor(container, plan) {
        this.container = container;
        this.plan = plan;
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
    }

    render() {
        const progress = calculatePlanProgress(this.plan);
        
        this.container.innerHTML = `
            <div class="training-plan">
                <div class="plan-header">
                    <div class="plan-title">
                        <h2>План тренировок</h2>
                        <p class="plan-dates">
                            ${formatWorkoutDate(this.plan.start_date)} - ${formatWorkoutDate(this.plan.end_date)}
                        </p>
                    </div>
                    <div class="plan-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress.completionRate}%"></div>
                        </div>
                        <div class="progress-stats">
                            <span class="completed">${progress.completed}/${progress.total}</span>
                            <span class="success-rate">${progress.successRate.toFixed(1)}% успешных</span>
                        </div>
                    </div>
                </div>

                <div class="plan-sections">
                    <div class="plan-summary">
                        <h3>Общая информация</h3>
                        <p>${this.plan.summary}</p>
                    </div>

                    <div class="weekly-structure">
                        <h3>Структура по неделям</h3>
                        <div class="weeks-grid">
                            ${Object.entries(this.plan.weekly_structure).map(([week, data]) => `
                                <div class="week-card ${week === `week_${this.plan.current_week}` ? 'current' : ''}">
                                    <div class="week-header">
                                        <h4>Неделя ${week.split('_')[1]}</h4>
                                        <span class="week-focus">${data.focus}</span>
                                    </div>
                                    <div class="week-stats">
                                        <div class="total-distance">
                                            <span class="label">Дистанция:</span>
                                            <span class="value">${data.total_distance} км</span>
                                        </div>
                                        <div class="intensity-distribution">
                                            <div class="intensity-bar">
                                                <div class="easy" style="width: ${data.intensity_distribution.easy}"></div>
                                                <div class="moderate" style="width: ${data.intensity_distribution.moderate}"></div>
                                                <div class="hard" style="width: ${data.intensity_distribution.hard}"></div>
                                            </div>
                                            <div class="intensity-legend">
                                                <span class="easy-legend">Легкая</span>
                                                <span class="moderate-legend">Средняя</span>
                                                <span class="hard-legend">Высокая</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="plan-recommendations">
                        <h3>Рекомендации</h3>
                        <div class="recommendations-grid">
                            <div class="recommendation-section">
                                <h4>Питание</h4>
                                <ul>
                                    ${this.plan.recommendations.nutrition.map(rec => `
                                        <li>${rec}</li>
                                    `).join('')}
                                </ul>
                            </div>
                            <div class="recommendation-section">
                                <h4>Восстановление</h4>
                                <ul>
                                    ${this.plan.recommendations.recovery.map(rec => `
                                        <li>${rec}</li>
                                    `).join('')}
                                </ul>
                            </div>
                            <div class="recommendation-section">
                                <h4>Адаптация</h4>
                                <ul>
                                    ${this.plan.recommendations.adaptation.map(rec => `
                                        <li>${rec}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="workouts-section">
                    <h3>Тренировки</h3>
                    <div class="workouts-filter">
                        <button class="filter-btn active" data-filter="all">Все</button>
                        <button class="filter-btn" data-filter="pending">Предстоящие</button>
                        <button class="filter-btn" data-filter="completed">Выполненные</button>
                        <button class="filter-btn" data-filter="key">Ключевые</button>
                    </div>
                    <div class="workouts-container">
                        ${this.renderWorkouts()}
                    </div>
                </div>

                <div class="plan-actions">
                    <button class="btn export-btn" data-format="ical">
                        <i class="fas fa-calendar-alt"></i> Экспорт в календарь
                    </button>
                    <button class="btn share-btn">
                        <i class="fas fa-share-alt"></i> Поделиться планом
                    </button>
                </div>
            </div>
        `;

        // Добавляем стили
        this.addStyles();
    }

    renderWorkouts() {
        const workoutsByWeek = groupWorkoutsByWeek(this.plan.planned_workouts);
        
        return Object.entries(workoutsByWeek).map(([weekStart, workouts]) => `
            <div class="week-workouts">
                <h4 class="week-header">${formatWorkoutDate(weekStart)}</h4>
                <div class="workouts-grid">
                    ${workouts.map(workout => {
                        const workoutCard = new WorkoutCard(workout);
                        return workoutCard.render();
                    }).join('')}
                </div>
            </div>
        `).join('');
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .training-plan {
                max-width: 1200px;
                margin: 0 auto;
                padding: 2rem;
            }

            .plan-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
            }

            .plan-progress {
                width: 200px;
            }

            .progress-bar {
                height: 8px;
                background: var(--light-purple);
                border-radius: 4px;
                overflow: hidden;
            }

            .progress-fill {
                height: 100%;
                background: var(--primary-purple);
                transition: width 0.3s ease;
            }

            .progress-stats {
                display: flex;
                justify-content: space-between;
                margin-top: 0.5rem;
                font-size: 0.9rem;
                color: #666;
            }

            .plan-sections {
                display: grid;
                gap: 2rem;
                margin-bottom: 2rem;
            }

            .week-card {
                background: white;
                border-radius: 12px;
                padding: 1.5rem;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            .week-card.current {
                border: 2px solid var(--primary-purple);
            }

            .intensity-distribution {
                margin-top: 1rem;
            }

            .intensity-bar {
                height: 8px;
                background: #f0f0f0;
                border-radius: 4px;
                overflow: hidden;
                display: flex;
            }

            .intensity-bar .easy {
                background: #4caf50;
            }

            .intensity-bar .moderate {
                background: #ff9800;
            }

            .intensity-bar .hard {
                background: #f44336;
            }

            .intensity-legend {
                display: flex;
                justify-content: space-between;
                margin-top: 0.5rem;
                font-size: 0.8rem;
                color: #666;
            }

            .workouts-filter {
                display: flex;
                gap: 1rem;
                margin-bottom: 1rem;
            }

            .filter-btn {
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 20px;
                background: var(--light-purple);
                color: var(--primary-purple);
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .filter-btn.active {
                background: var(--primary-purple);
                color: white;
            }

            .workouts-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 1rem;
            }

            .plan-actions {
                display: flex;
                gap: 1rem;
                margin-top: 2rem;
                justify-content: center;
            }

            .btn {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 25px;
                background: var(--primary-purple);
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                transition: all 0.2s ease;
            }

            .btn:hover {
                background: var(--dark-purple);
            }

            @media (max-width: 768px) {
                .plan-header {
                    flex-direction: column;
                    gap: 1rem;
                }

                .plan-progress {
                    width: 100%;
                }

                .workouts-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents() {
        // Фильтрация тренировок
        const filterButtons = this.container.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterWorkouts(btn.dataset.filter);
            });
        });

        // Экспорт плана
        const exportBtn = this.container.querySelector('.export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportPlan(exportBtn.dataset.format));
        }

        // Поделиться планом
        const shareBtn = this.container.querySelector('.share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.sharePlan());
        }
    }

    filterWorkouts(filter) {
        const workouts = this.container.querySelectorAll('.workout-card');
        workouts.forEach(workout => {
            const status = workout.dataset.status;
            const isKey = workout.classList.contains('key-workout');
            
            switch (filter) {
                case 'pending':
                    workout.style.display = status === 'pending' ? 'block' : 'none';
                    break;
                case 'completed':
                    workout.style.display = status === 'completed' ? 'block' : 'none';
                    break;
                case 'key':
                    workout.style.display = isKey ? 'block' : 'none';
                    break;
                default:
                    workout.style.display = 'block';
            }
        });
    }

    async exportPlan(format) {
        try {
            const response = await fetch(`/api/v1/training-plan/export?format=${format}`, {
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to export plan');
            }

            const data = await response.json();
            window.open(data.url, '_blank');
        } catch (error) {
            console.error('Error exporting plan:', error);
            alert('Не удалось экспортировать план. Пожалуйста, попробуйте позже.');
        }
    }

    async sharePlan() {
        try {
            const shareUrl = `${window.location.origin}/share/plan/${this.plan.id}`;
            
            if (navigator.share) {
                await navigator.share({
                    title: 'Мой план тренировок',
                    text: 'Посмотрите мой план тренировок!',
                    url: shareUrl
                });
            } else {
                await navigator.clipboard.writeText(shareUrl);
                alert('Ссылка скопирована в буфер обмена');
            }
        } catch (error) {
            console.error('Error sharing plan:', error);
            alert('Не удалось поделиться планом');
        }
    }
} 