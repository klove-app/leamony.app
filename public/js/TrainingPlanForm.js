class TrainingPlanForm {
    constructor(container) {
        this.container = container;
        this.init();
    }

    async checkExistingPlan() {
        try {
            console.group('Проверка существующего плана');
            const token = getToken();
            if (!token) {
                console.error('Токен отсутствует');
                return null;
            }

            console.log('Отправляем запрос на /api/v1/ai/training-plan/current');
            const response = await fetch('/api/v1/ai/training-plan/current', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                console.error('Ошибка при запросе плана:', response.status);
                return null;
            }

            const data = await response.json();
            console.log('Получен ответ:', data);

            // Проверяем статус ответа
            if (!data.status) {
                console.error('Отсутствует поле status в ответе');
                return null;
            }

            // Возвращаем данные в зависимости от статуса
            switch (data.status) {
                case 'completed':
                    if (this.validatePlanData(data)) {
                        return data;
                    }
                    return null;
                case 'pending':
                    return { status: 'pending' };
                case 'not_found':
                    return { status: 'not_found' };
                case 'error':
                    console.error('Ошибка генерации плана:', data.error);
                    return { status: 'error', message: data.error };
                default:
                    console.error('Неизвестный статус плана:', data.status);
                    return null;
            }
        } catch (error) {
            console.error('Ошибка при проверке плана:', error);
            return null;
        } finally {
            console.groupEnd();
        }
    }

    validatePlanData(data) {
        console.group('Валидация данных плана');
        console.log('Начало валидации плана:', data);

        try {
            // Проверяем наличие обязательных полей в ответе
            if (!data || typeof data !== 'object') {
                console.error('Ответ отсутствует или не является объектом');
                return false;
            }

            // Проверяем наличие плана
            if (!data.plan || typeof data.plan !== 'object') {
                console.error('План отсутствует или имеет неверный формат');
                return false;
            }

            // Проверяем наличие массива тренировок
            if (!Array.isArray(data.plan.plan)) {
                console.error('План не содержит массива тренировок');
                return false;
            }

            // Проверяем каждую тренировку в плане
            for (const workout of data.plan.plan) {
                if (!this.validateWorkout(workout)) {
                    return false;
                }
            }

            console.log('Валидация плана успешно завершена');
            return true;
        } catch (error) {
            console.error('Ошибка при валидации плана:', error);
            return false;
        } finally {
            console.groupEnd();
        }
    }

    validateWorkout(workout) {
        console.log('Проверка тренировки:', workout);
        
        const requiredFields = ['date', 'type', 'distance', 'duration_min', 'target_pace', 'description'];
        
        for (const field of requiredFields) {
            if (!(field in workout)) {
                console.error(`Отсутствует обязательное поле ${field} в тренировке`);
                return false;
            }
        }
        
        return true;
    }

    async init() {
        try {
            console.group('Инициализация формы плана тренировок');
            
            // Проверяем существующий план
            const existingPlan = await this.checkExistingPlan();
            console.log('Существующий план:', existingPlan);
            
            if (!existingPlan) {
                this.showError('Не удалось загрузить план тренировок');
                return;
            }

            switch (existingPlan.status) {
                case 'completed':
                    this.displayPlan(existingPlan.plan);
                    break;
                case 'pending':
                    this.showLoadingState();
                    // Запускаем периодическую проверку статуса
                    this.startStatusCheck();
                    break;
                case 'error':
                    this.showError(existingPlan.message || 'Ошибка при генерации плана');
                    break;
                case 'not_found':
                default:
                    this.showForm();
                    break;
            }
            
            console.log('Инициализация формы завершена');
        } catch (error) {
            console.error('Ошибка при инициализации формы:', error);
            this.showError('Произошла ошибка при загрузке плана тренировок');
        } finally {
            console.groupEnd();
        }
    }

    startStatusCheck() {
        this.statusCheckInterval = setInterval(async () => {
            const plan = await this.checkExistingPlan();
            if (!plan) {
                clearInterval(this.statusCheckInterval);
                this.showError('Ошибка при проверке статуса плана');
                return;
            }

            if (plan.status === 'completed') {
                clearInterval(this.statusCheckInterval);
                this.displayPlan(plan.plan);
            } else if (plan.status === 'error') {
                clearInterval(this.statusCheckInterval);
                this.showError(plan.message || 'Ошибка при генерации плана');
            }
        }, 5000); // Проверяем каждые 5 секунд
    }

    showLoadingState() {
        this.container.innerHTML = `
            <div class="loading-state">
                <p>План тренировок генерируется...</p>
                <div class="spinner"></div>
            </div>
        `;
    }

    showForm() {
        this.container.innerHTML = `
            <div class="training-plan-form">
                <h3>Создание плана тренировок</h3>
                <p>Форма для создания нового плана тренировок</p>
            </div>
        `;
    }

    showError(message) {
        this.container.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
            </div>
        `;
    }

    displayPlan(plan) {
        if (!plan || !plan.plan || !Array.isArray(plan.plan)) {
            this.showError('Некорректный формат плана тренировок');
            return;
        }

        const workouts = plan.plan.map(workout => `
            <div class="workout-card">
                <div class="workout-header">
                    <h4>${new Date(workout.date).toLocaleDateString()}</h4>
                    <span class="workout-type">${workout.type}</span>
                </div>
                <div class="workout-details">
                    <p><strong>Дистанция:</strong> ${workout.distance} км</p>
                    <p><strong>Длительность:</strong> ${workout.duration_min} мин</p>
                    <p><strong>Целевой темп:</strong> ${workout.target_pace}</p>
                    <p class="workout-description">${workout.description}</p>
                </div>
            </div>
        `).join('');

        this.container.innerHTML = `
            <div class="training-plan">
                <h3>Ваш план тренировок</h3>
                <div class="workouts-grid">
                    ${workouts}
                </div>
            </div>
        `;
    }
} 