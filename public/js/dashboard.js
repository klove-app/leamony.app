import { checkAuth, logout, getRuns, viewLogs } from './api.js';

// Функция для добавления лога
function addLog(message, type = '', container = 'dataInfo') {
    const logElement = document.getElementById(container);
    if (logElement) {
        logElement.innerHTML = message;
        logElement.className = `log-entry ${type}`;
        logElement.style.display = 'block';
    }
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

function updateProgressSection(totalDistance, yearlyGoal) {
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
    } else {
        progressSection.style.display = 'none';
    }
}

function updateMetrics(totalDistance, avgDistance, totalRuns) {
    document.querySelector('#totalDistanceCard .metric-value').textContent = `${totalDistance.toFixed(1)} км`;
    document.querySelector('#avgDistanceCard .metric-value').textContent = `${avgDistance.toFixed(1)} км`;
    document.querySelector('#totalRunsCard .metric-value').textContent = totalRuns;
}

function updateRunsTable(runs) {
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

// Загрузка данных пользователя
async function loadUserData(forceCheck = false) {
    try {
        console.group('Loading user data...');
        
        const user = await checkAuth(forceCheck);
        if (!user) {
            window.location.href = '/';
            return;
        }

        // Обновляем приветствие
        document.getElementById('welcomeMessage').textContent = `Привет, ${user.username}! 👋`;

        const now = new Date();
        const startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        const endDate = now.toISOString().split('T')[0];
        const runs = await getRuns(startDate, endDate);
        
        if (runs && runs.length > 0) {
            const totalDistance = runs.reduce((sum, run) => sum + run.km, 0);
            const yearlyGoal = user.goal_km || 0;
            const avgDistance = totalDistance / runs.length;
            const lastRun = new Date(runs[0].date_added);
            const daysSinceLastRun = Math.floor((now - lastRun) / (1000 * 60 * 60 * 24));

            // Обновляем информацию о последней пробежке
            document.getElementById('lastRunInfo').textContent = daysSinceLastRun === 0 
                ? 'Отличная пробежка сегодня!'
                : `Последняя пробежка: ${daysSinceLastRun} дн. назад`;

            // Обновляем секции
            updateProgressSection(totalDistance, yearlyGoal);
            updateMetrics(totalDistance, avgDistance, runs.length);
            updateRunsTable(runs);

            addLog(`
                <div class="dashboard-content animate-fade-in">
                    <header class="dashboard-header">
                        <div class="user-welcome">
                            <h2>Привет, ${user.username}! 👋</h2>
                            ${daysSinceLastRun === 0 ? 
                                '<span class="last-run">Отличная пробежка сегодня!</span>' : 
                                `<span class="last-run">Последняя пробежка: ${daysSinceLastRun} дн. назад</span>`
                            }
                        </div>
                        <div class="period-selector">
                            <button class="active">Год</button>
                            <button>Месяц</button>
                            <button>Неделя</button>
                        </div>
                    </header>

                    ${yearlyGoal > 0 ? `
                        <div class="progress-section animate-slide-in">
                            <div class="progress-info">
                                <span class="progress-label">Цель на год: ${yearlyGoal} км</span>
                                <span class="progress-value">${((totalDistance / yearlyGoal) * 100).toFixed(1)}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min((totalDistance / yearlyGoal) * 100, 100)}%"></div>
                            </div>
                        </div>
                    ` : ''}

                    <div class="metrics-grid animate-slide-in">
                        <div class="metric-card">
                            <div class="metric-value">${totalDistance.toFixed(1)} км</div>
                            <div class="metric-label">Пройдено в этом году</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">${avgDistance.toFixed(1)} км</div>
                            <div class="metric-label">Средняя дистанция</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">${runs.length}</div>
                            <div class="metric-label">Всего пробежек</div>
                        </div>
                    </div>

                    <div class="recent-runs animate-slide-in">
                        <div class="section-header">
                            <h3>Последние пробежки</h3>
                            <button class="view-all">Показать все</button>
                        </div>
                        <table class="runs-table">
                            <thead>
                                <tr>
                                    <th>Дата</th>
                                    <th>Км</th>
                                    <th>Мин</th>
                                    <th>Заметки</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${runs.slice(0, 5).map(run => `
                                    <tr class="animate-fade-in">
                                        <td>${new Date(run.date_added).toLocaleDateString()}</td>
                                        <td class="distance">${run.km.toFixed(1)}</td>
                                        <td class="time">${run.duration || '-'}</td>
                                        <td class="notes">${run.notes || ''}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div class="action-buttons animate-slide-in">
                        <button class="sync-button">
                            <span class="button-icon">🔄</span>
                            Синхронизировать с Telegram
                        </button>
                        <button class="export-button">
                            <span class="button-icon">📊</span>
                            Экспорт данных
                        </button>
                    </div>
                </div>
            `, 'success', 'dataInfo');
        } else {
            addLog(`
                <div class="dashboard-content animate-fade-in">
                    <div class="empty-state">
                        <h2>Пока нет пробежек</h2>
                        <p>Подключите Telegram бота для синхронизации данных о ваших пробежках</p>
                        <button class="sync-button">
                            <span class="button-icon">🔄</span>
                            Синхронизировать с Telegram
                        </button>
                    </div>
                </div>
            `, 'info', 'dataInfo');
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
        console.group('Handle Logout Process');
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
document.addEventListener('DOMContentLoaded', async function() {
    // Загружаем данные без принудительной проверки
    await loadUserData(false);

    // Настраиваем обработчики событий
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) {
        // При обновлении данных делаем принудительную проверку
        refreshButton.addEventListener('click', () => loadUserData(true));
    }

    const syncButton = document.getElementById('syncButton');
    if (syncButton) {
        syncButton.addEventListener('click', () => {
            window.open('https://t.me/sl_run_bot', '_blank');
        });
    }

    const exportButton = document.getElementById('exportButton');
    if (exportButton) {
        exportButton.addEventListener('click', () => {
            showError('Функция экспорта данных находится в разработке');
        });
    }

    // Добавляем кнопку просмотра логов
    const viewLogsButton = document.createElement('button');
    viewLogsButton.textContent = 'Просмотр логов';
    viewLogsButton.style.marginLeft = '10px';
    viewLogsButton.style.padding = '5px 10px';
    viewLogsButton.style.backgroundColor = '#4CAF50';
    viewLogsButton.style.color = 'white';
    viewLogsButton.style.border = 'none';
    viewLogsButton.style.borderRadius = '3px';
    viewLogsButton.style.cursor = 'pointer';
    
    viewLogsButton.onclick = viewLogs;
    
    // Добавляем кнопку рядом с кнопкой выхода
    if (logoutButton && logoutButton.parentNode) {
        logoutButton.parentNode.insertBefore(viewLogsButton, logoutButton.nextSibling);
    }
}); 