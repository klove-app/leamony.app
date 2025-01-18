// Базовый URL API
const API_BASE_URL = 'https://runconnect.app/api';

// Функция для входа
async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { 
                success: false, 
                error: errorData.message || 'Ошибка входа. Проверьте email и пароль.' 
            };
        }

        const data = await response.json();
        return { success: true, user: data.user };
    } catch (error) {
        console.error('Ошибка при входе:', error);
        return { 
            success: false, 
            error: 'Произошла ошибка при входе. Попробуйте позже.' 
        };
    }
}

// Функция для регистрации
async function register(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                email, 
                password,
                name: email.split('@')[0] // Добавляем имя пользователя из email
            }),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { 
                success: false, 
                error: errorData.message || 'Ошибка регистрации. Возможно, email уже занят.' 
            };
        }

        const data = await response.json();
        return { success: true, user: data.user };
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        return { 
            success: false, 
            error: 'Произошла ошибка при регистрации. Попробуйте позже.' 
        };
    }
}

// Функция для проверки авторизации
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/check`, {
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.user;
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
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        });

        return response.ok;
    } catch (error) {
        console.error('Ошибка при выходе:', error);
        return false;
    }
}
