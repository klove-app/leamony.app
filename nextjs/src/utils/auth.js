/**
 * Получение токена из cookie
 * @returns {string|null} Токен авторизации
 */
export function getToken() {
    return document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1] || null;
}

/**
 * Получение имени пользователя из cookie
 * @returns {string} Имя пользователя
 */
export function getUsername() {
    return document.cookie
        .split('; ')
        .find(row => row.startsWith('username='))
        ?.split('=')[1] || 'Пользователь';
}

/**
 * Проверка авторизации
 * @returns {boolean} Авторизован ли пользователь
 */
export function isAuthenticated() {
    return !!getToken();
}

/**
 * Установка cookie
 * @param {string} name - Имя cookie
 * @param {string} value - Значение cookie
 * @param {number} [days=7] - Срок действия в днях
 */
export function setCookie(name, value, days = 7) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/`;
}

/**
 * Удаление cookie
 * @param {string} name - Имя cookie
 */
export function removeCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

/**
 * Выход из системы
 */
export function logout() {
    removeCookie('access_token');
    removeCookie('username');
    window.location.href = '/';
}

/**
 * Перенаправление на страницу входа
 * @param {string} [returnUrl='/'] - URL для возврата после входа
 */
export function redirectToLogin(returnUrl = '/') {
    const encodedReturnUrl = encodeURIComponent(returnUrl);
    window.location.href = `/login.html?return=${encodedReturnUrl}`;
}

/**
 * Проверка и обновление токена
 * @returns {Promise<boolean>} Успешно ли обновлен токен
 */
export async function refreshTokenIfNeeded() {
    const token = getToken();
    if (!token) return false;

    try {
        const response = await fetch('/api/v1/auth/refresh', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to refresh token');
        }

        const data = await response.json();
        setCookie('access_token', data.access_token);
        return true;
    } catch (error) {
        console.error('Error refreshing token:', error);
        logout();
        return false;
    }
}

/**
 * Обработчик ошибок авторизации
 * @param {Error} error - Ошибка
 * @returns {Promise<void>}
 */
export async function handleAuthError(error) {
    if (error.message.includes('401')) {
        // Пробуем обновить токен
        const refreshed = await refreshTokenIfNeeded();
        if (!refreshed) {
            // Если не удалось обновить, перенаправляем на вход
            redirectToLogin(window.location.pathname);
        }
    } else {
        console.error('Auth error:', error);
        throw error;
    }
} 