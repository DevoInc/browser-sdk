/* eslint-disable no-await-in-loop */
'use strict';

const { parse, states } = require('./parser/chunksParser.js');

const { sendEvents } = require('./parser/parserUtils.js');

const {
  getFetchMethod,
  isNativeStreamFetchSupported,
  isBrowser,
} = require('./polyfills/fetchPolyfill');

require('./polyfills/readableStreamPolyfill.js');

require('./polyfills/abortControllerPolyfill');

let instances = 0;

module.exports = {
  create: (options) => new FetchStreamReadable(options),
  processStream,
  processReader,
  formatError
};

function buildHeaders(headers) {
  if (!isBrowser() || isNativeStreamFetchSupported()) {
    return headers;
  }

  const { Headers } = require('fetch-readablestream/lib/polyfill/Headers.js');
  const headersWrapped = new Headers();
  Object.entries(headers).forEach((entry) =>
    headersWrapped.append(entry[0], entry[1])
  );
  return headersWrapped;
}

/**
 * Send a request to the Devo API server.
 */
class FetchStreamReadable {
  constructor(options) {
    this.controller = new AbortController();
    this._mapMetadata = options.mapMetadata !== false;

    this.processStream = processStream.bind(this);
    this.processReader = processReader.bind(this);
  }

  /**
   * Make a streaming query to the Devo API.
   *
   * @param {Object} options An object with method, body and headers.
   * @param {Object} callbacks An object with attributes for callbacks:
   *  - meta: receives headers.
   *  - data: receives each row of data.
   *  - error: receives any errors.
   *  - done: optional, invoked after finishing parsing.
   *  - abort: optional, invoked after aborting a fetch request.
   */
  stream(options, callbacks) {
    const fetchMethod = getFetchMethod();
    const callbacksWrap = {
      processMeta: callback(callbacks.meta),
      processEvents: callback(callbacks.data),
      processProgress: callback(callbacks.progress),
      processError: callback(callbacks.error, formatError),
      processDone: callback(callbacks.done),
      abort: callback(callbacks.abort),
      pendingEvents: [],
      pendingData: [],
    };
    fetchMethod(options.url, {
      signal: this.controller.signal,
      method: options.method,
      withCredentials: true,
      headers: buildHeaders(options.headers),
      body: JSON.stringify(options.body),
    })
      .then(({ ok, status, body }) =>
        this.processStream(body.getReader(), callbacksWrap, ok, status,
          options.separator || '\r\n')
      )
      .catch((e) => callbacks.error(e.thrown || e))
      .finally(() => cleanPendingEvents(callbacks));
    return this;
  }

  /**
   * Abort an ongoing request.
   */
  abort() {
    if (!this.controller.signal.aborted) this.controller.abort();
    return this;
  }
}

function formatError(event) {
  return {
    body: JSON.stringify(event),
    jsonBody: event,
    statusCode: event.status,
    thrown: undefined,
  };
}

const measurePerformance = (measureName, markStart, markEnd) => {
  performance.mark(markEnd);
  // the endMark parameter can be ommited (in theory) but we need it now
  // because the node version in Jenkins (12.16.2 at this time) has a bug:
  // https://github.com/nodejs/node/issues/32647 that was fixed in (12.16.3)
  performance.measure(measureName, markStart, markEnd);
};

async function processStream(
  reader, callbacks, isOk, statusCode, separator = '\r\n') {
  const status = {
    bufferString: '',
    remains: '',
    state: states.NOT_STARTED,
    id: ++instances,
    isOk,
    statusCode,
  };
  const textDecoder = new TextDecoder('utf-8');

  performance.mark('b-sdk-start');
  await this.processReader(reader, status, callbacks, textDecoder, separator);
  measurePerformance('b-sdk-full', 'b-sdk-start', 'b-sdk-end');
  return status;
}

/**
 * Flags the end of processing if there is an error
 * @param {Object} status
 * @returns True if we should stop processing
 */
const isErrorParsed = (status) => {
  return status.state == states.ERROR_PARSED;
};

async function processReader(
  reader, status, callbacks, textDecoder, separator) {
  try {
    let isDone = false;
    let isFirst = true;
    do {
      let downloaded = '';
      let eolnFound = false;
      while (!isDone && !eolnFound) {
        let result = await reader.read();
        let decoded = textDecoder.decode(result.value);
        eolnFound = decoded.indexOf(separator) >= 0;
        downloaded+= decoded;
        isDone = result.done;
        result = null;
        decoded = null;
      }
      await parseChunk(
        isDone,
        downloaded,
        reader,
        isErrorParsed(status),
        status,
        callbacks,
        isFirst, // handle first chunk?
        separator
      );
      if ((callbacks.pendingData.length || callbacks.pendingEvents.length)
        && !this.controller.signal.aborted) {
        sendEvents(callbacks);
      }
      isFirst = false;
    } while (!isDone);
  } catch (e) {
    if (e.toString().includes('The user aborted a request.')) console.warn(e);
    else console.error('browser-sdk :: ', e);
  } finally {
    cleanPendingEvents(callbacks);
  }
}


async function parseChunk(
  done,
  value,
  reader,
  errorParsed,
  status,
  callbacks,
  isFirst,
  separator,
) {
  return new Promise((resolve, reject) => {
    const timerId = setTimeout(() => {
      // When no more data needs to be consumed
      // or terminal error, break the reading
      if (done || errorParsed) {
        measurePerformance('b-sdk-parsing', 'b-sdk-start', 'b-sdk-parsing-end');
        if (!errorParsed) {
          callbacks.processDone();
        }
        reader.releaseLock();
      } else {
        try {
          // console.table({bufferString: status.bufferString,
          //remains: status.remains, value: textDecoder.decode(value)});
          status.bufferString += value;
          parse({
            status,
            callbacks,
            isFirst,
            separator
          });
        } catch (error) {
          reject(error);
        } finally {
          clearTimeout(timerId);
        }
      }
      resolve();
    }, 0);
  });
}

/**
 * Callback call checker.
 *
 * @param {function(*)} callback Optional function to send the event.
 * @param formatter
 * @private
 */
function callback(cb, formatter = (x) => x) {
  return function (event) {
    if (cb) cb(formatter(event));
  };
}

/**
 * Cleans all pendingEvents that will not be sent due an error or abort;
 * @param {*} callbacks
 */
function cleanPendingEvents(callbacks) {
  if (callbacks) {
    if (callbacks.pendingData) callbacks.pendingData.length = 0;
    if (callbacks.pendingEvents) callbacks.pendingEvents.length = 0;
  }
}
