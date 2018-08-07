'use strict';

const home = require('os').homedir()

exports.readCredentials = function() {
  const env = {
    apiKey: process.env.DEVO_KEY,
    apiSecret: process.env.DEVO_SECRET,
    apiToken: process.env.DEVO_TOKEN,
    url: process.env.DEVO_URL,
  }
  try {
    const read = require(home + '/.devo.json')
    Object.keys(env).forEach(key => {
      if (env[key]) read[key] = env[key]
    })
    return read
  } catch(exception) {
    return env
  }
}

