'use strict';

require('should');
const forEach = require('mocha-each');
const { spy, assert } = require('sinon');
const { JSDOM } = require('jsdom');
const { states } = require('../../lib/fetchStreamReadable/parser/chunksParser');
const { processStream, processReader } = require('../../lib/fetchStreamReadable/fetchStreamReadable');
const { MockReader } = require('./MockUtils.js');
const { performance } = require('perf_hooks');
global.performance = performance; // performance polyfill for node
this.processReader = processReader;

this.processStream = processStream.bind(this);
const {
  successfulComplete1,
} = require('./mocks/responses.js');

const {
  specificError1Response,
  invalidCredentialsErrorResponse } = require('./mocks/errorsResponses.js');

const callbacks = {
  meta: spy(),
  data: spy(),
  progress: spy(),
  error: spy(),
  done: spy(),
  abort: spy(),
};

const callbacksWrap = {
  processMeta: callbacks.meta,
  processEvents: callbacks.data,
  processProgress: callbacks.progress,
  processError: callbacks.error,
  processDone: callbacks.done,
  abort: callbacks.abort,
  pendingEvents: [],
  pendingData: [],
};

describe('fetchStreamReadable', () => {
  before(function () {
    global.window = new JSDOM('', { pretendToBeVisual: true }).window;
  });

  beforeEach(function () {
    Object.values(callbacks).forEach((fn) => fn.resetHistory());
  });

  forEach([
    [
      'successfully read meta, events and progress with 2 breakpoints',
      {
        bufferString: successfulComplete1,
        breakpoints: [20, successfulComplete1.length],
        isOk: true,
        statusCode: 200,
      },
      {
        callbacks: {
          meta: 0,
          data: 0,
          progress: 0,
          done: 1,
        },
        finalState: states.NOT_STARTED,
        bufferString: '{"m":{"eventdate":{"type":"timestamp","index":0},"username":{"type":"str","index":1},"type":{"type":"str","index":2}},"metadata":[{"name":"eventdate","type":"timestamp"},{"name":"username","type":"str"},{"name":"type","type":"str"}]}\n{"p":[1601894800300]}\n{"d":[1601894807718,"fake@email.com","request"]}\n{"d":[1601894807720,"fake@email.com","response"]}\n'
      },
    ],
    [
      'get a specific error (format 3) with 2 breakpoints',
      {
        bufferString: specificError1Response,
        breakpoints: [20, 10000],
        isOk: false,
        statusCode: 500,
      },
      {
        callbacks: {
          meta: 0,
          data: 0,
          progress: 0,
          error: 1,
          done: 0
        },
        finalState: states.ERROR_PARSED,
        bufferString: specificError1Response.substring(0, specificError1Response.length - 1)
      }
    ],
    [
      'get a specific error from invalid credentials',
      {
        bufferString: invalidCredentialsErrorResponse,
        breakpoints: [200],
        isOk: false,
        statusCode: 500,
      },
      {
        callbacks: {
          meta: 0,
          data: 0,
          progress: 0,
          error: 1,
          done: 0
        },
        finalState: states.ERROR_PARSED,
        bufferString: invalidCredentialsErrorResponse.substring(0, invalidCredentialsErrorResponse.length - 1)
      }
    ],
  ]).it('should %s', (message, input, expected, done) => {


    const {
      callbacks: callbacksExpected,
      finalState,
      bufferString: expectedBufferString
    } = expected;

    this.processStream(
      MockReader.of(input.bufferString, input.breakpoints),
      callbacksWrap,
      input.isOk,
      input.statusCode,
      '\r\n'
    ).then((result) => {
      result.bufferString.should.be.equal(expectedBufferString);
      result.state.should.be.equal(finalState);
      Object.entries(callbacksExpected).forEach((entry) => {
        assert.callCount(callbacks[entry[0]], entry[1]);
      });
      done();
    });
  });
});
