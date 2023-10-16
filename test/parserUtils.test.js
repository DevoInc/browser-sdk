'use strict';

const should = require('should');
const forEach = require('mocha-each');

const { homogenizeErrorFormat,  createErrorResponse } = require('../lib/fetchStreamReadable/parser/parserUtils');

const errors = require('./fetchStreamReadable/mocks/errorsResponses.js')
describe('parser', () => {
  describe('parserUtils', () => {
    describe('homogenizeErrorFormat', () => {
      forEach(Object.keys(errors)).it('%s', (input) => {
        const element = errors[input];
        const parsedError = JSON.parse(element);
        homogenizeErrorFormat(parsedError, parsedError.status);
        should(parsedError).have.property('msg');
        should(parsedError).have.property('status');
        should(parsedError).have.property('source');
        createErrorResponse(parsedError);
        should(parsedError).have.property('msg');
        should(parsedError).have.property('status');
        should(parsedError).have.property('timestamp');
        should(parsedError).have.property('cid');
      });
    });
  });

});
