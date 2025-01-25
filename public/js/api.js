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
async function refreshToken() {
    try {
        console.log('Отправляем запрос на обновление токена...');
        const response = await fetch(`${config.API_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        });
        console.log('Ответ на обновление токена:', response.status, response.statusText);

        if (!response.ok) {
            console.log('Не удалось обновить токен');
            return { success: false };
        }

        const data = await response.json();
        console.log('Токен успешно обновлен');
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
        console.log('Отправляем запрос на проверку авторизации...');
        const response = await fetch(`${config.API_URL}/users/me`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        });
        console.log('Получен ответ:', response.status, response.statusText);

        if (!response.ok) {
            console.log('Ответ не ok, статус:', response.status);
            if (response.status === 401) {
                console.log('Пробуем обновить токен...');
                // Try to refresh token
                const refreshResult = await refreshToken();
                console.log('Результат обновления токена:', refreshResult);
                if (refreshResult.success) {
                    console.log('Токен обновлен, повторяем проверку авторизации');
                    return await checkAuth();
                }
            }
            return null;
        }

        const data = await response.json();
        console.log('Данные пользователя получены:', data);
        return data;
    } catch (error) {
        console.error('Auth check error:', error);
        return null;
    }
}

// Получение списка пробежек
async function getRuns(startDate = null, endDate = null, limit = 50, offset = 0) {
    try {
        console.group('Запрос пробежек');
        console.log('Параметры запроса:', { startDate, endDate, limit, offset });
        
        let url = `${config.API_URL}/runs/?limit=${limit}&offset=${offset}`;
        
        if (startDate) {
            url += `&start_date=${startDate}`;
        }
        if (endDate) {
            url += `&end_date=${endDate}`;
        }

        console.log('URL запроса:', url);
        console.log('Отправляем запрос...');
        
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log('Получен ответ:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                console.log('Требуется обновление токена...');
                // Пробуем обновить токен
                const refreshed = await refreshToken();
                console.log('Результат обновления токена:', refreshed);
                if (refreshed) {
                    console.log('Токен обновлен, повторяем запрос...');
                    console.groupEnd();
                    // Повторяем запрос
                    return getRuns(startDate, endDate, limit, offset);
                }
            }
            console.error('Ошибка при получении пробежек:', response.status, response.statusText);
            console.groupEnd();
            throw new Error(`Failed to get runs: ${response.status}`);
        }

        const data = await response.json();
        console.log('Получены данные:', data);
        console.groupEnd();
        return data;
    } catch (error) {
        console.error('Ошибка при получении пробежек:', error);
        console.groupEnd();
        throw error;
    }
}

export {
    register,
    login,
    logout,
    refreshToken,
    checkAuth,
    getRuns
};
