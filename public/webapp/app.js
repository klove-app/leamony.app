// Инициализация при загрузке скрипта
console.log('Скрипт app.js загружен');

// Проверяем готовность WebApp
let tg = window.Telegram?.WebApp;
if (!tg) {
    console.error('WebApp недоступен при загрузке app.js');
    showError('Ошибка инициализации WebApp');
} else {
    console.log('WebApp найден, инициализируем...');
    try {
        tg.ready();
        tg.expand();
        console.log('WebApp успешно инициализирован');
        
        // Создаем графики после успешной инициализации WebApp
        if (typeof Chart === 'undefined') {
            throw new Error('Chart.js не загружен');
        }
        
        createCharts();
        console.log('Графики созданы успешно');
        
        // Загружаем тестовые данные
        const testData = {
            totalProgress: [286.5, 713.5],
            weeklyActivity: [5.2, 3.1, 4.5, 6.8, 2.3, 7.4, 4.2],
            monthlyStats: [15.5, 22.3, 18.7, 25.1]
        };
        
        updateCharts(testData);
        console.log('Данные загружены');
        
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showError(error.message);
    }
}

let progressChart, activityChart, weeklyChart;

// Создание графиков
function createCharts() {
    // График прогресса
    const progressCtx = document.getElementById('progressChart');
    if (!progressCtx) {
        throw new Error('Canvas для графика прогресса не найден');
    }
    
    progressChart = new Chart(progressCtx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#2481cc', '#f0f0f0'],
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
    
    // График активности
    const activityCtx = document.getElementById('activityChart');
    if (!activityCtx) {
        throw new Error('Canvas для графика активности не найден');
    }
    
    activityChart = new Chart(activityCtx, {
        type: 'bar',
        data: {
            labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
            datasets: [{
                data: [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: '#2481cc',
                borderRadius: 6,
                maxBarThickness: 40
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
    const weeklyCtx = document.getElementById('weeklyChart');
    if (!weeklyCtx) {
        throw new Error('Canvas для графика статистики не найден');
    }
    
    weeklyChart = new Chart(weeklyCtx, {
        type: 'line',
        data: {
            labels: ['1 нед', '2 нед', '3 нед', '4 нед'],
            datasets: [{
                data: [0, 0, 0, 0],
                borderColor: '#2481cc',
                backgroundColor: '#2481cc',
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 4
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

// Обновление графиков
function updateCharts(data) {
    try {
        if (progressChart && data.totalProgress) {
            progressChart.data.datasets[0].data = data.totalProgress;
            progressChart.update();
        }
        
        if (activityChart && data.weeklyActivity) {
            activityChart.data.datasets[0].data = data.weeklyActivity;
            activityChart.update();
        }
        
        if (weeklyChart && data.monthlyStats) {
            weeklyChart.data.datasets[0].data = data.monthlyStats;
            weeklyChart.update();
        }
    } catch (error) {
        console.error('Ошибка при обновлении графиков:', error);
        showError('Не удалось обновить графики: ' + error.message);
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