import { login, register, checkAuth } from './api.js';

// Функция для проверки загрузки DOM и всех элементов
function checkElements() {
    console.log('Проверка элементов:');
    const modal = document.getElementById('authModal');
    console.log('Модальное окно:', modal);
    const loginLink = document.querySelector('a.nav-link[href="#"]');
    console.log('Ссылка входа:', loginLink);
}

// Глобальные функции для работы с модальным окном
function openAuthModal() {
    console.log('Вызвана функция openAuthModal');
    const modal = document.getElementById('authModal');
    console.log('Найденное модальное окно:', modal);
    if (modal) {
        modal.style.display = 'block';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        console.log('Модальное окно открыто');
    } else {
        console.error('Модальное окно не найдено!');
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'none';
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
    }
}

// Функции для работы с формами авторизации
function switchTab(tabName) {
    console.log('Переключение на вкладку:', tabName);
    
    // Обновляем активную вкладку
    document.querySelectorAll('.auth-tab').forEach(tab => {
        const isActive = tab.dataset.tab === tabName;
        tab.classList.toggle('active', isActive);
        console.log('Вкладка:', tab.dataset.tab, isActive ? 'активна' : 'неактивна');
    });

    // Показываем соответствующую форму
    document.querySelectorAll('.auth-form').forEach(form => {
        const isActive = form.id === `${tabName}Form`;
        form.style.display = isActive ? 'block' : 'none';
        if (isActive) {
            form.classList.add('active');
        } else {
            form.classList.remove('active');
        }
        console.log('Форма:', form.id, isActive ? 'показана' : 'скрыта');
    });
}

function showError(formId, message) {
    console.log('Показ ошибки для формы:', formId, message);
    const errorElement = document.getElementById(`${formId}Error`);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function showSuccess(formId, message) {
    console.log('Показ успеха для формы:', formId, message);
    const errorElement = document.getElementById(`${formId}Error`);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.color = '#10B981';
        errorElement.style.display = 'block';
    }
}

function clearError(formId) {
    console.log('Очистка ошибок для формы:', formId);
    const errorElement = document.getElementById(`${formId}Error`);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
        errorElement.style.color = '#dc3545';
    }
}

function updateUserInterface(user) {
    console.log('Обновление интерфейса для пользователя:', user);
    
    const loginButton = document.querySelector('a.nav-link[href="#"]');
    if (loginButton) {
        // Создаем новую ссылку на дашборд
        const dashboardLink = document.createElement('a');
        dashboardLink.href = '/dashboard';
        dashboardLink.className = 'nav-link';
        
        // Проверяем структуру данных пользователя
        let displayName = 'Личный кабинет';
        if (user && typeof user === 'object') {
            if (user.email) {
                displayName = user.email;
            } else if (user.access_token) {
                // Если пришел только токен, оставляем "Личный кабинет"
                console.log('Получен только токен авторизации');
            }
        }
        dashboardLink.textContent = displayName;
        
        // Заменяем кнопку входа на ссылку дашборда
        loginButton.parentNode.replaceChild(dashboardLink, loginButton);
        
        // Закрываем модальное окно
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
            modal.style.opacity = '0';
        }
        
        // Очищаем формы
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        if (loginForm) loginForm.reset();
        if (registerForm) registerForm.reset();
    } else {
        console.error('Кнопка входа не найдена');
    }
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Инициализация скриптов завершена');
    
    // Проверяем авторизацию при загрузке страницы
    const user = await checkAuth();
    if (user) {
        updateUserInterface(user);
    }
    
    // Проверяем наличие элементов
    checkElements();

    // Добавляем обработчики для вкладок
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            console.log('Клик по вкладке:', tab.dataset.tab);
            switchTab(tab.dataset.tab);
        });
    });

    // Обработчик формы входа
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            clearError('login');
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            const result = await login(email, password);
            if (result.success) {
                showSuccess('login', 'Вход выполнен успешно!');
                updateUserInterface(result.user);
            } else {
                showError('login', result.error);
            }
        });
    }

    // Обработчик формы регистрации
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            clearError('register');
            
            const submitButton = registerForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            
            try {
                const email = document.getElementById('registerEmail').value;
                const password = document.getElementById('registerPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;

                if (password !== confirmPassword) {
                    showError('register', 'Пароли не совпадают');
                    return;
                }

                console.log('Попытка регистрации для:', email);
                const response = await register(email, password);
                
                if (response.success) {
                    showSuccess('register', 'Регистрация успешна! Сейчас вы будете перенаправлены на форму входа.');
                    setTimeout(() => {
                        switchTab('login');
                        clearError('register');
                    }, 2000);
                } else {
                    showError('register', response.error);
                }
            } catch (error) {
                showError('register', 'Произошла ошибка при регистрации');
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    // Добавляем обработчик для кнопки входа
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Клик по кнопке входа');
            openAuthModal();
        });
        console.log('Обработчик для кнопки входа добавлен');
    } else {
        console.error('Кнопка входа не найдена');
    }

    // Добавляем обработчик для кнопки закрытия
    const closeButton = document.getElementById('closeModalBtn');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            console.log('Клик по кнопке закрытия');
            closeAuthModal();
        });
        console.log('Обработчик для кнопки закрытия добавлен');
    } else {
        console.error('Кнопка закрытия не найдена');
    }

    // Закрытие модального окна при клике вне его
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('authModal');
        if (event.target === modal) {
            closeAuthModal();
        }
    });
}); 