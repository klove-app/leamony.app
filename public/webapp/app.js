let tg = window.Telegram.WebApp;
let progressChart, activityChart, weeklyChart;

// Инициализация WebApp
document.addEventListener('DOMContentLoaded', async function() {
    try {
        tg.ready();
        tg.expand();

        // Проверяем, загрузился ли Chart.js
        if (typeof Chart === 'undefined') {
            throw new Error('Chart.js не загружен');
        }

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
        await loadUserData();
    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
});

// Инициализация графиков
function initCharts() {
    // График прогресса (круговой)
    const progressCtx = document.getElementById('progressChart');
    if (progressCtx) {
        progressChart = new Chart(progressCtx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [286.5, 713.5],
                    backgroundColor: ['#2481cc', 'rgba(0, 0, 0, 0.1)'],
                    borderWidth: 0,
                    cutout: '80%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // График активности за месяц
    const activityCtx = document.getElementById('activityChart');
    if (activityCtx) {
        activityChart = new Chart(activityCtx, {
            type: 'bar',
            data: {
                labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
                datasets: [{
                    data: [5.2, 3.1, 4.5, 6.8, 2.3, 7.4, 4.2],
                    backgroundColor: '#2481cc',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // График статистики по неделям
    const weeklyCtx = document.getElementById('weeklyChart');
    if (weeklyCtx) {
        weeklyChart = new Chart(weeklyCtx, {
            type: 'line',
            data: {
                labels: ['1 нед', '2 нед', '3 нед', '4 нед'],
                datasets: [{
                    data: [15.5, 22.3, 18.7, 25.1],
                    borderColor: '#2481cc',
                    backgroundColor: 'rgba(36, 129, 204, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
}

// Загрузка данных пользователя
async function loadUserData() {
    try {
        // TODO: Здесь будет запрос к API для получения реальных данных
        const data = {
            totalProgress: {
                completed: 286.5,
                remaining: 713.5
            },
            weeklyActivity: [5.2, 3.1, 4.5, 6.8, 2.3, 7.4, 4.2],
            monthlyStats: [15.5, 22.3, 18.7, 25.1]
        };

        updateCharts(data);
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
    }
}

// Обновление графиков
function updateCharts(data) {
    if (progressChart) {
        progressChart.data.datasets[0].data = [data.totalProgress.completed, data.totalProgress.remaining];
        progressChart.update();
    }

    if (activityChart) {
        activityChart.data.datasets[0].data = data.weeklyActivity;
        activityChart.update();
    }

    if (weeklyChart) {
        weeklyChart.data.datasets[0].data = data.monthlyStats;
        weeklyChart.update();
    }
}

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

// Функция отображения ошибки
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    document.body.prepend(errorDiv);
} 