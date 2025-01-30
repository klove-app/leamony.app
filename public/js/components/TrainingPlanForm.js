class TrainingPlanForm {
    constructor(container) {
        this.container = container;
        this.render();
        this.bindEvents();
    }

    render() {
        this.container.innerHTML = `
            <div class="training-plan-form-container">
                <h2>Генерация плана тренировок</h2>
                <form id="trainingPlanForm" class="training-plan-form">
                    <div class="form-section">
                        <h3>Основная информация</h3>
                        <div class="form-group">
                            <label>Уровень подготовки</label>
                            <select name="current_level" required>
                                <option value="beginner">Начинающий</option>
                                <option value="intermediate">Средний</option>
                                <option value="advanced">Продвинутый</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Недельный километраж</label>
                            <input type="number" name="weekly_mileage" min="0" step="1" required>
                        </div>

                        <div class="form-group">
                            <label>Тип цели</label>
                            <select name="goal_type" required>
                                <option value="5k">5 км</option>
                                <option value="10k">10 км</option>
                                <option value="half_marathon">Полумарафон</option>
                                <option value="marathon">Марафон</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Дата цели</label>
                            <input type="date" name="goal_date" required>
                        </div>

                        <div class="form-group">
                            <label>Целевое время</label>
                            <input type="time" name="goal_time" step="1" required>
                        </div>
                    </div>

                    <div class="form-section">
                        <h3>Предпочтения</h3>
                        <div class="form-group">
                            <label>Предпочитаемые дни тренировок</label>
                            <div class="days-selector">
                                <label><input type="checkbox" name="preferred_days" value="1"> Пн</label>
                                <label><input type="checkbox" name="preferred_days" value="2"> Вт</label>
                                <label><input type="checkbox" name="preferred_days" value="3"> Ср</label>
                                <label><input type="checkbox" name="preferred_days" value="4"> Чт</label>
                                <label><input type="checkbox" name="preferred_days" value="5"> Пт</label>
                                <label><input type="checkbox" name="preferred_days" value="6"> Сб</label>
                                <label><input type="checkbox" name="preferred_days" value="0"> Вс</label>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Предпочитаемое время тренировок</label>
                            <input type="time" name="preferred_workout_time">
                        </div>

                        <div class="form-group">
                            <label>Травмы/ограничения</label>
                            <textarea name="injuries"></textarea>
                        </div>
                    </div>

                    <div class="form-section">
                        <h3>Период планирования</h3>
                        <div class="form-group">
                            <label>Дата начала</label>
                            <input type="date" name="start_date" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Дата окончания</label>
                            <input type="date" name="end_date" required>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Сгенерировать план</button>
                    </div>
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

        // Собираем данные из формы
        const request = {
            athlete_context: {
                current_level: formData.get('current_level'),
                weekly_mileage: parseInt(formData.get('weekly_mileage')),
                preferred_days: Array.from(form.querySelectorAll('input[name="preferred_days"]:checked'))
                    .map(input => parseInt(input.value)),
                goal_type: formData.get('goal_type'),
                goal_date: formData.get('goal_date'),
                goal_time: formData.get('goal_time'),
                injuries: formData.get('injuries') || undefined,
                preferred_workout_time: formData.get('preferred_workout_time') || undefined
            },
            start_date: formData.get('start_date'),
            end_date: formData.get('end_date'),
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