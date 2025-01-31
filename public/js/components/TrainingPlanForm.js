class TrainingPlanForm {
    constructor(container) {
        this.container = container;
        this.statusCheckInterval = null;
        this.init();
    }

    async init() {
        // Создаем контейнер для результата плана
        const planResult = document.createElement('div');
        planResult.className = 'plan-result';
        this.container.appendChild(planResult);

        // Создаем контейнер для формы
        const formContainer = document.createElement('div');
        formContainer.className = 'form-container';
        this.container.appendChild(formContainer);

        // Проверяем наличие существующего плана
        await this.checkExistingPlan();

        // Рендерим форму
        this.renderForm(formContainer);
    }

    async checkExistingPlan() {
        try {
            const token = this.getToken();
            if (!token) return;

            const response = await fetch('/api/v1/ai/training-plan/current', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const plan = await response.json();
                if (plan && this.validatePlanData(plan)) {
                    // Если план существует, отображаем его и скрываем форму
                    const planResult = this.container.querySelector('.plan-result');
                    const formContainer = this.container.querySelector('.form-container');
                    
                    // Создаем заголовок плана
                    planResult.innerHTML = `
                        <div class="training-plan-header">
                            <div class="plan-info">
                                <span class="plan-title">Ваш план тренировок</span>
                            </div>
                            <div class="plan-status ready">
                                <span class="status-text">ready</span>
                            </div>
                        </div>
                    `;

                    // Рендерим план
                    this.renderPlan(plan, planResult);

                    // Скрываем форму
                    formContainer.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Ошибка при проверке существующего плана:', error);
        }
    }

    renderForm(container) {
        container.innerHTML = `
            <div class="training-plan-form">
                <h2>Получить план тренировок</h2>
                <form id="trainingPlanForm">
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

        // Добавляем обработчики событий формы
        this.attachFormHandlers(container);
    }

    attachFormHandlers(container) {
        const form = container.querySelector('#trainingPlanForm');
        form.addEventListener('submit', this.handleFormSubmit.bind(this));
    }

    async handleFormSubmit(event) {
        event.preventDefault();
        
        // Скрываем форму при отправке
        const formContainer = this.container.querySelector('.form-container');
        formContainer.style.display = 'none';

        const form = event.target;
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
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
            workout_history: []
        };

        try {
            // Отправляем запрос на генерацию плана
            const response = await fetch('/api/v1/ai/training-plan/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // Если запрос принят в обработку
            if (result.status === 'pending') {
                // Показываем сообщение о том, что план в процессе создания
                this.showInProgress();
                // Начинаем периодическую проверку статуса
                this.startStatusCheck();
            } else {
                throw new Error('Неожиданный ответ от сервера');
            }

        } catch (error) {
            console.error('Ошибка при создании плана:', error);
            this.showError('Не удалось создать план тренировок. Пожалуйста, попробуйте позже.');
        }
    }

    showInProgress() {
        const container = this.container.querySelector('.plan-result') || document.createElement('div');
        container.className = 'plan-result';
        
        // Получаем данные из формы
        const form = this.container.querySelector('#trainingPlanForm');
        const formData = new FormData(form);
        const goalType = formData.get('goal_type');
        
        // Получаем имя пользователя из глобального состояния или куки
        const username = document.cookie
            .split('; ')
            .find(row => row.startsWith('username='))
            ?.split('=')[1] || 'Пользователь';
        
        // Форматируем текущую дату
        const currentDate = new Date().toLocaleDateString('ru', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        // Переводим тип цели на русский
        const goalTypeTranslations = {
            'improve_endurance': 'улучшения выносливости',
            'increase_distance': 'увеличения дистанции',
            'improve_speed': 'улучшения скорости',
            'weight_loss': 'снижения веса',
            'marathon_prep': 'подготовки к марафону'
        };

        container.innerHTML = `
            <div class="training-plan-header">
                <div class="plan-title">
                    <h3>Тренировочный план для ${username}</h3>
                    <p>для ${goalTypeTranslations[goalType] || goalType}</p>
                    <p class="plan-date">от ${currentDate}</p>
                </div>
                <div class="plan-status preparing">
                    <span class="status-text">preparing</span>
                </div>
            </div>
        `;

        if (!this.container.contains(container)) {
            this.container.appendChild(container);
        }

        // Добавляем стили
        const style = document.createElement('style');
        style.textContent = `
            .training-plan-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem 1.5rem;
                background: var(--light-purple);
                border-radius: 12px;
                margin-bottom: 1rem;
                border: 1px solid var(--primary-purple);
            }

            .plan-title {
                flex: 1;
            }

            .plan-title h3 {
                margin: 0;
                color: var(--primary-purple);
                font-size: 1.2rem;
                font-weight: 600;
            }

            .plan-title p {
                margin: 0.25rem 0 0;
                color: #666;
                font-size: 0.9rem;
            }

            .plan-date {
                color: #888 !important;
                font-size: 0.8rem !important;
            }

            .plan-status {
                padding: 0.5rem 1rem;
                border-radius: 20px;
                font-size: 0.9rem;
                font-weight: 500;
            }

            .plan-status.preparing {
                background: #FFF3E0;
                color: #FF9800;
            }

            .plan-status.ready {
                background: #E8F5E9;
                color: #4CAF50;
            }

            .plan-status.error {
                background: #FFEBEE;
                color: #F44336;
            }
        `;
        document.head.appendChild(style);
    }

    async startStatusCheck() {
        // Интервал проверки статуса (30 секунд)
        const CHECK_INTERVAL = 30000;
        
        const checkStatus = async () => {
            try {
                const response = await fetch('/api/v1/ai/training-plan/status', {
                    headers: {
                        'Authorization': `Bearer ${this.getToken()}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                
                switch (result.status) {
                    case 'completed':
                        clearInterval(this.statusCheckInterval);
                        if (result.plan && this.validatePlanData(result.plan)) {
                            this.renderPlan(result.plan, this.container.querySelector('.plan-result'));
                        } else {
                            throw new Error('Некорректный формат данных плана тренировок');
                        }
                        break;
                        
                    case 'error':
                        clearInterval(this.statusCheckInterval);
                        this.showError(result.error || 'Не удалось создать план тренировок. Пожалуйста, попробуйте позже.');
                        break;
                        
                    case 'pending':
                        // Продолжаем ожидание
                        break;
                        
                    default:
                        clearInterval(this.statusCheckInterval);
                        this.showError('Неизвестный статус плана тренировок');
                }
                
            } catch (error) {
                console.error('Ошибка при проверке статуса:', error);
                // При ошибке делаем еще несколько попыток, потом останавливаем
                this.statusCheckRetries = (this.statusCheckRetries || 0) + 1;
                if (this.statusCheckRetries >= 5) {
                    clearInterval(this.statusCheckInterval);
                    this.showError('Не удается проверить статус плана. Пожалуйста, обновите страницу позже.');
                }
            }
        };

        // Запускаем периодическую проверку
        this.statusCheckInterval = setInterval(checkStatus, CHECK_INTERVAL);
        
        // Сразу делаем первую проверку
        await checkStatus();
    }

    // Очищаем интервал при уничтожении компонента
    destroy() {
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
        }
    }

    updateLoadingText(text) {
        const loadingText = this.container.querySelector('.loading-text');
        if (loadingText) {
            loadingText.innerHTML = text + '<span class="loading-dots"></span>';
        }
    }

    validatePlanData(plan) {
        // Проверяем наличие необходимых полей согласно документации
        if (!plan || typeof plan !== 'object') return false;
        if (!Array.isArray(plan.plan)) return false;
        if (typeof plan.summary !== 'string') return false;
        if (!Array.isArray(plan.weekly_mileage)) return false;
        if (!Array.isArray(plan.recommendations)) return false;
        if (!Array.isArray(plan.key_workouts_explanation)) return false;
        if (typeof plan.periodization !== 'object') return false;
        if (typeof plan.nutrition_strategy !== 'object') return false;
        if (typeof plan.recovery_strategy !== 'object') return false;

        // Проверяем структуру каждой тренировки
        return plan.plan.every(workout => {
            return (
                workout &&
                typeof workout.date === 'string' &&
                typeof workout.type === 'string' &&
                typeof workout.description === 'string' &&
                typeof workout.intensity === 'string' &&
                (workout.distance === undefined || typeof workout.distance === 'number') &&
                (workout.duration_min === undefined || typeof workout.duration_min === 'number') &&
                (workout.target_pace === undefined || typeof workout.target_pace === 'string') &&
                typeof workout.key_workout === 'boolean'
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
        // Обновляем статус в заголовке
        const header = container.querySelector('.training-plan-header');
        const statusElement = header.querySelector('.plan-status');
        statusElement.className = 'plan-status ready';
        statusElement.innerHTML = '<span class="status-text">ready</span>';

        // Создаем контейнер для содержимого плана
        const planContent = document.createElement('div');
        planContent.className = 'training-plan-content';
        planContent.style.display = 'none';

        planContent.innerHTML = `
            <div class="training-plan">
                <!-- Общая информация о плане -->
                <div class="plan-overview">
                    <div class="overview-header">
                        <h3>Общая информация</h3>
                        <div class="overview-summary">${plan.summary}</div>
                    </div>
                    <div class="overview-stats">
                        <div class="stat-block">
                            <div class="stat-title">Километраж по неделям</div>
                            <div class="weekly-stats">
                                ${plan.weekly_mileage.map((km, index) => `
                                    <div class="week-stat">
                                        <span class="week-label">Неделя ${index + 1}</span>
                                        <span class="week-value">${km} км</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Ключевые тренировки -->
                <div class="key-workouts-section">
                    <h3>Ключевые тренировки</h3>
                    <div class="key-workouts-list">
                        ${plan.key_workouts_explanation.map(workout => `
                            <div class="key-workout-item">
                                <span class="workout-icon">🎯</span>
                                <span class="workout-text">${workout}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Общие рекомендации -->
                <div class="recommendations-section">
                    <h3>Общие рекомендации</h3>
                    <div class="recommendations-list">
                        ${plan.recommendations.map(rec => `
                            <div class="recommendation-item">
                                <span class="recommendation-icon">✓</span>
                                <span class="recommendation-text">${rec}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Стратегии питания и восстановления -->
                <div class="strategies-section">
                    <div class="nutrition-strategy">
                        <h3>Стратегия питания</h3>
                        ${Object.entries(plan.nutrition_strategy).map(([phase, tips]) => `
                            <div class="strategy-block">
                                <h4>${this.translatePhase(phase)}</h4>
                                <ul class="strategy-list">
                                    ${tips.map(tip => `<li>${tip}</li>`).join('')}
                                </ul>
                            </div>
                        `).join('')}
                    </div>
                    <div class="recovery-strategy">
                        <h3>Стратегия восстановления</h3>
                        ${Object.entries(plan.recovery_strategy).map(([intensity, tips]) => `
                            <div class="strategy-block">
                                <h4>${this.translateIntensity(intensity)}</h4>
                                <ul class="strategy-list">
                                    ${tips.map(tip => `<li>${tip}</li>`).join('')}
                                </ul>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Детальный план по неделям -->
                <div class="weekly-plan-section">
                    <h3>План тренировок по неделям</h3>
                    ${Object.entries(this.groupWorkoutsByWeek(plan.plan)).map(([weekStart, workouts], weekIndex) => `
                        <div class="week-block">
                            <div class="week-header">
                                <h4>Неделя ${weekIndex + 1}</h4>
                                <div class="week-focus">${plan.periodization[`week_${weekIndex + 1}`] || ''}</div>
                            </div>
                            <div class="workouts-grid">
                                ${workouts.map(workout => this.renderWorkout(workout)).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Добавляем стили
        const style = document.createElement('style');
        style.textContent = `
            .training-plan-content {
                margin-top: 1rem;
                padding: 1.5rem;
                background: white;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(107, 77, 230, 0.1);
            }

            .plan-overview {
                background: var(--light-purple);
                border-radius: 12px;
                padding: 1.5rem;
                margin-bottom: 2rem;
            }

            .overview-header {
                margin-bottom: 1.5rem;
            }

            .overview-header h3 {
                color: var(--primary-purple);
                margin: 0 0 1rem 0;
            }

            .overview-summary {
                font-size: 1.1rem;
                line-height: 1.5;
                color: #444;
            }

            .weekly-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-top: 1rem;
            }

            .week-stat {
                background: white;
                padding: 1rem;
                border-radius: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .week-value {
                font-weight: 600;
                color: var(--primary-purple);
            }

            .key-workouts-section,
            .recommendations-section,
            .strategies-section,
            .weekly-plan-section {
                background: white;
                border-radius: 12px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
                border: 1px solid var(--light-purple);
            }

            .key-workout-item,
            .recommendation-item {
                display: flex;
                align-items: flex-start;
                margin-bottom: 1rem;
                padding: 0.75rem;
                background: var(--light-purple);
                border-radius: 8px;
            }

            .workout-icon,
            .recommendation-icon {
                flex-shrink: 0;
                margin-right: 1rem;
                font-size: 1.2rem;
            }

            .strategies-section {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1.5rem;
            }

            .strategy-block {
                background: var(--light-purple);
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 1rem;
            }

            .strategy-block h4 {
                color: var(--primary-purple);
                margin: 0 0 0.75rem 0;
            }

            .strategy-list {
                margin: 0;
                padding-left: 1.5rem;
            }

            .strategy-list li {
                margin-bottom: 0.5rem;
            }

            .week-block {
                background: var(--light-purple);
                border-radius: 12px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
            }

            .week-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }

            .week-header h4 {
                color: var(--primary-purple);
                margin: 0;
            }

            .week-focus {
                color: var(--primary-pink);
                font-weight: 500;
            }

            .workouts-grid {
                display: grid;
                gap: 1rem;
            }

            @media (max-width: 768px) {
                .strategies-section {
                    grid-template-columns: 1fr;
                }

                .week-header {
                    flex-direction: column;
                    align-items: flex-start;
                }

                .week-focus {
                    margin-top: 0.5rem;
                }
            }
        `;
        document.head.appendChild(style);

        // Добавляем контейнер с содержимым после заголовка
        container.appendChild(planContent);

        // Добавляем кнопку для разворачивания/сворачивания
        const expandButton = document.createElement('button');
        expandButton.className = 'expand-button';
        expandButton.innerHTML = '▼';
        header.appendChild(expandButton);

        // Добавляем обработчик для разворачивания/сворачивания
        header.addEventListener('click', () => {
            const isExpanded = planContent.style.display !== 'none';
            planContent.style.display = isExpanded ? 'none' : 'block';
            expandButton.className = `expand-button${isExpanded ? '' : ' expanded'}`;
        });
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
                    
                    ${this.renderHeartRateZones(workout.heart_rate_zones)}
                    ${this.renderIntervals(workout.intervals)}
                    ${this.renderNutrition(workout.nutrition)}
                    ${this.renderRecovery(workout.recovery)}
                    ${this.renderEquipment(workout.equipment)}
                    ${workout.notes ? `
                        <div class="workout-notes">
                            <h4>Дополнительные заметки</h4>
                            <p>${workout.notes}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderHeartRateZones(zones) {
        if (!zones) return '';
        
        return `
            <div class="heart-rate-zones">
                <h4>Целевые зоны пульса</h4>
                <div class="zones-list">
                    ${Object.entries(zones).map(([phase, range]) => `
                        <div class="zone-item">
                            <span class="zone-phase">${this.translatePhase(phase)}:</span>
                            <span class="zone-range">${range} уд/мин</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderEquipment(equipment) {
        if (!equipment || equipment.length === 0) return '';
        
        return `
            <div class="workout-equipment">
                <h4>Необходимое снаряжение</h4>
                <div class="equipment-list">
                    ${equipment.map(item => `
                        <span class="equipment-item">${item}</span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderIntervals(intervals) {
        if (!intervals || intervals.length === 0) return '';
        
        return `
            <div class="workout-intervals">
                <h4>Интервалы</h4>
                <div class="intervals-list">
                    ${intervals.map(interval => `
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
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderNutrition(nutrition) {
        if (!nutrition) return '';
        
        return `
            <div class="workout-nutrition">
                <h4>Питание</h4>
                ${nutrition.timing ? `
                    <div class="nutrition-timing">
                        <span class="timing-icon">🕒</span>
                        <span>${nutrition.timing}</span>
                    </div>
                ` : ''}
                ${nutrition.description ? `
                    <p>${nutrition.description}</p>
                ` : ''}
                ${nutrition.recommendations ? `
                    <div class="nutrition-recommendations">
                        <h5>Рекомендации:</h5>
                        <ul>
                            ${nutrition.recommendations.map(rec => `
                                <li>${rec}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
                ${nutrition.supplements ? `
                    <div class="nutrition-supplements">
                        <h5>Добавки:</h5>
                        <ul>
                            ${nutrition.supplements.map(supp => `
                                <li>${supp}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderRecovery(recovery) {
        if (!recovery) return '';
        
        return `
            <div class="workout-recovery">
                <h4>Восстановление</h4>
                ${recovery.priority ? `
                    <div class="recovery-priority">
                        Приоритет: ${this.translateRecoveryPriority(recovery.priority)}
                    </div>
                ` : ''}
                ${recovery.recommendations ? `
                    <div class="recovery-recommendations">
                        <h5>Рекомендации:</h5>
                        <ul>
                            ${recovery.recommendations.map(rec => `
                                <li>${rec}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
                ${recovery.stretching ? `
                    <div class="stretching-exercises">
                        <h5>Растяжка:</h5>
                        <ul>
                            ${recovery.stretching.map(stretch => `
                                <li>${stretch}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
                ${recovery.recovery_activities ? `
                    <div class="recovery-activities">
                        <h5>Дополнительные активности:</h5>
                        <ul>
                            ${recovery.recovery_activities.map(activity => `
                                <li>${activity}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
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

    translatePhase(phase) {
        const phases = {
            'pre_workout': 'Перед тренировкой',
            'during_workout': 'Во время тренировки',
            'post_workout': 'После тренировки',
            'recovery_day': 'В день отдыха',
            'race_day': 'В день соревнований'
        };
        return phases[phase] || phase;
    }

    // Вспомогательная функция для группировки тренировок по неделям
    groupWorkoutsByWeek(workouts) {
        return workouts.reduce((weeks, workout) => {
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
    }
}

export { TrainingPlanForm }; 