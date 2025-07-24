'use strict';

var should = require('should');
var connect = require('connect');
var request = require('request');
var injector = require('./../lib/connect-injector');
var httpProxy = require('http-proxy');
var zlib = require('zlib');

describe('connect-injector', function() {
  it('does not mess with normal requests', function(done) {
    var rewriter = injector(function() {
      return false;
    }, function() {
      done('Should never be called');
    });

    var app = connect().use(rewriter).use(function(req, res) {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Hello World\n');
    });

    var server = app.listen(9999).on('listening', function() {
      request('http://localhost:9999', function(error, response, body) {
        should.not.exist(error);
        response.headers['content-type'].should.equal('text/plain');
        body.should.equal('Hello World\n');
        server.close(done);
      });
    });
  });

  it('does not mess with empty responses', function(done) {
    var rewriter = injector(function() {
      return false;
    }, function() {
      done('Should never be called');
    });

    var app = connect().use(rewriter).use(function(req, res) {
      res.writeHead(204);
      res.end();
    });

    var server = app.listen(9999).on('listening', function() {
      request('http://localhost:9999', function(error, response, body) {
        should.not.exist(error);
        should.not.exist(body);
        response.statusCode.should.equal(204);
        server.close(done);
      });
    });
  });

  it('works with empty responses that are rewritten', function(done) {
    var rewriter = injector(function() {
      return true;
    }, function() {
      done('Should never be called');
    });

    var app = connect().use(rewriter).use(function(req, res) {
      res.writeHead(304);
      res.end();
    });

    var server = app.listen(9999).on('listening', function() {
      request('http://localhost:9999', function(error, response, body) {
        should.not.exist(error);
        should.not.exist(body);
        response.statusCode.should.equal(304);
        server.close(done);
      });
    });
  });

  it('does some basic rewriting', function(done) {
    var REWRITTEN = 'Hello People';
    var rewriter = injector(function(req, res) {
      res.getHeader('content-type').should.equal('text/plain');
      return true;
    }, function(data, req, res, callback) {
      callback(null, REWRITTEN);
    });

    var app = connect().use(rewriter).use(function(req, res) {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Hello World\n');
    });

    var server = app.listen(9999).on('listening', function() {
      request('http://localhost:9999', function(error, response, body) {
        should.not.exist(error);
        response.headers['content-type'].should.equal('text/plain');
        body.should.equal(REWRITTEN);
        server.close(done);
      });
    });
  });

  it('generates jsonp', function(done) {
    var PLAIN = 'Hello World\n';
    var OBJ = { hello: 'world' };

    var jsonp = injector(function(req, res) {
      var isJSON = res.getHeader('content-type').indexOf('application/json') === 0;
      return isJSON && req.query.callback;
    }, function(data, req, res, callback) {
      callback(null, req.query.callback + '(' + data.toString() + ')');
    });

    var app = connect().use(connect.query()).use(jsonp)
      .use('/plain', function(req, res) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(PLAIN);
      }).use('/jsonp', function(req, res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(OBJ));
      });

    var server = app.listen(9999).on('listening', function() {
      // Plain request
      request('http://localhost:9999/plain', function(error, response, body) {
        should.not.exist(error);
        response.headers['content-type'].should.equal('text/plain');
        body.should.equal(PLAIN);
        // Normal JSON request
        request('http://localhost:9999/jsonp', function(error, response, body) {
          should.not.exist(error);
          response.headers['content-type'].should.equal('application/json');
          body.should.equal(JSON.stringify(OBJ));
          // JSONP request
          request('http://localhost:9999/jsonp?callback=stuff', function(error, response, body) {
            should.not.exist(error);
            response.headers['content-type'].should.equal('application/json');
            body.should.equal('stuff(' + JSON.stringify(OBJ) + ')');
            server.close();
            done();
          });
        });
      });
    });
  });

  it('allows more than one injector', function(done) {
    var OBJ = { hello: 'people' };
    var REWRITTEN = 'Re-written stuff';

    var rewriter = injector(function(req, res) {
      return res.getHeader('content-type').indexOf('text/plain') === 0;
    }, function(data, req, res, callback) {
      callback(null, REWRITTEN);
    });

    var jsonp = injector(function(req, res) {
      var isJSON = res.getHeader('content-type').indexOf('application/json') === 0;
      return isJSON && req.query.callback;
    }, function(data, req, res, callback) {
      callback(null, req.query.callback + '(' + data.toString() + ')');
    });

    var app = connect().use(connect.query()).use(jsonp).use(rewriter)
      .use('/plain', function(req, res) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Hello world\n');
      }).use('/jsonp', function(req, res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(OBJ));
      });

    var server = app.listen(9999).on('listening', function() {
      // Plain request
      request('http://localhost:9999/plain', function(error, response, body) {
        should.not.exist(error);
        response.headers['content-type'].should.equal('text/plain');
        body.should.equal(REWRITTEN);
        // JSONP request
        request('http://localhost:9999/jsonp?callback=stuff', function(error, response, body) {
          should.not.exist(error);
          response.headers['content-type'].should.equal('application/json');
          body.should.equal('stuff(' + JSON.stringify(OBJ) + ')');
          server.close();
          done();
        });
      });
    });
  });

  it('chains injectors', function(done) {
    var first = injector(function() {
      return true;
    }, function(data, req, res, callback) {
      callback(null, data.toString() + ' first');
    });

    var second = injector(function() {
      return true;
    }, function(data, req, res, callback) {
      callback(null, data.toString() + ' second');
    });

    var app = connect().use(first).use(second).use(function(req, res) {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Hello');
    });

    var server = app.listen(9999).on('listening', function() {
      var expected = 'Hello first second';
      request('http://localhost:9999', function(error, response, body) {
        should.not.exist(error);
        response.headers['content-type'].should.equal('text/plain');
        body.should.equal(expected);
        server.close(done);
      });
    });
  });

  it('handles longer content properly', function(done) {
    var inject = injector(function(req, res) {
      return res.getHeader('content-type').indexOf('text/html') === 0;
    }, function(data, req, res, callback) {
      callback(null, data.toString().replace('</body>', '__injected__</body>'));
    });

    var app = connect().use(inject).use(connect.static(__dirname));

    var server = app.listen(9999).on('listening', function() {
      request('http://localhost:9999/dummycontent.html', function(error, response, body) {
        should.not.exist(error);
        response.headers['content-type'].indexOf('text/html').should.equal(0);
        body.indexOf('__injected__').should.not.equal(-1);
        request('http://localhost:9999/injector_tests.js', function(error, response, body) {
          should.not.exist(error);
          response.headers['content-type'].indexOf('application/javascript').should.equal(0);
          server.close(done);
        });
      });
    });
  });

  it('works with http-proxy', function(done) {
    var proxy = httpProxy.createProxyServer();
    var inject = injector(function(req, res) {
      return res.getHeader('content-type').indexOf('text/html') === 0;
    }, function(data, req, res, callback) {
      callback(null, data.toString().replace('</body>', '__injected__</body>'));
    });
    var proxyMiddleware = function(req, res) {
      proxy.web(req, res, {
        target: 'http://localhost:8878'
      });
    };
    var app = connect().use(connect.static(__dirname));
    var server = app.listen(8878).on('listening', function() {
      var proxyApp = connect().use(inject).use(proxyMiddleware);
      var proxyServer = proxyApp.listen(7787).on('listening', function() {
        request('http://localhost:7787/dummycontent.html', function(error, response, body) {
          should.not.exist(error);
          response.headers['content-type'].indexOf('text/html').should.equal(0);
          body.indexOf('__injected__').should.not.equal(-1);
          proxyServer.close(function() {
            server.close(done);
          });
        });
      });
    });
  });

  it('works with http-proxy and gzipped content', function(done) {
    var proxy = httpProxy.createProxyServer();
    var inject = injector(function(req, res) {
      return res.getHeader('content-type').indexOf('text/html') === 0;
    }, function(data, req, res, callback) {
      callback(null, data.toString().replace('</body>', '__injected__</body>'));
    });
    var proxyMiddleware = function(req, res) {
      req.headers.host = 'daffl.github.io';
      proxy.web(req, res, {
        target: 'http://daffl.github.io'
      });
    };

    var proxyApp = connect().use(inject).use(proxyMiddleware);
    var proxyServer = proxyApp.listen(9989).on('listening', function() {
      var gunzip = zlib.createGunzip();

      request({
        url: 'http://localhost:9989/connect-injector/dummycontent.html',
        headers: {
          'Accept-Encoding': 'gzip, deflate'
        }
      }).pipe(gunzip);


      var body = "";

      gunzip.on('data', function(data) {
        body += data.toString();
      });

      gunzip.on('end', function() {
        body.indexOf('__injected__').should.not.equal(-1);
        proxyServer.close(done);
      });
    });
  });
});
