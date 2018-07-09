'use strict';

require('should');
global.fetch = require('node-fetch');

const home = require('os').homedir()
const clientLib = require('../lib/client.js');

const credentials = require(home + '/.devo.json')
const client = clientLib.create(credentials)
const QUERY = 'from demo.ecommerce.data select eventdate,protocol,statusCode,method'
const from = new Date(Date.now() - 60 * 1000)
const to = new Date()


describe('Browser client', () => {

  it('sends simple query', () => {
    const options = {
      dateFrom: from,
      dateTo: to,
      query: QUERY,
    }
    return client.query(options)
      .then(result => result.object.length.should.be.a.Number())
  });

  it('queries with invalid parameters', done => {
    const options = {
      dateFrom: 'patata',
      dateTo: to,
      query: QUERY,
    }
    client.query(options).then(() => done('Should reject invalid parameters'))
      .catch(() => done())
  });

  it('downloads raw query', () => {
    const options = {
      dateFrom: from,
      dateTo: to,
      query: QUERY,
      format: 'raw',
    }
    return client.query(options)
  });

  it('queries in streaming mode', done => {
    const options = {
      dateFrom: from,
      dateTo: to,
      query: QUERY,
    }
    client.stream(options, {
      meta: () => null,
      data: () => null,
      error: done,
      done: () => done(),
    });
  })
});

