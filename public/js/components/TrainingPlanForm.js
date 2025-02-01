import { getCurrentPlan, generatePlan, checkPlanStatus } from '../api/training-plan.js';
import { TrainingPlanView } from './TrainingPlanView.js';
import { WorkoutCard } from './WorkoutCard.js';
import { getUsername } from '../utils/auth.js';

export class TrainingPlanForm {
    constructor(container) {
        this.container = container;
        this.statusCheckInterval = null;
        this.init();
    }

    async init() {
        try {
            // Сначала проверяем существующий план
            const existingPlan = await this.checkExistingPlan();
            
            if (existingPlan === 'pending') {
                // План в процессе генерации
                return;
            } else if (existingPlan) {
                // План существует, показываем его
                this.showPlan(existingPlan);
            } else {
                // Плана нет, показываем форму
                this.render();
                this.bindEvents();
            }
        } catch (error) {
            console.error('Ошибка при инициализации:', error);
            this.showError('Произошла ошибка при загрузке. Пожалуйста, попробуйте позже.');
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

                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-running"></i> Сгенерировать план
                    </button>
                </form>
            </div>
        `;
    }

    bindEvents() {
        const form = this.container.querySelector('#trainingPlanForm');
        if (form) {
            form.addEventListener('submit', this.handleSubmit.bind(this));
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const submitButton = form.querySelector('button[type="submit"]');

        // Проверяем, что выбран хотя бы один день тренировок
        const selectedDays = Array.from(form.querySelectorAll('input[name="preferred_days"]:checked'))
            .map(input => parseInt(input.value));
        
        if (selectedDays.length === 0) {
            this.showError('Пожалуйста, выберите хотя бы один день для тренировок');
            return;
        }

        // Блокируем кнопку и показываем состояние загрузки
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Генерация...';
        }

        // Показываем анимацию загрузки
        this.showLoading();

        try {
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

            // Отправляем запрос на генерацию плана
            const result = await generatePlan(request);
            
            if (result.status === 'pending') {
                // План в процессе генерации
                this.showInProgress();
                this.startStatusCheck();
            } else {
                throw new Error('Неожиданный ответ от сервера');
            }
        } catch (error) {
            console.error('Ошибка при создании плана:', error);
            this.showError('Не удалось создать план тренировок. Пожалуйста, попробуйте позже.');
            
            // Разблокируем кнопку
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-running"></i> Сгенерировать план';
            }
        }
    }

    showLoading() {
        const tips = [
            "План тренировок учитывает ваш текущий уровень подготовки",
            "Программа адаптируется под ваши предпочтения по дням недели",
            "Интенсивность тренировок подбирается индивидуально",
            "Учитываются периоды восстановления между тренировками",
            "План включает рекомендации по питанию и восстановлению"
        ];

        const loadingContainer = document.createElement('div');
        loadingContainer.className = 'loading-container';
        loadingContainer.innerHTML = `
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
        `;

        this.container.innerHTML = '';
        this.container.appendChild(loadingContainer);
    }

    showInProgress() {
        const form = this.container.querySelector('#trainingPlanForm');
        if (form) {
            form.style.display = 'none';
        }

        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        progressContainer.innerHTML = `
            <div class="progress-header">
                <h3>Генерация плана тренировок</h3>
                <p>План создается с учетом ваших параметров и целей</p>
            </div>
            <div class="progress-animation"></div>
            <div class="progress-status">
                План в процессе создания. Пожалуйста, подождите...
            </div>
        `;

        this.container.appendChild(progressContainer);
    }

    async startStatusCheck() {
        // Интервал проверки статуса (30 секунд)
        const CHECK_INTERVAL = 30000;
        
        const checkStatus = async () => {
            try {
                const result = await checkPlanStatus();
                
                switch (result.status) {
                    case 'completed':
                        clearInterval(this.statusCheckInterval);
                        if (result.plan) {
                            this.showPlan(result.plan);
                        } else {
                            throw new Error('План не содержит данных');
                        }
                        break;
                        
                    case 'error':
                        clearInterval(this.statusCheckInterval);
                        this.showError(result.error || 'Произошла ошибка при генерации плана');
                        break;
                        
                    case 'pending':
                        // Продолжаем ожидание
                        break;
                        
                    default:
                        clearInterval(this.statusCheckInterval);
                        this.showError('Неизвестный статус плана');
                }
            } catch (error) {
                console.error('Ошибка при проверке статуса:', error);
                clearInterval(this.statusCheckInterval);
                this.showError('Не удалось проверить статус плана');
            }
        };

        // Запускаем периодическую проверку
        this.statusCheckInterval = setInterval(checkStatus, CHECK_INTERVAL);
        
        // Сразу делаем первую проверку
        await checkStatus();
    }

    showPlan(plan) {
        // Очищаем контейнер
        this.container.innerHTML = '';
        
        // Создаем и отображаем план
        const planView = new TrainingPlanView(this.container, plan);
        
        // Добавляем стили для карточек тренировок
        WorkoutCard.addStyles();
    }

    showError(message) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-message';
        errorContainer.textContent = message;
        
        // Если есть форма, показываем ошибку над ней
        const form = this.container.querySelector('.training-plan-form-container');
        if (form) {
            form.insertBefore(errorContainer, form.firstChild);
        } else {
            this.container.insertBefore(errorContainer, this.container.firstChild);
        }
    }

    async checkExistingPlan() {
        try {
            const plan = await getCurrentPlan();
            return plan;
        } catch (error) {
            console.error('Ошибка при проверке существующего плана:', error);
            return null;
        }
    }

    // Очищаем интервал при уничтожении компонента
    destroy() {
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
        }
    }
} 