/**
 * @file extensionApi.ts
 * @description 扩展 API 门面 —— 在 Chromium / Firefox 上统一取用 chrome 命名空间
 * @module platform/browser
 *
 * 设计原则：
 * - 业务代码继续使用 chrome.*（@types/chrome + 现有 call site）
 * - 仅在入口做一次全局归一化：Firefox 若只暴露 browser，则 alias 到 chrome
 * - 禁止在 feature 内散落 if (firefox)；平台差异集中在此
 * - 不引入 webextension-polyfill，避免把 callback 风格 API 全盘 Promise 化导致行为分叉
 */

/** 浏览器引擎粗分类（用于集中式兼容，不暴露给业务 feature） */
export type BrowserEngine = 'chromium' | 'gecko' | 'unknown';

/** 后台脚本运行形态 */
export type BackgroundRuntimeKind = 'service_worker' | 'event_page' | 'unknown';

type ExtensionGlobal = typeof globalThis & {
  chrome?: typeof chrome;
  browser?: typeof chrome;
};

function getExtensionGlobal(): ExtensionGlobal {
  return globalThis as ExtensionGlobal;
}

/**
 * 取当前可用的扩展 API 对象（优先 chrome，回退 browser）。
 * 不抛错；调用方在关键路径应再检查 runtime 是否可用。
 */
export function getExtensionApi(): typeof chrome | undefined {
  const g = getExtensionGlobal();
  if (g.chrome?.runtime) return g.chrome;
  if (g.browser?.runtime) return g.browser;
  if (g.chrome) return g.chrome;
  if (g.browser) return g.browser;
  return undefined;
}

/**
 * 确保 globalThis.chrome 可用：
 * - 已有 chrome.runtime → 原样返回
 * - 仅有 browser → 将 browser 挂到 chrome（Firefox 常见）
 * - 都没有 → undefined
 *
 * 幂等，可在任意入口重复调用。
 */
export function ensureChromeNamespace(): typeof chrome | undefined {
  const g = getExtensionGlobal();
  const existing = g.chrome;
  if (existing?.runtime) {
    return existing;
  }

  const fromBrowser = g.browser;
  if (fromBrowser?.runtime) {
    try {
      Object.defineProperty(g, 'chrome', {
        value: fromBrowser,
        configurable: true,
        writable: true,
      });
    } catch {
      // 部分环境 chrome 为只读 getter；尽量直接赋值
      try {
        (g as { chrome: typeof chrome }).chrome = fromBrowser;
      } catch {
        // 无法挂载时仍返回 browser，调用方可用 getExtensionApi()
      }
    }
    return g.chrome ?? fromBrowser;
  }

  return existing ?? fromBrowser;
}

/** 扩展运行时是否可用（sendMessage / id 等） */
export function isExtensionRuntimeAvailable(): boolean {
  const api = getExtensionApi();
  return Boolean(api?.runtime?.id || api?.runtime?.sendMessage);
}

/**
 * 检测引擎：优先 userAgent，再看 gecko 特征。
 * 测试环境无 UA 时返回 unknown。
 */
export function detectBrowserEngine(): BrowserEngine {
  try {
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    const ua = String(nav?.userAgent || '').toLowerCase();

    // Firefox 稳定特征；避免把 Chromium 的 "like Gecko" 判成 gecko
    if (ua.includes('firefox/') || ua.includes('fxios/')) {
      return 'gecko';
    }
    if (ua.includes('edg/') || ua.includes('chrome/') || ua.includes('chromium')) {
      return 'chromium';
    }

    // 无 UA 时：仅 browser.runtime 而无 chrome.runtime → 倾向 gecko
    const g = getExtensionGlobal();
    if (g.browser?.runtime && !g.chrome?.runtime) {
      return 'gecko';
    }
  } catch {
    // ignore
  }
  return 'unknown';
}

export function isGeckoEngine(): boolean {
  return detectBrowserEngine() === 'gecko';
}

/**
 * 后台脚本形态：Service Worker（Chromium MV3）vs event page（Firefox scripts）。
 * 仅供 platform / background 生命周期使用。
 */
export function detectBackgroundRuntimeKind(): BackgroundRuntimeKind {
  try {
    const g = globalThis as typeof globalThis & {
      ServiceWorkerGlobalScope?: unknown;
      registration?: unknown;
      clients?: unknown;
    };

    // SW 常见：registration + clients（Chromium MV3 service_worker）
    if (g.registration && g.clients) {
      return 'service_worker';
    }

    // 具名 ServiceWorkerGlobalScope 且 self 为其实例
    if (typeof g.ServiceWorkerGlobalScope === 'function') {
      try {
        if (typeof self !== 'undefined' && self instanceof (g.ServiceWorkerGlobalScope as new () => object)) {
          return 'service_worker';
        }
      } catch {
        // instanceof 在部分 mock 下会失败
      }
    }

    // Firefox MV3 background.scripts 为 event page，通常无 SW registration。
    // 注意：扩展页 / content script 也会落到此分支；调用方应仅在 background 使用。
    const api = getExtensionApi();
    if (api?.runtime?.id || api?.runtime?.sendMessage) {
      return 'event_page';
    }
  } catch {
    // ignore
  }
  return 'unknown';
}

/**
 * Promise 化 callback 风格 chrome API 调用（兼容 lastError）。
 * 当 API 已直接返回 Promise 且未传 callback 时，原样 await 该 Promise。
 */
export function chromeCallbackToPromise<T>(
  invoke: (callback: (result: T) => void) => unknown,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;

    const rejectFromLastError = (): boolean => {
      const lastError = getExtensionApi()?.runtime?.lastError;
      if (lastError?.message) {
        reject(new Error(lastError.message));
        return true;
      }
      return false;
    };

    const finish = (result: T) => {
      if (settled) return;
      settled = true;
      if (rejectFromLastError()) return;
      resolve(result);
    };

    try {
      const maybePromise = invoke(finish);
      if (maybePromise != null && typeof (maybePromise as Promise<T>).then === 'function') {
        (maybePromise as Promise<T>).then(
          (value) => {
            if (settled) return;
            settled = true;
            // Firefox Promise-style APIs may still surface chrome.runtime.lastError
            if (rejectFromLastError()) return;
            resolve(value);
          },
          (error) => {
            if (settled) return;
            settled = true;
            reject(error instanceof Error ? error : new Error(String(error)));
          },
        );
      }
    } catch (error) {
      if (!settled) {
        settled = true;
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    }
  });
}
