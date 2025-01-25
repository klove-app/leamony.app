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
        // Получаем refresh_token из куки
        const cookies = document.cookie.split(';');
        const refreshTokenCookie = cookies.find(cookie => cookie.trim().startsWith('refresh_token='));
        if (!refreshTokenCookie) {
            console.log('Refresh token не найден в куки');
            return { success: false };
        }
        
        const refreshToken = refreshTokenCookie.split('=')[1].trim();
        console.log('Отправляем запрос на обновление токена...');
        
        const params = new URLSearchParams({ refresh_token: refreshToken });
        const response = await fetch(`${config.API_URL}/auth/refresh?${params}`, {
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
        // Пробуем обновить токен для проверки авторизации
        const refreshResult = await refreshToken();
        console.log('Результат проверки авторизации:', refreshResult);
        
        if (!refreshResult.success) {
            console.log('Не удалось подтвердить авторизацию');
            return null;
        }

        console.log('Авторизация подтверждена');
        return refreshResult.user;
    } catch (error) {
        console.error('Auth check error:', error);
        return null;
    }
}

// Получение списка пробежек
async function getRuns(startDate, endDate, limit = 50, offset = 0) {
    console.group('Запрос пробежек');
    console.log('Параметры запроса:', { startDate, endDate, limit, offset });

    const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        limit: limit.toString(),
        offset: offset.toString()
    });

    const url = `${config.API_URL}/runs/?${params}`;
    console.log('URL запроса:', url);

    try {
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log('Статус ответа:', response.status, response.statusText);
        
        if (response.status === 401) {
            console.log('Требуется обновление токена');
            const refreshResult = await refreshToken();
            if (refreshResult.success) {
                return getRuns(startDate, endDate, limit, offset);
            }
            throw new Error('Не удалось обновить токен');
        }

        if (!response.ok) {
            throw new Error(`Ошибка получения пробежек: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Получены данные:', data);
        console.groupEnd();
        return data.runs || data;
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
