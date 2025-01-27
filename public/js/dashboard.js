import { checkAuth, logout, getRuns, viewLogs, delay } from './api.js';

// Функция для добавления лога
function addLog(message, type = '', container = 'dataInfo') {
    const logElement = document.getElementById(container);
    if (logElement) {
        logElement.textContent = message;
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

// Загрузка данных пользователя
async function loadUserData(forceCheck = false) {
    try {
        console.group('Load User Data');
        console.log('1. Начало загрузки данных пользователя');
        
        await delay(5000); // Задержка перед проверкой авторизации
        
        const user = await checkAuth(forceCheck);
        console.log('2. Результат проверки авторизации:', user ? 'успешно' : 'не авторизован');
        
        if (!user) {
            console.log('3. Пользователь не авторизован, перенаправление на главную');
            await delay(5000); // Задержка перед редиректом
            console.groupEnd();
            window.location.href = '/';
            return;
        }

        await delay(5000); // Задержка перед загрузкой данных

        addLog(`Пользователь: ${user.username}
Email: ${user.email}
Цель на год: ${user.goal_km || 'не установлена'} км`, 'info', 'userInfo');

        // Загружаем данные о пробежках
        const now = new Date();
        const startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        const endDate = now.toISOString().split('T')[0];

        console.log('4. Загрузка данных о пробежках');
        const runs = await getRuns(startDate, endDate);
        
        if (runs && runs.length > 0) {
            // Считаем общую статистику
            const totalDistance = runs.reduce((sum, run) => sum + run.km, 0);
            
            // Создаем элемент для статистики
            const statsHtml = `
                <div class="stats-summary">
                    <h3>Общая статистика</h3>
                    <p>Всего пробежек: ${runs.length}</p>
                    <p>Общая дистанция: ${totalDistance.toFixed(2)} км</p>
                </div>
            `;
            
            // Создаем список пробежек
            const runsListHtml = runs.map(run => {
                const date = new Date(run.date_added).toLocaleDateString();
                const duration = Math.floor(run.duration / 60); // переводим в минуты
                return `
                    <div class="run-item">
                        <div class="run-date">${date}</div>
                        <div class="run-details">
                            <span class="run-distance">${run.km.toFixed(2)} км</span>
                            <span class="run-time">${duration} мин</span>
                            ${run.notes ? `<span class="run-notes">${run.notes}</span>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
            
            // Добавляем всё в контейнер
            addLog(statsHtml + `
                <div class="runs-list">
                    <h3>Список пробежек</h3>
                    ${runsListHtml}
                </div>
            `, 'success');
        } else {
            addLog('Пробежки не найдены. Подключите Telegram бота для синхронизации данных.', 'info');
        }
        
        console.log('5. Загрузка данных завершена');
        console.groupEnd();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showError('Произошла ошибка при загрузке данных');
        console.groupEnd();
        
        // Если ошибка связана с авторизацией, делаем задержку перед редиректом
        await delay(5000);
        window.location.href = '/';
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
        
        await delay(5000); // Задержка 5 секунд перед выходом
        
        console.log('3. Вызываем функцию logout');
        const result = await logout();
        console.log('4. Результат logout:', result);
        
        await delay(5000); // Задержка 5 секунд после выхода
        
        console.log('5. Проверяем куки после выхода:', document.cookie);
        
        await delay(5000); // Задержка 5 секунд перед редиректом
        
        console.log('6. Выполняем редирект на главную страницу');
        console.groupEnd();
        
        // Добавляем еще одну задержку перед самим редиректом
        await delay(5000);
        window.location.href = '/';
    } catch (error) {
        console.error('Ошибка при выходе:', error);
        showError('Произошла ошибка при выходе');
        console.groupEnd();
        
        // Даже при ошибке делаем задержку
        await delay(5000);
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