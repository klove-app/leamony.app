const API_BASE_URL = 'https://api.runconnect.app/api/v1';

interface LoginResponse {
  success: boolean;
  user?: any;
  error?: string;
}

// Генерация уникального ID запроса
function generateRequestId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function checkAuth(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: {
      'Authorization': `Bearer ${getCookie('access_token')}`,
      'Accept': 'application/json',
      'X-Request-ID': generateRequestId()
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Пробуем обновить токен
      const refreshed = await refreshToken();
      if (refreshed) {
        // Повторяем запрос с новым токеном
        return checkAuth();
      }
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to check auth');
  }

  return response.json();
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'X-Request-ID': generateRequestId()
    },
    body: formData
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data.detail || 'Failed to login'
    };
  }

  // Сохраняем токены
  setCookie('access_token', data.access_token, 1); // 1 день
  setCookie('refresh_token', data.refresh_token, 30); // 30 дней

  return {
    success: true,
    user: data.user
  };
}

export async function logout(): Promise<void> {
  // Удаляем токены
  deleteCookie('access_token');
  deleteCookie('refresh_token');
}

export async function refreshToken(): Promise<boolean> {
  const refresh_token = getCookie('refresh_token');
  if (!refresh_token) return false;

  try {
    const formData = new URLSearchParams();
    formData.append('refresh_token', refresh_token);

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'X-Request-ID': generateRequestId()
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    setCookie('access_token', data.access_token, 1);
    setCookie('refresh_token', data.refresh_token, 30);
    return true;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
}

// Вспомогательные функции для работы с куки
function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;secure;samesite=strict`;
}

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;secure;samesite=strict`;
}

export interface RegisterResponse {
  success: boolean;
  user?: any;
  error?: string;
  details?: any;
}

// Функция для регистрации
export async function register(
  username: string,
  email: string,
  password: string,
  yearly_goal: number = 0
): Promise<RegisterResponse> {
  try {
    const requestBody = {
      username,
      email,
      password,
      goal_km: Number(yearly_goal)
    };

    console.group('Registration Request');
    console.log('URL:', `${API_BASE_URL}/auth/register`);
    console.log('Body:', { ...requestBody, password: '***' });
    console.groupEnd();

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
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

    console.group('Registration Response');
    console.log('Status:', response.status);
    console.log('Data:', responseData);
    console.groupEnd();

    if (!response.ok) {
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
  } catch (error: any) {
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

// Получение списка пробежек
export async function getRuns(startDate: string, endDate: string, limit = 50, offset = 0) {
  console.group('Запрос пробежек');
  console.log('Параметры запроса:', { startDate, endDate, limit, offset });

  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    limit: limit.toString(),
    offset: offset.toString()
  });

  const url = `${API_BASE_URL}/runs/?${params}`;
  console.log('URL запроса:', url);

  try {
    // Получаем access_token из куки
    const cookies = document.cookie.split(';');
    const accessTokenCookie = cookies.find(cookie => cookie.trim().startsWith('access_token='));
    if (!accessTokenCookie) {
      console.log('Access token не найден в куки');
      throw new Error('Access token не найден');
    }
    const accessToken = accessTokenCookie.split('=')[1].trim();

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log('Статус ответа:', response.status, response.statusText);

    if (response.status === 401) {
      console.log('Требуется обновление токена');
      const refreshResult = await refreshToken();
      if (refreshResult) {
        return getRuns(startDate, endDate, limit, offset);
      }
      throw new Error('Failed to refresh token');
    }

    if (!response.ok) {
      throw new Error('Failed to fetch runs');
    }

    const data = await response.json();
    console.log('Получены данные о пробежках:', data);
    console.groupEnd();
    return data;
  } catch (error) {
    console.error('Error fetching runs:', error);
    console.groupEnd();
    throw error;
  }
} 