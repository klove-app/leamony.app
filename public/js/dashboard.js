import { checkAuth, logout, getRuns, viewLogs, getTelegramBotLink } from './api.js';
import { Chart, registerables } from 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/+esm';
import ApexCharts from 'https://cdn.jsdelivr.net/npm/apexcharts@3.45.1/+esm';
import { TrainingPlanForm } from './components/TrainingPlanForm.js';

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
    console.group('Обновление таблицы пробежек');
    console.log('Пробежки для таблицы:', runs);
    
    const runsSection = document.querySelector('.recent-runs');
    const tbody = document.getElementById('runsTableBody');
    
    if (!runsSection || !tbody) {
        console.error('Секция пробежек или таблица не найдены');
        console.groupEnd();
        return;
    }

    // Очищаем таблицу
    tbody.innerHTML = '';

    // Проверяем наличие данных
    if (!runs || runs.length === 0) {
        runsSection.style.display = 'none';
        console.log('Нет данных для отображения');
        console.groupEnd();
        return;
    }

    // Добавляем строки с пробежками
    runs.forEach(run => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${new Date(run.date_added).toLocaleDateString()}</td>
            <td class="distance">${run.km.toFixed(1)}</td>
            <td class="time">${run.duration || '-'}</td>
            <td class="notes">${run.notes || ''}</td>
        `;
        tbody.appendChild(tr);
    });

    // Показываем секцию с пробежками
    runsSection.style.display = 'block';
    
    console.log('Таблица обновлена');
    console.groupEnd();
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

// Функция для создания базовой структуры контента
function createBaseStructure() {
    return `
        <div class="welcome-message"></div>
        <div class="period-selector">
            <button class="period-button" data-period="week">Неделя</button>
            <button class="period-button" data-period="month">Месяц</button>
            <button class="period-button active" data-period="year">Год</button>
        </div>
        <div class="metrics-grid">
            <div class="metric-card">
                <h3>Общая дистанция</h3>
                <div class="metric-value">0 км</div>
            </div>
            <div class="metric-card">
                <h3>Средняя дистанция</h3>
                <div class="metric-value">0 км</div>
            </div>
            <div class="metric-card">
                <h3>Всего пробежек</h3>
                <div class="metric-value">0</div>
            </div>
        </div>
        <div class="recent-runs">
            <h3>Недавние пробежки</h3>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ДАТА</th>
                            <th>ДИСТАНЦИЯ (КМ)</th>
                            <th>ВРЕМЯ</th>
                            <th>ЗАМЕТКИ</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
        <div class="all-runs">
            <h3>История пробежек</h3>
            <div class="months-container"></div>
        </div>
        <div class="action-buttons">
            <button id="refreshButton" class="action-button">
                <span class="button-icon">🔄</span> Обновить данные
            </button>
            <button id="viewLogsButton" class="action-button">
                <span class="button-icon">📋</span> Просмотр логов
            </button>
            <button id="exportButton" class="action-button">
                <span class="button-icon">📊</span> Экспорт данных
            </button>
        </div>
    `;
}

// Функция для инициализации вкладок
function initializeTabs() {
    console.group('Инициализация вкладок');
    
    // Создаем основной контейнер для контента
    const mainContent = document.querySelector('.dashboard-content');
    if (!mainContent) {
        console.error('Не найден контейнер для контента');
        console.groupEnd();
        return;
    }

    // Очищаем основной контейнер
    mainContent.innerHTML = '';

    // Создаем навигацию
    const tabNavigation = document.createElement('div');
    tabNavigation.className = 'tab-navigation';
    tabNavigation.innerHTML = `
        <button class="tab-button active" data-tab="current">Аналитика</button>
        <button class="tab-button" data-tab="training">Тренировочный план</button>
    `;

    // Создаем контейнеры для контента вкладок
    const tabContainers = document.createElement('div');
    tabContainers.className = 'tab-containers';
    tabContainers.innerHTML = `
        <div id="currentTab" class="tab-content active"></div>
        <div id="trainingTab" class="tab-content"></div>
    `;

    // Добавляем элементы на страницу
    mainContent.appendChild(tabNavigation);
    mainContent.appendChild(tabContainers);

    // Создаем базовую структуру для первой вкладки
    const currentTab = document.getElementById('currentTab');
    currentTab.innerHTML = createBaseStructure();

    // Добавляем обработчики для кнопок
    const buttons = tabNavigation.querySelectorAll('.tab-button');
    buttons.forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });

    // Добавляем обработчики для кнопок действий
    const refreshButton = currentTab.querySelector('#refreshButton');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => loadUserData(true));
    }

    const viewLogsButton = currentTab.querySelector('#viewLogsButton');
    if (viewLogsButton) {
        viewLogsButton.addEventListener('click', viewLogs);
    }

    const exportButton = currentTab.querySelector('#exportButton');
    if (exportButton) {
        exportButton.addEventListener('click', () => {
            showError('Функция экспорта данных находится в разработке');
        });
    }

    // Загружаем данные для аналитики
    loadUserData();

    console.log('Инициализация вкладок завершена');
    console.groupEnd();
}

// Функция для переключения вкладок
async function switchTab(tabName) {
    console.group('Переключение на вкладку:', tabName);
    
    try {
        // Обновляем активную кнопку
        const buttons = document.querySelectorAll('.tab-button');
        buttons.forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabName);
        });

        // Обновляем активный контент
        const tabs = document.querySelectorAll('.tab-content');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.id === `${tabName}Tab`);
        });

        // Инициализируем контент для каждой вкладки
        if (tabName === 'training') {
            const trainingTab = document.getElementById('trainingTab');
            if (trainingTab && !trainingTab.querySelector('.training-plan-form')) {
                console.log('Инициализация формы плана тренировок');
                new TrainingPlanForm(trainingTab);
            }
        } else if (tabName === 'current') {
            console.log('Загрузка текущих данных');
            await loadUserData();
        }

        console.log('Вкладка успешно переключена');
    } catch (error) {
        console.error('Ошибка при переключении вкладки:', error);
        showError('Произошла ошибка при переключении вкладки');
    }

    console.groupEnd();
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
        console.log('Запрашиваем данные за период:', { startDate, endDate });

        const response = await getRuns(startDate, endDate);
        console.log('Получен ответ:', response);
        
        // Преобразуем данные в нужный формат
        const runs = Array.isArray(response) ? response : [];
        console.log('Преобразованные пробежки:', runs);

        // Подготавливаем данные для обновления
        const data = {
            welcomeMessage: `Привет, ${user.username}! 👋`,
            stats: calculateStats(runs),
            recentRuns: runs.slice(0, 5),
            runs: runs
        };

        // Обновляем дашборд
        updateDashboard(data);

        console.log('Данные успешно загружены');
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        showError('Не удалось загрузить данные');
    } finally {
        console.groupEnd();
    }
}

function calculateStats(runs) {
    if (!runs || runs.length === 0) {
        return {
            totalDistance: 0,
            avgDistance: 0,
            totalRuns: 0
        };
    }

    const totalDistance = runs.reduce((sum, run) => sum + parseFloat(run.km || 0), 0);
    const avgDistance = totalDistance / runs.length;

    return {
        totalDistance: totalDistance.toFixed(1),
        avgDistance: avgDistance.toFixed(1),
        totalRuns: runs.length
    };
}

function updateDashboard(data) {
    console.group('Обновление дашборда');
    
    try {
        const currentTab = document.getElementById('currentTab');
        if (!currentTab) {
            console.error('Не найден контейнер для контента');
            return;
        }

        // Обновляем приветственное сообщение
        const welcomeMessage = currentTab.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.textContent = data.welcomeMessage;
        }

        // Обновляем метрики
        if (data.stats) {
            updateMetrics(data.stats);
        }

        // Обновляем таблицу недавних пробежек
        if (data.recentRuns) {
            updateRecentRuns(data.recentRuns);
        }

        // Обновляем историю пробежек по месяцам
        if (data.runs) {
            updateMonthlyRuns(data.runs);
        }

        console.log('Дашборд успешно обновлен');
    } catch (error) {
        console.error('Ошибка при обновлении дашборда:', error);
        showError('Произошла ошибка при обновлении данных');
    }

    console.groupEnd();
}

function updateMetrics(stats) {
    console.group('Обновление метрик');
    
    try {
        const metricCards = document.querySelectorAll('.metric-card .metric-value');
        if (metricCards.length >= 3) {
            metricCards[0].textContent = `${stats.totalDistance} км`;
            metricCards[1].textContent = `${stats.avgDistance} км`;
            metricCards[2].textContent = stats.totalRuns;
        }

        console.log('Метрики успешно обновлены');
    } catch (error) {
        console.error('Ошибка при обновлении метрик:', error);
    }

    console.groupEnd();
}

function updateRecentRuns(runs) {
    console.group('Обновление таблицы недавних пробежек');
    
    try {
        const tbody = document.querySelector('.recent-runs table tbody');
        if (!tbody) {
            console.error('Не найдена таблица для недавних пробежек');
            return;
        }

        if (!runs || runs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">Нет данных о пробежках</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = runs.map(run => `
            <tr>
                <td>${new Date(run.date_added).toLocaleDateString()}</td>
                <td class="distance">${run.km}</td>
                <td>${run.time || '-'}</td>
                <td class="notes">${run.notes || '-'}</td>
            </tr>
        `).join('');

        console.log('Таблица недавних пробежек обновлена');
    } catch (error) {
        console.error('Ошибка при обновлении таблицы:', error);
    }

    console.groupEnd();
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
        
        const response = await getRuns(null, null);
        console.log('Получены пробежки:', response);

        // Убедимся, что у нас есть массив пробежек
        const allRuns = Array.isArray(response) ? response : [];

        if (allRuns.length === 0) {
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
            :root {
                --primary-purple: #6B4DE6;
                --primary-pink: #FF6B9B;
                --light-purple: #F5F3FF;
                --light-pink: #FFF3F7;
                --dark-purple: #5B3ED6;
                --dark-pink: #FF5B8B;
            }

            .analytics-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }

            .year-section {
                margin-bottom: 2rem;
                background: white;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(107, 77, 230, 0.1);
            }
            
            .year-header {
                padding: 1.5rem;
                background: linear-gradient(45deg, var(--light-purple), var(--light-pink));
                border-radius: 12px 12px 0 0;
            }
            
            .year-header h2 {
                margin: 0 0 1rem 0;
                color: var(--primary-purple);
                font-size: 1.5rem;
                font-weight: 600;
            }
            
            .year-stats {
                display: flex;
                gap: 2rem;
                justify-content: space-between;
            }
            
            .months-list {
                padding: 1rem;
            }
            
            .month-section {
                background: white;
                border-radius: 8px;
                margin-bottom: 0.5rem;
                border: 1px solid var(--light-purple);
            }
            
            .month-section:last-child {
                margin-bottom: 0;
            }
            
            .month-header {
                padding: 1rem 1.5rem;
                display: flex;
                align-items: center;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .month-header:hover {
                background: var(--light-purple);
            }
            
            .month-title {
                flex: 0 0 200px;
            }
            
            .month-title h3 {
                margin: 0;
                color: var(--primary-purple);
                font-size: 1.1rem;
                font-weight: 500;
            }
            
            .month-stats {
                flex: 1;
                display: flex;
                gap: 2rem;
                justify-content: center;
            }
            
            .stat-item {
                text-align: center;
            }
            
            .stat-label {
                font-size: 0.8rem;
                color: #666;
                margin-bottom: 0.25rem;
            }
            
            .stat-value {
                font-size: 1rem;
                font-weight: 600;
                color: var(--primary-purple);
            }
            
            .expand-icon {
                margin-left: 1rem;
                color: var(--primary-purple);
                transition: transform 0.2s;
            }
            
            .month-section.expanded .expand-icon {
                transform: rotate(180deg);
            }
            
            .runs-list {
                display: none;
                padding: 1rem 1.5rem;
                background: var(--light-purple);
                border-radius: 0 0 8px 8px;
            }
            
            .month-section.expanded .runs-list {
                display: block;
            }
            
            .run-item {
                display: flex;
                align-items: center;
                padding: 0.75rem 1rem;
                background: white;
                border-radius: 6px;
                margin-bottom: 0.5rem;
            }
            
            .run-item:last-child {
                margin-bottom: 0;
            }
            
            .run-date {
                flex: 0 0 120px;
                color: #666;
            }
            
            .run-distance {
                flex: 0 0 100px;
                font-weight: 600;
                color: var(--primary-pink);
            }
            
            .run-notes {
                flex: 1;
                color: #666;
                margin-left: 1rem;
                font-style: italic;
            }

            @media (max-width: 768px) {
                .month-header {
                    flex-direction: column;
                    align-items: flex-start;
                }

                .month-title {
                    flex: none;
                    margin-bottom: 0.5rem;
                }

                .month-stats {
                    flex-direction: column;
                    gap: 0.5rem;
                    width: 100%;
                }

                .stat-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    text-align: left;
                }

                .stat-label {
                    margin-bottom: 0;
                }

                .year-stats {
                    flex-direction: column;
                    gap: 0.5rem;
                }
            }
        `;
        document.head.appendChild(style);

        console.groupEnd();
    } catch (error) {
        console.error('Ошибка при загрузке аналитики:', error);
        showError('Не удалось загрузить аналитику');
        console.groupEnd();
    }
}

function createMonthlyStats(monthlyRuns) {
    // Группируем месяцы по годам
    const yearlyGroups = {};
    Object.keys(monthlyRuns).forEach(monthKey => {
        const [year] = monthKey.split('-');
        if (!yearlyGroups[year]) {
            yearlyGroups[year] = {};
        }
        yearlyGroups[year][monthKey] = monthlyRuns[monthKey];
    });

    // Сортируем годы в обратном порядке (от нового к старому)
    const years = Object.keys(yearlyGroups).sort((a, b) => b - a);
    
    let html = '';
    
    years.forEach(year => {
        const yearRuns = Object.values(yearlyGroups[year]).flat();
        const yearTotalDistance = yearRuns.reduce((sum, run) => sum + run.km, 0);
        const yearAvgDistance = yearTotalDistance / yearRuns.length;
        const yearTotalRuns = yearRuns.length;

        html += `
            <div class="year-section">
                <div class="year-header">
                    <h2>${year}</h2>
                    <div class="year-stats">
                        <div class="stat-item">
                            <div class="stat-label">Общая дистанция за год</div>
                            <div class="stat-value">${yearTotalDistance.toFixed(1)} км</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Средняя дистанция за год</div>
                            <div class="stat-value">${yearAvgDistance.toFixed(1)} км</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Всего пробежек за год</div>
                            <div class="stat-value">${yearTotalRuns}</div>
                        </div>
                    </div>
                </div>
                <div class="months-list">
        `;

        // Получаем и сортируем месяцы для текущего года (от декабря к январю)
        const months = Object.keys(yearlyGroups[year])
            .sort((a, b) => {
                const [, monthA] = a.split('-');
                const [, monthB] = b.split('-');
                return parseInt(monthB) - parseInt(monthA);
            });

        months.forEach(monthKey => {
            const runs = monthlyRuns[monthKey];
            const [, month] = monthKey.split('-');
            const monthName = new Date(year, month - 1).toLocaleString('ru', { month: 'long' });
            
            const totalDistance = runs.reduce((sum, run) => sum + run.km, 0);
            const avgDistance = totalDistance / runs.length;
            const totalRuns = runs.length;

            // Сортируем пробежки по дате (от новых к старым)
            const sortedRuns = [...runs].sort((a, b) => 
                new Date(b.date_added) - new Date(a.date_added)
            );

            html += `
                <div class="month-section">
                    <div class="month-header" onclick="this.closest('.month-section').classList.toggle('expanded')">
                        <div class="month-title">
                            <h3>${monthName}</h3>
                        </div>
                        <div class="month-stats">
                            <div class="stat-item">
                                <div class="stat-label">Общая дистанция</div>
                                <div class="stat-value">${totalDistance.toFixed(1)} км</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">Средняя дистанция</div>
                                <div class="stat-value">${avgDistance.toFixed(1)} км</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">Количество пробежек</div>
                                <div class="stat-value">${totalRuns}</div>
                            </div>
                        </div>
                        <div class="expand-icon">▼</div>
                    </div>
                    <div class="runs-list">
                        ${sortedRuns.map(run => `
                            <div class="run-item">
                                <span class="run-date">
                                    ${new Date(run.date_added).toLocaleDateString('ru')}
                                </span>
                                <span class="run-distance">${run.km.toFixed(1)} км</span>
                                ${run.notes ? `<span class="run-notes">${run.notes}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    return html;
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

// Функция инициализации дашборда
async function initDashboard() {
    console.group('Инициализация дашборда');
    
    try {
        // Проверяем авторизацию
        const user = await checkAuth();
        if (!user) {
            console.log('Пользователь не авторизован, перенаправляем на страницу входа');
            window.location.href = '/login.html';
            return;
        }

        console.log('Пользователь авторизован:', user);

        // Инициализируем вкладки
        initializeTabs();
        console.log('Вкладки инициализированы');

        // Загружаем данные для текущей вкладки
        await loadUserData();
        console.log('Данные пользователя загружены');

        // Настраиваем обработчики событий
        setupEventListeners();
        console.log('Обработчики событий настроены');

        // Инициализируем форму плана тренировок, если мы на соответствующей вкладке
        const activeTab = document.querySelector('.tab-button.active');
        if (activeTab && activeTab.dataset.tab === 'training') {
            const trainingTab = document.getElementById('trainingTab');
            if (trainingTab && !trainingTab.querySelector('.training-plan-form-container')) {
                new TrainingPlanForm(trainingTab);
                console.log('Форма плана тренировок инициализирована');
            }
        }

        console.log('Дашборд успешно инициализирован');
    } catch (error) {
        console.error('Ошибка при инициализации дашборда:', error);
        showError('Не удалось загрузить данные. Попробуйте обновить страницу.');
    }
    
    console.groupEnd();
}

// Запускаем инициализацию при загрузке страницы
document.addEventListener('DOMContentLoaded', initDashboard);

function initializeDashboard() {
    // ... existing code ...
    
    // Добавляем вкладку плана тренировок
    const tabContent = document.querySelector('.tab-content');
    const trainingPlanTab = document.createElement('div');
    trainingPlanTab.id = 'trainingPlanTab';
    trainingPlanTab.className = 'tab-pane';
    tabContent.appendChild(trainingPlanTab);
    
    // Добавляем кнопку вкладки
    const tabSwitcher = document.querySelector('.tab-switcher');
    const trainingPlanButton = document.createElement('button');
    trainingPlanButton.className = 'tab-button';
    trainingPlanButton.textContent = 'План тренировок';
    trainingPlanButton.onclick = () => switchTab('trainingPlanTab');
    tabSwitcher.appendChild(trainingPlanButton);
    
    // Инициализируем форму
    new TrainingPlanForm(trainingPlanTab);
}

// Функция для настройки обработчиков событий
function setupEventListeners() {
    console.group('Настройка обработчиков событий');

    // Обработчик для кнопки выхода
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    // Обработчики для кнопок вкладок
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });

    // Обработчики для кнопок периода
    const periodButtons = document.querySelectorAll('.period-button');
    periodButtons.forEach(button => {
        button.addEventListener('click', () => updatePeriod(button.dataset.period));
    });

    // Обработчик для кнопки обновления данных
    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => loadUserData(true));
    }

    // Обработчик для кнопки просмотра логов
    const viewLogsButton = document.getElementById('viewLogsButton');
    if (viewLogsButton) {
        viewLogsButton.addEventListener('click', viewLogs);
    }

    console.log('Обработчики событий настроены');
    console.groupEnd();
}

function updateMonthlyRuns(runs) {
    console.group('Обновление истории пробежек');
    
    try {
        const monthsContainer = document.querySelector('.months-container');
        if (!monthsContainer) {
            console.error('Не найден контейнер для месяцев');
            return;
        }

        // Группируем пробежки по месяцам
        const runsByMonth = {};
        runs.forEach(run => {
            const date = new Date(run.date_added);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!runsByMonth[monthKey]) {
                runsByMonth[monthKey] = [];
            }
            runsByMonth[monthKey].push(run);
        });

        // Сортируем месяцы в обратном хронологическом порядке
        const sortedMonths = Object.keys(runsByMonth).sort().reverse();

        // Создаем HTML для каждого месяца
        const monthsHTML = sortedMonths.map(monthKey => {
            const [year, month] = monthKey.split('-');
            const monthName = new Date(year, month - 1).toLocaleString('ru', { month: 'long' });
            const monthRuns = runsByMonth[monthKey];
            const totalDistance = monthRuns.reduce((sum, run) => sum + (parseFloat(run.km) || 0), 0).toFixed(1);
            
            const runsHTML = monthRuns.map(run => `
                <tr>
                    <td>${new Date(run.date_added).toLocaleDateString()}</td>
                    <td class="distance">${run.km}</td>
                    <td>${run.time || '-'}</td>
                    <td class="notes">${run.notes || '-'}</td>
                </tr>
            `).join('');

            return `
                <div class="month-section">
                    <div class="month-header" data-month="${monthKey}">
                        <h4>${monthName} ${year}</h4>
                        <div class="month-summary">
                            <span>${monthRuns.length} пробежек</span>
                            <span>${totalDistance} км</span>
                            <span class="toggle-icon">▼</span>
                        </div>
                    </div>
                    <div class="month-content" id="month-${monthKey}">
                        <table>
                            <thead>
                                <tr>
                                    <th>ДАТА</th>
                                    <th>ДИСТАНЦИЯ (КМ)</th>
                                    <th>ВРЕМЯ</th>
                                    <th>ЗАМЕТКИ</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${runsHTML}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }).join('');

        monthsContainer.innerHTML = monthsHTML;

        // Добавляем обработчики для раскрытия/скрытия месяцев
        const monthHeaders = monthsContainer.querySelectorAll('.month-header');
        monthHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const monthKey = header.dataset.month;
                const content = document.getElementById(`month-${monthKey}`);
                const toggleIcon = header.querySelector('.toggle-icon');
                
                content.classList.toggle('expanded');
                toggleIcon.textContent = content.classList.contains('expanded') ? '▼' : '▶';
            });
        });

        console.log('История пробежек успешно обновлена');
    } catch (error) {
        console.error('Ошибка при обновлении истории пробежек:', error);
    }

    console.groupEnd();
} 