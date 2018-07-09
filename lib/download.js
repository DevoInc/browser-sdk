'use strict';

const DOWNLOAD_FILE_NAME = 'download';


/**
 * Generate an "a" element to send a new file download event to navigator
 * @param {Object} blob
 * @private
 */
exports.sendFileToNav = function(blob) {
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = DOWNLOAD_FILE_NAME + '-' + new Date().toISOString() + _getFileExt(blob.type);
  a.click();
}

/**
 * Return a file extension depending content type of content
 * @param {String} type
 * @returns {String}
 * @private
 */
function _getFileExt(type) {
  //console.log('type %s', type)
  switch (type) {
    case 'text/xlsx':
      return '.xlsx';
    case 'text/tab-separated-values':
      return '.tsv';
    case 'text/csv':
      return '.csv';
    case 'application/msgpack':
      return '.msgpack.json';
    case 'text/plain':
      return '.raw.txt';
    default :
      return '.json';
  }
}


