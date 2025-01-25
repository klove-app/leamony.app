import { login, register, checkAuth } from './api.js';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, инициализация...');
    
    // Проверяем авторизацию только если есть сохраненная сессия
    if (document.cookie.includes('session')) {
        checkAuth().then(user => {
            if (user) {
                console.log('Пользователь авторизован:', user);
                updateUIForLoggedInUser(user);
            }
        }).catch(error => {
            console.error('Ошибка проверки авторизации:', error);
        });
    }
});

// Обработчики форм
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const result = await login(username, password);
        if (result.success) {
            closeAuthModal();
            window.location.href = '/dashboard.html';
        } else {
            showError('loginError', result.error || 'Login failed');
        }
    } catch (error) {
        showError('loginError', 'An error occurred during login');
        console.error('Login error:', error);
    }
}

// Вспомогательные функции
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function updateUIForLoggedInUser(user) {
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.textContent = user.username;
        loginButton.href = '/dashboard.html';
    }
}

// Глобальные функции для работы с модальным окном
window.openAuthModal = function() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        
        // Очищаем поля формы при открытии
        const usernameInput = document.getElementById('loginUsername');
        const passwordInput = document.getElementById('loginPassword');
        if (usernameInput) usernameInput.value = '';
        if (passwordInput) passwordInput.value = '';
        
        // Скрываем сообщения об ошибках
        const errorElement = document.getElementById('loginError');
        if (errorElement) errorElement.style.display = 'none';
    }
}

window.closeAuthModal = function() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// Добавляем обработчики после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    // Обработчик для кнопки входа
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.openAuthModal();
        });
    }

    // Обработчик для кнопки закрытия
    const closeButton = document.querySelector('.close-button');
    if (closeButton) {
        closeButton.addEventListener('click', window.closeAuthModal);
    }

    // Обработчик для формы входа
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}); 