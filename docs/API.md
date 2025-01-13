# API Documentation

## Аутентификация и авторизация

### Регистрация пользователя
```http
POST /auth/register
```

**Request Body:**
```json
{
    "email": "user@example.com",
    "password": "strongpassword",
    "telegram_id": "123456789"  // опционально
}
```

**Response:**
```json
{
    "user_id": "email_user@example.com",
    "email": "user@example.com",
    "auth_type": "email",
    "language": "ru",
    "created_at": "2024-01-13T12:00:00",
    "updated_at": "2024-01-13T12:00:00"
}
```

### Получение токена (вход)
```http
POST /auth/token
```

**Request Body (form-data):**
```
username: user@example.com
password: strongpassword
```

**Response:**
```json
{
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "bearer",
    "expires_in": 1800
}
```

### Получение профиля
```http
GET /auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
    "user_id": "email_user@example.com",
    "email": "user@example.com",
    "auth_type": "email",
    "last_login": "2024-01-13T12:00:00",
    "language": "ru",
    "timezone": "Europe/Moscow",
    "created_at": "2024-01-13T12:00:00",
    "updated_at": "2024-01-13T12:00:00"
}
```

### Выход из системы
```http
POST /auth/logout
Authorization: Bearer <token>
```

**Response:**
```json
{
    "message": "Успешный выход из системы"
}
```

### Обновление профиля
```http
PATCH /auth/profile
Authorization: Bearer <token>
```

**Request Body:**
```json
{
    "language": "en",
    "timezone": "UTC",
    "notification_settings": {
        "email_notifications": true,
        "telegram_notifications": true
    }
}
```

**Response:**
```json
{
    "user_id": "email_user@example.com",
    "email": "user@example.com",
    "language": "en",
    "timezone": "UTC",
    "notification_settings": {
        "email_notifications": true,
        "telegram_notifications": true
    },
    "updated_at": "2024-01-13T12:00:00"
}
```

### Смена пароля
```http
POST /auth/change-password
Authorization: Bearer <token>
```

**Request Body:**
```json
{
    "current_password": "oldpassword",
    "new_password": "newstrongpassword"
}
```

**Response:**
```json
{
    "message": "Пароль успешно изменен"
}
```

### Настройка уведомлений
```http
PUT /auth/notifications
Authorization: Bearer <token>
```

**Request Body:**
```json
{
    "email_notifications": true,
    "telegram_notifications": true,
    "notification_time": "18:00",
    "notification_timezone": "Europe/Moscow"
}
```

**Response:**
```json
{
    "email_notifications": true,
    "telegram_notifications": true,
    "notification_time": "18:00",
    "notification_timezone": "Europe/Moscow",
    "updated_at": "2024-01-13T12:00:00"
}
```

## Коды ошибок

- `400 Bad Request` - Неверные данные в запросе
- `401 Unauthorized` - Требуется аутентификация
- `403 Forbidden` - Доступ запрещен (аккаунт заблокирован)
- `404 Not Found` - Ресурс не найден
- `422 Unprocessable Entity` - Ошибка валидации данных

## Безопасность

### Аутентификация
- Используется JWT (JSON Web Tokens) для аутентификации
- Токены имеют срок действия 30 минут
- Все защищенные эндпоинты требуют заголовок `Authorization: Bearer <token>`

### Ограничения
- Минимальная длина пароля: 8 символов
- Блокировка аккаунта после 5 неудачных попыток входа
- Время блокировки: 30 минут

## Дополнительно

### CORS
API настроено для работы с cross-origin запросами. В продакшене необходимо настроить список разрешенных доменов.

### Формат дат
Все даты возвращаются в формате ISO 8601: `YYYY-MM-DDTHH:mm:ss` 