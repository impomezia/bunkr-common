'use strict';

const alphabet = "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
const base     = alphabet.length;
const bs58     = require('bs58');
const crc8     = require('crc').crc8;


/**
 * Generate random id with specified size.
 *
 * @param size
 * @returns {string}
 */
function generate(size) {
  size = size || 7;
  if (typeof size !== 'number' || size < 3) {
    size = 3;
  }

  let text = '';

  for (let i = 0; i < size - 2; i++ ) {
    text += alphabet.charAt(Math.floor(Math.random() * base));
  }

  return text + bs58.encode(crc8(text) + base);
}


exports.generate = generate;