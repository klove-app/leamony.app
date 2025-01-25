// Оборачиваем весь код в самовызывающуюся асинхронную функцию
(async function() {
    try {
        console.log('Начало загрузки dashboard.js');
        
        // Проверяем загрузку модулей
        if (!window.Chart) {
            throw new Error('Chart.js не загружен');
        }
        console.log('Chart.js загружен успешно');

        // Импортируем модули
        const { checkAuth, getUserStats, logout } = await import('./api.js');
        const config = await import('./config.js').then(module => module.default);
        
        console.log('Модули успешно импортированы');
        console.log('API URL:', config.API_URL);

        // Проверяем информацию о последнем входе
        const lastLoginUser = localStorage.getItem('lastLoginUser');
        if (lastLoginUser) {
            console.log('Найдена информация о последнем входе:', JSON.parse(lastLoginUser));
        }

        let progressChart, activityChart, monthlyChart;

        // Инициализация страницы
        document.addEventListener('DOMContentLoaded', async function() {
            console.log('Dashboard: DOM загружен, начинаем инициализацию...');
            
            try {
                // Проверяем наличие токена в куках
                console.log('Проверяем куки:', document.cookie);
                if (!document.cookie.includes('session')) {
                    throw new Error('Сессия не найдена в куках');
                }

                // Проверяем наличие необходимых элементов
                console.log('Проверяем наличие элементов...');
                const requiredElements = [
                    'logoutButton',
                    'userName',
                    'userEmail',
                    'progressChart',
                    'activityChart',
                    'monthlyChart'
                ];

                const missingElements = [];
                for (const elementId of requiredElements) {
                    const element = document.getElementById(elementId);
                    if (!element) {
                        missingElements.push(elementId);
                    }
                    console.log(`Элемент ${elementId}:`, element ? 'найден' : 'не найден');
                }

                if (missingElements.length > 0) {
                    throw new Error(`Не найдены элементы: ${missingElements.join(', ')}`);
                }

                // Настраиваем обработчик выхода
                const logoutButton = document.getElementById('logoutButton');
                logoutButton.addEventListener('click', async () => {
                    console.log('Выполняем выход...');
                    try {
                        const success = await logout();
                        if (success) {
                            console.log('Выход успешен, очищаем данные...');
                            localStorage.removeItem('lastLoginUser');
                            console.log('Перенаправляем на главную...');
                            window.location.href = '/';
                        } else {
                            console.error('Ошибка при выходе');
                            showError('Failed to logout. Please try again.');
                        }
                    } catch (error) {
                        console.error('Ошибка при выходе:', error);
                        showError('An error occurred during logout');
                    }
                });

                console.log('Проверяем авторизацию...');
                const user = await checkAuth();
                console.log('Результат проверки авторизации:', user);
                
                if (!user) {
                    throw new Error('Пользователь не авторизован');
                }

                console.log('Пользователь авторизован, обновляем информацию...');
                updateUserInfo(user);

                console.log('Инициализируем графики...');
                await initCharts();
                
                console.log('Загружаем статистику пользователя...');
                try {
                    const stats = await getUserStats();
                    console.log('Статистика получена:', stats);
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
                    showError('Failed to load statistics. Please refresh the page.');
                }
                
            } catch (error) {
                console.error('Ошибка инициализации дашборда:', error);
                showError(error.message || 'An error occurred while loading the dashboard');
                // В случае критической ошибки перенаправляем на главную
                setTimeout(() => {
                    window.location.href = '/?error=' + encodeURIComponent(error.message);
                }, 3000);
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
    } catch (error) {
        console.error('Критическая ошибка при загрузке модулей:', error);
        document.addEventListener('DOMContentLoaded', () => {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = 'Failed to load required modules: ' + error.message;
            document.body.prepend(errorDiv);
            
            // Перенаправляем на главную через 3 секунды
            setTimeout(() => {
                window.location.href = '/?error=' + encodeURIComponent(error.message);
            }, 3000);
        });
    }
})(); 