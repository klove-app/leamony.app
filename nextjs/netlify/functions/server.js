const path = require('path');
const next = require('next');

const app = next({
  dev: false,
  conf: {
    distDir: '.next',
  },
});

const handle = app.getRequestHandler();

const handler = async (event, context) => {
  try {
    await app.prepare();
    
    const response = await handle(event, {
      req: {
        url: event.path,
        headers: event.headers,
        method: event.httpMethod,
        body: event.body,
      },
      res: {
        setHeader: () => {},
        write: () => {},
        end: () => {},
      },
    });
    
    return {
      statusCode: 200,
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