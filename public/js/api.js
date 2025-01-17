// Определяем базовый URL в зависимости от окружения
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8000/api'
    : 'https://api-server-production-39f0.up.railway.app/api';

// Функция для регистрации
async function register(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка регистрации');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

// Функция для авторизации
async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка входа. Проверьте email и пароль.');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw new Error(error.message || 'Ошибка при попытке входа');
    }
}

// Функция для получения данных профиля
async function getProfile() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        throw new Error('Не авторизован');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/profile/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Токен истек или недействителен');
            }
            throw new Error('Ошибка получения профиля');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Profile error:', error);
        throw error;
    }
}

// Функция для обновления токена
async function refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
        throw new Error('Нет refresh токена');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (!response.ok) {
            throw new Error('Ошибка обновления токена');
        }

        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        return data;
    } catch (error) {
        throw error;
    }
}

// Функция для выхода
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/auth.html';
}

// Функция для обновления профиля
async function updateProfile(profileData) {
    const token = localStorage.getItem('access_token');
    if (!token) {
        throw new Error('Не авторизован');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/profile/profile`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка обновления профиля');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Update profile error:', error);
        throw error;
    }
}

// Экспортируем функции для использования в других файлах
window.api = {
    register,
    login,
    getProfile,
    updateProfile,
    logout
};