import config from './config.js';

// Функция для регистрации
async function register(username, email, password, yearly_goal = 0) {
    try {
        const requestBody = {
            username: username,
            email: email,
            password: password,
            goal_km: Number(yearly_goal)
        };
        
        // Логируем запрос
        console.group('Registration Request');
        console.log('URL:', `${config.API_URL}/auth/register`);
        console.log('Body:', requestBody);
        console.groupEnd();

        const response = await fetch(`${config.API_URL}/auth/register`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        let responseData;
        try {
            responseData = await response.json();
        } catch (e) {
            responseData = null;
        }
        
        // Логируем ответ
        console.group('Registration Response');
        console.log('Status:', response.status);
        console.log('Data:', responseData);
        console.groupEnd();

        if (!response.ok) {
            // Проверяем наличие ошибок валидации
            if (responseData?.error?.[0]?.msg) {
                throw {
                    status: response.status,
                    data: {
                        detail: responseData.error[0].msg
                    }
                };
            }
            throw {
                status: response.status,
                data: responseData
            };
        }

        return { success: true, user: responseData };
    } catch (error) {
        console.group('Registration Error');
        console.error('Status:', error.status);
        console.error('Data:', error.data);
        console.groupEnd();

        return { 
            success: false, 
            error: error.data?.detail || error.data?.message || 'Registration failed',
            details: error.data
        };
    }
}

// Функция для входа
async function login(username, password) {
    try {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        // Логируем запрос
        console.group('Login Request');
        console.log('URL:', `${config.API_URL}/auth/login`);
        console.log('Body:', { username, password: '***' });
        console.groupEnd();

        const response = await fetch(`${config.API_URL}/auth/login`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'Origin': window.location.origin
            },
            body: formData
        });

        let responseData;
        try {
            responseData = await response.json();
        } catch (e) {
            responseData = null;
        }

        // Логируем ответ
        console.group('Login Response');
        console.log('Status:', response.status);
        console.log('Data:', responseData);
        console.groupEnd();

        if (!response.ok) {
            throw {
                status: response.status,
                data: responseData
            };
        }

        return { success: true, user: responseData };
    } catch (error) {
        console.group('Login Error');
        console.error('Status:', error.status);
        console.error('Data:', error.data);
        console.groupEnd();

        return { 
            success: false, 
            error: error.data?.detail || error.data?.message || 'Login failed',
            details: error.data
        };
    }
}

// Функция обновления токена
async function refreshToken(refresh_token) {
    try {
        const response = await fetch(`${config.API_URL}/auth/refresh?refresh_token=${encodeURIComponent(refresh_token)}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            return { success: false };
        }

        const data = await response.json();
        return { success: true, ...data };
    } catch (error) {
        console.error('Token refresh error:', error);
        return { success: false };
    }
}

// Функция для выхода
async function logout() {
    try {
        const response = await fetch(`${config.API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        });
        
        return response.ok;
    } catch (error) {
        console.error('Logout error:', error);
        return false;
    }
}

// Функция для проверки авторизации
async function checkAuth() {
    try {
        const response = await fetch(`${config.API_URL}/users/me`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Try to refresh token
                const refreshResult = await refreshToken();
                if (refreshResult.success) {
                    return await checkAuth();
                }
            }
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Auth check error:', error);
        return null;
    }
}

// Получение статистики пользователя
export async function getUserStats() {
    try {
        const response = await fetch(`${config.API_URL}/users/me/stats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch user stats: ${response.status}`);
        }

        const data = await response.json();
        console.log('User stats:', data);
        return data;
    } catch (error) {
        console.error('Error fetching user stats:', error);
        throw error;
    }
}

export {
    register,
    login,
    logout,
    refreshToken,
    checkAuth,
    getUserStats
};
