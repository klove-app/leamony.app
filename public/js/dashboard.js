// Оборачиваем весь код в самовызывающуюся асинхронную функцию
(async function() {
    try {
        console.log('Начало загрузки dashboard.js');
        
        // Проверяем загрузку ApexCharts
        if (typeof ApexCharts === 'undefined') {
            console.error('ApexCharts не загружен');
            showError('Не удалось загрузить необходимые компоненты. Пожалуйста, обновите страницу.');
            return;
        }
        console.log('ApexCharts загружен успешно');

        // Импортируем модули
        const { checkAuth, getRuns, logout } = await import('./api.js');
        const config = await import('./config.js').then(module => module.default);
        
        console.log('Модули успешно импортированы');
        console.log('API URL:', config.API_URL);

        let progressChart, activityChart, monthlyChart;
        let lastStatsUpdate = new Date();

        // Инициализация страницы
        document.addEventListener('DOMContentLoaded', async function() {
            console.log('Dashboard: DOM загружен, начинаем инициализацию...');
            
            try {
                // Проверяем авторизацию
                console.log('Проверяем авторизацию...');
                const user = await checkAuth();
                console.log('Результат проверки авторизации:', user);
                
                if (!user) {
                    throw new Error('Пользователь не авторизован');
                }

                // Обновляем информацию о пользователе
                updateUserInfo(user);

                // Инициализируем графики
                await initCharts();
                
                // Настраиваем обработчик выхода
                setupLogoutHandler();
                
                // Загружаем статистику
                await updateStats();
                
                // Запускаем автообновление каждые 5 минут
                setInterval(updateStats, 5 * 60 * 1000);
                
            } catch (error) {
                console.error('Ошибка инициализации дашборда:', error);
                showError(error.message || 'An error occurred while loading the dashboard');
                window.location.href = '/?error=' + encodeURIComponent(error.message);
            }
        });

        // Настройка обработчика выхода
        function setupLogoutHandler() {
            const logoutButton = document.getElementById('logoutButton');
            if (logoutButton) {
                logoutButton.addEventListener('click', async () => {
                    try {
                        const success = await logout();
                        if (success) {
                            window.location.href = '/';
                        } else {
                            showError('Failed to logout. Please try again.');
                        }
                    } catch (error) {
                        console.error('Ошибка при выходе:', error);
                        showError('An error occurred during logout');
                    }
                });
            }
        }

        // Обновление статистики
        async function updateStats() {
            try {
                console.log('Начинаем загрузку пробежек...');
                
                // Получаем данные за последний месяц
                const endDate = new Date().toISOString().split('T')[0];
                const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    .toISOString().split('T')[0];
                
                const runs = await getRuns(startDate, endDate, 100);
                console.log('Получены данные о пробежках:', runs);
                
                if (!runs) {
                    throw new Error('Не удалось получить данные о пробежках');
                }
                
                // Преобразуем данные для графиков
                const stats = processRunsData(runs);
                updateDashboard(stats);
                updateLastSync();
                
            } catch (error) {
                console.error('Ошибка при загрузке пробежек:', error);
                showError('Не удалось загрузить данные: ' + error.message);
            }
        }

        // Обработка данных о пробежках
        function processRunsData(runs) {
            const now = new Date();
            const stats = {
                total_distance: 0,
                weekly_activity: Array(7).fill(0),
                monthly_stats: Array(30).fill(0)
            };

            runs.forEach(run => {
                const date = new Date(run.date_added);
                const distance = run.km || 0;
                
                // Общая дистанция
                stats.total_distance += distance;
                
                // Активность за неделю
                const dayOfWeek = date.getDay();
                if (now - date < 7 * 24 * 60 * 60 * 1000) {
                    stats.weekly_activity[dayOfWeek] += distance;
                }
                
                // Статистика за месяц
                const daysAgo = Math.floor((now - date) / (24 * 60 * 60 * 1000));
                if (daysAgo < 30) {
                    stats.monthly_stats[29 - daysAgo] += distance;
                }
            });

            return stats;
        }

        // Обновление времени последней синхронизации
        function updateLastSync() {
            const lastSync = document.getElementById('lastSync');
            if (lastSync) {
                lastSync.textContent = new Date().toLocaleTimeString();
            }
        }

        // Инициализация графиков
        async function initCharts() {
            try {
                // График прогресса (радиальный)
                const progressOptions = {
                    series: [0],
                    chart: {
                        height: 250,
                        type: 'radialBar',
                        animations: {
                            enabled: true,
                            easing: 'easeinout',
                            speed: 800
                        }
                    },
                    plotOptions: {
                        radialBar: {
                            hollow: {
                                size: '70%'
                            },
                            track: {
                                background: '#E5E7EB'
                            },
                            dataLabels: {
                                show: false
                            }
                        }
                    },
                    colors: ['rgb(var(--primary-rgb))'],
                    stroke: {
                        lineCap: 'round'
                    }
                };
                progressChart = new ApexCharts(document.getElementById('progressChart'), progressOptions);
                progressChart.render();

                // График активности (столбчатый)
                const activityOptions = {
                    series: [{
                        name: 'Distance',
                        data: Array(7).fill(0)
                    }],
                    chart: {
                        type: 'bar',
                        height: 250,
                        toolbar: {
                            show: false
                        },
                        animations: {
                            enabled: true,
                            easing: 'easeinout',
                            speed: 800
                        }
                    },
                    plotOptions: {
                        bar: {
                            borderRadius: 4,
                            columnWidth: '60%'
                        }
                    },
                    colors: ['rgb(var(--primary-rgb))'],
                    xaxis: {
                        categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                        axisBorder: {
                            show: false
                        },
                        axisTicks: {
                            show: false
                        }
                    },
                    yaxis: {
                        labels: {
                            formatter: function(val) {
                                return val.toFixed(1) + ' km';
                            }
                        }
                    },
                    grid: {
                        show: false
                    },
                    tooltip: {
                        y: {
                            formatter: function(val) {
                                return val.toFixed(1) + ' km';
                            }
                        }
                    }
                };
                activityChart = new ApexCharts(document.getElementById('activityChart'), activityOptions);
                activityChart.render();

                // График за месяц (линейный)
                const monthlyOptions = {
                    series: [{
                        name: 'Distance',
                        data: Array(30).fill(0)
                    }],
                    chart: {
                        type: 'area',
                        height: 250,
                        toolbar: {
                            show: false
                        },
                        animations: {
                            enabled: true,
                            easing: 'easeinout',
                            speed: 800
                        }
                    },
                    colors: ['rgb(var(--primary-rgb))'],
                    fill: {
                        type: 'gradient',
                        gradient: {
                            shadeIntensity: 1,
                            opacityFrom: 0.7,
                            opacityTo: 0.2,
                            stops: [0, 90, 100]
                        }
                    },
                    stroke: {
                        curve: 'smooth',
                        width: 2
                    },
                    xaxis: {
                        categories: Array.from({length: 30}, (_, i) => i + 1),
                        axisBorder: {
                            show: false
                        },
                        axisTicks: {
                            show: false
                        },
                        labels: {
                            show: true,
                            formatter: function(val) {
                                return val % 5 === 0 ? val : '';
                            }
                        }
                    },
                    yaxis: {
                        labels: {
                            formatter: function(val) {
                                return val.toFixed(1) + ' km';
                            }
                        }
                    },
                    grid: {
                        show: false
                    },
                    tooltip: {
                        y: {
                            formatter: function(val) {
                                return val.toFixed(1) + ' km';
                            }
                        }
                    }
                };
                monthlyChart = new ApexCharts(document.getElementById('monthlyChart'), monthlyOptions);
                monthlyChart.render();
                
            } catch (error) {
                console.error('Ошибка при инициализации графиков:', error);
                throw new Error('Failed to initialize charts: ' + error.message);
            }
        }

        // Обновление информации о пользователе
        function updateUserInfo(user) {
            const userNameElements = document.querySelectorAll('#userName, #userNameHeader');
            userNameElements.forEach(element => {
                if (element) {
                    element.textContent = user.username;
                }
            });
        }

        // Обновление данных дашборда
        function updateDashboard(stats) {
            updateProgressChart(stats);
            updateActivityChart(stats);
            updateMonthlyChart(stats);
            updateProgressDetails(stats);
            updateWeeklyStats(stats);
            updateMonthlyStats(stats);
            updateAchievements(stats);
        }

        // График общего прогресса
        function updateProgressChart(stats) {
            const completed = stats.total_distance || 0;
            const goal = stats.yearly_goal || 1000;
            const percentage = Math.min(100, (completed / goal) * 100);

            progressChart.updateSeries([percentage]);

            // Обновляем значения
            const progressValue = document.querySelector('.progress-value');
            if (progressValue) {
                progressValue.textContent = completed.toFixed(1);
            }

            // Обновляем детали
            const detailValues = document.querySelectorAll('.detail-value');
            if (detailValues[0]) detailValues[0].textContent = completed.toFixed(1);
            if (detailValues[1]) detailValues[1].textContent = goal;
        }

        // График активности за неделю
        function updateActivityChart(stats) {
            const weeklyData = stats.weekly_activity || Array(7).fill(0);
            activityChart.updateSeries([{
                name: 'Distance',
                data: weeklyData
            }]);
        }

        // График статистики за месяц
        function updateMonthlyChart(stats) {
            const monthlyData = stats.monthly_stats || Array(30).fill(0);
            monthlyChart.updateSeries([{
                name: 'Distance',
                data: monthlyData
            }]);
        }

        // Обновление недельной статистики
        function updateWeeklyStats(stats) {
            const weeklyData = stats.weekly_activity || Array(7).fill(0);
            const weekTotal = weeklyData.reduce((a, b) => a + b, 0);
            const weekAvg = weekTotal / 7;

            const weekTotalElement = document.getElementById('weekTotal');
            const weekAvgElement = document.getElementById('weekAvg');

            if (weekTotalElement) weekTotalElement.textContent = weekTotal.toFixed(1);
            if (weekAvgElement) weekAvgElement.textContent = weekAvg.toFixed(1);
        }

        // Обновление месячной статистики
        function updateMonthlyStats(stats) {
            const monthlyData = stats.monthly_stats || Array(30).fill(0);
            const monthTotal = monthlyData.reduce((a, b) => a + b, 0);
            const monthAvg = monthTotal / monthlyData.length;

            const monthTotalElement = document.getElementById('monthTotal');
            const monthAvgElement = document.getElementById('monthAvg');

            if (monthTotalElement) monthTotalElement.textContent = monthTotal.toFixed(1);
            if (monthAvgElement) monthAvgElement.textContent = monthAvg.toFixed(1);
        }

        // Обновление достижений
        function updateAchievements(stats) {
            const achievementsList = document.getElementById('achievementsList');
            if (!achievementsList) return;

            // Проверяем достижения
            const achievements = [];

            // Первая пробежка
            if (stats.total_distance > 0) {
                achievements.push({
                    icon: '🎯',
                    title: 'First Run',
                    description: 'Started your running journey!'
                });
            }

            // Достижение недельной цели
            const weeklyTotal = (stats.weekly_activity || []).reduce((a, b) => a + b, 0);
            if (weeklyTotal >= 20) {
                achievements.push({
                    icon: '🌟',
                    title: 'Weekly Warrior',
                    description: `Ran ${weeklyTotal.toFixed(1)}km this week!`
                });
            }

            // Прогресс к годовой цели
            const goalProgress = (stats.total_distance / stats.yearly_goal) * 100;
            if (goalProgress >= 50) {
                achievements.push({
                    icon: '🏃',
                    title: 'Halfway There',
                    description: 'Reached 50% of your yearly goal!'
                });
            }

            // Отображаем достижения
            achievementsList.innerHTML = achievements.length > 0 ? 
                achievements.map(achievement => `
                    <div class="achievement">
                        <div class="achievement-icon">${achievement.icon}</div>
                        <div class="achievement-details">
                            <h3>${achievement.title}</h3>
                            <p>${achievement.description}</p>
                        </div>
                    </div>
                `).join('') :
                `<div class="achievement">
                    <div class="achievement-icon">🎯</div>
                    <div class="achievement-details">
                        <h3>Keep Running!</h3>
                        <p>Complete more runs to unlock achievements</p>
                    </div>
                </div>`;
        }

        // Функция отображения ошибки
        function showError(message) {
            // Проверяем, существует ли уже элемент с ошибкой
            let errorDiv = document.querySelector('.error-message');
            if (!errorDiv) {
                // Если нет, создаем новый
                errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                document.body.prepend(errorDiv);
            }

            // Обновляем сообщение
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            
            // Автоматически скрываем через 5 секунд
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }

    } catch (error) {
        console.error('Критическая ошибка при загрузке модулей:', error);
        document.addEventListener('DOMContentLoaded', () => {
            showError('Failed to load required modules: ' + error.message);
            window.location.href = '/?error=' + encodeURIComponent(error.message);
        });
    }
})(); 