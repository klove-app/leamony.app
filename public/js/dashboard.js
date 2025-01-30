import { checkAuth, logout, getRuns, viewLogs, getTelegramBotLink } from './api.js';
import { Chart, registerables } from 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/+esm';
import ApexCharts from 'https://cdn.jsdelivr.net/npm/apexcharts@3.45.1/+esm';

// Функция для форматирования чисел
function formatNumber(value) {
    if (value === null || value === undefined || isNaN(value)) {
        return '0.00';
    }
    return Number(value).toFixed(2);
}

// Функция для показа ошибки
function showError(message) {
    const errorLog = document.getElementById('errorLog');
    if (errorLog) {
        errorLog.textContent = message;
        errorLog.style.display = 'block';
        
        // Автоматически скрываем ошибку через 5 секунд
        setTimeout(() => {
            errorLog.style.display = 'none';
        }, 5000);
    }
}

// Функция задержки для отладки
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Обновление прогресса
function updateProgressSection(totalDistance, yearlyGoal) {
    console.log('Обновляем прогресс:', { totalDistance, yearlyGoal });
    const progressSection = document.getElementById('progressSection');
    if (!progressSection) {
        console.error('Секция прогресса не найдена');
        return;
    }

    if (yearlyGoal > 0) {
        const percentage = Math.min((totalDistance / yearlyGoal) * 100, 100);
        progressSection.innerHTML = `
            <div class="progress-info">
                <span class="progress-label">Цель на год: ${yearlyGoal} км</span>
                <span class="progress-value">${percentage.toFixed(1)}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
        `;
        progressSection.style.display = 'block';
    } else {
        progressSection.style.display = 'none';
    }
}

// Обновление метрик
function updateMetrics(totalDistance, avgDistance, totalRuns) {
    console.log('Обновляем метрики:', { totalDistance, avgDistance, totalRuns });
    const metricsGrid = document.querySelector('.metrics-grid');
    if (!metricsGrid) {
        console.error('Сетка метрик не найдена');
        return;
    }

    const elements = {
        totalDistance: document.querySelector('#totalDistanceCard .metric-value'),
        avgDistance: document.querySelector('#avgDistanceCard .metric-value'),
        totalRuns: document.querySelector('#totalRunsCard .metric-value')
    };

    if (elements.totalDistance) elements.totalDistance.textContent = `${totalDistance.toFixed(1)} км`;
    if (elements.avgDistance) elements.avgDistance.textContent = `${avgDistance.toFixed(1)} км`;
    if (elements.totalRuns) elements.totalRuns.textContent = totalRuns;
    metricsGrid.style.display = 'grid';
}

// Обновление таблицы пробежек
function updateRunsTable(runs) {
    console.log('Обновляем таблицу пробежек:', runs);
    const runsSection = document.querySelector('.recent-runs');
    const tbody = document.getElementById('runsTableBody');
    
    if (!runsSection || !tbody) {
        console.error('Секция пробежек или таблица не найдены');
        return;
    }

    tbody.innerHTML = runs.map(run => `
        <tr class="animate-fade-in">
            <td>${new Date(run.date_added).toLocaleDateString()}</td>
            <td class="distance">${run.km.toFixed(1)}</td>
            <td class="time">${run.duration || '-'}</td>
            <td class="notes">${run.notes || ''}</td>
        </tr>
    `).join('');
    runsSection.style.display = 'block';
}

// Добавляем переменную для текущего периода
let currentPeriod = 'year';

// Функция для получения дат периода
function getPeriodDates(period) {
    const now = new Date();
    let startDate;
    
    switch(period) {
        case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
        default:
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
    }
    
    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
    };
}

// Функция для обновления периода
async function updatePeriod(period) {
    const periodButtons = document.querySelectorAll('.period-button');
    periodButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.period === period);
    });
    currentPeriod = period;
    await loadUserData(false);
}

// Функция для синхронизации с Telegram
async function handleTelegramSync() {
    const result = await getTelegramBotLink();
    if (result.success) {
        // Открываем ссылку на бота в новой вкладке
        window.open(result.link, '_blank');
    } else {
        showError('Не удалось получить ссылку на бота. Попробуйте позже.');
    }
}

// Обновляем функцию loadUserData
async function loadUserData(forceCheck = false) {
    try {
        console.group('Загрузка данных пользователя');
        
        // Проверяем авторизацию
        const user = await checkAuth(forceCheck);
        if (!user) {
            window.location.href = '/';
            return;
        }

        // Получаем даты для текущего периода
        const { startDate, endDate } = getPeriodDates(currentPeriod);
        const response = await getRuns(startDate, endDate);
        console.log('Получен ответ:', response);
        
        // Преобразуем данные в нужный формат
        const runs = Array.isArray(response) ? response : [];
        console.log('Преобразованные пробежки:', runs);
        
        // Подготавливаем все данные
        const data = {
            hasRuns: runs && runs.length > 0,
            welcomeMessage: `Привет, ${user.username}! 👋`,
            yearlyGoal: user.yearly_goal,
            stats: null,
            recentRuns: null
        };

        if (data.hasRuns) {
            const totalDistance = runs.reduce((sum, run) => sum + run.km, 0);
            const avgDistance = totalDistance / runs.length;
            const lastRun = new Date(runs[0].date_added);
            const daysSinceLastRun = Math.floor((new Date() - lastRun) / (1000 * 60 * 60 * 24));

            data.stats = {
                totalDistance,
                avgDistance,
                totalRuns: runs.length,
                lastRunInfo: daysSinceLastRun === 0 
                    ? 'Отличная пробежка сегодня!'
                    : `Последняя пробежка: ${daysSinceLastRun} дн. назад`
            };

            data.recentRuns = runs.slice(0, 5);
        }

        // Обновляем DOM только после подготовки всех данных
        const elements = {
            dashboardContent: document.querySelector('.dashboard-content'),
            welcomeMessage: document.getElementById('welcomeMessage'),
            progressSection: document.getElementById('progressSection'),
            metricsGrid: document.querySelector('.metrics-grid'),
            recentRuns: document.querySelector('.recent-runs'),
            actionButtons: document.querySelector('.action-buttons'),
            lastRunInfo: document.getElementById('lastRunInfo'),
            periodButtons: document.querySelectorAll('.period-button')
        };

        // Удаляем старое пустое состояние
        const existingEmptyState = document.querySelector('.empty-state');
        if (existingEmptyState) {
            existingEmptyState.remove();
        }

        // Обновляем приветствие
        if (elements.welcomeMessage) {
            elements.welcomeMessage.textContent = data.welcomeMessage;
        }

        if (elements.lastRunInfo && data.stats) {
            elements.lastRunInfo.textContent = data.stats.lastRunInfo;
        }

        // Обновляем контент в зависимости от наличия данных
        if (!data.hasRuns) {
            // Показываем пустое состояние
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <h2>Нет пробежек за ${currentPeriod === 'year' ? 'год' : currentPeriod === 'month' ? 'месяц' : 'неделю'}</h2>
                <p>Подключите Telegram бота для синхронизации данных о ваших пробежках</p>
                <button id="syncButton" class="sync-button">
                    <span class="button-icon">🔄</span>
                    Синхронизировать с Telegram
                </button>
            `;
            elements.dashboardContent.appendChild(emptyState);

            // Добавляем обработчик для кнопки синхронизации
            const syncButton = document.getElementById('syncButton');
            if (syncButton) {
                syncButton.addEventListener('click', handleTelegramSync);
            }

            // Скрываем секции с данными
            if (elements.progressSection) elements.progressSection.style.display = 'none';
            if (elements.metricsGrid) elements.metricsGrid.style.display = 'none';
            if (elements.recentRuns) elements.recentRuns.style.display = 'none';
            if (elements.actionButtons) elements.actionButtons.style.display = 'none';
        } else {
            // Обновляем прогресс
            if (elements.progressSection && data.yearlyGoal > 0) {
                const percentage = Math.min((data.stats.totalDistance / data.yearlyGoal) * 100, 100);
                elements.progressSection.innerHTML = `
                    <div class="progress-info">
                        <span class="progress-label">Цель на год: ${data.yearlyGoal} км</span>
                        <span class="progress-value">${percentage.toFixed(1)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                `;
                elements.progressSection.style.display = 'block';
            }

            // Обновляем метрики
            if (elements.metricsGrid) {
                const metrics = {
                    totalDistance: document.querySelector('#totalDistanceCard .metric-value'),
                    avgDistance: document.querySelector('#avgDistanceCard .metric-value'),
                    totalRuns: document.querySelector('#totalRunsCard .metric-value')
                };

                if (metrics.totalDistance) metrics.totalDistance.textContent = `${data.stats.totalDistance.toFixed(1)} км`;
                if (metrics.avgDistance) metrics.avgDistance.textContent = `${data.stats.avgDistance.toFixed(1)} км`;
                if (metrics.totalRuns) metrics.totalRuns.textContent = data.stats.totalRuns;
                elements.metricsGrid.style.display = 'grid';
            }

            // Обновляем таблицу пробежек
            if (elements.recentRuns) {
                const tbody = document.getElementById('runsTableBody');
                if (tbody) {
                    tbody.innerHTML = data.recentRuns.map(run => `
                        <tr>
                            <td>${new Date(run.date_added).toLocaleDateString()}</td>
                            <td class="distance">${run.km.toFixed(1)}</td>
                            <td class="time">${run.duration || '-'}</td>
                            <td class="notes">${run.notes || ''}</td>
                        </tr>
                    `).join('');
                    elements.recentRuns.style.display = 'block';
                }
            }

            // Показываем кнопки действий
            if (elements.actionButtons) {
                elements.actionButtons.style.display = 'flex';
            }
        }

        // Обновляем активную кнопку периода
        elements.periodButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.period === currentPeriod);
        });

        console.groupEnd();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showError('Произошла ошибка при загрузке данных');
        console.groupEnd();
    }
}

// Обработчик выхода
async function handleLogout() {
    try {
        console.group('Процесс выхода');
        console.log('1. Начало процесса выхода');
        
        // Проверяем состояние перед выходом с принудительной проверкой авторизации
        const user = await checkAuth(true);
        if (!user) {
            console.log('Пользователь уже не авторизован');
            window.location.href = '/';
            return;
        }
        
        // Проверяем состояние перед выходом
        const cookies = document.cookie.split(';');
        console.log('2. Текущие куки перед выходом:', cookies);
        
        console.log('3. Вызываем функцию logout');
        const result = await logout();
        console.log('4. Результат logout:', result);
        
        console.log('5. Проверяем куки после выхода:', document.cookie);
        
        console.log('6. Выполняем редирект на главную страницу');
        console.groupEnd();
        
        window.location.href = '/';
    } catch (error) {
        console.error('Ошибка при выходе:', error);
        showError('Произошла ошибка при выходе');
        console.groupEnd();
        window.location.href = '/';
    }
}

// Функция для переключения вкладок
async function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    const buttons = document.querySelectorAll('.tab-button');
    
    tabs.forEach(tab => {
        tab.style.display = tab.id === `${tabName}Tab` ? 'block' : 'none';
    });
    
    buttons.forEach(button => {
        button.classList.toggle('active', button.dataset.tab === tabName);
    });

    if (tabName === 'analytics') {
        await loadDetailedAnalytics();
    } else if (tabName === 'training') {
        loadTrainingPlan();
    }
}

// Добавляем функции для создания графиков после существующего кода
function createRunningTrendsChart(runs) {
    const ctx = document.getElementById('runningTrendsChart');
    if (!ctx) return;

    // Сортируем пробежки по дате
    const sortedRuns = [...runs].sort((a, b) => new Date(a.date_added) - new Date(b.date_added));
    
    // Подготавливаем данные
    const data = {
        labels: sortedRuns.map(run => new Date(run.date_added).toLocaleDateString()),
        datasets: [{
            label: 'Дистанция (км)',
            data: sortedRuns.map(run => run.km),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
            fill: false
        }]
    };

    new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Динамика пробежек'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Километры'
                    }
                }
            }
        }
    });
}

function createActivityHeatmap(runs) {
    const ctx = document.getElementById('activityHeatmap');
    if (!ctx) return;

    // Подготавливаем данные по дням недели
    const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const activityByDay = new Array(7).fill(0);

    runs.forEach(run => {
        const date = new Date(run.date_added);
        const dayIndex = (date.getDay() + 6) % 7; // Преобразуем 0 (воскресенье) в 6
        activityByDay[dayIndex]++;
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: daysOfWeek,
            datasets: [{
                label: 'Количество пробежек',
                data: activityByDay,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Активность по дням недели'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Количество пробежек'
                    }
                }
            }
        }
    });
}

function createDistanceDistributionChart(runs) {
    const ctx = document.getElementById('distanceDistribution');
    if (!ctx) return;

    // Создаем диапазоны дистанций
    const ranges = [
        { min: 0, max: 3, label: '0-3 км' },
        { min: 3, max: 5, label: '3-5 км' },
        { min: 5, max: 10, label: '5-10 км' },
        { min: 10, max: 15, label: '10-15 км' },
        { min: 15, max: Infinity, label: '15+ км' }
    ];

    // Считаем количество пробежек в каждом диапазоне
    const distribution = ranges.map(range => ({
        ...range,
        count: runs.filter(run => run.km >= range.min && run.km < range.max).length
    }));

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: distribution.map(d => d.label),
            datasets: [{
                data: distribution.map(d => d.count),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Распределение дистанций'
                }
            }
        }
    });
}

// Обновляем функцию loadDetailedAnalytics
async function loadDetailedAnalytics() {
    try {
        console.group('Загрузка детальной аналитики');
        
        const allRuns = await getRuns(null, null);
        console.log('Получены пробежки:', allRuns);

        if (!allRuns || allRuns.length === 0) {
            showEmptyState();
            return;
        }

        // Группируем пробежки по месяцам
        const monthlyRuns = allRuns.reduce((groups, run) => {
            const date = new Date(run.date_added);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            if (!groups[monthKey]) {
                groups[monthKey] = [];
            }
            groups[monthKey].push(run);
            return groups;
        }, {});

        // Создаем контейнер для аналитики
        const analyticsTab = document.getElementById('analyticsTab');
        analyticsTab.innerHTML = `
            <div class="analytics-container">
                ${createMonthlyStats(monthlyRuns)}
            </div>
        `;

        // Добавляем стили
        const style = document.createElement('style');
        style.textContent = `
            .analytics-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }

            .month-section {
                background: white;
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            .month-title {
                font-size: 20px;
                font-weight: bold;
                color: #333;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid #eee;
            }

            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }

            .stat-item {
                padding: 10px;
                background: #f8f9fa;
                border-radius: 8px;
            }

            .stat-label {
                color: #666;
                font-size: 14px;
                margin-bottom: 5px;
            }

            .stat-value {
                color: #333;
                font-size: 16px;
                font-weight: bold;
            }

            .runs-list {
                border-top: 1px solid #eee;
                padding-top: 15px;
            }

            .run-item {
                display: flex;
                justify-content: space-between;
                padding: 10px;
                border-bottom: 1px solid #eee;
            }

            .run-date {
                color: #666;
                min-width: 120px;
            }

            .run-distance {
                font-weight: bold;
                color: #333;
            }

            .run-notes {
                color: #666;
                font-style: italic;
                margin-left: 20px;
                flex-grow: 1;
            }

            @media (max-width: 768px) {
                .analytics-container {
                    padding: 10px;
                }

                .month-section {
                    padding: 15px;
                }

                .stats-grid {
                    grid-template-columns: 1fr;
                    gap: 10px;
                }

                .run-item {
                    flex-direction: column;
                    gap: 5px;
                }

                .run-notes {
                    margin-left: 0;
                }
            }
        `;
        document.head.appendChild(style);

    } catch (error) {
        console.error('Ошибка при загрузке аналитики:', error);
        showError('Не удалось загрузить аналитику');
    }
}

function createMonthlyStats(monthlyRuns) {
    // Сортируем месяцы в обратном порядке
    const sortedMonths = Object.keys(monthlyRuns).sort().reverse();

    return sortedMonths.map(monthKey => {
        const runs = monthlyRuns[monthKey];
        const [year, month] = monthKey.split('-');
        const date = new Date(year, month - 1);

        // Рассчитываем статистику за месяц
        const totalDistance = runs.reduce((sum, run) => sum + run.km, 0);
        const avgDistance = totalDistance / runs.length;
        const maxRun = Math.max(...runs.map(run => run.km));
        const minRun = Math.min(...runs.map(run => run.km));
        const totalRuns = runs.length;

        // Сортируем пробежки по дате (новые сверху)
        const sortedRuns = [...runs].sort((a, b) => new Date(b.date_added) - new Date(a.date_added));

        return `
            <div class="month-section">
                <div class="month-title">
                    ${date.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}
                </div>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-label">Всего пробежек</div>
                        <div class="stat-value">${totalRuns}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Общая дистанция</div>
                        <div class="stat-value">${formatNumber(totalDistance)} км</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Средняя дистанция</div>
                        <div class="stat-value">${formatNumber(avgDistance)} км</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Лучшая пробежка</div>
                        <div class="stat-value">${formatNumber(maxRun)} км</div>
                    </div>
                </div>
                <div class="runs-list">
                    ${sortedRuns.map(run => `
                        <div class="run-item">
                            <span class="run-date">
                                ${new Date(run.date_added).toLocaleDateString('ru-RU', {
                                    day: 'numeric',
                                    month: 'short'
                                })}
                            </span>
                            <span class="run-distance">${formatNumber(run.km)} км</span>
                            ${run.notes ? `<span class="run-notes">${run.notes}</span>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// Добавляем функцию для отображения пустого состояния
function showEmptyState() {
    console.log('Показываем пустое состояние');
    document.getElementById('analyticsTab').innerHTML = `
        <div class="empty-state">
            <h2>Нет данных о пробежках</h2>
            <p>Подключите Telegram бота для синхронизации данных о ваших пробежках</p>
            <button id="syncButtonAnalytics" class="sync-button">
                <span class="button-icon">🔄</span>
                Синхронизировать с Telegram
            </button>
        </div>
    `;
    
    const syncButton = document.getElementById('syncButtonAnalytics');
    if (syncButton) {
        syncButton.addEventListener('click', handleTelegramSync);
    }
    console.groupEnd();
}

// Функция для загрузки вкладки с планом тренировок
function loadTrainingPlan() {
    const trainingTab = document.getElementById('trainingTab');
    if (!trainingTab) return;

    trainingTab.innerHTML = `
        <div class="training-plan-container">
            <div class="request-section">
                <h2>Получить план тренировок</h2>
                <div class="goals-form">
                    <div class="form-group">
                        <label for="mainGoal">Основная цель</label>
                        <select id="mainGoal" class="form-control">
                            <option value="improve_endurance">Улучшить выносливость</option>
                            <option value="increase_distance">Увеличить дистанцию</option>
                            <option value="improve_speed">Улучшить скорость</option>
                            <option value="weight_loss">Снижение веса</option>
                            <option value="marathon_prep">Подготовка к марафону</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="trainingDays">Количество тренировок в неделю</label>
                        <select id="trainingDays" class="form-control">
                            <option value="2">2 дня</option>
                            <option value="3" selected>3 дня</option>
                            <option value="4">4 дня</option>
                            <option value="5">5 дней</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="currentLevel">Текущий уровень</label>
                        <select id="currentLevel" class="form-control">
                            <option value="beginner">Начинающий (до 5 км)</option>
                            <option value="intermediate">Средний (5-10 км)</option>
                            <option value="advanced">Продвинутый (более 10 км)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="additionalNotes">Дополнительные пожелания</label>
                        <textarea id="additionalNotes" class="form-control" rows="3" 
                            placeholder="Например: предпочитаемое время тренировок, ограничения по здоровью, специфические цели"></textarea>
                    </div>
                    <button id="generatePlanButton" class="primary-button">
                        Сгенерировать план
                    </button>
                </div>
            </div>
            <div id="planResult" class="plan-result" style="display: none;">
                <div class="plan-header">
                    <h3>Ваш план тренировок</h3>
                    <div class="plan-actions">
                        <button class="secondary-button" onclick="savePlan()">
                            <span class="button-icon">💾</span> Сохранить
                        </button>
                        <button class="secondary-button" onclick="sharePlan()">
                            <span class="button-icon">📤</span> Поделиться
                        </button>
                    </div>
                </div>
                <div class="plan-content">
                    <div class="plan-overview">
                        <div class="overview-item">
                            <span class="overview-label">Длительность плана:</span>
                            <span class="overview-value">4 недели</span>
                        </div>
                        <div class="overview-item">
                            <span class="overview-label">Тренировок в неделю:</span>
                            <span class="overview-value">3</span>
                        </div>
                        <div class="overview-item">
                            <span class="overview-label">Общая дистанция:</span>
                            <span class="overview-value">120 км</span>
                        </div>
                    </div>
                    <div class="weekly-plans">
                        <!-- Здесь будет контент плана -->
                    </div>
                </div>
            </div>
        </div>
    `;

    // Добавляем стили
    const style = document.createElement('style');
    style.textContent = `
        .training-plan-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }

        .request-section {
            background: white;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .request-section h2 {
            margin: 0 0 20px 0;
            color: #333;
            font-size: 24px;
        }

        .goals-form {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .form-group label {
            color: #666;
            font-size: 14px;
        }

        .form-control {
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
        }

        .primary-button {
            background: #4e73df;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.2s;
        }

        .primary-button:hover {
            background: #2e59d9;
        }

        .plan-result {
            background: white;
            border-radius: 15px;
            padding: 20px;
            margin-top: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .plan-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
        }

        .plan-actions {
            display: flex;
            gap: 10px;
        }

        .secondary-button {
            background: #f8f9fa;
            border: 1px solid #ddd;
            padding: 8px 15px;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .secondary-button:hover {
            background: #e9ecef;
        }

        .plan-overview {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 10px;
        }

        .overview-item {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .overview-label {
            color: #666;
            font-size: 14px;
        }

        .overview-value {
            color: #333;
            font-size: 18px;
            font-weight: bold;
        }

        .weekly-plans {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        @media (max-width: 768px) {
            .training-plan-container {
                padding: 10px;
            }

            .plan-header {
                flex-direction: column;
                gap: 10px;
                align-items: flex-start;
            }

            .plan-actions {
                width: 100%;
                justify-content: space-between;
            }

            .plan-overview {
                grid-template-columns: 1fr;
            }
        }
    `;
    document.head.appendChild(style);

    // Добавляем обработчик для кнопки генерации плана
    const generateButton = document.getElementById('generatePlanButton');
    if (generateButton) {
        generateButton.addEventListener('click', generateTrainingPlan);
    }
}

// Функция для генерации плана тренировок
async function generateTrainingPlan() {
    const planResult = document.getElementById('planResult');
    const weeklyPlans = planResult.querySelector('.weekly-plans');
    
    // Показываем результат
    planResult.style.display = 'block';
    
    // Пример структуры плана (потом заменим на реальные данные от API)
    weeklyPlans.innerHTML = `
        <div class="week-plan">
            <h4>Неделя 1 - Адаптация</h4>
            <div class="training-days">
                <div class="training-day">
                    <div class="day-header">
                        <span class="day-title">День 1</span>
                        <span class="day-type">Легкая пробежка</span>
                    </div>
                    <div class="day-content">
                        <div class="workout-details">
                            <span class="detail-item">🏃‍♂️ Дистанция: 5 км</span>
                            <span class="detail-item">⏱️ Темп: 7:00 мин/км</span>
                            <span class="detail-item">💪 Интенсивность: Низкая</span>
                        </div>
                        <div class="workout-notes">
                            Разминка 5-10 минут, легкий бег в комфортном темпе, заминка 5 минут
                        </div>
                    </div>
                </div>
                <!-- Добавьте больше дней по аналогии -->
            </div>
        </div>
    `;

    // Добавляем стили для плана
    const style = document.createElement('style');
    style.textContent += `
        .week-plan {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 15px;
        }

        .week-plan h4 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 18px;
        }

        .training-days {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .training-day {
            background: white;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .day-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }

        .day-title {
            font-weight: bold;
            color: #333;
        }

        .day-type {
            color: #666;
            font-size: 14px;
        }

        .workout-details {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 10px;
        }

        .detail-item {
            color: #333;
            font-size: 14px;
        }

        .workout-notes {
            color: #666;
            font-size: 14px;
            font-style: italic;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 6px;
        }
    `;
    document.head.appendChild(style);
}

// Функция для инициализации интерфейса с вкладками
function initializeTabs() {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;

    // Добавляем навигацию по вкладкам
    const tabsNav = document.createElement('div');
    tabsNav.className = 'tabs-navigation';
    tabsNav.innerHTML = `
        <button class="tab-button active" data-tab="current">Текущие данные</button>
        <button class="tab-button" data-tab="analytics">Аналитика</button>
        <button class="tab-button" data-tab="training">План тренировок</button>
    `;
    dashboardContent.insertBefore(tabsNav, dashboardContent.firstChild);

    // Создаем контейнеры для вкладок
    const currentTab = document.createElement('div');
    currentTab.id = 'currentTab';
    currentTab.className = 'tab-content';
    
    // Перемещаем существующий контент в currentTab
    while (dashboardContent.children.length > 1) {
        currentTab.appendChild(dashboardContent.children[1]);
    }
    
    const analyticsTab = document.createElement('div');
    analyticsTab.id = 'analyticsTab';
    analyticsTab.className = 'tab-content';
    analyticsTab.style.display = 'none';

    const trainingTab = document.createElement('div');
    trainingTab.id = 'trainingTab';
    trainingTab.className = 'tab-content';
    trainingTab.style.display = 'none';

    // Добавляем вкладки в контейнер
    dashboardContent.appendChild(currentTab);
    dashboardContent.appendChild(analyticsTab);
    dashboardContent.appendChild(trainingTab);

    // Добавляем стили для вкладок
    const style = document.createElement('style');
    style.textContent = `
        .tabs-navigation {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            padding: 0 20px;
        }

        .tab-button {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            background: #f8f9fa;
            color: #666;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 14px;
        }

        .tab-button:hover {
            background: #e9ecef;
        }

        .tab-button.active {
            background: #4e73df;
            color: white;
        }

        .tab-content {
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @media (max-width: 768px) {
            .tabs-navigation {
                padding: 0 10px;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
            }

            .tab-button {
                padding: 8px 15px;
                font-size: 13px;
                white-space: nowrap;
            }
        }
    `;
    document.head.appendChild(style);

    // Добавляем обработчики для кнопок вкладок
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });
}

// Инициализация страницы
let isInitialized = false;
let isLoading = false;

document.addEventListener('DOMContentLoaded', async function() {
    console.group('Инициализация страницы');
    
    if (isInitialized || isLoading) {
        console.warn('Страница уже инициализирована или загружается');
        console.groupEnd();
        return;
    }
    
    isLoading = true;

    try {
        // Инициализируем вкладки
        initializeTabs();

        // Настраиваем обработчики событий
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', handleLogout);
        }

        const refreshButton = document.getElementById('refreshButton');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => loadUserData(true));
        }

        const viewLogsButton = document.getElementById('viewLogsButton');
        if (viewLogsButton) {
            viewLogsButton.addEventListener('click', viewLogs);
        }

        const exportButton = document.getElementById('exportButton');
        if (exportButton) {
            exportButton.addEventListener('click', () => {
                showError('Функция экспорта данных находится в разработке');
            });
        }

        // Добавляем обработчики для кнопок периода
        const periodButtons = document.querySelectorAll('.period-button');
        periodButtons.forEach(button => {
            button.addEventListener('click', () => updatePeriod(button.dataset.period));
        });

        // Добавляем обработчики для вкладок
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => switchTab(button.dataset.tab));
        });

        // Загружаем данные
        await loadUserData(false);
        
        isInitialized = true;
        console.log('Инициализация завершена');
    } finally {
        isLoading = false;
        console.groupEnd();
    }
}); 