# RunConnect API Documentation

## Оглавление
1. [Введение](#введение)
2. [Аутентификация](#аутентификация)
3. [Профиль пользователя](#профиль-пользователя)
4. [Тренировки](#тренировки)
5. [Тренировочные планы](#тренировочные-планы)
6. [Интеграция со Strava](#интеграция-со-strava)
7. [Челленджи](#челленджи)
8. [Клубы](#клубы)
9. [Обработка ошибок](#обработка-ошибок)
10. [Рекомендации по безопасности](#рекомендации-по-безопасности)

## Введение

RunConnect API - это RESTful API для взаимодействия с платформой RunConnect. API предоставляет доступ к функциональности для бегунов, включая управление тренировками, планами тренировок, участие в челленджах и клубах.

### Базовый URL
```
https://api.runconnect.app/api/v1
```

### Форматы данных
- Запросы: JSON или form-data
- Ответы: JSON

### Заголовки
```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

## Аутентификация

### Регистрация

**Endpoint:** `POST /auth/register`

**Request:**
```json
{
    "username": "new_user",
    "email": "user@example.com",
    "password": "StrongPass123"
}
```

**Response (201):**
```json
{
    "id": "uuid",
    "username": "new_user",
    "email": "user@example.com",
    "is_active": true
}
```

**Требования к паролю:**
- Минимум 8 символов
- Хотя бы одна заглавная буква
- Хотя бы одна строчная буква
- Хотя бы одна цифра

### Вход в систему

**Endpoint:** `POST /auth/login`

**Request (JSON):**
```json
{
    "username": "your_username",
    "password": "your_password"
}
```

**Request (form-data):**
```
username: your_username
password: your_password
```

**Response (200):**
```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer"
}
```

**Cookies:**
- access_token: Bearer <token>
- refresh_token: <token>

### Обновление токена

**Endpoint:** `POST /auth/refresh`

**Request:**
```json
{
    "refresh_token": "your_refresh_token"
}
```

**Response (200):**
```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer"
}
```

### Изменение пароля

**Endpoint:** `POST /auth/change-password`

**Request:**
```json
{
    "current_password": "old_password",
    "new_password": "new_strong_password"
}
```

**Response (200):**
```json
{
    "message": "Password successfully changed"
}
```

## Профиль пользователя

### Получение профиля

**Endpoint:** `GET /users/me`

**Response (200):**
```json
{
    "id": "uuid",
    "username": "user",
    "email": "user@example.com",
    "is_active": true,
    "yearly_goal": 1000,
    "yearly_progress": 450,
    "strava_connected": true,
    "strava_athlete_info": {
        "firstname": "John",
        "lastname": "Doe"
    }
}
```

### Обновление профиля

**Endpoint:** `PUT /users/me`

**Request:**
```json
{
    "email": "new.email@example.com",
    "yearly_goal": 2000
}
```

**Response (200):**
```json
{
    "id": "uuid",
    "username": "user",
    "email": "new.email@example.com",
    "yearly_goal": 2000,
    "yearly_progress": 450
}
```

## Тренировки

### Получение списка тренировок

**Endpoint:** `GET /runs`

**Query Parameters:**
- start_date: YYYY-MM-DD
- end_date: YYYY-MM-DD
- limit: int (default: 50, max: 100)
- offset: int (default: 0)

**Response (200):**
```json
[
    {
        "log_id": 1,
        "user_id": "uuid",
        "date_added": "2024-03-20",
        "distance_km": 10.5,
        "duration": 3600,
        "notes": "Morning run",
        "average_heartrate": 145,
        "splits": {
            "1": {"distance": 1.0, "pace": "5:30"},
            "2": {"distance": 1.0, "pace": "5:25"}
        }
    }
]
```

### Создание тренировки

**Endpoint:** `POST /runs`

**Request:**
```json
{
    "date_added": "2024-03-20",
    "distance_km": 10.5,
    "duration": 3600,
    "notes": "Morning run"
}
```

**Response (201):**
```json
{
    "log_id": 1,
    "user_id": "uuid",
    "date_added": "2024-03-20",
    "distance_km": 10.5,
    "duration": 3600,
    "notes": "Morning run"
}
```

## Тренировочные планы

### Генерация плана

**Endpoint:** `POST /ai/training-plan/generate`

**Request:**
```json
{
    "workout_history": [
        {
            "date": "2024-03-15",
            "distance": 5.5,
            "duration": 1800,
            "avg_pace": 5.45,
            "avg_heart_rate": 145
        }
    ],
    "athlete_context": {
        "current_level": "intermediate",
        "weekly_mileage": 40.0,
        "preferred_days": [1, 3, 5, 6],
        "goal_type": "marathon",
        "goal_date": "2024-05-01",
        "goal_time": "3:45:00"
    },
    "start_date": "2024-03-20",
    "end_date": "2024-04-03"
}
```

**Response (200):**
```json
{
    "status": "pending",
    "message": "Training plan generation started"
}
```

### Получение статуса генерации

**Endpoint:** `GET /ai/training-plan/status`

**Response (200):**
```json
{
    "status": "completed",
    "updated_at": "2024-03-20T10:00:00Z"
}
```

### Получение плана

**Endpoint:** `GET /training/users/me/plans/{plan_id}`

**Response (200):**
```json
{
    "id": "uuid",
    "start_date": "2024-03-20",
    "end_date": "2024-04-03",
    "status": "active",
    "current_week": 1,
    "summary": "2-недельный план подготовки к марафону",
    "weekly_structure": {
        "week_1": {
            "focus": "Развитие базовой выносливости",
            "total_distance": 45,
            "intensity_distribution": {
                "easy": "80%",
                "moderate": "15%",
                "hard": "5%"
            }
        }
    },
    "planned_workouts": [
        {
            "date": "2024-03-20",
            "type": "easy_run",
            "distance": 8,
            "duration_minutes": 48,
            "intensity": "low",
            "description": "Легкий восстановительный бег",
            "target_zones": {
                "heart_rate": "120-140",
                "pace": "6:00-6:30"
            }
        }
    ]
}
```

## Интеграция со Strava

### Получение URL для авторизации

**Endpoint:** `GET /strava/auth/url`

**Response (200):**
```json
{
    "auth_url": "https://www.strava.com/oauth/authorize?..."
}
```

### Подтверждение авторизации

**Endpoint:** `GET /strava/auth/callback`

**Query Parameters:**
- code: string (полученный от Strava)

**Response (200):**
```json
{
    "success": true,
    "athlete": {
        "firstname": "John",
        "lastname": "Doe"
    }
}
```

### Синхронизация тренировок

**Endpoint:** `POST /strava/sync`

**Request:**
```json
{
    "months": 6
}
```

**Response (200):**
```json
{
    "status": "success",
    "synced_activities": 25
}
```

## Челленджи

### Получение списка челленджей

**Endpoint:** `GET /challenges`

**Query Parameters:**
- status: active/completed/upcoming
- limit: int (default: 20)
- offset: int (default: 0)

**Response (200):**
```json
[
    {
        "id": 1,
        "title": "Марафонский челлендж",
        "description": "Пробегите марафон за месяц",
        "start_date": "2024-03-01",
        "end_date": "2024-03-31",
        "goal": 42.2,
        "participants_count": 150,
        "current_progress": 25.5
    }
]
```

### Создание челленджа

**Endpoint:** `POST /challenges`

**Request:**
```json
{
    "title": "Марафонский челлендж",
    "description": "Пробегите марафон за месяц",
    "start_date": "2024-04-01",
    "end_date": "2024-04-30",
    "goal": 42.2
}
```

**Response (201):**
```json
{
    "id": 1,
    "title": "Марафонский челлендж",
    "description": "Пробегите марафон за месяц",
    "start_date": "2024-04-01",
    "end_date": "2024-04-30",
    "goal": 42.2,
    "participants_count": 1
}
```

## Клубы

### Получение списка клубов

**Endpoint:** `GET /clubs`

**Query Parameters:**
- search: string
- limit: int (default: 20)
- offset: int (default: 0)

**Response (200):**
```json
[
    {
        "id": 1,
        "name": "Morning Runners",
        "description": "Клуб утренних пробежек",
        "members_count": 45,
        "created_at": "2024-01-01T00:00:00Z",
        "is_member": false
    }
]
```

### Создание клуба

**Endpoint:** `POST /clubs`

**Request:**
```json
{
    "name": "Morning Runners",
    "description": "Клуб утренних пробежек"
}
```

**Response (201):**
```json
{
    "id": 1,
    "name": "Morning Runners",
    "description": "Клуб утренних пробежек",
    "members_count": 1,
    "created_at": "2024-03-20T10:00:00Z",
    "is_member": true
}
```

## Обработка ошибок

API использует стандартные HTTP коды состояния:

- 200: Успешный запрос
- 201: Ресурс создан
- 400: Некорректный запрос
- 401: Требуется аутентификация
- 403: Доступ запрещен
- 404: Ресурс не найден
- 429: Слишком много запросов
- 500: Внутренняя ошибка сервера

Пример ошибки:
```json
{
    "detail": "Описание ошибки"
}
```

## Рекомендации по безопасности

1. Храните токены безопасно:
   - Используйте httpOnly cookies
   - Не храните токены в localStorage

2. Обновляйте токены:
   - Используйте refresh token для обновления access token
   - Обновляйте токены до их истечения

3. Защита от CSRF:
   - Используйте заголовок X-CSRF-Token для небезопасных методов
   - Проверяйте Origin и Referer заголовки

4. Ограничение запросов:
   - Соблюдайте ограничения на количество запросов
   - Используйте экспоненциальную задержку при повторных попытках

## Примеры использования

### JavaScript (fetch)

```javascript
// Логин
const login = async (username, password) => {
    const response = await fetch('https://api.runconnect.app/api/v1/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
    });
    return response.json();
};

// Получение профиля
const getProfile = async () => {
    const response = await fetch('https://api.runconnect.app/api/v1/users/me', {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include'
    });
    return response.json();
};

// Создание тренировки
const createWorkout = async (workoutData) => {
    const response = await fetch('https://api.runconnect.app/api/v1/runs', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(workoutData),
        credentials: 'include'
    });
    return response.json();
};
```

### Python (httpx)

```python
import httpx

class RunConnectClient:
    def __init__(self, base_url="https://api.runconnect.app/api/v1"):
        self.base_url = base_url
        self.client = httpx.AsyncClient()
        self.access_token = None
        
    async def login(self, username: str, password: str):
        response = await self.client.post(
            f"{self.base_url}/auth/login",
            json={"username": username, "password": password}
        )
        data = response.json()
        self.access_token = data["access_token"]
        return data
        
    async def get_profile(self):
        response = await self.client.get(
            f"{self.base_url}/users/me",
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        return response.json()
        
    async def create_workout(self, workout_data: dict):
        response = await self.client.post(
            f"{self.base_url}/runs",
            headers={"Authorization": f"Bearer {self.access_token}"},
            json=workout_data
        )
        return response.json()
```

### Typescript (axios)

```typescript
import axios from 'axios';

class RunConnectAPI {
    private baseURL = 'https://api.runconnect.app/api/v1';
    private accessToken: string | null = null;

    constructor() {
        axios.defaults.withCredentials = true;
    }

    async login(username: string, password: string) {
        const response = await axios.post(`${this.baseURL}/auth/login`, {
            username,
            password
        });
        this.accessToken = response.data.access_token;
        return response.data;
    }

    async getProfile() {
        const response = await axios.get(`${this.baseURL}/users/me`, {
            headers: {
                Authorization: `Bearer ${this.accessToken}`
            }
        });
        return response.data;
    }

    async createWorkout(workoutData: any) {
        const response = await axios.post(`${this.baseURL}/runs`, workoutData, {
            headers: {
                Authorization: `Bearer ${this.accessToken}`
            }
        });
        return response.data;
    }
}
``` 