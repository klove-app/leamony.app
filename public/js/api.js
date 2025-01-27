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

// Функция для сохранения логов
function saveLog(category, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        category,
        message,
        data
    };
    
    // Получаем существующие логи
    const logs = JSON.parse(localStorage.getItem('auth_logs') || '[]');
    
    // Добавляем новую запись
    logs.push(logEntry);
    
    // Ограничиваем количество сохраненных логов (хранить последние 100)
    if (logs.length > 100) {
        logs.shift();
    }
    
    // Сохраняем обновленные логи
    localStorage.setItem('auth_logs', JSON.stringify(logs));
    
    // Выводим в консоль как обычно
    console.log(`${category}: ${message}`, data || '');
}

// Функция для очистки логов
function clearLogs() {
    localStorage.removeItem('auth_logs');
}

// Функция для проверки и логирования состояния куки
function checkCookies(stage) {
    const cookies = document.cookie.split(';');
    const accessToken = cookies.find(c => c.trim().startsWith('access_token='));
    const refreshToken = cookies.find(c => c.trim().startsWith('refresh_token='));
    
    console.group(`Cookie Check - ${stage}`);
    console.log('All Cookies:', document.cookie);
    console.log('Access Token:', accessToken ? 'present' : 'missing');
    console.log('Refresh Token:', refreshToken ? 'present' : 'missing');
    if (accessToken) {
        console.log('Access Token Value:', accessToken.split('=')[1].substring(0, 10) + '...');
    }
    if (refreshToken) {
        console.log('Refresh Token Value:', refreshToken.split('=')[1].substring(0, 10) + '...');
    }
    console.groupEnd();
    
    return { accessToken, refreshToken };
}

// Функция для сохранения куки с дополнительными параметрами
function setCookie(name, value) {
    const cookieValue = `${name}=${value}; path=/; secure; samesite=strict`;
    document.cookie = cookieValue;
    console.log(`Setting cookie: ${name}=${value.substring(0, 10)}...`);
    
    // Проверяем, сохранилась ли кука
    setTimeout(() => {
        const cookies = document.cookie.split(';');
        const savedCookie = cookies.find(c => c.trim().startsWith(`${name}=`));
        console.log(`Cookie ${name} after setting:`, savedCookie ? 'saved' : 'not saved');
    }, 100);
}

// Функция задержки для отладки
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Функция для входа
async function login(username, password) {
    try {
        console.group('Login Process');
        console.log('Initial cookie state:');
        checkCookies('Before Login');

        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        console.log('Sending login request...');
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

        console.log('Login response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);

        const responseData = await response.json();
        console.log('Login response data:', {
            hasAccessToken: !!responseData.access_token,
            hasRefreshToken: !!responseData.refresh_token,
            hasUser: !!responseData.user
        });

        if (!response.ok) {
            throw {
                status: response.status,
                data: responseData
            };
        }

        if (responseData.access_token) {
            setCookie('access_token', responseData.access_token);
        }
        
        if (responseData.refresh_token) {
            setCookie('refresh_token', responseData.refresh_token);
        }

        // Проверяем состояние после сохранения
        console.log('Cookie state after setting:');
        checkCookies('After Login');

        console.groupEnd();
        return { success: true, user: responseData.user };
    } catch (error) {
        console.error('Login error:', error);
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
        console.log('Ответ от сервера:', {
            hasAccessToken: !!data.access_token,
            hasRefreshToken: !!data.refresh_token,
            hasUser: !!data.user,
            userData: data.user
        });
        
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

        // Проверяем наличие всех необходимых данных
        if (!data.access_token || !data.refresh_token || !data.user) {
            console.log('Отсутствуют необходимые данные в ответе:', {
                hasAccessToken: !!data.access_token,
                hasRefreshToken: !!data.refresh_token,
                hasUser: !!data.user
            });
            return { success: false, error: 'incomplete_response' };
        }

        // Сохраняем новые токены
        if (data.access_token) {
            document.cookie = `access_token=${data.access_token}; path=/;`;
        }
        if (data.refresh_token) {
            document.cookie = `refresh_token=${data.refresh_token}; path=/;`;
        }

        console.log('Токен успешно обновлен, данные пользователя:', data.user);
        console.groupEnd();
        return { success: true, user: data.user };
    } catch (error) {
        console.error('Token refresh error:', error);
        console.groupEnd();
        return { success: false, error: 'refresh_error' };
    }
}

// Функция для показа модального окна с логами
function showLogsModal(logs) {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.backgroundColor = 'white';
    modal.style.padding = '20px';
    modal.style.borderRadius = '10px';
    modal.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    modal.style.zIndex = '10000';
    modal.style.maxWidth = '400px';
    modal.style.width = '90%';
    modal.style.textAlign = 'center';

    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '9999';

    const title = document.createElement('h3');
    title.style.margin = '0 0 15px 0';
    title.style.color = '#333';
    title.textContent = 'Сохранение логов';

    const text = document.createElement('p');
    text.style.margin = '0 0 20px 0';
    text.style.color = '#666';
    text.textContent = 'Нажмите кнопку ниже, чтобы сохранить логи авторизации';

    const downloadButton = document.createElement('button');
    downloadButton.style.backgroundColor = '#4CAF50';
    downloadButton.style.color = 'white';
    downloadButton.style.padding = '10px 20px';
    downloadButton.style.border = 'none';
    downloadButton.style.borderRadius = '5px';
    downloadButton.style.cursor = 'pointer';
    downloadButton.style.marginRight = '10px';
    downloadButton.textContent = 'Скачать логи';
    downloadButton.onmouseover = () => downloadButton.style.backgroundColor = '#45a049';
    downloadButton.onmouseout = () => downloadButton.style.backgroundColor = '#4CAF50';

    const closeButton = document.createElement('button');
    closeButton.style.backgroundColor = '#f44336';
    closeButton.style.color = 'white';
    closeButton.style.padding = '10px 20px';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '5px';
    closeButton.style.cursor = 'pointer';
    closeButton.textContent = 'Закрыть';
    closeButton.onmouseover = () => closeButton.style.backgroundColor = '#da190b';
    closeButton.onmouseout = () => closeButton.style.backgroundColor = '#f44336';

    const closeModal = () => {
        document.body.removeChild(modal);
        document.body.removeChild(overlay);
        localStorage.removeItem('pending_logs');
    };

    downloadButton.onclick = () => {
        const blob = new Blob([logs], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'auth_logs.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    closeButton.onclick = closeModal;
    overlay.onclick = closeModal;

    modal.appendChild(title);
    modal.appendChild(text);
    modal.appendChild(downloadButton);
    modal.appendChild(closeButton);

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
}

// Функция для проверки и показа отложенных логов
function checkPendingLogs() {
    const pendingLogs = localStorage.getItem('pending_logs');
    if (pendingLogs) {
        showLogsModal(pendingLogs);
    }
}

// Функция для просмотра логов
function viewLogs() {
    const authLogs = localStorage.getItem('auth_logs');
    const pendingLogs = localStorage.getItem('pending_logs');
    
    console.group('Saved Logs');
    console.log('Auth Logs:', authLogs ? JSON.parse(authLogs) : 'No auth logs');
    console.log('Pending Logs:', pendingLogs || 'No pending logs');
    console.groupEnd();
    
    if (pendingLogs) {
        showLogsModal(pendingLogs);
    } else if (authLogs) {
        const logs = JSON.parse(authLogs);
        const formattedLogs = logs.map(log => {
            const timestamp = new Date(log.timestamp).toLocaleString();
            let logText = `[${timestamp}] ${log.category}: ${log.message}`;
            if (log.data) {
                logText += '\n    Данные: ' + JSON.stringify(log.data, null, 2).replace(/\n/g, '\n    ');
            }
            return logText;
        }).join('\n\n');
        showLogsModal(formattedLogs);
    } else {
        alert('Логи не найдены');
    }
}

// Функция для выхода
async function logout() {
    try {
        console.group('Logout Process');
        console.log('Cookie state before logout:');
        checkCookies('Before Logout');

        const response = await fetch(`${config.API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        });

        console.log('Logout response:', {
            status: response.status,
            ok: response.ok
        });

        // Очищаем куки
        document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
        document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';

        console.log('Cookie state after clearing:');
        checkCookies('After Logout');

        console.groupEnd();
        return true;
    } catch (error) {
        console.error('Logout error:', error);
        console.groupEnd();
        return false;
    }
}

// Добавляем проверку отложенных логов при загрузке страницы
document.addEventListener('DOMContentLoaded', checkPendingLogs);

// Кэш для результата checkAuth
let authCheckCache = {
    user: null,
    timestamp: null,
    CACHE_DURATION: 5 * 60 * 1000 // 5 минут в миллисекундах
};

// Функция для проверки авторизации
async function checkAuth(forceCheck = false) {
    console.group('Check Auth Process');
    console.log('1. Начало проверки авторизации');
    
    // Проверяем наличие токенов
    const hasAccessToken = document.cookie.includes('access_token=');
    const hasRefreshToken = document.cookie.includes('refresh_token=');
    
    console.log('2. Все куки:', {
        hasAccessToken,
        hasRefreshToken,
        cookies: document.cookie
    });

    if (!hasAccessToken && !hasRefreshToken) {
        console.log('3. Токены отсутствуют - пользователь не авторизован');
        console.groupEnd();
        return null;
    }

    if (!hasAccessToken && hasRefreshToken) {
        console.log('4. Access token отсутствует, пробуем обновить через refresh token');
        const refreshResult = await refreshToken();
        console.log('5. Результат обновления токена:', refreshResult);
        
        if (!refreshResult.success) {
            console.log('6. Не удалось обновить токен');
            console.groupEnd();
            return null;
        }
    }

    // Если есть access token или только что получили новый, возвращаем информацию о пользователе
    console.log('7. Access token валиден, возвращаем данные пользователя');
    console.groupEnd();
    return { username: 'User', email: 'user@example.com' };
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
            throw new Error('Access token не найден');
        }

        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessTokenCookie.split('=')[1].trim()}`
            }
        });

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
    getRuns,
    clearLogs,
    viewLogs,
    delay
};
