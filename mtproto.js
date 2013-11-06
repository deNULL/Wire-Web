// Implementation of MTProto (Mobile Telecommunications Protocol)
// Requires tl.js, utils.js, goog.math.Long from Google Closure Library, sha1.js and aes.js from CryptoJS, and custom implementation of Transport class (see below)
// Denis Olshin, 2013

(function(window, goog) {
  // TODO: add TCP and HTTP transports
  // TODO: implement events instead of callbacks (multiple listeners on each event)

  var mt = window.mt;

  /**
   * Transport template, you need to implement similar class to manage low-level interaction (over TCP or HTTP)
   * @param {String}          host        Address of server to connect to
   * @param {Number}          port        Port to connect to
   * @param {Function()}      onConnect   Function to call when connection is established
   * @param {Function(data)}  onData      Function to call when new data is received
   * @param {Function()}      onClose     Function to call when connection is closed (by any reason)
   * @param {Function(error)} onError     Function to call when transport error happened
   */
  function DebugTransport(host, port, onConnect, onData, onClose, onError) {
    this.host = host;
    this.port = port;
    this.onConnect = onConnect;
    this.onData = onData;
    this.onClose = onClose;
    this.onError = onError;
    this.connected = true;

    console.log('DebugTransport(' + host + ':' + port + ') connected');
    onConnect();
  }
  /**
   * Send a message over the transport
   * @param  {String} data             Data
   * @param  {Function()} onComplete   Function to call when data successfully sent
   * @return {void}
   */
  DebugTransport.prototype.send = function(data, onComplete) {
    console.log('Sending ' + data.length * 2 + ' bytes to ' + this.host + ':' + this.port);
    onComplete();
  }
  /**
   * Close connection
   * @param  {Function()} onComplete   Function to call when connection closed (also onClose callback should be called)
   * @return {void}
   */
  DebugTransport.prototype.close = function(onComplete) {
    this.connected = false;

    console.log('Closing ' + this.host + ':' + this.port);
    onComplete();
    this.onClose();
  }

  /**
   * Server wrapper for Transport, stores auth data, manages encrypting/decrypting messages
   * @param {Class} Transport class
   */
  function Server(Transport, host, port, onConnect, onData, onClose, onError) {
    var server = this;
    this.transportClass = Transport;
    this.transport = new Transport(host, port, function() { // onConnect
      if (onConnect) {
        onConnect();
      }
    }, function(data) { // onData
      if (onData) {
        var messageData = server.decodeMessage(data);
        messageData.insignificant = !(messageData.seq_no & 1);
        if (!messageData.insignificant) {
          server.send(new mt.msgs_ack([messageData.message_id])); // TODO: queue acks instead of sending them immidiately
        }

        onData(messageData.payload);
      }
    }, function() { // onClose
      if (onClose) {
        onClose();
      }
    }, function(error) { // onError
      if (onError) {
        onError();
      }
    });
    this.authData = null;

    var stored;
    if (window.localStorage && (stored = window.localStorage[this.getStoragePath() + '.authData'])) {
      this.authData = JSON.parse(stored);
      this.authData.auth_key = CryptoJS.enc.Hex.parse(this.authData.auth_key);
    }
  }
  Server.prototype.decodeMessage = function(data) {
    if (data.length == 2) {
      var errorCode = data.charCodeAt(0) | (data.charCodeAt(1) << 16);
      throw new Error('Server sent transport error #' + -errorCode);
    }

    var messageData = {
      auth_key_id: data.substr(0, 4)
    }
    messageData.encrypted = (messageData.auth_key_id != '\u0000\u0000\u0000\u0000');
    if (messageData.encrypted) {
      if (!this.authData) {
        throw new Error('Unable to decrypt message: auth key is not yet generated');
      }

      if (messageData.auth_key_id != this.authData.auth_key_id) {
        throw new Error('Unable to decrypt message: unknown auth key');
      }

      var messageKey = CryptoJS.enc.Utf16LE.parse(data.substr(4, 8));

      var encryptedData = CryptoJS.enc.Utf16LE.parse(data.substr(12, data.length - 12));

      var x = 8;
      var authKey = this.authData.auth_key;
      var shaA = CryptoJS.SHA1(messageKey.clone().concat(authKey.slice(x, x + 32)));
      var shaB = CryptoJS.SHA1(authKey.slice(x + 32, x + 48).concat(messageKey).concat(authKey.slice(x + 48, x + 64)));
      var shaC = CryptoJS.SHA1(authKey.slice(x + 64, x + 96).concat(messageKey));
      var shaD = CryptoJS.SHA1(messageKey.clone().concat(authKey.slice(x + 96, x + 128)));

      var aesKey = shaA.slice(0, 8).concat(shaB.slice(8, 20)).concat(shaC.slice(4, 16));
      var aesIV = shaA.slice(8, 20).concat(shaB.slice(0, 8)).concat(shaC.slice(16, 20)).concat(shaD.slice(0, 8));

      var innerData = CryptoJS.AES.decrypt({ ciphertext: encryptedData }, aesKey, { iv: aesIV, mode: CryptoJS.mode.IGE, padding: CryptoJS.pad.NoPadding }).toString(CryptoJS.enc.Utf16LE);

      messageData.session_id = innerData.substr(4, 4);
      messageData.message_id = new goog.math.Long(innerData.charCodeAt(8) | (innerData.charCodeAt(9) << 16), innerData.charCodeAt(10) | (innerData.charCodeAt(11) << 16));
      messageData.seq_no = innerData.charCodeAt(12) | (innerData.charCodeAt(13) << 16);
      var length = innerData.charCodeAt(14) | (innerData.charCodeAt(15) << 16);
      messageData.payload = innerData.substr(16, length >> 1);
    } else {
      messageData.message_id = new goog.math.Long(data.charCodeAt(4) | (data.charCodeAt(5) << 16), data.charCodeAt(6) | (data.charCodeAt(7) << 16));
      var length = data.charCodeAt(8) | (data.charCodeAt(9) << 16);
      messageData.payload = data.substr(10, length >> 1);
    }
    return messageData;
  }
  Server.prototype.encodeMessage = function(messageData) {
    if (messageData.encrypted) {
      if (!this.authData) {
        throw new Error('Unable to encrypt message: auth key is not yet generated');
      }

      var innerData = CryptoJS.enc.Utf16LE.parse(
        this.authData.server_salt + messageData.session_id +
        String.fromCharCode(messageData.message_id.getLowBits() & 0xffff) + String.fromCharCode(messageData.message_id.getLowBits() >>> 16) +
        String.fromCharCode(messageData.message_id.getHighBits() & 0xffff) + String.fromCharCode(messageData.message_id.getHighBits() >>> 16) +
        String.fromCharCode(messageData.seq_no & 0xffff) + String.fromCharCode(messageData.seq_no >>> 16) +
        String.fromCharCode((messageData.payload.length << 1) & 0xffff) + String.fromCharCode((messageData.payload.length << 1) >>> 16) +
        messageData.payload
      );

      var messageKey = CryptoJS.SHA1(innerData).slice(4, 20);

      var x = 0;
      var authKey = this.authData.auth_key;
      var shaA = CryptoJS.SHA1(messageKey.clone().concat(authKey.slice(x, x + 32)));
      var shaB = CryptoJS.SHA1(authKey.slice(x + 32, x + 48).concat(messageKey).concat(authKey.slice(x + 48, x + 64)));
      var shaC = CryptoJS.SHA1(authKey.slice(x + 64, x + 96).concat(messageKey));
      var shaD = CryptoJS.SHA1(messageKey.clone().concat(authKey.slice(x + 96, x + 128)));

      var aesKey = shaA.slice(0, 8).concat(shaB.slice(8, 20)).concat(shaC.slice(4, 16));
      var aesIV = shaA.slice(8, 20).concat(shaB.slice(0, 8)).concat(shaC.slice(16, 20)).concat(shaD.slice(0, 8));

      innerData.concat(CryptoJS.lib.WordArray.random(pad(innerData.sigBytes, 16)));
      var encryptedData = CryptoJS.AES.encrypt(innerData, aesKey, { iv: aesIV, mode: CryptoJS.mode.IGE, padding: CryptoJS.pad.NoPadding });

      return this.authData.auth_key_id + messageKey.toString(CryptoJS.enc.Utf16LE) + encryptedData.ciphertext.toString(CryptoJS.enc.Utf16LE);
    } else {
      return '\u0000\u0000\u0000\u0000' +
              String.fromCharCode(messageData.message_id.getLowBits() & 0xffff) + String.fromCharCode(messageData.message_id.getLowBits() >>> 16) +
                String.fromCharCode(messageData.message_id.getHighBits() & 0xffff) + String.fromCharCode(messageData.message_id.getHighBits() >>> 16) +
              String.fromCharCode((messageData.payload.length << 1) & 0xffff) + String.fromCharCode((messageData.payload.length << 1) >>> 16) +
              messageData.payload;
    }
  }
  Server.prototype.reconnect = function(onComplete) {
    var server = this;
    var onConnect = server.transport.onConnect;
    server.transport.close(function() {
      server.transport = new server.transportClass(server.transport.host, server.transport.port, server.transport.onConnect, server.transport.onData, server.transport.onClose, server.transport.onError);
    });
  }

  Server.prototype.getStoragePath = function() {
    return 'mtproto.servers[' + this.transport.host + ':' + this.transport.port + ']';
  }

  /**
   * Perform auth
   * @param  {Function} onComplete    Callback
   * @return {Object}
   */
  Server.prototype.auth = function(onComplete, force, tries) {
    var server = this;

    if (!force && server.authData) {
      if (onComplete) {
        onComplete(server.authData);
      }
      return;
    }

    var _onComplete = server.transport.onData;
    var nonce = new Array(16);
    for (var i = 0; i < 16; i++) {
      nonce[i] = (Math.random() * 256) & 0xff;
    }
    server.send(new mt.req_pq(nonce));
    server.transport.onData = function(data) {
      var result = mt(server.decodeMessage(data).payload);

      var pq = goog.math.Long.fromByteArray(result.pq);
      var time = (new Date()).getTime();
      var p = pq.factor(tries);
      if (!p) { // sometimes factorisation fails (takes too long), but we can just request new pq). TODO: fix factorisation
        console.log('factorisation took ' + ((new Date()).getTime() - time) + 'ms, timelimit, restarting');
        server.transport.onData = _onComplete;
        server.reconnect(function() {
          server.auth(onComplete, force, tries|0 + 1);
        });
        return;
      }

      var q = pq.div(p);
      if (p.greaterThan(q)) {
        var tmp = q;
        q = p;
        p = tmp;
      }
      console.log(pq + ' = ' + p + ' x ' + q);
      console.log('factorisation time: ' + ((new Date()).getTime() - time) + 'ms');
      ge('debug').innerHTML = 'factorisation time: ' + ((new Date()).getTime() - time) + 'ms';

      if (!result.nonce.equals(nonce)) {
        throw new Error('Server sent invalid nonce');
      }

      var new_nonce = new Array(32);
      for (var i = 0; i < 32; i++) {
        new_nonce[i] = (Math.random() * 256) & 0xff;
      }

      var server_nonce = result.server_nonce;

      var innerData = CryptoJS.enc.Utf16LE.parse((new mt.p_q_inner_data(result.pq, p.toByteArray(), q.toByteArray(), nonce, server_nonce, new_nonce)).toBytes(true));
      innerData = CryptoJS.SHA1(innerData).concat(innerData);
      innerData.concat(CryptoJS.lib.WordArray.random(255 - innerData.sigBytes));

      console.log(innerData.toString());

      // Unfortunately, goog.math.Integer is not really suitable for big integers (division is VERY slow), so I'm using BigInt library by Leemon Baird instead
      var rsaMessage = str2bigInt(innerData.toString(CryptoJS.enc.Hex), 16, 0);
      var rsaModulus = str2bigInt('0C150023E2F70DB7985DED064759CFECF0AF328E69A41DAF4D6F01B538135A6F91F8F8B2A0EC9BA9720CE352EFCF6C5680FFC424BD634864902DE0B4BD6D49F4E580230E3AE97D95C8B19442B3C0A10D8F5633FECEDD6926A7F6DAB0DDB7D457F9EA81B8465FCD6FFFEED114011DF91C059CAEDAF97625F6C96ECC74725556934EF781D866B34F011FCE4D835A090196E9A5F0E4449AF7EB697DDB9076494CA5F81104A305B6DD27665722C46B60E5DF680FB16B210607EF217652E60236C255F6A28315F4083A96791D7214BF64C1DF4FD0DB1944FB26A2A57031B32EEE64AD15A8BA68885CDE74A5BFC920F6ABF59BA5C75506373E7130F9042DA922179251F', 16, 0);
      var rsaExponent = str2bigInt('010001', 16, 0);

      var rsaResult = bigInt2str(powMod(rsaMessage, rsaExponent, rsaModulus), 16);
      rsaResult = repeat('0', 512 - rsaResult.length) + rsaResult;

      var encryptedData = [];
      for (var i = 0; i < rsaResult.length; i += 2) {
        encryptedData.push(parseInt(rsaResult.charAt(i) + rsaResult.charAt(i + 1), 16));
      }

      server.send(new mt.req_DH_params(nonce, server_nonce, p.toByteArray(), q.toByteArray(), result.server_public_key_fingerprints[0], encryptedData));
      var requestTime = (new Date()).getTime(); // store both send & receive time to get better approximation for time diff
      server.transport.onData = function(data) {
        var responseTime = (new Date()).getTime();
        var result = mt(server.decodeMessage(data).payload);

        if (!result.nonce.equals(nonce)) {
          throw new Error('Server sent invalid nonce');
        }

        if (!result.server_nonce.equals(server_nonce)) {
          throw new Error('Server sent invalid server_nonce');
        }

        if (result.constructor == mt.server_DH_params_ok) {
          var shaNewServer = CryptoJS.SHA1(CryptoJS.lib.WordArray.fromByteArray(new_nonce.concat(server_nonce)));
          var shaServerNew = CryptoJS.SHA1(CryptoJS.lib.WordArray.fromByteArray(server_nonce.concat(new_nonce)));
          var shaNewNew    = CryptoJS.SHA1(CryptoJS.lib.WordArray.fromByteArray(new_nonce.concat(new_nonce)));

          var aesKey = shaNewServer.concat(shaServerNew.slice(0, 12));
          var aesIV  = shaServerNew.slice(12, 20).concat(shaNewNew).concat(CryptoJS.lib.WordArray.fromByteArray(new_nonce.slice(0, 4)));

          result = mt(CryptoJS.AES.decrypt({ ciphertext: CryptoJS.lib.WordArray.fromByteArray(result.encrypted_answer) }, aesKey, { iv: aesIV, mode: CryptoJS.mode.IGE, padding: CryptoJS.pad.NoPadding }).slice(20).toString(CryptoJS.enc.Utf16LE));

          if (!result.nonce.equals(nonce)) {
            throw new Error('Server sent invalid nonce');
          }

          if (!result.server_nonce.equals(server_nonce)) {
            throw new Error('Server sent invalid server_nonce');
          }

          server.timeDiff = result.server_time * 1000 - (requestTime + responseTime) / 2;

          var dhPrime = '0';
          for (var i = 0; i < result.dh_prime.length; i++) {
            dhPrime += (result.dh_prime[i] < 0x10 ? '0' : '') + result.dh_prime[i].toString(16);
          }

          var gA = '0';
          for (var i = 0; i < result.g_a.length; i++) {
            gA += (result.g_a[i] < 0x10 ? '0' : '') + result.g_a[i].toString(16);
          }

          var b = randBigInt(2040, 1);
          var _gB = bigInt2str(powMod(int2bigInt(result.g, 0), b, str2bigInt(dhPrime, 16, 0)), 16);

          var gB = [];
          for (var i = 0; i < _gB.length; i += 2) {
            gB.push(parseInt(_gB.charAt(i) + _gB.charAt(i + 1), 16));
          }

          var authKey = CryptoJS.enc.Hex.parse(bigInt2str(powMod(str2bigInt(gA, 16, 0), b, str2bigInt(dhPrime, 16, 0)), 16));

          innerData = CryptoJS.enc.Utf16LE.parse((new mt.client_DH_inner_data(nonce, server_nonce, goog.math.Long.ZERO, gB)).toBytes(true));
          innerData = CryptoJS.SHA1(innerData).concat(innerData);
          innerData.concat(CryptoJS.lib.WordArray.random(pad(innerData.sigBytes, 16)));

          encryptedData = CryptoJS.AES.encrypt(innerData, aesKey, { iv: aesIV, mode: CryptoJS.mode.IGE, padding: CryptoJS.pad.NoPadding });

          server.send(new mt.set_client_DH_params(nonce, server_nonce, encryptedData.ciphertext.toByteArray()));
          server.transport.onData = function(data) {
            var result = mt(server.decodeMessage(data).payload);

            if (!result.nonce.equals(nonce)) {
              throw new Error('Server sent invalid nonce');
            }

            if (!result.server_nonce.equals(server_nonce)) {
              throw new Error('Server sent invalid server_nonce');
            }

            if (result.constructor == mt.dh_gen_ok) {
              var shaAuthKey = CryptoJS.SHA1(authKey);
              var authKeyID = shaAuthKey.slice(12, 20).toString(CryptoJS.enc.Utf16LE);
              var serverSalt = '';
              for (var i = 0; i < 4; i++) {
                serverSalt += String.fromCharCode((new_nonce[i << 1] ^ server_nonce[i << 1]) | ((new_nonce[(i << 1) + 1] ^ server_nonce[(i << 1) + 1]) << 8));
              }

              server.authData = {
                auth_key: authKey,
                auth_key_id: authKeyID,
                server_salt: serverSalt
              };
              server.saveAuthData();

              console.log('auth key generated successfully');
              server.transport.onData = _onComplete;
              if (onComplete) {
                onComplete(server.authData);
              }
            } else
            if (result.constructor == mt.dh_gen_retry) {
              // TODO: generate new b and repeat
            } else
            if (result.constructor == mt.dh_gen_fail) {
              throw new Error('Failed to agree with server on auth key');
            }
          }
        } else
        if (result.constructor == mt.server_DH_params_fail) {
          throw new Error('Server is unable to perform Diffie-Hellman key exchange');
        }
      }
    }
  }

  Server.prototype.saveAuthData = function() {
    if (window.localStorage) {
      var stored = {
        auth_key: this.authData.auth_key.toString(),
        auth_key_id: this.authData.auth_key_id,
        server_salt: this.authData.server_salt
      };
      window.localStorage[this.getStoragePath() + '.authData'] = JSON.stringify(stored);
    }
  }

  // Mark server as not requiring authorisation
  Server.prototype.setLoggedIn = function(loggedIn) {
    this.loggedIn = loggedIn ? loggedIn.user.id : false;
    if (window.localStorage) {
      window.localStorage[this.getStoragePath() + '.loggedIn'] = this.loggedIn;
    }
  }

  Server.prototype.isLoggedIn = function() {
    return (this.loggedIn = (this.loggedIn || (window.localStorage && window.localStorage[this.getStoragePath() + '.loggedIn'])));
  }

  /**
   * Encrypts message and sends it
   * @param  {TLObject}   data
   * @param  {Function}   onComplete
   * @return {Object}     Information about the encrypted message
   */
  Server.prototype.send = function(data, encrypted, insignificant, session_id, onComplete) {
    var messageData = {
      encrypted: encrypted || false,
      auth_key_id: goog.math.Long.ZERO,
      message_id: goog.math.Long.fromNumber(((new Date()).getTime() + (this.timeDiff|0)) * 4294967.296).shiftRight(2).shiftLeft(2),
      payload: data.toBytes(true)
    }
    if (this.minimalMessageId && this.minimalMessageId.greaterThan(messageData.message_id)) {
      messageData.message_id = this.minimalMessageId;
    }
    this.minimalMessageId = messageData.message_id.add(FOUR_LONG);

    if (encrypted) {
      messageData.session_id = session_id || this.sessionId || CryptoJS.lib.WordArray.random(8).toString(CryptoJS.enc.Utf16LE);
      if (!this.sessionId) {
        this.sessionId = messageData.session_id;
      }
      messageData.seq_no = (this.seqNo << 1) | !insignificant;
      this.seqNo = (this.seqNo|0) + !insignificant;
    }

    this.transport.send(this.encodeMessage(messageData), onComplete);
    return messageData;
  }

  var processMessage = function(server, message) {
    //console.log(message.toString());

    if (message.constructor == mt.msg_container) {
      for (var i = 0; i < message.messages.length; i++) {
        processMessage.call(this, server, message.messages[i].body);
      }
    } else
    if (message.constructor == mt.bad_server_salt) {
      server.authData.server_salt = api.long.toBytes(message.new_server_salt);
      server.saveAuthData();

      var bad_msg = this.rpc[message.bad_msg_id.toString()];
      if (bad_msg) {
        delete this.rpc[message.bad_msg_id.toString()];
        this.call(bad_msg.method, bad_msg.onResult, bad_msg.onError, server);
      }
    } else
    if (message.constructor == mt.gzip_packed) {
      processMessage(server, mt(gzipInflate(message.packed_data)));
    } else
    if (message.constructor == mt.rpc_result) {
      if (message.result.constructor == mt.gzip_packed) {
        message.result = mt(gzipInflate(message.result.packed_data));
      }

      var req_msg = this.rpc[message.req_msg_id.toString()];
      if (req_msg) {
        delete this.rpc[message.req_msg_id.toString()];
        if (message.result.constructor == mt.rpc_error) {
          if (message.result.error_code == 303) { // MIGRATE
            var match = message.result.error_message.match(/^([A-Z]+)_MIGRATE_(\d+)/);
            var migrate_type = match[1];
            var dc_id = match[2];
            this.call(req_msg.method, req_msg.onResult, req_msg.onError, dc_id, migrate_type != 'FILE');
          } else {
            if (req_msg.onError) {
              req_msg.onError(message.result);
            }
          }
        } else {
          if (req_msg.onResult) {
            req_msg.onResult(message.result);
          }
        }
      }
    }
  }

  var mtproto = window.mtproto = {
    transport: DebugTransport,
    dcConfig: JSON.parse(window.localStorage && window.localStorage['mtproto.dcConfig'] || 'null'),
    servers: {},
    rpc: {},
    layer: api.invokeWithLayer7,
    init: function(onComplete) {
      var mainServer = window.localStorage && window.localStorage['mtproto.mainServer'] || '173.240.5.1:443';
      this.connect(mainServer, true, onComplete);
    },
    /**
     * Connect to server
     * @param  {Number|String|Server}   serverId    Can be DC id or 'host:port'
     * @param  {Function(Server)}       onComplete  Callback
     * @return {void}
     */
    connect: function(serverId, isMain, onComplete) {
      var self = this;
      if (parseInt(serverId) == serverId) {
        // TODO: get server address from DC config
        if (!self.dcConfig) {
          self.call(new api.help.getConfig(), function(config) { // Actually, help.getConfig is not part of MTProto and therefore should not be integrated into this library...
            self.dcConfig = config;
            if (window.localStorage) {
              window.localStorage['mtproto.dcConfig'] = JSON.stringify(config);
            }
            self.connect(serverId, isMain, onComplete);
          });
          return;
        }

        for (var i = 0; i < self.dcConfig.dc_options.length; i++) {
          var dc_option = self.dcConfig.dc_options[i];
          if (serverId == dc_option.id) {
            serverId = dc_option.ip_address + ':' + dc_option.port;
          }
        }
      }
      var dc = false;
      if (self.dcConfig) {
        for (var i = 0; i < self.dcConfig.dc_options.length; i++) {
          var dc_option = self.dcConfig.dc_options[i];
          if (serverId == dc_option.ip_address + ':' + dc_option.port) {
            dc = dc_option;
          }
        }
      }
      var parts = serverId.split(':');
      var server = new Server(this.transport, parts[0], parts[1], function() { // onConnect
        server.auth(function(authData) {
          if (!isMain && self.servers['main'] && self.servers['main'].isLoggedIn() && dc && !server.isLoggedIn()) { // import/export auth
            self.call(new api.auth.exportAuthorization(dc.id), function(exported) {
              self.call(new api.auth.importAuthorization(exported.id, exported.bytes), function(userData) {
                server.setLoggedIn(userData);

                if (onComplete) {
                  onComplete(server);
                }
              }, function(error) {

              }, server);
            }, function(error) {

            });
          } else {
            if (onComplete) {
              onComplete(server);
            }
          }
        });
      }, function(data) { // onData
        //console.log(data.hexDump(true));
        processMessage.call(self, server, mt(data));
      }, function() { // onClose

      }, function(error) { // onError

      });
      this.servers[serverId] = server;
      if (isMain) {
        this.servers['main'] = server;
        if (window.localStorage) {
          window.localStorage['mtproto.mainServer'] = serverId;
        }
      }
      if (dc) {
        this.servers[dc.id] = server;
      }
    },
    /**
     * Perform a RPC call
     * @param  {TLObject}               method    Method
     * @param  {Function(TLObject)}     onResult  Callback for result
     * @param  {Function(TLObject)}     onError   Callback for error
     * @param  {Number|String|Server}   serverId  Can be DC id, 'host:port', 'main' or actual Server
     * @return {void}
     */
    call: function(method, onResult, onError, serverId, setAsMain) {
      var self = this;
      var server = serverId;
      if (!serverId || typeof serverId == 'number' || typeof serverId == 'string') {
        server = self.servers[serverId || 'main'];
      }

      if (!server) {
        self.connect(serverId, setAsMain, function(server) {
          self.call(method, onResult, onError, server);
        });
      } else {
        if (setAsMain) {
          self.servers['main'] = server;
        }

        var messageData = server.send(self.layer ? new self.layer(method) : method, true);
        self.rpc[messageData.message_id.toString()] = {
          method: method,
          onResult: onResult,
          onError: onError
        }
      }
    },

    // Accepts Photo, chooses nearest size to preferredSize and downloads it
    downloadPhoto: function(photo, preferredSize, onResult, onError, onProgress) {
      var size = photo.sizes[photo.sizes.length - 1];
      for (var i = 0; i < photo.sizes.length; i++) {
        if (photo.sizes[i].type == preferredSize) {
          size = photo.sizes[i];
          break;
        }
      }
      return this.downloadFile(size.location, onResult, onError, onProgress);
    },
    // Accepts FileLocation
    downloadFile: function(fileLocation, onResult, onError, onProgress) {
      return this.download(new api.inputFileLocation(fileLocation.volume_id, fileLocation.local_id, fileLocation.secret), fileLocation.dc_id, onResult, onError, onProgress);
    },
    // Accepts Video
    downloadVideo: function(video, onResult, onError, onProgress) {
      return this.download(new api.inputVideoFileLocation(video.id, video.access_hash), video.dc_id, onResult, onError, onProgress);
    },
    // Accepts InputFileLocation (either inputFileLocation or inputVideoFileLocation)
    // Updates sent to onProgress
    // Supports caching/shared downloading (multiple requests to the same file result in only one downloading job)
    cache: {},
    download: function(location, dc, onResult, onError, onProgress) {
      var self = this;
      var key = location.id || location.secret;
      var cached = self.cache[key];

      if (cached) {
        if (cached.complete) {
          if (onResult) {
            onResult(cached.result, cached.type, cached.mtime);
          }
        } else {
          if (onResult) {
            cached.onResult.push(onResult);
          }
          if (onError) {
            cached.onProgress.push(onError);
          }
          if (onProgress) {
            cached.onProgress.push(onProgress);
          }
        }

        return;
      }
      var limit = 16384;
      var offset = 0;

      cached = self.cache[key] = {
        complete: false,
        result: [],
        onResult: [],
        onError: [],
        onProgress: [],
      }

      if (onResult) {
        cached.onResult.push(onResult);
      }
      if (onError) {
        cached.onProgress.push(onError);
      }
      if (onProgress) {
        cached.onProgress.push(onProgress);
      }

      var nextPart = function() {
        self.call(new api.upload.getFile(location, offset, limit), function(part) {
          cached.result = cached.result.concat(part.bytes);
          offset += part.bytes.length;
          if (part.bytes.length < limit) {
            cached.complete = true;
            cached.type = part.type;
            cached.mtime = part.mtime;

            for (var i = 0; i < cached.onResult.length; i++) {
              cached.onResult[i](cached.result, part.type, part.mtime);
            }
          } else {
            for (var i = 0; i < cached.onProgress.length; i++) {
              cached.onProgress[i](result.length);
            }
            nextPart();
          }
        }, function(error) {
          for (var i = 0; i < cached.onError.length; i++) {
            cached.onError[i](error);
          }
        }, dc);
      }
      nextPart();
    }
  }
})(window, goog);