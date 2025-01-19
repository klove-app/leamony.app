let progressChart, activityChart, weeklyChart;

// Инициализация страницы
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Проверяем авторизацию
        const user = await checkAuth();
        if (!user) {
            window.location.href = '/';
            return;
        }

        // Отображаем email пользователя
        document.getElementById('userEmail').textContent = user.email;

        // Инициализируем графики
        await initCharts();
        
        // Загружаем тестовые данные
        const testData = {
            totalProgress: {
                completed: 286.5,
                remaining: 713.5
            },
            weeklyActivity: [5.2, 3.1, 4.5, 6.8, 2.3, 7.4, 4.2],
            monthlyStats: [15.5, 22.3, 18.7, 25.1]
        };
        
        // Обновляем графики
        updateCharts(testData);
        
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showError('Не удалось загрузить данные: ' + error.message);
    }
});

// Инициализация графиков
async function initCharts() {
    try {
        // График прогресса (круговой)
        const progressCtx = document.getElementById('progressChart');
        if (!progressCtx) {
            throw new Error('Элемент progressChart не найден');
        }

        progressChart = new Chart(progressCtx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [286.5, 713.5],
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
                },
                animation: {
                    animateRotate: true,
                    animateScale: true
                }
            }
        });

        // График активности за месяц
        const activityCtx = document.getElementById('activityChart');
        if (!activityCtx) {
            throw new Error('Элемент activityChart не найден');
        }

        activityChart = new Chart(activityCtx, {
            type: 'bar',
            data: {
                labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
                datasets: [{
                    data: [5.2, 3.1, 4.5, 6.8, 2.3, 7.4, 4.2],
                    backgroundColor: '#2481cc',
                    borderRadius: 8,
                    maxBarThickness: 40
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

        // График статистики по неделям
        const weeklyCtx = document.getElementById('weeklyChart');
        if (!weeklyCtx) {
            throw new Error('Элемент weeklyChart не найден');
        }

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
        
    } catch (error) {
        console.error('Ошибка при инициализации графиков:', error);
        showError('Не удалось создать графики: ' + error.message);
    }
}

// Обновление графиков
function updateCharts(data) {
    try {
        if (progressChart && data.totalProgress) {
            progressChart.data.datasets[0].data = [
                data.totalProgress.completed,
                data.totalProgress.remaining
            ];
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

// Функция отображения ошибки
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    document.body.prepend(errorDiv);
}

// Функция выхода из аккаунта
async function logout() {
    try {
        const success = await api.logout();
        if (success) {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Ошибка при выходе:', error);
        showError('Не удалось выйти из аккаунта');
    }
} 