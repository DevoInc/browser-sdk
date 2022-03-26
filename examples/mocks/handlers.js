const { rest }= require('msw');
const { generateResponse } = require('./resolvers/generateResponses');
const handlers = [
    // Intercepts POST requests to serrea
    rest.post('*/search/query', generateResponse)
  ];

module.exports = {
    handlers
};