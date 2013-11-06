// Some useful utils

/**
 * Returns number of bytes required to pad buffer
 * @param  {Number}   length  Buffer length
 * @param  {Number}   step    Padding length
 * @return {Number}
 */
function pad(length, step) {
  return (step - length % step) % step;
}

/**
 * Repeats string given number of times
 * @param  {String}   str     String to repeat
 * @param  {Number}   times   Times to repeat
 * @return {String}
 */
function repeat(str, times) {
  return (new Array(times + 1)).join(str);
}

/**
 * Returns true if object is Array
 * @param  {Object}   obj     Object
 * @return {Boolean}
 */
function isArray(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
}

// String utils

/**
 * Retrieves byte at given position (considering each char is two bytes long)
 * @param  {Number}   index   Position within string, must be less than length * 2
 * @return {Number}
 */
String.prototype.byteAt = function(index) {
  var word = this.charCodeAt(index >>> 1);
  return isNaN(word) ? NaN : ((index & 1) ? (word >>> 8) : (word & 0xff));
}

var crc32data = [0x00000000, 0x77073096, 0xEE0E612C, 0x990951BA, 0x076DC419, 0x706AF48F, 0xE963A535, 0x9E6495A3, 0x0EDB8832, 0x79DCB8A4, 0xE0D5E91E, 0x97D2D988, 0x09B64C2B, 0x7EB17CBD, 0xE7B82D07, 0x90BF1D91, 0x1DB71064, 0x6AB020F2, 0xF3B97148, 0x84BE41DE, 0x1ADAD47D, 0x6DDDE4EB, 0xF4D4B551, 0x83D385C7, 0x136C9856, 0x646BA8C0, 0xFD62F97A, 0x8A65C9EC, 0x14015C4F, 0x63066CD9, 0xFA0F3D63, 0x8D080DF5, 0x3B6E20C8, 0x4C69105E, 0xD56041E4, 0xA2677172, 0x3C03E4D1, 0x4B04D447, 0xD20D85FD, 0xA50AB56B, 0x35B5A8FA, 0x42B2986C, 0xDBBBC9D6, 0xACBCF940, 0x32D86CE3, 0x45DF5C75, 0xDCD60DCF, 0xABD13D59, 0x26D930AC, 0x51DE003A, 0xC8D75180, 0xBFD06116, 0x21B4F4B5, 0x56B3C423, 0xCFBA9599, 0xB8BDA50F, 0x2802B89E, 0x5F058808, 0xC60CD9B2, 0xB10BE924, 0x2F6F7C87, 0x58684C11, 0xC1611DAB, 0xB6662D3D, 0x76DC4190, 0x01DB7106, 0x98D220BC, 0xEFD5102A, 0x71B18589, 0x06B6B51F, 0x9FBFE4A5, 0xE8B8D433, 0x7807C9A2, 0x0F00F934, 0x9609A88E, 0xE10E9818, 0x7F6A0DBB, 0x086D3D2D, 0x91646C97, 0xE6635C01, 0x6B6B51F4, 0x1C6C6162, 0x856530D8, 0xF262004E, 0x6C0695ED, 0x1B01A57B, 0x8208F4C1, 0xF50FC457, 0x65B0D9C6, 0x12B7E950, 0x8BBEB8EA, 0xFCB9887C, 0x62DD1DDF, 0x15DA2D49, 0x8CD37CF3, 0xFBD44C65, 0x4DB26158, 0x3AB551CE, 0xA3BC0074, 0xD4BB30E2, 0x4ADFA541, 0x3DD895D7, 0xA4D1C46D, 0xD3D6F4FB, 0x4369E96A, 0x346ED9FC, 0xAD678846, 0xDA60B8D0, 0x44042D73, 0x33031DE5, 0xAA0A4C5F, 0xDD0D7CC9, 0x5005713C, 0x270241AA, 0xBE0B1010, 0xC90C2086, 0x5768B525, 0x206F85B3, 0xB966D409, 0xCE61E49F, 0x5EDEF90E, 0x29D9C998, 0xB0D09822, 0xC7D7A8B4, 0x59B33D17, 0x2EB40D81, 0xB7BD5C3B, 0xC0BA6CAD, 0xEDB88320, 0x9ABFB3B6, 0x03B6E20C, 0x74B1D29A, 0xEAD54739, 0x9DD277AF, 0x04DB2615, 0x73DC1683, 0xE3630B12, 0x94643B84, 0x0D6D6A3E, 0x7A6A5AA8, 0xE40ECF0B, 0x9309FF9D, 0x0A00AE27, 0x7D079EB1, 0xF00F9344, 0x8708A3D2, 0x1E01F268, 0x6906C2FE, 0xF762575D, 0x806567CB, 0x196C3671, 0x6E6B06E7, 0xFED41B76, 0x89D32BE0, 0x10DA7A5A, 0x67DD4ACC, 0xF9B9DF6F, 0x8EBEEFF9, 0x17B7BE43, 0x60B08ED5, 0xD6D6A3E8, 0xA1D1937E, 0x38D8C2C4, 0x4FDFF252, 0xD1BB67F1, 0xA6BC5767, 0x3FB506DD, 0x48B2364B, 0xD80D2BDA, 0xAF0A1B4C, 0x36034AF6, 0x41047A60, 0xDF60EFC3, 0xA867DF55, 0x316E8EEF, 0x4669BE79, 0xCB61B38C, 0xBC66831A, 0x256FD2A0, 0x5268E236, 0xCC0C7795, 0xBB0B4703, 0x220216B9, 0x5505262F, 0xC5BA3BBE, 0xB2BD0B28, 0x2BB45A92, 0x5CB36A04, 0xC2D7FFA7, 0xB5D0CF31, 0x2CD99E8B, 0x5BDEAE1D, 0x9B64C2B0, 0xEC63F226, 0x756AA39C, 0x026D930A, 0x9C0906A9, 0xEB0E363F, 0x72076785, 0x05005713, 0x95BF4A82, 0xE2B87A14, 0x7BB12BAE, 0x0CB61B38, 0x92D28E9B, 0xE5D5BE0D, 0x7CDCEFB7, 0x0BDBDF21, 0x86D3D2D4, 0xF1D4E242, 0x68DDB3F8, 0x1FDA836E, 0x81BE16CD, 0xF6B9265B, 0x6FB077E1, 0x18B74777, 0x88085AE6, 0xFF0F6A70, 0x66063BCA, 0x11010B5C, 0x8F659EFF, 0xF862AE69, 0x616BFFD3, 0x166CCF45, 0xA00AE278, 0xD70DD2EE, 0x4E048354, 0x3903B3C2, 0xA7672661, 0xD06016F7, 0x4969474D, 0x3E6E77DB, 0xAED16A4A, 0xD9D65ADC, 0x40DF0B66, 0x37D83BF0, 0xA9BCAE53, 0xDEBB9EC5, 0x47B2CF7F, 0x30B5FFE9, 0xBDBDF21C, 0xCABAC28A, 0x53B39330, 0x24B4A3A6, 0xBAD03605, 0xCDD70693, 0x54DE5729, 0x23D967BF, 0xB3667A2E, 0xC4614AB8, 0x5D681B02, 0x2A6F2B94, 0xB40BBE37, 0xC30C8EA1, 0x5A05DF1B, 0x2D02EF8D];

/**
 * Computes CRC32 of string
 * @param  {Boolean} binary   Should this string be considered binary (each byte will be processed) or as regular string (only low byte of each character will be processed)
 * @return {Number}           CRC32 value
 */
String.prototype.crc32 = function(binary) {
  var crc = -1;
  for (var i = 0, n = this.length << (binary ? 1 : 0); i < n; i++) {
    crc = (crc >>> 8) ^ crc32data[(crc ^ (binary ? this.byteAt(i) : (this.charCodeAt(i) & 0xff))) & 0xff];
  }
  return crc ^ -1;
}

String.prototype.hexDump = function(binary) {
  var result = '';
  for (var i = 0, n = this.length << (binary ? 1 : 0); i < n; i++) {
    var char = (binary ? this.byteAt(i) : (this.charCodeAt(i) & 0xff)).toString(16);
    if (char.length < 2) {
      char = '0' + char;
    }
    if (i % 16 == 0) {
      result += (i > 0 ? '\n' : '') + repeat('0', 5 - i.toString(16).length) + i.toString(16) + '|';
    }
    result += ' ' + char;
    if (i % 4 == 3) {
      result += ' ';
    }
  }
  return result;
}

var base64data = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

String.prototype.toBase64 = function() {
  return this.toByteArray().toBase64();
}

String.fromBase64 = function(base64) {
  return String.fromByteArray(Array.fromBase64(base64));
}

Array.prototype.toBase64 = function() {
  var base64 = '';
  var byte1, byte2, byte3, enc1, enc2, enc3, enc4;
  var i = 0;

  while (i < this.length) {
    byte1 = this[i++];
    byte2 = this[i++];
    byte3 = this[i++];

    enc1 = byte1 >>> 2;
    enc2 = ((byte1 & 3) << 4) | (byte2 >>> 4);
    enc3 = ((byte2 & 15) << 2) | (byte3 >>> 6);
    enc4 = byte3 & 63;

    if (byte2 === undefined) {
      enc3 = enc4 = 64;
    } else if (byte3 === undefined) {
      enc4 = 64;
    }

    base64 += base64data.charAt(enc1) + base64data.charAt(enc2) + base64data.charAt(enc3) + base64data.charAt(enc4);
  }

  return base64;
}

Array.fromBase64 = function(base64) {
  var bytes = [];
  var byte1, byte2, byte3;
  var enc1, enc2, enc3, enc4;
  var i = 0;

  while (i < base64.length) {
    enc1 = base64data.indexOf(base64.charAt(i++));
    enc2 = base64data.indexOf(base64.charAt(i++));
    enc3 = base64data.indexOf(base64.charAt(i++));
    enc4 = base64data.indexOf(base64.charAt(i++));

    byte1 = (enc1 << 2) | (enc2 >>> 4);
    byte2 = ((enc2 & 15) << 4) | (enc3 >>> 2);
    byte3 = ((enc3 & 3) << 6) | enc4;

    bytes.push(byte1);
    if (enc3 != 64) {
      bytes.push(byte2);
    }
    if (enc4 != 64) {
      bytes.push(byte3);
    }
  }
  if ((bytes.length & 1) == 1) {
    bytes.push(0);
  }
  return bytes;
}

String.prototype.toByteArray = function() {
  var result = new Array(this.length << 1);
  for (var i = 0; i < result.length; i++) {
    result[i] = this.byteAt(i);
  }
  return result;
}

String.fromByteArray = function(bytes) {
  var result = '';
  for (var i = 0; i < bytes.length; i += 2) {
    result += String.fromCharCode(bytes[i] | (bytes[i + 1] << 8));
  }
  return result;
}

Array.prototype.equals = function(other, deep) {
  if (!isArray(other) || this.length != other.length) {
    return false;
  }

  for (var i = 0; i < this.length; i++) {
    if (deep && this[i].equals) {
      if (!this[i].equals(other[i])) {
        return false;
      }
    } else
    if (this[i] != other[i]) {
      return false;
    }
  }

  return true;
}


// Math/crypto utils

var TWO_LONG = goog.math.Long.fromNumber(2);
var FOUR_LONG = goog.math.Long.fromNumber(4);

goog.math.Long.prototype.sqrt = function() { // TODO: make better version
  return goog.math.Long.fromNumber(Math.sqrt(this.toNumber()));
}

goog.math.Long.prototype.isPerfectSquare = function() {
  var sq = this.sqrt();
  return sq.multiply(sq).equals(this);
}

goog.math.Long.prototype.gcd = function(x) {
  var y = this;
  while (!x.isZero() && !y.isZero()) {
    while (!x.isOdd()) {
      x = x.shiftRight(1);
    }
    while (!y.isOdd()) {
      y = y.shiftRight(1);
    }
    if (x.greaterThan(y)) {
      x = x.subtract(y);
    } else {
      y = y.subtract(x);
    }
  }
  return y.isZero() ? x : y;
}

goog.math.Long.fromByteArray = function(bytes) {
  var lo = 0;
  for (var i = bytes.length - 4; i < bytes.length; i++) {
    lo = (lo << 8) | bytes[i];
  }
  var hi = 0;
  for (var i = bytes.length - 8; i < bytes.length - 4; i++) {
    hi = (hi << 8) | bytes[i];
  }
  return new goog.math.Long(lo, hi);
}

goog.math.Long.prototype.toByteArray = function() {
  var result = [];
  var zeros = true;
  var hi = this.getHighBits();
  for (var i = 24; i >= 0; i -= 8) {
    var byte = (hi >>> i) & 0xff;
    if (byte || !zeros) {
      zeros = false;
      result.push(byte);
    }
  }
  var lo = this.getLowBits();
  for (var i = 24; i >= 0; i -= 8) {
    var byte = (lo >>> i) & 0xff;
    if (byte || !zeros) {
      zeros = false;
      result.push(byte);
    }
  }
  if (zeros) {
    result.push(0);
  }
  return result;
}

goog.math.Long.prototype.factor_ = function() {
  var g = goog.math.Long.ZERO;
  var it = 0;
  for (var i = 0; i < 3; i++) {
    var q = goog.math.Long.fromInt(((Math.random() * 128) & 15) + 17);
    var x = goog.math.Long.fromInt(Math.random() * 1000000000 + 1), y = x;
    var lim = 1 << (i + 18);
    for (var j = 1; j < lim; j++) {
      ++it;
      var a = x, b = x, c = q;
      while (!b.isZero()) {
        if (b.isOdd()) {
          c = c.add(a);
          if (c.greaterThan(this)) {
            c = c.subtract(this);
          }
        }
        a = a.add(a);
        if (a.greaterThan(this)) {
          a = a.subtract(this);
        }
        b = b.shiftRight(1);
      }
      x = c;
      var z = y.greaterThan(x) ? y.subtract(x) : x.subtract(y);
      g = this.gcd(z);
      if (!g.equals(goog.math.Long.ONE)) {
        break;
      }
      if ((j & (j - 1)) == 0) {
        y = x;
      }
    }
    if (!g.greaterThan(goog.math.Long.ONE)) {
      break;
    }
  }
  return g;
}

goog.math.Long.prototype.factor = function(tries) {
  if (this.isPerfectSquare()) {
    return this.sqrt();
  }

  var ITERATIONS_LIMIT = 300000;
  tries = tries|0;
  var TIME_LIMIT = (tries < 2) ? 400 : ((tries < 4) ? 800 : ((tries < 6) ? 1600 : ((tries < 7) ? 3500 : -1)));
  var time = (new Date()).getTime();

  var k = 1;
  var it = 0;

  while (true) {
    var n = this.multiply(goog.math.Long.fromInt(k));
    var sq = n.sqrt();
    var P0 = goog.math.Long.ZERO;
    var Q0 = goog.math.Long.ONE;
    var r0 = sq;
    var P1 = sq;
    var Q1 = n.subtract(r0.multiply(r0));
    var r1 = TWO_LONG.multiply(r0).div(Q1);

    while (!Q1.isPerfectSquare()) {
      it++;
      if (it > ITERATIONS_LIMIT) {
        return false;
      }
      if (TIME_LIMIT > -1 && ((it & 255) == 255) && ((new Date()).getTime() - time > TIME_LIMIT)) {
        return false;
      }

      var P2 = r1.multiply(Q1).subtract(P1);
      var Q2 = Q0.add(P1.subtract(P2).multiply(r1));
      var r2 = P2.add(sq).div(Q2);

      P0 = P1; P1 = P2; Q0 = Q1; Q1 = Q2; r1 = r2;
    }

    P0 = P1.negate();
    Q0 = Q1.sqrt();
    r0 = P0.add(sq).div(Q0);
    P1 = r0.multiply(Q0).subtract(P0);
    Q1 = n.subtract(P1.multiply(P1)).div(Q0);
    r1 = P1.add(sq).div(Q1);

    while (!P1.equals(P0)) {
      it++;
      if (it > ITERATIONS_LIMIT) {
        return false;
      }
      if (TIME_LIMIT > -1 && ((it & 255) == 255) && ((new Date()).getTime() - time > TIME_LIMIT)) {
        return false;
      }

      var P2 = r1.multiply(Q1).subtract(P1);
      var Q2 = Q0.add(P1.subtract(P2).multiply(r1));
      var r2 = P2.add(sq).div(Q2);

      P0 = P1; P1 = P2; Q0 = Q1; Q1 = Q2; r1 = r2;
    }

    var ans = this.gcd(Q0);

    if (!ans.equals(goog.math.Long.ONE) && !ans.equals(this)) {
      console.log('iterations: ' + it);
      return ans;
    }

    k++;
    if (k > 2) {
      return false;
    }
  }
}

/*goog.math.Integer.prototype.modPow = function(exp, mod) {
  if (exp.isZero()) {
    return goog.math.Integer.ZERO;
  } else
  if (exp.equals(goog.math.Integer.ONE)) {
    return this.modulo(mod);
  } else
  if (exp.isOdd()) {
    return this.multiply(this.multiply(this).modulo(mod).modPow(exp.subtract(goog.math.Integer.ONE).shiftRight(1), mod)).modulo(mod);
  } else {
    return this.multiply(this).modulo(pow).modPow(exp.shiftRight(1), mod).modulo(pow);
  }
}

goog.math.Integer.prototype.toBinaryString = function() {
  var result = '';
  for (var i = this.bits_.length - 1; i >= 0; i--) {
    result += String.fromCharCode(this.bits_[i] >> 16, this.bits_[i] & 0xffff);
  }
  return result;
}*/

CryptoJS.lib.WordArray.fromByteArray = function(bytes) {
  var words = [];
  for (var i = 0; i < bytes.length; i += 4) {
    words.push((bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]);
  }
  return new CryptoJS.lib.WordArray.init(words, bytes.length);
}

CryptoJS.lib.WordArray.toByteArray = function() {
  var bytes = [];
  for (var i = 0; i < this.sigBytes; i++) {
    bytes.push((this.words[i >>> 2] >>> (24 - ((i & 3) << 3))) & 0xff);
  }
  return bytes;
}

CryptoJS.lib.WordArray.slice = function(start, end) { // Warning: works only if start and end are dividable by 4 (TODO: fix)
  return new CryptoJS.lib.WordArray.init(this.words.slice(start >> 2, (end === undefined) ? undefined : (end >> 2)));
}

CryptoJS.mode.IGE = (function () {
  var IGE = CryptoJS.lib.BlockCipherMode.extend();

  IGE.Encryptor = IGE.extend({
    processBlock: function (words, offset) {
      // Shortcuts
      var cipher = this._cipher;
      var blockSize = cipher.blockSize;
      var iv = this._iv;

      if (iv) {
        this._x = iv.slice(0, blockSize);
        this._y = iv.slice(blockSize, blockSize * 2);

        this._iv = undefined;
      }

      var x = this._x;
      var y = this._y;

      this._y = words.slice(offset, offset + blockSize);

      for (var i = 0; i < blockSize; i++) {
        words[offset + i] ^= x[i];
      }

      cipher.encryptBlock(words, offset);

      for (var i = 0; i < blockSize; i++) {
        words[offset + i] ^= y[i];
      }

      this._x = words.slice(offset, offset + blockSize);
    }
  });

  IGE.Decryptor = IGE.extend({
    processBlock: function (words, offset) {
      // Shortcuts
      var cipher = this._cipher;
      var blockSize = cipher.blockSize;
      var iv = this._iv;

      if (iv) {
        this._x = iv.slice(0, blockSize);
        this._y = iv.slice(blockSize, blockSize * 2);

        this._iv = undefined;
      }

      var x = this._x;
      var y = this._y;

      this._x = words.slice(offset, offset + blockSize);

      for (var i = 0; i < blockSize; i++) {
        words[offset + i] ^= y[i];
      }

      cipher.decryptBlock(words, offset);

      for (var i = 0; i < blockSize; i++) {
        words[offset + i] ^= x[i];
      }

      this._y = words.slice(offset, offset + blockSize);
    }
  });

  return IGE;
}());

CryptoJS.pad.NoPadding = {
    pad: function () {
    },

    unpad: function () {
    }
};

function gzipInflate(bytes) {
  if (bytes.length < 18) {
    throw new Error('Unable to inflate GZipped data: buffer is too small');
  }
  if (bytes[0] != 0x1F || bytes[1] != 0x8B || bytes[2] != 0x08) {
    throw new Error('Unable to inflate GZipped data: invalid signature');
  }
  // TODO: handle flags
  return RawDeflate.inflate(bytes.slice(10, bytes.length - 8));
}
