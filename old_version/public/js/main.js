import { login, register, checkAuth } from './api.js';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Инициализация главной страницы...');
    
    try {
        // Проверяем авторизацию
        const user = await checkAuth();
        console.log('Результат проверки авторизации:', user);
        
        if (user) {
            // Если пользователь авторизован, обновляем UI
            updateAuthUI(true, user.username);
        } else {
            // Если не авторизован, показываем кнопку входа
            updateAuthUI(false);
        }

        // Настраиваем обработчики событий
        setupEventListeners();
        
    } catch (error) {
        console.error('Ошибка при инициализации:', error);
        showError('Произошла ошибка при загрузке страницы');
    }
});

// Обновление UI в зависимости от состояния авторизации
function updateAuthUI(isAuthenticated, username = '') {
    const loginButton = document.getElementById('loginButton');
    const userMenu = document.getElementById('userMenu');
    
    if (isAuthenticated && username) {
        // Если пользователь авторизован
        if (loginButton) loginButton.style.display = 'none';
        if (userMenu) {
            userMenu.style.display = 'flex';
            const usernameElement = userMenu.querySelector('.username');
            if (usernameElement) usernameElement.textContent = username;
        }
    } else {
        // Если пользователь не авторизован
        if (loginButton) loginButton.style.display = 'block';
        if (userMenu) userMenu.style.display = 'none';
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Открытие модального окна
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            console.log('Открываем модальное окно авторизации');
            openAuthModal();
        });
    }

    // Закрытие модального окна
    const closeButton = document.querySelector('.close-button');
    if (closeButton) {
        closeButton.addEventListener('click', closeAuthModal);
    }

    // Обработка формы входа
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Обработка формы регистрации
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// Открытие модального окна
function openAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'flex';
        // Очищаем поля формы
        const inputs = modal.querySelectorAll('input');
        inputs.forEach(input => input.value = '');
        // Скрываем сообщения об ошибках
        const errors = modal.querySelectorAll('.error-message');
        errors.forEach(error => error.style.display = 'none');
    }
}

// Закрытие модального окна
function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Обработка входа
async function handleLogin(event) {
    event.preventDefault();
    console.log('Обработка входа...');

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorElement = document.querySelector('#loginForm .error-message');

    try {
        const result = await login(username, password);
        console.log('Результат входа:', result);

        if (result.success) {
            // Перенаправляем на дашборд
            window.location.href = '/dashboard.html';
        } else {
            if (errorElement) {
                errorElement.textContent = result.error || 'Failed to login';
                errorElement.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Ошибка при входе:', error);
        if (errorElement) {
            errorElement.textContent = 'An error occurred during login';
            errorElement.style.display = 'block';
        }
    }
}

// Обработка регистрации
async function handleRegister(event) {
    event.preventDefault();
    console.log('Обработка регистрации...');

    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const yearlyGoal = document.getElementById('registerYearlyGoal').value;
    const errorElement = document.querySelector('#registerForm .error-message');

    try {
        const result = await register(username, email, password, yearlyGoal);
        console.log('Результат регистрации:', result);

        if (result.success) {
            // Показываем сообщение об успехе и переключаемся на вкладку входа
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.textContent = 'Registration successful! Please log in.';
            document.getElementById('registerForm').prepend(successMessage);
            
            // Переключаемся на вкладку входа через 2 секунды
            setTimeout(() => {
                document.querySelector('[data-tab="login"]').click();
                successMessage.remove();
            }, 2000);
        } else {
            if (errorElement) {
                errorElement.textContent = result.error || 'Failed to register';
                errorElement.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        if (errorElement) {
            errorElement.textContent = 'An error occurred during registration';
            errorElement.style.display = 'block';
        }
    }
}

// Показ ошибки
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.prepend(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
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