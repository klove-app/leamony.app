console.log('Инициализация конфигурации:', {
    env: window._env_,
    API_URL: window._env_?.API_URL || 'https://api.runconnect.app',
    WS_URL: (window._env_?.API_URL || 'https://api.runconnect.app').replace('http', 'ws') + '/ws',
    ENV: window._env_?.NODE_ENV || 'production'
});

const config = {
    API_URL: window._env_?.API_URL || 'https://api.runconnect.app',
    WS_URL: (window._env_?.API_URL || 'https://api.runconnect.app').replace('http', 'ws') + '/ws',
    ENV: window._env_?.NODE_ENV || 'production'
};

export default config; 