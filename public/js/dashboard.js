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

function updateProgressSection(totalDistance, yearlyGoal) {
    console.log('Обновляем прогресс:', { totalDistance, yearlyGoal });
    const progressSection = document.getElementById('progressSection');
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

function updateMetrics(totalDistance, avgDistance, totalRuns) {
    console.log('Обновляем метрики:', { totalDistance, avgDistance, totalRuns });
    document.querySelector('#totalDistanceCard .metric-value').textContent = `${totalDistance.toFixed(1)} км`;
    document.querySelector('#avgDistanceCard .metric-value').textContent = `${avgDistance.toFixed(1)} км`;
    document.querySelector('#totalRunsCard .metric-value').textContent = totalRuns;
}

function updateRunsTable(runs) {
    console.log('Обновляем таблицу пробежек:', runs.length);
    const tbody = document.getElementById('runsTableBody');
    tbody.innerHTML = runs.slice(0, 5).map(run => `
        <tr class="animate-fade-in">
            <td>${new Date(run.date_added).toLocaleDateString()}</td>
            <td class="distance">${run.km.toFixed(1)}</td>
            <td class="time">${run.duration || '-'}</td>
            <td class="notes">${run.notes || ''}</td>
        </tr>
    `).join('');
}

function toggleContentVisibility(hasRuns) {
    console.group('Переключение видимости контента');
    console.log('Есть пробежки:', hasRuns);
    
    const progressSection = document.getElementById('progressSection');
    const metricsGrid = document.querySelector('.metrics-grid');
    const recentRuns = document.querySelector('.recent-runs');
    const actionButtons = document.querySelector('.action-buttons');
    const emptyState = document.querySelector('.empty-state') || document.createElement('div');

    console.log('Найденные элементы:', {
        progressSection: !!progressSection,
        metricsGrid: !!metricsGrid,
        recentRuns: !!recentRuns,
        actionButtons: !!actionButtons,
        emptyState: !!emptyState
    });

    if (hasRuns) {
        console.log('Показываем контент с пробежками');
        if (progressSection) progressSection.style.display = 'block';
        if (metricsGrid) metricsGrid.style.display = 'grid';
        if (recentRuns) recentRuns.style.display = 'block';
        if (actionButtons) actionButtons.style.display = 'flex';
        if (emptyState.parentNode) {
            console.log('Удаляем пустое состояние');
            emptyState.remove();
        }
    } else {
        console.log('Показываем пустое состояние');
        if (progressSection) progressSection.style.display = 'none';
        if (metricsGrid) metricsGrid.style.display = 'none';
        if (recentRuns) recentRuns.style.display = 'none';
        if (actionButtons) actionButtons.style.display = 'none';

        emptyState.className = 'empty-state animate-fade-in';
        emptyState.innerHTML = `
            <h2>Пока нет пробежек</h2>
            <p>Подключите Telegram бота для синхронизации данных о ваших пробежках</p>
            <button id="syncButton" class="sync-button">
                <span class="button-icon">🔄</span>
                Синхронизировать с Telegram
            </button>
        `;

        const content = document.querySelector('.dashboard-content');
        if (content && !document.querySelector('.empty-state')) {
            console.log('Добавляем пустое состояние');
            content.appendChild(emptyState);
        }
    }
    console.groupEnd();
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

        // Обновляем приветствие
        const welcomeMessage = document.getElementById('welcomeMessage');
        if (welcomeMessage) {
            welcomeMessage.textContent = `Привет, ${user.username}! 👋`;
        }

        const now = new Date();
        const startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        const endDate = now.toISOString().split('T')[0];
        console.log('Запрашиваем пробежки:', { startDate, endDate });
        
        const runs = await getRuns(startDate, endDate);
        console.log('Получены пробежки:', runs?.length || 0);

        // Получаем все необходимые элементы
        const elements = {
            progress: document.getElementById('progressSection'),
            metrics: document.querySelector('.metrics-grid'),
            runs: document.querySelector('.recent-runs'),
            actions: document.querySelector('.action-buttons'),
            lastRun: document.getElementById('lastRunInfo'),
            totalDistance: document.querySelector('#totalDistanceCard .metric-value'),
            avgDistance: document.querySelector('#avgDistanceCard .metric-value'),
            totalRuns: document.querySelector('#totalRunsCard .metric-value'),
            runsTable: document.getElementById('runsTableBody'),
            content: document.querySelector('.dashboard-content')
        };

        console.log('Проверка наличия элементов:', Object.entries(elements).reduce((acc, [key, el]) => {
            acc[key] = !!el;
            return acc;
        }, {}));

        // Удаляем существующее пустое состояние, если оно есть
        const existingEmptyState = document.querySelector('.empty-state');
        if (existingEmptyState) {
            existingEmptyState.remove();
        }

        if (runs && runs.length > 0) {
            console.log('Подготавливаем данные для отображения');
            
            const totalDistance = runs.reduce((sum, run) => sum + run.km, 0);
            const yearlyGoal = user.goal_km || 0;
            const avgDistance = totalDistance / runs.length;
            const lastRun = new Date(runs[0].date_added);
            const daysSinceLastRun = Math.floor((now - lastRun) / (1000 * 60 * 60 * 24));

            // Обновляем информацию о последней пробежке
            if (elements.lastRun) {
                elements.lastRun.textContent = daysSinceLastRun === 0 
                    ? 'Отличная пробежка сегодня!'
                    : `Последняя пробежка: ${daysSinceLastRun} дн. назад`;
            }

            // Обновляем прогресс
            if (yearlyGoal > 0 && elements.progress) {
                const percentage = Math.min((totalDistance / yearlyGoal) * 100, 100);
                elements.progress.innerHTML = `
                    <div class="progress-info">
                        <span class="progress-label">Цель на год: ${yearlyGoal} км</span>
                        <span class="progress-value">${percentage.toFixed(1)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                `;
                elements.progress.style.display = 'block';
            } else {
                if (elements.progress) elements.progress.style.display = 'none';
            }

            // Обновляем метрики
            if (elements.metrics) {
                if (elements.totalDistance) elements.totalDistance.textContent = `${totalDistance.toFixed(1)} км`;
                if (elements.avgDistance) elements.avgDistance.textContent = `${avgDistance.toFixed(1)} км`;
                if (elements.totalRuns) elements.totalRuns.textContent = runs.length;
                elements.metrics.style.display = 'grid';
            }

            // Обновляем таблицу пробежек
            if (elements.runsTable && elements.runs) {
                elements.runsTable.innerHTML = runs.slice(0, 5).map(run => `
                    <tr class="animate-fade-in">
                        <td>${new Date(run.date_added).toLocaleDateString()}</td>
                        <td class="distance">${run.km.toFixed(1)}</td>
                        <td class="time">${run.duration || '-'}</td>
                        <td class="notes">${run.notes || ''}</td>
                    </tr>
                `).join('');
                elements.runs.style.display = 'block';
            }

            // Показываем кнопки действий
            if (elements.actions) {
                elements.actions.style.display = 'flex';
            }
        } else {
            console.log('Нет пробежек, показываем пустое состояние');
            // Скрываем все секции с данными
            if (elements.progress) elements.progress.style.display = 'none';
            if (elements.metrics) elements.metrics.style.display = 'none';
            if (elements.runs) elements.runs.style.display = 'none';
            if (elements.actions) elements.actions.style.display = 'none';

            if (elements.content) {
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
                elements.content.appendChild(emptyState);

                // Добавляем обработчик для кнопки синхронизации
                const syncButton = document.getElementById('syncButton');
                if (syncButton) {
                    syncButton.addEventListener('click', () => {
                        window.open('https://t.me/sl_run_bot', '_blank');
                    });
                }
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
let isLoading = false;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM загружен, начинаем инициализацию');
    
    if (isLoading) {
        console.log('Загрузка уже выполняется, пропускаем');
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
        
        console.log('Инициализация завершена');
    } finally {
        isLoading = false;
    }
}); 