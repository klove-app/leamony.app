const path = require('path');

const handler = async (event, context) => {
  try {
    const { default: server } = await import('../../.next/standalone/server.js');
    const response = await server(event.path, event);
    
    return {
      statusCode: response.statusCode || 200,
      headers: response.headers || {},
      body: response.body || ''
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
    };
  }
}

exports.handler = handler; 