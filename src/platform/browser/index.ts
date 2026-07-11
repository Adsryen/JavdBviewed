/**
 * @file index.ts
 * @description 浏览器平台能力统一导出（DOM 工具、运行时消息、toast、页面上下文等）
 */
export { sendRuntimeMessage, type RuntimeMessage } from './runtimeMessages';
export {
  chromeCallbackToPromise,
  detectBackgroundRuntimeKind,
  detectBrowserEngine,
  ensureChromeNamespace,
  getExtensionApi,
  isExtensionRuntimeAvailable,
  isGeckoEngine,
  type BackgroundRuntimeKind,
  type BrowserEngine,
} from './extensionApi';
// side-effect 兼容引导由各入口显式 import compatBootstrap，避免无意全局副作用
export {
  fetchJavbusAjaxViaTab,
  javbusPageAjaxFetchScript,
  type JavbusPageAjaxFetchResult,
} from './javbusTabFetch';
export { fetchJavbusAjaxViaRuntime } from './javbusRuntimeClient';
export {
  getPageContext,
  getPageInstanceId,
  getPageMainId,
  getPageTypeFromUrl,
} from './pageContext';
export {
  debounce,
  getJavdbTheme,
  getRandomDelay,
  isDarkTheme,
  retry,
  safeAsync,
  setFavicon,
  throttle,
  waitForElement,
  type JavdbTheme,
} from './domUtils';
export { extractVideoId, extractVideoIdFromPage } from './videoId';
export { showEnhancementDone, showEnhancementLoading, hideEnhancementIndicator } from './enhancementLoadingIndicator';
export { showToast } from './toast';
