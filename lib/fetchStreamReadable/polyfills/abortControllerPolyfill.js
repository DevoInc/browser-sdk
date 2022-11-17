'use strict';

if (typeof AbortController === 'undefined') {
  // this is mainly for nodejs
  require('abort-controller/polyfill');
}
