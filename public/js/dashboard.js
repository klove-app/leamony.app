import { checkAuth, logout, getRuns, viewLogs } from './api.js';

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
    console.log('Обновляем таблицу пробежек:', runs.length);
    const runsSection = document.querySelector('.recent-runs');
    const tbody = document.getElementById('runsTableBody');
    
    if (!runsSection || !tbody) {
        console.error('Секция пробежек или таблица не найдены');
        return;
    }

    tbody.innerHTML = runs.slice(0, 5).map(run => `
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
        const runs = await getRuns(startDate, endDate);
        
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

        // Загружаем данные
        await loadUserData(false);
        
        isInitialized = true;
        console.log('Инициализация завершена');
    } finally {
        isLoading = false;
        console.groupEnd();
    }
}); 