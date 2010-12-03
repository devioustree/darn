(function() {
  var Api, isFunction, isInt;
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  isInt = function(possibleNumber) {
    return parseInt(possibleNumber) === possibleNumber;
  };
  isFunction = function(possibleFunction) {
    return typeof possibleFunction === 'function';
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
    this.createSocket(this.host, this.port);
    return this;
  };
  Api.prototype = (function() {
    var callbackCache, callbackSequence, createCacheId, getMethodCache, method, validMethods, _i, _len;
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
    return {
      createSocket: function(host, port) {
        if (this.socket != null) {
          return this.socket;
        }
        this.socket = new io.Socket(host, {
          port: port
        });
        return this.socket.on('message', function(msg) {
          var cache, callback;
          cache = getMethodCache(msg.method);
          callback = cache[msg.sequenceId];
          cache[msg.sequenceId] = null;
          delete cache[msg.sequenceId];
          return callback(null, msg.obj);
        });
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
        if (!this.socket.connected) {
          this.socket.connect();
        }
        return this.socket.send(data);
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
  this.Api = Api;
}).call(this);
