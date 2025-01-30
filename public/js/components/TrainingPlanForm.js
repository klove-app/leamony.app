class TrainingPlanForm {
    constructor(container) {
        this.container = container;
        this.render();
        this.bindEvents();
    }

    render() {
        this.container.innerHTML = `
            <div class="training-plan-form-container">
                <h2>Получить план тренировок</h2>
                <form id="trainingPlanForm" class="training-plan-form">
                    <div class="form-group">
                        <label>Основная цель</label>
                        <select name="goal_type" class="form-control" required>
                            <option value="improve_endurance">Улучшить выносливость</option>
                            <option value="increase_distance">Увеличить дистанцию</option>
                            <option value="improve_speed">Улучшить скорость</option>
                            <option value="weight_loss">Снижение веса</option>
                            <option value="marathon_prep">Подготовка к марафону</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Количество тренировок в неделю</label>
                        <select name="training_days" class="form-control" required>
                            <option value="2">2 дня</option>
                            <option value="3" selected>3 дня</option>
                            <option value="4">4 дня</option>
                            <option value="5">5 дней</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Текущий уровень</label>
                        <select name="current_level" class="form-control" required>
                            <option value="beginner">Начинающий (до 5 км)</option>
                            <option value="intermediate">Средний (5-10 км)</option>
                            <option value="advanced">Продвинутый (более 10 км)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Дополнительные пожелания</label>
                        <textarea name="notes" class="form-control" rows="3" 
                            placeholder="Например: предпочитаемое время тренировок, ограничения по здоровью, специфические цели"></textarea>
                    </div>

                    <button type="submit" class="btn btn-primary">Сгенерировать план</button>
                </form>
                <div id="planResult" class="plan-result"></div>
            </div>
        `;
    }

    bindEvents() {
        const form = this.container.querySelector('#trainingPlanForm');
        form.addEventListener('submit', this.handleSubmit.bind(this));
    }

    async handleSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const planResult = this.container.querySelector('#planResult');

        // Показываем анимацию загрузки
        planResult.innerHTML = this.renderLoading();
        planResult.style.display = 'block';

        // Собираем данные из формы
        const request = {
            athlete_context: {
                current_level: formData.get('current_level'),
                training_days: parseInt(formData.get('training_days')),
                goal_type: formData.get('goal_type'),
                notes: formData.get('notes') || undefined
            },
            // Используем текущую дату как начало и +30 дней как конец
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
            workout_history: [] // Пока оставим пустым, потом добавим реальные данные
        };

        try {
            const response = await fetch('/api/v1/ai/training-plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                throw new Error('Ошибка при генерации плана');
            }

            const plan = await response.json();
            this.renderPlan(plan);
        } catch (error) {
            console.error('Ошибка:', error);
            this.showError('Произошла ошибка при генерации плана тренировок');
        }
    }

    getToken() {
        return document.cookie
            .split('; ')
            .find(row => row.startsWith('access_token='))
            ?.split('=')[1];
    }

    renderPlan(plan) {
        const container = this.container.querySelector('#planResult');
        container.innerHTML = `
            <div class="training-plan">
                <div class="plan-header">
                    <h2>Ваш план тренировок</h2>
                    <p class="plan-summary">${plan.summary}</p>
                </div>

                <div class="plan-stats">
                    <div class="stat-item">
                        <span class="stat-label">Километраж по неделям</span>
                        <div class="weekly-mileage">
                            ${plan.weekly_mileage.map((km, index) => `
                                <div class="week-stat">
                                    <span>Неделя ${index + 1}</span>
                                    <span>${km} км</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="plan-recommendations">
                    <h3>Рекомендации</h3>
                    <ul>
                        ${plan.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>

                <div class="workouts-grid">
                    ${plan.plan.map(workout => `
                        <div class="workout-card ${workout.key_workout ? 'key-workout' : ''}">
                            <div class="workout-header">
                                <div class="workout-date">${new Date(workout.date).toLocaleDateString('ru-RU', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short'
                                })}</div>
                                <div class="workout-type">${workout.type}</div>
                            </div>
                            
                            <div class="workout-body">
                                ${workout.distance ? `<div class="workout-distance">${workout.distance} км</div>` : ''}
                                ${workout.duration_min ? `<div class="workout-duration">${workout.duration_min} мин</div>` : ''}
                                ${workout.target_pace ? `<div class="workout-pace">Темп: ${workout.target_pace}</div>` : ''}
                                
                                <div class="workout-description">${workout.description}</div>
                                
                                ${workout.intervals ? `
                                    <div class="workout-intervals">
                                        <h4>Интервалы:</h4>
                                        ${workout.intervals.map(interval => `
                                            <div class="interval-item">
                                                ${interval.repetitions}x ${interval.distance} @ ${interval.pace}
                                                ${interval.recovery ? `<span class="recovery">Отдых: ${interval.recovery}</span>` : ''}
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                            
                            ${workout.nutrition ? `
                                <div class="workout-nutrition">
                                    <h4>Питание:</h4>
                                    <p>${workout.nutrition.description}</p>
                                </div>
                            ` : ''}
                            
                            ${workout.recovery ? `
                                <div class="workout-recovery">
                                    <h4>Восстановление:</h4>
                                    <p>${workout.recovery.recommendations.join(', ')}</p>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderLoading() {
        const tips = [
            "План тренировок учитывает ваш текущий уровень подготовки",
            "Программа адаптируется под ваши предпочтения по дням недели",
            "Интенсивность тренировок подбирается индивидуально",
            "Учитываются периоды восстановления между тренировками",
            "План включает рекомендации по питанию и восстановлению"
        ];

        return `
            <div class="loading-container">
                <div class="loading-animation"></div>
                <div class="loading-text">
                    Генерируем ваш персональный план тренировок<span class="loading-dots"></span>
                </div>
                <div class="loading-subtext">
                    Это может занять около минуты. Мы учитываем множество факторов для создания оптимального плана.
                </div>
                <div class="loading-progress">
                    <div class="loading-progress-bar"></div>
                </div>
                <div class="loading-tips">
                    <h4>Знаете ли вы?</h4>
                    <ul>
                        ${tips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    showError(message) {
        const container = this.container.querySelector('#planResult');
        container.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
            </div>
        `;
    }
}

export default TrainingPlanForm; 