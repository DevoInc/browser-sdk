'use strict';

const {
  createErrorResponse,
  addToPending,
  homogenizeErrorFormat,
  parseBufferStringJson,
  parseJson,
  isMetadata,
  isData,
  isProgress,
  isErrorFormat1,
  isErrorFormat2,
  isErrorFormat3,
  joinMsgsIfObjectHasStrings,
} = require('./parserUtils.js');

/**
 * States for a state machine. This is a normal sequence of states:
 *  NOT_STARTED
 *  METADATA: just read the metadata. This should be the first event
 *  EVENT: reading data or progress events. There can be many
 * If there is an error:
 *  ERROR_PARSED flags a known error, successfully parsed as JSON. Stop reading, this is a terminal state
 *  ERROR_UNPARSED flags an unknown error that we are not able to parse. Keep reading to try to complete the error
 * */
const STATES = {
  NOT_STARTED: 'NOT_STARTED',
  METADATA: 'METADATA',
  EVENT: 'EVENT',
  ERROR_UNPARSED: 'ERROR_UNPARSED',
  ERROR_PARSED: 'ERROR_PARSED',
};
// uncomment this to log stuff
const logger = () => null;//console.log;

/**
 * This function parses events (data, progress and errors)
 * See this link for more info about the response:
 * https://docs.devo.com/confluence/ndt/api-reference/rest-api/running-queries-with-the-rest-api
 */
function parse({ status, callbacks , isFirst = false, separator }) {
  logger(`browser-sdk :: chunkParser :: parse :: id = ${status.id}`);
  if ((isFirst || status.state == STATES.ERROR_UNPARSED) && !status.isOk) {
    // there has been an error in the initial http response
    processGenericError(status, callbacks);
    return;
  }

  const lastLineIndex = status.bufferString.lastIndexOf(separator);
  const lasLineIsComplete = lastLineIndex === status.bufferString.length;
  if(lastLineIndex >= 0){
    const lines = parseBufferStringJson(status, lastLineIndex, separator);
    if(!lasLineIsComplete){
      status.bufferString = status.bufferString.substring(lastLineIndex + 1);
    }else{
      status.bufferString = null;
      status.bufferString = '';
    }

    if(lines == null){
      processGenericError(status, callbacks);
      return;
    }

    while(lines.length > 0){
      try {
        const line = lines.shift();
        if (isData(line)) {
          addToPending(callbacks, 'processEvents', line.d);
          status.state = STATES.EVENT;
        } else if (isProgress(line)) {
          addToPending(callbacks, 'processProgress', line.p);
          status.state = STATES.EVENT;
        } else if (isMetadata(line)) {
          addToPending(callbacks, 'processMeta', line.metadata);
          status.state = STATES.METADATA;
        } else if (
          isErrorFormat1(line)
          || isErrorFormat2(line)
          || isErrorFormat3(line)
        ) {
          throw processErrorParsed(callbacks, status, line);
        } else {
          // this should never happen
          throw processGenericError(status, callbacks);
        }
      }
      catch (error) {
        if (error)  {
          joinMsgsIfObjectHasStrings(error);
          logger(`browser-sdk :: chunksParser :: parse :: id = ${status.id} :: errorParsed = ${status.state}:: errorMsg = ${error.msg} ::  bufferString = ${status.bufferString}`);
          const e = new Error();
          e.message = error.msg;
          throw e;
        }
      }
    }
  }
}

/**
 * Process a generic error. If it can be parsed as json, update the state
 *  to ERROR_PARSED. Otherwise, the state will be ERROR_UNPARSED.
 * @param {string} status request status object
 * @param {object} callbacks callbacks
 */
function processGenericError(status, callbacks) {

  const errorParsed = parseJson(status.bufferString);
  if (errorParsed != null) {
    // complete error detected and parsed. Will move to 'parsederror' state.
    // This is a terminal state and shouldn't process more text.
    return processErrorParsed(callbacks, status, errorParsed);
  } else {
    // partial error detected. Updated state to 'error' and keep reading
    status.state = STATES.ERROR_UNPARSED;
    return;
  }
}

/**
 * Process an already parsed error returned from malote.
 * The error can come from malote in different formats:
 *
 * Format 1: (happens when invalid credentials)
 "{
   "error":{
     "code":12,
     "message":"Invalid signature validation"
  }}"
 *
 * Format 2:
 "{
  "msg":"Error Launching Query",
  "status":500,
  "timestamp":1602063812256,
  "cid":"827858f34684",
  "object":[
    "Error Launching Query",
    "com.devo.malote.syntax.ParseException: Encountered \" <ID> \"aa"
  ]}"
 *
 * Format 3:
  "{"e":[500,"Error Processing Query: Error from
  server: malote.base.ExecutionException ... }"
 *
 *
 * Format 4:
  When pragma error is triggered the response looks like:
    {
      'm': {
        <field name 1>: {
          'type': <string>,
          'index': <integer>,
        },
        ...
      },
      'metadata': [
        {
          'name': <field name 1>,
          'type': <string>
        },
        ...
      ],
    }
    {
      'd': [ ],
      'p': [ ],
      'e': [
        <status code>,
        <error title>: <error description>
      ]
    }
  }
 * This function accepts a parsed json error, it calls the
 * error callback and updates request status object with a 'parsedError' state
 *
 * @param {object} callbacks callbacks object
 * @param {number} status request status object
 * @param {number} errorParsed json parsed object
 * that should have this format:
  {
    "status": 0,
    "cid": "ue7bt8PFMN",
    "timestamp": 1528308389081,
    "msg": "",
    "object": [,]
  }
 * It doesn't need to have all the fields.
 */
function processErrorParsed(callbacks, status, errorParsed) {

  homogenizeErrorFormat(errorParsed, status.statusCode);

  createErrorResponse(errorParsed);
  callbacks.processError(errorParsed);
  status.state = STATES.ERROR_PARSED;
  status.bufferString = JSON.stringify(errorParsed);
  return errorParsed;
}

module.exports = {
  parse,
  states: STATES
};
