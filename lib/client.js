'use strict';

const helper = require('@devoinc/js-helper');
const download = require('./download.js');
const streamFetch = require('./fetchStreamReadable/fetchStreamReadable');
const fetchRequest = require('./fetchRequest.js');


/**
 * Devo client.
 */
class Client {

  /**
   * Create the client.
   * @param {Object} credentials User credentials.
   */
  constructor(credentials) {
    // Fix for Telefonica Firefox 60.8. replaceAll in firefox its supported in >77
    if(typeof String.prototype.replaceAll == 'undefined') {
      String.prototype.replaceAll = function(match, replace){
        return this.replace(new RegExp(match, 'g'), () => replace);
      };
    }
    this._config = helper.config.create(credentials);
    this._fetchRequest = fetchRequest.create();
  }

  /**
   * Send a query request to the API.
   *
   * @param {Object} options Configuration values.
   * @returns {Object} a promise with the resulting JSON.
   */
  query(options) {
    const opc = this._config.parseQuery(options);
    if (!helper.config.validate(opc)) {
      return Promise.reject('Invalid options');
    }
    return this._fetchRequest.post(opc).then(fetchRequest.parseResponse);
  }

  /**
   * Make a streaming query call to the API.
   *
   * @param {Object} options Configuration values.
   * @param {Object} callbacks An object with attributes for callbacks:
   *  - meta: Function to send headers.
   *  - data: Function to send each row of data.
   *  - error: Function to send any errors.
   *  - done: Function to call when call is finished.
   *  - progress: Function to call when a progress event is sent
   *  - abort: Function to call when query is aborted
   */
  streamFetch(options, callbacks) {
    const opc = this._config.parseQuery(options,
      options.format || 'json/simple/compact');
    const validOpc = validateOpc(opc, callbacks);
    return validOpc === true ?
      streamFetch.create(options).stream(opc, callbacks) : validOpc;
  }

  /**
   * Download a file from the API.
   * Helper function to make a query and send the result to the browser.
   *
   * @param {Object} options Configuration values including:
   * @returns {Object} A promise with the possible error.
   */
  download(options) {
    const opc = this._config.parseQuery(options);
    if (!helper.config.validate(opc)) {
      return Promise.reject('Invalid options');
    }
    return this._fetchRequest.post(opc)
      .then(response => response.blob())
      .then(download.sendFileToNav);
  }

  /**
   * Get the list of tasks.
   *
   * @returns {Object} A promise with the list.
   */
  getTasks() {
    return this._get(helper.taskPaths.getTasks());
  }

  /**
   * Get a list of tasks by type.
   *
   * @param {String} type Type of the desired tasks.
   * @returns {Object} A promise with the list.
   */
  getTasksByType(type) {
    return this._get(helper.taskPaths.getTasksByType(type));
  }

  /**
   * Get info for an existing task.
   *
   * @param {String} taskId ID of the task.
   * @returns {Object} A promise with the info.
   */
  getTaskInfo(taskId) {
    return this._get(helper.taskPaths.getTaskInfo(taskId));
  }

  /**
   * Start an existing task.
   *
   * @param {String} taskId ID of the task.
   * @returns {Object} A promise with the result.
   */
  startTask(taskId) {
    return this._get(helper.taskPaths.startTask(taskId));
  }

  /**
   * Stop an existing task.
   *
   * @param {String} taskId ID of the task.
   * @returns {Object} A promise with the result.
   */
  stopTask(taskId) {
    return this._get(helper.taskPaths.stopTask(taskId));
  }

  /**
   * Delete an existing task.
   *
   * @param {String} taskId ID of the task.
   * @returns {Object} A promise with the result.
   */
  deleteTask(taskId) {
    return this._get(helper.taskPaths.deleteTask(taskId));
  }

  /**
   * Get the structure of one table.
   *
   * @param {String} tableName Table.
   * @returns {Object} A promise with the result.
   */
  table(tableName) {
    return this._get(`/table/${tableName}`);
  }

  _get(path) {
    const opc = this._config.parseGet(path);
    return this._fetchRequest.get(opc).then(fetchRequest.parseResponse);
  }
}

exports.create = credentials => new Client(credentials);

const validateOpc = (opc, callbacks) => {
  if (!helper.config.validate(opc)) {
    // This case that covers unauthorized message
    if (!opc.headers['x-logtrust-apikey'] && !opc.headers.Authorization) {
      const error = {
        code: 403,
        message: 'Access not allowed',
        msg: 'Access not allowed',
        object: ['Access not allowed', 'Error code 403'],
        status: 403
      };
      const errorFormatted = streamFetch.formatError(error);
      return callbacks.error(errorFormatted);
    } else {
      return callbacks.error('Invalid options');
    }
  }
  return true;
};
