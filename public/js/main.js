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

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, инициализация скриптов...');
    
    // Проверяем наличие элементов
    checkElements();

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

    console.log('Инициализация скриптов завершена');
}); 