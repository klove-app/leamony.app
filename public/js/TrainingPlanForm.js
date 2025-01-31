class TrainingPlanForm {
    constructor(container) {
        this.container = container;
        this.init();
    }

    validatePlanData(response) {
        console.group('Валидация данных плана');
        console.log('Начало валидации плана:', response);

        try {
            // Проверяем наличие обязательных полей в ответе
            if (!response || typeof response !== 'object') {
                console.error('Ответ отсутствует или не является объектом');
                return false;
            }

            // Проверяем наличие плана
            if (!response.plan || typeof response.plan !== 'object') {
                console.error('План отсутствует или имеет неверный формат');
                return false;
            }

            // Проверяем наличие массива тренировок
            if (!Array.isArray(response.plan.plan)) {
                console.error('План не содержит массива тренировок');
                return false;
            }

            // Проверяем каждую тренировку в плане
            for (const workout of response.plan.plan) {
                if (!this.validateWorkout(workout)) {
                    return false;
                }
            }

            console.log('Валидация плана успешно завершена');
            console.groupEnd();
            return true;
        } catch (error) {
            console.error('Ошибка при валидации плана:', error);
            console.groupEnd();
            return false;
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
            
            if (existingPlan && existingPlan.status === 'completed' && this.validatePlanData(existingPlan)) {
                // Показываем существующий план
                this.displayPlan(existingPlan.plan);
            } else if (existingPlan && existingPlan.status === 'pending') {
                // План генерируется
                this.showLoadingState();
            } else {
                // Показываем форму для создания нового плана
                this.showForm();
            }
            
            console.log('Инициализация формы завершена');
            console.groupEnd();
        } catch (error) {
            console.error('Ошибка при инициализации формы:', error);
            console.groupEnd();
            this.showError('Произошла ошибка при загрузке плана тренировок');
        }
    }
} 