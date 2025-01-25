import { checkAuth, getUserStats } from './api.js';

let progressChart, activityChart, weeklyChart;

// Инициализация страницы
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Проверяем авторизацию
        const user = await checkAuth();
        if (!user) {
            console.log('Пользователь не авторизован, перенаправление на главную');
            window.location.href = '/?auth=failed';
            return;
        }

        console.log('Пользователь авторизован:', user);

        // Обновляем информацию о пользователе
        updateUserInfo(user);

        // Инициализируем графики
        await initCharts();
        
        // Загружаем реальные данные
        try {
            const stats = await getUserStats();
            updateDashboard(stats);
            
            // Запускаем автообновление каждые 5 минут
            setInterval(async () => {
                try {
                    const newStats = await getUserStats();
                    updateDashboard(newStats);
                } catch (error) {
                    console.error('Ошибка при обновлении данных:', error);
                    // Не показываем ошибку пользователю при проблемах с обновлением
                }
            }, 5 * 60 * 1000);
        } catch (error) {
            console.error('Ошибка при загрузке статистики:', error);
            showError('Не удалось загрузить статистику. Попробуйте обновить страницу.');
        }
        
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        // Показываем ошибку только если это не связано с авторизацией
        if (!error.message.includes('auth')) {
            showError('Произошла ошибка при загрузке данных. Попробуйте обновить страницу.');
        }
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

// Обновление информации о пользователе
function updateUserInfo(user) {
    const userNameElement = document.getElementById('userName');
    const userEmailElement = document.getElementById('userEmail');
    
    if (userNameElement) {
        userNameElement.textContent = user.username;
    }
    if (userEmailElement) {
        userEmailElement.textContent = user.email;
    }
}

// Обновление данных дашборда
function updateDashboard(stats) {
    updateProgressChart(stats);
    updateActivityChart(stats);
    updateMonthlyChart(stats);
    updateProgressDetails(stats);
}

// График общего прогресса
function updateProgressChart(stats) {
    const ctx = document.getElementById('progressChart').getContext('2d');
    const completed = stats.total_distance || 0;
    const goal = stats.yearly_goal || 1000;
    const remaining = Math.max(0, goal - completed);

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Remaining'],
            datasets: [{
                data: [completed, remaining],
                backgroundColor: [
                    'rgb(var(--primary-rgb))',
                    '#E5E7EB'
                ],
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

    // Обновляем значения в центре графика
    const progressValue = document.querySelector('.progress-value');
    if (progressValue) {
        progressValue.textContent = completed.toFixed(1);
    }
}

// График активности за неделю
function updateActivityChart(stats) {
    const ctx = document.getElementById('activityChart').getContext('2d');
    const weeklyData = stats.weekly_activity || Array(7).fill(0);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: 'Distance (km)',
                data: weeklyData,
                backgroundColor: 'rgba(var(--primary-rgb), 0.2)',
                borderColor: 'rgb(var(--primary-rgb))',
                borderWidth: 2,
                borderRadius: 4
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

// График статистики за месяц
function updateMonthlyChart(stats) {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    const monthlyData = stats.monthly_stats || Array(30).fill(0);
    const labels = Array.from({length: 30}, (_, i) => i + 1);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Distance (km)',
                data: monthlyData,
                borderColor: 'rgb(var(--primary-rgb))',
                backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
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
                    },
                    ticks: {
                        maxTicksLimit: 10
                    }
                }
            }
        }
    });
}

// Обновление деталей прогресса
function updateProgressDetails(stats) {
    const completedElement = document.querySelector('.detail-value');
    const goalElement = document.querySelectorAll('.detail-value')[1];
    
    if (completedElement) {
        completedElement.textContent = (stats.total_distance || 0).toFixed(1);
    }
    if (goalElement) {
        goalElement.textContent = stats.yearly_goal || 1000;
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