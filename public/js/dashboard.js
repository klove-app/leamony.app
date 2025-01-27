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

// Загрузка данных пользователя
async function loadUserData(forceCheck = false) {
    try {
        console.group('Загрузка данных пользователя');
        console.log('Начало загрузки данных');
        
        const user = await checkAuth(forceCheck);
        if (!user) {
            console.log('Пользователь не авторизован, редирект на главную');
            window.location.href = '/';
            return;
        }

        console.log('Пользователь авторизован:', user);
        console.log('Годовая цель из goal_km:', user.goal_km);

        // Получаем все необходимые элементы один раз
        const elements = {
            dashboardContent: document.querySelector('.dashboard-content'),
            welcomeMessage: document.getElementById('welcomeMessage'),
            progressSection: document.getElementById('progressSection'),
            metricsGrid: document.querySelector('.metrics-grid'),
            totalDistance: document.querySelector('#totalDistanceCard .metric-value'),
            avgDistance: document.querySelector('#avgDistanceCard .metric-value'),
            totalRuns: document.querySelector('#totalRunsCard .metric-value'),
            recentRuns: document.querySelector('.recent-runs'),
            runsTable: document.getElementById('runsTableBody'),
            actionButtons: document.querySelector('.action-buttons'),
            lastRunInfo: document.getElementById('lastRunInfo')
        };

        // Проверяем наличие основных элементов
        if (!elements.dashboardContent) {
            console.error('Не найден основной контейнер дашборда');
            return;
        }

        // Обновляем приветствие
        if (elements.welcomeMessage) {
            elements.welcomeMessage.textContent = `Привет, ${user.username}! 👋`;
        }

        const now = new Date();
        const startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        const endDate = now.toISOString().split('T')[0];
        console.log('Запрашиваем пробежки:', { startDate, endDate });
        
        const runs = await getRuns(startDate, endDate);
        console.log('Получены пробежки:', runs?.length || 0);

        // Удаляем существующее пустое состояние
        const existingEmptyState = document.querySelector('.empty-state');
        if (existingEmptyState) {
            existingEmptyState.remove();
        }

        if (!runs || runs.length === 0) {
            console.log('Нет пробежек, показываем пустое состояние');
            
            // Скрываем все секции
            Object.entries(elements).forEach(([key, element]) => {
                if (element && key !== 'dashboardContent' && key !== 'welcomeMessage') {
                    element.style.display = 'none';
                }
            });
            
            // Создаем пустое состояние
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state animate-fade-in';
            emptyState.innerHTML = `
                <h2>Пока нет пробежек</h2>
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
                syncButton.addEventListener('click', () => {
                    window.open('https://t.me/sl_run_bot', '_blank');
                });
            }
        } else {
            console.log('Подготавливаем данные для отображения');
            
            const totalDistance = runs.reduce((sum, run) => sum + run.km, 0);
            const yearlyGoal = user.goal_km;
            const avgDistance = totalDistance / runs.length;
            const lastRun = new Date(runs[0].date_added);
            const daysSinceLastRun = Math.floor((now - lastRun) / (1000 * 60 * 60 * 24));

            // Обновляем информацию о последней пробежке
            if (elements.lastRunInfo) {
                elements.lastRunInfo.textContent = daysSinceLastRun === 0 
                    ? 'Отличная пробежка сегодня!'
                    : `Последняя пробежка: ${daysSinceLastRun} дн. назад`;
            }

            // Обновляем прогресс
            if (elements.progressSection) {
                if (yearlyGoal > 0) {
                    const percentage = Math.min((totalDistance / yearlyGoal) * 100, 100);
                    elements.progressSection.innerHTML = `
                        <div class="progress-info">
                            <span class="progress-label">Цель на год: ${yearlyGoal} км</span>
                            <span class="progress-value">${percentage.toFixed(1)}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percentage}%"></div>
                        </div>
                    `;
                    elements.progressSection.style.display = 'block';
                } else {
                    elements.progressSection.style.display = 'none';
                }
            }

            // Обновляем метрики
            if (elements.metricsGrid) {
                if (elements.totalDistance) elements.totalDistance.textContent = `${totalDistance.toFixed(1)} км`;
                if (elements.avgDistance) elements.avgDistance.textContent = `${avgDistance.toFixed(1)} км`;
                if (elements.totalRuns) elements.totalRuns.textContent = runs.length;
                elements.metricsGrid.style.display = 'grid';
            }

            // Обновляем таблицу пробежек
            if (elements.recentRuns && elements.runsTable) {
                elements.runsTable.innerHTML = runs.slice(0, 5).map(run => `
                    <tr class="animate-fade-in">
                        <td>${new Date(run.date_added).toLocaleDateString()}</td>
                        <td class="distance">${run.km.toFixed(1)}</td>
                        <td class="time">${run.duration || '-'}</td>
                        <td class="notes">${run.notes || ''}</td>
                    </tr>
                `).join('');
                elements.recentRuns.style.display = 'block';
            }

            // Показываем кнопки действий
            if (elements.actionButtons) {
                elements.actionButtons.style.display = 'flex';
            }
        }
        
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
    console.log('DOM загружен, начинаем инициализацию');
    console.log('isInitialized:', isInitialized);
    console.log('isLoading:', isLoading);
    
    if (isInitialized) {
        console.warn('Страница уже инициализирована, пропускаем');
        console.groupEnd();
        return;
    }
    
    if (isLoading) {
        console.warn('Загрузка уже выполняется, пропускаем');
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

        // Загружаем данные без принудительной проверки
        await loadUserData(false);
        
        isInitialized = true;
        console.log('Инициализация завершена');
    } finally {
        isLoading = false;
        console.groupEnd();
    }
}); 