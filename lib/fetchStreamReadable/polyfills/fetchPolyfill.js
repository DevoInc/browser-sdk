'use strict';
const { detect } = require('detect-browser');

const isBrowser = () => {
  return (typeof window !== 'undefined');
};

function getFetchMethod() {
  if (isBrowser()) {
    if (!isNativeStreamFetchSupported()) {
      return require('fetch-readablestream');
    }
    return window.fetch.bind(window);
  }
}

function isNativeStreamFetchSupported() {
  if (!isBrowser()) {
    return false;
  }
  const browser = detect();
  const { name, version } = browser;

  const majorVersion = parseInt(version.split('.')[0], 10);

  return (name === 'chrome' && majorVersion >= 42) ||
    (name === 'firefox' && majorVersion >= 65);
}

module.exports = {
  getFetchMethod,
  isNativeStreamFetchSupported,
  isBrowser
};