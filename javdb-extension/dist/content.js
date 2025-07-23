/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/utils/config.js":
/*!*****************************!*\
  !*** ./src/utils/config.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DEFAULT_SETTINGS: () => (/* binding */ DEFAULT_SETTINGS),
/* harmony export */   STORAGE_KEYS: () => (/* binding */ STORAGE_KEYS)
/* harmony export */ });
var STORAGE_KEYS = {
  // A single key for all viewed records, which is an object
  // where keys are video IDs and values are objects with { title, status, timestamp }.
  VIEWED_RECORDS: 'viewed',
  // Stores all settings, including display and WebDAV configurations.
  SETTINGS: 'settings',
  // Key for storing persistent logs.
  LOGS: 'persistent_logs'
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

/***/ "./src/utils/utils.js":
/*!****************************!*\
  !*** ./src/utils/utils.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   sleep: () => (/* binding */ sleep)
/* harmony export */ });
function sleep(ms) {
  return new Promise(function (resolve) {
    return setTimeout(resolve, ms);
  });
}

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
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
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
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!********************************!*\
  !*** ./src/content/content.js ***!
  \********************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _utils_storage_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/storage.js */ "./src/utils/storage.js");
/* harmony import */ var _utils_utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/utils.js */ "./src/utils/utils.js");
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { if (r) i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n;else { var o = function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); }; o("next", 0), o("throw", 1), o("return", 2); } }, _regeneratorDefine2(e, r, n, t); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
// content.js
// 注入到 javdb.com 页面，负责页面 DOM 操作、UI 注入、状态标记等


var STATE = {
  settings: {},
  watchedIds: new Set(),
  viewedIds: new Set(),
  isSearchPage: false,
  observer: null,
  debounceTimer: null,
  originalFaviconUrl: ''
};
var SELECTORS = {
  MOVIE_LIST_ITEM: '.movie-list .item',
  VIDEO_TITLE: 'div.video-title > strong',
  VIDEO_ID: '.uid, .item-id > strong',
  TAGS_CONTAINER: '.tags.has-addons',
  FAVICON: "link[rel~='icon']",
  VIDEO_DETAIL_ID: '.panel-block.first-block',
  SEARCH_RESULT_PAGE: '.container .column.is-9',
  EXPORT_TOOLBAR: '.toolbar, .breadcrumb ul'
};
var log = function log() {
  var _console;
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }
  return (_console = console).log.apply(_console, ['[JavDB Ext]'].concat(args));
};

// --- Core Logic ---
function initialize() {
  return _initialize.apply(this, arguments);
}
function _initialize() {
  _initialize = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
    var _yield$Promise$all, _yield$Promise$all2, settings, watched, viewed, faviconLink;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.n) {
        case 0:
          log('Extension initializing...');

          // 1. Fetch all necessary data and settings at once
          _context.n = 1;
          return Promise.all([(0,_utils_storage_js__WEBPACK_IMPORTED_MODULE_0__.getSettings)(), (0,_utils_storage_js__WEBPACK_IMPORTED_MODULE_0__.getValue)('myIds', []), (0,_utils_storage_js__WEBPACK_IMPORTED_MODULE_0__.getValue)('videoBrowseHistory', [])]);
        case 1:
          _yield$Promise$all = _context.v;
          _yield$Promise$all2 = _slicedToArray(_yield$Promise$all, 3);
          settings = _yield$Promise$all2[0];
          watched = _yield$Promise$all2[1];
          viewed = _yield$Promise$all2[2];
          STATE.settings = settings;
          STATE.watchedIds = new Set(watched);
          STATE.viewedIds = new Set(viewed);
          log("Loaded ".concat(STATE.watchedIds.size, " watched, ").concat(STATE.viewedIds.size, " viewed."));

          // 2. Check page context
          STATE.isSearchPage = !!document.querySelector(SELECTORS.SEARCH_RESULT_PAGE);
          if (STATE.isSearchPage) {
            log('Search page detected, hiding functions will be disabled.');
          }

          // 3. Store original favicon
          faviconLink = document.querySelector(SELECTORS.FAVICON);
          if (faviconLink) {
            STATE.originalFaviconUrl = faviconLink.href;
          }

          // 4. Initial processing of visible items
          processVisibleItems();

          // 5. Setup MutationObserver to handle dynamic content
          setupObserver();

          // 6. Handle specific page logic
          if (window.location.pathname.startsWith('/v/')) {
            handleVideoDetailPage();
          }

          // 7. Initialize export functionality on relevant pages
          initExportFeature();
        case 2:
          return _context.a(2);
      }
    }, _callee);
  }));
  return _initialize.apply(this, arguments);
}
function processVisibleItems() {
  document.querySelectorAll(SELECTORS.MOVIE_LIST_ITEM).forEach(function (item) {
    return processItem(item);
  });
}
function setupObserver() {
  var targetNode = document.querySelector('.movie-list');
  if (!targetNode) return;
  STATE.observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.addedNodes.length > 0) {
        clearTimeout(STATE.debounceTimer);
        STATE.debounceTimer = setTimeout(processVisibleItems, 300);
      }
    });
  });
  STATE.observer.observe(targetNode, {
    childList: true,
    subtree: true
  });
}
function shouldHide(item) {
  var _item$querySelector, _item$querySelector2;
  if (STATE.isSearchPage) return false;
  var _STATE$settings$displ = STATE.settings.display,
    hideWatched = _STATE$settings$displ.hideWatched,
    hideViewed = _STATE$settings$displ.hideViewed,
    hideVR = _STATE$settings$displ.hideVR;
  var isWatched = item.classList.contains('watched-item');
  var isViewed = item.classList.contains('viewed-item');
  var isVR = ((_item$querySelector = item.querySelector('.tag.is-link')) === null || _item$querySelector === void 0 ? void 0 : _item$querySelector.textContent.trim()) === 'VR' || ((_item$querySelector2 = item.querySelector('.panel-block.tags')) === null || _item$querySelector2 === void 0 ? void 0 : _item$querySelector2.innerText.includes('VR'));
  if (hideWatched && isWatched) return true;
  if (hideViewed && isViewed && !isWatched) return true;
  if (hideVR && isVR) return true;
  return false;
}
function processItem(item) {
  var videoIdElement = item.querySelector(SELECTORS.VIDEO_ID);
  if (!videoIdElement) return;
  var videoId = videoIdElement.textContent.trim();
  if (!videoId) return;

  // Remove existing tags to avoid duplication
  item.querySelectorAll('.watched-tag, .viewed-tag').forEach(function (tag) {
    return tag.remove();
  });
  var tagContainer = item.querySelector(SELECTORS.TAGS_CONTAINER);
  if (!tagContainer) return;
  if (STATE.watchedIds.has(videoId)) {
    addTag(tagContainer, '我看過這部影片', 'is-success');
    item.classList.add('watched-item');
  } else if (STATE.viewedIds.has(videoId)) {
    addTag(tagContainer, '已浏览', 'is-warning');
    item.classList.add('viewed-item');
  }
  if (shouldHide(item)) {
    item.style.display = 'none';
  }
}
function addTag(container, text, style) {
  var tag = document.createElement('span');
  tag.className = "tag ".concat(style, " is-light watched-tag");
  tag.textContent = text;
  container.appendChild(tag);
}

// --- Page-Specific Logic ---
function handleVideoDetailPage() {
  return _handleVideoDetailPage.apply(this, arguments);
} // --- Utils ---
function _handleVideoDetailPage() {
  _handleVideoDetailPage = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
    var videoIdMatch, videoId, isWatched, isViewed;
    return _regenerator().w(function (_context3) {
      while (1) switch (_context3.n) {
        case 0:
          videoIdMatch = window.location.pathname.match(/\/v\/(\w+)/);
          if (videoIdMatch) {
            _context3.n = 1;
            break;
          }
          return _context3.a(2);
        case 1:
          videoId = videoIdMatch[1];
          isWatched = STATE.watchedIds.has(videoId);
          isViewed = STATE.viewedIds.has(videoId);
          if (isWatched || isViewed) {
            setFavicon(chrome.runtime.getURL("src/assets/jav.png"));
          }
          if (!isWatched && !isViewed) {
            setTimeout(/*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
              var currentViewed;
              return _regenerator().w(function (_context2) {
                while (1) switch (_context2.n) {
                  case 0:
                    _context2.n = 1;
                    return (0,_utils_storage_js__WEBPACK_IMPORTED_MODULE_0__.getValue)('videoBrowseHistory', []);
                  case 1:
                    currentViewed = _context2.v;
                    if (currentViewed.includes(videoId)) {
                      _context2.n = 3;
                      break;
                    }
                    currentViewed.push(videoId);
                    _context2.n = 2;
                    return (0,_utils_storage_js__WEBPACK_IMPORTED_MODULE_0__.setValue)('videoBrowseHistory', currentViewed);
                  case 2:
                    log("".concat(videoId, " added to viewed history."));
                    setFavicon(chrome.runtime.getURL("src/assets/jav.png"));
                  case 3:
                    return _context2.a(2);
                }
              }, _callee2);
            })), getRandomDelay(3000, 5000));
          }
        case 2:
          return _context3.a(2);
      }
    }, _callee3);
  }));
  return _handleVideoDetailPage.apply(this, arguments);
}
function setFavicon(url) {
  var link = document.querySelector(SELECTORS.FAVICON);
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  if (url.endsWith('.png')) {
    link.type = 'image/png';
  }
  link.href = url;
}
function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// --- Export Feature ---
// This part remains largely unchanged as it's a separate utility
// and doesn't depend heavily on the main settings.
// We'll just ensure it's initialized correctly.

var isExporting = false;
var exportButton, stopButton;
function initExportFeature() {
  var validUrlPatterns = [/https:\/\/javdb\.com\/users\/want_watch_videos.*/, /https:\/\/javdb\.com\/users\/watched_videos.*/, /https:\/\/javdb\.com\/users\/list_detail.*/, /https:\/\/javdb\.com\/lists.*/];
  if (validUrlPatterns.some(function (pattern) {
    return pattern.test(window.location.href);
  })) {
    createExportUI();
    checkExportState();
  }
}
function createExportUI() {
  // ... (The implementation of createExportButton from the original script)
  // For brevity, assuming the UI creation code is here.
  var maxPageInput = document.createElement('input');
  maxPageInput.type = 'number';
  maxPageInput.id = 'maxPageInput';
  maxPageInput.placeholder = '页数(空则全部)';
  maxPageInput.className = 'input is-small';
  maxPageInput.style.width = '120px';
  maxPageInput.style.marginRight = '8px';
  exportButton = document.createElement('button');
  exportButton.textContent = '导出页面数据';
  exportButton.className = 'button is-small is-primary';
  exportButton.addEventListener('click', startExport);
  stopButton = document.createElement('button');
  stopButton.textContent = '停止';
  stopButton.className = 'button is-small is-danger';
  stopButton.style.marginLeft = '8px';
  stopButton.disabled = true;
  stopButton.addEventListener('click', stopExport);
  var container = document.createElement('div');
  container.className = 'level-item';
  container.appendChild(maxPageInput);
  container.appendChild(exportButton);
  container.appendChild(stopButton);
  var target = document.querySelector(SELECTORS.EXPORT_TOOLBAR);
  if (target) {
    target.appendChild(container);
  }
}
function startExport() {
  return _startExport.apply(this, arguments);
}
function _startExport() {
  _startExport = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4() {
    var maxPageInput, totalCount, maxPages, pagesToExport, currentPage, allVideos, i, pageNum, url;
    return _regenerator().w(function (_context4) {
      while (1) switch (_context4.n) {
        case 0:
          maxPageInput = document.getElementById('maxPageInput');
          totalCount = getTotalVideoCount();
          maxPages = Math.ceil(totalCount / 20); // Assuming 20 items per page
          pagesToExport = maxPageInput.value ? parseInt(maxPageInput.value) : maxPages;
          currentPage = new URLSearchParams(window.location.search).get('page') || 1;
          isExporting = true;
          exportButton.disabled = true;
          stopButton.disabled = false;
          allVideos = [];
          i = 0;
        case 1:
          if (!(i < pagesToExport)) {
            _context4.n = 6;
            break;
          }
          if (isExporting) {
            _context4.n = 2;
            break;
          }
          return _context4.a(3, 6);
        case 2:
          pageNum = parseInt(currentPage) + i;
          if (!(pageNum > maxPages)) {
            _context4.n = 3;
            break;
          }
          return _context4.a(3, 6);
        case 3:
          exportButton.textContent = "\u5BFC\u51FA\u4E2D... ".concat(pageNum, "/").concat(maxPages);
          if (!(i > 0)) {
            _context4.n = 4;
            break;
          }
          // Navigate to next page if not the first page
          url = new URL(window.location.href);
          url.searchParams.set('page', pageNum);
          window.location.href = url.href;
          _context4.n = 4;
          return new Promise(function (resolve) {
            return window.addEventListener('load', resolve, {
              once: true
            });
          });
        case 4:
          allVideos = allVideos.concat(scrapeVideosFromPage());
          _context4.n = 5;
          return (0,_utils_utils_js__WEBPACK_IMPORTED_MODULE_1__.sleep)(1000);
        case 5:
          i++;
          _context4.n = 1;
          break;
        case 6:
          if (allVideos.length > 0) {
            downloadExportedData(allVideos);
          }
          finishExport();
        case 7:
          return _context4.a(2);
      }
    }, _callee4);
  }));
  return _startExport.apply(this, arguments);
}
function scrapeVideosFromPage() {
  return Array.from(document.querySelectorAll(SELECTORS.MOVIE_LIST_ITEM)).map(function (item) {
    var idElement = item.querySelector(SELECTORS.VIDEO_ID);
    var titleElement = item.querySelector(SELECTORS.VIDEO_TITLE);
    return {
      id: idElement ? idElement.textContent.trim() : '',
      title: titleElement ? titleElement.textContent.trim() : ''
    };
  });
}
function downloadExportedData(data) {
  var json = JSON.stringify(data, null, 2);
  var blob = new Blob([json], {
    type: 'application/json'
  });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.download = "javdb-export-".concat(new Date().toISOString().slice(0, 10), ".json");
  a.href = url;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function getTotalVideoCount() {
  var activeLink = document.querySelector('a.is-active');
  if (activeLink) {
    var match = activeLink.textContent.match(/\((\d+)\)/);
    return match ? parseInt(match[1], 10) : 0;
  }
  return 0;
}
function stopExport() {
  isExporting = false;
  finishExport();
}
function finishExport() {
  isExporting = false;
  exportButton.disabled = false;
  stopButton.disabled = true;
  exportButton.textContent = '导出页面数据';
}
function checkExportState() {
  return _checkExportState.apply(this, arguments);
} // --- Entry Point ---
function _checkExportState() {
  _checkExportState = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5() {
    return _regenerator().w(function (_context5) {
      while (1) switch (_context5.n) {
        case 0:
          return _context5.a(2);
      }
    }, _callee5);
  }));
  return _checkExportState.apply(this, arguments);
}
initialize()["catch"](function (err) {
  return console.error('[JavDB Ext] Initialization failed:', err);
});
})();

/******/ })()
;
//# sourceMappingURL=content.js.map