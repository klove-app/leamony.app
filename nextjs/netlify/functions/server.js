const path = require('path');

exports.handler = async function(event, context) {
  // Получаем путь к standalone серверу
  const serverPath = path.join(__dirname, '../../.next/standalone/server.js');
  
  try {
    // Динамически импортируем сервер
    const server = require(serverPath);
    
    // Обрабатываем запрос
    const response = await server.default(event, context);
    
    return response;
  } catch (error) {
    console.error('Server error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
}; 