// Базовый URL API
const API_BASE_URL = '/api';

// Функция для входа
async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });

        const data = await response.json();
        
        if (response.ok) {
            return { success: true, user: data.user };
        } else {
            return { success: false, error: data.message || 'Ошибка входа' };
        }
    } catch (error) {
        console.error('Ошибка при входе:', error);
        return { success: false, error: 'Произошла ошибка при входе' };
    }
}

// Функция для регистрации
async function register(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        
        if (response.ok) {
            return { success: true };
        } else {
            return { success: false, error: data.message || 'Ошибка регистрации' };
        }
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        return { success: false, error: 'Произошла ошибка при регистрации' };
    }
}

// Функция для проверки авторизации
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/check`, {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            return data.user;
        }
        return null;
    } catch (error) {
        console.error('Ошибка при проверке авторизации:', error);
        return null;
    }
}

// Функция для выхода
async function logout() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        return response.ok;
    } catch (error) {
        console.error('Ошибка при выходе:', error);
        return false;
    }
}
