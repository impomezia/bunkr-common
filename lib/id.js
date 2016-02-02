'use strict';

const bs58  = require('bs58');
const uuid  = require('node-uuid');
const crc8  = require('crc').crc8;
const Int64 = require('node-int64');

const decode_cache = new Map();


/**
 * Encode number id into base58 encoded string with crc8.
 *
 * @param {Number} id
 * @returns {String}
 */
function encode(id) {
  id = +id;

  if (isNaN(id) || id <= 0) {
    throw new Error('id is not a number');
  }

  var buf;

  if (id > 4294967295) {
    buf = new Buffer(9);
    writeUInt64LE(buf, 1, id);
  }
  else {
    buf = new Buffer(5);
    buf.writeUInt32LE(id, 1);
  }

  buf.writeUInt8(crc8(buf.slice(1, buf.length)), 0);
  return bs58.encode(buf);


  function writeUInt64LE(buffer, offset, value) {
    var int64 = new Int64(value);
    for (var i = 8; i >= 0; i--) {
      buffer[offset + (8 - i) - 1] = int64.buffer[i];
    }
  }
}


/**
 * Decode string id into number id.
 * Return 0 if any error accident of input value if id already number.
 *
 * @param {String|Number} id
 * @returns {Number}
 */
function decode(id) {
  if (typeof id == 'number') {
    return id;
  }

  if (typeof id != 'string' || id.length > 13) {
    return 0;
  }

  let value = decode_cache.get(id);
  if (value) {
    return value;
  }

  let buf;

  try {
    buf = new Buffer(bs58.decode(id));
  }
  catch (e) {}

  if (!buf || buf.length < 5) {
    return isNaN(+id) ? 0 : +id;
  }

  if (buf.length < 9) {
    if (crc8(buf.slice(1, 5)) != buf.readUInt8(0)) {
      return 0;
    }

    value = buf.readUInt32LE(1);
    decode_cache.set(id, value);
    return value;
  }

  if (crc8(buf.slice(1, 9)) != buf.readUInt8(0)) {
    return 0;
  }

  return readUInt64LE(buf, 1);


  function readUInt64LE(buffer, offset) {
    value = new Int64(buffer.readUInt32LE(offset + 4), buffer.readUInt32LE(offset)).valueOf();
    decode_cache.set(id, value);
    return value;
  }
}


function encodeUUID(id) {
  var buf = new Buffer(17);
  uuid.parse(id, buf);
  buf.writeUInt8(crc8(buf.slice(0, 16)), 16);

  return bs58.encode(buf);
}


function decodeUUID(id) {
  if (typeof id !== 'string') {
    return false;
  }

  var buf;

  try {
    buf = new Buffer(bs58.decode(id));
  }
  catch (e) {
    return false;
  }

  if (buf.length < 17 || crc8(buf.slice(0, 16)) != buf.readUInt8(16)) {
    return false;
  }

  return uuid.unparse(buf.slice(0, 16));
}


module.exports.generate   = require('./shortid').generate;
module.exports.encode     = encode;
module.exports.decode     = decode;
module.exports.encodeUUID = encodeUUID;
module.exports.decodeUUID = decodeUUID;
