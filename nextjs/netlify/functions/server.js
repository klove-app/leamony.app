const path = require('path');
const next = require('next');

const app = next({
  dev: false,
  dir: path.join(__dirname, '../../.next/standalone'),
  conf: { distDir: '.next' }
});

const handle = app.getRequestHandler();

const handler = async (event, context) => {
  try {
    await app.prepare();
    
    const response = await handle(event.path, event);
    
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