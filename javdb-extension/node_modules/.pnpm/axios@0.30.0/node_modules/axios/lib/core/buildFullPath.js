'use strict';

var isAbsoluteURL = require('../helpers/isAbsoluteURL');
var combineURLs = require('../helpers/combineURLs');

/**
 * Creates a new URL by combining the baseURL with the requestedURL,
 * only when the requestedURL is not already an absolute URL.
 * If the requestURL is absolute, this function returns the requestedURL untouched.
 *
 * @param {string} baseURL The base URL
 * @param {string} requestedURL Absolute or relative URL to combine
 * @param {boolean} allowAbsoluteUrls Set to true to allow absolute URLs
 *
 * @returns {string} The combined full path
 */
module.exports = function buildFullPath(baseURL, requestedURL, allowAbsoluteUrls) {
  var isRelativeURL = !isAbsoluteURL(requestedURL);
  if (baseURL && (isRelativeURL || allowAbsoluteUrls === false)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
};
