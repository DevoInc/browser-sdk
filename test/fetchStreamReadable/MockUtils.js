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
  while (buffer.length > 0) {
    const chunk = buffer.shift();
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
      if (this.buffer.length === 0){
        resolve({ done: true});
        return;
      }
      resolve(this.generator.next());
    });
  }

  releaseLock() {
  }
}



module.exports = {
  MockReader,
};
