# connect-injector

A middleware to inject content into any HTTP response.

[![Build Status](https://travis-ci.org/daffl/connect-injector.png?branch=master)](https://travis-ci.org/daffl/connect-injector)

## Getting Started

Install the module with: `npm install connect-injector`

## Injecting

The basic API looks like this:

```javascript
var injector = require('connect-injector');
var middleware = injector(function when(req, res) {
  // for this request and repsonse
  // return whether or not to enable injecting
}, function converter(content, req, res, callback) {
  content // the entire response buffer
  req // the HTTP request
  res // the HTTP response
  callback // (error, data) with the injected data
});
```

And can be used like any other Connect and Express middleware.
You need to make sure to use the injector middleware *before* the actual content is being written.

## Examples

### JSONP support

A very useful example for connect-injector is to add [JSONP](http://en.wikipedia.org/wiki/JSONP)
support to any `application/json` repsonse:

```javascript
var injector = require('connect-injector');
var inject = injector(function(req, res) {
  var isJSON = res.getHeader('content-type').indexOf('application/json') !== -1;
  return isJSON && req.query.callback;
}, function(data, req, res, callback) {
  callback(null, req.query.callback + '(' + data.toString() + ')');
});

// inject needs to be used before any middleware that writes to the response
connect().use(connect.query()).use(inject).use(/* your other middleware here */);
```

Now any `application/json` response will be wrapped into a callback if given the
`callback=xyz` query parameter.

### Code minification

Another use case would be to minify JavaScript files on the fly using [UglifyJS](https://github.com/mishoo/UglifyJS):

```js
var injector = require('connect-injector');
var connect = require('connect');
var UglifyJS = require('uglify-js');
// Cache for already uglified files
var cache = {};
// Function that uglifies JavaScript code
var uglify = function (code) {
  var toplevel = UglifyJS.parse(code);

  toplevel.figure_out_scope();

  var compressor = UglifyJS.Compressor({
    warnings: false
  });
  var compressed = toplevel.transform(compressor);

  compressed.figure_out_scope();
  compressed.compute_char_frequency();
  compressed.mangle_names();

  return compressed.print_to_string();
};

var inject = injector(function(req, res) {
  return res.getHeader('content-type').indexOf('application/javascript') !== -1;
}, function(data, req, res, callback) {
  // Check the cache, uglify the code if not and add it
  if(!cache[req.url]) {
    cache[req.url] = uglify(data.toString());
  }

  callback(null, cache[req.url]);
});

// inject needs to be used before any middleware that writes to the response
var app = connect().use(inject).use(connect.static(__dirname + '/../test'));

app.listen(8080);
```

### Rewriting proxied files

connect-injector is tested to work with [http-proxy](https://github.com/nodejitsu/node-http-proxy)
you can rewrite existing proxied content:

```js
var httpProxy = require('http-proxy');
var connect = require('connect');
var injector = require('connect-injector');
var proxy = httpProxy.createProxyServer();
var inject = injector(function(req, res) {
  return res.getHeader('content-type').indexOf('text/html') === 0;
}, function(data, req, res, callback) {
  callback(null, data.toString().replace('</body>', '<p>Powered by connect-injector</p></body>'));
});
var proxyMiddleware = function(req, res) {
  // You need to rewrite your host in order to be able to hit virtual hosts
  req.headers.host = 'daffl.github.io';
  proxy.web(req, res, {
    target: 'http://daffl.github.io'
  });
};

var proxyApp = connect().use(inject).use(proxyMiddleware);

proxyApp.listen(8080);
```

After starting the server, check `http://localhost:8080/connect-injector/dummycontent.html`
to see the injected content.

## Release History

__0.4.2__

- Fix for empty responses not trying to be rewritten ([#13](https://github.com/daffl/connect-injector/issues/13), [#14](https://github.com/daffl/connect-injector/pull/14))

__0.4.1__

- Fix connect-injector to work with Node 0.10.32 ([#11](https://github.com/daffl/connect-injector/pull/11))
- Add debug messages and remove header rewriting ([#12](https://github.com/daffl/connect-injector/pull/12))

__0.4.0__

- Fix issue when using GZip and refactor to use Q and proper NodeJS callbacks ([#9](https://github.com/daffl/connect-injector/pull/9))

__0.3.0__

- Injector works with HTTP proxy and GZipped content ([#4](https://github.com/daffl/connect-injector/pull/4), [#7](https://github.com/daffl/connect-injector/pull/7), [#8](https://github.com/daffl/connect-injector/pull/8))

__0.2.3__

- Fix caching issues for response headers not being written if there is no body ([#3](https://github.com/daffl/connect-injector/issues/3))

__0.2.2__

- Fix handling of responses with an empty body ([#1](https://github.com/daffl/connect-injector/pull/1))

__0.2.1__

- Fix bug not setting `isIntercepted` properly

__0.2.0__

- Allow chaining injectors
- Unit tests and CI
- Fixes for writing correct headers
- Use [stream-buffers](https://github.com/samcday/node-stream-buffer) instead of concatenating

__0.1.0__

- Initial alpha release

## License

Copyright (c) 2016 David Luecke  
Licensed under the MIT license.
