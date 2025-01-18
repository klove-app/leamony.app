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
    // Обновляем активную вкладку
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Показываем соответствующую форму
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.toggle('active', form.id === `${tabName}Form`);
    });
}

function showError(formId, message) {
    const errorElement = document.getElementById(`${formId}Error`);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function clearError(formId) {
    const errorElement = document.getElementById(`${formId}Error`);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}

function updateUserInterface(user) {
    const loginButton = document.getElementById('loginButton');
    if (loginButton && user) {
        loginButton.textContent = user.email;
        loginButton.href = '/dashboard';
        loginButton.removeEventListener('click', openAuthModal);
    }
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, инициализация скриптов...');
    
    // Проверяем наличие элементов
    checkElements();

    // Добавляем обработчики для вкладок
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Обработчик формы входа
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            clearError('login');

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const response = await login(email, password);
                if (response.success) {
                    updateUserInterface(response.user);
                    closeAuthModal();
                } else {
                    showError('login', response.error || 'Ошибка входа');
                }
            } catch (error) {
                showError('login', 'Произошла ошибка при входе');
            }
        });
    }

    // Обработчик формы регистрации
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            clearError('register');

            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                showError('register', 'Пароли не совпадают');
                return;
            }

            try {
                const response = await register(email, password);
                if (response.success) {
                    showError('register', 'Регистрация успешна! Теперь вы можете войти.');
                    setTimeout(() => {
                        switchTab('login');
                        clearError('register');
                    }, 2000);
                } else {
                    showError('register', response.error || 'Ошибка регистрации');
                }
            } catch (error) {
                showError('register', 'Произошла ошибка при регистрации');
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

    // Проверяем авторизацию при загрузке
    checkAuth().then(user => {
        if (user) {
            updateUserInterface(user);
        }
    });

    console.log('Инициализация скриптов завершена');
}); 