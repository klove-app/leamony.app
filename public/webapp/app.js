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
    const chartColor = getComputedStyle(document.documentElement).getPropertyValue('--progress-color');
    
    // График прогресса
    const progressCtx = document.getElementById('progressChart').getContext('2d');
    progressChart = new Chart(progressCtx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [28.6, 71.4],
                backgroundColor: [
                    chartColor,
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
                backgroundColor: chartColor,
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

    // График по неделям
    const weeklyCtx = document.getElementById('weeklyChart').getContext('2d');
    weeklyChart = new Chart(weeklyCtx, {
        type: 'line',
        data: {
            labels: ['1 нед', '2 нед', '3 нед', '4 нед'],
            datasets: [{
                label: 'Дистанция',
                data: [18.5, 21.2, 19.8, 24.6],
                borderColor: chartColor,
                backgroundColor: 'rgba(36, 129, 204, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: '#fff'
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

    // График групповой динамики
    const groupCtx = document.getElementById('groupChart').getContext('2d');
    groupChart = new Chart(groupCtx, {
        type: 'line',
        data: {
            labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
            datasets: [
                {
                    label: 'Вы',
                    data: [5.2, 0, 8.1, 0, 6.5, 4.8, 0],
                    borderColor: chartColor,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 3
                },
                {
                    label: 'Среднее по группе',
                    data: [4.8, 5.1, 4.9, 5.2, 5.0, 4.7, 4.5],
                    borderColor: 'rgba(0, 0, 0, 0.2)',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
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
            weekly: {
                current: 24.6,
                previous: 21.2,
                data: [18.5, 21.2, 19.8, 24.6]
            },
            group: {
                rank: 3,
                total: 42,
                avgDistance: 5.8,
                userData: [5.2, 0, 8.1, 0, 6.5, 4.8, 0],
                groupData: [4.8, 5.1, 4.9, 5.2, 5.0, 4.7, 4.5]
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

    // Обновляем график по неделям
    weeklyChart.data.datasets[0].data = data.weekly.data;
    weeklyChart.update();

    // Обновляем график групповой динамики
    groupChart.data.datasets[0].data = data.group.userData;
    groupChart.data.datasets[1].data = data.group.groupData;
    groupChart.update();
}

// Функция обновления статистики на странице
function updateStats(data) {
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

    // Обновляем недельную статистику
    document.querySelector('.weekly-summary .summary-value:first-child').textContent = `${data.weekly.current} км`;
    document.querySelector('.weekly-summary .summary-value:last-child').textContent = `${data.weekly.previous} км`;

    // Обновляем групповую статистику
    document.querySelector('.group-stats .stat-value:first-child').textContent = `#${data.group.rank} из ${data.group.total}`;
    document.querySelector('.group-stats .stat-value:last-child').textContent = `${data.group.avgDistance} км/день`;
}

// Функция отображения ошибки
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    document.body.prepend(errorDiv);
} 