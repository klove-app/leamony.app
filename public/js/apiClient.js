import config from './config.js';

class ApiClient {
    constructor() {
        this.baseUrl = config.API_URL;
    }

    async request(url, options = {}) {
        const token = document.cookie.split(';').find(cookie => cookie.trim().startsWith('access_token='));
        
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token.split('=')[1].trim()}`;
        }

        try {
            const response = await fetch(`${this.baseUrl}${url}`, {
                ...options,
                headers,
                credentials: 'include'
            });

            if (response.status === 401) {
                // Пробуем обновить токен
                const refreshed = await this.refreshToken();
                if (refreshed) {
                    // Повторяем оригинальный запрос
                    return this.request(url, options);
                }
                // Если не удалось обновить токен, перенаправляем на логин
                window.location.href = '/';
                return null;
            }

            if (response.status === 307) {
                // Получаем URL для редиректа
                const redirectUrl = response.headers.get('Location');
                if (redirectUrl) {
                    // Повторяем запрос к новому URL
                    const newUrl = redirectUrl.replace(this.baseUrl, '');
                    return this.request(newUrl, options);
                }
            }

            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async refreshToken() {
        const refreshTokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('refresh_token='));
        if (!refreshTokenCookie) return false;

        const refresh_token = refreshTokenCookie.split('=')[1].trim();

        try {
            const response = await fetch(`${this.baseUrl}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh_token }),
                credentials: 'include'
            });

            if (response.ok) {
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    // Вспомогательные методы для часто используемых запросов
    async getRuns(startDate = null, endDate = null, limit = 50, offset = 0) {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        params.append('limit', limit.toString());
        params.append('offset', offset.toString());

        return this.request(`/runs?${params}`);
    }

    async getUser() {
        return this.request('/users/me');
    }

    async login(username, password) {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        return this.request('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
        });
    }
}

export const apiClient = new ApiClient();
export default apiClient; 