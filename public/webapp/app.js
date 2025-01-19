let tg = window.Telegram.WebApp;
let progressChart, activityChart, weeklyChart, groupChart;

// Инициализация WebApp
document.addEventListener('DOMContentLoaded', function() {
    try {
        tg.ready();
        tg.expand();

        // Устанавливаем тему
        const theme = {
            bg_color: tg.backgroundColor || '#ffffff',
            text_color: tg.textColor || '#000000',
            hint_color: tg.hint_color || '#999999',
            link_color: tg.link_color || '#2481cc',
            button_color: tg.button_color || '#2481cc',
            button_text_color: tg.button_text_color || '#ffffff'
        };

        Object.entries(theme).forEach(([key, value]) => {
            document.documentElement.style.setProperty(`--tg-theme-${key}`, value);
        });

        // Инициализируем обработчики
        initHandlers();
        
        // Загружаем данные пользователя
        loadUserData();
    } catch (error) {
        showError('Не удалось инициализировать приложение');
    }
});

// Инициализация обработчиков событий
function initHandlers() {
    // Обработчики для кнопок в предложениях
    document.querySelectorAll('.offer-button').forEach(button => {
        button.addEventListener('click', function() {
            const card = this.closest('.offer-card');
            const title = card.querySelector('h2').textContent;
            tg.showAlert(`Вы приняли вызов: ${title}`);
        });
    });

    // Обработчики для кнопок в сервисах
    document.querySelectorAll('.service-button').forEach(button => {
        button.addEventListener('click', function() {
            const card = this.closest('.service-card');
            const title = card.querySelector('h3').textContent;
            tg.showAlert(`Открываем настройки: ${title}`);
        });
    });

    // Обработчики для вкладок навигации
    document.querySelectorAll('.tab-button').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.tab-button').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            tg.showAlert(`Выбрана вкладка: ${this.textContent}`);
        });
    });
}

// Загрузка данных пользователя
async function loadUserData() {
    try {
        // TODO: Здесь будет запрос к API для получения реальных данных
        // const response = await fetch('https://api.runconnect.app/api/user/data');
        // const data = await response.json();
        
        // Пока используем тестовые данные
        const data = {
            offers: [
                {
                    title: "Достижения",
                    description: "Получите медаль за пробежку более 10 км",
                    progress: 80,
                    current: 8,
                    total: 10
                },
                {
                    title: "Новый вызов",
                    description: "Попробуйте велотренировку на этой неделе"
                },
                {
                    title: "Цель недели",
                    description: "Пробегите 20 км до воскресенья",
                    progress: 45,
                    current: 9,
                    total: 20
                }
            ]
        };

        updateInterface(data);
    } catch (error) {
        showError('Не удалось загрузить данные');
    }
}

// Обновление интерфейса
function updateInterface(data) {
    // Обновляем прогресс в предложениях
    document.querySelectorAll('.offer-card').forEach((card, index) => {
        const offer = data.offers[index];
        if (offer.progress !== undefined) {
            const progressBar = card.querySelector('.progress-bar');
            const progressText = card.querySelector('.offer-progress span');
            if (progressBar && progressText) {
                progressBar.style.width = `${offer.progress}%`;
                progressText.textContent = `${offer.current} из ${offer.total} км`;
            }
        }
    });
}

// Функция отображения ошибки
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    document.body.prepend(errorDiv);
} 