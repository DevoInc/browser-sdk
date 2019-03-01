'use strict';

require('should');
const http = require('http');
global.fetch = require('node-fetch');

const clientLib = require('../lib/client.js');

const credentials = {
  url: 'http://127.0.0.1:3331/search',
  apiKey: 'key',
  apiSecret: 'secret',
}
const client = clientLib.create(credentials)
const QUERY = 'from demo.ecommerce.data select eventdate,protocol,statusCode,method'
const from = new Date(Date.now() - 60 * 1000)
const to = new Date()

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
    }
    const server = new TestServer({contentType: 'json', response: {
      object: [1, 2],
    }})
    await server.start(3331)
    const result = await client.query(options)
    result.object.length.should.be.a.Number()
    ;(server.getError() === null).should.be.true()
    server.getUrl().should.equal('/search/query')
    server.stop()
  });

  it('downloads raw query', async() => {
    const options = {
      dateFrom: from,
      dateTo: to,
      query: QUERY,
      format: 'raw',
    }
    const server = new TestServer({contentType: 'text', response: 'pepito\n'})
    await server.start(3331)
    const result = await client.query(options)
    result.length.should.be.a.Number()
    server.stop()
  });

  it('queries in streaming mode', async() => {
    const options = {
      dateFrom: from,
      dateTo: to,
      query: QUERY,
    }
    const server = new TestServer({contentType: 'json', response: {}})
    await server.start(3331)
    await stream(options)
    server.stop()
  })

  it('queries in streaming mode - event is an object', done => {
    const options = {
      dateFrom: from,
      dateTo: to,
      query: QUERY,
    }
    const server = new TestServer({contentType: 'json', response: {}})
    server.start(3331)
      .then(() => {
        const cli = client.stream(options, {
          meta: () => null,
          data: (d) => {
            isObject(d) ? done() : done(new Error('Data should be an object'));
            cli.abort();
            server.stop();
          },
          error: done
        });
      })
      .catch(done);
  })

  it('queries in streaming mode - event is an array', done => {
    const options = {
      dateFrom: from,
      dateTo: to,
      query: QUERY,
      mapMetadata: false,
    }

    const server = new TestServer({contentType: 'json', response: {}})
    server.start(3331)
      .then(() => {
        const cli = client.stream(options, {
          meta: () => null,
          data: (d) => {
            Array.isArray(d) ? done() : done(new Error('Data should be an array'));
            cli.abort();
          },
          error: done
      })
      .catch(done);
  })
});

class TestServer {
  constructor(options) {
    this._socket = null
    this._error = null
    if (typeof options.response == 'object') {
      this._response = JSON.stringify(options.response)
    } else {
      this._response = options.response
    }
    this._server = http.createServer(socket => {
      this._socket = socket;
      this._socket.on('error', error => this._storeError(error))
    })
    this._server.on('error', error => this._storeError(error))
    this._server.on('request', (request, response) => {
      this._url = request.url
      response.setHeader('content-type', options.contentType || 'text')
      response.end(this._response)
    })
    this._server.unref()
  }

  getError() {
    return this._error
  }

  getUrl() {
    return this._url
  }

  start(port) {
    return new Promise(ok => this._server.listen(port, ok))
  }

  stop() {
    this._server.close()
  }

  _storeError(error) {
    console.error('Error %s', error)
    this._error = error
  }
}

function stream(options) {
  return new Promise((ok, ko) => {
    client.stream(options, {
      meta: () => null,
      data: () => null,
      error: ko,
      done: ok,
    });
  })
}

