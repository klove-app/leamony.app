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

        // Сохраняем токен
        if (data.access_token) {
            localStorage.setItem('access_token', data.access_token);
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

        // Сохраняем токен, если он есть в ответе
        if (data.access_token) {
            localStorage.setItem('access_token', data.access_token);
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
        const token = localStorage.getItem('access_token');
        if (!token) {
            console.log('Токен не найден');
            return null;
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
        });

        console.log('Ответ сервера:', response.status, response.statusText);

        // Проверяем статус ответа
        if (response.status === 401) {
            // Только при явной ошибке авторизации удаляем токен
            console.log('Токен недействителен');
            localStorage.removeItem('access_token');
            return null;
        }

        if (!response.ok) {
            // При других ошибках не удаляем токен
            console.log('Ошибка сервера:', response.status);
            throw new Error(`Ошибка сервера: ${response.status}`);
        }

        const data = await response.json();
        console.log('Данные пользователя:', data);
        return data.user;
    } catch (error) {
        console.error('Ошибка при проверке авторизации:', error);
        // Не удаляем токен при ошибках сети
        if (error.message.includes('401')) {
            localStorage.removeItem('access_token');
        }
        return null;
    }
}

// Функция для выхода
async function logout() {
    console.log('Отправка запроса на выход');
    
    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            credentials: 'include'
        });

        console.log('Ответ сервера:', response.status, response.statusText);
        
        // Удаляем токен в любом случае
        localStorage.removeItem('access_token');
        
        return response.ok;
    } catch (error) {
        console.error('Ошибка при выходе:', error);
        // Удаляем токен даже при ошибке
        localStorage.removeItem('access_token');
        return false;
    }
}

// Получение статистики пользователя
async function getUserStats() {
    console.log('Получение статистики пользователя...');
    
    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('No access token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/profile/me`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
        });

        console.log('Ответ сервера:', response.status, response.statusText);

        if (!response.ok) {
            throw new Error('Failed to fetch user stats');
        }

        const data = await response.json();
        console.log('Данные статистики:', data);

        // Преобразуем данные в формат для графиков
        return {
            totalProgress: {
                completed: data.stats?.total_distance || 0,
                remaining: data.stats?.goal_distance || 1000 - (data.stats?.total_distance || 0)
            },
            weeklyActivity: data.stats?.weekly_activity || [0, 0, 0, 0, 0, 0, 0],
            monthlyStats: data.stats?.monthly_stats || [0, 0, 0, 0]
        };
    } catch (error) {
        console.error('Ошибка при получении статистики:', error);
        throw error;
    }
}
