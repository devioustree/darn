(function() {
  var Darn, io, isBool, isFunction, isInt;
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  io = this.io;
  isInt = function(possibleNumber) {
    return parseInt(possibleNumber) === possibleNumber;
  };
  isFunction = function(possibleFunction) {
    return typeof possibleFunction === 'function';
  };
  isBool = function(possibleBoolean) {
    return typeof possibleBoolean === 'boolean';
  };
  Darn = function(host, port, secure) {
    if (port == null) {
      port = 80;
    }
    if (secure == null) {
      secure = false;
    }
    if (isInt(host) && isBool(port)) {
      secure = port;
      port = host;
      host = null;
    } else if (isInt(host)) {
      port = host;
      host = null;
    } else if (isBool(host)) {
      secure = host;
      host = null;
    }
    if (!(host != null)) {
      try {
        host = location.hostname;
      } catch (err) {
        throw "You must specify a hostname";
      }
    }
    this.createSocket(host, port, secure);
    return this;
  };
  Darn.prototype = (function() {
    var callbackCache, callbackSequence, createCacheId, getMethodCache, method, socket, validMethods, _i, _len;
    validMethods = ['DELETE', 'GET', 'POST', 'PUT'];
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
    socket = null;
    return {
      createSocket: function(host, port, secure) {
        if (socket != null) {
          return socket;
        }
        socket = new io.Socket(host, {
          port: port,
          secure: secure
        });
        socket.on('message', function(msg) {
          var cache, callback;
          cache = getMethodCache(msg.method);
          callback = cache[msg.sequenceId];
          cache[msg.sequenceId] = null;
          delete cache[msg.sequenceId];
          return callback(null, msg.obj);
        });
        return socket.connect();
      },
      request: function(method, path, obj, callback) {
        var cache, cacheId, data;
        if (isFunction(obj)) {
          callback = obj;
          obj = null;
        }
        if ((callback != null) && (getMethodCache(method) != null)) {
          cacheId = createCacheId();
          cache = getMethodCache(method);
          cache[cacheId] = callback;
        }
        data = {
          method: method,
          timestamp: (new Date()).valueOf(),
          path: path,
          sequenceId: cacheId != null ? cacheId : null,
          obj: obj != null ? obj : null
        };
        if (!socket.connected) {
          socket.connect();
        }
        return socket.send(data);
      },
      "delete": function(path, callback) {
        return this.request('DELETE', path, callback);
      },
      get: function(path, callback) {
        if (!(callback != null)) {
          throw "You must have a callback so you can store the returned data";
        }
        return this.request('GET', path, callback);
      },
      post: function(path, obj, callback) {
        return this.request('POST', path, obj, callback);
      },
      put: function(path, obj, callback) {
        return this.request('PUT', path, obj, callback);
      }
    };
  })();
  this.Darn = Darn;
}).call(this);
