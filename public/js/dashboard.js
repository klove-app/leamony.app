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
        await delay(1000); // Задержка для отладки

        // Обновляем приветствие
        document.getElementById('welcomeMessage').textContent = `Привет, ${user.username}! 👋`;

        const now = new Date();
        const startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        const endDate = now.toISOString().split('T')[0];
        console.log('Запрашиваем пробежки:', { startDate, endDate });
        
        const runs = await getRuns(startDate, endDate);
        console.log('Получены пробежки:', runs?.length || 0);
        
        if (runs && runs.length > 0) {
            const totalDistance = runs.reduce((sum, run) => sum + run.km, 0);
            const yearlyGoal = user.goal_km || 0;
            const avgDistance = totalDistance / runs.length;
            const lastRun = new Date(runs[0].date_added);
            const daysSinceLastRun = Math.floor((now - lastRun) / (1000 * 60 * 60 * 24));

            console.log('Рассчитанные метрики:', {
                totalDistance,
                yearlyGoal,
                avgDistance,
                daysSinceLastRun
            });

            // Обновляем информацию о последней пробежке
            document.getElementById('lastRunInfo').textContent = daysSinceLastRun === 0 
                ? 'Отличная пробежка сегодня!'
                : `Последняя пробежка: ${daysSinceLastRun} дн. назад`;

            await delay(500); // Задержка для отладки

            // Обновляем секции
            updateProgressSection(totalDistance, yearlyGoal);
            await delay(500); // Задержка для отладки
            
            updateMetrics(totalDistance, avgDistance, runs.length);
            await delay(500); // Задержка для отладки
            
            updateRunsTable(runs);
            await delay(500); // Задержка для отладки
            
            toggleContentVisibility(true);
        } else {
            console.log('Нет пробежек, показываем пустое состояние');
            toggleContentVisibility(false);
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
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM загружен, начинаем инициализацию');
    
    // Загружаем данные без принудительной проверки
    await loadUserData(false);

    // Настраиваем обработчики событий
    console.log('Настраиваем обработчики событий');
    
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) {
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
    
    console.log('Инициализация завершена');
}); 