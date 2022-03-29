'use strict';

require('should');

const clientLib = require('../../lib/client.js');
const config = require('./config.js');

const credentials = config.readCredentials();
const client = clientLib.create(credentials);
const QUERY = 'from demo.ecommerce.data select eventdate,protocol,statusCode,method';
const options = {
  dateFrom: new Date(Date.now() - 60 * 1000),
  dateTo: new Date(),
  query: QUERY,
  format: 'json',
  destination: {
    type: 'donothing',
    params: {
      param0: '1',
    },
  },
};

describe('Tasks', () => {

  it('creates a new task and deletes it', () => {
    let currentTaskId;
    const first = client.query(options)
      .then(result => result.object.id);
    const second = first.then(taskId => {
      currentTaskId = taskId;
      return client.getTaskInfo(taskId);
    })
      .then(info => info.status.should.equal(0))
      .then(() => client.deleteTask(currentTaskId))
      .then(info => info.status.should.equal(0));
    return second.then(() => client.getTaskInfo(currentTaskId))
      .then(() => new Error('Task not deleted'))
      // when a task is deleted it should return an error
      .catch(() => 0);
  });

  it('looks for an invalid task', done => {
    client.getTaskInfo('pataticas')
      .then(() => done(new Error('Should reject invalid task')))
      .catch(() => done());
  });

  it('starts and stops a new task', () => {
    const first = client.query(options)
      .then(result => {
        result.status.should.equal(0);
        return result.object.id;
      });
    return first.then(taskId => client.getTaskInfo(taskId)
      .then(info => info.status.should.equal(0))
      .then(() => client.stopTask(taskId))
      .then(info => info.status.should.equal(101))
      .then(() => client.startTask(taskId))
      .then(info => info.status.should.equal(101))
      .then(() => client.getTaskInfo(taskId))
      .then(info => info.status.should.equal(0))
      .then(() => client.deleteTask(taskId))
      .then(info => info.status.should.equal(0))
    );
  });

  it('gets the list of tasks', () => {
    return client.getTasks()
      .then(result => result.object.length.should.not.equal(0));
  });
});

