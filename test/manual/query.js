'use strict';

require('should');
global.fetch = require('node-fetch');

const clientLib = require('../../lib/client.js');
const config = require('./config.js');

const credentials = config.readCredentials()
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
    return client.query(options).then(result => {
      result.object.length.should.be.a.Number()
    })
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
    return client.query(options).then(result => {
      result.length.should.be.a.Number()
    })
  });

  it('sends query with skip and limit', () => {
    const options = {
      dateFrom: from,
      dateTo: to,
      query: QUERY,
      skip: 10,
      limit: 10,
    }
    return client.query(options)
      .then(result => {
        result.object.length.should.be.a.Number()
        result.object.length.should.be.below(11)
      })
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

  it('streams with invalid table', done => {
    const options = {
      dateFrom: from,
      dateTo: to,
      query: 'from asd123123 sel123123s aasdas123',
      skip: 0,
      limit: 100,
      format: 'json/compact',
    }
    client.stream(options, {
      meta: () => null,
      data: () => null,
      error: () => done(),
      done: () => done('Should throw error'),
    });
  })
});

