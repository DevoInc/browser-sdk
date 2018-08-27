'use strict';

require('should');
global.fetch = require('node-fetch');

const clientLib = require('../lib/client.js');
const config = require('./config.js');

const credentials = config.readCredentials()
const client = clientLib.create(credentials)
const QUERY = 'from demo.ecommerce.data select eventdate,protocol,statusCode,method'
const TABLE = 'demo.ecommerce.data'
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

  it('table schema (table exists)', () => {
    return client.table(TABLE)
      .then(result => result.object.should.be.an.object)
  })

  it('table schema (table doesn\'t exists)', (done) => {
    client.table('pataticas')
      .then(() => done('Table must not be exist'))
      .catch(() => done());
  })
});

