/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/available-typed-arrays/index.js":
/*!******************************************************!*\
  !*** ./node_modules/available-typed-arrays/index.js ***!
  \******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var possibleNames = __webpack_require__(/*! possible-typed-array-names */ "./node_modules/possible-typed-array-names/index.js");
var g = typeof globalThis === 'undefined' ? __webpack_require__.g : globalThis;

/** @type {import('.')} */
module.exports = function availableTypedArrays() {
  var /** @type {ReturnType<typeof availableTypedArrays>} */out = [];
  for (var i = 0; i < possibleNames.length; i++) {
    if (typeof g[possibleNames[i]] === 'function') {
      // @ts-expect-error
      out[out.length] = possibleNames[i];
    }
  }
  return out;
};

/***/ }),

/***/ "./node_modules/axios/index.js":
/*!*************************************!*\
  !*** ./node_modules/axios/index.js ***!
  \*************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(/*! ./lib/axios */ "./node_modules/axios/lib/axios.js");

/***/ }),

/***/ "./node_modules/axios/lib/adapters/xhr.js":
/*!************************************************!*\
  !*** ./node_modules/axios/lib/adapters/xhr.js ***!
  \************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");
var settle = __webpack_require__(/*! ./../core/settle */ "./node_modules/axios/lib/core/settle.js");
var cookies = __webpack_require__(/*! ./../helpers/cookies */ "./node_modules/axios/lib/helpers/cookies.js");
var buildURL = __webpack_require__(/*! ./../helpers/buildURL */ "./node_modules/axios/lib/helpers/buildURL.js");
var buildFullPath = __webpack_require__(/*! ../core/buildFullPath */ "./node_modules/axios/lib/core/buildFullPath.js");
var parseHeaders = __webpack_require__(/*! ./../helpers/parseHeaders */ "./node_modules/axios/lib/helpers/parseHeaders.js");
var isURLSameOrigin = __webpack_require__(/*! ./../helpers/isURLSameOrigin */ "./node_modules/axios/lib/helpers/isURLSameOrigin.js");
var transitionalDefaults = __webpack_require__(/*! ../defaults/transitional */ "./node_modules/axios/lib/defaults/transitional.js");
var AxiosError = __webpack_require__(/*! ../core/AxiosError */ "./node_modules/axios/lib/core/AxiosError.js");
var CanceledError = __webpack_require__(/*! ../cancel/CanceledError */ "./node_modules/axios/lib/cancel/CanceledError.js");
var parseProtocol = __webpack_require__(/*! ../helpers/parseProtocol */ "./node_modules/axios/lib/helpers/parseProtocol.js");
module.exports = function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    var requestData = config.data;
    var requestHeaders = config.headers;
    var responseType = config.responseType;
    var onCanceled;
    function done() {
      if (config.cancelToken) {
        config.cancelToken.unsubscribe(onCanceled);
      }
      if (config.signal) {
        config.signal.removeEventListener('abort', onCanceled);
      }
    }
    if (utils.isFormData(requestData) && utils.isStandardBrowserEnv()) {
      delete requestHeaders['Content-Type']; // Let the browser set it
    }
    var request = new XMLHttpRequest();

    // HTTP basic authentication
    if (config.auth) {
      var username = config.auth.username || '';
      var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }
    var fullPath = buildFullPath(config.baseURL, config.url);
    request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

    // Set the request timeout in MS
    request.timeout = config.timeout;
    function onloadend() {
      if (!request) {
        return;
      }
      // Prepare the response
      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
      var responseData = !responseType || responseType === 'text' || responseType === 'json' ? request.responseText : request.response;
      var response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config: config,
        request: request
      };
      settle(function _resolve(value) {
        resolve(value);
        done();
      }, function _reject(err) {
        reject(err);
        done();
      }, response);

      // Clean up request
      request = null;
    }
    if ('onloadend' in request) {
      // Use onloadend if available
      request.onloadend = onloadend;
    } else {
      // Listen for ready state to emulate onloadend
      request.onreadystatechange = function handleLoad() {
        if (!request || request.readyState !== 4) {
          return;
        }

        // The request errored out and we didn't get a response, this will be
        // handled by onerror instead
        // With one exception: request that using file: protocol, most browsers
        // will return status as 0 even though it's a successful request
        if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
          return;
        }
        // readystate handler is calling before onerror or ontimeout handlers,
        // so we should call onloadend on the next 'tick'
        setTimeout(onloadend);
      };
    }

    // Handle browser request cancellation (as opposed to a manual cancellation)
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }
      reject(new AxiosError('Request aborted', AxiosError.ECONNABORTED, config, request));

      // Clean up request
      request = null;
    };

    // Handle low level network errors
    request.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, request, request));

      // Clean up request
      request = null;
    };

    // Handle timeout
    request.ontimeout = function handleTimeout() {
      var timeoutErrorMessage = config.timeout ? 'timeout of ' + config.timeout + 'ms exceeded' : 'timeout exceeded';
      var transitional = config.transitional || transitionalDefaults;
      if (config.timeoutErrorMessage) {
        timeoutErrorMessage = config.timeoutErrorMessage;
      }
      reject(new AxiosError(timeoutErrorMessage, transitional.clarifyTimeoutError ? AxiosError.ETIMEDOUT : AxiosError.ECONNABORTED, config, request));

      // Clean up request
      request = null;
    };

    // Add xsrf header
    // This is only done if running in a standard browser environment.
    // Specifically not if we're in a web worker, or react-native.
    if (utils.isStandardBrowserEnv()) {
      // Add xsrf header
      var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ? cookies.read(config.xsrfCookieName) : undefined;
      if (xsrfValue) {
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    }

    // Add headers to the request
    if ('setRequestHeader' in request) {
      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
          // Remove Content-Type if data is undefined
          delete requestHeaders[key];
        } else {
          // Otherwise add header to the request
          request.setRequestHeader(key, val);
        }
      });
    }

    // Add withCredentials to request if needed
    if (!utils.isUndefined(config.withCredentials)) {
      request.withCredentials = !!config.withCredentials;
    }

    // Add responseType to request if needed
    if (responseType && responseType !== 'json') {
      request.responseType = config.responseType;
    }

    // Handle progress if needed
    if (typeof config.onDownloadProgress === 'function') {
      request.addEventListener('progress', config.onDownloadProgress);
    }

    // Not all browsers support upload events
    if (typeof config.onUploadProgress === 'function' && request.upload) {
      request.upload.addEventListener('progress', config.onUploadProgress);
    }
    if (config.cancelToken || config.signal) {
      // Handle cancellation
      // eslint-disable-next-line func-names
      onCanceled = function onCanceled(cancel) {
        if (!request) {
          return;
        }
        reject(!cancel || cancel && cancel.type ? new CanceledError() : cancel);
        request.abort();
        request = null;
      };
      config.cancelToken && config.cancelToken.subscribe(onCanceled);
      if (config.signal) {
        config.signal.aborted ? onCanceled() : config.signal.addEventListener('abort', onCanceled);
      }
    }
    if (!requestData) {
      requestData = null;
    }
    var protocol = parseProtocol(fullPath);
    if (protocol && ['http', 'https', 'file'].indexOf(protocol) === -1) {
      reject(new AxiosError('Unsupported protocol ' + protocol + ':', AxiosError.ERR_BAD_REQUEST, config));
      return;
    }

    // Send the request
    request.send(requestData);
  });
};

/***/ }),

/***/ "./node_modules/axios/lib/axios.js":
/*!*****************************************!*\
  !*** ./node_modules/axios/lib/axios.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./utils */ "./node_modules/axios/lib/utils.js");
var bind = __webpack_require__(/*! ./helpers/bind */ "./node_modules/axios/lib/helpers/bind.js");
var Axios = __webpack_require__(/*! ./core/Axios */ "./node_modules/axios/lib/core/Axios.js");
var mergeConfig = __webpack_require__(/*! ./core/mergeConfig */ "./node_modules/axios/lib/core/mergeConfig.js");
var defaults = __webpack_require__(/*! ./defaults */ "./node_modules/axios/lib/defaults/index.js");

/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */
function createInstance(defaultConfig) {
  var context = new Axios(defaultConfig);
  var instance = bind(Axios.prototype.request, context);

  // Copy axios.prototype to instance
  utils.extend(instance, Axios.prototype, context);

  // Copy context to instance
  utils.extend(instance, context);

  // Factory for creating new instances
  instance.create = function create(instanceConfig) {
    return createInstance(mergeConfig(defaultConfig, instanceConfig));
  };
  return instance;
}

// Create the default instance to be exported
var axios = createInstance(defaults);

// Expose Axios class to allow class inheritance
axios.Axios = Axios;

// Expose Cancel & CancelToken
axios.CanceledError = __webpack_require__(/*! ./cancel/CanceledError */ "./node_modules/axios/lib/cancel/CanceledError.js");
axios.CancelToken = __webpack_require__(/*! ./cancel/CancelToken */ "./node_modules/axios/lib/cancel/CancelToken.js");
axios.isCancel = __webpack_require__(/*! ./cancel/isCancel */ "./node_modules/axios/lib/cancel/isCancel.js");
axios.VERSION = (__webpack_require__(/*! ./env/data */ "./node_modules/axios/lib/env/data.js").version);
axios.toFormData = __webpack_require__(/*! ./helpers/toFormData */ "./node_modules/axios/lib/helpers/toFormData.js");

// Expose AxiosError class
axios.AxiosError = __webpack_require__(/*! ../lib/core/AxiosError */ "./node_modules/axios/lib/core/AxiosError.js");

// alias for CanceledError for backward compatibility
axios.Cancel = axios.CanceledError;

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = __webpack_require__(/*! ./helpers/spread */ "./node_modules/axios/lib/helpers/spread.js");

// Expose isAxiosError
axios.isAxiosError = __webpack_require__(/*! ./helpers/isAxiosError */ "./node_modules/axios/lib/helpers/isAxiosError.js");
module.exports = axios;

// Allow use of default import syntax in TypeScript
module.exports["default"] = axios;

/***/ }),

/***/ "./node_modules/axios/lib/cancel/CancelToken.js":
/*!******************************************************!*\
  !*** ./node_modules/axios/lib/cancel/CancelToken.js ***!
  \******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var CanceledError = __webpack_require__(/*! ./CanceledError */ "./node_modules/axios/lib/cancel/CanceledError.js");

/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @class
 * @param {Function} executor The executor function.
 */
function CancelToken(executor) {
  if (typeof executor !== 'function') {
    throw new TypeError('executor must be a function.');
  }
  var resolvePromise;
  this.promise = new Promise(function promiseExecutor(resolve) {
    resolvePromise = resolve;
  });
  var token = this;

  // eslint-disable-next-line func-names
  this.promise.then(function (cancel) {
    if (!token._listeners) return;
    var i;
    var l = token._listeners.length;
    for (i = 0; i < l; i++) {
      token._listeners[i](cancel);
    }
    token._listeners = null;
  });

  // eslint-disable-next-line func-names
  this.promise.then = function (onfulfilled) {
    var _resolve;
    // eslint-disable-next-line func-names
    var promise = new Promise(function (resolve) {
      token.subscribe(resolve);
      _resolve = resolve;
    }).then(onfulfilled);
    promise.cancel = function reject() {
      token.unsubscribe(_resolve);
    };
    return promise;
  };
  executor(function cancel(message) {
    if (token.reason) {
      // Cancellation has already been requested
      return;
    }
    token.reason = new CanceledError(message);
    resolvePromise(token.reason);
  });
}

/**
 * Throws a `CanceledError` if cancellation has been requested.
 */
CancelToken.prototype.throwIfRequested = function throwIfRequested() {
  if (this.reason) {
    throw this.reason;
  }
};

/**
 * Subscribe to the cancel signal
 */

CancelToken.prototype.subscribe = function subscribe(listener) {
  if (this.reason) {
    listener(this.reason);
    return;
  }
  if (this._listeners) {
    this._listeners.push(listener);
  } else {
    this._listeners = [listener];
  }
};

/**
 * Unsubscribe from the cancel signal
 */

CancelToken.prototype.unsubscribe = function unsubscribe(listener) {
  if (!this._listeners) {
    return;
  }
  var index = this._listeners.indexOf(listener);
  if (index !== -1) {
    this._listeners.splice(index, 1);
  }
};

/**
 * Returns an object that contains a new `CancelToken` and a function that, when called,
 * cancels the `CancelToken`.
 */
CancelToken.source = function source() {
  var cancel;
  var token = new CancelToken(function executor(c) {
    cancel = c;
  });
  return {
    token: token,
    cancel: cancel
  };
};
module.exports = CancelToken;

/***/ }),

/***/ "./node_modules/axios/lib/cancel/CanceledError.js":
/*!********************************************************!*\
  !*** ./node_modules/axios/lib/cancel/CanceledError.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var AxiosError = __webpack_require__(/*! ../core/AxiosError */ "./node_modules/axios/lib/core/AxiosError.js");
var utils = __webpack_require__(/*! ../utils */ "./node_modules/axios/lib/utils.js");

/**
 * A `CanceledError` is an object that is thrown when an operation is canceled.
 *
 * @class
 * @param {string=} message The message.
 */
function CanceledError(message) {
  // eslint-disable-next-line no-eq-null,eqeqeq
  AxiosError.call(this, message == null ? 'canceled' : message, AxiosError.ERR_CANCELED);
  this.name = 'CanceledError';
}
utils.inherits(CanceledError, AxiosError, {
  __CANCEL__: true
});
module.exports = CanceledError;

/***/ }),

/***/ "./node_modules/axios/lib/cancel/isCancel.js":
/*!***************************************************!*\
  !*** ./node_modules/axios/lib/cancel/isCancel.js ***!
  \***************************************************/
/***/ ((module) => {

"use strict";


module.exports = function isCancel(value) {
  return !!(value && value.__CANCEL__);
};

/***/ }),

/***/ "./node_modules/axios/lib/core/Axios.js":
/*!**********************************************!*\
  !*** ./node_modules/axios/lib/core/Axios.js ***!
  \**********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");
var buildURL = __webpack_require__(/*! ../helpers/buildURL */ "./node_modules/axios/lib/helpers/buildURL.js");
var InterceptorManager = __webpack_require__(/*! ./InterceptorManager */ "./node_modules/axios/lib/core/InterceptorManager.js");
var dispatchRequest = __webpack_require__(/*! ./dispatchRequest */ "./node_modules/axios/lib/core/dispatchRequest.js");
var mergeConfig = __webpack_require__(/*! ./mergeConfig */ "./node_modules/axios/lib/core/mergeConfig.js");
var buildFullPath = __webpack_require__(/*! ./buildFullPath */ "./node_modules/axios/lib/core/buildFullPath.js");
var validator = __webpack_require__(/*! ../helpers/validator */ "./node_modules/axios/lib/helpers/validator.js");
var validators = validator.validators;
/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 */
function Axios(instanceConfig) {
  this.defaults = instanceConfig;
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  };
}

/**
 * Dispatch a request
 *
 * @param {Object} config The config specific for this request (merged with this.defaults)
 */
Axios.prototype.request = function request(configOrUrl, config) {
  /*eslint no-param-reassign:0*/
  // Allow for axios('example/url'[, config]) a la fetch API
  if (typeof configOrUrl === 'string') {
    config = config || {};
    config.url = configOrUrl;
  } else {
    config = configOrUrl || {};
  }
  config = mergeConfig(this.defaults, config);

  // Set config.method
  if (config.method) {
    config.method = config.method.toLowerCase();
  } else if (this.defaults.method) {
    config.method = this.defaults.method.toLowerCase();
  } else {
    config.method = 'get';
  }
  var transitional = config.transitional;
  if (transitional !== undefined) {
    validator.assertOptions(transitional, {
      silentJSONParsing: validators.transitional(validators["boolean"]),
      forcedJSONParsing: validators.transitional(validators["boolean"]),
      clarifyTimeoutError: validators.transitional(validators["boolean"])
    }, false);
  }

  // filter out skipped interceptors
  var requestInterceptorChain = [];
  var synchronousRequestInterceptors = true;
  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
      return;
    }
    synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;
    requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
  });
  var responseInterceptorChain = [];
  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
  });
  var promise;
  if (!synchronousRequestInterceptors) {
    var chain = [dispatchRequest, undefined];
    Array.prototype.unshift.apply(chain, requestInterceptorChain);
    chain = chain.concat(responseInterceptorChain);
    promise = Promise.resolve(config);
    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift());
    }
    return promise;
  }
  var newConfig = config;
  while (requestInterceptorChain.length) {
    var onFulfilled = requestInterceptorChain.shift();
    var onRejected = requestInterceptorChain.shift();
    try {
      newConfig = onFulfilled(newConfig);
    } catch (error) {
      onRejected(error);
      break;
    }
  }
  try {
    promise = dispatchRequest(newConfig);
  } catch (error) {
    return Promise.reject(error);
  }
  while (responseInterceptorChain.length) {
    promise = promise.then(responseInterceptorChain.shift(), responseInterceptorChain.shift());
  }
  return promise;
};
Axios.prototype.getUri = function getUri(config) {
  config = mergeConfig(this.defaults, config);
  var fullPath = buildFullPath(config.baseURL, config.url);
  return buildURL(fullPath, config.params, config.paramsSerializer);
};

// Provide aliases for supported request methods
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function (url, config) {
    return this.request(mergeConfig(config || {}, {
      method: method,
      url: url,
      data: (config || {}).data
    }));
  };
});
utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/

  function generateHTTPMethod(isForm) {
    return function httpMethod(url, data, config) {
      return this.request(mergeConfig(config || {}, {
        method: method,
        headers: isForm ? {
          'Content-Type': 'multipart/form-data'
        } : {},
        url: url,
        data: data
      }));
    };
  }
  Axios.prototype[method] = generateHTTPMethod();
  Axios.prototype[method + 'Form'] = generateHTTPMethod(true);
});
module.exports = Axios;

/***/ }),

/***/ "./node_modules/axios/lib/core/AxiosError.js":
/*!***************************************************!*\
  !*** ./node_modules/axios/lib/core/AxiosError.js ***!
  \***************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ../utils */ "./node_modules/axios/lib/utils.js");

/**
 * Create an Error with the specified message, config, error code, request and response.
 *
 * @param {string} message The error message.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [config] The config.
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The created error.
 */
function AxiosError(message, code, config, request, response) {
  Error.call(this);
  this.message = message;
  this.name = 'AxiosError';
  code && (this.code = code);
  config && (this.config = config);
  request && (this.request = request);
  response && (this.response = response);
}
utils.inherits(AxiosError, Error, {
  toJSON: function toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: this.config,
      code: this.code,
      status: this.response && this.response.status ? this.response.status : null
    };
  }
});
var prototype = AxiosError.prototype;
var descriptors = {};
['ERR_BAD_OPTION_VALUE', 'ERR_BAD_OPTION', 'ECONNABORTED', 'ETIMEDOUT', 'ERR_NETWORK', 'ERR_FR_TOO_MANY_REDIRECTS', 'ERR_DEPRECATED', 'ERR_BAD_RESPONSE', 'ERR_BAD_REQUEST', 'ERR_CANCELED'
// eslint-disable-next-line func-names
].forEach(function (code) {
  descriptors[code] = {
    value: code
  };
});
Object.defineProperties(AxiosError, descriptors);
Object.defineProperty(prototype, 'isAxiosError', {
  value: true
});

// eslint-disable-next-line func-names
AxiosError.from = function (error, code, config, request, response, customProps) {
  var axiosError = Object.create(prototype);
  utils.toFlatObject(error, axiosError, function filter(obj) {
    return obj !== Error.prototype;
  });
  AxiosError.call(axiosError, error.message, code, config, request, response);
  axiosError.name = error.name;
  customProps && Object.assign(axiosError, customProps);
  return axiosError;
};
module.exports = AxiosError;

/***/ }),

/***/ "./node_modules/axios/lib/core/InterceptorManager.js":
/*!***********************************************************!*\
  !*** ./node_modules/axios/lib/core/InterceptorManager.js ***!
  \***********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");
function InterceptorManager() {
  this.handlers = [];
}

/**
 * Add a new interceptor to the stack
 *
 * @param {Function} fulfilled The function to handle `then` for a `Promise`
 * @param {Function} rejected The function to handle `reject` for a `Promise`
 *
 * @return {Number} An ID used to remove interceptor later
 */
InterceptorManager.prototype.use = function use(fulfilled, rejected, options) {
  this.handlers.push({
    fulfilled: fulfilled,
    rejected: rejected,
    synchronous: options ? options.synchronous : false,
    runWhen: options ? options.runWhen : null
  });
  return this.handlers.length - 1;
};

/**
 * Remove an interceptor from the stack
 *
 * @param {Number} id The ID that was returned by `use`
 */
InterceptorManager.prototype.eject = function eject(id) {
  if (this.handlers[id]) {
    this.handlers[id] = null;
  }
};

/**
 * Iterate over all the registered interceptors
 *
 * This method is particularly useful for skipping over any
 * interceptors that may have become `null` calling `eject`.
 *
 * @param {Function} fn The function to call for each interceptor
 */
InterceptorManager.prototype.forEach = function forEach(fn) {
  utils.forEach(this.handlers, function forEachHandler(h) {
    if (h !== null) {
      fn(h);
    }
  });
};
module.exports = InterceptorManager;

/***/ }),

/***/ "./node_modules/axios/lib/core/buildFullPath.js":
/*!******************************************************!*\
  !*** ./node_modules/axios/lib/core/buildFullPath.js ***!
  \******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var isAbsoluteURL = __webpack_require__(/*! ../helpers/isAbsoluteURL */ "./node_modules/axios/lib/helpers/isAbsoluteURL.js");
var combineURLs = __webpack_require__(/*! ../helpers/combineURLs */ "./node_modules/axios/lib/helpers/combineURLs.js");

/**
 * Creates a new URL by combining the baseURL with the requestedURL,
 * only when the requestedURL is not already an absolute URL.
 * If the requestURL is absolute, this function returns the requestedURL untouched.
 *
 * @param {string} baseURL The base URL
 * @param {string} requestedURL Absolute or relative URL to combine
 * @returns {string} The combined full path
 */
module.exports = function buildFullPath(baseURL, requestedURL) {
  if (baseURL && !isAbsoluteURL(requestedURL)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
};

/***/ }),

/***/ "./node_modules/axios/lib/core/dispatchRequest.js":
/*!********************************************************!*\
  !*** ./node_modules/axios/lib/core/dispatchRequest.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");
var transformData = __webpack_require__(/*! ./transformData */ "./node_modules/axios/lib/core/transformData.js");
var isCancel = __webpack_require__(/*! ../cancel/isCancel */ "./node_modules/axios/lib/cancel/isCancel.js");
var defaults = __webpack_require__(/*! ../defaults */ "./node_modules/axios/lib/defaults/index.js");
var CanceledError = __webpack_require__(/*! ../cancel/CanceledError */ "./node_modules/axios/lib/cancel/CanceledError.js");

/**
 * Throws a `CanceledError` if cancellation has been requested.
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }
  if (config.signal && config.signal.aborted) {
    throw new CanceledError();
  }
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 * @returns {Promise} The Promise to be fulfilled
 */
module.exports = function dispatchRequest(config) {
  throwIfCancellationRequested(config);

  // Ensure headers exist
  config.headers = config.headers || {};

  // Transform request data
  config.data = transformData.call(config, config.data, config.headers, config.transformRequest);

  // Flatten headers
  config.headers = utils.merge(config.headers.common || {}, config.headers[config.method] || {}, config.headers);
  utils.forEach(['delete', 'get', 'head', 'post', 'put', 'patch', 'common'], function cleanHeaderConfig(method) {
    delete config.headers[method];
  });
  var adapter = config.adapter || defaults.adapter;
  return adapter(config).then(function onAdapterResolution(response) {
    throwIfCancellationRequested(config);

    // Transform response data
    response.data = transformData.call(config, response.data, response.headers, config.transformResponse);
    return response;
  }, function onAdapterRejection(reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);

      // Transform response data
      if (reason && reason.response) {
        reason.response.data = transformData.call(config, reason.response.data, reason.response.headers, config.transformResponse);
      }
    }
    return Promise.reject(reason);
  });
};

/***/ }),

/***/ "./node_modules/axios/lib/core/mergeConfig.js":
/*!****************************************************!*\
  !*** ./node_modules/axios/lib/core/mergeConfig.js ***!
  \****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ../utils */ "./node_modules/axios/lib/utils.js");

/**
 * Config-specific merge-function which creates a new config-object
 * by merging two configuration objects together.
 *
 * @param {Object} config1
 * @param {Object} config2
 * @returns {Object} New object resulting from merging config2 to config1
 */
module.exports = function mergeConfig(config1, config2) {
  // eslint-disable-next-line no-param-reassign
  config2 = config2 || {};
  var config = {};
  function getMergedValue(target, source) {
    if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
      return utils.merge(target, source);
    } else if (utils.isPlainObject(source)) {
      return utils.merge({}, source);
    } else if (utils.isArray(source)) {
      return source.slice();
    }
    return source;
  }

  // eslint-disable-next-line consistent-return
  function mergeDeepProperties(prop) {
    if (!utils.isUndefined(config2[prop])) {
      return getMergedValue(config1[prop], config2[prop]);
    } else if (!utils.isUndefined(config1[prop])) {
      return getMergedValue(undefined, config1[prop]);
    }
  }

  // eslint-disable-next-line consistent-return
  function valueFromConfig2(prop) {
    if (!utils.isUndefined(config2[prop])) {
      return getMergedValue(undefined, config2[prop]);
    }
  }

  // eslint-disable-next-line consistent-return
  function defaultToConfig2(prop) {
    if (!utils.isUndefined(config2[prop])) {
      return getMergedValue(undefined, config2[prop]);
    } else if (!utils.isUndefined(config1[prop])) {
      return getMergedValue(undefined, config1[prop]);
    }
  }

  // eslint-disable-next-line consistent-return
  function mergeDirectKeys(prop) {
    if (prop in config2) {
      return getMergedValue(config1[prop], config2[prop]);
    } else if (prop in config1) {
      return getMergedValue(undefined, config1[prop]);
    }
  }
  var mergeMap = {
    'url': valueFromConfig2,
    'method': valueFromConfig2,
    'data': valueFromConfig2,
    'baseURL': defaultToConfig2,
    'transformRequest': defaultToConfig2,
    'transformResponse': defaultToConfig2,
    'paramsSerializer': defaultToConfig2,
    'timeout': defaultToConfig2,
    'timeoutMessage': defaultToConfig2,
    'withCredentials': defaultToConfig2,
    'adapter': defaultToConfig2,
    'responseType': defaultToConfig2,
    'xsrfCookieName': defaultToConfig2,
    'xsrfHeaderName': defaultToConfig2,
    'onUploadProgress': defaultToConfig2,
    'onDownloadProgress': defaultToConfig2,
    'decompress': defaultToConfig2,
    'maxContentLength': defaultToConfig2,
    'maxBodyLength': defaultToConfig2,
    'beforeRedirect': defaultToConfig2,
    'transport': defaultToConfig2,
    'httpAgent': defaultToConfig2,
    'httpsAgent': defaultToConfig2,
    'cancelToken': defaultToConfig2,
    'socketPath': defaultToConfig2,
    'responseEncoding': defaultToConfig2,
    'validateStatus': mergeDirectKeys
  };
  utils.forEach(Object.keys(config1).concat(Object.keys(config2)), function computeConfigValue(prop) {
    var merge = mergeMap[prop] || mergeDeepProperties;
    var configValue = merge(prop);
    utils.isUndefined(configValue) && merge !== mergeDirectKeys || (config[prop] = configValue);
  });
  return config;
};

/***/ }),

/***/ "./node_modules/axios/lib/core/settle.js":
/*!***********************************************!*\
  !*** ./node_modules/axios/lib/core/settle.js ***!
  \***********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var AxiosError = __webpack_require__(/*! ./AxiosError */ "./node_modules/axios/lib/core/AxiosError.js");

/**
 * Resolve or reject a Promise based on response status.
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 */
module.exports = function settle(resolve, reject, response) {
  var validateStatus = response.config.validateStatus;
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    reject(new AxiosError('Request failed with status code ' + response.status, [AxiosError.ERR_BAD_REQUEST, AxiosError.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4], response.config, response.request, response));
  }
};

/***/ }),

/***/ "./node_modules/axios/lib/core/transformData.js":
/*!******************************************************!*\
  !*** ./node_modules/axios/lib/core/transformData.js ***!
  \******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");
var defaults = __webpack_require__(/*! ../defaults */ "./node_modules/axios/lib/defaults/index.js");

/**
 * Transform the data for a request or a response
 *
 * @param {Object|String} data The data to be transformed
 * @param {Array} headers The headers for the request or response
 * @param {Array|Function} fns A single function or Array of functions
 * @returns {*} The resulting transformed data
 */
module.exports = function transformData(data, headers, fns) {
  var context = this || defaults;
  /*eslint no-param-reassign:0*/
  utils.forEach(fns, function transform(fn) {
    data = fn.call(context, data, headers);
  });
  return data;
};

/***/ }),

/***/ "./node_modules/axios/lib/defaults/index.js":
/*!**************************************************!*\
  !*** ./node_modules/axios/lib/defaults/index.js ***!
  \**************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var process = __webpack_require__(/*! process/browser */ "./node_modules/process/browser.js");


var utils = __webpack_require__(/*! ../utils */ "./node_modules/axios/lib/utils.js");
var normalizeHeaderName = __webpack_require__(/*! ../helpers/normalizeHeaderName */ "./node_modules/axios/lib/helpers/normalizeHeaderName.js");
var AxiosError = __webpack_require__(/*! ../core/AxiosError */ "./node_modules/axios/lib/core/AxiosError.js");
var transitionalDefaults = __webpack_require__(/*! ./transitional */ "./node_modules/axios/lib/defaults/transitional.js");
var toFormData = __webpack_require__(/*! ../helpers/toFormData */ "./node_modules/axios/lib/helpers/toFormData.js");
var DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
};
function setContentTypeIfUnset(headers, value) {
  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
    headers['Content-Type'] = value;
  }
}
function getDefaultAdapter() {
  var adapter;
  if (typeof XMLHttpRequest !== 'undefined') {
    // For browsers use XHR adapter
    adapter = __webpack_require__(/*! ../adapters/xhr */ "./node_modules/axios/lib/adapters/xhr.js");
  } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
    // For node use HTTP adapter
    adapter = __webpack_require__(/*! ../adapters/http */ "./node_modules/axios/lib/adapters/xhr.js");
  }
  return adapter;
}
function stringifySafely(rawValue, parser, encoder) {
  if (utils.isString(rawValue)) {
    try {
      (parser || JSON.parse)(rawValue);
      return utils.trim(rawValue);
    } catch (e) {
      if (e.name !== 'SyntaxError') {
        throw e;
      }
    }
  }
  return (encoder || JSON.stringify)(rawValue);
}
var defaults = {
  transitional: transitionalDefaults,
  adapter: getDefaultAdapter(),
  transformRequest: [function transformRequest(data, headers) {
    normalizeHeaderName(headers, 'Accept');
    normalizeHeaderName(headers, 'Content-Type');
    if (utils.isFormData(data) || utils.isArrayBuffer(data) || utils.isBuffer(data) || utils.isStream(data) || utils.isFile(data) || utils.isBlob(data)) {
      return data;
    }
    if (utils.isArrayBufferView(data)) {
      return data.buffer;
    }
    if (utils.isURLSearchParams(data)) {
      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
      return data.toString();
    }
    var isObjectPayload = utils.isObject(data);
    var contentType = headers && headers['Content-Type'];
    var isFileList;
    if ((isFileList = utils.isFileList(data)) || isObjectPayload && contentType === 'multipart/form-data') {
      var _FormData = this.env && this.env.FormData;
      return toFormData(isFileList ? {
        'files[]': data
      } : data, _FormData && new _FormData());
    } else if (isObjectPayload || contentType === 'application/json') {
      setContentTypeIfUnset(headers, 'application/json');
      return stringifySafely(data);
    }
    return data;
  }],
  transformResponse: [function transformResponse(data) {
    var transitional = this.transitional || defaults.transitional;
    var silentJSONParsing = transitional && transitional.silentJSONParsing;
    var forcedJSONParsing = transitional && transitional.forcedJSONParsing;
    var strictJSONParsing = !silentJSONParsing && this.responseType === 'json';
    if (strictJSONParsing || forcedJSONParsing && utils.isString(data) && data.length) {
      try {
        return JSON.parse(data);
      } catch (e) {
        if (strictJSONParsing) {
          if (e.name === 'SyntaxError') {
            throw AxiosError.from(e, AxiosError.ERR_BAD_RESPONSE, this, null, this.response);
          }
          throw e;
        }
      }
    }
    return data;
  }],
  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  maxContentLength: -1,
  maxBodyLength: -1,
  env: {
    FormData: __webpack_require__(/*! ./env/FormData */ "./node_modules/axios/lib/helpers/null.js")
  },
  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  },
  headers: {
    common: {
      'Accept': 'application/json, text/plain, */*'
    }
  }
};
utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
  defaults.headers[method] = {};
});
utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
});
module.exports = defaults;

/***/ }),

/***/ "./node_modules/axios/lib/defaults/transitional.js":
/*!*********************************************************!*\
  !*** ./node_modules/axios/lib/defaults/transitional.js ***!
  \*********************************************************/
/***/ ((module) => {

"use strict";


module.exports = {
  silentJSONParsing: true,
  forcedJSONParsing: true,
  clarifyTimeoutError: false
};

/***/ }),

/***/ "./node_modules/axios/lib/env/data.js":
/*!********************************************!*\
  !*** ./node_modules/axios/lib/env/data.js ***!
  \********************************************/
/***/ ((module) => {

module.exports = {
  "version": "0.27.2"
};

/***/ }),

/***/ "./node_modules/axios/lib/helpers/bind.js":
/*!************************************************!*\
  !*** ./node_modules/axios/lib/helpers/bind.js ***!
  \************************************************/
/***/ ((module) => {

"use strict";


module.exports = function bind(fn, thisArg) {
  return function wrap() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    return fn.apply(thisArg, args);
  };
};

/***/ }),

/***/ "./node_modules/axios/lib/helpers/buildURL.js":
/*!****************************************************!*\
  !*** ./node_modules/axios/lib/helpers/buildURL.js ***!
  \****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");
function encode(val) {
  return encodeURIComponent(val).replace(/%3A/gi, ':').replace(/%24/g, '$').replace(/%2C/gi, ',').replace(/%20/g, '+').replace(/%5B/gi, '[').replace(/%5D/gi, ']');
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @returns {string} The formatted url
 */
module.exports = function buildURL(url, params, paramsSerializer) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }
  var serializedParams;
  if (paramsSerializer) {
    serializedParams = paramsSerializer(params);
  } else if (utils.isURLSearchParams(params)) {
    serializedParams = params.toString();
  } else {
    var parts = [];
    utils.forEach(params, function serialize(val, key) {
      if (val === null || typeof val === 'undefined') {
        return;
      }
      if (utils.isArray(val)) {
        key = key + '[]';
      } else {
        val = [val];
      }
      utils.forEach(val, function parseValue(v) {
        if (utils.isDate(v)) {
          v = v.toISOString();
        } else if (utils.isObject(v)) {
          v = JSON.stringify(v);
        }
        parts.push(encode(key) + '=' + encode(v));
      });
    });
    serializedParams = parts.join('&');
  }
  if (serializedParams) {
    var hashmarkIndex = url.indexOf('#');
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }
    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }
  return url;
};

/***/ }),

/***/ "./node_modules/axios/lib/helpers/combineURLs.js":
/*!*******************************************************!*\
  !*** ./node_modules/axios/lib/helpers/combineURLs.js ***!
  \*******************************************************/
/***/ ((module) => {

"use strict";


/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
module.exports = function combineURLs(baseURL, relativeURL) {
  return relativeURL ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '') : baseURL;
};

/***/ }),

/***/ "./node_modules/axios/lib/helpers/cookies.js":
/*!***************************************************!*\
  !*** ./node_modules/axios/lib/helpers/cookies.js ***!
  \***************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");
module.exports = utils.isStandardBrowserEnv() ?
// Standard browser envs support document.cookie
function standardBrowserEnv() {
  return {
    write: function write(name, value, expires, path, domain, secure) {
      var cookie = [];
      cookie.push(name + '=' + encodeURIComponent(value));
      if (utils.isNumber(expires)) {
        cookie.push('expires=' + new Date(expires).toGMTString());
      }
      if (utils.isString(path)) {
        cookie.push('path=' + path);
      }
      if (utils.isString(domain)) {
        cookie.push('domain=' + domain);
      }
      if (secure === true) {
        cookie.push('secure');
      }
      document.cookie = cookie.join('; ');
    },
    read: function read(name) {
      var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
      return match ? decodeURIComponent(match[3]) : null;
    },
    remove: function remove(name) {
      this.write(name, '', Date.now() - 86400000);
    }
  };
}() :
// Non standard browser env (web workers, react-native) lack needed support.
function nonStandardBrowserEnv() {
  return {
    write: function write() {},
    read: function read() {
      return null;
    },
    remove: function remove() {}
  };
}();

/***/ }),

/***/ "./node_modules/axios/lib/helpers/isAbsoluteURL.js":
/*!*********************************************************!*\
  !*** ./node_modules/axios/lib/helpers/isAbsoluteURL.js ***!
  \*********************************************************/
/***/ ((module) => {

"use strict";


/**
 * Determines whether the specified URL is absolute
 *
 * @param {string} url The URL to test
 * @returns {boolean} True if the specified URL is absolute, otherwise false
 */
module.exports = function isAbsoluteURL(url) {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
};

/***/ }),

/***/ "./node_modules/axios/lib/helpers/isAxiosError.js":
/*!********************************************************!*\
  !*** ./node_modules/axios/lib/helpers/isAxiosError.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");

/**
 * Determines whether the payload is an error thrown by Axios
 *
 * @param {*} payload The value to test
 * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
 */
module.exports = function isAxiosError(payload) {
  return utils.isObject(payload) && payload.isAxiosError === true;
};

/***/ }),

/***/ "./node_modules/axios/lib/helpers/isURLSameOrigin.js":
/*!***********************************************************!*\
  !*** ./node_modules/axios/lib/helpers/isURLSameOrigin.js ***!
  \***********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");
module.exports = utils.isStandardBrowserEnv() ?
// Standard browser envs have full support of the APIs needed to test
// whether the request URL is of the same origin as current location.
function standardBrowserEnv() {
  var msie = /(msie|trident)/i.test(navigator.userAgent);
  var urlParsingNode = document.createElement('a');
  var originURL;

  /**
  * Parse a URL to discover it's components
  *
  * @param {String} url The URL to be parsed
  * @returns {Object}
  */
  function resolveURL(url) {
    var href = url;
    if (msie) {
      // IE needs attribute set twice to normalize properties
      urlParsingNode.setAttribute('href', href);
      href = urlParsingNode.href;
    }
    urlParsingNode.setAttribute('href', href);

    // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
    return {
      href: urlParsingNode.href,
      protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
      host: urlParsingNode.host,
      search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
      hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
      hostname: urlParsingNode.hostname,
      port: urlParsingNode.port,
      pathname: urlParsingNode.pathname.charAt(0) === '/' ? urlParsingNode.pathname : '/' + urlParsingNode.pathname
    };
  }
  originURL = resolveURL(window.location.href);

  /**
  * Determine if a URL shares the same origin as the current location
  *
  * @param {String} requestURL The URL to test
  * @returns {boolean} True if URL shares the same origin, otherwise false
  */
  return function isURLSameOrigin(requestURL) {
    var parsed = utils.isString(requestURL) ? resolveURL(requestURL) : requestURL;
    return parsed.protocol === originURL.protocol && parsed.host === originURL.host;
  };
}() :
// Non standard browser envs (web workers, react-native) lack needed support.
function nonStandardBrowserEnv() {
  return function isURLSameOrigin() {
    return true;
  };
}();

/***/ }),

/***/ "./node_modules/axios/lib/helpers/normalizeHeaderName.js":
/*!***************************************************************!*\
  !*** ./node_modules/axios/lib/helpers/normalizeHeaderName.js ***!
  \***************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ../utils */ "./node_modules/axios/lib/utils.js");
module.exports = function normalizeHeaderName(headers, normalizedName) {
  utils.forEach(headers, function processHeader(value, name) {
    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
      headers[normalizedName] = value;
      delete headers[name];
    }
  });
};

/***/ }),

/***/ "./node_modules/axios/lib/helpers/null.js":
/*!************************************************!*\
  !*** ./node_modules/axios/lib/helpers/null.js ***!
  \************************************************/
/***/ ((module) => {

// eslint-disable-next-line strict
module.exports = null;

/***/ }),

/***/ "./node_modules/axios/lib/helpers/parseHeaders.js":
/*!********************************************************!*\
  !*** ./node_modules/axios/lib/helpers/parseHeaders.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");

// Headers whose duplicates are ignored by node
// c.f. https://nodejs.org/api/http.html#http_message_headers
var ignoreDuplicateOf = ['age', 'authorization', 'content-length', 'content-type', 'etag', 'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since', 'last-modified', 'location', 'max-forwards', 'proxy-authorization', 'referer', 'retry-after', 'user-agent'];

/**
 * Parse headers into an object
 *
 * ```
 * Date: Wed, 27 Aug 2014 08:58:49 GMT
 * Content-Type: application/json
 * Connection: keep-alive
 * Transfer-Encoding: chunked
 * ```
 *
 * @param {String} headers Headers needing to be parsed
 * @returns {Object} Headers parsed into an object
 */
module.exports = function parseHeaders(headers) {
  var parsed = {};
  var key;
  var val;
  var i;
  if (!headers) {
    return parsed;
  }
  utils.forEach(headers.split('\n'), function parser(line) {
    i = line.indexOf(':');
    key = utils.trim(line.substr(0, i)).toLowerCase();
    val = utils.trim(line.substr(i + 1));
    if (key) {
      if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
        return;
      }
      if (key === 'set-cookie') {
        parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
      } else {
        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
      }
    }
  });
  return parsed;
};

/***/ }),

/***/ "./node_modules/axios/lib/helpers/parseProtocol.js":
/*!*********************************************************!*\
  !*** ./node_modules/axios/lib/helpers/parseProtocol.js ***!
  \*********************************************************/
/***/ ((module) => {

"use strict";


module.exports = function parseProtocol(url) {
  var match = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url);
  return match && match[1] || '';
};

/***/ }),

/***/ "./node_modules/axios/lib/helpers/spread.js":
/*!**************************************************!*\
  !*** ./node_modules/axios/lib/helpers/spread.js ***!
  \**************************************************/
/***/ ((module) => {

"use strict";


/**
 * Syntactic sugar for invoking a function and expanding an array for arguments.
 *
 * Common use case would be to use `Function.prototype.apply`.
 *
 *  ```js
 *  function f(x, y, z) {}
 *  var args = [1, 2, 3];
 *  f.apply(null, args);
 *  ```
 *
 * With `spread` this example can be re-written.
 *
 *  ```js
 *  spread(function(x, y, z) {})([1, 2, 3]);
 *  ```
 *
 * @param {Function} callback
 * @returns {Function}
 */
module.exports = function spread(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
};

/***/ }),

/***/ "./node_modules/axios/lib/helpers/toFormData.js":
/*!******************************************************!*\
  !*** ./node_modules/axios/lib/helpers/toFormData.js ***!
  \******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var Buffer = __webpack_require__(/*! buffer */ "./node_modules/buffer/index.js")["Buffer"];


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var utils = __webpack_require__(/*! ../utils */ "./node_modules/axios/lib/utils.js");

/**
 * Convert a data object to FormData
 * @param {Object} obj
 * @param {?Object} [formData]
 * @returns {Object}
 **/

function toFormData(obj, formData) {
  // eslint-disable-next-line no-param-reassign
  formData = formData || new FormData();
  var stack = [];
  function convertValue(value) {
    if (value === null) return '';
    if (utils.isDate(value)) {
      return value.toISOString();
    }
    if (utils.isArrayBuffer(value) || utils.isTypedArray(value)) {
      return typeof Blob === 'function' ? new Blob([value]) : Buffer.from(value);
    }
    return value;
  }
  function build(data, parentKey) {
    if (utils.isPlainObject(data) || utils.isArray(data)) {
      if (stack.indexOf(data) !== -1) {
        throw Error('Circular reference detected in ' + parentKey);
      }
      stack.push(data);
      utils.forEach(data, function each(value, key) {
        if (utils.isUndefined(value)) return;
        var fullKey = parentKey ? parentKey + '.' + key : key;
        var arr;
        if (value && !parentKey && _typeof(value) === 'object') {
          if (utils.endsWith(key, '{}')) {
            // eslint-disable-next-line no-param-reassign
            value = JSON.stringify(value);
          } else if (utils.endsWith(key, '[]') && (arr = utils.toArray(value))) {
            // eslint-disable-next-line func-names
            arr.forEach(function (el) {
              !utils.isUndefined(el) && formData.append(fullKey, convertValue(el));
            });
            return;
          }
        }
        build(value, fullKey);
      });
      stack.pop();
    } else {
      formData.append(parentKey, convertValue(data));
    }
  }
  build(obj);
  return formData;
}
module.exports = toFormData;

/***/ }),

/***/ "./node_modules/axios/lib/helpers/validator.js":
/*!*****************************************************!*\
  !*** ./node_modules/axios/lib/helpers/validator.js ***!
  \*****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var VERSION = (__webpack_require__(/*! ../env/data */ "./node_modules/axios/lib/env/data.js").version);
var AxiosError = __webpack_require__(/*! ../core/AxiosError */ "./node_modules/axios/lib/core/AxiosError.js");
var validators = {};

// eslint-disable-next-line func-names
['object', 'boolean', 'number', 'function', 'string', 'symbol'].forEach(function (type, i) {
  validators[type] = function validator(thing) {
    return _typeof(thing) === type || 'a' + (i < 1 ? 'n ' : ' ') + type;
  };
});
var deprecatedWarnings = {};

/**
 * Transitional option validator
 * @param {function|boolean?} validator - set to false if the transitional option has been removed
 * @param {string?} version - deprecated version / removed since version
 * @param {string?} message - some message with additional info
 * @returns {function}
 */
validators.transitional = function transitional(validator, version, message) {
  function formatMessage(opt, desc) {
    return '[Axios v' + VERSION + '] Transitional option \'' + opt + '\'' + desc + (message ? '. ' + message : '');
  }

  // eslint-disable-next-line func-names
  return function (value, opt, opts) {
    if (validator === false) {
      throw new AxiosError(formatMessage(opt, ' has been removed' + (version ? ' in ' + version : '')), AxiosError.ERR_DEPRECATED);
    }
    if (version && !deprecatedWarnings[opt]) {
      deprecatedWarnings[opt] = true;
      // eslint-disable-next-line no-console
      console.warn(formatMessage(opt, ' has been deprecated since v' + version + ' and will be removed in the near future'));
    }
    return validator ? validator(value, opt, opts) : true;
  };
};

/**
 * Assert object's properties type
 * @param {object} options
 * @param {object} schema
 * @param {boolean?} allowUnknown
 */

function assertOptions(options, schema, allowUnknown) {
  if (_typeof(options) !== 'object') {
    throw new AxiosError('options must be an object', AxiosError.ERR_BAD_OPTION_VALUE);
  }
  var keys = Object.keys(options);
  var i = keys.length;
  while (i-- > 0) {
    var opt = keys[i];
    var validator = schema[opt];
    if (validator) {
      var value = options[opt];
      var result = value === undefined || validator(value, opt, options);
      if (result !== true) {
        throw new AxiosError('option ' + opt + ' must be ' + result, AxiosError.ERR_BAD_OPTION_VALUE);
      }
      continue;
    }
    if (allowUnknown !== true) {
      throw new AxiosError('Unknown option ' + opt, AxiosError.ERR_BAD_OPTION);
    }
  }
}
module.exports = {
  assertOptions: assertOptions,
  validators: validators
};

/***/ }),

/***/ "./node_modules/axios/lib/utils.js":
/*!*****************************************!*\
  !*** ./node_modules/axios/lib/utils.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var bind = __webpack_require__(/*! ./helpers/bind */ "./node_modules/axios/lib/helpers/bind.js");

// utils is a library of generic helper functions non-specific to axios

var toString = Object.prototype.toString;

// eslint-disable-next-line func-names
var kindOf = function (cache) {
  // eslint-disable-next-line func-names
  return function (thing) {
    var str = toString.call(thing);
    return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
  };
}(Object.create(null));
function kindOfTest(type) {
  type = type.toLowerCase();
  return function isKindOf(thing) {
    return kindOf(thing) === type;
  };
}

/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Array, otherwise false
 */
function isArray(val) {
  return Array.isArray(val);
}

/**
 * Determine if a value is undefined
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if the value is undefined, otherwise false
 */
function isUndefined(val) {
  return typeof val === 'undefined';
}

/**
 * Determine if a value is a Buffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Buffer, otherwise false
 */
function isBuffer(val) {
  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor) && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
}

/**
 * Determine if a value is an ArrayBuffer
 *
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
 */
var isArrayBuffer = kindOfTest('ArrayBuffer');

/**
 * Determine if a value is a view on an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */
function isArrayBufferView(val) {
  var result;
  if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView) {
    result = ArrayBuffer.isView(val);
  } else {
    result = val && val.buffer && isArrayBuffer(val.buffer);
  }
  return result;
}

/**
 * Determine if a value is a String
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a String, otherwise false
 */
function isString(val) {
  return typeof val === 'string';
}

/**
 * Determine if a value is a Number
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Number, otherwise false
 */
function isNumber(val) {
  return typeof val === 'number';
}

/**
 * Determine if a value is an Object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Object, otherwise false
 */
function isObject(val) {
  return val !== null && _typeof(val) === 'object';
}

/**
 * Determine if a value is a plain Object
 *
 * @param {Object} val The value to test
 * @return {boolean} True if value is a plain Object, otherwise false
 */
function isPlainObject(val) {
  if (kindOf(val) !== 'object') {
    return false;
  }
  var prototype = Object.getPrototypeOf(val);
  return prototype === null || prototype === Object.prototype;
}

/**
 * Determine if a value is a Date
 *
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Date, otherwise false
 */
var isDate = kindOfTest('Date');

/**
 * Determine if a value is a File
 *
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a File, otherwise false
 */
var isFile = kindOfTest('File');

/**
 * Determine if a value is a Blob
 *
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Blob, otherwise false
 */
var isBlob = kindOfTest('Blob');

/**
 * Determine if a value is a FileList
 *
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a File, otherwise false
 */
var isFileList = kindOfTest('FileList');

/**
 * Determine if a value is a Function
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Function, otherwise false
 */
function isFunction(val) {
  return toString.call(val) === '[object Function]';
}

/**
 * Determine if a value is a Stream
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Stream, otherwise false
 */
function isStream(val) {
  return isObject(val) && isFunction(val.pipe);
}

/**
 * Determine if a value is a FormData
 *
 * @param {Object} thing The value to test
 * @returns {boolean} True if value is an FormData, otherwise false
 */
function isFormData(thing) {
  var pattern = '[object FormData]';
  return thing && (typeof FormData === 'function' && thing instanceof FormData || toString.call(thing) === pattern || isFunction(thing.toString) && thing.toString() === pattern);
}

/**
 * Determine if a value is a URLSearchParams object
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */
var isURLSearchParams = kindOfTest('URLSearchParams');

/**
 * Trim excess whitespace off the beginning and end of a string
 *
 * @param {String} str The String to trim
 * @returns {String} The String freed of excess whitespace
 */
function trim(str) {
  return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
}

/**
 * Determine if we're running in a standard browser environment
 *
 * This allows axios to run in a web worker, and react-native.
 * Both environments support XMLHttpRequest, but not fully standard globals.
 *
 * web workers:
 *  typeof window -> undefined
 *  typeof document -> undefined
 *
 * react-native:
 *  navigator.product -> 'ReactNative'
 * nativescript
 *  navigator.product -> 'NativeScript' or 'NS'
 */
function isStandardBrowserEnv() {
  if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' || navigator.product === 'NativeScript' || navigator.product === 'NS')) {
    return false;
  }
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 */
function forEach(obj, fn) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return;
  }

  // Force an array if not already something iterable
  if (_typeof(obj) !== 'object') {
    /*eslint no-param-reassign:0*/
    obj = [obj];
  }
  if (isArray(obj)) {
    // Iterate over array values
    for (var i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    // Iterate over object keys
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        fn.call(null, obj[key], key, obj);
      }
    }
  }
}

/**
 * Accepts varargs expecting each argument to be an object, then
 * immutably merges the properties of each object and returns result.
 *
 * When multiple objects contain the same key the later object in
 * the arguments list will take precedence.
 *
 * Example:
 *
 * ```js
 * var result = merge({foo: 123}, {foo: 456});
 * console.log(result.foo); // outputs 456
 * ```
 *
 * @param {Object} obj1 Object to merge
 * @returns {Object} Result of all merge properties
 */
function merge(/* obj1, obj2, obj3, ... */
) {
  var result = {};
  function assignValue(val, key) {
    if (isPlainObject(result[key]) && isPlainObject(val)) {
      result[key] = merge(result[key], val);
    } else if (isPlainObject(val)) {
      result[key] = merge({}, val);
    } else if (isArray(val)) {
      result[key] = val.slice();
    } else {
      result[key] = val;
    }
  }
  for (var i = 0, l = arguments.length; i < l; i++) {
    forEach(arguments[i], assignValue);
  }
  return result;
}

/**
 * Extends object a by mutably adding to it the properties of object b.
 *
 * @param {Object} a The object to be extended
 * @param {Object} b The object to copy properties from
 * @param {Object} thisArg The object to bind function to
 * @return {Object} The resulting value of object a
 */
function extend(a, b, thisArg) {
  forEach(b, function assignValue(val, key) {
    if (thisArg && typeof val === 'function') {
      a[key] = bind(val, thisArg);
    } else {
      a[key] = val;
    }
  });
  return a;
}

/**
 * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
 *
 * @param {string} content with BOM
 * @return {string} content value without BOM
 */
function stripBOM(content) {
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return content;
}

/**
 * Inherit the prototype methods from one constructor into another
 * @param {function} constructor
 * @param {function} superConstructor
 * @param {object} [props]
 * @param {object} [descriptors]
 */

function inherits(constructor, superConstructor, props, descriptors) {
  constructor.prototype = Object.create(superConstructor.prototype, descriptors);
  constructor.prototype.constructor = constructor;
  props && Object.assign(constructor.prototype, props);
}

/**
 * Resolve object with deep prototype chain to a flat object
 * @param {Object} sourceObj source object
 * @param {Object} [destObj]
 * @param {Function} [filter]
 * @returns {Object}
 */

function toFlatObject(sourceObj, destObj, filter) {
  var props;
  var i;
  var prop;
  var merged = {};
  destObj = destObj || {};
  do {
    props = Object.getOwnPropertyNames(sourceObj);
    i = props.length;
    while (i-- > 0) {
      prop = props[i];
      if (!merged[prop]) {
        destObj[prop] = sourceObj[prop];
        merged[prop] = true;
      }
    }
    sourceObj = Object.getPrototypeOf(sourceObj);
  } while (sourceObj && (!filter || filter(sourceObj, destObj)) && sourceObj !== Object.prototype);
  return destObj;
}

/*
 * determines whether a string ends with the characters of a specified string
 * @param {String} str
 * @param {String} searchString
 * @param {Number} [position= 0]
 * @returns {boolean}
 */
function endsWith(str, searchString, position) {
  str = String(str);
  if (position === undefined || position > str.length) {
    position = str.length;
  }
  position -= searchString.length;
  var lastIndex = str.indexOf(searchString, position);
  return lastIndex !== -1 && lastIndex === position;
}

/**
 * Returns new array from array like object
 * @param {*} [thing]
 * @returns {Array}
 */
function toArray(thing) {
  if (!thing) return null;
  var i = thing.length;
  if (isUndefined(i)) return null;
  var arr = new Array(i);
  while (i-- > 0) {
    arr[i] = thing[i];
  }
  return arr;
}

// eslint-disable-next-line func-names
var isTypedArray = function (TypedArray) {
  // eslint-disable-next-line func-names
  return function (thing) {
    return TypedArray && thing instanceof TypedArray;
  };
}(typeof Uint8Array !== 'undefined' && Object.getPrototypeOf(Uint8Array));
module.exports = {
  isArray: isArray,
  isArrayBuffer: isArrayBuffer,
  isBuffer: isBuffer,
  isFormData: isFormData,
  isArrayBufferView: isArrayBufferView,
  isString: isString,
  isNumber: isNumber,
  isObject: isObject,
  isPlainObject: isPlainObject,
  isUndefined: isUndefined,
  isDate: isDate,
  isFile: isFile,
  isBlob: isBlob,
  isFunction: isFunction,
  isStream: isStream,
  isURLSearchParams: isURLSearchParams,
  isStandardBrowserEnv: isStandardBrowserEnv,
  forEach: forEach,
  merge: merge,
  extend: extend,
  trim: trim,
  stripBOM: stripBOM,
  inherits: inherits,
  toFlatObject: toFlatObject,
  kindOf: kindOf,
  kindOfTest: kindOfTest,
  endsWith: endsWith,
  toArray: toArray,
  isTypedArray: isTypedArray,
  isFileList: isFileList
};

/***/ }),

/***/ "./node_modules/balanced-match/index.js":
/*!**********************************************!*\
  !*** ./node_modules/balanced-match/index.js ***!
  \**********************************************/
/***/ ((module) => {

"use strict";


module.exports = balanced;
function balanced(a, b, str) {
  if (a instanceof RegExp) a = maybeMatch(a, str);
  if (b instanceof RegExp) b = maybeMatch(b, str);
  var r = range(a, b, str);
  return r && {
    start: r[0],
    end: r[1],
    pre: str.slice(0, r[0]),
    body: str.slice(r[0] + a.length, r[1]),
    post: str.slice(r[1] + b.length)
  };
}
function maybeMatch(reg, str) {
  var m = str.match(reg);
  return m ? m[0] : null;
}
balanced.range = range;
function range(a, b, str) {
  var begs, beg, left, right, result;
  var ai = str.indexOf(a);
  var bi = str.indexOf(b, ai + 1);
  var i = ai;
  if (ai >= 0 && bi > 0) {
    if (a === b) {
      return [ai, bi];
    }
    begs = [];
    left = str.length;
    while (i >= 0 && !result) {
      if (i == ai) {
        begs.push(i);
        ai = str.indexOf(a, i + 1);
      } else if (begs.length == 1) {
        result = [begs.pop(), bi];
      } else {
        beg = begs.pop();
        if (beg < left) {
          left = beg;
          right = bi;
        }
        bi = str.indexOf(b, i + 1);
      }
      i = ai < bi && ai >= 0 ? ai : bi;
    }
    if (begs.length) {
      result = [left, right];
    }
  }
  return result;
}

/***/ }),

/***/ "./node_modules/base-64/base64.js":
/*!****************************************!*\
  !*** ./node_modules/base-64/base64.js ***!
  \****************************************/
/***/ (function(module, exports, __webpack_require__) {

/* module decorator */ module = __webpack_require__.nmd(module);
var __WEBPACK_AMD_DEFINE_RESULT__;function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
/*! https://mths.be/base64 v1.0.0 by @mathias | MIT license */
;
(function (root) {
  // Detect free variables `exports`.
  var freeExports = ( false ? 0 : _typeof(exports)) == 'object' && exports;

  // Detect free variable `module`.
  var freeModule = ( false ? 0 : _typeof(module)) == 'object' && module && module.exports == freeExports && module;

  // Detect free variable `global`, from Node.js or Browserified code, and use
  // it as `root`.
  var freeGlobal = (typeof __webpack_require__.g === "undefined" ? "undefined" : _typeof(__webpack_require__.g)) == 'object' && __webpack_require__.g;
  if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
    root = freeGlobal;
  }

  /*--------------------------------------------------------------------------*/

  var InvalidCharacterError = function InvalidCharacterError(message) {
    this.message = message;
  };
  InvalidCharacterError.prototype = new Error();
  InvalidCharacterError.prototype.name = 'InvalidCharacterError';
  var error = function error(message) {
    // Note: the error messages used throughout this file match those used by
    // the native `atob`/`btoa` implementation in Chromium.
    throw new InvalidCharacterError(message);
  };
  var TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  // http://whatwg.org/html/common-microsyntaxes.html#space-character
  var REGEX_SPACE_CHARACTERS = /[\t\n\f\r ]/g;

  // `decode` is designed to be fully compatible with `atob` as described in the
  // HTML Standard. http://whatwg.org/html/webappapis.html#dom-windowbase64-atob
  // The optimized base64-decoding algorithm used is based on @atk’s excellent
  // implementation. https://gist.github.com/atk/1020396
  var decode = function decode(input) {
    input = String(input).replace(REGEX_SPACE_CHARACTERS, '');
    var length = input.length;
    if (length % 4 == 0) {
      input = input.replace(/==?$/, '');
      length = input.length;
    }
    if (length % 4 == 1 ||
    // http://whatwg.org/C#alphanumeric-ascii-characters
    /[^+a-zA-Z0-9/]/.test(input)) {
      error('Invalid character: the string to be decoded is not correctly encoded.');
    }
    var bitCounter = 0;
    var bitStorage;
    var buffer;
    var output = '';
    var position = -1;
    while (++position < length) {
      buffer = TABLE.indexOf(input.charAt(position));
      bitStorage = bitCounter % 4 ? bitStorage * 64 + buffer : buffer;
      // Unless this is the first of a group of 4 characters…
      if (bitCounter++ % 4) {
        // …convert the first 8 bits to a single ASCII character.
        output += String.fromCharCode(0xFF & bitStorage >> (-2 * bitCounter & 6));
      }
    }
    return output;
  };

  // `encode` is designed to be fully compatible with `btoa` as described in the
  // HTML Standard: http://whatwg.org/html/webappapis.html#dom-windowbase64-btoa
  var encode = function encode(input) {
    input = String(input);
    if (/[^\0-\xFF]/.test(input)) {
      // Note: no need to special-case astral symbols here, as surrogates are
      // matched, and the input is supposed to only contain ASCII anyway.
      error('The string to be encoded contains characters outside of the ' + 'Latin1 range.');
    }
    var padding = input.length % 3;
    var output = '';
    var position = -1;
    var a;
    var b;
    var c;
    var buffer;
    // Make sure any padding is handled outside of the loop.
    var length = input.length - padding;
    while (++position < length) {
      // Read three bytes, i.e. 24 bits.
      a = input.charCodeAt(position) << 16;
      b = input.charCodeAt(++position) << 8;
      c = input.charCodeAt(++position);
      buffer = a + b + c;
      // Turn the 24 bits into four chunks of 6 bits each, and append the
      // matching character for each of them to the output.
      output += TABLE.charAt(buffer >> 18 & 0x3F) + TABLE.charAt(buffer >> 12 & 0x3F) + TABLE.charAt(buffer >> 6 & 0x3F) + TABLE.charAt(buffer & 0x3F);
    }
    if (padding == 2) {
      a = input.charCodeAt(position) << 8;
      b = input.charCodeAt(++position);
      buffer = a + b;
      output += TABLE.charAt(buffer >> 10) + TABLE.charAt(buffer >> 4 & 0x3F) + TABLE.charAt(buffer << 2 & 0x3F) + '=';
    } else if (padding == 1) {
      buffer = input.charCodeAt(position);
      output += TABLE.charAt(buffer >> 2) + TABLE.charAt(buffer << 4 & 0x3F) + '==';
    }
    return output;
  };
  var base64 = {
    'encode': encode,
    'decode': decode,
    'version': '1.0.0'
  };

  // Some AMD build optimizers, like r.js, check for specific condition patterns
  // like the following:
  if ( true && _typeof(__webpack_require__.amdO) == 'object' && __webpack_require__.amdO) {
    !(__WEBPACK_AMD_DEFINE_RESULT__ = (function () {
      return base64;
    }).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else if (freeExports && !freeExports.nodeType) {
    if (freeModule) {
      // in Node.js or RingoJS v0.8.0+
      freeModule.exports = base64;
    } else {
      // in Narwhal or RingoJS v0.7.0-
      for (var key in base64) {
        base64.hasOwnProperty(key) && (freeExports[key] = base64[key]);
      }
    }
  } else {
    // in Rhino or a web browser
    root.base64 = base64;
  }
})(this);

/***/ }),

/***/ "./node_modules/base64-js/index.js":
/*!*****************************************!*\
  !*** ./node_modules/base64-js/index.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


exports.byteLength = byteLength;
exports.toByteArray = toByteArray;
exports.fromByteArray = fromByteArray;
var lookup = [];
var revLookup = [];
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i];
  revLookup[code.charCodeAt(i)] = i;
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62;
revLookup['_'.charCodeAt(0)] = 63;
function getLens(b64) {
  var len = b64.length;
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4');
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=');
  if (validLen === -1) validLen = len;
  var placeHoldersLen = validLen === len ? 0 : 4 - validLen % 4;
  return [validLen, placeHoldersLen];
}

// base64 is 4/3 + up to two characters of the original data
function byteLength(b64) {
  var lens = getLens(b64);
  var validLen = lens[0];
  var placeHoldersLen = lens[1];
  return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
}
function _byteLength(b64, validLen, placeHoldersLen) {
  return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
}
function toByteArray(b64) {
  var tmp;
  var lens = getLens(b64);
  var validLen = lens[0];
  var placeHoldersLen = lens[1];
  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
  var curByte = 0;

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0 ? validLen - 4 : validLen;
  var i;
  for (i = 0; i < len; i += 4) {
    tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
    arr[curByte++] = tmp >> 16 & 0xFF;
    arr[curByte++] = tmp >> 8 & 0xFF;
    arr[curByte++] = tmp & 0xFF;
  }
  if (placeHoldersLen === 2) {
    tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
    arr[curByte++] = tmp & 0xFF;
  }
  if (placeHoldersLen === 1) {
    tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
    arr[curByte++] = tmp >> 8 & 0xFF;
    arr[curByte++] = tmp & 0xFF;
  }
  return arr;
}
function tripletToBase64(num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
}
function encodeChunk(uint8, start, end) {
  var tmp;
  var output = [];
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16 & 0xFF0000) + (uint8[i + 1] << 8 & 0xFF00) + (uint8[i + 2] & 0xFF);
    output.push(tripletToBase64(tmp));
  }
  return output.join('');
}
function fromByteArray(uint8) {
  var tmp;
  var len = uint8.length;
  var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
  var parts = [];
  var maxChunkLength = 16383; // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1];
    parts.push(lookup[tmp >> 2] + lookup[tmp << 4 & 0x3F] + '==');
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1];
    parts.push(lookup[tmp >> 10] + lookup[tmp >> 4 & 0x3F] + lookup[tmp << 2 & 0x3F] + '=');
  }
  return parts.join('');
}

/***/ }),

/***/ "./node_modules/brace-expansion/index.js":
/*!***********************************************!*\
  !*** ./node_modules/brace-expansion/index.js ***!
  \***********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var balanced = __webpack_require__(/*! balanced-match */ "./node_modules/balanced-match/index.js");
module.exports = expandTop;
var escSlash = '\0SLASH' + Math.random() + '\0';
var escOpen = '\0OPEN' + Math.random() + '\0';
var escClose = '\0CLOSE' + Math.random() + '\0';
var escComma = '\0COMMA' + Math.random() + '\0';
var escPeriod = '\0PERIOD' + Math.random() + '\0';
function numeric(str) {
  return parseInt(str, 10) == str ? parseInt(str, 10) : str.charCodeAt(0);
}
function escapeBraces(str) {
  return str.split('\\\\').join(escSlash).split('\\{').join(escOpen).split('\\}').join(escClose).split('\\,').join(escComma).split('\\.').join(escPeriod);
}
function unescapeBraces(str) {
  return str.split(escSlash).join('\\').split(escOpen).join('{').split(escClose).join('}').split(escComma).join(',').split(escPeriod).join('.');
}

// Basically just str.split(","), but handling cases
// where we have nested braced sections, which should be
// treated as individual members, like {a,{b,c},d}
function parseCommaParts(str) {
  if (!str) return [''];
  var parts = [];
  var m = balanced('{', '}', str);
  if (!m) return str.split(',');
  var pre = m.pre;
  var body = m.body;
  var post = m.post;
  var p = pre.split(',');
  p[p.length - 1] += '{' + body + '}';
  var postParts = parseCommaParts(post);
  if (post.length) {
    p[p.length - 1] += postParts.shift();
    p.push.apply(p, postParts);
  }
  parts.push.apply(parts, p);
  return parts;
}
function expandTop(str) {
  if (!str) return [];

  // I don't know why Bash 4.3 does this, but it does.
  // Anything starting with {} will have the first two bytes preserved
  // but *only* at the top level, so {},a}b will not expand to anything,
  // but a{},b}c will be expanded to [a}c,abc].
  // One could argue that this is a bug in Bash, but since the goal of
  // this module is to match Bash's rules, we escape a leading {}
  if (str.substr(0, 2) === '{}') {
    str = '\\{\\}' + str.substr(2);
  }
  return expand(escapeBraces(str), true).map(unescapeBraces);
}
function embrace(str) {
  return '{' + str + '}';
}
function isPadded(el) {
  return /^-?0\d/.test(el);
}
function lte(i, y) {
  return i <= y;
}
function gte(i, y) {
  return i >= y;
}
function expand(str, isTop) {
  var expansions = [];
  var m = balanced('{', '}', str);
  if (!m) return [str];

  // no need to expand pre, since it is guaranteed to be free of brace-sets
  var pre = m.pre;
  var post = m.post.length ? expand(m.post, false) : [''];
  if (/\$$/.test(m.pre)) {
    for (var k = 0; k < post.length; k++) {
      var expansion = pre + '{' + m.body + '}' + post[k];
      expansions.push(expansion);
    }
  } else {
    var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
    var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
    var isSequence = isNumericSequence || isAlphaSequence;
    var isOptions = m.body.indexOf(',') >= 0;
    if (!isSequence && !isOptions) {
      // {a},b}
      if (m.post.match(/,(?!,).*\}/)) {
        str = m.pre + '{' + m.body + escClose + m.post;
        return expand(str);
      }
      return [str];
    }
    var n;
    if (isSequence) {
      n = m.body.split(/\.\./);
    } else {
      n = parseCommaParts(m.body);
      if (n.length === 1) {
        // x{{a,b}}y ==> x{a}y x{b}y
        n = expand(n[0], false).map(embrace);
        if (n.length === 1) {
          return post.map(function (p) {
            return m.pre + n[0] + p;
          });
        }
      }
    }

    // at this point, n is the parts, and we know it's not a comma set
    // with a single entry.
    var N;
    if (isSequence) {
      var x = numeric(n[0]);
      var y = numeric(n[1]);
      var width = Math.max(n[0].length, n[1].length);
      var incr = n.length == 3 ? Math.abs(numeric(n[2])) : 1;
      var test = lte;
      var reverse = y < x;
      if (reverse) {
        incr *= -1;
        test = gte;
      }
      var pad = n.some(isPadded);
      N = [];
      for (var i = x; test(i, y); i += incr) {
        var c;
        if (isAlphaSequence) {
          c = String.fromCharCode(i);
          if (c === '\\') c = '';
        } else {
          c = String(i);
          if (pad) {
            var need = width - c.length;
            if (need > 0) {
              var z = new Array(need + 1).join('0');
              if (i < 0) c = '-' + z + c.slice(1);else c = z + c;
            }
          }
        }
        N.push(c);
      }
    } else {
      N = [];
      for (var j = 0; j < n.length; j++) {
        N.push.apply(N, expand(n[j], false));
      }
    }
    for (var j = 0; j < N.length; j++) {
      for (var k = 0; k < post.length; k++) {
        var expansion = pre + N[j] + post[k];
        if (!isTop || isSequence || expansion) expansions.push(expansion);
      }
    }
  }
  return expansions;
}

/***/ }),

/***/ "./node_modules/buffer/index.js":
/*!**************************************!*\
  !*** ./node_modules/buffer/index.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */



function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var base64 = __webpack_require__(/*! base64-js */ "./node_modules/base64-js/index.js");
var ieee754 = __webpack_require__(/*! ieee754 */ "./node_modules/ieee754/index.js");
var customInspectSymbol = typeof Symbol === 'function' && typeof Symbol['for'] === 'function' // eslint-disable-line dot-notation
? Symbol['for']('nodejs.util.inspect.custom') // eslint-disable-line dot-notation
: null;
exports.Buffer = Buffer;
exports.SlowBuffer = SlowBuffer;
exports.INSPECT_MAX_BYTES = 50;
var K_MAX_LENGTH = 0x7fffffff;
exports.kMaxLength = K_MAX_LENGTH;

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport();
if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' && typeof console.error === 'function') {
  console.error('This browser lacks typed array (Uint8Array) support which is required by ' + '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.');
}
function typedArraySupport() {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1);
    var proto = {
      foo: function foo() {
        return 42;
      }
    };
    Object.setPrototypeOf(proto, Uint8Array.prototype);
    Object.setPrototypeOf(arr, proto);
    return arr.foo() === 42;
  } catch (e) {
    return false;
  }
}
Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function get() {
    if (!Buffer.isBuffer(this)) return undefined;
    return this.buffer;
  }
});
Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function get() {
    if (!Buffer.isBuffer(this)) return undefined;
    return this.byteOffset;
  }
});
function createBuffer(length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"');
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length);
  Object.setPrototypeOf(buf, Buffer.prototype);
  return buf;
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer(arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError('The "string" argument must be of type string. Received type number');
    }
    return allocUnsafe(arg);
  }
  return from(arg, encodingOrOffset, length);
}
Buffer.poolSize = 8192; // not used by this implementation

function from(value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset);
  }
  if (ArrayBuffer.isView(value)) {
    return fromArrayView(value);
  }
  if (value == null) {
    throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' + 'or Array-like Object. Received type ' + _typeof(value));
  }
  if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer)) {
    return fromArrayBuffer(value, encodingOrOffset, length);
  }
  if (typeof SharedArrayBuffer !== 'undefined' && (isInstance(value, SharedArrayBuffer) || value && isInstance(value.buffer, SharedArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length);
  }
  if (typeof value === 'number') {
    throw new TypeError('The "value" argument must not be of type number. Received type number');
  }
  var valueOf = value.valueOf && value.valueOf();
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length);
  }
  var b = fromObject(value);
  if (b) return b;
  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(value[Symbol.toPrimitive]('string'), encodingOrOffset, length);
  }
  throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' + 'or Array-like Object. Received type ' + _typeof(value));
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length);
};

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype);
Object.setPrototypeOf(Buffer, Uint8Array);
function assertSize(size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number');
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"');
  }
}
function alloc(size, fill, encoding) {
  assertSize(size);
  if (size <= 0) {
    return createBuffer(size);
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpreted as a start offset.
    return typeof encoding === 'string' ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
  }
  return createBuffer(size);
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding);
};
function allocUnsafe(size) {
  assertSize(size);
  return createBuffer(size < 0 ? 0 : checked(size) | 0);
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size);
};
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size);
};
function fromString(string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8';
  }
  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding);
  }
  var length = byteLength(string, encoding) | 0;
  var buf = createBuffer(length);
  var actual = buf.write(string, encoding);
  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual);
  }
  return buf;
}
function fromArrayLike(array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0;
  var buf = createBuffer(length);
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255;
  }
  return buf;
}
function fromArrayView(arrayView) {
  if (isInstance(arrayView, Uint8Array)) {
    var copy = new Uint8Array(arrayView);
    return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength);
  }
  return fromArrayLike(arrayView);
}
function fromArrayBuffer(array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds');
  }
  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds');
  }
  var buf;
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array);
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset);
  } else {
    buf = new Uint8Array(array, byteOffset, length);
  }

  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(buf, Buffer.prototype);
  return buf;
}
function fromObject(obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0;
    var buf = createBuffer(len);
    if (buf.length === 0) {
      return buf;
    }
    obj.copy(buf, 0, 0, len);
    return buf;
  }
  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0);
    }
    return fromArrayLike(obj);
  }
  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data);
  }
}
function checked(length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' + 'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes');
  }
  return length | 0;
}
function SlowBuffer(length) {
  if (+length != length) {
    // eslint-disable-line eqeqeq
    length = 0;
  }
  return Buffer.alloc(+length);
}
Buffer.isBuffer = function isBuffer(b) {
  return b != null && b._isBuffer === true && b !== Buffer.prototype; // so Buffer.isBuffer(Buffer.prototype) will be false
};
Buffer.compare = function compare(a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength);
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength);
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
  }
  if (a === b) return 0;
  var x = a.length;
  var y = b.length;
  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }
  if (x < y) return -1;
  if (y < x) return 1;
  return 0;
};
Buffer.isEncoding = function isEncoding(encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true;
    default:
      return false;
  }
};
Buffer.concat = function concat(list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers');
  }
  if (list.length === 0) {
    return Buffer.alloc(0);
  }
  var i;
  if (length === undefined) {
    length = 0;
    for (i = 0; i < list.length; ++i) {
      length += list[i].length;
    }
  }
  var buffer = Buffer.allocUnsafe(length);
  var pos = 0;
  for (i = 0; i < list.length; ++i) {
    var buf = list[i];
    if (isInstance(buf, Uint8Array)) {
      if (pos + buf.length > buffer.length) {
        if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf);
        buf.copy(buffer, pos);
      } else {
        Uint8Array.prototype.set.call(buffer, buf, pos);
      }
    } else if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers');
    } else {
      buf.copy(buffer, pos);
    }
    pos += buf.length;
  }
  return buffer;
};
function byteLength(string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length;
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength;
  }
  if (typeof string !== 'string') {
    throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' + 'Received type ' + _typeof(string));
  }
  var len = string.length;
  var mustMatch = arguments.length > 2 && arguments[2] === true;
  if (!mustMatch && len === 0) return 0;

  // Use a for loop to avoid recursion
  var loweredCase = false;
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len;
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length;
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2;
      case 'hex':
        return len >>> 1;
      case 'base64':
        return base64ToBytes(string).length;
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length; // assume utf8
        }
        encoding = ('' + encoding).toLowerCase();
        loweredCase = true;
    }
  }
}
Buffer.byteLength = byteLength;
function slowToString(encoding, start, end) {
  var loweredCase = false;

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0;
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return '';
  }
  if (end === undefined || end > this.length) {
    end = this.length;
  }
  if (end <= 0) {
    return '';
  }

  // Force coercion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0;
  start >>>= 0;
  if (end <= start) {
    return '';
  }
  if (!encoding) encoding = 'utf8';
  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end);
      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end);
      case 'ascii':
        return asciiSlice(this, start, end);
      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end);
      case 'base64':
        return base64Slice(this, start, end);
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end);
      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
        encoding = (encoding + '').toLowerCase();
        loweredCase = true;
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true;
function swap(b, n, m) {
  var i = b[n];
  b[n] = b[m];
  b[m] = i;
}
Buffer.prototype.swap16 = function swap16() {
  var len = this.length;
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits');
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1);
  }
  return this;
};
Buffer.prototype.swap32 = function swap32() {
  var len = this.length;
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits');
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3);
    swap(this, i + 1, i + 2);
  }
  return this;
};
Buffer.prototype.swap64 = function swap64() {
  var len = this.length;
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits');
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7);
    swap(this, i + 1, i + 6);
    swap(this, i + 2, i + 5);
    swap(this, i + 3, i + 4);
  }
  return this;
};
Buffer.prototype.toString = function toString() {
  var length = this.length;
  if (length === 0) return '';
  if (arguments.length === 0) return utf8Slice(this, 0, length);
  return slowToString.apply(this, arguments);
};
Buffer.prototype.toLocaleString = Buffer.prototype.toString;
Buffer.prototype.equals = function equals(b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer');
  if (this === b) return true;
  return Buffer.compare(this, b) === 0;
};
Buffer.prototype.inspect = function inspect() {
  var str = '';
  var max = exports.INSPECT_MAX_BYTES;
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim();
  if (this.length > max) str += ' ... ';
  return '<Buffer ' + str + '>';
};
if (customInspectSymbol) {
  Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect;
}
Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength);
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. ' + 'Received type ' + _typeof(target));
  }
  if (start === undefined) {
    start = 0;
  }
  if (end === undefined) {
    end = target ? target.length : 0;
  }
  if (thisStart === undefined) {
    thisStart = 0;
  }
  if (thisEnd === undefined) {
    thisEnd = this.length;
  }
  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index');
  }
  if (thisStart >= thisEnd && start >= end) {
    return 0;
  }
  if (thisStart >= thisEnd) {
    return -1;
  }
  if (start >= end) {
    return 1;
  }
  start >>>= 0;
  end >>>= 0;
  thisStart >>>= 0;
  thisEnd >>>= 0;
  if (this === target) return 0;
  var x = thisEnd - thisStart;
  var y = end - start;
  var len = Math.min(x, y);
  var thisCopy = this.slice(thisStart, thisEnd);
  var targetCopy = target.slice(start, end);
  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i];
      y = targetCopy[i];
      break;
    }
  }
  if (x < y) return -1;
  if (y < x) return 1;
  return 0;
};

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1;

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset;
    byteOffset = 0;
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff;
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000;
  }
  byteOffset = +byteOffset; // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : buffer.length - 1;
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
  if (byteOffset >= buffer.length) {
    if (dir) return -1;else byteOffset = buffer.length - 1;
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0;else return -1;
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding);
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1;
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
  } else if (typeof val === 'number') {
    val = val & 0xFF; // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
      }
    }
    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
  }
  throw new TypeError('val must be string, number or Buffer');
}
function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
  var indexSize = 1;
  var arrLength = arr.length;
  var valLength = val.length;
  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase();
    if (encoding === 'ucs2' || encoding === 'ucs-2' || encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1;
      }
      indexSize = 2;
      arrLength /= 2;
      valLength /= 2;
      byteOffset /= 2;
    }
  }
  function read(buf, i) {
    if (indexSize === 1) {
      return buf[i];
    } else {
      return buf.readUInt16BE(i * indexSize);
    }
  }
  var i;
  if (dir) {
    var foundIndex = -1;
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i;
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
      } else {
        if (foundIndex !== -1) i -= i - foundIndex;
        foundIndex = -1;
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
    for (i = byteOffset; i >= 0; i--) {
      var found = true;
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false;
          break;
        }
      }
      if (found) return i;
    }
  }
  return -1;
}
Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1;
};
Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
};
Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
};
function hexWrite(buf, string, offset, length) {
  offset = Number(offset) || 0;
  var remaining = buf.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = Number(length);
    if (length > remaining) {
      length = remaining;
    }
  }
  var strLen = string.length;
  if (length > strLen / 2) {
    length = strLen / 2;
  }
  var i;
  for (i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16);
    if (numberIsNaN(parsed)) return i;
    buf[offset + i] = parsed;
  }
  return i;
}
function utf8Write(buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
}
function asciiWrite(buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length);
}
function base64Write(buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length);
}
function ucs2Write(buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
}
Buffer.prototype.write = function write(string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8';
    length = this.length;
    offset = 0;
    // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset;
    length = this.length;
    offset = 0;
    // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0;
    if (isFinite(length)) {
      length = length >>> 0;
      if (encoding === undefined) encoding = 'utf8';
    } else {
      encoding = length;
      length = undefined;
    }
  } else {
    throw new Error('Buffer.write(string, encoding, offset[, length]) is no longer supported');
  }
  var remaining = this.length - offset;
  if (length === undefined || length > remaining) length = remaining;
  if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds');
  }
  if (!encoding) encoding = 'utf8';
  var loweredCase = false;
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length);
      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length);
      case 'ascii':
      case 'latin1':
      case 'binary':
        return asciiWrite(this, string, offset, length);
      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length);
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length);
      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
        encoding = ('' + encoding).toLowerCase();
        loweredCase = true;
    }
  }
};
Buffer.prototype.toJSON = function toJSON() {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  };
};
function base64Slice(buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf);
  } else {
    return base64.fromByteArray(buf.slice(start, end));
  }
}
function utf8Slice(buf, start, end) {
  end = Math.min(buf.length, end);
  var res = [];
  var i = start;
  while (i < end) {
    var firstByte = buf[i];
    var codePoint = null;
    var bytesPerSequence = firstByte > 0xEF ? 4 : firstByte > 0xDF ? 3 : firstByte > 0xBF ? 2 : 1;
    if (i + bytesPerSequence <= end) {
      var secondByte = void 0,
        thirdByte = void 0,
        fourthByte = void 0,
        tempCodePoint = void 0;
      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte;
          }
          break;
        case 2:
          secondByte = buf[i + 1];
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | secondByte & 0x3F;
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint;
            }
          }
          break;
        case 3:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | thirdByte & 0x3F;
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint;
            }
          }
          break;
        case 4:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          fourthByte = buf[i + 3];
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | fourthByte & 0x3F;
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint;
            }
          }
      }
    }
    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD;
      bytesPerSequence = 1;
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000;
      res.push(codePoint >>> 10 & 0x3FF | 0xD800);
      codePoint = 0xDC00 | codePoint & 0x3FF;
    }
    res.push(codePoint);
    i += bytesPerSequence;
  }
  return decodeCodePointsArray(res);
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000;
function decodeCodePointsArray(codePoints) {
  var len = codePoints.length;
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints); // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = '';
  var i = 0;
  while (i < len) {
    res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
  }
  return res;
}
function asciiSlice(buf, start, end) {
  var ret = '';
  end = Math.min(buf.length, end);
  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F);
  }
  return ret;
}
function latin1Slice(buf, start, end) {
  var ret = '';
  end = Math.min(buf.length, end);
  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i]);
  }
  return ret;
}
function hexSlice(buf, start, end) {
  var len = buf.length;
  if (!start || start < 0) start = 0;
  if (!end || end < 0 || end > len) end = len;
  var out = '';
  for (var i = start; i < end; ++i) {
    out += hexSliceLookupTable[buf[i]];
  }
  return out;
}
function utf16leSlice(buf, start, end) {
  var bytes = buf.slice(start, end);
  var res = '';
  // If bytes.length is odd, the last 8 bits must be ignored (same as node.js)
  for (var i = 0; i < bytes.length - 1; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
  }
  return res;
}
Buffer.prototype.slice = function slice(start, end) {
  var len = this.length;
  start = ~~start;
  end = end === undefined ? len : ~~end;
  if (start < 0) {
    start += len;
    if (start < 0) start = 0;
  } else if (start > len) {
    start = len;
  }
  if (end < 0) {
    end += len;
    if (end < 0) end = 0;
  } else if (end > len) {
    end = len;
  }
  if (end < start) end = start;
  var newBuf = this.subarray(start, end);
  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(newBuf, Buffer.prototype);
  return newBuf;
};

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset(offset, ext, length) {
  if (offset % 1 !== 0 || offset < 0) throw new RangeError('offset is not uint');
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length');
}
Buffer.prototype.readUintLE = Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);
  var val = this[offset];
  var mul = 1;
  var i = 0;
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul;
  }
  return val;
};
Buffer.prototype.readUintBE = Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length);
  }
  var val = this[offset + --byteLength];
  var mul = 1;
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul;
  }
  return val;
};
Buffer.prototype.readUint8 = Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 1, this.length);
  return this[offset];
};
Buffer.prototype.readUint16LE = Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 2, this.length);
  return this[offset] | this[offset + 1] << 8;
};
Buffer.prototype.readUint16BE = Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 2, this.length);
  return this[offset] << 8 | this[offset + 1];
};
Buffer.prototype.readUint32LE = Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 0x1000000;
};
Buffer.prototype.readUint32BE = Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return this[offset] * 0x1000000 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
};
Buffer.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE(offset) {
  offset = offset >>> 0;
  validateNumber(offset, 'offset');
  var first = this[offset];
  var last = this[offset + 7];
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 8);
  }
  var lo = first + this[++offset] * Math.pow(2, 8) + this[++offset] * Math.pow(2, 16) + this[++offset] * Math.pow(2, 24);
  var hi = this[++offset] + this[++offset] * Math.pow(2, 8) + this[++offset] * Math.pow(2, 16) + last * Math.pow(2, 24);
  return BigInt(lo) + (BigInt(hi) << BigInt(32));
});
Buffer.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE(offset) {
  offset = offset >>> 0;
  validateNumber(offset, 'offset');
  var first = this[offset];
  var last = this[offset + 7];
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 8);
  }
  var hi = first * Math.pow(2, 24) + this[++offset] * Math.pow(2, 16) + this[++offset] * Math.pow(2, 8) + this[++offset];
  var lo = this[++offset] * Math.pow(2, 24) + this[++offset] * Math.pow(2, 16) + this[++offset] * Math.pow(2, 8) + last;
  return (BigInt(hi) << BigInt(32)) + BigInt(lo);
});
Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);
  var val = this[offset];
  var mul = 1;
  var i = 0;
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul;
  }
  mul *= 0x80;
  if (val >= mul) val -= Math.pow(2, 8 * byteLength);
  return val;
};
Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);
  var i = byteLength;
  var mul = 1;
  var val = this[offset + --i];
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul;
  }
  mul *= 0x80;
  if (val >= mul) val -= Math.pow(2, 8 * byteLength);
  return val;
};
Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 1, this.length);
  if (!(this[offset] & 0x80)) return this[offset];
  return (0xff - this[offset] + 1) * -1;
};
Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 2, this.length);
  var val = this[offset] | this[offset + 1] << 8;
  return val & 0x8000 ? val | 0xFFFF0000 : val;
};
Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 2, this.length);
  var val = this[offset + 1] | this[offset] << 8;
  return val & 0x8000 ? val | 0xFFFF0000 : val;
};
Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
};
Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
};
Buffer.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE(offset) {
  offset = offset >>> 0;
  validateNumber(offset, 'offset');
  var first = this[offset];
  var last = this[offset + 7];
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 8);
  }
  var val = this[offset + 4] + this[offset + 5] * Math.pow(2, 8) + this[offset + 6] * Math.pow(2, 16) + (last << 24); // Overflow

  return (BigInt(val) << BigInt(32)) + BigInt(first + this[++offset] * Math.pow(2, 8) + this[++offset] * Math.pow(2, 16) + this[++offset] * Math.pow(2, 24));
});
Buffer.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE(offset) {
  offset = offset >>> 0;
  validateNumber(offset, 'offset');
  var first = this[offset];
  var last = this[offset + 7];
  if (first === undefined || last === undefined) {
    boundsError(offset, this.length - 8);
  }
  var val = (first << 24) +
  // Overflow
  this[++offset] * Math.pow(2, 16) + this[++offset] * Math.pow(2, 8) + this[++offset];
  return (BigInt(val) << BigInt(32)) + BigInt(this[++offset] * Math.pow(2, 24) + this[++offset] * Math.pow(2, 16) + this[++offset] * Math.pow(2, 8) + last);
});
Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return ieee754.read(this, offset, true, 23, 4);
};
Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 4, this.length);
  return ieee754.read(this, offset, false, 23, 4);
};
Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 8, this.length);
  return ieee754.read(this, offset, true, 52, 8);
};
Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
  offset = offset >>> 0;
  if (!noAssert) checkOffset(offset, 8, this.length);
  return ieee754.read(this, offset, false, 52, 8);
};
function checkInt(buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
  if (offset + ext > buf.length) throw new RangeError('Index out of range');
}
Buffer.prototype.writeUintLE = Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
    checkInt(this, value, offset, byteLength, maxBytes, 0);
  }
  var mul = 1;
  var i = 0;
  this[offset] = value & 0xFF;
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = value / mul & 0xFF;
  }
  return offset + byteLength;
};
Buffer.prototype.writeUintBE = Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset >>> 0;
  byteLength = byteLength >>> 0;
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
    checkInt(this, value, offset, byteLength, maxBytes, 0);
  }
  var i = byteLength - 1;
  var mul = 1;
  this[offset + i] = value & 0xFF;
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = value / mul & 0xFF;
  }
  return offset + byteLength;
};
Buffer.prototype.writeUint8 = Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
  this[offset] = value & 0xff;
  return offset + 1;
};
Buffer.prototype.writeUint16LE = Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
  this[offset] = value & 0xff;
  this[offset + 1] = value >>> 8;
  return offset + 2;
};
Buffer.prototype.writeUint16BE = Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
  this[offset] = value >>> 8;
  this[offset + 1] = value & 0xff;
  return offset + 2;
};
Buffer.prototype.writeUint32LE = Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
  this[offset + 3] = value >>> 24;
  this[offset + 2] = value >>> 16;
  this[offset + 1] = value >>> 8;
  this[offset] = value & 0xff;
  return offset + 4;
};
Buffer.prototype.writeUint32BE = Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
  this[offset] = value >>> 24;
  this[offset + 1] = value >>> 16;
  this[offset + 2] = value >>> 8;
  this[offset + 3] = value & 0xff;
  return offset + 4;
};
function wrtBigUInt64LE(buf, value, offset, min, max) {
  checkIntBI(value, min, max, buf, offset, 7);
  var lo = Number(value & BigInt(0xffffffff));
  buf[offset++] = lo;
  lo = lo >> 8;
  buf[offset++] = lo;
  lo = lo >> 8;
  buf[offset++] = lo;
  lo = lo >> 8;
  buf[offset++] = lo;
  var hi = Number(value >> BigInt(32) & BigInt(0xffffffff));
  buf[offset++] = hi;
  hi = hi >> 8;
  buf[offset++] = hi;
  hi = hi >> 8;
  buf[offset++] = hi;
  hi = hi >> 8;
  buf[offset++] = hi;
  return offset;
}
function wrtBigUInt64BE(buf, value, offset, min, max) {
  checkIntBI(value, min, max, buf, offset, 7);
  var lo = Number(value & BigInt(0xffffffff));
  buf[offset + 7] = lo;
  lo = lo >> 8;
  buf[offset + 6] = lo;
  lo = lo >> 8;
  buf[offset + 5] = lo;
  lo = lo >> 8;
  buf[offset + 4] = lo;
  var hi = Number(value >> BigInt(32) & BigInt(0xffffffff));
  buf[offset + 3] = hi;
  hi = hi >> 8;
  buf[offset + 2] = hi;
  hi = hi >> 8;
  buf[offset + 1] = hi;
  hi = hi >> 8;
  buf[offset] = hi;
  return offset + 8;
}
Buffer.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE(value) {
  var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt('0xffffffffffffffff'));
});
Buffer.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE(value) {
  var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt('0xffffffffffffffff'));
});
Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1);
    checkInt(this, value, offset, byteLength, limit - 1, -limit);
  }
  var i = 0;
  var mul = 1;
  var sub = 0;
  this[offset] = value & 0xFF;
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1;
    }
    this[offset + i] = (value / mul >> 0) - sub & 0xFF;
  }
  return offset + byteLength;
};
Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1);
    checkInt(this, value, offset, byteLength, limit - 1, -limit);
  }
  var i = byteLength - 1;
  var mul = 1;
  var sub = 0;
  this[offset + i] = value & 0xFF;
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1;
    }
    this[offset + i] = (value / mul >> 0) - sub & 0xFF;
  }
  return offset + byteLength;
};
Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
  if (value < 0) value = 0xff + value + 1;
  this[offset] = value & 0xff;
  return offset + 1;
};
Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
  this[offset] = value & 0xff;
  this[offset + 1] = value >>> 8;
  return offset + 2;
};
Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
  this[offset] = value >>> 8;
  this[offset + 1] = value & 0xff;
  return offset + 2;
};
Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
  this[offset] = value & 0xff;
  this[offset + 1] = value >>> 8;
  this[offset + 2] = value >>> 16;
  this[offset + 3] = value >>> 24;
  return offset + 4;
};
Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
  if (value < 0) value = 0xffffffff + value + 1;
  this[offset] = value >>> 24;
  this[offset + 1] = value >>> 16;
  this[offset + 2] = value >>> 8;
  this[offset + 3] = value & 0xff;
  return offset + 4;
};
Buffer.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE(value) {
  var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  return wrtBigUInt64LE(this, value, offset, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'));
});
Buffer.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE(value) {
  var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  return wrtBigUInt64BE(this, value, offset, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'));
});
function checkIEEE754(buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range');
  if (offset < 0) throw new RangeError('Index out of range');
}
function writeFloat(buf, value, offset, littleEndian, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38);
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4);
  return offset + 4;
}
Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert);
};
Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert);
};
function writeDouble(buf, value, offset, littleEndian, noAssert) {
  value = +value;
  offset = offset >>> 0;
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308);
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8);
  return offset + 8;
}
Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert);
};
Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert);
};

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy(target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer');
  if (!start) start = 0;
  if (!end && end !== 0) end = this.length;
  if (targetStart >= target.length) targetStart = target.length;
  if (!targetStart) targetStart = 0;
  if (end > 0 && end < start) end = start;

  // Copy 0 bytes; we're done
  if (end === start) return 0;
  if (target.length === 0 || this.length === 0) return 0;

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds');
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range');
  if (end < 0) throw new RangeError('sourceEnd out of bounds');

  // Are we oob?
  if (end > this.length) end = this.length;
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start;
  }
  var len = end - start;
  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end);
  } else {
    Uint8Array.prototype.set.call(target, this.subarray(start, end), targetStart);
  }
  return len;
};

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill(val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start;
      start = 0;
      end = this.length;
    } else if (typeof end === 'string') {
      encoding = end;
      end = this.length;
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string');
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding);
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0);
      if (encoding === 'utf8' && code < 128 || encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code;
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255;
  } else if (typeof val === 'boolean') {
    val = Number(val);
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index');
  }
  if (end <= start) {
    return this;
  }
  start = start >>> 0;
  end = end === undefined ? this.length : end >>> 0;
  if (!val) val = 0;
  var i;
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val;
    }
  } else {
    var bytes = Buffer.isBuffer(val) ? val : Buffer.from(val, encoding);
    var len = bytes.length;
    if (len === 0) {
      throw new TypeError('The value "' + val + '" is invalid for argument "value"');
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len];
    }
  }
  return this;
};

// CUSTOM ERRORS
// =============

// Simplified versions from Node, changed for Buffer-only usage
var errors = {};
function E(sym, getMessage, Base) {
  errors[sym] = /*#__PURE__*/function (_Base) {
    function NodeError() {
      var _this;
      _classCallCheck(this, NodeError);
      _this = _callSuper(this, NodeError);
      Object.defineProperty(_this, 'message', {
        value: getMessage.apply(_this, arguments),
        writable: true,
        configurable: true
      });

      // Add the error code to the name to include it in the stack trace.
      _this.name = "".concat(_this.name, " [").concat(sym, "]");
      // Access the stack to generate the error message including the error code
      // from the name.
      _this.stack; // eslint-disable-line no-unused-expressions
      // Reset the name to the actual name.
      delete _this.name;
      return _this;
    }
    _inherits(NodeError, _Base);
    return _createClass(NodeError, [{
      key: "code",
      get: function get() {
        return sym;
      },
      set: function set(value) {
        Object.defineProperty(this, 'code', {
          configurable: true,
          enumerable: true,
          value: value,
          writable: true
        });
      }
    }, {
      key: "toString",
      value: function toString() {
        return "".concat(this.name, " [").concat(sym, "]: ").concat(this.message);
      }
    }]);
  }(Base);
}
E('ERR_BUFFER_OUT_OF_BOUNDS', function (name) {
  if (name) {
    return "".concat(name, " is outside of buffer bounds");
  }
  return 'Attempt to access memory outside buffer bounds';
}, RangeError);
E('ERR_INVALID_ARG_TYPE', function (name, actual) {
  return "The \"".concat(name, "\" argument must be of type number. Received type ").concat(_typeof(actual));
}, TypeError);
E('ERR_OUT_OF_RANGE', function (str, range, input) {
  var msg = "The value of \"".concat(str, "\" is out of range.");
  var received = input;
  if (Number.isInteger(input) && Math.abs(input) > Math.pow(2, 32)) {
    received = addNumericalSeparator(String(input));
  } else if (typeof input === 'bigint') {
    received = String(input);
    if (input > Math.pow(BigInt(2), BigInt(32)) || input < -Math.pow(BigInt(2), BigInt(32))) {
      received = addNumericalSeparator(received);
    }
    received += 'n';
  }
  msg += " It must be ".concat(range, ". Received ").concat(received);
  return msg;
}, RangeError);
function addNumericalSeparator(val) {
  var res = '';
  var i = val.length;
  var start = val[0] === '-' ? 1 : 0;
  for (; i >= start + 4; i -= 3) {
    res = "_".concat(val.slice(i - 3, i)).concat(res);
  }
  return "".concat(val.slice(0, i)).concat(res);
}

// CHECK FUNCTIONS
// ===============

function checkBounds(buf, offset, byteLength) {
  validateNumber(offset, 'offset');
  if (buf[offset] === undefined || buf[offset + byteLength] === undefined) {
    boundsError(offset, buf.length - (byteLength + 1));
  }
}
function checkIntBI(value, min, max, buf, offset, byteLength) {
  if (value > max || value < min) {
    var n = typeof min === 'bigint' ? 'n' : '';
    var range;
    if (byteLength > 3) {
      if (min === 0 || min === BigInt(0)) {
        range = ">= 0".concat(n, " and < 2").concat(n, " ** ").concat((byteLength + 1) * 8).concat(n);
      } else {
        range = ">= -(2".concat(n, " ** ").concat((byteLength + 1) * 8 - 1).concat(n, ") and < 2 ** ") + "".concat((byteLength + 1) * 8 - 1).concat(n);
      }
    } else {
      range = ">= ".concat(min).concat(n, " and <= ").concat(max).concat(n);
    }
    throw new errors.ERR_OUT_OF_RANGE('value', range, value);
  }
  checkBounds(buf, offset, byteLength);
}
function validateNumber(value, name) {
  if (typeof value !== 'number') {
    throw new errors.ERR_INVALID_ARG_TYPE(name, 'number', value);
  }
}
function boundsError(value, length, type) {
  if (Math.floor(value) !== value) {
    validateNumber(value, type);
    throw new errors.ERR_OUT_OF_RANGE(type || 'offset', 'an integer', value);
  }
  if (length < 0) {
    throw new errors.ERR_BUFFER_OUT_OF_BOUNDS();
  }
  throw new errors.ERR_OUT_OF_RANGE(type || 'offset', ">= ".concat(type ? 1 : 0, " and <= ").concat(length), value);
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;
function base64clean(str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0];
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '');
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return '';
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '=';
  }
  return str;
}
function utf8ToBytes(string, units) {
  units = units || Infinity;
  var codePoint;
  var length = string.length;
  var leadSurrogate = null;
  var bytes = [];
  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i);

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue;
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue;
        }

        // valid lead
        leadSurrogate = codePoint;
        continue;
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
        leadSurrogate = codePoint;
        continue;
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
    }
    leadSurrogate = null;

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break;
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break;
      bytes.push(codePoint >> 0x6 | 0xC0, codePoint & 0x3F | 0x80);
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break;
      bytes.push(codePoint >> 0xC | 0xE0, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break;
      bytes.push(codePoint >> 0x12 | 0xF0, codePoint >> 0xC & 0x3F | 0x80, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
    } else {
      throw new Error('Invalid code point');
    }
  }
  return bytes;
}
function asciiToBytes(str) {
  var byteArray = [];
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF);
  }
  return byteArray;
}
function utf16leToBytes(str, units) {
  var c, hi, lo;
  var byteArray = [];
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break;
    c = str.charCodeAt(i);
    hi = c >> 8;
    lo = c % 256;
    byteArray.push(lo);
    byteArray.push(hi);
  }
  return byteArray;
}
function base64ToBytes(str) {
  return base64.toByteArray(base64clean(str));
}
function blitBuffer(src, dst, offset, length) {
  var i;
  for (i = 0; i < length; ++i) {
    if (i + offset >= dst.length || i >= src.length) break;
    dst[i + offset] = src[i];
  }
  return i;
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance(obj, type) {
  return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
}
function numberIsNaN(obj) {
  // For IE11 support
  return obj !== obj; // eslint-disable-line no-self-compare
}

// Create lookup table for `toString('hex')`
// See: https://github.com/feross/buffer/issues/219
var hexSliceLookupTable = function () {
  var alphabet = '0123456789abcdef';
  var table = new Array(256);
  for (var i = 0; i < 16; ++i) {
    var i16 = i * 16;
    for (var j = 0; j < 16; ++j) {
      table[i16 + j] = alphabet[i] + alphabet[j];
    }
  }
  return table;
}();

// Return not function with Error if BigInt not supported
function defineBigIntMethod(fn) {
  return typeof BigInt === 'undefined' ? BufferBigIntNotDefined : fn;
}
function BufferBigIntNotDefined() {
  throw new Error('BigInt not supported');
}

/***/ }),

/***/ "./node_modules/byte-length/dist/index.js":
/*!************************************************!*\
  !*** ./node_modules/byte-length/dist/index.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
/*
 * Calculate the byte lengths for utf8 encoded strings.
 */
function byteLength(str) {
  if (!str) {
    return 0;
  }
  str = str.toString();
  var len = str.length;
  for (var i = str.length; i--;) {
    var code = str.charCodeAt(i);
    if (0xdc00 <= code && code <= 0xdfff) {
      i--;
    }
    if (0x7f < code && code <= 0x7ff) {
      len++;
    } else if (0x7ff < code && code <= 0xffff) {
      len += 2;
    }
  }
  return len;
}
exports.byteLength = byteLength;

/***/ }),

/***/ "./node_modules/call-bind-apply-helpers/actualApply.js":
/*!*************************************************************!*\
  !*** ./node_modules/call-bind-apply-helpers/actualApply.js ***!
  \*************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var bind = __webpack_require__(/*! function-bind */ "./node_modules/function-bind/index.js");
var $apply = __webpack_require__(/*! ./functionApply */ "./node_modules/call-bind-apply-helpers/functionApply.js");
var $call = __webpack_require__(/*! ./functionCall */ "./node_modules/call-bind-apply-helpers/functionCall.js");
var $reflectApply = __webpack_require__(/*! ./reflectApply */ "./node_modules/call-bind-apply-helpers/reflectApply.js");

/** @type {import('./actualApply')} */
module.exports = $reflectApply || bind.call($call, $apply);

/***/ }),

/***/ "./node_modules/call-bind-apply-helpers/applyBind.js":
/*!***********************************************************!*\
  !*** ./node_modules/call-bind-apply-helpers/applyBind.js ***!
  \***********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var bind = __webpack_require__(/*! function-bind */ "./node_modules/function-bind/index.js");
var $apply = __webpack_require__(/*! ./functionApply */ "./node_modules/call-bind-apply-helpers/functionApply.js");
var actualApply = __webpack_require__(/*! ./actualApply */ "./node_modules/call-bind-apply-helpers/actualApply.js");

/** @type {import('./applyBind')} */
module.exports = function applyBind() {
  return actualApply(bind, $apply, arguments);
};

/***/ }),

/***/ "./node_modules/call-bind-apply-helpers/functionApply.js":
/*!***************************************************************!*\
  !*** ./node_modules/call-bind-apply-helpers/functionApply.js ***!
  \***************************************************************/
/***/ ((module) => {

"use strict";


/** @type {import('./functionApply')} */
module.exports = Function.prototype.apply;

/***/ }),

/***/ "./node_modules/call-bind-apply-helpers/functionCall.js":
/*!**************************************************************!*\
  !*** ./node_modules/call-bind-apply-helpers/functionCall.js ***!
  \**************************************************************/
/***/ ((module) => {

"use strict";


/** @type {import('./functionCall')} */
module.exports = Function.prototype.call;

/***/ }),

/***/ "./node_modules/call-bind-apply-helpers/index.js":
/*!*******************************************************!*\
  !*** ./node_modules/call-bind-apply-helpers/index.js ***!
  \*******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var bind = __webpack_require__(/*! function-bind */ "./node_modules/function-bind/index.js");
var $TypeError = __webpack_require__(/*! es-errors/type */ "./node_modules/es-errors/type.js");
var $call = __webpack_require__(/*! ./functionCall */ "./node_modules/call-bind-apply-helpers/functionCall.js");
var $actualApply = __webpack_require__(/*! ./actualApply */ "./node_modules/call-bind-apply-helpers/actualApply.js");

/** @type {(args: [Function, thisArg?: unknown, ...args: unknown[]]) => Function} TODO FIXME, find a way to use import('.') */
module.exports = function callBindBasic(args) {
  if (args.length < 1 || typeof args[0] !== 'function') {
    throw new $TypeError('a function is required');
  }
  return $actualApply(bind, $call, args);
};

/***/ }),

/***/ "./node_modules/call-bind-apply-helpers/reflectApply.js":
/*!**************************************************************!*\
  !*** ./node_modules/call-bind-apply-helpers/reflectApply.js ***!
  \**************************************************************/
/***/ ((module) => {

"use strict";


/** @type {import('./reflectApply')} */
module.exports = typeof Reflect !== 'undefined' && Reflect && Reflect.apply;

/***/ }),

/***/ "./node_modules/call-bind/index.js":
/*!*****************************************!*\
  !*** ./node_modules/call-bind/index.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var setFunctionLength = __webpack_require__(/*! set-function-length */ "./node_modules/set-function-length/index.js");
var $defineProperty = __webpack_require__(/*! es-define-property */ "./node_modules/es-define-property/index.js");
var callBindBasic = __webpack_require__(/*! call-bind-apply-helpers */ "./node_modules/call-bind-apply-helpers/index.js");
var applyBind = __webpack_require__(/*! call-bind-apply-helpers/applyBind */ "./node_modules/call-bind-apply-helpers/applyBind.js");
module.exports = function callBind(originalFunction) {
  var func = callBindBasic(arguments);
  var adjustedLength = originalFunction.length - (arguments.length - 1);
  return setFunctionLength(func, 1 + (adjustedLength > 0 ? adjustedLength : 0), true);
};
if ($defineProperty) {
  $defineProperty(module.exports, 'apply', {
    value: applyBind
  });
} else {
  module.exports.apply = applyBind;
}

/***/ }),

/***/ "./node_modules/call-bound/index.js":
/*!******************************************!*\
  !*** ./node_modules/call-bound/index.js ***!
  \******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var GetIntrinsic = __webpack_require__(/*! get-intrinsic */ "./node_modules/get-intrinsic/index.js");
var callBindBasic = __webpack_require__(/*! call-bind-apply-helpers */ "./node_modules/call-bind-apply-helpers/index.js");

/** @type {(thisArg: string, searchString: string, position?: number) => number} */
var $indexOf = callBindBasic([GetIntrinsic('%String.prototype.indexOf%')]);

/** @type {import('.')} */
module.exports = function callBoundIntrinsic(name, allowMissing) {
  /* eslint no-extra-parens: 0 */

  var intrinsic = /** @type {(this: unknown, ...args: unknown[]) => unknown} */GetIntrinsic(name, !!allowMissing);
  if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.') > -1) {
    return callBindBasic(/** @type {const} */[intrinsic]);
  }
  return intrinsic;
};

/***/ }),

/***/ "./node_modules/charenc/charenc.js":
/*!*****************************************!*\
  !*** ./node_modules/charenc/charenc.js ***!
  \*****************************************/
/***/ ((module) => {

var charenc = {
  // UTF-8 encoding
  utf8: {
    // Convert a string to a byte array
    stringToBytes: function stringToBytes(str) {
      return charenc.bin.stringToBytes(unescape(encodeURIComponent(str)));
    },
    // Convert a byte array to a string
    bytesToString: function bytesToString(bytes) {
      return decodeURIComponent(escape(charenc.bin.bytesToString(bytes)));
    }
  },
  // Binary encoding
  bin: {
    // Convert a string to a byte array
    stringToBytes: function stringToBytes(str) {
      for (var bytes = [], i = 0; i < str.length; i++) bytes.push(str.charCodeAt(i) & 0xFF);
      return bytes;
    },
    // Convert a byte array to a string
    bytesToString: function bytesToString(bytes) {
      for (var str = [], i = 0; i < bytes.length; i++) str.push(String.fromCharCode(bytes[i]));
      return str.join('');
    }
  }
};
module.exports = charenc;

/***/ }),

/***/ "./node_modules/crypt/crypt.js":
/*!*************************************!*\
  !*** ./node_modules/crypt/crypt.js ***!
  \*************************************/
/***/ ((module) => {

(function () {
  var base64map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
    crypt = {
      // Bit-wise rotation left
      rotl: function rotl(n, b) {
        return n << b | n >>> 32 - b;
      },
      // Bit-wise rotation right
      rotr: function rotr(n, b) {
        return n << 32 - b | n >>> b;
      },
      // Swap big-endian to little-endian and vice versa
      endian: function endian(n) {
        // If number given, swap endian
        if (n.constructor == Number) {
          return crypt.rotl(n, 8) & 0x00FF00FF | crypt.rotl(n, 24) & 0xFF00FF00;
        }

        // Else, assume array and swap all items
        for (var i = 0; i < n.length; i++) n[i] = crypt.endian(n[i]);
        return n;
      },
      // Generate an array of any length of random bytes
      randomBytes: function randomBytes(n) {
        for (var bytes = []; n > 0; n--) bytes.push(Math.floor(Math.random() * 256));
        return bytes;
      },
      // Convert a byte array to big-endian 32-bit words
      bytesToWords: function bytesToWords(bytes) {
        for (var words = [], i = 0, b = 0; i < bytes.length; i++, b += 8) words[b >>> 5] |= bytes[i] << 24 - b % 32;
        return words;
      },
      // Convert big-endian 32-bit words to a byte array
      wordsToBytes: function wordsToBytes(words) {
        for (var bytes = [], b = 0; b < words.length * 32; b += 8) bytes.push(words[b >>> 5] >>> 24 - b % 32 & 0xFF);
        return bytes;
      },
      // Convert a byte array to a hex string
      bytesToHex: function bytesToHex(bytes) {
        for (var hex = [], i = 0; i < bytes.length; i++) {
          hex.push((bytes[i] >>> 4).toString(16));
          hex.push((bytes[i] & 0xF).toString(16));
        }
        return hex.join('');
      },
      // Convert a hex string to a byte array
      hexToBytes: function hexToBytes(hex) {
        for (var bytes = [], c = 0; c < hex.length; c += 2) bytes.push(parseInt(hex.substr(c, 2), 16));
        return bytes;
      },
      // Convert a byte array to a base-64 string
      bytesToBase64: function bytesToBase64(bytes) {
        for (var base64 = [], i = 0; i < bytes.length; i += 3) {
          var triplet = bytes[i] << 16 | bytes[i + 1] << 8 | bytes[i + 2];
          for (var j = 0; j < 4; j++) if (i * 8 + j * 6 <= bytes.length * 8) base64.push(base64map.charAt(triplet >>> 6 * (3 - j) & 0x3F));else base64.push('=');
        }
        return base64.join('');
      },
      // Convert a base-64 string to a byte array
      base64ToBytes: function base64ToBytes(base64) {
        // Remove non-base-64 characters
        base64 = base64.replace(/[^A-Z0-9+\/]/ig, '');
        for (var bytes = [], i = 0, imod4 = 0; i < base64.length; imod4 = ++i % 4) {
          if (imod4 == 0) continue;
          bytes.push((base64map.indexOf(base64.charAt(i - 1)) & Math.pow(2, -2 * imod4 + 8) - 1) << imod4 * 2 | base64map.indexOf(base64.charAt(i)) >>> 6 - imod4 * 2);
        }
        return bytes;
      }
    };
  module.exports = crypt;
})();

/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./src/dashboard/dashboard.css":
/*!***************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./src/dashboard/dashboard.css ***!
  \***************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/sourceMaps.js */ "./node_modules/css-loader/dist/runtime/sourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, `/* General Body and Layout */
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background-color: #f0f2f5;
    margin: 0;
    color: #333;
    min-width: 800px;
}

.dashboard-container {
    display: flex;
    width: 100%;
    max-width: 1400px;
    margin: 20px auto;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
    min-height: calc(100vh - 40px);
}

.sidebar {
    width: 280px;
    flex-shrink: 0;
    padding: 25px;
    border-right: 1px solid #e8e8e8;
    background-color: #fafbfc;
    border-radius: 16px 0 0 16px;
    display: flex;
    flex-direction: column;
}

.main-content {
    flex-grow: 1;
    padding: 25px;
    display: flex;
    flex-direction: column;
}

/* Sidebar Sections */
.sidebar-section {
    margin-bottom: 25px;
}
.sidebar-section h4 {
    font-size: 14px;
    font-weight: 600;
    color: #555;
    margin: 0 0 15px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid #e8e8e8;
}

/* Card for main content */
.card {
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    flex-grow: 1;
}

/* Generic Button Styles */
button, .button-like {
    padding: 10px 18px;
    color: white;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    white-space: nowrap;
    text-align: center;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
button:hover:not(:disabled) {
    transform: translateY(-1px);
    opacity: 0.9;
}
button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Specific Button Colors */
#exportBtn, #syncNow, #saveAndTest {
    background-color: #4a9eff;
}
#syncDown {
    background-color: #2ed573;
}
#clearAllBtn {
    background-color: #ff4a4a;
}
.button-like { /* For file import label */
    background-color: #6c757d;
}


/* Button Group */
.button-group-vertical {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

/* Title */
.panel-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
    font-size: 20px;
    margin: 0 0 25px 0;
    color: #333;
    padding-bottom: 15px;
    border-bottom: 1px solid #e0e0e0;
}
#helpBtn {
    cursor: pointer;
    font-size: 20px;
    color: #888;
    transition: color 0.3s;
}
#helpBtn:hover {
    color: #333;
}

/* Tabs */
.tabs {
    display: flex;
    border-bottom: 1px solid #e8e8e8;
    margin-bottom: 25px;
}
.tab-link {
    padding: 12px 20px;
    cursor: pointer;
    border: none;
    background-color: transparent;
    font-size: 16px;
    color: #666;
    border-bottom: 3px solid transparent;
    transition: all 0.3s ease;
    margin-bottom: -1px;
}
.tab-link.active,
.tab-link:hover {
    color: #4a9eff;
    border-bottom-color: #4a9eff;
}
.tab-content {
    display: none;
}
.tab-content.active {
    display: flex; /* Changed to flex for card to grow */
    flex-direction: column;
    flex-grow: 1;
}

/* Search and Filter */
.search-and-filter {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
}
#searchInput {
    flex-grow: 1;
    padding: 10px 15px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
}
#filterSelect {
    padding: 10px 15px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    background-color: white;
}

/* Video List */
.video-list-container {
    overflow-y: auto;
    flex-grow: 1;
    min-height: 300px; /* Ensure a minimum height */
    border: 1px solid #e8e8e8;
    border-radius: 8px;
}
#videoList {
    list-style: none;
    padding: 0;
    margin: 0;
}
#videoList li {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 15px;
    align-items: center;
    padding: 12px 15px;
    border-bottom: 1px solid #f0f0f0;
}
#videoList li:last-child {
    border-bottom: none;
}
#videoList li a {
    text-decoration: none;
    color: #007bff;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
#videoList li a:hover {
    text-decoration: underline;
}
#videoList li span {
    font-size: 13px;
    color: #666;
    background-color: #f0f2f5;
    padding: 3px 8px;
    border-radius: 5px;
}

/* Pagination */
.pagination {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 20px;
}
.pagination button {
    background-color: #6c757d;
    min-width: 40px;
}
.pagination button:disabled {
    background-color: #4a9eff;
    opacity: 1;
}

/* Advanced Settings Tab */
#jsonConfig {
    width: 100%;
    height: 400px;
    padding: 15px;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-family: "Courier New", Courier, monospace;
    font-size: 14px;
    white-space: pre;
    overflow-wrap: normal;
    overflow-x: scroll;
    background-color: #f9f9f9;
    resize: vertical;
}

#jsonConfig:read-only {
    background-color: #e9ecef;
    color: #495057;
}

.button-group {
    margin-top: 15px;
    display: flex;
    gap: 10px;
}

#tab-advanced-settings .button-group {
    margin-top: 0;
    margin-bottom: 15px;
}

/* Settings Tab Styles */
.settings-section {
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid #f0f0f0;
}
.settings-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
}
.settings-section h3 {
    font-size: 18px;
    margin: 0 0 8px 0;
}
.settings-description {
    font-size: 14px;
    color: #666;
    margin: 0 0 15px 0;
    max-width: 80%;
}
.form-group {
    margin-bottom: 15px;
}
.form-group label, .form-group-checkbox label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
}
.form-group input[type="text"], 
.form-group input[type="password"] {
    width: 100%;
    max-width: 500px;
    padding: 10px 12px;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-sizing: border-box;
}
.form-group-checkbox {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
}
.form-group-checkbox input[type="checkbox"] {
    width: 18px;
    height: 18px;
    margin-right: 10px;
}
.form-group-checkbox label {
    margin-bottom: 0;
    font-weight: normal;
}
#webdav-fields-container.hidden {
    display: none;
}
  
/* Log Container */
#logContainer {
    margin-top: 20px;
}
#logContainer h4 {
    font-size: 16px;
    margin: 0 0 10px 0;
}
#log {
    background: #2b2b2b;
    color: #f1f1f1;
    padding: 15px;
    border-radius: 8px;
    max-height: 200px;
    overflow-y: auto;
    font-family: "Courier New", Courier, monospace;
    font-size: 13px;
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
}
  
/* File List for Restore */
#fileListContainer h4 {
    font-size: 16px;
    margin: 0 0 10px 0;
}
.hidden {
    display: none !important;
}
#fileList {
    list-style-type: none;
    padding: 0;
    margin: 0;
    max-height: 250px;
    overflow-y: auto;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
}
#fileList li {
    padding: 10px 15px;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    transition: background-color 0.2s;
}
#fileList li:last-child {
    border-bottom: none;
}
#fileList li:hover {
    background-color: #f0f8ff;
}
#fileList li:active {
    background-color: #e0f0ff;
}
  
/* Data overview in sidebar */
#stats-overview {
    display: flex;
    justify-content: space-around;
    text-align: center;
    background-color: #fff;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #e8e8e8;
}
#stats-overview div {
    display: flex;
    flex-direction: column;
}
#stats-overview .stat-value {
    font-size: 20px;
    font-weight: 600;
    color: #4a9eff;
}
#stats-overview .stat-label {
    font-size: 12px;
    color: #666;
    margin-top: 5px;
}

/* Info container in sidebar */
#infoContainer {
    margin-top: auto;
    padding-top: 20px;
    border-top: 1px solid #e0e0e0;
    color: #666;
    font-size: 12px;
    text-align: left;
}
#infoContainer div {
    margin-top: 8px;
}

/* Message/Toast Notification Container */
#messageContainer {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column-reverse;
    align-items: flex-end;
    gap: 10px;
}
.toast-message {
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-size: 14px;
    font-weight: 500;
    word-wrap: break-word;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}
.toast-message.show {
    opacity: 1;
    transform: translateX(0);
}
.toast-message.success {
    background-color: #2ed573;
}
.toast-message.error {
    background-color: #ff4a4a;
}
.toast-message.info {
    background-color: #4a9eff;
}

/* Help Panel (Modal) */
#helpPanel {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.6);
    z-index: 1000;
    overflow-y: auto;
    justify-content: center;
    align-items: center;
    padding: 20px;
    box-sizing: border-box;
}
#helpPanel.visible {
    display: flex;
}
#helpPanel .help-content-wrapper {
    background: white;
    padding: 30px;
    border-radius: 12px;
    max-width: 800px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 5px 25px rgba(0,0,0,0.2);
}
#helpPanel .help-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 15px;
    margin-bottom: 15px;
    border-bottom: 1px solid #eee;
}
#helpPanel h2 {
    font-size: 22px;
    font-weight: 600;
    margin: 0;
}
#closeHelpBtn {
    cursor: pointer;
    font-size: 28px;
    font-weight: bold;
    line-height: 1;
    color: #999;
    background: none;
    border: none;
}
#closeHelpBtn:hover {
    color: #333;
}
#helpPanel h3 {
    font-size: 18px;
    font-weight: 600;
    margin-top: 25px;
    margin-bottom: 12px;
}
#helpPanel ul {
    padding-left: 20px;
    list-style-type: disc;
}
#helpPanel li {
    margin-bottom: 10px;
    line-height: 1.7;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}
::-webkit-scrollbar-track {
    background: #f1f1f1;
}
::-webkit-scrollbar-thumb {
    background-color: #ccc;
    border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
    background-color: #aaa;
}
/* Deprecated and unused styles, remove or refactor */
#panel, .search-container, #buttonContainer, .toggle-group, .webdav-buttons { 
    display: none; 
}
.search-result {
    display: none;
} `, "",{"version":3,"sources":["webpack://./src/dashboard/dashboard.css"],"names":[],"mappings":"AAAA,4BAA4B;AAC5B;IACI,uGAAuG;IACvG,yBAAyB;IACzB,SAAS;IACT,WAAW;IACX,gBAAgB;AACpB;;AAEA;IACI,aAAa;IACb,WAAW;IACX,iBAAiB;IACjB,iBAAiB;IACjB,gBAAgB;IAChB,mBAAmB;IACnB,0CAA0C;IAC1C,8BAA8B;AAClC;;AAEA;IACI,YAAY;IACZ,cAAc;IACd,aAAa;IACb,+BAA+B;IAC/B,yBAAyB;IACzB,4BAA4B;IAC5B,aAAa;IACb,sBAAsB;AAC1B;;AAEA;IACI,YAAY;IACZ,aAAa;IACb,aAAa;IACb,sBAAsB;AAC1B;;AAEA,qBAAqB;AACrB;IACI,mBAAmB;AACvB;AACA;IACI,eAAe;IACf,gBAAgB;IAChB,WAAW;IACX,kBAAkB;IAClB,mBAAmB;IACnB,gCAAgC;AACpC;;AAEA,0BAA0B;AAC1B;IACI,gBAAgB;IAChB,yBAAyB;IACzB,mBAAmB;IACnB,aAAa;IACb,yCAAyC;IACzC,YAAY;AAChB;;AAEA,0BAA0B;AAC1B;IACI,kBAAkB;IAClB,YAAY;IACZ,kBAAkB;IAClB,eAAe;IACf,eAAe;IACf,gBAAgB;IAChB,yBAAyB;IACzB,YAAY;IACZ,wCAAwC;IACxC,mBAAmB;IACnB,kBAAkB;IAClB,oBAAoB;IACpB,mBAAmB;IACnB,uBAAuB;AAC3B;AACA;IACI,2BAA2B;IAC3B,YAAY;AAChB;AACA;IACI,YAAY;IACZ,mBAAmB;AACvB;;AAEA,2BAA2B;AAC3B;IACI,yBAAyB;AAC7B;AACA;IACI,yBAAyB;AAC7B;AACA;IACI,yBAAyB;AAC7B;AACA,eAAe,0BAA0B;IACrC,yBAAyB;AAC7B;;;AAGA,iBAAiB;AACjB;IACI,aAAa;IACb,sBAAsB;IACtB,SAAS;AACb;;AAEA,UAAU;AACV;IACI,aAAa;IACb,mBAAmB;IACnB,8BAA8B;IAC9B,gBAAgB;IAChB,eAAe;IACf,kBAAkB;IAClB,WAAW;IACX,oBAAoB;IACpB,gCAAgC;AACpC;AACA;IACI,eAAe;IACf,eAAe;IACf,WAAW;IACX,sBAAsB;AAC1B;AACA;IACI,WAAW;AACf;;AAEA,SAAS;AACT;IACI,aAAa;IACb,gCAAgC;IAChC,mBAAmB;AACvB;AACA;IACI,kBAAkB;IAClB,eAAe;IACf,YAAY;IACZ,6BAA6B;IAC7B,eAAe;IACf,WAAW;IACX,oCAAoC;IACpC,yBAAyB;IACzB,mBAAmB;AACvB;AACA;;IAEI,cAAc;IACd,4BAA4B;AAChC;AACA;IACI,aAAa;AACjB;AACA;IACI,aAAa,EAAE,qCAAqC;IACpD,sBAAsB;IACtB,YAAY;AAChB;;AAEA,sBAAsB;AACtB;IACI,aAAa;IACb,SAAS;IACT,mBAAmB;AACvB;AACA;IACI,YAAY;IACZ,kBAAkB;IAClB,sBAAsB;IACtB,kBAAkB;IAClB,eAAe;AACnB;AACA;IACI,kBAAkB;IAClB,sBAAsB;IACtB,kBAAkB;IAClB,eAAe;IACf,uBAAuB;AAC3B;;AAEA,eAAe;AACf;IACI,gBAAgB;IAChB,YAAY;IACZ,iBAAiB,EAAE,4BAA4B;IAC/C,yBAAyB;IACzB,kBAAkB;AACtB;AACA;IACI,gBAAgB;IAChB,UAAU;IACV,SAAS;AACb;AACA;IACI,aAAa;IACb,oCAAoC;IACpC,SAAS;IACT,mBAAmB;IACnB,kBAAkB;IAClB,gCAAgC;AACpC;AACA;IACI,mBAAmB;AACvB;AACA;IACI,qBAAqB;IACrB,cAAc;IACd,gBAAgB;IAChB,mBAAmB;IACnB,gBAAgB;IAChB,uBAAuB;AAC3B;AACA;IACI,0BAA0B;AAC9B;AACA;IACI,eAAe;IACf,WAAW;IACX,yBAAyB;IACzB,gBAAgB;IAChB,kBAAkB;AACtB;;AAEA,eAAe;AACf;IACI,aAAa;IACb,uBAAuB;IACvB,QAAQ;IACR,gBAAgB;AACpB;AACA;IACI,yBAAyB;IACzB,eAAe;AACnB;AACA;IACI,yBAAyB;IACzB,UAAU;AACd;;AAEA,0BAA0B;AAC1B;IACI,WAAW;IACX,aAAa;IACb,aAAa;IACb,sBAAsB;IACtB,kBAAkB;IAClB,8CAA8C;IAC9C,eAAe;IACf,gBAAgB;IAChB,qBAAqB;IACrB,kBAAkB;IAClB,yBAAyB;IACzB,gBAAgB;AACpB;;AAEA;IACI,yBAAyB;IACzB,cAAc;AAClB;;AAEA;IACI,gBAAgB;IAChB,aAAa;IACb,SAAS;AACb;;AAEA;IACI,aAAa;IACb,mBAAmB;AACvB;;AAEA,wBAAwB;AACxB;IACI,mBAAmB;IACnB,oBAAoB;IACpB,gCAAgC;AACpC;AACA;IACI,mBAAmB;IACnB,gBAAgB;IAChB,iBAAiB;AACrB;AACA;IACI,eAAe;IACf,iBAAiB;AACrB;AACA;IACI,eAAe;IACf,WAAW;IACX,kBAAkB;IAClB,cAAc;AAClB;AACA;IACI,mBAAmB;AACvB;AACA;IACI,cAAc;IACd,kBAAkB;IAClB,gBAAgB;AACpB;AACA;;IAEI,WAAW;IACX,gBAAgB;IAChB,kBAAkB;IAClB,sBAAsB;IACtB,kBAAkB;IAClB,sBAAsB;AAC1B;AACA;IACI,aAAa;IACb,mBAAmB;IACnB,mBAAmB;AACvB;AACA;IACI,WAAW;IACX,YAAY;IACZ,kBAAkB;AACtB;AACA;IACI,gBAAgB;IAChB,mBAAmB;AACvB;AACA;IACI,aAAa;AACjB;;AAEA,kBAAkB;AAClB;IACI,gBAAgB;AACpB;AACA;IACI,eAAe;IACf,kBAAkB;AACtB;AACA;IACI,mBAAmB;IACnB,cAAc;IACd,aAAa;IACb,kBAAkB;IAClB,iBAAiB;IACjB,gBAAgB;IAChB,8CAA8C;IAC9C,eAAe;IACf,SAAS;IACT,qBAAqB;IACrB,qBAAqB;AACzB;;AAEA,0BAA0B;AAC1B;IACI,eAAe;IACf,kBAAkB;AACtB;AACA;IACI,wBAAwB;AAC5B;AACA;IACI,qBAAqB;IACrB,UAAU;IACV,SAAS;IACT,iBAAiB;IACjB,gBAAgB;IAChB,yBAAyB;IACzB,kBAAkB;AACtB;AACA;IACI,kBAAkB;IAClB,6BAA6B;IAC7B,eAAe;IACf,iCAAiC;AACrC;AACA;IACI,mBAAmB;AACvB;AACA;IACI,yBAAyB;AAC7B;AACA;IACI,yBAAyB;AAC7B;;AAEA,6BAA6B;AAC7B;IACI,aAAa;IACb,6BAA6B;IAC7B,kBAAkB;IAClB,sBAAsB;IACtB,aAAa;IACb,kBAAkB;IAClB,yBAAyB;AAC7B;AACA;IACI,aAAa;IACb,sBAAsB;AAC1B;AACA;IACI,eAAe;IACf,gBAAgB;IAChB,cAAc;AAClB;AACA;IACI,eAAe;IACf,WAAW;IACX,eAAe;AACnB;;AAEA,8BAA8B;AAC9B;IACI,gBAAgB;IAChB,iBAAiB;IACjB,6BAA6B;IAC7B,WAAW;IACX,eAAe;IACf,gBAAgB;AACpB;AACA;IACI,eAAe;AACnB;;AAEA,yCAAyC;AACzC;IACI,eAAe;IACf,YAAY;IACZ,WAAW;IACX,aAAa;IACb,aAAa;IACb,8BAA8B;IAC9B,qBAAqB;IACrB,SAAS;AACb;AACA;IACI,kBAAkB;IAClB,kBAAkB;IAClB,YAAY;IACZ,eAAe;IACf,gBAAgB;IAChB,qBAAqB;IACrB,gBAAgB;IAChB,uCAAuC;IACvC,UAAU;IACV,2BAA2B;IAC3B,0DAA0D;AAC9D;AACA;IACI,UAAU;IACV,wBAAwB;AAC5B;AACA;IACI,yBAAyB;AAC7B;AACA;IACI,yBAAyB;AAC7B;AACA;IACI,yBAAyB;AAC7B;;AAEA,uBAAuB;AACvB;IACI,aAAa;IACb,eAAe;IACf,MAAM;IACN,OAAO;IACP,YAAY;IACZ,aAAa;IACb,oCAAoC;IACpC,aAAa;IACb,gBAAgB;IAChB,uBAAuB;IACvB,mBAAmB;IACnB,aAAa;IACb,sBAAsB;AAC1B;AACA;IACI,aAAa;AACjB;AACA;IACI,iBAAiB;IACjB,aAAa;IACb,mBAAmB;IACnB,gBAAgB;IAChB,UAAU;IACV,gBAAgB;IAChB,gBAAgB;IAChB,kBAAkB;IAClB,sCAAsC;AAC1C;AACA;IACI,aAAa;IACb,8BAA8B;IAC9B,mBAAmB;IACnB,oBAAoB;IACpB,mBAAmB;IACnB,6BAA6B;AACjC;AACA;IACI,eAAe;IACf,gBAAgB;IAChB,SAAS;AACb;AACA;IACI,eAAe;IACf,eAAe;IACf,iBAAiB;IACjB,cAAc;IACd,WAAW;IACX,gBAAgB;IAChB,YAAY;AAChB;AACA;IACI,WAAW;AACf;AACA;IACI,eAAe;IACf,gBAAgB;IAChB,gBAAgB;IAChB,mBAAmB;AACvB;AACA;IACI,kBAAkB;IAClB,qBAAqB;AACzB;AACA;IACI,mBAAmB;IACnB,gBAAgB;AACpB;;AAEA,qBAAqB;AACrB;IACI,UAAU;IACV,WAAW;AACf;AACA;IACI,mBAAmB;AACvB;AACA;IACI,sBAAsB;IACtB,kBAAkB;AACtB;AACA;IACI,sBAAsB;AAC1B;AACA,qDAAqD;AACrD;IACI,aAAa;AACjB;AACA;IACI,aAAa;AACjB","sourcesContent":["/* General Body and Layout */\r\nbody {\r\n    font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif;\r\n    background-color: #f0f2f5;\r\n    margin: 0;\r\n    color: #333;\r\n    min-width: 800px;\r\n}\r\n\r\n.dashboard-container {\r\n    display: flex;\r\n    width: 100%;\r\n    max-width: 1400px;\r\n    margin: 20px auto;\r\n    background: #fff;\r\n    border-radius: 16px;\r\n    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);\r\n    min-height: calc(100vh - 40px);\r\n}\r\n\r\n.sidebar {\r\n    width: 280px;\r\n    flex-shrink: 0;\r\n    padding: 25px;\r\n    border-right: 1px solid #e8e8e8;\r\n    background-color: #fafbfc;\r\n    border-radius: 16px 0 0 16px;\r\n    display: flex;\r\n    flex-direction: column;\r\n}\r\n\r\n.main-content {\r\n    flex-grow: 1;\r\n    padding: 25px;\r\n    display: flex;\r\n    flex-direction: column;\r\n}\r\n\r\n/* Sidebar Sections */\r\n.sidebar-section {\r\n    margin-bottom: 25px;\r\n}\r\n.sidebar-section h4 {\r\n    font-size: 14px;\r\n    font-weight: 600;\r\n    color: #555;\r\n    margin: 0 0 15px 0;\r\n    padding-bottom: 8px;\r\n    border-bottom: 1px solid #e8e8e8;\r\n}\r\n\r\n/* Card for main content */\r\n.card {\r\n    background: #fff;\r\n    border: 1px solid #e8e8e8;\r\n    border-radius: 12px;\r\n    padding: 25px;\r\n    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);\r\n    flex-grow: 1;\r\n}\r\n\r\n/* Generic Button Styles */\r\nbutton, .button-like {\r\n    padding: 10px 18px;\r\n    color: white;\r\n    border-radius: 8px;\r\n    cursor: pointer;\r\n    font-size: 14px;\r\n    font-weight: 500;\r\n    transition: all 0.3s ease;\r\n    border: none;\r\n    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);\r\n    white-space: nowrap;\r\n    text-align: center;\r\n    display: inline-flex;\r\n    align-items: center;\r\n    justify-content: center;\r\n}\r\nbutton:hover:not(:disabled) {\r\n    transform: translateY(-1px);\r\n    opacity: 0.9;\r\n}\r\nbutton:disabled {\r\n    opacity: 0.6;\r\n    cursor: not-allowed;\r\n}\r\n\r\n/* Specific Button Colors */\r\n#exportBtn, #syncNow, #saveAndTest {\r\n    background-color: #4a9eff;\r\n}\r\n#syncDown {\r\n    background-color: #2ed573;\r\n}\r\n#clearAllBtn {\r\n    background-color: #ff4a4a;\r\n}\r\n.button-like { /* For file import label */\r\n    background-color: #6c757d;\r\n}\r\n\r\n\r\n/* Button Group */\r\n.button-group-vertical {\r\n    display: flex;\r\n    flex-direction: column;\r\n    gap: 10px;\r\n}\r\n\r\n/* Title */\r\n.panel-title {\r\n    display: flex;\r\n    align-items: center;\r\n    justify-content: space-between;\r\n    font-weight: 600;\r\n    font-size: 20px;\r\n    margin: 0 0 25px 0;\r\n    color: #333;\r\n    padding-bottom: 15px;\r\n    border-bottom: 1px solid #e0e0e0;\r\n}\r\n#helpBtn {\r\n    cursor: pointer;\r\n    font-size: 20px;\r\n    color: #888;\r\n    transition: color 0.3s;\r\n}\r\n#helpBtn:hover {\r\n    color: #333;\r\n}\r\n\r\n/* Tabs */\r\n.tabs {\r\n    display: flex;\r\n    border-bottom: 1px solid #e8e8e8;\r\n    margin-bottom: 25px;\r\n}\r\n.tab-link {\r\n    padding: 12px 20px;\r\n    cursor: pointer;\r\n    border: none;\r\n    background-color: transparent;\r\n    font-size: 16px;\r\n    color: #666;\r\n    border-bottom: 3px solid transparent;\r\n    transition: all 0.3s ease;\r\n    margin-bottom: -1px;\r\n}\r\n.tab-link.active,\r\n.tab-link:hover {\r\n    color: #4a9eff;\r\n    border-bottom-color: #4a9eff;\r\n}\r\n.tab-content {\r\n    display: none;\r\n}\r\n.tab-content.active {\r\n    display: flex; /* Changed to flex for card to grow */\r\n    flex-direction: column;\r\n    flex-grow: 1;\r\n}\r\n\r\n/* Search and Filter */\r\n.search-and-filter {\r\n    display: flex;\r\n    gap: 15px;\r\n    margin-bottom: 20px;\r\n}\r\n#searchInput {\r\n    flex-grow: 1;\r\n    padding: 10px 15px;\r\n    border: 1px solid #ddd;\r\n    border-radius: 8px;\r\n    font-size: 14px;\r\n}\r\n#filterSelect {\r\n    padding: 10px 15px;\r\n    border: 1px solid #ddd;\r\n    border-radius: 8px;\r\n    font-size: 14px;\r\n    background-color: white;\r\n}\r\n\r\n/* Video List */\r\n.video-list-container {\r\n    overflow-y: auto;\r\n    flex-grow: 1;\r\n    min-height: 300px; /* Ensure a minimum height */\r\n    border: 1px solid #e8e8e8;\r\n    border-radius: 8px;\r\n}\r\n#videoList {\r\n    list-style: none;\r\n    padding: 0;\r\n    margin: 0;\r\n}\r\n#videoList li {\r\n    display: grid;\r\n    grid-template-columns: 1fr auto auto;\r\n    gap: 15px;\r\n    align-items: center;\r\n    padding: 12px 15px;\r\n    border-bottom: 1px solid #f0f0f0;\r\n}\r\n#videoList li:last-child {\r\n    border-bottom: none;\r\n}\r\n#videoList li a {\r\n    text-decoration: none;\r\n    color: #007bff;\r\n    font-weight: 500;\r\n    white-space: nowrap;\r\n    overflow: hidden;\r\n    text-overflow: ellipsis;\r\n}\r\n#videoList li a:hover {\r\n    text-decoration: underline;\r\n}\r\n#videoList li span {\r\n    font-size: 13px;\r\n    color: #666;\r\n    background-color: #f0f2f5;\r\n    padding: 3px 8px;\r\n    border-radius: 5px;\r\n}\r\n\r\n/* Pagination */\r\n.pagination {\r\n    display: flex;\r\n    justify-content: center;\r\n    gap: 8px;\r\n    margin-top: 20px;\r\n}\r\n.pagination button {\r\n    background-color: #6c757d;\r\n    min-width: 40px;\r\n}\r\n.pagination button:disabled {\r\n    background-color: #4a9eff;\r\n    opacity: 1;\r\n}\r\n\r\n/* Advanced Settings Tab */\r\n#jsonConfig {\r\n    width: 100%;\r\n    height: 400px;\r\n    padding: 15px;\r\n    border: 1px solid #ccc;\r\n    border-radius: 8px;\r\n    font-family: \"Courier New\", Courier, monospace;\r\n    font-size: 14px;\r\n    white-space: pre;\r\n    overflow-wrap: normal;\r\n    overflow-x: scroll;\r\n    background-color: #f9f9f9;\r\n    resize: vertical;\r\n}\r\n\r\n#jsonConfig:read-only {\r\n    background-color: #e9ecef;\r\n    color: #495057;\r\n}\r\n\r\n.button-group {\r\n    margin-top: 15px;\r\n    display: flex;\r\n    gap: 10px;\r\n}\r\n\r\n#tab-advanced-settings .button-group {\r\n    margin-top: 0;\r\n    margin-bottom: 15px;\r\n}\r\n\r\n/* Settings Tab Styles */\r\n.settings-section {\r\n    margin-bottom: 30px;\r\n    padding-bottom: 20px;\r\n    border-bottom: 1px solid #f0f0f0;\r\n}\r\n.settings-section:last-child {\r\n    border-bottom: none;\r\n    margin-bottom: 0;\r\n    padding-bottom: 0;\r\n}\r\n.settings-section h3 {\r\n    font-size: 18px;\r\n    margin: 0 0 8px 0;\r\n}\r\n.settings-description {\r\n    font-size: 14px;\r\n    color: #666;\r\n    margin: 0 0 15px 0;\r\n    max-width: 80%;\r\n}\r\n.form-group {\r\n    margin-bottom: 15px;\r\n}\r\n.form-group label, .form-group-checkbox label {\r\n    display: block;\r\n    margin-bottom: 5px;\r\n    font-weight: 500;\r\n}\r\n.form-group input[type=\"text\"], \r\n.form-group input[type=\"password\"] {\r\n    width: 100%;\r\n    max-width: 500px;\r\n    padding: 10px 12px;\r\n    border: 1px solid #ccc;\r\n    border-radius: 8px;\r\n    box-sizing: border-box;\r\n}\r\n.form-group-checkbox {\r\n    display: flex;\r\n    align-items: center;\r\n    margin-bottom: 10px;\r\n}\r\n.form-group-checkbox input[type=\"checkbox\"] {\r\n    width: 18px;\r\n    height: 18px;\r\n    margin-right: 10px;\r\n}\r\n.form-group-checkbox label {\r\n    margin-bottom: 0;\r\n    font-weight: normal;\r\n}\r\n#webdav-fields-container.hidden {\r\n    display: none;\r\n}\r\n  \r\n/* Log Container */\r\n#logContainer {\r\n    margin-top: 20px;\r\n}\r\n#logContainer h4 {\r\n    font-size: 16px;\r\n    margin: 0 0 10px 0;\r\n}\r\n#log {\r\n    background: #2b2b2b;\r\n    color: #f1f1f1;\r\n    padding: 15px;\r\n    border-radius: 8px;\r\n    max-height: 200px;\r\n    overflow-y: auto;\r\n    font-family: \"Courier New\", Courier, monospace;\r\n    font-size: 13px;\r\n    margin: 0;\r\n    white-space: pre-wrap;\r\n    word-wrap: break-word;\r\n}\r\n  \r\n/* File List for Restore */\r\n#fileListContainer h4 {\r\n    font-size: 16px;\r\n    margin: 0 0 10px 0;\r\n}\r\n.hidden {\r\n    display: none !important;\r\n}\r\n#fileList {\r\n    list-style-type: none;\r\n    padding: 0;\r\n    margin: 0;\r\n    max-height: 250px;\r\n    overflow-y: auto;\r\n    border: 1px solid #e8e8e8;\r\n    border-radius: 8px;\r\n}\r\n#fileList li {\r\n    padding: 10px 15px;\r\n    border-bottom: 1px solid #eee;\r\n    cursor: pointer;\r\n    transition: background-color 0.2s;\r\n}\r\n#fileList li:last-child {\r\n    border-bottom: none;\r\n}\r\n#fileList li:hover {\r\n    background-color: #f0f8ff;\r\n}\r\n#fileList li:active {\r\n    background-color: #e0f0ff;\r\n}\r\n  \r\n/* Data overview in sidebar */\r\n#stats-overview {\r\n    display: flex;\r\n    justify-content: space-around;\r\n    text-align: center;\r\n    background-color: #fff;\r\n    padding: 15px;\r\n    border-radius: 8px;\r\n    border: 1px solid #e8e8e8;\r\n}\r\n#stats-overview div {\r\n    display: flex;\r\n    flex-direction: column;\r\n}\r\n#stats-overview .stat-value {\r\n    font-size: 20px;\r\n    font-weight: 600;\r\n    color: #4a9eff;\r\n}\r\n#stats-overview .stat-label {\r\n    font-size: 12px;\r\n    color: #666;\r\n    margin-top: 5px;\r\n}\r\n\r\n/* Info container in sidebar */\r\n#infoContainer {\r\n    margin-top: auto;\r\n    padding-top: 20px;\r\n    border-top: 1px solid #e0e0e0;\r\n    color: #666;\r\n    font-size: 12px;\r\n    text-align: left;\r\n}\r\n#infoContainer div {\r\n    margin-top: 8px;\r\n}\r\n\r\n/* Message/Toast Notification Container */\r\n#messageContainer {\r\n    position: fixed;\r\n    bottom: 20px;\r\n    right: 20px;\r\n    z-index: 9999;\r\n    display: flex;\r\n    flex-direction: column-reverse;\r\n    align-items: flex-end;\r\n    gap: 10px;\r\n}\r\n.toast-message {\r\n    padding: 12px 20px;\r\n    border-radius: 8px;\r\n    color: white;\r\n    font-size: 14px;\r\n    font-weight: 500;\r\n    word-wrap: break-word;\r\n    max-width: 300px;\r\n    box-shadow: 0 4px 12px rgba(0,0,0,0.15);\r\n    opacity: 0;\r\n    transform: translateX(100%);\r\n    transition: all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);\r\n}\r\n.toast-message.show {\r\n    opacity: 1;\r\n    transform: translateX(0);\r\n}\r\n.toast-message.success {\r\n    background-color: #2ed573;\r\n}\r\n.toast-message.error {\r\n    background-color: #ff4a4a;\r\n}\r\n.toast-message.info {\r\n    background-color: #4a9eff;\r\n}\r\n\r\n/* Help Panel (Modal) */\r\n#helpPanel {\r\n    display: none;\r\n    position: fixed;\r\n    top: 0;\r\n    left: 0;\r\n    width: 100vw;\r\n    height: 100vh;\r\n    background-color: rgba(0, 0, 0, 0.6);\r\n    z-index: 1000;\r\n    overflow-y: auto;\r\n    justify-content: center;\r\n    align-items: center;\r\n    padding: 20px;\r\n    box-sizing: border-box;\r\n}\r\n#helpPanel.visible {\r\n    display: flex;\r\n}\r\n#helpPanel .help-content-wrapper {\r\n    background: white;\r\n    padding: 30px;\r\n    border-radius: 12px;\r\n    max-width: 800px;\r\n    width: 90%;\r\n    max-height: 90vh;\r\n    overflow-y: auto;\r\n    position: relative;\r\n    box-shadow: 0 5px 25px rgba(0,0,0,0.2);\r\n}\r\n#helpPanel .help-header {\r\n    display: flex;\r\n    justify-content: space-between;\r\n    align-items: center;\r\n    padding-bottom: 15px;\r\n    margin-bottom: 15px;\r\n    border-bottom: 1px solid #eee;\r\n}\r\n#helpPanel h2 {\r\n    font-size: 22px;\r\n    font-weight: 600;\r\n    margin: 0;\r\n}\r\n#closeHelpBtn {\r\n    cursor: pointer;\r\n    font-size: 28px;\r\n    font-weight: bold;\r\n    line-height: 1;\r\n    color: #999;\r\n    background: none;\r\n    border: none;\r\n}\r\n#closeHelpBtn:hover {\r\n    color: #333;\r\n}\r\n#helpPanel h3 {\r\n    font-size: 18px;\r\n    font-weight: 600;\r\n    margin-top: 25px;\r\n    margin-bottom: 12px;\r\n}\r\n#helpPanel ul {\r\n    padding-left: 20px;\r\n    list-style-type: disc;\r\n}\r\n#helpPanel li {\r\n    margin-bottom: 10px;\r\n    line-height: 1.7;\r\n}\r\n\r\n/* Custom Scrollbar */\r\n::-webkit-scrollbar {\r\n    width: 8px;\r\n    height: 8px;\r\n}\r\n::-webkit-scrollbar-track {\r\n    background: #f1f1f1;\r\n}\r\n::-webkit-scrollbar-thumb {\r\n    background-color: #ccc;\r\n    border-radius: 4px;\r\n}\r\n::-webkit-scrollbar-thumb:hover {\r\n    background-color: #aaa;\r\n}\r\n/* Deprecated and unused styles, remove or refactor */\r\n#panel, .search-container, #buttonContainer, .toggle-group, .webdav-buttons { \r\n    display: none; \r\n}\r\n.search-result {\r\n    display: none;\r\n} "],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/runtime/api.js":
/*!*****************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/api.js ***!
  \*****************************************************/
/***/ ((module) => {

"use strict";


/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
module.exports = function (cssWithMappingToString) {
  var list = [];

  // return the list of modules as css string
  list.toString = function toString() {
    return this.map(function (item) {
      var content = "";
      var needLayer = typeof item[5] !== "undefined";
      if (item[4]) {
        content += "@supports (".concat(item[4], ") {");
      }
      if (item[2]) {
        content += "@media ".concat(item[2], " {");
      }
      if (needLayer) {
        content += "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {");
      }
      content += cssWithMappingToString(item);
      if (needLayer) {
        content += "}";
      }
      if (item[2]) {
        content += "}";
      }
      if (item[4]) {
        content += "}";
      }
      return content;
    }).join("");
  };

  // import a list of modules into the list
  list.i = function i(modules, media, dedupe, supports, layer) {
    if (typeof modules === "string") {
      modules = [[null, modules, undefined]];
    }
    var alreadyImportedModules = {};
    if (dedupe) {
      for (var k = 0; k < this.length; k++) {
        var id = this[k][0];
        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }
    for (var _k = 0; _k < modules.length; _k++) {
      var item = [].concat(modules[_k]);
      if (dedupe && alreadyImportedModules[item[0]]) {
        continue;
      }
      if (typeof layer !== "undefined") {
        if (typeof item[5] === "undefined") {
          item[5] = layer;
        } else {
          item[1] = "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {").concat(item[1], "}");
          item[5] = layer;
        }
      }
      if (media) {
        if (!item[2]) {
          item[2] = media;
        } else {
          item[1] = "@media ".concat(item[2], " {").concat(item[1], "}");
          item[2] = media;
        }
      }
      if (supports) {
        if (!item[4]) {
          item[4] = "".concat(supports);
        } else {
          item[1] = "@supports (".concat(item[4], ") {").concat(item[1], "}");
          item[4] = supports;
        }
      }
      list.push(item);
    }
  };
  return list;
};

/***/ }),

/***/ "./node_modules/css-loader/dist/runtime/sourceMaps.js":
/*!************************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/sourceMaps.js ***!
  \************************************************************/
/***/ ((module) => {

"use strict";


module.exports = function (item) {
  var content = item[1];
  var cssMapping = item[3];
  if (!cssMapping) {
    return content;
  }
  if (typeof btoa === "function") {
    var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(cssMapping))));
    var data = "sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(base64);
    var sourceMapping = "/*# ".concat(data, " */");
    return [content].concat([sourceMapping]).join("\n");
  }
  return [content].join("\n");
};

/***/ }),

/***/ "./node_modules/define-data-property/index.js":
/*!****************************************************!*\
  !*** ./node_modules/define-data-property/index.js ***!
  \****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var $defineProperty = __webpack_require__(/*! es-define-property */ "./node_modules/es-define-property/index.js");
var $SyntaxError = __webpack_require__(/*! es-errors/syntax */ "./node_modules/es-errors/syntax.js");
var $TypeError = __webpack_require__(/*! es-errors/type */ "./node_modules/es-errors/type.js");
var gopd = __webpack_require__(/*! gopd */ "./node_modules/gopd/index.js");

/** @type {import('.')} */
module.exports = function defineDataProperty(obj, property, value) {
  if (!obj || _typeof(obj) !== 'object' && typeof obj !== 'function') {
    throw new $TypeError('`obj` must be an object or a function`');
  }
  if (typeof property !== 'string' && _typeof(property) !== 'symbol') {
    throw new $TypeError('`property` must be a string or a symbol`');
  }
  if (arguments.length > 3 && typeof arguments[3] !== 'boolean' && arguments[3] !== null) {
    throw new $TypeError('`nonEnumerable`, if provided, must be a boolean or null');
  }
  if (arguments.length > 4 && typeof arguments[4] !== 'boolean' && arguments[4] !== null) {
    throw new $TypeError('`nonWritable`, if provided, must be a boolean or null');
  }
  if (arguments.length > 5 && typeof arguments[5] !== 'boolean' && arguments[5] !== null) {
    throw new $TypeError('`nonConfigurable`, if provided, must be a boolean or null');
  }
  if (arguments.length > 6 && typeof arguments[6] !== 'boolean') {
    throw new $TypeError('`loose`, if provided, must be a boolean');
  }
  var nonEnumerable = arguments.length > 3 ? arguments[3] : null;
  var nonWritable = arguments.length > 4 ? arguments[4] : null;
  var nonConfigurable = arguments.length > 5 ? arguments[5] : null;
  var loose = arguments.length > 6 ? arguments[6] : false;

  /* @type {false | TypedPropertyDescriptor<unknown>} */
  var desc = !!gopd && gopd(obj, property);
  if ($defineProperty) {
    $defineProperty(obj, property, {
      configurable: nonConfigurable === null && desc ? desc.configurable : !nonConfigurable,
      enumerable: nonEnumerable === null && desc ? desc.enumerable : !nonEnumerable,
      value: value,
      writable: nonWritable === null && desc ? desc.writable : !nonWritable
    });
  } else if (loose || !nonEnumerable && !nonWritable && !nonConfigurable) {
    // must fall back to [[Set]], and was not explicitly asked to make non-enumerable, non-writable, or non-configurable
    obj[property] = value; // eslint-disable-line no-param-reassign
  } else {
    throw new $SyntaxError('This environment does not support defining a property as non-configurable, non-writable, or non-enumerable.');
  }
};

/***/ }),

/***/ "./node_modules/dunder-proto/get.js":
/*!******************************************!*\
  !*** ./node_modules/dunder-proto/get.js ***!
  \******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var callBind = __webpack_require__(/*! call-bind-apply-helpers */ "./node_modules/call-bind-apply-helpers/index.js");
var gOPD = __webpack_require__(/*! gopd */ "./node_modules/gopd/index.js");
var hasProtoAccessor;
try {
  // eslint-disable-next-line no-extra-parens, no-proto
  hasProtoAccessor = /** @type {{ __proto__?: typeof Array.prototype }} */[].__proto__ === Array.prototype;
} catch (e) {
  if (!e || _typeof(e) !== 'object' || !('code' in e) || e.code !== 'ERR_PROTO_ACCESS') {
    throw e;
  }
}

// eslint-disable-next-line no-extra-parens
var desc = !!hasProtoAccessor && gOPD && gOPD(Object.prototype, /** @type {keyof typeof Object.prototype} */'__proto__');
var $Object = Object;
var $getPrototypeOf = $Object.getPrototypeOf;

/** @type {import('./get')} */
module.exports = desc && typeof desc.get === 'function' ? callBind([desc.get]) : typeof $getPrototypeOf === 'function' ? /** @type {import('./get')} */function getDunder(value) {
  // eslint-disable-next-line eqeqeq
  return $getPrototypeOf(value == null ? value : $Object(value));
} : false;

/***/ }),

/***/ "./node_modules/es-define-property/index.js":
/*!**************************************************!*\
  !*** ./node_modules/es-define-property/index.js ***!
  \**************************************************/
/***/ ((module) => {

"use strict";


/** @type {import('.')} */
var $defineProperty = Object.defineProperty || false;
if ($defineProperty) {
  try {
    $defineProperty({}, 'a', {
      value: 1
    });
  } catch (e) {
    // IE 8 has a broken defineProperty
    $defineProperty = false;
  }
}
module.exports = $defineProperty;

/***/ }),

/***/ "./node_modules/es-errors/eval.js":
/*!****************************************!*\
  !*** ./node_modules/es-errors/eval.js ***!
  \****************************************/
/***/ ((module) => {

"use strict";


/** @type {import('./eval')} */
module.exports = EvalError;

/***/ }),

/***/ "./node_modules/es-errors/index.js":
/*!*****************************************!*\
  !*** ./node_modules/es-errors/index.js ***!
  \*****************************************/
/***/ ((module) => {

"use strict";


/** @type {import('.')} */
module.exports = Error;

/***/ }),

/***/ "./node_modules/es-errors/range.js":
/*!*****************************************!*\
  !*** ./node_modules/es-errors/range.js ***!
  \*****************************************/
/***/ ((module) => {

"use strict";


/** @type {import('./range')} */
module.exports = RangeError;

/***/ }),

/***/ "./node_modules/es-errors/ref.js":
/*!***************************************!*\
  !*** ./node_modules/es-errors/ref.js ***!
  \***************************************/
/***/ ((module) => {

"use strict";


/** @type {import('./ref')} */
module.exports = ReferenceError;

/***/ }),

/***/ "./node_modules/es-errors/syntax.js":
/*!******************************************!*\
  !*** ./node_modules/es-errors/syntax.js ***!
  \******************************************/
/***/ ((module) => {

"use strict";


/** @type {import('./syntax')} */
module.exports = SyntaxError;

/***/ }),

/***/ "./node_modules/es-errors/type.js":
/*!****************************************!*\
  !*** ./node_modules/es-errors/type.js ***!
  \****************************************/
/***/ ((module) => {

"use strict";


/** @type {import('./type')} */
module.exports = TypeError;

/***/ }),

/***/ "./node_modules/es-errors/uri.js":
/*!***************************************!*\
  !*** ./node_modules/es-errors/uri.js ***!
  \***************************************/
/***/ ((module) => {

"use strict";


/** @type {import('./uri')} */
module.exports = URIError;

/***/ }),

/***/ "./node_modules/es-object-atoms/index.js":
/*!***********************************************!*\
  !*** ./node_modules/es-object-atoms/index.js ***!
  \***********************************************/
/***/ ((module) => {

"use strict";


/** @type {import('.')} */
module.exports = Object;

/***/ }),

/***/ "./node_modules/events/events.js":
/*!***************************************!*\
  !*** ./node_modules/events/events.js ***!
  \***************************************/
/***/ ((module) => {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var R = (typeof Reflect === "undefined" ? "undefined" : _typeof(Reflect)) === 'object' ? Reflect : null;
var ReflectApply = R && typeof R.apply === 'function' ? R.apply : function ReflectApply(target, receiver, args) {
  return Function.prototype.apply.call(target, receiver, args);
};
var ReflectOwnKeys;
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys;
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}
function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}
var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
};
function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;
module.exports.once = once;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;
EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;
function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + _typeof(listener));
  }
}
Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function get() {
    return defaultMaxListeners;
  },
  set: function set(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});
EventEmitter.init = function () {
  if (this._events === undefined || this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }
  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};
function _getMaxListeners(that) {
  if (that._maxListeners === undefined) return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}
EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};
EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = type === 'error';
  var events = this._events;
  if (events !== undefined) doError = doError && events.error === undefined;else if (!doError) return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0) er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }
  var handler = events[type];
  if (handler === undefined) return false;
  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i) ReflectApply(listeners[i], this, args);
  }
  return true;
};
function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;
  checkListener(listener);
  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type, listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }
  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] = prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' + existing.length + ' ' + String(type) + ' listeners ' + 'added. Use emitter.setMaxListeners() to ' + 'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }
  return target;
}
EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};
EventEmitter.prototype.on = EventEmitter.prototype.addListener;
EventEmitter.prototype.prependListener = function prependListener(type, listener) {
  return _addListener(this, type, listener, true);
};
function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0) return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}
function _onceWrap(target, type, listener) {
  var state = {
    fired: false,
    wrapFn: undefined,
    target: target,
    type: type,
    listener: listener
  };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}
EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};
EventEmitter.prototype.prependOnceListener = function prependOnceListener(type, listener) {
  checkListener(listener);
  this.prependListener(type, _onceWrap(this, type, listener));
  return this;
};

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener = function removeListener(type, listener) {
  var list, events, position, i, originalListener;
  checkListener(listener);
  events = this._events;
  if (events === undefined) return this;
  list = events[type];
  if (list === undefined) return this;
  if (list === listener || list.listener === listener) {
    if (--this._eventsCount === 0) this._events = Object.create(null);else {
      delete events[type];
      if (events.removeListener) this.emit('removeListener', type, list.listener || listener);
    }
  } else if (typeof list !== 'function') {
    position = -1;
    for (i = list.length - 1; i >= 0; i--) {
      if (list[i] === listener || list[i].listener === listener) {
        originalListener = list[i].listener;
        position = i;
        break;
      }
    }
    if (position < 0) return this;
    if (position === 0) list.shift();else {
      spliceOne(list, position);
    }
    if (list.length === 1) events[type] = list[0];
    if (events.removeListener !== undefined) this.emit('removeListener', type, originalListener || listener);
  }
  return this;
};
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {
  var listeners, events, i;
  events = this._events;
  if (events === undefined) return this;

  // not listening for removeListener, no need to emit
  if (events.removeListener === undefined) {
    if (arguments.length === 0) {
      this._events = Object.create(null);
      this._eventsCount = 0;
    } else if (events[type] !== undefined) {
      if (--this._eventsCount === 0) this._events = Object.create(null);else delete events[type];
    }
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    var keys = Object.keys(events);
    var key;
    for (i = 0; i < keys.length; ++i) {
      key = keys[i];
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = Object.create(null);
    this._eventsCount = 0;
    return this;
  }
  listeners = events[type];
  if (typeof listeners === 'function') {
    this.removeListener(type, listeners);
  } else if (listeners !== undefined) {
    // LIFO order
    for (i = listeners.length - 1; i >= 0; i--) {
      this.removeListener(type, listeners[i]);
    }
  }
  return this;
};
function _listeners(target, type, unwrap) {
  var events = target._events;
  if (events === undefined) return [];
  var evlistener = events[type];
  if (evlistener === undefined) return [];
  if (typeof evlistener === 'function') return unwrap ? [evlistener.listener || evlistener] : [evlistener];
  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}
EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};
EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};
EventEmitter.listenerCount = function (emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};
EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;
  if (events !== undefined) {
    var evlistener = events[type];
    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }
  return 0;
}
EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};
function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i) copy[i] = arr[i];
  return copy;
}
function spliceOne(list, index) {
  for (; index + 1 < list.length; index++) list[index] = list[index + 1];
  list.pop();
}
function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}
function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }
    function resolver() {
      if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('error', errorListener);
      }
      resolve([].slice.call(arguments));
    }
    ;
    eventTargetAgnosticAddListener(emitter, name, resolver, {
      once: true
    });
    if (name !== 'error') {
      addErrorHandlerIfEventEmitter(emitter, errorListener, {
        once: true
      });
    }
  });
}
function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}
function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === 'function') {
    // EventTarget does not have `error` event semantics like Node
    // EventEmitters, we do not listen for `error` events here.
    emitter.addEventListener(name, function wrapListener(arg) {
      // IE does not have builtin `{ once: true }` support so we
      // have to do it manually.
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + _typeof(emitter));
  }
}

/***/ }),

/***/ "./node_modules/fast-xml-parser/src/json2xml.js":
/*!******************************************************!*\
  !*** ./node_modules/fast-xml-parser/src/json2xml.js ***!
  \******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


//parse Empty Node as self closing node
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var buildOptions = (__webpack_require__(/*! ./util */ "./node_modules/fast-xml-parser/src/util.js").buildOptions);
var defaultOptions = {
  attributeNamePrefix: '@_',
  attrNodeName: false,
  textNodeName: '#text',
  ignoreAttributes: true,
  cdataTagName: false,
  cdataPositionChar: '\\c',
  format: false,
  indentBy: '  ',
  supressEmptyNode: false,
  tagValueProcessor: function tagValueProcessor(a) {
    return a;
  },
  attrValueProcessor: function attrValueProcessor(a) {
    return a;
  }
};
var props = ['attributeNamePrefix', 'attrNodeName', 'textNodeName', 'ignoreAttributes', 'cdataTagName', 'cdataPositionChar', 'format', 'indentBy', 'supressEmptyNode', 'tagValueProcessor', 'attrValueProcessor', 'rootNodeName' //when array as root
];
function Parser(options) {
  this.options = buildOptions(options, defaultOptions, props);
  if (this.options.ignoreAttributes || this.options.attrNodeName) {
    this.isAttribute = function /*a*/
    () {
      return false;
    };
  } else {
    this.attrPrefixLen = this.options.attributeNamePrefix.length;
    this.isAttribute = isAttribute;
  }
  if (this.options.cdataTagName) {
    this.isCDATA = isCDATA;
  } else {
    this.isCDATA = function /*a*/
    () {
      return false;
    };
  }
  this.replaceCDATAstr = replaceCDATAstr;
  this.replaceCDATAarr = replaceCDATAarr;
  this.processTextOrObjNode = processTextOrObjNode;
  if (this.options.format) {
    this.indentate = indentate;
    this.tagEndChar = '>\n';
    this.newLine = '\n';
  } else {
    this.indentate = function () {
      return '';
    };
    this.tagEndChar = '>';
    this.newLine = '';
  }
  if (this.options.supressEmptyNode) {
    this.buildTextNode = buildEmptyTextNode;
    this.buildObjNode = buildEmptyObjNode;
  } else {
    this.buildTextNode = buildTextValNode;
    this.buildObjNode = buildObjectNode;
  }
  this.buildTextValNode = buildTextValNode;
  this.buildObjectNode = buildObjectNode;
}
Parser.prototype.parse = function (jObj) {
  if (Array.isArray(jObj) && this.options.rootNodeName && this.options.rootNodeName.length > 1) {
    jObj = _defineProperty({}, this.options.rootNodeName, jObj);
  }
  return this.j2x(jObj, 0).val;
};
Parser.prototype.j2x = function (jObj, level) {
  var attrStr = '';
  var val = '';
  for (var key in jObj) {
    if (typeof jObj[key] === 'undefined') {
      // supress undefined node
    } else if (jObj[key] === null) {
      val += this.indentate(level) + '<' + key + '/' + this.tagEndChar;
    } else if (jObj[key] instanceof Date) {
      val += this.buildTextNode(jObj[key], key, '', level);
    } else if (_typeof(jObj[key]) !== 'object') {
      //premitive type
      var attr = this.isAttribute(key);
      if (attr) {
        attrStr += ' ' + attr + '="' + this.options.attrValueProcessor('' + jObj[key]) + '"';
      } else if (this.isCDATA(key)) {
        if (jObj[this.options.textNodeName]) {
          val += this.replaceCDATAstr(jObj[this.options.textNodeName], jObj[key]);
        } else {
          val += this.replaceCDATAstr('', jObj[key]);
        }
      } else {
        //tag value
        if (key === this.options.textNodeName) {
          if (jObj[this.options.cdataTagName]) {
            //value will added while processing cdata
          } else {
            val += this.options.tagValueProcessor('' + jObj[key]);
          }
        } else {
          val += this.buildTextNode(jObj[key], key, '', level);
        }
      }
    } else if (Array.isArray(jObj[key])) {
      //repeated nodes
      if (this.isCDATA(key)) {
        val += this.indentate(level);
        if (jObj[this.options.textNodeName]) {
          val += this.replaceCDATAarr(jObj[this.options.textNodeName], jObj[key]);
        } else {
          val += this.replaceCDATAarr('', jObj[key]);
        }
      } else {
        //nested nodes
        var arrLen = jObj[key].length;
        for (var j = 0; j < arrLen; j++) {
          var item = jObj[key][j];
          if (typeof item === 'undefined') {
            // supress undefined node
          } else if (item === null) {
            val += this.indentate(level) + '<' + key + '/' + this.tagEndChar;
          } else if (_typeof(item) === 'object') {
            val += this.processTextOrObjNode(item, key, level);
          } else {
            val += this.buildTextNode(item, key, '', level);
          }
        }
      }
    } else {
      //nested node
      if (this.options.attrNodeName && key === this.options.attrNodeName) {
        var Ks = Object.keys(jObj[key]);
        var L = Ks.length;
        for (var _j = 0; _j < L; _j++) {
          attrStr += ' ' + Ks[_j] + '="' + this.options.attrValueProcessor('' + jObj[key][Ks[_j]]) + '"';
        }
      } else {
        val += this.processTextOrObjNode(jObj[key], key, level);
      }
    }
  }
  return {
    attrStr: attrStr,
    val: val
  };
};
function processTextOrObjNode(object, key, level) {
  var result = this.j2x(object, level + 1);
  if (object[this.options.textNodeName] !== undefined && Object.keys(object).length === 1) {
    return this.buildTextNode(result.val, key, result.attrStr, level);
  } else {
    return this.buildObjNode(result.val, key, result.attrStr, level);
  }
}
function replaceCDATAstr(str, cdata) {
  str = this.options.tagValueProcessor('' + str);
  if (this.options.cdataPositionChar === '' || str === '') {
    return str + '<![CDATA[' + cdata + ']]' + this.tagEndChar;
  } else {
    return str.replace(this.options.cdataPositionChar, '<![CDATA[' + cdata + ']]' + this.tagEndChar);
  }
}
function replaceCDATAarr(str, cdata) {
  str = this.options.tagValueProcessor('' + str);
  if (this.options.cdataPositionChar === '' || str === '') {
    return str + '<![CDATA[' + cdata.join(']]><![CDATA[') + ']]' + this.tagEndChar;
  } else {
    for (var v in cdata) {
      str = str.replace(this.options.cdataPositionChar, '<![CDATA[' + cdata[v] + ']]>');
    }
    return str + this.newLine;
  }
}
function buildObjectNode(val, key, attrStr, level) {
  if (attrStr && val.indexOf('<') === -1) {
    return this.indentate(level) + '<' + key + attrStr + '>' + val +
    //+ this.newLine
    // + this.indentate(level)
    '</' + key + this.tagEndChar;
  } else {
    return this.indentate(level) + '<' + key + attrStr + this.tagEndChar + val +
    //+ this.newLine
    this.indentate(level) + '</' + key + this.tagEndChar;
  }
}
function buildEmptyObjNode(val, key, attrStr, level) {
  if (val !== '') {
    return this.buildObjectNode(val, key, attrStr, level);
  } else {
    return this.indentate(level) + '<' + key + attrStr + '/' + this.tagEndChar;
    //+ this.newLine
  }
}
function buildTextValNode(val, key, attrStr, level) {
  return this.indentate(level) + '<' + key + attrStr + '>' + this.options.tagValueProcessor(val) + '</' + key + this.tagEndChar;
}
function buildEmptyTextNode(val, key, attrStr, level) {
  if (val !== '') {
    return this.buildTextValNode(val, key, attrStr, level);
  } else {
    return this.indentate(level) + '<' + key + attrStr + '/' + this.tagEndChar;
  }
}
function indentate(level) {
  return this.options.indentBy.repeat(level);
}
function isAttribute(name /*, options*/) {
  if (name.startsWith(this.options.attributeNamePrefix)) {
    return name.substr(this.attrPrefixLen);
  } else {
    return false;
  }
}
function isCDATA(name) {
  return name === this.options.cdataTagName;
}

//formatting
//indentation
//\n after each closing or self closing tag

module.exports = Parser;

/***/ }),

/***/ "./node_modules/fast-xml-parser/src/nimndata.js":
/*!******************************************************!*\
  !*** ./node_modules/fast-xml-parser/src/nimndata.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


var _char = function _char(a) {
  return String.fromCharCode(a);
};
var chars = {
  nilChar: _char(176),
  missingChar: _char(201),
  nilPremitive: _char(175),
  missingPremitive: _char(200),
  emptyChar: _char(178),
  emptyValue: _char(177),
  //empty Premitive

  boundryChar: _char(179),
  objStart: _char(198),
  arrStart: _char(204),
  arrayEnd: _char(185)
};
var charsArr = [chars.nilChar, chars.nilPremitive, chars.missingChar, chars.missingPremitive, chars.boundryChar, chars.emptyChar, chars.emptyValue, chars.arrayEnd, chars.objStart, chars.arrStart];
var _e2 = function _e(node, e_schema, options) {
  if (typeof e_schema === 'string') {
    //premitive
    if (node && node[0] && node[0].val !== undefined) {
      return getValue(node[0].val, e_schema);
    } else {
      return getValue(node, e_schema);
    }
  } else {
    var hasValidData = hasData(node);
    if (hasValidData === true) {
      var str = '';
      if (Array.isArray(e_schema)) {
        //attributes can't be repeated. hence check in children tags only
        str += chars.arrStart;
        var itemSchema = e_schema[0];
        //const itemSchemaType = itemSchema;
        var arr_len = node.length;
        if (typeof itemSchema === 'string') {
          for (var arr_i = 0; arr_i < arr_len; arr_i++) {
            var r = getValue(node[arr_i].val, itemSchema);
            str = processValue(str, r);
          }
        } else {
          for (var _arr_i = 0; _arr_i < arr_len; _arr_i++) {
            var _r = _e2(node[_arr_i], itemSchema, options);
            str = processValue(str, _r);
          }
        }
        str += chars.arrayEnd; //indicates that next item is not array item
      } else {
        //object
        str += chars.objStart;
        var keys = Object.keys(e_schema);
        if (Array.isArray(node)) {
          node = node[0];
        }
        for (var i in keys) {
          var key = keys[i];
          //a property defined in schema can be present either in attrsMap or children tags
          //options.textNodeName will not present in both maps, take it's value from val
          //options.attrNodeName will be present in attrsMap
          var _r2 = void 0;
          if (!options.ignoreAttributes && node.attrsMap && node.attrsMap[key]) {
            _r2 = _e2(node.attrsMap[key], e_schema[key], options);
          } else if (key === options.textNodeName) {
            _r2 = _e2(node.val, e_schema[key], options);
          } else {
            _r2 = _e2(node.child[key], e_schema[key], options);
          }
          str = processValue(str, _r2);
        }
      }
      return str;
    } else {
      return hasValidData;
    }
  }
};
var getValue = function getValue(a /*, type*/) {
  switch (a) {
    case undefined:
      return chars.missingPremitive;
    case null:
      return chars.nilPremitive;
    case '':
      return chars.emptyValue;
    default:
      return a;
  }
};
var processValue = function processValue(str, r) {
  if (!isAppChar(r[0]) && !isAppChar(str[str.length - 1])) {
    str += chars.boundryChar;
  }
  return str + r;
};
var isAppChar = function isAppChar(ch) {
  return charsArr.indexOf(ch) !== -1;
};
function hasData(jObj) {
  if (jObj === undefined) {
    return chars.missingChar;
  } else if (jObj === null) {
    return chars.nilChar;
  } else if (jObj.child && Object.keys(jObj.child).length === 0 && (!jObj.attrsMap || Object.keys(jObj.attrsMap).length === 0)) {
    return chars.emptyChar;
  } else {
    return true;
  }
}
var x2j = __webpack_require__(/*! ./xmlstr2xmlnode */ "./node_modules/fast-xml-parser/src/xmlstr2xmlnode.js");
var buildOptions = (__webpack_require__(/*! ./util */ "./node_modules/fast-xml-parser/src/util.js").buildOptions);
var convert2nimn = function convert2nimn(node, e_schema, options) {
  options = buildOptions(options, x2j.defaultOptions, x2j.props);
  return _e2(node, e_schema, options);
};
exports.convert2nimn = convert2nimn;

/***/ }),

/***/ "./node_modules/fast-xml-parser/src/node2json.js":
/*!*******************************************************!*\
  !*** ./node_modules/fast-xml-parser/src/node2json.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var util = __webpack_require__(/*! ./util */ "./node_modules/fast-xml-parser/src/util.js");
var _convertToJson = function convertToJson(node, options, parentTagName) {
  var jObj = {};

  // when no child node or attr is present
  if (!options.alwaysCreateTextNode && (!node.child || util.isEmptyObject(node.child)) && (!node.attrsMap || util.isEmptyObject(node.attrsMap))) {
    return util.isExist(node.val) ? node.val : '';
  }

  // otherwise create a textnode if node has some text
  if (util.isExist(node.val) && !(typeof node.val === 'string' && (node.val === '' || node.val === options.cdataPositionChar))) {
    var asArray = util.isTagNameInArrayMode(node.tagname, options.arrayMode, parentTagName);
    jObj[options.textNodeName] = asArray ? [node.val] : node.val;
  }
  util.merge(jObj, node.attrsMap, options.arrayMode);
  var keys = Object.keys(node.child);
  for (var index = 0; index < keys.length; index++) {
    var tagName = keys[index];
    if (node.child[tagName] && node.child[tagName].length > 1) {
      jObj[tagName] = [];
      for (var tag in node.child[tagName]) {
        if (node.child[tagName].hasOwnProperty(tag)) {
          jObj[tagName].push(_convertToJson(node.child[tagName][tag], options, tagName));
        }
      }
    } else {
      var result = _convertToJson(node.child[tagName][0], options, tagName);
      var _asArray = options.arrayMode === true && _typeof(result) === 'object' || util.isTagNameInArrayMode(tagName, options.arrayMode, parentTagName);
      jObj[tagName] = _asArray ? [result] : result;
    }
  }

  //add value
  return jObj;
};
exports.convertToJson = _convertToJson;

/***/ }),

/***/ "./node_modules/fast-xml-parser/src/node2json_str.js":
/*!***********************************************************!*\
  !*** ./node_modules/fast-xml-parser/src/node2json_str.js ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


var util = __webpack_require__(/*! ./util */ "./node_modules/fast-xml-parser/src/util.js");
var buildOptions = (__webpack_require__(/*! ./util */ "./node_modules/fast-xml-parser/src/util.js").buildOptions);
var x2j = __webpack_require__(/*! ./xmlstr2xmlnode */ "./node_modules/fast-xml-parser/src/xmlstr2xmlnode.js");

//TODO: do it later
var convertToJsonString = function convertToJsonString(node, options) {
  options = buildOptions(options, x2j.defaultOptions, x2j.props);
  options.indentBy = options.indentBy || '';
  return _cToJsonStr2(node, options, 0);
};
var _cToJsonStr2 = function _cToJsonStr(node, options, level) {
  var jObj = '{';

  //traver through all the children
  var keys = Object.keys(node.child);
  for (var index = 0; index < keys.length; index++) {
    var tagname = keys[index];
    if (node.child[tagname] && node.child[tagname].length > 1) {
      jObj += '"' + tagname + '" : [ ';
      for (var tag in node.child[tagname]) {
        jObj += _cToJsonStr2(node.child[tagname][tag], options) + ' , ';
      }
      jObj = jObj.substr(0, jObj.length - 1) + ' ] '; //remove extra comma in last
    } else {
      jObj += '"' + tagname + '" : ' + _cToJsonStr2(node.child[tagname][0], options) + ' ,';
    }
  }
  util.merge(jObj, node.attrsMap);
  //add attrsMap as new children
  if (util.isEmptyObject(jObj)) {
    return util.isExist(node.val) ? node.val : '';
  } else {
    if (util.isExist(node.val)) {
      if (!(typeof node.val === 'string' && (node.val === '' || node.val === options.cdataPositionChar))) {
        jObj += '"' + options.textNodeName + '" : ' + stringval(node.val);
      }
    }
  }
  //add value
  if (jObj[jObj.length - 1] === ',') {
    jObj = jObj.substr(0, jObj.length - 2);
  }
  return jObj + '}';
};
function stringval(v) {
  if (v === true || v === false || !isNaN(v)) {
    return v;
  } else {
    return '"' + v + '"';
  }
}
function indentate(options, level) {
  return options.indentBy.repeat(level);
}
exports.convertToJsonString = convertToJsonString;

/***/ }),

/***/ "./node_modules/fast-xml-parser/src/parser.js":
/*!****************************************************!*\
  !*** ./node_modules/fast-xml-parser/src/parser.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


var nodeToJson = __webpack_require__(/*! ./node2json */ "./node_modules/fast-xml-parser/src/node2json.js");
var xmlToNodeobj = __webpack_require__(/*! ./xmlstr2xmlnode */ "./node_modules/fast-xml-parser/src/xmlstr2xmlnode.js");
var x2xmlnode = __webpack_require__(/*! ./xmlstr2xmlnode */ "./node_modules/fast-xml-parser/src/xmlstr2xmlnode.js");
var buildOptions = (__webpack_require__(/*! ./util */ "./node_modules/fast-xml-parser/src/util.js").buildOptions);
var validator = __webpack_require__(/*! ./validator */ "./node_modules/fast-xml-parser/src/validator.js");
exports.parse = function (xmlData) {
  var givenOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var validationOption = arguments.length > 2 ? arguments[2] : undefined;
  if (validationOption) {
    if (validationOption === true) validationOption = {};
    var result = validator.validate(xmlData, validationOption);
    if (result !== true) {
      throw Error(result.err.msg);
    }
  }
  if (givenOptions.parseTrueNumberOnly && givenOptions.parseNodeValue !== false && !givenOptions.numParseOptions) {
    givenOptions.numParseOptions = {
      leadingZeros: false
    };
  }
  var options = buildOptions(givenOptions, x2xmlnode.defaultOptions, x2xmlnode.props);
  var traversableObj = xmlToNodeobj.getTraversalObj(xmlData, options);
  //print(traversableObj, "  ");
  return nodeToJson.convertToJson(traversableObj, options);
};
exports.convertTonimn = __webpack_require__(/*! ./nimndata */ "./node_modules/fast-xml-parser/src/nimndata.js").convert2nimn;
exports.getTraversalObj = xmlToNodeobj.getTraversalObj;
exports.convertToJson = nodeToJson.convertToJson;
exports.convertToJsonString = __webpack_require__(/*! ./node2json_str */ "./node_modules/fast-xml-parser/src/node2json_str.js").convertToJsonString;
exports.validate = validator.validate;
exports.j2xParser = __webpack_require__(/*! ./json2xml */ "./node_modules/fast-xml-parser/src/json2xml.js");
exports.parseToNimn = function (xmlData, schema, options) {
  return exports.convertTonimn(exports.getTraversalObj(xmlData, options), schema, options);
};
function print(xmlNode, indentation) {
  if (xmlNode) {
    console.log(indentation + "{");
    console.log(indentation + "  \"tagName\": \"" + xmlNode.tagname + "\", ");
    if (xmlNode.parent) {
      console.log(indentation + "  \"parent\": \"" + xmlNode.parent.tagname + "\", ");
    }
    console.log(indentation + "  \"val\": \"" + xmlNode.val + "\", ");
    console.log(indentation + "  \"attrs\": " + JSON.stringify(xmlNode.attrsMap, null, 4) + ", ");
    if (xmlNode.child) {
      console.log(indentation + "\"child\": {");
      var indentation2 = indentation + indentation;
      Object.keys(xmlNode.child).forEach(function (key) {
        var node = xmlNode.child[key];
        if (Array.isArray(node)) {
          console.log(indentation + "\"" + key + "\" :[");
          node.forEach(function (item, index) {
            //console.log(indentation + " \""+index+"\" : [")
            print(item, indentation2);
          });
          console.log(indentation + "],");
        } else {
          console.log(indentation + " \"" + key + "\" : {");
          print(node, indentation2);
          console.log(indentation + "},");
        }
      });
      console.log(indentation + "},");
    }
    console.log(indentation + "},");
  }
}

/***/ }),

/***/ "./node_modules/fast-xml-parser/src/util.js":
/*!**************************************************!*\
  !*** ./node_modules/fast-xml-parser/src/util.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


var nameStartChar = ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
var nameChar = nameStartChar + "\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
var nameRegexp = '[' + nameStartChar + '][' + nameChar + ']*';
var regexName = new RegExp('^' + nameRegexp + '$');
var getAllMatches = function getAllMatches(string, regex) {
  var matches = [];
  var match = regex.exec(string);
  while (match) {
    var allmatches = [];
    allmatches.startIndex = regex.lastIndex - match[0].length;
    var len = match.length;
    for (var index = 0; index < len; index++) {
      allmatches.push(match[index]);
    }
    matches.push(allmatches);
    match = regex.exec(string);
  }
  return matches;
};
var isName = function isName(string) {
  var match = regexName.exec(string);
  return !(match === null || typeof match === 'undefined');
};
exports.isExist = function (v) {
  return typeof v !== 'undefined';
};
exports.isEmptyObject = function (obj) {
  return Object.keys(obj).length === 0;
};

/**
 * Copy all the properties of a into b.
 * @param {*} target
 * @param {*} a
 */
exports.merge = function (target, a, arrayMode) {
  if (a) {
    var keys = Object.keys(a); // will return an array of own properties
    var len = keys.length; //don't make it inline
    for (var i = 0; i < len; i++) {
      if (arrayMode === 'strict') {
        target[keys[i]] = [a[keys[i]]];
      } else {
        target[keys[i]] = a[keys[i]];
      }
    }
  }
};
/* exports.merge =function (b,a){
  return Object.assign(b,a);
} */

exports.getValue = function (v) {
  if (exports.isExist(v)) {
    return v;
  } else {
    return '';
  }
};

// const fakeCall = function(a) {return a;};
// const fakeCallNoReturn = function() {};

exports.buildOptions = function (options, defaultOptions, props) {
  var newOptions = {};
  if (!options) {
    return defaultOptions; //if there are not options
  }
  for (var i = 0; i < props.length; i++) {
    if (options[props[i]] !== undefined) {
      newOptions[props[i]] = options[props[i]];
    } else {
      newOptions[props[i]] = defaultOptions[props[i]];
    }
  }
  return newOptions;
};

/**
 * Check if a tag name should be treated as array
 *
 * @param tagName the node tagname
 * @param arrayMode the array mode option
 * @param parentTagName the parent tag name
 * @returns {boolean} true if node should be parsed as array
 */
exports.isTagNameInArrayMode = function (tagName, arrayMode, parentTagName) {
  if (arrayMode === false) {
    return false;
  } else if (arrayMode instanceof RegExp) {
    return arrayMode.test(tagName);
  } else if (typeof arrayMode === 'function') {
    return !!arrayMode(tagName, parentTagName);
  }
  return arrayMode === "strict";
};
exports.isName = isName;
exports.getAllMatches = getAllMatches;
exports.nameRegexp = nameRegexp;

/***/ }),

/***/ "./node_modules/fast-xml-parser/src/validator.js":
/*!*******************************************************!*\
  !*** ./node_modules/fast-xml-parser/src/validator.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


var util = __webpack_require__(/*! ./util */ "./node_modules/fast-xml-parser/src/util.js");
var defaultOptions = {
  allowBooleanAttributes: false //A tag can have attributes without any value
};
var props = ['allowBooleanAttributes'];

//const tagsPattern = new RegExp("<\\/?([\\w:\\-_\.]+)\\s*\/?>","g");
exports.validate = function (xmlData, options) {
  options = util.buildOptions(options, defaultOptions, props);

  //xmlData = xmlData.replace(/(\r\n|\n|\r)/gm,"");//make it single line
  //xmlData = xmlData.replace(/(^\s*<\?xml.*?\?>)/g,"");//Remove XML starting tag
  //xmlData = xmlData.replace(/(<!DOCTYPE[\s\w\"\.\/\-\:]+(\[.*\])*\s*>)/g,"");//Remove DOCTYPE
  var tags = [];
  var tagFound = false;

  //indicates that the root tag has been closed (aka. depth 0 has been reached)
  var reachedRoot = false;
  if (xmlData[0] === "\uFEFF") {
    // check for byte order mark (BOM)
    xmlData = xmlData.substr(1);
  }
  for (var i = 0; i < xmlData.length; i++) {
    if (xmlData[i] === '<' && xmlData[i + 1] === '?') {
      i += 2;
      i = readPI(xmlData, i);
      if (i.err) return i;
    } else if (xmlData[i] === '<') {
      //starting of tag
      //read until you reach to '>' avoiding any '>' in attribute value
      var tagStartPos = i;
      i++;
      if (xmlData[i] === '!') {
        i = readCommentAndCDATA(xmlData, i);
        continue;
      } else {
        var closingTag = false;
        if (xmlData[i] === '/') {
          //closing tag
          closingTag = true;
          i++;
        }
        //read tagname
        var tagName = '';
        for (; i < xmlData.length && xmlData[i] !== '>' && xmlData[i] !== ' ' && xmlData[i] !== '\t' && xmlData[i] !== '\n' && xmlData[i] !== '\r'; i++) {
          tagName += xmlData[i];
        }
        tagName = tagName.trim();
        //console.log(tagName);

        if (tagName[tagName.length - 1] === '/') {
          //self closing tag without attributes
          tagName = tagName.substring(0, tagName.length - 1);
          //continue;
          i--;
        }
        if (!validateTagName(tagName)) {
          var msg = void 0;
          if (tagName.trim().length === 0) {
            msg = "Invalid space after '<'.";
          } else {
            msg = "Tag '" + tagName + "' is an invalid name.";
          }
          return getErrorObject('InvalidTag', msg, getLineNumberForPosition(xmlData, i));
        }
        var result = readAttributeStr(xmlData, i);
        if (result === false) {
          return getErrorObject('InvalidAttr', "Attributes for '" + tagName + "' have open quote.", getLineNumberForPosition(xmlData, i));
        }
        var attrStr = result.value;
        i = result.index;
        if (attrStr[attrStr.length - 1] === '/') {
          //self closing tag
          var attrStrStart = i - attrStr.length;
          attrStr = attrStr.substring(0, attrStr.length - 1);
          var isValid = validateAttributeString(attrStr, options);
          if (isValid === true) {
            tagFound = true;
            //continue; //text may presents after self closing tag
          } else {
            //the result from the nested function returns the position of the error within the attribute
            //in order to get the 'true' error line, we need to calculate the position where the attribute begins (i - attrStr.length) and then add the position within the attribute
            //this gives us the absolute index in the entire xml, which we can use to find the line at last
            return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, attrStrStart + isValid.err.line));
          }
        } else if (closingTag) {
          if (!result.tagClosed) {
            return getErrorObject('InvalidTag', "Closing tag '" + tagName + "' doesn't have proper closing.", getLineNumberForPosition(xmlData, i));
          } else if (attrStr.trim().length > 0) {
            return getErrorObject('InvalidTag', "Closing tag '" + tagName + "' can't have attributes or invalid starting.", getLineNumberForPosition(xmlData, tagStartPos));
          } else {
            var otg = tags.pop();
            if (tagName !== otg.tagName) {
              var openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
              return getErrorObject('InvalidTag', "Expected closing tag '" + otg.tagName + "' (opened in line " + openPos.line + ", col " + openPos.col + ") instead of closing tag '" + tagName + "'.", getLineNumberForPosition(xmlData, tagStartPos));
            }

            //when there are no more tags, we reached the root level.
            if (tags.length == 0) {
              reachedRoot = true;
            }
          }
        } else {
          var _isValid = validateAttributeString(attrStr, options);
          if (_isValid !== true) {
            //the result from the nested function returns the position of the error within the attribute
            //in order to get the 'true' error line, we need to calculate the position where the attribute begins (i - attrStr.length) and then add the position within the attribute
            //this gives us the absolute index in the entire xml, which we can use to find the line at last
            return getErrorObject(_isValid.err.code, _isValid.err.msg, getLineNumberForPosition(xmlData, i - attrStr.length + _isValid.err.line));
          }

          //if the root level has been reached before ...
          if (reachedRoot === true) {
            return getErrorObject('InvalidXml', 'Multiple possible root nodes found.', getLineNumberForPosition(xmlData, i));
          } else {
            tags.push({
              tagName: tagName,
              tagStartPos: tagStartPos
            });
          }
          tagFound = true;
        }

        //skip tag text value
        //It may include comments and CDATA value
        for (i++; i < xmlData.length; i++) {
          if (xmlData[i] === '<') {
            if (xmlData[i + 1] === '!') {
              //comment or CADATA
              i++;
              i = readCommentAndCDATA(xmlData, i);
              continue;
            } else if (xmlData[i + 1] === '?') {
              i = readPI(xmlData, ++i);
              if (i.err) return i;
            } else {
              break;
            }
          } else if (xmlData[i] === '&') {
            var afterAmp = validateAmpersand(xmlData, i);
            if (afterAmp == -1) return getErrorObject('InvalidChar', "char '&' is not expected.", getLineNumberForPosition(xmlData, i));
            i = afterAmp;
          }
        } //end of reading tag text value
        if (xmlData[i] === '<') {
          i--;
        }
      }
    } else {
      if (xmlData[i] === ' ' || xmlData[i] === '\t' || xmlData[i] === '\n' || xmlData[i] === '\r') {
        continue;
      }
      return getErrorObject('InvalidChar', "char '" + xmlData[i] + "' is not expected.", getLineNumberForPosition(xmlData, i));
    }
  }
  if (!tagFound) {
    return getErrorObject('InvalidXml', 'Start tag expected.', 1);
  } else if (tags.length == 1) {
    return getErrorObject('InvalidTag', "Unclosed tag '" + tags[0].tagName + "'.", getLineNumberForPosition(xmlData, tags[0].tagStartPos));
  } else if (tags.length > 0) {
    return getErrorObject('InvalidXml', "Invalid '" + JSON.stringify(tags.map(function (t) {
      return t.tagName;
    }), null, 4).replace(/\r?\n/g, '') + "' found.", {
      line: 1,
      col: 1
    });
  }
  return true;
};

/**
 * Read Processing insstructions and skip
 * @param {*} xmlData
 * @param {*} i
 */
function readPI(xmlData, i) {
  var start = i;
  for (; i < xmlData.length; i++) {
    if (xmlData[i] == '?' || xmlData[i] == ' ') {
      //tagname
      var tagname = xmlData.substr(start, i - start);
      if (i > 5 && tagname === 'xml') {
        return getErrorObject('InvalidXml', 'XML declaration allowed only at the start of the document.', getLineNumberForPosition(xmlData, i));
      } else if (xmlData[i] == '?' && xmlData[i + 1] == '>') {
        //check if valid attribut string
        i++;
        break;
      } else {
        continue;
      }
    }
  }
  return i;
}
function readCommentAndCDATA(xmlData, i) {
  if (xmlData.length > i + 5 && xmlData[i + 1] === '-' && xmlData[i + 2] === '-') {
    //comment
    for (i += 3; i < xmlData.length; i++) {
      if (xmlData[i] === '-' && xmlData[i + 1] === '-' && xmlData[i + 2] === '>') {
        i += 2;
        break;
      }
    }
  } else if (xmlData.length > i + 8 && xmlData[i + 1] === 'D' && xmlData[i + 2] === 'O' && xmlData[i + 3] === 'C' && xmlData[i + 4] === 'T' && xmlData[i + 5] === 'Y' && xmlData[i + 6] === 'P' && xmlData[i + 7] === 'E') {
    var angleBracketsCount = 1;
    for (i += 8; i < xmlData.length; i++) {
      if (xmlData[i] === '<') {
        angleBracketsCount++;
      } else if (xmlData[i] === '>') {
        angleBracketsCount--;
        if (angleBracketsCount === 0) {
          break;
        }
      }
    }
  } else if (xmlData.length > i + 9 && xmlData[i + 1] === '[' && xmlData[i + 2] === 'C' && xmlData[i + 3] === 'D' && xmlData[i + 4] === 'A' && xmlData[i + 5] === 'T' && xmlData[i + 6] === 'A' && xmlData[i + 7] === '[') {
    for (i += 8; i < xmlData.length; i++) {
      if (xmlData[i] === ']' && xmlData[i + 1] === ']' && xmlData[i + 2] === '>') {
        i += 2;
        break;
      }
    }
  }
  return i;
}
var doubleQuote = '"';
var singleQuote = "'";

/**
 * Keep reading xmlData until '<' is found outside the attribute value.
 * @param {string} xmlData
 * @param {number} i
 */
function readAttributeStr(xmlData, i) {
  var attrStr = '';
  var startChar = '';
  var tagClosed = false;
  for (; i < xmlData.length; i++) {
    if (xmlData[i] === doubleQuote || xmlData[i] === singleQuote) {
      if (startChar === '') {
        startChar = xmlData[i];
      } else if (startChar !== xmlData[i]) {
        //if vaue is enclosed with double quote then single quotes are allowed inside the value and vice versa
      } else {
        startChar = '';
      }
    } else if (xmlData[i] === '>') {
      if (startChar === '') {
        tagClosed = true;
        break;
      }
    }
    attrStr += xmlData[i];
  }
  if (startChar !== '') {
    return false;
  }
  return {
    value: attrStr,
    index: i,
    tagClosed: tagClosed
  };
}

/**
 * Select all the attributes whether valid or invalid.
 */
var validAttrStrRegxp = new RegExp('(\\s*)([^\\s=]+)(\\s*=)?(\\s*([\'"])(([\\s\\S])*?)\\5)?', 'g');

//attr, ="sd", a="amit's", a="sd"b="saf", ab  cd=""

function validateAttributeString(attrStr, options) {
  //console.log("start:"+attrStr+":end");

  //if(attrStr.trim().length === 0) return true; //empty string

  var matches = util.getAllMatches(attrStr, validAttrStrRegxp);
  var attrNames = {};
  for (var i = 0; i < matches.length; i++) {
    if (matches[i][1].length === 0) {
      //nospace before attribute name: a="sd"b="saf"
      return getErrorObject('InvalidAttr', "Attribute '" + matches[i][2] + "' has no space in starting.", getPositionFromMatch(matches[i]));
    } else if (matches[i][3] === undefined && !options.allowBooleanAttributes) {
      //independent attribute: ab
      return getErrorObject('InvalidAttr', "boolean attribute '" + matches[i][2] + "' is not allowed.", getPositionFromMatch(matches[i]));
    }
    /* else if(matches[i][6] === undefined){//attribute without value: ab=
                    return { err: { code:"InvalidAttr",msg:"attribute " + matches[i][2] + " has no value assigned."}};
                } */
    var attrName = matches[i][2];
    if (!validateAttrName(attrName)) {
      return getErrorObject('InvalidAttr', "Attribute '" + attrName + "' is an invalid name.", getPositionFromMatch(matches[i]));
    }
    if (!attrNames.hasOwnProperty(attrName)) {
      //check for duplicate attribute.
      attrNames[attrName] = 1;
    } else {
      return getErrorObject('InvalidAttr', "Attribute '" + attrName + "' is repeated.", getPositionFromMatch(matches[i]));
    }
  }
  return true;
}
function validateNumberAmpersand(xmlData, i) {
  var re = /\d/;
  if (xmlData[i] === 'x') {
    i++;
    re = /[\da-fA-F]/;
  }
  for (; i < xmlData.length; i++) {
    if (xmlData[i] === ';') return i;
    if (!xmlData[i].match(re)) break;
  }
  return -1;
}
function validateAmpersand(xmlData, i) {
  // https://www.w3.org/TR/xml/#dt-charref
  i++;
  if (xmlData[i] === ';') return -1;
  if (xmlData[i] === '#') {
    i++;
    return validateNumberAmpersand(xmlData, i);
  }
  var count = 0;
  for (; i < xmlData.length; i++, count++) {
    if (xmlData[i].match(/\w/) && count < 20) continue;
    if (xmlData[i] === ';') break;
    return -1;
  }
  return i;
}
function getErrorObject(code, message, lineNumber) {
  return {
    err: {
      code: code,
      msg: message,
      line: lineNumber.line || lineNumber,
      col: lineNumber.col
    }
  };
}
function validateAttrName(attrName) {
  return util.isName(attrName);
}

// const startsWithXML = /^xml/i;

function validateTagName(tagname) {
  return util.isName(tagname) /* && !tagname.match(startsWithXML) */;
}

//this function returns the line number for the character at the given index
function getLineNumberForPosition(xmlData, index) {
  var lines = xmlData.substring(0, index).split(/\r?\n/);
  return {
    line: lines.length,
    // column number is last line's length + 1, because column numbering starts at 1:
    col: lines[lines.length - 1].length + 1
  };
}

//this function returns the position of the first character of match within attrStr
function getPositionFromMatch(match) {
  return match.startIndex + match[1].length;
}

/***/ }),

/***/ "./node_modules/fast-xml-parser/src/xmlNode.js":
/*!*****************************************************!*\
  !*** ./node_modules/fast-xml-parser/src/xmlNode.js ***!
  \*****************************************************/
/***/ ((module) => {

"use strict";


module.exports = function (tagname, parent, val) {
  this.tagname = tagname;
  this.parent = parent;
  this.child = {}; //child tags
  this.attrsMap = {}; //attributes map
  this.val = val; //text only
  this.addChild = function (child) {
    if (Array.isArray(this.child[child.tagname])) {
      //already presents
      this.child[child.tagname].push(child);
    } else {
      this.child[child.tagname] = [child];
    }
  };
};

/***/ }),

/***/ "./node_modules/fast-xml-parser/src/xmlstr2xmlnode.js":
/*!************************************************************!*\
  !*** ./node_modules/fast-xml-parser/src/xmlstr2xmlnode.js ***!
  \************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


var util = __webpack_require__(/*! ./util */ "./node_modules/fast-xml-parser/src/util.js");
var buildOptions = (__webpack_require__(/*! ./util */ "./node_modules/fast-xml-parser/src/util.js").buildOptions);
var xmlNode = __webpack_require__(/*! ./xmlNode */ "./node_modules/fast-xml-parser/src/xmlNode.js");
var toNumber = __webpack_require__(/*! strnum */ "./node_modules/strnum/strnum.js");
var regx = '<((!\\[CDATA\\[([\\s\\S]*?)(]]>))|((NAME:)?(NAME))([^>]*)>|((\\/)(NAME)\\s*>))([^<]*)'.replace(/NAME/g, util.nameRegexp);

//const tagsRegx = new RegExp("<(\\/?[\\w:\\-\._]+)([^>]*)>(\\s*"+cdataRegx+")*([^<]+)?","g");
//const tagsRegx = new RegExp("<(\\/?)((\\w*:)?([\\w:\\-\._]+))([^>]*)>([^<]*)("+cdataRegx+"([^<]*))*([^<]+)?","g");

//polyfill
if (!Number.parseInt && window.parseInt) {
  Number.parseInt = window.parseInt;
}
if (!Number.parseFloat && window.parseFloat) {
  Number.parseFloat = window.parseFloat;
}
var defaultOptions = {
  attributeNamePrefix: '@_',
  attrNodeName: false,
  textNodeName: '#text',
  ignoreAttributes: true,
  ignoreNameSpace: false,
  allowBooleanAttributes: false,
  //a tag can have attributes without any value
  //ignoreRootElement : false,
  parseNodeValue: true,
  parseAttributeValue: false,
  arrayMode: false,
  trimValues: true,
  //Trim string values of tag and attributes
  cdataTagName: false,
  cdataPositionChar: '\\c',
  numParseOptions: {
    hex: true,
    leadingZeros: true
  },
  tagValueProcessor: function tagValueProcessor(a, tagName) {
    return a;
  },
  attrValueProcessor: function attrValueProcessor(a, attrName) {
    return a;
  },
  stopNodes: [],
  alwaysCreateTextNode: false
  //decodeStrict: false,
};
exports.defaultOptions = defaultOptions;
var props = ['attributeNamePrefix', 'attrNodeName', 'textNodeName', 'ignoreAttributes', 'ignoreNameSpace', 'allowBooleanAttributes', 'parseNodeValue', 'parseAttributeValue', 'arrayMode', 'trimValues', 'cdataTagName', 'cdataPositionChar', 'tagValueProcessor', 'attrValueProcessor', 'parseTrueNumberOnly', 'numParseOptions', 'stopNodes', 'alwaysCreateTextNode'];
exports.props = props;

/**
 * Trim -> valueProcessor -> parse value
 * @param {string} tagName
 * @param {string} val
 * @param {object} options
 */
function processTagValue(tagName, val, options) {
  if (val) {
    if (options.trimValues) {
      val = val.trim();
    }
    val = options.tagValueProcessor(val, tagName);
    val = parseValue(val, options.parseNodeValue, options.numParseOptions);
  }
  return val;
}
function resolveNameSpace(tagname, options) {
  if (options.ignoreNameSpace) {
    var tags = tagname.split(':');
    var prefix = tagname.charAt(0) === '/' ? '/' : '';
    if (tags[0] === 'xmlns') {
      return '';
    }
    if (tags.length === 2) {
      tagname = prefix + tags[1];
    }
  }
  return tagname;
}
function parseValue(val, shouldParse, options) {
  if (shouldParse && typeof val === 'string') {
    //console.log(options)
    var newval = val.trim();
    if (newval === 'true') return true;else if (newval === 'false') return false;else return toNumber(val, options);
  } else {
    if (util.isExist(val)) {
      return val;
    } else {
      return '';
    }
  }
}

//TODO: change regex to capture NS
//const attrsRegx = new RegExp("([\\w\\-\\.\\:]+)\\s*=\\s*(['\"])((.|\n)*?)\\2","gm");
var attrsRegx = new RegExp('([^\\s=]+)\\s*(=\\s*([\'"])(.*?)\\3)?', 'g');
function buildAttributesMap(attrStr, options) {
  if (!options.ignoreAttributes && typeof attrStr === 'string') {
    attrStr = attrStr.replace(/\r?\n/g, ' ');
    //attrStr = attrStr || attrStr.trim();

    var matches = util.getAllMatches(attrStr, attrsRegx);
    var len = matches.length; //don't make it inline
    var attrs = {};
    for (var i = 0; i < len; i++) {
      var attrName = resolveNameSpace(matches[i][1], options);
      if (attrName.length) {
        if (matches[i][4] !== undefined) {
          if (options.trimValues) {
            matches[i][4] = matches[i][4].trim();
          }
          matches[i][4] = options.attrValueProcessor(matches[i][4], attrName);
          attrs[options.attributeNamePrefix + attrName] = parseValue(matches[i][4], options.parseAttributeValue, options.numParseOptions);
        } else if (options.allowBooleanAttributes) {
          attrs[options.attributeNamePrefix + attrName] = true;
        }
      }
    }
    if (!Object.keys(attrs).length) {
      return;
    }
    if (options.attrNodeName) {
      var attrCollection = {};
      attrCollection[options.attrNodeName] = attrs;
      return attrCollection;
    }
    return attrs;
  }
}
var getTraversalObj = function getTraversalObj(xmlData, options) {
  xmlData = xmlData.replace(/\r\n?/g, "\n");
  options = buildOptions(options, defaultOptions, props);
  var xmlObj = new xmlNode('!xml');
  var currentNode = xmlObj;
  var textData = "";

  //function match(xmlData){
  for (var i = 0; i < xmlData.length; i++) {
    var ch = xmlData[i];
    if (ch === '<') {
      if (xmlData[i + 1] === '/') {
        //Closing Tag
        var closeIndex = findClosingIndex(xmlData, ">", i, "Closing Tag is not closed.");
        var tagName = xmlData.substring(i + 2, closeIndex).trim();
        if (options.ignoreNameSpace) {
          var colonIndex = tagName.indexOf(":");
          if (colonIndex !== -1) {
            tagName = tagName.substr(colonIndex + 1);
          }
        }

        /* if (currentNode.parent) {
          currentNode.parent.val = util.getValue(currentNode.parent.val) + '' + processTagValue2(tagName, textData , options);
        } */
        if (currentNode) {
          if (currentNode.val) {
            currentNode.val = util.getValue(currentNode.val) + '' + processTagValue(tagName, textData, options);
          } else {
            currentNode.val = processTagValue(tagName, textData, options);
          }
        }
        if (options.stopNodes.length && options.stopNodes.includes(currentNode.tagname)) {
          currentNode.child = [];
          if (currentNode.attrsMap == undefined) {
            currentNode.attrsMap = {};
          }
          currentNode.val = xmlData.substr(currentNode.startIndex + 1, i - currentNode.startIndex - 1);
        }
        currentNode = currentNode.parent;
        textData = "";
        i = closeIndex;
      } else if (xmlData[i + 1] === '?') {
        i = findClosingIndex(xmlData, "?>", i, "Pi Tag is not closed.");
      } else if (xmlData.substr(i + 1, 3) === '!--') {
        i = findClosingIndex(xmlData, "-->", i, "Comment is not closed.");
      } else if (xmlData.substr(i + 1, 2) === '!D') {
        var _closeIndex = findClosingIndex(xmlData, ">", i, "DOCTYPE is not closed.");
        var tagExp = xmlData.substring(i, _closeIndex);
        if (tagExp.indexOf("[") >= 0) {
          i = xmlData.indexOf("]>", i) + 1;
        } else {
          i = _closeIndex;
        }
      } else if (xmlData.substr(i + 1, 2) === '![') {
        var _closeIndex2 = findClosingIndex(xmlData, "]]>", i, "CDATA is not closed.") - 2;
        var _tagExp = xmlData.substring(i + 9, _closeIndex2);

        //considerations
        //1. CDATA will always have parent node
        //2. A tag with CDATA is not a leaf node so it's value would be string type.
        if (textData) {
          currentNode.val = util.getValue(currentNode.val) + '' + processTagValue(currentNode.tagname, textData, options);
          textData = "";
        }
        if (options.cdataTagName) {
          //add cdata node
          var childNode = new xmlNode(options.cdataTagName, currentNode, _tagExp);
          currentNode.addChild(childNode);
          //for backtracking
          currentNode.val = util.getValue(currentNode.val) + options.cdataPositionChar;
          //add rest value to parent node
          if (_tagExp) {
            childNode.val = _tagExp;
          }
        } else {
          currentNode.val = (currentNode.val || '') + (_tagExp || '');
        }
        i = _closeIndex2 + 2;
      } else {
        //Opening tag
        var result = closingIndexForOpeningTag(xmlData, i + 1);
        var _tagExp2 = result.data;
        var _closeIndex3 = result.index;
        var separatorIndex = _tagExp2.indexOf(" ");
        var _tagName = _tagExp2;
        var shouldBuildAttributesMap = true;
        if (separatorIndex !== -1) {
          _tagName = _tagExp2.substr(0, separatorIndex).replace(/\s\s*$/, '');
          _tagExp2 = _tagExp2.substr(separatorIndex + 1);
        }
        if (options.ignoreNameSpace) {
          var _colonIndex = _tagName.indexOf(":");
          if (_colonIndex !== -1) {
            _tagName = _tagName.substr(_colonIndex + 1);
            shouldBuildAttributesMap = _tagName !== result.data.substr(_colonIndex + 1);
          }
        }

        //save text to parent node
        if (currentNode && textData) {
          if (currentNode.tagname !== '!xml') {
            currentNode.val = util.getValue(currentNode.val) + '' + processTagValue(currentNode.tagname, textData, options);
          }
        }
        if (_tagExp2.length > 0 && _tagExp2.lastIndexOf("/") === _tagExp2.length - 1) {
          //selfClosing tag

          if (_tagName[_tagName.length - 1] === "/") {
            //remove trailing '/'
            _tagName = _tagName.substr(0, _tagName.length - 1);
            _tagExp2 = _tagName;
          } else {
            _tagExp2 = _tagExp2.substr(0, _tagExp2.length - 1);
          }
          var _childNode = new xmlNode(_tagName, currentNode, '');
          if (_tagName !== _tagExp2) {
            _childNode.attrsMap = buildAttributesMap(_tagExp2, options);
          }
          currentNode.addChild(_childNode);
        } else {
          //opening tag

          var _childNode2 = new xmlNode(_tagName, currentNode);
          if (options.stopNodes.length && options.stopNodes.includes(_childNode2.tagname)) {
            _childNode2.startIndex = _closeIndex3;
          }
          if (_tagName !== _tagExp2 && shouldBuildAttributesMap) {
            _childNode2.attrsMap = buildAttributesMap(_tagExp2, options);
          }
          currentNode.addChild(_childNode2);
          currentNode = _childNode2;
        }
        textData = "";
        i = _closeIndex3;
      }
    } else {
      textData += xmlData[i];
    }
  }
  return xmlObj;
};
function closingIndexForOpeningTag(data, i) {
  var attrBoundary;
  var tagExp = "";
  for (var index = i; index < data.length; index++) {
    var ch = data[index];
    if (attrBoundary) {
      if (ch === attrBoundary) attrBoundary = ""; //reset
    } else if (ch === '"' || ch === "'") {
      attrBoundary = ch;
    } else if (ch === '>') {
      return {
        data: tagExp,
        index: index
      };
    } else if (ch === '\t') {
      ch = " ";
    }
    tagExp += ch;
  }
}
function findClosingIndex(xmlData, str, i, errMsg) {
  var closingIndex = xmlData.indexOf(str, i);
  if (closingIndex === -1) {
    throw new Error(errMsg);
  } else {
    return closingIndex + str.length - 1;
  }
}
exports.getTraversalObj = getTraversalObj;

/***/ }),

/***/ "./node_modules/for-each/index.js":
/*!****************************************!*\
  !*** ./node_modules/for-each/index.js ***!
  \****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var isCallable = __webpack_require__(/*! is-callable */ "./node_modules/is-callable/index.js");
var toStr = Object.prototype.toString;
var hasOwnProperty = Object.prototype.hasOwnProperty;

/** @type {<This, A extends readonly unknown[]>(arr: A, iterator: (this: This | void, value: A[number], index: number, arr: A) => void, receiver: This | undefined) => void} */
var forEachArray = function forEachArray(array, iterator, receiver) {
  for (var i = 0, len = array.length; i < len; i++) {
    if (hasOwnProperty.call(array, i)) {
      if (receiver == null) {
        iterator(array[i], i, array);
      } else {
        iterator.call(receiver, array[i], i, array);
      }
    }
  }
};

/** @type {<This, S extends string>(string: S, iterator: (this: This | void, value: S[number], index: number, string: S) => void, receiver: This | undefined) => void} */
var forEachString = function forEachString(string, iterator, receiver) {
  for (var i = 0, len = string.length; i < len; i++) {
    // no such thing as a sparse string.
    if (receiver == null) {
      iterator(string.charAt(i), i, string);
    } else {
      iterator.call(receiver, string.charAt(i), i, string);
    }
  }
};

/** @type {<This, O>(obj: O, iterator: (this: This | void, value: O[keyof O], index: keyof O, obj: O) => void, receiver: This | undefined) => void} */
var forEachObject = function forEachObject(object, iterator, receiver) {
  for (var k in object) {
    if (hasOwnProperty.call(object, k)) {
      if (receiver == null) {
        iterator(object[k], k, object);
      } else {
        iterator.call(receiver, object[k], k, object);
      }
    }
  }
};

/** @type {(x: unknown) => x is readonly unknown[]} */
function isArray(x) {
  return toStr.call(x) === '[object Array]';
}

/** @type {import('.')._internal} */
module.exports = function forEach(list, iterator, thisArg) {
  if (!isCallable(iterator)) {
    throw new TypeError('iterator must be a function');
  }
  var receiver;
  if (arguments.length >= 3) {
    receiver = thisArg;
  }
  if (isArray(list)) {
    forEachArray(list, iterator, receiver);
  } else if (typeof list === 'string') {
    forEachString(list, iterator, receiver);
  } else {
    forEachObject(list, iterator, receiver);
  }
};

/***/ }),

/***/ "./node_modules/function-bind/implementation.js":
/*!******************************************************!*\
  !*** ./node_modules/function-bind/implementation.js ***!
  \******************************************************/
/***/ ((module) => {

"use strict";


/* eslint no-invalid-this: 1 */
var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var toStr = Object.prototype.toString;
var max = Math.max;
var funcType = '[object Function]';
var concatty = function concatty(a, b) {
  var arr = [];
  for (var i = 0; i < a.length; i += 1) {
    arr[i] = a[i];
  }
  for (var j = 0; j < b.length; j += 1) {
    arr[j + a.length] = b[j];
  }
  return arr;
};
var slicy = function slicy(arrLike, offset) {
  var arr = [];
  for (var i = offset || 0, j = 0; i < arrLike.length; i += 1, j += 1) {
    arr[j] = arrLike[i];
  }
  return arr;
};
var joiny = function joiny(arr, joiner) {
  var str = '';
  for (var i = 0; i < arr.length; i += 1) {
    str += arr[i];
    if (i + 1 < arr.length) {
      str += joiner;
    }
  }
  return str;
};
module.exports = function bind(that) {
  var target = this;
  if (typeof target !== 'function' || toStr.apply(target) !== funcType) {
    throw new TypeError(ERROR_MESSAGE + target);
  }
  var args = slicy(arguments, 1);
  var bound;
  var binder = function binder() {
    if (this instanceof bound) {
      var result = target.apply(this, concatty(args, arguments));
      if (Object(result) === result) {
        return result;
      }
      return this;
    }
    return target.apply(that, concatty(args, arguments));
  };
  var boundLength = max(0, target.length - args.length);
  var boundArgs = [];
  for (var i = 0; i < boundLength; i++) {
    boundArgs[i] = '$' + i;
  }
  bound = Function('binder', 'return function (' + joiny(boundArgs, ',') + '){ return binder.apply(this,arguments); }')(binder);
  if (target.prototype) {
    var Empty = function Empty() {};
    Empty.prototype = target.prototype;
    bound.prototype = new Empty();
    Empty.prototype = null;
  }
  return bound;
};

/***/ }),

/***/ "./node_modules/function-bind/index.js":
/*!*********************************************!*\
  !*** ./node_modules/function-bind/index.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var implementation = __webpack_require__(/*! ./implementation */ "./node_modules/function-bind/implementation.js");
module.exports = Function.prototype.bind || implementation;

/***/ }),

/***/ "./node_modules/get-intrinsic/index.js":
/*!*********************************************!*\
  !*** ./node_modules/get-intrinsic/index.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var undefined;
var $Object = __webpack_require__(/*! es-object-atoms */ "./node_modules/es-object-atoms/index.js");
var $Error = __webpack_require__(/*! es-errors */ "./node_modules/es-errors/index.js");
var $EvalError = __webpack_require__(/*! es-errors/eval */ "./node_modules/es-errors/eval.js");
var $RangeError = __webpack_require__(/*! es-errors/range */ "./node_modules/es-errors/range.js");
var $ReferenceError = __webpack_require__(/*! es-errors/ref */ "./node_modules/es-errors/ref.js");
var $SyntaxError = __webpack_require__(/*! es-errors/syntax */ "./node_modules/es-errors/syntax.js");
var $TypeError = __webpack_require__(/*! es-errors/type */ "./node_modules/es-errors/type.js");
var $URIError = __webpack_require__(/*! es-errors/uri */ "./node_modules/es-errors/uri.js");
var abs = __webpack_require__(/*! math-intrinsics/abs */ "./node_modules/math-intrinsics/abs.js");
var floor = __webpack_require__(/*! math-intrinsics/floor */ "./node_modules/math-intrinsics/floor.js");
var max = __webpack_require__(/*! math-intrinsics/max */ "./node_modules/math-intrinsics/max.js");
var min = __webpack_require__(/*! math-intrinsics/min */ "./node_modules/math-intrinsics/min.js");
var pow = __webpack_require__(/*! math-intrinsics/pow */ "./node_modules/math-intrinsics/pow.js");
var round = __webpack_require__(/*! math-intrinsics/round */ "./node_modules/math-intrinsics/round.js");
var sign = __webpack_require__(/*! math-intrinsics/sign */ "./node_modules/math-intrinsics/sign.js");
var $Function = Function;

// eslint-disable-next-line consistent-return
var getEvalledConstructor = function getEvalledConstructor(expressionSyntax) {
  try {
    return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
  } catch (e) {}
};
var $gOPD = __webpack_require__(/*! gopd */ "./node_modules/gopd/index.js");
var $defineProperty = __webpack_require__(/*! es-define-property */ "./node_modules/es-define-property/index.js");
var throwTypeError = function throwTypeError() {
  throw new $TypeError();
};
var ThrowTypeError = $gOPD ? function () {
  try {
    // eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
    arguments.callee; // IE 8 does not throw here
    return throwTypeError;
  } catch (calleeThrows) {
    try {
      // IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
      return $gOPD(arguments, 'callee').get;
    } catch (gOPDthrows) {
      return throwTypeError;
    }
  }
}() : throwTypeError;
var hasSymbols = __webpack_require__(/*! has-symbols */ "./node_modules/has-symbols/index.js")();
var getProto = __webpack_require__(/*! get-proto */ "./node_modules/get-proto/index.js");
var $ObjectGPO = __webpack_require__(/*! get-proto/Object.getPrototypeOf */ "./node_modules/get-proto/Object.getPrototypeOf.js");
var $ReflectGPO = __webpack_require__(/*! get-proto/Reflect.getPrototypeOf */ "./node_modules/get-proto/Reflect.getPrototypeOf.js");
var $apply = __webpack_require__(/*! call-bind-apply-helpers/functionApply */ "./node_modules/call-bind-apply-helpers/functionApply.js");
var $call = __webpack_require__(/*! call-bind-apply-helpers/functionCall */ "./node_modules/call-bind-apply-helpers/functionCall.js");
var needsEval = {};
var TypedArray = typeof Uint8Array === 'undefined' || !getProto ? undefined : getProto(Uint8Array);
var INTRINSICS = {
  __proto__: null,
  '%AggregateError%': typeof AggregateError === 'undefined' ? undefined : AggregateError,
  '%Array%': Array,
  '%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined : ArrayBuffer,
  '%ArrayIteratorPrototype%': hasSymbols && getProto ? getProto([][Symbol.iterator]()) : undefined,
  '%AsyncFromSyncIteratorPrototype%': undefined,
  '%AsyncFunction%': needsEval,
  '%AsyncGenerator%': needsEval,
  '%AsyncGeneratorFunction%': needsEval,
  '%AsyncIteratorPrototype%': needsEval,
  '%Atomics%': typeof Atomics === 'undefined' ? undefined : Atomics,
  '%BigInt%': typeof BigInt === 'undefined' ? undefined : BigInt,
  '%BigInt64Array%': typeof BigInt64Array === 'undefined' ? undefined : BigInt64Array,
  '%BigUint64Array%': typeof BigUint64Array === 'undefined' ? undefined : BigUint64Array,
  '%Boolean%': Boolean,
  '%DataView%': typeof DataView === 'undefined' ? undefined : DataView,
  '%Date%': Date,
  '%decodeURI%': decodeURI,
  '%decodeURIComponent%': decodeURIComponent,
  '%encodeURI%': encodeURI,
  '%encodeURIComponent%': encodeURIComponent,
  '%Error%': $Error,
  '%eval%': eval,
  // eslint-disable-line no-eval
  '%EvalError%': $EvalError,
  '%Float16Array%': typeof Float16Array === 'undefined' ? undefined : Float16Array,
  '%Float32Array%': typeof Float32Array === 'undefined' ? undefined : Float32Array,
  '%Float64Array%': typeof Float64Array === 'undefined' ? undefined : Float64Array,
  '%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined : FinalizationRegistry,
  '%Function%': $Function,
  '%GeneratorFunction%': needsEval,
  '%Int8Array%': typeof Int8Array === 'undefined' ? undefined : Int8Array,
  '%Int16Array%': typeof Int16Array === 'undefined' ? undefined : Int16Array,
  '%Int32Array%': typeof Int32Array === 'undefined' ? undefined : Int32Array,
  '%isFinite%': isFinite,
  '%isNaN%': isNaN,
  '%IteratorPrototype%': hasSymbols && getProto ? getProto(getProto([][Symbol.iterator]())) : undefined,
  '%JSON%': (typeof JSON === "undefined" ? "undefined" : _typeof(JSON)) === 'object' ? JSON : undefined,
  '%Map%': typeof Map === 'undefined' ? undefined : Map,
  '%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols || !getProto ? undefined : getProto(new Map()[Symbol.iterator]()),
  '%Math%': Math,
  '%Number%': Number,
  '%Object%': $Object,
  '%Object.getOwnPropertyDescriptor%': $gOPD,
  '%parseFloat%': parseFloat,
  '%parseInt%': parseInt,
  '%Promise%': typeof Promise === 'undefined' ? undefined : Promise,
  '%Proxy%': typeof Proxy === 'undefined' ? undefined : Proxy,
  '%RangeError%': $RangeError,
  '%ReferenceError%': $ReferenceError,
  '%Reflect%': typeof Reflect === 'undefined' ? undefined : Reflect,
  '%RegExp%': RegExp,
  '%Set%': typeof Set === 'undefined' ? undefined : Set,
  '%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols || !getProto ? undefined : getProto(new Set()[Symbol.iterator]()),
  '%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined : SharedArrayBuffer,
  '%String%': String,
  '%StringIteratorPrototype%': hasSymbols && getProto ? getProto(''[Symbol.iterator]()) : undefined,
  '%Symbol%': hasSymbols ? Symbol : undefined,
  '%SyntaxError%': $SyntaxError,
  '%ThrowTypeError%': ThrowTypeError,
  '%TypedArray%': TypedArray,
  '%TypeError%': $TypeError,
  '%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined : Uint8Array,
  '%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined : Uint8ClampedArray,
  '%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined : Uint16Array,
  '%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined : Uint32Array,
  '%URIError%': $URIError,
  '%WeakMap%': typeof WeakMap === 'undefined' ? undefined : WeakMap,
  '%WeakRef%': typeof WeakRef === 'undefined' ? undefined : WeakRef,
  '%WeakSet%': typeof WeakSet === 'undefined' ? undefined : WeakSet,
  '%Function.prototype.call%': $call,
  '%Function.prototype.apply%': $apply,
  '%Object.defineProperty%': $defineProperty,
  '%Object.getPrototypeOf%': $ObjectGPO,
  '%Math.abs%': abs,
  '%Math.floor%': floor,
  '%Math.max%': max,
  '%Math.min%': min,
  '%Math.pow%': pow,
  '%Math.round%': round,
  '%Math.sign%': sign,
  '%Reflect.getPrototypeOf%': $ReflectGPO
};
if (getProto) {
  try {
    null.error; // eslint-disable-line no-unused-expressions
  } catch (e) {
    // https://github.com/tc39/proposal-shadowrealm/pull/384#issuecomment-1364264229
    var errorProto = getProto(getProto(e));
    INTRINSICS['%Error.prototype%'] = errorProto;
  }
}
var doEval = function doEval(name) {
  var value;
  if (name === '%AsyncFunction%') {
    value = getEvalledConstructor('async function () {}');
  } else if (name === '%GeneratorFunction%') {
    value = getEvalledConstructor('function* () {}');
  } else if (name === '%AsyncGeneratorFunction%') {
    value = getEvalledConstructor('async function* () {}');
  } else if (name === '%AsyncGenerator%') {
    var fn = doEval('%AsyncGeneratorFunction%');
    if (fn) {
      value = fn.prototype;
    }
  } else if (name === '%AsyncIteratorPrototype%') {
    var gen = doEval('%AsyncGenerator%');
    if (gen && getProto) {
      value = getProto(gen.prototype);
    }
  }
  INTRINSICS[name] = value;
  return value;
};
var LEGACY_ALIASES = {
  __proto__: null,
  '%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
  '%ArrayPrototype%': ['Array', 'prototype'],
  '%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
  '%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
  '%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
  '%ArrayProto_values%': ['Array', 'prototype', 'values'],
  '%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
  '%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
  '%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
  '%BooleanPrototype%': ['Boolean', 'prototype'],
  '%DataViewPrototype%': ['DataView', 'prototype'],
  '%DatePrototype%': ['Date', 'prototype'],
  '%ErrorPrototype%': ['Error', 'prototype'],
  '%EvalErrorPrototype%': ['EvalError', 'prototype'],
  '%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
  '%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
  '%FunctionPrototype%': ['Function', 'prototype'],
  '%Generator%': ['GeneratorFunction', 'prototype'],
  '%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
  '%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
  '%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
  '%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
  '%JSONParse%': ['JSON', 'parse'],
  '%JSONStringify%': ['JSON', 'stringify'],
  '%MapPrototype%': ['Map', 'prototype'],
  '%NumberPrototype%': ['Number', 'prototype'],
  '%ObjectPrototype%': ['Object', 'prototype'],
  '%ObjProto_toString%': ['Object', 'prototype', 'toString'],
  '%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
  '%PromisePrototype%': ['Promise', 'prototype'],
  '%PromiseProto_then%': ['Promise', 'prototype', 'then'],
  '%Promise_all%': ['Promise', 'all'],
  '%Promise_reject%': ['Promise', 'reject'],
  '%Promise_resolve%': ['Promise', 'resolve'],
  '%RangeErrorPrototype%': ['RangeError', 'prototype'],
  '%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
  '%RegExpPrototype%': ['RegExp', 'prototype'],
  '%SetPrototype%': ['Set', 'prototype'],
  '%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
  '%StringPrototype%': ['String', 'prototype'],
  '%SymbolPrototype%': ['Symbol', 'prototype'],
  '%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
  '%TypedArrayPrototype%': ['TypedArray', 'prototype'],
  '%TypeErrorPrototype%': ['TypeError', 'prototype'],
  '%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
  '%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
  '%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
  '%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
  '%URIErrorPrototype%': ['URIError', 'prototype'],
  '%WeakMapPrototype%': ['WeakMap', 'prototype'],
  '%WeakSetPrototype%': ['WeakSet', 'prototype']
};
var bind = __webpack_require__(/*! function-bind */ "./node_modules/function-bind/index.js");
var hasOwn = __webpack_require__(/*! hasown */ "./node_modules/hasown/index.js");
var $concat = bind.call($call, Array.prototype.concat);
var $spliceApply = bind.call($apply, Array.prototype.splice);
var $replace = bind.call($call, String.prototype.replace);
var $strSlice = bind.call($call, String.prototype.slice);
var $exec = bind.call($call, RegExp.prototype.exec);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
  var first = $strSlice(string, 0, 1);
  var last = $strSlice(string, -1);
  if (first === '%' && last !== '%') {
    throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
  } else if (last === '%' && first !== '%') {
    throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
  }
  var result = [];
  $replace(string, rePropName, function (match, number, quote, subString) {
    result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match;
  });
  return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
  var intrinsicName = name;
  var alias;
  if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
    alias = LEGACY_ALIASES[intrinsicName];
    intrinsicName = '%' + alias[0] + '%';
  }
  if (hasOwn(INTRINSICS, intrinsicName)) {
    var value = INTRINSICS[intrinsicName];
    if (value === needsEval) {
      value = doEval(intrinsicName);
    }
    if (typeof value === 'undefined' && !allowMissing) {
      throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
    }
    return {
      alias: alias,
      name: intrinsicName,
      value: value
    };
  }
  throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
};
module.exports = function GetIntrinsic(name, allowMissing) {
  if (typeof name !== 'string' || name.length === 0) {
    throw new $TypeError('intrinsic name must be a non-empty string');
  }
  if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
    throw new $TypeError('"allowMissing" argument must be a boolean');
  }
  if ($exec(/^%?[^%]*%?$/, name) === null) {
    throw new $SyntaxError('`%` may not be present anywhere but at the beginning and end of the intrinsic name');
  }
  var parts = stringToPath(name);
  var intrinsicBaseName = parts.length > 0 ? parts[0] : '';
  var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
  var intrinsicRealName = intrinsic.name;
  var value = intrinsic.value;
  var skipFurtherCaching = false;
  var alias = intrinsic.alias;
  if (alias) {
    intrinsicBaseName = alias[0];
    $spliceApply(parts, $concat([0, 1], alias));
  }
  for (var i = 1, isOwn = true; i < parts.length; i += 1) {
    var part = parts[i];
    var first = $strSlice(part, 0, 1);
    var last = $strSlice(part, -1);
    if ((first === '"' || first === "'" || first === '`' || last === '"' || last === "'" || last === '`') && first !== last) {
      throw new $SyntaxError('property names with quotes must have matching quotes');
    }
    if (part === 'constructor' || !isOwn) {
      skipFurtherCaching = true;
    }
    intrinsicBaseName += '.' + part;
    intrinsicRealName = '%' + intrinsicBaseName + '%';
    if (hasOwn(INTRINSICS, intrinsicRealName)) {
      value = INTRINSICS[intrinsicRealName];
    } else if (value != null) {
      if (!(part in value)) {
        if (!allowMissing) {
          throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
        }
        return void undefined;
      }
      if ($gOPD && i + 1 >= parts.length) {
        var desc = $gOPD(value, part);
        isOwn = !!desc;

        // By convention, when a data property is converted to an accessor
        // property to emulate a data property that does not suffer from
        // the override mistake, that accessor's getter is marked with
        // an `originalValue` property. Here, when we detect this, we
        // uphold the illusion by pretending to see that original data
        // property, i.e., returning the value rather than the getter
        // itself.
        if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
          value = desc.get;
        } else {
          value = value[part];
        }
      } else {
        isOwn = hasOwn(value, part);
        value = value[part];
      }
      if (isOwn && !skipFurtherCaching) {
        INTRINSICS[intrinsicRealName] = value;
      }
    }
  }
  return value;
};

/***/ }),

/***/ "./node_modules/get-proto/Object.getPrototypeOf.js":
/*!*********************************************************!*\
  !*** ./node_modules/get-proto/Object.getPrototypeOf.js ***!
  \*********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var $Object = __webpack_require__(/*! es-object-atoms */ "./node_modules/es-object-atoms/index.js");

/** @type {import('./Object.getPrototypeOf')} */
module.exports = $Object.getPrototypeOf || null;

/***/ }),

/***/ "./node_modules/get-proto/Reflect.getPrototypeOf.js":
/*!**********************************************************!*\
  !*** ./node_modules/get-proto/Reflect.getPrototypeOf.js ***!
  \**********************************************************/
/***/ ((module) => {

"use strict";


/** @type {import('./Reflect.getPrototypeOf')} */
module.exports = typeof Reflect !== 'undefined' && Reflect.getPrototypeOf || null;

/***/ }),

/***/ "./node_modules/get-proto/index.js":
/*!*****************************************!*\
  !*** ./node_modules/get-proto/index.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var reflectGetProto = __webpack_require__(/*! ./Reflect.getPrototypeOf */ "./node_modules/get-proto/Reflect.getPrototypeOf.js");
var originalGetProto = __webpack_require__(/*! ./Object.getPrototypeOf */ "./node_modules/get-proto/Object.getPrototypeOf.js");
var getDunderProto = __webpack_require__(/*! dunder-proto/get */ "./node_modules/dunder-proto/get.js");

/** @type {import('.')} */
module.exports = reflectGetProto ? function getProto(O) {
  // @ts-expect-error TS can't narrow inside a closure, for some reason
  return reflectGetProto(O);
} : originalGetProto ? function getProto(O) {
  if (!O || _typeof(O) !== 'object' && typeof O !== 'function') {
    throw new TypeError('getProto: not an object');
  }
  // @ts-expect-error TS can't narrow inside a closure, for some reason
  return originalGetProto(O);
} : getDunderProto ? function getProto(O) {
  // @ts-expect-error TS can't narrow inside a closure, for some reason
  return getDunderProto(O);
} : null;

/***/ }),

/***/ "./node_modules/gopd/gOPD.js":
/*!***********************************!*\
  !*** ./node_modules/gopd/gOPD.js ***!
  \***********************************/
/***/ ((module) => {

"use strict";


/** @type {import('./gOPD')} */
module.exports = Object.getOwnPropertyDescriptor;

/***/ }),

/***/ "./node_modules/gopd/index.js":
/*!************************************!*\
  !*** ./node_modules/gopd/index.js ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


/** @type {import('.')} */
var $gOPD = __webpack_require__(/*! ./gOPD */ "./node_modules/gopd/gOPD.js");
if ($gOPD) {
  try {
    $gOPD([], 'length');
  } catch (e) {
    // IE 8 has a broken gOPD
    $gOPD = null;
  }
}
module.exports = $gOPD;

/***/ }),

/***/ "./node_modules/has-property-descriptors/index.js":
/*!********************************************************!*\
  !*** ./node_modules/has-property-descriptors/index.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var $defineProperty = __webpack_require__(/*! es-define-property */ "./node_modules/es-define-property/index.js");
var hasPropertyDescriptors = function hasPropertyDescriptors() {
  return !!$defineProperty;
};
hasPropertyDescriptors.hasArrayLengthDefineBug = function hasArrayLengthDefineBug() {
  // node v0.6 has a bug where array lengths can be Set but not Defined
  if (!$defineProperty) {
    return null;
  }
  try {
    return $defineProperty([], 'length', {
      value: 1
    }).length !== 1;
  } catch (e) {
    // In Firefox 4-22, defining length on an array throws an exception.
    return true;
  }
};
module.exports = hasPropertyDescriptors;

/***/ }),

/***/ "./node_modules/has-symbols/index.js":
/*!*******************************************!*\
  !*** ./node_modules/has-symbols/index.js ***!
  \*******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var origSymbol = typeof Symbol !== 'undefined' && Symbol;
var hasSymbolSham = __webpack_require__(/*! ./shams */ "./node_modules/has-symbols/shams.js");

/** @type {import('.')} */
module.exports = function hasNativeSymbols() {
  if (typeof origSymbol !== 'function') {
    return false;
  }
  if (typeof Symbol !== 'function') {
    return false;
  }
  if (_typeof(origSymbol('foo')) !== 'symbol') {
    return false;
  }
  if (_typeof(Symbol('bar')) !== 'symbol') {
    return false;
  }
  return hasSymbolSham();
};

/***/ }),

/***/ "./node_modules/has-symbols/shams.js":
/*!*******************************************!*\
  !*** ./node_modules/has-symbols/shams.js ***!
  \*******************************************/
/***/ ((module) => {

"use strict";


/** @type {import('./shams')} */
/* eslint complexity: [2, 18], max-statements: [2, 33] */
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
module.exports = function hasSymbols() {
  if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') {
    return false;
  }
  if (_typeof(Symbol.iterator) === 'symbol') {
    return true;
  }

  /** @type {{ [k in symbol]?: unknown }} */
  var obj = {};
  var sym = Symbol('test');
  var symObj = Object(sym);
  if (typeof sym === 'string') {
    return false;
  }
  if (Object.prototype.toString.call(sym) !== '[object Symbol]') {
    return false;
  }
  if (Object.prototype.toString.call(symObj) !== '[object Symbol]') {
    return false;
  }

  // temp disabled per https://github.com/ljharb/object.assign/issues/17
  // if (sym instanceof Symbol) { return false; }
  // temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
  // if (!(symObj instanceof Symbol)) { return false; }

  // if (typeof Symbol.prototype.toString !== 'function') { return false; }
  // if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

  var symVal = 42;
  obj[sym] = symVal;
  for (var _ in obj) {
    return false;
  } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
  if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) {
    return false;
  }
  if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) {
    return false;
  }
  var syms = Object.getOwnPropertySymbols(obj);
  if (syms.length !== 1 || syms[0] !== sym) {
    return false;
  }
  if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) {
    return false;
  }
  if (typeof Object.getOwnPropertyDescriptor === 'function') {
    // eslint-disable-next-line no-extra-parens
    var descriptor = /** @type {PropertyDescriptor} */Object.getOwnPropertyDescriptor(obj, sym);
    if (descriptor.value !== symVal || descriptor.enumerable !== true) {
      return false;
    }
  }
  return true;
};

/***/ }),

/***/ "./node_modules/has-tostringtag/shams.js":
/*!***********************************************!*\
  !*** ./node_modules/has-tostringtag/shams.js ***!
  \***********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var hasSymbols = __webpack_require__(/*! has-symbols/shams */ "./node_modules/has-symbols/shams.js");

/** @type {import('.')} */
module.exports = function hasToStringTagShams() {
  return hasSymbols() && !!Symbol.toStringTag;
};

/***/ }),

/***/ "./node_modules/hasown/index.js":
/*!**************************************!*\
  !*** ./node_modules/hasown/index.js ***!
  \**************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var call = Function.prototype.call;
var $hasOwn = Object.prototype.hasOwnProperty;
var bind = __webpack_require__(/*! function-bind */ "./node_modules/function-bind/index.js");

/** @type {import('.')} */
module.exports = bind.call(call, $hasOwn);

/***/ }),

/***/ "./node_modules/he/he.js":
/*!*******************************!*\
  !*** ./node_modules/he/he.js ***!
  \*******************************/
/***/ (function(module, exports, __webpack_require__) {

/* module decorator */ module = __webpack_require__.nmd(module);
var __WEBPACK_AMD_DEFINE_RESULT__;function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
/*! https://mths.be/he v1.2.0 by @mathias | MIT license */
;
(function (root) {
  // Detect free variables `exports`.
  var freeExports = ( false ? 0 : _typeof(exports)) == 'object' && exports;

  // Detect free variable `module`.
  var freeModule = ( false ? 0 : _typeof(module)) == 'object' && module && module.exports == freeExports && module;

  // Detect free variable `global`, from Node.js or Browserified code,
  // and use it as `root`.
  var freeGlobal = (typeof __webpack_require__.g === "undefined" ? "undefined" : _typeof(__webpack_require__.g)) == 'object' && __webpack_require__.g;
  if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
    root = freeGlobal;
  }

  /*--------------------------------------------------------------------------*/

  // All astral symbols.
  var regexAstralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
  // All ASCII symbols (not just printable ASCII) except those listed in the
  // first column of the overrides table.
  // https://html.spec.whatwg.org/multipage/syntax.html#table-charref-overrides
  var regexAsciiWhitelist = /[\x01-\x7F]/g;
  // All BMP symbols that are not ASCII newlines, printable ASCII symbols, or
  // code points listed in the first column of the overrides table on
  // https://html.spec.whatwg.org/multipage/syntax.html#table-charref-overrides.
  var regexBmpWhitelist = /[\x01-\t\x0B\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g;
  var regexEncodeNonAscii = /<\u20D2|=\u20E5|>\u20D2|\u205F\u200A|\u219D\u0338|\u2202\u0338|\u2220\u20D2|\u2229\uFE00|\u222A\uFE00|\u223C\u20D2|\u223D\u0331|\u223E\u0333|\u2242\u0338|\u224B\u0338|\u224D\u20D2|\u224E\u0338|\u224F\u0338|\u2250\u0338|\u2261\u20E5|\u2264\u20D2|\u2265\u20D2|\u2266\u0338|\u2267\u0338|\u2268\uFE00|\u2269\uFE00|\u226A\u0338|\u226A\u20D2|\u226B\u0338|\u226B\u20D2|\u227F\u0338|\u2282\u20D2|\u2283\u20D2|\u228A\uFE00|\u228B\uFE00|\u228F\u0338|\u2290\u0338|\u2293\uFE00|\u2294\uFE00|\u22B4\u20D2|\u22B5\u20D2|\u22D8\u0338|\u22D9\u0338|\u22DA\uFE00|\u22DB\uFE00|\u22F5\u0338|\u22F9\u0338|\u2933\u0338|\u29CF\u0338|\u29D0\u0338|\u2A6D\u0338|\u2A70\u0338|\u2A7D\u0338|\u2A7E\u0338|\u2AA1\u0338|\u2AA2\u0338|\u2AAC\uFE00|\u2AAD\uFE00|\u2AAF\u0338|\u2AB0\u0338|\u2AC5\u0338|\u2AC6\u0338|\u2ACB\uFE00|\u2ACC\uFE00|\u2AFD\u20E5|[\xA0-\u0113\u0116-\u0122\u0124-\u012B\u012E-\u014D\u0150-\u017E\u0192\u01B5\u01F5\u0237\u02C6\u02C7\u02D8-\u02DD\u0311\u0391-\u03A1\u03A3-\u03A9\u03B1-\u03C9\u03D1\u03D2\u03D5\u03D6\u03DC\u03DD\u03F0\u03F1\u03F5\u03F6\u0401-\u040C\u040E-\u044F\u0451-\u045C\u045E\u045F\u2002-\u2005\u2007-\u2010\u2013-\u2016\u2018-\u201A\u201C-\u201E\u2020-\u2022\u2025\u2026\u2030-\u2035\u2039\u203A\u203E\u2041\u2043\u2044\u204F\u2057\u205F-\u2063\u20AC\u20DB\u20DC\u2102\u2105\u210A-\u2113\u2115-\u211E\u2122\u2124\u2127-\u2129\u212C\u212D\u212F-\u2131\u2133-\u2138\u2145-\u2148\u2153-\u215E\u2190-\u219B\u219D-\u21A7\u21A9-\u21AE\u21B0-\u21B3\u21B5-\u21B7\u21BA-\u21DB\u21DD\u21E4\u21E5\u21F5\u21FD-\u2205\u2207-\u2209\u220B\u220C\u220F-\u2214\u2216-\u2218\u221A\u221D-\u2238\u223A-\u2257\u2259\u225A\u225C\u225F-\u2262\u2264-\u228B\u228D-\u229B\u229D-\u22A5\u22A7-\u22B0\u22B2-\u22BB\u22BD-\u22DB\u22DE-\u22E3\u22E6-\u22F7\u22F9-\u22FE\u2305\u2306\u2308-\u2310\u2312\u2313\u2315\u2316\u231C-\u231F\u2322\u2323\u232D\u232E\u2336\u233D\u233F\u237C\u23B0\u23B1\u23B4-\u23B6\u23DC-\u23DF\u23E2\u23E7\u2423\u24C8\u2500\u2502\u250C\u2510\u2514\u2518\u251C\u2524\u252C\u2534\u253C\u2550-\u256C\u2580\u2584\u2588\u2591-\u2593\u25A1\u25AA\u25AB\u25AD\u25AE\u25B1\u25B3-\u25B5\u25B8\u25B9\u25BD-\u25BF\u25C2\u25C3\u25CA\u25CB\u25EC\u25EF\u25F8-\u25FC\u2605\u2606\u260E\u2640\u2642\u2660\u2663\u2665\u2666\u266A\u266D-\u266F\u2713\u2717\u2720\u2736\u2758\u2772\u2773\u27C8\u27C9\u27E6-\u27ED\u27F5-\u27FA\u27FC\u27FF\u2902-\u2905\u290C-\u2913\u2916\u2919-\u2920\u2923-\u292A\u2933\u2935-\u2939\u293C\u293D\u2945\u2948-\u294B\u294E-\u2976\u2978\u2979\u297B-\u297F\u2985\u2986\u298B-\u2996\u299A\u299C\u299D\u29A4-\u29B7\u29B9\u29BB\u29BC\u29BE-\u29C5\u29C9\u29CD-\u29D0\u29DC-\u29DE\u29E3-\u29E5\u29EB\u29F4\u29F6\u2A00-\u2A02\u2A04\u2A06\u2A0C\u2A0D\u2A10-\u2A17\u2A22-\u2A27\u2A29\u2A2A\u2A2D-\u2A31\u2A33-\u2A3C\u2A3F\u2A40\u2A42-\u2A4D\u2A50\u2A53-\u2A58\u2A5A-\u2A5D\u2A5F\u2A66\u2A6A\u2A6D-\u2A75\u2A77-\u2A9A\u2A9D-\u2AA2\u2AA4-\u2AB0\u2AB3-\u2AC8\u2ACB\u2ACC\u2ACF-\u2ADB\u2AE4\u2AE6-\u2AE9\u2AEB-\u2AF3\u2AFD\uFB00-\uFB04]|\uD835[\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDCCF\uDD04\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDD6B]/g;
  var encodeMap = {
    '\xAD': 'shy',
    "\u200C": 'zwnj',
    "\u200D": 'zwj',
    "\u200E": 'lrm',
    "\u2063": 'ic',
    "\u2062": 'it',
    "\u2061": 'af',
    "\u200F": 'rlm',
    "\u200B": 'ZeroWidthSpace',
    "\u2060": 'NoBreak',
    "\u0311": 'DownBreve',
    "\u20DB": 'tdot',
    "\u20DC": 'DotDot',
    '\t': 'Tab',
    '\n': 'NewLine',
    "\u2008": 'puncsp',
    "\u205F": 'MediumSpace',
    "\u2009": 'thinsp',
    "\u200A": 'hairsp',
    "\u2004": 'emsp13',
    "\u2002": 'ensp',
    "\u2005": 'emsp14',
    "\u2003": 'emsp',
    "\u2007": 'numsp',
    '\xA0': 'nbsp',
    "\u205F\u200A": 'ThickSpace',
    "\u203E": 'oline',
    '_': 'lowbar',
    "\u2010": 'dash',
    "\u2013": 'ndash',
    "\u2014": 'mdash',
    "\u2015": 'horbar',
    ',': 'comma',
    ';': 'semi',
    "\u204F": 'bsemi',
    ':': 'colon',
    "\u2A74": 'Colone',
    '!': 'excl',
    '\xA1': 'iexcl',
    '?': 'quest',
    '\xBF': 'iquest',
    '.': 'period',
    "\u2025": 'nldr',
    "\u2026": 'mldr',
    '\xB7': 'middot',
    '\'': 'apos',
    "\u2018": 'lsquo',
    "\u2019": 'rsquo',
    "\u201A": 'sbquo',
    "\u2039": 'lsaquo',
    "\u203A": 'rsaquo',
    '"': 'quot',
    "\u201C": 'ldquo',
    "\u201D": 'rdquo',
    "\u201E": 'bdquo',
    '\xAB': 'laquo',
    '\xBB': 'raquo',
    '(': 'lpar',
    ')': 'rpar',
    '[': 'lsqb',
    ']': 'rsqb',
    '{': 'lcub',
    '}': 'rcub',
    "\u2308": 'lceil',
    "\u2309": 'rceil',
    "\u230A": 'lfloor',
    "\u230B": 'rfloor',
    "\u2985": 'lopar',
    "\u2986": 'ropar',
    "\u298B": 'lbrke',
    "\u298C": 'rbrke',
    "\u298D": 'lbrkslu',
    "\u298E": 'rbrksld',
    "\u298F": 'lbrksld',
    "\u2990": 'rbrkslu',
    "\u2991": 'langd',
    "\u2992": 'rangd',
    "\u2993": 'lparlt',
    "\u2994": 'rpargt',
    "\u2995": 'gtlPar',
    "\u2996": 'ltrPar',
    "\u27E6": 'lobrk',
    "\u27E7": 'robrk',
    "\u27E8": 'lang',
    "\u27E9": 'rang',
    "\u27EA": 'Lang',
    "\u27EB": 'Rang',
    "\u27EC": 'loang',
    "\u27ED": 'roang',
    "\u2772": 'lbbrk',
    "\u2773": 'rbbrk',
    "\u2016": 'Vert',
    '\xA7': 'sect',
    '\xB6': 'para',
    '@': 'commat',
    '*': 'ast',
    '/': 'sol',
    'undefined': null,
    '&': 'amp',
    '#': 'num',
    '%': 'percnt',
    "\u2030": 'permil',
    "\u2031": 'pertenk',
    "\u2020": 'dagger',
    "\u2021": 'Dagger',
    "\u2022": 'bull',
    "\u2043": 'hybull',
    "\u2032": 'prime',
    "\u2033": 'Prime',
    "\u2034": 'tprime',
    "\u2057": 'qprime',
    "\u2035": 'bprime',
    "\u2041": 'caret',
    '`': 'grave',
    '\xB4': 'acute',
    "\u02DC": 'tilde',
    '^': 'Hat',
    '\xAF': 'macr',
    "\u02D8": 'breve',
    "\u02D9": 'dot',
    '\xA8': 'die',
    "\u02DA": 'ring',
    "\u02DD": 'dblac',
    '\xB8': 'cedil',
    "\u02DB": 'ogon',
    "\u02C6": 'circ',
    "\u02C7": 'caron',
    '\xB0': 'deg',
    '\xA9': 'copy',
    '\xAE': 'reg',
    "\u2117": 'copysr',
    "\u2118": 'wp',
    "\u211E": 'rx',
    "\u2127": 'mho',
    "\u2129": 'iiota',
    "\u2190": 'larr',
    "\u219A": 'nlarr',
    "\u2192": 'rarr',
    "\u219B": 'nrarr',
    "\u2191": 'uarr',
    "\u2193": 'darr',
    "\u2194": 'harr',
    "\u21AE": 'nharr',
    "\u2195": 'varr',
    "\u2196": 'nwarr',
    "\u2197": 'nearr',
    "\u2198": 'searr',
    "\u2199": 'swarr',
    "\u219D": 'rarrw',
    "\u219D\u0338": 'nrarrw',
    "\u219E": 'Larr',
    "\u219F": 'Uarr',
    "\u21A0": 'Rarr',
    "\u21A1": 'Darr',
    "\u21A2": 'larrtl',
    "\u21A3": 'rarrtl',
    "\u21A4": 'mapstoleft',
    "\u21A5": 'mapstoup',
    "\u21A6": 'map',
    "\u21A7": 'mapstodown',
    "\u21A9": 'larrhk',
    "\u21AA": 'rarrhk',
    "\u21AB": 'larrlp',
    "\u21AC": 'rarrlp',
    "\u21AD": 'harrw',
    "\u21B0": 'lsh',
    "\u21B1": 'rsh',
    "\u21B2": 'ldsh',
    "\u21B3": 'rdsh',
    "\u21B5": 'crarr',
    "\u21B6": 'cularr',
    "\u21B7": 'curarr',
    "\u21BA": 'olarr',
    "\u21BB": 'orarr',
    "\u21BC": 'lharu',
    "\u21BD": 'lhard',
    "\u21BE": 'uharr',
    "\u21BF": 'uharl',
    "\u21C0": 'rharu',
    "\u21C1": 'rhard',
    "\u21C2": 'dharr',
    "\u21C3": 'dharl',
    "\u21C4": 'rlarr',
    "\u21C5": 'udarr',
    "\u21C6": 'lrarr',
    "\u21C7": 'llarr',
    "\u21C8": 'uuarr',
    "\u21C9": 'rrarr',
    "\u21CA": 'ddarr',
    "\u21CB": 'lrhar',
    "\u21CC": 'rlhar',
    "\u21D0": 'lArr',
    "\u21CD": 'nlArr',
    "\u21D1": 'uArr',
    "\u21D2": 'rArr',
    "\u21CF": 'nrArr',
    "\u21D3": 'dArr',
    "\u21D4": 'iff',
    "\u21CE": 'nhArr',
    "\u21D5": 'vArr',
    "\u21D6": 'nwArr',
    "\u21D7": 'neArr',
    "\u21D8": 'seArr',
    "\u21D9": 'swArr',
    "\u21DA": 'lAarr',
    "\u21DB": 'rAarr',
    "\u21DD": 'zigrarr',
    "\u21E4": 'larrb',
    "\u21E5": 'rarrb',
    "\u21F5": 'duarr',
    "\u21FD": 'loarr',
    "\u21FE": 'roarr',
    "\u21FF": 'hoarr',
    "\u2200": 'forall',
    "\u2201": 'comp',
    "\u2202": 'part',
    "\u2202\u0338": 'npart',
    "\u2203": 'exist',
    "\u2204": 'nexist',
    "\u2205": 'empty',
    "\u2207": 'Del',
    "\u2208": 'in',
    "\u2209": 'notin',
    "\u220B": 'ni',
    "\u220C": 'notni',
    "\u03F6": 'bepsi',
    "\u220F": 'prod',
    "\u2210": 'coprod',
    "\u2211": 'sum',
    '+': 'plus',
    '\xB1': 'pm',
    '\xF7': 'div',
    '\xD7': 'times',
    '<': 'lt',
    "\u226E": 'nlt',
    "<\u20D2": 'nvlt',
    '=': 'equals',
    "\u2260": 'ne',
    "=\u20E5": 'bne',
    "\u2A75": 'Equal',
    '>': 'gt',
    "\u226F": 'ngt',
    ">\u20D2": 'nvgt',
    '\xAC': 'not',
    '|': 'vert',
    '\xA6': 'brvbar',
    "\u2212": 'minus',
    "\u2213": 'mp',
    "\u2214": 'plusdo',
    "\u2044": 'frasl',
    "\u2216": 'setmn',
    "\u2217": 'lowast',
    "\u2218": 'compfn',
    "\u221A": 'Sqrt',
    "\u221D": 'prop',
    "\u221E": 'infin',
    "\u221F": 'angrt',
    "\u2220": 'ang',
    "\u2220\u20D2": 'nang',
    "\u2221": 'angmsd',
    "\u2222": 'angsph',
    "\u2223": 'mid',
    "\u2224": 'nmid',
    "\u2225": 'par',
    "\u2226": 'npar',
    "\u2227": 'and',
    "\u2228": 'or',
    "\u2229": 'cap',
    "\u2229\uFE00": 'caps',
    "\u222A": 'cup',
    "\u222A\uFE00": 'cups',
    "\u222B": 'int',
    "\u222C": 'Int',
    "\u222D": 'tint',
    "\u2A0C": 'qint',
    "\u222E": 'oint',
    "\u222F": 'Conint',
    "\u2230": 'Cconint',
    "\u2231": 'cwint',
    "\u2232": 'cwconint',
    "\u2233": 'awconint',
    "\u2234": 'there4',
    "\u2235": 'becaus',
    "\u2236": 'ratio',
    "\u2237": 'Colon',
    "\u2238": 'minusd',
    "\u223A": 'mDDot',
    "\u223B": 'homtht',
    "\u223C": 'sim',
    "\u2241": 'nsim',
    "\u223C\u20D2": 'nvsim',
    "\u223D": 'bsim',
    "\u223D\u0331": 'race',
    "\u223E": 'ac',
    "\u223E\u0333": 'acE',
    "\u223F": 'acd',
    "\u2240": 'wr',
    "\u2242": 'esim',
    "\u2242\u0338": 'nesim',
    "\u2243": 'sime',
    "\u2244": 'nsime',
    "\u2245": 'cong',
    "\u2247": 'ncong',
    "\u2246": 'simne',
    "\u2248": 'ap',
    "\u2249": 'nap',
    "\u224A": 'ape',
    "\u224B": 'apid',
    "\u224B\u0338": 'napid',
    "\u224C": 'bcong',
    "\u224D": 'CupCap',
    "\u226D": 'NotCupCap',
    "\u224D\u20D2": 'nvap',
    "\u224E": 'bump',
    "\u224E\u0338": 'nbump',
    "\u224F": 'bumpe',
    "\u224F\u0338": 'nbumpe',
    "\u2250": 'doteq',
    "\u2250\u0338": 'nedot',
    "\u2251": 'eDot',
    "\u2252": 'efDot',
    "\u2253": 'erDot',
    "\u2254": 'colone',
    "\u2255": 'ecolon',
    "\u2256": 'ecir',
    "\u2257": 'cire',
    "\u2259": 'wedgeq',
    "\u225A": 'veeeq',
    "\u225C": 'trie',
    "\u225F": 'equest',
    "\u2261": 'equiv',
    "\u2262": 'nequiv',
    "\u2261\u20E5": 'bnequiv',
    "\u2264": 'le',
    "\u2270": 'nle',
    "\u2264\u20D2": 'nvle',
    "\u2265": 'ge',
    "\u2271": 'nge',
    "\u2265\u20D2": 'nvge',
    "\u2266": 'lE',
    "\u2266\u0338": 'nlE',
    "\u2267": 'gE',
    "\u2267\u0338": 'ngE',
    "\u2268\uFE00": 'lvnE',
    "\u2268": 'lnE',
    "\u2269": 'gnE',
    "\u2269\uFE00": 'gvnE',
    "\u226A": 'll',
    "\u226A\u0338": 'nLtv',
    "\u226A\u20D2": 'nLt',
    "\u226B": 'gg',
    "\u226B\u0338": 'nGtv',
    "\u226B\u20D2": 'nGt',
    "\u226C": 'twixt',
    "\u2272": 'lsim',
    "\u2274": 'nlsim',
    "\u2273": 'gsim',
    "\u2275": 'ngsim',
    "\u2276": 'lg',
    "\u2278": 'ntlg',
    "\u2277": 'gl',
    "\u2279": 'ntgl',
    "\u227A": 'pr',
    "\u2280": 'npr',
    "\u227B": 'sc',
    "\u2281": 'nsc',
    "\u227C": 'prcue',
    "\u22E0": 'nprcue',
    "\u227D": 'sccue',
    "\u22E1": 'nsccue',
    "\u227E": 'prsim',
    "\u227F": 'scsim',
    "\u227F\u0338": 'NotSucceedsTilde',
    "\u2282": 'sub',
    "\u2284": 'nsub',
    "\u2282\u20D2": 'vnsub',
    "\u2283": 'sup',
    "\u2285": 'nsup',
    "\u2283\u20D2": 'vnsup',
    "\u2286": 'sube',
    "\u2288": 'nsube',
    "\u2287": 'supe',
    "\u2289": 'nsupe',
    "\u228A\uFE00": 'vsubne',
    "\u228A": 'subne',
    "\u228B\uFE00": 'vsupne',
    "\u228B": 'supne',
    "\u228D": 'cupdot',
    "\u228E": 'uplus',
    "\u228F": 'sqsub',
    "\u228F\u0338": 'NotSquareSubset',
    "\u2290": 'sqsup',
    "\u2290\u0338": 'NotSquareSuperset',
    "\u2291": 'sqsube',
    "\u22E2": 'nsqsube',
    "\u2292": 'sqsupe',
    "\u22E3": 'nsqsupe',
    "\u2293": 'sqcap',
    "\u2293\uFE00": 'sqcaps',
    "\u2294": 'sqcup',
    "\u2294\uFE00": 'sqcups',
    "\u2295": 'oplus',
    "\u2296": 'ominus',
    "\u2297": 'otimes',
    "\u2298": 'osol',
    "\u2299": 'odot',
    "\u229A": 'ocir',
    "\u229B": 'oast',
    "\u229D": 'odash',
    "\u229E": 'plusb',
    "\u229F": 'minusb',
    "\u22A0": 'timesb',
    "\u22A1": 'sdotb',
    "\u22A2": 'vdash',
    "\u22AC": 'nvdash',
    "\u22A3": 'dashv',
    "\u22A4": 'top',
    "\u22A5": 'bot',
    "\u22A7": 'models',
    "\u22A8": 'vDash',
    "\u22AD": 'nvDash',
    "\u22A9": 'Vdash',
    "\u22AE": 'nVdash',
    "\u22AA": 'Vvdash',
    "\u22AB": 'VDash',
    "\u22AF": 'nVDash',
    "\u22B0": 'prurel',
    "\u22B2": 'vltri',
    "\u22EA": 'nltri',
    "\u22B3": 'vrtri',
    "\u22EB": 'nrtri',
    "\u22B4": 'ltrie',
    "\u22EC": 'nltrie',
    "\u22B4\u20D2": 'nvltrie',
    "\u22B5": 'rtrie',
    "\u22ED": 'nrtrie',
    "\u22B5\u20D2": 'nvrtrie',
    "\u22B6": 'origof',
    "\u22B7": 'imof',
    "\u22B8": 'mumap',
    "\u22B9": 'hercon',
    "\u22BA": 'intcal',
    "\u22BB": 'veebar',
    "\u22BD": 'barvee',
    "\u22BE": 'angrtvb',
    "\u22BF": 'lrtri',
    "\u22C0": 'Wedge',
    "\u22C1": 'Vee',
    "\u22C2": 'xcap',
    "\u22C3": 'xcup',
    "\u22C4": 'diam',
    "\u22C5": 'sdot',
    "\u22C6": 'Star',
    "\u22C7": 'divonx',
    "\u22C8": 'bowtie',
    "\u22C9": 'ltimes',
    "\u22CA": 'rtimes',
    "\u22CB": 'lthree',
    "\u22CC": 'rthree',
    "\u22CD": 'bsime',
    "\u22CE": 'cuvee',
    "\u22CF": 'cuwed',
    "\u22D0": 'Sub',
    "\u22D1": 'Sup',
    "\u22D2": 'Cap',
    "\u22D3": 'Cup',
    "\u22D4": 'fork',
    "\u22D5": 'epar',
    "\u22D6": 'ltdot',
    "\u22D7": 'gtdot',
    "\u22D8": 'Ll',
    "\u22D8\u0338": 'nLl',
    "\u22D9": 'Gg',
    "\u22D9\u0338": 'nGg',
    "\u22DA\uFE00": 'lesg',
    "\u22DA": 'leg',
    "\u22DB": 'gel',
    "\u22DB\uFE00": 'gesl',
    "\u22DE": 'cuepr',
    "\u22DF": 'cuesc',
    "\u22E6": 'lnsim',
    "\u22E7": 'gnsim',
    "\u22E8": 'prnsim',
    "\u22E9": 'scnsim',
    "\u22EE": 'vellip',
    "\u22EF": 'ctdot',
    "\u22F0": 'utdot',
    "\u22F1": 'dtdot',
    "\u22F2": 'disin',
    "\u22F3": 'isinsv',
    "\u22F4": 'isins',
    "\u22F5": 'isindot',
    "\u22F5\u0338": 'notindot',
    "\u22F6": 'notinvc',
    "\u22F7": 'notinvb',
    "\u22F9": 'isinE',
    "\u22F9\u0338": 'notinE',
    "\u22FA": 'nisd',
    "\u22FB": 'xnis',
    "\u22FC": 'nis',
    "\u22FD": 'notnivc',
    "\u22FE": 'notnivb',
    "\u2305": 'barwed',
    "\u2306": 'Barwed',
    "\u230C": 'drcrop',
    "\u230D": 'dlcrop',
    "\u230E": 'urcrop',
    "\u230F": 'ulcrop',
    "\u2310": 'bnot',
    "\u2312": 'profline',
    "\u2313": 'profsurf',
    "\u2315": 'telrec',
    "\u2316": 'target',
    "\u231C": 'ulcorn',
    "\u231D": 'urcorn',
    "\u231E": 'dlcorn',
    "\u231F": 'drcorn',
    "\u2322": 'frown',
    "\u2323": 'smile',
    "\u232D": 'cylcty',
    "\u232E": 'profalar',
    "\u2336": 'topbot',
    "\u233D": 'ovbar',
    "\u233F": 'solbar',
    "\u237C": 'angzarr',
    "\u23B0": 'lmoust',
    "\u23B1": 'rmoust',
    "\u23B4": 'tbrk',
    "\u23B5": 'bbrk',
    "\u23B6": 'bbrktbrk',
    "\u23DC": 'OverParenthesis',
    "\u23DD": 'UnderParenthesis',
    "\u23DE": 'OverBrace',
    "\u23DF": 'UnderBrace',
    "\u23E2": 'trpezium',
    "\u23E7": 'elinters',
    "\u2423": 'blank',
    "\u2500": 'boxh',
    "\u2502": 'boxv',
    "\u250C": 'boxdr',
    "\u2510": 'boxdl',
    "\u2514": 'boxur',
    "\u2518": 'boxul',
    "\u251C": 'boxvr',
    "\u2524": 'boxvl',
    "\u252C": 'boxhd',
    "\u2534": 'boxhu',
    "\u253C": 'boxvh',
    "\u2550": 'boxH',
    "\u2551": 'boxV',
    "\u2552": 'boxdR',
    "\u2553": 'boxDr',
    "\u2554": 'boxDR',
    "\u2555": 'boxdL',
    "\u2556": 'boxDl',
    "\u2557": 'boxDL',
    "\u2558": 'boxuR',
    "\u2559": 'boxUr',
    "\u255A": 'boxUR',
    "\u255B": 'boxuL',
    "\u255C": 'boxUl',
    "\u255D": 'boxUL',
    "\u255E": 'boxvR',
    "\u255F": 'boxVr',
    "\u2560": 'boxVR',
    "\u2561": 'boxvL',
    "\u2562": 'boxVl',
    "\u2563": 'boxVL',
    "\u2564": 'boxHd',
    "\u2565": 'boxhD',
    "\u2566": 'boxHD',
    "\u2567": 'boxHu',
    "\u2568": 'boxhU',
    "\u2569": 'boxHU',
    "\u256A": 'boxvH',
    "\u256B": 'boxVh',
    "\u256C": 'boxVH',
    "\u2580": 'uhblk',
    "\u2584": 'lhblk',
    "\u2588": 'block',
    "\u2591": 'blk14',
    "\u2592": 'blk12',
    "\u2593": 'blk34',
    "\u25A1": 'squ',
    "\u25AA": 'squf',
    "\u25AB": 'EmptyVerySmallSquare',
    "\u25AD": 'rect',
    "\u25AE": 'marker',
    "\u25B1": 'fltns',
    "\u25B3": 'xutri',
    "\u25B4": 'utrif',
    "\u25B5": 'utri',
    "\u25B8": 'rtrif',
    "\u25B9": 'rtri',
    "\u25BD": 'xdtri',
    "\u25BE": 'dtrif',
    "\u25BF": 'dtri',
    "\u25C2": 'ltrif',
    "\u25C3": 'ltri',
    "\u25CA": 'loz',
    "\u25CB": 'cir',
    "\u25EC": 'tridot',
    "\u25EF": 'xcirc',
    "\u25F8": 'ultri',
    "\u25F9": 'urtri',
    "\u25FA": 'lltri',
    "\u25FB": 'EmptySmallSquare',
    "\u25FC": 'FilledSmallSquare',
    "\u2605": 'starf',
    "\u2606": 'star',
    "\u260E": 'phone',
    "\u2640": 'female',
    "\u2642": 'male',
    "\u2660": 'spades',
    "\u2663": 'clubs',
    "\u2665": 'hearts',
    "\u2666": 'diams',
    "\u266A": 'sung',
    "\u2713": 'check',
    "\u2717": 'cross',
    "\u2720": 'malt',
    "\u2736": 'sext',
    "\u2758": 'VerticalSeparator',
    "\u27C8": 'bsolhsub',
    "\u27C9": 'suphsol',
    "\u27F5": 'xlarr',
    "\u27F6": 'xrarr',
    "\u27F7": 'xharr',
    "\u27F8": 'xlArr',
    "\u27F9": 'xrArr',
    "\u27FA": 'xhArr',
    "\u27FC": 'xmap',
    "\u27FF": 'dzigrarr',
    "\u2902": 'nvlArr',
    "\u2903": 'nvrArr',
    "\u2904": 'nvHarr',
    "\u2905": 'Map',
    "\u290C": 'lbarr',
    "\u290D": 'rbarr',
    "\u290E": 'lBarr',
    "\u290F": 'rBarr',
    "\u2910": 'RBarr',
    "\u2911": 'DDotrahd',
    "\u2912": 'UpArrowBar',
    "\u2913": 'DownArrowBar',
    "\u2916": 'Rarrtl',
    "\u2919": 'latail',
    "\u291A": 'ratail',
    "\u291B": 'lAtail',
    "\u291C": 'rAtail',
    "\u291D": 'larrfs',
    "\u291E": 'rarrfs',
    "\u291F": 'larrbfs',
    "\u2920": 'rarrbfs',
    "\u2923": 'nwarhk',
    "\u2924": 'nearhk',
    "\u2925": 'searhk',
    "\u2926": 'swarhk',
    "\u2927": 'nwnear',
    "\u2928": 'toea',
    "\u2929": 'tosa',
    "\u292A": 'swnwar',
    "\u2933": 'rarrc',
    "\u2933\u0338": 'nrarrc',
    "\u2935": 'cudarrr',
    "\u2936": 'ldca',
    "\u2937": 'rdca',
    "\u2938": 'cudarrl',
    "\u2939": 'larrpl',
    "\u293C": 'curarrm',
    "\u293D": 'cularrp',
    "\u2945": 'rarrpl',
    "\u2948": 'harrcir',
    "\u2949": 'Uarrocir',
    "\u294A": 'lurdshar',
    "\u294B": 'ldrushar',
    "\u294E": 'LeftRightVector',
    "\u294F": 'RightUpDownVector',
    "\u2950": 'DownLeftRightVector',
    "\u2951": 'LeftUpDownVector',
    "\u2952": 'LeftVectorBar',
    "\u2953": 'RightVectorBar',
    "\u2954": 'RightUpVectorBar',
    "\u2955": 'RightDownVectorBar',
    "\u2956": 'DownLeftVectorBar',
    "\u2957": 'DownRightVectorBar',
    "\u2958": 'LeftUpVectorBar',
    "\u2959": 'LeftDownVectorBar',
    "\u295A": 'LeftTeeVector',
    "\u295B": 'RightTeeVector',
    "\u295C": 'RightUpTeeVector',
    "\u295D": 'RightDownTeeVector',
    "\u295E": 'DownLeftTeeVector',
    "\u295F": 'DownRightTeeVector',
    "\u2960": 'LeftUpTeeVector',
    "\u2961": 'LeftDownTeeVector',
    "\u2962": 'lHar',
    "\u2963": 'uHar',
    "\u2964": 'rHar',
    "\u2965": 'dHar',
    "\u2966": 'luruhar',
    "\u2967": 'ldrdhar',
    "\u2968": 'ruluhar',
    "\u2969": 'rdldhar',
    "\u296A": 'lharul',
    "\u296B": 'llhard',
    "\u296C": 'rharul',
    "\u296D": 'lrhard',
    "\u296E": 'udhar',
    "\u296F": 'duhar',
    "\u2970": 'RoundImplies',
    "\u2971": 'erarr',
    "\u2972": 'simrarr',
    "\u2973": 'larrsim',
    "\u2974": 'rarrsim',
    "\u2975": 'rarrap',
    "\u2976": 'ltlarr',
    "\u2978": 'gtrarr',
    "\u2979": 'subrarr',
    "\u297B": 'suplarr',
    "\u297C": 'lfisht',
    "\u297D": 'rfisht',
    "\u297E": 'ufisht',
    "\u297F": 'dfisht',
    "\u299A": 'vzigzag',
    "\u299C": 'vangrt',
    "\u299D": 'angrtvbd',
    "\u29A4": 'ange',
    "\u29A5": 'range',
    "\u29A6": 'dwangle',
    "\u29A7": 'uwangle',
    "\u29A8": 'angmsdaa',
    "\u29A9": 'angmsdab',
    "\u29AA": 'angmsdac',
    "\u29AB": 'angmsdad',
    "\u29AC": 'angmsdae',
    "\u29AD": 'angmsdaf',
    "\u29AE": 'angmsdag',
    "\u29AF": 'angmsdah',
    "\u29B0": 'bemptyv',
    "\u29B1": 'demptyv',
    "\u29B2": 'cemptyv',
    "\u29B3": 'raemptyv',
    "\u29B4": 'laemptyv',
    "\u29B5": 'ohbar',
    "\u29B6": 'omid',
    "\u29B7": 'opar',
    "\u29B9": 'operp',
    "\u29BB": 'olcross',
    "\u29BC": 'odsold',
    "\u29BE": 'olcir',
    "\u29BF": 'ofcir',
    "\u29C0": 'olt',
    "\u29C1": 'ogt',
    "\u29C2": 'cirscir',
    "\u29C3": 'cirE',
    "\u29C4": 'solb',
    "\u29C5": 'bsolb',
    "\u29C9": 'boxbox',
    "\u29CD": 'trisb',
    "\u29CE": 'rtriltri',
    "\u29CF": 'LeftTriangleBar',
    "\u29CF\u0338": 'NotLeftTriangleBar',
    "\u29D0": 'RightTriangleBar',
    "\u29D0\u0338": 'NotRightTriangleBar',
    "\u29DC": 'iinfin',
    "\u29DD": 'infintie',
    "\u29DE": 'nvinfin',
    "\u29E3": 'eparsl',
    "\u29E4": 'smeparsl',
    "\u29E5": 'eqvparsl',
    "\u29EB": 'lozf',
    "\u29F4": 'RuleDelayed',
    "\u29F6": 'dsol',
    "\u2A00": 'xodot',
    "\u2A01": 'xoplus',
    "\u2A02": 'xotime',
    "\u2A04": 'xuplus',
    "\u2A06": 'xsqcup',
    "\u2A0D": 'fpartint',
    "\u2A10": 'cirfnint',
    "\u2A11": 'awint',
    "\u2A12": 'rppolint',
    "\u2A13": 'scpolint',
    "\u2A14": 'npolint',
    "\u2A15": 'pointint',
    "\u2A16": 'quatint',
    "\u2A17": 'intlarhk',
    "\u2A22": 'pluscir',
    "\u2A23": 'plusacir',
    "\u2A24": 'simplus',
    "\u2A25": 'plusdu',
    "\u2A26": 'plussim',
    "\u2A27": 'plustwo',
    "\u2A29": 'mcomma',
    "\u2A2A": 'minusdu',
    "\u2A2D": 'loplus',
    "\u2A2E": 'roplus',
    "\u2A2F": 'Cross',
    "\u2A30": 'timesd',
    "\u2A31": 'timesbar',
    "\u2A33": 'smashp',
    "\u2A34": 'lotimes',
    "\u2A35": 'rotimes',
    "\u2A36": 'otimesas',
    "\u2A37": 'Otimes',
    "\u2A38": 'odiv',
    "\u2A39": 'triplus',
    "\u2A3A": 'triminus',
    "\u2A3B": 'tritime',
    "\u2A3C": 'iprod',
    "\u2A3F": 'amalg',
    "\u2A40": 'capdot',
    "\u2A42": 'ncup',
    "\u2A43": 'ncap',
    "\u2A44": 'capand',
    "\u2A45": 'cupor',
    "\u2A46": 'cupcap',
    "\u2A47": 'capcup',
    "\u2A48": 'cupbrcap',
    "\u2A49": 'capbrcup',
    "\u2A4A": 'cupcup',
    "\u2A4B": 'capcap',
    "\u2A4C": 'ccups',
    "\u2A4D": 'ccaps',
    "\u2A50": 'ccupssm',
    "\u2A53": 'And',
    "\u2A54": 'Or',
    "\u2A55": 'andand',
    "\u2A56": 'oror',
    "\u2A57": 'orslope',
    "\u2A58": 'andslope',
    "\u2A5A": 'andv',
    "\u2A5B": 'orv',
    "\u2A5C": 'andd',
    "\u2A5D": 'ord',
    "\u2A5F": 'wedbar',
    "\u2A66": 'sdote',
    "\u2A6A": 'simdot',
    "\u2A6D": 'congdot',
    "\u2A6D\u0338": 'ncongdot',
    "\u2A6E": 'easter',
    "\u2A6F": 'apacir',
    "\u2A70": 'apE',
    "\u2A70\u0338": 'napE',
    "\u2A71": 'eplus',
    "\u2A72": 'pluse',
    "\u2A73": 'Esim',
    "\u2A77": 'eDDot',
    "\u2A78": 'equivDD',
    "\u2A79": 'ltcir',
    "\u2A7A": 'gtcir',
    "\u2A7B": 'ltquest',
    "\u2A7C": 'gtquest',
    "\u2A7D": 'les',
    "\u2A7D\u0338": 'nles',
    "\u2A7E": 'ges',
    "\u2A7E\u0338": 'nges',
    "\u2A7F": 'lesdot',
    "\u2A80": 'gesdot',
    "\u2A81": 'lesdoto',
    "\u2A82": 'gesdoto',
    "\u2A83": 'lesdotor',
    "\u2A84": 'gesdotol',
    "\u2A85": 'lap',
    "\u2A86": 'gap',
    "\u2A87": 'lne',
    "\u2A88": 'gne',
    "\u2A89": 'lnap',
    "\u2A8A": 'gnap',
    "\u2A8B": 'lEg',
    "\u2A8C": 'gEl',
    "\u2A8D": 'lsime',
    "\u2A8E": 'gsime',
    "\u2A8F": 'lsimg',
    "\u2A90": 'gsiml',
    "\u2A91": 'lgE',
    "\u2A92": 'glE',
    "\u2A93": 'lesges',
    "\u2A94": 'gesles',
    "\u2A95": 'els',
    "\u2A96": 'egs',
    "\u2A97": 'elsdot',
    "\u2A98": 'egsdot',
    "\u2A99": 'el',
    "\u2A9A": 'eg',
    "\u2A9D": 'siml',
    "\u2A9E": 'simg',
    "\u2A9F": 'simlE',
    "\u2AA0": 'simgE',
    "\u2AA1": 'LessLess',
    "\u2AA1\u0338": 'NotNestedLessLess',
    "\u2AA2": 'GreaterGreater',
    "\u2AA2\u0338": 'NotNestedGreaterGreater',
    "\u2AA4": 'glj',
    "\u2AA5": 'gla',
    "\u2AA6": 'ltcc',
    "\u2AA7": 'gtcc',
    "\u2AA8": 'lescc',
    "\u2AA9": 'gescc',
    "\u2AAA": 'smt',
    "\u2AAB": 'lat',
    "\u2AAC": 'smte',
    "\u2AAC\uFE00": 'smtes',
    "\u2AAD": 'late',
    "\u2AAD\uFE00": 'lates',
    "\u2AAE": 'bumpE',
    "\u2AAF": 'pre',
    "\u2AAF\u0338": 'npre',
    "\u2AB0": 'sce',
    "\u2AB0\u0338": 'nsce',
    "\u2AB3": 'prE',
    "\u2AB4": 'scE',
    "\u2AB5": 'prnE',
    "\u2AB6": 'scnE',
    "\u2AB7": 'prap',
    "\u2AB8": 'scap',
    "\u2AB9": 'prnap',
    "\u2ABA": 'scnap',
    "\u2ABB": 'Pr',
    "\u2ABC": 'Sc',
    "\u2ABD": 'subdot',
    "\u2ABE": 'supdot',
    "\u2ABF": 'subplus',
    "\u2AC0": 'supplus',
    "\u2AC1": 'submult',
    "\u2AC2": 'supmult',
    "\u2AC3": 'subedot',
    "\u2AC4": 'supedot',
    "\u2AC5": 'subE',
    "\u2AC5\u0338": 'nsubE',
    "\u2AC6": 'supE',
    "\u2AC6\u0338": 'nsupE',
    "\u2AC7": 'subsim',
    "\u2AC8": 'supsim',
    "\u2ACB\uFE00": 'vsubnE',
    "\u2ACB": 'subnE',
    "\u2ACC\uFE00": 'vsupnE',
    "\u2ACC": 'supnE',
    "\u2ACF": 'csub',
    "\u2AD0": 'csup',
    "\u2AD1": 'csube',
    "\u2AD2": 'csupe',
    "\u2AD3": 'subsup',
    "\u2AD4": 'supsub',
    "\u2AD5": 'subsub',
    "\u2AD6": 'supsup',
    "\u2AD7": 'suphsub',
    "\u2AD8": 'supdsub',
    "\u2AD9": 'forkv',
    "\u2ADA": 'topfork',
    "\u2ADB": 'mlcp',
    "\u2AE4": 'Dashv',
    "\u2AE6": 'Vdashl',
    "\u2AE7": 'Barv',
    "\u2AE8": 'vBar',
    "\u2AE9": 'vBarv',
    "\u2AEB": 'Vbar',
    "\u2AEC": 'Not',
    "\u2AED": 'bNot',
    "\u2AEE": 'rnmid',
    "\u2AEF": 'cirmid',
    "\u2AF0": 'midcir',
    "\u2AF1": 'topcir',
    "\u2AF2": 'nhpar',
    "\u2AF3": 'parsim',
    "\u2AFD": 'parsl',
    "\u2AFD\u20E5": 'nparsl',
    "\u266D": 'flat',
    "\u266E": 'natur',
    "\u266F": 'sharp',
    '\xA4': 'curren',
    '\xA2': 'cent',
    '$': 'dollar',
    '\xA3': 'pound',
    '\xA5': 'yen',
    "\u20AC": 'euro',
    '\xB9': 'sup1',
    '\xBD': 'half',
    "\u2153": 'frac13',
    '\xBC': 'frac14',
    "\u2155": 'frac15',
    "\u2159": 'frac16',
    "\u215B": 'frac18',
    '\xB2': 'sup2',
    "\u2154": 'frac23',
    "\u2156": 'frac25',
    '\xB3': 'sup3',
    '\xBE': 'frac34',
    "\u2157": 'frac35',
    "\u215C": 'frac38',
    "\u2158": 'frac45',
    "\u215A": 'frac56',
    "\u215D": 'frac58',
    "\u215E": 'frac78',
    "\uD835\uDCB6": 'ascr',
    "\uD835\uDD52": 'aopf',
    "\uD835\uDD1E": 'afr',
    "\uD835\uDD38": 'Aopf',
    "\uD835\uDD04": 'Afr',
    "\uD835\uDC9C": 'Ascr',
    '\xAA': 'ordf',
    '\xE1': 'aacute',
    '\xC1': 'Aacute',
    '\xE0': 'agrave',
    '\xC0': 'Agrave',
    "\u0103": 'abreve',
    "\u0102": 'Abreve',
    '\xE2': 'acirc',
    '\xC2': 'Acirc',
    '\xE5': 'aring',
    '\xC5': 'angst',
    '\xE4': 'auml',
    '\xC4': 'Auml',
    '\xE3': 'atilde',
    '\xC3': 'Atilde',
    "\u0105": 'aogon',
    "\u0104": 'Aogon',
    "\u0101": 'amacr',
    "\u0100": 'Amacr',
    '\xE6': 'aelig',
    '\xC6': 'AElig',
    "\uD835\uDCB7": 'bscr',
    "\uD835\uDD53": 'bopf',
    "\uD835\uDD1F": 'bfr',
    "\uD835\uDD39": 'Bopf',
    "\u212C": 'Bscr',
    "\uD835\uDD05": 'Bfr',
    "\uD835\uDD20": 'cfr',
    "\uD835\uDCB8": 'cscr',
    "\uD835\uDD54": 'copf',
    "\u212D": 'Cfr',
    "\uD835\uDC9E": 'Cscr',
    "\u2102": 'Copf',
    "\u0107": 'cacute',
    "\u0106": 'Cacute',
    "\u0109": 'ccirc',
    "\u0108": 'Ccirc',
    "\u010D": 'ccaron',
    "\u010C": 'Ccaron',
    "\u010B": 'cdot',
    "\u010A": 'Cdot',
    '\xE7': 'ccedil',
    '\xC7': 'Ccedil',
    "\u2105": 'incare',
    "\uD835\uDD21": 'dfr',
    "\u2146": 'dd',
    "\uD835\uDD55": 'dopf',
    "\uD835\uDCB9": 'dscr',
    "\uD835\uDC9F": 'Dscr',
    "\uD835\uDD07": 'Dfr',
    "\u2145": 'DD',
    "\uD835\uDD3B": 'Dopf',
    "\u010F": 'dcaron',
    "\u010E": 'Dcaron',
    "\u0111": 'dstrok',
    "\u0110": 'Dstrok',
    '\xF0': 'eth',
    '\xD0': 'ETH',
    "\u2147": 'ee',
    "\u212F": 'escr',
    "\uD835\uDD22": 'efr',
    "\uD835\uDD56": 'eopf',
    "\u2130": 'Escr',
    "\uD835\uDD08": 'Efr',
    "\uD835\uDD3C": 'Eopf',
    '\xE9': 'eacute',
    '\xC9': 'Eacute',
    '\xE8': 'egrave',
    '\xC8': 'Egrave',
    '\xEA': 'ecirc',
    '\xCA': 'Ecirc',
    "\u011B": 'ecaron',
    "\u011A": 'Ecaron',
    '\xEB': 'euml',
    '\xCB': 'Euml',
    "\u0117": 'edot',
    "\u0116": 'Edot',
    "\u0119": 'eogon',
    "\u0118": 'Eogon',
    "\u0113": 'emacr',
    "\u0112": 'Emacr',
    "\uD835\uDD23": 'ffr',
    "\uD835\uDD57": 'fopf',
    "\uD835\uDCBB": 'fscr',
    "\uD835\uDD09": 'Ffr',
    "\uD835\uDD3D": 'Fopf',
    "\u2131": 'Fscr',
    "\uFB00": 'fflig',
    "\uFB03": 'ffilig',
    "\uFB04": 'ffllig',
    "\uFB01": 'filig',
    'fj': 'fjlig',
    "\uFB02": 'fllig',
    "\u0192": 'fnof',
    "\u210A": 'gscr',
    "\uD835\uDD58": 'gopf',
    "\uD835\uDD24": 'gfr',
    "\uD835\uDCA2": 'Gscr',
    "\uD835\uDD3E": 'Gopf',
    "\uD835\uDD0A": 'Gfr',
    "\u01F5": 'gacute',
    "\u011F": 'gbreve',
    "\u011E": 'Gbreve',
    "\u011D": 'gcirc',
    "\u011C": 'Gcirc',
    "\u0121": 'gdot',
    "\u0120": 'Gdot',
    "\u0122": 'Gcedil',
    "\uD835\uDD25": 'hfr',
    "\u210E": 'planckh',
    "\uD835\uDCBD": 'hscr',
    "\uD835\uDD59": 'hopf',
    "\u210B": 'Hscr',
    "\u210C": 'Hfr',
    "\u210D": 'Hopf',
    "\u0125": 'hcirc',
    "\u0124": 'Hcirc',
    "\u210F": 'hbar',
    "\u0127": 'hstrok',
    "\u0126": 'Hstrok',
    "\uD835\uDD5A": 'iopf',
    "\uD835\uDD26": 'ifr',
    "\uD835\uDCBE": 'iscr',
    "\u2148": 'ii',
    "\uD835\uDD40": 'Iopf',
    "\u2110": 'Iscr',
    "\u2111": 'Im',
    '\xED': 'iacute',
    '\xCD': 'Iacute',
    '\xEC': 'igrave',
    '\xCC': 'Igrave',
    '\xEE': 'icirc',
    '\xCE': 'Icirc',
    '\xEF': 'iuml',
    '\xCF': 'Iuml',
    "\u0129": 'itilde',
    "\u0128": 'Itilde',
    "\u0130": 'Idot',
    "\u012F": 'iogon',
    "\u012E": 'Iogon',
    "\u012B": 'imacr',
    "\u012A": 'Imacr',
    "\u0133": 'ijlig',
    "\u0132": 'IJlig',
    "\u0131": 'imath',
    "\uD835\uDCBF": 'jscr',
    "\uD835\uDD5B": 'jopf',
    "\uD835\uDD27": 'jfr',
    "\uD835\uDCA5": 'Jscr',
    "\uD835\uDD0D": 'Jfr',
    "\uD835\uDD41": 'Jopf',
    "\u0135": 'jcirc',
    "\u0134": 'Jcirc',
    "\u0237": 'jmath',
    "\uD835\uDD5C": 'kopf',
    "\uD835\uDCC0": 'kscr',
    "\uD835\uDD28": 'kfr',
    "\uD835\uDCA6": 'Kscr',
    "\uD835\uDD42": 'Kopf',
    "\uD835\uDD0E": 'Kfr',
    "\u0137": 'kcedil',
    "\u0136": 'Kcedil',
    "\uD835\uDD29": 'lfr',
    "\uD835\uDCC1": 'lscr',
    "\u2113": 'ell',
    "\uD835\uDD5D": 'lopf',
    "\u2112": 'Lscr',
    "\uD835\uDD0F": 'Lfr',
    "\uD835\uDD43": 'Lopf',
    "\u013A": 'lacute',
    "\u0139": 'Lacute',
    "\u013E": 'lcaron',
    "\u013D": 'Lcaron',
    "\u013C": 'lcedil',
    "\u013B": 'Lcedil',
    "\u0142": 'lstrok',
    "\u0141": 'Lstrok',
    "\u0140": 'lmidot',
    "\u013F": 'Lmidot',
    "\uD835\uDD2A": 'mfr',
    "\uD835\uDD5E": 'mopf',
    "\uD835\uDCC2": 'mscr',
    "\uD835\uDD10": 'Mfr',
    "\uD835\uDD44": 'Mopf',
    "\u2133": 'Mscr',
    "\uD835\uDD2B": 'nfr',
    "\uD835\uDD5F": 'nopf',
    "\uD835\uDCC3": 'nscr',
    "\u2115": 'Nopf',
    "\uD835\uDCA9": 'Nscr',
    "\uD835\uDD11": 'Nfr',
    "\u0144": 'nacute',
    "\u0143": 'Nacute',
    "\u0148": 'ncaron',
    "\u0147": 'Ncaron',
    '\xF1': 'ntilde',
    '\xD1': 'Ntilde',
    "\u0146": 'ncedil',
    "\u0145": 'Ncedil',
    "\u2116": 'numero',
    "\u014B": 'eng',
    "\u014A": 'ENG',
    "\uD835\uDD60": 'oopf',
    "\uD835\uDD2C": 'ofr',
    "\u2134": 'oscr',
    "\uD835\uDCAA": 'Oscr',
    "\uD835\uDD12": 'Ofr',
    "\uD835\uDD46": 'Oopf',
    '\xBA': 'ordm',
    '\xF3': 'oacute',
    '\xD3': 'Oacute',
    '\xF2': 'ograve',
    '\xD2': 'Ograve',
    '\xF4': 'ocirc',
    '\xD4': 'Ocirc',
    '\xF6': 'ouml',
    '\xD6': 'Ouml',
    "\u0151": 'odblac',
    "\u0150": 'Odblac',
    '\xF5': 'otilde',
    '\xD5': 'Otilde',
    '\xF8': 'oslash',
    '\xD8': 'Oslash',
    "\u014D": 'omacr',
    "\u014C": 'Omacr',
    "\u0153": 'oelig',
    "\u0152": 'OElig',
    "\uD835\uDD2D": 'pfr',
    "\uD835\uDCC5": 'pscr',
    "\uD835\uDD61": 'popf',
    "\u2119": 'Popf',
    "\uD835\uDD13": 'Pfr',
    "\uD835\uDCAB": 'Pscr',
    "\uD835\uDD62": 'qopf',
    "\uD835\uDD2E": 'qfr',
    "\uD835\uDCC6": 'qscr',
    "\uD835\uDCAC": 'Qscr',
    "\uD835\uDD14": 'Qfr',
    "\u211A": 'Qopf',
    "\u0138": 'kgreen',
    "\uD835\uDD2F": 'rfr',
    "\uD835\uDD63": 'ropf',
    "\uD835\uDCC7": 'rscr',
    "\u211B": 'Rscr',
    "\u211C": 'Re',
    "\u211D": 'Ropf',
    "\u0155": 'racute',
    "\u0154": 'Racute',
    "\u0159": 'rcaron',
    "\u0158": 'Rcaron',
    "\u0157": 'rcedil',
    "\u0156": 'Rcedil',
    "\uD835\uDD64": 'sopf',
    "\uD835\uDCC8": 'sscr',
    "\uD835\uDD30": 'sfr',
    "\uD835\uDD4A": 'Sopf',
    "\uD835\uDD16": 'Sfr',
    "\uD835\uDCAE": 'Sscr',
    "\u24C8": 'oS',
    "\u015B": 'sacute',
    "\u015A": 'Sacute',
    "\u015D": 'scirc',
    "\u015C": 'Scirc',
    "\u0161": 'scaron',
    "\u0160": 'Scaron',
    "\u015F": 'scedil',
    "\u015E": 'Scedil',
    '\xDF': 'szlig',
    "\uD835\uDD31": 'tfr',
    "\uD835\uDCC9": 'tscr',
    "\uD835\uDD65": 'topf',
    "\uD835\uDCAF": 'Tscr',
    "\uD835\uDD17": 'Tfr',
    "\uD835\uDD4B": 'Topf',
    "\u0165": 'tcaron',
    "\u0164": 'Tcaron',
    "\u0163": 'tcedil',
    "\u0162": 'Tcedil',
    "\u2122": 'trade',
    "\u0167": 'tstrok',
    "\u0166": 'Tstrok',
    "\uD835\uDCCA": 'uscr',
    "\uD835\uDD66": 'uopf',
    "\uD835\uDD32": 'ufr',
    "\uD835\uDD4C": 'Uopf',
    "\uD835\uDD18": 'Ufr',
    "\uD835\uDCB0": 'Uscr',
    '\xFA': 'uacute',
    '\xDA': 'Uacute',
    '\xF9': 'ugrave',
    '\xD9': 'Ugrave',
    "\u016D": 'ubreve',
    "\u016C": 'Ubreve',
    '\xFB': 'ucirc',
    '\xDB': 'Ucirc',
    "\u016F": 'uring',
    "\u016E": 'Uring',
    '\xFC': 'uuml',
    '\xDC': 'Uuml',
    "\u0171": 'udblac',
    "\u0170": 'Udblac',
    "\u0169": 'utilde',
    "\u0168": 'Utilde',
    "\u0173": 'uogon',
    "\u0172": 'Uogon',
    "\u016B": 'umacr',
    "\u016A": 'Umacr',
    "\uD835\uDD33": 'vfr',
    "\uD835\uDD67": 'vopf',
    "\uD835\uDCCB": 'vscr',
    "\uD835\uDD19": 'Vfr',
    "\uD835\uDD4D": 'Vopf',
    "\uD835\uDCB1": 'Vscr',
    "\uD835\uDD68": 'wopf',
    "\uD835\uDCCC": 'wscr',
    "\uD835\uDD34": 'wfr',
    "\uD835\uDCB2": 'Wscr',
    "\uD835\uDD4E": 'Wopf',
    "\uD835\uDD1A": 'Wfr',
    "\u0175": 'wcirc',
    "\u0174": 'Wcirc',
    "\uD835\uDD35": 'xfr',
    "\uD835\uDCCD": 'xscr',
    "\uD835\uDD69": 'xopf',
    "\uD835\uDD4F": 'Xopf',
    "\uD835\uDD1B": 'Xfr',
    "\uD835\uDCB3": 'Xscr',
    "\uD835\uDD36": 'yfr',
    "\uD835\uDCCE": 'yscr',
    "\uD835\uDD6A": 'yopf',
    "\uD835\uDCB4": 'Yscr',
    "\uD835\uDD1C": 'Yfr',
    "\uD835\uDD50": 'Yopf',
    '\xFD': 'yacute',
    '\xDD': 'Yacute',
    "\u0177": 'ycirc',
    "\u0176": 'Ycirc',
    '\xFF': 'yuml',
    "\u0178": 'Yuml',
    "\uD835\uDCCF": 'zscr',
    "\uD835\uDD37": 'zfr',
    "\uD835\uDD6B": 'zopf',
    "\u2128": 'Zfr',
    "\u2124": 'Zopf',
    "\uD835\uDCB5": 'Zscr',
    "\u017A": 'zacute',
    "\u0179": 'Zacute',
    "\u017E": 'zcaron',
    "\u017D": 'Zcaron',
    "\u017C": 'zdot',
    "\u017B": 'Zdot',
    "\u01B5": 'imped',
    '\xFE': 'thorn',
    '\xDE': 'THORN',
    "\u0149": 'napos',
    "\u03B1": 'alpha',
    "\u0391": 'Alpha',
    "\u03B2": 'beta',
    "\u0392": 'Beta',
    "\u03B3": 'gamma',
    "\u0393": 'Gamma',
    "\u03B4": 'delta',
    "\u0394": 'Delta',
    "\u03B5": 'epsi',
    "\u03F5": 'epsiv',
    "\u0395": 'Epsilon',
    "\u03DD": 'gammad',
    "\u03DC": 'Gammad',
    "\u03B6": 'zeta',
    "\u0396": 'Zeta',
    "\u03B7": 'eta',
    "\u0397": 'Eta',
    "\u03B8": 'theta',
    "\u03D1": 'thetav',
    "\u0398": 'Theta',
    "\u03B9": 'iota',
    "\u0399": 'Iota',
    "\u03BA": 'kappa',
    "\u03F0": 'kappav',
    "\u039A": 'Kappa',
    "\u03BB": 'lambda',
    "\u039B": 'Lambda',
    "\u03BC": 'mu',
    '\xB5': 'micro',
    "\u039C": 'Mu',
    "\u03BD": 'nu',
    "\u039D": 'Nu',
    "\u03BE": 'xi',
    "\u039E": 'Xi',
    "\u03BF": 'omicron',
    "\u039F": 'Omicron',
    "\u03C0": 'pi',
    "\u03D6": 'piv',
    "\u03A0": 'Pi',
    "\u03C1": 'rho',
    "\u03F1": 'rhov',
    "\u03A1": 'Rho',
    "\u03C3": 'sigma',
    "\u03A3": 'Sigma',
    "\u03C2": 'sigmaf',
    "\u03C4": 'tau',
    "\u03A4": 'Tau',
    "\u03C5": 'upsi',
    "\u03A5": 'Upsilon',
    "\u03D2": 'Upsi',
    "\u03C6": 'phi',
    "\u03D5": 'phiv',
    "\u03A6": 'Phi',
    "\u03C7": 'chi',
    "\u03A7": 'Chi',
    "\u03C8": 'psi',
    "\u03A8": 'Psi',
    "\u03C9": 'omega',
    "\u03A9": 'ohm',
    "\u0430": 'acy',
    "\u0410": 'Acy',
    "\u0431": 'bcy',
    "\u0411": 'Bcy',
    "\u0432": 'vcy',
    "\u0412": 'Vcy',
    "\u0433": 'gcy',
    "\u0413": 'Gcy',
    "\u0453": 'gjcy',
    "\u0403": 'GJcy',
    "\u0434": 'dcy',
    "\u0414": 'Dcy',
    "\u0452": 'djcy',
    "\u0402": 'DJcy',
    "\u0435": 'iecy',
    "\u0415": 'IEcy',
    "\u0451": 'iocy',
    "\u0401": 'IOcy',
    "\u0454": 'jukcy',
    "\u0404": 'Jukcy',
    "\u0436": 'zhcy',
    "\u0416": 'ZHcy',
    "\u0437": 'zcy',
    "\u0417": 'Zcy',
    "\u0455": 'dscy',
    "\u0405": 'DScy',
    "\u0438": 'icy',
    "\u0418": 'Icy',
    "\u0456": 'iukcy',
    "\u0406": 'Iukcy',
    "\u0457": 'yicy',
    "\u0407": 'YIcy',
    "\u0439": 'jcy',
    "\u0419": 'Jcy',
    "\u0458": 'jsercy',
    "\u0408": 'Jsercy',
    "\u043A": 'kcy',
    "\u041A": 'Kcy',
    "\u045C": 'kjcy',
    "\u040C": 'KJcy',
    "\u043B": 'lcy',
    "\u041B": 'Lcy',
    "\u0459": 'ljcy',
    "\u0409": 'LJcy',
    "\u043C": 'mcy',
    "\u041C": 'Mcy',
    "\u043D": 'ncy',
    "\u041D": 'Ncy',
    "\u045A": 'njcy',
    "\u040A": 'NJcy',
    "\u043E": 'ocy',
    "\u041E": 'Ocy',
    "\u043F": 'pcy',
    "\u041F": 'Pcy',
    "\u0440": 'rcy',
    "\u0420": 'Rcy',
    "\u0441": 'scy',
    "\u0421": 'Scy',
    "\u0442": 'tcy',
    "\u0422": 'Tcy',
    "\u045B": 'tshcy',
    "\u040B": 'TSHcy',
    "\u0443": 'ucy',
    "\u0423": 'Ucy',
    "\u045E": 'ubrcy',
    "\u040E": 'Ubrcy',
    "\u0444": 'fcy',
    "\u0424": 'Fcy',
    "\u0445": 'khcy',
    "\u0425": 'KHcy',
    "\u0446": 'tscy',
    "\u0426": 'TScy',
    "\u0447": 'chcy',
    "\u0427": 'CHcy',
    "\u045F": 'dzcy',
    "\u040F": 'DZcy',
    "\u0448": 'shcy',
    "\u0428": 'SHcy',
    "\u0449": 'shchcy',
    "\u0429": 'SHCHcy',
    "\u044A": 'hardcy',
    "\u042A": 'HARDcy',
    "\u044B": 'ycy',
    "\u042B": 'Ycy',
    "\u044C": 'softcy',
    "\u042C": 'SOFTcy',
    "\u044D": 'ecy',
    "\u042D": 'Ecy',
    "\u044E": 'yucy',
    "\u042E": 'YUcy',
    "\u044F": 'yacy',
    "\u042F": 'YAcy',
    "\u2135": 'aleph',
    "\u2136": 'beth',
    "\u2137": 'gimel',
    "\u2138": 'daleth'
  };
  var regexEscape = /["&'<>`]/g;
  var escapeMap = {
    '"': '&quot;',
    '&': '&amp;',
    '\'': '&#x27;',
    '<': '&lt;',
    // See https://mathiasbynens.be/notes/ambiguous-ampersands: in HTML, the
    // following is not strictly necessary unless it’s part of a tag or an
    // unquoted attribute value. We’re only escaping it to support those
    // situations, and for XML support.
    '>': '&gt;',
    // In Internet Explorer ≤ 8, the backtick character can be used
    // to break out of (un)quoted attribute values or HTML comments.
    // See http://html5sec.org/#102, http://html5sec.org/#108, and
    // http://html5sec.org/#133.
    '`': '&#x60;'
  };
  var regexInvalidEntity = /&#(?:[xX][^a-fA-F0-9]|[^0-9xX])/;
  var regexInvalidRawCodePoint = /[\0-\x08\x0B\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]|[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F\uDBBF\uDBFF][\uDFFE\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
  var regexDecode = /&(CounterClockwiseContourIntegral|DoubleLongLeftRightArrow|ClockwiseContourIntegral|NotNestedGreaterGreater|NotSquareSupersetEqual|DiacriticalDoubleAcute|NotRightTriangleEqual|NotSucceedsSlantEqual|NotPrecedesSlantEqual|CloseCurlyDoubleQuote|NegativeVeryThinSpace|DoubleContourIntegral|FilledVerySmallSquare|CapitalDifferentialD|OpenCurlyDoubleQuote|EmptyVerySmallSquare|NestedGreaterGreater|DoubleLongRightArrow|NotLeftTriangleEqual|NotGreaterSlantEqual|ReverseUpEquilibrium|DoubleLeftRightArrow|NotSquareSubsetEqual|NotDoubleVerticalBar|RightArrowLeftArrow|NotGreaterFullEqual|NotRightTriangleBar|SquareSupersetEqual|DownLeftRightVector|DoubleLongLeftArrow|leftrightsquigarrow|LeftArrowRightArrow|NegativeMediumSpace|blacktriangleright|RightDownVectorBar|PrecedesSlantEqual|RightDoubleBracket|SucceedsSlantEqual|NotLeftTriangleBar|RightTriangleEqual|SquareIntersection|RightDownTeeVector|ReverseEquilibrium|NegativeThickSpace|longleftrightarrow|Longleftrightarrow|LongLeftRightArrow|DownRightTeeVector|DownRightVectorBar|GreaterSlantEqual|SquareSubsetEqual|LeftDownVectorBar|LeftDoubleBracket|VerticalSeparator|rightleftharpoons|NotGreaterGreater|NotSquareSuperset|blacktriangleleft|blacktriangledown|NegativeThinSpace|LeftDownTeeVector|NotLessSlantEqual|leftrightharpoons|DoubleUpDownArrow|DoubleVerticalBar|LeftTriangleEqual|FilledSmallSquare|twoheadrightarrow|NotNestedLessLess|DownLeftTeeVector|DownLeftVectorBar|RightAngleBracket|NotTildeFullEqual|NotReverseElement|RightUpDownVector|DiacriticalTilde|NotSucceedsTilde|circlearrowright|NotPrecedesEqual|rightharpoondown|DoubleRightArrow|NotSucceedsEqual|NonBreakingSpace|NotRightTriangle|LessEqualGreater|RightUpTeeVector|LeftAngleBracket|GreaterFullEqual|DownArrowUpArrow|RightUpVectorBar|twoheadleftarrow|GreaterEqualLess|downharpoonright|RightTriangleBar|ntrianglerighteq|NotSupersetEqual|LeftUpDownVector|DiacriticalAcute|rightrightarrows|vartriangleright|UpArrowDownArrow|DiacriticalGrave|UnderParenthesis|EmptySmallSquare|LeftUpVectorBar|leftrightarrows|DownRightVector|downharpoonleft|trianglerighteq|ShortRightArrow|OverParenthesis|DoubleLeftArrow|DoubleDownArrow|NotSquareSubset|bigtriangledown|ntrianglelefteq|UpperRightArrow|curvearrowright|vartriangleleft|NotLeftTriangle|nleftrightarrow|LowerRightArrow|NotHumpDownHump|NotGreaterTilde|rightthreetimes|LeftUpTeeVector|NotGreaterEqual|straightepsilon|LeftTriangleBar|rightsquigarrow|ContourIntegral|rightleftarrows|CloseCurlyQuote|RightDownVector|LeftRightVector|nLeftrightarrow|leftharpoondown|circlearrowleft|SquareSuperset|OpenCurlyQuote|hookrightarrow|HorizontalLine|DiacriticalDot|NotLessGreater|ntriangleright|DoubleRightTee|InvisibleComma|InvisibleTimes|LowerLeftArrow|DownLeftVector|NotSubsetEqual|curvearrowleft|trianglelefteq|NotVerticalBar|TildeFullEqual|downdownarrows|NotGreaterLess|RightTeeVector|ZeroWidthSpace|looparrowright|LongRightArrow|doublebarwedge|ShortLeftArrow|ShortDownArrow|RightVectorBar|GreaterGreater|ReverseElement|rightharpoonup|LessSlantEqual|leftthreetimes|upharpoonright|rightarrowtail|LeftDownVector|Longrightarrow|NestedLessLess|UpperLeftArrow|nshortparallel|leftleftarrows|leftrightarrow|Leftrightarrow|LeftRightArrow|longrightarrow|upharpoonleft|RightArrowBar|ApplyFunction|LeftTeeVector|leftarrowtail|NotEqualTilde|varsubsetneqq|varsupsetneqq|RightTeeArrow|SucceedsEqual|SucceedsTilde|LeftVectorBar|SupersetEqual|hookleftarrow|DifferentialD|VerticalTilde|VeryThinSpace|blacktriangle|bigtriangleup|LessFullEqual|divideontimes|leftharpoonup|UpEquilibrium|ntriangleleft|RightTriangle|measuredangle|shortparallel|longleftarrow|Longleftarrow|LongLeftArrow|DoubleLeftTee|Poincareplane|PrecedesEqual|triangleright|DoubleUpArrow|RightUpVector|fallingdotseq|looparrowleft|PrecedesTilde|NotTildeEqual|NotTildeTilde|smallsetminus|Proportional|triangleleft|triangledown|UnderBracket|NotHumpEqual|exponentiale|ExponentialE|NotLessTilde|HilbertSpace|RightCeiling|blacklozenge|varsupsetneq|HumpDownHump|GreaterEqual|VerticalLine|LeftTeeArrow|NotLessEqual|DownTeeArrow|LeftTriangle|varsubsetneq|Intersection|NotCongruent|DownArrowBar|LeftUpVector|LeftArrowBar|risingdotseq|GreaterTilde|RoundImplies|SquareSubset|ShortUpArrow|NotSuperset|quaternions|precnapprox|backepsilon|preccurlyeq|OverBracket|blacksquare|MediumSpace|VerticalBar|circledcirc|circleddash|CircleMinus|CircleTimes|LessGreater|curlyeqprec|curlyeqsucc|diamondsuit|UpDownArrow|Updownarrow|RuleDelayed|Rrightarrow|updownarrow|RightVector|nRightarrow|nrightarrow|eqslantless|LeftCeiling|Equilibrium|SmallCircle|expectation|NotSucceeds|thickapprox|GreaterLess|SquareUnion|NotPrecedes|NotLessLess|straightphi|succnapprox|succcurlyeq|SubsetEqual|sqsupseteq|Proportion|Laplacetrf|ImaginaryI|supsetneqq|NotGreater|gtreqqless|NotElement|ThickSpace|TildeEqual|TildeTilde|Fouriertrf|rmoustache|EqualTilde|eqslantgtr|UnderBrace|LeftVector|UpArrowBar|nLeftarrow|nsubseteqq|subsetneqq|nsupseteqq|nleftarrow|succapprox|lessapprox|UpTeeArrow|upuparrows|curlywedge|lesseqqgtr|varepsilon|varnothing|RightFloor|complement|CirclePlus|sqsubseteq|Lleftarrow|circledast|RightArrow|Rightarrow|rightarrow|lmoustache|Bernoullis|precapprox|mapstoleft|mapstodown|longmapsto|dotsquare|downarrow|DoubleDot|nsubseteq|supsetneq|leftarrow|nsupseteq|subsetneq|ThinSpace|ngeqslant|subseteqq|HumpEqual|NotSubset|triangleq|NotCupCap|lesseqgtr|heartsuit|TripleDot|Leftarrow|Coproduct|Congruent|varpropto|complexes|gvertneqq|LeftArrow|LessTilde|supseteqq|MinusPlus|CircleDot|nleqslant|NotExists|gtreqless|nparallel|UnionPlus|LeftFloor|checkmark|CenterDot|centerdot|Mellintrf|gtrapprox|bigotimes|OverBrace|spadesuit|therefore|pitchfork|rationals|PlusMinus|Backslash|Therefore|DownBreve|backsimeq|backprime|DownArrow|nshortmid|Downarrow|lvertneqq|eqvparsl|imagline|imagpart|infintie|integers|Integral|intercal|LessLess|Uarrocir|intlarhk|sqsupset|angmsdaf|sqsubset|llcorner|vartheta|cupbrcap|lnapprox|Superset|SuchThat|succnsim|succneqq|angmsdag|biguplus|curlyvee|trpezium|Succeeds|NotTilde|bigwedge|angmsdah|angrtvbd|triminus|cwconint|fpartint|lrcorner|smeparsl|subseteq|urcorner|lurdshar|laemptyv|DDotrahd|approxeq|ldrushar|awconint|mapstoup|backcong|shortmid|triangle|geqslant|gesdotol|timesbar|circledR|circledS|setminus|multimap|naturals|scpolint|ncongdot|RightTee|boxminus|gnapprox|boxtimes|andslope|thicksim|angmsdaa|varsigma|cirfnint|rtriltri|angmsdab|rppolint|angmsdac|barwedge|drbkarow|clubsuit|thetasym|bsolhsub|capbrcup|dzigrarr|doteqdot|DotEqual|dotminus|UnderBar|NotEqual|realpart|otimesas|ulcorner|hksearow|hkswarow|parallel|PartialD|elinters|emptyset|plusacir|bbrktbrk|angmsdad|pointint|bigoplus|angmsdae|Precedes|bigsqcup|varkappa|notindot|supseteq|precneqq|precnsim|profalar|profline|profsurf|leqslant|lesdotor|raemptyv|subplus|notnivb|notnivc|subrarr|zigrarr|vzigzag|submult|subedot|Element|between|cirscir|larrbfs|larrsim|lotimes|lbrksld|lbrkslu|lozenge|ldrdhar|dbkarow|bigcirc|epsilon|simrarr|simplus|ltquest|Epsilon|luruhar|gtquest|maltese|npolint|eqcolon|npreceq|bigodot|ddagger|gtrless|bnequiv|harrcir|ddotseq|equivDD|backsim|demptyv|nsqsube|nsqsupe|Upsilon|nsubset|upsilon|minusdu|nsucceq|swarrow|nsupset|coloneq|searrow|boxplus|napprox|natural|asympeq|alefsym|congdot|nearrow|bigstar|diamond|supplus|tritime|LeftTee|nvinfin|triplus|NewLine|nvltrie|nvrtrie|nwarrow|nexists|Diamond|ruluhar|Implies|supmult|angzarr|suplarr|suphsub|questeq|because|digamma|Because|olcross|bemptyv|omicron|Omicron|rotimes|NoBreak|intprod|angrtvb|orderof|uwangle|suphsol|lesdoto|orslope|DownTee|realine|cudarrl|rdldhar|OverBar|supedot|lessdot|supdsub|topfork|succsim|rbrkslu|rbrksld|pertenk|cudarrr|isindot|planckh|lessgtr|pluscir|gesdoto|plussim|plustwo|lesssim|cularrp|rarrsim|Cayleys|notinva|notinvb|notinvc|UpArrow|Uparrow|uparrow|NotLess|dwangle|precsim|Product|curarrm|Cconint|dotplus|rarrbfs|ccupssm|Cedilla|cemptyv|notniva|quatint|frac35|frac38|frac45|frac56|frac58|frac78|tridot|xoplus|gacute|gammad|Gammad|lfisht|lfloor|bigcup|sqsupe|gbreve|Gbreve|lharul|sqsube|sqcups|Gcedil|apacir|llhard|lmidot|Lmidot|lmoust|andand|sqcaps|approx|Abreve|spades|circeq|tprime|divide|topcir|Assign|topbot|gesdot|divonx|xuplus|timesd|gesles|atilde|solbar|SOFTcy|loplus|timesb|lowast|lowbar|dlcorn|dlcrop|softcy|dollar|lparlt|thksim|lrhard|Atilde|lsaquo|smashp|bigvee|thinsp|wreath|bkarow|lsquor|lstrok|Lstrok|lthree|ltimes|ltlarr|DotDot|simdot|ltrPar|weierp|xsqcup|angmsd|sigmav|sigmaf|zeetrf|Zcaron|zcaron|mapsto|vsupne|thetav|cirmid|marker|mcomma|Zacute|vsubnE|there4|gtlPar|vsubne|bottom|gtrarr|SHCHcy|shchcy|midast|midcir|middot|minusb|minusd|gtrdot|bowtie|sfrown|mnplus|models|colone|seswar|Colone|mstpos|searhk|gtrsim|nacute|Nacute|boxbox|telrec|hairsp|Tcedil|nbumpe|scnsim|ncaron|Ncaron|ncedil|Ncedil|hamilt|Scedil|nearhk|hardcy|HARDcy|tcedil|Tcaron|commat|nequiv|nesear|tcaron|target|hearts|nexist|varrho|scedil|Scaron|scaron|hellip|Sacute|sacute|hercon|swnwar|compfn|rtimes|rthree|rsquor|rsaquo|zacute|wedgeq|homtht|barvee|barwed|Barwed|rpargt|horbar|conint|swarhk|roplus|nltrie|hslash|hstrok|Hstrok|rmoust|Conint|bprime|hybull|hyphen|iacute|Iacute|supsup|supsub|supsim|varphi|coprod|brvbar|agrave|Supset|supset|igrave|Igrave|notinE|Agrave|iiiint|iinfin|copysr|wedbar|Verbar|vangrt|becaus|incare|verbar|inodot|bullet|drcorn|intcal|drcrop|cularr|vellip|Utilde|bumpeq|cupcap|dstrok|Dstrok|CupCap|cupcup|cupdot|eacute|Eacute|supdot|iquest|easter|ecaron|Ecaron|ecolon|isinsv|utilde|itilde|Itilde|curarr|succeq|Bumpeq|cacute|ulcrop|nparsl|Cacute|nprcue|egrave|Egrave|nrarrc|nrarrw|subsup|subsub|nrtrie|jsercy|nsccue|Jsercy|kappav|kcedil|Kcedil|subsim|ulcorn|nsimeq|egsdot|veebar|kgreen|capand|elsdot|Subset|subset|curren|aacute|lacute|Lacute|emptyv|ntilde|Ntilde|lagran|lambda|Lambda|capcap|Ugrave|langle|subdot|emsp13|numero|emsp14|nvdash|nvDash|nVdash|nVDash|ugrave|ufisht|nvHarr|larrfs|nvlArr|larrhk|larrlp|larrpl|nvrArr|Udblac|nwarhk|larrtl|nwnear|oacute|Oacute|latail|lAtail|sstarf|lbrace|odblac|Odblac|lbrack|udblac|odsold|eparsl|lcaron|Lcaron|ograve|Ograve|lcedil|Lcedil|Aacute|ssmile|ssetmn|squarf|ldquor|capcup|ominus|cylcty|rharul|eqcirc|dagger|rfloor|rfisht|Dagger|daleth|equals|origof|capdot|equest|dcaron|Dcaron|rdquor|oslash|Oslash|otilde|Otilde|otimes|Otimes|urcrop|Ubreve|ubreve|Yacute|Uacute|uacute|Rcedil|rcedil|urcorn|parsim|Rcaron|Vdashl|rcaron|Tstrok|percnt|period|permil|Exists|yacute|rbrack|rbrace|phmmat|ccaron|Ccaron|planck|ccedil|plankv|tstrok|female|plusdo|plusdu|ffilig|plusmn|ffllig|Ccedil|rAtail|dfisht|bernou|ratail|Rarrtl|rarrtl|angsph|rarrpl|rarrlp|rarrhk|xwedge|xotime|forall|ForAll|Vvdash|vsupnE|preceq|bigcap|frac12|frac13|frac14|primes|rarrfs|prnsim|frac15|Square|frac16|square|lesdot|frac18|frac23|propto|prurel|rarrap|rangle|puncsp|frac25|Racute|qprime|racute|lesges|frac34|abreve|AElig|eqsim|utdot|setmn|urtri|Equal|Uring|seArr|uring|searr|dashv|Dashv|mumap|nabla|iogon|Iogon|sdote|sdotb|scsim|napid|napos|equiv|natur|Acirc|dblac|erarr|nbump|iprod|erDot|ucirc|awint|esdot|angrt|ncong|isinE|scnap|Scirc|scirc|ndash|isins|Ubrcy|nearr|neArr|isinv|nedot|ubrcy|acute|Ycirc|iukcy|Iukcy|xutri|nesim|caret|jcirc|Jcirc|caron|twixt|ddarr|sccue|exist|jmath|sbquo|ngeqq|angst|ccaps|lceil|ngsim|UpTee|delta|Delta|rtrif|nharr|nhArr|nhpar|rtrie|jukcy|Jukcy|kappa|rsquo|Kappa|nlarr|nlArr|TSHcy|rrarr|aogon|Aogon|fflig|xrarr|tshcy|ccirc|nleqq|filig|upsih|nless|dharl|nlsim|fjlig|ropar|nltri|dharr|robrk|roarr|fllig|fltns|roang|rnmid|subnE|subne|lAarr|trisb|Ccirc|acirc|ccups|blank|VDash|forkv|Vdash|langd|cedil|blk12|blk14|laquo|strns|diams|notin|vDash|larrb|blk34|block|disin|uplus|vdash|vBarv|aelig|starf|Wedge|check|xrArr|lates|lbarr|lBarr|notni|lbbrk|bcong|frasl|lbrke|frown|vrtri|vprop|vnsup|gamma|Gamma|wedge|xodot|bdquo|srarr|doteq|ldquo|boxdl|boxdL|gcirc|Gcirc|boxDl|boxDL|boxdr|boxdR|boxDr|TRADE|trade|rlhar|boxDR|vnsub|npart|vltri|rlarr|boxhd|boxhD|nprec|gescc|nrarr|nrArr|boxHd|boxHD|boxhu|boxhU|nrtri|boxHu|clubs|boxHU|times|colon|Colon|gimel|xlArr|Tilde|nsime|tilde|nsmid|nspar|THORN|thorn|xlarr|nsube|nsubE|thkap|xhArr|comma|nsucc|boxul|boxuL|nsupe|nsupE|gneqq|gnsim|boxUl|boxUL|grave|boxur|boxuR|boxUr|boxUR|lescc|angle|bepsi|boxvh|varpi|boxvH|numsp|Theta|gsime|gsiml|theta|boxVh|boxVH|boxvl|gtcir|gtdot|boxvL|boxVl|boxVL|crarr|cross|Cross|nvsim|boxvr|nwarr|nwArr|sqsup|dtdot|Uogon|lhard|lharu|dtrif|ocirc|Ocirc|lhblk|duarr|odash|sqsub|Hacek|sqcup|llarr|duhar|oelig|OElig|ofcir|boxvR|uogon|lltri|boxVr|csube|uuarr|ohbar|csupe|ctdot|olarr|olcir|harrw|oline|sqcap|omacr|Omacr|omega|Omega|boxVR|aleph|lneqq|lnsim|loang|loarr|rharu|lobrk|hcirc|operp|oplus|rhard|Hcirc|orarr|Union|order|ecirc|Ecirc|cuepr|szlig|cuesc|breve|reals|eDDot|Breve|hoarr|lopar|utrif|rdquo|Umacr|umacr|efDot|swArr|ultri|alpha|rceil|ovbar|swarr|Wcirc|wcirc|smtes|smile|bsemi|lrarr|aring|parsl|lrhar|bsime|uhblk|lrtri|cupor|Aring|uharr|uharl|slarr|rbrke|bsolb|lsime|rbbrk|RBarr|lsimg|phone|rBarr|rbarr|icirc|lsquo|Icirc|emacr|Emacr|ratio|simne|plusb|simlE|simgE|simeq|pluse|ltcir|ltdot|empty|xharr|xdtri|iexcl|Alpha|ltrie|rarrw|pound|ltrif|xcirc|bumpe|prcue|bumpE|asymp|amacr|cuvee|Sigma|sigma|iiint|udhar|iiota|ijlig|IJlig|supnE|imacr|Imacr|prime|Prime|image|prnap|eogon|Eogon|rarrc|mdash|mDDot|cuwed|imath|supne|imped|Amacr|udarr|prsim|micro|rarrb|cwint|raquo|infin|eplus|range|rangd|Ucirc|radic|minus|amalg|veeeq|rAarr|epsiv|ycirc|quest|sharp|quot|zwnj|Qscr|race|qscr|Qopf|qopf|qint|rang|Rang|Zscr|zscr|Zopf|zopf|rarr|rArr|Rarr|Pscr|pscr|prop|prod|prnE|prec|ZHcy|zhcy|prap|Zeta|zeta|Popf|popf|Zdot|plus|zdot|Yuml|yuml|phiv|YUcy|yucy|Yscr|yscr|perp|Yopf|yopf|part|para|YIcy|Ouml|rcub|yicy|YAcy|rdca|ouml|osol|Oscr|rdsh|yacy|real|oscr|xvee|andd|rect|andv|Xscr|oror|ordm|ordf|xscr|ange|aopf|Aopf|rHar|Xopf|opar|Oopf|xopf|xnis|rhov|oopf|omid|xmap|oint|apid|apos|ogon|ascr|Ascr|odot|odiv|xcup|xcap|ocir|oast|nvlt|nvle|nvgt|nvge|nvap|Wscr|wscr|auml|ntlg|ntgl|nsup|nsub|nsim|Nscr|nscr|nsce|Wopf|ring|npre|wopf|npar|Auml|Barv|bbrk|Nopf|nopf|nmid|nLtv|beta|ropf|Ropf|Beta|beth|nles|rpar|nleq|bnot|bNot|nldr|NJcy|rscr|Rscr|Vscr|vscr|rsqb|njcy|bopf|nisd|Bopf|rtri|Vopf|nGtv|ngtr|vopf|boxh|boxH|boxv|nges|ngeq|boxV|bscr|scap|Bscr|bsim|Vert|vert|bsol|bull|bump|caps|cdot|ncup|scnE|ncap|nbsp|napE|Cdot|cent|sdot|Vbar|nang|vBar|chcy|Mscr|mscr|sect|semi|CHcy|Mopf|mopf|sext|circ|cire|mldr|mlcp|cirE|comp|shcy|SHcy|vArr|varr|cong|copf|Copf|copy|COPY|malt|male|macr|lvnE|cscr|ltri|sime|ltcc|simg|Cscr|siml|csub|Uuml|lsqb|lsim|uuml|csup|Lscr|lscr|utri|smid|lpar|cups|smte|lozf|darr|Lopf|Uscr|solb|lopf|sopf|Sopf|lneq|uscr|spar|dArr|lnap|Darr|dash|Sqrt|LJcy|ljcy|lHar|dHar|Upsi|upsi|diam|lesg|djcy|DJcy|leqq|dopf|Dopf|dscr|Dscr|dscy|ldsh|ldca|squf|DScy|sscr|Sscr|dsol|lcub|late|star|Star|Uopf|Larr|lArr|larr|uopf|dtri|dzcy|sube|subE|Lang|lang|Kscr|kscr|Kopf|kopf|KJcy|kjcy|KHcy|khcy|DZcy|ecir|edot|eDot|Jscr|jscr|succ|Jopf|jopf|Edot|uHar|emsp|ensp|Iuml|iuml|eopf|isin|Iscr|iscr|Eopf|epar|sung|epsi|escr|sup1|sup2|sup3|Iota|iota|supe|supE|Iopf|iopf|IOcy|iocy|Escr|esim|Esim|imof|Uarr|QUOT|uArr|uarr|euml|IEcy|iecy|Idot|Euml|euro|excl|Hscr|hscr|Hopf|hopf|TScy|tscy|Tscr|hbar|tscr|flat|tbrk|fnof|hArr|harr|half|fopf|Fopf|tdot|gvnE|fork|trie|gtcc|fscr|Fscr|gdot|gsim|Gscr|gscr|Gopf|gopf|gneq|Gdot|tosa|gnap|Topf|topf|geqq|toea|GJcy|gjcy|tint|gesl|mid|Sfr|ggg|top|ges|gla|glE|glj|geq|gne|gEl|gel|gnE|Gcy|gcy|gap|Tfr|tfr|Tcy|tcy|Hat|Tau|Ffr|tau|Tab|hfr|Hfr|ffr|Fcy|fcy|icy|Icy|iff|ETH|eth|ifr|Ifr|Eta|eta|int|Int|Sup|sup|ucy|Ucy|Sum|sum|jcy|ENG|ufr|Ufr|eng|Jcy|jfr|els|ell|egs|Efr|efr|Jfr|uml|kcy|Kcy|Ecy|ecy|kfr|Kfr|lap|Sub|sub|lat|lcy|Lcy|leg|Dot|dot|lEg|leq|les|squ|div|die|lfr|Lfr|lgE|Dfr|dfr|Del|deg|Dcy|dcy|lne|lnE|sol|loz|smt|Cup|lrm|cup|lsh|Lsh|sim|shy|map|Map|mcy|Mcy|mfr|Mfr|mho|gfr|Gfr|sfr|cir|Chi|chi|nap|Cfr|vcy|Vcy|cfr|Scy|scy|ncy|Ncy|vee|Vee|Cap|cap|nfr|scE|sce|Nfr|nge|ngE|nGg|vfr|Vfr|ngt|bot|nGt|nis|niv|Rsh|rsh|nle|nlE|bne|Bfr|bfr|nLl|nlt|nLt|Bcy|bcy|not|Not|rlm|wfr|Wfr|npr|nsc|num|ocy|ast|Ocy|ofr|xfr|Xfr|Ofr|ogt|ohm|apE|olt|Rho|ape|rho|Rfr|rfr|ord|REG|ang|reg|orv|And|and|AMP|Rcy|amp|Afr|ycy|Ycy|yen|yfr|Yfr|rcy|par|pcy|Pcy|pfr|Pfr|phi|Phi|afr|Acy|acy|zcy|Zcy|piv|acE|acd|zfr|Zfr|pre|prE|psi|Psi|qfr|Qfr|zwj|Or|ge|Gg|gt|gg|el|oS|lt|Lt|LT|Re|lg|gl|eg|ne|Im|it|le|DD|wp|wr|nu|Nu|dd|lE|Sc|sc|pi|Pi|ee|af|ll|Ll|rx|gE|xi|pm|Xi|ic|pr|Pr|in|ni|mp|mu|ac|Mu|or|ap|Gt|GT|ii);|&(Aacute|Agrave|Atilde|Ccedil|Eacute|Egrave|Iacute|Igrave|Ntilde|Oacute|Ograve|Oslash|Otilde|Uacute|Ugrave|Yacute|aacute|agrave|atilde|brvbar|ccedil|curren|divide|eacute|egrave|frac12|frac14|frac34|iacute|igrave|iquest|middot|ntilde|oacute|ograve|oslash|otilde|plusmn|uacute|ugrave|yacute|AElig|Acirc|Aring|Ecirc|Icirc|Ocirc|THORN|Ucirc|acirc|acute|aelig|aring|cedil|ecirc|icirc|iexcl|laquo|micro|ocirc|pound|raquo|szlig|thorn|times|ucirc|Auml|COPY|Euml|Iuml|Ouml|QUOT|Uuml|auml|cent|copy|euml|iuml|macr|nbsp|ordf|ordm|ouml|para|quot|sect|sup1|sup2|sup3|uuml|yuml|AMP|ETH|REG|amp|deg|eth|not|reg|shy|uml|yen|GT|LT|gt|lt)(?!;)([=a-zA-Z0-9]?)|&#([0-9]+)(;?)|&#[xX]([a-fA-F0-9]+)(;?)|&([0-9a-zA-Z]+)/g;
  var decodeMap = {
    'aacute': '\xE1',
    'Aacute': '\xC1',
    'abreve': "\u0103",
    'Abreve': "\u0102",
    'ac': "\u223E",
    'acd': "\u223F",
    'acE': "\u223E\u0333",
    'acirc': '\xE2',
    'Acirc': '\xC2',
    'acute': '\xB4',
    'acy': "\u0430",
    'Acy': "\u0410",
    'aelig': '\xE6',
    'AElig': '\xC6',
    'af': "\u2061",
    'afr': "\uD835\uDD1E",
    'Afr': "\uD835\uDD04",
    'agrave': '\xE0',
    'Agrave': '\xC0',
    'alefsym': "\u2135",
    'aleph': "\u2135",
    'alpha': "\u03B1",
    'Alpha': "\u0391",
    'amacr': "\u0101",
    'Amacr': "\u0100",
    'amalg': "\u2A3F",
    'amp': '&',
    'AMP': '&',
    'and': "\u2227",
    'And': "\u2A53",
    'andand': "\u2A55",
    'andd': "\u2A5C",
    'andslope': "\u2A58",
    'andv': "\u2A5A",
    'ang': "\u2220",
    'ange': "\u29A4",
    'angle': "\u2220",
    'angmsd': "\u2221",
    'angmsdaa': "\u29A8",
    'angmsdab': "\u29A9",
    'angmsdac': "\u29AA",
    'angmsdad': "\u29AB",
    'angmsdae': "\u29AC",
    'angmsdaf': "\u29AD",
    'angmsdag': "\u29AE",
    'angmsdah': "\u29AF",
    'angrt': "\u221F",
    'angrtvb': "\u22BE",
    'angrtvbd': "\u299D",
    'angsph': "\u2222",
    'angst': '\xC5',
    'angzarr': "\u237C",
    'aogon': "\u0105",
    'Aogon': "\u0104",
    'aopf': "\uD835\uDD52",
    'Aopf': "\uD835\uDD38",
    'ap': "\u2248",
    'apacir': "\u2A6F",
    'ape': "\u224A",
    'apE': "\u2A70",
    'apid': "\u224B",
    'apos': '\'',
    'ApplyFunction': "\u2061",
    'approx': "\u2248",
    'approxeq': "\u224A",
    'aring': '\xE5',
    'Aring': '\xC5',
    'ascr': "\uD835\uDCB6",
    'Ascr': "\uD835\uDC9C",
    'Assign': "\u2254",
    'ast': '*',
    'asymp': "\u2248",
    'asympeq': "\u224D",
    'atilde': '\xE3',
    'Atilde': '\xC3',
    'auml': '\xE4',
    'Auml': '\xC4',
    'awconint': "\u2233",
    'awint': "\u2A11",
    'backcong': "\u224C",
    'backepsilon': "\u03F6",
    'backprime': "\u2035",
    'backsim': "\u223D",
    'backsimeq': "\u22CD",
    'Backslash': "\u2216",
    'Barv': "\u2AE7",
    'barvee': "\u22BD",
    'barwed': "\u2305",
    'Barwed': "\u2306",
    'barwedge': "\u2305",
    'bbrk': "\u23B5",
    'bbrktbrk': "\u23B6",
    'bcong': "\u224C",
    'bcy': "\u0431",
    'Bcy': "\u0411",
    'bdquo': "\u201E",
    'becaus': "\u2235",
    'because': "\u2235",
    'Because': "\u2235",
    'bemptyv': "\u29B0",
    'bepsi': "\u03F6",
    'bernou': "\u212C",
    'Bernoullis': "\u212C",
    'beta': "\u03B2",
    'Beta': "\u0392",
    'beth': "\u2136",
    'between': "\u226C",
    'bfr': "\uD835\uDD1F",
    'Bfr': "\uD835\uDD05",
    'bigcap': "\u22C2",
    'bigcirc': "\u25EF",
    'bigcup': "\u22C3",
    'bigodot': "\u2A00",
    'bigoplus': "\u2A01",
    'bigotimes': "\u2A02",
    'bigsqcup': "\u2A06",
    'bigstar': "\u2605",
    'bigtriangledown': "\u25BD",
    'bigtriangleup': "\u25B3",
    'biguplus': "\u2A04",
    'bigvee': "\u22C1",
    'bigwedge': "\u22C0",
    'bkarow': "\u290D",
    'blacklozenge': "\u29EB",
    'blacksquare': "\u25AA",
    'blacktriangle': "\u25B4",
    'blacktriangledown': "\u25BE",
    'blacktriangleleft': "\u25C2",
    'blacktriangleright': "\u25B8",
    'blank': "\u2423",
    'blk12': "\u2592",
    'blk14': "\u2591",
    'blk34': "\u2593",
    'block': "\u2588",
    'bne': "=\u20E5",
    'bnequiv': "\u2261\u20E5",
    'bnot': "\u2310",
    'bNot': "\u2AED",
    'bopf': "\uD835\uDD53",
    'Bopf': "\uD835\uDD39",
    'bot': "\u22A5",
    'bottom': "\u22A5",
    'bowtie': "\u22C8",
    'boxbox': "\u29C9",
    'boxdl': "\u2510",
    'boxdL': "\u2555",
    'boxDl': "\u2556",
    'boxDL': "\u2557",
    'boxdr': "\u250C",
    'boxdR': "\u2552",
    'boxDr': "\u2553",
    'boxDR': "\u2554",
    'boxh': "\u2500",
    'boxH': "\u2550",
    'boxhd': "\u252C",
    'boxhD': "\u2565",
    'boxHd': "\u2564",
    'boxHD': "\u2566",
    'boxhu': "\u2534",
    'boxhU': "\u2568",
    'boxHu': "\u2567",
    'boxHU': "\u2569",
    'boxminus': "\u229F",
    'boxplus': "\u229E",
    'boxtimes': "\u22A0",
    'boxul': "\u2518",
    'boxuL': "\u255B",
    'boxUl': "\u255C",
    'boxUL': "\u255D",
    'boxur': "\u2514",
    'boxuR': "\u2558",
    'boxUr': "\u2559",
    'boxUR': "\u255A",
    'boxv': "\u2502",
    'boxV': "\u2551",
    'boxvh': "\u253C",
    'boxvH': "\u256A",
    'boxVh': "\u256B",
    'boxVH': "\u256C",
    'boxvl': "\u2524",
    'boxvL': "\u2561",
    'boxVl': "\u2562",
    'boxVL': "\u2563",
    'boxvr': "\u251C",
    'boxvR': "\u255E",
    'boxVr': "\u255F",
    'boxVR': "\u2560",
    'bprime': "\u2035",
    'breve': "\u02D8",
    'Breve': "\u02D8",
    'brvbar': '\xA6',
    'bscr': "\uD835\uDCB7",
    'Bscr': "\u212C",
    'bsemi': "\u204F",
    'bsim': "\u223D",
    'bsime': "\u22CD",
    'bsol': '\\',
    'bsolb': "\u29C5",
    'bsolhsub': "\u27C8",
    'bull': "\u2022",
    'bullet': "\u2022",
    'bump': "\u224E",
    'bumpe': "\u224F",
    'bumpE': "\u2AAE",
    'bumpeq': "\u224F",
    'Bumpeq': "\u224E",
    'cacute': "\u0107",
    'Cacute': "\u0106",
    'cap': "\u2229",
    'Cap': "\u22D2",
    'capand': "\u2A44",
    'capbrcup': "\u2A49",
    'capcap': "\u2A4B",
    'capcup': "\u2A47",
    'capdot': "\u2A40",
    'CapitalDifferentialD': "\u2145",
    'caps': "\u2229\uFE00",
    'caret': "\u2041",
    'caron': "\u02C7",
    'Cayleys': "\u212D",
    'ccaps': "\u2A4D",
    'ccaron': "\u010D",
    'Ccaron': "\u010C",
    'ccedil': '\xE7',
    'Ccedil': '\xC7',
    'ccirc': "\u0109",
    'Ccirc': "\u0108",
    'Cconint': "\u2230",
    'ccups': "\u2A4C",
    'ccupssm': "\u2A50",
    'cdot': "\u010B",
    'Cdot': "\u010A",
    'cedil': '\xB8',
    'Cedilla': '\xB8',
    'cemptyv': "\u29B2",
    'cent': '\xA2',
    'centerdot': '\xB7',
    'CenterDot': '\xB7',
    'cfr': "\uD835\uDD20",
    'Cfr': "\u212D",
    'chcy': "\u0447",
    'CHcy': "\u0427",
    'check': "\u2713",
    'checkmark': "\u2713",
    'chi': "\u03C7",
    'Chi': "\u03A7",
    'cir': "\u25CB",
    'circ': "\u02C6",
    'circeq': "\u2257",
    'circlearrowleft': "\u21BA",
    'circlearrowright': "\u21BB",
    'circledast': "\u229B",
    'circledcirc': "\u229A",
    'circleddash': "\u229D",
    'CircleDot': "\u2299",
    'circledR': '\xAE',
    'circledS': "\u24C8",
    'CircleMinus': "\u2296",
    'CirclePlus': "\u2295",
    'CircleTimes': "\u2297",
    'cire': "\u2257",
    'cirE': "\u29C3",
    'cirfnint': "\u2A10",
    'cirmid': "\u2AEF",
    'cirscir': "\u29C2",
    'ClockwiseContourIntegral': "\u2232",
    'CloseCurlyDoubleQuote': "\u201D",
    'CloseCurlyQuote': "\u2019",
    'clubs': "\u2663",
    'clubsuit': "\u2663",
    'colon': ':',
    'Colon': "\u2237",
    'colone': "\u2254",
    'Colone': "\u2A74",
    'coloneq': "\u2254",
    'comma': ',',
    'commat': '@',
    'comp': "\u2201",
    'compfn': "\u2218",
    'complement': "\u2201",
    'complexes': "\u2102",
    'cong': "\u2245",
    'congdot': "\u2A6D",
    'Congruent': "\u2261",
    'conint': "\u222E",
    'Conint': "\u222F",
    'ContourIntegral': "\u222E",
    'copf': "\uD835\uDD54",
    'Copf': "\u2102",
    'coprod': "\u2210",
    'Coproduct': "\u2210",
    'copy': '\xA9',
    'COPY': '\xA9',
    'copysr': "\u2117",
    'CounterClockwiseContourIntegral': "\u2233",
    'crarr': "\u21B5",
    'cross': "\u2717",
    'Cross': "\u2A2F",
    'cscr': "\uD835\uDCB8",
    'Cscr': "\uD835\uDC9E",
    'csub': "\u2ACF",
    'csube': "\u2AD1",
    'csup': "\u2AD0",
    'csupe': "\u2AD2",
    'ctdot': "\u22EF",
    'cudarrl': "\u2938",
    'cudarrr': "\u2935",
    'cuepr': "\u22DE",
    'cuesc': "\u22DF",
    'cularr': "\u21B6",
    'cularrp': "\u293D",
    'cup': "\u222A",
    'Cup': "\u22D3",
    'cupbrcap': "\u2A48",
    'cupcap': "\u2A46",
    'CupCap': "\u224D",
    'cupcup': "\u2A4A",
    'cupdot': "\u228D",
    'cupor': "\u2A45",
    'cups': "\u222A\uFE00",
    'curarr': "\u21B7",
    'curarrm': "\u293C",
    'curlyeqprec': "\u22DE",
    'curlyeqsucc': "\u22DF",
    'curlyvee': "\u22CE",
    'curlywedge': "\u22CF",
    'curren': '\xA4',
    'curvearrowleft': "\u21B6",
    'curvearrowright': "\u21B7",
    'cuvee': "\u22CE",
    'cuwed': "\u22CF",
    'cwconint': "\u2232",
    'cwint': "\u2231",
    'cylcty': "\u232D",
    'dagger': "\u2020",
    'Dagger': "\u2021",
    'daleth': "\u2138",
    'darr': "\u2193",
    'dArr': "\u21D3",
    'Darr': "\u21A1",
    'dash': "\u2010",
    'dashv': "\u22A3",
    'Dashv': "\u2AE4",
    'dbkarow': "\u290F",
    'dblac': "\u02DD",
    'dcaron': "\u010F",
    'Dcaron': "\u010E",
    'dcy': "\u0434",
    'Dcy': "\u0414",
    'dd': "\u2146",
    'DD': "\u2145",
    'ddagger': "\u2021",
    'ddarr': "\u21CA",
    'DDotrahd': "\u2911",
    'ddotseq': "\u2A77",
    'deg': '\xB0',
    'Del': "\u2207",
    'delta': "\u03B4",
    'Delta': "\u0394",
    'demptyv': "\u29B1",
    'dfisht': "\u297F",
    'dfr': "\uD835\uDD21",
    'Dfr': "\uD835\uDD07",
    'dHar': "\u2965",
    'dharl': "\u21C3",
    'dharr': "\u21C2",
    'DiacriticalAcute': '\xB4',
    'DiacriticalDot': "\u02D9",
    'DiacriticalDoubleAcute': "\u02DD",
    'DiacriticalGrave': '`',
    'DiacriticalTilde': "\u02DC",
    'diam': "\u22C4",
    'diamond': "\u22C4",
    'Diamond': "\u22C4",
    'diamondsuit': "\u2666",
    'diams': "\u2666",
    'die': '\xA8',
    'DifferentialD': "\u2146",
    'digamma': "\u03DD",
    'disin': "\u22F2",
    'div': '\xF7',
    'divide': '\xF7',
    'divideontimes': "\u22C7",
    'divonx': "\u22C7",
    'djcy': "\u0452",
    'DJcy': "\u0402",
    'dlcorn': "\u231E",
    'dlcrop': "\u230D",
    'dollar': '$',
    'dopf': "\uD835\uDD55",
    'Dopf': "\uD835\uDD3B",
    'dot': "\u02D9",
    'Dot': '\xA8',
    'DotDot': "\u20DC",
    'doteq': "\u2250",
    'doteqdot': "\u2251",
    'DotEqual': "\u2250",
    'dotminus': "\u2238",
    'dotplus': "\u2214",
    'dotsquare': "\u22A1",
    'doublebarwedge': "\u2306",
    'DoubleContourIntegral': "\u222F",
    'DoubleDot': '\xA8',
    'DoubleDownArrow': "\u21D3",
    'DoubleLeftArrow': "\u21D0",
    'DoubleLeftRightArrow': "\u21D4",
    'DoubleLeftTee': "\u2AE4",
    'DoubleLongLeftArrow': "\u27F8",
    'DoubleLongLeftRightArrow': "\u27FA",
    'DoubleLongRightArrow': "\u27F9",
    'DoubleRightArrow': "\u21D2",
    'DoubleRightTee': "\u22A8",
    'DoubleUpArrow': "\u21D1",
    'DoubleUpDownArrow': "\u21D5",
    'DoubleVerticalBar': "\u2225",
    'downarrow': "\u2193",
    'Downarrow': "\u21D3",
    'DownArrow': "\u2193",
    'DownArrowBar': "\u2913",
    'DownArrowUpArrow': "\u21F5",
    'DownBreve': "\u0311",
    'downdownarrows': "\u21CA",
    'downharpoonleft': "\u21C3",
    'downharpoonright': "\u21C2",
    'DownLeftRightVector': "\u2950",
    'DownLeftTeeVector': "\u295E",
    'DownLeftVector': "\u21BD",
    'DownLeftVectorBar': "\u2956",
    'DownRightTeeVector': "\u295F",
    'DownRightVector': "\u21C1",
    'DownRightVectorBar': "\u2957",
    'DownTee': "\u22A4",
    'DownTeeArrow': "\u21A7",
    'drbkarow': "\u2910",
    'drcorn': "\u231F",
    'drcrop': "\u230C",
    'dscr': "\uD835\uDCB9",
    'Dscr': "\uD835\uDC9F",
    'dscy': "\u0455",
    'DScy': "\u0405",
    'dsol': "\u29F6",
    'dstrok': "\u0111",
    'Dstrok': "\u0110",
    'dtdot': "\u22F1",
    'dtri': "\u25BF",
    'dtrif': "\u25BE",
    'duarr': "\u21F5",
    'duhar': "\u296F",
    'dwangle': "\u29A6",
    'dzcy': "\u045F",
    'DZcy': "\u040F",
    'dzigrarr': "\u27FF",
    'eacute': '\xE9',
    'Eacute': '\xC9',
    'easter': "\u2A6E",
    'ecaron': "\u011B",
    'Ecaron': "\u011A",
    'ecir': "\u2256",
    'ecirc': '\xEA',
    'Ecirc': '\xCA',
    'ecolon': "\u2255",
    'ecy': "\u044D",
    'Ecy': "\u042D",
    'eDDot': "\u2A77",
    'edot': "\u0117",
    'eDot': "\u2251",
    'Edot': "\u0116",
    'ee': "\u2147",
    'efDot': "\u2252",
    'efr': "\uD835\uDD22",
    'Efr': "\uD835\uDD08",
    'eg': "\u2A9A",
    'egrave': '\xE8',
    'Egrave': '\xC8',
    'egs': "\u2A96",
    'egsdot': "\u2A98",
    'el': "\u2A99",
    'Element': "\u2208",
    'elinters': "\u23E7",
    'ell': "\u2113",
    'els': "\u2A95",
    'elsdot': "\u2A97",
    'emacr': "\u0113",
    'Emacr': "\u0112",
    'empty': "\u2205",
    'emptyset': "\u2205",
    'EmptySmallSquare': "\u25FB",
    'emptyv': "\u2205",
    'EmptyVerySmallSquare': "\u25AB",
    'emsp': "\u2003",
    'emsp13': "\u2004",
    'emsp14': "\u2005",
    'eng': "\u014B",
    'ENG': "\u014A",
    'ensp': "\u2002",
    'eogon': "\u0119",
    'Eogon': "\u0118",
    'eopf': "\uD835\uDD56",
    'Eopf': "\uD835\uDD3C",
    'epar': "\u22D5",
    'eparsl': "\u29E3",
    'eplus': "\u2A71",
    'epsi': "\u03B5",
    'epsilon': "\u03B5",
    'Epsilon': "\u0395",
    'epsiv': "\u03F5",
    'eqcirc': "\u2256",
    'eqcolon': "\u2255",
    'eqsim': "\u2242",
    'eqslantgtr': "\u2A96",
    'eqslantless': "\u2A95",
    'Equal': "\u2A75",
    'equals': '=',
    'EqualTilde': "\u2242",
    'equest': "\u225F",
    'Equilibrium': "\u21CC",
    'equiv': "\u2261",
    'equivDD': "\u2A78",
    'eqvparsl': "\u29E5",
    'erarr': "\u2971",
    'erDot': "\u2253",
    'escr': "\u212F",
    'Escr': "\u2130",
    'esdot': "\u2250",
    'esim': "\u2242",
    'Esim': "\u2A73",
    'eta': "\u03B7",
    'Eta': "\u0397",
    'eth': '\xF0',
    'ETH': '\xD0',
    'euml': '\xEB',
    'Euml': '\xCB',
    'euro': "\u20AC",
    'excl': '!',
    'exist': "\u2203",
    'Exists': "\u2203",
    'expectation': "\u2130",
    'exponentiale': "\u2147",
    'ExponentialE': "\u2147",
    'fallingdotseq': "\u2252",
    'fcy': "\u0444",
    'Fcy': "\u0424",
    'female': "\u2640",
    'ffilig': "\uFB03",
    'fflig': "\uFB00",
    'ffllig': "\uFB04",
    'ffr': "\uD835\uDD23",
    'Ffr': "\uD835\uDD09",
    'filig': "\uFB01",
    'FilledSmallSquare': "\u25FC",
    'FilledVerySmallSquare': "\u25AA",
    'fjlig': 'fj',
    'flat': "\u266D",
    'fllig': "\uFB02",
    'fltns': "\u25B1",
    'fnof': "\u0192",
    'fopf': "\uD835\uDD57",
    'Fopf': "\uD835\uDD3D",
    'forall': "\u2200",
    'ForAll': "\u2200",
    'fork': "\u22D4",
    'forkv': "\u2AD9",
    'Fouriertrf': "\u2131",
    'fpartint': "\u2A0D",
    'frac12': '\xBD',
    'frac13': "\u2153",
    'frac14': '\xBC',
    'frac15': "\u2155",
    'frac16': "\u2159",
    'frac18': "\u215B",
    'frac23': "\u2154",
    'frac25': "\u2156",
    'frac34': '\xBE',
    'frac35': "\u2157",
    'frac38': "\u215C",
    'frac45': "\u2158",
    'frac56': "\u215A",
    'frac58': "\u215D",
    'frac78': "\u215E",
    'frasl': "\u2044",
    'frown': "\u2322",
    'fscr': "\uD835\uDCBB",
    'Fscr': "\u2131",
    'gacute': "\u01F5",
    'gamma': "\u03B3",
    'Gamma': "\u0393",
    'gammad': "\u03DD",
    'Gammad': "\u03DC",
    'gap': "\u2A86",
    'gbreve': "\u011F",
    'Gbreve': "\u011E",
    'Gcedil': "\u0122",
    'gcirc': "\u011D",
    'Gcirc': "\u011C",
    'gcy': "\u0433",
    'Gcy': "\u0413",
    'gdot': "\u0121",
    'Gdot': "\u0120",
    'ge': "\u2265",
    'gE': "\u2267",
    'gel': "\u22DB",
    'gEl': "\u2A8C",
    'geq': "\u2265",
    'geqq': "\u2267",
    'geqslant': "\u2A7E",
    'ges': "\u2A7E",
    'gescc': "\u2AA9",
    'gesdot': "\u2A80",
    'gesdoto': "\u2A82",
    'gesdotol': "\u2A84",
    'gesl': "\u22DB\uFE00",
    'gesles': "\u2A94",
    'gfr': "\uD835\uDD24",
    'Gfr': "\uD835\uDD0A",
    'gg': "\u226B",
    'Gg': "\u22D9",
    'ggg': "\u22D9",
    'gimel': "\u2137",
    'gjcy': "\u0453",
    'GJcy': "\u0403",
    'gl': "\u2277",
    'gla': "\u2AA5",
    'glE': "\u2A92",
    'glj': "\u2AA4",
    'gnap': "\u2A8A",
    'gnapprox': "\u2A8A",
    'gne': "\u2A88",
    'gnE': "\u2269",
    'gneq': "\u2A88",
    'gneqq': "\u2269",
    'gnsim': "\u22E7",
    'gopf': "\uD835\uDD58",
    'Gopf': "\uD835\uDD3E",
    'grave': '`',
    'GreaterEqual': "\u2265",
    'GreaterEqualLess': "\u22DB",
    'GreaterFullEqual': "\u2267",
    'GreaterGreater': "\u2AA2",
    'GreaterLess': "\u2277",
    'GreaterSlantEqual': "\u2A7E",
    'GreaterTilde': "\u2273",
    'gscr': "\u210A",
    'Gscr': "\uD835\uDCA2",
    'gsim': "\u2273",
    'gsime': "\u2A8E",
    'gsiml': "\u2A90",
    'gt': '>',
    'Gt': "\u226B",
    'GT': '>',
    'gtcc': "\u2AA7",
    'gtcir': "\u2A7A",
    'gtdot': "\u22D7",
    'gtlPar': "\u2995",
    'gtquest': "\u2A7C",
    'gtrapprox': "\u2A86",
    'gtrarr': "\u2978",
    'gtrdot': "\u22D7",
    'gtreqless': "\u22DB",
    'gtreqqless': "\u2A8C",
    'gtrless': "\u2277",
    'gtrsim': "\u2273",
    'gvertneqq': "\u2269\uFE00",
    'gvnE': "\u2269\uFE00",
    'Hacek': "\u02C7",
    'hairsp': "\u200A",
    'half': '\xBD',
    'hamilt': "\u210B",
    'hardcy': "\u044A",
    'HARDcy': "\u042A",
    'harr': "\u2194",
    'hArr': "\u21D4",
    'harrcir': "\u2948",
    'harrw': "\u21AD",
    'Hat': '^',
    'hbar': "\u210F",
    'hcirc': "\u0125",
    'Hcirc': "\u0124",
    'hearts': "\u2665",
    'heartsuit': "\u2665",
    'hellip': "\u2026",
    'hercon': "\u22B9",
    'hfr': "\uD835\uDD25",
    'Hfr': "\u210C",
    'HilbertSpace': "\u210B",
    'hksearow': "\u2925",
    'hkswarow': "\u2926",
    'hoarr': "\u21FF",
    'homtht': "\u223B",
    'hookleftarrow': "\u21A9",
    'hookrightarrow': "\u21AA",
    'hopf': "\uD835\uDD59",
    'Hopf': "\u210D",
    'horbar': "\u2015",
    'HorizontalLine': "\u2500",
    'hscr': "\uD835\uDCBD",
    'Hscr': "\u210B",
    'hslash': "\u210F",
    'hstrok': "\u0127",
    'Hstrok': "\u0126",
    'HumpDownHump': "\u224E",
    'HumpEqual': "\u224F",
    'hybull': "\u2043",
    'hyphen': "\u2010",
    'iacute': '\xED',
    'Iacute': '\xCD',
    'ic': "\u2063",
    'icirc': '\xEE',
    'Icirc': '\xCE',
    'icy': "\u0438",
    'Icy': "\u0418",
    'Idot': "\u0130",
    'iecy': "\u0435",
    'IEcy': "\u0415",
    'iexcl': '\xA1',
    'iff': "\u21D4",
    'ifr': "\uD835\uDD26",
    'Ifr': "\u2111",
    'igrave': '\xEC',
    'Igrave': '\xCC',
    'ii': "\u2148",
    'iiiint': "\u2A0C",
    'iiint': "\u222D",
    'iinfin': "\u29DC",
    'iiota': "\u2129",
    'ijlig': "\u0133",
    'IJlig': "\u0132",
    'Im': "\u2111",
    'imacr': "\u012B",
    'Imacr': "\u012A",
    'image': "\u2111",
    'ImaginaryI': "\u2148",
    'imagline': "\u2110",
    'imagpart': "\u2111",
    'imath': "\u0131",
    'imof': "\u22B7",
    'imped': "\u01B5",
    'Implies': "\u21D2",
    'in': "\u2208",
    'incare': "\u2105",
    'infin': "\u221E",
    'infintie': "\u29DD",
    'inodot': "\u0131",
    'int': "\u222B",
    'Int': "\u222C",
    'intcal': "\u22BA",
    'integers': "\u2124",
    'Integral': "\u222B",
    'intercal': "\u22BA",
    'Intersection': "\u22C2",
    'intlarhk': "\u2A17",
    'intprod': "\u2A3C",
    'InvisibleComma': "\u2063",
    'InvisibleTimes': "\u2062",
    'iocy': "\u0451",
    'IOcy': "\u0401",
    'iogon': "\u012F",
    'Iogon': "\u012E",
    'iopf': "\uD835\uDD5A",
    'Iopf': "\uD835\uDD40",
    'iota': "\u03B9",
    'Iota': "\u0399",
    'iprod': "\u2A3C",
    'iquest': '\xBF',
    'iscr': "\uD835\uDCBE",
    'Iscr': "\u2110",
    'isin': "\u2208",
    'isindot': "\u22F5",
    'isinE': "\u22F9",
    'isins': "\u22F4",
    'isinsv': "\u22F3",
    'isinv': "\u2208",
    'it': "\u2062",
    'itilde': "\u0129",
    'Itilde': "\u0128",
    'iukcy': "\u0456",
    'Iukcy': "\u0406",
    'iuml': '\xEF',
    'Iuml': '\xCF',
    'jcirc': "\u0135",
    'Jcirc': "\u0134",
    'jcy': "\u0439",
    'Jcy': "\u0419",
    'jfr': "\uD835\uDD27",
    'Jfr': "\uD835\uDD0D",
    'jmath': "\u0237",
    'jopf': "\uD835\uDD5B",
    'Jopf': "\uD835\uDD41",
    'jscr': "\uD835\uDCBF",
    'Jscr': "\uD835\uDCA5",
    'jsercy': "\u0458",
    'Jsercy': "\u0408",
    'jukcy': "\u0454",
    'Jukcy': "\u0404",
    'kappa': "\u03BA",
    'Kappa': "\u039A",
    'kappav': "\u03F0",
    'kcedil': "\u0137",
    'Kcedil': "\u0136",
    'kcy': "\u043A",
    'Kcy': "\u041A",
    'kfr': "\uD835\uDD28",
    'Kfr': "\uD835\uDD0E",
    'kgreen': "\u0138",
    'khcy': "\u0445",
    'KHcy': "\u0425",
    'kjcy': "\u045C",
    'KJcy': "\u040C",
    'kopf': "\uD835\uDD5C",
    'Kopf': "\uD835\uDD42",
    'kscr': "\uD835\uDCC0",
    'Kscr': "\uD835\uDCA6",
    'lAarr': "\u21DA",
    'lacute': "\u013A",
    'Lacute': "\u0139",
    'laemptyv': "\u29B4",
    'lagran': "\u2112",
    'lambda': "\u03BB",
    'Lambda': "\u039B",
    'lang': "\u27E8",
    'Lang': "\u27EA",
    'langd': "\u2991",
    'langle': "\u27E8",
    'lap': "\u2A85",
    'Laplacetrf': "\u2112",
    'laquo': '\xAB',
    'larr': "\u2190",
    'lArr': "\u21D0",
    'Larr': "\u219E",
    'larrb': "\u21E4",
    'larrbfs': "\u291F",
    'larrfs': "\u291D",
    'larrhk': "\u21A9",
    'larrlp': "\u21AB",
    'larrpl': "\u2939",
    'larrsim': "\u2973",
    'larrtl': "\u21A2",
    'lat': "\u2AAB",
    'latail': "\u2919",
    'lAtail': "\u291B",
    'late': "\u2AAD",
    'lates': "\u2AAD\uFE00",
    'lbarr': "\u290C",
    'lBarr': "\u290E",
    'lbbrk': "\u2772",
    'lbrace': '{',
    'lbrack': '[',
    'lbrke': "\u298B",
    'lbrksld': "\u298F",
    'lbrkslu': "\u298D",
    'lcaron': "\u013E",
    'Lcaron': "\u013D",
    'lcedil': "\u013C",
    'Lcedil': "\u013B",
    'lceil': "\u2308",
    'lcub': '{',
    'lcy': "\u043B",
    'Lcy': "\u041B",
    'ldca': "\u2936",
    'ldquo': "\u201C",
    'ldquor': "\u201E",
    'ldrdhar': "\u2967",
    'ldrushar': "\u294B",
    'ldsh': "\u21B2",
    'le': "\u2264",
    'lE': "\u2266",
    'LeftAngleBracket': "\u27E8",
    'leftarrow': "\u2190",
    'Leftarrow': "\u21D0",
    'LeftArrow': "\u2190",
    'LeftArrowBar': "\u21E4",
    'LeftArrowRightArrow': "\u21C6",
    'leftarrowtail': "\u21A2",
    'LeftCeiling': "\u2308",
    'LeftDoubleBracket': "\u27E6",
    'LeftDownTeeVector': "\u2961",
    'LeftDownVector': "\u21C3",
    'LeftDownVectorBar': "\u2959",
    'LeftFloor': "\u230A",
    'leftharpoondown': "\u21BD",
    'leftharpoonup': "\u21BC",
    'leftleftarrows': "\u21C7",
    'leftrightarrow': "\u2194",
    'Leftrightarrow': "\u21D4",
    'LeftRightArrow': "\u2194",
    'leftrightarrows': "\u21C6",
    'leftrightharpoons': "\u21CB",
    'leftrightsquigarrow': "\u21AD",
    'LeftRightVector': "\u294E",
    'LeftTee': "\u22A3",
    'LeftTeeArrow': "\u21A4",
    'LeftTeeVector': "\u295A",
    'leftthreetimes': "\u22CB",
    'LeftTriangle': "\u22B2",
    'LeftTriangleBar': "\u29CF",
    'LeftTriangleEqual': "\u22B4",
    'LeftUpDownVector': "\u2951",
    'LeftUpTeeVector': "\u2960",
    'LeftUpVector': "\u21BF",
    'LeftUpVectorBar': "\u2958",
    'LeftVector': "\u21BC",
    'LeftVectorBar': "\u2952",
    'leg': "\u22DA",
    'lEg': "\u2A8B",
    'leq': "\u2264",
    'leqq': "\u2266",
    'leqslant': "\u2A7D",
    'les': "\u2A7D",
    'lescc': "\u2AA8",
    'lesdot': "\u2A7F",
    'lesdoto': "\u2A81",
    'lesdotor': "\u2A83",
    'lesg': "\u22DA\uFE00",
    'lesges': "\u2A93",
    'lessapprox': "\u2A85",
    'lessdot': "\u22D6",
    'lesseqgtr': "\u22DA",
    'lesseqqgtr': "\u2A8B",
    'LessEqualGreater': "\u22DA",
    'LessFullEqual': "\u2266",
    'LessGreater': "\u2276",
    'lessgtr': "\u2276",
    'LessLess': "\u2AA1",
    'lesssim': "\u2272",
    'LessSlantEqual': "\u2A7D",
    'LessTilde': "\u2272",
    'lfisht': "\u297C",
    'lfloor': "\u230A",
    'lfr': "\uD835\uDD29",
    'Lfr': "\uD835\uDD0F",
    'lg': "\u2276",
    'lgE': "\u2A91",
    'lHar': "\u2962",
    'lhard': "\u21BD",
    'lharu': "\u21BC",
    'lharul': "\u296A",
    'lhblk': "\u2584",
    'ljcy': "\u0459",
    'LJcy': "\u0409",
    'll': "\u226A",
    'Ll': "\u22D8",
    'llarr': "\u21C7",
    'llcorner': "\u231E",
    'Lleftarrow': "\u21DA",
    'llhard': "\u296B",
    'lltri': "\u25FA",
    'lmidot': "\u0140",
    'Lmidot': "\u013F",
    'lmoust': "\u23B0",
    'lmoustache': "\u23B0",
    'lnap': "\u2A89",
    'lnapprox': "\u2A89",
    'lne': "\u2A87",
    'lnE': "\u2268",
    'lneq': "\u2A87",
    'lneqq': "\u2268",
    'lnsim': "\u22E6",
    'loang': "\u27EC",
    'loarr': "\u21FD",
    'lobrk': "\u27E6",
    'longleftarrow': "\u27F5",
    'Longleftarrow': "\u27F8",
    'LongLeftArrow': "\u27F5",
    'longleftrightarrow': "\u27F7",
    'Longleftrightarrow': "\u27FA",
    'LongLeftRightArrow': "\u27F7",
    'longmapsto': "\u27FC",
    'longrightarrow': "\u27F6",
    'Longrightarrow': "\u27F9",
    'LongRightArrow': "\u27F6",
    'looparrowleft': "\u21AB",
    'looparrowright': "\u21AC",
    'lopar': "\u2985",
    'lopf': "\uD835\uDD5D",
    'Lopf': "\uD835\uDD43",
    'loplus': "\u2A2D",
    'lotimes': "\u2A34",
    'lowast': "\u2217",
    'lowbar': '_',
    'LowerLeftArrow': "\u2199",
    'LowerRightArrow': "\u2198",
    'loz': "\u25CA",
    'lozenge': "\u25CA",
    'lozf': "\u29EB",
    'lpar': '(',
    'lparlt': "\u2993",
    'lrarr': "\u21C6",
    'lrcorner': "\u231F",
    'lrhar': "\u21CB",
    'lrhard': "\u296D",
    'lrm': "\u200E",
    'lrtri': "\u22BF",
    'lsaquo': "\u2039",
    'lscr': "\uD835\uDCC1",
    'Lscr': "\u2112",
    'lsh': "\u21B0",
    'Lsh': "\u21B0",
    'lsim': "\u2272",
    'lsime': "\u2A8D",
    'lsimg': "\u2A8F",
    'lsqb': '[',
    'lsquo': "\u2018",
    'lsquor': "\u201A",
    'lstrok': "\u0142",
    'Lstrok': "\u0141",
    'lt': '<',
    'Lt': "\u226A",
    'LT': '<',
    'ltcc': "\u2AA6",
    'ltcir': "\u2A79",
    'ltdot': "\u22D6",
    'lthree': "\u22CB",
    'ltimes': "\u22C9",
    'ltlarr': "\u2976",
    'ltquest': "\u2A7B",
    'ltri': "\u25C3",
    'ltrie': "\u22B4",
    'ltrif': "\u25C2",
    'ltrPar': "\u2996",
    'lurdshar': "\u294A",
    'luruhar': "\u2966",
    'lvertneqq': "\u2268\uFE00",
    'lvnE': "\u2268\uFE00",
    'macr': '\xAF',
    'male': "\u2642",
    'malt': "\u2720",
    'maltese': "\u2720",
    'map': "\u21A6",
    'Map': "\u2905",
    'mapsto': "\u21A6",
    'mapstodown': "\u21A7",
    'mapstoleft': "\u21A4",
    'mapstoup': "\u21A5",
    'marker': "\u25AE",
    'mcomma': "\u2A29",
    'mcy': "\u043C",
    'Mcy': "\u041C",
    'mdash': "\u2014",
    'mDDot': "\u223A",
    'measuredangle': "\u2221",
    'MediumSpace': "\u205F",
    'Mellintrf': "\u2133",
    'mfr': "\uD835\uDD2A",
    'Mfr': "\uD835\uDD10",
    'mho': "\u2127",
    'micro': '\xB5',
    'mid': "\u2223",
    'midast': '*',
    'midcir': "\u2AF0",
    'middot': '\xB7',
    'minus': "\u2212",
    'minusb': "\u229F",
    'minusd': "\u2238",
    'minusdu': "\u2A2A",
    'MinusPlus': "\u2213",
    'mlcp': "\u2ADB",
    'mldr': "\u2026",
    'mnplus': "\u2213",
    'models': "\u22A7",
    'mopf': "\uD835\uDD5E",
    'Mopf': "\uD835\uDD44",
    'mp': "\u2213",
    'mscr': "\uD835\uDCC2",
    'Mscr': "\u2133",
    'mstpos': "\u223E",
    'mu': "\u03BC",
    'Mu': "\u039C",
    'multimap': "\u22B8",
    'mumap': "\u22B8",
    'nabla': "\u2207",
    'nacute': "\u0144",
    'Nacute': "\u0143",
    'nang': "\u2220\u20D2",
    'nap': "\u2249",
    'napE': "\u2A70\u0338",
    'napid': "\u224B\u0338",
    'napos': "\u0149",
    'napprox': "\u2249",
    'natur': "\u266E",
    'natural': "\u266E",
    'naturals': "\u2115",
    'nbsp': '\xA0',
    'nbump': "\u224E\u0338",
    'nbumpe': "\u224F\u0338",
    'ncap': "\u2A43",
    'ncaron': "\u0148",
    'Ncaron': "\u0147",
    'ncedil': "\u0146",
    'Ncedil': "\u0145",
    'ncong': "\u2247",
    'ncongdot': "\u2A6D\u0338",
    'ncup': "\u2A42",
    'ncy': "\u043D",
    'Ncy': "\u041D",
    'ndash': "\u2013",
    'ne': "\u2260",
    'nearhk': "\u2924",
    'nearr': "\u2197",
    'neArr': "\u21D7",
    'nearrow': "\u2197",
    'nedot': "\u2250\u0338",
    'NegativeMediumSpace': "\u200B",
    'NegativeThickSpace': "\u200B",
    'NegativeThinSpace': "\u200B",
    'NegativeVeryThinSpace': "\u200B",
    'nequiv': "\u2262",
    'nesear': "\u2928",
    'nesim': "\u2242\u0338",
    'NestedGreaterGreater': "\u226B",
    'NestedLessLess': "\u226A",
    'NewLine': '\n',
    'nexist': "\u2204",
    'nexists': "\u2204",
    'nfr': "\uD835\uDD2B",
    'Nfr': "\uD835\uDD11",
    'nge': "\u2271",
    'ngE': "\u2267\u0338",
    'ngeq': "\u2271",
    'ngeqq': "\u2267\u0338",
    'ngeqslant': "\u2A7E\u0338",
    'nges': "\u2A7E\u0338",
    'nGg': "\u22D9\u0338",
    'ngsim': "\u2275",
    'ngt': "\u226F",
    'nGt': "\u226B\u20D2",
    'ngtr': "\u226F",
    'nGtv': "\u226B\u0338",
    'nharr': "\u21AE",
    'nhArr': "\u21CE",
    'nhpar': "\u2AF2",
    'ni': "\u220B",
    'nis': "\u22FC",
    'nisd': "\u22FA",
    'niv': "\u220B",
    'njcy': "\u045A",
    'NJcy': "\u040A",
    'nlarr': "\u219A",
    'nlArr': "\u21CD",
    'nldr': "\u2025",
    'nle': "\u2270",
    'nlE': "\u2266\u0338",
    'nleftarrow': "\u219A",
    'nLeftarrow': "\u21CD",
    'nleftrightarrow': "\u21AE",
    'nLeftrightarrow': "\u21CE",
    'nleq': "\u2270",
    'nleqq': "\u2266\u0338",
    'nleqslant': "\u2A7D\u0338",
    'nles': "\u2A7D\u0338",
    'nless': "\u226E",
    'nLl': "\u22D8\u0338",
    'nlsim': "\u2274",
    'nlt': "\u226E",
    'nLt': "\u226A\u20D2",
    'nltri': "\u22EA",
    'nltrie': "\u22EC",
    'nLtv': "\u226A\u0338",
    'nmid': "\u2224",
    'NoBreak': "\u2060",
    'NonBreakingSpace': '\xA0',
    'nopf': "\uD835\uDD5F",
    'Nopf': "\u2115",
    'not': '\xAC',
    'Not': "\u2AEC",
    'NotCongruent': "\u2262",
    'NotCupCap': "\u226D",
    'NotDoubleVerticalBar': "\u2226",
    'NotElement': "\u2209",
    'NotEqual': "\u2260",
    'NotEqualTilde': "\u2242\u0338",
    'NotExists': "\u2204",
    'NotGreater': "\u226F",
    'NotGreaterEqual': "\u2271",
    'NotGreaterFullEqual': "\u2267\u0338",
    'NotGreaterGreater': "\u226B\u0338",
    'NotGreaterLess': "\u2279",
    'NotGreaterSlantEqual': "\u2A7E\u0338",
    'NotGreaterTilde': "\u2275",
    'NotHumpDownHump': "\u224E\u0338",
    'NotHumpEqual': "\u224F\u0338",
    'notin': "\u2209",
    'notindot': "\u22F5\u0338",
    'notinE': "\u22F9\u0338",
    'notinva': "\u2209",
    'notinvb': "\u22F7",
    'notinvc': "\u22F6",
    'NotLeftTriangle': "\u22EA",
    'NotLeftTriangleBar': "\u29CF\u0338",
    'NotLeftTriangleEqual': "\u22EC",
    'NotLess': "\u226E",
    'NotLessEqual': "\u2270",
    'NotLessGreater': "\u2278",
    'NotLessLess': "\u226A\u0338",
    'NotLessSlantEqual': "\u2A7D\u0338",
    'NotLessTilde': "\u2274",
    'NotNestedGreaterGreater': "\u2AA2\u0338",
    'NotNestedLessLess': "\u2AA1\u0338",
    'notni': "\u220C",
    'notniva': "\u220C",
    'notnivb': "\u22FE",
    'notnivc': "\u22FD",
    'NotPrecedes': "\u2280",
    'NotPrecedesEqual': "\u2AAF\u0338",
    'NotPrecedesSlantEqual': "\u22E0",
    'NotReverseElement': "\u220C",
    'NotRightTriangle': "\u22EB",
    'NotRightTriangleBar': "\u29D0\u0338",
    'NotRightTriangleEqual': "\u22ED",
    'NotSquareSubset': "\u228F\u0338",
    'NotSquareSubsetEqual': "\u22E2",
    'NotSquareSuperset': "\u2290\u0338",
    'NotSquareSupersetEqual': "\u22E3",
    'NotSubset': "\u2282\u20D2",
    'NotSubsetEqual': "\u2288",
    'NotSucceeds': "\u2281",
    'NotSucceedsEqual': "\u2AB0\u0338",
    'NotSucceedsSlantEqual': "\u22E1",
    'NotSucceedsTilde': "\u227F\u0338",
    'NotSuperset': "\u2283\u20D2",
    'NotSupersetEqual': "\u2289",
    'NotTilde': "\u2241",
    'NotTildeEqual': "\u2244",
    'NotTildeFullEqual': "\u2247",
    'NotTildeTilde': "\u2249",
    'NotVerticalBar': "\u2224",
    'npar': "\u2226",
    'nparallel': "\u2226",
    'nparsl': "\u2AFD\u20E5",
    'npart': "\u2202\u0338",
    'npolint': "\u2A14",
    'npr': "\u2280",
    'nprcue': "\u22E0",
    'npre': "\u2AAF\u0338",
    'nprec': "\u2280",
    'npreceq': "\u2AAF\u0338",
    'nrarr': "\u219B",
    'nrArr': "\u21CF",
    'nrarrc': "\u2933\u0338",
    'nrarrw': "\u219D\u0338",
    'nrightarrow': "\u219B",
    'nRightarrow': "\u21CF",
    'nrtri': "\u22EB",
    'nrtrie': "\u22ED",
    'nsc': "\u2281",
    'nsccue': "\u22E1",
    'nsce': "\u2AB0\u0338",
    'nscr': "\uD835\uDCC3",
    'Nscr': "\uD835\uDCA9",
    'nshortmid': "\u2224",
    'nshortparallel': "\u2226",
    'nsim': "\u2241",
    'nsime': "\u2244",
    'nsimeq': "\u2244",
    'nsmid': "\u2224",
    'nspar': "\u2226",
    'nsqsube': "\u22E2",
    'nsqsupe': "\u22E3",
    'nsub': "\u2284",
    'nsube': "\u2288",
    'nsubE': "\u2AC5\u0338",
    'nsubset': "\u2282\u20D2",
    'nsubseteq': "\u2288",
    'nsubseteqq': "\u2AC5\u0338",
    'nsucc': "\u2281",
    'nsucceq': "\u2AB0\u0338",
    'nsup': "\u2285",
    'nsupe': "\u2289",
    'nsupE': "\u2AC6\u0338",
    'nsupset': "\u2283\u20D2",
    'nsupseteq': "\u2289",
    'nsupseteqq': "\u2AC6\u0338",
    'ntgl': "\u2279",
    'ntilde': '\xF1',
    'Ntilde': '\xD1',
    'ntlg': "\u2278",
    'ntriangleleft': "\u22EA",
    'ntrianglelefteq': "\u22EC",
    'ntriangleright': "\u22EB",
    'ntrianglerighteq': "\u22ED",
    'nu': "\u03BD",
    'Nu': "\u039D",
    'num': '#',
    'numero': "\u2116",
    'numsp': "\u2007",
    'nvap': "\u224D\u20D2",
    'nvdash': "\u22AC",
    'nvDash': "\u22AD",
    'nVdash': "\u22AE",
    'nVDash': "\u22AF",
    'nvge': "\u2265\u20D2",
    'nvgt': ">\u20D2",
    'nvHarr': "\u2904",
    'nvinfin': "\u29DE",
    'nvlArr': "\u2902",
    'nvle': "\u2264\u20D2",
    'nvlt': "<\u20D2",
    'nvltrie': "\u22B4\u20D2",
    'nvrArr': "\u2903",
    'nvrtrie': "\u22B5\u20D2",
    'nvsim': "\u223C\u20D2",
    'nwarhk': "\u2923",
    'nwarr': "\u2196",
    'nwArr': "\u21D6",
    'nwarrow': "\u2196",
    'nwnear': "\u2927",
    'oacute': '\xF3',
    'Oacute': '\xD3',
    'oast': "\u229B",
    'ocir': "\u229A",
    'ocirc': '\xF4',
    'Ocirc': '\xD4',
    'ocy': "\u043E",
    'Ocy': "\u041E",
    'odash': "\u229D",
    'odblac': "\u0151",
    'Odblac': "\u0150",
    'odiv': "\u2A38",
    'odot': "\u2299",
    'odsold': "\u29BC",
    'oelig': "\u0153",
    'OElig': "\u0152",
    'ofcir': "\u29BF",
    'ofr': "\uD835\uDD2C",
    'Ofr': "\uD835\uDD12",
    'ogon': "\u02DB",
    'ograve': '\xF2',
    'Ograve': '\xD2',
    'ogt': "\u29C1",
    'ohbar': "\u29B5",
    'ohm': "\u03A9",
    'oint': "\u222E",
    'olarr': "\u21BA",
    'olcir': "\u29BE",
    'olcross': "\u29BB",
    'oline': "\u203E",
    'olt': "\u29C0",
    'omacr': "\u014D",
    'Omacr': "\u014C",
    'omega': "\u03C9",
    'Omega': "\u03A9",
    'omicron': "\u03BF",
    'Omicron': "\u039F",
    'omid': "\u29B6",
    'ominus': "\u2296",
    'oopf': "\uD835\uDD60",
    'Oopf': "\uD835\uDD46",
    'opar': "\u29B7",
    'OpenCurlyDoubleQuote': "\u201C",
    'OpenCurlyQuote': "\u2018",
    'operp': "\u29B9",
    'oplus': "\u2295",
    'or': "\u2228",
    'Or': "\u2A54",
    'orarr': "\u21BB",
    'ord': "\u2A5D",
    'order': "\u2134",
    'orderof': "\u2134",
    'ordf': '\xAA',
    'ordm': '\xBA',
    'origof': "\u22B6",
    'oror': "\u2A56",
    'orslope': "\u2A57",
    'orv': "\u2A5B",
    'oS': "\u24C8",
    'oscr': "\u2134",
    'Oscr': "\uD835\uDCAA",
    'oslash': '\xF8',
    'Oslash': '\xD8',
    'osol': "\u2298",
    'otilde': '\xF5',
    'Otilde': '\xD5',
    'otimes': "\u2297",
    'Otimes': "\u2A37",
    'otimesas': "\u2A36",
    'ouml': '\xF6',
    'Ouml': '\xD6',
    'ovbar': "\u233D",
    'OverBar': "\u203E",
    'OverBrace': "\u23DE",
    'OverBracket': "\u23B4",
    'OverParenthesis': "\u23DC",
    'par': "\u2225",
    'para': '\xB6',
    'parallel': "\u2225",
    'parsim': "\u2AF3",
    'parsl': "\u2AFD",
    'part': "\u2202",
    'PartialD': "\u2202",
    'pcy': "\u043F",
    'Pcy': "\u041F",
    'percnt': '%',
    'period': '.',
    'permil': "\u2030",
    'perp': "\u22A5",
    'pertenk': "\u2031",
    'pfr': "\uD835\uDD2D",
    'Pfr': "\uD835\uDD13",
    'phi': "\u03C6",
    'Phi': "\u03A6",
    'phiv': "\u03D5",
    'phmmat': "\u2133",
    'phone': "\u260E",
    'pi': "\u03C0",
    'Pi': "\u03A0",
    'pitchfork': "\u22D4",
    'piv': "\u03D6",
    'planck': "\u210F",
    'planckh': "\u210E",
    'plankv': "\u210F",
    'plus': '+',
    'plusacir': "\u2A23",
    'plusb': "\u229E",
    'pluscir': "\u2A22",
    'plusdo': "\u2214",
    'plusdu': "\u2A25",
    'pluse': "\u2A72",
    'PlusMinus': '\xB1',
    'plusmn': '\xB1',
    'plussim': "\u2A26",
    'plustwo': "\u2A27",
    'pm': '\xB1',
    'Poincareplane': "\u210C",
    'pointint': "\u2A15",
    'popf': "\uD835\uDD61",
    'Popf': "\u2119",
    'pound': '\xA3',
    'pr': "\u227A",
    'Pr': "\u2ABB",
    'prap': "\u2AB7",
    'prcue': "\u227C",
    'pre': "\u2AAF",
    'prE': "\u2AB3",
    'prec': "\u227A",
    'precapprox': "\u2AB7",
    'preccurlyeq': "\u227C",
    'Precedes': "\u227A",
    'PrecedesEqual': "\u2AAF",
    'PrecedesSlantEqual': "\u227C",
    'PrecedesTilde': "\u227E",
    'preceq': "\u2AAF",
    'precnapprox': "\u2AB9",
    'precneqq': "\u2AB5",
    'precnsim': "\u22E8",
    'precsim': "\u227E",
    'prime': "\u2032",
    'Prime': "\u2033",
    'primes': "\u2119",
    'prnap': "\u2AB9",
    'prnE': "\u2AB5",
    'prnsim': "\u22E8",
    'prod': "\u220F",
    'Product': "\u220F",
    'profalar': "\u232E",
    'profline': "\u2312",
    'profsurf': "\u2313",
    'prop': "\u221D",
    'Proportion': "\u2237",
    'Proportional': "\u221D",
    'propto': "\u221D",
    'prsim': "\u227E",
    'prurel': "\u22B0",
    'pscr': "\uD835\uDCC5",
    'Pscr': "\uD835\uDCAB",
    'psi': "\u03C8",
    'Psi': "\u03A8",
    'puncsp': "\u2008",
    'qfr': "\uD835\uDD2E",
    'Qfr': "\uD835\uDD14",
    'qint': "\u2A0C",
    'qopf': "\uD835\uDD62",
    'Qopf': "\u211A",
    'qprime': "\u2057",
    'qscr': "\uD835\uDCC6",
    'Qscr': "\uD835\uDCAC",
    'quaternions': "\u210D",
    'quatint': "\u2A16",
    'quest': '?',
    'questeq': "\u225F",
    'quot': '"',
    'QUOT': '"',
    'rAarr': "\u21DB",
    'race': "\u223D\u0331",
    'racute': "\u0155",
    'Racute': "\u0154",
    'radic': "\u221A",
    'raemptyv': "\u29B3",
    'rang': "\u27E9",
    'Rang': "\u27EB",
    'rangd': "\u2992",
    'range': "\u29A5",
    'rangle': "\u27E9",
    'raquo': '\xBB',
    'rarr': "\u2192",
    'rArr': "\u21D2",
    'Rarr': "\u21A0",
    'rarrap': "\u2975",
    'rarrb': "\u21E5",
    'rarrbfs': "\u2920",
    'rarrc': "\u2933",
    'rarrfs': "\u291E",
    'rarrhk': "\u21AA",
    'rarrlp': "\u21AC",
    'rarrpl': "\u2945",
    'rarrsim': "\u2974",
    'rarrtl': "\u21A3",
    'Rarrtl': "\u2916",
    'rarrw': "\u219D",
    'ratail': "\u291A",
    'rAtail': "\u291C",
    'ratio': "\u2236",
    'rationals': "\u211A",
    'rbarr': "\u290D",
    'rBarr': "\u290F",
    'RBarr': "\u2910",
    'rbbrk': "\u2773",
    'rbrace': '}',
    'rbrack': ']',
    'rbrke': "\u298C",
    'rbrksld': "\u298E",
    'rbrkslu': "\u2990",
    'rcaron': "\u0159",
    'Rcaron': "\u0158",
    'rcedil': "\u0157",
    'Rcedil': "\u0156",
    'rceil': "\u2309",
    'rcub': '}',
    'rcy': "\u0440",
    'Rcy': "\u0420",
    'rdca': "\u2937",
    'rdldhar': "\u2969",
    'rdquo': "\u201D",
    'rdquor': "\u201D",
    'rdsh': "\u21B3",
    'Re': "\u211C",
    'real': "\u211C",
    'realine': "\u211B",
    'realpart': "\u211C",
    'reals': "\u211D",
    'rect': "\u25AD",
    'reg': '\xAE',
    'REG': '\xAE',
    'ReverseElement': "\u220B",
    'ReverseEquilibrium': "\u21CB",
    'ReverseUpEquilibrium': "\u296F",
    'rfisht': "\u297D",
    'rfloor': "\u230B",
    'rfr': "\uD835\uDD2F",
    'Rfr': "\u211C",
    'rHar': "\u2964",
    'rhard': "\u21C1",
    'rharu': "\u21C0",
    'rharul': "\u296C",
    'rho': "\u03C1",
    'Rho': "\u03A1",
    'rhov': "\u03F1",
    'RightAngleBracket': "\u27E9",
    'rightarrow': "\u2192",
    'Rightarrow': "\u21D2",
    'RightArrow': "\u2192",
    'RightArrowBar': "\u21E5",
    'RightArrowLeftArrow': "\u21C4",
    'rightarrowtail': "\u21A3",
    'RightCeiling': "\u2309",
    'RightDoubleBracket': "\u27E7",
    'RightDownTeeVector': "\u295D",
    'RightDownVector': "\u21C2",
    'RightDownVectorBar': "\u2955",
    'RightFloor': "\u230B",
    'rightharpoondown': "\u21C1",
    'rightharpoonup': "\u21C0",
    'rightleftarrows': "\u21C4",
    'rightleftharpoons': "\u21CC",
    'rightrightarrows': "\u21C9",
    'rightsquigarrow': "\u219D",
    'RightTee': "\u22A2",
    'RightTeeArrow': "\u21A6",
    'RightTeeVector': "\u295B",
    'rightthreetimes': "\u22CC",
    'RightTriangle': "\u22B3",
    'RightTriangleBar': "\u29D0",
    'RightTriangleEqual': "\u22B5",
    'RightUpDownVector': "\u294F",
    'RightUpTeeVector': "\u295C",
    'RightUpVector': "\u21BE",
    'RightUpVectorBar': "\u2954",
    'RightVector': "\u21C0",
    'RightVectorBar': "\u2953",
    'ring': "\u02DA",
    'risingdotseq': "\u2253",
    'rlarr': "\u21C4",
    'rlhar': "\u21CC",
    'rlm': "\u200F",
    'rmoust': "\u23B1",
    'rmoustache': "\u23B1",
    'rnmid': "\u2AEE",
    'roang': "\u27ED",
    'roarr': "\u21FE",
    'robrk': "\u27E7",
    'ropar': "\u2986",
    'ropf': "\uD835\uDD63",
    'Ropf': "\u211D",
    'roplus': "\u2A2E",
    'rotimes': "\u2A35",
    'RoundImplies': "\u2970",
    'rpar': ')',
    'rpargt': "\u2994",
    'rppolint': "\u2A12",
    'rrarr': "\u21C9",
    'Rrightarrow': "\u21DB",
    'rsaquo': "\u203A",
    'rscr': "\uD835\uDCC7",
    'Rscr': "\u211B",
    'rsh': "\u21B1",
    'Rsh': "\u21B1",
    'rsqb': ']',
    'rsquo': "\u2019",
    'rsquor': "\u2019",
    'rthree': "\u22CC",
    'rtimes': "\u22CA",
    'rtri': "\u25B9",
    'rtrie': "\u22B5",
    'rtrif': "\u25B8",
    'rtriltri': "\u29CE",
    'RuleDelayed': "\u29F4",
    'ruluhar': "\u2968",
    'rx': "\u211E",
    'sacute': "\u015B",
    'Sacute': "\u015A",
    'sbquo': "\u201A",
    'sc': "\u227B",
    'Sc': "\u2ABC",
    'scap': "\u2AB8",
    'scaron': "\u0161",
    'Scaron': "\u0160",
    'sccue': "\u227D",
    'sce': "\u2AB0",
    'scE': "\u2AB4",
    'scedil': "\u015F",
    'Scedil': "\u015E",
    'scirc': "\u015D",
    'Scirc': "\u015C",
    'scnap': "\u2ABA",
    'scnE': "\u2AB6",
    'scnsim': "\u22E9",
    'scpolint': "\u2A13",
    'scsim': "\u227F",
    'scy': "\u0441",
    'Scy': "\u0421",
    'sdot': "\u22C5",
    'sdotb': "\u22A1",
    'sdote': "\u2A66",
    'searhk': "\u2925",
    'searr': "\u2198",
    'seArr': "\u21D8",
    'searrow': "\u2198",
    'sect': '\xA7',
    'semi': ';',
    'seswar': "\u2929",
    'setminus': "\u2216",
    'setmn': "\u2216",
    'sext': "\u2736",
    'sfr': "\uD835\uDD30",
    'Sfr': "\uD835\uDD16",
    'sfrown': "\u2322",
    'sharp': "\u266F",
    'shchcy': "\u0449",
    'SHCHcy': "\u0429",
    'shcy': "\u0448",
    'SHcy': "\u0428",
    'ShortDownArrow': "\u2193",
    'ShortLeftArrow': "\u2190",
    'shortmid': "\u2223",
    'shortparallel': "\u2225",
    'ShortRightArrow': "\u2192",
    'ShortUpArrow': "\u2191",
    'shy': '\xAD',
    'sigma': "\u03C3",
    'Sigma': "\u03A3",
    'sigmaf': "\u03C2",
    'sigmav': "\u03C2",
    'sim': "\u223C",
    'simdot': "\u2A6A",
    'sime': "\u2243",
    'simeq': "\u2243",
    'simg': "\u2A9E",
    'simgE': "\u2AA0",
    'siml': "\u2A9D",
    'simlE': "\u2A9F",
    'simne': "\u2246",
    'simplus': "\u2A24",
    'simrarr': "\u2972",
    'slarr': "\u2190",
    'SmallCircle': "\u2218",
    'smallsetminus': "\u2216",
    'smashp': "\u2A33",
    'smeparsl': "\u29E4",
    'smid': "\u2223",
    'smile': "\u2323",
    'smt': "\u2AAA",
    'smte': "\u2AAC",
    'smtes': "\u2AAC\uFE00",
    'softcy': "\u044C",
    'SOFTcy': "\u042C",
    'sol': '/',
    'solb': "\u29C4",
    'solbar': "\u233F",
    'sopf': "\uD835\uDD64",
    'Sopf': "\uD835\uDD4A",
    'spades': "\u2660",
    'spadesuit': "\u2660",
    'spar': "\u2225",
    'sqcap': "\u2293",
    'sqcaps': "\u2293\uFE00",
    'sqcup': "\u2294",
    'sqcups': "\u2294\uFE00",
    'Sqrt': "\u221A",
    'sqsub': "\u228F",
    'sqsube': "\u2291",
    'sqsubset': "\u228F",
    'sqsubseteq': "\u2291",
    'sqsup': "\u2290",
    'sqsupe': "\u2292",
    'sqsupset': "\u2290",
    'sqsupseteq': "\u2292",
    'squ': "\u25A1",
    'square': "\u25A1",
    'Square': "\u25A1",
    'SquareIntersection': "\u2293",
    'SquareSubset': "\u228F",
    'SquareSubsetEqual': "\u2291",
    'SquareSuperset': "\u2290",
    'SquareSupersetEqual': "\u2292",
    'SquareUnion': "\u2294",
    'squarf': "\u25AA",
    'squf': "\u25AA",
    'srarr': "\u2192",
    'sscr': "\uD835\uDCC8",
    'Sscr': "\uD835\uDCAE",
    'ssetmn': "\u2216",
    'ssmile': "\u2323",
    'sstarf': "\u22C6",
    'star': "\u2606",
    'Star': "\u22C6",
    'starf': "\u2605",
    'straightepsilon': "\u03F5",
    'straightphi': "\u03D5",
    'strns': '\xAF',
    'sub': "\u2282",
    'Sub': "\u22D0",
    'subdot': "\u2ABD",
    'sube': "\u2286",
    'subE': "\u2AC5",
    'subedot': "\u2AC3",
    'submult': "\u2AC1",
    'subne': "\u228A",
    'subnE': "\u2ACB",
    'subplus': "\u2ABF",
    'subrarr': "\u2979",
    'subset': "\u2282",
    'Subset': "\u22D0",
    'subseteq': "\u2286",
    'subseteqq': "\u2AC5",
    'SubsetEqual': "\u2286",
    'subsetneq': "\u228A",
    'subsetneqq': "\u2ACB",
    'subsim': "\u2AC7",
    'subsub': "\u2AD5",
    'subsup': "\u2AD3",
    'succ': "\u227B",
    'succapprox': "\u2AB8",
    'succcurlyeq': "\u227D",
    'Succeeds': "\u227B",
    'SucceedsEqual': "\u2AB0",
    'SucceedsSlantEqual': "\u227D",
    'SucceedsTilde': "\u227F",
    'succeq': "\u2AB0",
    'succnapprox': "\u2ABA",
    'succneqq': "\u2AB6",
    'succnsim': "\u22E9",
    'succsim': "\u227F",
    'SuchThat': "\u220B",
    'sum': "\u2211",
    'Sum': "\u2211",
    'sung': "\u266A",
    'sup': "\u2283",
    'Sup': "\u22D1",
    'sup1': '\xB9',
    'sup2': '\xB2',
    'sup3': '\xB3',
    'supdot': "\u2ABE",
    'supdsub': "\u2AD8",
    'supe': "\u2287",
    'supE': "\u2AC6",
    'supedot': "\u2AC4",
    'Superset': "\u2283",
    'SupersetEqual': "\u2287",
    'suphsol': "\u27C9",
    'suphsub': "\u2AD7",
    'suplarr': "\u297B",
    'supmult': "\u2AC2",
    'supne': "\u228B",
    'supnE': "\u2ACC",
    'supplus': "\u2AC0",
    'supset': "\u2283",
    'Supset': "\u22D1",
    'supseteq': "\u2287",
    'supseteqq': "\u2AC6",
    'supsetneq': "\u228B",
    'supsetneqq': "\u2ACC",
    'supsim': "\u2AC8",
    'supsub': "\u2AD4",
    'supsup': "\u2AD6",
    'swarhk': "\u2926",
    'swarr': "\u2199",
    'swArr': "\u21D9",
    'swarrow': "\u2199",
    'swnwar': "\u292A",
    'szlig': '\xDF',
    'Tab': '\t',
    'target': "\u2316",
    'tau': "\u03C4",
    'Tau': "\u03A4",
    'tbrk': "\u23B4",
    'tcaron': "\u0165",
    'Tcaron': "\u0164",
    'tcedil': "\u0163",
    'Tcedil': "\u0162",
    'tcy': "\u0442",
    'Tcy': "\u0422",
    'tdot': "\u20DB",
    'telrec': "\u2315",
    'tfr': "\uD835\uDD31",
    'Tfr': "\uD835\uDD17",
    'there4': "\u2234",
    'therefore': "\u2234",
    'Therefore': "\u2234",
    'theta': "\u03B8",
    'Theta': "\u0398",
    'thetasym': "\u03D1",
    'thetav': "\u03D1",
    'thickapprox': "\u2248",
    'thicksim': "\u223C",
    'ThickSpace': "\u205F\u200A",
    'thinsp': "\u2009",
    'ThinSpace': "\u2009",
    'thkap': "\u2248",
    'thksim': "\u223C",
    'thorn': '\xFE',
    'THORN': '\xDE',
    'tilde': "\u02DC",
    'Tilde': "\u223C",
    'TildeEqual': "\u2243",
    'TildeFullEqual': "\u2245",
    'TildeTilde': "\u2248",
    'times': '\xD7',
    'timesb': "\u22A0",
    'timesbar': "\u2A31",
    'timesd': "\u2A30",
    'tint': "\u222D",
    'toea': "\u2928",
    'top': "\u22A4",
    'topbot': "\u2336",
    'topcir': "\u2AF1",
    'topf': "\uD835\uDD65",
    'Topf': "\uD835\uDD4B",
    'topfork': "\u2ADA",
    'tosa': "\u2929",
    'tprime': "\u2034",
    'trade': "\u2122",
    'TRADE': "\u2122",
    'triangle': "\u25B5",
    'triangledown': "\u25BF",
    'triangleleft': "\u25C3",
    'trianglelefteq': "\u22B4",
    'triangleq': "\u225C",
    'triangleright': "\u25B9",
    'trianglerighteq': "\u22B5",
    'tridot': "\u25EC",
    'trie': "\u225C",
    'triminus': "\u2A3A",
    'TripleDot': "\u20DB",
    'triplus': "\u2A39",
    'trisb': "\u29CD",
    'tritime': "\u2A3B",
    'trpezium': "\u23E2",
    'tscr': "\uD835\uDCC9",
    'Tscr': "\uD835\uDCAF",
    'tscy': "\u0446",
    'TScy': "\u0426",
    'tshcy': "\u045B",
    'TSHcy': "\u040B",
    'tstrok': "\u0167",
    'Tstrok': "\u0166",
    'twixt': "\u226C",
    'twoheadleftarrow': "\u219E",
    'twoheadrightarrow': "\u21A0",
    'uacute': '\xFA',
    'Uacute': '\xDA',
    'uarr': "\u2191",
    'uArr': "\u21D1",
    'Uarr': "\u219F",
    'Uarrocir': "\u2949",
    'ubrcy': "\u045E",
    'Ubrcy': "\u040E",
    'ubreve': "\u016D",
    'Ubreve': "\u016C",
    'ucirc': '\xFB',
    'Ucirc': '\xDB',
    'ucy': "\u0443",
    'Ucy': "\u0423",
    'udarr': "\u21C5",
    'udblac': "\u0171",
    'Udblac': "\u0170",
    'udhar': "\u296E",
    'ufisht': "\u297E",
    'ufr': "\uD835\uDD32",
    'Ufr': "\uD835\uDD18",
    'ugrave': '\xF9',
    'Ugrave': '\xD9',
    'uHar': "\u2963",
    'uharl': "\u21BF",
    'uharr': "\u21BE",
    'uhblk': "\u2580",
    'ulcorn': "\u231C",
    'ulcorner': "\u231C",
    'ulcrop': "\u230F",
    'ultri': "\u25F8",
    'umacr': "\u016B",
    'Umacr': "\u016A",
    'uml': '\xA8',
    'UnderBar': '_',
    'UnderBrace': "\u23DF",
    'UnderBracket': "\u23B5",
    'UnderParenthesis': "\u23DD",
    'Union': "\u22C3",
    'UnionPlus': "\u228E",
    'uogon': "\u0173",
    'Uogon': "\u0172",
    'uopf': "\uD835\uDD66",
    'Uopf': "\uD835\uDD4C",
    'uparrow': "\u2191",
    'Uparrow': "\u21D1",
    'UpArrow': "\u2191",
    'UpArrowBar': "\u2912",
    'UpArrowDownArrow': "\u21C5",
    'updownarrow': "\u2195",
    'Updownarrow': "\u21D5",
    'UpDownArrow': "\u2195",
    'UpEquilibrium': "\u296E",
    'upharpoonleft': "\u21BF",
    'upharpoonright': "\u21BE",
    'uplus': "\u228E",
    'UpperLeftArrow': "\u2196",
    'UpperRightArrow': "\u2197",
    'upsi': "\u03C5",
    'Upsi': "\u03D2",
    'upsih': "\u03D2",
    'upsilon': "\u03C5",
    'Upsilon': "\u03A5",
    'UpTee': "\u22A5",
    'UpTeeArrow': "\u21A5",
    'upuparrows': "\u21C8",
    'urcorn': "\u231D",
    'urcorner': "\u231D",
    'urcrop': "\u230E",
    'uring': "\u016F",
    'Uring': "\u016E",
    'urtri': "\u25F9",
    'uscr': "\uD835\uDCCA",
    'Uscr': "\uD835\uDCB0",
    'utdot': "\u22F0",
    'utilde': "\u0169",
    'Utilde': "\u0168",
    'utri': "\u25B5",
    'utrif': "\u25B4",
    'uuarr': "\u21C8",
    'uuml': '\xFC',
    'Uuml': '\xDC',
    'uwangle': "\u29A7",
    'vangrt': "\u299C",
    'varepsilon': "\u03F5",
    'varkappa': "\u03F0",
    'varnothing': "\u2205",
    'varphi': "\u03D5",
    'varpi': "\u03D6",
    'varpropto': "\u221D",
    'varr': "\u2195",
    'vArr': "\u21D5",
    'varrho': "\u03F1",
    'varsigma': "\u03C2",
    'varsubsetneq': "\u228A\uFE00",
    'varsubsetneqq': "\u2ACB\uFE00",
    'varsupsetneq': "\u228B\uFE00",
    'varsupsetneqq': "\u2ACC\uFE00",
    'vartheta': "\u03D1",
    'vartriangleleft': "\u22B2",
    'vartriangleright': "\u22B3",
    'vBar': "\u2AE8",
    'Vbar': "\u2AEB",
    'vBarv': "\u2AE9",
    'vcy': "\u0432",
    'Vcy': "\u0412",
    'vdash': "\u22A2",
    'vDash': "\u22A8",
    'Vdash': "\u22A9",
    'VDash': "\u22AB",
    'Vdashl': "\u2AE6",
    'vee': "\u2228",
    'Vee': "\u22C1",
    'veebar': "\u22BB",
    'veeeq': "\u225A",
    'vellip': "\u22EE",
    'verbar': '|',
    'Verbar': "\u2016",
    'vert': '|',
    'Vert': "\u2016",
    'VerticalBar': "\u2223",
    'VerticalLine': '|',
    'VerticalSeparator': "\u2758",
    'VerticalTilde': "\u2240",
    'VeryThinSpace': "\u200A",
    'vfr': "\uD835\uDD33",
    'Vfr': "\uD835\uDD19",
    'vltri': "\u22B2",
    'vnsub': "\u2282\u20D2",
    'vnsup': "\u2283\u20D2",
    'vopf': "\uD835\uDD67",
    'Vopf': "\uD835\uDD4D",
    'vprop': "\u221D",
    'vrtri': "\u22B3",
    'vscr': "\uD835\uDCCB",
    'Vscr': "\uD835\uDCB1",
    'vsubne': "\u228A\uFE00",
    'vsubnE': "\u2ACB\uFE00",
    'vsupne': "\u228B\uFE00",
    'vsupnE': "\u2ACC\uFE00",
    'Vvdash': "\u22AA",
    'vzigzag': "\u299A",
    'wcirc': "\u0175",
    'Wcirc': "\u0174",
    'wedbar': "\u2A5F",
    'wedge': "\u2227",
    'Wedge': "\u22C0",
    'wedgeq': "\u2259",
    'weierp': "\u2118",
    'wfr': "\uD835\uDD34",
    'Wfr': "\uD835\uDD1A",
    'wopf': "\uD835\uDD68",
    'Wopf': "\uD835\uDD4E",
    'wp': "\u2118",
    'wr': "\u2240",
    'wreath': "\u2240",
    'wscr': "\uD835\uDCCC",
    'Wscr': "\uD835\uDCB2",
    'xcap': "\u22C2",
    'xcirc': "\u25EF",
    'xcup': "\u22C3",
    'xdtri': "\u25BD",
    'xfr': "\uD835\uDD35",
    'Xfr': "\uD835\uDD1B",
    'xharr': "\u27F7",
    'xhArr': "\u27FA",
    'xi': "\u03BE",
    'Xi': "\u039E",
    'xlarr': "\u27F5",
    'xlArr': "\u27F8",
    'xmap': "\u27FC",
    'xnis': "\u22FB",
    'xodot': "\u2A00",
    'xopf': "\uD835\uDD69",
    'Xopf': "\uD835\uDD4F",
    'xoplus': "\u2A01",
    'xotime': "\u2A02",
    'xrarr': "\u27F6",
    'xrArr': "\u27F9",
    'xscr': "\uD835\uDCCD",
    'Xscr': "\uD835\uDCB3",
    'xsqcup': "\u2A06",
    'xuplus': "\u2A04",
    'xutri': "\u25B3",
    'xvee': "\u22C1",
    'xwedge': "\u22C0",
    'yacute': '\xFD',
    'Yacute': '\xDD',
    'yacy': "\u044F",
    'YAcy': "\u042F",
    'ycirc': "\u0177",
    'Ycirc': "\u0176",
    'ycy': "\u044B",
    'Ycy': "\u042B",
    'yen': '\xA5',
    'yfr': "\uD835\uDD36",
    'Yfr': "\uD835\uDD1C",
    'yicy': "\u0457",
    'YIcy': "\u0407",
    'yopf': "\uD835\uDD6A",
    'Yopf': "\uD835\uDD50",
    'yscr': "\uD835\uDCCE",
    'Yscr': "\uD835\uDCB4",
    'yucy': "\u044E",
    'YUcy': "\u042E",
    'yuml': '\xFF',
    'Yuml': "\u0178",
    'zacute': "\u017A",
    'Zacute': "\u0179",
    'zcaron': "\u017E",
    'Zcaron': "\u017D",
    'zcy': "\u0437",
    'Zcy': "\u0417",
    'zdot': "\u017C",
    'Zdot': "\u017B",
    'zeetrf': "\u2128",
    'ZeroWidthSpace': "\u200B",
    'zeta': "\u03B6",
    'Zeta': "\u0396",
    'zfr': "\uD835\uDD37",
    'Zfr': "\u2128",
    'zhcy': "\u0436",
    'ZHcy': "\u0416",
    'zigrarr': "\u21DD",
    'zopf': "\uD835\uDD6B",
    'Zopf': "\u2124",
    'zscr': "\uD835\uDCCF",
    'Zscr': "\uD835\uDCB5",
    'zwj': "\u200D",
    'zwnj': "\u200C"
  };
  var decodeMapLegacy = {
    'aacute': '\xE1',
    'Aacute': '\xC1',
    'acirc': '\xE2',
    'Acirc': '\xC2',
    'acute': '\xB4',
    'aelig': '\xE6',
    'AElig': '\xC6',
    'agrave': '\xE0',
    'Agrave': '\xC0',
    'amp': '&',
    'AMP': '&',
    'aring': '\xE5',
    'Aring': '\xC5',
    'atilde': '\xE3',
    'Atilde': '\xC3',
    'auml': '\xE4',
    'Auml': '\xC4',
    'brvbar': '\xA6',
    'ccedil': '\xE7',
    'Ccedil': '\xC7',
    'cedil': '\xB8',
    'cent': '\xA2',
    'copy': '\xA9',
    'COPY': '\xA9',
    'curren': '\xA4',
    'deg': '\xB0',
    'divide': '\xF7',
    'eacute': '\xE9',
    'Eacute': '\xC9',
    'ecirc': '\xEA',
    'Ecirc': '\xCA',
    'egrave': '\xE8',
    'Egrave': '\xC8',
    'eth': '\xF0',
    'ETH': '\xD0',
    'euml': '\xEB',
    'Euml': '\xCB',
    'frac12': '\xBD',
    'frac14': '\xBC',
    'frac34': '\xBE',
    'gt': '>',
    'GT': '>',
    'iacute': '\xED',
    'Iacute': '\xCD',
    'icirc': '\xEE',
    'Icirc': '\xCE',
    'iexcl': '\xA1',
    'igrave': '\xEC',
    'Igrave': '\xCC',
    'iquest': '\xBF',
    'iuml': '\xEF',
    'Iuml': '\xCF',
    'laquo': '\xAB',
    'lt': '<',
    'LT': '<',
    'macr': '\xAF',
    'micro': '\xB5',
    'middot': '\xB7',
    'nbsp': '\xA0',
    'not': '\xAC',
    'ntilde': '\xF1',
    'Ntilde': '\xD1',
    'oacute': '\xF3',
    'Oacute': '\xD3',
    'ocirc': '\xF4',
    'Ocirc': '\xD4',
    'ograve': '\xF2',
    'Ograve': '\xD2',
    'ordf': '\xAA',
    'ordm': '\xBA',
    'oslash': '\xF8',
    'Oslash': '\xD8',
    'otilde': '\xF5',
    'Otilde': '\xD5',
    'ouml': '\xF6',
    'Ouml': '\xD6',
    'para': '\xB6',
    'plusmn': '\xB1',
    'pound': '\xA3',
    'quot': '"',
    'QUOT': '"',
    'raquo': '\xBB',
    'reg': '\xAE',
    'REG': '\xAE',
    'sect': '\xA7',
    'shy': '\xAD',
    'sup1': '\xB9',
    'sup2': '\xB2',
    'sup3': '\xB3',
    'szlig': '\xDF',
    'thorn': '\xFE',
    'THORN': '\xDE',
    'times': '\xD7',
    'uacute': '\xFA',
    'Uacute': '\xDA',
    'ucirc': '\xFB',
    'Ucirc': '\xDB',
    'ugrave': '\xF9',
    'Ugrave': '\xD9',
    'uml': '\xA8',
    'uuml': '\xFC',
    'Uuml': '\xDC',
    'yacute': '\xFD',
    'Yacute': '\xDD',
    'yen': '\xA5',
    'yuml': '\xFF'
  };
  var decodeMapNumeric = {
    '0': "\uFFFD",
    '128': "\u20AC",
    '130': "\u201A",
    '131': "\u0192",
    '132': "\u201E",
    '133': "\u2026",
    '134': "\u2020",
    '135': "\u2021",
    '136': "\u02C6",
    '137': "\u2030",
    '138': "\u0160",
    '139': "\u2039",
    '140': "\u0152",
    '142': "\u017D",
    '145': "\u2018",
    '146': "\u2019",
    '147': "\u201C",
    '148': "\u201D",
    '149': "\u2022",
    '150': "\u2013",
    '151': "\u2014",
    '152': "\u02DC",
    '153': "\u2122",
    '154': "\u0161",
    '155': "\u203A",
    '156': "\u0153",
    '158': "\u017E",
    '159': "\u0178"
  };
  var invalidReferenceCodePoints = [1, 2, 3, 4, 5, 6, 7, 8, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 64976, 64977, 64978, 64979, 64980, 64981, 64982, 64983, 64984, 64985, 64986, 64987, 64988, 64989, 64990, 64991, 64992, 64993, 64994, 64995, 64996, 64997, 64998, 64999, 65000, 65001, 65002, 65003, 65004, 65005, 65006, 65007, 65534, 65535, 131070, 131071, 196606, 196607, 262142, 262143, 327678, 327679, 393214, 393215, 458750, 458751, 524286, 524287, 589822, 589823, 655358, 655359, 720894, 720895, 786430, 786431, 851966, 851967, 917502, 917503, 983038, 983039, 1048574, 1048575, 1114110, 1114111];

  /*--------------------------------------------------------------------------*/

  var stringFromCharCode = String.fromCharCode;
  var object = {};
  var hasOwnProperty = object.hasOwnProperty;
  var has = function has(object, propertyName) {
    return hasOwnProperty.call(object, propertyName);
  };
  var contains = function contains(array, value) {
    var index = -1;
    var length = array.length;
    while (++index < length) {
      if (array[index] == value) {
        return true;
      }
    }
    return false;
  };
  var merge = function merge(options, defaults) {
    if (!options) {
      return defaults;
    }
    var result = {};
    var key;
    for (key in defaults) {
      // A `hasOwnProperty` check is not needed here, since only recognized
      // option names are used anyway. Any others are ignored.
      result[key] = has(options, key) ? options[key] : defaults[key];
    }
    return result;
  };

  // Modified version of `ucs2encode`; see https://mths.be/punycode.
  var codePointToSymbol = function codePointToSymbol(codePoint, strict) {
    var output = '';
    if (codePoint >= 0xD800 && codePoint <= 0xDFFF || codePoint > 0x10FFFF) {
      // See issue #4:
      // “Otherwise, if the number is in the range 0xD800 to 0xDFFF or is
      // greater than 0x10FFFF, then this is a parse error. Return a U+FFFD
      // REPLACEMENT CHARACTER.”
      if (strict) {
        parseError('character reference outside the permissible Unicode range');
      }
      return "\uFFFD";
    }
    if (has(decodeMapNumeric, codePoint)) {
      if (strict) {
        parseError('disallowed character reference');
      }
      return decodeMapNumeric[codePoint];
    }
    if (strict && contains(invalidReferenceCodePoints, codePoint)) {
      parseError('disallowed character reference');
    }
    if (codePoint > 0xFFFF) {
      codePoint -= 0x10000;
      output += stringFromCharCode(codePoint >>> 10 & 0x3FF | 0xD800);
      codePoint = 0xDC00 | codePoint & 0x3FF;
    }
    output += stringFromCharCode(codePoint);
    return output;
  };
  var hexEscape = function hexEscape(codePoint) {
    return '&#x' + codePoint.toString(16).toUpperCase() + ';';
  };
  var decEscape = function decEscape(codePoint) {
    return '&#' + codePoint + ';';
  };
  var parseError = function parseError(message) {
    throw Error('Parse error: ' + message);
  };

  /*--------------------------------------------------------------------------*/

  var _encode = function encode(string, options) {
    options = merge(options, _encode.options);
    var strict = options.strict;
    if (strict && regexInvalidRawCodePoint.test(string)) {
      parseError('forbidden code point');
    }
    var encodeEverything = options.encodeEverything;
    var useNamedReferences = options.useNamedReferences;
    var allowUnsafeSymbols = options.allowUnsafeSymbols;
    var escapeCodePoint = options.decimal ? decEscape : hexEscape;
    var escapeBmpSymbol = function escapeBmpSymbol(symbol) {
      return escapeCodePoint(symbol.charCodeAt(0));
    };
    if (encodeEverything) {
      // Encode ASCII symbols.
      string = string.replace(regexAsciiWhitelist, function (symbol) {
        // Use named references if requested & possible.
        if (useNamedReferences && has(encodeMap, symbol)) {
          return '&' + encodeMap[symbol] + ';';
        }
        return escapeBmpSymbol(symbol);
      });
      // Shorten a few escapes that represent two symbols, of which at least one
      // is within the ASCII range.
      if (useNamedReferences) {
        string = string.replace(/&gt;\u20D2/g, '&nvgt;').replace(/&lt;\u20D2/g, '&nvlt;').replace(/&#x66;&#x6A;/g, '&fjlig;');
      }
      // Encode non-ASCII symbols.
      if (useNamedReferences) {
        // Encode non-ASCII symbols that can be replaced with a named reference.
        string = string.replace(regexEncodeNonAscii, function (string) {
          // Note: there is no need to check `has(encodeMap, string)` here.
          return '&' + encodeMap[string] + ';';
        });
      }
      // Note: any remaining non-ASCII symbols are handled outside of the `if`.
    } else if (useNamedReferences) {
      // Apply named character references.
      // Encode `<>"'&` using named character references.
      if (!allowUnsafeSymbols) {
        string = string.replace(regexEscape, function (string) {
          return '&' + encodeMap[string] + ';'; // no need to check `has()` here
        });
      }
      // Shorten escapes that represent two symbols, of which at least one is
      // `<>"'&`.
      string = string.replace(/&gt;\u20D2/g, '&nvgt;').replace(/&lt;\u20D2/g, '&nvlt;');
      // Encode non-ASCII symbols that can be replaced with a named reference.
      string = string.replace(regexEncodeNonAscii, function (string) {
        // Note: there is no need to check `has(encodeMap, string)` here.
        return '&' + encodeMap[string] + ';';
      });
    } else if (!allowUnsafeSymbols) {
      // Encode `<>"'&` using hexadecimal escapes, now that they’re not handled
      // using named character references.
      string = string.replace(regexEscape, escapeBmpSymbol);
    }
    return string
    // Encode astral symbols.
    .replace(regexAstralSymbols, function ($0) {
      // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
      var high = $0.charCodeAt(0);
      var low = $0.charCodeAt(1);
      var codePoint = (high - 0xD800) * 0x400 + low - 0xDC00 + 0x10000;
      return escapeCodePoint(codePoint);
    })
    // Encode any remaining BMP symbols that are not printable ASCII symbols
    // using a hexadecimal escape.
    .replace(regexBmpWhitelist, escapeBmpSymbol);
  };
  // Expose default options (so they can be overridden globally).
  _encode.options = {
    'allowUnsafeSymbols': false,
    'encodeEverything': false,
    'strict': false,
    'useNamedReferences': false,
    'decimal': false
  };
  var _decode = function decode(html, options) {
    options = merge(options, _decode.options);
    var strict = options.strict;
    if (strict && regexInvalidEntity.test(html)) {
      parseError('malformed character reference');
    }
    return html.replace(regexDecode, function ($0, $1, $2, $3, $4, $5, $6, $7, $8) {
      var codePoint;
      var semicolon;
      var decDigits;
      var hexDigits;
      var reference;
      var next;
      if ($1) {
        reference = $1;
        // Note: there is no need to check `has(decodeMap, reference)`.
        return decodeMap[reference];
      }
      if ($2) {
        // Decode named character references without trailing `;`, e.g. `&amp`.
        // This is only a parse error if it gets converted to `&`, or if it is
        // followed by `=` in an attribute context.
        reference = $2;
        next = $3;
        if (next && options.isAttributeValue) {
          if (strict && next == '=') {
            parseError('`&` did not start a character reference');
          }
          return $0;
        } else {
          if (strict) {
            parseError('named character reference was not terminated by a semicolon');
          }
          // Note: there is no need to check `has(decodeMapLegacy, reference)`.
          return decodeMapLegacy[reference] + (next || '');
        }
      }
      if ($4) {
        // Decode decimal escapes, e.g. `&#119558;`.
        decDigits = $4;
        semicolon = $5;
        if (strict && !semicolon) {
          parseError('character reference was not terminated by a semicolon');
        }
        codePoint = parseInt(decDigits, 10);
        return codePointToSymbol(codePoint, strict);
      }
      if ($6) {
        // Decode hexadecimal escapes, e.g. `&#x1D306;`.
        hexDigits = $6;
        semicolon = $7;
        if (strict && !semicolon) {
          parseError('character reference was not terminated by a semicolon');
        }
        codePoint = parseInt(hexDigits, 16);
        return codePointToSymbol(codePoint, strict);
      }

      // If we’re still here, `if ($7)` is implied; it’s an ambiguous
      // ampersand for sure. https://mths.be/notes/ambiguous-ampersands
      if (strict) {
        parseError('named character reference was not terminated by a semicolon');
      }
      return $0;
    });
  };
  // Expose default options (so they can be overridden globally).
  _decode.options = {
    'isAttributeValue': false,
    'strict': false
  };
  var escape = function escape(string) {
    return string.replace(regexEscape, function ($0) {
      // Note: there is no need to check `has(escapeMap, $0)` here.
      return escapeMap[$0];
    });
  };

  /*--------------------------------------------------------------------------*/

  var he = {
    'version': '1.2.0',
    'encode': _encode,
    'decode': _decode,
    'escape': escape,
    'unescape': _decode
  };

  // Some AMD build optimizers, like r.js, check for specific condition patterns
  // like the following:
  if ( true && _typeof(__webpack_require__.amdO) == 'object' && __webpack_require__.amdO) {
    !(__WEBPACK_AMD_DEFINE_RESULT__ = (function () {
      return he;
    }).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else if (freeExports && !freeExports.nodeType) {
    if (freeModule) {
      // in Node.js, io.js, or RingoJS v0.8.0+
      freeModule.exports = he;
    } else {
      // in Narwhal or RingoJS v0.7.0-
      for (var key in he) {
        has(he, key) && (freeExports[key] = he[key]);
      }
    }
  } else {
    // in Rhino or a web browser
    root.he = he;
  }
})(this);

/***/ }),

/***/ "./node_modules/hot-patcher/source/functions.js":
/*!******************************************************!*\
  !*** ./node_modules/hot-patcher/source/functions.js ***!
  \******************************************************/
/***/ ((module) => {

function sequence() {
  for (var _len = arguments.length, methods = new Array(_len), _key = 0; _key < _len; _key++) {
    methods[_key] = arguments[_key];
  }
  if (methods.length === 0) {
    throw new Error("Failed creating sequence: No functions provided");
  }
  return function __executeSequence() {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }
    var result = args;
    var _this = this;
    while (methods.length > 0) {
      var method = methods.shift();
      result = [method.apply(_this, result)];
    }
    return result[0];
  };
}
module.exports = {
  sequence: sequence
};

/***/ }),

/***/ "./node_modules/hot-patcher/source/index.js":
/*!**************************************************!*\
  !*** ./node_modules/hot-patcher/source/index.js ***!
  \**************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var _require = __webpack_require__(/*! ./functions.js */ "./node_modules/hot-patcher/source/functions.js"),
  sequence = _require.sequence;
var HOT_PATCHER_TYPE = "@@HOTPATCHER";
var NOOP = function NOOP() {};
function createNewItem(method) {
  return {
    original: method,
    methods: [method],
    "final": false
  };
}

/**
 * Hot patching manager class
 */
var HotPatcher = /*#__PURE__*/function () {
  function HotPatcher() {
    _classCallCheck(this, HotPatcher);
    this._configuration = {
      registry: {},
      getEmptyAction: "null"
    };
    this.__type__ = HOT_PATCHER_TYPE;
  }

  /**
   * Configuration object reference
   * @type {Object}
   * @memberof HotPatcher
   * @readonly
   */
  return _createClass(HotPatcher, [{
    key: "configuration",
    get: function get() {
      return this._configuration;
    }

    /**
     * The action to take when a non-set method is requested
     * Possible values: null/throw
     * @type {String}
     * @memberof HotPatcher
     */
  }, {
    key: "getEmptyAction",
    get: function get() {
      return this.configuration.getEmptyAction;
    },
    set: function set(newAction) {
      this.configuration.getEmptyAction = newAction;
    }

    /**
     * Control another hot-patcher instance
     * Force the remote instance to use patched methods from calling instance
     * @param {HotPatcher} target The target instance to control
     * @param {Boolean=} allowTargetOverrides Allow the target to override patched methods on
     * the controller (default is false)
     * @memberof HotPatcher
     * @returns {HotPatcher} Returns self
     * @throws {Error} Throws if the target is invalid
     */
  }, {
    key: "control",
    value: function control(target) {
      var _this = this;
      var allowTargetOverrides = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      if (!target || target.__type__ !== HOT_PATCHER_TYPE) {
        throw new Error("Failed taking control of target HotPatcher instance: Invalid type or object");
      }
      Object.keys(target.configuration.registry).forEach(function (foreignKey) {
        if (_this.configuration.registry.hasOwnProperty(foreignKey)) {
          if (allowTargetOverrides) {
            _this.configuration.registry[foreignKey] = Object.assign({}, target.configuration.registry[foreignKey]);
          }
        } else {
          _this.configuration.registry[foreignKey] = Object.assign({}, target.configuration.registry[foreignKey]);
        }
      });
      target._configuration = this.configuration;
      return this;
    }

    /**
     * Execute a patched method
     * @param {String} key The method key
     * @param {...*} args Arguments to pass to the method (optional)
     * @memberof HotPatcher
     * @see HotPatcher#get
     * @returns {*} The output of the called method
     */
  }, {
    key: "execute",
    value: function execute(key) {
      var method = this.get(key) || NOOP;
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      return method.apply(void 0, args);
    }

    /**
     * Get a method for a key
     * @param {String} key The method key
     * @returns {Function|null} Returns the requested function or null if the function
     * does not exist and the host is configured to return null (and not throw)
     * @memberof HotPatcher
     * @throws {Error} Throws if the configuration specifies to throw and the method
     * does not exist
     * @throws {Error} Throws if the `getEmptyAction` value is invalid
     */
  }, {
    key: "get",
    value: function get(key) {
      var item = this.configuration.registry[key];
      if (!item) {
        switch (this.getEmptyAction) {
          case "null":
            return null;
          case "throw":
            throw new Error("Failed handling method request: No method provided for override: ".concat(key));
          default:
            throw new Error("Failed handling request which resulted in an empty method: Invalid empty-action specified: ".concat(this.getEmptyAction));
        }
      }
      return sequence.apply(void 0, _toConsumableArray(item.methods));
    }

    /**
     * Check if a method has been patched
     * @param {String} key The function key
     * @returns {Boolean} True if already patched
     * @memberof HotPatcher
     */
  }, {
    key: "isPatched",
    value: function isPatched(key) {
      return !!this.configuration.registry[key];
    }

    /**
     * @typedef {Object} PatchOptions
     * @property {Boolean=} chain - Whether or not to allow chaining execution. Chained
     *  execution allows for attaching multiple callbacks to a key, where the callbacks
     *  will be executed in order of when they were patched (oldest to newest), the
     *  values being passed from one method to another.
     */

    /**
     * Patch a method name
     * @param {String} key The method key to patch
     * @param {Function} method The function to set
     * @param {PatchOptions=} options Patch options
     * @memberof HotPatcher
     * @returns {HotPatcher} Returns self
     */
  }, {
    key: "patch",
    value: function patch(key, method) {
      var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        _ref$chain = _ref.chain,
        chain = _ref$chain === void 0 ? false : _ref$chain;
      if (this.configuration.registry[key] && this.configuration.registry[key]["final"]) {
        throw new Error("Failed patching '".concat(key, "': Method marked as being final"));
      }
      if (typeof method !== "function") {
        throw new Error("Failed patching '".concat(key, "': Provided method is not a function"));
      }
      if (chain) {
        // Add new method to the chain
        if (!this.configuration.registry[key]) {
          // New key, create item
          this.configuration.registry[key] = createNewItem(method);
        } else {
          // Existing, push the method
          this.configuration.registry[key].methods.push(method);
        }
      } else {
        // Replace the original
        if (this.isPatched(key)) {
          var original = this.configuration.registry[key].original;
          this.configuration.registry[key] = Object.assign(createNewItem(method), {
            original: original
          });
        } else {
          this.configuration.registry[key] = createNewItem(method);
        }
      }
      return this;
    }

    /**
     * Patch a method inline, execute it and return the value
     * Used for patching contents of functions. This method will not apply a patched
     * function if it has already been patched, allowing for external overrides to
     * function. It also means that the function is cached so that it is not
     * instantiated every time the outer function is invoked.
     * @param {String} key The function key to use
     * @param {Function} method The function to patch (once, only if not patched)
     * @param {...*} args Arguments to pass to the function
     * @returns {*} The output of the patched function
     * @memberof HotPatcher
     * @example
     *  function mySpecialFunction(a, b) {
     *      return hotPatcher.patchInline("func", (a, b) => {
     *          return a + b;
     *      }, a, b);
     *  }
     */
  }, {
    key: "patchInline",
    value: function patchInline(key, method) {
      if (!this.isPatched(key)) {
        this.patch(key, method);
      }
      for (var _len2 = arguments.length, args = new Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
        args[_key2 - 2] = arguments[_key2];
      }
      return this.execute.apply(this, [key].concat(args));
    }

    /**
     * Patch a method (or methods) in sequential-mode
     * See `patch()` with the option `chain: true`
     * @see patch
     * @param {String} key The key to patch
     * @param {...Function} methods The methods to patch
     * @returns {HotPatcher} Returns self
     * @memberof HotPatcher
     */
  }, {
    key: "plugin",
    value: function plugin(key) {
      var _this2 = this;
      for (var _len3 = arguments.length, methods = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        methods[_key3 - 1] = arguments[_key3];
      }
      methods.forEach(function (method) {
        _this2.patch(key, method, {
          chain: true
        });
      });
      return this;
    }

    /**
     * Restore a patched method if it has been overridden
     * @param {String} key The method key
     * @memberof HotPatcher
     */
  }, {
    key: "restore",
    value: function restore(key) {
      if (!this.isPatched(key)) {
        throw new Error("Failed restoring method: No method present for key: ".concat(key));
      } else if (typeof this.configuration.registry[key].original !== "function") {
        throw new Error("Failed restoring method: Original method not found or of invalid type for key: ".concat(key));
      }
      this.configuration.registry[key].methods = [this.configuration.registry[key].original];
    }

    /**
     * Set a method as being final
     * This sets a method as having been finally overridden. Attempts at overriding
     * again will fail with an error.
     * @param {String} key The key to make final
     * @memberof HotPatcher
     * @returns {HotPatcher} Returns self
     */
  }, {
    key: "setFinal",
    value: function setFinal(key) {
      if (!this.configuration.registry.hasOwnProperty(key)) {
        throw new Error("Failed marking '".concat(key, "' as final: No method found for key"));
      }
      this.configuration.registry[key]["final"] = true;
      return this;
    }
  }]);
}();
module.exports = HotPatcher;

/***/ }),

/***/ "./node_modules/ieee754/index.js":
/*!***************************************!*\
  !*** ./node_modules/ieee754/index.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, exports) => {

/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var nBits = -7;
  var i = isLE ? nBytes - 1 : 0;
  var d = isLE ? -1 : 1;
  var s = buffer[offset + i];
  i += d;
  e = s & (1 << -nBits) - 1;
  s >>= -nBits;
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}
  m = e & (1 << -nBits) - 1;
  e >>= -nBits;
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}
  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : (s ? -1 : 1) * Infinity;
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};
exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
  var i = isLE ? 0 : nBytes - 1;
  var d = isLE ? 1 : -1;
  var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
  value = Math.abs(value);
  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }
    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }
  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}
  e = e << mLen | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}
  buffer[offset + i - d] |= s * 128;
};

/***/ }),

/***/ "./node_modules/inherits/inherits_browser.js":
/*!***************************************************!*\
  !*** ./node_modules/inherits/inherits_browser.js ***!
  \***************************************************/
/***/ ((module) => {

if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor;
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor;
      var TempCtor = function TempCtor() {};
      TempCtor.prototype = superCtor.prototype;
      ctor.prototype = new TempCtor();
      ctor.prototype.constructor = ctor;
    }
  };
}

/***/ }),

/***/ "./node_modules/is-arguments/index.js":
/*!********************************************!*\
  !*** ./node_modules/is-arguments/index.js ***!
  \********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var hasToStringTag = __webpack_require__(/*! has-tostringtag/shams */ "./node_modules/has-tostringtag/shams.js")();
var callBound = __webpack_require__(/*! call-bound */ "./node_modules/call-bound/index.js");
var $toString = callBound('Object.prototype.toString');

/** @type {import('.')} */
var isStandardArguments = function isArguments(value) {
  if (hasToStringTag && value && _typeof(value) === 'object' && Symbol.toStringTag in value) {
    return false;
  }
  return $toString(value) === '[object Arguments]';
};

/** @type {import('.')} */
var isLegacyArguments = function isArguments(value) {
  if (isStandardArguments(value)) {
    return true;
  }
  return value !== null && _typeof(value) === 'object' && 'length' in value && typeof value.length === 'number' && value.length >= 0 && $toString(value) !== '[object Array]' && 'callee' in value && $toString(value.callee) === '[object Function]';
};
var supportsStandardArguments = function () {
  return isStandardArguments(arguments);
}();

// @ts-expect-error TODO make this not error
isStandardArguments.isLegacyArguments = isLegacyArguments; // for tests

/** @type {import('.')} */
module.exports = supportsStandardArguments ? isStandardArguments : isLegacyArguments;

/***/ }),

/***/ "./node_modules/is-buffer/index.js":
/*!*****************************************!*\
  !*** ./node_modules/is-buffer/index.js ***!
  \*****************************************/
/***/ ((module) => {

/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer);
};
function isBuffer(obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj);
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer(obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0));
}

/***/ }),

/***/ "./node_modules/is-callable/index.js":
/*!*******************************************!*\
  !*** ./node_modules/is-callable/index.js ***!
  \*******************************************/
/***/ ((module) => {

"use strict";


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var fnToStr = Function.prototype.toString;
var reflectApply = (typeof Reflect === "undefined" ? "undefined" : _typeof(Reflect)) === 'object' && Reflect !== null && Reflect.apply;
var badArrayLike;
var isCallableMarker;
if (typeof reflectApply === 'function' && typeof Object.defineProperty === 'function') {
  try {
    badArrayLike = Object.defineProperty({}, 'length', {
      get: function get() {
        throw isCallableMarker;
      }
    });
    isCallableMarker = {};
    // eslint-disable-next-line no-throw-literal
    reflectApply(function () {
      throw 42;
    }, null, badArrayLike);
  } catch (_) {
    if (_ !== isCallableMarker) {
      reflectApply = null;
    }
  }
} else {
  reflectApply = null;
}
var constructorRegex = /^\s*class\b/;
var isES6ClassFn = function isES6ClassFunction(value) {
  try {
    var fnStr = fnToStr.call(value);
    return constructorRegex.test(fnStr);
  } catch (e) {
    return false; // not a function
  }
};
var tryFunctionObject = function tryFunctionToStr(value) {
  try {
    if (isES6ClassFn(value)) {
      return false;
    }
    fnToStr.call(value);
    return true;
  } catch (e) {
    return false;
  }
};
var toStr = Object.prototype.toString;
var objectClass = '[object Object]';
var fnClass = '[object Function]';
var genClass = '[object GeneratorFunction]';
var ddaClass = '[object HTMLAllCollection]'; // IE 11
var ddaClass2 = '[object HTML document.all class]';
var ddaClass3 = '[object HTMLCollection]'; // IE 9-10
var hasToStringTag = typeof Symbol === 'function' && !!Symbol.toStringTag; // better: use `has-tostringtag`

var isIE68 = !(0 in [,]); // eslint-disable-line no-sparse-arrays, comma-spacing

var isDDA = function isDocumentDotAll() {
  return false;
};
if ((typeof document === "undefined" ? "undefined" : _typeof(document)) === 'object') {
  // Firefox 3 canonicalizes DDA to undefined when it's not accessed directly
  var all = document.all;
  if (toStr.call(all) === toStr.call(document.all)) {
    isDDA = function isDocumentDotAll(value) {
      /* globals document: false */
      // in IE 6-8, typeof document.all is "object" and it's truthy
      if ((isIE68 || !value) && (typeof value === 'undefined' || _typeof(value) === 'object')) {
        try {
          var str = toStr.call(value);
          return (str === ddaClass || str === ddaClass2 || str === ddaClass3 // opera 12.16
          || str === objectClass // IE 6-8
          ) && value('') == null; // eslint-disable-line eqeqeq
        } catch (e) {/**/}
      }
      return false;
    };
  }
}
module.exports = reflectApply ? function isCallable(value) {
  if (isDDA(value)) {
    return true;
  }
  if (!value) {
    return false;
  }
  if (typeof value !== 'function' && _typeof(value) !== 'object') {
    return false;
  }
  try {
    reflectApply(value, null, badArrayLike);
  } catch (e) {
    if (e !== isCallableMarker) {
      return false;
    }
  }
  return !isES6ClassFn(value) && tryFunctionObject(value);
} : function isCallable(value) {
  if (isDDA(value)) {
    return true;
  }
  if (!value) {
    return false;
  }
  if (typeof value !== 'function' && _typeof(value) !== 'object') {
    return false;
  }
  if (hasToStringTag) {
    return tryFunctionObject(value);
  }
  if (isES6ClassFn(value)) {
    return false;
  }
  var strClass = toStr.call(value);
  if (strClass !== fnClass && strClass !== genClass && !/^\[object HTML/.test(strClass)) {
    return false;
  }
  return tryFunctionObject(value);
};

/***/ }),

/***/ "./node_modules/is-generator-function/index.js":
/*!*****************************************************!*\
  !*** ./node_modules/is-generator-function/index.js ***!
  \*****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var callBound = __webpack_require__(/*! call-bound */ "./node_modules/call-bound/index.js");
var safeRegexTest = __webpack_require__(/*! safe-regex-test */ "./node_modules/safe-regex-test/index.js");
var isFnRegex = safeRegexTest(/^\s*(?:function)?\*/);
var hasToStringTag = __webpack_require__(/*! has-tostringtag/shams */ "./node_modules/has-tostringtag/shams.js")();
var getProto = __webpack_require__(/*! get-proto */ "./node_modules/get-proto/index.js");
var toStr = callBound('Object.prototype.toString');
var fnToStr = callBound('Function.prototype.toString');
var getGeneratorFunc = function getGeneratorFunc() {
  // eslint-disable-line consistent-return
  if (!hasToStringTag) {
    return false;
  }
  try {
    return Function('return function*() {}')();
  } catch (e) {}
};
/** @type {undefined | false | null | GeneratorFunctionConstructor} */
var GeneratorFunction;

/** @type {import('.')} */
module.exports = function isGeneratorFunction(fn) {
  if (typeof fn !== 'function') {
    return false;
  }
  if (isFnRegex(fnToStr(fn))) {
    return true;
  }
  if (!hasToStringTag) {
    var str = toStr(fn);
    return str === '[object GeneratorFunction]';
  }
  if (!getProto) {
    return false;
  }
  if (typeof GeneratorFunction === 'undefined') {
    var generatorFunc = getGeneratorFunc();
    GeneratorFunction = generatorFunc
    // eslint-disable-next-line no-extra-parens
    ? (/** @type {GeneratorFunctionConstructor} */getProto(generatorFunc)) : false;
  }
  return getProto(fn) === GeneratorFunction;
};

/***/ }),

/***/ "./node_modules/is-regex/index.js":
/*!****************************************!*\
  !*** ./node_modules/is-regex/index.js ***!
  \****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var callBound = __webpack_require__(/*! call-bound */ "./node_modules/call-bound/index.js");
var hasToStringTag = __webpack_require__(/*! has-tostringtag/shams */ "./node_modules/has-tostringtag/shams.js")();
var hasOwn = __webpack_require__(/*! hasown */ "./node_modules/hasown/index.js");
var gOPD = __webpack_require__(/*! gopd */ "./node_modules/gopd/index.js");

/** @type {import('.')} */
var fn;
if (hasToStringTag) {
  /** @type {(receiver: ThisParameterType<typeof RegExp.prototype.exec>, ...args: Parameters<typeof RegExp.prototype.exec>) => ReturnType<typeof RegExp.prototype.exec>} */
  var $exec = callBound('RegExp.prototype.exec');
  /** @type {object} */
  var isRegexMarker = {};
  var throwRegexMarker = function throwRegexMarker() {
    throw isRegexMarker;
  };
  /** @type {{ toString(): never, valueOf(): never, [Symbol.toPrimitive]?(): never }} */
  var badStringifier = {
    toString: throwRegexMarker,
    valueOf: throwRegexMarker
  };
  if (_typeof(Symbol.toPrimitive) === 'symbol') {
    badStringifier[Symbol.toPrimitive] = throwRegexMarker;
  }

  /** @type {import('.')} */
  // @ts-expect-error TS can't figure out that the $exec call always throws
  // eslint-disable-next-line consistent-return
  fn = function isRegex(value) {
    if (!value || _typeof(value) !== 'object') {
      return false;
    }

    // eslint-disable-next-line no-extra-parens
    var descriptor = /** @type {NonNullable<typeof gOPD>} */gOPD(/** @type {{ lastIndex?: unknown }} */value, 'lastIndex');
    var hasLastIndexDataProperty = descriptor && hasOwn(descriptor, 'value');
    if (!hasLastIndexDataProperty) {
      return false;
    }
    try {
      // eslint-disable-next-line no-extra-parens
      $exec(value, /** @type {string} */ /** @type {unknown} */badStringifier);
    } catch (e) {
      return e === isRegexMarker;
    }
  };
} else {
  /** @type {(receiver: ThisParameterType<typeof Object.prototype.toString>, ...args: Parameters<typeof Object.prototype.toString>) => ReturnType<typeof Object.prototype.toString>} */
  var $toString = callBound('Object.prototype.toString');
  /** @const @type {'[object RegExp]'} */
  var regexClass = '[object RegExp]';

  /** @type {import('.')} */
  fn = function isRegex(value) {
    // In older browsers, typeof regex incorrectly returns 'function'
    if (!value || _typeof(value) !== 'object' && typeof value !== 'function') {
      return false;
    }
    return $toString(value) === regexClass;
  };
}
module.exports = fn;

/***/ }),

/***/ "./node_modules/is-typed-array/index.js":
/*!**********************************************!*\
  !*** ./node_modules/is-typed-array/index.js ***!
  \**********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var whichTypedArray = __webpack_require__(/*! which-typed-array */ "./node_modules/which-typed-array/index.js");

/** @type {import('.')} */
module.exports = function isTypedArray(value) {
  return !!whichTypedArray(value);
};

/***/ }),

/***/ "./node_modules/layerr/dist/error.js":
/*!*******************************************!*\
  !*** ./node_modules/layerr/dist/error.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.isError = exports.inherit = exports.assertError = void 0;
function assertError(err) {
  if (!isError(err)) {
    throw new Error("Parameter was not an error");
  }
}
exports.assertError = assertError;
function inherit(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
}
exports.inherit = inherit;
function isError(err) {
  return objectToString(err) === "[object Error]" || err instanceof Error;
}
exports.isError = isError;
function objectToString(obj) {
  return Object.prototype.toString.call(obj);
}

/***/ }),

/***/ "./node_modules/layerr/dist/index.js":
/*!*******************************************!*\
  !*** ./node_modules/layerr/dist/index.js ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var __createBinding = this && this.__createBinding || (Object.create ? function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  Object.defineProperty(o, k2, {
    enumerable: true,
    get: function get() {
      return m[k];
    }
  });
} : function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});
var __exportStar = this && this.__exportStar || function (m, exports) {
  for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.Layerr = void 0;
var layerr_1 = __webpack_require__(/*! ./layerr */ "./node_modules/layerr/dist/layerr.js");
Object.defineProperty(exports, "Layerr", ({
  enumerable: true,
  get: function get() {
    return layerr_1.Layerr;
  }
}));
__exportStar(__webpack_require__(/*! ./types */ "./node_modules/layerr/dist/types.js"), exports);

/***/ }),

/***/ "./node_modules/layerr/dist/layerr.js":
/*!********************************************!*\
  !*** ./node_modules/layerr/dist/layerr.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.Layerr = void 0;
var error_1 = __webpack_require__(/*! ./error */ "./node_modules/layerr/dist/error.js");
var tools_1 = __webpack_require__(/*! ./tools */ "./node_modules/layerr/dist/tools.js");
function Layerr(errorOptionsOrMessage, messageText) {
  var args = Array.prototype.slice.call(arguments);
  if (this instanceof Layerr === false) {
    throw new Error("Cannot invoke 'Layerr' like a function: It must be called with 'new'");
  }
  var _tools_1$parseArgumen = tools_1.parseArguments(args),
    options = _tools_1$parseArgumen.options,
    shortMessage = _tools_1$parseArgumen.shortMessage;
  this.name = "Layerr";
  if (options.name && typeof options.name === "string") {
    this.name = options.name;
  }
  var message = shortMessage;
  if (options.cause) {
    Object.defineProperty(this, "_cause", {
      value: options.cause
    });
    message = "".concat(message, ": ").concat(options.cause.message);
  }
  this.message = message;
  Object.defineProperty(this, "_info", {
    value: {}
  });
  if (options.info && _typeof(options.info) === "object") {
    Object.assign(this._info, options.info);
  }
  Error.call(this, message);
  if (Error.captureStackTrace) {
    var ctor = options.constructorOpt || this.constructor;
    Error.captureStackTrace(this, ctor);
  }
  return this;
}
exports.Layerr = Layerr;
error_1.inherit(Layerr, Error);
Layerr.prototype.cause = function _getCause() {
  return Layerr.cause(this) || undefined;
};
Layerr.prototype.toString = function _toString() {
  var output = this.name || this.constructor.name || this.constructor.prototype.name;
  if (this.message) {
    output = "".concat(output, ": ").concat(this.message);
  }
  return output;
};
Layerr.cause = function __getCause(err) {
  error_1.assertError(err);
  return error_1.isError(err._cause) ? err._cause : null;
};
Layerr.fullStack = function __getFullStack(err) {
  error_1.assertError(err);
  var cause = Layerr.cause(err);
  if (cause) {
    return "".concat(err.stack, "\ncaused by: ").concat(Layerr.fullStack(cause));
  }
  return err.stack;
};
Layerr.info = function __getInfo(err) {
  error_1.assertError(err);
  var output = {};
  var cause = Layerr.cause(err);
  if (cause) {
    Object.assign(output, Layerr.info(cause));
  }
  if (err._info) {
    Object.assign(output, err._info);
  }
  return output;
};

/***/ }),

/***/ "./node_modules/layerr/dist/tools.js":
/*!*******************************************!*\
  !*** ./node_modules/layerr/dist/tools.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.parseArguments = void 0;
var error_1 = __webpack_require__(/*! ./error */ "./node_modules/layerr/dist/error.js");
function parseArguments(args) {
  var options,
    shortMessage = "";
  if (args.length === 0) {
    options = {};
  } else if (error_1.isError(args[0])) {
    options = {
      cause: args[0]
    };
    shortMessage = args.slice(1).join(" ") || "";
  } else if (args[0] && _typeof(args[0]) === "object") {
    options = Object.assign({}, args[0]);
    shortMessage = args.slice(1).join(" ") || "";
  } else if (typeof args[0] === "string") {
    options = {};
    shortMessage = shortMessage = args.join(" ") || "";
  } else {
    throw new Error("Invalid arguments passed to Layerr");
  }
  return {
    options: options,
    shortMessage: shortMessage
  };
}
exports.parseArguments = parseArguments;

/***/ }),

/***/ "./node_modules/layerr/dist/types.js":
/*!*******************************************!*\
  !*** ./node_modules/layerr/dist/types.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));

/***/ }),

/***/ "./node_modules/math-intrinsics/abs.js":
/*!*********************************************!*\
  !*** ./node_modules/math-intrinsics/abs.js ***!
  \*********************************************/
/***/ ((module) => {

"use strict";


/** @type {import('./abs')} */
module.exports = Math.abs;

/***/ }),

/***/ "./node_modules/math-intrinsics/floor.js":
/*!***********************************************!*\
  !*** ./node_modules/math-intrinsics/floor.js ***!
  \***********************************************/
/***/ ((module) => {

"use strict";


/** @type {import('./floor')} */
module.exports = Math.floor;

/***/ }),

/***/ "./node_modules/math-intrinsics/isNaN.js":
/*!***********************************************!*\
  !*** ./node_modules/math-intrinsics/isNaN.js ***!
  \***********************************************/
/***/ ((module) => {

"use strict";


/** @type {import('./isNaN')} */
module.exports = Number.isNaN || function isNaN(a) {
  return a !== a;
};

/***/ }),

/***/ "./node_modules/math-intrinsics/max.js":
/*!*********************************************!*\
  !*** ./node_modules/math-intrinsics/max.js ***!
  \*********************************************/
/***/ ((module) => {

"use strict";


/** @type {import('./max')} */
module.exports = Math.max;

/***/ }),

/***/ "./node_modules/math-intrinsics/min.js":
/*!*********************************************!*\
  !*** ./node_modules/math-intrinsics/min.js ***!
  \*********************************************/
/***/ ((module) => {

"use strict";


/** @type {import('./min')} */
module.exports = Math.min;

/***/ }),

/***/ "./node_modules/math-intrinsics/pow.js":
/*!*********************************************!*\
  !*** ./node_modules/math-intrinsics/pow.js ***!
  \*********************************************/
/***/ ((module) => {

"use strict";


/** @type {import('./pow')} */
module.exports = Math.pow;

/***/ }),

/***/ "./node_modules/math-intrinsics/round.js":
/*!***********************************************!*\
  !*** ./node_modules/math-intrinsics/round.js ***!
  \***********************************************/
/***/ ((module) => {

"use strict";


/** @type {import('./round')} */
module.exports = Math.round;

/***/ }),

/***/ "./node_modules/math-intrinsics/sign.js":
/*!**********************************************!*\
  !*** ./node_modules/math-intrinsics/sign.js ***!
  \**********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var $isNaN = __webpack_require__(/*! ./isNaN */ "./node_modules/math-intrinsics/isNaN.js");

/** @type {import('./sign')} */
module.exports = function sign(number) {
  if ($isNaN(number) || number === 0) {
    return number;
  }
  return number < 0 ? -1 : +1;
};

/***/ }),

/***/ "./node_modules/md5/md5.js":
/*!*********************************!*\
  !*** ./node_modules/md5/md5.js ***!
  \*********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

(function () {
  var crypt = __webpack_require__(/*! crypt */ "./node_modules/crypt/crypt.js"),
    utf8 = (__webpack_require__(/*! charenc */ "./node_modules/charenc/charenc.js").utf8),
    isBuffer = __webpack_require__(/*! is-buffer */ "./node_modules/is-buffer/index.js"),
    bin = (__webpack_require__(/*! charenc */ "./node_modules/charenc/charenc.js").bin),
    // The core
    _md = function md5(message, options) {
      // Convert to byte array
      if (message.constructor == String) {
        if (options && options.encoding === 'binary') message = bin.stringToBytes(message);else message = utf8.stringToBytes(message);
      } else if (isBuffer(message)) message = Array.prototype.slice.call(message, 0);else if (!Array.isArray(message) && message.constructor !== Uint8Array) message = message.toString();
      // else, assume byte array already

      var m = crypt.bytesToWords(message),
        l = message.length * 8,
        a = 1732584193,
        b = -271733879,
        c = -1732584194,
        d = 271733878;

      // Swap endian
      for (var i = 0; i < m.length; i++) {
        m[i] = (m[i] << 8 | m[i] >>> 24) & 0x00FF00FF | (m[i] << 24 | m[i] >>> 8) & 0xFF00FF00;
      }

      // Padding
      m[l >>> 5] |= 0x80 << l % 32;
      m[(l + 64 >>> 9 << 4) + 14] = l;

      // Method shortcuts
      var FF = _md._ff,
        GG = _md._gg,
        HH = _md._hh,
        II = _md._ii;
      for (var i = 0; i < m.length; i += 16) {
        var aa = a,
          bb = b,
          cc = c,
          dd = d;
        a = FF(a, b, c, d, m[i + 0], 7, -680876936);
        d = FF(d, a, b, c, m[i + 1], 12, -389564586);
        c = FF(c, d, a, b, m[i + 2], 17, 606105819);
        b = FF(b, c, d, a, m[i + 3], 22, -1044525330);
        a = FF(a, b, c, d, m[i + 4], 7, -176418897);
        d = FF(d, a, b, c, m[i + 5], 12, 1200080426);
        c = FF(c, d, a, b, m[i + 6], 17, -1473231341);
        b = FF(b, c, d, a, m[i + 7], 22, -45705983);
        a = FF(a, b, c, d, m[i + 8], 7, 1770035416);
        d = FF(d, a, b, c, m[i + 9], 12, -1958414417);
        c = FF(c, d, a, b, m[i + 10], 17, -42063);
        b = FF(b, c, d, a, m[i + 11], 22, -1990404162);
        a = FF(a, b, c, d, m[i + 12], 7, 1804603682);
        d = FF(d, a, b, c, m[i + 13], 12, -40341101);
        c = FF(c, d, a, b, m[i + 14], 17, -1502002290);
        b = FF(b, c, d, a, m[i + 15], 22, 1236535329);
        a = GG(a, b, c, d, m[i + 1], 5, -165796510);
        d = GG(d, a, b, c, m[i + 6], 9, -1069501632);
        c = GG(c, d, a, b, m[i + 11], 14, 643717713);
        b = GG(b, c, d, a, m[i + 0], 20, -373897302);
        a = GG(a, b, c, d, m[i + 5], 5, -701558691);
        d = GG(d, a, b, c, m[i + 10], 9, 38016083);
        c = GG(c, d, a, b, m[i + 15], 14, -660478335);
        b = GG(b, c, d, a, m[i + 4], 20, -405537848);
        a = GG(a, b, c, d, m[i + 9], 5, 568446438);
        d = GG(d, a, b, c, m[i + 14], 9, -1019803690);
        c = GG(c, d, a, b, m[i + 3], 14, -187363961);
        b = GG(b, c, d, a, m[i + 8], 20, 1163531501);
        a = GG(a, b, c, d, m[i + 13], 5, -1444681467);
        d = GG(d, a, b, c, m[i + 2], 9, -51403784);
        c = GG(c, d, a, b, m[i + 7], 14, 1735328473);
        b = GG(b, c, d, a, m[i + 12], 20, -1926607734);
        a = HH(a, b, c, d, m[i + 5], 4, -378558);
        d = HH(d, a, b, c, m[i + 8], 11, -2022574463);
        c = HH(c, d, a, b, m[i + 11], 16, 1839030562);
        b = HH(b, c, d, a, m[i + 14], 23, -35309556);
        a = HH(a, b, c, d, m[i + 1], 4, -1530992060);
        d = HH(d, a, b, c, m[i + 4], 11, 1272893353);
        c = HH(c, d, a, b, m[i + 7], 16, -155497632);
        b = HH(b, c, d, a, m[i + 10], 23, -1094730640);
        a = HH(a, b, c, d, m[i + 13], 4, 681279174);
        d = HH(d, a, b, c, m[i + 0], 11, -358537222);
        c = HH(c, d, a, b, m[i + 3], 16, -722521979);
        b = HH(b, c, d, a, m[i + 6], 23, 76029189);
        a = HH(a, b, c, d, m[i + 9], 4, -640364487);
        d = HH(d, a, b, c, m[i + 12], 11, -421815835);
        c = HH(c, d, a, b, m[i + 15], 16, 530742520);
        b = HH(b, c, d, a, m[i + 2], 23, -995338651);
        a = II(a, b, c, d, m[i + 0], 6, -198630844);
        d = II(d, a, b, c, m[i + 7], 10, 1126891415);
        c = II(c, d, a, b, m[i + 14], 15, -1416354905);
        b = II(b, c, d, a, m[i + 5], 21, -57434055);
        a = II(a, b, c, d, m[i + 12], 6, 1700485571);
        d = II(d, a, b, c, m[i + 3], 10, -1894986606);
        c = II(c, d, a, b, m[i + 10], 15, -1051523);
        b = II(b, c, d, a, m[i + 1], 21, -2054922799);
        a = II(a, b, c, d, m[i + 8], 6, 1873313359);
        d = II(d, a, b, c, m[i + 15], 10, -30611744);
        c = II(c, d, a, b, m[i + 6], 15, -1560198380);
        b = II(b, c, d, a, m[i + 13], 21, 1309151649);
        a = II(a, b, c, d, m[i + 4], 6, -145523070);
        d = II(d, a, b, c, m[i + 11], 10, -1120210379);
        c = II(c, d, a, b, m[i + 2], 15, 718787259);
        b = II(b, c, d, a, m[i + 9], 21, -343485551);
        a = a + aa >>> 0;
        b = b + bb >>> 0;
        c = c + cc >>> 0;
        d = d + dd >>> 0;
      }
      return crypt.endian([a, b, c, d]);
    };

  // Auxiliary functions
  _md._ff = function (a, b, c, d, x, s, t) {
    var n = a + (b & c | ~b & d) + (x >>> 0) + t;
    return (n << s | n >>> 32 - s) + b;
  };
  _md._gg = function (a, b, c, d, x, s, t) {
    var n = a + (b & d | c & ~d) + (x >>> 0) + t;
    return (n << s | n >>> 32 - s) + b;
  };
  _md._hh = function (a, b, c, d, x, s, t) {
    var n = a + (b ^ c ^ d) + (x >>> 0) + t;
    return (n << s | n >>> 32 - s) + b;
  };
  _md._ii = function (a, b, c, d, x, s, t) {
    var n = a + (c ^ (b | ~d)) + (x >>> 0) + t;
    return (n << s | n >>> 32 - s) + b;
  };

  // Package private blocksize
  _md._blocksize = 16;
  _md._digestsize = 16;
  module.exports = function (message, options) {
    if (message === undefined || message === null) throw new Error('Illegal argument ' + message);
    var digestbytes = crypt.wordsToBytes(_md(message, options));
    return options && options.asBytes ? digestbytes : options && options.asString ? bin.bytesToString(digestbytes) : crypt.bytesToHex(digestbytes);
  };
})();

/***/ }),

/***/ "./node_modules/minimatch/lib/path.js":
/*!********************************************!*\
  !*** ./node_modules/minimatch/lib/path.js ***!
  \********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/* provided dependency */ var process = __webpack_require__(/*! process/browser */ "./node_modules/process/browser.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var isWindows = (typeof process === "undefined" ? "undefined" : _typeof(process)) === 'object' && process && process.platform === 'win32';
module.exports = isWindows ? {
  sep: '\\'
} : {
  sep: '/'
};

/***/ }),

/***/ "./node_modules/minimatch/minimatch.js":
/*!*********************************************!*\
  !*** ./node_modules/minimatch/minimatch.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var minimatch = module.exports = function (p, pattern) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  assertValidPattern(pattern);

  // shortcut: comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    return false;
  }
  return new Minimatch(pattern, options).match(p);
};
module.exports = minimatch;
var path = __webpack_require__(/*! ./lib/path.js */ "./node_modules/minimatch/lib/path.js");
minimatch.sep = path.sep;
var GLOBSTAR = Symbol('globstar **');
minimatch.GLOBSTAR = GLOBSTAR;
var expand = __webpack_require__(/*! brace-expansion */ "./node_modules/brace-expansion/index.js");
var plTypes = {
  '!': {
    open: '(?:(?!(?:',
    close: '))[^/]*?)'
  },
  '?': {
    open: '(?:',
    close: ')?'
  },
  '+': {
    open: '(?:',
    close: ')+'
  },
  '*': {
    open: '(?:',
    close: ')*'
  },
  '@': {
    open: '(?:',
    close: ')'
  }
};

// any single thing other than /
// don't need to escape / when using new RegExp()
var qmark = '[^/]';

// * => any number of characters
var star = qmark + '*?';

// ** when dots are allowed.  Anything goes, except .. and .
// not (^ or / followed by one or two dots followed by $ or /),
// followed by anything, any number of times.
var twoStarDot = '(?:(?!(?:\\\/|^)(?:\\.{1,2})($|\\\/)).)*?';

// not a ^ or / followed by a dot,
// followed by anything, any number of times.
var twoStarNoDot = '(?:(?!(?:\\\/|^)\\.).)*?';

// "abc" -> { a:true, b:true, c:true }
var charSet = function charSet(s) {
  return s.split('').reduce(function (set, c) {
    set[c] = true;
    return set;
  }, {});
};

// characters that need to be escaped in RegExp.
var reSpecials = charSet('().*{}+?[]^$\\!');

// characters that indicate we have to add the pattern start
var addPatternStartSet = charSet('[.(');

// normalizes slashes.
var slashSplit = /\/+/;
minimatch.filter = function (pattern) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return function (p, i, list) {
    return minimatch(p, pattern, options);
  };
};
var ext = function ext(a) {
  var b = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var t = {};
  Object.keys(a).forEach(function (k) {
    return t[k] = a[k];
  });
  Object.keys(b).forEach(function (k) {
    return t[k] = b[k];
  });
  return t;
};
minimatch.defaults = function (def) {
  if (!def || _typeof(def) !== 'object' || !Object.keys(def).length) {
    return minimatch;
  }
  var orig = minimatch;
  var m = function m(p, pattern, options) {
    return orig(p, pattern, ext(def, options));
  };
  m.Minimatch = /*#__PURE__*/function (_orig$Minimatch) {
    function Minimatch(pattern, options) {
      _classCallCheck(this, Minimatch);
      return _callSuper(this, Minimatch, [pattern, ext(def, options)]);
    }
    _inherits(Minimatch, _orig$Minimatch);
    return _createClass(Minimatch);
  }(orig.Minimatch);
  m.Minimatch.defaults = function (options) {
    return orig.defaults(ext(def, options)).Minimatch;
  };
  m.filter = function (pattern, options) {
    return orig.filter(pattern, ext(def, options));
  };
  m.defaults = function (options) {
    return orig.defaults(ext(def, options));
  };
  m.makeRe = function (pattern, options) {
    return orig.makeRe(pattern, ext(def, options));
  };
  m.braceExpand = function (pattern, options) {
    return orig.braceExpand(pattern, ext(def, options));
  };
  m.match = function (list, pattern, options) {
    return orig.match(list, pattern, ext(def, options));
  };
  return m;
};

// Brace expansion:
// a{b,c}d -> abd acd
// a{b,}c -> abc ac
// a{0..3}d -> a0d a1d a2d a3d
// a{b,c{d,e}f}g -> abg acdfg acefg
// a{b,c}d{e,f}g -> abdeg acdeg abdeg abdfg
//
// Invalid sets are not expanded.
// a{2..}b -> a{2..}b
// a{b}c -> a{b}c
minimatch.braceExpand = function (pattern, options) {
  return _braceExpand(pattern, options);
};
var _braceExpand = function braceExpand(pattern) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  assertValidPattern(pattern);

  // Thanks to Yeting Li <https://github.com/yetingli> for
  // improving this regexp to avoid a ReDOS vulnerability.
  if (options.nobrace || !/\{(?:(?!\{).)*\}/.test(pattern)) {
    // shortcut. no need to expand.
    return [pattern];
  }
  return expand(pattern);
};
var MAX_PATTERN_LENGTH = 1024 * 64;
var assertValidPattern = function assertValidPattern(pattern) {
  if (typeof pattern !== 'string') {
    throw new TypeError('invalid pattern');
  }
  if (pattern.length > MAX_PATTERN_LENGTH) {
    throw new TypeError('pattern is too long');
  }
};

// parse a component of the expanded set.
// At this point, no pattern may contain "/" in it
// so we're going to return a 2d array, where each entry is the full
// pattern, split on '/', and then turned into a regular expression.
// A regexp is made at the end which joins each array with an
// escaped /, and another full one which joins each regexp with |.
//
// Following the lead of Bash 4.1, note that "**" only has special meaning
// when it is the *only* thing in a path portion.  Otherwise, any series
// of * is equivalent to a single *.  Globstar behavior is enabled by
// default, and can be disabled by setting options.noglobstar.
var SUBPARSE = Symbol('subparse');
minimatch.makeRe = function (pattern, options) {
  return new Minimatch(pattern, options || {}).makeRe();
};
minimatch.match = function (list, pattern) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var mm = new Minimatch(pattern, options);
  list = list.filter(function (f) {
    return mm.match(f);
  });
  if (mm.options.nonull && !list.length) {
    list.push(pattern);
  }
  return list;
};

// replace stuff like \* with *
var globUnescape = function globUnescape(s) {
  return s.replace(/\\(.)/g, '$1');
};
var charUnescape = function charUnescape(s) {
  return s.replace(/\\([^-\]])/g, '$1');
};
var regExpEscape = function regExpEscape(s) {
  return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};
var braExpEscape = function braExpEscape(s) {
  return s.replace(/[[\]\\]/g, '\\$&');
};
var Minimatch = /*#__PURE__*/function () {
  function Minimatch(pattern, options) {
    _classCallCheck(this, Minimatch);
    assertValidPattern(pattern);
    if (!options) options = {};
    this.options = options;
    this.set = [];
    this.pattern = pattern;
    this.windowsPathsNoEscape = !!options.windowsPathsNoEscape || options.allowWindowsEscape === false;
    if (this.windowsPathsNoEscape) {
      this.pattern = this.pattern.replace(/\\/g, '/');
    }
    this.regexp = null;
    this.negate = false;
    this.comment = false;
    this.empty = false;
    this.partial = !!options.partial;

    // make the set of regexps etc.
    this.make();
  }
  return _createClass(Minimatch, [{
    key: "debug",
    value: function debug() {}
  }, {
    key: "make",
    value: function make() {
      var _this = this;
      var pattern = this.pattern;
      var options = this.options;

      // empty patterns and comments match nothing.
      if (!options.nocomment && pattern.charAt(0) === '#') {
        this.comment = true;
        return;
      }
      if (!pattern) {
        this.empty = true;
        return;
      }

      // step 1: figure out negation, etc.
      this.parseNegate();

      // step 2: expand braces
      var set = this.globSet = this.braceExpand();
      if (options.debug) this.debug = function () {
        var _console;
        return (_console = console).error.apply(_console, arguments);
      };
      this.debug(this.pattern, set);

      // step 3: now we have a set, so turn each one into a series of path-portion
      // matching patterns.
      // These will be regexps, except in the case of "**", which is
      // set to the GLOBSTAR object for globstar behavior,
      // and will not contain any / characters
      set = this.globParts = set.map(function (s) {
        return s.split(slashSplit);
      });
      this.debug(this.pattern, set);

      // glob --> regexps
      set = set.map(function (s, si, set) {
        return s.map(_this.parse, _this);
      });
      this.debug(this.pattern, set);

      // filter out everything that didn't compile properly.
      set = set.filter(function (s) {
        return s.indexOf(false) === -1;
      });
      this.debug(this.pattern, set);
      this.set = set;
    }
  }, {
    key: "parseNegate",
    value: function parseNegate() {
      if (this.options.nonegate) return;
      var pattern = this.pattern;
      var negate = false;
      var negateOffset = 0;
      for (var i = 0; i < pattern.length && pattern.charAt(i) === '!'; i++) {
        negate = !negate;
        negateOffset++;
      }
      if (negateOffset) this.pattern = pattern.slice(negateOffset);
      this.negate = negate;
    }

    // set partial to true to test if, for example,
    // "/a/b" matches the start of "/*/b/*/d"
    // Partial means, if you run out of file before you run
    // out of pattern, then that's fine, as long as all
    // the parts match.
  }, {
    key: "matchOne",
    value: function matchOne(file, pattern, partial) {
      var options = this.options;
      this.debug('matchOne', {
        'this': this,
        file: file,
        pattern: pattern
      });
      this.debug('matchOne', file.length, pattern.length);
      for (var fi = 0, pi = 0, fl = file.length, pl = pattern.length; fi < fl && pi < pl; fi++, pi++) {
        this.debug('matchOne loop');
        var p = pattern[pi];
        var f = file[fi];
        this.debug(pattern, p, f);

        // should be impossible.
        // some invalid regexp stuff in the set.
        /* istanbul ignore if */
        if (p === false) return false;
        if (p === GLOBSTAR) {
          this.debug('GLOBSTAR', [pattern, p, f]);

          // "**"
          // a/**/b/**/c would match the following:
          // a/b/x/y/z/c
          // a/x/y/z/b/c
          // a/b/x/b/x/c
          // a/b/c
          // To do this, take the rest of the pattern after
          // the **, and see if it would match the file remainder.
          // If so, return success.
          // If not, the ** "swallows" a segment, and try again.
          // This is recursively awful.
          //
          // a/**/b/**/c matching a/b/x/y/z/c
          // - a matches a
          // - doublestar
          //   - matchOne(b/x/y/z/c, b/**/c)
          //     - b matches b
          //     - doublestar
          //       - matchOne(x/y/z/c, c) -> no
          //       - matchOne(y/z/c, c) -> no
          //       - matchOne(z/c, c) -> no
          //       - matchOne(c, c) yes, hit
          var fr = fi;
          var pr = pi + 1;
          if (pr === pl) {
            this.debug('** at the end');
            // a ** at the end will just swallow the rest.
            // We have found a match.
            // however, it will not swallow /.x, unless
            // options.dot is set.
            // . and .. are *never* matched by **, for explosively
            // exponential reasons.
            for (; fi < fl; fi++) {
              if (file[fi] === '.' || file[fi] === '..' || !options.dot && file[fi].charAt(0) === '.') return false;
            }
            return true;
          }

          // ok, let's see if we can swallow whatever we can.
          while (fr < fl) {
            var swallowee = file[fr];
            this.debug('\nglobstar while', file, fr, pattern, pr, swallowee);

            // XXX remove this slice.  Just pass the start index.
            if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {
              this.debug('globstar found match!', fr, fl, swallowee);
              // found a match.
              return true;
            } else {
              // can't swallow "." or ".." ever.
              // can only swallow ".foo" when explicitly asked.
              if (swallowee === '.' || swallowee === '..' || !options.dot && swallowee.charAt(0) === '.') {
                this.debug('dot detected!', file, fr, pattern, pr);
                break;
              }

              // ** swallows a segment, and continue.
              this.debug('globstar swallow a segment, and continue');
              fr++;
            }
          }

          // no match was found.
          // However, in partial mode, we can't say this is necessarily over.
          // If there's more *pattern* left, then
          /* istanbul ignore if */
          if (partial) {
            // ran out of file
            this.debug('\n>>> no match, partial?', file, fr, pattern, pr);
            if (fr === fl) return true;
          }
          return false;
        }

        // something other than **
        // non-magic patterns just have to match exactly
        // patterns with magic have been turned into regexps.
        var hit;
        if (typeof p === 'string') {
          hit = f === p;
          this.debug('string match', p, f, hit);
        } else {
          hit = f.match(p);
          this.debug('pattern match', p, f, hit);
        }
        if (!hit) return false;
      }

      // Note: ending in / means that we'll get a final ""
      // at the end of the pattern.  This can only match a
      // corresponding "" at the end of the file.
      // If the file ends in /, then it can only match a
      // a pattern that ends in /, unless the pattern just
      // doesn't have any more for it. But, a/b/ should *not*
      // match "a/b/*", even though "" matches against the
      // [^/]*? pattern, except in partial mode, where it might
      // simply not be reached yet.
      // However, a/b/ should still satisfy a/*

      // now either we fell off the end of the pattern, or we're done.
      if (fi === fl && pi === pl) {
        // ran out of pattern and filename at the same time.
        // an exact hit!
        return true;
      } else if (fi === fl) {
        // ran out of file, but still had pattern left.
        // this is ok if we're doing the match as part of
        // a glob fs traversal.
        return partial;
      } else /* istanbul ignore else */if (pi === pl) {
          // ran out of pattern, still have file left.
          // this is only acceptable if we're on the very last
          // empty segment of a file with a trailing slash.
          // a/* should match a/b/
          return fi === fl - 1 && file[fi] === '';
        }

      // should be unreachable.
      /* istanbul ignore next */
      throw new Error('wtf?');
    }
  }, {
    key: "braceExpand",
    value: function braceExpand() {
      return _braceExpand(this.pattern, this.options);
    }
  }, {
    key: "parse",
    value: function parse(pattern, isSub) {
      var _this2 = this;
      assertValidPattern(pattern);
      var options = this.options;

      // shortcuts
      if (pattern === '**') {
        if (!options.noglobstar) return GLOBSTAR;else pattern = '*';
      }
      if (pattern === '') return '';
      var re = '';
      var hasMagic = false;
      var escaping = false;
      // ? => one single character
      var patternListStack = [];
      var negativeLists = [];
      var stateChar;
      var inClass = false;
      var reClassStart = -1;
      var classStart = -1;
      var cs;
      var pl;
      var sp;
      // . and .. never match anything that doesn't start with .,
      // even when options.dot is set.  However, if the pattern
      // starts with ., then traversal patterns can match.
      var dotTravAllowed = pattern.charAt(0) === '.';
      var dotFileAllowed = options.dot || dotTravAllowed;
      var patternStart = function patternStart() {
        return dotTravAllowed ? '' : dotFileAllowed ? '(?!(?:^|\\/)\\.{1,2}(?:$|\\/))' : '(?!\\.)';
      };
      var subPatternStart = function subPatternStart(p) {
        return p.charAt(0) === '.' ? '' : options.dot ? '(?!(?:^|\\/)\\.{1,2}(?:$|\\/))' : '(?!\\.)';
      };
      var clearStateChar = function clearStateChar() {
        if (stateChar) {
          // we had some state-tracking character
          // that wasn't consumed by this pass.
          switch (stateChar) {
            case '*':
              re += star;
              hasMagic = true;
              break;
            case '?':
              re += qmark;
              hasMagic = true;
              break;
            default:
              re += '\\' + stateChar;
              break;
          }
          _this2.debug('clearStateChar %j %j', stateChar, re);
          stateChar = false;
        }
      };
      for (var i = 0, c; i < pattern.length && (c = pattern.charAt(i)); i++) {
        this.debug('%s\t%s %s %j', pattern, i, re, c);

        // skip over any that are escaped.
        if (escaping) {
          /* istanbul ignore next - completely not allowed, even escaped. */
          if (c === '/') {
            return false;
          }
          if (reSpecials[c]) {
            re += '\\';
          }
          re += c;
          escaping = false;
          continue;
        }
        switch (c) {
          /* istanbul ignore next */
          case '/':
            {
              // Should already be path-split by now.
              return false;
            }
          case '\\':
            if (inClass && pattern.charAt(i + 1) === '-') {
              re += c;
              continue;
            }
            clearStateChar();
            escaping = true;
            continue;

          // the various stateChar values
          // for the "extglob" stuff.
          case '?':
          case '*':
          case '+':
          case '@':
          case '!':
            this.debug('%s\t%s %s %j <-- stateChar', pattern, i, re, c);

            // all of those are literals inside a class, except that
            // the glob [!a] means [^a] in regexp
            if (inClass) {
              this.debug('  in class');
              if (c === '!' && i === classStart + 1) c = '^';
              re += c;
              continue;
            }

            // if we already have a stateChar, then it means
            // that there was something like ** or +? in there.
            // Handle the stateChar, then proceed with this one.
            this.debug('call clearStateChar %j', stateChar);
            clearStateChar();
            stateChar = c;
            // if extglob is disabled, then +(asdf|foo) isn't a thing.
            // just clear the statechar *now*, rather than even diving into
            // the patternList stuff.
            if (options.noext) clearStateChar();
            continue;
          case '(':
            {
              if (inClass) {
                re += '(';
                continue;
              }
              if (!stateChar) {
                re += '\\(';
                continue;
              }
              var plEntry = {
                type: stateChar,
                start: i - 1,
                reStart: re.length,
                open: plTypes[stateChar].open,
                close: plTypes[stateChar].close
              };
              this.debug(this.pattern, '\t', plEntry);
              patternListStack.push(plEntry);
              // negation is (?:(?!(?:js)(?:<rest>))[^/]*)
              re += plEntry.open;
              // next entry starts with a dot maybe?
              if (plEntry.start === 0 && plEntry.type !== '!') {
                dotTravAllowed = true;
                re += subPatternStart(pattern.slice(i + 1));
              }
              this.debug('plType %j %j', stateChar, re);
              stateChar = false;
              continue;
            }
          case ')':
            {
              var _plEntry = patternListStack[patternListStack.length - 1];
              if (inClass || !_plEntry) {
                re += '\\)';
                continue;
              }
              patternListStack.pop();

              // closing an extglob
              clearStateChar();
              hasMagic = true;
              pl = _plEntry;
              // negation is (?:(?!js)[^/]*)
              // The others are (?:<pattern>)<type>
              re += pl.close;
              if (pl.type === '!') {
                negativeLists.push(Object.assign(pl, {
                  reEnd: re.length
                }));
              }
              continue;
            }
          case '|':
            {
              var _plEntry2 = patternListStack[patternListStack.length - 1];
              if (inClass || !_plEntry2) {
                re += '\\|';
                continue;
              }
              clearStateChar();
              re += '|';
              // next subpattern can start with a dot?
              if (_plEntry2.start === 0 && _plEntry2.type !== '!') {
                dotTravAllowed = true;
                re += subPatternStart(pattern.slice(i + 1));
              }
              continue;
            }

          // these are mostly the same in regexp and glob
          case '[':
            // swallow any state-tracking char before the [
            clearStateChar();
            if (inClass) {
              re += '\\' + c;
              continue;
            }
            inClass = true;
            classStart = i;
            reClassStart = re.length;
            re += c;
            continue;
          case ']':
            //  a right bracket shall lose its special
            //  meaning and represent itself in
            //  a bracket expression if it occurs
            //  first in the list.  -- POSIX.2 2.8.3.2
            if (i === classStart + 1 || !inClass) {
              re += '\\' + c;
              continue;
            }

            // split where the last [ was, make sure we don't have
            // an invalid re. if so, re-walk the contents of the
            // would-be class to re-translate any characters that
            // were passed through as-is
            // TODO: It would probably be faster to determine this
            // without a try/catch and a new RegExp, but it's tricky
            // to do safely.  For now, this is safe and works.
            cs = pattern.substring(classStart + 1, i);
            try {
              RegExp('[' + braExpEscape(charUnescape(cs)) + ']');
              // looks good, finish up the class.
              re += c;
            } catch (er) {
              // out of order ranges in JS are errors, but in glob syntax,
              // they're just a range that matches nothing.
              re = re.substring(0, reClassStart) + '(?:$.)'; // match nothing ever
            }
            hasMagic = true;
            inClass = false;
            continue;
          default:
            // swallow any state char that wasn't consumed
            clearStateChar();
            if (reSpecials[c] && !(c === '^' && inClass)) {
              re += '\\';
            }
            re += c;
            break;
        } // switch
      } // for

      // handle the case where we left a class open.
      // "[abc" is valid, equivalent to "\[abc"
      if (inClass) {
        // split where the last [ was, and escape it
        // this is a huge pita.  We now have to re-walk
        // the contents of the would-be class to re-translate
        // any characters that were passed through as-is
        cs = pattern.slice(classStart + 1);
        sp = this.parse(cs, SUBPARSE);
        re = re.substring(0, reClassStart) + '\\[' + sp[0];
        hasMagic = hasMagic || sp[1];
      }

      // handle the case where we had a +( thing at the *end*
      // of the pattern.
      // each pattern list stack adds 3 chars, and we need to go through
      // and escape any | chars that were passed through as-is for the regexp.
      // Go through and escape them, taking care not to double-escape any
      // | chars that were already escaped.
      for (pl = patternListStack.pop(); pl; pl = patternListStack.pop()) {
        var tail = void 0;
        tail = re.slice(pl.reStart + pl.open.length);
        this.debug('setting tail', re, pl);
        // maybe some even number of \, then maybe 1 \, followed by a |
        tail = tail.replace(/((?:\\{2}){0,64})(\\?)\|/g, function (_, $1, $2) {
          /* istanbul ignore else - should already be done */
          if (!$2) {
            // the | isn't already escaped, so escape it.
            $2 = '\\';
          }

          // need to escape all those slashes *again*, without escaping the
          // one that we need for escaping the | character.  As it works out,
          // escaping an even number of slashes can be done by simply repeating
          // it exactly after itself.  That's why this trick works.
          //
          // I am sorry that you have to see this.
          return $1 + $1 + $2 + '|';
        });
        this.debug('tail=%j\n   %s', tail, tail, pl, re);
        var t = pl.type === '*' ? star : pl.type === '?' ? qmark : '\\' + pl.type;
        hasMagic = true;
        re = re.slice(0, pl.reStart) + t + '\\(' + tail;
      }

      // handle trailing things that only matter at the very end.
      clearStateChar();
      if (escaping) {
        // trailing \\
        re += '\\\\';
      }

      // only need to apply the nodot start if the re starts with
      // something that could conceivably capture a dot
      var addPatternStart = addPatternStartSet[re.charAt(0)];

      // Hack to work around lack of negative lookbehind in JS
      // A pattern like: *.!(x).!(y|z) needs to ensure that a name
      // like 'a.xyz.yz' doesn't match.  So, the first negative
      // lookahead, has to look ALL the way ahead, to the end of
      // the pattern.
      for (var n = negativeLists.length - 1; n > -1; n--) {
        var nl = negativeLists[n];
        var nlBefore = re.slice(0, nl.reStart);
        var nlFirst = re.slice(nl.reStart, nl.reEnd - 8);
        var nlAfter = re.slice(nl.reEnd);
        var nlLast = re.slice(nl.reEnd - 8, nl.reEnd) + nlAfter;

        // Handle nested stuff like *(*.js|!(*.json)), where open parens
        // mean that we should *not* include the ) in the bit that is considered
        // "after" the negated section.
        var closeParensBefore = nlBefore.split(')').length;
        var openParensBefore = nlBefore.split('(').length - closeParensBefore;
        var cleanAfter = nlAfter;
        for (var _i = 0; _i < openParensBefore; _i++) {
          cleanAfter = cleanAfter.replace(/\)[+*?]?/, '');
        }
        nlAfter = cleanAfter;
        var dollar = nlAfter === '' && isSub !== SUBPARSE ? '(?:$|\\/)' : '';
        re = nlBefore + nlFirst + nlAfter + dollar + nlLast;
      }

      // if the re is not "" at this point, then we need to make sure
      // it doesn't match against an empty path part.
      // Otherwise a/* will match a/, which it should not.
      if (re !== '' && hasMagic) {
        re = '(?=.)' + re;
      }
      if (addPatternStart) {
        re = patternStart() + re;
      }

      // parsing just a piece of a larger pattern.
      if (isSub === SUBPARSE) {
        return [re, hasMagic];
      }

      // if it's nocase, and the lcase/uppercase don't match, it's magic
      if (options.nocase && !hasMagic) {
        hasMagic = pattern.toUpperCase() !== pattern.toLowerCase();
      }

      // skip the regexp for non-magical patterns
      // unescape anything in it, though, so that it'll be
      // an exact match against a file etc.
      if (!hasMagic) {
        return globUnescape(pattern);
      }
      var flags = options.nocase ? 'i' : '';
      try {
        return Object.assign(new RegExp('^' + re + '$', flags), {
          _glob: pattern,
          _src: re
        });
      } catch (er) /* istanbul ignore next - should be impossible */{
        // If it was an invalid regular expression, then it can't match
        // anything.  This trick looks for a character after the end of
        // the string, which is of course impossible, except in multi-line
        // mode, but it's not a /m regex.
        return new RegExp('$.');
      }
    }
  }, {
    key: "makeRe",
    value: function makeRe() {
      if (this.regexp || this.regexp === false) return this.regexp;

      // at this point, this.set is a 2d array of partial
      // pattern strings, or "**".
      //
      // It's better to use .match().  This function shouldn't
      // be used, really, but it's pretty convenient sometimes,
      // when you just want to work with a regex.
      var set = this.set;
      if (!set.length) {
        this.regexp = false;
        return this.regexp;
      }
      var options = this.options;
      var twoStar = options.noglobstar ? star : options.dot ? twoStarDot : twoStarNoDot;
      var flags = options.nocase ? 'i' : '';

      // coalesce globstars and regexpify non-globstar patterns
      // if it's the only item, then we just do one twoStar
      // if it's the first, and there are more, prepend (\/|twoStar\/)? to next
      // if it's the last, append (\/twoStar|) to previous
      // if it's in the middle, append (\/|\/twoStar\/) to previous
      // then filter out GLOBSTAR symbols
      var re = set.map(function (pattern) {
        pattern = pattern.map(function (p) {
          return typeof p === 'string' ? regExpEscape(p) : p === GLOBSTAR ? GLOBSTAR : p._src;
        }).reduce(function (set, p) {
          if (!(set[set.length - 1] === GLOBSTAR && p === GLOBSTAR)) {
            set.push(p);
          }
          return set;
        }, []);
        pattern.forEach(function (p, i) {
          if (p !== GLOBSTAR || pattern[i - 1] === GLOBSTAR) {
            return;
          }
          if (i === 0) {
            if (pattern.length > 1) {
              pattern[i + 1] = '(?:\\\/|' + twoStar + '\\\/)?' + pattern[i + 1];
            } else {
              pattern[i] = twoStar;
            }
          } else if (i === pattern.length - 1) {
            pattern[i - 1] += '(?:\\\/|' + twoStar + ')?';
          } else {
            pattern[i - 1] += '(?:\\\/|\\\/' + twoStar + '\\\/)' + pattern[i + 1];
            pattern[i + 1] = GLOBSTAR;
          }
        });
        return pattern.filter(function (p) {
          return p !== GLOBSTAR;
        }).join('/');
      }).join('|');

      // must match entire pattern
      // ending in a * or ** will make it less strict.
      re = '^(?:' + re + ')$';

      // can match anything, as long as it's not this.
      if (this.negate) re = '^(?!' + re + ').*$';
      try {
        this.regexp = new RegExp(re, flags);
      } catch (ex) /* istanbul ignore next - should be impossible */{
        this.regexp = false;
      }
      return this.regexp;
    }
  }, {
    key: "match",
    value: function match(f) {
      var partial = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.partial;
      this.debug('match', f, this.pattern);
      // short-circuit in the case of busted things.
      // comments, etc.
      if (this.comment) return false;
      if (this.empty) return f === '';
      if (f === '/' && partial) return true;
      var options = this.options;

      // windows: need to use /, not \
      if (path.sep !== '/') {
        f = f.split(path.sep).join('/');
      }

      // treat the test path as a set of pathparts.
      f = f.split(slashSplit);
      this.debug(this.pattern, 'split', f);

      // just ONE of the pattern sets in this.set needs to match
      // in order for it to be valid.  If negating, then just one
      // match means that we have failed.
      // Either way, return on the first hit.

      var set = this.set;
      this.debug(this.pattern, 'set', set);

      // Find the basename of the path by looking for the last non-empty segment
      var filename;
      for (var i = f.length - 1; i >= 0; i--) {
        filename = f[i];
        if (filename) break;
      }
      for (var _i2 = 0; _i2 < set.length; _i2++) {
        var pattern = set[_i2];
        var file = f;
        if (options.matchBase && pattern.length === 1) {
          file = [filename];
        }
        var hit = this.matchOne(file, pattern, partial);
        if (hit) {
          if (options.flipNegate) return true;
          return !this.negate;
        }
      }

      // didn't get any hits.  this is success if it's a negative
      // pattern, failure otherwise.
      if (options.flipNegate) return false;
      return this.negate;
    }
  }], [{
    key: "defaults",
    value: function defaults(def) {
      return minimatch.defaults(def).Minimatch;
    }
  }]);
}();
minimatch.Minimatch = Minimatch;

/***/ }),

/***/ "./node_modules/nested-property/dist/nested-property.js":
/*!**************************************************************!*\
  !*** ./node_modules/nested-property/dist/nested-property.js ***!
  \**************************************************************/
/***/ ((module) => {

"use strict";
/**
* @license nested-property https://github.com/cosmosio/nested-property
*
* The MIT License (MIT)
*
* Copyright (c) 2014-2020 Olivier Scherrer <pode.fr@gmail.com>
*/


function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }
  return _typeof(obj);
}
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }
  return _assertThisInitialized(self);
}
function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }
  return self;
}
function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}
function _wrapNativeSuper(Class) {
  var _cache = typeof Map === "function" ? new Map() : undefined;
  _wrapNativeSuper = function _wrapNativeSuper(Class) {
    if (Class === null || !_isNativeFunction(Class)) return Class;
    if (typeof Class !== "function") {
      throw new TypeError("Super expression must either be null or a function");
    }
    if (typeof _cache !== "undefined") {
      if (_cache.has(Class)) return _cache.get(Class);
      _cache.set(Class, Wrapper);
    }
    function Wrapper() {
      return _construct(Class, arguments, _getPrototypeOf(this).constructor);
    }
    Wrapper.prototype = Object.create(Class.prototype, {
      constructor: {
        value: Wrapper,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    return _setPrototypeOf(Wrapper, Class);
  };
  return _wrapNativeSuper(Class);
}
function _construct(Parent, args, Class) {
  if (_isNativeReflectConstruct()) {
    _construct = Reflect.construct;
  } else {
    _construct = function _construct(Parent, args, Class) {
      var a = [null];
      a.push.apply(a, args);
      var Constructor = Function.bind.apply(Parent, a);
      var instance = new Constructor();
      if (Class) _setPrototypeOf(instance, Class.prototype);
      return instance;
    };
  }
  return _construct.apply(null, arguments);
}
function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;
  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}
function _isNativeFunction(fn) {
  return Function.toString.call(fn).indexOf("[native code]") !== -1;
}
function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };
  return _setPrototypeOf(o, p);
}
function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}
var ARRAY_WILDCARD = "+";
var PATH_DELIMITER = ".";
var ObjectPrototypeMutationError = /*#__PURE__*/function (_Error) {
  _inherits(ObjectPrototypeMutationError, _Error);
  function ObjectPrototypeMutationError(params) {
    var _this;
    _classCallCheck(this, ObjectPrototypeMutationError);
    _this = _possibleConstructorReturn(this, _getPrototypeOf(ObjectPrototypeMutationError).call(this, params));
    _this.name = "ObjectPrototypeMutationError";
    return _this;
  }
  return ObjectPrototypeMutationError;
}(_wrapNativeSuper(Error));
module.exports = {
  set: setNestedProperty,
  get: getNestedProperty,
  has: hasNestedProperty,
  hasOwn: function hasOwn(object, property, options) {
    return this.has(object, property, options || {
      own: true
    });
  },
  isIn: isInNestedProperty,
  ObjectPrototypeMutationError: ObjectPrototypeMutationError
};
/**
 * Get the property of an object nested in one or more objects or array
 * Given an object such as a.b.c.d = 5, getNestedProperty(a, "b.c.d") will return 5.
 * It also works through arrays. Given a nested array such as a[0].b = 5, getNestedProperty(a, "0.b") will return 5.
 * For accessing nested properties through all items in an array, you may use the array wildcard "+".
 * For instance, getNestedProperty([{a:1}, {a:2}, {a:3}], "+.a") will return [1, 2, 3]
 * @param {Object} object the object to get the property from
 * @param {String} property the path to the property as a string
 * @returns the object or the the property value if found
 */

function getNestedProperty(object, property) {
  if (_typeof(object) != "object" || object === null) {
    return object;
  }
  if (typeof property == "undefined") {
    return object;
  }
  if (typeof property == "number") {
    return object[property];
  }
  try {
    return traverse(object, property, function _getNestedProperty(currentObject, currentProperty) {
      return currentObject[currentProperty];
    });
  } catch (err) {
    return object;
  }
}
/**
 * Tell if a nested object has a given property (or array a given index)
 * given an object such as a.b.c.d = 5, hasNestedProperty(a, "b.c.d") will return true.
 * It also returns true if the property is in the prototype chain.
 * @param {Object} object the object to get the property from
 * @param {String} property the path to the property as a string
 * @param {Object} options:
 *  - own: set to reject properties from the prototype
 * @returns true if has (property in object), false otherwise
 */

function hasNestedProperty(object, property) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  if (_typeof(object) != "object" || object === null) {
    return false;
  }
  if (typeof property == "undefined") {
    return false;
  }
  if (typeof property == "number") {
    return property in object;
  }
  try {
    var has = false;
    traverse(object, property, function _hasNestedProperty(currentObject, currentProperty, segments, index) {
      if (isLastSegment(segments, index)) {
        if (options.own) {
          has = currentObject.hasOwnProperty(currentProperty);
        } else {
          has = currentProperty in currentObject;
        }
      } else {
        return currentObject && currentObject[currentProperty];
      }
    });
    return has;
  } catch (err) {
    return false;
  }
}
/**
 * Set the property of an object nested in one or more objects
 * If the property doesn't exist, it gets created.
 * @param {Object} object
 * @param {String} property
 * @param value the value to set
 * @returns object if no assignment was made or the value if the assignment was made
 */

function setNestedProperty(object, property, value) {
  if (_typeof(object) != "object" || object === null) {
    return object;
  }
  if (typeof property == "undefined") {
    return object;
  }
  if (typeof property == "number") {
    object[property] = value;
    return object[property];
  }
  try {
    return traverse(object, property, function _setNestedProperty(currentObject, currentProperty, segments, index) {
      if (currentObject === Reflect.getPrototypeOf({})) {
        throw new ObjectPrototypeMutationError("Attempting to mutate Object.prototype");
      }
      if (!currentObject[currentProperty]) {
        var nextPropIsNumber = Number.isInteger(Number(segments[index + 1]));
        var nextPropIsArrayWildcard = segments[index + 1] === ARRAY_WILDCARD;
        if (nextPropIsNumber || nextPropIsArrayWildcard) {
          currentObject[currentProperty] = [];
        } else {
          currentObject[currentProperty] = {};
        }
      }
      if (isLastSegment(segments, index)) {
        currentObject[currentProperty] = value;
      }
      return currentObject[currentProperty];
    });
  } catch (err) {
    if (err instanceof ObjectPrototypeMutationError) {
      // rethrow
      throw err;
    } else {
      return object;
    }
  }
}
/**
 * Tell if an object is on the path to a nested property
 * If the object is on the path, and the path exists, it returns true, and false otherwise.
 * @param {Object} object to get the nested property from
 * @param {String} property name of the nested property
 * @param {Object} objectInPath the object to check
 * @param {Object} options:
 *  - validPath: return false if the path is invalid, even if the object is in the path
 * @returns {boolean} true if the object is on the path
 */

function isInNestedProperty(object, property, objectInPath) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  if (_typeof(object) != "object" || object === null) {
    return false;
  }
  if (typeof property == "undefined") {
    return false;
  }
  try {
    var isIn = false,
      pathExists = false;
    traverse(object, property, function _isInNestedProperty(currentObject, currentProperty, segments, index) {
      isIn = isIn || currentObject === objectInPath || !!currentObject && currentObject[currentProperty] === objectInPath;
      pathExists = isLastSegment(segments, index) && _typeof(currentObject) === "object" && currentProperty in currentObject;
      return currentObject && currentObject[currentProperty];
    });
    if (options.validPath) {
      return isIn && pathExists;
    } else {
      return isIn;
    }
  } catch (err) {
    return false;
  }
}
function traverse(object, path) {
  var callback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function () {};
  var segments = path.split(PATH_DELIMITER);
  var length = segments.length;
  var _loop = function _loop(idx) {
    var currentSegment = segments[idx];
    if (!object) {
      return {
        v: void 0
      };
    }
    if (currentSegment === ARRAY_WILDCARD) {
      if (Array.isArray(object)) {
        return {
          v: object.map(function (value, index) {
            var remainingSegments = segments.slice(idx + 1);
            if (remainingSegments.length > 0) {
              return traverse(value, remainingSegments.join(PATH_DELIMITER), callback);
            } else {
              return callback(object, index, segments, idx);
            }
          })
        };
      } else {
        var pathToHere = segments.slice(0, idx).join(PATH_DELIMITER);
        throw new Error("Object at wildcard (".concat(pathToHere, ") is not an array"));
      }
    } else {
      object = callback(object, currentSegment, segments, idx);
    }
  };
  for (var idx = 0; idx < length; idx++) {
    var _ret = _loop(idx);
    if (_typeof(_ret) === "object") return _ret.v;
  }
  return object;
}
function isLastSegment(segments, index) {
  return segments.length === index + 1;
}

/***/ }),

/***/ "./node_modules/path-posix/index.js":
/*!******************************************!*\
  !*** ./node_modules/path-posix/index.js ***!
  \******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var process = __webpack_require__(/*! process/browser */ "./node_modules/process/browser.js");
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var util = __webpack_require__(/*! util */ "./node_modules/util/util.js");
var isString = function isString(x) {
  return typeof x === 'string';
};

// resolves . and .. elements in a path array with directory names there
// must be no slashes or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  var res = [];
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i];

    // ignore empty parts
    if (!p || p === '.') continue;
    if (p === '..') {
      if (res.length && res[res.length - 1] !== '..') {
        res.pop();
      } else if (allowAboveRoot) {
        res.push('..');
      }
    } else {
      res.push(p);
    }
  }
  return res;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var posix = {};
function posixSplitPath(filename) {
  return splitPathRe.exec(filename).slice(1);
}

// path.resolve([from ...], to)
// posix version
posix.resolve = function () {
  var resolvedPath = '',
    resolvedAbsolute = false;
  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = i >= 0 ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (!isString(path)) {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }
    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(resolvedPath.split('/'), !resolvedAbsolute).join('/');
  return (resolvedAbsolute ? '/' : '') + resolvedPath || '.';
};

// path.normalize(path)
// posix version
posix.normalize = function (path) {
  var isAbsolute = posix.isAbsolute(path),
    trailingSlash = path.substr(-1) === '/';

  // Normalize the path
  path = normalizeArray(path.split('/'), !isAbsolute).join('/');
  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  return (isAbsolute ? '/' : '') + path;
};

// posix version
posix.isAbsolute = function (path) {
  return path.charAt(0) === '/';
};

// posix version
posix.join = function () {
  var path = '';
  for (var i = 0; i < arguments.length; i++) {
    var segment = arguments[i];
    if (!isString(segment)) {
      throw new TypeError('Arguments to path.join must be strings');
    }
    if (segment) {
      if (!path) {
        path += segment;
      } else {
        path += '/' + segment;
      }
    }
  }
  return posix.normalize(path);
};

// path.relative(from, to)
// posix version
posix.relative = function (from, to) {
  from = posix.resolve(from).substr(1);
  to = posix.resolve(to).substr(1);
  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }
    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }
    if (start > end) return [];
    return arr.slice(start, end + 1);
  }
  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));
  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }
  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }
  outputParts = outputParts.concat(toParts.slice(samePartsLength));
  return outputParts.join('/');
};
posix._makeLong = function (path) {
  return path;
};
posix.dirname = function (path) {
  var result = posixSplitPath(path),
    root = result[0],
    dir = result[1];
  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }
  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }
  return root + dir;
};
posix.basename = function (path, ext) {
  var f = posixSplitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};
posix.extname = function (path) {
  return posixSplitPath(path)[3];
};
posix.format = function (pathObject) {
  if (!util.isObject(pathObject)) {
    throw new TypeError("Parameter 'pathObject' must be an object, not " + _typeof(pathObject));
  }
  var root = pathObject.root || '';
  if (!isString(root)) {
    throw new TypeError("'pathObject.root' must be a string or undefined, not " + _typeof(pathObject.root));
  }
  var dir = pathObject.dir ? pathObject.dir + posix.sep : '';
  var base = pathObject.base || '';
  return dir + base;
};
posix.parse = function (pathString) {
  if (!isString(pathString)) {
    throw new TypeError("Parameter 'pathString' must be a string, not " + _typeof(pathString));
  }
  var allParts = posixSplitPath(pathString);
  if (!allParts || allParts.length !== 4) {
    throw new TypeError("Invalid path '" + pathString + "'");
  }
  allParts[1] = allParts[1] || '';
  allParts[2] = allParts[2] || '';
  allParts[3] = allParts[3] || '';
  return {
    root: allParts[0],
    dir: allParts[0] + allParts[1].slice(0, allParts[1].length - 1),
    base: allParts[2],
    ext: allParts[3],
    name: allParts[2].slice(0, allParts[2].length - allParts[3].length)
  };
};
posix.sep = '/';
posix.delimiter = ':';
module.exports = posix;

/***/ }),

/***/ "./node_modules/possible-typed-array-names/index.js":
/*!**********************************************************!*\
  !*** ./node_modules/possible-typed-array-names/index.js ***!
  \**********************************************************/
/***/ ((module) => {

"use strict";


/** @type {import('.')} */
module.exports = ['Float16Array', 'Float32Array', 'Float64Array', 'Int8Array', 'Int16Array', 'Int32Array', 'Uint8Array', 'Uint8ClampedArray', 'Uint16Array', 'Uint32Array', 'BigInt64Array', 'BigUint64Array'];

/***/ }),

/***/ "./node_modules/process/browser.js":
/*!*****************************************!*\
  !*** ./node_modules/process/browser.js ***!
  \*****************************************/
/***/ ((module) => {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;
function defaultSetTimout() {
  throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout() {
  throw new Error('clearTimeout has not been defined');
}
(function () {
  try {
    if (typeof setTimeout === 'function') {
      cachedSetTimeout = setTimeout;
    } else {
      cachedSetTimeout = defaultSetTimout;
    }
  } catch (e) {
    cachedSetTimeout = defaultSetTimout;
  }
  try {
    if (typeof clearTimeout === 'function') {
      cachedClearTimeout = clearTimeout;
    } else {
      cachedClearTimeout = defaultClearTimeout;
    }
  } catch (e) {
    cachedClearTimeout = defaultClearTimeout;
  }
})();
function runTimeout(fun) {
  if (cachedSetTimeout === setTimeout) {
    //normal enviroments in sane situations
    return setTimeout(fun, 0);
  }
  // if setTimeout wasn't available but was latter defined
  if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
    cachedSetTimeout = setTimeout;
    return setTimeout(fun, 0);
  }
  try {
    // when when somebody has screwed with setTimeout but no I.E. maddness
    return cachedSetTimeout(fun, 0);
  } catch (e) {
    try {
      // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
      return cachedSetTimeout.call(null, fun, 0);
    } catch (e) {
      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
      return cachedSetTimeout.call(this, fun, 0);
    }
  }
}
function runClearTimeout(marker) {
  if (cachedClearTimeout === clearTimeout) {
    //normal enviroments in sane situations
    return clearTimeout(marker);
  }
  // if clearTimeout wasn't available but was latter defined
  if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
    cachedClearTimeout = clearTimeout;
    return clearTimeout(marker);
  }
  try {
    // when when somebody has screwed with setTimeout but no I.E. maddness
    return cachedClearTimeout(marker);
  } catch (e) {
    try {
      // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
      return cachedClearTimeout.call(null, marker);
    } catch (e) {
      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
      // Some versions of I.E. have different rules for clearTimeout vs setTimeout
      return cachedClearTimeout.call(this, marker);
    }
  }
}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;
function cleanUpNextTick() {
  if (!draining || !currentQueue) {
    return;
  }
  draining = false;
  if (currentQueue.length) {
    queue = currentQueue.concat(queue);
  } else {
    queueIndex = -1;
  }
  if (queue.length) {
    drainQueue();
  }
}
function drainQueue() {
  if (draining) {
    return;
  }
  var timeout = runTimeout(cleanUpNextTick);
  draining = true;
  var len = queue.length;
  while (len) {
    currentQueue = queue;
    queue = [];
    while (++queueIndex < len) {
      if (currentQueue) {
        currentQueue[queueIndex].run();
      }
    }
    queueIndex = -1;
    len = queue.length;
  }
  currentQueue = null;
  draining = false;
  runClearTimeout(timeout);
}
process.nextTick = function (fun) {
  var args = new Array(arguments.length - 1);
  if (arguments.length > 1) {
    for (var i = 1; i < arguments.length; i++) {
      args[i - 1] = arguments[i];
    }
  }
  queue.push(new Item(fun, args));
  if (queue.length === 1 && !draining) {
    runTimeout(drainQueue);
  }
};

// v8 likes predictible objects
function Item(fun, array) {
  this.fun = fun;
  this.array = array;
}
Item.prototype.run = function () {
  this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};
function noop() {}
process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;
process.listeners = function (name) {
  return [];
};
process.binding = function (name) {
  throw new Error('process.binding is not supported');
};
process.cwd = function () {
  return '/';
};
process.chdir = function (dir) {
  throw new Error('process.chdir is not supported');
};
process.umask = function () {
  return 0;
};

/***/ }),

/***/ "./node_modules/querystringify/index.js":
/*!**********************************************!*\
  !*** ./node_modules/querystringify/index.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


var has = Object.prototype.hasOwnProperty,
  undef;

/**
 * Decode a URI encoded string.
 *
 * @param {String} input The URI encoded string.
 * @returns {String|Null} The decoded string.
 * @api private
 */
function decode(input) {
  try {
    return decodeURIComponent(input.replace(/\+/g, ' '));
  } catch (e) {
    return null;
  }
}

/**
 * Attempts to encode a given input.
 *
 * @param {String} input The string that needs to be encoded.
 * @returns {String|Null} The encoded string.
 * @api private
 */
function encode(input) {
  try {
    return encodeURIComponent(input);
  } catch (e) {
    return null;
  }
}

/**
 * Simple query string parser.
 *
 * @param {String} query The query string that needs to be parsed.
 * @returns {Object}
 * @api public
 */
function querystring(query) {
  var parser = /([^=?#&]+)=?([^&]*)/g,
    result = {},
    part;
  while (part = parser.exec(query)) {
    var key = decode(part[1]),
      value = decode(part[2]);

    //
    // Prevent overriding of existing properties. This ensures that build-in
    // methods like `toString` or __proto__ are not overriden by malicious
    // querystrings.
    //
    // In the case if failed decoding, we want to omit the key/value pairs
    // from the result.
    //
    if (key === null || value === null || key in result) continue;
    result[key] = value;
  }
  return result;
}

/**
 * Transform a query string to an object.
 *
 * @param {Object} obj Object that should be transformed.
 * @param {String} prefix Optional prefix.
 * @returns {String}
 * @api public
 */
function querystringify(obj, prefix) {
  prefix = prefix || '';
  var pairs = [],
    value,
    key;

  //
  // Optionally prefix with a '?' if needed
  //
  if ('string' !== typeof prefix) prefix = '?';
  for (key in obj) {
    if (has.call(obj, key)) {
      value = obj[key];

      //
      // Edge cases where we actually want to encode the value to an empty
      // string instead of the stringified value.
      //
      if (!value && (value === null || value === undef || isNaN(value))) {
        value = '';
      }
      key = encode(key);
      value = encode(value);

      //
      // If we failed to encode the strings, we should bail out as we don't
      // want to add invalid strings to the query.
      //
      if (key === null || value === null) continue;
      pairs.push(key + '=' + value);
    }
  }
  return pairs.length ? prefix + pairs.join('&') : '';
}

//
// Expose the module.
//
exports.stringify = querystringify;
exports.parse = querystring;

/***/ }),

/***/ "./node_modules/readable-stream/errors-browser.js":
/*!********************************************************!*\
  !*** ./node_modules/readable-stream/errors-browser.js ***!
  \********************************************************/
/***/ ((module) => {

"use strict";


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  subClass.__proto__ = superClass;
}
var codes = {};
function createErrorType(code, message, Base) {
  if (!Base) {
    Base = Error;
  }
  function getMessage(arg1, arg2, arg3) {
    if (typeof message === 'string') {
      return message;
    } else {
      return message(arg1, arg2, arg3);
    }
  }
  var NodeError = /*#__PURE__*/
  function (_Base) {
    _inheritsLoose(NodeError, _Base);
    function NodeError(arg1, arg2, arg3) {
      return _Base.call(this, getMessage(arg1, arg2, arg3)) || this;
    }
    return NodeError;
  }(Base);
  NodeError.prototype.name = Base.name;
  NodeError.prototype.code = code;
  codes[code] = NodeError;
} // https://github.com/nodejs/node/blob/v10.8.0/lib/internal/errors.js

function oneOf(expected, thing) {
  if (Array.isArray(expected)) {
    var len = expected.length;
    expected = expected.map(function (i) {
      return String(i);
    });
    if (len > 2) {
      return "one of ".concat(thing, " ").concat(expected.slice(0, len - 1).join(', '), ", or ") + expected[len - 1];
    } else if (len === 2) {
      return "one of ".concat(thing, " ").concat(expected[0], " or ").concat(expected[1]);
    } else {
      return "of ".concat(thing, " ").concat(expected[0]);
    }
  } else {
    return "of ".concat(thing, " ").concat(String(expected));
  }
} // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith

function startsWith(str, search, pos) {
  return str.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
} // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith

function endsWith(str, search, this_len) {
  if (this_len === undefined || this_len > str.length) {
    this_len = str.length;
  }
  return str.substring(this_len - search.length, this_len) === search;
} // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes

function includes(str, search, start) {
  if (typeof start !== 'number') {
    start = 0;
  }
  if (start + search.length > str.length) {
    return false;
  } else {
    return str.indexOf(search, start) !== -1;
  }
}
createErrorType('ERR_INVALID_OPT_VALUE', function (name, value) {
  return 'The value "' + value + '" is invalid for option "' + name + '"';
}, TypeError);
createErrorType('ERR_INVALID_ARG_TYPE', function (name, expected, actual) {
  // determiner: 'must be' or 'must not be'
  var determiner;
  if (typeof expected === 'string' && startsWith(expected, 'not ')) {
    determiner = 'must not be';
    expected = expected.replace(/^not /, '');
  } else {
    determiner = 'must be';
  }
  var msg;
  if (endsWith(name, ' argument')) {
    // For cases like 'first argument'
    msg = "The ".concat(name, " ").concat(determiner, " ").concat(oneOf(expected, 'type'));
  } else {
    var type = includes(name, '.') ? 'property' : 'argument';
    msg = "The \"".concat(name, "\" ").concat(type, " ").concat(determiner, " ").concat(oneOf(expected, 'type'));
  }
  msg += ". Received type ".concat(_typeof(actual));
  return msg;
}, TypeError);
createErrorType('ERR_STREAM_PUSH_AFTER_EOF', 'stream.push() after EOF');
createErrorType('ERR_METHOD_NOT_IMPLEMENTED', function (name) {
  return 'The ' + name + ' method is not implemented';
});
createErrorType('ERR_STREAM_PREMATURE_CLOSE', 'Premature close');
createErrorType('ERR_STREAM_DESTROYED', function (name) {
  return 'Cannot call ' + name + ' after a stream was destroyed';
});
createErrorType('ERR_MULTIPLE_CALLBACK', 'Callback called multiple times');
createErrorType('ERR_STREAM_CANNOT_PIPE', 'Cannot pipe, not readable');
createErrorType('ERR_STREAM_WRITE_AFTER_END', 'write after end');
createErrorType('ERR_STREAM_NULL_VALUES', 'May not write null values to stream', TypeError);
createErrorType('ERR_UNKNOWN_ENCODING', function (arg) {
  return 'Unknown encoding: ' + arg;
}, TypeError);
createErrorType('ERR_STREAM_UNSHIFT_AFTER_END_EVENT', 'stream.unshift() after end event');
module.exports.codes = codes;

/***/ }),

/***/ "./node_modules/readable-stream/lib/_stream_duplex.js":
/*!************************************************************!*\
  !*** ./node_modules/readable-stream/lib/_stream_duplex.js ***!
  \************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var process = __webpack_require__(/*! process/browser */ "./node_modules/process/browser.js");
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.



/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) keys.push(key);
  return keys;
};
/*</replacement>*/

module.exports = Duplex;
var Readable = __webpack_require__(/*! ./_stream_readable */ "./node_modules/readable-stream/lib/_stream_readable.js");
var Writable = __webpack_require__(/*! ./_stream_writable */ "./node_modules/readable-stream/lib/_stream_writable.js");
__webpack_require__(/*! inherits */ "./node_modules/inherits/inherits_browser.js")(Duplex, Readable);
{
  // Allow the keys array to be GC'ed.
  var keys = objectKeys(Writable.prototype);
  for (var v = 0; v < keys.length; v++) {
    var method = keys[v];
    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
  }
}
function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);
  Readable.call(this, options);
  Writable.call(this, options);
  this.allowHalfOpen = true;
  if (options) {
    if (options.readable === false) this.readable = false;
    if (options.writable === false) this.writable = false;
    if (options.allowHalfOpen === false) {
      this.allowHalfOpen = false;
      this.once('end', onend);
    }
  }
}
Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.highWaterMark;
  }
});
Object.defineProperty(Duplex.prototype, 'writableBuffer', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState && this._writableState.getBuffer();
  }
});
Object.defineProperty(Duplex.prototype, 'writableLength', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.length;
  }
});

// the no-half-open enforcer
function onend() {
  // If the writable side ended, then we're ok.
  if (this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  process.nextTick(onEndNT, this);
}
function onEndNT(self) {
  self.end();
}
Object.defineProperty(Duplex.prototype, 'destroyed', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    if (this._readableState === undefined || this._writableState === undefined) {
      return false;
    }
    return this._readableState.destroyed && this._writableState.destroyed;
  },
  set: function set(value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (this._readableState === undefined || this._writableState === undefined) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
    this._writableState.destroyed = value;
  }
});

/***/ }),

/***/ "./node_modules/readable-stream/lib/_stream_passthrough.js":
/*!*****************************************************************!*\
  !*** ./node_modules/readable-stream/lib/_stream_passthrough.js ***!
  \*****************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.



module.exports = PassThrough;
var Transform = __webpack_require__(/*! ./_stream_transform */ "./node_modules/readable-stream/lib/_stream_transform.js");
__webpack_require__(/*! inherits */ "./node_modules/inherits/inherits_browser.js")(PassThrough, Transform);
function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);
  Transform.call(this, options);
}
PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};

/***/ }),

/***/ "./node_modules/readable-stream/lib/_stream_readable.js":
/*!**************************************************************!*\
  !*** ./node_modules/readable-stream/lib/_stream_readable.js ***!
  \**************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var process = __webpack_require__(/*! process/browser */ "./node_modules/process/browser.js");
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



module.exports = Readable;

/*<replacement>*/
var Duplex;
/*</replacement>*/

Readable.ReadableState = ReadableState;

/*<replacement>*/
var EE = (__webpack_require__(/*! events */ "./node_modules/events/events.js").EventEmitter);
var EElistenerCount = function EElistenerCount(emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/
var Stream = __webpack_require__(/*! ./internal/streams/stream */ "./node_modules/readable-stream/lib/internal/streams/stream-browser.js");
/*</replacement>*/

var Buffer = (__webpack_require__(/*! buffer */ "./node_modules/buffer/index.js").Buffer);
var OurUint8Array = (typeof __webpack_require__.g !== 'undefined' ? __webpack_require__.g : typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : {}).Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*<replacement>*/
var debugUtil = __webpack_require__(/*! util */ "?d17e");
var debug;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function debug() {};
}
/*</replacement>*/

var BufferList = __webpack_require__(/*! ./internal/streams/buffer_list */ "./node_modules/readable-stream/lib/internal/streams/buffer_list.js");
var destroyImpl = __webpack_require__(/*! ./internal/streams/destroy */ "./node_modules/readable-stream/lib/internal/streams/destroy.js");
var _require = __webpack_require__(/*! ./internal/streams/state */ "./node_modules/readable-stream/lib/internal/streams/state.js"),
  getHighWaterMark = _require.getHighWaterMark;
var _require$codes = (__webpack_require__(/*! ../errors */ "./node_modules/readable-stream/errors-browser.js").codes),
  ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE,
  ERR_STREAM_PUSH_AFTER_EOF = _require$codes.ERR_STREAM_PUSH_AFTER_EOF,
  ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
  ERR_STREAM_UNSHIFT_AFTER_END_EVENT = _require$codes.ERR_STREAM_UNSHIFT_AFTER_END_EVENT;

// Lazy loaded to improve the startup performance.
var StringDecoder;
var createReadableStreamAsyncIterator;
var from;
__webpack_require__(/*! inherits */ "./node_modules/inherits/inherits_browser.js")(Readable, Stream);
var errorOrDestroy = destroyImpl.errorOrDestroy;
var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];
function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);

  // This is a hack to make sure that our error handler is attached before any
  // userland ones.  NEVER DO THIS. This is here only because this code needs
  // to continue to work with older versions of Node.js that do not include
  // the prependListener() method. The goal is to eventually remove this hack.
  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (Array.isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
}
function ReadableState(options, stream, isDuplex) {
  Duplex = Duplex || __webpack_require__(/*! ./_stream_duplex */ "./node_modules/readable-stream/lib/_stream_duplex.js");
  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  if (typeof isDuplex !== 'boolean') isDuplex = stream instanceof Duplex;

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;
  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  this.highWaterMark = getHighWaterMark(this, options, 'readableHighWaterMark', isDuplex);

  // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()
  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;
  this.paused = true;

  // Should close be emitted on destroy. Defaults to true.
  this.emitClose = options.emitClose !== false;

  // Should .destroy() be called after 'end' (and potentially 'finish')
  this.autoDestroy = !!options.autoDestroy;

  // has it been destroyed
  this.destroyed = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;
  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder) StringDecoder = (__webpack_require__(/*! string_decoder/ */ "./node_modules/string_decoder/lib/string_decoder.js").StringDecoder);
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}
function Readable(options) {
  Duplex = Duplex || __webpack_require__(/*! ./_stream_duplex */ "./node_modules/readable-stream/lib/_stream_duplex.js");
  if (!(this instanceof Readable)) return new Readable(options);

  // Checking for a Stream.Duplex instance is faster here instead of inside
  // the ReadableState constructor, at least with V8 6.5
  var isDuplex = this instanceof Duplex;
  this._readableState = new ReadableState(options, this, isDuplex);

  // legacy
  this.readable = true;
  if (options) {
    if (typeof options.read === 'function') this._read = options.read;
    if (typeof options.destroy === 'function') this._destroy = options.destroy;
  }
  Stream.call(this);
}
Object.defineProperty(Readable.prototype, 'destroyed', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    if (this._readableState === undefined) {
      return false;
    }
    return this._readableState.destroyed;
  },
  set: function set(value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._readableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
  }
});
Readable.prototype.destroy = destroyImpl.destroy;
Readable.prototype._undestroy = destroyImpl.undestroy;
Readable.prototype._destroy = function (err, cb) {
  cb(err);
};

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;
  var skipChunkCheck;
  if (!state.objectMode) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;
      if (encoding !== state.encoding) {
        chunk = Buffer.from(chunk, encoding);
        encoding = '';
      }
      skipChunkCheck = true;
    }
  } else {
    skipChunkCheck = true;
  }
  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  return readableAddChunk(this, chunk, null, true, false);
};
function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
  debug('readableAddChunk', chunk);
  var state = stream._readableState;
  if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else {
    var er;
    if (!skipChunkCheck) er = chunkInvalid(state, chunk);
    if (er) {
      errorOrDestroy(stream, er);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
        chunk = _uint8ArrayToBuffer(chunk);
      }
      if (addToFront) {
        if (state.endEmitted) errorOrDestroy(stream, new ERR_STREAM_UNSHIFT_AFTER_END_EVENT());else addChunk(stream, state, chunk, true);
      } else if (state.ended) {
        errorOrDestroy(stream, new ERR_STREAM_PUSH_AFTER_EOF());
      } else if (state.destroyed) {
        return false;
      } else {
        state.reading = false;
        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
        } else {
          addChunk(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.reading = false;
      maybeReadMore(stream, state);
    }
  }

  // We can push more data if we are below the highWaterMark.
  // Also, if we have no data yet, we can stand some more bytes.
  // This is to work around cases where hwm=0, such as the repl.
  return !state.ended && (state.length < state.highWaterMark || state.length === 0);
}
function addChunk(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync) {
    state.awaitDrain = 0;
    stream.emit('data', chunk);
  } else {
    // update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length;
    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);
    if (state.needReadable) emitReadable(stream);
  }
  maybeReadMore(stream, state);
}
function chunkInvalid(state, chunk) {
  var er;
  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new ERR_INVALID_ARG_TYPE('chunk', ['string', 'Buffer', 'Uint8Array'], chunk);
  }
  return er;
}
Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = (__webpack_require__(/*! string_decoder/ */ "./node_modules/string_decoder/lib/string_decoder.js").StringDecoder);
  var decoder = new StringDecoder(enc);
  this._readableState.decoder = decoder;
  // If setEncoding(null), decoder.encoding equals utf8
  this._readableState.encoding = this._readableState.decoder.encoding;

  // Iterate over current buffer to convert already stored Buffers:
  var p = this._readableState.buffer.head;
  var content = '';
  while (p !== null) {
    content += decoder.write(p.data);
    p = p.next;
  }
  this._readableState.buffer.clear();
  if (content !== '') this._readableState.buffer.push(content);
  this._readableState.length = content.length;
  return this;
};

// Don't raise the hwm > 1GB
var MAX_HWM = 0x40000000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    // TODO(ronag): Throw ERR_VALUE_OUT_OF_RANGE.
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;
  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  }
  // If we're asking for more than the current hwm, then raise the hwm.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n;
  // Don't have enough
  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }
  return state.length;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;
  if (n !== 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && ((state.highWaterMark !== 0 ? state.length >= state.highWaterMark : state.length > 0) || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }
  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
    // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.
    if (!state.reading) n = howMuchToRead(nOrig, state);
  }
  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;
  if (ret === null) {
    state.needReadable = state.length <= state.highWaterMark;
    n = 0;
  } else {
    state.length -= n;
    state.awaitDrain = 0;
  }
  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true;

    // If we tried to read() past the EOF, then emit end on the next tick.
    if (nOrig !== n && state.ended) endReadable(this);
  }
  if (ret !== null) this.emit('data', ret);
  return ret;
};
function onEofChunk(stream, state) {
  debug('onEofChunk');
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;
  if (state.sync) {
    // if we are sync, wait until next tick to emit the data.
    // Otherwise we risk emitting data in the flow()
    // the readable code triggers during a read() call
    emitReadable(stream);
  } else {
    // emit 'readable' now to make sure it gets picked up.
    state.needReadable = false;
    if (!state.emittedReadable) {
      state.emittedReadable = true;
      emitReadable_(stream);
    }
  }
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  debug('emitReadable', state.needReadable, state.emittedReadable);
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    process.nextTick(emitReadable_, stream);
  }
}
function emitReadable_(stream) {
  var state = stream._readableState;
  debug('emitReadable_', state.destroyed, state.length, state.ended);
  if (!state.destroyed && (state.length || state.ended)) {
    stream.emit('readable');
    state.emittedReadable = false;
  }

  // The stream needs another readable event if
  // 1. It is not flowing, as the flow mechanism will take
  //    care of it.
  // 2. It is not ended.
  // 3. It is below the highWaterMark, so we can schedule
  //    another readable later.
  state.needReadable = !state.flowing && !state.ended && state.length <= state.highWaterMark;
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    process.nextTick(maybeReadMore_, stream, state);
  }
}
function maybeReadMore_(stream, state) {
  // Attempt to read more data if we should.
  //
  // The conditions for reading more data are (one of):
  // - Not enough data buffered (state.length < state.highWaterMark). The loop
  //   is responsible for filling the buffer with enough data if such data
  //   is available. If highWaterMark is 0 and we are not in the flowing mode
  //   we should _not_ attempt to buffer any extra data. We'll get more data
  //   when the stream consumer calls read() instead.
  // - No data in the buffer, and the stream is in flowing mode. In this mode
  //   the loop below is responsible for ensuring read() is called. Failing to
  //   call read here would abort the flow and there's no other mechanism for
  //   continuing the flow if the stream consumer has just subscribed to the
  //   'data' event.
  //
  // In addition to the above conditions to keep reading data, the following
  // conditions prevent the data from being read:
  // - The stream has ended (state.ended).
  // - There is already a pending 'read' operation (state.reading). This is a
  //   case where the the stream has called the implementation defined _read()
  //   method, but they are processing the call asynchronously and have _not_
  //   called push() with new data. In this case we skip performing more
  //   read()s. The execution ends in this method again after the _read() ends
  //   up calling push() with more data.
  while (!state.reading && !state.ended && (state.length < state.highWaterMark || state.flowing && state.length === 0)) {
    var len = state.length;
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  errorOrDestroy(this, new ERR_METHOD_NOT_IMPLEMENTED('_read()'));
};
Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;
  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);
  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
  var endFn = doEnd ? onend : unpipe;
  if (state.endEmitted) process.nextTick(endFn);else src.once('end', endFn);
  dest.on('unpipe', onunpipe);
  function onunpipe(readable, unpipeInfo) {
    debug('onunpipe');
    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true;
        cleanup();
      }
    }
  }
  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);
  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', unpipe);
    src.removeListener('data', ondata);
    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }
  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    var ret = dest.write(chunk);
    debug('dest.write', ret);
    if (ret === false) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', state.awaitDrain);
        state.awaitDrain++;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) errorOrDestroy(dest, er);
  }

  // Make sure our error handler is attached before userland ones.
  prependListener(dest, 'error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);
  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }
  return dest;
};
function pipeOnDrain(src) {
  return function pipeOnDrainFunctionResult() {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}
Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;
  var unpipeInfo = {
    hasUnpiped: false
  };

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;
    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this, unpipeInfo);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    for (var i = 0; i < len; i++) dests[i].emit('unpipe', this, {
      hasUnpiped: false
    });
    return this;
  }

  // try to find the right one.
  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;
  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];
  dest.emit('unpipe', this, unpipeInfo);
  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);
  var state = this._readableState;
  if (ev === 'data') {
    // update readableListening so that resume() may be a no-op
    // a few lines down. This is needed to support once('readable').
    state.readableListening = this.listenerCount('readable') > 0;

    // Try start flowing on next tick if stream isn't explicitly paused
    if (state.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.flowing = false;
      state.emittedReadable = false;
      debug('on readable', state.length, state.reading);
      if (state.length) {
        emitReadable(this);
      } else if (!state.reading) {
        process.nextTick(nReadingNextTick, this);
      }
    }
  }
  return res;
};
Readable.prototype.addListener = Readable.prototype.on;
Readable.prototype.removeListener = function (ev, fn) {
  var res = Stream.prototype.removeListener.call(this, ev, fn);
  if (ev === 'readable') {
    // We need to check if there is someone still listening to
    // readable and reset the state. However this needs to happen
    // after readable has been emitted but before I/O (nextTick) to
    // support once('readable', fn) cycles. This means that calling
    // resume within the same tick will have no
    // effect.
    process.nextTick(updateReadableListening, this);
  }
  return res;
};
Readable.prototype.removeAllListeners = function (ev) {
  var res = Stream.prototype.removeAllListeners.apply(this, arguments);
  if (ev === 'readable' || ev === undefined) {
    // We need to check if there is someone still listening to
    // readable and reset the state. However this needs to happen
    // after readable has been emitted but before I/O (nextTick) to
    // support once('readable', fn) cycles. This means that calling
    // resume within the same tick will have no
    // effect.
    process.nextTick(updateReadableListening, this);
  }
  return res;
};
function updateReadableListening(self) {
  var state = self._readableState;
  state.readableListening = self.listenerCount('readable') > 0;
  if (state.resumeScheduled && !state.paused) {
    // flowing needs to be set to true now, otherwise
    // the upcoming resume will not flow.
    state.flowing = true;

    // crude way to check if we should resume
  } else if (self.listenerCount('data') > 0) {
    self.resume();
  }
}
function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    // we flow only if there is no one listening
    // for readable, but we still have to call
    // resume()
    state.flowing = !state.readableListening;
    resume(this, state);
  }
  state.paused = false;
  return this;
};
function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    process.nextTick(resume_, stream, state);
  }
}
function resume_(stream, state) {
  debug('resume', state.reading);
  if (!state.reading) {
    stream.read(0);
  }
  state.resumeScheduled = false;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}
Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (this._readableState.flowing !== false) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  this._readableState.paused = true;
  return this;
};
function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  while (state.flowing && stream.read() !== null);
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var _this = this;
  var state = this._readableState;
  var paused = false;
  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) _this.push(chunk);
    }
    _this.push(null);
  });
  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;
    var ret = _this.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function methodWrap(method) {
        return function methodWrapReturnFunction() {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  for (var n = 0; n < kProxyEvents.length; n++) {
    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
  }

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  this._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };
  return this;
};
if (typeof Symbol === 'function') {
  Readable.prototype[Symbol.asyncIterator] = function () {
    if (createReadableStreamAsyncIterator === undefined) {
      createReadableStreamAsyncIterator = __webpack_require__(/*! ./internal/streams/async_iterator */ "./node_modules/readable-stream/lib/internal/streams/async_iterator.js");
    }
    return createReadableStreamAsyncIterator(this);
  };
}
Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState.highWaterMark;
  }
});
Object.defineProperty(Readable.prototype, 'readableBuffer', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState && this._readableState.buffer;
  }
});
Object.defineProperty(Readable.prototype, 'readableFlowing', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState.flowing;
  },
  set: function set(state) {
    if (this._readableState) {
      this._readableState.flowing = state;
    }
  }
});

// exposed for testing purposes only.
Readable._fromList = fromList;
Object.defineProperty(Readable.prototype, 'readableLength', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState.length;
  }
});

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;
  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.first();else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = state.buffer.consume(n, state.decoder);
  }
  return ret;
}
function endReadable(stream) {
  var state = stream._readableState;
  debug('endReadable', state.endEmitted);
  if (!state.endEmitted) {
    state.ended = true;
    process.nextTick(endReadableNT, state, stream);
  }
}
function endReadableNT(state, stream) {
  debug('endReadableNT', state.endEmitted, state.length);

  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
    if (state.autoDestroy) {
      // In case of duplex streams we need a way to detect
      // if the writable side is ready for autoDestroy as well
      var wState = stream._writableState;
      if (!wState || wState.autoDestroy && wState.finished) {
        stream.destroy();
      }
    }
  }
}
if (typeof Symbol === 'function') {
  Readable.from = function (iterable, opts) {
    if (from === undefined) {
      from = __webpack_require__(/*! ./internal/streams/from */ "./node_modules/readable-stream/lib/internal/streams/from-browser.js");
    }
    return from(Readable, iterable, opts);
  };
}
function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}

/***/ }),

/***/ "./node_modules/readable-stream/lib/_stream_transform.js":
/*!***************************************************************!*\
  !*** ./node_modules/readable-stream/lib/_stream_transform.js ***!
  \***************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.



module.exports = Transform;
var _require$codes = (__webpack_require__(/*! ../errors */ "./node_modules/readable-stream/errors-browser.js").codes),
  ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
  ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK,
  ERR_TRANSFORM_ALREADY_TRANSFORMING = _require$codes.ERR_TRANSFORM_ALREADY_TRANSFORMING,
  ERR_TRANSFORM_WITH_LENGTH_0 = _require$codes.ERR_TRANSFORM_WITH_LENGTH_0;
var Duplex = __webpack_require__(/*! ./_stream_duplex */ "./node_modules/readable-stream/lib/_stream_duplex.js");
__webpack_require__(/*! inherits */ "./node_modules/inherits/inherits_browser.js")(Transform, Duplex);
function afterTransform(er, data) {
  var ts = this._transformState;
  ts.transforming = false;
  var cb = ts.writecb;
  if (cb === null) {
    return this.emit('error', new ERR_MULTIPLE_CALLBACK());
  }
  ts.writechunk = null;
  ts.writecb = null;
  if (data != null)
    // single equals check for both `null` and `undefined`
    this.push(data);
  cb(er);
  var rs = this._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    this._read(rs.highWaterMark);
  }
}
function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);
  Duplex.call(this, options);
  this._transformState = {
    afterTransform: afterTransform.bind(this),
    needTransform: false,
    transforming: false,
    writecb: null,
    writechunk: null,
    writeencoding: null
  };

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;
  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;
    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  // When the writable side finishes, then flush out anything remaining.
  this.on('prefinish', prefinish);
}
function prefinish() {
  var _this = this;
  if (typeof this._flush === 'function' && !this._readableState.destroyed) {
    this._flush(function (er, data) {
      done(_this, er, data);
    });
  } else {
    done(this, null, null);
  }
}
Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  cb(new ERR_METHOD_NOT_IMPLEMENTED('_transform()'));
};
Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;
  if (ts.writechunk !== null && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};
Transform.prototype._destroy = function (err, cb) {
  Duplex.prototype._destroy.call(this, err, function (err2) {
    cb(err2);
  });
};
function done(stream, er, data) {
  if (er) return stream.emit('error', er);
  if (data != null)
    // single equals check for both `null` and `undefined`
    stream.push(data);

  // TODO(BridgeAR): Write a test for these two error cases
  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  if (stream._writableState.length) throw new ERR_TRANSFORM_WITH_LENGTH_0();
  if (stream._transformState.transforming) throw new ERR_TRANSFORM_ALREADY_TRANSFORMING();
  return stream.push(null);
}

/***/ }),

/***/ "./node_modules/readable-stream/lib/_stream_writable.js":
/*!**************************************************************!*\
  !*** ./node_modules/readable-stream/lib/_stream_writable.js ***!
  \**************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var process = __webpack_require__(/*! process/browser */ "./node_modules/process/browser.js");
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.



module.exports = Writable;

/* <replacement> */
function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;
  this.next = null;
  this.entry = null;
  this.finish = function () {
    onCorkedFinish(_this, state);
  };
}
/* </replacement> */

/*<replacement>*/
var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;

/*<replacement>*/
var internalUtil = {
  deprecate: __webpack_require__(/*! util-deprecate */ "./node_modules/util-deprecate/browser.js")
};
/*</replacement>*/

/*<replacement>*/
var Stream = __webpack_require__(/*! ./internal/streams/stream */ "./node_modules/readable-stream/lib/internal/streams/stream-browser.js");
/*</replacement>*/

var Buffer = (__webpack_require__(/*! buffer */ "./node_modules/buffer/index.js").Buffer);
var OurUint8Array = (typeof __webpack_require__.g !== 'undefined' ? __webpack_require__.g : typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : {}).Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}
var destroyImpl = __webpack_require__(/*! ./internal/streams/destroy */ "./node_modules/readable-stream/lib/internal/streams/destroy.js");
var _require = __webpack_require__(/*! ./internal/streams/state */ "./node_modules/readable-stream/lib/internal/streams/state.js"),
  getHighWaterMark = _require.getHighWaterMark;
var _require$codes = (__webpack_require__(/*! ../errors */ "./node_modules/readable-stream/errors-browser.js").codes),
  ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE,
  ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
  ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK,
  ERR_STREAM_CANNOT_PIPE = _require$codes.ERR_STREAM_CANNOT_PIPE,
  ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED,
  ERR_STREAM_NULL_VALUES = _require$codes.ERR_STREAM_NULL_VALUES,
  ERR_STREAM_WRITE_AFTER_END = _require$codes.ERR_STREAM_WRITE_AFTER_END,
  ERR_UNKNOWN_ENCODING = _require$codes.ERR_UNKNOWN_ENCODING;
var errorOrDestroy = destroyImpl.errorOrDestroy;
__webpack_require__(/*! inherits */ "./node_modules/inherits/inherits_browser.js")(Writable, Stream);
function nop() {}
function WritableState(options, stream, isDuplex) {
  Duplex = Duplex || __webpack_require__(/*! ./_stream_duplex */ "./node_modules/readable-stream/lib/_stream_duplex.js");
  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream,
  // e.g. options.readableObjectMode vs. options.writableObjectMode, etc.
  if (typeof isDuplex !== 'boolean') isDuplex = stream instanceof Duplex;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;
  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  this.highWaterMark = getHighWaterMark(this, options, 'writableHighWaterMark', isDuplex);

  // if _final has been called
  this.finalCalled = false;

  // drain event flag.
  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // has it been destroyed
  this.destroyed = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;
  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // Should close be emitted on destroy. Defaults to true.
  this.emitClose = options.emitClose !== false;

  // Should .destroy() be called after 'finish' (and potentially 'end')
  this.autoDestroy = !!options.autoDestroy;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two
  this.corkedRequestsFree = new CorkedRequest(this);
}
WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};
(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function writableStateBufferGetter() {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    });
  } catch (_) {}
})();

// Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.
var realHasInstance;
if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function value(object) {
      if (realHasInstance.call(this, object)) return true;
      if (this !== Writable) return false;
      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function realHasInstance(object) {
    return object instanceof this;
  };
}
function Writable(options) {
  Duplex = Duplex || __webpack_require__(/*! ./_stream_duplex */ "./node_modules/readable-stream/lib/_stream_duplex.js");

  // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.

  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.

  // Checking for a Stream.Duplex instance is faster here instead of inside
  // the WritableState constructor, at least with V8 6.5
  var isDuplex = this instanceof Duplex;
  if (!isDuplex && !realHasInstance.call(Writable, this)) return new Writable(options);
  this._writableState = new WritableState(options, this, isDuplex);

  // legacy.
  this.writable = true;
  if (options) {
    if (typeof options.write === 'function') this._write = options.write;
    if (typeof options.writev === 'function') this._writev = options.writev;
    if (typeof options.destroy === 'function') this._destroy = options.destroy;
    if (typeof options["final"] === 'function') this._final = options["final"];
  }
  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  errorOrDestroy(this, new ERR_STREAM_CANNOT_PIPE());
};
function writeAfterEnd(stream, cb) {
  var er = new ERR_STREAM_WRITE_AFTER_END();
  // TODO: defer error events consistently everywhere, not just the cb
  errorOrDestroy(stream, er);
  process.nextTick(cb, er);
}

// Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.
function validChunk(stream, state, chunk, cb) {
  var er;
  if (chunk === null) {
    er = new ERR_STREAM_NULL_VALUES();
  } else if (typeof chunk !== 'string' && !state.objectMode) {
    er = new ERR_INVALID_ARG_TYPE('chunk', ['string', 'Buffer'], chunk);
  }
  if (er) {
    errorOrDestroy(stream, er);
    process.nextTick(cb, er);
    return false;
  }
  return true;
}
Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;
  var isBuf = !state.objectMode && _isUint8Array(chunk);
  if (isBuf && !Buffer.isBuffer(chunk)) {
    chunk = _uint8ArrayToBuffer(chunk);
  }
  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }
  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;
  if (typeof cb !== 'function') cb = nop;
  if (state.ending) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
  }
  return ret;
};
Writable.prototype.cork = function () {
  this._writableState.corked++;
};
Writable.prototype.uncork = function () {
  var state = this._writableState;
  if (state.corked) {
    state.corked--;
    if (!state.writing && !state.corked && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};
Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new ERR_UNKNOWN_ENCODING(encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};
Object.defineProperty(Writable.prototype, 'writableBuffer', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState && this._writableState.getBuffer();
  }
});
function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer.from(chunk, encoding);
  }
  return chunk;
}
Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.highWaterMark;
  }
});

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {
    var newChunk = decodeChunk(state, chunk, encoding);
    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }
  var len = state.objectMode ? 1 : chunk.length;
  state.length += len;
  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;
  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk: chunk,
      encoding: encoding,
      isBuf: isBuf,
      callback: cb,
      next: null
    };
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }
  return ret;
}
function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (state.destroyed) state.onwrite(new ERR_STREAM_DESTROYED('write'));else if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}
function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;
  if (sync) {
    // defer the callback if we are being called synchronously
    // to avoid piling up things on the stack
    process.nextTick(cb, er);
    // this can emit finish, and it will always happen
    // after error
    process.nextTick(finishMaybe, stream, state);
    stream._writableState.errorEmitted = true;
    errorOrDestroy(stream, er);
  } else {
    // the caller expect this to happen before if
    // it is async
    cb(er);
    stream._writableState.errorEmitted = true;
    errorOrDestroy(stream, er);
    // this can emit finish, but finish must
    // always follow error
    finishMaybe(stream, state);
  }
}
function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}
function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;
  if (typeof cb !== 'function') throw new ERR_MULTIPLE_CALLBACK();
  onwriteStateUpdate(state);
  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state) || stream.destroyed;
    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }
    if (sync) {
      process.nextTick(afterWrite, stream, state, finished, cb);
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}
function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;
  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;
    var count = 0;
    var allBuffers = true;
    while (entry) {
      buffer[count] = entry;
      if (!entry.isBuf) allBuffers = false;
      entry = entry.next;
      count += 1;
    }
    buffer.allBuffers = allBuffers;
    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }
    state.bufferedRequestCount = 0;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;
      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      state.bufferedRequestCount--;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }
    if (entry === null) state.lastBufferedRequest = null;
  }
  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}
Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new ERR_METHOD_NOT_IMPLEMENTED('_write()'));
};
Writable.prototype._writev = null;
Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;
  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }
  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending) endWritable(this, state, cb);
  return this;
};
Object.defineProperty(Writable.prototype, 'writableLength', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.length;
  }
});
function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}
function callFinal(stream, state) {
  stream._final(function (err) {
    state.pendingcb--;
    if (err) {
      errorOrDestroy(stream, err);
    }
    state.prefinished = true;
    stream.emit('prefinish');
    finishMaybe(stream, state);
  });
}
function prefinish(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function' && !state.destroyed) {
      state.pendingcb++;
      state.finalCalled = true;
      process.nextTick(callFinal, stream, state);
    } else {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }
}
function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    prefinish(stream, state);
    if (state.pendingcb === 0) {
      state.finished = true;
      stream.emit('finish');
      if (state.autoDestroy) {
        // In case of duplex streams we need a way to detect
        // if the readable side is ready for autoDestroy as well
        var rState = stream._readableState;
        if (!rState || rState.autoDestroy && rState.endEmitted) {
          stream.destroy();
        }
      }
    }
  }
  return need;
}
function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) process.nextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}
function onCorkedFinish(corkReq, state, err) {
  var entry = corkReq.entry;
  corkReq.entry = null;
  while (entry) {
    var cb = entry.callback;
    state.pendingcb--;
    cb(err);
    entry = entry.next;
  }

  // reuse the free corkReq.
  state.corkedRequestsFree.next = corkReq;
}
Object.defineProperty(Writable.prototype, 'destroyed', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    if (this._writableState === undefined) {
      return false;
    }
    return this._writableState.destroyed;
  },
  set: function set(value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._writableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._writableState.destroyed = value;
  }
});
Writable.prototype.destroy = destroyImpl.destroy;
Writable.prototype._undestroy = destroyImpl.undestroy;
Writable.prototype._destroy = function (err, cb) {
  cb(err);
};

/***/ }),

/***/ "./node_modules/readable-stream/lib/internal/streams/async_iterator.js":
/*!*****************************************************************************!*\
  !*** ./node_modules/readable-stream/lib/internal/streams/async_iterator.js ***!
  \*****************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var process = __webpack_require__(/*! process/browser */ "./node_modules/process/browser.js");


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var _Object$setPrototypeO;
function _defineProperty(obj, key, value) {
  key = _toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _toPropertyKey(arg) {
  var key = _toPrimitive(arg, "string");
  return _typeof(key) === "symbol" ? key : String(key);
}
function _toPrimitive(input, hint) {
  if (_typeof(input) !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== undefined) {
    var res = prim.call(input, hint || "default");
    if (_typeof(res) !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
var finished = __webpack_require__(/*! ./end-of-stream */ "./node_modules/readable-stream/lib/internal/streams/end-of-stream.js");
var kLastResolve = Symbol('lastResolve');
var kLastReject = Symbol('lastReject');
var kError = Symbol('error');
var kEnded = Symbol('ended');
var kLastPromise = Symbol('lastPromise');
var kHandlePromise = Symbol('handlePromise');
var kStream = Symbol('stream');
function createIterResult(value, done) {
  return {
    value: value,
    done: done
  };
}
function readAndResolve(iter) {
  var resolve = iter[kLastResolve];
  if (resolve !== null) {
    var data = iter[kStream].read();
    // we defer if data is null
    // we can be expecting either 'end' or
    // 'error'
    if (data !== null) {
      iter[kLastPromise] = null;
      iter[kLastResolve] = null;
      iter[kLastReject] = null;
      resolve(createIterResult(data, false));
    }
  }
}
function onReadable(iter) {
  // we wait for the next tick, because it might
  // emit an error with process.nextTick
  process.nextTick(readAndResolve, iter);
}
function wrapForNext(lastPromise, iter) {
  return function (resolve, reject) {
    lastPromise.then(function () {
      if (iter[kEnded]) {
        resolve(createIterResult(undefined, true));
        return;
      }
      iter[kHandlePromise](resolve, reject);
    }, reject);
  };
}
var AsyncIteratorPrototype = Object.getPrototypeOf(function () {});
var ReadableStreamAsyncIteratorPrototype = Object.setPrototypeOf((_Object$setPrototypeO = {
  get stream() {
    return this[kStream];
  },
  next: function next() {
    var _this = this;
    // if we have detected an error in the meanwhile
    // reject straight away
    var error = this[kError];
    if (error !== null) {
      return Promise.reject(error);
    }
    if (this[kEnded]) {
      return Promise.resolve(createIterResult(undefined, true));
    }
    if (this[kStream].destroyed) {
      // We need to defer via nextTick because if .destroy(err) is
      // called, the error will be emitted via nextTick, and
      // we cannot guarantee that there is no error lingering around
      // waiting to be emitted.
      return new Promise(function (resolve, reject) {
        process.nextTick(function () {
          if (_this[kError]) {
            reject(_this[kError]);
          } else {
            resolve(createIterResult(undefined, true));
          }
        });
      });
    }

    // if we have multiple next() calls
    // we will wait for the previous Promise to finish
    // this logic is optimized to support for await loops,
    // where next() is only called once at a time
    var lastPromise = this[kLastPromise];
    var promise;
    if (lastPromise) {
      promise = new Promise(wrapForNext(lastPromise, this));
    } else {
      // fast path needed to support multiple this.push()
      // without triggering the next() queue
      var data = this[kStream].read();
      if (data !== null) {
        return Promise.resolve(createIterResult(data, false));
      }
      promise = new Promise(this[kHandlePromise]);
    }
    this[kLastPromise] = promise;
    return promise;
  }
}, _defineProperty(_Object$setPrototypeO, Symbol.asyncIterator, function () {
  return this;
}), _defineProperty(_Object$setPrototypeO, "return", function _return() {
  var _this2 = this;
  // destroy(err, cb) is a private API
  // we can guarantee we have that here, because we control the
  // Readable class this is attached to
  return new Promise(function (resolve, reject) {
    _this2[kStream].destroy(null, function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(createIterResult(undefined, true));
    });
  });
}), _Object$setPrototypeO), AsyncIteratorPrototype);
var createReadableStreamAsyncIterator = function createReadableStreamAsyncIterator(stream) {
  var _Object$create;
  var iterator = Object.create(ReadableStreamAsyncIteratorPrototype, (_Object$create = {}, _defineProperty(_Object$create, kStream, {
    value: stream,
    writable: true
  }), _defineProperty(_Object$create, kLastResolve, {
    value: null,
    writable: true
  }), _defineProperty(_Object$create, kLastReject, {
    value: null,
    writable: true
  }), _defineProperty(_Object$create, kError, {
    value: null,
    writable: true
  }), _defineProperty(_Object$create, kEnded, {
    value: stream._readableState.endEmitted,
    writable: true
  }), _defineProperty(_Object$create, kHandlePromise, {
    value: function value(resolve, reject) {
      var data = iterator[kStream].read();
      if (data) {
        iterator[kLastPromise] = null;
        iterator[kLastResolve] = null;
        iterator[kLastReject] = null;
        resolve(createIterResult(data, false));
      } else {
        iterator[kLastResolve] = resolve;
        iterator[kLastReject] = reject;
      }
    },
    writable: true
  }), _Object$create));
  iterator[kLastPromise] = null;
  finished(stream, function (err) {
    if (err && err.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
      var reject = iterator[kLastReject];
      // reject if we are waiting for data in the Promise
      // returned by next() and store the error
      if (reject !== null) {
        iterator[kLastPromise] = null;
        iterator[kLastResolve] = null;
        iterator[kLastReject] = null;
        reject(err);
      }
      iterator[kError] = err;
      return;
    }
    var resolve = iterator[kLastResolve];
    if (resolve !== null) {
      iterator[kLastPromise] = null;
      iterator[kLastResolve] = null;
      iterator[kLastReject] = null;
      resolve(createIterResult(undefined, true));
    }
    iterator[kEnded] = true;
  });
  stream.on('readable', onReadable.bind(null, iterator));
  return iterator;
};
module.exports = createReadableStreamAsyncIterator;

/***/ }),

/***/ "./node_modules/readable-stream/lib/internal/streams/buffer_list.js":
/*!**************************************************************************!*\
  !*** ./node_modules/readable-stream/lib/internal/streams/buffer_list.js ***!
  \**************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    enumerableOnly && (symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    })), keys.push.apply(keys, symbols);
  }
  return keys;
}
function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = null != arguments[i] ? arguments[i] : {};
    i % 2 ? ownKeys(Object(source), !0).forEach(function (key) {
      _defineProperty(target, key, source[key]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) {
      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
  }
  return target;
}
function _defineProperty(obj, key, value) {
  key = _toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}
function _toPropertyKey(arg) {
  var key = _toPrimitive(arg, "string");
  return _typeof(key) === "symbol" ? key : String(key);
}
function _toPrimitive(input, hint) {
  if (_typeof(input) !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== undefined) {
    var res = prim.call(input, hint || "default");
    if (_typeof(res) !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
var _require = __webpack_require__(/*! buffer */ "./node_modules/buffer/index.js"),
  Buffer = _require.Buffer;
var _require2 = __webpack_require__(/*! util */ "?ed1b"),
  inspect = _require2.inspect;
var custom = inspect && inspect.custom || 'inspect';
function copyBuffer(src, target, offset) {
  Buffer.prototype.copy.call(src, target, offset);
}
module.exports = /*#__PURE__*/function () {
  function BufferList() {
    _classCallCheck(this, BufferList);
    this.head = null;
    this.tail = null;
    this.length = 0;
  }
  _createClass(BufferList, [{
    key: "push",
    value: function push(v) {
      var entry = {
        data: v,
        next: null
      };
      if (this.length > 0) this.tail.next = entry;else this.head = entry;
      this.tail = entry;
      ++this.length;
    }
  }, {
    key: "unshift",
    value: function unshift(v) {
      var entry = {
        data: v,
        next: this.head
      };
      if (this.length === 0) this.tail = entry;
      this.head = entry;
      ++this.length;
    }
  }, {
    key: "shift",
    value: function shift() {
      if (this.length === 0) return;
      var ret = this.head.data;
      if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
      --this.length;
      return ret;
    }
  }, {
    key: "clear",
    value: function clear() {
      this.head = this.tail = null;
      this.length = 0;
    }
  }, {
    key: "join",
    value: function join(s) {
      if (this.length === 0) return '';
      var p = this.head;
      var ret = '' + p.data;
      while (p = p.next) ret += s + p.data;
      return ret;
    }
  }, {
    key: "concat",
    value: function concat(n) {
      if (this.length === 0) return Buffer.alloc(0);
      var ret = Buffer.allocUnsafe(n >>> 0);
      var p = this.head;
      var i = 0;
      while (p) {
        copyBuffer(p.data, ret, i);
        i += p.data.length;
        p = p.next;
      }
      return ret;
    }

    // Consumes a specified amount of bytes or characters from the buffered data.
  }, {
    key: "consume",
    value: function consume(n, hasStrings) {
      var ret;
      if (n < this.head.data.length) {
        // `slice` is the same for buffers and strings.
        ret = this.head.data.slice(0, n);
        this.head.data = this.head.data.slice(n);
      } else if (n === this.head.data.length) {
        // First chunk is a perfect match.
        ret = this.shift();
      } else {
        // Result spans more than one buffer.
        ret = hasStrings ? this._getString(n) : this._getBuffer(n);
      }
      return ret;
    }
  }, {
    key: "first",
    value: function first() {
      return this.head.data;
    }

    // Consumes a specified amount of characters from the buffered data.
  }, {
    key: "_getString",
    value: function _getString(n) {
      var p = this.head;
      var c = 1;
      var ret = p.data;
      n -= ret.length;
      while (p = p.next) {
        var str = p.data;
        var nb = n > str.length ? str.length : n;
        if (nb === str.length) ret += str;else ret += str.slice(0, n);
        n -= nb;
        if (n === 0) {
          if (nb === str.length) {
            ++c;
            if (p.next) this.head = p.next;else this.head = this.tail = null;
          } else {
            this.head = p;
            p.data = str.slice(nb);
          }
          break;
        }
        ++c;
      }
      this.length -= c;
      return ret;
    }

    // Consumes a specified amount of bytes from the buffered data.
  }, {
    key: "_getBuffer",
    value: function _getBuffer(n) {
      var ret = Buffer.allocUnsafe(n);
      var p = this.head;
      var c = 1;
      p.data.copy(ret);
      n -= p.data.length;
      while (p = p.next) {
        var buf = p.data;
        var nb = n > buf.length ? buf.length : n;
        buf.copy(ret, ret.length - n, 0, nb);
        n -= nb;
        if (n === 0) {
          if (nb === buf.length) {
            ++c;
            if (p.next) this.head = p.next;else this.head = this.tail = null;
          } else {
            this.head = p;
            p.data = buf.slice(nb);
          }
          break;
        }
        ++c;
      }
      this.length -= c;
      return ret;
    }

    // Make sure the linked list only shows the minimal necessary information.
  }, {
    key: custom,
    value: function value(_, options) {
      return inspect(this, _objectSpread(_objectSpread({}, options), {}, {
        // Only inspect one level.
        depth: 0,
        // It should not recurse.
        customInspect: false
      }));
    }
  }]);
  return BufferList;
}();

/***/ }),

/***/ "./node_modules/readable-stream/lib/internal/streams/destroy.js":
/*!**********************************************************************!*\
  !*** ./node_modules/readable-stream/lib/internal/streams/destroy.js ***!
  \**********************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/* provided dependency */ var process = __webpack_require__(/*! process/browser */ "./node_modules/process/browser.js");


// undocumented cb() API, needed for core, not for public API
function destroy(err, cb) {
  var _this = this;
  var readableDestroyed = this._readableState && this._readableState.destroyed;
  var writableDestroyed = this._writableState && this._writableState.destroyed;
  if (readableDestroyed || writableDestroyed) {
    if (cb) {
      cb(err);
    } else if (err) {
      if (!this._writableState) {
        process.nextTick(emitErrorNT, this, err);
      } else if (!this._writableState.errorEmitted) {
        this._writableState.errorEmitted = true;
        process.nextTick(emitErrorNT, this, err);
      }
    }
    return this;
  }

  // we set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks

  if (this._readableState) {
    this._readableState.destroyed = true;
  }

  // if this is a duplex stream mark the writable part as destroyed as well
  if (this._writableState) {
    this._writableState.destroyed = true;
  }
  this._destroy(err || null, function (err) {
    if (!cb && err) {
      if (!_this._writableState) {
        process.nextTick(emitErrorAndCloseNT, _this, err);
      } else if (!_this._writableState.errorEmitted) {
        _this._writableState.errorEmitted = true;
        process.nextTick(emitErrorAndCloseNT, _this, err);
      } else {
        process.nextTick(emitCloseNT, _this);
      }
    } else if (cb) {
      process.nextTick(emitCloseNT, _this);
      cb(err);
    } else {
      process.nextTick(emitCloseNT, _this);
    }
  });
  return this;
}
function emitErrorAndCloseNT(self, err) {
  emitErrorNT(self, err);
  emitCloseNT(self);
}
function emitCloseNT(self) {
  if (self._writableState && !self._writableState.emitClose) return;
  if (self._readableState && !self._readableState.emitClose) return;
  self.emit('close');
}
function undestroy() {
  if (this._readableState) {
    this._readableState.destroyed = false;
    this._readableState.reading = false;
    this._readableState.ended = false;
    this._readableState.endEmitted = false;
  }
  if (this._writableState) {
    this._writableState.destroyed = false;
    this._writableState.ended = false;
    this._writableState.ending = false;
    this._writableState.finalCalled = false;
    this._writableState.prefinished = false;
    this._writableState.finished = false;
    this._writableState.errorEmitted = false;
  }
}
function emitErrorNT(self, err) {
  self.emit('error', err);
}
function errorOrDestroy(stream, err) {
  // We have tests that rely on errors being emitted
  // in the same tick, so changing this is semver major.
  // For now when you opt-in to autoDestroy we allow
  // the error to be emitted nextTick. In a future
  // semver major update we should change the default to this.

  var rState = stream._readableState;
  var wState = stream._writableState;
  if (rState && rState.autoDestroy || wState && wState.autoDestroy) stream.destroy(err);else stream.emit('error', err);
}
module.exports = {
  destroy: destroy,
  undestroy: undestroy,
  errorOrDestroy: errorOrDestroy
};

/***/ }),

/***/ "./node_modules/readable-stream/lib/internal/streams/end-of-stream.js":
/*!****************************************************************************!*\
  !*** ./node_modules/readable-stream/lib/internal/streams/end-of-stream.js ***!
  \****************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
// Ported from https://github.com/mafintosh/end-of-stream with
// permission from the author, Mathias Buus (@mafintosh).



var ERR_STREAM_PREMATURE_CLOSE = (__webpack_require__(/*! ../../../errors */ "./node_modules/readable-stream/errors-browser.js").codes).ERR_STREAM_PREMATURE_CLOSE;
function once(callback) {
  var called = false;
  return function () {
    if (called) return;
    called = true;
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    callback.apply(this, args);
  };
}
function noop() {}
function isRequest(stream) {
  return stream.setHeader && typeof stream.abort === 'function';
}
function eos(stream, opts, callback) {
  if (typeof opts === 'function') return eos(stream, null, opts);
  if (!opts) opts = {};
  callback = once(callback || noop);
  var readable = opts.readable || opts.readable !== false && stream.readable;
  var writable = opts.writable || opts.writable !== false && stream.writable;
  var onlegacyfinish = function onlegacyfinish() {
    if (!stream.writable) onfinish();
  };
  var writableEnded = stream._writableState && stream._writableState.finished;
  var onfinish = function onfinish() {
    writable = false;
    writableEnded = true;
    if (!readable) callback.call(stream);
  };
  var readableEnded = stream._readableState && stream._readableState.endEmitted;
  var onend = function onend() {
    readable = false;
    readableEnded = true;
    if (!writable) callback.call(stream);
  };
  var onerror = function onerror(err) {
    callback.call(stream, err);
  };
  var onclose = function onclose() {
    var err;
    if (readable && !readableEnded) {
      if (!stream._readableState || !stream._readableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
      return callback.call(stream, err);
    }
    if (writable && !writableEnded) {
      if (!stream._writableState || !stream._writableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
      return callback.call(stream, err);
    }
  };
  var onrequest = function onrequest() {
    stream.req.on('finish', onfinish);
  };
  if (isRequest(stream)) {
    stream.on('complete', onfinish);
    stream.on('abort', onclose);
    if (stream.req) onrequest();else stream.on('request', onrequest);
  } else if (writable && !stream._writableState) {
    // legacy streams
    stream.on('end', onlegacyfinish);
    stream.on('close', onlegacyfinish);
  }
  stream.on('end', onend);
  stream.on('finish', onfinish);
  if (opts.error !== false) stream.on('error', onerror);
  stream.on('close', onclose);
  return function () {
    stream.removeListener('complete', onfinish);
    stream.removeListener('abort', onclose);
    stream.removeListener('request', onrequest);
    if (stream.req) stream.req.removeListener('finish', onfinish);
    stream.removeListener('end', onlegacyfinish);
    stream.removeListener('close', onlegacyfinish);
    stream.removeListener('finish', onfinish);
    stream.removeListener('end', onend);
    stream.removeListener('error', onerror);
    stream.removeListener('close', onclose);
  };
}
module.exports = eos;

/***/ }),

/***/ "./node_modules/readable-stream/lib/internal/streams/from-browser.js":
/*!***************************************************************************!*\
  !*** ./node_modules/readable-stream/lib/internal/streams/from-browser.js ***!
  \***************************************************************************/
/***/ ((module) => {

module.exports = function () {
  throw new Error('Readable.from is not available in the browser');
};

/***/ }),

/***/ "./node_modules/readable-stream/lib/internal/streams/pipeline.js":
/*!***********************************************************************!*\
  !*** ./node_modules/readable-stream/lib/internal/streams/pipeline.js ***!
  \***********************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
// Ported from https://github.com/mafintosh/pump with
// permission from the author, Mathias Buus (@mafintosh).



var eos;
function once(callback) {
  var called = false;
  return function () {
    if (called) return;
    called = true;
    callback.apply(void 0, arguments);
  };
}
var _require$codes = (__webpack_require__(/*! ../../../errors */ "./node_modules/readable-stream/errors-browser.js").codes),
  ERR_MISSING_ARGS = _require$codes.ERR_MISSING_ARGS,
  ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED;
function noop(err) {
  // Rethrow the error if it exists to avoid swallowing it
  if (err) throw err;
}
function isRequest(stream) {
  return stream.setHeader && typeof stream.abort === 'function';
}
function destroyer(stream, reading, writing, callback) {
  callback = once(callback);
  var closed = false;
  stream.on('close', function () {
    closed = true;
  });
  if (eos === undefined) eos = __webpack_require__(/*! ./end-of-stream */ "./node_modules/readable-stream/lib/internal/streams/end-of-stream.js");
  eos(stream, {
    readable: reading,
    writable: writing
  }, function (err) {
    if (err) return callback(err);
    closed = true;
    callback();
  });
  var destroyed = false;
  return function (err) {
    if (closed) return;
    if (destroyed) return;
    destroyed = true;

    // request.destroy just do .end - .abort is what we want
    if (isRequest(stream)) return stream.abort();
    if (typeof stream.destroy === 'function') return stream.destroy();
    callback(err || new ERR_STREAM_DESTROYED('pipe'));
  };
}
function call(fn) {
  fn();
}
function pipe(from, to) {
  return from.pipe(to);
}
function popCallback(streams) {
  if (!streams.length) return noop;
  if (typeof streams[streams.length - 1] !== 'function') return noop;
  return streams.pop();
}
function pipeline() {
  for (var _len = arguments.length, streams = new Array(_len), _key = 0; _key < _len; _key++) {
    streams[_key] = arguments[_key];
  }
  var callback = popCallback(streams);
  if (Array.isArray(streams[0])) streams = streams[0];
  if (streams.length < 2) {
    throw new ERR_MISSING_ARGS('streams');
  }
  var error;
  var destroys = streams.map(function (stream, i) {
    var reading = i < streams.length - 1;
    var writing = i > 0;
    return destroyer(stream, reading, writing, function (err) {
      if (!error) error = err;
      if (err) destroys.forEach(call);
      if (reading) return;
      destroys.forEach(call);
      callback(error);
    });
  });
  return streams.reduce(pipe);
}
module.exports = pipeline;

/***/ }),

/***/ "./node_modules/readable-stream/lib/internal/streams/state.js":
/*!********************************************************************!*\
  !*** ./node_modules/readable-stream/lib/internal/streams/state.js ***!
  \********************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var ERR_INVALID_OPT_VALUE = (__webpack_require__(/*! ../../../errors */ "./node_modules/readable-stream/errors-browser.js").codes).ERR_INVALID_OPT_VALUE;
function highWaterMarkFrom(options, isDuplex, duplexKey) {
  return options.highWaterMark != null ? options.highWaterMark : isDuplex ? options[duplexKey] : null;
}
function getHighWaterMark(state, options, duplexKey, isDuplex) {
  var hwm = highWaterMarkFrom(options, isDuplex, duplexKey);
  if (hwm != null) {
    if (!(isFinite(hwm) && Math.floor(hwm) === hwm) || hwm < 0) {
      var name = isDuplex ? duplexKey : 'highWaterMark';
      throw new ERR_INVALID_OPT_VALUE(name, hwm);
    }
    return Math.floor(hwm);
  }

  // Default value
  return state.objectMode ? 16 : 16 * 1024;
}
module.exports = {
  getHighWaterMark: getHighWaterMark
};

/***/ }),

/***/ "./node_modules/readable-stream/lib/internal/streams/stream-browser.js":
/*!*****************************************************************************!*\
  !*** ./node_modules/readable-stream/lib/internal/streams/stream-browser.js ***!
  \*****************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(/*! events */ "./node_modules/events/events.js").EventEmitter;

/***/ }),

/***/ "./node_modules/requires-port/index.js":
/*!*********************************************!*\
  !*** ./node_modules/requires-port/index.js ***!
  \*********************************************/
/***/ ((module) => {

"use strict";


/**
 * Check if we're required to add a port number.
 *
 * @see https://url.spec.whatwg.org/#default-port
 * @param {Number|String} port Port number we need to check
 * @param {String} protocol Protocol we need to check against.
 * @returns {Boolean} Is it a default port for the given protocol
 * @api private
 */
module.exports = function required(port, protocol) {
  protocol = protocol.split(':')[0];
  port = +port;
  if (!port) return false;
  switch (protocol) {
    case 'http':
    case 'ws':
      return port !== 80;
    case 'https':
    case 'wss':
      return port !== 443;
    case 'ftp':
      return port !== 21;
    case 'gopher':
      return port !== 70;
    case 'file':
      return false;
  }
  return port !== 0;
};

/***/ }),

/***/ "./node_modules/safe-buffer/index.js":
/*!*******************************************!*\
  !*** ./node_modules/safe-buffer/index.js ***!
  \*******************************************/
/***/ ((module, exports, __webpack_require__) => {

/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
/* eslint-disable node/no-deprecated-api */
var buffer = __webpack_require__(/*! buffer */ "./node_modules/buffer/index.js");
var Buffer = buffer.Buffer;

// alternative to using Object.keys for old browsers
function copyProps(src, dst) {
  for (var key in src) {
    dst[key] = src[key];
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer;
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports);
  exports.Buffer = SafeBuffer;
}
function SafeBuffer(arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length);
}
SafeBuffer.prototype = Object.create(Buffer.prototype);

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer);
SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number');
  }
  return Buffer(arg, encodingOrOffset, length);
};
SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number');
  }
  var buf = Buffer(size);
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding);
    } else {
      buf.fill(fill);
    }
  } else {
    buf.fill(0);
  }
  return buf;
};
SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number');
  }
  return Buffer(size);
};
SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number');
  }
  return buffer.SlowBuffer(size);
};

/***/ }),

/***/ "./node_modules/safe-regex-test/index.js":
/*!***********************************************!*\
  !*** ./node_modules/safe-regex-test/index.js ***!
  \***********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var callBound = __webpack_require__(/*! call-bound */ "./node_modules/call-bound/index.js");
var isRegex = __webpack_require__(/*! is-regex */ "./node_modules/is-regex/index.js");
var $exec = callBound('RegExp.prototype.exec');
var $TypeError = __webpack_require__(/*! es-errors/type */ "./node_modules/es-errors/type.js");

/** @type {import('.')} */
module.exports = function regexTester(regex) {
  if (!isRegex(regex)) {
    throw new $TypeError('`regex` must be a RegExp');
  }
  return function test(s) {
    return $exec(regex, s) !== null;
  };
};

/***/ }),

/***/ "./node_modules/set-function-length/index.js":
/*!***************************************************!*\
  !*** ./node_modules/set-function-length/index.js ***!
  \***************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var GetIntrinsic = __webpack_require__(/*! get-intrinsic */ "./node_modules/get-intrinsic/index.js");
var define = __webpack_require__(/*! define-data-property */ "./node_modules/define-data-property/index.js");
var hasDescriptors = __webpack_require__(/*! has-property-descriptors */ "./node_modules/has-property-descriptors/index.js")();
var gOPD = __webpack_require__(/*! gopd */ "./node_modules/gopd/index.js");
var $TypeError = __webpack_require__(/*! es-errors/type */ "./node_modules/es-errors/type.js");
var $floor = GetIntrinsic('%Math.floor%');

/** @type {import('.')} */
module.exports = function setFunctionLength(fn, length) {
  if (typeof fn !== 'function') {
    throw new $TypeError('`fn` is not a function');
  }
  if (typeof length !== 'number' || length < 0 || length > 0xFFFFFFFF || $floor(length) !== length) {
    throw new $TypeError('`length` must be a positive 32-bit integer');
  }
  var loose = arguments.length > 2 && !!arguments[2];
  var functionLengthIsConfigurable = true;
  var functionLengthIsWritable = true;
  if ('length' in fn && gOPD) {
    var desc = gOPD(fn, 'length');
    if (desc && !desc.configurable) {
      functionLengthIsConfigurable = false;
    }
    if (desc && !desc.writable) {
      functionLengthIsWritable = false;
    }
  }
  if (functionLengthIsConfigurable || functionLengthIsWritable || !loose) {
    if (hasDescriptors) {
      define(/** @type {Parameters<define>[0]} */fn, 'length', length, true, true);
    } else {
      define(/** @type {Parameters<define>[0]} */fn, 'length', length);
    }
  }
  return fn;
};

/***/ }),

/***/ "./node_modules/stream-browserify/index.js":
/*!*************************************************!*\
  !*** ./node_modules/stream-browserify/index.js ***!
  \*************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;
var EE = (__webpack_require__(/*! events */ "./node_modules/events/events.js").EventEmitter);
var inherits = __webpack_require__(/*! inherits */ "./node_modules/inherits/inherits_browser.js");
inherits(Stream, EE);
Stream.Readable = __webpack_require__(/*! readable-stream/lib/_stream_readable.js */ "./node_modules/readable-stream/lib/_stream_readable.js");
Stream.Writable = __webpack_require__(/*! readable-stream/lib/_stream_writable.js */ "./node_modules/readable-stream/lib/_stream_writable.js");
Stream.Duplex = __webpack_require__(/*! readable-stream/lib/_stream_duplex.js */ "./node_modules/readable-stream/lib/_stream_duplex.js");
Stream.Transform = __webpack_require__(/*! readable-stream/lib/_stream_transform.js */ "./node_modules/readable-stream/lib/_stream_transform.js");
Stream.PassThrough = __webpack_require__(/*! readable-stream/lib/_stream_passthrough.js */ "./node_modules/readable-stream/lib/_stream_passthrough.js");
Stream.finished = __webpack_require__(/*! readable-stream/lib/internal/streams/end-of-stream.js */ "./node_modules/readable-stream/lib/internal/streams/end-of-stream.js");
Stream.pipeline = __webpack_require__(/*! readable-stream/lib/internal/streams/pipeline.js */ "./node_modules/readable-stream/lib/internal/streams/pipeline.js");

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;

// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}
Stream.prototype.pipe = function (dest, options) {
  var source = this;
  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }
  source.on('data', ondata);
  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }
  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }
  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;
    dest.end();
  }
  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;
    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }
  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);
    source.removeListener('end', onend);
    source.removeListener('close', onclose);
    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);
    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);
    dest.removeListener('close', cleanup);
  }
  source.on('end', cleanup);
  source.on('close', cleanup);
  dest.on('close', cleanup);
  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

/***/ }),

/***/ "./node_modules/string_decoder/lib/string_decoder.js":
/*!***********************************************************!*\
  !*** ./node_modules/string_decoder/lib/string_decoder.js ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



/*<replacement>*/
var Buffer = (__webpack_require__(/*! safe-buffer */ "./node_modules/safe-buffer/index.js").Buffer);
/*</replacement>*/

var isEncoding = Buffer.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
    case 'raw':
      return true;
    default:
      return false;
  }
};
function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
}
;

// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.StringDecoder = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer.allocUnsafe(nb);
}
StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};
StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte(_byte) {
  if (_byte <= 0x7F) return 0;else if (_byte >> 5 === 0x06) return 2;else if (_byte >> 4 === 0x0E) return 3;else if (_byte >> 3 === 0x1E) return 4;
  return _byte >> 6 === 0x02 ? -1 : -2;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return "\uFFFD";
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return "\uFFFD";
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return "\uFFFD";
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf, p);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + "\uFFFD";
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}
function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}
function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}
function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}

/***/ }),

/***/ "./node_modules/strnum/strnum.js":
/*!***************************************!*\
  !*** ./node_modules/strnum/strnum.js ***!
  \***************************************/
/***/ ((module) => {

var hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
var numRegex = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/;
// const octRegex = /^0x[a-z0-9]+/;
// const binRegex = /0x[a-z0-9]+/;

var consider = {
  hex: true,
  // oct: false,
  leadingZeros: true,
  decimalPoint: "\.",
  eNotation: true
  //skipLike: /regex/
};
function toNumber(str) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  options = Object.assign({}, consider, options);
  if (!str || typeof str !== "string") return str;
  var trimmedStr = str.trim();
  if (options.skipLike !== undefined && options.skipLike.test(trimmedStr)) return str;else if (str === "0") return 0;else if (options.hex && hexRegex.test(trimmedStr)) {
    return parse_int(trimmedStr, 16);
    // }else if (options.oct && octRegex.test(str)) {
    //     return Number.parseInt(val, 8);
  } else if (trimmedStr.search(/[eE]/) !== -1) {
    //eNotation
    var notation = trimmedStr.match(/^([-\+])?(0*)([0-9]*(\.[0-9]*)?[eE][-\+]?[0-9]+)$/);
    // +00.123 => [ , '+', '00', '.123', ..
    if (notation) {
      // console.log(notation)
      if (options.leadingZeros) {
        //accept with leading zeros
        trimmedStr = (notation[1] || "") + notation[3];
      } else {
        if (notation[2] === "0" && notation[3][0] === ".") {//valid number
        } else {
          return str;
        }
      }
      return options.eNotation ? Number(trimmedStr) : str;
    } else {
      return str;
    }
    // }else if (options.parseBin && binRegex.test(str)) {
    //     return Number.parseInt(val, 2);
  } else {
    //separate negative sign, leading zeros, and rest number
    var match = numRegex.exec(trimmedStr);
    // +00.123 => [ , '+', '00', '.123', ..
    if (match) {
      var sign = match[1];
      var leadingZeros = match[2];
      var numTrimmedByZeros = trimZeros(match[3]); //complete num without leading zeros
      //trim ending zeros for floating number

      if (!options.leadingZeros && leadingZeros.length > 0 && sign && trimmedStr[2] !== ".") return str; //-0123
      else if (!options.leadingZeros && leadingZeros.length > 0 && !sign && trimmedStr[1] !== ".") return str; //0123
      else if (options.leadingZeros && leadingZeros === str) return 0; //00
      else {
        //no leading zeros or leading zeros are allowed
        var num = Number(trimmedStr);
        var numStr = "" + num;
        if (numStr.search(/[eE]/) !== -1) {
          //given number is long and parsed to eNotation
          if (options.eNotation) return num;else return str;
        } else if (trimmedStr.indexOf(".") !== -1) {
          //floating number
          if (numStr === "0" && numTrimmedByZeros === "") return num; //0.0
          else if (numStr === numTrimmedByZeros) return num; //0.456. 0.79000
          else if (sign && numStr === "-" + numTrimmedByZeros) return num;else return str;
        }
        if (leadingZeros) {
          return numTrimmedByZeros === numStr || sign + numTrimmedByZeros === numStr ? num : str;
        } else {
          return trimmedStr === numStr || trimmedStr === sign + numStr ? num : str;
        }
      }
    } else {
      //non-numeric string
      return str;
    }
  }
}

/**
 * 
 * @param {string} numStr without leading zeros
 * @returns 
 */
function trimZeros(numStr) {
  if (numStr && numStr.indexOf(".") !== -1) {
    //float
    numStr = numStr.replace(/0+$/, ""); //remove ending zeros
    if (numStr === ".") numStr = "0";else if (numStr[0] === ".") numStr = "0" + numStr;else if (numStr[numStr.length - 1] === ".") numStr = numStr.substr(0, numStr.length - 1);
    return numStr;
  }
  return numStr;
}
function parse_int(numStr, base) {
  //polyfill
  if (parseInt) return parseInt(numStr, base);else if (Number.parseInt) return Number.parseInt(numStr, base);else if (window && window.parseInt) return window.parseInt(numStr, base);else throw new Error("parseInt, Number.parseInt, window.parseInt are not supported");
}
module.exports = toNumber;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js":
/*!****************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js ***!
  \****************************************************************************/
/***/ ((module) => {

"use strict";


var stylesInDOM = [];
function getIndexByIdentifier(identifier) {
  var result = -1;
  for (var i = 0; i < stylesInDOM.length; i++) {
    if (stylesInDOM[i].identifier === identifier) {
      result = i;
      break;
    }
  }
  return result;
}
function modulesToDom(list, options) {
  var idCountMap = {};
  var identifiers = [];
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = options.base ? item[0] + options.base : item[0];
    var count = idCountMap[id] || 0;
    var identifier = "".concat(id, " ").concat(count);
    idCountMap[id] = count + 1;
    var indexByIdentifier = getIndexByIdentifier(identifier);
    var obj = {
      css: item[1],
      media: item[2],
      sourceMap: item[3],
      supports: item[4],
      layer: item[5]
    };
    if (indexByIdentifier !== -1) {
      stylesInDOM[indexByIdentifier].references++;
      stylesInDOM[indexByIdentifier].updater(obj);
    } else {
      var updater = addElementStyle(obj, options);
      options.byIndex = i;
      stylesInDOM.splice(i, 0, {
        identifier: identifier,
        updater: updater,
        references: 1
      });
    }
    identifiers.push(identifier);
  }
  return identifiers;
}
function addElementStyle(obj, options) {
  var api = options.domAPI(options);
  api.update(obj);
  var updater = function updater(newObj) {
    if (newObj) {
      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap && newObj.supports === obj.supports && newObj.layer === obj.layer) {
        return;
      }
      api.update(obj = newObj);
    } else {
      api.remove();
    }
  };
  return updater;
}
module.exports = function (list, options) {
  options = options || {};
  list = list || [];
  var lastIdentifiers = modulesToDom(list, options);
  return function update(newList) {
    newList = newList || [];
    for (var i = 0; i < lastIdentifiers.length; i++) {
      var identifier = lastIdentifiers[i];
      var index = getIndexByIdentifier(identifier);
      stylesInDOM[index].references--;
    }
    var newLastIdentifiers = modulesToDom(newList, options);
    for (var _i = 0; _i < lastIdentifiers.length; _i++) {
      var _identifier = lastIdentifiers[_i];
      var _index = getIndexByIdentifier(_identifier);
      if (stylesInDOM[_index].references === 0) {
        stylesInDOM[_index].updater();
        stylesInDOM.splice(_index, 1);
      }
    }
    lastIdentifiers = newLastIdentifiers;
  };
};

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/insertBySelector.js":
/*!********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/insertBySelector.js ***!
  \********************************************************************/
/***/ ((module) => {

"use strict";


var memo = {};

/* istanbul ignore next  */
function getTarget(target) {
  if (typeof memo[target] === "undefined") {
    var styleTarget = document.querySelector(target);

    // Special case to return head of iframe instead of iframe itself
    if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
      try {
        // This will throw an exception if access to iframe is blocked
        // due to cross-origin restrictions
        styleTarget = styleTarget.contentDocument.head;
      } catch (e) {
        // istanbul ignore next
        styleTarget = null;
      }
    }
    memo[target] = styleTarget;
  }
  return memo[target];
}

/* istanbul ignore next  */
function insertBySelector(insert, style) {
  var target = getTarget(insert);
  if (!target) {
    throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
  }
  target.appendChild(style);
}
module.exports = insertBySelector;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/insertStyleElement.js":
/*!**********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/insertStyleElement.js ***!
  \**********************************************************************/
/***/ ((module) => {

"use strict";


/* istanbul ignore next  */
function insertStyleElement(options) {
  var element = document.createElement("style");
  options.setAttributes(element, options.attributes);
  options.insert(element, options.options);
  return element;
}
module.exports = insertStyleElement;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js":
/*!**********************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js ***!
  \**********************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


/* istanbul ignore next  */
function setAttributesWithoutAttributes(styleElement) {
  var nonce =  true ? __webpack_require__.nc : 0;
  if (nonce) {
    styleElement.setAttribute("nonce", nonce);
  }
}
module.exports = setAttributesWithoutAttributes;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/styleDomAPI.js":
/*!***************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/styleDomAPI.js ***!
  \***************************************************************/
/***/ ((module) => {

"use strict";


/* istanbul ignore next  */
function apply(styleElement, options, obj) {
  var css = "";
  if (obj.supports) {
    css += "@supports (".concat(obj.supports, ") {");
  }
  if (obj.media) {
    css += "@media ".concat(obj.media, " {");
  }
  var needLayer = typeof obj.layer !== "undefined";
  if (needLayer) {
    css += "@layer".concat(obj.layer.length > 0 ? " ".concat(obj.layer) : "", " {");
  }
  css += obj.css;
  if (needLayer) {
    css += "}";
  }
  if (obj.media) {
    css += "}";
  }
  if (obj.supports) {
    css += "}";
  }
  var sourceMap = obj.sourceMap;
  if (sourceMap && typeof btoa !== "undefined") {
    css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
  }

  // For old IE
  /* istanbul ignore if  */
  options.styleTagTransform(css, styleElement, options.options);
}
function removeStyleElement(styleElement) {
  // istanbul ignore if
  if (styleElement.parentNode === null) {
    return false;
  }
  styleElement.parentNode.removeChild(styleElement);
}

/* istanbul ignore next  */
function domAPI(options) {
  if (typeof document === "undefined") {
    return {
      update: function update() {},
      remove: function remove() {}
    };
  }
  var styleElement = options.insertStyleElement(options);
  return {
    update: function update(obj) {
      apply(styleElement, options, obj);
    },
    remove: function remove() {
      removeStyleElement(styleElement);
    }
  };
}
module.exports = domAPI;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/styleTagTransform.js":
/*!*********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/styleTagTransform.js ***!
  \*********************************************************************/
/***/ ((module) => {

"use strict";


/* istanbul ignore next  */
function styleTagTransform(css, styleElement) {
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css;
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild);
    }
    styleElement.appendChild(document.createTextNode(css));
  }
}
module.exports = styleTagTransform;

/***/ }),

/***/ "./node_modules/url-join/lib/url-join.js":
/*!***********************************************!*\
  !*** ./node_modules/url-join/lib/url-join.js ***!
  \***********************************************/
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
(function (name, context, definition) {
  if ( true && module.exports) module.exports = definition();else if (true) !(__WEBPACK_AMD_DEFINE_FACTORY__ = (definition),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module)) :
		__WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));else // removed by dead control flow
{}
})('urljoin', this, function () {
  function normalize(strArray) {
    var resultArray = [];
    if (strArray.length === 0) {
      return '';
    }
    if (typeof strArray[0] !== 'string') {
      throw new TypeError('Url must be a string. Received ' + strArray[0]);
    }

    // If the first part is a plain protocol, we combine it with the next part.
    if (strArray[0].match(/^[^/:]+:\/*$/) && strArray.length > 1) {
      var first = strArray.shift();
      strArray[0] = first + strArray[0];
    }

    // There must be two or three slashes in the file protocol, two slashes in anything else.
    if (strArray[0].match(/^file:\/\/\//)) {
      strArray[0] = strArray[0].replace(/^([^/:]+):\/*/, '$1:///');
    } else {
      strArray[0] = strArray[0].replace(/^([^/:]+):\/*/, '$1://');
    }
    for (var i = 0; i < strArray.length; i++) {
      var component = strArray[i];
      if (typeof component !== 'string') {
        throw new TypeError('Url must be a string. Received ' + component);
      }
      if (component === '') {
        continue;
      }
      if (i > 0) {
        // Removing the starting slashes for each component but the first.
        component = component.replace(/^[\/]+/, '');
      }
      if (i < strArray.length - 1) {
        // Removing the ending slashes for each component but the last.
        component = component.replace(/[\/]+$/, '');
      } else {
        // For the last component we will combine multiple slashes to a single one.
        component = component.replace(/[\/]+$/, '/');
      }
      resultArray.push(component);
    }
    var str = resultArray.join('/');
    // Each input component is now separated by a single slash except the possible first plain protocol part.

    // remove trailing slash before parameters or hash
    str = str.replace(/\/(\?|&|#[^!])/g, '$1');

    // replace ? in parameters with &
    var parts = str.split('?');
    str = parts.shift() + (parts.length > 0 ? '?' : '') + parts.join('&');
    return str;
  }
  return function () {
    var input;
    if (_typeof(arguments[0]) === 'object') {
      input = arguments[0];
    } else {
      input = [].slice.call(arguments);
    }
    return normalize(input);
  };
});

/***/ }),

/***/ "./node_modules/url-parse/index.js":
/*!*****************************************!*\
  !*** ./node_modules/url-parse/index.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var required = __webpack_require__(/*! requires-port */ "./node_modules/requires-port/index.js"),
  qs = __webpack_require__(/*! querystringify */ "./node_modules/querystringify/index.js"),
  controlOrWhitespace = /^[\x00-\x20\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+/,
  CRHTLF = /[\n\r\t]/g,
  slashes = /^[A-Za-z][A-Za-z0-9+-.]*:\/\//,
  port = /:\d+$/,
  protocolre = /^([a-z][a-z0-9.+-]*:)?(\/\/)?([\\/]+)?([\S\s]*)/i,
  windowsDriveLetter = /^[a-zA-Z]:/;

/**
 * Remove control characters and whitespace from the beginning of a string.
 *
 * @param {Object|String} str String to trim.
 * @returns {String} A new string representing `str` stripped of control
 *     characters and whitespace from its beginning.
 * @public
 */
function trimLeft(str) {
  return (str ? str : '').toString().replace(controlOrWhitespace, '');
}

/**
 * These are the parse rules for the URL parser, it informs the parser
 * about:
 *
 * 0. The char it Needs to parse, if it's a string it should be done using
 *    indexOf, RegExp using exec and NaN means set as current value.
 * 1. The property we should set when parsing this value.
 * 2. Indication if it's backwards or forward parsing, when set as number it's
 *    the value of extra chars that should be split off.
 * 3. Inherit from location if non existing in the parser.
 * 4. `toLowerCase` the resulting value.
 */
var rules = [['#', 'hash'],
// Extract from the back.
['?', 'query'],
// Extract from the back.
function sanitize(address, url) {
  // Sanitize what is left of the address
  return isSpecial(url.protocol) ? address.replace(/\\/g, '/') : address;
}, ['/', 'pathname'],
// Extract from the back.
['@', 'auth', 1],
// Extract from the front.
[NaN, 'host', undefined, 1, 1],
// Set left over value.
[/:(\d*)$/, 'port', undefined, 1],
// RegExp the back.
[NaN, 'hostname', undefined, 1, 1] // Set left over.
];

/**
 * These properties should not be copied or inherited from. This is only needed
 * for all non blob URL's as a blob URL does not include a hash, only the
 * origin.
 *
 * @type {Object}
 * @private
 */
var ignore = {
  hash: 1,
  query: 1
};

/**
 * The location object differs when your code is loaded through a normal page,
 * Worker or through a worker using a blob. And with the blobble begins the
 * trouble as the location object will contain the URL of the blob, not the
 * location of the page where our code is loaded in. The actual origin is
 * encoded in the `pathname` so we can thankfully generate a good "default"
 * location from it so we can generate proper relative URL's again.
 *
 * @param {Object|String} loc Optional default location object.
 * @returns {Object} lolcation object.
 * @public
 */
function lolcation(loc) {
  var globalVar;
  if (typeof window !== 'undefined') globalVar = window;else if (typeof __webpack_require__.g !== 'undefined') globalVar = __webpack_require__.g;else if (typeof self !== 'undefined') globalVar = self;else globalVar = {};
  var location = globalVar.location || {};
  loc = loc || location;
  var finaldestination = {},
    type = _typeof(loc),
    key;
  if ('blob:' === loc.protocol) {
    finaldestination = new Url(unescape(loc.pathname), {});
  } else if ('string' === type) {
    finaldestination = new Url(loc, {});
    for (key in ignore) delete finaldestination[key];
  } else if ('object' === type) {
    for (key in loc) {
      if (key in ignore) continue;
      finaldestination[key] = loc[key];
    }
    if (finaldestination.slashes === undefined) {
      finaldestination.slashes = slashes.test(loc.href);
    }
  }
  return finaldestination;
}

/**
 * Check whether a protocol scheme is special.
 *
 * @param {String} The protocol scheme of the URL
 * @return {Boolean} `true` if the protocol scheme is special, else `false`
 * @private
 */
function isSpecial(scheme) {
  return scheme === 'file:' || scheme === 'ftp:' || scheme === 'http:' || scheme === 'https:' || scheme === 'ws:' || scheme === 'wss:';
}

/**
 * @typedef ProtocolExtract
 * @type Object
 * @property {String} protocol Protocol matched in the URL, in lowercase.
 * @property {Boolean} slashes `true` if protocol is followed by "//", else `false`.
 * @property {String} rest Rest of the URL that is not part of the protocol.
 */

/**
 * Extract protocol information from a URL with/without double slash ("//").
 *
 * @param {String} address URL we want to extract from.
 * @param {Object} location
 * @return {ProtocolExtract} Extracted information.
 * @private
 */
function extractProtocol(address, location) {
  address = trimLeft(address);
  address = address.replace(CRHTLF, '');
  location = location || {};
  var match = protocolre.exec(address);
  var protocol = match[1] ? match[1].toLowerCase() : '';
  var forwardSlashes = !!match[2];
  var otherSlashes = !!match[3];
  var slashesCount = 0;
  var rest;
  if (forwardSlashes) {
    if (otherSlashes) {
      rest = match[2] + match[3] + match[4];
      slashesCount = match[2].length + match[3].length;
    } else {
      rest = match[2] + match[4];
      slashesCount = match[2].length;
    }
  } else {
    if (otherSlashes) {
      rest = match[3] + match[4];
      slashesCount = match[3].length;
    } else {
      rest = match[4];
    }
  }
  if (protocol === 'file:') {
    if (slashesCount >= 2) {
      rest = rest.slice(2);
    }
  } else if (isSpecial(protocol)) {
    rest = match[4];
  } else if (protocol) {
    if (forwardSlashes) {
      rest = rest.slice(2);
    }
  } else if (slashesCount >= 2 && isSpecial(location.protocol)) {
    rest = match[4];
  }
  return {
    protocol: protocol,
    slashes: forwardSlashes || isSpecial(protocol),
    slashesCount: slashesCount,
    rest: rest
  };
}

/**
 * Resolve a relative URL pathname against a base URL pathname.
 *
 * @param {String} relative Pathname of the relative URL.
 * @param {String} base Pathname of the base URL.
 * @return {String} Resolved pathname.
 * @private
 */
function resolve(relative, base) {
  if (relative === '') return base;
  var path = (base || '/').split('/').slice(0, -1).concat(relative.split('/')),
    i = path.length,
    last = path[i - 1],
    unshift = false,
    up = 0;
  while (i--) {
    if (path[i] === '.') {
      path.splice(i, 1);
    } else if (path[i] === '..') {
      path.splice(i, 1);
      up++;
    } else if (up) {
      if (i === 0) unshift = true;
      path.splice(i, 1);
      up--;
    }
  }
  if (unshift) path.unshift('');
  if (last === '.' || last === '..') path.push('');
  return path.join('/');
}

/**
 * The actual URL instance. Instead of returning an object we've opted-in to
 * create an actual constructor as it's much more memory efficient and
 * faster and it pleases my OCD.
 *
 * It is worth noting that we should not use `URL` as class name to prevent
 * clashes with the global URL instance that got introduced in browsers.
 *
 * @constructor
 * @param {String} address URL we want to parse.
 * @param {Object|String} [location] Location defaults for relative paths.
 * @param {Boolean|Function} [parser] Parser for the query string.
 * @private
 */
function Url(address, location, parser) {
  address = trimLeft(address);
  address = address.replace(CRHTLF, '');
  if (!(this instanceof Url)) {
    return new Url(address, location, parser);
  }
  var relative,
    extracted,
    parse,
    instruction,
    index,
    key,
    instructions = rules.slice(),
    type = _typeof(location),
    url = this,
    i = 0;

  //
  // The following if statements allows this module two have compatibility with
  // 2 different API:
  //
  // 1. Node.js's `url.parse` api which accepts a URL, boolean as arguments
  //    where the boolean indicates that the query string should also be parsed.
  //
  // 2. The `URL` interface of the browser which accepts a URL, object as
  //    arguments. The supplied object will be used as default values / fall-back
  //    for relative paths.
  //
  if ('object' !== type && 'string' !== type) {
    parser = location;
    location = null;
  }
  if (parser && 'function' !== typeof parser) parser = qs.parse;
  location = lolcation(location);

  //
  // Extract protocol information before running the instructions.
  //
  extracted = extractProtocol(address || '', location);
  relative = !extracted.protocol && !extracted.slashes;
  url.slashes = extracted.slashes || relative && location.slashes;
  url.protocol = extracted.protocol || location.protocol || '';
  address = extracted.rest;

  //
  // When the authority component is absent the URL starts with a path
  // component.
  //
  if (extracted.protocol === 'file:' && (extracted.slashesCount !== 2 || windowsDriveLetter.test(address)) || !extracted.slashes && (extracted.protocol || extracted.slashesCount < 2 || !isSpecial(url.protocol))) {
    instructions[3] = [/(.*)/, 'pathname'];
  }
  for (; i < instructions.length; i++) {
    instruction = instructions[i];
    if (typeof instruction === 'function') {
      address = instruction(address, url);
      continue;
    }
    parse = instruction[0];
    key = instruction[1];
    if (parse !== parse) {
      url[key] = address;
    } else if ('string' === typeof parse) {
      index = parse === '@' ? address.lastIndexOf(parse) : address.indexOf(parse);
      if (~index) {
        if ('number' === typeof instruction[2]) {
          url[key] = address.slice(0, index);
          address = address.slice(index + instruction[2]);
        } else {
          url[key] = address.slice(index);
          address = address.slice(0, index);
        }
      }
    } else if (index = parse.exec(address)) {
      url[key] = index[1];
      address = address.slice(0, index.index);
    }
    url[key] = url[key] || (relative && instruction[3] ? location[key] || '' : '');

    //
    // Hostname, host and protocol should be lowercased so they can be used to
    // create a proper `origin`.
    //
    if (instruction[4]) url[key] = url[key].toLowerCase();
  }

  //
  // Also parse the supplied query string in to an object. If we're supplied
  // with a custom parser as function use that instead of the default build-in
  // parser.
  //
  if (parser) url.query = parser(url.query);

  //
  // If the URL is relative, resolve the pathname against the base URL.
  //
  if (relative && location.slashes && url.pathname.charAt(0) !== '/' && (url.pathname !== '' || location.pathname !== '')) {
    url.pathname = resolve(url.pathname, location.pathname);
  }

  //
  // Default to a / for pathname if none exists. This normalizes the URL
  // to always have a /
  //
  if (url.pathname.charAt(0) !== '/' && isSpecial(url.protocol)) {
    url.pathname = '/' + url.pathname;
  }

  //
  // We should not add port numbers if they are already the default port number
  // for a given protocol. As the host also contains the port number we're going
  // override it with the hostname which contains no port number.
  //
  if (!required(url.port, url.protocol)) {
    url.host = url.hostname;
    url.port = '';
  }

  //
  // Parse down the `auth` for the username and password.
  //
  url.username = url.password = '';
  if (url.auth) {
    index = url.auth.indexOf(':');
    if (~index) {
      url.username = url.auth.slice(0, index);
      url.username = encodeURIComponent(decodeURIComponent(url.username));
      url.password = url.auth.slice(index + 1);
      url.password = encodeURIComponent(decodeURIComponent(url.password));
    } else {
      url.username = encodeURIComponent(decodeURIComponent(url.auth));
    }
    url.auth = url.password ? url.username + ':' + url.password : url.username;
  }
  url.origin = url.protocol !== 'file:' && isSpecial(url.protocol) && url.host ? url.protocol + '//' + url.host : 'null';

  //
  // The href is just the compiled result.
  //
  url.href = url.toString();
}

/**
 * This is convenience method for changing properties in the URL instance to
 * insure that they all propagate correctly.
 *
 * @param {String} part          Property we need to adjust.
 * @param {Mixed} value          The newly assigned value.
 * @param {Boolean|Function} fn  When setting the query, it will be the function
 *                               used to parse the query.
 *                               When setting the protocol, double slash will be
 *                               removed from the final url if it is true.
 * @returns {URL} URL instance for chaining.
 * @public
 */
function set(part, value, fn) {
  var url = this;
  switch (part) {
    case 'query':
      if ('string' === typeof value && value.length) {
        value = (fn || qs.parse)(value);
      }
      url[part] = value;
      break;
    case 'port':
      url[part] = value;
      if (!required(value, url.protocol)) {
        url.host = url.hostname;
        url[part] = '';
      } else if (value) {
        url.host = url.hostname + ':' + value;
      }
      break;
    case 'hostname':
      url[part] = value;
      if (url.port) value += ':' + url.port;
      url.host = value;
      break;
    case 'host':
      url[part] = value;
      if (port.test(value)) {
        value = value.split(':');
        url.port = value.pop();
        url.hostname = value.join(':');
      } else {
        url.hostname = value;
        url.port = '';
      }
      break;
    case 'protocol':
      url.protocol = value.toLowerCase();
      url.slashes = !fn;
      break;
    case 'pathname':
    case 'hash':
      if (value) {
        var _char = part === 'pathname' ? '/' : '#';
        url[part] = value.charAt(0) !== _char ? _char + value : value;
      } else {
        url[part] = value;
      }
      break;
    case 'username':
    case 'password':
      url[part] = encodeURIComponent(value);
      break;
    case 'auth':
      var index = value.indexOf(':');
      if (~index) {
        url.username = value.slice(0, index);
        url.username = encodeURIComponent(decodeURIComponent(url.username));
        url.password = value.slice(index + 1);
        url.password = encodeURIComponent(decodeURIComponent(url.password));
      } else {
        url.username = encodeURIComponent(decodeURIComponent(value));
      }
  }
  for (var i = 0; i < rules.length; i++) {
    var ins = rules[i];
    if (ins[4]) url[ins[1]] = url[ins[1]].toLowerCase();
  }
  url.auth = url.password ? url.username + ':' + url.password : url.username;
  url.origin = url.protocol !== 'file:' && isSpecial(url.protocol) && url.host ? url.protocol + '//' + url.host : 'null';
  url.href = url.toString();
  return url;
}

/**
 * Transform the properties back in to a valid and full URL string.
 *
 * @param {Function} stringify Optional query stringify function.
 * @returns {String} Compiled version of the URL.
 * @public
 */
function toString(stringify) {
  if (!stringify || 'function' !== typeof stringify) stringify = qs.stringify;
  var query,
    url = this,
    host = url.host,
    protocol = url.protocol;
  if (protocol && protocol.charAt(protocol.length - 1) !== ':') protocol += ':';
  var result = protocol + (url.protocol && url.slashes || isSpecial(url.protocol) ? '//' : '');
  if (url.username) {
    result += url.username;
    if (url.password) result += ':' + url.password;
    result += '@';
  } else if (url.password) {
    result += ':' + url.password;
    result += '@';
  } else if (url.protocol !== 'file:' && isSpecial(url.protocol) && !host && url.pathname !== '/') {
    //
    // Add back the empty userinfo, otherwise the original invalid URL
    // might be transformed into a valid one with `url.pathname` as host.
    //
    result += '@';
  }

  //
  // Trailing colon is removed from `url.host` when it is parsed. If it still
  // ends with a colon, then add back the trailing colon that was removed. This
  // prevents an invalid URL from being transformed into a valid one.
  //
  if (host[host.length - 1] === ':' || port.test(url.hostname) && !url.port) {
    host += ':';
  }
  result += host + url.pathname;
  query = 'object' === _typeof(url.query) ? stringify(url.query) : url.query;
  if (query) result += '?' !== query.charAt(0) ? '?' + query : query;
  if (url.hash) result += url.hash;
  return result;
}
Url.prototype = {
  set: set,
  toString: toString
};

//
// Expose the URL parser and some additional properties that might be useful for
// others or testing.
//
Url.extractProtocol = extractProtocol;
Url.location = lolcation;
Url.trimLeft = trimLeft;
Url.qs = qs;
module.exports = Url;

/***/ }),

/***/ "./node_modules/util-deprecate/browser.js":
/*!************************************************!*\
  !*** ./node_modules/util-deprecate/browser.js ***!
  \************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate(fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }
  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }
  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config(name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!__webpack_require__.g.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = __webpack_require__.g.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

/***/ }),

/***/ "./node_modules/util/support/isBufferBrowser.js":
/*!******************************************************!*\
  !*** ./node_modules/util/support/isBufferBrowser.js ***!
  \******************************************************/
/***/ ((module) => {

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
module.exports = function isBuffer(arg) {
  return arg && _typeof(arg) === 'object' && typeof arg.copy === 'function' && typeof arg.fill === 'function' && typeof arg.readUInt8 === 'function';
};

/***/ }),

/***/ "./node_modules/util/support/types.js":
/*!********************************************!*\
  !*** ./node_modules/util/support/types.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
// Currently in sync with Node.js lib/internal/util/types.js
// https://github.com/nodejs/node/commit/112cc7c27551254aa2b17098fb774867f05ed0d9



function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var isArgumentsObject = __webpack_require__(/*! is-arguments */ "./node_modules/is-arguments/index.js");
var isGeneratorFunction = __webpack_require__(/*! is-generator-function */ "./node_modules/is-generator-function/index.js");
var whichTypedArray = __webpack_require__(/*! which-typed-array */ "./node_modules/which-typed-array/index.js");
var isTypedArray = __webpack_require__(/*! is-typed-array */ "./node_modules/is-typed-array/index.js");
function uncurryThis(f) {
  return f.call.bind(f);
}
var BigIntSupported = typeof BigInt !== 'undefined';
var SymbolSupported = typeof Symbol !== 'undefined';
var ObjectToString = uncurryThis(Object.prototype.toString);
var numberValue = uncurryThis(Number.prototype.valueOf);
var stringValue = uncurryThis(String.prototype.valueOf);
var booleanValue = uncurryThis(Boolean.prototype.valueOf);
if (BigIntSupported) {
  var bigIntValue = uncurryThis(BigInt.prototype.valueOf);
}
if (SymbolSupported) {
  var symbolValue = uncurryThis(Symbol.prototype.valueOf);
}
function checkBoxedPrimitive(value, prototypeValueOf) {
  if (_typeof(value) !== 'object') {
    return false;
  }
  try {
    prototypeValueOf(value);
    return true;
  } catch (e) {
    return false;
  }
}
exports.isArgumentsObject = isArgumentsObject;
exports.isGeneratorFunction = isGeneratorFunction;
exports.isTypedArray = isTypedArray;

// Taken from here and modified for better browser support
// https://github.com/sindresorhus/p-is-promise/blob/cda35a513bda03f977ad5cde3a079d237e82d7ef/index.js
function isPromise(input) {
  return typeof Promise !== 'undefined' && input instanceof Promise || input !== null && _typeof(input) === 'object' && typeof input.then === 'function' && typeof input["catch"] === 'function';
}
exports.isPromise = isPromise;
function isArrayBufferView(value) {
  if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView) {
    return ArrayBuffer.isView(value);
  }
  return isTypedArray(value) || isDataView(value);
}
exports.isArrayBufferView = isArrayBufferView;
function isUint8Array(value) {
  return whichTypedArray(value) === 'Uint8Array';
}
exports.isUint8Array = isUint8Array;
function isUint8ClampedArray(value) {
  return whichTypedArray(value) === 'Uint8ClampedArray';
}
exports.isUint8ClampedArray = isUint8ClampedArray;
function isUint16Array(value) {
  return whichTypedArray(value) === 'Uint16Array';
}
exports.isUint16Array = isUint16Array;
function isUint32Array(value) {
  return whichTypedArray(value) === 'Uint32Array';
}
exports.isUint32Array = isUint32Array;
function isInt8Array(value) {
  return whichTypedArray(value) === 'Int8Array';
}
exports.isInt8Array = isInt8Array;
function isInt16Array(value) {
  return whichTypedArray(value) === 'Int16Array';
}
exports.isInt16Array = isInt16Array;
function isInt32Array(value) {
  return whichTypedArray(value) === 'Int32Array';
}
exports.isInt32Array = isInt32Array;
function isFloat32Array(value) {
  return whichTypedArray(value) === 'Float32Array';
}
exports.isFloat32Array = isFloat32Array;
function isFloat64Array(value) {
  return whichTypedArray(value) === 'Float64Array';
}
exports.isFloat64Array = isFloat64Array;
function isBigInt64Array(value) {
  return whichTypedArray(value) === 'BigInt64Array';
}
exports.isBigInt64Array = isBigInt64Array;
function isBigUint64Array(value) {
  return whichTypedArray(value) === 'BigUint64Array';
}
exports.isBigUint64Array = isBigUint64Array;
function isMapToString(value) {
  return ObjectToString(value) === '[object Map]';
}
isMapToString.working = typeof Map !== 'undefined' && isMapToString(new Map());
function isMap(value) {
  if (typeof Map === 'undefined') {
    return false;
  }
  return isMapToString.working ? isMapToString(value) : value instanceof Map;
}
exports.isMap = isMap;
function isSetToString(value) {
  return ObjectToString(value) === '[object Set]';
}
isSetToString.working = typeof Set !== 'undefined' && isSetToString(new Set());
function isSet(value) {
  if (typeof Set === 'undefined') {
    return false;
  }
  return isSetToString.working ? isSetToString(value) : value instanceof Set;
}
exports.isSet = isSet;
function isWeakMapToString(value) {
  return ObjectToString(value) === '[object WeakMap]';
}
isWeakMapToString.working = typeof WeakMap !== 'undefined' && isWeakMapToString(new WeakMap());
function isWeakMap(value) {
  if (typeof WeakMap === 'undefined') {
    return false;
  }
  return isWeakMapToString.working ? isWeakMapToString(value) : value instanceof WeakMap;
}
exports.isWeakMap = isWeakMap;
function isWeakSetToString(value) {
  return ObjectToString(value) === '[object WeakSet]';
}
isWeakSetToString.working = typeof WeakSet !== 'undefined' && isWeakSetToString(new WeakSet());
function isWeakSet(value) {
  return isWeakSetToString(value);
}
exports.isWeakSet = isWeakSet;
function isArrayBufferToString(value) {
  return ObjectToString(value) === '[object ArrayBuffer]';
}
isArrayBufferToString.working = typeof ArrayBuffer !== 'undefined' && isArrayBufferToString(new ArrayBuffer());
function isArrayBuffer(value) {
  if (typeof ArrayBuffer === 'undefined') {
    return false;
  }
  return isArrayBufferToString.working ? isArrayBufferToString(value) : value instanceof ArrayBuffer;
}
exports.isArrayBuffer = isArrayBuffer;
function isDataViewToString(value) {
  return ObjectToString(value) === '[object DataView]';
}
isDataViewToString.working = typeof ArrayBuffer !== 'undefined' && typeof DataView !== 'undefined' && isDataViewToString(new DataView(new ArrayBuffer(1), 0, 1));
function isDataView(value) {
  if (typeof DataView === 'undefined') {
    return false;
  }
  return isDataViewToString.working ? isDataViewToString(value) : value instanceof DataView;
}
exports.isDataView = isDataView;

// Store a copy of SharedArrayBuffer in case it's deleted elsewhere
var SharedArrayBufferCopy = typeof SharedArrayBuffer !== 'undefined' ? SharedArrayBuffer : undefined;
function isSharedArrayBufferToString(value) {
  return ObjectToString(value) === '[object SharedArrayBuffer]';
}
function isSharedArrayBuffer(value) {
  if (typeof SharedArrayBufferCopy === 'undefined') {
    return false;
  }
  if (typeof isSharedArrayBufferToString.working === 'undefined') {
    isSharedArrayBufferToString.working = isSharedArrayBufferToString(new SharedArrayBufferCopy());
  }
  return isSharedArrayBufferToString.working ? isSharedArrayBufferToString(value) : value instanceof SharedArrayBufferCopy;
}
exports.isSharedArrayBuffer = isSharedArrayBuffer;
function isAsyncFunction(value) {
  return ObjectToString(value) === '[object AsyncFunction]';
}
exports.isAsyncFunction = isAsyncFunction;
function isMapIterator(value) {
  return ObjectToString(value) === '[object Map Iterator]';
}
exports.isMapIterator = isMapIterator;
function isSetIterator(value) {
  return ObjectToString(value) === '[object Set Iterator]';
}
exports.isSetIterator = isSetIterator;
function isGeneratorObject(value) {
  return ObjectToString(value) === '[object Generator]';
}
exports.isGeneratorObject = isGeneratorObject;
function isWebAssemblyCompiledModule(value) {
  return ObjectToString(value) === '[object WebAssembly.Module]';
}
exports.isWebAssemblyCompiledModule = isWebAssemblyCompiledModule;
function isNumberObject(value) {
  return checkBoxedPrimitive(value, numberValue);
}
exports.isNumberObject = isNumberObject;
function isStringObject(value) {
  return checkBoxedPrimitive(value, stringValue);
}
exports.isStringObject = isStringObject;
function isBooleanObject(value) {
  return checkBoxedPrimitive(value, booleanValue);
}
exports.isBooleanObject = isBooleanObject;
function isBigIntObject(value) {
  return BigIntSupported && checkBoxedPrimitive(value, bigIntValue);
}
exports.isBigIntObject = isBigIntObject;
function isSymbolObject(value) {
  return SymbolSupported && checkBoxedPrimitive(value, symbolValue);
}
exports.isSymbolObject = isSymbolObject;
function isBoxedPrimitive(value) {
  return isNumberObject(value) || isStringObject(value) || isBooleanObject(value) || isBigIntObject(value) || isSymbolObject(value);
}
exports.isBoxedPrimitive = isBoxedPrimitive;
function isAnyArrayBuffer(value) {
  return typeof Uint8Array !== 'undefined' && (isArrayBuffer(value) || isSharedArrayBuffer(value));
}
exports.isAnyArrayBuffer = isAnyArrayBuffer;
['isProxy', 'isExternal', 'isModuleNamespaceObject'].forEach(function (method) {
  Object.defineProperty(exports, method, {
    enumerable: false,
    value: function value() {
      throw new Error(method + ' is not supported in userland');
    }
  });
});

/***/ }),

/***/ "./node_modules/util/util.js":
/*!***********************************!*\
  !*** ./node_modules/util/util.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

/* provided dependency */ var process = __webpack_require__(/*! process/browser */ "./node_modules/process/browser.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors || function getOwnPropertyDescriptors(obj) {
  var keys = Object.keys(obj);
  var descriptors = {};
  for (var i = 0; i < keys.length; i++) {
    descriptors[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
  }
  return descriptors;
};
var formatRegExp = /%[sdj%]/g;
exports.format = function (f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }
  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function (x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s':
        return String(args[i++]);
      case '%d':
        return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};

// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function (fn, msg) {
  if (typeof process !== 'undefined' && process.noDeprecation === true) {
    return fn;
  }

  // Allow for deprecating things in the process of starting up.
  if (typeof process === 'undefined') {
    return function () {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }
  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }
  return deprecated;
};
var debugs = {};
var debugEnvRegex = /^$/;
if (process.env.NODE_DEBUG) {
  var debugEnv = process.env.NODE_DEBUG;
  debugEnv = debugEnv.replace(/[|\\{}()[\]^$+?.]/g, '\\$&').replace(/\*/g, '.*').replace(/,/g, '$|^').toUpperCase();
  debugEnvRegex = new RegExp('^' + debugEnv + '$', 'i');
}
exports.debuglog = function (set) {
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (debugEnvRegex.test(set)) {
      var pid = process.pid;
      debugs[set] = function () {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function () {};
    }
  }
  return debugs[set];
};

/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;

// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold': [1, 22],
  'italic': [3, 23],
  'underline': [4, 24],
  'inverse': [7, 27],
  'white': [37, 39],
  'grey': [90, 39],
  'black': [30, 39],
  'blue': [34, 39],
  'cyan': [36, 39],
  'green': [32, 39],
  'magenta': [35, 39],
  'red': [31, 39],
  'yellow': [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};
function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];
  if (style) {
    return "\x1B[" + inspect.colors[style][0] + 'm' + str + "\x1B[" + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}
function stylizeNoColor(str, styleType) {
  return str;
}
function arrayToHash(array) {
  var hash = {};
  array.forEach(function (val, idx) {
    hash[val] = true;
  });
  return hash;
}
function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect && value && isFunction(value.inspect) &&
  // Filter out the util module, it's inspect function is special
  value.inspect !== exports.inspect &&
  // Also filter out any prototype objects using the circular check.
  !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);
  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value) && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }
  var base = '',
    array = false,
    braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }
  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }
  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }
  ctx.seen.push(value);
  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function (key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }
  ctx.seen.pop();
  return reduceToSingleString(output, base, braces);
}
function formatPrimitive(ctx, value) {
  if (isUndefined(value)) return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '').replace(/'/g, "\\'").replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value)) return ctx.stylize('' + value, 'number');
  if (isBoolean(value)) return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value)) return ctx.stylize('null', 'null');
}
function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}
function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function (key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true));
    }
  });
  return output;
}
function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || {
    value: value[key]
  };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function (line) {
            return '  ' + line;
          }).join('\n').slice(2);
        } else {
          str = '\n' + str.split('\n').map(function (line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.slice(1, -1);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }
  return name + ': ' + str;
}
function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function (prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);
  if (length > 60) {
    return braces[0] + (base === '' ? '' : base + '\n ') + ' ' + output.join(',\n  ') + ' ' + braces[1];
  }
  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
exports.types = __webpack_require__(/*! ./support/types */ "./node_modules/util/support/types.js");
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;
function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;
function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;
function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;
function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;
function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;
function isSymbol(arg) {
  return _typeof(arg) === 'symbol';
}
exports.isSymbol = isSymbol;
function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;
function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;
exports.types.isRegExp = isRegExp;
function isObject(arg) {
  return _typeof(arg) === 'object' && arg !== null;
}
exports.isObject = isObject;
function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;
exports.types.isDate = isDate;
function isError(e) {
  return isObject(e) && (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;
exports.types.isNativeError = isError;
function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;
function isPrimitive(arg) {
  return arg === null || typeof arg === 'boolean' || typeof arg === 'number' || typeof arg === 'string' || _typeof(arg) === 'symbol' ||
  // ES6 symbol
  typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;
exports.isBuffer = __webpack_require__(/*! ./support/isBuffer */ "./node_modules/util/support/isBufferBrowser.js");
function objectToString(o) {
  return Object.prototype.toString.call(o);
}
function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}
var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}

// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function () {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};

/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = __webpack_require__(/*! inherits */ "./node_modules/inherits/inherits_browser.js");
exports._extend = function (origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;
  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
var kCustomPromisifiedSymbol = typeof Symbol !== 'undefined' ? Symbol('util.promisify.custom') : undefined;
exports.promisify = function promisify(original) {
  if (typeof original !== 'function') throw new TypeError('The "original" argument must be of type Function');
  if (kCustomPromisifiedSymbol && original[kCustomPromisifiedSymbol]) {
    var fn = original[kCustomPromisifiedSymbol];
    if (typeof fn !== 'function') {
      throw new TypeError('The "util.promisify.custom" argument must be of type Function');
    }
    Object.defineProperty(fn, kCustomPromisifiedSymbol, {
      value: fn,
      enumerable: false,
      writable: false,
      configurable: true
    });
    return fn;
  }
  function fn() {
    var promiseResolve, promiseReject;
    var promise = new Promise(function (resolve, reject) {
      promiseResolve = resolve;
      promiseReject = reject;
    });
    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    args.push(function (err, value) {
      if (err) {
        promiseReject(err);
      } else {
        promiseResolve(value);
      }
    });
    try {
      original.apply(this, args);
    } catch (err) {
      promiseReject(err);
    }
    return promise;
  }
  Object.setPrototypeOf(fn, Object.getPrototypeOf(original));
  if (kCustomPromisifiedSymbol) Object.defineProperty(fn, kCustomPromisifiedSymbol, {
    value: fn,
    enumerable: false,
    writable: false,
    configurable: true
  });
  return Object.defineProperties(fn, getOwnPropertyDescriptors(original));
};
exports.promisify.custom = kCustomPromisifiedSymbol;
function callbackifyOnRejected(reason, cb) {
  // `!reason` guard inspired by bluebird (Ref: https://goo.gl/t5IS6M).
  // Because `null` is a special error value in callbacks which means "no error
  // occurred", we error-wrap so the callback consumer can distinguish between
  // "the promise rejected with null" or "the promise fulfilled with undefined".
  if (!reason) {
    var newReason = new Error('Promise was rejected with a falsy value');
    newReason.reason = reason;
    reason = newReason;
  }
  return cb(reason);
}
function callbackify(original) {
  if (typeof original !== 'function') {
    throw new TypeError('The "original" argument must be of type Function');
  }

  // We DO NOT return the promise as it gives the user a false sense that
  // the promise is actually somehow related to the callback's execution
  // and that the callback throwing will reject the promise.
  function callbackified() {
    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    var maybeCb = args.pop();
    if (typeof maybeCb !== 'function') {
      throw new TypeError('The last argument must be of type Function');
    }
    var self = this;
    var cb = function cb() {
      return maybeCb.apply(self, arguments);
    };
    // In true node style we process the callback on `nextTick` with all the
    // implications (stack, `uncaughtException`, `async_hooks`)
    original.apply(this, args).then(function (ret) {
      process.nextTick(cb.bind(null, null, ret));
    }, function (rej) {
      process.nextTick(callbackifyOnRejected.bind(null, rej, cb));
    });
  }
  Object.setPrototypeOf(callbackified, Object.getPrototypeOf(original));
  Object.defineProperties(callbackified, getOwnPropertyDescriptors(original));
  return callbackified;
}
exports.callbackify = callbackify;

/***/ }),

/***/ "./node_modules/webdav/dist/node/auth/basic.js":
/*!*****************************************************!*\
  !*** ./node_modules/webdav/dist/node/auth/basic.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.generateBasicAuthHeader = void 0;
var encode_1 = __webpack_require__(/*! ../tools/encode */ "./node_modules/webdav/dist/node/tools/encode.js");
function generateBasicAuthHeader(username, password) {
  var encoded = (0, encode_1.toBase64)("".concat(username, ":").concat(password));
  return "Basic ".concat(encoded);
}
exports.generateBasicAuthHeader = generateBasicAuthHeader;

/***/ }),

/***/ "./node_modules/webdav/dist/node/auth/digest.js":
/*!******************************************************!*\
  !*** ./node_modules/webdav/dist/node/auth/digest.js ***!
  \******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.parseDigestAuth = exports.generateDigestAuthHeader = exports.createDigestContext = void 0;
var md5_1 = __importDefault(__webpack_require__(/*! md5 */ "./node_modules/md5/md5.js"));
var crypto_1 = __webpack_require__(/*! ../tools/crypto */ "./node_modules/webdav/dist/node/tools/crypto.js");
var NONCE_CHARS = "abcdef0123456789";
var NONCE_SIZE = 32;
function createDigestContext(username, password) {
  return {
    username: username,
    password: password,
    nc: 0,
    algorithm: "md5",
    hasDigestAuth: false
  };
}
exports.createDigestContext = createDigestContext;
function generateDigestAuthHeader(options, digest) {
  var url = options.url.replace("//", "");
  var uri = url.indexOf("/") == -1 ? "/" : url.slice(url.indexOf("/"));
  var method = options.method ? options.method.toUpperCase() : "GET";
  var qop = /(^|,)\s*auth\s*($|,)/.test(digest.qop) ? "auth" : false;
  var ncString = "00000000".concat(digest.nc).slice(-8);
  var ha1 = (0, crypto_1.ha1Compute)(digest.algorithm, digest.username, digest.realm, digest.password, digest.nonce, digest.cnonce);
  var ha2 = (0, md5_1["default"])("".concat(method, ":").concat(uri));
  var digestResponse = qop ? (0, md5_1["default"])("".concat(ha1, ":").concat(digest.nonce, ":").concat(ncString, ":").concat(digest.cnonce, ":").concat(qop, ":").concat(ha2)) : (0, md5_1["default"])("".concat(ha1, ":").concat(digest.nonce, ":").concat(ha2));
  var authValues = {
    username: digest.username,
    realm: digest.realm,
    nonce: digest.nonce,
    uri: uri,
    qop: qop,
    response: digestResponse,
    nc: ncString,
    cnonce: digest.cnonce,
    algorithm: digest.algorithm,
    opaque: digest.opaque
  };
  var authHeader = [];
  for (var k in authValues) {
    if (authValues[k]) {
      if (k === "qop" || k === "nc" || k === "algorithm") {
        authHeader.push("".concat(k, "=").concat(authValues[k]));
      } else {
        authHeader.push("".concat(k, "=\"").concat(authValues[k], "\""));
      }
    }
  }
  return "Digest ".concat(authHeader.join(", "));
}
exports.generateDigestAuthHeader = generateDigestAuthHeader;
function makeNonce() {
  var uid = "";
  for (var i = 0; i < NONCE_SIZE; ++i) {
    uid = "".concat(uid).concat(NONCE_CHARS[Math.floor(Math.random() * NONCE_CHARS.length)]);
  }
  return uid;
}
function parseDigestAuth(response, _digest) {
  var authHeader = response.headers["www-authenticate"] || "";
  if (authHeader.split(/\s/)[0].toLowerCase() !== "digest") {
    return false;
  }
  var re = /([a-z0-9_-]+)=(?:"([^"]+)"|([a-z0-9_-]+))/gi;
  for (;;) {
    var match = re.exec(authHeader);
    if (!match) {
      break;
    }
    _digest[match[1]] = match[2] || match[3];
  }
  _digest.nc += 1;
  _digest.cnonce = makeNonce();
  return true;
}
exports.parseDigestAuth = parseDigestAuth;

/***/ }),

/***/ "./node_modules/webdav/dist/node/auth/index.js":
/*!*****************************************************!*\
  !*** ./node_modules/webdav/dist/node/auth/index.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.setupAuth = void 0;
var layerr_1 = __webpack_require__(/*! layerr */ "./node_modules/layerr/dist/index.js");
var digest_1 = __webpack_require__(/*! ./digest */ "./node_modules/webdav/dist/node/auth/digest.js");
var basic_1 = __webpack_require__(/*! ./basic */ "./node_modules/webdav/dist/node/auth/basic.js");
var oauth_1 = __webpack_require__(/*! ./oauth */ "./node_modules/webdav/dist/node/auth/oauth.js");
var types_1 = __webpack_require__(/*! ../types */ "./node_modules/webdav/dist/node/types.js");
function setupAuth(context, username, password, oauthToken) {
  switch (context.authType) {
    case types_1.AuthType.Digest:
      context.digest = (0, digest_1.createDigestContext)(username, password);
      break;
    case types_1.AuthType.None:
      // Do nothing
      break;
    case types_1.AuthType.Password:
      context.headers.Authorization = (0, basic_1.generateBasicAuthHeader)(username, password);
      break;
    case types_1.AuthType.Token:
      context.headers.Authorization = (0, oauth_1.generateTokenAuthHeader)(oauthToken);
      break;
    default:
      throw new layerr_1.Layerr({
        info: {
          code: types_1.ErrorCode.InvalidAuthType
        }
      }, "Invalid auth type: ".concat(context.authType));
  }
}
exports.setupAuth = setupAuth;

/***/ }),

/***/ "./node_modules/webdav/dist/node/auth/oauth.js":
/*!*****************************************************!*\
  !*** ./node_modules/webdav/dist/node/auth/oauth.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.generateTokenAuthHeader = void 0;
function generateTokenAuthHeader(token) {
  return "".concat(token.token_type, " ").concat(token.access_token);
}
exports.generateTokenAuthHeader = generateTokenAuthHeader;

/***/ }),

/***/ "./node_modules/webdav/dist/node/compat/arrayBuffer.js":
/*!*************************************************************!*\
  !*** ./node_modules/webdav/dist/node/compat/arrayBuffer.js ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.isArrayBuffer = void 0;
var hasArrayBuffer = typeof ArrayBuffer === "function";
var objToString = Object.prototype.toString;
// Taken from: https://github.com/fengyuanchen/is-array-buffer/blob/master/src/index.js
function isArrayBuffer(value) {
  return hasArrayBuffer && (value instanceof ArrayBuffer || objToString.call(value) === "[object ArrayBuffer]");
}
exports.isArrayBuffer = isArrayBuffer;

/***/ }),

/***/ "./node_modules/webdav/dist/node/compat/buffer.js":
/*!********************************************************!*\
  !*** ./node_modules/webdav/dist/node/compat/buffer.js ***!
  \********************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.isBuffer = void 0;
function isBuffer(value) {
  return value != null && value.constructor != null && typeof value.constructor.isBuffer === "function" && value.constructor.isBuffer(value);
}
exports.isBuffer = isBuffer;

/***/ }),

/***/ "./node_modules/webdav/dist/node/compat/patcher.js":
/*!*********************************************************!*\
  !*** ./node_modules/webdav/dist/node/compat/patcher.js ***!
  \*********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.getPatcher = void 0;
var hot_patcher_1 = __importDefault(__webpack_require__(/*! hot-patcher */ "./node_modules/hot-patcher/source/index.js"));
var __patcher = null;
function getPatcher() {
  if (!__patcher) {
    __patcher = new hot_patcher_1["default"]();
  }
  return __patcher;
}
exports.getPatcher = getPatcher;

/***/ }),

/***/ "./node_modules/webdav/dist/node/factory.js":
/*!**************************************************!*\
  !*** ./node_modules/webdav/dist/node/factory.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.createClient = void 0;
var url_1 = __webpack_require__(/*! ./tools/url */ "./node_modules/webdav/dist/node/tools/url.js");
var index_1 = __webpack_require__(/*! ./auth/index */ "./node_modules/webdav/dist/node/auth/index.js");
var copyFile_1 = __webpack_require__(/*! ./operations/copyFile */ "./node_modules/webdav/dist/node/operations/copyFile.js");
var createDirectory_1 = __webpack_require__(/*! ./operations/createDirectory */ "./node_modules/webdav/dist/node/operations/createDirectory.js");
var createStream_1 = __webpack_require__(/*! ./operations/createStream */ "./node_modules/webdav/dist/node/operations/createStream.js");
var customRequest_1 = __webpack_require__(/*! ./operations/customRequest */ "./node_modules/webdav/dist/node/operations/customRequest.js");
var deleteFile_1 = __webpack_require__(/*! ./operations/deleteFile */ "./node_modules/webdav/dist/node/operations/deleteFile.js");
var exists_1 = __webpack_require__(/*! ./operations/exists */ "./node_modules/webdav/dist/node/operations/exists.js");
var directoryContents_1 = __webpack_require__(/*! ./operations/directoryContents */ "./node_modules/webdav/dist/node/operations/directoryContents.js");
var getFileContents_1 = __webpack_require__(/*! ./operations/getFileContents */ "./node_modules/webdav/dist/node/operations/getFileContents.js");
var lock_1 = __webpack_require__(/*! ./operations/lock */ "./node_modules/webdav/dist/node/operations/lock.js");
var getQuota_1 = __webpack_require__(/*! ./operations/getQuota */ "./node_modules/webdav/dist/node/operations/getQuota.js");
var stat_1 = __webpack_require__(/*! ./operations/stat */ "./node_modules/webdav/dist/node/operations/stat.js");
var moveFile_1 = __webpack_require__(/*! ./operations/moveFile */ "./node_modules/webdav/dist/node/operations/moveFile.js");
var putFileContents_1 = __webpack_require__(/*! ./operations/putFileContents */ "./node_modules/webdav/dist/node/operations/putFileContents.js");
var types_1 = __webpack_require__(/*! ./types */ "./node_modules/webdav/dist/node/types.js");
var DEFAULT_CONTACT_HREF = "https://github.com/perry-mitchell/webdav-client/blob/master/LOCK_CONTACT.md";
function createClient(remoteURL, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.authType,
    authTypeRaw = _a === void 0 ? null : _a,
    _b = options.contactHref,
    contactHref = _b === void 0 ? DEFAULT_CONTACT_HREF : _b,
    _c = options.headers,
    headers = _c === void 0 ? {} : _c,
    httpAgent = options.httpAgent,
    httpsAgent = options.httpsAgent,
    maxBodyLength = options.maxBodyLength,
    maxContentLength = options.maxContentLength,
    password = options.password,
    token = options.token,
    username = options.username,
    withCredentials = options.withCredentials;
  var authType = authTypeRaw;
  if (!authType) {
    authType = username || password ? types_1.AuthType.Password : types_1.AuthType.None;
  }
  var context = {
    authType: authType,
    contactHref: contactHref,
    headers: Object.assign({}, headers),
    httpAgent: httpAgent,
    httpsAgent: httpsAgent,
    maxBodyLength: maxBodyLength,
    maxContentLength: maxContentLength,
    remotePath: (0, url_1.extractURLPath)(remoteURL),
    remoteURL: remoteURL,
    password: password,
    token: token,
    username: username,
    withCredentials: withCredentials
  };
  (0, index_1.setupAuth)(context, username, password, token);
  return {
    copyFile: function copyFile(filename, destination, options) {
      return (0, copyFile_1.copyFile)(context, filename, destination, options);
    },
    createDirectory: function createDirectory(path, options) {
      return (0, createDirectory_1.createDirectory)(context, path, options);
    },
    createReadStream: function createReadStream(filename, options) {
      return (0, createStream_1.createReadStream)(context, filename, options);
    },
    createWriteStream: function createWriteStream(filename, options, callback) {
      return (0, createStream_1.createWriteStream)(context, filename, options, callback);
    },
    customRequest: function customRequest(path, requestOptions) {
      return (0, customRequest_1.customRequest)(context, path, requestOptions);
    },
    deleteFile: function deleteFile(filename, options) {
      return (0, deleteFile_1.deleteFile)(context, filename, options);
    },
    exists: function exists(path, options) {
      return (0, exists_1.exists)(context, path, options);
    },
    getDirectoryContents: function getDirectoryContents(path, options) {
      return (0, directoryContents_1.getDirectoryContents)(context, path, options);
    },
    getFileContents: function getFileContents(filename, options) {
      return (0, getFileContents_1.getFileContents)(context, filename, options);
    },
    getFileDownloadLink: function getFileDownloadLink(filename) {
      return (0, getFileContents_1.getFileDownloadLink)(context, filename);
    },
    getFileUploadLink: function getFileUploadLink(filename) {
      return (0, putFileContents_1.getFileUploadLink)(context, filename);
    },
    getHeaders: function getHeaders() {
      return Object.assign({}, context.headers);
    },
    getQuota: function getQuota(options) {
      return (0, getQuota_1.getQuota)(context, options);
    },
    lock: function lock(path, options) {
      return (0, lock_1.lock)(context, path, options);
    },
    moveFile: function moveFile(filename, destinationFilename, options) {
      return (0, moveFile_1.moveFile)(context, filename, destinationFilename, options);
    },
    putFileContents: function putFileContents(filename, data, options) {
      return (0, putFileContents_1.putFileContents)(context, filename, data, options);
    },
    setHeaders: function setHeaders(headers) {
      context.headers = Object.assign({}, headers);
    },
    stat: function stat(path, options) {
      return (0, stat_1.getStat)(context, path, options);
    },
    unlock: function unlock(path, token, options) {
      return (0, lock_1.unlock)(context, path, token, options);
    }
  };
}
exports.createClient = createClient;

/***/ }),

/***/ "./node_modules/webdav/dist/node/index.js":
/*!************************************************!*\
  !*** ./node_modules/webdav/dist/node/index.js ***!
  \************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var __createBinding = this && this.__createBinding || (Object.create ? function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
    desc = {
      enumerable: true,
      get: function get() {
        return m[k];
      }
    };
  }
  Object.defineProperty(o, k2, desc);
} : function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});
var __exportStar = this && this.__exportStar || function (m, exports) {
  for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.parseXML = exports.parseStat = exports.getPatcher = exports.createClient = void 0;
var factory_1 = __webpack_require__(/*! ./factory */ "./node_modules/webdav/dist/node/factory.js");
Object.defineProperty(exports, "createClient", ({
  enumerable: true,
  get: function get() {
    return factory_1.createClient;
  }
}));
var patcher_1 = __webpack_require__(/*! ./compat/patcher */ "./node_modules/webdav/dist/node/compat/patcher.js");
Object.defineProperty(exports, "getPatcher", ({
  enumerable: true,
  get: function get() {
    return patcher_1.getPatcher;
  }
}));
__exportStar(__webpack_require__(/*! ./types */ "./node_modules/webdav/dist/node/types.js"), exports);
var dav_1 = __webpack_require__(/*! ./tools/dav */ "./node_modules/webdav/dist/node/tools/dav.js");
Object.defineProperty(exports, "parseStat", ({
  enumerable: true,
  get: function get() {
    return dav_1.parseStat;
  }
}));
Object.defineProperty(exports, "parseXML", ({
  enumerable: true,
  get: function get() {
    return dav_1.parseXML;
  }
}));

/***/ }),

/***/ "./node_modules/webdav/dist/node/operations/copyFile.js":
/*!**************************************************************!*\
  !*** ./node_modules/webdav/dist/node/operations/copyFile.js ***!
  \**************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator = this && this.__generator || function (thisArg, body) {
  var _ = {
      label: 0,
      sent: function sent() {
        if (t[0] & 1) throw t[1];
        return t[1];
      },
      trys: [],
      ops: []
    },
    f,
    y,
    t,
    g;
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
    return this;
  }), g;
  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (_) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return {
            value: op[1],
            done: false
          };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.copyFile = void 0;
var url_1 = __webpack_require__(/*! ../tools/url */ "./node_modules/webdav/dist/node/tools/url.js");
var path_1 = __webpack_require__(/*! ../tools/path */ "./node_modules/webdav/dist/node/tools/path.js");
var request_1 = __webpack_require__(/*! ../request */ "./node_modules/webdav/dist/node/request.js");
var response_1 = __webpack_require__(/*! ../response */ "./node_modules/webdav/dist/node/response.js");
function copyFile(context, filename, destination, options) {
  if (options === void 0) {
    options = {};
  }
  return __awaiter(this, void 0, void 0, function () {
    var requestOptions, response;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          requestOptions = (0, request_1.prepareRequestOptions)({
            url: (0, url_1.joinURL)(context.remoteURL, (0, path_1.encodePath)(filename)),
            method: "COPY",
            headers: {
              Destination: (0, url_1.joinURL)(context.remoteURL, (0, path_1.encodePath)(destination))
            }
          }, context, options);
          return [4 /*yield*/, (0, request_1.request)(requestOptions)];
        case 1:
          response = _a.sent();
          (0, response_1.handleResponseCode)(context, response);
          return [2 /*return*/];
      }
    });
  });
}
exports.copyFile = copyFile;

/***/ }),

/***/ "./node_modules/webdav/dist/node/operations/createDirectory.js":
/*!*********************************************************************!*\
  !*** ./node_modules/webdav/dist/node/operations/createDirectory.js ***!
  \*********************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var __assign = this && this.__assign || function () {
  __assign = Object.assign || function (t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator = this && this.__generator || function (thisArg, body) {
  var _ = {
      label: 0,
      sent: function sent() {
        if (t[0] & 1) throw t[1];
        return t[1];
      },
      trys: [],
      ops: []
    },
    f,
    y,
    t,
    g;
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
    return this;
  }), g;
  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (_) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return {
            value: op[1],
            done: false
          };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.createDirectory = void 0;
var url_1 = __webpack_require__(/*! ../tools/url */ "./node_modules/webdav/dist/node/tools/url.js");
var path_1 = __webpack_require__(/*! ../tools/path */ "./node_modules/webdav/dist/node/tools/path.js");
var request_1 = __webpack_require__(/*! ../request */ "./node_modules/webdav/dist/node/request.js");
var response_1 = __webpack_require__(/*! ../response */ "./node_modules/webdav/dist/node/response.js");
var stat_1 = __webpack_require__(/*! ./stat */ "./node_modules/webdav/dist/node/operations/stat.js");
function createDirectory(context, dirPath, options) {
  if (options === void 0) {
    options = {};
  }
  return __awaiter(this, void 0, void 0, function () {
    var requestOptions, response;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          if (options.recursive === true) return [2 /*return*/, createDirectoryRecursively(context, dirPath, options)];
          requestOptions = (0, request_1.prepareRequestOptions)({
            url: (0, url_1.joinURL)(context.remoteURL, ensureCollectionPath((0, path_1.encodePath)(dirPath))),
            method: "MKCOL"
          }, context, options);
          return [4 /*yield*/, (0, request_1.request)(requestOptions)];
        case 1:
          response = _a.sent();
          (0, response_1.handleResponseCode)(context, response);
          return [2 /*return*/];
      }
    });
  });
}
exports.createDirectory = createDirectory;
/**
 * Ensure the path is a proper "collection" path by ensuring it has a trailing "/".
 * The proper format of collection according to the specification does contain the trailing slash.
 * http://www.webdav.org/specs/rfc4918.html#rfc.section.5.2
 * @param path Path of the collection
 * @return string Path of the collection with appended trailing "/" in case the `path` does not have it.
 */
function ensureCollectionPath(path) {
  if (!path.endsWith("/")) {
    return path + "/";
  }
  return path;
}
function createDirectoryRecursively(context, dirPath, options) {
  if (options === void 0) {
    options = {};
  }
  return __awaiter(this, void 0, void 0, function () {
    var paths, creating, _i, paths_1, testPath, testStat, err_1, error;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          paths = (0, path_1.getAllDirectories)((0, path_1.normalisePath)(dirPath));
          paths.sort(function (a, b) {
            if (a.length > b.length) {
              return 1;
            } else if (b.length > a.length) {
              return -1;
            }
            return 0;
          });
          creating = false;
          _i = 0, paths_1 = paths;
          _a.label = 1;
        case 1:
          if (!(_i < paths_1.length)) return [3 /*break*/, 10];
          testPath = paths_1[_i];
          if (!creating) return [3 /*break*/, 3];
          return [4 /*yield*/, createDirectory(context, testPath, __assign(__assign({}, options), {
            recursive: false
          }))];
        case 2:
          _a.sent();
          return [3 /*break*/, 9];
        case 3:
          _a.trys.push([3, 5,, 9]);
          return [4 /*yield*/, (0, stat_1.getStat)(context, testPath)];
        case 4:
          testStat = _a.sent();
          if (testStat.type !== "directory") {
            throw new Error("Path includes a file: ".concat(dirPath));
          }
          return [3 /*break*/, 9];
        case 5:
          err_1 = _a.sent();
          error = err_1;
          if (!(error.status === 404)) return [3 /*break*/, 7];
          creating = true;
          return [4 /*yield*/, createDirectory(context, testPath, __assign(__assign({}, options), {
            recursive: false
          }))];
        case 6:
          _a.sent();
          return [3 /*break*/, 8];
        case 7:
          throw err_1;
        case 8:
          return [3 /*break*/, 9];
        case 9:
          _i++;
          return [3 /*break*/, 1];
        case 10:
          return [2 /*return*/];
      }
    });
  });
}

/***/ }),

/***/ "./node_modules/webdav/dist/node/operations/createStream.js":
/*!******************************************************************!*\
  !*** ./node_modules/webdav/dist/node/operations/createStream.js ***!
  \******************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator = this && this.__generator || function (thisArg, body) {
  var _ = {
      label: 0,
      sent: function sent() {
        if (t[0] & 1) throw t[1];
        return t[1];
      },
      trys: [],
      ops: []
    },
    f,
    y,
    t,
    g;
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
    return this;
  }), g;
  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (_) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return {
            value: op[1],
            done: false
          };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
};
var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.createWriteStream = exports.createReadStream = void 0;
var stream_1 = __importDefault(__webpack_require__(/*! stream */ "./node_modules/stream-browserify/index.js"));
var url_1 = __webpack_require__(/*! ../tools/url */ "./node_modules/webdav/dist/node/tools/url.js");
var path_1 = __webpack_require__(/*! ../tools/path */ "./node_modules/webdav/dist/node/tools/path.js");
var request_1 = __webpack_require__(/*! ../request */ "./node_modules/webdav/dist/node/request.js");
var response_1 = __webpack_require__(/*! ../response */ "./node_modules/webdav/dist/node/response.js");
var NOOP = function NOOP() {};
function createReadStream(context, filePath, options) {
  if (options === void 0) {
    options = {};
  }
  var PassThroughStream = stream_1["default"].PassThrough;
  var outStream = new PassThroughStream();
  getFileStream(context, filePath, options).then(function (stream) {
    stream.pipe(outStream);
  })["catch"](function (err) {
    outStream.emit("error", err);
  });
  return outStream;
}
exports.createReadStream = createReadStream;
function createWriteStream(context, filePath, options, callback) {
  if (options === void 0) {
    options = {};
  }
  if (callback === void 0) {
    callback = NOOP;
  }
  var PassThroughStream = stream_1["default"].PassThrough;
  var writeStream = new PassThroughStream();
  var headers = {};
  if (options.overwrite === false) {
    headers["If-None-Match"] = "*";
  }
  var requestOptions = (0, request_1.prepareRequestOptions)({
    url: (0, url_1.joinURL)(context.remoteURL, (0, path_1.encodePath)(filePath)),
    method: "PUT",
    headers: headers,
    data: writeStream,
    maxRedirects: 0
  }, context, options);
  (0, request_1.request)(requestOptions).then(function (response) {
    return (0, response_1.handleResponseCode)(context, response);
  }).then(function (response) {
    // Fire callback asynchronously to avoid errors
    setTimeout(function () {
      callback(response);
    }, 0);
  })["catch"](function (err) {
    writeStream.emit("error", err);
  });
  return writeStream;
}
exports.createWriteStream = createWriteStream;
function getFileStream(context, filePath, options) {
  if (options === void 0) {
    options = {};
  }
  return __awaiter(this, void 0, void 0, function () {
    var headers, rangeHeader, requestOptions, response, responseError;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          headers = {};
          if (_typeof(options.range) === "object" && typeof options.range.start === "number") {
            rangeHeader = "bytes=".concat(options.range.start, "-");
            if (typeof options.range.end === "number") {
              rangeHeader = "".concat(rangeHeader).concat(options.range.end);
            }
            headers.Range = rangeHeader;
          }
          requestOptions = (0, request_1.prepareRequestOptions)({
            url: (0, url_1.joinURL)(context.remoteURL, (0, path_1.encodePath)(filePath)),
            method: "GET",
            headers: headers,
            responseType: "stream"
          }, context, options);
          return [4 /*yield*/, (0, request_1.request)(requestOptions)];
        case 1:
          response = _a.sent();
          (0, response_1.handleResponseCode)(context, response);
          if (headers.Range && response.status !== 206) {
            responseError = new Error("Invalid response code for partial request: ".concat(response.status));
            responseError.status = response.status;
            throw responseError;
          }
          if (options.callback) {
            setTimeout(function () {
              options.callback(response);
            }, 0);
          }
          return [2 /*return*/, response.data];
      }
    });
  });
}

/***/ }),

/***/ "./node_modules/webdav/dist/node/operations/customRequest.js":
/*!*******************************************************************!*\
  !*** ./node_modules/webdav/dist/node/operations/customRequest.js ***!
  \*******************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator = this && this.__generator || function (thisArg, body) {
  var _ = {
      label: 0,
      sent: function sent() {
        if (t[0] & 1) throw t[1];
        return t[1];
      },
      trys: [],
      ops: []
    },
    f,
    y,
    t,
    g;
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
    return this;
  }), g;
  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (_) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return {
            value: op[1],
            done: false
          };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.customRequest = void 0;
var url_1 = __webpack_require__(/*! ../tools/url */ "./node_modules/webdav/dist/node/tools/url.js");
var path_1 = __webpack_require__(/*! ../tools/path */ "./node_modules/webdav/dist/node/tools/path.js");
var request_1 = __webpack_require__(/*! ../request */ "./node_modules/webdav/dist/node/request.js");
var response_1 = __webpack_require__(/*! ../response */ "./node_modules/webdav/dist/node/response.js");
function customRequest(context, remotePath, requestOptions) {
  return __awaiter(this, void 0, void 0, function () {
    var finalOptions, response;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          if (!requestOptions.url) {
            requestOptions.url = (0, url_1.joinURL)(context.remoteURL, (0, path_1.encodePath)(remotePath));
          }
          finalOptions = (0, request_1.prepareRequestOptions)(requestOptions, context, {});
          return [4 /*yield*/, (0, request_1.request)(finalOptions)];
        case 1:
          response = _a.sent();
          (0, response_1.handleResponseCode)(context, response);
          return [2 /*return*/, response];
      }
    });
  });
}
exports.customRequest = customRequest;

/***/ }),

/***/ "./node_modules/webdav/dist/node/operations/deleteFile.js":
/*!****************************************************************!*\
  !*** ./node_modules/webdav/dist/node/operations/deleteFile.js ***!
  \****************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator = this && this.__generator || function (thisArg, body) {
  var _ = {
      label: 0,
      sent: function sent() {
        if (t[0] & 1) throw t[1];
        return t[1];
      },
      trys: [],
      ops: []
    },
    f,
    y,
    t,
    g;
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
    return this;
  }), g;
  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (_) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return {
            value: op[1],
            done: false
          };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.deleteFile = void 0;
var url_1 = __webpack_require__(/*! ../tools/url */ "./node_modules/webdav/dist/node/tools/url.js");
var path_1 = __webpack_require__(/*! ../tools/path */ "./node_modules/webdav/dist/node/tools/path.js");
var request_1 = __webpack_require__(/*! ../request */ "./node_modules/webdav/dist/node/request.js");
var response_1 = __webpack_require__(/*! ../response */ "./node_modules/webdav/dist/node/response.js");
function deleteFile(context, filename, options) {
  if (options === void 0) {
    options = {};
  }
  return __awaiter(this, void 0, void 0, function () {
    var requestOptions, response;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          requestOptions = (0, request_1.prepareRequestOptions)({
            url: (0, url_1.joinURL)(context.remoteURL, (0, path_1.encodePath)(filename)),
            method: "DELETE"
          }, context, options);
          return [4 /*yield*/, (0, request_1.request)(requestOptions)];
        case 1:
          response = _a.sent();
          (0, response_1.handleResponseCode)(context, response);
          return [2 /*return*/];
      }
    });
  });
}
exports.deleteFile = deleteFile;

/***/ }),

/***/ "./node_modules/webdav/dist/node/operations/directoryContents.js":
/*!***********************************************************************!*\
  !*** ./node_modules/webdav/dist/node/operations/directoryContents.js ***!
  \***********************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator = this && this.__generator || function (thisArg, body) {
  var _ = {
      label: 0,
      sent: function sent() {
        if (t[0] & 1) throw t[1];
        return t[1];
      },
      trys: [],
      ops: []
    },
    f,
    y,
    t,
    g;
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
    return this;
  }), g;
  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (_) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return {
            value: op[1],
            done: false
          };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
};
var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.getDirectoryContents = void 0;
var path_posix_1 = __importDefault(__webpack_require__(/*! path-posix */ "./node_modules/path-posix/index.js"));
var url_1 = __webpack_require__(/*! ../tools/url */ "./node_modules/webdav/dist/node/tools/url.js");
var path_1 = __webpack_require__(/*! ../tools/path */ "./node_modules/webdav/dist/node/tools/path.js");
var dav_1 = __webpack_require__(/*! ../tools/dav */ "./node_modules/webdav/dist/node/tools/dav.js");
var request_1 = __webpack_require__(/*! ../request */ "./node_modules/webdav/dist/node/request.js");
var response_1 = __webpack_require__(/*! ../response */ "./node_modules/webdav/dist/node/response.js");
function getDirectoryContents(context, remotePath, options) {
  if (options === void 0) {
    options = {};
  }
  return __awaiter(this, void 0, void 0, function () {
    var requestOptions, response, davResp, files;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          requestOptions = (0, request_1.prepareRequestOptions)({
            url: (0, url_1.joinURL)(context.remoteURL, (0, path_1.encodePath)(remotePath), "/"),
            method: "PROPFIND",
            headers: {
              Accept: "text/plain",
              Depth: options.deep ? "infinity" : "1"
            },
            responseType: "text"
          }, context, options);
          return [4 /*yield*/, (0, request_1.request)(requestOptions)];
        case 1:
          response = _a.sent();
          (0, response_1.handleResponseCode)(context, response);
          return [4 /*yield*/, (0, dav_1.parseXML)(response.data)];
        case 2:
          davResp = _a.sent();
          files = getDirectoryFiles(davResp, context.remotePath, remotePath, options.details);
          if (options.glob) {
            files = (0, response_1.processGlobFilter)(files, options.glob);
          }
          return [2 /*return*/, (0, response_1.processResponsePayload)(response, files, options.details)];
      }
    });
  });
}
exports.getDirectoryContents = getDirectoryContents;
function getDirectoryFiles(result, serverBasePath, requestPath, isDetailed) {
  if (isDetailed === void 0) {
    isDetailed = false;
  }
  var serverBase = path_posix_1["default"].join(serverBasePath, "/");
  // Extract the response items (directory contents)
  var responseItems = result.multistatus.response;
  return responseItems
  // Map all items to a consistent output structure (results)
  .map(function (item) {
    // HREF is the file path (in full)
    var href = (0, url_1.normaliseHREF)(item.href);
    // Each item should contain a stat object
    var props = item.propstat.prop;
    // Process the true full filename (minus the base server path)
    var filename = serverBase === "/" ? decodeURIComponent((0, path_1.normalisePath)(href)) : decodeURIComponent((0, path_1.normalisePath)(path_posix_1["default"].relative(serverBase, href)));
    return (0, dav_1.prepareFileFromProps)(props, filename, isDetailed);
  })
  // Filter out the item pointing to the current directory (not needed)
  .filter(function (item) {
    return item.basename && (item.type === "file" || item.filename !== requestPath.replace(/\/$/, ""));
  });
}

/***/ }),

/***/ "./node_modules/webdav/dist/node/operations/exists.js":
/*!************************************************************!*\
  !*** ./node_modules/webdav/dist/node/operations/exists.js ***!
  \************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator = this && this.__generator || function (thisArg, body) {
  var _ = {
      label: 0,
      sent: function sent() {
        if (t[0] & 1) throw t[1];
        return t[1];
      },
      trys: [],
      ops: []
    },
    f,
    y,
    t,
    g;
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
    return this;
  }), g;
  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (_) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return {
            value: op[1],
            done: false
          };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.exists = void 0;
var stat_1 = __webpack_require__(/*! ./stat */ "./node_modules/webdav/dist/node/operations/stat.js");
function exists(context, remotePath, options) {
  if (options === void 0) {
    options = {};
  }
  return __awaiter(this, void 0, void 0, function () {
    var err_1;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 2,, 3]);
          return [4 /*yield*/, (0, stat_1.getStat)(context, remotePath, options)];
        case 1:
          _a.sent();
          return [2 /*return*/, true];
        case 2:
          err_1 = _a.sent();
          if (err_1.status === 404) {
            return [2 /*return*/, false];
          }
          throw err_1;
        case 3:
          return [2 /*return*/];
      }
    });
  });
}
exports.exists = exists;

/***/ }),

/***/ "./node_modules/webdav/dist/node/operations/getFileContents.js":
/*!*********************************************************************!*\
  !*** ./node_modules/webdav/dist/node/operations/getFileContents.js ***!
  \*********************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator = this && this.__generator || function (thisArg, body) {
  var _ = {
      label: 0,
      sent: function sent() {
        if (t[0] & 1) throw t[1];
        return t[1];
      },
      trys: [],
      ops: []
    },
    f,
    y,
    t,
    g;
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
    return this;
  }), g;
  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (_) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return {
            value: op[1],
            done: false
          };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.getFileDownloadLink = exports.getFileContents = void 0;
var layerr_1 = __webpack_require__(/*! layerr */ "./node_modules/layerr/dist/index.js");
var url_1 = __webpack_require__(/*! ../tools/url */ "./node_modules/webdav/dist/node/tools/url.js");
var path_1 = __webpack_require__(/*! ../tools/path */ "./node_modules/webdav/dist/node/tools/path.js");
var encode_1 = __webpack_require__(/*! ../tools/encode */ "./node_modules/webdav/dist/node/tools/encode.js");
var request_1 = __webpack_require__(/*! ../request */ "./node_modules/webdav/dist/node/request.js");
var response_1 = __webpack_require__(/*! ../response */ "./node_modules/webdav/dist/node/response.js");
var types_1 = __webpack_require__(/*! ../types */ "./node_modules/webdav/dist/node/types.js");
var TRANSFORM_RETAIN_FORMAT = function TRANSFORM_RETAIN_FORMAT(v) {
  return v;
};
function getFileContents(context, filePath, options) {
  if (options === void 0) {
    options = {};
  }
  return __awaiter(this, void 0, void 0, function () {
    var _a, format;
    return __generator(this, function (_b) {
      _a = options.format, format = _a === void 0 ? "binary" : _a;
      if (format !== "binary" && format !== "text") {
        throw new layerr_1.Layerr({
          info: {
            code: types_1.ErrorCode.InvalidOutputFormat
          }
        }, "Invalid output format: ".concat(format));
      }
      return [2 /*return*/, format === "text" ? getFileContentsString(context, filePath, options) : getFileContentsBuffer(context, filePath, options)];
    });
  });
}
exports.getFileContents = getFileContents;
function getFileContentsBuffer(context, filePath, options) {
  if (options === void 0) {
    options = {};
  }
  return __awaiter(this, void 0, void 0, function () {
    var requestOptions, response;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          requestOptions = (0, request_1.prepareRequestOptions)({
            url: (0, url_1.joinURL)(context.remoteURL, (0, path_1.encodePath)(filePath)),
            method: "GET",
            responseType: "arraybuffer"
          }, context, options);
          return [4 /*yield*/, (0, request_1.request)(requestOptions)];
        case 1:
          response = _a.sent();
          (0, response_1.handleResponseCode)(context, response);
          return [2 /*return*/, (0, response_1.processResponsePayload)(response, response.data, options.details)];
      }
    });
  });
}
function getFileContentsString(context, filePath, options) {
  if (options === void 0) {
    options = {};
  }
  return __awaiter(this, void 0, void 0, function () {
    var requestOptions, response;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          requestOptions = (0, request_1.prepareRequestOptions)({
            url: (0, url_1.joinURL)(context.remoteURL, (0, path_1.encodePath)(filePath)),
            method: "GET",
            responseType: "text",
            transformResponse: [TRANSFORM_RETAIN_FORMAT]
          }, context, options);
          return [4 /*yield*/, (0, request_1.request)(requestOptions)];
        case 1:
          response = _a.sent();
          (0, response_1.handleResponseCode)(context, response);
          return [2 /*return*/, (0, response_1.processResponsePayload)(response, response.data, options.details)];
      }
    });
  });
}
function getFileDownloadLink(context, filePath) {
  var url = (0, url_1.joinURL)(context.remoteURL, (0, path_1.encodePath)(filePath));
  var protocol = /^https:/i.test(url) ? "https" : "http";
  switch (context.authType) {
    case types_1.AuthType.None:
      // Do nothing
      break;
    case types_1.AuthType.Password:
      {
        var authPart = context.headers.Authorization.replace(/^Basic /i, "").trim();
        var authContents = (0, encode_1.fromBase64)(authPart);
        url = url.replace(/^https?:\/\//, "".concat(protocol, "://").concat(authContents, "@"));
        break;
      }
    default:
      throw new layerr_1.Layerr({
        info: {
          code: types_1.ErrorCode.LinkUnsupportedAuthType
        }
      }, "Unsupported auth type for file link: ".concat(context.authType));
  }
  return url;
}
exports.getFileDownloadLink = getFileDownloadLink;

/***/ }),

/***/ "./node_modules/webdav/dist/node/operations/getQuota.js":
/*!**************************************************************!*\
  !*** ./node_modules/webdav/dist/node/operations/getQuota.js ***!
  \**************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator = this && this.__generator || function (thisArg, body) {
  var _ = {
      label: 0,
      sent: function sent() {
        if (t[0] & 1) throw t[1];
        return t[1];
      },
      trys: [],
      ops: []
    },
    f,
    y,
    t,
    g;
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
    return this;
  }), g;
  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (_) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return {
            value: op[1],
            done: false
          };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.getQuota = void 0;
var request_1 = __webpack_require__(/*! ../request */ "./node_modules/webdav/dist/node/request.js");
var response_1 = __webpack_require__(/*! ../response */ "./node_modules/webdav/dist/node/response.js");
var dav_1 = __webpack_require__(/*! ../tools/dav */ "./node_modules/webdav/dist/node/tools/dav.js");
var url_1 = __webpack_require__(/*! ../tools/url */ "./node_modules/webdav/dist/node/tools/url.js");
var quota_1 = __webpack_require__(/*! ../tools/quota */ "./node_modules/webdav/dist/node/tools/quota.js");
function getQuota(context, options) {
  if (options === void 0) {
    options = {};
  }
  return __awaiter(this, void 0, void 0, function () {
    var path, requestOptions, response, result, quota;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          path = options.path || "/";
          requestOptions = (0, request_1.prepareRequestOptions)({
            url: (0, url_1.joinURL)(context.remoteURL, path),
            method: "PROPFIND",
            headers: {
              Accept: "text/plain",
              Depth: "0"
            },
            responseType: "text"
          }, context, options);
          return [4 /*yield*/, (0, request_1.request)(requestOptions)];
        case 1:
          response = _a.sent();
          (0, response_1.handleResponseCode)(context, response);
          return [4 /*yield*/, (0, dav_1.parseXML)(response.data)];
        case 2:
          result = _a.sent();
          quota = (0, quota_1.parseQuota)(result);
          return [2 /*return*/, (0, response_1.processResponsePayload)(response, quota, options.details)];
      }
    });
  });
}
exports.getQuota = getQuota;

/***/ }),

/***/ "./node_modules/webdav/dist/node/operations/lock.js":
/*!**********************************************************!*\
  !*** ./node_modules/webdav/dist/node/operations/lock.js ***!
  \**********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator = this && this.__generator || function (thisArg, body) {
  var _ = {
      label: 0,
      sent: function sent() {
        if (t[0] & 1) throw t[1];
        return t[1];
      },
      trys: [],
      ops: []
    },
    f,
    y,
    t,
    g;
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
    return this;
  }), g;
  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (_) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return {
            value: op[1],
            done: false
          };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
};
var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.unlock = exports.lock = void 0;
var nested_property_1 = __importDefault(__webpack_require__(/*! nested-property */ "./node_modules/nested-property/dist/nested-property.js"));
var url_1 = __webpack_require__(/*! ../tools/url */ "./node_modules/webdav/dist/node/tools/url.js");
var path_1 = __webpack_require__(/*! ../tools/path */ "./node_modules/webdav/dist/node/tools/path.js");
var xml_1 = __webpack_require__(/*! ../tools/xml */ "./node_modules/webdav/dist/node/tools/xml.js");
var request_1 = __webpack_require__(/*! ../request */ "./node_modules/webdav/dist/node/request.js");
var response_1 = __webpack_require__(/*! ../response */ "./node_modules/webdav/dist/node/response.js");
var DEFAULT_TIMEOUT = "Infinite, Second-4100000000";
function lock(context, path, options) {
  if (options === void 0) {
    options = {};
  }
  return __awaiter(this, void 0, void 0, function () {
    var refreshToken, _a, timeout, headers, requestOptions, response, lockPayload, token, serverTimeout, err;
    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          refreshToken = options.refreshToken, _a = options.timeout, timeout = _a === void 0 ? DEFAULT_TIMEOUT : _a;
          headers = {
            Accept: "text/plain,application/xml",
            Timeout: timeout
          };
          if (refreshToken) {
            headers.If = refreshToken;
          }
          requestOptions = (0, request_1.prepareRequestOptions)({
            url: (0, url_1.joinURL)(context.remoteURL, (0, path_1.encodePath)(path)),
            method: "LOCK",
            headers: headers,
            data: (0, xml_1.generateLockXML)(context.contactHref),
            responseType: "text"
          }, context, options);
          return [4 /*yield*/, (0, request_1.request)(requestOptions)];
        case 1:
          response = _b.sent();
          (0, response_1.handleResponseCode)(context, response);
          lockPayload = (0, xml_1.parseGenericResponse)(response.data);
          token = nested_property_1["default"].get(lockPayload, "prop.lockdiscovery.activelock.locktoken.href");
          serverTimeout = nested_property_1["default"].get(lockPayload, "prop.lockdiscovery.activelock.timeout");
          if (!token) {
            err = (0, response_1.createErrorFromResponse)(response, "No lock token received: ");
            throw err;
          }
          return [2 /*return*/, {
            token: token,
            serverTimeout: serverTimeout
          }];
      }
    });
  });
}
exports.lock = lock;
function unlock(context, path, token, options) {
  if (options === void 0) {
    options = {};
  }
  return __awaiter(this, void 0, void 0, function () {
    var requestOptions, response, err;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          requestOptions = (0, request_1.prepareRequestOptions)({
            url: (0, url_1.joinURL)(context.remoteURL, (0, path_1.encodePath)(path)),
            method: "UNLOCK",
            headers: {
              "Lock-Token": token
            }
          }, context, options);
          return [4 /*yield*/, (0, request_1.request)(requestOptions)];
        case 1:
          response = _a.sent();
          (0, response_1.handleResponseCode)(context, response);
          if (response.status !== 204 && response.status !== 200) {
            err = (0, response_1.createErrorFromResponse)(response);
            throw err;
          }
          return [2 /*return*/];
      }
    });
  });
}
exports.unlock = unlock;

/***/ }),

/***/ "./node_modules/webdav/dist/node/operations/moveFile.js":
/*!**************************************************************!*\
  !*** ./node_modules/webdav/dist/node/operations/moveFile.js ***!
  \**************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator = this && this.__generator || function (thisArg, body) {
  var _ = {
      label: 0,
      sent: function sent() {
        if (t[0] & 1) throw t[1];
        return t[1];
      },
      trys: [],
      ops: []
    },
    f,
    y,
    t,
    g;
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
    return this;
  }), g;
  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (_) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return {
            value: op[1],
            done: false
          };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.moveFile = void 0;
var url_1 = __webpack_require__(/*! ../tools/url */ "./node_modules/webdav/dist/node/tools/url.js");
var path_1 = __webpack_require__(/*! ../tools/path */ "./node_modules/webdav/dist/node/tools/path.js");
var request_1 = __webpack_require__(/*! ../request */ "./node_modules/webdav/dist/node/request.js");
var response_1 = __webpack_require__(/*! ../response */ "./node_modules/webdav/dist/node/response.js");
function moveFile(context, filename, destination, options) {
  if (options === void 0) {
    options = {};
  }
  return __awaiter(this, void 0, void 0, function () {
    var requestOptions, response;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          requestOptions = (0, request_1.prepareRequestOptions)({
            url: (0, url_1.joinURL)(context.remoteURL, (0, path_1.encodePath)(filename)),
            method: "MOVE",
            headers: {
              Destination: (0, url_1.joinURL)(context.remoteURL, (0, path_1.encodePath)(destination))
            }
          }, context, options);
          return [4 /*yield*/, (0, request_1.request)(requestOptions)];
        case 1:
          response = _a.sent();
          (0, response_1.handleResponseCode)(context, response);
          return [2 /*return*/];
      }
    });
  });
}
exports.moveFile = moveFile;

/***/ }),

/***/ "./node_modules/webdav/dist/node/operations/putFileContents.js":
/*!*********************************************************************!*\
  !*** ./node_modules/webdav/dist/node/operations/putFileContents.js ***!
  \*********************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator = this && this.__generator || function (thisArg, body) {
  var _ = {
      label: 0,
      sent: function sent() {
        if (t[0] & 1) throw t[1];
        return t[1];
      },
      trys: [],
      ops: []
    },
    f,
    y,
    t,
    g;
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
    return this;
  }), g;
  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (_) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return {
            value: op[1],
            done: false
          };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
};
var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.getFileUploadLink = exports.putFileContents = void 0;
var layerr_1 = __webpack_require__(/*! layerr */ "./node_modules/layerr/dist/index.js");
var stream_1 = __importDefault(__webpack_require__(/*! stream */ "./node_modules/stream-browserify/index.js"));
var encode_1 = __webpack_require__(/*! ../tools/encode */ "./node_modules/webdav/dist/node/tools/encode.js");
var url_1 = __webpack_require__(/*! ../tools/url */ "./node_modules/webdav/dist/node/tools/url.js");
var path_1 = __webpack_require__(/*! ../tools/path */ "./node_modules/webdav/dist/node/tools/path.js");
var request_1 = __webpack_require__(/*! ../request */ "./node_modules/webdav/dist/node/request.js");
var response_1 = __webpack_require__(/*! ../response */ "./node_modules/webdav/dist/node/response.js");
var size_1 = __webpack_require__(/*! ../tools/size */ "./node_modules/webdav/dist/node/tools/size.js");
var types_1 = __webpack_require__(/*! ../types */ "./node_modules/webdav/dist/node/types.js");
function putFileContents(context, filePath, data, options) {
  if (options === void 0) {
    options = {};
  }
  return __awaiter(this, void 0, void 0, function () {
    var _a, contentLength, _b, overwrite, headers, requestOptions, response, error;
    return __generator(this, function (_c) {
      switch (_c.label) {
        case 0:
          _a = options.contentLength, contentLength = _a === void 0 ? true : _a, _b = options.overwrite, overwrite = _b === void 0 ? true : _b;
          headers = {
            "Content-Type": "application/octet-stream"
          };
          if (typeof WEB === "undefined" && typeof stream_1["default"] !== "undefined" && typeof (stream_1["default"] === null || stream_1["default"] === void 0 ? void 0 : stream_1["default"].Readable) !== "undefined" && data instanceof stream_1["default"].Readable) {
            // Skip, no content-length
          } else if (contentLength === false) {
            // Skip, disabled
          } else if (typeof contentLength === "number") {
            headers["Content-Length"] = "".concat(contentLength);
          } else {
            headers["Content-Length"] = "".concat((0, size_1.calculateDataLength)(data));
          }
          if (!overwrite) {
            headers["If-None-Match"] = "*";
          }
          requestOptions = (0, request_1.prepareRequestOptions)({
            url: (0, url_1.joinURL)(context.remoteURL, (0, path_1.encodePath)(filePath)),
            method: "PUT",
            headers: headers,
            data: data
          }, context, options);
          return [4 /*yield*/, (0, request_1.request)(requestOptions)];
        case 1:
          response = _c.sent();
          try {
            (0, response_1.handleResponseCode)(context, response);
          } catch (err) {
            error = err;
            if (error.status === 412 && !overwrite) {
              return [2 /*return*/, false];
            } else {
              throw error;
            }
          }
          return [2 /*return*/, true];
      }
    });
  });
}
exports.putFileContents = putFileContents;
function getFileUploadLink(context, filePath) {
  var url = "".concat((0, url_1.joinURL)(context.remoteURL, (0, path_1.encodePath)(filePath)), "?Content-Type=application/octet-stream");
  var protocol = /^https:/i.test(url) ? "https" : "http";
  switch (context.authType) {
    case types_1.AuthType.None:
      // Do nothing
      break;
    case types_1.AuthType.Password:
      {
        var authPart = context.headers.Authorization.replace(/^Basic /i, "").trim();
        var authContents = (0, encode_1.fromBase64)(authPart);
        url = url.replace(/^https?:\/\//, "".concat(protocol, "://").concat(authContents, "@"));
        break;
      }
    default:
      throw new layerr_1.Layerr({
        info: {
          code: types_1.ErrorCode.LinkUnsupportedAuthType
        }
      }, "Unsupported auth type for file link: ".concat(context.authType));
  }
  return url;
}
exports.getFileUploadLink = getFileUploadLink;

/***/ }),

/***/ "./node_modules/webdav/dist/node/operations/stat.js":
/*!**********************************************************!*\
  !*** ./node_modules/webdav/dist/node/operations/stat.js ***!
  \**********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator = this && this.__generator || function (thisArg, body) {
  var _ = {
      label: 0,
      sent: function sent() {
        if (t[0] & 1) throw t[1];
        return t[1];
      },
      trys: [],
      ops: []
    },
    f,
    y,
    t,
    g;
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
    return this;
  }), g;
  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (_) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return {
            value: op[1],
            done: false
          };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.getStat = void 0;
var dav_1 = __webpack_require__(/*! ../tools/dav */ "./node_modules/webdav/dist/node/tools/dav.js");
var url_1 = __webpack_require__(/*! ../tools/url */ "./node_modules/webdav/dist/node/tools/url.js");
var path_1 = __webpack_require__(/*! ../tools/path */ "./node_modules/webdav/dist/node/tools/path.js");
var request_1 = __webpack_require__(/*! ../request */ "./node_modules/webdav/dist/node/request.js");
var response_1 = __webpack_require__(/*! ../response */ "./node_modules/webdav/dist/node/response.js");
function getStat(context, filename, options) {
  if (options === void 0) {
    options = {};
  }
  return __awaiter(this, void 0, void 0, function () {
    var _a, isDetailed, requestOptions, response, result, stat;
    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          _a = options.details, isDetailed = _a === void 0 ? false : _a;
          requestOptions = (0, request_1.prepareRequestOptions)({
            url: (0, url_1.joinURL)(context.remoteURL, (0, path_1.encodePath)(filename)),
            method: "PROPFIND",
            headers: {
              Accept: "text/plain,application/xml",
              Depth: "0"
            },
            responseType: "text"
          }, context, options);
          return [4 /*yield*/, (0, request_1.request)(requestOptions)];
        case 1:
          response = _b.sent();
          (0, response_1.handleResponseCode)(context, response);
          return [4 /*yield*/, (0, dav_1.parseXML)(response.data)];
        case 2:
          result = _b.sent();
          stat = (0, dav_1.parseStat)(result, filename, isDetailed);
          return [2 /*return*/, (0, response_1.processResponsePayload)(response, stat, isDetailed)];
      }
    });
  });
}
exports.getStat = getStat;

/***/ }),

/***/ "./node_modules/webdav/dist/node/request.js":
/*!**************************************************!*\
  !*** ./node_modules/webdav/dist/node/request.js ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.request = exports.prepareRequestOptions = void 0;
var axios_1 = __importDefault(__webpack_require__(/*! axios */ "./node_modules/axios/index.js"));
var patcher_1 = __webpack_require__(/*! ./compat/patcher */ "./node_modules/webdav/dist/node/compat/patcher.js");
var digest_1 = __webpack_require__(/*! ./auth/digest */ "./node_modules/webdav/dist/node/auth/digest.js");
var merge_1 = __webpack_require__(/*! ./tools/merge */ "./node_modules/webdav/dist/node/tools/merge.js");
var headers_1 = __webpack_require__(/*! ./tools/headers */ "./node_modules/webdav/dist/node/tools/headers.js");
function _request(requestOptions) {
  return (0, patcher_1.getPatcher)().patchInline("request", function (options) {
    return (0, axios_1["default"])(options);
  }, requestOptions);
}
function prepareRequestOptions(requestOptions, context, userOptions) {
  var finalOptions = (0, merge_1.cloneShallow)(requestOptions);
  finalOptions.headers = (0, headers_1.mergeHeaders)(context.headers, finalOptions.headers || {}, userOptions.headers || {});
  if (typeof userOptions.data !== "undefined") {
    finalOptions.data = userOptions.data;
  }
  if (userOptions.signal) {
    finalOptions.signal = userOptions.signal;
  }
  if (context.httpAgent) {
    finalOptions.httpAgent = context.httpAgent;
  }
  if (context.httpsAgent) {
    finalOptions.httpsAgent = context.httpsAgent;
  }
  if (context.digest) {
    finalOptions._digest = context.digest;
  }
  if (typeof context.withCredentials === "boolean") {
    finalOptions.withCredentials = context.withCredentials;
  }
  if (context.maxContentLength) {
    finalOptions.maxContentLength = context.maxContentLength;
  }
  if (context.maxBodyLength) {
    finalOptions.maxBodyLength = context.maxBodyLength;
  }
  if (userOptions.hasOwnProperty("onUploadProgress")) {
    finalOptions.onUploadProgress = userOptions["onUploadProgress"];
  }
  if (userOptions.hasOwnProperty("onDownloadProgress")) {
    finalOptions.onDownloadProgress = userOptions["onDownloadProgress"];
  }
  // Take full control of all response status codes
  finalOptions.validateStatus = function () {
    return true;
  };
  return finalOptions;
}
exports.prepareRequestOptions = prepareRequestOptions;
function request(requestOptions) {
  // Client not configured for digest authentication
  if (!requestOptions._digest) {
    return _request(requestOptions);
  }
  // Remove client's digest authentication object from request options
  var _digest = requestOptions._digest;
  delete requestOptions._digest;
  // If client is already using digest authentication, include the digest authorization header
  if (_digest.hasDigestAuth) {
    requestOptions = (0, merge_1.merge)(requestOptions, {
      headers: {
        Authorization: (0, digest_1.generateDigestAuthHeader)(requestOptions, _digest)
      }
    });
  }
  // Perform the request and handle digest authentication
  return _request(requestOptions).then(function (response) {
    if (response.status == 401) {
      _digest.hasDigestAuth = (0, digest_1.parseDigestAuth)(response, _digest);
      if (_digest.hasDigestAuth) {
        requestOptions = (0, merge_1.merge)(requestOptions, {
          headers: {
            Authorization: (0, digest_1.generateDigestAuthHeader)(requestOptions, _digest)
          }
        });
        return _request(requestOptions).then(function (response2) {
          if (response2.status == 401) {
            _digest.hasDigestAuth = false;
          } else {
            _digest.nc++;
          }
          return response2;
        });
      }
    } else {
      _digest.nc++;
    }
    return response;
  });
}
exports.request = request;

/***/ }),

/***/ "./node_modules/webdav/dist/node/response.js":
/*!***************************************************!*\
  !*** ./node_modules/webdav/dist/node/response.js ***!
  \***************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.processResponsePayload = exports.processGlobFilter = exports.handleResponseCode = exports.createErrorFromResponse = void 0;
var minimatch_1 = __importDefault(__webpack_require__(/*! minimatch */ "./node_modules/minimatch/minimatch.js"));
function createErrorFromResponse(response, prefix) {
  if (prefix === void 0) {
    prefix = "";
  }
  var err = new Error("".concat(prefix, "Invalid response: ").concat(response.status, " ").concat(response.statusText));
  err.status = response.status;
  err.response = response;
  return err;
}
exports.createErrorFromResponse = createErrorFromResponse;
function handleResponseCode(context, response) {
  var status = response.status;
  if (status === 401 && context.digest) return response;
  if (status >= 400) {
    var err = createErrorFromResponse(response);
    throw err;
  }
  return response;
}
exports.handleResponseCode = handleResponseCode;
function processGlobFilter(files, glob) {
  return files.filter(function (file) {
    return (0, minimatch_1["default"])(file.filename, glob, {
      matchBase: true
    });
  });
}
exports.processGlobFilter = processGlobFilter;
function processResponsePayload(response, data, isDetailed) {
  if (isDetailed === void 0) {
    isDetailed = false;
  }
  return isDetailed ? {
    data: data,
    headers: response.headers || {},
    status: response.status,
    statusText: response.statusText
  } : data;
}
exports.processResponsePayload = processResponsePayload;

/***/ }),

/***/ "./node_modules/webdav/dist/node/tools/crypto.js":
/*!*******************************************************!*\
  !*** ./node_modules/webdav/dist/node/tools/crypto.js ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.ha1Compute = void 0;
var md5_1 = __importDefault(__webpack_require__(/*! md5 */ "./node_modules/md5/md5.js"));
function ha1Compute(algorithm, user, realm, pass, nonce, cnonce) {
  var ha1 = (0, md5_1["default"])("".concat(user, ":").concat(realm, ":").concat(pass));
  if (algorithm && algorithm.toLowerCase() === "md5-sess") {
    return (0, md5_1["default"])("".concat(ha1, ":").concat(nonce, ":").concat(cnonce));
  }
  return ha1;
}
exports.ha1Compute = ha1Compute;

/***/ }),

/***/ "./node_modules/webdav/dist/node/tools/dav.js":
/*!****************************************************!*\
  !*** ./node_modules/webdav/dist/node/tools/dav.js ***!
  \****************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.translateDiskSpace = exports.parseStat = exports.prepareFileFromProps = exports.parseXML = void 0;
var path_posix_1 = __importDefault(__webpack_require__(/*! path-posix */ "./node_modules/path-posix/index.js"));
var fast_xml_parser_1 = __importDefault(__webpack_require__(/*! fast-xml-parser */ "./node_modules/fast-xml-parser/src/parser.js"));
var nested_property_1 = __importDefault(__webpack_require__(/*! nested-property */ "./node_modules/nested-property/dist/nested-property.js"));
var encode_1 = __webpack_require__(/*! ./encode */ "./node_modules/webdav/dist/node/tools/encode.js");
var path_1 = __webpack_require__(/*! ./path */ "./node_modules/webdav/dist/node/tools/path.js");
var PropertyType;
(function (PropertyType) {
  PropertyType["Array"] = "array";
  PropertyType["Object"] = "object";
  PropertyType["Original"] = "original";
})(PropertyType || (PropertyType = {}));
function getPropertyOfType(obj, prop, type) {
  if (type === void 0) {
    type = PropertyType.Original;
  }
  var val = nested_property_1["default"].get(obj, prop);
  if (type === "array" && Array.isArray(val) === false) {
    return [val];
  } else if (type === "object" && Array.isArray(val)) {
    return val[0];
  }
  return val;
}
function normaliseResponse(response) {
  var output = Object.assign({}, response);
  nested_property_1["default"].set(output, "propstat", getPropertyOfType(output, "propstat", PropertyType.Object));
  nested_property_1["default"].set(output, "propstat.prop", getPropertyOfType(output, "propstat.prop", PropertyType.Object));
  return output;
}
function normaliseResult(result) {
  var multistatus = result.multistatus;
  if (multistatus === "") {
    return {
      multistatus: {
        response: []
      }
    };
  }
  if (!multistatus) {
    throw new Error("Invalid response: No root multistatus found");
  }
  var output = {
    multistatus: Array.isArray(multistatus) ? multistatus[0] : multistatus
  };
  nested_property_1["default"].set(output, "multistatus.response", getPropertyOfType(output, "multistatus.response", PropertyType.Array));
  nested_property_1["default"].set(output, "multistatus.response", nested_property_1["default"].get(output, "multistatus.response").map(function (response) {
    return normaliseResponse(response);
  }));
  return output;
}
function parseXML(xml) {
  return new Promise(function (resolve) {
    var result = fast_xml_parser_1["default"].parse(xml, {
      arrayMode: false,
      ignoreNameSpace: true
      // // We don't use the processors here as decoding is done manually
      // // later on - decoding early would break some path checks.
      // attrValueProcessor: val => decodeHTMLEntities(decodeURIComponent(val)),
      // tagValueProcessor: val => decodeHTMLEntities(decodeURIComponent(val))
    });
    resolve(normaliseResult(result));
  });
}
exports.parseXML = parseXML;
function prepareFileFromProps(props, rawFilename, isDetailed) {
  if (isDetailed === void 0) {
    isDetailed = false;
  }
  // Last modified time, raw size, item type and mime
  var _a = props.getlastmodified,
    lastMod = _a === void 0 ? null : _a,
    _b = props.getcontentlength,
    rawSize = _b === void 0 ? "0" : _b,
    _c = props.resourcetype,
    resourceType = _c === void 0 ? null : _c,
    _d = props.getcontenttype,
    mimeType = _d === void 0 ? null : _d,
    _e = props.getetag,
    etag = _e === void 0 ? null : _e;
  var type = resourceType && _typeof(resourceType) === "object" && typeof resourceType.collection !== "undefined" ? "directory" : "file";
  var filename = (0, encode_1.decodeHTMLEntities)(rawFilename);
  var stat = {
    filename: filename,
    basename: path_posix_1["default"].basename(filename),
    lastmod: lastMod,
    size: parseInt(rawSize, 10),
    type: type,
    etag: typeof etag === "string" ? etag.replace(/"/g, "") : null
  };
  if (type === "file") {
    stat.mime = mimeType && typeof mimeType === "string" ? mimeType.split(";")[0] : "";
  }
  if (isDetailed) {
    stat.props = props;
  }
  return stat;
}
exports.prepareFileFromProps = prepareFileFromProps;
function parseStat(result, filename, isDetailed) {
  if (isDetailed === void 0) {
    isDetailed = false;
  }
  var responseItem = null;
  try {
    responseItem = result.multistatus.response[0];
  } catch (e) {
    /* ignore */
  }
  if (!responseItem) {
    throw new Error("Failed getting item stat: bad response");
  }
  var _a = responseItem.propstat,
    props = _a.prop,
    statusLine = _a.status;
  // As defined in https://tools.ietf.org/html/rfc2068#section-6.1
  var _b = statusLine.split(" ", 3),
    _ = _b[0],
    statusCodeStr = _b[1],
    statusText = _b[2];
  var statusCode = parseInt(statusCodeStr, 10);
  if (statusCode >= 400) {
    var err = new Error("Invalid response: ".concat(statusCode, " ").concat(statusText));
    err.status = statusCode;
    throw err;
  }
  var filePath = (0, path_1.normalisePath)(filename);
  return prepareFileFromProps(props, filePath, isDetailed);
}
exports.parseStat = parseStat;
function translateDiskSpace(value) {
  switch (value.toString()) {
    case "-3":
      return "unlimited";
    case "-2":
    /* falls-through */
    case "-1":
      // -1 is non-computed
      return "unknown";
    default:
      return parseInt(value, 10);
  }
}
exports.translateDiskSpace = translateDiskSpace;

/***/ }),

/***/ "./node_modules/webdav/dist/node/tools/encode.js":
/*!*******************************************************!*\
  !*** ./node_modules/webdav/dist/node/tools/encode.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.toBase64 = exports.fromBase64 = exports.decodeHTMLEntities = void 0;
var base_64_1 = __webpack_require__(/*! base-64 */ "./node_modules/base-64/base64.js");
function decodeHTMLEntities(text) {
  if (typeof WEB === "undefined") {
    // Node
    var he = __webpack_require__(/*! he */ "./node_modules/he/he.js");
    return he.decode(text);
  } else {
    // Nasty browser way
    var txt = document.createElement("textarea");
    txt.innerHTML = text;
    return txt.value;
  }
}
exports.decodeHTMLEntities = decodeHTMLEntities;
function fromBase64(text) {
  return (0, base_64_1.decode)(text);
}
exports.fromBase64 = fromBase64;
function toBase64(text) {
  return (0, base_64_1.encode)(text);
}
exports.toBase64 = toBase64;

/***/ }),

/***/ "./node_modules/webdav/dist/node/tools/headers.js":
/*!********************************************************!*\
  !*** ./node_modules/webdav/dist/node/tools/headers.js ***!
  \********************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.mergeHeaders = void 0;
function mergeHeaders() {
  var headerPayloads = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    headerPayloads[_i] = arguments[_i];
  }
  if (headerPayloads.length === 0) return {};
  var headerKeys = {};
  return headerPayloads.reduce(function (output, headers) {
    Object.keys(headers).forEach(function (header) {
      var lowerHeader = header.toLowerCase();
      if (headerKeys.hasOwnProperty(lowerHeader)) {
        output[headerKeys[lowerHeader]] = headers[header];
      } else {
        headerKeys[lowerHeader] = header;
        output[header] = headers[header];
      }
    });
    return output;
  }, {});
}
exports.mergeHeaders = mergeHeaders;

/***/ }),

/***/ "./node_modules/webdav/dist/node/tools/merge.js":
/*!******************************************************!*\
  !*** ./node_modules/webdav/dist/node/tools/merge.js ***!
  \******************************************************/
/***/ (function(__unused_webpack_module, exports) {

"use strict";


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var __spreadArray = this && this.__spreadArray || function (to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
    if (ar || !(i in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i);
      ar[i] = from[i];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.merge = exports.cloneShallow = void 0;
function cloneShallow(obj) {
  return isPlainObject(obj) ? Object.assign({}, obj) : Object.setPrototypeOf(Object.assign({}, obj), Object.getPrototypeOf(obj));
}
exports.cloneShallow = cloneShallow;
function isPlainObject(obj) {
  if (_typeof(obj) !== "object" || obj === null || Object.prototype.toString.call(obj) != "[object Object]") {
    // Not an object
    return false;
  }
  if (Object.getPrototypeOf(obj) === null) {
    return true;
  }
  var proto = obj;
  // Find the prototype
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(obj) === proto;
}
function merge() {
  var args = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    args[_i] = arguments[_i];
  }
  var output = null,
    items = __spreadArray([], args, true);
  while (items.length > 0) {
    var nextItem = items.shift();
    if (!output) {
      output = cloneShallow(nextItem);
    } else {
      output = mergeObjects(output, nextItem);
    }
  }
  return output;
}
exports.merge = merge;
function mergeObjects(obj1, obj2) {
  var output = cloneShallow(obj1);
  Object.keys(obj2).forEach(function (key) {
    if (!output.hasOwnProperty(key)) {
      output[key] = obj2[key];
      return;
    }
    if (Array.isArray(obj2[key])) {
      output[key] = Array.isArray(output[key]) ? __spreadArray(__spreadArray([], output[key], true), obj2[key], true) : __spreadArray([], obj2[key], true);
    } else if (_typeof(obj2[key]) === "object" && !!obj2[key]) {
      output[key] = _typeof(output[key]) === "object" && !!output[key] ? mergeObjects(output[key], obj2[key]) : cloneShallow(obj2[key]);
    } else {
      output[key] = obj2[key];
    }
  });
  return output;
}

/***/ }),

/***/ "./node_modules/webdav/dist/node/tools/path.js":
/*!*****************************************************!*\
  !*** ./node_modules/webdav/dist/node/tools/path.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.normalisePath = exports.getAllDirectories = exports.encodePath = void 0;
var path_posix_1 = __webpack_require__(/*! path-posix */ "./node_modules/path-posix/index.js");
var SEP_PATH_POSIX = "__PATH_SEPARATOR_POSIX__";
var SEP_PATH_WINDOWS = "__PATH_SEPARATOR_WINDOWS__";
function encodePath(path) {
  var replaced = path.replace(/\//g, SEP_PATH_POSIX).replace(/\\\\/g, SEP_PATH_WINDOWS);
  var formatted = encodeURIComponent(replaced);
  return formatted.split(SEP_PATH_WINDOWS).join("\\\\").split(SEP_PATH_POSIX).join("/");
}
exports.encodePath = encodePath;
function getAllDirectories(path) {
  if (!path || path === "/") return [];
  var currentPath = path;
  var output = [];
  do {
    output.push(currentPath);
    currentPath = (0, path_posix_1.dirname)(currentPath);
  } while (currentPath && currentPath !== "/");
  return output;
}
exports.getAllDirectories = getAllDirectories;
function normalisePath(pathStr) {
  var normalisedPath = pathStr;
  if (normalisedPath[0] !== "/") {
    normalisedPath = "/" + normalisedPath;
  }
  if (/^.+\/$/.test(normalisedPath)) {
    normalisedPath = normalisedPath.substr(0, normalisedPath.length - 1);
  }
  return normalisedPath;
}
exports.normalisePath = normalisePath;

/***/ }),

/***/ "./node_modules/webdav/dist/node/tools/quota.js":
/*!******************************************************!*\
  !*** ./node_modules/webdav/dist/node/tools/quota.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.parseQuota = void 0;
var dav_1 = __webpack_require__(/*! ./dav */ "./node_modules/webdav/dist/node/tools/dav.js");
function parseQuota(result) {
  try {
    var responseItem = result.multistatus.response[0];
    var _a = responseItem.propstat.prop,
      quotaUsed = _a["quota-used-bytes"],
      quotaAvail = _a["quota-available-bytes"];
    return typeof quotaUsed !== "undefined" && typeof quotaAvail !== "undefined" ? {
      used: parseInt(quotaUsed, 10),
      available: (0, dav_1.translateDiskSpace)(quotaAvail)
    } : null;
  } catch (err) {
    /* ignore */
  }
  return null;
}
exports.parseQuota = parseQuota;

/***/ }),

/***/ "./node_modules/webdav/dist/node/tools/size.js":
/*!*****************************************************!*\
  !*** ./node_modules/webdav/dist/node/tools/size.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.calculateDataLength = void 0;
var layerr_1 = __webpack_require__(/*! layerr */ "./node_modules/layerr/dist/index.js");
var byte_length_1 = __webpack_require__(/*! byte-length */ "./node_modules/byte-length/dist/index.js");
var arrayBuffer_1 = __webpack_require__(/*! ../compat/arrayBuffer */ "./node_modules/webdav/dist/node/compat/arrayBuffer.js");
var buffer_1 = __webpack_require__(/*! ../compat/buffer */ "./node_modules/webdav/dist/node/compat/buffer.js");
var types_1 = __webpack_require__(/*! ../types */ "./node_modules/webdav/dist/node/types.js");
function calculateDataLength(data) {
  if ((0, arrayBuffer_1.isArrayBuffer)(data)) {
    return data.byteLength;
  } else if ((0, buffer_1.isBuffer)(data)) {
    return data.length;
  } else if (typeof data === "string") {
    return (0, byte_length_1.byteLength)(data);
  }
  throw new layerr_1.Layerr({
    info: {
      code: types_1.ErrorCode.DataTypeNoLength
    }
  }, "Cannot calculate data length: Invalid type");
}
exports.calculateDataLength = calculateDataLength;

/***/ }),

/***/ "./node_modules/webdav/dist/node/tools/url.js":
/*!****************************************************!*\
  !*** ./node_modules/webdav/dist/node/tools/url.js ***!
  \****************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.normaliseHREF = exports.joinURL = exports.extractURLPath = void 0;
var url_parse_1 = __importDefault(__webpack_require__(/*! url-parse */ "./node_modules/url-parse/index.js"));
var url_join_1 = __importDefault(__webpack_require__(/*! url-join */ "./node_modules/url-join/lib/url-join.js"));
var path_1 = __webpack_require__(/*! ./path */ "./node_modules/webdav/dist/node/tools/path.js");
function extractURLPath(fullURL) {
  var url = new url_parse_1["default"](fullURL);
  var urlPath = url.pathname;
  if (urlPath.length <= 0) {
    urlPath = "/";
  }
  return (0, path_1.normalisePath)(urlPath);
}
exports.extractURLPath = extractURLPath;
function joinURL() {
  var parts = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    parts[_i] = arguments[_i];
  }
  return (0, url_join_1["default"])(parts.reduce(function (output, nextPart, partIndex) {
    if (partIndex === 0 || nextPart !== "/" || nextPart === "/" && output[output.length - 1] !== "/") {
      output.push(nextPart);
    }
    return output;
  }, []));
}
exports.joinURL = joinURL;
function normaliseHREF(href) {
  var normalisedHref = href.replace(/^https?:\/\/[^\/]+/, "");
  return normalisedHref;
}
exports.normaliseHREF = normaliseHREF;

/***/ }),

/***/ "./node_modules/webdav/dist/node/tools/xml.js":
/*!****************************************************!*\
  !*** ./node_modules/webdav/dist/node/tools/xml.js ***!
  \****************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var __assign = this && this.__assign || function () {
  __assign = Object.assign || function (t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
var __createBinding = this && this.__createBinding || (Object.create ? function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
    desc = {
      enumerable: true,
      get: function get() {
        return m[k];
      }
    };
  }
  Object.defineProperty(o, k2, desc);
} : function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});
var __setModuleDefault = this && this.__setModuleDefault || (Object.create ? function (o, v) {
  Object.defineProperty(o, "default", {
    enumerable: true,
    value: v
  });
} : function (o, v) {
  o["default"] = v;
});
var __importStar = this && this.__importStar || function (mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
  __setModuleDefault(result, mod);
  return result;
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.parseGenericResponse = exports.generateLockXML = void 0;
var fast_xml_parser_1 = __importStar(__webpack_require__(/*! fast-xml-parser */ "./node_modules/fast-xml-parser/src/parser.js"));
function generateLockXML(ownerHREF) {
  return getParser().parse(namespace({
    lockinfo: {
      "@_xmlns:d": "DAV:",
      lockscope: {
        exclusive: {}
      },
      locktype: {
        write: {}
      },
      owner: {
        href: ownerHREF
      }
    }
  }, "d"));
}
exports.generateLockXML = generateLockXML;
function getParser() {
  return new fast_xml_parser_1.j2xParser({
    attributeNamePrefix: "@_",
    format: true,
    ignoreAttributes: false,
    supressEmptyNode: true
  });
}
function namespace(obj, ns) {
  var copy = __assign({}, obj);
  for (var key in copy) {
    if (!copy.hasOwnProperty(key)) {
      continue;
    }
    if (copy[key] && _typeof(copy[key]) === "object" && key.indexOf(":") === -1) {
      copy["".concat(ns, ":").concat(key)] = namespace(copy[key], ns);
      delete copy[key];
    } else if (/^@_/.test(key) === false) {
      copy["".concat(ns, ":").concat(key)] = copy[key];
      delete copy[key];
    }
  }
  return copy;
}
function parseGenericResponse(xml) {
  return fast_xml_parser_1["default"].parse(xml, {
    arrayMode: false,
    ignoreNameSpace: true,
    parseAttributeValue: true,
    parseNodeValue: true
  });
}
exports.parseGenericResponse = parseGenericResponse;

/***/ }),

/***/ "./node_modules/webdav/dist/node/types.js":
/*!************************************************!*\
  !*** ./node_modules/webdav/dist/node/types.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.ErrorCode = exports.AuthType = void 0;
var AuthType;
(function (AuthType) {
  AuthType["Digest"] = "digest";
  AuthType["None"] = "none";
  AuthType["Password"] = "password";
  AuthType["Token"] = "token";
})(AuthType = exports.AuthType || (exports.AuthType = {}));
var ErrorCode;
(function (ErrorCode) {
  ErrorCode["DataTypeNoLength"] = "data-type-no-length";
  ErrorCode["InvalidAuthType"] = "invalid-auth-type";
  ErrorCode["InvalidOutputFormat"] = "invalid-output-format";
  ErrorCode["LinkUnsupportedAuthType"] = "link-unsupported-auth";
})(ErrorCode = exports.ErrorCode || (exports.ErrorCode = {}));

/***/ }),

/***/ "./node_modules/which-typed-array/index.js":
/*!*************************************************!*\
  !*** ./node_modules/which-typed-array/index.js ***!
  \*************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var forEach = __webpack_require__(/*! for-each */ "./node_modules/for-each/index.js");
var availableTypedArrays = __webpack_require__(/*! available-typed-arrays */ "./node_modules/available-typed-arrays/index.js");
var callBind = __webpack_require__(/*! call-bind */ "./node_modules/call-bind/index.js");
var callBound = __webpack_require__(/*! call-bound */ "./node_modules/call-bound/index.js");
var gOPD = __webpack_require__(/*! gopd */ "./node_modules/gopd/index.js");
var getProto = __webpack_require__(/*! get-proto */ "./node_modules/get-proto/index.js");
var $toString = callBound('Object.prototype.toString');
var hasToStringTag = __webpack_require__(/*! has-tostringtag/shams */ "./node_modules/has-tostringtag/shams.js")();
var g = typeof globalThis === 'undefined' ? __webpack_require__.g : globalThis;
var typedArrays = availableTypedArrays();
var $slice = callBound('String.prototype.slice');

/** @type {<T = unknown>(array: readonly T[], value: unknown) => number} */
var $indexOf = callBound('Array.prototype.indexOf', true) || function indexOf(array, value) {
  for (var i = 0; i < array.length; i += 1) {
    if (array[i] === value) {
      return i;
    }
  }
  return -1;
};

/** @typedef {import('./types').Getter} Getter */
/** @type {import('./types').Cache} */
var cache = {
  __proto__: null
};
if (hasToStringTag && gOPD && getProto) {
  forEach(typedArrays, function (typedArray) {
    var arr = new g[typedArray]();
    if (Symbol.toStringTag in arr && getProto) {
      var proto = getProto(arr);
      // @ts-expect-error TS won't narrow inside a closure
      var descriptor = gOPD(proto, Symbol.toStringTag);
      if (!descriptor && proto) {
        var superProto = getProto(proto);
        // @ts-expect-error TS won't narrow inside a closure
        descriptor = gOPD(superProto, Symbol.toStringTag);
      }
      // @ts-expect-error TODO: fix
      cache['$' + typedArray] = callBind(descriptor.get);
    }
  });
} else {
  forEach(typedArrays, function (typedArray) {
    var arr = new g[typedArray]();
    var fn = arr.slice || arr.set;
    if (fn) {
      cache[(/** @type {`$${import('.').TypedArrayName}`} */'$' + typedArray)] = /** @type {import('./types').BoundSlice | import('./types').BoundSet} */
      // @ts-expect-error TODO FIXME
      callBind(fn);
    }
  });
}

/** @type {(value: object) => false | import('.').TypedArrayName} */
var tryTypedArrays = function tryAllTypedArrays(value) {
  /** @type {ReturnType<typeof tryAllTypedArrays>} */var found = false;
  forEach(/** @type {Record<`\$${import('.').TypedArrayName}`, Getter>} */cache, /** @type {(getter: Getter, name: `\$${import('.').TypedArrayName}`) => void} */
  function (getter, typedArray) {
    if (!found) {
      try {
        // @ts-expect-error a throw is fine here
        if ('$' + getter(value) === typedArray) {
          found = /** @type {import('.').TypedArrayName} */$slice(typedArray, 1);
        }
      } catch (e) {/**/}
    }
  });
  return found;
};

/** @type {(value: object) => false | import('.').TypedArrayName} */
var trySlices = function tryAllSlices(value) {
  /** @type {ReturnType<typeof tryAllSlices>} */var found = false;
  forEach(/** @type {Record<`\$${import('.').TypedArrayName}`, Getter>} */cache, /** @type {(getter: Getter, name: `\$${import('.').TypedArrayName}`) => void} */function (getter, name) {
    if (!found) {
      try {
        // @ts-expect-error a throw is fine here
        getter(value);
        found = /** @type {import('.').TypedArrayName} */$slice(name, 1);
      } catch (e) {/**/}
    }
  });
  return found;
};

/** @type {import('.')} */
module.exports = function whichTypedArray(value) {
  if (!value || _typeof(value) !== 'object') {
    return false;
  }
  if (!hasToStringTag) {
    /** @type {string} */
    var tag = $slice($toString(value), 8, -1);
    if ($indexOf(typedArrays, tag) > -1) {
      return tag;
    }
    if (tag !== 'Object') {
      return false;
    }
    // node < 0.6 hits here on real Typed Arrays
    return trySlices(value);
  }
  if (!gOPD) {
    return null;
  } // unknown engine
  return tryTypedArrays(value);
};

/***/ }),

/***/ "./src/dashboard/dashboard.css":
/*!*************************************!*\
  !*** ./src/dashboard/dashboard.css ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/styleDomAPI.js */ "./node_modules/style-loader/dist/runtime/styleDomAPI.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/insertBySelector.js */ "./node_modules/style-loader/dist/runtime/insertBySelector.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/insertStyleElement.js */ "./node_modules/style-loader/dist/runtime/insertStyleElement.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/styleTagTransform.js */ "./node_modules/style-loader/dist/runtime/styleTagTransform.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_dashboard_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../../node_modules/css-loader/dist/cjs.js!./dashboard.css */ "./node_modules/css-loader/dist/cjs.js!./src/dashboard/dashboard.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());
options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_dashboard_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_dashboard_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_dashboard_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_dashboard_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ }),

/***/ "./src/utils/config.js":
/*!*****************************!*\
  !*** ./src/utils/config.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DEFAULT_SETTINGS: () => (/* binding */ DEFAULT_SETTINGS),
/* harmony export */   STORAGE_KEYS: () => (/* binding */ STORAGE_KEYS)
/* harmony export */ });
var STORAGE_KEYS = {
  // Data
  VIEWED_RECORDS: 'viewed',
  // Settings
  SETTINGS: 'settings',
  // For popup.js legacy keys - can be removed after migration
  HIDE_WATCHED_VIDEOS: 'hideWatchedVideos',
  HIDE_VIEWED_VIDEOS: 'hideViewedVideos',
  HIDE_VR_VIDEOS: 'hideVRVideos',
  STORED_IDS: 'myIds',
  BROWSE_HISTORY: 'videoBrowseHistory',
  LAST_UPLOAD_TIME: 'lastUploadTime',
  LAST_EXPORT_TIME: 'lastExportTime'
};
var DEFAULT_SETTINGS = {
  display: {
    hideWatched: false,
    hideViewed: false,
    hideVR: false
  },
  webdav: {
    enabled: false,
    url: '',
    username: '',
    password: '',
    autoSync: false
  },
  version: '1.0.1' // Default version
};

/***/ }),

/***/ "./src/utils/storage.js":
/*!******************************!*\
  !*** ./src/utils/storage.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getSettings: () => (/* binding */ getSettings),
/* harmony export */   getValue: () => (/* binding */ getValue),
/* harmony export */   saveSettings: () => (/* binding */ saveSettings),
/* harmony export */   setValue: () => (/* binding */ setValue)
/* harmony export */ });
/* harmony import */ var _config_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./config.js */ "./src/utils/config.js");
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { if (r) i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n;else { var o = function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); }; o("next", 0), o("throw", 1), o("return", 2); } }, _regeneratorDefine2(e, r, n, t); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// storage.js
// 封装 chrome.storage，兼容 GM_setValue/GM_getValue


function setValue(key, value) {
  return chrome.storage.local.set(_defineProperty({}, key, value));
}
function getValue(key, defaultValue) {
  return new Promise(function (resolve) {
    chrome.storage.local.get([key], function (result) {
      resolve(result[key] !== undefined ? result[key] : defaultValue);
    });
  });
}
function getSettings() {
  return _getSettings.apply(this, arguments);
}
function _getSettings() {
  _getSettings = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
    var storedSettings;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.n) {
        case 0:
          _context.n = 1;
          return getValue(_config_js__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.SETTINGS, {});
        case 1:
          storedSettings = _context.v;
          return _context.a(2, _objectSpread(_objectSpread(_objectSpread({}, _config_js__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_SETTINGS), storedSettings), {}, {
            display: _objectSpread(_objectSpread({}, _config_js__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_SETTINGS.display), storedSettings.display || {}),
            webdav: _objectSpread(_objectSpread({}, _config_js__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_SETTINGS.webdav), storedSettings.webdav || {})
          }));
      }
    }, _callee);
  }));
  return _getSettings.apply(this, arguments);
}
function saveSettings(settings) {
  return setValue(_config_js__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.SETTINGS, settings);
}

/***/ }),

/***/ "?d17e":
/*!**********************!*\
  !*** util (ignored) ***!
  \**********************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "?ed1b":
/*!**********************!*\
  !*** util (ignored) ***!
  \**********************/
/***/ (() => {

/* (ignored) */

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/amd options */
/******/ 	(() => {
/******/ 		__webpack_require__.amdO = {};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/nonce */
/******/ 	(() => {
/******/ 		__webpack_require__.nc = undefined;
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
/*!************************************!*\
  !*** ./src/dashboard/dashboard.js ***!
  \************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _dashboard_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./dashboard.css */ "./src/dashboard/dashboard.css");
/* harmony import */ var _utils_storage_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/storage.js */ "./src/utils/storage.js");
/* harmony import */ var _utils_config_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/config.js */ "./src/utils/config.js");
/* harmony import */ var webdav__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! webdav */ "./node_modules/webdav/dist/node/index.js");
/* harmony import */ var webdav__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(webdav__WEBPACK_IMPORTED_MODULE_3__);
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { if (r) i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n;else { var o = function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); }; o("next", 0), o("throw", 1), o("return", 2); } }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }




var CONFIG = {
  VERSION: '1.0.1',
  // Keep version in sync with manifest
  HIDE_WATCHED_VIDEOS_KEY: 'hideWatchedVideos',
  HIDE_VIEWED_VIDEOS_KEY: 'hideViewedVideos',
  HIDE_VR_VIDEOS_KEY: 'hideVRVideos',
  // Note: The concept of STORED_IDS_KEY and BROWSE_HISTORY_KEY from userscript
  // is replaced by a unified 'viewed' object in the extension,
  // which contains richer data (id, title, status, timestamp).
  WEBDEV_SETTINGS_KEY: 'webdavSettings'
};
document.addEventListener('DOMContentLoaded', function () {
  initializeTabs();
  initDashboardLogic();
  initSettingsLogic(); // Combines display and webdav settings
  initAdvancedSettingsLogic();
  initSidebar(); // For stats and info
  initHelpPanel();
});
function initializeTabs() {
  var tabs = document.querySelectorAll('.tab-link');
  var tabContents = document.querySelectorAll('.tab-content');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (item) {
        return item.classList.remove('active');
      });
      tab.classList.add('active');
      var targetTabId = tab.dataset.tab;
      tabContents.forEach(function (content) {
        if (content.id === targetTabId) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });
}
function initSidebar() {
  var infoContainer = document.getElementById('infoContainer');
  infoContainer.innerHTML = "\n        <div>Version: ".concat(CONFIG.VERSION, "</div>\n        <div>Author: Ryen</div>\n    ");
  // Stats overview is now handled by initDashboardLogic
}
function initHelpPanel() {
  var helpBtn = document.getElementById('helpBtn');
  var helpPanel = document.getElementById('helpPanel');
  if (helpBtn && helpPanel) {
    // First, inject the content structure for the modal
    var helpHTML = "\n            <div class=\"help-content-wrapper\">\n                <div class=\"help-header\">\n                    <h2>\u529F\u80FD\u8BF4\u660E</h2>\n                    <button id=\"closeHelpBtn\" title=\"\u5173\u95ED\">&times;</button>\n                </div>\n                <div class=\"help-body\">\n                    <h3>\u6570\u636E\u6982\u89C8\u4E0E\u5907\u4EFD (\u4FA7\u8FB9\u680F)</h3>\n                    <ul>\n                        <li><strong>\u6570\u636E\u6982\u89C8:</strong> \u5728\u4FA7\u8FB9\u680F\u5B9E\u65F6\u67E5\u770B\u5DF2\u89C2\u770B\u3001\u7A0D\u540E\u89C2\u770B\u548C\u603B\u8BB0\u5F55\u6570\u3002</li>\n                        <li><strong>\u672C\u5730\u5907\u4EFD:</strong> \u901A\u8FC7 \"\u5BFC\u5165/\u5BFC\u51FA\u672C\u5730\u5907\u4EFD\" \u529F\u80FD\uFF0C\u53EF\u4EE5\u624B\u52A8\u5907\u4EFD\u548C\u6062\u590D\u60A8\u7684\u6240\u6709\u89C2\u770B\u8BB0\u5F55\u4E3A JSON \u6587\u4EF6\uFF0C\u65B9\u4FBF\u5728\u4E0D\u540C\u8BBE\u5907\u95F4\u8FC1\u79FB\u3002</li>\n                        <li><strong>WebDAV \u540C\u6B65:</strong> \"\u7ACB\u5373\u4E0A\u4F20\" \u4F1A\u5C06\u60A8\u5F53\u524D\u7684\u672C\u5730\u8BB0\u5F55\u5907\u4EFD\u5230\u4E91\u7AEF\u3002\"\u4ECE\u4E91\u7AEF\u6062\u590D\" \u5219\u4F1A\u5217\u51FA\u4E91\u7AEF\u5907\u4EFD\u4F9B\u60A8\u6062\u590D\u3002</li>\n                        <li><strong>\u6E05\u7A7A\u8BB0\u5F55:</strong> \u6B64\u64CD\u4F5C\u4F1A\u5220\u9664\u6240\u6709\u672C\u5730\u5B58\u50A8\u7684\u89C2\u770B\u8BB0\u5F55\uFF0C\u8BF7\u8C28\u614E\u4F7F\u7528\u3002</li>\n                    </ul>\n                    <h3>\u89C2\u770B\u8BB0\u5F55 (\u4E3B\u9762\u677F)</h3>\n                    <ul>\n                        <li>\u5728\u6B64\u5904\u6D4F\u89C8\u3001\u641C\u7D22\u548C\u7B5B\u9009\u60A8\u7684\u6240\u6709\u89C2\u770B\u8BB0\u5F55\u3002\u70B9\u51FB\u8BB0\u5F55\u6807\u9898\u53EF\u76F4\u63A5\u8DF3\u8F6C\u5230\u5BF9\u5E94\u7684 JavDB \u9875\u9762\u3002</li>\n                    </ul>\n                    <h3>\u8BBE\u7F6E (\u4E3B\u9762\u677F)</h3>\n                    <ul>\n                        <li><strong>\u5217\u8868\u663E\u793A\u8BBE\u7F6E:</strong> \u63A7\u5236\u5728 JavDB \u7F51\u7AD9\u4E0A\u662F\u5426\u81EA\u52A8\u9690\u85CF\"\u5DF2\u770B\"\u3001\"\u5DF2\u6D4F\u89C8\"\u6216\"VR\"\u5F71\u7247\u3002\u8FD9\u4E9B\u8BBE\u7F6E\u662F\u5B9E\u65F6\u4FDD\u5B58\u7684\u3002</li>\n                        <li><strong>WebDAV \u8BBE\u7F6E:</strong> \u914D\u7F6E\u60A8\u7684\u4E91\u5B58\u50A8\u4FE1\u606F\uFF08\u5982\u575A\u679C\u4E91\u3001Nextcloud\u7B49\uFF09\u4EE5\u542F\u7528\u4E91\u540C\u6B65\u529F\u80FD\u3002\u542F\u7528 \"\u6BCF\u65E5\u81EA\u52A8\u4E0A\u4F20\" \u540E\uFF0C\u6269\u5C55\u4F1A\u5728\u6D4F\u89C8\u5668\u542F\u52A8\u65F6\u81EA\u52A8\u4E3A\u60A8\u5907\u4EFD\u4E00\u6B21\u3002</li>\n                    </ul>\n                </div>\n            </div>\n        ";
    helpPanel.innerHTML = helpHTML;

    // Then, add event listeners
    helpBtn.addEventListener('click', function () {
      helpPanel.classList.add('visible');
    });

    // This allows closing the panel by clicking on the overlay or the close button
    helpPanel.addEventListener('click', function (e) {
      if (e.target === helpPanel || e.target.closest('#closeHelpBtn')) {
        helpPanel.classList.remove('visible');
      }
    });
  }
}

// =================================================================
// ============== JAVDB RECORDS DASHBOARD LOGIC ====================
// =================================================================
function initDashboardLogic() {
  return _initDashboardLogic.apply(this, arguments);
} // =================================================================
// ==================== ADVANCED SETTINGS LOGIC ====================
// =================================================================
function _initDashboardLogic() {
  _initDashboardLogic = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5() {
    var searchInput, filterSelect, clearAllBtn, videoList, paginationContainer, statsOverview, importFile, exportBtn, allRecords, currentPage, recordsPerPage, loadRecords, _loadRecords, render, renderStats, renderVideoList, renderPagination;
    return _regenerator().w(function (_context5) {
      while (1) switch (_context5.n) {
        case 0:
          renderPagination = function _renderPagination(totalRecords) {
            paginationContainer.innerHTML = '';
            var totalPages = Math.ceil(totalRecords / recordsPerPage);
            if (totalPages <= 1) return;
            var _loop = function _loop(i) {
              var pageBtn = document.createElement('button');
              pageBtn.textContent = i;
              pageBtn.disabled = i === currentPage;
              pageBtn.addEventListener('click', function () {
                currentPage = i;
                render();
              });
              paginationContainer.appendChild(pageBtn);
            };
            for (var i = 1; i <= totalPages; i++) {
              _loop(i);
            }
          };
          renderVideoList = function _renderVideoList(records) {
            videoList.innerHTML = '';
            var startIndex = (currentPage - 1) * recordsPerPage;
            var pageRecords = records.slice(startIndex, startIndex + recordsPerPage);
            if (pageRecords.length === 0) {
              videoList.innerHTML = '<li>没有找到符合条件的记录。</li>';
              return;
            }
            pageRecords.forEach(function (record) {
              var li = document.createElement('li');
              li.innerHTML = "\n                <a href=\"https://javdb.com/v/".concat(record.id, "\" target=\"_blank\" title=\"").concat(record.id, " - ").concat(record.title, "\">").concat(record.id, " - ").concat(record.title, "</a>\n                <span class=\"status-tag\">").concat(record.status === 'viewed' ? '已观看' : '稍后看', "</span>\n                <span class=\"timestamp\">").concat(new Date(record.timestamp).toLocaleString(), "</span>\n            ");
              videoList.appendChild(li);
            });
          };
          renderStats = function _renderStats(records) {
            var total = records.length;
            var viewedCount = records.filter(function (r) {
              return r.status === 'viewed';
            }).length;
            var laterCount = records.filter(function (r) {
              return r.status === 'later';
            }).length;
            statsOverview.innerHTML = "\n            <div><span class=\"stat-value\">".concat(total, "</span><span class=\"stat-label\">\u603B\u8BB0\u5F55</span></div>\n            <div><span class=\"stat-value\">").concat(viewedCount, "</span><span class=\"stat-label\">\u5DF2\u89C2\u770B</span></div>\n            <div><span class=\"stat-value\">").concat(laterCount, "</span><span class=\"stat-label\">\u7A0D\u540E\u770B</span></div>\n        ");
          };
          render = function _render() {
            var searchTerm = searchInput.value.toLowerCase();
            var filterValue = filterSelect.value;
            var filteredRecords = allRecords.filter(function (record) {
              var title = record.title || '';
              var id = record.id || '';
              var matchesSearch = title.toLowerCase().includes(searchTerm) || id.toLowerCase().includes(searchTerm);
              var matchesFilter = filterValue === 'all' || record.status === filterValue;
              return matchesSearch && matchesFilter;
            });
            filteredRecords.sort(function (a, b) {
              return (b.timestamp || 0) - (a.timestamp || 0);
            });
            renderStats(allRecords); // Pass all records for global stats
            renderVideoList(filteredRecords);
            renderPagination(filteredRecords.length);
          };
          _loadRecords = function _loadRecords3() {
            _loadRecords = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4() {
              var viewedData;
              return _regenerator().w(function (_context4) {
                while (1) switch (_context4.n) {
                  case 0:
                    _context4.n = 1;
                    return (0,_utils_storage_js__WEBPACK_IMPORTED_MODULE_1__.getValue)('viewed', {});
                  case 1:
                    viewedData = _context4.v;
                    allRecords = Object.values(viewedData);
                    render();
                  case 2:
                    return _context4.a(2);
                }
              }, _callee4);
            }));
            return _loadRecords.apply(this, arguments);
          };
          loadRecords = function _loadRecords2() {
            return _loadRecords.apply(this, arguments);
          };
          searchInput = document.getElementById('searchInput');
          filterSelect = document.getElementById('filterSelect');
          clearAllBtn = document.getElementById('clearAllBtn');
          videoList = document.getElementById('videoList');
          paginationContainer = document.querySelector('.pagination');
          statsOverview = document.getElementById('stats-overview');
          importFile = document.getElementById('importFile');
          exportBtn = document.getElementById('exportBtn');
          allRecords = [];
          currentPage = 1;
          recordsPerPage = 20;
          clearAllBtn.addEventListener('click', /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
            return _regenerator().w(function (_context) {
              while (1) switch (_context.n) {
                case 0:
                  if (!confirm('确定要清空所有本地观看记录吗？此操作不可逆！')) {
                    _context.n = 2;
                    break;
                  }
                  _context.n = 1;
                  return (0,_utils_storage_js__WEBPACK_IMPORTED_MODULE_1__.setValue)('viewed', {});
                case 1:
                  _context.n = 2;
                  return loadRecords();
                case 2:
                  return _context.a(2);
              }
            }, _callee);
          })));

          // --- Import / Export ---
          exportBtn.addEventListener('click', /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
            var records, settings, dataToExport, blob, url, a;
            return _regenerator().w(function (_context2) {
              while (1) switch (_context2.n) {
                case 0:
                  _context2.n = 1;
                  return (0,_utils_storage_js__WEBPACK_IMPORTED_MODULE_1__.getValue)(_utils_config_js__WEBPACK_IMPORTED_MODULE_2__.STORAGE_KEYS.VIEWED_RECORDS, {});
                case 1:
                  records = _context2.v;
                  _context2.n = 2;
                  return (0,_utils_storage_js__WEBPACK_IMPORTED_MODULE_1__.getSettings)();
                case 2:
                  settings = _context2.v;
                  if (!(Object.keys(records).length === 0)) {
                    _context2.n = 3;
                    break;
                  }
                  alert("没有记录可导出。");
                  return _context2.a(2);
                case 3:
                  dataToExport = {
                    settings: settings,
                    data: records
                  };
                  blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
                    type: 'application/json'
                  });
                  url = URL.createObjectURL(blob);
                  a = document.createElement('a');
                  a.href = url;
                  a.download = "javdb_extension_backup_".concat(new Date().toISOString().slice(0, 10), ".json");
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                case 4:
                  return _context2.a(2);
              }
            }, _callee2);
          })));
          importFile.addEventListener('change', function (event) {
            var file = event.target.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = /*#__PURE__*/function () {
              var _ref3 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(e) {
                var importData, _t;
                return _regenerator().w(function (_context3) {
                  while (1) switch (_context3.p = _context3.n) {
                    case 0:
                      _context3.p = 0;
                      importData = JSON.parse(e.target.result);
                      if (!(_typeof(importData) !== 'object' || importData === null)) {
                        _context3.n = 1;
                        break;
                      }
                      throw new Error("无效的JSON格式。");
                    case 1:
                      if (!(importData.settings && importData.data)) {
                        _context3.n = 7;
                        break;
                      }
                      if (!confirm("\u5373\u5C06\u4ECE\u6587\u4EF6\u6062\u590D\u8BBE\u7F6E\u548C ".concat(Object.keys(importData.data).length, " \u6761\u8BB0\u5F55\u3002\u8FD9\u5C06\u8986\u76D6\u6240\u6709\u73B0\u6709\u6570\u636E\uFF0C\u786E\u5B9A\u5417\uFF1F"))) {
                        _context3.n = 6;
                        break;
                      }
                      _context3.n = 2;
                      return (0,_utils_storage_js__WEBPACK_IMPORTED_MODULE_1__.saveSettings)(importData.settings);
                    case 2:
                      _context3.n = 3;
                      return (0,_utils_storage_js__WEBPACK_IMPORTED_MODULE_1__.setValue)(_utils_config_js__WEBPACK_IMPORTED_MODULE_2__.STORAGE_KEYS.VIEWED_RECORDS, importData.data);
                    case 3:
                      _context3.n = 4;
                      return loadRecords();
                    case 4:
                      _context3.n = 5;
                      return initSettingsLogic();
                    case 5:
                      // Reload settings on screen
                      alert("设置和数据导入成功！");
                    case 6:
                      _context3.n = 10;
                      break;
                    case 7:
                      if (!confirm("\u68C0\u6D4B\u5230\u65E7\u7248\u5907\u4EFD\u6587\u4EF6\u3002\u5373\u5C06\u5BFC\u5165 ".concat(Object.keys(importData).length, " \u6761\u8BB0\u5F55\u3002\u8FD9\u5C06\u8986\u76D6\u60A8\u5F53\u524D\u7684\u89C2\u770B\u8BB0\u5F55\uFF08\u4F46\u4FDD\u7559\u8BBE\u7F6E\uFF09\uFF0C\u786E\u5B9A\u5417\uFF1F"))) {
                        _context3.n = 10;
                        break;
                      }
                      _context3.n = 8;
                      return (0,_utils_storage_js__WEBPACK_IMPORTED_MODULE_1__.setValue)(_utils_config_js__WEBPACK_IMPORTED_MODULE_2__.STORAGE_KEYS.VIEWED_RECORDS, importData);
                    case 8:
                      _context3.n = 9;
                      return loadRecords();
                    case 9:
                      alert("导入成功！");
                    case 10:
                      _context3.n = 12;
                      break;
                    case 11:
                      _context3.p = 11;
                      _t = _context3.v;
                      alert("\u5BFC\u5165\u5931\u8D25: ".concat(_t.message));
                    case 12:
                      return _context3.a(2);
                  }
                }, _callee3, null, [[0, 11]]);
              }));
              return function (_x) {
                return _ref3.apply(this, arguments);
              };
            }();
            reader.readAsText(file);
          });
          searchInput.addEventListener('input', function () {
            currentPage = 1;
            render();
          });
          filterSelect.addEventListener('change', function () {
            currentPage = 1;
            render();
          });
          _context5.n = 1;
          return loadRecords();
        case 1:
          return _context5.a(2);
      }
    }, _callee5);
  }));
  return _initDashboardLogic.apply(this, arguments);
}
function initAdvancedSettingsLogic() {
  return _initAdvancedSettingsLogic.apply(this, arguments);
} // =================================================================
// ==================== SETTINGS LOGIC =============================
// =================================================================
function _initAdvancedSettingsLogic() {
  _initAdvancedSettingsLogic = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee8() {
    var jsonConfigTextArea, editJsonBtn, saveJsonBtn, loadConfig, _loadConfig;
    return _regenerator().w(function (_context8) {
      while (1) switch (_context8.n) {
        case 0:
          _loadConfig = function _loadConfig3() {
            _loadConfig = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7() {
              var settings;
              return _regenerator().w(function (_context7) {
                while (1) switch (_context7.n) {
                  case 0:
                    _context7.n = 1;
                    return (0,_utils_storage_js__WEBPACK_IMPORTED_MODULE_1__.getSettings)();
                  case 1:
                    settings = _context7.v;
                    jsonConfigTextArea.value = JSON.stringify(settings, null, 2);
                  case 2:
                    return _context7.a(2);
                }
              }, _callee7);
            }));
            return _loadConfig.apply(this, arguments);
          };
          loadConfig = function _loadConfig2() {
            return _loadConfig.apply(this, arguments);
          };
          jsonConfigTextArea = document.getElementById('jsonConfig');
          editJsonBtn = document.getElementById('editJsonBtn');
          saveJsonBtn = document.getElementById('saveJsonBtn');
          editJsonBtn.addEventListener('click', function () {
            jsonConfigTextArea.readOnly = false;
            jsonConfigTextArea.focus();
            editJsonBtn.classList.add('hidden');
            saveJsonBtn.classList.remove('hidden');
          });
          saveJsonBtn.addEventListener('click', /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6() {
            var newSettings, _t2;
            return _regenerator().w(function (_context6) {
              while (1) switch (_context6.p = _context6.n) {
                case 0:
                  _context6.p = 0;
                  newSettings = JSON.parse(jsonConfigTextArea.value);
                  _context6.n = 1;
                  return (0,_utils_storage_js__WEBPACK_IMPORTED_MODULE_1__.saveSettings)(newSettings);
                case 1:
                  jsonConfigTextArea.readOnly = true;
                  editJsonBtn.classList.remove('hidden');
                  saveJsonBtn.classList.add('hidden');
                  alert('高级配置已成功保存！');

                  // Reload other tabs to reflect potential changes
                  _context6.n = 2;
                  return initSettingsLogic();
                case 2:
                  _context6.n = 4;
                  break;
                case 3:
                  _context6.p = 3;
                  _t2 = _context6.v;
                  alert("JSON \u683C\u5F0F\u65E0\u6548\uFF0C\u8BF7\u68C0\u67E5\u540E\u91CD\u8BD5\u3002\n\u9519\u8BEF\u4FE1\u606F: ".concat(_t2.message));
                case 4:
                  return _context6.a(2);
              }
            }, _callee6, null, [[0, 3]]);
          })));
          _context8.n = 1;
          return loadConfig();
        case 1:
          return _context8.a(2);
      }
    }, _callee8);
  }));
  return _initAdvancedSettingsLogic.apply(this, arguments);
}
function initSettingsLogic() {
  return _initSettingsLogic.apply(this, arguments);
}
function _initSettingsLogic() {
  _initSettingsLogic = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee14() {
    var hideWatchedCheckbox, hideViewedCheckbox, hideVRCheckbox, loadDisplaySettings, _loadDisplaySettings, saveDisplaySetting, _saveDisplaySetting, webdavEnabled, webdavFieldsContainer, urlInput, userInput, passInput, autoSyncCheckbox, saveAndTestBtn, syncNowBtn, syncDownBtn, fileListContainer, fileList, logElement, log, loadWebdavSettings, _loadWebdavSettings, toggleWebdavFields, testConnection, _testConnection, listRemoteFiles, _listRemoteFiles;
    return _regenerator().w(function (_context14) {
      while (1) switch (_context14.n) {
        case 0:
          _listRemoteFiles = function _listRemoteFiles3() {
            _listRemoteFiles = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee13() {
              var settings, client, dirItems, _t4;
              return _regenerator().w(function (_context13) {
                while (1) switch (_context13.p = _context13.n) {
                  case 0:
                    _context13.n = 1;
                    return (0,_utils_storage_js__WEBPACK_IMPORTED_MODULE_1__.getSettings)();
                  case 1:
                    settings = _context13.v;
                    if (!(!settings.webdav || !settings.webdav.enabled || !settings.webdav.url)) {
                      _context13.n = 2;
                      break;
                    }
                    fileListContainer.classList.add('hidden');
                    return _context13.a(2);
                  case 2:
                    log('正在获取云端文件列表...');
                    fileListContainer.classList.remove('hidden');
                    fileList.innerHTML = '<li>加载中...</li>';
                    _context13.p = 3;
                    client = (0,webdav__WEBPACK_IMPORTED_MODULE_3__.createClient)(settings.webdav.url, {
                      username: settings.webdav.username,
                      password: settings.webdav.password
                    });
                    _context13.n = 4;
                    return client.getDirectoryContents('/');
                  case 4:
                    dirItems = _context13.v.filter(function (item) {
                      return item.type === 'file' && item.basename.endsWith('.json');
                    });
                    fileList.innerHTML = '';
                    if (!(dirItems.length === 0)) {
                      _context13.n = 5;
                      break;
                    }
                    fileList.innerHTML = '<li>未找到任何 .json 备份文件。</li>';
                    return _context13.a(2);
                  case 5:
                    dirItems.sort(function (a, b) {
                      return new Date(b.lastmod) - new Date(a.lastmod);
                    }).forEach(function (item) {
                      var li = document.createElement('li');
                      li.textContent = "".concat(item.basename, " (").concat(new Date(item.lastmod).toLocaleString(), ")");
                      li.dataset.filename = item.filename;
                      li.addEventListener('click', function () {
                        if (confirm("\u786E\u5B9A\u8981\u4ECE ".concat(item.basename, " \u6062\u590D\u6570\u636E\u5417\uFF1F\u6B64\u64CD\u4F5C\u4F1A\u8986\u76D6\u672C\u5730\u6240\u6709\u89C2\u770B\u8BB0\u5F55\u3002"))) {
                          log("\u8BF7\u6C42\u4ECE ".concat(item.basename, " \u6062\u590D..."));
                          chrome.runtime.sendMessage({
                            type: 'webdav-restore',
                            filename: item.filename
                          }, function (response) {
                            if (response && response.success) {
                              log("\u2705 \u4ECE ".concat(item.basename, " \u6062\u590D\u6210\u529F\uFF01"));
                              initDashboardLogic(); // Re-initialize to show new data
                            } else {
                              log("\u274C \u6062\u590D\u5931\u8D25: ".concat(response ? response.error : '未知错误'));
                            }
                          });
                        }
                      });
                      fileList.appendChild(li);
                    });
                    log("\u2705 \u6210\u529F\u83B7\u53D6 ".concat(dirItems.length, " \u4E2A\u5907\u4EFD\u6587\u4EF6\u3002"));
                    _context13.n = 7;
                    break;
                  case 6:
                    _context13.p = 6;
                    _t4 = _context13.v;
                    log("\u274C \u83B7\u53D6\u6587\u4EF6\u5217\u8868\u5931\u8D25: ".concat(_t4.message));
                    fileList.innerHTML = '<li>获取列表失败。</li>';
                  case 7:
                    return _context13.a(2);
                }
              }, _callee13, null, [[3, 6]]);
            }));
            return _listRemoteFiles.apply(this, arguments);
          };
          listRemoteFiles = function _listRemoteFiles2() {
            return _listRemoteFiles.apply(this, arguments);
          };
          _testConnection = function _testConnection3() {
            _testConnection = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee12(webdavSettings) {
              var client, _t3;
              return _regenerator().w(function (_context12) {
                while (1) switch (_context12.p = _context12.n) {
                  case 0:
                    log('正在测试 WebDAV 连接...');
                    _context12.p = 1;
                    client = (0,webdav__WEBPACK_IMPORTED_MODULE_3__.createClient)(webdavSettings.url, {
                      username: webdavSettings.username,
                      password: webdavSettings.password
                    });
                    _context12.n = 2;
                    return client.getDirectoryContents('/');
                  case 2:
                    log('✅ WebDAV 连接成功！');
                    listRemoteFiles();
                    _context12.n = 4;
                    break;
                  case 3:
                    _context12.p = 3;
                    _t3 = _context12.v;
                    log('❌ WebDAV 连接失败: ' + _t3.message);
                  case 4:
                    return _context12.a(2);
                }
              }, _callee12, null, [[1, 3]]);
            }));
            return _testConnection.apply(this, arguments);
          };
          testConnection = function _testConnection2(_x4) {
            return _testConnection.apply(this, arguments);
          };
          toggleWebdavFields = function _toggleWebdavFields() {
            webdavFieldsContainer.classList.toggle('hidden', !webdavEnabled.checked);
          };
          _loadWebdavSettings = function _loadWebdavSettings3() {
            _loadWebdavSettings = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee11() {
              var settings;
              return _regenerator().w(function (_context11) {
                while (1) switch (_context11.n) {
                  case 0:
                    _context11.n = 1;
                    return (0,_utils_storage_js__WEBPACK_IMPORTED_MODULE_1__.getSettings)();
                  case 1:
                    settings = _context11.v;
                    webdavEnabled.checked = settings.webdav.enabled;
                    urlInput.value = settings.webdav.url || '';
                    userInput.value = settings.webdav.username || '';
                    passInput.value = settings.webdav.password || '';
                    autoSyncCheckbox.checked = settings.webdav.autoSync;
                    toggleWebdavFields();
                  case 2:
                    return _context11.a(2);
                }
              }, _callee11);
            }));
            return _loadWebdavSettings.apply(this, arguments);
          };
          loadWebdavSettings = function _loadWebdavSettings2() {
            return _loadWebdavSettings.apply(this, arguments);
          };
          log = function _log(message) {
            var timestamp = new Date().toLocaleTimeString();
            logElement.textContent += "[".concat(timestamp, "] ").concat(message, "\n");
            logElement.scrollTop = logElement.scrollHeight;
          };
          _saveDisplaySetting = function _saveDisplaySetting3() {
            _saveDisplaySetting = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee10(key, value) {
              var settings;
              return _regenerator().w(function (_context10) {
                while (1) switch (_context10.n) {
                  case 0:
                    _context10.n = 1;
                    return (0,_utils_storage_js__WEBPACK_IMPORTED_MODULE_1__.getSettings)();
                  case 1:
                    settings = _context10.v;
                    settings.display[key] = value;
                    _context10.n = 2;
                    return (0,_utils_storage_js__WEBPACK_IMPORTED_MODULE_1__.saveSettings)(settings);
                  case 2:
                    return _context10.a(2);
                }
              }, _callee10);
            }));
            return _saveDisplaySetting.apply(this, arguments);
          };
          saveDisplaySetting = function _saveDisplaySetting2(_x2, _x3) {
            return _saveDisplaySetting.apply(this, arguments);
          };
          _loadDisplaySettings = function _loadDisplaySettings3() {
            _loadDisplaySettings = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee1() {
              var settings;
              return _regenerator().w(function (_context1) {
                while (1) switch (_context1.n) {
                  case 0:
                    _context1.n = 1;
                    return (0,_utils_storage_js__WEBPACK_IMPORTED_MODULE_1__.getSettings)();
                  case 1:
                    settings = _context1.v;
                    hideWatchedCheckbox.checked = settings.display.hideWatched;
                    hideViewedCheckbox.checked = settings.display.hideViewed;
                    hideVRCheckbox.checked = settings.display.hideVR;
                  case 2:
                    return _context1.a(2);
                }
              }, _callee1);
            }));
            return _loadDisplaySettings.apply(this, arguments);
          };
          loadDisplaySettings = function _loadDisplaySettings2() {
            return _loadDisplaySettings.apply(this, arguments);
          };
          // --- Display Settings ---
          hideWatchedCheckbox = document.getElementById('hideWatchedVideos');
          hideViewedCheckbox = document.getElementById('hideViewedVideos');
          hideVRCheckbox = document.getElementById('hideVRVideos');
          hideWatchedCheckbox.addEventListener('change', function () {
            return saveDisplaySetting('hideWatched', hideWatchedCheckbox.checked);
          });
          hideViewedCheckbox.addEventListener('change', function () {
            return saveDisplaySetting('hideViewed', hideViewedCheckbox.checked);
          });
          hideVRCheckbox.addEventListener('change', function () {
            return saveDisplaySetting('hideVR', hideVRCheckbox.checked);
          });

          // --- WebDAV Settings ---
          webdavEnabled = document.getElementById('webdavEnabled');
          webdavFieldsContainer = document.getElementById('webdav-fields-container');
          urlInput = document.getElementById('webdavUrl');
          userInput = document.getElementById('webdavUser');
          passInput = document.getElementById('webdavPass');
          autoSyncCheckbox = document.getElementById('webdavAutoSync');
          saveAndTestBtn = document.getElementById('saveAndTest');
          syncNowBtn = document.getElementById('syncNow'); // This one is in the sidebar
          syncDownBtn = document.getElementById('syncDown'); // This one is in the sidebar
          fileListContainer = document.getElementById('fileListContainer');
          fileList = document.getElementById('fileList');
          logElement = document.getElementById('log');
          webdavEnabled.addEventListener('change', /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee9() {
            var settings;
            return _regenerator().w(function (_context9) {
              while (1) switch (_context9.n) {
                case 0:
                  toggleWebdavFields();
                  _context9.n = 1;
                  return (0,_utils_storage_js__WEBPACK_IMPORTED_MODULE_1__.getSettings)();
                case 1:
                  settings = _context9.v;
                  settings.webdav.enabled = webdavEnabled.checked;
                  _context9.n = 2;
                  return (0,_utils_storage_js__WEBPACK_IMPORTED_MODULE_1__.saveSettings)(settings);
                case 2:
                  return _context9.a(2);
              }
            }, _callee9);
          })));
          saveAndTestBtn.addEventListener('click', /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee0() {
            var settings, newWebdavSettings;
            return _regenerator().w(function (_context0) {
              while (1) switch (_context0.n) {
                case 0:
                  _context0.n = 1;
                  return (0,_utils_storage_js__WEBPACK_IMPORTED_MODULE_1__.getSettings)();
                case 1:
                  settings = _context0.v;
                  newWebdavSettings = {
                    enabled: webdavEnabled.checked,
                    url: urlInput.value.trim(),
                    username: userInput.value.trim(),
                    password: passInput.value,
                    autoSync: autoSyncCheckbox.checked
                  };
                  settings.webdav = newWebdavSettings;
                  _context0.n = 2;
                  return (0,_utils_storage_js__WEBPACK_IMPORTED_MODULE_1__.saveSettings)(settings);
                case 2:
                  log('WebDAV 设置已保存');
                  if (newWebdavSettings.enabled && newWebdavSettings.url) {
                    testConnection(newWebdavSettings);
                  } else {
                    log('WebDAV 未启用或 URL 为空，跳过测试。');
                  }
                case 3:
                  return _context0.a(2);
              }
            }, _callee0);
          })));
          syncNowBtn.addEventListener('click', function () {
            log('开始上传数据...');
            chrome.runtime.sendMessage({
              type: 'webdav-upload'
            }, function (response) {
              if (response && response.success) {
                log('✅ 上传成功！');
                listRemoteFiles();
              } else {
                log("\u274C \u4E0A\u4F20\u5931\u8D25: ".concat(response ? response.error : '未知错误'));
              }
            });
          });
          syncDownBtn.addEventListener('click', listRemoteFiles);

          // Initial Load
          _context14.n = 1;
          return loadDisplaySettings();
        case 1:
          _context14.n = 2;
          return loadWebdavSettings();
        case 2:
          return _context14.a(2);
      }
    }, _callee14);
  }));
  return _initSettingsLogic.apply(this, arguments);
}
})();

/******/ })()
;
//# sourceMappingURL=dashboard.js.map