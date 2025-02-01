console.log('Инициализация конфигурации:', {
    env: window._env_,
    API_URL: window._env_?.API_URL || 'https://api.runconnect.app/api/v1',
    WS_URL: (window._env_?.API_URL || 'https://api.runconnect.app/api/v1').replace('https', 'wss') + '/ws',
    ENV: window._env_?.NODE_ENV || 'production',
    ALLOW_INSECURE: true, // Временно разрешаем HTTP
    FOLLOW_REDIRECTS: true, // Разрешаем следовать редиректам
    MAX_RETRY_ATTEMPTS: 3 // Максимальное количество попыток при ошибках
});

const config = {
    API_URL: window._env_?.API_URL || 'https://api.runconnect.app/api/v1',
    WS_URL: (window._env_?.API_URL || 'https://api.runconnect.app/api/v1').replace('https', 'wss') + '/ws',
    ENV: window._env_?.NODE_ENV || 'production',
    ALLOW_INSECURE: true,
    FOLLOW_REDIRECTS: true,
    MAX_RETRY_ATTEMPTS: 3
};

export default config; 