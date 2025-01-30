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
        <h2 id="welcomeMessage"></h2>
        <p id="lastRunInfo"></p>
        
        <div class="period-selector">
            <button class="period-button" data-period="week">Неделя</button>
            <button class="period-button" data-period="month">Месяц</button>
            <button class="period-button active" data-period="year">Год</button>
        </div>

        <div id="progressSection" class="progress-section"></div>
        
        <div class="metrics-grid">
            <div class="metric-card" id="totalDistanceCard">
                <div class="metric-title">Общая дистанция</div>
                <div class="metric-value">0 км</div>
            </div>
            <div class="metric-card" id="avgDistanceCard">
                <div class="metric-title">Средняя дистанция</div>
                <div class="metric-value">0 км</div>
            </div>
            <div class="metric-card" id="totalRunsCard">
                <div class="metric-title">Всего пробежек</div>
                <div class="metric-value">0</div>
            </div>
        </div>

        <div class="recent-runs" style="display: none;">
            <h3>Недавние пробежки</h3>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Дата</th>
                            <th>Дистанция (км)</th>
                            <th>Время</th>
                            <th>Заметки</th>
                        </tr>
                    </thead>
                    <tbody id="runsTableBody"></tbody>
                </table>
            </div>
        </div>

        <div class="action-buttons">
            <button id="refreshButton" class="action-button">
                <span class="button-icon">🔄</span>
                Обновить данные
            </button>
            <button id="viewLogsButton" class="action-button">
                <span class="button-icon">📋</span>
                Просмотр логов
            </button>
            <button id="exportButton" class="action-button">
                <span class="button-icon">📊</span>
                Экспорт данных
            </button>
        </div>
    `;
}

// Функция для инициализации вкладок
function initializeTabs() {
    console.group('Инициализация вкладок');
    
    // Удаляем существующую навигацию, если она есть
    const existingNavigation = document.querySelector('.tab-navigation');
    if (existingNavigation) {
        existingNavigation.remove();
    }
    const existingTabContainers = document.querySelector('.tab-containers');
    if (existingTabContainers) {
        existingTabContainers.remove();
    }

    const mainContent = document.querySelector('.dashboard-content');
    if (!mainContent) {
        console.error('Не найден контейнер для контента');
        console.groupEnd();
        return;
    }

    // Создаем навигацию
    const tabNavigation = document.createElement('div');
    tabNavigation.className = 'tab-navigation';
    tabNavigation.innerHTML = `
        <button class="tab-button active" data-tab="current">Текущие данные</button>
        <button class="tab-button" data-tab="analytics">Аналитика</button>
        <button class="tab-button" data-tab="training">План тренировок</button>
    `;

    // Создаем контейнеры для контента вкладок
    const tabContainers = document.createElement('div');
    tabContainers.className = 'tab-containers';
    tabContainers.innerHTML = `
        <div id="currentTab" class="tab-content active"></div>
        <div id="analyticsTab" class="tab-content"></div>
        <div id="trainingTab" class="tab-content"></div>
    `;

    // Очищаем основной контейнер
    mainContent.innerHTML = '';

    // Добавляем новую структуру
    mainContent.appendChild(tabNavigation);
    mainContent.appendChild(tabContainers);

    // Создаем базовую структуру для первой вкладки
    const currentTab = document.getElementById('currentTab');
    currentTab.innerHTML = createBaseStructure();

    // Добавляем стили для вкладок
    const existingStyle = document.querySelector('style[data-tabs-style]');
    if (!existingStyle) {
        const style = document.createElement('style');
        style.setAttribute('data-tabs-style', 'true');
        style.textContent = `
            .tab-navigation {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
            }

            .tab-button {
                padding: 8px 16px;
                border: none;
                background: none;
                cursor: pointer;
                font-size: 16px;
                color: #666;
                border-radius: 4px;
                transition: all 0.3s ease;
            }

            .tab-button:hover {
                background: #f0f0f0;
            }

            .tab-button.active {
                color: #4a69bd;
                font-weight: bold;
                background: #e8f0fe;
            }

            .tab-content {
                display: none;
            }

            .tab-content.active {
                display: block;
            }

            .period-selector {
                margin: 20px 0;
            }

            .period-button {
                padding: 8px 16px;
                margin-right: 10px;
                border: 1px solid #ddd;
                background: white;
                border-radius: 4px;
                cursor: pointer;
            }

            .period-button.active {
                background: #4a69bd;
                color: white;
                border-color: #4a69bd;
            }

            .metrics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 20px 0;
            }

            .metric-card {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            .recent-runs {
                margin-top: 20px;
                background: white;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            .table-container {
                overflow-x: auto;
                margin-top: 10px;
            }

            .recent-runs table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }

            .recent-runs th,
            .recent-runs td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #eee;
            }

            .recent-runs th {
                background-color: #f8f9fa;
                font-weight: 600;
                color: #333;
            }

            .recent-runs tr:hover {
                background-color: #f8f9fa;
            }

            .recent-runs td.distance {
                font-weight: 500;
                color: #4a69bd;
            }

            .recent-runs td.notes {
                color: #666;
                font-style: italic;
            }

            .action-buttons {
                display: flex;
                gap: 10px;
                margin-top: 20px;
            }

            .action-button {
                padding: 8px 16px;
                border: 1px solid #ddd;
                background: white;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 5px;
            }

            .button-icon {
                font-size: 16px;
            }

            @media (max-width: 768px) {
                .recent-runs {
                    padding: 15px;
                }

                .recent-runs th,
                .recent-runs td {
                    padding: 8px;
                    font-size: 14px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Добавляем обработчики для кнопок
    const buttons = tabNavigation.querySelectorAll('.tab-button');
    buttons.forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });

    // Добавляем обработчики для кнопок периода
    const periodButtons = currentTab.querySelectorAll('.period-button');
    periodButtons.forEach(button => {
        button.addEventListener('click', () => updatePeriod(button.dataset.period));
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

    console.log('Инициализация вкладок завершена');
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

        // Обновляем DOM
        const currentTab = document.getElementById('currentTab');
        if (currentTab) {
            // Обновляем приветствие
            const welcomeMessage = currentTab.querySelector('#welcomeMessage');
            if (welcomeMessage) welcomeMessage.textContent = data.welcomeMessage;

            if (data.hasRuns) {
                const totalDistance = runs.reduce((sum, run) => sum + run.km, 0);
                const avgDistance = totalDistance / runs.length;
                const lastRun = new Date(runs[0].date_added);
                const daysSinceLastRun = Math.floor((new Date() - lastRun) / (1000 * 60 * 60 * 24));

                // Обновляем информацию о последней пробежке
                const lastRunInfo = currentTab.querySelector('#lastRunInfo');
                if (lastRunInfo) {
                    lastRunInfo.textContent = daysSinceLastRun === 0 
                        ? 'Отличная пробежка сегодня!'
                        : `Последняя пробежка: ${daysSinceLastRun} дн. назад`;
                }

                // Обновляем прогресс
                updateProgressSection(totalDistance, data.yearlyGoal);
                
                // Обновляем метрики
                updateMetrics(totalDistance, avgDistance, runs.length);
                
                // Обновляем таблицу пробежек
                updateRunsTable(runs.slice(0, 5));
            } else {
                // Показываем пустое состояние
                showEmptyState();
            }
        }

        console.groupEnd();
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        showError('Не удалось загрузить данные');
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
            if (trainingTab && !trainingTab.querySelector('.training-plan-form-container')) {
                console.log('Инициализация формы плана тренировок');
                new TrainingPlanForm(trainingTab);
            }
        } else if (tabName === 'analytics') {
            const analyticsTab = document.getElementById('analyticsTab');
            if (analyticsTab) {
                console.log('Инициализация аналитики');
                // Здесь будет инициализация аналитики
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