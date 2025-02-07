import { Run } from '@/types/run';
import { TrainingPlan } from '@/types/training-plan';
import { UserStats } from '@/types/user';

const API_BASE_URL = '/api/v1';

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

// Базовые заголовки для всех запросов
function getBaseHeaders(includeAuth: boolean = true): HeadersInit {
  const headers: HeadersInit = {
    'Accept': 'application/json',
    'X-Request-ID': generateRequestId()
  };

  if (includeAuth) {
    const token = getCookie('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

export async function checkAuth(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'GET',
    credentials: 'include',
    headers: getBaseHeaders()
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
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: getBaseHeaders(false),
      body: formData
    });

    if (!response.ok) {
      const data = await response.json();
      if (response.status === 401) {
        return {
          success: false,
          error: 'Неверное имя пользователя или пароль'
        };
      }
      return {
        success: false,
        error: data.detail || 'Ошибка входа'
      };
    }

    const data = await response.json();

    // Сохраняем токены
    if (data.access_token) {
      setCookie('access_token', data.access_token, 1);
    }
    if (data.refresh_token) {
      setCookie('refresh_token', data.refresh_token, 30);
    }

    return {
      success: true,
      user: data.user
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Произошла ошибка при попытке входа'
    };
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: getBaseHeaders()
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    deleteCookie('access_token');
    deleteCookie('refresh_token');
  }
}

export async function refreshToken(): Promise<boolean> {
  const refresh_token = getCookie('refresh_token');
  if (!refresh_token) return false;

  try {
    const formData = new FormData();
    formData.append('refresh_token', refresh_token);

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: getBaseHeaders(false),
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    if (data.access_token) {
      setCookie('access_token', data.access_token, 1);
    }
    if (data.refresh_token) {
      setCookie('refresh_token', data.refresh_token, 30);
    }
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
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;secure;samesite=lax;domain=.runconnect.app`;
}

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;secure;samesite=lax;domain=.runconnect.app`;
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
export async function getRuns(params?: {
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}): Promise<Run[]> {
  const searchParams = new URLSearchParams();
  if (params?.start_date) searchParams.append('start_date', params.start_date);
  if (params?.end_date) searchParams.append('end_date', params.end_date);
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.offset) searchParams.append('offset', params.offset.toString());

  const response = await fetch(`${API_BASE_URL}/runs?${searchParams}`, {
    headers: await getBaseHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch runs');
  }

  return response.json();
}

export async function getCurrentTrainingPlan(): Promise<{ status: string; plan?: TrainingPlan }> {
  const response = await fetch(`${API_BASE_URL}/training-plan/current`, {
    headers: await getBaseHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch current training plan');
  }

  return response.json();
}

export async function getUserStats(): Promise<UserStats> {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: await getBaseHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user stats');
  }

  return response.json();
} 