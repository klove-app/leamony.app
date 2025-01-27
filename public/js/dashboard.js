import { checkAuth, logout, getRuns, viewLogs, delay } from './api.js';

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

// Загрузка данных пользователя
async function loadUserData(forceCheck = false) {
    try {
        console.group('Loading user data...');
        console.log('1. Начало загрузки данных пользователя');
        
        const user = await checkAuth(forceCheck);
        console.log('2. Результат проверки авторизации:', user ? 'успешно' : 'не авторизован');
        
        if (!user) {
            console.log('3. Пользователь не авторизован, перенаправление на главную');
            window.location.href = '/';
            return;
        }

        addLog(`Пользователь: ${user.username}
Email: ${user.email}
Цель на год: ${user.yearly_goal || 'не установлена'} км
Текущий прогресс: ${user.yearly_progress || 0} км`, 'info', 'userInfo');

        // Загружаем данные о пробежках
        const now = new Date();
        const startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        const endDate = now.toISOString().split('T')[0];

        console.log('4. Загрузка данных о пробежках');
        const runs = await getRuns(startDate, endDate);
        
        if (runs && runs.length > 0) {
            const totalDistance = runs.reduce((sum, run) => sum + run.km, 0);
            
            // Компактное отображение всей информации
            addLog(`
                <div class="dashboard-content">
                    <div class="user-stats">
                        <div>Цель на год: ${user.yearly_goal || 'не установлена'} км</div>
                        <div>Текущий прогресс: ${totalDistance.toFixed(1)} / ${user.yearly_goal || 0} км</div>
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
                            ${runs.map(run => `
                                <tr>
                                    <td>${run.date_added.split('T')[0]}</td>
                                    <td class="distance">${run.km.toFixed(1)}</td>
                                    <td class="time">${run.duration || '-'}</td>
                                    <td class="notes">${run.notes || ''}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
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