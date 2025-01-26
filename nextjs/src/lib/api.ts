const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface LoginResponse {
  success: boolean;
  user?: any;
  error?: string;
  details?: any;
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
    console.log('URL:', `${API_URL}/auth/register`);
    console.log('Body:', { ...requestBody, password: '***' });
    console.groupEnd();

    const response = await fetch(`${API_URL}/auth/register`, {
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

// Функция для входа
export async function login(username: string, password: string): Promise<LoginResponse> {
  try {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    console.group('Login Request');
    console.log('URL:', `${API_URL}/auth/login`);
    console.log('Body:', { username, password: '***' });
    console.groupEnd();

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: formData
    });

    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = null;
    }

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
  } catch (error: any) {
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
export async function refreshToken() {
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
    const response = await fetch(`${API_URL}/auth/refresh?${params}`, {
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
export async function logout() {
  try {
    const response = await fetch(`${API_URL}/auth/logout`, {
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
export async function checkAuth() {
  const response = await fetch(`${API_URL}/api/auth/check`, {
    credentials: 'include',
  });
  if (!response.ok) {
    return null;
  }
  return response.json();
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

  const url = `${API_URL}/runs/?${params}`;
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
      if (refreshResult.success) {
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