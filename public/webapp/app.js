// Инициализация при загрузке скрипта
console.log('Скрипт app.js загружен');

// Проверяем доступность Chart.js
console.log('Chart.js доступен:', typeof Chart !== 'undefined');
console.log('window.Chart:', window.Chart);

// Проверяем готовность WebApp
let tg = window.Telegram?.WebApp;
console.log('Telegram WebApp:', tg);

if (!tg) {
    console.error('WebApp недоступен при загрузке app.js');
    showError('Ошибка инициализации WebApp');
} else {
    console.log('WebApp найден, инициализируем...');
    try {
        tg.ready();
        tg.expand();
        console.log('WebApp успешно инициализирован');
        
        // Проверяем наличие элементов canvas
        console.log('progressChart canvas:', document.getElementById('progressChart'));
        console.log('activityChart canvas:', document.getElementById('activityChart'));
        console.log('weeklyChart canvas:', document.getElementById('weeklyChart'));
        
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
        
        console.log('Загружаем тестовые данные:', testData);
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
    console.log('Начинаем создание графиков...');
    
    try {
        // График прогресса
        const progressCtx = document.getElementById('progressChart');
        if (!progressCtx) {
            throw new Error('Canvas для графика прогресса не найден');
        }
        console.log('Canvas прогресса найден');
        
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
        console.log('График прогресса создан');
        
        // График активности
        const activityCtx = document.getElementById('activityChart');
        if (!activityCtx) {
            throw new Error('Canvas для графика активности не найден');
        }
        console.log('Canvas активности найден');
        
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
        console.log('График активности создан');
        
        // График по неделям
        const weeklyCtx = document.getElementById('weeklyChart');
        if (!weeklyCtx) {
            throw new Error('Canvas для графика статистики не найден');
        }
        console.log('Canvas статистики найден');
        
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
        console.log('График статистики создан');
        
    } catch (error) {
        console.error('Ошибка при создании графиков:', error);
        throw error;
    }
}

// Обновление графиков
function updateCharts(data) {
    console.log('Обновляем графики с данными:', data);
    try {
        if (progressChart && data.totalProgress) {
            progressChart.data.datasets[0].data = data.totalProgress;
            progressChart.update();
            console.log('График прогресса обновлен');
        }
        
        if (activityChart && data.weeklyActivity) {
            activityChart.data.datasets[0].data = data.weeklyActivity;
            activityChart.update();
            console.log('График активности обновлен');
        }
        
        if (weeklyChart && data.monthlyStats) {
            weeklyChart.data.datasets[0].data = data.monthlyStats;
            weeklyChart.update();
            console.log('График статистики обновлен');
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
    console.error('Показываем ошибку:', message);
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.style.display = 'block';
        errorDiv.textContent = message;
    } else {
        console.error('Элемент для отображения ошибки не найден');
    }
} 