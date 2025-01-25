import { checkAuth, getUserStats } from './api.js';

let progressChart, activityChart, monthlyChart;

// Инициализация страницы
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('Начинаем проверку авторизации...');
        // Проверяем авторизацию
        const user = await checkAuth();
        console.log('Результат проверки авторизации:', user);
        
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
                }
            }, 5 * 60 * 1000);
        } catch (error) {
            console.error('Ошибка при загрузке статистики:', error);
            showError('Не удалось загрузить статистику. Попробуйте обновить страницу.');
        }
        
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        if (!error.message.includes('auth')) {
            showError('Произошла ошибка при загрузке данных. Попробуйте обновить страницу.');
        }
    }
});

// Инициализация графиков
async function initCharts() {
    try {
        // График прогресса
        const progressCtx = document.getElementById('progressChart').getContext('2d');
        if (!progressCtx) {
            throw new Error('Элемент progressChart не найден');
        }

        progressChart = new Chart(progressCtx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Remaining'],
                datasets: [{
                    data: [0, 1000],
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

        // График активности
        const activityCtx = document.getElementById('activityChart').getContext('2d');
        if (!activityCtx) {
            throw new Error('Элемент activityChart не найден');
        }

        activityChart = new Chart(activityCtx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Distance (km)',
                    data: Array(7).fill(0),
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

        // График за месяц
        const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
        if (!monthlyCtx) {
            throw new Error('Элемент monthlyChart не найден');
        }

        monthlyChart = new Chart(monthlyCtx, {
            type: 'line',
            data: {
                labels: Array.from({length: 30}, (_, i) => i + 1),
                datasets: [{
                    label: 'Distance (km)',
                    data: Array(30).fill(0),
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
    const completed = stats.total_distance || 0;
    const goal = stats.yearly_goal || 1000;
    const remaining = Math.max(0, goal - completed);

    progressChart.data.datasets[0].data = [completed, remaining];
    progressChart.update();

    // Обновляем значения в центре графика
    const progressValue = document.querySelector('.progress-value');
    if (progressValue) {
        progressValue.textContent = completed.toFixed(1);
    }
}

// График активности за неделю
function updateActivityChart(stats) {
    const weeklyData = stats.weekly_activity || Array(7).fill(0);
    activityChart.data.datasets[0].data = weeklyData;
    activityChart.update();
}

// График статистики за месяц
function updateMonthlyChart(stats) {
    const monthlyData = stats.monthly_stats || Array(30).fill(0);
    monthlyChart.data.datasets[0].data = monthlyData;
    monthlyChart.update();
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
window.logout = async function() {
    try {
        const response = await fetch(`${config.API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        });
        
        if (response.ok) {
            window.location.href = '/';
        } else {
            throw new Error('Logout failed');
        }
    } catch (error) {
        console.error('Ошибка при выходе:', error);
        showError('Не удалось выйти из аккаунта');
    }
} 