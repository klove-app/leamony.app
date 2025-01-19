let tg = window.Telegram.WebApp;
let progressChart, activityChart;

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

        // Инициализируем графики
        initCharts();

        // Загружаем данные пользователя
        loadUserStats();
    } catch (error) {
        showError('Не удалось инициализировать приложение');
    }
});

// Инициализация графиков
function initCharts() {
    // График прогресса
    const progressCtx = document.getElementById('progressChart').getContext('2d');
    progressChart = new Chart(progressCtx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [28.6, 71.4],
                backgroundColor: [
                    getComputedStyle(document.documentElement).getPropertyValue('--progress-color'),
                    'rgba(0, 0, 0, 0.1)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            cutout: '80%',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    // График активности
    const activityCtx = document.getElementById('activityChart').getContext('2d');
    activityChart = new Chart(activityCtx, {
        type: 'bar',
        data: {
            labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
            datasets: [{
                label: 'Километры',
                data: [5.2, 0, 8.1, 0, 6.5, 4.8, 0],
                backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--progress-color'),
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        display: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Функция загрузки статистики пользователя
async function loadUserStats() {
    try {
        // TODO: Здесь будет запрос к API для получения реальных данных
        // const response = await fetch('https://api.runconnect.app/api/stats');
        // const data = await response.json();
        
        // Пока используем тестовые данные
        const data = {
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
            ],
            activity: [5.2, 0, 8.1, 0, 6.5, 4.8, 0]
        };

        updateStats(data);
        updateCharts(data);
    } catch (error) {
        showError('Не удалось загрузить статистику');
    }
}

// Функция обновления графиков
function updateCharts(data) {
    // Обновляем график прогресса
    progressChart.data.datasets[0].data = [data.year.progress, 100 - data.year.progress];
    progressChart.update();

    // Обновляем график активности
    activityChart.data.datasets[0].data = data.activity;
    activityChart.update();
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