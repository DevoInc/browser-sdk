'use strict';

function str2ArrayBuffer(str) {
  const buf = new ArrayBuffer(str.length); // 2 bytes for each char
  const bufView = new Uint8Array(buf);
  let i = 0, strLen = str.length;
  for (; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function* bufferRead(buffer) {
  for (const chunk of buffer) {
    yield new Uint8Array(str2ArrayBuffer(chunk));
  }
}

/**
 * This class is used to mock a stream of data
 */
class MockReader {
  constructor(str, breakpoints = []) {
    let from = 0;
    this.buffer = breakpoints.map((to) => {
      const result = str.slice(from, to);
      from = to;
      return result;
    });
    this.buffer.push(str.substring(from));
    this.generator = bufferRead(this.buffer);
  }

  static of(...params) {
    return new MockReader(...params);
  }

  read() {
    return new Promise((resolve) => {
      resolve(this.generator.next());
    });
  }

  releaseLock() {
  }
}



module.exports = {
  MockReader,
};