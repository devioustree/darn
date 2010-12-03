(function() {
  var Api, isInt;
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  isInt = function(possibleNumber) {
    return parseInt(possibleNumber) === possibleNumber;
  };
  Api = function(host, port) {
    this.host = host;
    this.port = port != null ? port : 80;
    if (isInt(this.host)) {
      this.port = this.host;
      this.host = null;
    }
    if (!(this.host != null)) {
      try {
        this.host = location.hostname;
      } catch (err) {
        throw "You must specify a hostname";
      }
    }
    return this;
  };
  Api.prototype = (function() {
    var callbackCache, callbackSequence, createCacheId, createSocket, getMethodCache, method, validMethods, _i, _len, _socket;
    validMethods = ['DELETE', 'GET', 'POST', 'PUT'];
    _socket = null;
    callbackSequence = 0;
    callbackCache = {};
    for (_i = 0, _len = validMethods.length; _i < _len; _i++) {
      method = validMethods[_i];
      callbackCache[method] = {};
    }
    createCacheId = function() {
      return callbackSequence++;
    };
    getMethodCache = function(method) {
      if (__indexOf.call(validMethods, method) >= 0) {
        return callbackCache[method];
      }
    };
    createSocket = function(host, port) {
      var socket;
      socket = new io.Socket(host, {
        port: port
      });
      socket.on('message', function(msg) {
        var cache, callback;
        cache = getMethodCache(msg.method);
        callback = cache[msg.sequenceId];
        cache[msg.sequenceId] = null;
        delete cache[msg.sequenceId];
        return callback(null, msg.obj);
      });
      return socket;
    };
    return {
      socket: function() {
        if (!(_socket != null)) {
          _socket = createSocket(this.host, this.port);
        }
        return _socket;
      },
      request: function(method, data, callback) {
        var cache, cacheId;
        if ((callback != null) && (getMethodCache(method) != null)) {
          cacheId = createCacheId();
          cache = getMethodCache(method);
          cache[cacheId] = callback;
          data.sequenceId = cacheId;
        }
        if (!this.socket.connected) {
          this.socket.connect();
        }
        data.method = method;
        data.timestamp = (new Date()).valueOf();
        return this.socket.send(data);
      },
      get: function(path, callback) {
        if (!(callback != null)) {
          throw "You must have a callback so you can store the returned data";
        }
        return this.request('GET', {
          path: path
        }, callback);
      }
    };
  })();
  this.Api = Api;
}).call(this);
