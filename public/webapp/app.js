let tg = window.Telegram.WebApp;

// Инициализация WebApp
document.addEventListener('DOMContentLoaded', function() {
    tg.ready();
    tg.expand();

    // Устанавливаем тему
    document.documentElement.style.setProperty('--tg-theme-bg-color', tg.backgroundColor);
    document.documentElement.style.setProperty('--tg-theme-text-color', tg.textColor);
    document.documentElement.style.setProperty('--tg-theme-hint-color', tg.hint_color || '#999999');
    document.documentElement.style.setProperty('--tg-theme-link-color', tg.link_color || '#2481cc');
    document.documentElement.style.setProperty('--tg-theme-button-color', tg.button_color || '#2481cc');
    document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.button_text_color || '#ffffff');

    // Загружаем данные пользователя
    loadUserStats();
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
        console.error('Ошибка загрузки данных:', error);
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
    // TODO: Реализовать красивое отображение ошибок
    console.error(message);
} 