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

  return (name === 'chrome' && majorVersion >= 43) ||
    (name === 'firefox' && majorVersion >= 65) ||
    (((name === 'edge-chromium') || (name === 'edge')) && majorVersion >= 14) ||
    (name === 'safari' && majorVersion >= 10.1) ||
    (name === 'opera' && majorVersion >= 30);
}

module.exports = {
  getFetchMethod,
  isNativeStreamFetchSupported,
  isBrowser
};
