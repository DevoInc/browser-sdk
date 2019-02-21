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

  it('sends simple query', async() => {
    const options = {
      dateFrom: from,
      dateTo: to,
      query: QUERY,
    }
    const result = await client.query(options)
    result.object.length.should.be.a.Number()
  });

  it('queries with invalid parameters', async() => {
    const options = {
      dateFrom: 'patata',
      dateTo: to,
      query: QUERY,
    }
    await shouldFail(client.query(options))
  });

  it('downloads raw query', async() => {
    const options = {
      dateFrom: from,
      dateTo: to,
      query: QUERY,
      format: 'raw',
    }
    const result = await client.query(options)
    result.length.should.be.a.Number()
  });

  it('sends query with skip and limit', async() => {
    const options = {
      dateFrom: from,
      dateTo: to,
      query: QUERY,
      skip: 10,
      limit: 10,
    }
    const result = await client.query(options)
    result.object.length.should.be.a.Number()
    result.object.length.should.be.below(11)
  });

  it('queries in streaming mode', async() => {
    const options = {
      dateFrom: from,
      dateTo: to,
      query: QUERY,
    }
    await stream(options)
  })

  it('streams with invalid table', async() => {
    const options = {
      dateFrom: from,
      dateTo: to,
      query: 'from asd123123 sel123123s aasdas123',
      skip: 0,
      limit: 100,
      format: 'json/compact',
    }
    await shouldFail(stream(options))
  })
});

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

function shouldFail(promise) {
  return new Promise((ok, ko) => {
    promise.then(ko).catch(ok)
  })
}

