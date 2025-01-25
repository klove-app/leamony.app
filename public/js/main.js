import { login, register, checkAuth } from './api.js';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, инициализация...');
    checkElements();
    setupEventListeners();
    
    // Добавляем обработчик для кнопки Sign In
    const loginButton = document.getElementById('loginButton');
    console.log('Login button:', loginButton);
    if (loginButton) {
        loginButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Login button clicked');
            openAuthModal();
        });
    }

    // Добавляем обработчик для кнопки закрытия модального окна
    const closeButton = document.querySelector('.close-button');
    if (closeButton) {
        closeButton.addEventListener('click', closeAuthModal);
    }

    // Добавляем обработчик для формы входа
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Проверяем авторизацию только если есть сохраненная сессия
    if (document.cookie.includes('session')) {
        checkAuth().then(user => {
            if (user) {
                console.log('Пользователь авторизован:', user);
                updateUIForLoggedInUser(user);
            }
        }).catch(error => {
            console.log('Ошибка проверки авторизации:', error);
        });
    }
});

// Функция для проверки загрузки DOM и всех элементов
function checkElements() {
    console.log('Проверка элементов:');
    const modal = document.getElementById('authModal');
    console.log('Модальное окно:', modal);
    const loginLink = document.querySelector('a.nav-link[href="#"]');
    console.log('Ссылка входа:', loginLink);
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Обработчики форм
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// Обработчики форм
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const result = await login(username, password);
        if (result.success) {
            // Сначала закрываем модальное окно
            closeAuthModal();
            // Затем делаем редирект на дашборд
            window.location.href = '/dashboard.html';
        } else {
            showError('loginError', result.error || 'Login failed');
        }
    } catch (error) {
        showError('loginError', 'An error occurred during login');
        console.error('Login error:', error);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const yearlyGoal = document.getElementById('registerYearlyGoal').value;

    try {
        const result = await register(username, email, password, yearlyGoal);
        if (result.success) {
            closeAuthModal();
            updateUIForLoggedInUser(result.user);
        } else {
            showError('registerError', result.error);
        }
    } catch (error) {
        showError('registerError', 'Произошла ошибка при регистрации');
        console.error('Registration error:', error);
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
function openAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'flex';  // Используем flex для центрирования
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

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300); // Задержка для анимации
    }
}

// Функции для работы с формами авторизации
function switchTab(tabName) {
    // Обновляем активную вкладку
    document.querySelectorAll('.auth-tab').forEach(tab => {
        const isActive = tab.dataset.tab === tabName;
        tab.classList.toggle('active', isActive);
    });

    // Показываем соответствующую форму
    document.querySelectorAll('.auth-form').forEach(form => {
        const isActive = form.id === `${tabName}Form`;
        form.style.display = isActive ? 'block' : 'none';
    });

    // Скрываем сообщения об ошибках при переключении
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('registerError').style.display = 'none';
}

// Делаем функции доступными глобально
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchTab = switchTab; 