'use strict';

var Proto = require('uberproto');
var zlib = require('zlib');
var Q = require('q');
var debug = require('debug')('connect-injector');

var WritableStream = require('stream-buffers').WritableStreamBuffer;
var each = function(obj, callback) {
  if(obj) {
    Object.keys(obj).forEach(function(key) {
      callback(obj[key], key);
    });
  }
};

module.exports = function (when, converter) {
  return function (req, res, next) {
    // Allows more than one injector
    if (res.injectors) {
      debug('injector already initialized, adding to existing');
      res.injectors.push({
        when: when,
        converter: converter
      });
      return next();
    }

    debug('initializing new injector');

    var oldWrite = res.write;
    // An object that we can mix into the response
    var mixin = {
      injectors: [
        {
          when: when,
          converter: converter
        }
      ],

      // Checks if this response should be intercepted
      _interceptCheck: function () {
        var self = this;
        if (typeof this._isIntercepted === 'undefined') {
          // Got through all injector objects
          each(res.injectors, function (obj) {
            if (obj.when(req, res)) {
              self._isIntercepted = true;
              obj.active = true;
            }
          });

          if (!this._isIntercepted) {
            this._isIntercepted = false;
          }
          debug('first time _interceptCheck ran', this._isIntercepted);
        }
        return this._isIntercepted;
      },

      // Overwrite setting the response headers. We can't do content-length
      // so lets just use transfer-encoding chunked
      setHeader: function (name, value) {
        if (name === 'content-length' || name === 'Content-Length') {
          debug('not setting content-length header');
          return;
        }

        return this._super(name, value);
      },

      // Overwrite writeHead since it can also set the headers and we need to override
      // the transfer-encoding
      writeHead: function(status, reasonPhrase, headers) {
        var self = this;

        each(headers || reasonPhrase, function(value, name) {
          self.setHeader(name, value);
        });

        return this._super(status, typeof reasonPhrase === 'string' ? reasonPhrase : undefined);
      },

      // Write into the buffer if this request is intercepted
      write: function (chunk, encoding) {
        if (this._interceptCheck()) {
          if(!this._interceptBuffer) {
            debug('initializing _interceptBuffer');
            this._interceptBuffer = new WritableStream();
          }

          return this._interceptBuffer.write(chunk, encoding);
        }

        return this._super.apply(this, arguments);
      },

      // End the request.
      end: function (data, encoding) {
        var self = this;
        var _super = this._super.bind(this);

        if (!this._interceptCheck()) {
          debug('not intercepting, ending with original .end');
          return _super(data, encoding);
        }

        if (data) {
          this.write(data, encoding);
        }

        debug('resetting to original response.write');
        this.write = oldWrite;

        // Responses without a body can just be ended
        if(!this._hasBody || !this._interceptBuffer) {
          debug('ending empty resopnse without injecting anything');
          return _super();
        }

        var gzipped = this.getHeader('content-encoding') === 'gzip';
        var chain = Q(this._interceptBuffer.getContents());

        if(gzipped) {
          debug('unzipping content');
          // Unzip the buffer
          chain = chain.then(function(buffer) {
            return Q.nfcall(zlib.gunzip, buffer);
          });
        }

        this.injectors.forEach(function(injector) {
          // Run all converters, if they are active
          // In series, using the previous output
          if(injector.active) {
            debug('adding injector to chain');
            var converter = injector.converter.bind(self);
            chain = chain.then(function(prev) {
              return Q.nfcall(converter, prev, req, res);
            });
          }
        });

        if(gzipped) {
          debug('re-zipping content');
          // Zip it again
          chain = chain.then(function(result) {
            return Q.nfcall(zlib.gzip, result);
          });
        }

        chain.then(_super).fail(function(e) {
          debug('injector chain failed, emitting error event');
          self.emit('error', e);
        });

        return true;
      }
    };

    Proto.mixin(mixin, res);

    return next();
  };
};
