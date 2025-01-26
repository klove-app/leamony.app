const path = require('path');

const handler = async (event, context) => {
  try {
    const { default: server } = await import('../../.next/standalone/server.js');
    await server(event.path, event);
    return {
      statusCode: 200,
      body: 'OK'
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
}

exports.handler = handler; 