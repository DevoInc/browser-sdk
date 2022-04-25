'use strict';

require('should');
const http = require('http');
global.fetch = require('node-fetch');

const clientLib = require('../lib/client.js');

const credentials = {
  url: 'http://127.0.0.1:3331/search',
  apiKey: 'key',
  apiSecret: 'secret',
};
const client = clientLib.create(credentials);
const QUERY = 'from demo.ecommerce.data select eventdate,protocol,statusCode,method';
const TABLE = 'demo.ecommerce.data';
const from = new Date(Date.now() - 60 * 1000);
const to = new Date();

function isObject(o) {
  return Object.getPrototypeOf(o) === isObject.OBJECTPROTO;
}
isObject.OBJECTPROTO = Object.getPrototypeOf({});

describe('Browser client', () => {

  it('sends simple query', async() => {
    const options = {
      dateFrom: from,
      dateTo: to,
      query: QUERY,
    };
    const server = new TestServer({contentType: 'json', response: {
      object: [1, 2],
    }});
    await server.start(3331);
    const result = await client.query(options);
    result.object.length.should.be.a.Number();
    (server.getError() === null).should.be.true();
    server.getUrl().should.equal('/search/query');
    server.stop();
  });

  it('downloads raw query', async() => {
    const options = {
      dateFrom: from,
      dateTo: to,
      query: QUERY,
      format: 'raw',
    };
    const server = new TestServer({contentType: 'text', response: 'pepito\n'});
    await server.start(3331);
    const result = await client.query(options);
    result.length.should.be.a.Number();
    server.stop();
  });


  it('table schema (table exists)', async () => {
    const object = [
      {
        fieldName: 'eventdate',
        type: 'timestamp'
      },
      {
        fieldName: 'clientIpAddress',
        type: 'ip4'
      }
    ];
    const server = new TestServer({
      contentType: 'json',
      response: {
        object,
      }
    });
    await server.start(3331);
    const result = await client.table(TABLE);
    const isEqual = JSON.stringify(result.object) === JSON.stringify(object);
    isEqual.should.be.exactly(true);
    server.stop();
  });


});

class TestServer {
  constructor(options) {
    this._socket = null;
    this._error = null;
    if (typeof options.response == 'object') {
      this._response = JSON.stringify(options.response);
    } else {
      this._response = options.response;
    }
    this._server = http.createServer(socket => {
      this._socket = socket;
      this._socket.on('error', error => this._storeError(error));
    });
    this._server.on('error', error => this._storeError(error));
    this._server.on('request', (request, response) => {
      this._url = request.url;
      response.setHeader('content-type', options.contentType || 'text');
      response.end(this._response);
    });
    this._server.unref();
  }

  getError() {
    return this._error;
  }

  getUrl() {
    return this._url;
  }

  start(port) {
    return new Promise(ok => this._server.listen(port, ok));
  }

  stop() {
    this._server.close();
  }

  _storeError(error) {
    console.error('Error %s', error);
    this._error = error;
  }
}

