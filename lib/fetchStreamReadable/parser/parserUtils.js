'use strict';

const DEFAULT_ERROR_MSG = 'Error Launching Query';

const isMetadata = (event) => event && event.metadata;
const isData = (event) => event && event.d;
const isProgress = (event) => event && event.p;
const isErrorFormat1 = (event) =>
  event && event.error && event.error.code && event.error.message;
const isErrorFormat2 = (event) =>
  event && (event.msg || event.error) && event.status;
const isErrorFormat3 = (event) =>
  event && event.e && Array.isArray(event.e) && event.e.length >= 2;
const isErrorFormat4 = (event) =>
  event && event.object && Array.isArray(event.object) && event.object.every(i => (typeof i === 'string'));


/**
 * See Format 1 in the javadoc for processErrorParsed
 * This functions transforms Format 1 to something
 * that will be easier to digest for processErrorParsed.
 * @param {Object} e Error Object
 */
function transformErrorFormat1(e, statusCode) {
  e.msg = e.error ? e.error.message : e.message;
  if(!e.status && statusCode) {
    e.status = statusCode;
  }
  else if(!e.status && e.error) {
    e.status = e.error.code;
  }
  e.object = [e.msg, `Error code ${e.status}`];
}

/**
 * See Format 3 in the javadoc for processErrorParsed
 * This functions transforms Format 3 to something
 * that will be easier to digest for processErrorParsed.
 * @param {Object} e
 */
function transformErrorFormat3(e) {
  e.status = e.e[0];
  e.object = ['', e.e[1]];
}

function transformErrorFormat4(e) {
  e.msg = e.object.join('. ');
}

const parseJson = (s) => {
  try {
    return JSON.parse(s);
  } catch (e) {
    return null;
  }
};

const parseBufferStringJson = (status, lastIndex, separator) => {
  try {
    return JSON.parse(
      '[' +
        status.bufferString.substring(0, lastIndex).replaceAll(separator, ',') +
        ']'
    );
  } catch (e) {
    return null;
  }
};

/**
 * Normalizes an en error response trying to use
 * the passed error properties.
 */
function createErrorResponse(error) {
  // in some cases error.object is present with 2 items
  // but error.object[0] is an empty string
  // so we add a default message
  if (!error.object[0]) error.object[0] = DEFAULT_ERROR_MSG;
  if (!error.object[1]) error.object[1] = '';
  error.msg = 'msg' in error ? error.msg : DEFAULT_ERROR_MSG;
  error.status = 'status' in error ? error.status : 500;
  error.timestamp = 'timestamp' in error ? error.timestamp : 0;
  error.cid = 'cid' in error ? error.cid : '';
}

function addToPending(cb, cbName, data) {
  if (cbName === 'processEvents') {
    cb.pendingData.push(data);
  } else {
    cb.pendingEvents.push(cb[cbName].bind(null, data));
  }
}

/**
 * Send passed event (and all pendingEvents events). Metadata is queued so
 * it will be sent with first data/progress event.
 * @param {object} callbacks callbacks
 */
function sendEvents(callbacks) {
  while (callbacks.pendingEvents.length > 0) {
    const callbackFunc = callbacks.pendingEvents.shift();
    callbackFunc();
  }
  if (callbacks.pendingData.length) {
    callbacks.processEvents(callbacks.pendingData);
    callbacks.pendingData = [];
  }
}

/**
 * Homogenize the error format from possible different error types
 * @param {Object} errorParsed json error object
 * @param {int} statusCode status code of initial http request.Can be undefined
 * @returns a homogenized error message
 */
const homogenizeErrorFormat = (errorParsed, statusCode) => {
  if (isErrorFormat3(errorParsed)) {
    // This is necessary if error is Format 3
    // See javadoc for transformErrorFormat3
    transformErrorFormat3(errorParsed);
  } else if (isErrorFormat1(errorParsed)) {
    // same for format 1
    transformErrorFormat1(errorParsed, statusCode);
  } else if (isErrorFormat4(errorParsed)) {
    transformErrorFormat4(errorParsed);
  }
  if (!errorParsed.status && statusCode) {
    errorParsed.status = statusCode;
  }
  // TODO: reduce with chaining operator when webpack its upgraded
  if (!errorParsed.msg && errorParsed.object && errorParsed.object.error && errorParsed.object.error[0]) {
    // statusCode can be passed from the initial http error response
    // in that case, we should use that statusCode
    errorParsed.msg = errorParsed.object.error[0];
  }

  if (!errorParsed.status && errorParsed.code) {
    // statusCode can be passed from the initial http error response
    // in that case, we should use that statusCode
    errorParsed.status = errorParsed.code;
  }
  if (!errorParsed.msg && typeof errorParsed.error === 'string') {
    errorParsed.msg = errorParsed.error;
  }

  if(!errorParsed.object) {
    errorParsed.object = ['', errorParsed.msg];
  }

};

module.exports = {
  addToPending,
  createErrorResponse,
  homogenizeErrorFormat,
  sendEvents,
  parseBufferStringJson,
  parseJson,
  isMetadata,
  isData,
  isProgress,
  isErrorFormat1,
  isErrorFormat2,
  isErrorFormat3,
  isErrorFormat4,
};
