var httpProxy = require('http-proxy');
var connect = require('connect');
var injector = require('../lib/connect-injector');
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
