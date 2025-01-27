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

        console.group('Login Process');
        console.log('1. Начало процесса входа');
        console.log('URL:', `${config.API_URL}/auth/login`);
        console.log('Body:', { username, password: '***' });

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
            console.log('2. Получен ответ от сервера:', {
                status: response.status,
                hasAccessToken: !!responseData.access_token,
                hasRefreshToken: !!responseData.refresh_token,
                hasUser: !!responseData.user
            });
        } catch (e) {
            console.error('2. Ошибка при парсинге ответа:', e);
            responseData = null;
        }

        if (!response.ok) {
            console.error('3. Ошибка входа:', {
                status: response.status,
                data: responseData
            });
            throw {
                status: response.status,
                data: responseData
            };
        }

        // Сохраняем токены после успешного входа
        if (responseData.access_token) {
            document.cookie = `access_token=${responseData.access_token}; path=/;`;
            console.log('4. Access token сохранен в куки');
        } else {
            console.warn('4. Access token отсутствует в ответе');
        }
        
        if (responseData.refresh_token) {
            document.cookie = `refresh_token=${responseData.refresh_token}; path=/;`;
            console.log('5. Refresh token сохранен в куки');
        } else {
            console.warn('5. Refresh token отсутствует в ответе');
        }

        // Проверяем сохранение токенов
        const cookies = document.cookie.split(';');
        console.log('6. Проверка сохраненных токенов:', {
            hasAccessToken: cookies.some(c => c.trim().startsWith('access_token=')),
            hasRefreshToken: cookies.some(c => c.trim().startsWith('refresh_token='))
        });

        console.log('7. Успешный вход');
        console.groupEnd();

        return { success: true, user: responseData.user };
    } catch (error) {
        console.error('Login Error:', error);
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
        console.group('Token Refresh');
        // Получаем refresh_token из куки
        const cookies = document.cookie.split(';');
        console.log('Проверка кук для refresh token');
        
        const refreshTokenCookie = cookies.find(cookie => cookie.trim().startsWith('refresh_token='));
        if (!refreshTokenCookie) {
            console.log('Refresh token не найден в куки');
            console.groupEnd();
            return { success: false, error: 'refresh_token_not_found' };
        }
        
        const refreshToken = refreshTokenCookie.split('=')[1].trim();
        if (!refreshToken) {
            console.log('Refresh token пустой');
            console.groupEnd();
            return { success: false, error: 'empty_refresh_token' };
        }
        
        console.log('Найден refresh_token:', refreshToken.substring(0, 10) + '...');
        
        const params = new URLSearchParams({ refresh_token: refreshToken });
        const response = await fetch(`${config.API_URL}/auth/refresh?${params}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        console.log('Статус ответа:', response.status, response.statusText);

        const data = await response.json();
        
        if (!response.ok) {
            if (response.status === 401) {
                console.log('Refresh token истек или недействителен');
                // Очищаем куки при невалидном токене
                document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
                document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
                return { success: false, error: 'invalid_refresh_token' };
            }
            console.log('Не удалось обновить токен:', data);
            return { success: false, error: 'refresh_failed', details: data };
        }

        // Сохраняем новые токены
        if (data.access_token) {
            document.cookie = `access_token=${data.access_token}; path=/;`;
        }
        if (data.refresh_token) {
            document.cookie = `refresh_token=${data.refresh_token}; path=/;`;
        }

        console.log('Токен успешно обновлен');
        console.groupEnd();
        return { success: true, user: data.user };
    } catch (error) {
        console.error('Token refresh error:', error);
        console.groupEnd();
        return { success: false, error: 'refresh_error' };
    }
}

// Функция для выхода
async function logout() {
    try {
        // Очищаем токены
        document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
        document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
        
        const response = await fetch(`${config.API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        });
        
        return true;
    } catch (error) {
        console.error('Logout error:', error);
        return false;
    }
}

// Функция для проверки авторизации
async function checkAuth() {
    try {
        console.group('Check Auth Process');
        console.log('1. Начало проверки авторизации');
        
        // Проверяем наличие access_token
        const cookies = document.cookie.split(';');
        console.log('2. Текущие куки:', cookies.map(c => {
            const [name] = c.trim().split('=');
            return name;
        }));
        
        const accessTokenCookie = cookies.find(cookie => cookie.trim().startsWith('access_token='));
        const refreshTokenCookie = cookies.find(cookie => cookie.trim().startsWith('refresh_token='));
        
        console.log('3. Статус токенов:', {
            hasAccessToken: !!accessTokenCookie,
            hasRefreshToken: !!refreshTokenCookie
        });

        if (!accessTokenCookie) {
            console.log('4. Access token не найден, пробуем обновить');
            const refreshResult = await refreshToken();
            console.log('5. Результат обновления токена:', {
                success: refreshResult.success,
                error: refreshResult.error,
                hasUser: !!refreshResult.user
            });
            
            if (!refreshResult.success) {
                console.log('6. Не удалось подтвердить авторизацию:', refreshResult.error);
                console.groupEnd();
                return null;
            }

            console.log('6. Токен успешно обновлен');
            console.groupEnd();
            return refreshResult.user;
        }

        // Проверяем валидность access_token через запрос пробежек
        try {
            console.log('4. Проверка валидности access token');
            const today = new Date().toISOString().split('T')[0];
            const response = await fetch(`${config.API_URL}/runs/?start_date=${today}&end_date=${today}&limit=1`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${accessTokenCookie.split('=')[1].trim()}`
                }
            });

            console.log('5. Статус проверки токена:', {
                status: response.status,
                ok: response.ok
            });

            if (response.status === 401) {
                console.log('6. Access token недействителен, пробуем обновить');
                const refreshResult = await refreshToken();
                console.log('7. Результат обновления токена:', {
                    success: refreshResult.success,
                    error: refreshResult.error,
                    hasUser: !!refreshResult.user
                });

                if (!refreshResult.success) {
                    console.log('8. Не удалось подтвердить авторизацию после обновления');
                    console.groupEnd();
                    return null;
                }

                console.log('8. Авторизация подтверждена после обновления токена');
                console.groupEnd();
                return refreshResult.user;
            }

            if (!response.ok) {
                console.error('6. Ошибка при проверке токена:', response.status);
                throw new Error(`Ошибка проверки авторизации: ${response.status}`);
            }

            // Если запрос успешен, значит токен валиден
            console.log('6. Access token валиден, обновляем для актуализации данных');
            const refreshResult = await refreshToken();
            console.log('7. Результат обновления токена:', {
                success: refreshResult.success,
                hasUser: !!refreshResult.user
            });
            
            console.log('8. Авторизация подтверждена');
            console.groupEnd();
            return refreshResult.user;
            
        } catch (error) {
            console.error('Ошибка при проверке токена:', error);
            console.log('Пробуем обновить токен после ошибки');
            const refreshResult = await refreshToken();
            console.log('Результат обновления токена после ошибки:', {
                success: refreshResult.success,
                error: refreshResult.error,
                hasUser: !!refreshResult.user
            });

            if (!refreshResult.success) {
                console.log('Не удалось подтвердить авторизацию после ошибки');
                console.groupEnd();
                return null;
            }

            console.log('Авторизация подтверждена после ошибки');
            console.groupEnd();
            return refreshResult.user;
        }
    } catch (error) {
        console.error('Auth check error:', error);
        console.groupEnd();
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
        // Получаем access_token из куки
        const cookies = document.cookie.split(';');
        const accessTokenCookie = cookies.find(cookie => cookie.trim().startsWith('access_token='));
        if (!accessTokenCookie) {
            console.log('Access token не найден, пробуем обновить...');
            const refreshResult = await refreshToken();
            if (!refreshResult.success) {
                throw new Error('Не удалось обновить токен');
            }
            // Повторяем запрос после обновления токена
            return getRuns(startDate, endDate, limit, offset);
        }

        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessTokenCookie.split('=')[1].trim()}`
            }
        });

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
