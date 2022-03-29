'use strict';

if (typeof ReadableStream === 'undefined') {
  const streams = require('web-streams-polyfill/ponyfill/es6');
  if (typeof window !== 'undefined') {
    // for Firefox 60-64
    window.ReadableStream = streams.ReadableStream;
  }
}