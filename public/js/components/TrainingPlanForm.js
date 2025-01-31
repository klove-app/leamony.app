class TrainingPlanForm {
    constructor(container) {
        this.container = container;
        this.init();
    }

    async init() {
        // Сначала проверяем существующий план
        const existingPlan = await this.checkExistingPlan();
        
        if (existingPlan === 'pending') {
            // План в процессе генерации, форма уже скрыта в checkExistingPlan
            return;
        } else if (existingPlan) {
            // План существует, показываем его
            const resultContainer = document.createElement('div');
            resultContainer.className = 'plan-result';
            this.container.appendChild(resultContainer);
            this.renderPlan(existingPlan, resultContainer);
            // Скрываем форму
            this.container.querySelector('.training-plan-form-container')?.classList.add('hidden');
        } else {
            // Плана нет, показываем форму
            this.render();
            this.bindEvents();
        }
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
        console.log('Начинаем валидацию плана:', plan);
        
        // Проверяем наличие необходимых полей согласно документации
        if (!plan || typeof plan !== 'object') {
            console.error('План отсутствует или не является объектом');
            return false;
        }
        
        // Проверяем основные поля
        const requiredFields = ['status', 'plan'];
        for (const field of requiredFields) {
            if (!(field in plan)) {
                console.error(`Отсутствует обязательное поле: ${field}`);
                return false;
            }
        }

        // Проверяем статус
        if (plan.status !== 'completed') {
            console.error('Статус плана не completed:', plan.status);
            return false;
        }

        // Проверяем наличие плана тренировок
        if (!Array.isArray(plan.plan)) {
            console.error('План тренировок не является массивом');
            return false;
        }

        // Проверяем структуру каждой тренировки
        const isValid = plan.plan.every((workout, index) => {
            if (!workout || typeof workout !== 'object') {
                console.error(`Тренировка ${index} не является объектом:`, workout);
                return false;
            }

            const workoutFields = ['date', 'type', 'description'];
            for (const field of workoutFields) {
                if (!(field in workout)) {
                    console.error(`В тренировке ${index} отсутствует поле ${field}`);
                    return false;
                }
                if (typeof workout[field] !== 'string') {
                    console.error(`В тренировке ${index} поле ${field} не является строкой`);
                    return false;
                }
            }

            return true;
        });

        if (!isValid) {
            return false;
        }

        console.log('План успешно прошел валидацию');
        return true;
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
        // Обновляем статус в заголовке на ready
        const header = container.querySelector('.training-plan-header');
        const statusElement = header.querySelector('.plan-status');
        statusElement.className = 'plan-status ready';
        statusElement.innerHTML = '<span class="status-text">ready</span>';
        
        // Добавляем кнопку для разворачивания/сворачивания
        const expandButton = document.createElement('button');
        expandButton.className = 'expand-button';
        expandButton.innerHTML = '▼';
        header.appendChild(expandButton);

        // Создаем контейнер для содержимого плана
        const planContent = document.createElement('div');
        planContent.className = 'training-plan-content';
        planContent.style.display = 'none'; // По умолчанию скрыт
        
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

        planContent.innerHTML = `
            <div class="training-plan">
                <div class="plan-sections">
                    <div class="plan-summary">
                        <h3>Общая информация</h3>
                        <p>${plan.summary}</p>
                    </div>

                    <div class="plan-stats">
                        <h3>Километраж по неделям</h3>
                        <div class="weekly-mileage">
                            ${plan.weekly_mileage.map((km, index) => `
                                <div class="week-stat">
                                    <span>Неделя ${index + 1}</span>
                                    <span>${km} км</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="key-workouts">
                        <h3>Ключевые тренировки</h3>
                        <ul>
                            ${plan.key_workouts_explanation.map(explanation => `
                                <li>${explanation}</li>
                            `).join('')}
                        </ul>
                    </div>

                    <div class="plan-recommendations">
                        <h3>Рекомендации</h3>
                        <ul>
                            ${plan.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>

                    <div class="nutrition-strategy">
                        <h3>Стратегия питания</h3>
                        ${Object.entries(plan.nutrition_strategy).map(([phase, tips]) => `
                            <div class="nutrition-phase">
                                <h4>${this.translatePhase(phase)}</h4>
                                <ul>
                                    ${tips.map(tip => `<li>${tip}</li>`).join('')}
                                </ul>
                            </div>
                        `).join('')}
                    </div>

                    <div class="recovery-strategy">
                        <h3>Стратегия восстановления</h3>
                        ${Object.entries(plan.recovery_strategy).map(([intensity, tips]) => `
                            <div class="recovery-phase">
                                <h4>${this.translateIntensity(intensity)}</h4>
                                <ul>
                                    ${tips.map(tip => `<li>${tip}</li>`).join('')}
                                </ul>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="weeks-container">
                    ${Object.entries(workoutsByWeek).map(([weekStart, workouts], weekIndex) => `
                        <div class="week-block">
                            <h3>Неделя ${weekIndex + 1} - ${plan.periodization[`week_${weekIndex + 1}`] || ''}</h3>
                            <div class="workouts-grid">
                                ${workouts.map(workout => this.renderWorkout(workout)).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Добавляем стили для разворачивания
        const style = document.createElement('style');
        style.textContent = `
            .training-plan-header {
                cursor: pointer;
                transition: background-color 0.2s;
            }

            .training-plan-header:hover {
                background: var(--light-purple);
            }

            .expand-button {
                background: none;
                border: none;
                color: var(--primary-purple);
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0.5rem;
                margin-left: 1rem;
                transition: transform 0.2s;
            }

            .expand-button.expanded {
                transform: rotate(180deg);
            }

            .training-plan-content {
                margin-top: 1rem;
                padding: 1.5rem;
                background: white;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            .plan-sections {
                display: grid;
                gap: 2rem;
                margin-bottom: 2rem;
            }

            .plan-summary {
                background: var(--light-purple);
                padding: 1.5rem;
                border-radius: 8px;
            }

            .weekly-mileage {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
            }

            .week-stat {
                background: white;
                padding: 1rem;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
        `;
        document.head.appendChild(style);

        // Добавляем контейнер с содержимым после заголовка
        container.appendChild(planContent);

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

    async checkExistingPlan() {
        const token = this.getToken();
        if (!token) return null;

        try {
            console.log('Отправляем запрос на /api/v1/ai/training-plan/current');
            const response = await fetch('/api/v1/ai/training-plan/current', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            console.log('Получен ответ:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });

            if (response.ok) {
                const rawText = await response.text();
                console.log('Сырой ответ:', rawText);
                
                let data;
                try {
                    data = JSON.parse(rawText);
                } catch (e) {
                    console.error('Ошибка парсинга JSON:', e);
                    return null;
                }
                
                console.log('Распарсенные данные:', data);
                
                switch(data.status) {
                    case 'completed':
                        // План существует и готов
                        if (data.plan && this.validatePlanData(data.plan)) {
                            console.log('План валиден, возвращаем');
                            return data.plan;
                        }
                        console.log('План не прошел валидацию');
                        return null;
                        
                    case 'pending':
                        // План в процессе генерации
                        console.log('План в процессе генерации');
                        this.showInProgress();
                        this.startStatusCheck();
                        return 'pending';
                        
                    case 'error':
                        // Была ошибка при генерации
                        console.log('Ошибка генерации плана:', data.error);
                        this.showError(data.error || 'Произошла ошибка при генерации плана');
                        return null;
                        
                    case 'not_found':
                        // Плана нет
                        console.log('План не найден');
                        return null;
                        
                    default:
                        console.error('Неизвестный статус плана:', data.status);
                        return null;
                }
            } else if (response.status === 202) {
                // План еще генерируется
                console.log('Получен статус 202 - план генерируется');
                this.showInProgress();
                this.startStatusCheck();
                return 'pending';
            }
            
            // В случае ошибки пытаемся получить текст ошибки
            try {
                const errorText = await response.text();
                console.error('Ошибка ответа:', errorText);
            } catch (e) {
                console.error('Не удалось получить текст ошибки');
            }
            
            return null;
        } catch (error) {
            console.error('Ошибка при проверке существующего плана:', error);
            return null;
        }
    }
}

export { TrainingPlanForm }; 