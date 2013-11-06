// Manages loading TL-schemes, encoding and decoding objects according to them
// Requires goog.math.Long from Google Closure Library (uses it to store longs) and some utils from utils.js
// Denis Olshin, 2013

// Uses UTF16 strings to store binary data. TODO: Replace with CryptoJS's WordArray (arrays of 4-byte ints)

(function(window, goog) {
  // Builtin primitive types

  var builtin = {
    // TODO: add double
    int: {
      fromBytes: function(buffer) {
        buffer.position = buffer.position || 0;
        if (buffer.position + 4 > buffer.length << 1) {
          throw new Error('Buffer underflow');
        }
        var data = buffer.charCodeAt(buffer.position >> 1) | (buffer.charCodeAt((buffer.position >> 1) + 1) << 16);
        buffer.position += 4;
        return data;
      },
      toBytes: function(data, isBoxed) {
        // TODO: append int constructor code if isBoxed = true
        return String.fromCharCode(data & 0xffff) + String.fromCharCode(data >> 16); // TODO: check, can be slow
      },
      length: function(data, isBoxed) {
        return isBoxed ? 8 : 4;
      }
    },
    long: {
      fromBytes: function(buffer) {
        return new goog.math.Long(builtin.int.fromBytes(buffer), builtin.int.fromBytes(buffer));
      },
      toBytes: function(data, isBoxed) {
        // TODO: append long constructor code if isBoxed = true
        return builtin.int.toBytes(data.getLowBits(), false) + builtin.int.toBytes(data.getHighBits(), false);
      },
      length: function(data, isBoxed) {
        return isBoxed ? 12 : 8;
      }
    },
    double: { // used code from JSPack
      fromBytes: function(buffer) {
        var s, e, m, i, d, nBits, mLen = 52, eLen = 11, eBias = 1023, eMax = 2047;

        i = 7; s = buffer.byteAt(buffer.position + i); i--; nBits = -7;
        for (e = s & ((1 << (-nBits)) - 1), s >>= (-nBits), nBits += eLen; nBits > 0; e = e * 256 + buffer.byteAt(buffer.position + i), i--, nBits-=8);
        for (m = e & ((1 << (-nBits)) - 1), e >>= (-nBits), nBits += mLen; nBits > 0; m = m * 256 + buffer.byteAt(buffer.position + i), i--, nBits-=8);
        buffer.position += 8;

        switch (e) {
          case 0:
            // Zero, or denormalized number
            e = 1 - eBias;
          break;
          case eMax:
            // NaN, or +/-Infinity
            return m ? NaN : ((s ? -1 : 1) * Infinity);
          default:
            // Normalized number
            m = m + Math.pow(2, mLen);
            e = e - eBias;
          break;
        }
        return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
      },
      toBytes: function(data, isBoxed) {
        var s, e, m, i, d, c, mLen = 52, eLen = 11, eBias = 1023, eMax = 2047;

        s = data < 0 ? 1 : 0;
        data = Math.abs(data);
        if (isNaN(data) || (data == Infinity)) {
          m = isNaN(data) ? 1 : 0;
          e = eMax;
        } else {
          e = Math.floor(Math.log(data) / Math.LN2);              // Calculate log2 of the value
          if (data * (c = Math.pow(2, -e)) < 1) { e--; c *= 2; }  // Math.log() isn't 100% reliable

          // Round by adding 1/2 the significand's LSD
          if (data * c >= 2) { e++; c /= 2; }                     // Rounding can increment the exponent

          if (e + eBias >= eMax) {
            // Overflow
            m = 0;
            e = eMax;
          } else if (e + eBias >= 1) {
            // Normalized - term order matters, as Math.pow(2, 52-e) and v*Math.pow(2, 52) can overflow
            m = (data * c - 1) * Math.pow(2, mLen);
            e = e + eBias;
          } else {
            // Denormalized - also catches the '0' case, somewhat by chance
            m = data * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
            e = 0;
          }
        }

        var a = new Array(8);
        for (i = 0; mLen >= 8; a[i] = m & 0xff, i++, m /= 256, mLen -= 8);
        for (e = (e << mLen) | m, eLen += mLen; eLen > 0; a[i] = e & 0xff, i++, e /= 256, eLen -= 8);
        a[i - 1] |= (s << 7);

        return String.fromByteArray(a);
      },
      length: function(data, isBoxed) {
        return isBoxed ? 12 : 8;
      }
    },
    int128: { // byte[16]
      fromBytes: function(buffer) {
        buffer.position = buffer.position || 0;
        if (buffer.position + 16 > buffer.length << 1) {
          throw new Error('Buffer underflow');
        }
        var data = [];
        for (var i = 0; i < 16; i++) {
          data.push(buffer.byteAt(buffer.position++));
        }
        return data;
      },
      toBytes: function(data, isBoxed) {
        // TODO: append int constructor code if isBoxed = true
        var result = '';
        for (var i = 0; i < data.length; i += 2) {
          result += String.fromCharCode(data[i] | (data[i + 1] << 8));
        }
        return result;
      },
      length: function(data, isBoxed) {
        return isBoxed ? 20 : 16;
      }
    },
    int256: { // byte[32]
      fromBytes: function(buffer) {
        buffer.position = buffer.position || 0;
        if (buffer.position + 32 > buffer.length << 1) {
          throw new Error('Buffer underflow');
        }
        var data = [];
        for (var i = 0; i < 32; i++) {
          data.push(buffer.byteAt(buffer.position++));
        }
        return data;
      },
      toBytes: function(data, isBoxed) {
        // TODO: append int constructor code if isBoxed = true
        var result = '';
        for (var i = 0; i < data.length; i += 2) {
          result += String.fromCharCode(data[i] | (data[i + 1] << 8));
        }
        return result;
      },
      length: function(data, isBoxed) {
        return isBoxed ? 36 : 32;
      }
    },
    bytes: {
      fromBytes: function(buffer) {
        buffer.position = buffer.position || 0;
        if (buffer.position + 4 > buffer.length << 1) {
          throw new Error('Buffer underflow');
        }

        var length = buffer.byteAt(buffer.position);
        var padLength = 0;
        if (length == 0xfe) {
          length = (buffer.charCodeAt((buffer.position >> 1) + 1) << 8) | buffer.byteAt(buffer.position + 1);
          padLength = pad(length, 4);
          buffer.position += 4;
        } else {
          padLength = pad(length + 1, 4);
          buffer.position++;
        }

        if (buffer.position + length + padLength > buffer.length << 1) {
          throw new Error('Buffer underflow');
        }

        var data = [];
        for (var i = 0; i < length; i++) {
          data.push(buffer.byteAt(buffer.position + i));
        }

        buffer.position += length + padLength;
        return data;
      },
      toBytes: function(data, isBoxed) {
        var result = '';
        var padLength = 0;
        var offset = 0;
        if (data.length >= 0xfe) {
          result += String.fromCharCode(0xfe | ((data.length & 0xff) << 8));
          result += String.fromCharCode(data.length >> 8);
          padLength = pad(data.length, 4);
        } else {
          result += String.fromCharCode(data.length | ((0 < data.length ? data[offset++] : 0) << 8));
          padLength = pad(data.length + 1, 4);
        }

        for (; offset < data.length; offset++) {
          result += String.fromCharCode(data[offset] | ((offset + 1 < data.length ? data[++offset] : 0) << 8));
        }

        return result + repeat('\u0000', padLength >> 1);
      },
      length: function(data, isBoxed) {
        return (isBoxed ? 4 : 0) + (data.length >= 0xfe) ? (4 + data.length + pad(data.length, 4)) : (1 + data.length + pad(data.length + 1, 4));
      }
    },
    string: { // bytes + convert array of utf-8 bytes to JS utf-16 String
      fromBytes: function(buffer) {
        var utf8 = builtin.bytes.fromBytes(buffer);

        var data = '';
        for (var i = 0; i < utf8.length; i++) { // decode utf8 to utf16
          var byte1 = utf8[i];
          if (byte1 < 0x80 || i + 1 >= utf8.length) {
            data += String.fromCharCode(byte1);
          } else if ((byte1 >= 0xC2 && byte1 < 0xE0) || i + 2 >= utf8.length) {
            var byte2 = utf8[++i];
            data += String.fromCharCode(((byte1 & 0x1F) << 6) + (byte2 & 0x3F));
          } else if ((byte1 >= 0xE0 && byte1 < 0xF0) || i + 3 >= utf8.length) {
            var byte2 = utf8[++i];
            var byte3 = utf8[++i];
            data += String.fromCharCode(((byte1 & 0xFF) << 12) + ((byte2 & 0x3F) << 6) + (byte3 & 0x3F));
          } else if (byte1 >= 0xF0 && byte1 < 0xF5) {
            var byte2 = utf8[++i];
            var byte3 = utf8[++i];
            var byte4 = utf8[++i];
            var codepoint = ((byte1 & 0x07) << 18) + ((byte2 & 0x3F) << 12)+ ((byte3 & 0x3F) << 6) + (byte4 & 0x3F);
            codepoint -= 0x10000;
            data += String.fromCharCode((codepoint >> 10) + 0xD800, (codepoint & 0x3FF) + 0xDC00);
          }
        }

        return data;
      },
      toBytes: function(data, isBoxed) {
        var utf16 = [];
        for (var i = 0, n = data.length; i < n; i++) { // encode utf16 to utf8
          var word = data.charCodeAt(i);
          if (word >= 0x0001 && word < 0x0080) {
            utf16.push(word);
          } else if (word > 0x07FF) {
            utf16.push(0xE0 | ((word >> 12) & 0x0F));
            utf16.push(0x80 | ((word >>  6) & 0x3F));
            utf16.push(0x80 | ((word >>  0) & 0x3F));
          } else {
            utf16.push(0xC0 | ((word >>  6) & 0x1F));
            utf16.push(0x80 | ((word >>  0) & 0x3F));
          }
        }

        return builtin.bytes.toBytes(utf16, isBoxed);
      },
      length: function(data, isBoxed) {
        return builtin.string.toBytes(data, isBoxed).length() << 1; // TODO: maybe rewrite
      }
    }
  };

  /**
   * Loads TL scheme
   * @constructor
   * @param {Object|Array|String} scheme  Parsed JSON, array of strings or \n-separated text
   */
  var TL = window.TL = function(scheme) {
    /**
     * Read TL object from string buffer
     * @param  {String}   buffer  Buffer
     * @return {TLObject}
     */
    var self = function(buffer) {
      if (buffer.position === undefined) {
        buffer = new String(buffer); // so we able to store position in it
        buffer.position = 0;
      }
      var id = builtin.int.fromBytes(buffer);
      var type = self[id] || TL[id];
      if (!type) {
        throw new Error('Unknown constructor: 0x' + id.toString(16) + ' at ' + ((buffer.position || 0) - 4));
      }
      return type.fromBytes.apply(null, [buffer].concat([].slice.call(arguments, 1)));
    }

    // Import builtin types

    for (var type in builtin) {
      self[type] = builtin[type];
    }
    Boolean.prototype.toBytes = function(isBoxed) { // pretty bad solution, TODO: fix
      var result = '';
      if (isBoxed) {
        result += builtin.int.toBytes(this ? -1720552011 : -1132882121);
      }
      return result;
    }
    self['boolFalse'] = self[-1132882121] = {
      fromBytes: function(buffer) {
        return false;
      }
    }
    self['boolTrue'] = self[-1720552011] = {
      fromBytes: function(buffer) {
        return true;
      }
    }
    self['vector'] = self[0x1cb5c415] = {
      fromBytes: function(buffer, type) {
        var count = builtin.int.fromBytes(buffer);

        var data = [];
        for (var i = 0; i < count; i++) {
          if (type[1].charAt(0).toUpperCase() == type[1].charAt(0)) {
            data.push(self.apply(null, [buffer].concat(type.slice(2))));
          } else if (type[0][type[1]]) {
            data.push(type[0][type[1]].fromBytes.apply(null, [buffer].concat(type.slice(2))));
          } else {
            throw new Error('Unknown type ' + type[1]);
          }
        }

        return data;
      },
      toBytes: function(data, isBoxed, type) {
        var result = '';
        if (isBoxed) {
          result += builtin.int.toBytes(0x1cb5c415);
        }
        for (var i = 0; i < data.length; i++) {
          if (type[1].charAt(0).toUpperCase() == type[1].charAt(0)) {
            if (isArray(data[i])) {
              result += self.vector.toBytes.apply(null, [data[i], true].concat(type.slice(2)));
            } else {
              result += data[i].toBytes.apply(data[i], [true].concat(type.slice(2)));
            }
          } else if (type[0][type[1]]) {
            result += type[0][type[1]].toBytes.apply(null, [data[i], false].concat(type.slice(2)));
          } else {
            throw new Error('Unknown type ' + type[1]);
          }
        }
        return result;
      },
      length: function(data, isBoxed, type) {
        return self.vector.toBytes(data, isBoxed, type).length() << 1; // TODO: maybe rewrite
      }
    }

    // Private functions

    /**
     * Returns container package and actual name for given type
     * @param  {String} path  Type path
     * @return {Array}        First element is parent package, second element is type name, all next next are type params (for now can be only 1 param for Vector)
     */
    var decodePath = function(path) {
      var parts = path.split('.');
      var namespace = self;
      for (var i = 0; i < parts.length - 1; i++) {
        if (!namespace[parts[i]]) {
          namespace[parts[i]] = {};
        }
        namespace = namespace[parts[i]];
      }
      parts = parts[parts.length - 1].replace(/[ <>(),]+/g, ' ').trim().split(' ');
      var info = [namespace, parts[0]];
      for (var i = 1; i < parts.length; i++) {
        info.push(decodePath(parts[i]));
      }
      return info;
    }

    /**
     * Adds a single constructor (or method) definition
     * @param  {Number|String}    id          Constructor id (for example, 0x60469778) or (if other parameters omitted) raw string containing definition
     * @param  {String}           predicate   Predicate (constructor name) or method name (for example, 'req_pq')
     * @param  {Array}            params      Array of objects with fields 'name' and 'type' defining each parameter
     * @param  {String}           type        Constructor's type name (for example, 'ReqPQ'), currently not used
     */
    var importConstructor = function(id, predicate, params, type) {
      if (arguments.length == 1) {
        var parts = id.split('=');
        type = parts[1].trim();
        parts = parts[0].split(' ');
        var name = parts[0].trim().split('#');

        predicate = name[0];
        id = parseInt(name[1], 16);
        params = [];

        for (var i = 1; i < parts.length; i++) {
          if (parts[i].length == 0) {
            continue;
          }

          var param = parts[i].split(':');
          if (param[1].toLowerCase() == 'vector') {
            param[1] += '<' + parts[++i] + '>';
          }

          params.push({ name: param[0], type: param[1] });
        }
      }

      var path = decodePath(predicate);
      var namespace = path[0], name = path[1];

      /**
       * Create an instance with current constructor, each param corresponds to param of constructor
       * @constructor
       * @return {TLObject}
       */
      var constr = TL[id|0] = self[id|0] = namespace[name] = function(args) {
        if (arguments.length == 1 && args.constructor == Object) {
          for (var name in args) {
            if (args.hasOwnProperty(name)) {
              this[name] = args[name];
            }
          }
        } else {
          if (params.length != arguments.length) {
            throw new Error('Invalid number of params passed in constructor "' + predicate + '": expected ' + params.length + ', given ' + arguments.length);
          }
          for (var i = 0; i < params.length; i++) {
            this[params[i].name] = arguments[i];
          }
        }
      }

      // Debug helpers
      constr.toString = function() {
        return predicate;
      }

      constr.prototype.toString = function() {
        var result = [predicate];
        for (var i = 0; i < params.length; i++) {
          if (this[params[i].name].constructor == String) {
            result.push(params[i].name + ':"' + this[params[i].name].toString() + '"');
          } else {
            result.push(params[i].name + ':' + this[params[i].name].toString());
          }
        }
        return '(' + result.join(' ') + ')';
      }

      /**
       * Create an instance by reading it from string buffer (not including id at start)
       * @param  {String}   buffer  Buffer
       * @return {TLObject}
       */
      constr.fromBytes = function(buffer) { // TODO: rewrite so decodePath will not be called at each call
        var result = {};
        for (var i = 0; i < params.length; i++) {
          var path = decodePath(params[i].type);
          if (path[1].charAt(0).toUpperCase() == path[1].charAt(0)) {
            result[params[i].name] = self.apply(null, [buffer].concat(path.slice(2)));
          } else if (path[0][path[1]]) {
            result[params[i].name] = path[0][path[1]].fromBytes.apply(null, [buffer].concat(path.slice(2)));
          } else {
            throw new Error('Unknown type ' + params[i].type);
          }
        }
        return new constr(result);
      }

      /**
       * Write an instance to string buffer
       * @param  {Boolean}  isBoxed   If this constructors id should be appended at start
       * @return {String}
       */
      constr.prototype.toBytes = function(isBoxed) { // TODO: rewrite so decodePath will not be called at each call
        var result = '';
        if (isBoxed) {
          result += builtin.int.toBytes(id);
        }
        for (var i = 0; i < params.length; i++) {
          var path = decodePath(params[i].type);
          if (path[1].charAt(0).toUpperCase() == path[1].charAt(0)) {
            if (isArray(this[params[i].name])) {
              result += self.vector.toBytes.apply(null, [this[params[i].name], true].concat(path.slice(2)));
            } else {
              result += this[params[i].name].toBytes.apply(this[params[i].name], [true].concat(path.slice(2)));
            }
          } else if (path[0][path[1]]) {
            result += path[0][path[1]].toBytes.apply(null, [this[params[i].name], false].concat(path.slice(2)));
          } else {
            throw new Error('Unknown type ' + params[i].type);
          }
        }
        return result;
      }
      constr.toBytes = function(data, isBoxed) {
        return constr.prototype.toBytes.call(data, isBoxed);
      }

      /**
       * Calculate number of bytes this instance will be taking after writing to buffer
       * @param  {Boolean}  isBoxed   If this constructors id should be appended at start (4 more bytes)
       * @return {Number}
       */
      constr.prototype.length = function(isBoxed) { // returns compressed length in bytes, isBoxed adds 4 bytes as signature
        var result = isBoxed ? 4 : 0;
        for (var i = 0; i < params.length; i++) {
          var path = decodePath(params[i].type);
          if (path[1].charAt(0).toUpperCase() == path[1].charAt(0)) {
            result += this[params[i].name].length(true);
          } else if (path[0][path[1]]) {
            result += path[0][path[1]].length(this[params[i].name], false);
          } else {
            throw new Error('Unknown type ' + params[i].type);
          }
        }
        return result;
      }
      constr.length = function(data, isBoxed) {
        return constr.prototype.length.call(data, isBoxed);
      }
    }

    if (typeof scheme == 'string') {
      scheme = scheme.split('\n');
    }

    if (isArray(scheme)) {
      var methods = false;
      for (var i = 0; i < scheme.length; i++) {
        var line = scheme[i];

        // Cut off single line comments (TODO: multiline)
        if (line.indexOf('//') > -1) {
          line = line.substr(0, line.indexOf('//'));
        }
        line = line.trim();

        if (line.length == 0) {
          continue;
        } else
        if (line == '---functions---') {
          methods = true;
          continue;
        } else {
          importConstructor(line);
        }
      }
    } else {
      for (var i = 0; i < scheme.constructors.length; i++) {
        var constructor = scheme.constructors[i];
        importConstructor(constructor.id, constructor.predicate, constructor.params, constructor.type);
      }
      for (var i = 0; i < scheme.methods.length; i++) {
        var method = scheme.methods[i];
        importConstructor(method.id, method.method, method.params, method.type);
      }
    }

    return self;
  }
})(window, goog);