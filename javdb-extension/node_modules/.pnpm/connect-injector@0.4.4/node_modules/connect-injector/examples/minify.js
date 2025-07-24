var injector = require('../lib/connect-injector');
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
connect().use(inject).use(connect.static(__dirname + '/../test')).listen(8080);