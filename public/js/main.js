import { login, register, checkAuth } from './api.js';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, инициализация...');
    
    // Проверяем наличие элементов
    const modal = document.getElementById('authModal');
    const loginButton = document.getElementById('loginButton');
    const closeButton = document.querySelector('.close-button');
    const loginForm = document.getElementById('loginForm');
    
    console.log('Элементы страницы:', {
        modal: modal,
        loginButton: loginButton,
        closeButton: closeButton,
        loginForm: loginForm
    });

    // Настраиваем обработчики событий
    if (loginButton) {
        loginButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Клик по кнопке входа');
            openAuthModal();
        });
    }

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            console.log('Закрытие модального окна');
            closeAuthModal();
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
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

// Функции для работы с модальным окном
function openAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        console.log('Открываем модальное окно');
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
    } else {
        console.error('Модальное окно не найдено');
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        console.log('Закрываем модальное окно');
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// Экспортируем функции в глобальную область
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal; 