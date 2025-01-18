// Базовый URL API
const API_BASE_URL = 'https://api.runconnect.app';

// Функция для входа
async function login(email, password) {
    console.log('Отправка запроса на вход:', { email });
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });

        console.log('Ответ сервера:', response.status, response.statusText);
        
        const data = await response.json().catch(e => {
            console.error('Ошибка парсинга JSON:', e);
            return {};
        });
        
        console.log('Данные ответа:', data);

        if (!response.ok) {
            return { 
                success: false, 
                error: data.message || data.error || 'Ошибка входа. Проверьте email и пароль.' 
            };
        }

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
    console.log('Отправка запроса на регистрацию:', { email });
    
    try {
        const userData = {
            email,
            password,
            name: email.split('@')[0]
        };
        
        console.log('Данные для регистрации:', userData);

        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(userData),
            credentials: 'include'
        });

        console.log('Ответ сервера:', response.status, response.statusText);
        
        const data = await response.json().catch(e => {
            console.error('Ошибка парсинга JSON:', e);
            return {};
        });
        
        console.log('Данные ответа:', data);

        if (!response.ok) {
            return { 
                success: false, 
                error: data.message || data.error || 'Ошибка регистрации. Возможно, email уже занят.' 
            };
        }

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
    console.log('Проверка авторизации...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        });

        console.log('Ответ сервера:', response.status, response.statusText);

        if (!response.ok) {
            console.log('Пользователь не авторизован');
            return null;
        }

        const data = await response.json();
        console.log('Данные пользователя:', data);
        return data.user;
    } catch (error) {
        console.error('Ошибка при проверке авторизации:', error);
        return null;
    }
}

// Функция для выхода
async function logout() {
    console.log('Отправка запроса на выход');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        });

        console.log('Ответ сервера:', response.status, response.statusText);
        return response.ok;
    } catch (error) {
        console.error('Ошибка при выходе:', error);
        return false;
    }
}
