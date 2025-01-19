let tg = window.Telegram.WebApp;

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

        // Загружаем данные пользователя
        loadUserStats();
    } catch (error) {
        showError('Не удалось инициализировать приложение');
    }
});

// Функция загрузки статистики пользователя
async function loadUserStats() {
    try {
        // TODO: Здесь будет запрос к API для получения реальных данных
        // const response = await fetch('https://api.runconnect.app/api/stats');
        // const data = await response.json();
        
        // Пока используем тестовые данные
        updateStats({
            year: {
                distance: 286.5,
                runs: 42,
                avgDistance: 6.8,
                goal: 1000,
                progress: 28.6
            },
            month: {
                distance: 64.2,
                runs: 9,
                change: 12
            },
            recent: [
                { date: '19 марта', distance: 5.2, time: '32:15' },
                { date: '17 марта', distance: 8.1, time: '48:30' },
                { date: '15 марта', distance: 6.5, time: '39:45' }
            ]
        });
    } catch (error) {
        showError('Не удалось загрузить статистику');
    }
}

// Функция обновления статистики на странице
function updateStats(data) {
    // Обновляем годовую статистику
    document.querySelector('.annual-stats .stats-grid').innerHTML = `
        <div class="stat-item">
            <span class="stat-value">${data.year.distance}</span>
            <span class="stat-label">Километров</span>
        </div>
        <div class="stat-item">
            <span class="stat-value">${data.year.runs}</span>
            <span class="stat-label">Тренировок</span>
        </div>
        <div class="stat-item">
            <span class="stat-value">${data.year.avgDistance}</span>
            <span class="stat-label">Средняя дистанция</span>
        </div>
    `;

    // Обновляем прогресс к цели
    document.querySelector('.progress').style.width = `${data.year.progress}%`;
    document.querySelector('.progress-label').innerHTML = `
        <span>Цель: ${data.year.goal} км</span>
        <span>${data.year.progress}%</span>
    `;

    // Обновляем месячную статистику
    document.querySelector('.monthly-stats .stats-grid').innerHTML = `
        <div class="stat-item">
            <span class="stat-value">${data.month.distance}</span>
            <span class="stat-label">Километров</span>
        </div>
        <div class="stat-item">
            <span class="stat-value">${data.month.runs}</span>
            <span class="stat-label">Тренировок</span>
        </div>
        <div class="stat-item">
            <span class="stat-value">+${data.month.change}%</span>
            <span class="stat-label">К прошлому месяцу</span>
        </div>
    `;

    // Обновляем список последних пробежек
    const runsList = document.querySelector('.runs-list');
    runsList.innerHTML = data.recent.map(run => `
        <div class="run-item">
            <div class="run-date">${run.date}</div>
            <div class="run-details">
                <span class="run-distance">${run.distance} км</span>
                <span class="run-time">${run.time}</span>
            </div>
        </div>
    `).join('');
}

// Функция отображения ошибки
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    document.body.prepend(errorDiv);
} 