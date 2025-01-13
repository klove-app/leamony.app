# API Documentation

## Общая информация
- Base URL: `http://localhost:8080`
- Все запросы к защищенным эндпоинтам должны содержать заголовок `Authorization: Bearer {token}`
- Ответы возвращаются в формате JSON
- Даты передаются в формате ISO 8601

## Аутентификация

### Регистрация пользователя
```http
POST /auth/register
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "strongpassword123",
    "telegram_id": "123456789"  // опционально
}
```

### Получение токена
```http
POST /auth/token
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=strongpassword123
```

Ответ:
```json
{
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "bearer"
}
```

### Получение данных профиля
```http
GET /auth/me
Authorization: Bearer {token}
```

Ответ:
```json
{
    "id": 1,
    "email": "user@example.com",
    "telegram_id": "123456789",
    "created_at": "2024-01-13T12:00:00Z",
    "is_active": true
}
```

## Управление профилем

### Обновление профиля
```http
PATCH /auth/profile
Authorization: Bearer {token}
Content-Type: application/json

{
    "language": "ru",
    "timezone": "Europe/Moscow",
    "email_notifications": true,
    "telegram_notifications": true
}
```

### Смена пароля
```http
POST /auth/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
    "current_password": "oldpassword123",
    "new_password": "newpassword123"
}
```

### Настройка уведомлений
```http
PUT /auth/notifications
Authorization: Bearer {token}
Content-Type: application/json

{
    "email_notifications": true,
    "telegram_notifications": true,
    "notification_time": "09:00",
    "timezone": "Europe/Moscow"
}
```

## Коды ошибок

- `400 Bad Request` - Неверный формат запроса
- `401 Unauthorized` - Отсутствует или неверный токен
- `403 Forbidden` - Недостаточно прав
- `404 Not Found` - Ресурс не найден
- `422 Unprocessable Entity` - Ошибка валидации данных
- `429 Too Many Requests` - Превышен лимит попыток входа
- `500 Internal Server Error` - Внутренняя ошибка сервера

## CORS
API поддерживает CORS для следующих источников:
- `http://localhost:8080`
- `http://127.0.0.1:8080`

## Безопасность
- Все пароли хешируются с использованием bcrypt
- JWT токены имеют ограниченный срок действия
- Реализована защита от перебора паролей
- Поддерживается блокировка аккаунта после множества неудачных попыток входа

## Примечания
- Все даты возвращаются в UTC
- Размер JSON-ответов ограничен 10MB
- Rate limiting: 100 запросов в минуту 