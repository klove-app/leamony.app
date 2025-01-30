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

            // Добавляем сырой ответ от API
            const rawResponse = document.createElement('pre');
            rawResponse.className = 'raw-response';
            rawResponse.textContent = JSON.stringify(plan, null, 2);
            planContainer.appendChild(rawResponse);

            // Добавляем обработчики для разворачивания/сворачивания тренировок
            planContainer.querySelectorAll('.workout-card').forEach(card => {
                const header = card.querySelector('.workout-header');
                const body = card.querySelector('.workout-details');
                body.style.display = 'none';
                
                header.addEventListener('click', () => {
                    const isExpanded = body.style.display !== 'none';
                    body.style.display = isExpanded ? 'none' : 'block';
                    header.classList.toggle('expanded', !isExpanded);
                });
            });
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
        // Форматируем дату для отображения
        const formatDate = (dateStr) => {
            return new Date(dateStr).toLocaleDateString('ru-RU', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            });
        };

        // Группируем тренировки по неделям
        const workoutsByWeek = plan.plan.reduce((weeks, workout) => {
            const date = new Date(workout.date);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay() + 1);
            const weekKey = weekStart.toISOString().split('T')[0];
            
            if (!weeks[weekKey]) {
                weeks[weekKey] = [];
            }
            weeks[weekKey].push(workout);
            return weeks;
        }, {});

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

                <div class="weeks-container">
                    ${Object.entries(workoutsByWeek).map(([weekStart, workouts], weekIndex) => `
                        <div class="week-block">
                            <h3>Неделя ${weekIndex + 1}</h3>
                            <div class="workouts-grid">
                                ${workouts.map(workout => this.renderWorkout(workout)).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderWorkout(workout) {
        // Форматируем дату
        const date = new Date(workout.date);
        const formattedDate = date.toLocaleDateString('ru-RU', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });

        return `
            <div class="workout-card ${workout.key_workout ? 'key-workout' : ''}">
                <div class="workout-header">
                    <div class="workout-date">${formattedDate}</div>
                    <div class="workout-info">
                        <div class="workout-type">${this.translateWorkoutType(workout.type)}</div>
                        <div class="workout-main-stats">
                            ${workout.distance ? `🏃 ${workout.distance} км` : ''}
                            ${workout.duration_min ? `⏱️ ${workout.duration_min} мин` : ''}
                            ${workout.target_pace ? `⚡ ${workout.target_pace}` : ''}
                            ${workout.intensity ? `💪 ${this.translateIntensity(workout.intensity)}` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="workout-details">
                    <div class="workout-description">
                        <h4>Описание тренировки</h4>
                        <p>${workout.description}</p>
                        ${workout.warmup ? `<p><strong>Разминка:</strong> ${workout.warmup}</p>` : ''}
                        ${workout.cooldown ? `<p><strong>Заминка:</strong> ${workout.cooldown}</p>` : ''}
                    </div>
                    
                    ${this.renderIntervals(workout)}
                    ${this.renderNutrition(workout)}
                    ${this.renderRecovery(workout)}
                </div>
            </div>
        `;
    }

    translateWorkoutType(type) {
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

    translateIntensity(intensity) {
        const intensities = {
            'low': 'Низкая интенсивность',
            'moderate': 'Средняя интенсивность',
            'high': 'Высокая интенсивность',
            'very_high': 'Очень высокая интенсивность'
        };
        return intensities[intensity] || intensity;
    }

    renderIntervals(workout) {
        if (!workout.intervals || workout.intervals.length === 0 || 
            !workout.intervals.some(interval => interval.distance || interval.pace || interval.repetitions)) {
            return '';
        }
        
        return `
            <div class="workout-intervals">
                <h4>Интервалы</h4>
                <div class="intervals-list">
                    ${workout.intervals.map(interval => {
                        if (!interval.distance && !interval.pace && !interval.repetitions) return '';
                        return `
                            <div class="interval-item">
                                <div class="interval-main">
                                    ${interval.repetitions ? `${interval.repetitions}x ` : ''}
                                    ${interval.distance || ''}
                                    ${interval.pace ? `@ ${interval.pace}` : ''}
                                </div>
                                ${interval.recovery ? `
                                    <div class="interval-recovery">
                                        Отдых: ${interval.recovery}
                                    </div>
                                ` : ''}
                                ${interval.description ? `
                                    <div class="interval-description">
                                        ${interval.description}
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    renderNutrition(workout) {
        if (!workout.nutrition || (!workout.nutrition.description && !workout.nutrition.recommendations)) {
            return '';
        }
        
        return `
            <div class="workout-nutrition">
                <h4>Питание</h4>
                ${workout.nutrition.timing ? `
                    <div class="nutrition-timing">
                        <span class="timing-icon">🕒</span>
                        <span>${workout.nutrition.timing}</span>
                    </div>
                ` : ''}
                ${workout.nutrition.description ? `
                    <p>${workout.nutrition.description}</p>
                ` : ''}
                ${workout.nutrition.recommendations ? `
                    <div class="nutrition-recommendations">
                        <span class="recommendations-icon">💡</span>
                        <span>${workout.nutrition.recommendations.join(', ')}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderRecovery(workout) {
        if (!workout.recovery || (!workout.recovery.recommendations && !workout.recovery.stretching)) {
            return '';
        }
        
        return `
            <div class="workout-recovery">
                <h4>Восстановление</h4>
                ${workout.recovery.priority ? `
                    <div class="recovery-priority">
                        Приоритет: ${this.translateRecoveryPriority(workout.recovery.priority)}
                    </div>
                ` : ''}
                ${workout.recovery.recommendations ? `
                    <div class="recovery-recommendations">
                        ${workout.recovery.recommendations.map(rec => `
                            <div class="recovery-item">
                                <span class="recovery-icon">✓</span>
                                <span>${rec}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                ${workout.recovery.stretching ? `
                    <div class="stretching-exercises">
                        <h5>Растяжка</h5>
                        <div class="stretching-list">
                            ${workout.recovery.stretching.map(stretch => `
                                <span class="stretch-item">${stretch}</span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    translateRecoveryPriority(priority) {
        const priorities = {
            'low': 'Низкий',
            'medium': 'Средний',
            'high': 'Высокий'
        };
        return priorities[priority] || priority;
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