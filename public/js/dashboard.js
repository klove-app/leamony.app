import { checkAuth, logout, getRuns, viewLogs, getTelegramBotLink } from './api.js';
import { Chart, registerables } from 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/+esm';

// Регистрируем все компоненты
Chart.register(...registerables);

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
function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    const buttons = document.querySelectorAll('.tab-button');
    
    tabs.forEach(tab => {
        tab.style.display = tab.id === `${tabName}Tab` ? 'block' : 'none';
    });
    
    buttons.forEach(button => {
        button.classList.toggle('active', button.dataset.tab === tabName);
    });

    if (tabName === 'analytics') {
        loadDetailedAnalytics();
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

        // Создаем контейнер для графиков
        const analyticsTab = document.getElementById('analyticsTab');
        analyticsTab.innerHTML = `
            <div class="analytics-container">
                <div class="charts-grid">
                    <div class="chart-container">
                        <canvas id="runningTrendsChart"></canvas>
                    </div>
                    <div class="chart-container">
                        <canvas id="activityHeatmap"></canvas>
                    </div>
                    <div class="chart-container">
                        <canvas id="distanceDistribution"></canvas>
                    </div>
                </div>
                <div class="stats-container">
                    ${createDetailedStatsHTML(allRuns)}
                </div>
            </div>
        `;

        // Создаем графики
        createRunningTrendsChart(allRuns);
        createActivityHeatmap(allRuns);
        createDistanceDistributionChart(allRuns);

        // Добавляем стили для графиков
        const style = document.createElement('style');
        style.textContent = `
            .charts-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            .chart-container {
                background: white;
                border-radius: 10px;
                padding: 15px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .stats-container {
                background: white;
                border-radius: 10px;
                padding: 20px;
                margin-top: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
        `;
        document.head.appendChild(style);

    } catch (error) {
        console.error('Ошибка при загрузке аналитики:', error);
        showError('Не удалось загрузить аналитику');
    }
}

function createDetailedStatsHTML(runs) {
    // Рассчитываем дополнительную статистику
    const stats = calculateDetailedStats(runs);
    
    return `
        <h2>Детальная статистика</h2>
        <div class="detailed-stats-grid">
            <div class="stat-card">
                <h3>Лучшая пробежка</h3>
                <p class="stat-value">${stats.bestRun.distance.toFixed(1)} км</p>
                <p class="stat-date">${new Date(stats.bestRun.date).toLocaleDateString()}</p>
            </div>
            <div class="stat-card">
                <h3>Средняя дистанция</h3>
                <p class="stat-value">${stats.averageDistance.toFixed(1)} км</p>
            </div>
            <div class="stat-card">
                <h3>Регулярность</h3>
                <p class="stat-value">${stats.consistency}%</p>
                <p class="stat-subtitle">пробежек по плану</p>
            </div>
        </div>
    `;
}

function calculateDetailedStats(runs) {
    // Находим лучшую пробежку
    const bestRun = runs.reduce((best, run) => 
        run.km > (best?.km || 0) ? run : best, null);

    // Считаем среднюю дистанцию
    const averageDistance = runs.reduce((sum, run) => sum + run.km, 0) / runs.length;

    // Рассчитываем регулярность (пример: процент недель с хотя бы одной пробежкой)
    const weekMap = new Map();
    runs.forEach(run => {
        const date = new Date(run.date_added);
        const weekKey = `${date.getFullYear()}-${getWeekNumber(date)}`;
        weekMap.set(weekKey, true);
    });
    
    const totalWeeks = Math.ceil(
        (new Date(runs[0].date_added) - new Date(runs[runs.length - 1].date_added)) 
        / (7 * 24 * 60 * 60 * 1000)
    );
    
    const consistency = Math.round((weekMap.size / totalWeeks) * 100);

    return {
        bestRun: {
            distance: bestRun.km,
            date: bestRun.date_added
        },
        averageDistance,
        consistency
    };
}

// Вспомогательная функция для получения номера недели
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
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