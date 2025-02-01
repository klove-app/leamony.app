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
    // Определяем текущий домен
    const currentDomain = window.location.hostname;
    console.log('Current domain:', currentDomain);
    
    // Если домен заканчивается на netlify.app, не добавляем его в куки
    const cookieOptions = currentDomain.endsWith('netlify.app') 
        ? 'path=/; secure; samesite=strict'
        : `domain=${currentDomain}; path=/; secure; samesite=strict`;
    
    const cookieValue = `${name}=${value}; ${cookieOptions}`;
    document.cookie = cookieValue;
    console.log(`Setting cookie: ${name}=${value.substring(0, 10)}... with options: ${cookieOptions}`);
    
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
                'Accept': 'application/json'
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
                'Content-Type': 'application/x-www-form-urlencoded'
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
                const currentDomain = window.location.hostname;
                const domainOption = currentDomain.endsWith('netlify.app') ? '' : `domain=${currentDomain}; `;
                document.cookie = `refresh_token=; ${domainOption}path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
                document.cookie = `access_token=; ${domainOption}path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
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
            setCookie('access_token', data.access_token);
        }
        if (data.refresh_token) {
            setCookie('refresh_token', data.refresh_token);
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
        const currentDomain = window.location.hostname;
        const domainOption = currentDomain.endsWith('netlify.app') ? '' : `domain=${currentDomain}; `;
        document.cookie = `refresh_token=; ${domainOption}path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
        document.cookie = `access_token=; ${domainOption}path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;

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

    try {
        // Получаем access_token из куки
        const cookies = document.cookie.split(';');
        const accessTokenCookie = cookies.find(cookie => cookie.trim().startsWith('access_token='));
        
        if (!accessTokenCookie) {
            console.log('7. Access token не найден в куках');
            console.groupEnd();
            return null;
        }

        const accessToken = accessTokenCookie.split('=')[1].trim();
        console.log('7. Запрашиваем данные пользователя');
        const response = await fetch(`${config.API_URL}/users/me`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            console.log('8. Ошибка получения данных пользователя:', response.status);
            if (response.status === 401) {
                // Если токен истек, пробуем обновить
                const refreshResult = await refreshToken();
                if (!refreshResult.success) {
                    console.log('9. Не удалось обновить токен после ошибки 401');
                    console.groupEnd();
                    return null;
                }

                // Получаем новый access token
                const newAccessTokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('access_token='));
                if (!newAccessTokenCookie) {
                    console.log('10. Новый access token не найден после обновления');
                    console.groupEnd();
                    return null;
                }

                const newAccessToken = newAccessTokenCookie.split('=')[1].trim();
                
                // Повторяем запрос с новым токеном
                const retryResponse = await fetch(`${config.API_URL}/users/me`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${newAccessToken}`
                    },
                    credentials: 'include'
                });
                
                if (!retryResponse.ok) {
                    console.log('11. Повторный запрос не удался:', retryResponse.status);
                    console.groupEnd();
                    return null;
                }
                
                const userData = await retryResponse.json();
                console.log('12. Данные пользователя получены после обновления токена:', userData);
                console.groupEnd();
                return userData;
            }
            console.groupEnd();
            return null;
        }

        const userData = await response.json();
        console.log('8. Данные пользователя получены:', userData);
        console.groupEnd();
        return userData;
    } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
        console.groupEnd();
        return null;
    }
}

// Получение списка пробежек
async function getRuns(startDate = null, endDate = null, limit = 50, offset = 0) {
    console.group('Запрос пробежек');
    
    // Валидация параметров
    if (limit > 100) {
        console.warn('Limit не может быть больше 100, устанавливаем значение 100');
        limit = 100;
    }
    
    if (offset < 0) {
        console.warn('Offset не может быть отрицательным, устанавливаем значение 0');
        offset = 0;
    }

    const params = new URLSearchParams();
    if (startDate) {
        try {
            const date = new Date(startDate);
            if (isNaN(date.getTime())) {
                throw new Error('Неверный формат даты');
            }
            const formattedStartDate = date.toISOString().split('T')[0];
            params.append('start_date', formattedStartDate);
            console.log('Форматированная start_date:', formattedStartDate);
        } catch (error) {
            console.error('Ошибка при форматировании start_date:', error);
            throw new Error('Неверный формат start_date');
        }
    }

    if (endDate) {
        try {
            const date = new Date(endDate);
            if (isNaN(date.getTime())) {
                throw new Error('Неверный формат даты');
            }
            const formattedEndDate = date.toISOString().split('T')[0];
            params.append('end_date', formattedEndDate);
            console.log('Форматированная end_date:', formattedEndDate);
        } catch (error) {
            console.error('Ошибка при форматировании end_date:', error);
            throw new Error('Неверный формат end_date');
        }
    }

    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const url = `/api/v1/runs?${params}`;
    console.log('URL запроса:', url);
    console.log('Параметры запроса:', {
        startDate: params.get('start_date'),
        endDate: params.get('end_date'),
        limit: params.get('limit'),
        offset: params.get('offset')
    });

    try {
        const cookies = document.cookie.split(';');
        const accessTokenCookie = cookies.find(cookie => cookie.trim().startsWith('access_token='));
        
        if (!accessTokenCookie) {
            throw new Error('Access token не найден');
        }

        const accessToken = accessTokenCookie.split('=')[1].trim();
        console.log('Отправка запроса с заголовками:', {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + accessToken.substring(0, 10) + '...'
        });

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'X-Requested-Protocol': 'https'
            },
            mode: 'cors',
            credentials: 'same-origin',
            redirect: 'follow'
        });

        console.log('Получен ответ:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            url: response.url
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.log('Требуется обновление токена');
                const refreshResult = await refreshToken();
                if (!refreshResult.success) {
                    throw new Error('Не удалось обновить токен');
                }

                const newAccessTokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('access_token='));
                if (!newAccessTokenCookie) {
                    throw new Error('Новый access token не найден после обновления');
                }

                const newAccessToken = newAccessTokenCookie.split('=')[1].trim();
                console.log('Повторная отправка запроса с новым токеном');
                
                const retryResponse = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${newAccessToken}`
                    },
                    mode: 'cors',
                    credentials: 'same-origin'
                });

                console.log('Получен ответ после повторного запроса:', {
                    status: retryResponse.status,
                    statusText: retryResponse.statusText,
                    headers: Object.fromEntries(retryResponse.headers.entries())
                });

                if (!retryResponse.ok) {
                    const errorText = await retryResponse.text();
                    console.error('Ошибка ответа:', errorText);
                    throw new Error(`Ошибка получения пробежек после обновления токена: ${retryResponse.status}. ${errorText}`);
                }

                const data = await retryResponse.json();
                console.log('Получены данные после обновления токена:', data);
                console.groupEnd();
                return data;
            }
            const errorText = await response.text();
            console.error('Ошибка ответа:', errorText);
            throw new Error(`Ошибка получения пробежек: ${response.status}. ${errorText}`);
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

// Функция для получения ссылки на Telegram бота
async function getTelegramBotLink() {
    try {
        const response = await fetch(`${config.API_URL}/telegram/bot-link`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get Telegram bot link');
        }

        const data = await response.json();
        return { success: true, link: data.link };
    } catch (error) {
        console.error('Error getting Telegram bot link:', error);
        return { success: false, error: error.message };
    }
}

// Тестовая функция для прямого запроса к API
async function testDirectApiCall(startDate = null, endDate = null, limit = 50, offset = 0) {
    console.group('Тестовый прямой запрос к API');
    
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    // Прямой запрос к API
    const directUrl = `https://api.runconnect.app/api/v1/runs?${params}`;
    console.log('Прямой URL запроса:', directUrl);

    try {
        const cookies = document.cookie.split(';');
        const accessTokenCookie = cookies.find(cookie => cookie.trim().startsWith('access_token='));
        
        if (!accessTokenCookie) {
            throw new Error('Access token не найден');
        }

        const accessToken = accessTokenCookie.split('=')[1].trim();
        
        // Сначала делаем OPTIONS запрос
        const optionsResponse = await fetch(directUrl, {
            method: 'OPTIONS',
            headers: {
                'Accept': 'application/json',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'authorization,content-type',
                'Origin': window.location.origin
            },
            mode: 'cors'
        });

        console.log('OPTIONS ответ:', {
            status: optionsResponse.status,
            statusText: optionsResponse.statusText,
            headers: Object.fromEntries(optionsResponse.headers.entries())
        });

        // Затем делаем основной запрос
        const response = await fetch(directUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'Origin': window.location.origin
            },
            mode: 'cors'
        });

        console.log('Прямой ответ API:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            url: response.url
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Ошибка ответа:', errorText);
            throw new Error(`Ошибка прямого запроса: ${response.status}. ${errorText}`);
        }

        const data = await response.json();
        console.log('Данные от прямого запроса:', data);
        console.groupEnd();
        return data;
    } catch (error) {
        console.error('Ошибка при прямом запросе:', error);
        console.groupEnd();
        throw error;
    }
}

// Функция для тестирования через прокси Netlify
async function testNetlifyProxy(startDate = null, endDate = null, limit = 50, offset = 0) {
    console.group('Тестовый запрос через Netlify');
    
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    // Запрос через прокси Netlify
    const proxyUrl = `/api/v1/runs?${params}`;
    console.log('URL запроса через прокси:', proxyUrl);

    try {
        const cookies = document.cookie.split(';');
        const accessTokenCookie = cookies.find(cookie => cookie.trim().startsWith('access_token='));
        
        if (!accessTokenCookie) {
            throw new Error('Access token не найден');
        }

        const accessToken = accessTokenCookie.split('=')[1].trim();
        
        // Сначала делаем OPTIONS запрос
        const optionsResponse = await fetch(proxyUrl, {
            method: 'OPTIONS',
            headers: {
                'Accept': 'application/json',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'authorization,content-type,x-test-mode',
                'Origin': window.location.origin
            }
        });

        console.log('OPTIONS ответ через прокси:', {
            status: optionsResponse.status,
            statusText: optionsResponse.statusText,
            headers: Object.fromEntries(optionsResponse.headers.entries())
        });

        // Затем делаем основной запрос
        const response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'X-Test-Mode': 'true'
            }
        });

        console.log('Ответ через прокси:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            url: response.url
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Ошибка ответа через прокси:', errorText);
            throw new Error(`Ошибка запроса через прокси: ${response.status}. ${errorText}`);
        }

        const data = await response.json();
        console.log('Данные через прокси:', data);
        console.groupEnd();
        return data;
    } catch (error) {
        console.error('Ошибка при запросе через прокси:', error);
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
    delay,
    getTelegramBotLink,
    testDirectApiCall,
    testNetlifyProxy
};
