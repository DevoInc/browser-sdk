'use strict';

module.exports = {
  create: options => new FetchRequest(options),
  parseResponse,
};


/**
 * Send requests using fetch.
 */
class FetchRequest {

  /**
   * Make a POST API call using fetch.
   *
   * @param {Object} options Contains url, headers and body.
   * @returns {Object} A promise with either JSON or text.
   * HTTP status codes other than 2xx are returned as rejected promises.
   */
  post(options) {
    return fetch(options.url, {
      method: 'POST',
      credentials: 'include',
      mode: 'cors',
      headers: options.headers,
      body: JSON.stringify(options.body),
    }).then(this._status);
  }

  /**
   * Make a GET API call using fetch.
   *
   * @param {Object} options Contains url and headers.
   * @returns {Object} A promise with either JSON or text.
   * HTTP status codes other than 2xx are returned as rejected promises.
   */
  get(options) {
    return fetch(options.url, {
      method: 'GET',
      credentials: 'include',
      mode: 'cors',
      headers: options.headers,
    }).then(this._status);
  }

  /**
   * Validate ajax call status
   * @param {Object} response
   * @returns {Object}
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  _status(response) {
    if (response.status >= 200 && response.status < 300) {
      return response;
    } else {
      throw new Error(response.statusText);
    }
  }
}

function parseResponse(response) {
  const contentType = response.headers.get('content-type');
  if (contentType.indexOf('json') !== -1) {
    return response.json();
  }
  return response.text();
}

