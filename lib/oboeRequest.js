'use strict';

const oboe = require('oboe');

module.exports = {
  create: options => new OboeRequest(options),
  STREAMING_FORMAT: 'json/compact',
}


/**
 * Send a request to the Devo API server using the Oboe library.
 */
class OboeRequest {

  constructor(options) {
    this._columns = null;
    this._failed = false;
    this._msg = null;
    this._mapMetadata = options.mapMetadata === false ? false : true;
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
   */
  stream(options, callbacks) {
    this._request = oboe({
      method: options.method,
      withCredentials: true,
      url: options.url,
      headers: options.headers,
      body: JSON.stringify(options.body)
    })
    this._request.on('fail', error => callbacks.error(error.thrown || error))
    this._request.on('done', () => {
      if (this._done) return;
      this._done = true;
      if (this._failed) {
        callbacks.error && callbacks.error(this._msg);
      } else {
        callbacks.done && callbacks.done();
      }
    })
    this._request.node(this._getNodes(callbacks));

    return this;
  }

  /**
   * Abort an ongoing request.
   */
  abort() {
    this._request.abort();
    return this;
  }

  /**
   * Create the node configuration to manage all events types.
   *
   * @param {Object} callbacks An object with attributes for callbacks:
   *  - meta: receives headers.
   *  - data: receives each row of data.
   *  - error: receives any errors.
   *  - done: invoked after finishing parsing.
   * @returns an object that can be passed to oboe().node().
   * @private
   */
  _getNodes(callbacks) {
    return {
      '!.msg': msg => {
        this._msg = msg;
        return oboe.drop
      },
      '!.object.d[*]': data => {
        this._readRow(data, callbacks.data);
        return oboe.drop;
      },
      '!.object.m': meta => {
        this._readMeta(meta, callbacks.meta);
        return oboe.drop;
      },
      '!.e': error => {
        if (this._done) return oboe.drop;
        callbacks.error(error)
        this._done = true;
        return oboe.drop
      },
      '!.status': code => {
        if (code === 0 || code === 200) return;
        this._failed = true;
        return oboe.drop
      },
    };
  }
  /**
   * Read meta data.
   *
   * @param {Object} event Meta event.
   * @param {function(*)} callback Optional function to send the event.
   * @private
   */
  _readMeta(event, callback) {
    let _columns = [];
    let _event = Object.keys(event)[0]
    _columns.push(_event);
    this._columns = _columns;
    if (callback) {
      callback(event);
    }
    _columns = [];
    _event = null;
    return oboe.drop;
  }

  /**
   * Read a data event, return an object with a single row.
   */
  _readRow(event, callback) {
    const _event = JSON.stringify(event);
    let _columns = this._columns;
    if (this._mapMetadata === false) {
      callback(JSON.parse(_event));
      return oboe.drop;
    } else {
      const data = {};
      for (var i = _columns.length; i--;) {
        const key =_columns[i];
        const event = JSON.parse(_event)
        data[key] = event[i]
      }
      _columns = [];
      if (callback) {
        callback(data);
        return oboe.drop;
      }
    }
    return oboe.drop;
  }
}
