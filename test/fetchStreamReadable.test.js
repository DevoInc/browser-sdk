'use strict';

require('should');
const forEach = require('mocha-each');
const { spy, assert } = require('sinon');
const { JSDOM } = require('jsdom');
const { states } = require('../lib/fetchStreamReadable/parser/chunksParser');
const { processStream, processReader } = require('../lib/fetchStreamReadable/fetchStreamReadable');
const { MockReader } = require('./fetchStreamReadable/MockUtils.js');
const { performance } = require('perf_hooks');
global.performance = performance; // performance polyfill for node
this.processReader = processReader;

this.processStream = processStream.bind(this);

const {
  successfulAbbreviated,
  successfulComplete1,
} = require('./fetchStreamReadable/mocks/responses.js');

const {
  specificError1Response,
  invalidCredentialsErrorResponse } = require('./fetchStreamReadable/mocks/errorsResponses.js');

const separator = '\n';

const callbacks = {
  meta: spy(),
  data: spy(),
  progress: spy(),
  error: spy(),
  done: spy(),
  abort: spy(),
};

const outData = {};
function clearOut() {
  Object.keys(outData).forEach(key => delete outData[key]);
}
function appendOut(key, data, flat) {
  if (!outData[key]) outData[key] = [];
  if (flat && Array.isArray(data))
    data.forEach((d) => outData[key].push(d));
  else
    outData[key].push(data);
}

const callbacksWrap = {
  processMeta: (m) => { appendOut('m', m); callbacks.meta(); },
  processEvents: (d) => { appendOut('d', d, true); callbacks.data(); },
  processProgress: (p) => { appendOut('p', p); callbacks.progress() },
  processError: (e) => { appendOut('e', e); callbacks.error(); },
  processDone: callbacks.done,
  abort: callbacks.abort,
  pendingEvents: [],
  pendingData: [],
};

function extract(text, sep = separator) {
  const lines = text.split(sep);
  const result = {};
  const add = (key1, data, key2 = key1, takeobject) => {
    if (data[key2]) {
      if (!result[key1]) result[key1] = [];
      result[key1].push(takeobject ? data : data[key2]);
      return true;
    }
    return false;
  };
  lines.forEach((line) => {
    if (line.length === 0) return;
    const json = JSON.parse(line);
    add('m', json, 'metadata') || add('m', json);
    add('d', json);
    add('p', json);
    add('e', json, 'error', true);
    add('e', json, 'msg', true);
    add('e', json, 'e', true);
  });
  return result;
}

describe('fetchStreamReadable', () => {
  before(function () {
    global.window = new JSDOM('', { pretendToBeVisual: true }).window;
  });

  beforeEach(function () {
    Object.values(callbacks).forEach((fn) => fn.resetHistory());
  });

  forEach([
    [
      'successfully read abbreviated meta, events and progress',
      {
        bufferString: successfulAbbreviated,
        isOk: true,
        statusCode: 200,
        separator: '\n',
      },
      {
        callbacks: {
          meta: 1,
          data: 1,
          progress: 1,
          done: 1,
        },
        finalState: states.EVENT,
        out: extract(successfulAbbreviated),
      },
    ],
    [
      'successfully read meta, events and progress with 2 breakpoints',
      {
        bufferString: successfulComplete1,
        breakpoints: [20],
        isOk: true,
        statusCode: 200,
      },
      {
        callbacks: {
          meta: 1,
          data: 1, // 2 events, 1 call
          progress: 1,
          done: 1,
        },
        finalState: states.EVENT,
        out: extract(successfulComplete1),
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
        out: extract(specificError1Response),
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
        out: extract(invalidCredentialsErrorResponse),
      }
    ],
  ]).it('should %s', (message, input, expected, done) => {


    const {
      callbacks: callbacksExpected,
      finalState,
      out,
    } = expected;

    clearOut();

    this.controller = {
      abort : () => {
        this.signal.aborted = true
      },
      signal : {
        aborted : false,
      },
    };

    this.processStream(
      MockReader.of(input.bufferString, input.breakpoints),
      callbacksWrap,
      input.isOk,
      input.statusCode,
      input.separator || separator
    ).then((result) => {
      JSON.stringify(out).should.be.equal(JSON.stringify(outData));
      result.state.should.be.equal(finalState);
      Object.entries(callbacksExpected).forEach((entry) => {
        assert.callCount(callbacks[entry[0]], entry[1]);
      });
      done();
    });
  });
});
