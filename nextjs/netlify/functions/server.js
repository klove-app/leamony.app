const { createRequestHandler } = require('@netlify/next');

const handler = createRequestHandler({
  compression: false,
});

exports.handler = handler; 