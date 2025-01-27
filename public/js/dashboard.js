import { checkAuth, logout, getRuns } from './api.js';

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
async function loadUserData() {
    try {
        const user = await checkAuth();
        if (!user) {
            window.location.href = '/';
            return;
        }

        addLog(`Пользователь: ${user.username}
Email: ${user.email}
Цель на год: ${user.goal_km || 'не установлена'} км`, 'info', 'userInfo');

        // Загружаем данные о пробежках
        const now = new Date();
        const startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        const endDate = now.toISOString().split('T')[0];

        const runs = await getRuns(startDate, endDate);
        
        if (runs && runs.length > 0) {
            const totalDistance = runs.reduce((sum, run) => sum + run.distance, 0);
            const lastRun = runs[runs.length - 1];
            
            addLog(`Статистика пробежек:
Всего пробежек: ${runs.length}
Общая дистанция: ${totalDistance.toFixed(2)} км
Последняя пробежка: ${new Date(lastRun.date).toLocaleDateString()}
Дистанция последней пробежки: ${lastRun.distance} км`, 'success');
        } else {
            addLog('Пробежки не найдены. Подключите Telegram бота для синхронизации данных.', 'info');
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showError('Произошла ошибка при загрузке данных');
    }
}

// Обработчик выхода
async function handleLogout() {
    try {
        await logout();
        window.location.href = '/';
    } catch (error) {
        console.error('Ошибка при выходе:', error);
        showError('Произошла ошибка при выходе');
    }
}

// Инициализация страницы
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем данные
    loadUserData();

    // Настраиваем обработчики событий
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) {
        refreshButton.addEventListener('click', loadUserData);
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
}); 