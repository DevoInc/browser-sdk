const { setupWorker } = require('msw');
const { handlers } = require('./handlers');

// This configures a Service Worker with the given request handlers.
const worker = setupWorker(...handlers);

module.exports = {
    worker
};