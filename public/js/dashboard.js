let currentPeriod = 'year';

document.addEventListener('DOMContentLoaded', initDashboard);

async function initDashboard() {
    console.group('Инициализация дашборда');
    try {
        await checkAuth();
        initializeTabs();
        setupEventListeners();
    } catch (error) {
        console.error('Ошибка при инициализации:', error);
        window.location.href = '/';
    }
    console.groupEnd();
}

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

async function updatePeriod(period) {
    const periodButtons = document.querySelectorAll('.period-button');
    periodButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.period === period);
    });
    currentPeriod = period;
    await loadUserData(false);
}

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

function initializeTabs() {
    console.group('Инициализация вкладок');
    
    const mainContent = document.querySelector('.dashboard-content');
    if (!mainContent) {
        console.error('Не найден контейнер для контента');
        console.groupEnd();
        return;
    }

    mainContent.innerHTML = '';

    const tabNavigation = document.createElement('div');
    tabNavigation.className = 'tab-navigation';
    tabNavigation.innerHTML = `
        <button class="tab-button active" data-tab="current">Аналитика</button>
        <button class="tab-button" data-tab="training">Тренировочный план</button>
    `;

    const tabContainers = document.createElement('div');
    tabContainers.className = 'tab-containers';
    tabContainers.innerHTML = `
        <div id="currentTab" class="tab-content active"></div>
        <div id="trainingTab" class="tab-content"></div>
    `;

    mainContent.appendChild(tabNavigation);
    mainContent.appendChild(tabContainers);

    const currentTab = document.getElementById('currentTab');
    currentTab.innerHTML = createBaseStructure();

    setupEventListeners();
    loadUserData();

    console.log('Инициализация вкладок завершена');
    console.groupEnd();
}

function setupEventListeners() {
    console.group('Настройка обработчиков событий');

    const currentTab = document.getElementById('currentTab');
    if (!currentTab) {
        console.error('Не найден контейнер для контента');
        console.groupEnd();
        return;
    }

    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });

    const periodButtons = currentTab.querySelectorAll('.period-button');
    periodButtons.forEach(button => {
        button.addEventListener('click', () => updatePeriod(button.dataset.period));
    });

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

    console.log('Обработчики событий настроены');
    console.groupEnd();
}

async function switchTab(tabName) {
    console.group('Переключение на вкладку:', tabName);
    
    try {
        const buttons = document.querySelectorAll('.tab-button');
        buttons.forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabName);
        });

        const tabs = document.querySelectorAll('.tab-content');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.id === `${tabName}Tab`);
        });

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

async function loadUserData(forceCheck = false) {
    try {
        console.group('Загрузка данных пользователя');
        
        const user = await checkAuth(forceCheck);
        if (!user) {
            window.location.href = '/';
            return;
        }

        const { startDate, endDate } = getPeriodDates(currentPeriod);
        console.log('Запрашиваем данные за период:', { startDate, endDate });

        const response = await getRuns(startDate, endDate);
        console.log('Получен ответ:', response);
        
        const runs = Array.isArray(response) ? response : [];
        console.log('Преобразованные пробежки:', runs);

        const data = {
            welcomeMessage: `Привет, ${user.username}! 👋`,
            stats: calculateStats(runs),
            recentRuns: runs.slice(0, 5),
            runs: runs
        };

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

        const welcomeMessage = currentTab.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.textContent = data.welcomeMessage;
        }

        if (data.stats) {
            updateMetrics(data.stats);
        }

        if (data.recentRuns) {
            updateRecentRuns(data.recentRuns);
        }

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

function updateMonthlyRuns(runs) {
    console.group('Обновление истории пробежек');
    
    try {
        const monthsContainer = document.querySelector('.months-container');
        if (!monthsContainer) {
            console.error('Не найден контейнер для месяцев');
            return;
        }

        const runsByMonth = {};
        runs.forEach(run => {
            const date = new Date(run.date_added);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!runsByMonth[monthKey]) {
                runsByMonth[monthKey] = [];
            }
            runsByMonth[monthKey].push(run);
        });

        const sortedMonths = Object.keys(runsByMonth).sort().reverse();

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
