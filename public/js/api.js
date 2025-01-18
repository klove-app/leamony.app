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
        });

        if (!response.ok) {
            throw new Error('Ошибка авторизации');
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        return data;
    } catch (error) {
        console.error('Ошибка при входе:', error);
        throw error;
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

        if (!response.ok) {
            throw new Error('Ошибка регистрации');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        throw error;
    }
}

// Функция для проверки авторизации
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/check`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        return response.ok;
    } catch (error) {
        console.error('Ошибка при проверке авторизации:', error);
        return false;
    }
}

// Функция для выхода
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/';
}
