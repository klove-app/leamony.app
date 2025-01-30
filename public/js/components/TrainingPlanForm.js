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
                        <label>Текущий уровень</label>
                        <select name="current_level" class="form-control" required>
                            <option value="beginner">Начинающий (до 5 км)</option>
                            <option value="intermediate">Средний (5-10 км)</option>
                            <option value="advanced">Продвинутый (более 10 км)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Недельный километраж</label>
                        <input type="number" name="weekly_mileage" class="form-control" min="0" step="1" 
                            placeholder="Например: 20" required />
                    </div>

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
                        <input type="time" name="preferred_workout_time" class="form-control" />
                    </div>

                    <div class="form-group">
                        <label>Ограничения по здоровью</label>
                        <textarea name="injuries" class="form-control" rows="3" 
                            placeholder="Например: травмы, хронические заболевания или другие ограничения"></textarea>
                    </div>

                    <button type="submit" class="btn btn-primary">Сгенерировать план</button>
                </form>
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

        // Проверяем, что выбран хотя бы один день тренировок
        const selectedDays = Array.from(form.querySelectorAll('input[name="preferred_days"]:checked'))
            .map(input => parseInt(input.value));
        
        if (selectedDays.length === 0) {
            this.showError('Пожалуйста, выберите хотя бы один день для тренировок');
            return;
        }

        // Показываем анимацию загрузки
        this.showLoading();

        // Собираем данные из формы
        const request = {
            athlete_context: {
                current_level: formData.get('current_level'),
                weekly_mileage: parseInt(formData.get('weekly_mileage')) || undefined,
                preferred_days: selectedDays,
                goal_type: formData.get('goal_type'),
                preferred_workout_time: formData.get('preferred_workout_time') || undefined,
                injuries: formData.get('injuries') || undefined
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
            
            // Проверяем структуру полученных данных
            if (!this.validatePlanData(plan)) {
                throw new Error('Некорректный формат данных плана тренировок');
            }

            // Создаем контейнер для плана, если его еще нет
            let planContainer = this.container.querySelector('.plan-result');
            if (!planContainer) {
                planContainer = document.createElement('div');
                planContainer.className = 'plan-result';
                this.container.appendChild(planContainer);
            }

            // Отображаем план
            this.renderPlan(plan, planContainer);
        } catch (error) {
            console.error('Ошибка:', error);
            this.showError('Произошла ошибка при генерации плана тренировок');
        }
    }

    validatePlanData(plan) {
        // Проверяем наличие необходимых полей
        if (!plan || typeof plan !== 'object') return false;
        if (!Array.isArray(plan.weekly_mileage)) return false;
        if (!Array.isArray(plan.recommendations)) return false;
        if (!Array.isArray(plan.plan)) return false;
        if (typeof plan.summary !== 'string') return false;

        // Проверяем структуру каждой тренировки
        return plan.plan.every(workout => {
            return (
                workout &&
                typeof workout.date === 'string' &&
                typeof workout.type === 'string' &&
                typeof workout.description === 'string' &&
                (workout.distance === undefined || typeof workout.distance === 'number') &&
                (workout.duration_min === undefined || typeof workout.duration_min === 'number') &&
                (workout.target_pace === undefined || typeof workout.target_pace === 'string')
            );
        });
    }

    showLoading() {
        const planResult = this.container.querySelector('.plan-result') || document.createElement('div');
        planResult.className = 'plan-result';
        planResult.innerHTML = this.renderLoading();
        if (!this.container.contains(planResult)) {
            this.container.appendChild(planResult);
        }
    }

    renderPlan(plan, container) {
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
                    ${plan.plan.map(workout => this.renderWorkout(workout)).join('')}
                </div>
            </div>
        `;
    }

    renderWorkout(workout) {
        return `
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
                    
                    ${this.renderIntervals(workout)}
                </div>
                
                ${this.renderNutrition(workout)}
                ${this.renderRecovery(workout)}
            </div>
        `;
    }

    renderIntervals(workout) {
        if (!workout.intervals) return '';
        
        return `
            <div class="workout-intervals">
                <h4>Интервалы:</h4>
                ${workout.intervals.map(interval => `
                    <div class="interval-item">
                        ${interval.repetitions}x ${interval.distance} @ ${interval.pace}
                        ${interval.recovery ? `<span class="recovery">Отдых: ${interval.recovery}</span>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderNutrition(workout) {
        if (!workout.nutrition) return '';
        
        return `
            <div class="workout-nutrition">
                <h4>Питание:</h4>
                <p>${workout.nutrition.description}</p>
            </div>
        `;
    }

    renderRecovery(workout) {
        if (!workout.recovery) return '';
        
        return `
            <div class="workout-recovery">
                <h4>Восстановление:</h4>
                <p>${workout.recovery.recommendations.join(', ')}</p>
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
        const container = this.container.querySelector('.plan-result') || document.createElement('div');
        container.className = 'plan-result';
        container.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
            </div>
        `;
        if (!this.container.contains(container)) {
            this.container.appendChild(container);
        }
    }

    getToken() {
        return document.cookie
            .split('; ')
            .find(row => row.startsWith('access_token='))
            ?.split('=')[1];
    }
}

export { TrainingPlanForm }; 