// ==UserScript==
// @name            FC2PPVDB Enhanced
// @name:en         FC2PPVDB Enhanced
// @namespace       https://greasyfork.org/zh-CN/scripts/552583-fc2ppvdb-enhanced
// @version         2.1.2
// @author          Icarusle
// @description     FC2/JAV 资源站增强脚本：磁力链接自动聚合、高清封面补全、图集预览、历史记录同步与过滤。支持 FC2PPVDB, Supjav, JavDB, MissAV, JavFC2 等站点。
// @description:en  Enhancement script for FC2/JAV sites: magnet aggregation, HD cover restoration, gallery preview, history sync and filtering. Supports FC2PPVDB, Supjav, JavDB, MissAV, JavFC2, etc.
// @license         MIT
// @icon            https://fc2ppvdb.com/favicon.ico
// @match           https://fc2ppvdb.com/*
// @match           https://fd2ppv.cc/*
// @match           https://supjav.com/*
// @match           https://missav.ws/*
// @match           https://missav.ai/*
// @match           https://javdb.com/*
// @match           https://fc2db.net/*
// @match           https://javfc2.xyz/*
// @require         https://unpkg.com/dexie@4.4.2/dist/dexie.js
// @connect         sukebei.nyaa.si
// @connect         paipancon.com
// @connect         fourhoi.com
// @connect         fd2ppv.cc
// @connect         fc2ppvdb.com
// @connect         supabase.co
// @connect         0cili.eu
// @connect         www.javbus.com
// @connect         www.javlibrary.com
// @connect         www.dmm.co.jp
// @connect         adult.contents.fc2.com
// @connect         javfc2.xyz
// @connect         img.javfc2.xyz
// @grant           GM_addStyle
// @grant           GM_addValueChangeListener
// @grant           GM_deleteValue
// @grant           GM_getValue
// @grant           GM_info
// @grant           GM_notification
// @grant           GM_openInTab
// @grant           GM_registerMenuCommand
// @grant           GM_removeValueChangeListener
// @grant           GM_setClipboard
// @grant           GM_setValue
// @grant           GM_unregisterMenuCommand
// @grant           GM_xmlhttpRequest
// @grant           unsafeWindow
// @run-at          document-end
// @noframes
// @downloadURL https://update.sleazyfork.org/scripts/552583/FC2PPVDB%20Enhanced.user.js
// @updateURL https://update.sleazyfork.org/scripts/552583/FC2PPVDB%20Enhanced.meta.js
// ==/UserScript==

(function (Dexie) {
  'use strict';

  const SCRIPT_INFO = {
    NAME: "FC2PPVDB Enhanced",
    VERSION: typeof GM_info !== "undefined" ? GM_info.script.version : "2.1.2",
    NAMESPACE: "https://greasyfork.org/zh-CN/scripts/552583-fc2ppvdb-enhanced",
    GREASYFORK_URL: "https://greasyfork.org/scripts/552583"
  };

  const STORAGE_KEYS = {
    SETTINGS: "settings_v1",
    CACHE: "magnet_cache_v1",
    HISTORY: "history_v1",
    SUPABASE_URL: "supabase_url",
    SUPABASE_KEY: "supabase_key",
    SUPABASE_EMAIL: "supabase_email",
    SUPABASE_PASSWORD: "supabase_password",
    SUPABASE_JWT: "supabase_jwt",
    SUPABASE_REFRESH: "supabase_refresh_token",
    SYNC_USER_ID: "sync_user_id",
    CURRENT_USER_EMAIL: "current_user_email",
    LAST_SYNC_TS: "last_sync_ts",
    LAST_AUTO_SYNC_TS: "last_auto_sync_ts",
    LAST_SETTINGS_TAB: "last_settings_tab",
    WEBDAV_URL: "webdav_url",
    WEBDAV_USER: "webdav_user",
    WEBDAV_PASS: "webdav_pass",
    WEBDAV_PATH: "webdav_path",
    WEBDAV_LAST_ETAG: "webdav_last_etag",
    WEBDAV_SYNC_LOCK: "webdav_sync_lock",
    SYNC_MODE: "sync_mode",
    LANGUAGE: "language",
    USER_GRID_COLUMNS: "user_grid_columns_preference",
    FAB_POSITION: "fab_pos_v2",
    DEBUG_MODE: "fc2_debug_mode",
    CARD_DENSITY: "card_density",
    LAST_SYNC_RESULT: "last_sync_result",
    SETTINGS_SEARCH_QUERY: "settings_search_query",
    SETTINGS_COLLAPSED_GROUPS: "settings_collapsed_groups",
    SETTINGS_PRESET: "settings_preset",
    ACCENT_COLOR: "accent_color"
  };
  const DATABASE = {
    NAME: "fc2_enhanced_db"
  };
  const CACHE = {
    MEMORY_MAX_SIZE: 1e3,
    MEMORY_EXPIRATION_MS: 5 * 60 * 1e3,
    EXPIRATION_MS: 14 * 24 * 60 * 60 * 1e3,
    PREVIEW_MAX_SIZE: 5,
    NEGATIVE_MAGNET_EXPIRATION_MS: 12 * 60 * 60 * 1e3
  };

  const UI_CONSTANTS = {
    Z_INDEX_MAX: 2147483647,
    Z_INDEX_TOOLTIP: 1e5,
    DEFAULT_TIMESTAMP: "1970-01-01T00:00:00.000Z",
    DEFAULT_SYNC_FILENAME: "fc2_enhanced_sync.json",
    PLACEHOLDER_IMAGE: "https://placehold.co/400x300?text=No+Image",
    SWIPE_DISMISS_THRESHOLD: 100
};
  const DOM_IDS = {
    UI_HOST: "fc2-modern-ui-host",
    SETTINGS_HOST: "fc2-enh-settings-host",
    SETTINGS_CONTAINER: "fc2-enh-settings-container",
    TAB_CONTENT: "tab-content-container",
    LOG_LIST: "debug-log-list"
  };
  const CSS_CLASSES = {
    cardRebuilt: "card-rebuilt",
    processedCard: "processed-card",
    noMagnet: "no-magnet",
    hideNoMagnet: "hide-no-magnet",
    videoPreviewContainer: "video-preview-container",
    staticPreview: "static-preview",
    previewElement: "preview-element",
    hidden: "hidden",
    infoArea: "info-area",
    customTitle: "custom-card-title",
    fc2IdBadge: "fc2-id-badge",
    cardMeta: "card-meta",
    cardMetaItem: "card-meta-item",
    cardActionRow: "card-action-row",
    badgeCopied: "copied",
    preservedIconsContainer: "preserved-icons-container",
    resourceLinksContainer: "resource-links-container",
    resourceBtn: "resource-btn",
    btnLoading: "is-loading",
    btnMagnet: "magnet",
    tooltip: "tooltip",
    buttonText: "button-text",
    extraPreviewContainer: "preview-container",
    extraPreviewTitle: "preview-title",
    extraPreviewGrid: "preview-grid",
    isCensored: "is-censored",
    hideCensored: "hide-censored",
    isViewed: "is-viewed",
    hideViewed: "hide-viewed",
    isDownloaded: "is-downloaded",
    btnPlayFullscreen: "btn-play-fullscreen"
  };

  const NETWORK = {
    CHUNK_SIZE: 16,
    MAX_RETRIES: 3,
    TIMEOUT_MS: 1e4,
    HEALTH_CHECK_TIMEOUT: 5e3
  };
  const TIMING = {
DEBOUNCE_MS: 300,
    THROTTLE_MS: 200,
    RETRY_DELAY_MS: 1e3,
    MAGNET_BASE_DELAY_MS: 800,
UI_TRANSITION_FAST: 150,
UI_TRANSITION_NORMAL: 300,
UI_TRANSITION_SLOW: 500,
UI_ANIMATION_BADGE: 600,

TOAST_DEFAULT_DURATION: 3e3,
    RELOAD_DELAY_FAST: 800,
    RELOAD_DELAY_NORMAL: 1500,
SCRIPT_INJECTION_DELAY: 400,
SYNC_DEBOUNCE_MS: 2e3,
    SYNC_INIT_DELAY: 5e3,
    MAGNET_RANDOM_DELAY_MS: 3e3,
    CLOUDFLARE_BACKOFF_MS: 6e4,
    FD2_BACKOFF_MS: 3e5,
    RATE_LIMIT_BACKOFF_MS: 6e4,
    OCILI_DELAY_MS: 2e3,
    OCILI_RANDOM_DELAY_MS: 2e3,
    ACTRESS_BASE_DELAY_MS: 1500,
    ACTRESS_RANDOM_DELAY_MS: 1500,
    POLITE_DELAY_MS: 200,
    MAGNET_JITTER_MS: 3e3,
    POLL_INTERVAL_MS: 100,
    POLL_TIMEOUT_MS: 3e4,
    DOM_READY_TIMEOUT: 1e4,
    PREVIEW_ERROR_DELAY: 3e3,
    LINK_PRELOAD_TIMEOUT: 6e4,
    MAX_BACKOFF_MS: 6e5,
    PREVIEW_JITTER_MS: 500
  };
  const CLOUDFLARE_INDICATORS = ["Just a moment...", "Checking your browser", "Attention Required!", "Cloudflare"];
  const VALIDATION = {
    ACTRESS_NAME_MAX_LENGTH: 20,
    ACTRESS_NAME_MIN_LENGTH: 2,
    JAV_ID_REGEX: /^(?=.*[A-Z])[A-Z0-9-]{1,10}-\d{2,8}$/i};

  const EXTERNAL_URLS = {
    SUPJAV: "https://supjav.com/zh/?s={id}",
    MISSAV_FC2: "https://missav.ws/cn/fc2-ppv-{id}",
    MISSAV: "https://missav.ws/cn/{id}",
    JAVDB: "https://javdb.com/search?q={id}&f=all",
    JAVBUS: "https://www.javbus.com/{id}",
    JAVLIBRARY: "https://www.javlibrary.com/cn/vl_searchbyid.php?keyword={id}",
    DMM: "https://www.dmm.co.jp/search/=/searchstr={id}",
    FC2: "https://adult.contents.fc2.com/article/{id}/?tag=TXpZM05EY3lORFk9",
    FC2PPVDB: "https://fc2ppvdb.com/articles/{id}",
    FD2PPV: "https://fd2ppv.cc/articles/{id}",
    FC2DB: "https://fc2db.net/work/{id}/",
    SUKEBEI: "https://sukebei.nyaa.si/?f=0&c=0_0&q={id}",
    GOOGLE_LENS: "https://lens.google.com/uploadbyurl?url={url}",
    FOURHOI_COVER: "https://fourhoi.com/fc2-ppv-{id}/cover.jpg",
    FOURHOI_BASE: "https://fourhoi.com",
    PAIPANCON_COVER: "https://paipancon.com/fc2daily/data/FC2-PPV-{id}/cover.jpg"
  };
  const SCRAPER_URLS = {
    SUKEBEI_SEARCH: "https://sukebei.nyaa.si/?f=0&c=0_0&q={query}&s=seeders&o=desc",
    OCILI_SEARCH: "https://0cili.eu/search?q={query}",
    PAIPANCON_DETAIL: "https://paipancon.com/fc2daily/detail/FC2-PPV-{id}",
    PAIPANCON_BASE: "https://paipancon.com"
  };
  const MAGNET_CONFIG = {
    MAX_CONCURRENCY: 16,
    MAX_RETRIES: 2,
    RETRY_DELAY: 1e3,
    PREDICTIVE_LIMIT: 16,
    DEFAULT_TYPE: "fc2",
    SEARCH_TIMEOUT_MS: 6e4
  };
  const PREVIEW_BLACKLIST = ["moechat_ads.jpg", "mc.yandex.ru", "linglan_ad1.jpg"];
  const JAV_PREFIX_BLACKLIST = ["FC2", "PPV", "PAGE", "LIST", "NEW", "BEST", "FILE", "VIEW"];
  const ACTRESS_BLACKLIST_STRINGS = [
    "首页",
    "分类",
    "我的",
    "搜索",
    "排行榜",
    "导航",
    "菜单",
    "更多",
    "全部",
    "女优",
    "无码",
    "有码",
    "素人",
    "流出",
    "破解",
    "解密",
    "合集",
    "个人拍摄",
    "個人撮影"
  ];
  const ACTRESS_BLACKLIST = [/Top\s*\d+/i, /^[\d\s]+$/];
  const PATTERNS = {
    FC2_PPV_PREFIX: "FC2-PPV-",
    PAIPANCON_COVER: "cover.jpg",
    PAIPANCON_MAIN: "main.jpg",
    CENSORED_INDICATOR: "icon-mosaic_free color_free0",
    FD2PPV_SELLER_MARKER: "賣家"
  };

  const SYNC_STATUS = {
    IDLE: "idle",
    SYNCING: "syncing",
    SUCCESS: "success",
    ERROR: "error",
    CONFLICT: "conflict"
  };
  const SUPABASE_ENDPOINTS = {
    TOKEN: "/auth/v1/token",
    SIGNUP: "/auth/v1/signup",
    USER_HISTORY: "/rest/v1/user_history"
  };
  const SYSTEM_KEYS = {
    MESSAGING_CHANNEL: "fc2-enhanced-sync"};

  var LogLevel = ((LogLevel2) => {
    LogLevel2[LogLevel2["SILENT"] = 0] = "SILENT";
    LogLevel2[LogLevel2["ERROR"] = 1] = "ERROR";
    LogLevel2[LogLevel2["WARN"] = 2] = "WARN";
    LogLevel2[LogLevel2["INFO"] = 3] = "INFO";
    LogLevel2[LogLevel2["DEBUG"] = 4] = "DEBUG";
    LogLevel2[LogLevel2["TRACE"] = 5] = "TRACE";
    LogLevel2[LogLevel2["NONE"] = 0] = "NONE";
    LogLevel2[LogLevel2["SUCCESS"] = 3] = "SUCCESS";
    return LogLevel2;
  })(LogLevel || {});

  const MAX_HISTORY$1 = 500;
  const PREFIX = "[FC2-ENH]";
  const DEDUP_WINDOW_MS = 2e3;
  const THROTTLE_WINDOW_MS = 5e3;
  const THROTTLE_BURST = 3;
  const LEVEL_NAMES = {
    [LogLevel.SILENT]: "SILENT",
    [LogLevel.ERROR]: "ERROR",
    [LogLevel.WARN]: "WARN",
    [LogLevel.INFO]: "INFO",
    [LogLevel.DEBUG]: "DEBUG",
    [LogLevel.TRACE]: "TRACE"
  };
  const formatTime = () => {
    const date = new Date();
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    const ms = String(date.getMilliseconds()).padStart(3, "0");
    return `${hh}:${mm}:${ss}.${ms}`;
  };
  const makeKey = (level, module, message) => `${level}|${module}|${message}`;
  const shouldOutputLogLevel = (level, currentLevel) => level <= currentLevel;
  const buildLogEntry = (level, module, message, data, traceId) => ({
    level,
    levelName: LEVEL_NAMES[level] ?? "UNKNOWN",
    module,
    message,
    timestamp: formatTime(),
    count: 1,
    ...traceId ? { traceId } : {},
    ...data !== void 0 ? { data } : {}
  });
  const appendHistoryEntry = (history, entry) => {
    history.push(entry);
    if (history.length > MAX_HISTORY$1) {
      history.splice(0, history.length - MAX_HISTORY$1);
    }
  };
  const formatLogTag = (entry) => {
    const traceTag = entry.traceId ? ` [${entry.traceId}]` : "";
    return `${PREFIX}${traceTag} [${entry.levelName}] [${entry.module}]`;
  };
  const outputLogEntry = (entry, currentLevel) => {
    if (!shouldOutputLogLevel(entry.level, currentLevel)) {
      return;
    }
    const tag = formatLogTag(entry);
    const args = [tag, entry.message];
    if (entry.data !== void 0) {
      args.push(entry.data);
    }
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(...args);
        break;
      case LogLevel.WARN:
        console.warn(...args);
        break;
      case LogLevel.DEBUG:
      case LogLevel.TRACE:
        console.debug(...args);
        break;
      default:
        console.log(...args);
        break;
    }
  };
  const createThrottleNoticeEntry = (suppressed) => ({
    level: LogLevel.DEBUG,
    levelName: "DEBUG",
    module: "Throttle",
    message: `Suppressed ${suppressed} repeated messages in ${THROTTLE_WINDOW_MS}ms`,
    timestamp: formatTime(),
    count: 1
  });

  const SENSITIVE_KEY_RE = /(authorization|token|secret|password|passwd|api[-_]?key|jwt|cookie|refresh)/i;
  const EMAIL_RE = /([A-Z0-9._%+-]{2})[A-Z0-9._%+-]*@([A-Z0-9.-]+\.[A-Z]{2,})/gi;
  const QUERY_SECRET_RE = /([?&](?:token|key|apikey|api_key|auth|signature|password)=)([^&]+)/gi;
  const maskLogString = (value) => value.replace(EMAIL_RE, (_match, user, domain) => `${user}***@${domain}`).replace(QUERY_SECRET_RE, (_match, prefix) => `${prefix}***`).replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer ***");
  const sanitizeLogData = (value) => {
    if (typeof value === "string") {
      return maskLogString(value);
    }
    if (Array.isArray(value)) {
      return value.map((item) => sanitizeLogData(item));
    }
    if (!value || typeof value !== "object") {
      return value;
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        SENSITIVE_KEY_RE.test(key) ? "***" : sanitizeLogData(entryValue)
      ])
    );
  };
  const exportSanitizedLogHistory = (history, options = {}) => {
    const filtered = history.filter((entry) => !options.traceId || entry.traceId === options.traceId);
    if (!options.sanitized) {
      return filtered.map((entry) => ({ ...entry }));
    }
    return filtered.map((entry) => ({
      ...entry,
      message: maskLogString(entry.message),
      data: entry.data !== void 0 ? sanitizeLogData(entry.data) : void 0
    }));
  };

  class LoggerImpl {
    _enabled = false;
    _history = [];
    _level = LogLevel.WARN;
    _timers = new Map();
    _traceCounter = 0;
    _groupDepth = 0;
    _scopeCache = new Map();
    _dedup = new Map();
    _dedupFlushTimer = null;
    _throttle = new Map();
    get enabled() {
      return this._enabled;
    }
    get history() {
      this._flushDedup();
      return [...this._history];
    }
    get traceId() {
      return `t-${++this._traceCounter}`;
    }
    get level() {
      return this._level;
    }
    init() {
      try {
        const saved = typeof GM_getValue !== "undefined" ? GM_getValue("fc2_debug_mode", false) : false;
        if (saved) {
          this.enable(false);
        }
      } catch {
      }
    }
    enable(persist = true) {
      this._enabled = true;
      this._level = LogLevel.TRACE;
      this._persistDebugMode(persist, true);
    }
    disable(persist = true) {
      this._enabled = false;
      this._level = LogLevel.WARN;
      this._persistDebugMode(persist, false);
    }
    setLevel(level) {
      this._level = level;
    }
    clear() {
      this._history.length = 0;
      this._dedup.clear();
      this._throttle.clear();
    }
    scope(module) {
      let scoped = this._scopeCache.get(module);
      if (!scoped) {
        scoped = {
          error: (message, data, traceId) => this.error(module, message, data, traceId),
          warn: (message, data, traceId) => this.warn(module, message, data, traceId),
          info: (message, data, traceId) => this.info(module, message, data, traceId),
          debug: (message, data, traceId) => this.debug(module, message, data, traceId),
          trace: (message, data, traceId) => this.trace(module, message, data, traceId),
          success: (message, data, traceId) => this.info(module, message, data, traceId)
        };
        this._scopeCache.set(module, scoped);
      }
      return scoped;
    }
    time(label) {
      this._timers.set(label, performance.now());
    }
    timeEnd(label) {
      const start = this._timers.get(label);
      if (start === void 0) {
        return void 0;
      }
      this._timers.delete(label);
      const elapsed = (performance.now() - start).toFixed(2);
      const message = `${label}: ${elapsed}ms`;
      this._push(LogLevel.DEBUG, "Timer", message);
      return message;
    }
    log(module, message, data, traceId) {
      this._push(LogLevel.INFO, module, message, data, traceId);
    }
    info(module, message, data, traceId) {
      this._push(LogLevel.INFO, module, message, data, traceId);
    }
    warn(module, message, data, traceId) {
      this._push(LogLevel.WARN, module, message, data, traceId);
    }
    error(module, message, data, traceId) {
      this._push(LogLevel.ERROR, module, message, data, traceId);
    }
    success(module, message, data, traceId) {
      this._push(LogLevel.INFO, module, message, data, traceId);
    }
    debug(module, message, data, traceId) {
      this._push(LogLevel.DEBUG, module, message, data, traceId);
    }
    trace(module, message, data, traceId) {
      this._push(LogLevel.TRACE, module, message, data, traceId);
    }
    group(module, label, traceId) {
      this._groupDepth += 1;
      this._push(LogLevel.INFO, module, `[group:start] ${label}`, void 0, traceId);
      if (this._shouldOutput(LogLevel.INFO)) {
        console.group(`${PREFIX} [${module}] ${label}`);
      }
    }
    groupEnd() {
      if (this._groupDepth <= 0) {
        return;
      }
      this._groupDepth -= 1;
      if (this._enabled) {
        console.groupEnd();
      }
    }
    _persistDebugMode(persist, enabled) {
      if (!persist) {
        return;
      }
      try {
        if (typeof GM_setValue !== "undefined") {
          GM_setValue("fc2_debug_mode", enabled);
        }
      } catch {
      }
    }
    _shouldOutput(level) {
      return shouldOutputLogLevel(level, this._level);
    }
    _push(level, module, message, data, traceId) {
      if (level > this._level && level !== LogLevel.ERROR) {
        return;
      }
      const key = makeKey(level, module, message);
      if (level >= LogLevel.DEBUG && this._checkThrottle(key)) {
        return;
      }
      const existing = this._dedup.get(key);
      const now = Date.now();
      if (existing && now - existing.firstTs < DEDUP_WINDOW_MS) {
        existing.count += 1;
        existing.lastEntry.count = existing.count;
        if (data !== void 0) {
          existing.lastEntry.data = data;
        }
        this._scheduleDedupFlush();
        return;
      }
      this._flushDedup();
      const entry = buildLogEntry(level, module, message, data, traceId);
      this._dedup.set(key, { count: 1, firstTs: now, flushed: false, lastEntry: entry });
      this._record(entry);
      this._output(entry);
    }
    _scheduleDedupFlush() {
      if (this._dedupFlushTimer) {
        return;
      }
      this._dedupFlushTimer = setTimeout(() => {
        this._dedupFlushTimer = null;
        this._flushDedup();
      }, DEDUP_WINDOW_MS);
    }
    _flushDedup() {
      if (this._dedupFlushTimer) {
        clearTimeout(this._dedupFlushTimer);
        this._dedupFlushTimer = null;
      }
      for (const state of this._dedup.values()) {
        if (state.count > 1 && !state.flushed) {
          state.flushed = true;
          state.lastEntry.count = state.count;
          if (this._shouldOutput(state.lastEntry.level)) {
            console.debug(`${formatLogTag(state.lastEntry)} (x${state.count}) ${state.lastEntry.message}`);
          }
        }
      }
      const now = Date.now();
      for (const [key, state] of this._dedup) {
        if (now - state.firstTs > DEDUP_WINDOW_MS) {
          this._dedup.delete(key);
        }
      }
    }
    _checkThrottle(key) {
      const now = Date.now();
      let state = this._throttle.get(key);
      if (!state || now - state.windowStart > THROTTLE_WINDOW_MS) {
        state = { count: 1, suppressed: 0, windowStart: now };
        this._throttle.set(key, state);
        return false;
      }
      state.count += 1;
      if (state.count <= THROTTLE_BURST) {
        return false;
      }
      state.suppressed += 1;
      if (state.suppressed === 1) {
        this._scheduleThrottleSummary(key, state, now);
      }
      return true;
    }
    _scheduleThrottleSummary(key, state, now) {
      setTimeout(
        () => {
          if (state.suppressed > 0) {
            const entry = createThrottleNoticeEntry(state.suppressed);
            this._record(entry);
            if (this._shouldOutput(LogLevel.DEBUG)) {
              console.debug(formatLogTag(entry), entry.message);
            }
          }
          this._throttle.delete(key);
        },
        THROTTLE_WINDOW_MS - (now - state.windowStart)
      );
    }
    _record(entry) {
      appendHistoryEntry(this._history, entry);
    }
    _output(entry) {
      outputLogEntry(entry, this._level);
    }
  }
  const Logger = new LoggerImpl();
  const exportLogHistory = (options = {}) => exportSanitizedLogHistory(Logger.history, options);

  const log$H = Logger.scope("Container");
  class Container {
    services = new Map();
    initialized = false;
register(name, service) {
      if (this.services.has(name)) {
        log$H.warn(`Service ${name} already registered, overwriting`);
      }
      this.services.set(name, service);
      return service;
    }
get(name) {
      const service = this.services.get(name);
      if (!service) {
        throw new Error(`[Container] Service not found: ${name}`);
      }
      return service;
    }
async bootstrap() {
      if (this.initialized) return;
      Logger.group("Container", "System bootstrap");
      try {
        log$H.debug("Stage 1: Initializing services");
        for (const [name, service] of this.services) {
          if (service.onInit) {
            try {
              await service.onInit();
              log$H.debug(`Initialized: ${name}`);
            } catch (error) {
              log$H.error(`Failed to initialize service: ${name}`, error);
              throw error;
            }
          }
        }
        log$H.debug("Stage 2: Orchestrating bootstrap");
        for (const [name, service] of this.services) {
          if (service.onBootstrap) {
            try {
              await service.onBootstrap();
              log$H.debug(`Bootstrapped: ${name}`);
            } catch (error) {
              log$H.error(`Failed to bootstrap service: ${name}`, error);
              throw error;
            }
          }
        }
        this.initialized = true;
        log$H.info("System bootstrap complete");
      } catch (error) {
        log$H.error("Bootstrap failed", error);
        throw error;
      } finally {
        Logger.groupEnd();
      }
    }
async shutdown() {
      log$H.info("Shutting down services");
      for (const service of this.services.values()) {
        if (service.onCleanup) await service.onCleanup();
      }
      this.services.clear();
      this.initialized = false;
    }
  }
  const AppContainer = new Container();

  const log$G = Logger.scope("Events");
  var AppEvents = ((AppEvents2) => {
    AppEvents2["BOOTSTRAP"] = "app:bootstrap";
    AppEvents2["SERVICES_READY"] = "app:services-ready";
    AppEvents2["UI_READY"] = "app:ui-ready";
    AppEvents2["STATE_CHANGED"] = "app:state-changed";
    AppEvents2["THEME_CHANGED"] = "ui:theme-changed";
    AppEvents2["LANGUAGE_CHANGED"] = "ui:language-changed";
    AppEvents2["GRID_CHANGED"] = "ui:grid-changed";
    AppEvents2["SYNC_STATUS_CHANGED"] = "sync:status-changed";
    AppEvents2["HISTORY_LOADED"] = "history:loaded";
    AppEvents2["HISTORY_ADDED"] = "history:added";
    AppEvents2["HISTORY_REMOVED"] = "history:removed";
    AppEvents2["HISTORY_CLEARED"] = "history:cleared";
    AppEvents2["SITE_RESET"] = "site:reset";
    AppEvents2["SITE_READY"] = "site:ready";
    AppEvents2["MAGNET_FOUND"] = "magnet:found";
    AppEvents2["MAGNET_FAILED"] = "magnet:failed";
    AppEvents2["CARD_READY"] = "card:ready";
    AppEvents2["VIEW_STATE_CHANGED"] = "view:state-changed";
    AppEvents2["COLLECTION_HEALTH_PROGRESS"] = "collection:health-progress";
    AppEvents2["COLLECTION_UPDATED"] = "collection:updated";
    AppEvents2["COLLECTION_STATS_CHANGED"] = "collection:stats-changed";
    AppEvents2["COLLECTION_EXPORT"] = "collection:export";
    AppEvents2["COLLECTION_IMPORT"] = "collection:import";
    AppEvents2["SHOW_TOAST"] = "ui:show-toast";
    AppEvents2["OPEN_SETTINGS"] = "ui:open-settings";
    AppEvents2["PANEL_OPENED"] = "ui:panel-opened";
    AppEvents2["PANEL_CLOSED"] = "ui:panel-closed";
    AppEvents2["HISTORY_CHANGED"] = "history:changed";
    AppEvents2["FILTER_COUNTS_CHANGED"] = "ui:filter-counts-changed";
    AppEvents2["CONFIG_CHANGED"] = "ui:config-changed";
    AppEvents2["SELECTION_CHANGED"] = "selection:changed";
    AppEvents2["CARD_DISCOVERED"] = "card:discovered";
    AppEvents2["VIEW_REFRESH_REQUESTED"] = "view:refresh-requested";
    AppEvents2["DETAIL_ENHANCEMENT_REQUESTED"] = "site:detail-enhancement-requested";
    return AppEvents2;
  })(AppEvents || {});
  class CoreEventsImpl {
    handlers = new Map();
on(event, handler) {
      if (!this.handlers.has(event)) {
        this.handlers.set(event, new Set());
      }
      this.handlers.get(event).add(handler);
      return () => this.off(event, handler);
    }
off(event, handler) {
      const handlersSet = this.handlers.get(event);
      if (handlersSet) {
        handlersSet.delete(handler);
      }
    }
emit(event, data) {
      log$G.trace(`Emit: ${event}`, data);
      const handlersSet = this.handlers.get(event);
      if (handlersSet) {
        handlersSet.forEach((handler) => {
          try {
            handler(data);
          } catch (e) {
            log$G.error(`Handler error for ${event}`, e);
          }
        });
      }
    }
  }
  const CoreEvents = new CoreEventsImpl();

  const log$F = Logger.scope("Messaging");
  var MessageType = ((MessageType2) => {
    MessageType2["SETTING_UPDATE"] = "SETTING_UPDATE";
    MessageType2["HISTORY_UPDATE"] = "HISTORY_UPDATE";
    MessageType2["UI_REFRESH"] = "UI_REFRESH";
    return MessageType2;
  })(MessageType || {});
  class MessagingServiceImplementation {
    CHANNEL_NAME = SYSTEM_KEYS.MESSAGING_CHANNEL;
    tabId = Math.random().toString(36).substring(2, 11);
    channel = null;
    listeners = new Set();
    createChannel() {
      return new BroadcastChannel(this.CHANNEL_NAME);
    }
    onInit() {
      this.onCleanup();
      this.channel = this.createChannel();
      this.channel.onmessage = (event) => {
        const msg = event.data;
        if (msg.sourceTabId === this.tabId) return;
        log$F.debug(`Received ${msg.type} from other tab`);
        this.listeners.forEach((l) => l(msg));
      };
    }
    broadcast(type, payload) {
      if (!this.channel) {
        this.channel = this.createChannel();
      }
      const msg = {
        type,
        payload,
        sourceTabId: this.tabId
      };
      this.channel.postMessage(msg);
      log$F.debug(`Broadcasted ${type}`);
    }
    onMessage(handler) {
      this.listeners.add(handler);
      return () => this.listeners.delete(handler);
    }
    destroy() {
      this.listeners.clear();
      this.channel?.close();
      this.channel = null;
    }
    onCleanup() {
      this.destroy();
    }
  }
  const MessagingService = AppContainer.register("messaging-service", new MessagingServiceImplementation());

  const Config = {
    EXTERNAL_URLS,
    SCRAPER_URLS,
    STORAGE_KEYS,
    TIMEOUTS: { API: 2e4 },
    CLASSES: CSS_CLASSES,
    CACHE_EXPIRATION_DAYS: 14,
    COPIED_BADGE_DURATION: 1500
  };

  const DEFAULT_LOCALE = "en-US";
  const LEGACY_LOCALE_MAP = {
    zh: "zh-CN",
    en: "en-US",
    ja: "ja-JP"
  };
  const normalizeLocalePreference = (preference) => {
    if (!preference || preference === "auto") {
      return "auto";
    }
    if (Object.prototype.hasOwnProperty.call(LEGACY_LOCALE_MAP, preference)) {
      const legacyLocale = LEGACY_LOCALE_MAP[preference];
      if (legacyLocale) {
        return legacyLocale;
      }
    }
    const normalized = preference.toLowerCase();
    if (normalized.startsWith("zh")) return "zh-CN";
    if (normalized.startsWith("en")) return "en-US";
    if (normalized.startsWith("ja")) return "ja-JP";
    return DEFAULT_LOCALE;
  };
  const resolveBrowserLocale = (browserLocale) => {
    const normalized = (browserLocale || DEFAULT_LOCALE).toLowerCase();
    if (normalized.startsWith("zh")) return "zh-CN";
    if (normalized.startsWith("ja")) return "ja-JP";
    return "en-US";
  };
  const resolveLocalePreference = (preference, browserLocale = DEFAULT_LOCALE) => {
    if (!preference || preference === "auto") {
      return resolveBrowserLocale(browserLocale);
    }
    return normalizeLocalePreference(preference);
  };

  const MASTER_KEY_STORAGE = "__crypto_master_key_v1";
  const DEFAULT_SECRET_PREFIX = "fc2ppvdb-enhanced";
  class CryptoServiceImpl {
    getScriptVersion() {
      if (typeof GM_info !== "undefined" && GM_info?.script?.version) return String(GM_info.script.version);
      return "";
    }
    getScriptName() {
      if (typeof GM_info !== "undefined" && GM_info?.script?.name) return String(GM_info.script.name);
      return "unknown-script";
    }
    getDefaultPassword() {
      const fallback = `${DEFAULT_SECRET_PREFIX}:${this.getScriptName()}:v1`;
      if (typeof GM_getValue === "undefined" || typeof GM_setValue === "undefined") return fallback;
      const stored = GM_getValue(MASTER_KEY_STORAGE, "");
      if (typeof stored === "string" && stored) return stored;
      const seed = this.getScriptVersion() || fallback;
      GM_setValue(MASTER_KEY_STORAGE, seed);
      return seed;
    }
    getLegacyPasswords() {
      const current = this.getScriptVersion();
      if (!current) return [];
      const candidates = new Set([current]);
      const m = current.match(/^(\d+)\.(\d+)\.(\d+)$/);
      if (!m) return Array.from(candidates);
      const major = Number(m[1]);
      const minor = Number(m[2]);
      const patch = Number(m[3]);
      for (let i = 1; i <= 5; i++) {
        const prevPatch = patch - i;
        if (prevPatch < 0) break;
        candidates.add(`${major}.${minor}.${prevPatch}`);
      }
      if (minor > 0) {
        for (let p = 0; p <= 9; p++) candidates.add(`${major}.${minor - 1}.${p}`);
      }
      return Array.from(candidates);
    }
    decodeCiphertext(encryptedText) {
      const combinedStr = atob(encryptedText);
      const combined = new Uint8Array(combinedStr.length);
      for (let i = 0; i < combinedStr.length; i++) {
        combined[i] = combinedStr.charCodeAt(i);
      }
      if (combined.length <= 12) throw new Error("Cipher payload too short");
      return combined;
    }
    async decryptWithPassword(encryptedText, password) {
      const combined = this.decodeCiphertext(encryptedText);
      const iv = combined.slice(0, 12);
      const encryptedBuffer = combined.slice(12);
      const key = await this.getKey(password);
      const decryptedContent = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encryptedBuffer);
      return new TextDecoder().decode(decryptedContent);
    }
    async getSalt(keyStr) {
      const encoder = new TextEncoder();
      const data = encoder.encode(keyStr);
      const hash = await crypto.subtle.digest("SHA-256", data);
      return new Uint8Array(hash).slice(0, 16);
    }
    async getKey(password) {
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), { name: "PBKDF2" }, false, [
        "deriveKey"
      ]);
      const salt = await this.getSalt(password);
      const saltBuffer = salt.buffer;
      return await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: saltBuffer,
          iterations: 1e5,
          hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );
    }
    async encrypt(text, password) {
      const resolvedPassword = password || this.getDefaultPassword();
      try {
        const key = await this.getKey(resolvedPassword);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoder = new TextEncoder();
        const encryptedContent = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(text));
        const encryptedBuffer = new Uint8Array(encryptedContent);
        const combined = new Uint8Array(iv.length + encryptedBuffer.length);
        combined.set(iv);
        combined.set(encryptedBuffer, iv.length);
        let binary = "";
        const chunkSize = 8192;
        for (let i = 0; i < combined.length; i += chunkSize) {
          binary += String.fromCharCode(...combined.subarray(i, i + chunkSize));
        }
        return btoa(binary);
      } catch (error) {
        Logger.error("Crypto", "Encryption failed", error);
        throw new Error("Encryption failed", { cause: error });
      }
    }
    async decrypt(encryptedText, password) {
      if (!encryptedText) return "";
      const candidates = password ? [password] : [this.getDefaultPassword(), ...this.getLegacyPasswords()].filter(Boolean);
      let lastError = void 0;
      for (const candidate of Array.from(new Set(candidates))) {
        try {
          return await this.decryptWithPassword(encryptedText, candidate);
        } catch (error) {
          lastError = error;
        }
      }
      Logger.error("Crypto", "Decryption failed", lastError);
      throw new Error("Decryption failed", { cause: lastError });
    }
    async calculateChecksum(data) {
      const str = typeof data === "string" ? data : JSON.stringify(data);
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-1", encoder.encode(str));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  }
  const CryptoService = new CryptoServiceImpl();

  const Storage = {
    get: (key, def) => typeof GM_getValue !== "undefined" ? GM_getValue(key, def) : def,
    set: (key, val) => {
      if (typeof GM_setValue !== "undefined") GM_setValue(key, val);
    },
    async getEncrypted(key, def) {
      const val = this.get(key, "");
      if (!val) return def;
      return await CryptoService.decrypt(val);
    },
    async setEncrypted(key, val) {
      const encrypted = await CryptoService.encrypt(val);
      this.set(key, encrypted);
    },
    delete: (key) => {
      if (typeof GM_deleteValue !== "undefined") GM_deleteValue(key);
    }
  };

  const Utils = {
    debounce: (func, delay) => {
      let t;
      return (...a) => {
        if (t) clearTimeout(t);
        t = setTimeout(() => func(...a), delay);
      };
    },
    chunk: (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size)),
    sleep: (ms) => new Promise((res) => setTimeout(res, ms)),
    copyToClipboard: (text) => {
      if (typeof GM_setClipboard !== "undefined") GM_setClipboard(text);
    }
  };

  const MediaUtils = {
    extractFC2Id: (url) => url?.match(/(?:articles\/|fc2-ppv-|fc2-|work\/|watch\/|^)(\d{5,8})(?:$|\/|\.|_)/i)?.[1] ?? null,
    parseVideoId: (text, url = "") => {
      const input = (text + " " + url).replace(/[+\s_]/g, "-").toUpperCase();
      const fc2Prefix = input.match(/(?:FC2[^\d]*PPV[^\d]*|FC2-)(\d{5,8})/i);
      if (fc2Prefix && fc2Prefix[1]) return { id: fc2Prefix[1], type: "fc2" };
      const fc2FromUrl = MediaUtils.extractFC2Id(url);
      if (fc2FromUrl) return { id: fc2FromUrl, type: "fc2" };
      const jav = input.match(/([A-Z0-9]{2,20})[^A-Z0-9]*?(\d{2,8}(?:-\d{1,4})?)/);
      if (jav && jav[1] && jav[2]) {
        let prefix = jav[1];
        if (!/^\d+$/.test(prefix)) {
          if (prefix === "DM" && (input.includes("/DM") || input.includes("-DM"))) return null;
          if (prefix === "PONDO" || prefix === "1PONDO") prefix = "1PON";
          if (prefix === "MUSUME" || prefix === "10MUSUME") prefix = "10MU";
          if (prefix === "PACOPACOMAMA") prefix = "PACO";
          if (prefix === "CARIBBEANCOM") prefix = "CARIB";
          const blacklist = JAV_PREFIX_BLACKLIST;
          if (!blacklist.includes(prefix)) {
            return { id: `${prefix}-${jav[2]}`, type: "jav" };
          }
        }
      }
      const dateMatch = input.match(/(\d{6,8})-(\d{1,4})/);
      if (dateMatch && dateMatch[1] && dateMatch[2]) {
        const d = dateMatch[1];
        if (d.length === 6 || d.length === 8) {
          return { id: `${dateMatch[1]}-${dateMatch[2]}`, type: "jav" };
        }
      }
      const fc2Raw = input.match(/(?:^|[^A-Z0-9])(\d{5,10})(?:$|[^A-Z0-9])/);
      if (fc2Raw && fc2Raw[1]) return { id: fc2Raw[1], type: "fc2" };
      return null;
    },
    cleanActressName: (name) => {
      if (!name) return null;
      const n = name.trim();
      const blacklist = ACTRESS_BLACKLIST;
      if (ACTRESS_BLACKLIST_STRINGS.includes(n) || blacklist.some((reg) => reg.test(n))) return null;
      if (n.length > VALIDATION.ACTRESS_NAME_MAX_LENGTH || n.length < VALIDATION.ACTRESS_NAME_MIN_LENGTH) return null;
      return n;
    },
    formatDate: (dateStr) => {
      if (!dateStr) return "";
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString(void 0, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        });
      } catch {
        return dateStr;
      }
    },
    cleanImageUrl: (url) => {
      if (!url) return url;
      return url.replace(/!\d+x\d+\.(jpg|jpeg|png|webp)/gi, "");
    },
parseDateIdParts: (id) => {
      const match = id.toUpperCase().match(/^(1PON|10MU|CARIB|PACO|1PONDO|10MUSUME|CARIBBEANCOM|PACOPACOMAMA)-(\d{6,8})-(\d{1,4})$/);
      if (!match || !match[1] || !match[2] || !match[3]) return null;
      let brand = match[1];
      const date = match[2];
      const serial = match[3];
      if (brand === "1PON") brand = "1PONDO";
      if (brand === "10MU") brand = "10MUSUME";
      if (brand === "CARIB") brand = "CARIBBEANCOM";
      if (brand === "PACO") brand = "PACOPACOMAMA";
      const shortMap = {
        "1PONDO": "1PON",
        "10MUSUME": "10MU",
        CARIBBEANCOM: "CARIB",
        PACOPACOMAMA: "PACO"
      };
      return {
        brand,
        short: shortMap[brand] || brand,
        date,
        serial
      };
    }
  };

  const h = (tag, props = {}, ...children) => {
    const el = document.createElement(tag);
    for (const [key, val] of Object.entries(props)) {
      if (key === "className") el.className = val;
      else if (key === "style" && typeof val === "object" && val !== null) {
        Object.entries(val).forEach(([sKey, sVal]) => {
          if (sKey.startsWith("--")) {
            el.style.setProperty(sKey, String(sVal));
          } else {
            el.style[sKey] = String(sVal);
          }
        });
      } else if (key === "dataset" && typeof val === "object" && val !== null) Object.assign(el.dataset, val);
      else if (key.startsWith("on") && typeof val === "function") {
        const eventName = key.toLowerCase().substring(2);
        el.addEventListener(eventName, val);
      } else if (key === "innerHTML") {
        const raw = String(val);
        if (tag === "style") {
          el.textContent = raw;
        } else {
          const sanitized = raw.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "").replace(/<(iframe|object|embed|form|base)\b[^>]*>([\s\S]*?<\/\1>)?/gim, "").replace(/\s*on\w+\s*=\s*("[^"]*"|'[^']*'|[^>\s]+)/gi, "").replace(/javascript:/gi, "").replace(/data:\s*text\/html/gi, "data:blocked");
          if (raw !== sanitized) {
            Logger.warn("DOM", "Sanitized unsafe innerHTML");
          }
          el.innerHTML = sanitized;
        }
      } else if (val !== null && val !== void 0 && val !== false) {
        const target = el;
        if (key in target) target[key] = val;
        else el.setAttribute(key, String(val));
      }
    }
    children.flat().forEach((child) => {
      if (child === null || child === void 0 || child === false) return;
      el.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
    });
    return el;
  };
  const getBestImageSource = (img) => {
    if (!img) return "";
    const d = img.dataset;
    const src = d.original || d.src || d.lazySrc || img.src || "";
    if (src.startsWith("data:image") || src.includes("pixel.gif")) {
      return d.original || d.src || d.lazySrc || "";
    }
    return src;
  };

  const IdNormalizer = {
    normalize(raw) {
      if (!raw) return "";
      const trimmed = raw.trim().toUpperCase();
      const fc2Match = trimmed.match(/^(?:FC2|PPV)?-?(\d{5,8})$/);
      if (fc2Match && fc2Match[1]) {
        return fc2Match[1].replace(/^0+/, "") || "";
      }
      const javMatch = trimmed.match(VALIDATION.JAV_ID_REGEX);
      if (javMatch) {
        return trimmed;
      }
      return trimmed;
    },
    isSame(id1, id2) {
      const n1 = this.normalize(id1);
      const n2 = this.normalize(id2);
      if (!n1 || !n2) return false;
      if (n1 === n2) return true;
      if (n1.replace(/-/g, "") === n2.replace(/-/g, "")) return true;
      return false;
    }
  };

  const http = (url, options = {}) => {
    const respType = options.responseType ?? options.type ?? "json";
    let data = options.data || options.body;
    if (data && typeof data === "object") data = JSON.stringify(data);
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: options.method ?? "GET",
        url,
        headers: {
          ...data ? { "Content-Type": "application/json" } : {},
          ...options.headers || {}
        },
        data,
        timeout: options.timeout || Config.TIMEOUTS.API,
        responseType: respType === "json" ? "json" : "text",
        onload: (res) => {
          if (res.status >= 200 && res.status < 300) {
            if (respType === "json") {
              try {
                resolve(res.response || JSON.parse(res.responseText));
              } catch {
                resolve(res.responseText);
              }
            } else {
              resolve(res.responseText || res.response);
            }
          } else {
            reject({ status: res.status, statusText: res.statusText, response: res.responseText });
          }
        },
        onerror: (err) => reject({ status: 0, statusText: "Network Error", error: err }),
        ontimeout: () => reject({ status: 408, statusText: "Timeout" })
      });
    });
  };
  const normalizeBlob = async (value) => {
    if (value instanceof Blob) return value;
    if (typeof value === "object" && value !== null && "arrayBuffer" in value && typeof value.arrayBuffer === "function") {
      const val = value;
      return new Blob([await val.arrayBuffer()], { type: val.type ?? "" });
    }
    throw new Error("Response was not a Blob");
  };
  const fetchBlob = (url, headers = {}) => {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url,
        headers,
        responseType: "blob",
        timeout: Config.TIMEOUTS.API,
        onload: (res) => {
          if (res.status >= 200 && res.status < 300) {
            void normalizeBlob(res.response).then(resolve, reject);
          } else {
            reject({ status: res.status, statusText: res.statusText });
          }
        },
        onerror: (err) => reject(err),
        ontimeout: () => reject(new Error("Timeout"))
      });
    });
  };
  const fetchImageAsBlobUrl = async (url, headers = {}) => {
    const blob = await fetchBlob(url, headers);
    return URL.createObjectURL(blob);
  };
  const getBypassHeaders = (url) => {
    const headers = {};
    if (url.includes("paipancon.com")) {
      headers["Referer"] = "https://paipancon.com/";
    }
    if (url.includes("fd2ppv.cc")) {
      headers["Referer"] = "https://fd2ppv.cc/";
    }
    return headers;
  };
  const attachMediaBypass = (el, ...fallbacks) => {
    const handleMediaError = async () => {
      const currentSrc = el.src;
      if (!currentSrc || currentSrc.startsWith("blob:") || currentSrc.includes("data:image") || currentSrc.includes("placeholder")) {
        return;
      }
      el.removeEventListener("error", handleMediaError);
      try {
        const blobUrl = await fetchImageAsBlobUrl(currentSrc, getBypassHeaders(currentSrc));
        el.addEventListener("error", handleMediaError, { once: true });
        el.src = blobUrl;
      } catch {
        const nextFallback = fallbacks.find((f) => f && f !== currentSrc);
        if (nextFallback) {
          const remaining = fallbacks.slice(fallbacks.indexOf(nextFallback) + 1);
          el.addEventListener("error", handleMediaError, { once: true });
          el.src = nextFallback;
          if (remaining.length > 0) {
            attachMediaBypass(el, ...remaining);
          }
        }
      }
    };
    el.addEventListener("error", handleMediaError, { once: true });
  };
  const smartLoadMedia = (el, src, ...fallbacks) => {
    if (!src || src.startsWith("blob:") || src.includes("data:image")) {
      if (src) el.src = src;
      return;
    }
    const isProblematic = src.includes("paipancon.com") || src.includes("fourhoi.com");
    if (isProblematic) {
      const headers = getBypassHeaders(src);
      fetchImageAsBlobUrl(src, headers).then((blobUrl) => {
        el.src = blobUrl;
      }).catch(() => {
        const nextFallback = fallbacks.find((f) => f && f !== src);
        if (nextFallback) {
          const remaining = fallbacks.slice(fallbacks.indexOf(nextFallback) + 1);
          smartLoadMedia(el, nextFallback, ...remaining);
        }
      });
    } else {
      el.src = src;
      attachMediaBypass(el, ...fallbacks);
    }
  };

  const log$E = Logger.scope("Retry");
  const getStatus = (error) => {
    if (!error || typeof error !== "object") return void 0;
    const status = error.status;
    return typeof status === "number" ? status : void 0;
  };
  const isServerErrorStatus = (status) => typeof status === "number" && status >= 500 && status < 600;
  class RetryManager {
    static defaultConfig = {
      maxRetries: 3,
      backoffMs: [1e3, 3e3, 5e3],
      shouldRetry: (error) => {
        const status = getStatus(error);
        return status === 0 || isServerErrorStatus(status);
      }
    };
    static async executeWithRetry(operation, config = {}) {
      const finalConfig = { ...this.defaultConfig, ...config };
      let lastError;
      for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
        try {
          log$E.debug(`Attempt ${attempt + 1}/${finalConfig.maxRetries + 1}`);
          return await operation();
        } catch (error) {
          lastError = error;
          if (attempt === finalConfig.maxRetries) {
            log$E.error("All retries exhausted", error);
            throw error;
          }
          if (finalConfig.shouldRetry && !finalConfig.shouldRetry(error)) {
            log$E.warn("Error not retryable", error);
            throw error;
          }
          if (finalConfig.onRetry) {
            try {
              finalConfig.onRetry(error, attempt + 1);
            } catch (retryError) {
              log$E.warn("Error in onRetry callback", retryError);
            }
          }
          const delay = finalConfig.backoffMs[attempt] ?? finalConfig.backoffMs[finalConfig.backoffMs.length - 1] ?? 0;
          log$E.debug(`Retry in ${delay}ms`, { attempt: attempt + 1, error });
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
      throw lastError;
    }
static presets = {
      network: (onRetry) => ({
        maxRetries: 3,
        backoffMs: [1e3, 3e3, 5e3],
        shouldRetry: (error) => {
          const status = getStatus(error);
          return !!(status === 0 || status === 408 || isServerErrorStatus(status));
        },
        onRetry
      }),
      sync: {
        maxRetries: 2,
        backoffMs: [2e3, 5e3],
        shouldRetry: (error) => {
          const status = getStatus(error);
          return !!(status !== 401 && status !== 403);
        }
      },
      magnet: {
        maxRetries: 2,
        backoffMs: [1500, 3e3],
        shouldRetry: (error) => {
          const status = getStatus(error);
          return !!(status !== 429);
        }
      }
    };
  }

  const log$D = Logger.scope("Gzip");
  class GzipServiceImpl {
    _isSupported = null;
    isSupported() {
      if (this._isSupported !== null) return this._isSupported;
      try {
        this._isSupported = typeof window.CompressionStream === "function" && typeof window.DecompressionStream === "function";
      } catch {
        this._isSupported = false;
      }
      return this._isSupported;
    }
    async compress(data) {
      if (!this.isSupported()) {
        return data instanceof Blob ? data : new Blob([data], { type: "application/json" });
      }
      try {
        const stream = data instanceof Blob ? data.stream() : new Blob([data], { type: "application/json" }).stream();
        const compressedStream = stream.pipeThrough(new CompressionStream("gzip"));
        return await new Response(compressedStream).blob();
      } catch (error) {
        log$D.error("Compression error", error);
        return data instanceof Blob ? data : new Blob([data], { type: "application/json" });
      }
    }
    async decompress(data) {
      if (!this.isSupported()) {
        return await data.text();
      }
      try {
        const isGzip = await this.checkIfGzip(data);
        if (!isGzip) {
          return await data.text();
        }
        const stream = data.stream();
        const decompressedStream = stream.pipeThrough(new DecompressionStream("gzip"));
        return await new Response(decompressedStream).text();
      } catch (error) {
        log$D.error("Decompression error", error);
        return await data.text();
      }
    }
    async checkIfGzip(blob) {
      if (blob.size < 2) return false;
      const arrayBuffer = await blob.slice(0, 2).arrayBuffer();
      const header = new Uint8Array(arrayBuffer);
      return header[0] === 31 && header[1] === 139;
    }
  }
  const GzipService = new GzipServiceImpl();

  const log$C = Logger.scope("Device");
  class DeviceService {
    static _platform = null;
    static get platform() {
      if (!this._platform) {
        this._platform = this.detectPlatform();
      }
      return this._platform;
    }
    static detectPlatform() {
      let os = "unknown";
      let browser = "unknown";
      const info = typeof GM_info !== "undefined" ? GM_info : null;
      if (info?.platform) {
        const p = info.platform;
        os = p.os || "unknown";
        browser = p.browserName || "unknown";
      }
      const ua = navigator.userAgent.toLowerCase();
      if (os === "unknown") {
        if (/android/.test(ua)) os = "android";
        else if (/iphone|ipad|ipod/.test(ua)) os = "ios";
        else if (/windows/.test(ua)) os = "windows";
        else if (/macintosh/.test(ua)) os = "macos";
        else if (/linux/.test(ua)) os = "linux";
      }
      const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches;
      const isSmallScreen = window.matchMedia("(max-width: 768px)").matches;
      const isMobile = os === "android" || os === "ios" || isSmallScreen && isTouch;
      log$C.debug(
        `[Precision Detect] OS: ${os}, Small: ${isSmallScreen}, Touch: ${isTouch} -> MobileMode: ${isMobile}`
      );
      return { os, browser, isMobile, isTouch, isSmallScreen };
    }
static isMobile() {
      return this.platform.isMobile;
    }
static isPhone() {
      return this.isMobileOS() && this.platform.isSmallScreen;
    }
static isTablet() {
      return this.isMobileOS() && !this.platform.isSmallScreen;
    }
static isDesktop() {
      return !this.isMobileOS() && !this.platform.isSmallScreen;
    }
    static isTouch() {
      return this.platform.isTouch;
    }
    static isMobileOS() {
      return this.platform.os === "android" || this.platform.os === "ios";
    }
  }

  const log$B = Logger.scope("Browser");
  class BrowserService {
static openTab(url, active = true) {
      if (typeof GM_openInTab !== "undefined") {
        try {
          GM_openInTab(url, { active, insert: true, setParent: true });
          return;
        } catch (error) {
          log$B.error("Failed to open tab via GM_openInTab", error);
        }
      }
      window.open(url, "_blank", "noopener,noreferrer");
    }
static notify(text, title = "FC2PPVDB Enhanced", image, onClick) {
      if (typeof GM_notification !== "undefined") {
        try {
          GM_notification({
            text,
            title,
            image: image || "https://fc2ppvdb.com/favicon.ico",
            timeout: 5e3,
            onclick: onClick
          });
        } catch (error) {
          log$B.error("Failed to show system notification", error);
        }
      }
    }
  }

  const STATE_SERVICE_SENSITIVE_PROPS = ["supabaseKey", "supabasePassword", "webdavPass"];
  const STATE_SERVICE_SENSITIVE_MAP = {
    supabaseKey: "SUPABASE_KEY",
    supabasePassword: "SUPABASE_PASSWORD",
    webdavPass: "WEBDAV_PASS"
  };
  const looksLikeCiphertext = (value) => {
    return !!value && value.length >= 24 && /^[A-Za-z0-9+/=]+$/.test(value);
  };
  const createDefaultAppState = () => {
    return {
      previewMode: "static",
      hideNoMagnet: false,
      hideCensored: false,
      enableHistory: true,
      hideViewed: false,
      enableFollows: false,
      supjavSortByViews: false,
      loadExtraPreviews: false,
      enableQuickBar: true,
      showViewedBtn: true,
      showIdBadge: true,
      enableMagnets: true,
      enableExternalLinks: true,
      enableActressName: true,
      language: normalizeLocalePreference(Storage.get(STORAGE_KEYS.LANGUAGE, "auto") || "auto"),
      lastSyncTs: UI_CONSTANTS.DEFAULT_TIMESTAMP,
      supabaseUrl: Storage.get(STORAGE_KEYS.SUPABASE_URL, "") || "",
      supabaseKey: Storage.get(STORAGE_KEYS.SUPABASE_KEY, "") || "",
      supabaseEmail: Storage.get(STORAGE_KEYS.SUPABASE_EMAIL, "") || "",
      supabasePassword: Storage.get(STORAGE_KEYS.SUPABASE_PASSWORD, "") || "",
      webdavUrl: Storage.get(STORAGE_KEYS.WEBDAV_URL, "") || "",
      webdavUser: Storage.get(STORAGE_KEYS.WEBDAV_USER, "") || "",
      webdavPass: Storage.get(STORAGE_KEYS.WEBDAV_PASS, "") || "",
      webdavPath: Storage.get(STORAGE_KEYS.WEBDAV_PATH, UI_CONSTANTS.DEFAULT_SYNC_FILENAME) || UI_CONSTANTS.DEFAULT_SYNC_FILENAME,
      syncMode: "none",
      syncStatus: "idle",
      syncInterval: 5,
      replaceFc2Covers: true,
      enabledPortals: [
        "supjav",
        "missav",
        "javdb",
        "javbus",
        "javlibrary",
        "dmm",
        "fc2",
        "fc2ppvdb",
        "fd2ppv",
        "fc2db",
        "sukebei"
      ],
      userGridColumns: Number(Storage.get(STORAGE_KEYS.USER_GRID_COLUMNS, 0)) || 0,
      debugMode: Storage.get(STORAGE_KEYS.DEBUG_MODE, false) || false,
      cardDensity: Storage.get(STORAGE_KEYS.CARD_DENSITY, "balanced") || "balanced",
      cardPrimaryActions: ["id", "viewed", "play", "preview", "magnet", "external"],
      lastSyncResult: Storage.get(STORAGE_KEYS.LAST_SYNC_RESULT, null) || null,
      settingsSearchQuery: Storage.get(STORAGE_KEYS.SETTINGS_SEARCH_QUERY, "") || "",
      settingsCollapsedGroups: Storage.get(STORAGE_KEYS.SETTINGS_COLLAPSED_GROUPS, []) || [],
      settingsPreset: Storage.get(STORAGE_KEYS.SETTINGS_PRESET, "custom") || "custom",
      accentColor: Storage.get(STORAGE_KEYS.ACCENT_COLOR, "#ffffff") || "#ffffff",
      isSelectionMode: false
    };
  };
  const createStoredAppState = () => {
    const defaults = createDefaultAppState();
    const stored = Storage.get(Config.STORAGE_KEYS.SETTINGS, {}) || {};
    if (stored.syncMode === void 0) {
      const value = Storage.get(STORAGE_KEYS.SYNC_MODE, "none");
      stored.syncMode = ["none", "supabase", "webdav"].includes(value) ? value : "none";
    }
    const merged = { ...defaults, ...stored };
    merged.language = normalizeLocalePreference(String(merged.language || "auto"));
    return merged;
  };
  const createPersistState = (log) => {
    return Utils.debounce(async (data) => {
      try {
        const appState = data;
        const {
          syncStatus: _syncStatus,
          supabaseKey: _supabaseKey,
          supabasePassword: _supabasePassword,
          webdavPass: _webdavPass,
          isSelectionMode: _isSelectionMode,
          ...toSave
        } = appState;
        Storage.set(Config.STORAGE_KEYS.SETTINGS, toSave);
        for (const prop of STATE_SERVICE_SENSITIVE_PROPS) {
          const value = appState[prop];
          if (typeof value !== "string" || !value) {
            continue;
          }
          const storageKey = STATE_SERVICE_SENSITIVE_MAP[prop];
          if (storageKey) {
            await Storage.setEncrypted(STORAGE_KEYS[storageKey], value);
          }
        }
      } catch (error) {
        log.error("Failed to save state", error);
      }
    }, TIMING.DEBOUNCE_MS);
  };
  const createStateProxy = ({
    rawState,
    persistState,
    shouldBroadcast,
    broadcastUpdate,
    emitStateChange,
    emitLanguageChange
  }) => {
    return new Proxy(rawState, {
      get: (target, prop) => {
        const value = Reflect.get(target, prop);
        if (Array.isArray(value)) {
          return [...value];
        }
        return value;
      },
      set: (target, prop, value) => {
        if (typeof prop !== "string" || !(prop in target)) {
          Reflect.set(target, prop, value);
          return true;
        }
        const key = prop;
        if (key === "language" && typeof value === "string") {
          value = normalizeLocalePreference(value);
        }
        const currentValue = target[key];
        if (currentValue === value) {
          return true;
        }
        if (typeof currentValue === "object" && currentValue !== null && typeof value === "object" && value !== null && JSON.stringify(currentValue) === JSON.stringify(value)) {
          return true;
        }
        target[key] = value;
        if (key === "syncStatus") {
          emitStateChange({ prop: key, value });
          return true;
        }
        persistState(target);
        if (shouldBroadcast()) {
          broadcastUpdate({ prop: key, value });
        }
        if (key === "cardPrimaryActions") {
          CoreEvents.emit(AppEvents.CONFIG_CHANGED, { key, value });
        }
        emitStateChange({ prop: key, value });
        if (key === "language") {
          emitLanguageChange(value);
        }
        return true;
      }
    });
  };
  const hydrateSensitiveState = async (proxy, log) => {
    for (const prop of STATE_SERVICE_SENSITIVE_PROPS) {
      const sensitiveKey = STATE_SERVICE_SENSITIVE_MAP[prop];
      if (!sensitiveKey) {
        continue;
      }
      const storageKey = STORAGE_KEYS[sensitiveKey];
      const raw = Storage.get(storageKey, "");
      if (!raw) {
        continue;
      }
      try {
        const decrypted = await CryptoService.decrypt(raw);
        proxy[prop] = decrypted;
      } catch (error) {
        if (looksLikeCiphertext(raw)) {
          log.error(`Failed to decrypt secret: ${String(prop)}`, error);
          continue;
        }
        log.warn(`Migrating plain-text secret: ${String(prop)}`);
        await Storage.setEncrypted(storageKey, raw);
        proxy[prop] = raw;
      }
    }
  };
  const bindCrossTabStateSync = (onRemoteUpdate) => {
    const detachMessaging = MessagingService.onMessage((message) => {
      if (message.type !== MessageType.SETTING_UPDATE) {
        return;
      }
      onRemoteUpdate(message.payload);
    });
    let detachGM = null;
    if (typeof GM_addValueChangeListener !== "undefined") {
      const listenerId = GM_addValueChangeListener(STORAGE_KEYS.SETTINGS, (_key, oldVal, newVal, remote) => {
        if (!remote) return;
        const oldObj = oldVal || {};
        const newObj = newVal || {};
        Object.keys(newObj).forEach((k) => {
          const prop = k;
          if (newObj[prop] !== oldObj[prop] && JSON.stringify(newObj[prop]) !== JSON.stringify(oldObj[prop])) {
            onRemoteUpdate({ prop, value: newObj[prop] });
          }
        });
      });
      detachGM = () => GM_removeValueChangeListener(listenerId);
    }
    return () => {
      detachMessaging();
      detachGM?.();
    };
  };

  const log$A = Logger.scope("State");
  class StateService {
    proxy;
    ready;
    skipBroadcast = false;
    resolveReady;
    detachCrossTabSync = null;
    detachDebugModeListener = null;
    constructor() {
      this.ready = new Promise((resolve) => {
        this.resolveReady = resolve;
      });
      const persistState = createPersistState(log$A);
      this.proxy = createStateProxy({
        rawState: createStoredAppState(),
        persistState,
        shouldBroadcast: () => !this.skipBroadcast,
        broadcastUpdate: (change) => {
          MessagingService.broadcast(MessageType.SETTING_UPDATE, change);
        },
        emitStateChange: (change) => {
          CoreEvents.emit(AppEvents.STATE_CHANGED, { prop: change.prop, value: change.value });
        },
        emitLanguageChange: (language) => {
          CoreEvents.emit(AppEvents.LANGUAGE_CHANGED, language);
        }
      });
    }
    async onInit() {
      this.onCleanup();
      log$A.debug("Initializing StateService (secret decryption)");
      this.detachCrossTabSync = bindCrossTabStateSync(({ prop, value }) => {
        if (this.proxy[prop] === value) {
          return;
        }
        this.skipBroadcast = true;
        this.proxy[prop] = value;
        this.skipBroadcast = false;
      });
      this.detachDebugModeListener = CoreEvents.on(AppEvents.STATE_CHANGED, ({ prop, value }) => {
        if (prop !== "debugMode") {
          return;
        }
        if (value) {
          Logger.enable(false);
          return;
        }
        Logger.disable(false);
      });
      if (this.proxy.debugMode) {
        Logger.enable(false);
      }
      await hydrateSensitiveState(this.proxy, log$A);
      this.resolveReady();
      log$A.info("StateService ready");
    }
    onCleanup() {
      this.detachCrossTabSync?.();
      this.detachCrossTabSync = null;
      this.detachDebugModeListener?.();
      this.detachDebugModeListener = null;
      this.skipBroadcast = false;
    }
    on(prop, listener) {
      if (typeof prop === "function") {
        const handler = prop;
        return CoreEvents.on(
          AppEvents.STATE_CHANGED,
          handler
        );
      }
      return CoreEvents.on(AppEvents.STATE_CHANGED, (change) => {
        if (change.prop === prop && listener) {
          listener(change.value);
        }
      });
    }
  }

  const createStateService = () => {
    return new StateService();
  };
  const State = AppContainer.register("state", createStateService());

  const tokens = `
    /* ============================================================
       DESIGN TOKENS & DESIGN SYSTEM
       ============================================================ */

    :root, :host {
        /* --- Elevation & Depth --- */
        --fc2-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
        --fc2-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
        --fc2-shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.5);
        --fc2-shadow-glow: 0 0 15px rgba(var(--fc2-primary-rgb), 0.25);

        /* --- Opacity Scale --- */
        --fc2-opacity-none: 0;
        --fc2-opacity-ghost: 0.02;
        --fc2-opacity-04: 0.04;
        --fc2-opacity-subtle: 0.08;
        --fc2-opacity-10: 0.1;
        --fc2-opacity-12: 0.12;
        --fc2-opacity-15: 0.15;
        --fc2-opacity-16: 0.16;
        --fc2-opacity-20: 0.2;
        --fc2-opacity-24: 0.24;
        --fc2-opacity-30: 0.3;
        --fc2-opacity-muted: 0.35;
        --fc2-opacity-40: 0.4;
        --fc2-opacity-45: 0.45;
        --fc2-opacity-50: 0.5;
        --fc2-opacity-dim: 0.6;
        --fc2-opacity-strong: 0.85;
        --fc2-opacity-full: 1;

        /* --- Colors (Semantic / Catppuccin Base) --- */
        --fc2-bg: #0a0a0c;
        --fc2-surface: rgba(22, 22, 26, 0.8);
        --fc2-surface-float: rgba(28, 28, 34, 0.92);
        --fc2-surface-low: rgba(255, 255, 255, 0.015);
        --fc2-surface-lowest: rgba(255, 255, 255, 0.01);
        --fc2-surface-item: rgba(255, 255, 255, 0.03);
        --fc2-text: #f4f4f7;
        --fc2-text-dim: #9494a0;
        --fc2-text-muted: #62626e;
        --fc2-border: rgba(255, 255, 255, 0.08);
        --fc2-primary: #ffffff;
        --fc2-on-primary: #000000;
        --fc2-success: #34d399;
        --fc2-danger: #f87171;
        --fc2-warn: #fab387;
        --fc2-info: #89b4fa;
        --fc2-accent: #e4e4e7;
        --fc2-text-bright: #ffffff;
        --fc2-text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);

        /* --- Semantic RGB (for rgba() usage) --- */
        --fc2-black-rgb: 0, 0, 0;
        --fc2-primary-rgb: 255, 255, 255;
        --fc2-success-rgb: 52, 211, 153;
        --fc2-danger-rgb: 248, 113, 113;
        --fc2-warn-rgb: 250, 179, 135;
        --fc2-info-rgb: 137, 180, 250;
        
        /* --- Animation Curves --- */
        --fc2-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
        --fc2-ease-in: cubic-bezier(0.7, 0, 0.84, 0);
        --fc2-ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
        --fc2-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
        --fc2-motion-fast: 0.18s;
        --fc2-motion-base: 0.24s;
        --fc2-motion-slow: 0.38s;
        
        /* --- Spacing Scale (8px Grid) --- */
        --fc2-space-xxs: 2px;
        --fc2-space-xs: 4px;
        --fc2-space-sm: 8px;
        --fc2-space-base: 12px;
        --fc2-space-md: 16px;
        --fc2-space-lg: 24px;
        --fc2-space-xl: 32px;
        --fc2-space-2xl: 40px;

        /* --- Typography Scale --- */
        --fc2-text-xs: 12px;
        --fc2-text-sm: 13px;
        --fc2-text-base: 14px;
        --fc2-text-lg: 16px;
        --fc2-text-xl: 20px;
        --fc2-line-tight: 1.25;
        --fc2-line-base: 1.5;
        --fc2-line-relaxed: 1.65;
        --fc2-letter-tight: 0.5px;
        --fc2-font-regular: 400;
        --fc2-font-medium: 500;
        --fc2-font-semibold: 600;
        --fc2-font-bold: 700;

        /* --- Gradients --- */
        --fc2-accent-grad: linear-gradient(135deg, #3f3f46, #18181b);
        --fc2-magnet-grad: linear-gradient(135deg, #52525b, #27272a);
        
        /* --- Layout & Shape --- */
        --fc2-radius-sm: 6px;
        --fc2-radius-md: 12px;
        --fc2-radius-lg: 16px;
        --fc2-radius-xl: 20px;
        --fc2-radius: var(--fc2-radius-lg);
        --fc2-radius-full: 9999px;
        
        /* --- Layout & Stroke --- */
        --fc2-border-width: 1px;
        --fc2-layout-max-width: 1180px;
        --fc2-layout-tooltip-max-width: 300px;
        --fc2-layout-toast-min-width: 280px;
        --fc2-layout-toast-max-width: 420px;
        --fc2-layout-actionsheet-width: 400px;
        --fc2-layout-modal-max-height: 900px;
        --fc2-layout-panel-min-height: 200px;
        --fc2-layout-portal-min-width: 180px;
        --fc2-layout-sidebar-min-width: 120px;
        --fc2-layout-rail-width: 140px;
        --fc2-layout-flex-basis-md: 160px;
        --fc2-layout-flex-basis-lg: 220px;
        --fc2-layout-pane-width: 320px;
        --fc2-layout-card-intrinsic-height: 280px;
        --fc2-layout-preview-height: 120px;
        --fc2-layout-dialog-max-width: 500px;
        --fc2-layout-log-max-height: 240px;
        --fc2-sidebar-width: 240px;
        --fc2-btn-radius: 10px;
        --fc2-btn-height-xs: 28px;
        --fc2-btn-height-sm: 32px;
        --fc2-btn-height-md: 36px;
        --fc2-btn-height-lg: 44px;
        --fc2-btn-pad-xs: 10px;
        --fc2-btn-pad-sm: 12px;
        --fc2-btn-pad-md: 16px;
        --fc2-size-avatar: 60px;
        --fc2-focus-ring: 0 0 0 3px rgba(var(--fc2-primary-rgb), 0.18);
        --fc2-blur: 12px; 
        --fc2-glass-saturate: 180%;
        --fc2-font: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
        --fc2-font-mono: 'JetBrains Mono', ui-monospace, 'Cascadia Code', 'Fira Code', monospace;

        /* --- Stealth Pro (Solid Black) --- */
        --fc2-liquid-bg: #0a0a0c; /* Truly deep black base */
        --fc2-liquid-border: 1px solid rgba(255, 255, 255, 0.08);
        --fc2-rim-light: inset 1px 1px 0px 0px rgba(255, 255, 255, 0.12), 
                         inset -1px -1px 0px 0px rgba(0, 0, 0, 0.3);
        --fc2-liquid-iridescent: linear-gradient(135deg, 
                                    rgba(255, 255, 255, 0.1) 0%, 
                                    rgba(180, 200, 255, 0.05) 30%, 
                                    rgba(255, 180, 255, 0.04) 70%, 
                                    rgba(255, 255, 255, 0.1) 100%);
        --fc2-glass-noise: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");

        /* --- Global Component Styles --- */
        --fc2-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);

        /* Z-Index Scale */
        --fc2-z-toast: 2147483647;
        --fc2-z-gallery: 2147483645;
        --fc2-z-actionsheet: 2147483640;
        --fc2-z-fab: 2147483620;
        --fc2-z-modal: 2147483600;
        --fc2-z-settings: 2147483550;
        --fc2-z-overlay: 2147483500;
        --fc2-z-tooltip: 100000;
        --fc2-z-dropdown: 1000;
        
        /* Scrollbar Colors */
        --fc2-scrollbar-thumb: rgba(255, 255, 255, 0.08);
        --fc2-scrollbar-hover: rgba(255, 255, 255, 0.15);

        /* Aliases for settings panel (Legacy Compatibility) */
        --fc2-enh-bg: var(--fc2-liquid-bg);
        --fc2-enh-bg-secondary: rgba(18, 18, 20, 0.3);
        --fc2-enh-text: #f4f4f7;
        --fc2-enh-border: var(--fc2-liquid-border);
    }

    /* ============================================================
       LIGHT THEME OVERRIDES
       ============================================================ */

    :root.fc2-light-theme {
        --fc2-bg: #f8f9fa;
        --fc2-surface: rgba(255, 255, 255, 0.8);
        --fc2-text: #1a1a1a;
        --fc2-text-dim: #52525b; /* Darkened from #71717a for better contrast */
        --fc2-border: rgba(0, 0, 0, 0.08);
        --fc2-primary: #111111;
        --fc2-on-primary: #ffffff;
        --fc2-success: #16a34a;
        --fc2-danger: #dc2626;
        --fc2-warn: #d97706;
        --fc2-info: #2563eb;
        --fc2-accent: #3f3f46;
        --fc2-text-bright: var(--fc2-text);
        --fc2-text-shadow: none;

        /* --- Semantic RGB (light theme) --- */
        --fc2-primary-rgb: 17, 17, 17;
        --fc2-success-rgb: 22, 163, 74;
        --fc2-danger-rgb: 220, 38, 38;
        --fc2-warn-rgb: 217, 119, 6;
        --fc2-info-rgb: 37, 99, 235;

        /* --- Shadows (softer for light theme) --- */
        --fc2-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
        --fc2-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
        --fc2-shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.12);

        --fc2-text-muted: #a1a1aa;
        --fc2-enh-bg-secondary: rgba(240, 240, 242, 0.3);
        --fc2-enh-text: var(--fc2-text);
        
        --fc2-accent-grad: linear-gradient(135deg, #e4e4e7, #f4f4f5);
        --fc2-magnet-grad: linear-gradient(135deg, #d4d4d8, #e4e4e7);
        
        --fc2-scrollbar-thumb: rgba(0, 0, 0, 0.15);
        --fc2-scrollbar-hover: rgba(0, 0, 0, 0.25);
        
        --fc2-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
        --fc2-focus-ring: 0 0 0 3px rgba(var(--fc2-primary-rgb), 0.14);

        --fc2-surface-float: rgba(255, 255, 255, 0.92);
        --fc2-surface-low: rgba(0, 0, 0, 0.02);
        --fc2-surface-lowest: rgba(0, 0, 0, 0.01);
        --fc2-surface-item: rgba(0, 0, 0, 0.03);
        --fc2-liquid-bg: #f0f0f2;
        --fc2-liquid-border: 1px solid rgba(0, 0, 0, 0.08);
        --fc2-rim-light: inset 1px 1px 0px 0px rgba(255, 255, 255, 0.8),
                         inset -1px -1px 0px 0px rgba(0, 0, 0, 0.05);
        --fc2-liquid-iridescent: linear-gradient(135deg,
                                    rgba(0, 0, 0, 0.03) 0%,
                                    rgba(0, 50, 100, 0.02) 30%,
                                    rgba(100, 0, 100, 0.02) 70%,
                                    rgba(0, 0, 0, 0.03) 100%);
    }
`;

  const SITE_TONE_CLASS_PREFIX = "fc2-site-";
  const resolveSiteToneKey = (hostname) => {
    if (hostname.includes("fc2ppvdb.com")) return "fc2ppvdb";
    if (hostname.includes("fc2db.net")) return "fc2db";
    if (hostname.includes("fd2ppv.cc")) return "fd2ppv";
    if (hostname.includes("javdb")) return "javdb";
    if (hostname.includes("missav")) return "missav";
    if (hostname.includes("supjav.com")) return "supjav";
    if (hostname.includes("javfc2.xyz")) return "javfc2";
    return "default";
  };
  const resolveSiteToneClass = (hostname) => {
    return `${SITE_TONE_CLASS_PREFIX}${resolveSiteToneKey(hostname)}`;
  };
  const getSiteFusionStyles = (C) => `
    /* ============================================================
       SITE VISUAL FUSION (5 HOSTS)
       ============================================================ */

    :root {
        --fc2-host-bg-rgb: 16, 18, 22;
        --fc2-host-bg-luma: 21;

        --fc2-site-card-rgb: 31, 34, 41;
        --fc2-site-card-alt-rgb: 24, 28, 35;
        --fc2-site-toolbar-rgb: 24, 27, 34;
        --fc2-site-accent-rgb: 165, 178, 198;

        --fc2-site-card-alpha: 0.9;
        --fc2-site-card-alt-alpha: 0.84;
        --fc2-site-toolbar-alpha: 0.96;
        --fc2-site-border-alpha: 0.22;

        --fc2-bg: rgb(var(--fc2-host-bg-rgb));
        --fc2-surface: rgba(var(--fc2-site-card-rgb), var(--fc2-site-card-alpha));
        --fc2-surface-item: rgba(var(--fc2-site-card-alt-rgb), var(--fc2-site-card-alt-alpha));
        --fc2-surface-float: rgba(var(--fc2-site-toolbar-rgb), var(--fc2-site-toolbar-alpha));
        --fc2-border: rgba(var(--fc2-site-accent-rgb), var(--fc2-site-border-alpha));
        --fc2-accent-grad: linear-gradient(
            145deg,
            rgba(var(--fc2-site-accent-rgb), var(--fc2-opacity-strong)),
            rgba(var(--fc2-site-card-rgb), var(--fc2-opacity-muted))
        );
        --fc2-magnet-grad: linear-gradient(
            145deg,
            rgba(var(--fc2-site-accent-rgb), var(--fc2-opacity-strong)),
            rgba(var(--fc2-site-card-alt-rgb), var(--fc2-opacity-muted))
        );
    }

    :root.${SITE_TONE_CLASS_PREFIX}fc2ppvdb {
        --fc2-site-card-rgb: 22, 29, 36;
        --fc2-site-card-alt-rgb: 18, 24, 31;
        --fc2-site-toolbar-rgb: 18, 24, 30;
        --fc2-site-accent-rgb: 109, 157, 222;
    }

    :root.${SITE_TONE_CLASS_PREFIX}fc2db {
        --fc2-site-card-rgb: 31, 26, 27;
        --fc2-site-card-alt-rgb: 26, 22, 23;
        --fc2-site-toolbar-rgb: 25, 21, 22;
        --fc2-site-accent-rgb: 183, 110, 121;
    }

    :root.${SITE_TONE_CLASS_PREFIX}fd2ppv {
        --fc2-site-card-rgb: 35, 28, 24;
        --fc2-site-card-alt-rgb: 30, 24, 20;
        --fc2-site-toolbar-rgb: 29, 24, 20;
        --fc2-site-accent-rgb: 228, 174, 104;
    }

    :root.${SITE_TONE_CLASS_PREFIX}javdb {
        --fc2-site-card-rgb: 31, 34, 24;
        --fc2-site-card-alt-rgb: 27, 30, 20;
        --fc2-site-toolbar-rgb: 26, 29, 20;
        --fc2-site-accent-rgb: 203, 176, 103;
    }

    :root.${SITE_TONE_CLASS_PREFIX}missav {
        --fc2-site-card-rgb: 23, 31, 38;
        --fc2-site-card-alt-rgb: 19, 27, 34;
        --fc2-site-toolbar-rgb: 20, 27, 34;
        --fc2-site-accent-rgb: 119, 166, 216;
    }

    :root.${SITE_TONE_CLASS_PREFIX}supjav {
        --fc2-site-card-rgb: 35, 29, 26;
        --fc2-site-card-alt-rgb: 30, 24, 21;
        --fc2-site-toolbar-rgb: 30, 24, 21;
        --fc2-site-accent-rgb: 212, 142, 117;
    }

    :root.${SITE_TONE_CLASS_PREFIX}javfc2 {
        --fc2-site-card-rgb: 24, 26, 31;
        --fc2-site-card-alt-rgb: 18, 20, 24;
        --fc2-site-toolbar-rgb: 16, 18, 22;
        --fc2-site-accent-rgb: 0, 136, 204;
    }

    :root.fc2-light-theme {
        --fc2-host-bg-rgb: 246, 247, 249;

        --fc2-site-card-rgb: 251, 251, 253;
        --fc2-site-card-alt-rgb: 245, 247, 250;
        --fc2-site-toolbar-rgb: 255, 255, 255;
        --fc2-site-accent-rgb: 92, 109, 132;

        --fc2-site-card-alpha: 0.94;
        --fc2-site-card-alt-alpha: 0.9;
        --fc2-site-toolbar-alpha: 0.98;
        --fc2-site-border-alpha: 0.26;
    }

    :root.fc2-light-theme.${SITE_TONE_CLASS_PREFIX}fc2ppvdb {
        --fc2-site-card-rgb: 244, 248, 253;
        --fc2-site-card-alt-rgb: 239, 244, 250;
        --fc2-site-accent-rgb: 74, 114, 172;
    }

    :root.fc2-light-theme.${SITE_TONE_CLASS_PREFIX}fc2db {
        --fc2-site-card-rgb: 253, 248, 249;
        --fc2-site-card-alt-rgb: 250, 243, 244;
        --fc2-site-accent-rgb: 183, 110, 121;
    }

    :root.fc2-light-theme.${SITE_TONE_CLASS_PREFIX}fd2ppv {
        --fc2-site-card-rgb: 252, 246, 240;
        --fc2-site-card-alt-rgb: 248, 240, 232;
        --fc2-site-accent-rgb: 170, 118, 74;
    }

    :root.fc2-light-theme.${SITE_TONE_CLASS_PREFIX}javdb {
        --fc2-site-card-rgb: 255, 255, 255;
        --fc2-site-card-alt-rgb: 248, 249, 250;
        --fc2-site-accent-rgb: 50, 152, 220;
    }

    :root.fc2-light-theme.${SITE_TONE_CLASS_PREFIX}missav {
        --fc2-site-card-rgb: 244, 248, 252;
        --fc2-site-card-alt-rgb: 238, 243, 249;
        --fc2-site-accent-rgb: 82, 122, 166;
    }

    :root.fc2-light-theme.${SITE_TONE_CLASS_PREFIX}supjav {
        --fc2-site-card-rgb: 252, 246, 244;
        --fc2-site-card-alt-rgb: 247, 239, 236;
        --fc2-site-accent-rgb: 162, 102, 86;
    }

    .${C.cardRebuilt},
    .${C.processedCard}:not(.is-minimal) {
        box-shadow:
            0 10px 24px rgba(var(--fc2-host-bg-rgb), 0.28),
            var(--fc2-shadow-sm);
        background-image: linear-gradient(
            165deg,
            rgba(var(--fc2-site-card-rgb), var(--fc2-site-card-alpha)) 0%,
            rgba(var(--fc2-site-card-alt-rgb), var(--fc2-site-card-alt-alpha)) 100%
        );
    }

    .${C.processedCard}.is-detail .${C.infoArea} {
        background-image: linear-gradient(
                150deg,
                rgba(var(--fc2-site-accent-rgb), var(--fc2-opacity-ghost)),
                rgba(var(--fc2-site-toolbar-rgb), var(--fc2-site-toolbar-alpha))
            ),
            linear-gradient(
                180deg,
                rgba(var(--fc2-site-toolbar-rgb), var(--fc2-site-toolbar-alpha)),
                rgba(var(--fc2-site-card-alt-rgb), var(--fc2-opacity-muted))
            );
        border-color: rgba(var(--fc2-site-accent-rgb), var(--fc2-site-border-alpha));
    }

    .${C.videoPreviewContainer} {
        background: rgba(var(--fc2-host-bg-rgb), 0.94);
    }

    .enh-toolbar {
        background-color: rgba(var(--fc2-site-toolbar-rgb), var(--fc2-site-toolbar-alpha));
        border: 1px solid rgba(var(--fc2-site-accent-rgb), var(--fc2-site-border-alpha));
        border-radius: var(--fc2-radius-md);
    }

    /* Site Specific Card Ratio Adjustments */
    :root.${SITE_TONE_CLASS_PREFIX}fc2db .${C.videoPreviewContainer} {
        aspect-ratio: 71 / 100;
    }

    :root.${SITE_TONE_CLASS_PREFIX}fc2db .${C.videoPreviewContainer} img {
        object-fit: cover !important;
    }

    :root.${SITE_TONE_CLASS_PREFIX}javdb .${C.videoPreviewContainer} {
        aspect-ratio: var(--fc2-javdb-cover-ratio, 2 / 3);
    }

    :root.${SITE_TONE_CLASS_PREFIX}javdb .${C.videoPreviewContainer} img {
        object-fit: contain !important;
    }

    /* JavFC2 Carousel & Layout Fixes */
    :root.${SITE_TONE_CLASS_PREFIX}javfc2 .owl-carousel,
    :root.${SITE_TONE_CLASS_PREFIX}javfc2 .owl-stage-outer {
        overflow: hidden !important;
    }

    :root.${SITE_TONE_CLASS_PREFIX}javfc2 .owl-item {
        overflow: visible !important;
    }

    :root.${SITE_TONE_CLASS_PREFIX}javfc2 .owl-item .${C.infoArea} {
        background-color: rgba(var(--fc2-site-card-alt-rgb), 0.96) !important;
    }

    :root.${SITE_TONE_CLASS_PREFIX}javfc2 .owl-item .${C.customTitle} {
        font-size: var(--fc2-text-xs) !important;
        max-height: 2.8em !important;
        margin-bottom: var(--fc2-space-sm) !important;
        display: -webkit-box !important;
        -webkit-line-clamp: 2 !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
    }

    :root.${SITE_TONE_CLASS_PREFIX}javfc2 .owl-item .${C.cardActionRow} {
        gap: var(--fc2-space-xs) !important;
        flex-wrap: wrap !important;
        justify-content: center !important;
    }

    :root.${SITE_TONE_CLASS_PREFIX}javfc2 .owl-item .en-pill-btn {
        padding: 2px var(--fc2-space-sm) !important;
        font-size: var(--fc2-text-xs) !important;
        min-width: var(--fc2-btn-height-xs) !important;
    }

    :root.${SITE_TONE_CLASS_PREFIX}javfc2 .owl-item .${C.cardMeta} {
        display: none !important;
    }

    :root.${SITE_TONE_CLASS_PREFIX}javfc2 .${C.processedCard} {
        box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
        height: auto !important;
    }

    :root.${SITE_TONE_CLASS_PREFIX}javfc2 .${C.videoPreviewContainer} {
        aspect-ratio: 3 / 4 !important;
    }

    :root.${SITE_TONE_CLASS_PREFIX}javfc2 .${C.videoPreviewContainer} img {
        object-fit: cover !important;
    }

    :root.${SITE_TONE_CLASS_PREFIX}javfc2 .${C.infoArea} {
        padding: var(--fc2-space-sm) !important;
    }

    :root.${SITE_TONE_CLASS_PREFIX}javfc2 .${C.customTitle} {
        font-size: var(--fc2-text-xs) !important;
        line-height: 1.4 !important;
        height: 2.8em !important;
    }

    /* Fix double borders on JAVFC2 replaced cards */
    :root.${SITE_TONE_CLASS_PREFIX}javfc2 .${C.cardRebuilt} {
        background: none !important;
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
    }

    /* Mobile and narrow screen optimizations */
    @media (max-width: 640px) {
        :root.${SITE_TONE_CLASS_PREFIX}javfc2 .owl-item .${C.infoArea} {
            min-height: 90px !important;
            padding: var(--fc2-space-xs) !important;
        }
        :root.${SITE_TONE_CLASS_PREFIX}javfc2 .owl-item .${C.customTitle} {
            font-size: var(--fc2-text-xs) !important;
            height: 2.6em !important;
            margin-bottom: var(--fc2-space-xs) !important;
        }
        :root.${SITE_TONE_CLASS_PREFIX}javfc2 .owl-item .en-pill-btn {
            font-size: 9px !important;
            padding: 1px 4px !important;
        }
    }
`;

  const getAnimations = (C) => `
    /* ============================================================
       GLOBAL ANIMATIONS
       ============================================================ */

    /* Generic Fade & Slide In */
    @keyframes fc2-fade-in {
        from {
            opacity: 0;
            transform: translateY(var(--fc2-space-sm));
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* Master Reveal Animation for Cards */
    @keyframes fc2-card-reveal {
        0% { 
            opacity: 0; 
            transform: translate3d(0, var(--fc2-space-base), 0) scale(0.97);
            filter: blur(calc(var(--fc2-blur) / 3));
        }
        100% { 
            opacity: 1; 
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0);
        }
    }

    @keyframes fc2-content-reveal {
        0% { 
            opacity: 0; 
            transform: translate3d(0, 0, 0);
        }
        100% { 
            opacity: 1; 
            transform: translate3d(0, 0, 0);
        }
    }

    /* Core Spinner */
    @keyframes fc2-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    @keyframes fc2-shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
    }

    @keyframes fc2-skeleton-pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
    }

    /* Pulse Effects */
    @keyframes fc2-pulse {
        0% { box-shadow: 0 0 0 0 rgba(var(--fc2-primary-rgb), 0.4); }
        70% { box-shadow: 0 0 0 var(--fc2-space-sm) rgba(var(--fc2-primary-rgb), 0); }
        100% { box-shadow: 0 0 0 0 rgba(var(--fc2-primary-rgb), 0); }
    }

    @keyframes fc2-pulse-sync {
        0% {
            transform: scale(0.8);
            opacity: 0.6;
        }
        50% {
            transform: scale(1.1);
            opacity: 1;
        }
        100% {
            transform: scale(0.8);
            opacity: 0.6;
        }
    }

    @keyframes fc2-pulse-once {
        0% { transform: scale(1); }
        50% {
            transform: scale(1.15);
            background: var(--fc2-primary);
            color: var(--fc2-on-primary);
        }
        100% { transform: scale(1); }
    }

    /* UI Logic Specific */
    @keyframes fc2-copy-success {
        0% { transform: scale(1); }
        50% {
            transform: scale(1.1);
            background: var(--fc2-success);
        }
        100% { transform: scale(1); }
    }

    @keyframes fc2-magnet-in {
        0% {
            transform: scale(0.3) translateY(var(--fc2-space-lg));
            opacity: 0;
            filter: blur(calc(var(--fc2-blur) / 2));
        }
        60% {
            transform: scale(1.1) translateY(calc(-1 * var(--fc2-space-xs)));
            filter: blur(0);
        }
        85% {
            transform: scale(0.95) translateY(var(--fc2-border-width));
        }
        100% {
            transform: scale(1) translateY(0);
            opacity: 1;
        }
    }

    @keyframes fc2-pop-in {
        0% {
            opacity: 0;
            transform: translate(-50%, -45%) scale(0.92);
            filter: blur(var(--fc2-blur));
        }
        70% {
            transform: translate(-50%, -51%) scale(1.02);
            filter: blur(0);
        }
        100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
    }

    @keyframes fc2-ripple {
        0% {
            opacity: 0.24;
            transform: translate(-50%, -50%) scale(0.72);
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.32);
        }
    }

    /* Gallery & Media Animations */
    @keyframes fc2-gallery-zoom {
        0% { opacity: 0; transform: scale(0.95); }
        100% { opacity: 1; transform: scale(1); }
    }

    @keyframes fc2-slide-right-in {
        0% { opacity: 0; transform: translateX(var(--fc2-space-xl)); }
        100% { opacity: 1; transform: translateX(0); }
    }

    @keyframes fc2-slide-left-in {
        0% { opacity: 0; transform: translateX(calc(-1 * var(--fc2-space-xl))); }
        100% { opacity: 1; transform: translateX(0); }
    }


    @keyframes fc2-animate-pop {
        0% { transform: scale(1); }
        50% { transform: scale(1.25); }
        100% { transform: scale(1); }
    }

    @keyframes fc2-star-burst {
        0% { transform: scale(0); opacity: 1; }
        100% { transform: scale(2.5); opacity: 0; }
    }

    @keyframes fc2-glow-pulse {
        0% { filter: drop-shadow(0 0 var(--fc2-border-width) var(--fc2-primary)); }
        50% { filter: drop-shadow(0 0 var(--fc2-space-sm) var(--fc2-primary)); }
        100% { filter: drop-shadow(0 0 var(--fc2-border-width) var(--fc2-primary)); }
    }

    /* Toast Animations */
    @keyframes fc2-toast-in {
        from {
            opacity: 0;
            transform: translateX(var(--fc2-space-xl)) scale(0.95);
            filter: blur(var(--fc2-border-width));
        }
        to {
            opacity: 1;
            transform: translateX(0) scale(1);
            filter: blur(0);
        }
    }

    @keyframes fc2-toast-out {
        from {
            opacity: 1;
            transform: translateX(0) scale(1);
        }
        to {
            opacity: 0;
            transform: translateX(var(--fc2-space-xl)) scale(0.95);
        }
    }

    /* Helper Classes */
    .pulse-once {
        animation: fc2-pulse-once var(--fc2-motion-base) var(--fc2-ease-out);
    }
    .fc2-animate-pop {
        animation: fc2-animate-pop 0.3s var(--fc2-ease-out);
    }
    .fc2-star-burst::after {
        content: '';
        position: absolute;
        inset: calc(-1 * var(--fc2-space-sm));
        border: var(--fc2-border-width) solid var(--fc2-primary);
        border-radius: var(--fc2-radius-full);
        animation: fc2-star-burst var(--fc2-motion-base) ease-out forwards;
        pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
        :is(
            #fc2-modern-ui-host,
            #fc2-enh-settings-host,
            #fc2-enh-settings-container,
            .fc2-enh-settings-panel,
            .fc2-enh-modal-overlay,
            .enh-modal-panel,
            .fc2-action-sheet,
            .fc2-collection-grid,
            .fc2-collection-toolbar,
            .fc2-fab-container,
            .enh-toolbar,
            .enh-viewer-backdrop,
            .${C.cardRebuilt},
            .${C.processedCard}
        ),
        :is(
            #fc2-modern-ui-host,
            #fc2-enh-settings-host,
            #fc2-enh-settings-container,
            .fc2-enh-settings-panel,
            .fc2-enh-modal-overlay,
            .enh-modal-panel,
            .fc2-action-sheet,
            .fc2-collection-grid,
            .fc2-collection-toolbar,
            .fc2-fab-container,
            .enh-toolbar,
            .enh-viewer-backdrop,
            .${C.cardRebuilt},
            .${C.processedCard}
        ) *,
        :is(
            #fc2-modern-ui-host,
            #fc2-enh-settings-host,
            #fc2-enh-settings-container,
            .fc2-enh-settings-panel,
            .fc2-enh-modal-overlay,
            .enh-modal-panel,
            .fc2-action-sheet,
            .fc2-collection-grid,
            .fc2-collection-toolbar,
            .fc2-fab-container,
            .enh-toolbar,
            .enh-viewer-backdrop,
            .${C.cardRebuilt},
            .${C.processedCard}
        ) *::before,
        :is(
            #fc2-modern-ui-host,
            #fc2-enh-settings-host,
            #fc2-enh-settings-container,
            .fc2-enh-settings-panel,
            .fc2-enh-modal-overlay,
            .enh-modal-panel,
            .fc2-action-sheet,
            .fc2-collection-grid,
            .fc2-collection-toolbar,
            .fc2-fab-container,
            .enh-toolbar,
            .enh-viewer-backdrop,
            .${C.cardRebuilt},
            .${C.processedCard}
        ) *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
        }

        :is(
            #fc2-modern-ui-host,
            #fc2-enh-settings-host,
            #fc2-enh-settings-container,
            .fc2-enh-settings-panel,
            .fc2-enh-modal-overlay,
            .enh-modal-panel,
            .fc2-action-sheet,
            .fc2-collection-grid,
            .fc2-collection-toolbar,
            .fc2-fab-container,
            .enh-toolbar,
            .enh-viewer-backdrop,
            .${C.cardRebuilt},
            .${C.processedCard}
        ) :is(
            .fc2-tab-content-wrapper,
            .enh-modal-panel,
            .fc2-enh-btn,
            .fc2-btn,
            .fc2-fab-btn,
            .fc2-fab-trigger,
            .${C.resourceBtn},
            .btn-actress,
            .enh-viewer-stage img,
            .enh-viewer-stage video
        ) {
            transform: none !important;
            filter: none !important;
        }
    }
`;

  const getBaseStyles = (C) => `
    /* ============================================================
       CSS RESET & GLOBAL OVERRIDES
       ============================================================ */

    .fc2-enh-settings-panel,
    .fc2-enh-modal-overlay,
    .enh-modal-panel,
    .fc2-action-sheet,
    .${C.cardActionRow},
    .fc2-fab-container {
        all: revert;
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent !important;
        -webkit-touch-callout: none !important;
        transition: background-color var(--fc2-motion-slow) var(--fc2-ease-standard), 
                    color var(--fc2-motion-slow) var(--fc2-ease-standard), 
                    border-color var(--fc2-motion-slow) var(--fc2-ease-standard),
                    box-shadow var(--fc2-motion-slow) var(--fc2-ease-standard);
    }

    .fc2-enh-settings-panel *:not(svg):not(path):not(circle):not(rect):not(line):not(polyline):not(polygon),
    .fc2-enh-settings-panel *:not(svg):not(path):not(circle):not(rect):not(line):not(polyline):not(polygon),
    .enh-modal-panel *:not(svg):not(path):not(circle):not(rect):not(line):not(polyline):not(polygon),
    .fc2-fab-container *:not(svg):not(path):not(circle):not(rect):not(line):not(polyline):not(polygon),
    .fc2-action-sheet *:not(svg):not(path):not(circle):not(rect):not(line):not(polyline):not(polygon),
    .${C.cardActionRow} *:not(svg):not(path):not(circle):not(rect):not(line):not(polyline):not(polygon) {
        box-sizing: border-box;
        font-family: var(--fc2-font) !important;
        font-size: var(--fc2-text-base) !important;
        font-style: normal !important;
        line-height: var(--fc2-line-base) !important;
        letter-spacing: normal !important;
        text-transform: none !important;
        color: var(--fc2-text);
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
    }

    /* Icons Visibility Fix */
    .fc2-enh-settings-panel svg,
    .fc2-enh-settings-panel .fc2-icon,
    .fc2-fab-container svg,
    .fc2-fab-container .fc2-icon {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        vertical-align: middle !important;
        color: inherit;
    }

    /* Headings */
    .fc2-enh-settings-panel h2,
    .fc2-enh-settings-panel h3,
    .fc2-enh-settings-panel h4 {
        margin: 0 !important;
        padding: 0 !important;
        font-weight: var(--fc2-font-semibold) !important;
    }

    .fc2-enh-settings-panel h2 { font-size: var(--fc2-text-xl) !important; line-height: var(--fc2-line-tight) !important; }
    .fc2-enh-settings-panel h3 { font-size: var(--fc2-text-lg) !important; line-height: var(--fc2-line-tight) !important; }
    .fc2-enh-settings-panel h4 { font-size: var(--fc2-text-base) !important; line-height: var(--fc2-line-base) !important; }

    /* Forms & Controls */
    .fc2-enh-settings-panel label,
    .fc2-enh-settings-panel input,
    .fc2-enh-settings-panel select,
    .fc2-enh-settings-panel button {
        font-size: var(--fc2-text-sm);
        line-height: var(--fc2-line-base) !important;
    }

    /* ============================================================
       SELECT DROPDOWN STYLES
       ============================================================ */

    .fc2-enh-settings-panel select,
    .fc2-enh-settings-panel .fc2-select {
        display: inline-block !important;
        min-height: var(--fc2-btn-height-md) !important;
        padding: var(--fc2-space-xs) var(--fc2-space-xl) var(--fc2-space-xs) var(--fc2-space-sm) !important;
        background-color: var(--fc2-bg) !important;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 512'%3E%3Cpath fill='%239494a0' d='M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z'/%3E%3C/svg%3E") !important;
        background-repeat: no-repeat !important;
        background-position: right var(--fc2-space-sm) center !important;
        background-size: var(--fc2-btn-pad-xs) !important;
        color: var(--fc2-text) !important;
        border: var(--fc2-border-width) solid var(--fc2-border) !important;
        border-radius: var(--fc2-radius-sm) !important;
        cursor: pointer !important;
        appearance: none !important;
        -webkit-appearance: none !important;
        color-scheme: light dark !important;
        transition: all var(--fc2-motion-fast) var(--fc2-ease-standard);
    }

    .fc2-enh-settings-panel select:hover {
        border-color: var(--fc2-text-dim) !important;
        background-color: rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle)) !important;
    }

    .fc2-enh-settings-panel select:focus {
        outline: none !important;
        border-color: var(--fc2-primary) !important;
        box-shadow: var(--fc2-focus-ring) !important;
    }

    .fc2-enh-settings-panel select option {
        padding: var(--fc2-space-xs) var(--fc2-space-sm) !important;
        background: var(--fc2-bg) !important;
        color: var(--fc2-text) !important;
    }

    .fc2-enh-settings-panel select option:checked,
    .fc2-enh-settings-panel select option:hover {
        background: var(--fc2-primary) !important;
        color: var(--fc2-on-primary) !important;
    }

    /* ============================================================
       SCROLLBAR & UTILITIES
       ============================================================ */

    /* Scoped Scrollbar */
    :is(
        #fc2-modern-ui-host,
        #fc2-enh-settings-host,
        #fc2-enh-settings-container,
        .fc2-enh-settings-panel,
        .fc2-enh-modal-overlay,
        .enh-modal-panel,
        .fc2-action-sheet,
        .fc2-fab-container,
        .enh-toolbar,
        .enh-viewer-backdrop,
        .${C.cardRebuilt},
        .${C.cardActionRow},
        .${C.infoArea}
    )::-webkit-scrollbar,
    :is(
        #fc2-modern-ui-host,
        #fc2-enh-settings-host,
        #fc2-enh-settings-container,
        .fc2-enh-settings-panel,
        .fc2-enh-modal-overlay,
        .enh-modal-panel,
        .fc2-action-sheet,
        .fc2-fab-container,
        .enh-toolbar,
        .enh-viewer-backdrop,
        .${C.cardRebuilt},
        .${C.cardActionRow},
        .${C.infoArea}
    ) *::-webkit-scrollbar {
        width: calc(var(--fc2-space-sm) - var(--fc2-space-xxs));
        height: calc(var(--fc2-space-sm) - var(--fc2-space-xxs));
    }

    :is(
        #fc2-modern-ui-host,
        #fc2-enh-settings-host,
        #fc2-enh-settings-container,
        .fc2-enh-settings-panel,
        .fc2-enh-modal-overlay,
        .enh-modal-panel,
        .fc2-action-sheet,
        .fc2-fab-container,
        .enh-toolbar,
        .enh-viewer-backdrop,
        .${C.cardRebuilt},
        .${C.cardActionRow},
        .${C.infoArea}
    )::-webkit-scrollbar-track,
    :is(
        #fc2-modern-ui-host,
        #fc2-enh-settings-host,
        #fc2-enh-settings-container,
        .fc2-enh-settings-panel,
        .fc2-enh-modal-overlay,
        .enh-modal-panel,
        .fc2-action-sheet,
        .fc2-fab-container,
        .enh-toolbar,
        .enh-viewer-backdrop,
        .${C.cardRebuilt},
        .${C.cardActionRow},
        .${C.infoArea}
    ) *::-webkit-scrollbar-track {
        background: transparent;
    }

    :is(
        #fc2-modern-ui-host,
        #fc2-enh-settings-host,
        #fc2-enh-settings-container,
        .fc2-enh-settings-panel,
        .fc2-enh-modal-overlay,
        .enh-modal-panel,
        .fc2-action-sheet,
        .fc2-fab-container,
        .enh-toolbar,
        .enh-viewer-backdrop,
        .${C.cardRebuilt},
        .${C.cardActionRow},
        .${C.infoArea}
    )::-webkit-scrollbar-thumb,
    :is(
        #fc2-modern-ui-host,
        #fc2-enh-settings-host,
        #fc2-enh-settings-container,
        .fc2-enh-settings-panel,
        .fc2-enh-modal-overlay,
        .enh-modal-panel,
        .fc2-action-sheet,
        .fc2-fab-container,
        .enh-toolbar,
        .enh-viewer-backdrop,
        .${C.cardRebuilt},
        .${C.cardActionRow},
        .${C.infoArea}
    ) *::-webkit-scrollbar-thumb {
        background: var(--fc2-scrollbar-thumb) !important;
        border-radius: var(--fc2-btn-radius);
    }

    :is(
        #fc2-modern-ui-host,
        #fc2-enh-settings-host,
        #fc2-enh-settings-container,
        .fc2-enh-settings-panel,
        .fc2-enh-modal-overlay,
        .enh-modal-panel,
        .fc2-action-sheet,
        .fc2-fab-container,
        .enh-toolbar,
        .enh-viewer-backdrop,
        .${C.cardRebuilt},
        .${C.cardActionRow},
        .${C.infoArea}
    )::-webkit-scrollbar-thumb:hover,
    :is(
        #fc2-modern-ui-host,
        #fc2-enh-settings-host,
        #fc2-enh-settings-container,
        .fc2-enh-settings-panel,
        .fc2-enh-modal-overlay,
        .enh-modal-panel,
        .fc2-action-sheet,
        .fc2-fab-container,
        .enh-toolbar,
        .enh-viewer-backdrop,
        .${C.cardRebuilt},
        .${C.cardActionRow},
        .${C.infoArea}
    ) *::-webkit-scrollbar-thumb:hover {
        background: var(--fc2-scrollbar-hover) !important;
    }

    /* Functional Hide Classes */
    .${C.hideNoMagnet}, 
    .${C.hideCensored}, 
    .${C.hideViewed},
    .is-hidden {
        display: none !important;
    }

    [data-enh-grid-container] > *:has(.${C.hideNoMagnet}),
    [data-enh-grid-container] > *:has(.${C.hideCensored}),
    [data-enh-grid-container] > *:has(.${C.hideViewed}) {
        display: none !important;
    }

    .is-invisible {
        visibility: hidden !important;
    }

    body.fc2-settings-open {
        overflow: hidden !important;
    }

    .fc2-ml-sm {
        margin-left: var(--fc2-space-sm) !important;
    }

    #fc2-enh-settings-host {
        position: fixed;
        inset: 0;
        z-index: var(--fc2-z-settings);
    }

    #fc2-enh-settings-container {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--fc2-font);
        padding: var(--fc2-space-md);
    }
`;

  const base = (_C) => `
    /* ============================================================
       BASE COMPONENTS & RESET
       ============================================================ */

    /* Global Mono Penetration for industrial feel */
    .fc2-stat-value,
    .fc2-id-badge,
    .fc2-stat-label,
    .fc2-password-wrapper input,
    #debug-log-list {
        font-family:var(--fc2-font-mono)!important;
        letter-spacing:-0.02em;
    }

    *,::before,::after {
        box-sizing:border-box;
    }

    .fc2-icon {
        display:inline-flex;
        align-items:center;
        justify-content:center;
        width:1em;
        height:1em;
        vertical-align:-0.125em;
    }

    .fc2-icon svg {
        width:100%;
        height:100%;
        fill:currentColor;
    }

    .fc2-icon-dropdown-caret {
        display:inline-flex;
        margin-left:var(--fc2-space-xs);
        opacity: var(--fc2-opacity-dim);
        font-size: var(--fc2-text-xs);
        width:1em;
        height:1em;
    }

    .fc2-icon-dropdown-caret svg {
        fill:currentColor;
    }

    .dim {
        opacity: var(--fc2-opacity-dim);
        color:var(--fc2-text-muted);
    }

    /* ── Utility Classes ───────────────────────────────────────── */

    .fc2-mt-sm { margin-top: var(--fc2-space-sm); }
    .fc2-gap-sm { gap: var(--fc2-space-sm); }
`;

  const toast = (_C) => `
    /* ============================================================
       TOAST NOTIFICATIONS
       ============================================================ */

    .fc2-toast-container {
        position:fixed;
        top:var(--fc2-space-md);
        right:var(--fc2-space-md);
        z-index:var(--fc2-z-toast);
        display:flex;
        flex-direction:column;
        gap:var(--fc2-space-sm);
        pointer-events:none;
    }

    .fc2-toast-item {
        position:relative;
        display:flex;
        align-items:center;
        min-width:var(--fc2-layout-toast-min-width);
        max-width:var(--fc2-layout-toast-max-width);
        padding:var(--fc2-space-sm) var(--fc2-space-md);
        background:var(--fc2-surface-float);
        color:var(--fc2-text);
        border-radius:var(--fc2-radius-md);
        box-shadow:var(--fc2-shadow-lg);
        font-size: var(--fc2-text-base);
        font-weight: var(--fc2-font-medium);
        backdrop-filter:blur(var(--fc2-blur));
        -webkit-backdrop-filter:blur(var(--fc2-blur));
        border: var(--fc2-border-width) solid var(--fc2-border);
        opacity:0;
        pointer-events:auto;
        animation:fc2-toast-in var(--fc2-motion-base) var(--fc2-ease-out) forwards;
    }

    .fc2-toast-item.hiding {
        animation:fc2-toast-out var(--fc2-motion-slow) var(--fc2-ease-standard) forwards;
    }

    .fc2-toast-icon {
        display:flex;
        align-items:center;
        justify-content:center;
        font-size: var(--fc2-text-xl);
        margin-right:var(--fc2-space-sm);
        flex-shrink:0;
    }

    .fc2-toast-content {
        flex-grow:1;
        line-height:1.4;
        word-break:break-word;
        overflow:hidden;
    }

    .fc2-toast-close {
        background:none;
        border:none;
        color:var(--fc2-text-dim);
        cursor:pointer;
        padding:var(--fc2-space-xs);
        margin-left:var(--fc2-space-sm);
        border-radius:var(--fc2-radius-full);
        transition:all var(--fc2-motion-fast);
        display:flex;
        align-items:center;
    }

    .fc2-toast-close:hover {
        background:var(--fc2-surface-item);
        color:var(--fc2-text);
    }

    .fc2-toast-close:focus-visible {
        outline:calc(var(--fc2-border-width) * 2) solid var(--fc2-primary);
        outline-offset:var(--fc2-space-xxs);
    }

    .fc2-toast-progress {
        position:absolute;
        bottom:0;
        left:0;
        height:var(--fc2-space-xxs);
        width:100%;
        transform-origin:left;
    }

    .toast-success { border-left:var(--fc2-space-xs) solid var(--fc2-success); }
    .toast-success.fc2-toast-icon { color:var(--fc2-success); }
    .toast-error { border-left:var(--fc2-space-xs) solid var(--fc2-danger); }
    .toast-error.fc2-toast-icon { color:var(--fc2-danger); }
    .toast-warn { border-left:var(--fc2-space-xs) solid var(--fc2-warn); }
    .toast-warn.fc2-toast-icon { color:var(--fc2-warn); }
    .toast-info { border-left:var(--fc2-space-xs) solid var(--fc2-info); }
    .toast-info.fc2-toast-icon { color:var(--fc2-info); }

    @keyframes fc2-toast-shrink {
        from { width:100%; }
        to { width:0%; }
    }

    .fc2-toast-action {
        margin-left:var(--fc2-space-sm);
        padding:var(--fc2-space-xxs) var(--fc2-space-sm);
        background:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle));
        border:var(--fc2-border-width) solid rgba(var(--fc2-primary-rgb),var(--fc2-opacity-20));
        border-radius:var(--fc2-radius-sm);
        color:var(--fc2-primary);
        font-size:var(--fc2-text-xs);
        font-weight: var(--fc2-font-semibold);
        cursor:pointer;
        transition:all var(--fc2-motion-fast);
    }

    .fc2-toast-action:hover {
        background:var(--fc2-primary);
        color:var(--fc2-on-primary);
        border-color:transparent;
    }
`;

  const fab = (_C) => `
    /* ============================================================
       ELEGANT FAB (UNIFIED)
       ============================================================ */

    .fc2-fab-container {
        position:fixed;
        bottom: var(--fc2-space-lg);
        right: var(--fc2-space-lg);
        z-index:var(--fc2-z-fab);
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:flex-end;
        gap: var(--fc2-space-base);
        pointer-events:none;
        max-height:90vh;
    }

    .fc2-fab-trigger,
    .fc2-fab-actions {
        pointer-events:auto;
    }

    .fc2-fab-trigger {
        display:flex;
        align-items:center;
        justify-content:center;
        width:calc(var(--fc2-space-lg) + var(--fc2-space-lg));
        height:calc(var(--fc2-space-lg) + var(--fc2-space-lg));
        background:var(--fc2-accent-grad);
        color:var(--fc2-text);
        border:var(--fc2-liquid-border);
        border-radius: var(--fc2-radius-full);
        box-shadow:var(--fc2-shadow),var(--fc2-rim-light);
        font-size: var(--fc2-text-xl);
        cursor:pointer;
        transition:all var(--fc2-motion-base) var(--fc2-ease-out);
        touch-action:none;
        -webkit-tap-highlight-color:transparent;
        will-change:transform;
        backdrop-filter:blur(var(--fc2-blur));
    }

    .fc2-fab-trigger:hover {
        transform:scale(1.12);
        box-shadow:var(--fc2-shadow);
    }

    .fc2-fab-trigger:active {
        transform:scale(0.92);
    }

    .fc2-fab-trigger.active {
        transform:rotate(135deg);
        background:var(--fc2-primary);
        color:var(--fc2-on-primary);
        animation:fc2-float 3s ease-in-out infinite;
    }

    .fc2-fab-trigger.active:hover {
        transform:scale(1.1) rotate(135deg);
        animation-play-state:paused;
    }

    .fc2-fab-actions {
        display:flex;
        flex-direction:column;
        gap:var(--fc2-space-base);
        opacity:0;
        transform:translateY(var(--fc2-space-lg)) scale(0.8);
        pointer-events:none;
        transition:all var(--fc2-motion-slow) var(--fc2-ease-out);
        max-height:60vh;
        width:calc(var(--fc2-space-2xl) + var(--fc2-space-lg));
        overflow-y:auto!important;
        overflow-x:hidden;
        padding: var(--fc2-space-sm);
        margin-bottom: var(--fc2-space-sm);
        background:var(--fc2-liquid-bg);
        backdrop-filter:blur(var(--fc2-blur)) saturate(var(--fc2-glass-saturate));
        -webkit-backdrop-filter:blur(var(--fc2-blur)) saturate(var(--fc2-glass-saturate));
        border:var(--fc2-liquid-border);
        box-shadow:var(--fc2-shadow),var(--fc2-rim-light);
        border-radius:var(--fc2-radius-lg);
        scrollbar-width:thin;
        scrollbar-color:var(--fc2-primary) transparent;
        touch-action:pan-y;
        position:relative;
    }

    .fc2-fab-actions::before {
        content:"";
        position:absolute;
        inset:0;
        background:var(--fc2-glass-noise);
        opacity:0.05;
        pointer-events:none;
        z-index:0;
    }

    .fc2-fab-actions::-webkit-scrollbar {
        width:calc(var(--fc2-space-sm) - var(--fc2-space-xxs));
        display:block!important;
    }
    .fc2-fab-actions::-webkit-scrollbar-track {
        background:transparent;
    }
    .fc2-fab-actions::-webkit-scrollbar-thumb {
        background-color:var(--fc2-primary);
        border-radius: var(--fc2-radius-full);
        border: var(--fc2-border-width) solid var(--fc2-border);
    }

    .fc2-fab-actions.visible {
        opacity:1;
        transform:translateY(0) scale(1);
        pointer-events:auto;
    }

    .fc2-fab-actions.visible .fc2-fab-btn:nth-child(1) { transition-delay:0.05s; }
    .fc2-fab-actions.visible .fc2-fab-btn:nth-child(2) { transition-delay:0.1s; }
    .fc2-fab-actions.visible .fc2-fab-btn:nth-child(3) { transition-delay:0.15s; }
    .fc2-fab-actions.visible .fc2-fab-btn:nth-child(4) { transition-delay:0.2s; }
    .fc2-fab-actions.visible .fc2-fab-btn:nth-child(5) { transition-delay:0.25s; }

    .fc2-fab-btn {
        position:relative;
        display:flex;
        align-items:center;
        justify-content:center;
        width:var(--fc2-btn-height-lg);
        height:var(--fc2-btn-height-lg);
        background:var(--fc2-surface-item);
        color:var(--fc2-text-dim);
        border: var(--fc2-border-width) solid var(--fc2-border);
        border-radius: var(--fc2-radius-full);
        font-size: var(--fc2-text-lg);
        cursor:pointer;
        transition:all var(--fc2-motion-base) var(--fc2-ease-out);
        -webkit-tap-highlight-color:transparent;
        z-index: var(--fc2-z-fab);
    }

    .fc2-fab-btn:hover {
        background:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle));
        color:var(--fc2-text);
        border-color:rgba(var(--fc2-primary-rgb),var(--fc2-opacity-20));
        transform:scale(1.15);
        box-shadow:var(--fc2-shadow-md);
    }

    .fc2-fab-btn:focus-visible,
    .fc2-fab-trigger:focus-visible {
        outline:calc(var(--fc2-border-width) * 2) solid var(--fc2-primary);
        outline-offset:var(--fc2-space-xxs);
    }

    .fc2-fab-btn.active {
        background:var(--fc2-primary);
        color:var(--fc2-on-primary);
        border-color:transparent;
        box-shadow:0 0 calc(var(--fc2-space-sm) + var(--fc2-space-base)) rgba(var(--fc2-primary-rgb),var(--fc2-opacity-40));
    }

    .fc2-fab-btn::before {
        content:attr(data-title);
        position:absolute;
        right:calc(var(--fc2-space-2xl) + var(--fc2-space-base));
        top:50%;
        visibility:hidden;
        padding:var(--fc2-space-xs) var(--fc2-space-sm);
        background:rgba(var(--fc2-black-rgb),var(--fc2-opacity-strong));
        color: var(--fc2-on-primary);
        border-radius:var(--fc2-radius-sm);
        font-size: var(--fc2-text-xs);
        white-space:nowrap;
        opacity:0;
        backdrop-filter:blur(var(--fc2-blur));
        transform:translateY(-50%) translateX(var(--fc2-space-xs));
        transition:all var(--fc2-motion-fast);
        pointer-events:none;
    }

    .fc2-fab-btn:hover::before {
        visibility:visible;
        opacity:1;
        transform:translateY(-50%) translateX(0);
    }

    .fc2-sync-dot {
        position:absolute;
        top:calc(-1 * var(--fc2-space-xxs));
        right:calc(-1 * var(--fc2-space-xxs));
        width:var(--fc2-btn-pad-xs);
        height:var(--fc2-btn-pad-xs);
        background:var(--fc2-text-muted);
        border: var(--fc2-border-width) solid var(--fc2-bg);
        border-radius: var(--fc2-radius-full);
        transition:all var(--fc2-motion-base);
    }

    .fc2-sync-dot.syncing {
        background:var(--fc2-info);
        animation:fc2-pulse-sync 1.5s infinite;
    }

    .fc2-sync-dot.success { background:var(--fc2-success); }
    .fc2-sync-dot.error { background:var(--fc2-danger); }
    .fc2-sync-dot.conflict { background:var(--fc2-warn); }
`;

  const card = (C) => `
    /* ============================================================
       CARD SYSTEM
       ============================================================ */

    .${C.cardRebuilt} {
        position:relative;
        display:flex;
        flex-direction:column;
        align-items:stretch;
        padding:0!important;
        margin:0!important;
        min-width:0;
        animation:fc2-card-reveal var(--fc2-motion-slow) var(--fc2-ease-out) backwards!important;
        will-change: transform, opacity;
        container-type:inline-size;
        container-name:card;
        transition:none!important;
    }

    .${C.cardRebuilt}.has-active-dropdown {
        z-index:var(--fc2-z-dropdown)!important;
    }

    /* Global Visibility Toggles */
    body.hide-viewed-btn .btn-toggle-view { display:none!important; }
    body.hide-id-badge .${C.fc2IdBadge} { display:none!important; }

    body.fc2-searching .${C.cardRebuilt}:not(.search-match),
    body.fc2-searching [data-enh-grid-container] > *:has(.${C.cardRebuilt}:not(.search-match)) {
        display:none!important;
    }

    body.fc2-searching .${C.cardRebuilt}.search-match {
        animation:fc2-fade-in-scale var(--fc2-motion-slow) var(--fc2-ease-out);
    }

    .${C.processedCard} {
        position:relative;
        display:flex;
        flex-direction:column;
        flex: 1 1 auto;
        min-width:0;
        height:100%;
        background:var(--fc2-surface);
        border: var(--fc2-border-width) solid var(--fc2-border);
        border-radius:var(--fc2-radius-lg);
        overflow:visible;
        transition:transform var(--fc2-motion-slow) var(--fc2-ease-out),
            box-shadow var(--fc2-motion-slow) var(--fc2-ease-out),
            border-color var(--fc2-motion-base) ease;
    }

    .${C.processedCard}:hover {
        transform:translateY(calc(-1 * var(--fc2-space-sm))) scale(1.02);
        border-color:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-dim));
        box-shadow:var(--fc2-shadow),
            0 0 0 var(--fc2-border-width) rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle));
        z-index: var(--fc2-z-dropdown);
    }

    .${C.processedCard}.has-active-dropdown,
    .${C.cardRebuilt}.has-active-dropdown {
        z-index: var(--fc2-z-tooltip) !important;
        overflow:visible!important;
    }

    .${C.processedCard}.${C.isViewed} {
        border-color:var(--fc2-accent);
    }


    /* Detail Page Poster Style (Vertical) */
    .${C.processedCard}.is-detail {
        width:100%!important;
        max-width: var(--fc2-layout-max-width)!important;
        height:auto!important;
        margin-inline:auto;
        overflow:hidden;
        box-shadow:var(--fc2-shadow-md);
    }

    .${C.processedCard}.is-detail .${C.videoPreviewContainer} {
        aspect-ratio:auto!important;
        height:auto!important;
        background:transparent!important;
        border-bottom:var(--fc2-border-width) solid var(--fc2-border);
    }

    .${C.processedCard}.is-detail .${C.videoPreviewContainer} img {
        position:static!important;
        display:block!important;
        width:100%!important;
        height:auto!important;
        object-fit:cover!important;
    }

    .${C.processedCard}.is-detail .${C.infoArea} {
        gap:var(--fc2-space-sm);
        padding:var(--fc2-space-md) var(--fc2-space-md) var(--fc2-space-lg)!important;
        margin-top:0!important;
        background:linear-gradient(180deg, rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle)), rgba(var(--fc2-primary-rgb), var(--fc2-opacity-ghost)))!important;
    }

    .${C.processedCard}.is-detail .${C.resourceLinksContainer} {
        margin-top:0!important;
        flex-wrap:wrap;
    }

    .${C.processedCard}.is-detail .${C.customTitle} {
        height:auto!important;
        min-height:0!important;
        -webkit-line-clamp:3!important;
        margin-bottom:var(--fc2-space-xs)!important;
        font-size:var(--fc2-text-lg)!important;
        line-height:var(--fc2-line-tight)!important;
    }

    .${C.processedCard}.is-detail .${C.preservedIconsContainer} {
        margin-bottom:var(--fc2-space-base);
    }

    .${C.processedCard}.is-detail .${C.cardMeta} {
        gap:var(--fc2-space-sm);
        margin-bottom:var(--fc2-space-base);
        font-size:var(--fc2-text-xs);
    }

    .${C.processedCard}.is-detail .card-meta-row,
    .${C.processedCard}.is-detail .${C.cardActionRow} {
        gap:var(--fc2-space-base);
    }

    .${C.processedCard}.is-detail .card-primary-actions,
    .${C.processedCard}.is-detail .card-secondary-actions,
    .${C.processedCard}.is-detail .${C.resourceLinksContainer} {
        min-width:0;
    }

    /* Minimal Card (Collection Tab) */
    .${C.processedCard}.is-minimal {
        height:auto!important;
        min-height:0;
        padding-top:0!important;
        aspect-ratio:auto!important;
        background:var(--fc2-surface)!important;
        border-radius:var(--fc2-radius-md)!important;
        overflow:hidden;
    }

    .${C.processedCard}.is-minimal .${C.videoPreviewContainer} {
        display:block!important;
    }

    .${C.processedCard}.is-minimal .card-top-right-controls {
        top: var(--fc2-space-xs) !important;
        right: var(--fc2-space-xs) !important;
    }

    .${C.processedCard}.is-minimal .card-top-right-controls > * {
        display:none!important;
    }

    .${C.processedCard}.is-minimal .${C.fc2IdBadge} {
        display:none!important;
    }

    .${C.processedCard}.is-minimal .${C.infoArea} {
        padding: var(--fc2-space-xs) var(--fc2-space-sm) var(--fc2-space-sm) !important;
        background:transparent!important;
        border-top:none!important;
    }

    .${C.processedCard}.is-minimal .${C.customTitle} {
        height:auto!important;
        -webkit-line-clamp:1!important;
        margin-bottom:0!important;
        padding-right:var(--fc2-space-xl)!important;
        font-size:var(--fc2-text-xs)!important;
    }

    .${C.processedCard}.is-minimal .card-left-actions {
        display:none!important;
    }

    .${C.videoPreviewContainer} {
        position:relative;
        width:100%;
        aspect-ratio:16 / 9;
        background:var(--fc2-bg);
        border-top-left-radius:var(--fc2-radius-lg);
        border-top-right-radius:var(--fc2-radius-lg);
        overflow:hidden;
    }

    .${C.videoPreviewContainer} video,
    .${C.videoPreviewContainer} img.${C.staticPreview} {
        width:100%;
        height:100%;
        object-fit:contain;
        transition:opacity var(--fc2-motion-base) var(--fc2-ease-out)!important;
        opacity:0;
        position:absolute!important;
        top:0!important;
        left:0!important;
        transform:translate3d(0,0,0);
    }

    .${C.videoPreviewContainer} .fc2-reveal-content:not(.${C.hidden}) {
        animation:fc2-content-reveal 0.4s var(--fc2-ease-out) forwards!important;
    }

    .${C.videoPreviewContainer}:not(.fc2-preview-active) img.${C.staticPreview}:not(.${C.hidden}) {
        animation:none!important;
        opacity:1!important;
        filter:none!important;
        transform:translate3d(0,0,0)!important;
    }

    .${C.videoPreviewContainer}:not(.fc2-preview-active) video {
        opacity:0!important;
        pointer-events:none!important;
    }

    .${C.videoPreviewContainer} .${C.hidden} {
        opacity:0!important;
        pointer-events:none!important;
    }

    .${C.processedCard}:hover .${C.videoPreviewContainer} video,
    .${C.processedCard}:hover .${C.videoPreviewContainer} img.${C.staticPreview} {
        transform:translate3d(0,0,0)!important;
    }

    .${C.previewElement} {
        position:absolute;
        top:0;
        left:0;
        opacity:1;
        transition:opacity var(--fc2-motion-slow) var(--fc2-ease-standard);
    }

    .${C.previewElement}.${C.hidden} {
        opacity:0;
        pointer-events:none;
    }

    /* Pill Action Styles for Play Button */
    .${C.resourceLinksContainer} .${C.btnPlayFullscreen},
    .card-primary-actions .${C.btnPlayFullscreen} {
        color: var(--fc2-success) !important;
    }

    .${C.resourceLinksContainer} .${C.btnPlayFullscreen}:hover,
    .card-primary-actions .${C.btnPlayFullscreen}:hover {
        background: rgba(var(--fc2-success-rgb), 0.1) !important;
    }

    .${C.infoArea} {
        display:flex;
        flex-direction:column;
        justify-content:flex-end;
        flex-grow:1;
        padding:var(--fc2-space-base);
        background:var(--fc2-surface-item);
        border-top:var(--fc2-border-width) solid var(--fc2-border);
        border-bottom-left-radius:var(--fc2-radius);
        border-bottom-right-radius:var(--fc2-radius);
    }

    .${C.customTitle} {
        display:-webkit-box;
        -webkit-line-clamp:2;
        -webkit-box-orient:vertical;
        height: var(--fc2-btn-height-md);
        margin:0 0 var(--fc2-space-sm);
        color:var(--fc2-text)!important;
        font-size: var(--fc2-text-sm);
        font-weight: var(--fc2-font-semibold)!important;
        line-height:1.5;
        text-decoration:none!important;
        overflow:hidden;
        transition:color var(--fc2-motion-fast);
    }

    .${C.customTitle}:hover {
        color:var(--fc2-primary)!important;
    }

    .${C.preservedIconsContainer} {
        display:flex;
        flex-wrap:wrap;
        align-items:center;
        gap:var(--fc2-space-xs);
        margin:0 0 var(--fc2-space-sm);
        min-height:0;
    }

    .${C.preservedIconsContainer} > * {
        flex:0 0 auto;
        max-width:100%;
    }

    .card-meta-row {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:var(--fc2-space-sm);
        margin-bottom:var(--fc2-space-sm);
    }

    .card-identity-slot,
    .card-status-slot,
    .card-secondary-actions {
        display:flex;
        align-items:center;
        gap:var(--fc2-space-xs);
        min-width:0;
    }

    .card-identity-slot {
        flex:1 1 auto;
        min-width:0;
    }

    .card-status-slot {
        flex:0 0 auto;
    }

    .card-left-actions {
        display:flex;
        align-items:center;
        justify-content:flex-start;
        gap:var(--fc2-space-xs);
        margin-top:auto;
    }

    .${C.resourceLinksContainer} {
        display:flex;
        flex-direction:row;
        align-items:stretch;
        justify-content:flex-end;
        flex-wrap:nowrap;
        gap:0 !important;
        max-width:100%;
        min-width:0;
        margin-left:auto;

        background: var(--fc2-surface-item);
        border: var(--fc2-border-width) solid var(--fc2-border);
        border-radius: var(--fc2-radius-full);
        box-shadow: var(--fc2-shadow-sm);
        backdrop-filter: blur(var(--fc2-blur));
        -webkit-backdrop-filter: blur(var(--fc2-blur));
        overflow: hidden;
        padding: 0;
        height: var(--fc2-btn-height-sm); /* Default height */
    }

    .${C.resourceLinksContainer} > * {
        background: transparent !important;
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--fc2-text) !important;
        cursor: pointer;
        padding: 0 var(--fc2-space-sm) !important;
        white-space: nowrap;
        margin: 0 !important;
        height: 100% !important;
        transition: background-color var(--fc2-motion-base) var(--fc2-ease-out);
        flex: 0 0 auto; /* Prevent buttons from stretching horizontally */
    }

    .${C.resourceLinksContainer} > *:not(:last-child) {
        border-right: var(--fc2-border-width) solid rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle)) !important;
    }

    .${C.resourceLinksContainer} > *:hover {
        background: rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle)) !important;
    }

    .${C.resourceLinksContainer} .${C.btnMagnet} {
        color: var(--fc2-primary) !important;
        animation: none !important;
        background: transparent !important;
    }

    .${C.resourceLinksContainer} .${C.btnMagnet}:hover {
        background: rgba(var(--fc2-primary-rgb), 0.1) !important;
    }

    /* Visibility Rules are managed globally in base.ts */
    .${C.cardMeta} {
        display:flex;
        flex-wrap:wrap;
        gap: var(--fc2-space-xs);
        margin:0 0 var(--fc2-space-sm);
        color:var(--fc2-text-dim);
        font-size: var(--fc2-text-xs);
        line-height:1.4;
    }

    .${C.cardMetaItem} {
        max-width:100%;
        padding:var(--fc2-space-xxs) var(--fc2-space-sm);
        border:var(--fc2-border-width) solid rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle));
        border-radius:var(--fc2-radius-full);
        background:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-ghost));
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
    }

    .${C.cardActionRow} {
        display:flex;
        align-items:center;
        justify-content:flex-end;
        gap:var(--fc2-space-sm);
        margin-top:auto;
        min-width:0;
    }

    .card-primary-actions,
    .card-left-actions {
        display:flex;
        flex-direction:row;
        align-items:stretch;
        justify-content:flex-start;
        flex-wrap:nowrap;
        gap:0 !important;
        flex:0 1 auto; /* Prevent pill wrapper from stretching */
        min-width:0;
        margin-left:0;

        background: var(--fc2-surface-item);
        border: var(--fc2-border-width) solid var(--fc2-border);
        border-radius: var(--fc2-radius-full);
        box-shadow: var(--fc2-shadow-sm);
        backdrop-filter: blur(var(--fc2-blur));
        -webkit-backdrop-filter: blur(var(--fc2-blur));
        overflow: hidden;
        padding: 0;
        height: var(--fc2-btn-height-sm);
    }

    .card-primary-actions:empty,
    .card-left-actions:empty,
    .resource-links-container:empty {
        display: none !important;
    }

    .card-primary-actions > *,
    .card-left-actions > * {
        background: transparent !important;
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--fc2-text) !important;
        cursor: pointer;
        padding: 0 var(--fc2-space-sm) !important;
        white-space: nowrap;
        margin: 0 !important;
        height: 100% !important;
        transition: background-color var(--fc2-motion-base) var(--fc2-ease-out);
        flex: 0 0 auto;
    }

    .card-primary-actions > *:not(:last-child),
    .card-left-actions > *:not(:last-child) {
        border-right: var(--fc2-border-width) solid rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle)) !important;
    }

    .card-primary-actions > *:hover,
    .card-left-actions > *:hover {
        background: rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle)) !important;
    }

    .card-secondary-actions {
        flex:0 1 auto;
        min-width:0;
        margin-left:0;
        display:flex;
        gap:0;
    }


    .card-overflow-actions {
        margin-left:0;
    }

    .card-action-stash {
        display:none !important;
    }

    .${C.processedCard}.${C.noMagnet} {
        border-color:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle));
    }

    body.card-density-minimal .${C.infoArea} {
        padding: var(--fc2-space-sm) var(--fc2-btn-pad-xs);
        gap: var(--fc2-space-xxs);
    }

    body.card-density-minimal .${C.customTitle} {
        -webkit-line-clamp: 2;
        height: auto;
        min-height: 2.4em;
        margin-bottom: var(--fc2-space-xxs);
        font-size: var(--fc2-text-xs);
        line-height: 1.2;
    }

    body.card-density-minimal .${C.cardMeta} {
        display: flex;
        font-size: 10px;
        opacity: 0.8;
    }

    body.card-density-minimal .${C.cardMeta} > *:not(.${C.fc2IdBadge}) {
        display: none !important; /* Only show ID in compact mode */
    }

    body.card-density-minimal .${C.resourceBtn} {
        height: var(--fc2-btn-height-xs);
        min-height: var(--fc2-btn-height-xs);
        padding: 0 var(--fc2-space-xs);
        font-size: 11px;
    }

    body.card-density-balanced .${C.customTitle} {
        -webkit-line-clamp: 2;
        height: calc(var(--fc2-btn-height-md) + var(--fc2-space-xxs));
    }

    body.card-density-immersive .${C.infoArea} {
        padding: var(--fc2-space-md);
        gap: var(--fc2-space-base);
        background: linear-gradient(180deg, var(--fc2-surface-item), var(--fc2-surface-low));
    }

    body.card-density-immersive .${C.customTitle} {
        -webkit-line-clamp: 3;
        height: auto;
        min-height: 4.5em;
        font-size: var(--fc2-text-lg);
        letter-spacing: var(--fc2-letter-tight);
        line-height: 1.5;
    }

    body.card-density-immersive .${C.cardMeta} {
        font-size: var(--fc2-text-xs);
        margin-bottom: var(--fc2-space-base);
    }

    body.card-density-immersive .${C.resourceBtn} {
        height: var(--fc2-btn-height-md);
        padding: 0 var(--fc2-space-md);
        font-size: var(--fc2-text-base);
    }

    @container card (max-width: 280px) {
        .${C.infoArea} {
            padding: var(--fc2-space-xs) var(--fc2-space-sm) !important;
        }

        .card-meta-row,
        .${C.cardActionRow} {
            flex-wrap: wrap;
            gap: var(--fc2-space-xs) !important;
        }

        .${C.customTitle} {
            -webkit-line-clamp: 2;
            height: auto;
            min-height: calc(var(--fc2-btn-height-sm) + var(--fc2-space-xxs));
            margin-bottom: var(--fc2-space-xs);
            font-size: var(--fc2-text-xs);
        }

        .card-primary-actions,
        .card-secondary-actions,
        .${C.resourceLinksContainer} {
            justify-content: flex-start;
            margin-left: 0;
            height: var(--fc2-btn-height-xs) !important; /* Shrink buttons for narrow cards */
        }

        .card-primary-actions .${C.btnMagnet} {
            flex: 1 1 auto;
            min-width: 0;
        }
    }

    /* Ultra-compact mode for very narrow cards (e.g. 3+ columns on mobile) */
    @container card (max-width: 160px) {
        .${C.infoArea} {
            padding: var(--fc2-space-xxs) var(--fc2-space-xs) !important;
        }

        .${C.customTitle} {
            -webkit-line-clamp: 2; /* Allow 2 lines even in ultra-compact */
            font-size: 11px !important;
        }

        /* Keep everything visible, but use wrapping and smaller scales */
        .${C.cardMeta},
        .card-status-slot,
        .card-primary-actions,
        .card-secondary-actions,
        .${C.resourceLinksContainer} {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: var(--fc2-space-xxs) !important;
        }

        .card-primary-actions,
        .${C.resourceLinksContainer} {
            width: 100% !important;
            height: auto !important; /* Allow growing vertically to fit wrapped buttons */
            min-height: var(--fc2-btn-height-xs);
            border-radius: var(--fc2-radius-sm) !important;
        }

        .card-primary-actions > *,
        .${C.resourceLinksContainer} > * {
            flex: 1 1 auto !important;
            padding: 0 var(--fc2-space-xs) !important;
            font-size: 10px !important;
        }
    }

    @media (max-width: 768px) {
        .${C.processedCard}.is-detail .${C.infoArea} {
            padding:var(--fc2-space-base)!important;
        }

        .${C.processedCard}.is-detail .${C.customTitle} {
            font-size:var(--fc2-text-base)!important;
        }

        .${C.processedCard}.is-detail .card-meta-row,
        .${C.processedCard}.is-detail .${C.cardActionRow} {
            flex-wrap:wrap;
        }

        .${C.processedCard}.is-detail .card-primary-actions,
        .${C.processedCard}.is-detail .card-secondary-actions,
        .${C.processedCard}.is-detail .${C.resourceLinksContainer} {
            justify-content:flex-start;
            width:100%;
            margin-left:0;
        }
    }

    /* Selection Overlay */
    .card-selection-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: var(--fc2-z-dropdown);
        transition: background-color var(--fc2-motion-base);
        border-radius: var(--fc2-radius-lg);
    }

    .selection-mode-active .card-selection-overlay {
        pointer-events: all;
        cursor: pointer;
    }

    .selection-mode-active:hover .card-selection-overlay {
        background: rgba(var(--fc2-primary-rgb), 0.05);
    }

    .is-selected .card-selection-overlay {
        background: rgba(var(--fc2-primary-rgb), 0.15);
        box-shadow: inset 0 0 0 2px var(--fc2-primary);
    }

    .card-selection-checkbox {
        position: absolute;
        top: var(--fc2-space-sm);
        left: var(--fc2-space-sm);
        width: 24px;
        height: 24px;
        appearance: none;
        background: var(--fc2-surface-float);
        border: 2px solid var(--fc2-border-strong);
        border-radius: var(--fc2-radius-sm);
        cursor: pointer;
        opacity: 0;
        transform: scale(0.8);
        transition: all var(--fc2-motion-base) var(--fc2-ease-spring);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0;
        box-shadow: var(--fc2-shadow-sm);
    }

    .selection-mode-active .card-selection-checkbox {
        opacity: 1;
        transform: scale(1);
    }

    .card-selection-checkbox:checked {
        background: var(--fc2-primary);
        border-color: var(--fc2-primary);
    }

    .card-selection-checkbox:checked::after {
        content: "";
        width: 6px;
        height: 12px;
        border: solid var(--fc2-on-primary);
        border-width: 0 2.5px 2.5px 0;
        transform: rotate(45deg);
        margin-bottom: 2px;
    }

    .selection-mode-active .${C.infoArea} {
        pointer-events: none;
    }
`;

  const button = (C) => `
    /* ============================================================
       UNIFIED BUTTON SYSTEM
       ============================================================ */

    .card-top-right-controls {
        position:absolute;
        top:var(--fc2-space-sm);
        right:var(--fc2-space-sm);
        z-index:var(--fc2-z-dropdown);
        display:flex;
        flex-direction:row;
        flex-wrap:nowrap;
        align-items:stretch;
        background: var(--fc2-surface-item);
        border: var(--fc2-border-width) solid var(--fc2-border);
        border-radius: var(--fc2-radius-full);
        box-shadow: var(--fc2-shadow-sm);
        backdrop-filter: blur(var(--fc2-blur));
        -webkit-backdrop-filter: blur(var(--fc2-blur));
        overflow: hidden;
        padding: 0;
        gap: 0;
        max-width:calc(100% - (var(--fc2-space-sm) * 2));
    }

    .${C.resourceBtn},
    .btn-actress,
    .verify-cf-btn {
        position:relative;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        min-width:0;
        min-height:var(--fc2-btn-height-sm);
        background:linear-gradient(180deg, rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle)), var(--fc2-surface-item));
        color:var(--fc2-text);
        border: var(--fc2-border-width) solid rgba(var(--fc2-primary-rgb), var(--fc2-opacity-muted));
        border-radius:var(--fc2-btn-radius);
        font-size:var(--fc2-text-sm);
        font-weight: var(--fc2-font-semibold);
        line-height:1;
        text-decoration:none;
        backdrop-filter:blur(var(--fc2-blur));
        -webkit-backdrop-filter:blur(var(--fc2-blur));
        cursor:pointer;
        white-space:nowrap;
        box-shadow:inset 0 var(--fc2-border-width) 0 rgba(var(--fc2-primary-rgb), var(--fc2-opacity-ghost));
        transition:background-color var(--fc2-motion-base) var(--fc2-ease-out),
                   color var(--fc2-motion-base) var(--fc2-ease-out),
                   border-color var(--fc2-motion-base) var(--fc2-ease-out),
                   box-shadow var(--fc2-motion-base) var(--fc2-ease-out),
                   transform var(--fc2-motion-fast) var(--fc2-ease-out);
    }

    .card-top-right-controls > * {
        background: transparent !important;
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--fc2-text);
        cursor: pointer;
        padding: 0 var(--fc2-space-sm);
        white-space: nowrap;
        margin: 0 !important;
        transition: background-color var(--fc2-motion-base) var(--fc2-ease-out);
    }

    .card-top-right-controls > *:not(:last-child) {
        border-right: var(--fc2-border-width) solid rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle)) !important;
    }

    .${C.resourceBtn} *,
    .fc2-fab-btn *,
    .fc2-fab-trigger *,
    .close-btn *,
    .verify-cf-btn * {
        pointer-events:none!important;
    }

    .${C.resourceBtn}:hover,
    .btn-actress:hover {
        background:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-10));
        color:var(--fc2-text);
        border-color:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-30));
    }

    .card-top-right-controls > *:hover {
        background: rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle)) !important;
    }
        border-color:transparent;
        transform:translateY(calc(-1 * var(--fc2-border-width)));
        box-shadow:var(--fc2-shadow-md);
    }

    .${C.resourceBtn}:active,
    .card-top-right-controls > *:active,
    .btn-actress:active {
        transform:translateY(0) scale(0.98);
    }

    /* Focus-visible for keyboard accessibility */
    .${C.resourceBtn}:focus-visible,
    .card-top-right-controls > *:focus-visible,
    .btn-actress:focus-visible,
    .verify-cf-btn:focus-visible {
        outline:calc(var(--fc2-border-width) * 2) solid var(--fc2-primary);
        outline-offset:var(--fc2-space-xxs);
        box-shadow:var(--fc2-focus-ring);
    }

    /* Micro-Interactions */
    .${C.resourceBtn}::after,
    .fc2-fab-btn::after,
    .fc2-enh-btn::after,
    .fc2-btn::after {
        content:"";
        position:absolute;
        top:50%;
        left:50%;
        width:100%;
        height:100%;
        background:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle));
        opacity:0;
        border-radius:inherit;
        transform:translate(-50%,-50%) scale(1);
        pointer-events:none;
        transition:opacity var(--fc2-motion-slow);
    }

    .${C.resourceBtn}:active::after,
    .fc2-fab-btn:active::after,
    .fc2-btn:active::after {
        animation:fc2-ripple var(--fc2-motion-slow) var(--fc2-ease-standard);
        opacity:1;
    }

    .verify-cf-btn {
        margin:var(--fc2-space-xs) auto;
        padding:0 var(--fc2-btn-pad-md);
        color:var(--fc2-warn)!important;
        border-color:rgba(var(--fc2-warn-rgb),var(--fc2-opacity-30))!important;
    }

    .verify-cf-btn:hover {
        background:rgba(var(--fc2-warn-rgb),var(--fc2-opacity-20))!important;
        color:var(--fc2-text)!important;
        border-color:var(--fc2-warn)!important;
        transform:translateY(calc(-1 * var(--fc2-space-xxs)));
        box-shadow:0 var(--fc2-space-xs) calc(var(--fc2-space-md) - var(--fc2-border-width)) rgba(var(--fc2-warn-rgb),var(--fc2-opacity-20))!important;
    }

    .card-top-right-controls > * {
        min-width:0;
        min-height:var(--fc2-btn-height-xs);
        height:var(--fc2-btn-height-xs);
        padding:0 var(--fc2-btn-pad-xs);
        font-size:var(--fc2-text-xs);
    }

    .${C.resourceBtn} {
        height:var(--fc2-btn-height-sm);
        padding:0 var(--fc2-btn-pad-sm);
        font-size:var(--fc2-text-sm);
    }

    @container(max-width:250px) {
        .card-top-right-controls > * { height:calc(var(--fc2-btn-height-xs) - var(--fc2-space-xs)); padding:0 calc(var(--fc2-space-sm) - var(--fc2-space-xxs)); font-size:var(--fc2-btn-pad-xs); }
        .card-top-right-controls { top:calc(var(--fc2-space-sm) - var(--fc2-space-xxs)); right:calc(var(--fc2-space-sm) - var(--fc2-space-xxs)); gap:calc(var(--fc2-space-xs) - var(--fc2-border-width)); }
        .${C.resourceBtn} { height:var(--fc2-btn-height-xs); padding:0 var(--fc2-btn-pad-xs); font-size:var(--fc2-text-xs); }
    }

    @container(min-width:350px) {
        .card-top-right-controls > * { height:calc(var(--fc2-btn-height-sm) - var(--fc2-space-xxs)); padding:0 var(--fc2-btn-pad-xs); font-size:var(--fc2-text-xs); }
        .${C.resourceBtn} { height:calc(var(--fc2-btn-height-sm) + var(--fc2-space-xxs)); padding:0 var(--fc2-text-base); font-size:var(--fc2-text-sm); }
    }

    .${C.resourceBtn}.${C.btnMagnet} {
        font-weight: var(--fc2-font-semibold);
        margin-left:auto;
        animation:fc2-magnet-in var(--fc2-motion-slow) var(--fc2-ease-spring);
    }

    .btn-toggle-view.is-viewed { 
        color:var(--fc2-primary); 
        border-color:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-40)) !important;
        background:rgba(var(--fc2-primary-rgb), 0.08) !important;
    }
    .btn-toggle-view:not(.is-viewed) .icon-viewed { display:none; }
    .btn-toggle-view:not(.is-viewed) .icon-unviewed { display:inline-flex; }
    .btn-toggle-view.is-viewed .icon-viewed { display:inline-flex; }
    .btn-toggle-view.is-viewed .icon-unviewed { display:none; }

    /* 隐藏所有功能按钮的文字以保持图标化风格，同时覆盖工具栏和卡片 */
    .${C.processedCard} .${C.resourceBtn} .${C.buttonText},
    .enh-toolbar .${C.resourceBtn} .${C.buttonText} {
        display: none !important;
    }

    /* 确保 ID 徽章文字在任何容器下都保持显示 */
    .${C.processedCard} .${C.resourceBtn}.${C.fc2IdBadge} .${C.buttonText},
    .enh-toolbar .${C.resourceBtn}.${C.fc2IdBadge} .${C.buttonText} {
        display: inline-block !important;
    }

    .enh-toolbar .${C.resourceBtn}.btn-actress .${C.buttonText} {
        display: inline-block !important;
    }

    .${C.processedCard} .card-status-slot .${C.resourceBtn} {
        height: var(--fc2-btn-height-xs);
        min-height: var(--fc2-btn-height-xs);
        padding: 0 var(--fc2-btn-pad-xs);
        font-size: var(--fc2-text-xs);
    }

    .${C.processedCard} .card-primary-actions .${C.resourceBtn}.${C.btnMagnet} {
        margin-left: 0;
        justify-content: center;
        min-width: 0;
    }
    .btn-actress {
        margin:var(--fc2-space-xs) auto;
        padding:0 var(--fc2-btn-pad-md);
    }

    .${C.fc2IdBadge} {
        font-family:var(--fc2-font-mono);
        letter-spacing:var(--fc2-letter-tight);
        background:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-ghost)) !important;
        border-color:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-15)) !important;
    }

    .${C.fc2IdBadge} .${C.buttonText} {
        font-weight:600;
    }

    .${C.fc2IdBadge}:hover {
        border-color:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-40));
        background:rgba(var(--fc2-primary-rgb), 0.08);
    }

    .${C.fc2IdBadge}.${C.badgeCopied} {
        background:var(--fc2-success)!important;
        color:var(--fc2-on-primary)!important;
        border-color:var(--fc2-success);
        font-weight:700!important;
        animation:fc2-copy-success var(--fc2-motion-slow) ease;
    }

    /* Button Industrial Style Override */
    .fc2-btn-industrial {
        position:relative;
        overflow:hidden;
        border: var(--fc2-border-width) solid rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle))!important;
        background:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-ghost))!important;
        transition:all var(--fc2-motion-fast) var(--fc2-ease-out)!important;
    }

    .fc2-btn-industrial:active {
        transform:scale(0.97) translateY(var(--fc2-space-xxs))!important;
        background:rgba(var(--fc2-black-rgb),var(--fc2-opacity-20))!important;
        box-shadow:inset 0 var(--fc2-space-xxs) var(--fc2-space-xs) rgba(var(--fc2-black-rgb),var(--fc2-opacity-30))!important;
    }

    .fc2-btn-industrial.primary {
        background:rgba(var(--fc2-primary-rgb),var(--fc2-opacity-10))!important;
        border-color:rgba(var(--fc2-primary-rgb),var(--fc2-opacity-20))!important;
        color:var(--fc2-primary)!important;
    }

    .fc2-enh-btn, .fc2-btn {
        min-height:var(--fc2-btn-height-md);
        height:var(--fc2-btn-height-md);
        gap: var(--fc2-space-sm);
        padding:0 var(--fc2-btn-pad-md);
        background:linear-gradient(180deg, rgba(var(--fc2-primary-rgb), var(--fc2-opacity-ghost)), var(--fc2-surface-item));
        color:var(--fc2-text-dim);
        border:var(--fc2-border-width) solid var(--fc2-border);
        border-radius:var(--fc2-btn-radius);
        box-shadow:inset 0 var(--fc2-border-width) 0 rgba(var(--fc2-primary-rgb), var(--fc2-opacity-ghost));
        font-family:inherit;
        font-size:var(--fc2-text-sm);
        font-weight: var(--fc2-font-semibold);
        cursor:pointer;
        line-height:1;
        transition:background-color var(--fc2-motion-fast) var(--fc2-ease-standard), color var(--fc2-motion-fast) var(--fc2-ease-standard), border-color var(--fc2-motion-fast) var(--fc2-ease-standard), box-shadow var(--fc2-motion-fast) var(--fc2-ease-standard), transform var(--fc2-motion-fast) var(--fc2-ease-standard);
        display:inline-flex;
        align-items:center;
        justify-content:center;
        white-space:nowrap;
        min-width:0;
    }

    .fc2-enh-btn .fc2-btn-text, .fc2-btn .fc2-btn-text {
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
    }

    .fc2-enh-btn:hover, .fc2-btn:hover {
        background:rgba(var(--fc2-primary-rgb),var(--fc2-opacity-10));
        color:var(--fc2-text);
        border-color:rgba(var(--fc2-primary-rgb),var(--fc2-opacity-16));
        transform:translateY(calc(-1 * var(--fc2-border-width)));
        box-shadow:var(--fc2-shadow-md);
    }

    .fc2-enh-btn:focus-visible, .fc2-btn:focus-visible {
        outline:calc(var(--fc2-border-width) * 2) solid var(--fc2-primary);
        outline-offset:var(--fc2-space-xxs);
        box-shadow:var(--fc2-focus-ring);
    }

    .fc2-enh-btn.ghost, .fc2-btn.ghost {
        background:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-ghost));
        border-color:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle));
        color:var(--fc2-text-dim);
    }

    .fc2-enh-btn.ghost:hover, .fc2-btn.ghost:hover {
        background:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle));
        color:var(--fc2-text);
        border-color:rgba(var(--fc2-primary-rgb),var(--fc2-opacity-12));
    }

    .fc2-enh-btn.micro, .fc2-btn.micro {
        min-height:var(--fc2-btn-height-sm);
        height:var(--fc2-btn-height-sm);
        padding:0 var(--fc2-btn-pad-md);
        border-radius: var(--fc2-btn-radius);
        font-size:var(--fc2-text-xs)!important;
        font-weight: var(--fc2-font-semibold) !important;
    }

    .fc2-enh-btn.icon-only, .fc2-btn.icon-only {
        width:var(--fc2-btn-height-md);
        padding:0;
        justify-content:center;
    }

    .fc2-enh-btn.active, .fc2-btn.active {
        background:rgba(var(--fc2-primary-rgb),var(--fc2-opacity-15));
        color:var(--fc2-primary);
        border-color:rgba(var(--fc2-primary-rgb),var(--fc2-opacity-30));
    }

    .fc2-enh-btn:disabled, .fc2-btn:disabled {
        opacity:0.4;
        cursor:not-allowed;
        pointer-events:none;
    }

    .fc2-enh-btn.primary, .fc2-btn.primary {
        background:var(--fc2-primary);
        color:var(--fc2-on-primary);
        border-color:transparent;
        font-weight: var(--fc2-font-bold);
    }

    .fc2-enh-btn.primary:hover, .fc2-btn.primary:hover {
        background:var(--fc2-text);
        transform:translateY(calc(-1 * var(--fc2-border-width)));
        box-shadow:0 var(--fc2-space-base) var(--fc2-btn-height-xs) calc(-1 * (var(--fc2-btn-pad-md) + var(--fc2-space-xxs))) rgba(var(--fc2-primary-rgb),var(--fc2-opacity-45));
    }

    .fc2-enh-btn.danger, .fc2-btn.danger {
        color:var(--fc2-danger);
        border-color:rgba(var(--fc2-danger-rgb),var(--fc2-opacity-20));
    }

    .fc2-enh-btn.danger:hover, .fc2-btn.danger:hover {
        background:rgba(var(--fc2-danger-rgb),0.08);
        border-color:var(--fc2-danger);
    }

    /* Industrial feedback for buttons in panel */
    .fc2-enh-settings-panel .fc2-enh-btn,
    .fc2-enh-settings-panel .fc2-btn {
        box-shadow:inset 0 var(--fc2-border-width) 0 rgba(var(--fc2-primary-rgb), var(--fc2-opacity-ghost));
    }

    .fc2-enh-settings-panel .fc2-enh-btn.primary,
    .fc2-enh-settings-panel .fc2-btn.primary,
    .fc2-enh-settings-panel .fc2-enh-btn.danger,
    .fc2-enh-settings-panel .fc2-btn.danger {
        position:relative;
        overflow:hidden;
        transition:all var(--fc2-motion-fast) var(--fc2-ease-out)!important;
    }

    .fc2-enh-settings-panel .fc2-enh-btn.primary:hover,
    .fc2-enh-settings-panel .fc2-btn.primary:hover {
        transform:translateY(calc(-1 * var(--fc2-border-width)));
        box-shadow:0 var(--fc2-btn-pad-xs) var(--fc2-space-lg) calc(-1 * (var(--fc2-btn-pad-md) + var(--fc2-space-xxs))) rgba(var(--fc2-primary-rgb),var(--fc2-opacity-45));
    }

    .fc2-enh-settings-panel .fc2-enh-btn.primary:active,
    .fc2-enh-settings-panel .fc2-btn.primary:active,
    .fc2-enh-settings-panel .fc2-enh-btn.danger:active,
    .fc2-enh-settings-panel .fc2-btn.danger:active {
        transform:scale(0.97) translateY(var(--fc2-border-width));
        box-shadow:inset 0 var(--fc2-space-xxs) var(--fc2-space-xs) rgba(var(--fc2-black-rgb),var(--fc2-opacity-20));
    }
`;

  const form = (_C) => `
    /* ============================================================
       FORM ELEMENTS (GLASSMORPHISM)
       ============================================================ */

    .fc2-enh-form-row {
        display:flex;
        flex-direction:column;
        align-items:stretch;
        margin-bottom:0;
        padding:var(--fc2-space-sm) var(--fc2-space-md);
        border-bottom: var(--fc2-border-width) solid var(--fc2-border);
        transition:background-color var(--fc2-motion-fast);
        min-height:0;
    }

    .fc2-enh-form-row:last-child {
        border-bottom:none;
    }

    .fc2-enh-form-row:hover {
        background:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-ghost));
    }

    .fc2-enh-label {
        display:block;
        margin-bottom: var(--fc2-space-sm);
        color:var(--fc2-text);
        font-size: var(--fc2-text-xs);
        font-weight: var(--fc2-font-semibold);
        letter-spacing:0.02em;
        opacity: var(--fc2-opacity-dim);
    }

    .fc2-enh-select, .fc2-enh-input, .fc2-enh-textarea {
        width:100%;
        padding: var(--fc2-space-sm) var(--fc2-space-base);
        background:rgba(var(--fc2-black-rgb), var(--fc2-opacity-muted)) !important;
        color:var(--fc2-text)!important;
        border: var(--fc2-border-width) solid rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle));
        border-radius:var(--fc2-radius-sm);
        font-family:inherit;
        font-size: var(--fc2-text-sm);
        font-weight: var(--fc2-font-medium);
        outline:none;
        transition:all var(--fc2-motion-fast) var(--fc2-ease-out);
        appearance:none;
        -webkit-appearance:none;
    }

    .fc2-enh-select option {
        background:var(--fc2-bg);
        color:var(--fc2-text);
        padding:var(--fc2-btn-pad-xs);
    }

    .fc2-enh-select option:checked,
    .fc2-enh-select option:hover {
        background:var(--fc2-primary)!important;
        color:var(--fc2-on-primary)!important;
    }

    .fc2-enh-select:focus,
    .fc2-enh-input:focus,
    .fc2-enh-textarea:focus {
        border-color:var(--fc2-primary);
        background:var(--fc2-surface)!important;
        box-shadow:0 0 0 calc(var(--fc2-space-xxs) + var(--fc2-border-width)) rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle));
    }

    .fc2-enh-checkbox-label {
        display:flex;
        align-items:center;
        gap: var(--fc2-space-sm);
        cursor:pointer;
        user-select:none;
        padding: var(--fc2-space-xs) 0;
    }

    input[type="checkbox"] {
        position:relative;
        appearance:none;
        -webkit-appearance:none;
        width:1.25rem;
        height:1.25rem;
        background:var(--fc2-surface-lowest);
        border:var(--fc2-border-width) solid var(--fc2-border);
        border-radius:var(--fc2-radius-sm);
        cursor:pointer;
        transition:all var(--fc2-motion-fast) var(--fc2-ease-out);
        display:flex;
        align-items:center;
        justify-content:center;
    }

    input[type="checkbox"]:focus-visible {
        outline:calc(var(--fc2-border-width) * 2) solid var(--fc2-primary);
        outline-offset:var(--fc2-space-xxs);
    }

    input[type="checkbox"]:checked {
        background:var(--fc2-primary);
        border-color:var(--fc2-primary);
    }

    input[type="checkbox"]::after {
        content:"";
        width: var(--fc2-space-sm);
        height: var(--fc2-space-sm);
        background-color: var(--fc2-liquid-bg);
        clip-path:polygon(14% 44%,0 65%,50% 100%,100% 16%,80% 0%,43% 62%);
        transform:scale(0);
        transition:transform var(--fc2-motion-fast) var(--fc2-ease-spring);
    }

    input[type="checkbox"]:checked::after {
        transform:scale(1);
    }

    .fc2-enh-checkbox-text {
        font-size: var(--fc2-text-sm);
        color:var(--fc2-text);
        font-weight: var(--fc2-font-semibold);
        opacity: var(--fc2-opacity-dim);
    }

    /* Range Input */
    .fc2-enh-range {
        -webkit-appearance:none;
        width:100%;
        height: var(--fc2-space-xs);
        background:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle));
        border-radius:var(--fc2-radius-sm);
        outline:none;
    }

    .fc2-enh-range::-webkit-slider-thumb {
        -webkit-appearance:none;
        width: var(--fc2-text-base);
        height: var(--fc2-text-base);
        border-radius: var(--fc2-radius-full);
        background:var(--fc2-primary);
        cursor:pointer;
        box-shadow:0 0 0 var(--fc2-space-xxs) var(--fc2-bg);
    }

    .fc2-enh-form-row.checkbox {
        flex-direction:row;
        justify-content:flex-start;
        align-items:center;
        gap:var(--fc2-space-base);
        padding:var(--fc2-space-sm) var(--fc2-space-md);
        margin:0;
        background:transparent;
        border:none;
        border-bottom:var(--fc2-border-width) solid var(--fc2-border);
        border-radius:0;
        transition:all var(--fc2-motion-fast) var(--fc2-ease-out);
        cursor:pointer;
        width:100%;
        box-sizing:border-box;
    }

    .fc2-enh-form-row.checkbox:hover {
        background:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle));
    }

    .fc2-enh-form-row.checkbox:has(input[type="checkbox"]:checked) {
        background: rgba(var(--fc2-primary-rgb),0.02);
    }

    .fc2-enh-form-row.checkbox:has(input[type="checkbox"]:checked) .fc2-enh-checkbox-text {
        opacity: 1;
        font-weight: 600;
        color: var(--fc2-text) !important;
    }

    .fc2-input-group {
        display:flex;
        gap:var(--fc2-space-sm);
        align-items:center;
        width:100%;
    }

    .fc2-input-group .fc2-enh-input {
        flex:1;
        min-width:0;
    }

    .fc2-input-toggle {
        display:inline-flex;
        align-items:center;
        justify-content:center;
        width: var(--fc2-btn-height-md);
        height: var(--fc2-btn-height-md);
        flex-shrink:0;
        padding:0;
        background:var(--fc2-surface-item);
        color:var(--fc2-text-dim);
        border:var(--fc2-border-width) solid var(--fc2-border);
        border-radius:var(--fc2-btn-radius);
        cursor:pointer;
        transition:all var(--fc2-motion-fast) var(--fc2-ease-standard);
    }

    .fc2-input-toggle:hover {
        background:rgba(var(--fc2-primary-rgb),var(--fc2-opacity-10));
        color:var(--fc2-text);
    }

    .fc2-input-toggle:focus-visible {
        outline:calc(var(--fc2-border-width) * 2) solid var(--fc2-primary);
        outline-offset:var(--fc2-space-xxs);
    }

    .fc2-input-toggle svg {
        width:var(--fc2-text-base);
        height:var(--fc2-text-base);
        fill:currentColor;
    }

    /* Hide Native Edge/IE reveal icons as we use our own */
    input[type="password"]::-ms-reveal,
    input[type="password"]::-ms-clear {
        display: none !important;
    }
`;

  const tabs = (_C) => `
    /* ============================================================
       SETTINGS NAVIGATION
       ============================================================ */

    .fc2-enh-settings-primary-nav {
        display:flex;
        width: var(--fc2-sidebar-width);
        flex-direction:column;
        gap:0;
        padding:var(--fc2-space-sm) 0;
        border-right: var(--fc2-border-width) solid var(--fc2-border);
        background:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-ghost));
        overflow-y:auto;
        flex-shrink:0;
    }

    .fc2-enh-tab-btn {
        display:flex;
        align-items:center;
        gap: var(--fc2-space-sm);
        width:100%;
        padding: var(--fc2-space-base) var(--fc2-space-md);
        background:transparent;
        color:var(--fc2-text);
        opacity: var(--fc2-opacity-dim);
        border:none;
        border-bottom: var(--fc2-border-width) solid var(--fc2-border);
        border-radius:0;
        font-size: var(--fc2-text-sm);
        font-weight: var(--fc2-font-semibold);
        text-align:left;
        transition:all var(--fc2-motion-fast) var(--fc2-ease-standard);
        cursor:pointer;
        position:relative;
    }

    .fc2-enh-tab-btn:last-child {
        border-bottom:none;
    }

    .fc2-enh-tab-btn:hover {
        background:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle));
        color:var(--fc2-text);
    }

    .fc2-enh-tab-btn:focus-visible {
        outline:calc(var(--fc2-border-width) * 2) solid var(--fc2-primary);
        outline-offset:calc(-1 * var(--fc2-space-xxs));
    }

    .fc2-enh-tab-btn.active {
        background:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle));
        color:var(--fc2-primary);
        font-weight: var(--fc2-font-semibold);
        opacity:1;
        box-shadow:inset calc(var(--fc2-border-width) * 3) 0 0 var(--fc2-primary);
    }

    .fc2-enh-tab-btn .fc2-icon {
        font-size:1.1em;
        opacity:0.8;
    }

    .fc2-enh-tab-btn.active .fc2-icon {
        opacity:1;
    }

    .fc2-enh-tab-btn:active {
        transform:scale(0.96);
    }

    .fc2-tab-content-wrapper > :is(.fc2-dashboard-container, .fc2-data-container, .fc2-settings-tab) {
        display:flex;
        flex-direction:column;
        gap: var(--fc2-space-md);
        min-width:0;
        min-height:100%;
    }

    .fc2-tab-content-wrapper:not(.full-width) > :is(.fc2-dashboard-container, .fc2-data-container, .fc2-settings-tab) {
        width:min(100%, var(--fc2-layout-max-width));
        margin:0 auto;
    }

    /* Tab Content Transitions */
    .fc2-tab-content-wrapper {
        height:100%;
        overflow-y:auto;
        padding: var(--fc2-space-lg) var(--fc2-space-lg) var(--fc2-space-lg);
        scrollbar-width:thin;
        transition: opacity var(--fc2-motion-slow) var(--fc2-ease-out), transform var(--fc2-motion-slow) var(--fc2-ease-out);
        opacity: 0;
        transform: translateY(var(--fc2-space-md)) scale(0.98);
        will-change: opacity, transform;
    }

    .fc2-tab-content-wrapper.fc2-entering {
        opacity: 1;
        transform: translateY(0) scale(1);
    }

    .fc2-tab-content-wrapper.fc2-leaving {
        opacity: 0;
        transform: translateY(calc(-1 * var(--fc2-space-md))) scale(1.02);
        pointer-events: none;
    }

    /* Mobile Bottom Navigation */
    @media(max-width:768px) {
        .fc2-enh-settings-primary-nav {
            width:100%;
            flex-direction:row;
            flex-wrap:wrap;
            overflow-x:visible;
            border-right:none;
            border-bottom:var(--fc2-border-width) solid var(--fc2-border);
            padding:0.6rem 0.75rem;
            gap:0.5rem;
        }

        .fc2-enh-nav-label {
            display:none;
        }

        .fc2-tab-content-wrapper {
            height:auto;
            overflow:visible;
            padding:1rem 1rem calc(1rem + env(safe-area-inset-bottom));
        }

        .fc2-tab-content-wrapper > :is(.fc2-dashboard-container, .fc2-data-container, .fc2-settings-tab) {
            gap:0.85rem;
        }

        .fc2-enh-tab-btn {
            flex-direction:row;
            gap: var(--fc2-space-sm);
            padding: var(--fc2-space-sm) var(--fc2-space-base);
            font-size: var(--fc2-text-xs);
            justify-content:center;
            border-radius:var(--fc2-radius-full);
            flex:1 1 auto;
            min-width:0;
            text-align:center;
            white-space:normal;
            line-height:1;
            background:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-ghost));
            border:var(--fc2-border-width) solid var(--fc2-border);
        }

        .fc2-enh-tab-btn.active {
            background:var(--fc2-primary);
            color:var(--fc2-on-primary);
            border-color:transparent;
        }

        .fc2-enh-tab-btn .fc2-icon {
            font-size:1.4em;
            margin-bottom:var(--fc2-space-xxs);
        }
    }
`;

  const settings = (_C) => `
    /* ============================================================
       SETTINGS GROUPS & PORTALS
       ============================================================ */

    .fc2-enh-settings-group,
    .fc2-panel-card {
        display:flex;
        flex-direction:column;
        gap:0;
        padding:0;
        background:var(--fc2-surface-item);
        border:var(--fc2-border-width) solid var(--fc2-border);
        border-radius:var(--fc2-radius-xl);
        box-shadow:var(--fc2-shadow-sm);
        backdrop-filter:blur(calc(var(--fc2-blur) * 1.5));
        -webkit-backdrop-filter:blur(calc(var(--fc2-blur) * 1.5));
        transition:all var(--fc2-motion-fast) var(--fc2-ease-standard);
        height:100%;
        position:relative;
        overflow:hidden;
        will-change: background-color, border-color, transform;
    }

    .fc2-enh-settings-group:hover,
    .fc2-panel-card:hover {
        background: rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle));
        border-color: rgba(var(--fc2-primary-rgb), var(--fc2-opacity-12));
    }

    .fc2-enh-settings-group h3,
    .fc2-panel-card-heading {
        display:flex;
        align-items:center;
        gap: var(--fc2-space-sm);
        margin:0;
        padding:var(--fc2-space-base) var(--fc2-space-md);
        border-bottom: var(--fc2-border-width) solid var(--fc2-border);
        background:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-ghost));
        transition:background-color var(--fc2-motion-fast);
    }

    .fc2-enh-settings-group h3 {
        font-size:var(--fc2-text-xs);
        font-weight: var(--fc2-font-bold);
        text-transform:uppercase;
        letter-spacing:0.08em;
        opacity: var(--fc2-opacity-strong);
    }

    .fc2-panel-card-heading .fc2-icon {
        font-size: var(--fc2-text-lg);
        opacity: var(--fc2-opacity-dim);
        color:var(--fc2-text);
    }

    .fc2-card-title {
        font-size: var(--fc2-text-sm);
        font-weight: var(--fc2-font-semibold);
        color:var(--fc2-text);
        opacity: var(--fc2-opacity-full);
    }

    .fc2-panel-card-body {
        display:flex;
        flex-direction:column;
        padding:0;
        margin:0;
        background:transparent;
    }

    .portal-grid {
        display:grid;
        grid-template-columns:repeat(auto-fill,minmax(var(--fc2-layout-portal-min-width),1fr));
        gap:0;
        width:100%;
        box-sizing:border-box;
    }

    .portal-item {
        display:flex;
        align-items:center;
        gap: var(--fc2-space-base);
        padding:var(--fc2-space-sm) var(--fc2-space-md);
        border:none;
        border-bottom: var(--fc2-border-width) solid rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle));
        border-radius:0;
        cursor:pointer;
        transition:all var(--fc2-motion-base) var(--fc2-ease-out);
        background:transparent;
    }

    .portal-item:last-child {
        border-bottom:none;
    }

    .portal-item span {
        color: var(--fc2-text) !important;
        font-weight: var(--fc2-font-medium) !important;
        font-size: var(--fc2-text-sm) !important;
        opacity: var(--fc2-opacity-strong);
    }

    .portal-item:hover {
        background:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle));
    }

    .portal-item.active {
        background: rgba(var(--fc2-primary-rgb), var(--fc2-opacity-ghost));
        box-shadow: inset 0 0 0 var(--fc2-border-width) rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle));
    }

    .fc2-filter-chip {
        padding: var(--fc2-space-xs) var(--fc2-space-base);
        background:var(--fc2-surface-item);
        border:var(--fc2-border-width) solid var(--fc2-border);
        border-radius:var(--fc2-radius-lg);
        font-size: var(--fc2-text-xs);
        cursor:pointer;
        transition:all var(--fc2-motion-fast) ease;
        color:var(--fc2-text-dim);
    }

    .fc2-filter-chip.active {
        background:var(--fc2-primary);
        border-color:var(--fc2-primary);
        color:var(--fc2-on-primary);
        box-shadow:0 0 var(--fc2-btn-pad-xs) rgba(var(--fc2-primary-rgb),var(--fc2-opacity-30));
    }

    .fc2-filter-chip:focus-visible {
        outline:calc(var(--fc2-border-width) * 2) solid var(--fc2-primary);
        outline-offset:var(--fc2-space-xxs);
    }

    .fc2-settings-grid {
        display:grid;
        grid-template-columns:minmax(0,1.3fr) minmax(var(--fc2-layout-pane-width),0.9fr);
        gap:1.5rem;
        align-items:start;
    }

    .fc2-settings-grid-main,
    .fc2-settings-grid-side {
        display:grid;
        gap:1rem;
        align-content:start;
    }

    .fc2-portal-actions {
        display:flex;
        align-items:center;
        gap: var(--fc2-space-sm);
        padding:var(--fc2-space-sm) var(--fc2-space-md);
        background:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-ghost));
        border-bottom:var(--fc2-border-width) solid var(--fc2-border);
    }

    .fc2-settings-tab {
        display:flex;
        flex-direction:column;
        gap:1rem;
    }

    .fc2-settings-tab .fc2-panel-card,
    .fc2-data-container .fc2-panel-card {
        /* Handled by global .fc2-panel-card */
    }

    .fc2-data-container .fc2-enh-form-row {
        flex-direction:row!important;
        justify-content:flex-start;
        align-items:center;
        border-bottom:var(--fc2-border-width) solid var(--fc2-border);
        padding:var(--fc2-space-sm) var(--fc2-space-md);
        gap:var(--fc2-space-md);
    }

    .fc2-data-container .fc2-enh-form-row .fc2-enh-label {
        flex:0 0 var(--fc2-layout-rail-width);
        margin-bottom:0;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
        opacity:0.7;
    }

    .fc2-data-container .fc2-enh-form-row .fc2-enh-select,
    .fc2-data-container .fc2-enh-form-row .fc2-enh-input,
    .fc2-data-container .fc2-enh-form-row .fc2-input-group {
        flex:1;
        width:auto;
    }

    .fc2-data-container .fc2-enh-form-row:last-child {
        border-bottom:none;
    }

    .fc2-settings-preset-bar {
        display:none;
    }

    .fc2-settings-card-grid {
        display:flex;
        flex-direction:column;
        align-items:stretch;
        width:100%;
    }

    .fc2-settings-advanced-block {
        margin-top: var(--fc2-space-base);
        padding-top: var(--fc2-space-base);
        border-top: var(--fc2-border-width) dashed rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle));
    }

    .fc2-settings-advanced-label {
        font-size: var(--fc2-text-xs) !important;
        font-weight: var(--fc2-font-semibold) !important;
        color:var(--fc2-text-muted);
        margin-bottom: var(--fc2-space-sm);
        letter-spacing:0.02em;
        text-transform:uppercase;
    }

    .fc2-panel-card.warning {
        border-color:rgba(var(--fc2-warn-rgb),0.2);
    }

    .fc2-panel-card.warning h4 .fc2-icon {
        color:var(--fc2-warn);
    }

    .fc2-panel-card.full-width {
        grid-column:1/-1;
    }


    .fc2-settings-empty-state {
        display:none;
        padding:1.25rem;
        border:var(--fc2-border-width) dashed rgba(var(--fc2-primary-rgb),var(--fc2-opacity-24));
        border-radius:var(--fc2-radius-lg);
        background:rgba(var(--fc2-primary-rgb),var(--fc2-opacity-04));
    }

    .fc2-settings-empty-title {
        font-size: var(--fc2-text-base) !important;
        font-weight: var(--fc2-font-bold) !important;
        color:var(--fc2-text);
        margin-bottom: var(--fc2-space-xs);
    }

    .fc2-settings-empty-hint {
        font-size: var(--fc2-text-xs) !important;
        color:var(--fc2-text-muted);
        line-height: var(--fc2-line-base);
    }

    .fc2-settings-tab.is-advanced-hidden .fc2-panel-card.is-advanced,
    .fc2-settings-tab.is-advanced-hidden .fc2-settings-advanced-block {
        display:none;
    }

    .fc2-settings-tab.is-advanced-hidden .fc2-settings-grid {
        grid-template-columns:minmax(0,1fr);
    }

    .fc2-settings-tab.is-advanced-hidden .fc2-settings-grid-side {
        display:none;
    }

    .fc2-divider {
        height:var(--fc2-border-width);
        background:var(--fc2-border);
        margin:var(--fc2-space-base) 0;
        opacity:0.6;
    }

    .fc2-grid-actions {
        display:flex;
        flex-wrap:wrap;
        align-items:stretch;
        gap:var(--fc2-space-sm);
    }

    .fc2-grid-actions,
    .fc2-debug-actions,
    .fc2-folder-actions,
    .fc2-sync-result-panel .fc2-card-actions,
    .fc2-auth-section .fc2-card-actions,
    .fc2-data-overview-actions {
        display:flex;
        flex-direction:row;
        align-items:stretch;
        justify-content:flex-start;
        flex-wrap:wrap;
        gap:0 !important;
        padding:0;
        border:var(--fc2-border-width) solid var(--fc2-border);
        border-radius:var(--fc2-radius-md);
        background:var(--fc2-surface-item);
        box-shadow:var(--fc2-shadow-sm);
        backdrop-filter:blur(var(--fc2-blur));
        -webkit-backdrop-filter:blur(var(--fc2-blur));
        overflow:hidden;
        min-height: var(--fc2-btn-height-md);
    }

    .fc2-grid-actions > .fc2-enh-btn,
    .fc2-debug-actions > .fc2-enh-btn,
    .fc2-folder-actions > .fc2-enh-btn,
    .fc2-sync-result-panel .fc2-card-actions > .fc2-enh-btn,
    .fc2-auth-section .fc2-card-actions > .fc2-enh-btn,
    .fc2-data-overview-actions > .fc2-enh-btn {
        flex:1 0 auto;
        min-width:var(--fc2-layout-sidebar-min-width);
        height: var(--fc2-btn-height-md) !important;
        background:transparent !important;
        border:none !important;
        border-radius:0 !important;
        margin:0 !important;
        padding:0 var(--fc2-space-sm) !important;
        box-shadow:none !important;
        backdrop-filter:none !important;
        font-size:var(--fc2-text-xs) !important;
    }

    .fc2-grid-actions > .fc2-enh-btn:not(:last-child),
    .fc2-debug-actions > .fc2-enh-btn:not(:last-child),
    .fc2-folder-actions > .fc2-enh-btn:not(:last-child),
    .fc2-sync-result-panel .fc2-card-actions > .fc2-enh-btn:not(:last-child),
    .fc2-auth-section .fc2-card-actions > .fc2-enh-btn:not(:last-child),
    .fc2-data-overview-actions > .fc2-enh-btn:not(:last-child) {
        border-right: var(--fc2-border-width) solid rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle)) !important;
        border-bottom: var(--fc2-border-width) solid rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle)) !important;
    }

    .fc2-grid-actions > .fc2-enh-btn:hover,
    .fc2-debug-actions > .fc2-enh-btn:hover,
    .fc2-sync-result-panel .fc2-card-actions > .fc2-enh-btn:hover,
    .fc2-auth-section .fc2-card-actions > .fc2-enh-btn:hover,
    .fc2-data-overview-actions > .fc2-enh-btn:hover {
        background:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle)) !important;
        transform:none !important;
    }

    .fc2-grid-actions.compact {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(var(--fc2-layout-rail-width), 1fr));
        gap: 0;
    }

    .fc2-grid-actions.compact > .fc2-enh-btn {
        min-width: 0;
        height: var(--fc2-btn-height-sm) !important;
        font-size: var(--fc2-text-xs) !important;
    }

    .fc2-auth-section {
        margin-top: var(--fc2-space-base);
        padding-top: var(--fc2-space-base);
        border-top:var(--fc2-border-width) solid var(--fc2-border);
    }

    .fc2-auth-section .dim {
        font-size: var(--fc2-text-xs)!important;
        color:var(--fc2-text-muted);
    }


    .fc2-data-overview-grid {
        display:flex;
        flex-direction:column;
        align-items:stretch;
        gap:0;
    }

    .fc2-data-overview-grid .fc2-stat-item {
        border-bottom:var(--fc2-border-width) solid var(--fc2-border);
    }

    .fc2-data-overview-grid .fc2-stat-item:last-child {
        border-bottom:none;
    }

    .fc2-data-overview-sync {
        display:flex;
        flex-direction:column;
        align-items:flex-start;
        gap: var(--fc2-space-xs);
    }

    .fc2-data-overview-meta {
        font-size: var(--fc2-text-xs)!important;
        color:var(--fc2-text-muted);
        line-height:1.4;
    }

    .fc2-data-overview-actions {
        flex-wrap:nowrap;
        border:var(--fc2-border-width) solid var(--fc2-border);
        border-radius:var(--fc2-radius-full);
        margin:var(--fc2-space-base) 0;
        height: var(--fc2-btn-height-md);
    }

    .fc2-sync-summary {
        display:flex;
        align-items:flex-start;
        gap: var(--fc2-space-base);
        padding:var(--fc2-space-sm) var(--fc2-space-md);
        background:transparent;
        border:none;
        border-bottom:var(--fc2-border-width) solid var(--fc2-border);
    }

    .fc2-sync-result-panel {
        display:flex;
        flex-direction:column;
        gap:0;
        padding:0;
        margin:0;
        background:transparent;
        border:none;
        border-bottom:var(--fc2-border-width) solid var(--fc2-border);
    }

    .fc2-sync-result-body {
        padding:var(--fc2-space-sm) var(--fc2-space-md);
        display:flex;
        flex-direction:column;
        gap: var(--fc2-space-xs);
        border-bottom:var(--fc2-border-width) solid var(--fc2-border);
    }

    .fc2-sync-result-summary {
        font-size: var(--fc2-text-sm)!important;
        font-weight: var(--fc2-font-semibold)!important;
        color:var(--fc2-text);
        line-height:1.4;
    }

    .fc2-sync-conflicts-list {
        margin-top: var(--fc2-space-xs);
        display:flex;
        flex-direction:column;
        gap: var(--fc2-space-xxs);
    }

    .fc2-sync-summary-copy {
        display:flex;
        flex-direction:column;
        gap:var(--fc2-space-xxs);
        min-width:0;
    }

    .fc2-sync-summary-title {
        font-size: var(--fc2-text-sm)!important;
        font-weight: var(--fc2-font-bold)!important;
        color:var(--fc2-text);
    }

    .fc2-sync-summary-detail {
        font-size: var(--fc2-text-xs)!important;
        color:var(--fc2-text-muted);
        line-height:1.4;
    }

    .fc2-sync-status-pill {
        display:inline-flex;
        align-items:center;
        justify-content:center;
        min-width: var(--fc2-btn-height-lg);
        padding: var(--fc2-space-xxs) var(--fc2-space-sm);
        border-radius:var(--fc2-radius-full);
        border:var(--fc2-border-width) solid rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle));
        font-size: var(--fc2-text-xs)!important;
        font-weight: var(--fc2-font-bold)!important;
        white-space:nowrap;
        text-transform:uppercase;
        letter-spacing:0.02em;
    }

    .fc2-sync-status-pill.idle {
        background:var(--fc2-surface-item);
        color:var(--fc2-text-muted);
        border-color:var(--fc2-border);
    }

    .fc2-sync-status-pill.syncing {
        background:rgba(var(--fc2-primary-rgb),var(--fc2-opacity-12));
        color:var(--fc2-primary);
        border-color:rgba(var(--fc2-primary-rgb),var(--fc2-opacity-20));
    }

    .fc2-sync-status-pill.success {
        background:rgba(var(--fc2-success-rgb),var(--fc2-opacity-12));
        color:var(--fc2-success);
        border-color:rgba(var(--fc2-success-rgb),var(--fc2-opacity-20));
    }

    .fc2-sync-status-pill.error {
        background:rgba(var(--fc2-danger-rgb),var(--fc2-opacity-12));
        color:var(--fc2-danger);
        border-color:rgba(var(--fc2-danger-rgb),var(--fc2-opacity-20));
    }

    .fc2-sync-status-pill.conflict {
        background:rgba(var(--fc2-warn-rgb),var(--fc2-opacity-12));
        color:var(--fc2-warn);
        border-color:rgba(var(--fc2-warn-rgb),var(--fc2-opacity-20));
    }


    /* ============================================================
       DEBUG TAB
       ============================================================ */

    .fc2-debug-container {
        display:flex;
        flex-direction:column;
        gap: var(--fc2-space-base);
        height:100%;
    }

    .fc2-debug-header {
        display:flex;
        flex-direction:column;
        gap: var(--fc2-space-sm);
        flex-shrink:0;
        padding: var(--fc2-space-md) var(--fc2-space-md);
        border:var(--fc2-border-width) solid var(--fc2-border);
        border-radius:var(--fc2-radius-md);
        background:linear-gradient(180deg, rgba(var(--fc2-primary-rgb), var(--fc2-opacity-ghost)), rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle)));
    }

    .fc2-debug-actions {
        display:flex;
        gap: var(--fc2-space-sm);
        flex-wrap:wrap;
    }

    .fc2-debug-filters {
        display:flex;
        align-items:center;
        gap: var(--fc2-space-base);
        flex-wrap:wrap;
        padding-top: var(--fc2-space-base);
        border-top:var(--fc2-border-width) solid rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle));
    }

    .fc2-debug-filters .fc2-enh-input {
        flex:1 1 var(--fc2-layout-flex-basis-lg);
        max-width:var(--fc2-layout-pane-width);
    }

    .fc2-log-list-container {
        flex:1;
        overflow-y:auto;
        min-height:0;
        border:var(--fc2-border-width) solid var(--fc2-border);
        border-radius:var(--fc2-radius-sm);
        background:rgba(var(--fc2-black-rgb),var(--fc2-opacity-20));
        padding:var(--fc2-space-sm);
        scrollbar-width:thin;
    }

    .fc2-log-item {
        display:flex;
        align-items:flex-start;
        gap: var(--fc2-space-sm);
        padding: var(--fc2-space-xs) var(--fc2-space-sm);
        border-bottom:var(--fc2-border-width) solid rgba(var(--fc2-primary-rgb), var(--fc2-opacity-ghost));
        font-family:var(--fc2-font-mono)!important;
        font-size: var(--fc2-text-xs)!important;
        line-height: var(--fc2-line-base)!important;
        transition:background var(--fc2-motion-fast);
    }

    .fc2-log-item:hover { background:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-ghost)); }
    .fc2-log-item:last-child { border-bottom:none; }

    .fc2-log-item.level-error { border-left:calc(var(--fc2-border-width) * 3) solid var(--fc2-danger); }
    .fc2-log-item.level-warn { border-left:calc(var(--fc2-border-width) * 3) solid var(--fc2-warn); }
    .fc2-log-item.level-info { border-left:calc(var(--fc2-border-width) * 3) solid var(--fc2-text-dim); }
    .fc2-log-item.level-success { border-left:calc(var(--fc2-border-width) * 3) solid var(--fc2-success); }
    .fc2-log-item.level-debug { border-left:calc(var(--fc2-border-width) * 3) solid var(--fc2-text-muted); }

    .fc2-log-time { color:var(--fc2-text-muted); white-space:nowrap; flex-shrink:0; }
    .fc2-log-level { font-weight: var(--fc2-font-semibold)!important; white-space:nowrap; flex-shrink:0; min-width: var(--fc2-btn-height-lg); }
    .fc2-log-module { color:var(--fc2-text-dim); white-space:nowrap; flex-shrink:0; }
    .fc2-log-msg { color:var(--fc2-text); word-break:break-word; flex:1; }

    .level-error .fc2-log-level { color:var(--fc2-danger); }
    .level-warn .fc2-log-level { color:var(--fc2-warn); }
    .level-info .fc2-log-level { color:var(--fc2-text-dim); }
    .level-success .fc2-log-level { color:var(--fc2-success); }
    .level-debug .fc2-log-level { color:var(--fc2-text-muted); }

    .fc2-log-payload {
        margin: var(--fc2-space-xs) 0 0 0;
        padding: var(--fc2-space-sm);
        background:rgba(var(--fc2-black-rgb),var(--fc2-opacity-30));
        border-radius:var(--fc2-radius-sm);
        font-size: var(--fc2-text-xs)!important;
        color:var(--fc2-text-dim);
        overflow-x:auto;
        white-space:pre-wrap;
        word-break:break-all;
    }

    .fc2-log-payload-toggle {
        padding:var(--fc2-space-xxs) var(--fc2-space-sm);
        background:var(--fc2-surface-item);
        border:var(--fc2-border-width) solid var(--fc2-border);
        border-radius:var(--fc2-radius-sm);
        color:var(--fc2-text-dim);
        font-size: var(--fc2-text-xs)!important;
        cursor:pointer;
        margin-left:auto;
        flex-shrink:0;
        transition:all var(--fc2-motion-fast);
    }

    .fc2-log-payload-toggle:hover {
        background:rgba(var(--fc2-primary-rgb),0.1);
        color:var(--fc2-text);
    }

    /* ============================================================
       SCRAPER DIAGNOSIS
       ============================================================ */

    .fc2-scraper-list {
        display: flex;
        flex-direction: column;
        gap: var(--fc2-space-sm);
        margin-bottom: var(--fc2-space-md);
    }

    .fc2-stat-item {
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:var(--fc2-space-sm) var(--fc2-space-md);
        width:100%;
        box-sizing:border-box;
        border-bottom: var(--fc2-border-width) solid var(--fc2-border);
    }

    .fc2-stat-item:last-child {
        border-bottom: none;
    }

    .fc2-stat-value {
        font-size: var(--fc2-text-sm) !important;
        font-weight: var(--fc2-font-bold) !important;
        color:var(--fc2-primary);
        order:2;
    }

    .fc2-stat-label {
        font-size: var(--fc2-text-sm) !important;
        font-weight: var(--fc2-font-semibold) !important;
        color:var(--fc2-text-dim);
        order:1;
        opacity: var(--fc2-opacity-strong);
    }

    /* Scraper Diagnosis */
    .fc2-scraper-list {
        display: flex;
        flex-direction: column;
        gap: 0;
        border: var(--fc2-border-width) solid var(--fc2-border);
        border-radius: var(--fc2-radius-md);
        overflow: hidden;
    }

    .fc2-scraper-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--fc2-space-sm) var(--fc2-space-base);
        background: transparent;
        border-bottom: var(--fc2-border-width) solid var(--fc2-border);
        transition: all var(--fc2-motion-fast) ease;
    }

    .fc2-scraper-row:last-child {
        border-bottom: none;
    }

    .fc2-scraper-row:hover {
        background: rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle));
    }

    .scraper-info {
        display: flex;
        align-items: center;
        gap: var(--fc2-space-sm);
    }

    .scraper-label {
        font-size: var(--fc2-text-sm) !important;
        font-weight: var(--fc2-font-semibold) !important;
        color: var(--fc2-text);
    }

    .scraper-url {
        font-size: var(--fc2-text-xs);
        color: var(--fc2-text-muted);
        transition: color var(--fc2-motion-base);
    }

    .scraper-url:hover {
        color: var(--fc2-primary);
    }

    .status-indicator {
        font-size: var(--fc2-text-xs) !important;
        font-weight: var(--fc2-font-bold) !important;
        padding: var(--fc2-space-xxs) var(--fc2-btn-pad-xs);
        border-radius: var(--fc2-radius-full);
        text-transform: uppercase;
        border: var(--fc2-border-width) solid transparent;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .status-indicator.ok {
        background: rgba(var(--fc2-success-rgb), var(--fc2-opacity-10));
        color: var(--fc2-success);
    }

    .status-indicator.cf {
        background: rgba(var(--fc2-warn-rgb), var(--fc2-opacity-10));
        color: var(--fc2-warn);
    }

    .status-indicator.error {
        background: rgba(var(--fc2-danger-rgb), var(--fc2-opacity-10));
        color: var(--fc2-danger);
    }

    .status-indicator.429 {
        background: rgba(var(--fc2-warn-rgb), var(--fc2-opacity-20));
        color: var(--fc2-warn);
    }

    @keyframes fc2-pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
    }

    /* ============================================================
       ABOUT TAB
       ============================================================ */

    .fc2-about-tab {
        display:flex;
        flex-direction:column;
        gap: var(--fc2-space-lg);
    }

    .fc2-about-header {
        text-align:center;
        padding: var(--fc2-space-xl) 0 var(--fc2-space-md);
    }

    .fc2-version-badge {
        display:inline-block;
        margin-top: var(--fc2-space-sm);
        padding: var(--fc2-space-xs) var(--fc2-space-md);
        background:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-ghost));
        border:var(--fc2-border-width) solid rgba(var(--fc2-primary-rgb),var(--fc2-opacity-15));
        border-radius:var(--fc2-radius-full);
        font-size: var(--fc2-text-xs) !important;
        font-weight: var(--fc2-font-bold) !important;
        color:var(--fc2-text);
        letter-spacing:0.1em;
        text-transform:uppercase;
    }

    .fc2-about-desc {
        margin-top:var(--fc2-space-base);
        color:var(--fc2-text-dim);
        font-size: var(--fc2-text-base)!important;
        line-height:1.6!important;
        max-width:var(--fc2-layout-dialog-max-width);
        margin-left:auto;
        margin-right:auto;
    }

    .fc2-about-content {
        font-size: var(--fc2-text-sm)!important;
        line-height: var(--fc2-line-base)!important;
        color:var(--fc2-text-dim);
    }

    .fc2-about-content.dmca {
        color:var(--fc2-text-muted);
    }

    .fc2-about-footer {
        text-align:center;
        padding: var(--fc2-space-lg) 0;
        font-size: var(--fc2-text-sm)!important;
        color:var(--fc2-text-muted);
    }

    .fc2-link {
        color:var(--fc2-primary);
        text-decoration:none;
        transition:opacity var(--fc2-motion-fast);
    }

    .fc2-link:hover { opacity:0.7; }

    /* ============================================================
       DATA TAB PREVIEW & LOGS
       ============================================================ */
    .fc2-backup-preview-lines {
        display:flex;
        flex-direction:column;
        background:rgba(var(--fc2-black-rgb),var(--fc2-opacity-15));
        max-height:var(--fc2-layout-log-max-height);
        overflow-y:auto;
        border-bottom:var(--fc2-border-width) solid var(--fc2-border);
        scrollbar-width:thin;
    }

    .fc2-backup-preview-line {
        padding:var(--fc2-space-xs) var(--fc2-space-md);
        font-size: var(--fc2-text-xs)!important;
        font-family:var(--fc2-font-mono);
        color:var(--fc2-text-dim);
        border-bottom:var(--fc2-border-width) solid rgba(var(--fc2-primary-rgb), var(--fc2-opacity-ghost));
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
    }

    .fc2-backup-preview-line:last-child {
        border-bottom:none;
    }

    @media(max-width:768px) {
        .fc2-settings-grid { grid-template-columns:1fr; }
        .fc2-settings-searchbar {
            flex-direction:column;
            align-items:stretch;
        }
        .fc2-settings-searchbar .fc2-enh-input,
        .fc2-debug-filters .fc2-enh-input {
            flex-basis:100%;
            max-width:none;
        }
        .fc2-settings-preset-bar {
            width:100%;
            justify-content:flex-start;
        }
        .fc2-settings-preset-bar > * {
            flex:1 1 var(--fc2-layout-flex-basis-md);
            min-width:0;
        }
        .fc2-settings-card-grid { grid-template-columns:1fr; }
        .fc2-grid-actions { flex-direction:column; }
        .fc2-grid-actions,
        .fc2-debug-actions,
        .fc2-folder-actions,
        .fc2-sync-result-panel .fc2-card-actions,
        .fc2-auth-section .fc2-card-actions,
        .fc2-data-overview-actions {
            padding: var(--fc2-space-sm);
        }
        .fc2-grid-actions,
        .fc2-debug-actions,
        .fc2-sync-result-panel .fc2-card-actions,
        .fc2-auth-section .fc2-card-actions,
        .fc2-data-overview-actions {
            flex-direction:column;
        }
        .fc2-grid-actions > .fc2-enh-btn,
        .fc2-debug-actions > .fc2-enh-btn,
        .fc2-sync-result-panel .fc2-card-actions > .fc2-enh-btn,
        .fc2-auth-section .fc2-card-actions > .fc2-enh-btn,
        .fc2-data-overview-actions > .fc2-enh-btn {
            flex-basis:auto;
        }
        .fc2-portal-actions { flex-wrap:wrap; }
        .fc2-data-overview-meta,
        .fc2-sync-result-summary,
        .fc2-sync-summary-detail {
            overflow-wrap:anywhere;
        }
        .fc2-sync-status-pill,
        .fc2-log-level {
            white-space:normal;
        }
        .fc2-log-level { min-width:0; }
        .fc2-debug-filters { gap: var(--fc2-space-sm); }
        .fc2-log-item { flex-wrap:wrap; gap: var(--fc2-space-xs); }
        .fc2-log-time, .fc2-log-module { display:none; }
    }

    /* Color Picker */
    .fc2-color-picker {
        display: flex;
        flex-wrap: wrap;
        gap: var(--fc2-space-sm);
        padding: var(--fc2-space-xxs) 0;
    }

    .fc2-color-option {
        width: 24px;
        height: 24px;
        border-radius: var(--fc2-radius-full);
        border: 2px solid transparent;
        background-color: var(--option-color);
        cursor: pointer;
        transition: all var(--fc2-motion-fast) var(--fc2-ease-out);
        padding: 0;
        position: relative;
        box-shadow: var(--fc2-shadow-sm);
    }

    .fc2-color-option:hover {
        transform: scale(1.15);
        box-shadow: 0 0 10px var(--option-color);
    }

    .fc2-color-option.is-active {
        border-color: #ffffff;
        transform: scale(1.1);
        box-shadow: 0 0 12px var(--option-color);
    }
    
    .fc2-color-option.is-active::after {
        content: '';
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        border: 1px solid var(--option-color);
        border-radius: var(--fc2-radius-full);
        opacity: 0.5;
    }

    /* Fix for light colors on dark background */
    .fc2-color-option[data-value="#ffffff"].is-active {
        border-color: #000000;
        box-shadow: 0 0 12px rgba(255, 255, 255, 0.4);
    }
`;

  const modal = (_C) => `
    /* ============================================================
       MODAL & SETTINGS PANEL
       ============================================================ */

    .enh-modal-backdrop {
        position:fixed;
        inset:0;
        z-index:var(--fc2-z-overlay);
        background:rgba(var(--fc2-black-rgb), var(--fc2-opacity-muted));
        transition:background-color var(--fc2-motion-base) var(--fc2-ease-standard), backdrop-filter var(--fc2-motion-base) var(--fc2-ease-standard);
        backdrop-filter:blur(var(--fc2-blur));
        -webkit-backdrop-filter:blur(var(--fc2-blur));
        pointer-events: auto;
    }

    .enh-modal-panel {
        position:fixed;
        top:50%;
        left:50%;
        z-index:var(--fc2-z-modal);
        background-color:var(--fc2-liquid-bg);
        color:var(--fc2-text);
        border:var(--fc2-border-width) solid transparent;
        background-clip:padding-box,border-box;
        background-origin:padding-box,border-box;
        background-image: linear-gradient(to bottom,transparent,transparent), var(--fc2-liquid-iridescent);
        border-radius:var(--fc2-radius-lg);
        box-shadow:var(--fc2-rim-light), var(--fc2-shadow);
        overflow:hidden;
        animation:fc2-pop-in var(--fc2-motion-slow) var(--fc2-ease-out);
        transform:translate(-50%,-50%);
        will-change:transform;
        pointer-events: auto;
    }

    .fc2-enh-settings-panel {
        width:min(var(--fc2-layout-max-width), calc(100vw - var(--fc2-space-xl)));
        height:min(var(--fc2-layout-modal-max-height), calc(100dvh - var(--fc2-space-xl)));
        display:flex;
        flex-direction:column;
        overflow:hidden;
        position:fixed;
        top:50%;
        left:50%;
        z-index:var(--fc2-z-modal) !important;
        transform:translate(-50%, -50%) !important;
        background:var(--fc2-liquid-bg);
        backdrop-filter:none;
        -webkit-backdrop-filter:none;
        box-shadow:inset 0 var(--fc2-border-width) 0 rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle)), var(--fc2-shadow);
        pointer-events: auto;
        border-radius:var(--fc2-radius-lg);
        border:var(--fc2-border-width) solid rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle));
    }

    .fc2-enh-settings-header {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:var(--fc2-space-md);
        padding:var(--fc2-space-md) var(--fc2-space-lg);
        background:linear-gradient(180deg, rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle)), rgba(var(--fc2-primary-rgb), var(--fc2-opacity-ghost)));
        border-bottom: var(--fc2-border-width) solid var(--fc2-border);
        flex-shrink:0;
        z-index: var(--fc2-z-modal);
    }

    .fc2-enh-settings-heading {
        display:flex;
        align-items:center;
        min-width:0;
    }

    .fc2-enh-settings-header h2 {
        margin:0;
        font-size:var(--fc2-text-lg);
        font-weight: var(--fc2-font-bold);
        line-height:var(--fc2-line-tight);
        letter-spacing:0.01em;
    }

    .fc2-header-actions {
        display:flex;
        align-items:center;
        gap:var(--fc2-space-sm);
        flex-shrink:0;
    }

    .fc2-enh-settings-body {
        display:flex;
        flex:1;
        min-height:0;
        overflow:hidden;
    }

    .fc2-enh-settings-content-shell {
        display:flex;
        flex:1;
        min-width:0;
        min-height:0;
        flex-direction:column;
        overflow:hidden;
    }

    .fc2-enh-settings-content {
        position:relative;
        flex:1;
        min-height:0;
        padding:0;
        overflow:hidden;
        background:linear-gradient(180deg, rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle)), transparent var(--fc2-layout-max-width));
        display:flex;
        flex-direction:column;
    }

    .close-btn {
        display:inline-flex;
        align-items:center;
        justify-content:center;
        width:var(--fc2-space-2xl);
        height:var(--fc2-space-2xl);
        padding:0;
        background:transparent;
        color:var(--fc2-text-dim);
        border:var(--fc2-border-width) solid transparent;
        border-radius:var(--fc2-radius-sm);
        cursor:pointer;
        transition:background-color var(--fc2-motion-fast) var(--fc2-ease-standard), color var(--fc2-motion-fast) var(--fc2-ease-standard), border-color var(--fc2-motion-fast) var(--fc2-ease-standard), box-shadow var(--fc2-motion-fast) var(--fc2-ease-standard);
    }

    .close-btn:hover {
        background:var(--fc2-surface-item);
        color:var(--fc2-text);
        border-color:var(--fc2-border);
    }

    .close-btn:focus-visible {
        outline:calc(var(--fc2-border-width) * 2) solid var(--fc2-primary);
        outline-offset:var(--fc2-space-xxs);
        box-shadow:var(--fc2-focus-ring);
    }

    .fc2-loading-overlay {
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        gap:var(--fc2-space-base);
        height:100%;
        min-height:var(--fc2-layout-panel-min-height);
        color:var(--fc2-text-dim);
    }

    .fc2-loading-spinner {
        width:var(--fc2-space-xl);
        height:var(--fc2-space-xl);
        border: var(--fc2-border-width) solid var(--fc2-border);
        border-top-color:var(--fc2-primary);
        border-radius: var(--fc2-radius-full);
        animation:fc2-spin 0.8s linear infinite;
    }

    .fc2-loading-text {
        font-size:var(--fc2-text-sm)!important;
        opacity:0.6;
    }

    .fc2-error-state {
        display:flex;
        align-items:center;
        justify-content:center;
        height:100%;
        min-height:var(--fc2-layout-panel-min-height);
        color:var(--fc2-danger);
        font-size:var(--fc2-text-base)!important;
    }

    @media(max-width:768px) {
        .fc2-enh-settings-body { flex-direction:column; }
        .fc2-enh-settings-content-shell { order:1; }
        .fc2-enh-settings-panel {
            width:100vw;
            height:100dvh;
            top:0;
            left:0;
            border-radius:0;
            border:none;
            transform:none !important;
        }
        .fc2-enh-settings-content {
            overflow-y:auto;
            -webkit-overflow-scrolling:touch;
            overscroll-behavior:contain;
        }
        .fc2-enh-settings-header { padding:0.85rem 1rem; }
    }
`;

  const actionsheet = (_C) => `
    /* ============================================================
       ACTION SHEET (MOBILE)
       ============================================================ */
    .fc2-action-sheet-backdrop {
        position:fixed;
        inset:0;
        z-index:var(--fc2-z-actionsheet);
        opacity:0;
        will-change: opacity, visibility;
        visibility:hidden;
        transition:all var(--fc2-motion-base) var(--fc2-ease-standard);
        pointer-events: auto;
    }

    .fc2-action-sheet-backdrop.active {
        opacity:1;
        visibility:visible;
    }

    .fc2-action-sheet {
        position:fixed;
        left:0;
        right:0;
        bottom:0;
        background:var(--fc2-surface-float);
        border-top-left-radius:var(--fc2-radius-xl);
        will-change: transform;
        border-top-right-radius:var(--fc2-radius-xl);
        z-index:calc(var(--fc2-z-actionsheet) + 1);
        transform:translateY(100%);
        transition:transform var(--fc2-motion-slow) var(--fc2-ease-out);
        padding-bottom:calc(var(--fc2-space-lg) + env(safe-area-inset-bottom,0px));
        border:var(--fc2-border-width) solid var(--fc2-border);
        font-family:var(--fc2-font);
        pointer-events: auto;
    }

    .fc2-action-sheet.desktop {
        top:50%;
        bottom:auto;
        left:50%;
        right:auto;
        width:var(--fc2-layout-actionsheet-width);
        max-width:90vw;
        border-radius:var(--fc2-radius-xl);
        transform:translate(-50%,-50%) scale(0.9);
        box-shadow:var(--fc2-shadow);
        opacity:0;
        visibility:hidden;
        pointer-events:none;
        transition:all var(--fc2-motion-base) var(--fc2-ease-out);
    }

    .fc2-action-sheet.active {
        transform:translateY(0);
    }

    .fc2-action-sheet.desktop.active {
        transform:translate(-50%,-50%) scale(1);
        opacity:1;
        visibility:visible;
        pointer-events:auto;
    }

    .fc2-action-sheet-header {
        display:flex;
        align-items:center;
        justify-content:space-between;
        padding: var(--fc2-space-md) var(--fc2-space-lg);
        border-bottom:var(--fc2-border-width) solid var(--fc2-border);
    }

    .fc2-action-sheet-title {
        font-size: var(--fc2-text-lg) !important;
        font-weight: var(--fc2-font-semibold) !important;
        color:var(--fc2-text);
    }

    .fc2-action-sheet-close-btn {
        background:transparent;
        border:none;
        color:var(--fc2-text-dim);
        font-size: var(--fc2-text-xl) !important;
        cursor:pointer;
        padding:var(--fc2-space-xs);
        line-height:1;
        transition:color var(--fc2-motion-fast);
    }

    .fc2-action-sheet-close-btn:hover {
        color:var(--fc2-text);
    }

    .fc2-action-sheet-close-btn:focus-visible {
        outline:calc(var(--fc2-border-width) * 2) solid var(--fc2-primary);
        outline-offset:var(--fc2-space-xxs);
    }

    .fc2-action-sheet-grid {
        display:grid;
        grid-template-columns:repeat(auto-fill,minmax(calc(var(--fc2-space-2xl) + var(--fc2-space-2xl) + var(--fc2-space-sm) + var(--fc2-space-base)),1fr));
        gap: var(--fc2-space-base);
        padding: var(--fc2-space-lg);
        max-height:60vh;
        overflow-y:auto;
    }

    .fc2-action-sheet-item {
        display:flex;
        flex-direction:column;
        align-items:center;
        gap: var(--fc2-space-sm);
        padding: var(--fc2-space-base);
        background:var(--fc2-surface-item);
        border:var(--fc2-border-width) solid var(--fc2-border);
        border-radius:var(--fc2-radius-md);
        text-decoration:none!important;
        color:var(--fc2-text-dim)!important;
        transition:all var(--fc2-motion-fast);
        text-align:center;
    }

    .fc2-action-sheet-item:hover {
        background:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle));
        border-color:var(--fc2-primary);
        color:var(--fc2-primary)!important;
        transform:translateY(calc(-1 * var(--fc2-space-xxs)));
    }

    .fc2-action-sheet-item:focus-visible {
        outline:calc(var(--fc2-border-width) * 2) solid var(--fc2-primary);
        outline-offset:var(--fc2-space-xxs);
    }

    .fc2-action-sheet-item .fc2-icon {
        font-size: var(--fc2-space-lg);
        margin-bottom: var(--fc2-space-xs);
    }

    .fc2-action-sheet-item span:last-child {
        font-size: var(--fc2-text-xs) !important;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
        width:100%;
    }
`;

  const toolbar = (_C) => `
    /* ============================================================
       PLAYER TOOLBAR (DESKTOP)
       ============================================================ */

    .enh-toolbar {
        width: 100%;
        max-width: min(100%, var(--fc2-layout-max-width));
        margin: var(--fc2-space-md) auto;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        box-sizing: border-box;
        overflow: visible;
        position: relative;
        z-index: var(--fc2-z-dropdown);
    }

    .enh-toolbar--detail {
        margin-top: var(--fc2-space-base);
    }

    .enh-toolbar .info-area {
        display: grid !important;
        grid-template-columns: auto 1fr auto !important;
        align-items: center !important;
        width: 100% !important;
        padding: 0 !important;
        gap: var(--fc2-space-md) !important;
    }

    .enh-toolbar[data-layout="without-actress"] .info-area {
        grid-template-columns: auto 1fr !important;
    }

    .enh-toolbar[data-layout="with-actress"] .info-area {
        grid-template-columns: auto 1fr auto !important;
    }

    .enh-toolbar .toolbar-section-controls {
        grid-column: 1;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        min-width: 0;
        width: auto !important;
    }

    .enh-toolbar .toolbar-section-links {
        grid-column: 3;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        min-width: 0;
        width: auto !important;
    }

    .enh-toolbar .card-top-right-controls,
    .enh-toolbar .resource-links-container {
        position: static !important;
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        align-items: stretch !important;
        background: var(--fc2-surface-item) !important;
        border: var(--fc2-border-width) solid var(--fc2-border) !important;
        border-radius: var(--fc2-radius-full) !important;
        padding: 0 !important;
        box-shadow: var(--fc2-shadow-sm) !important;
        overflow: hidden !important;
        backdrop-filter: blur(var(--fc2-blur)) !important;
        -webkit-backdrop-filter: blur(var(--fc2-blur)) !important;
        height: var(--fc2-btn-height-md) !important;
        gap: 0 !important;
    }

    .enh-toolbar .btn-actress {
        grid-column: 2;
        justify-self: center;
        margin: 0 !important;
        height: var(--fc2-btn-height-md) !important;
        line-height: var(--fc2-line-base) !important;
        padding: 0 var(--fc2-space-lg) !important;
        background: var(--fc2-surface-item) !important;
        border: var(--fc2-border-width) solid var(--fc2-border) !important;
        border-radius: var(--fc2-radius-full) !important;
        box-shadow: var(--fc2-shadow-sm) !important;
        backdrop-filter: blur(var(--fc2-blur)) !important;
        -webkit-backdrop-filter: blur(var(--fc2-blur)) !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        max-width: min(100%, 28rem) !important;
        text-align: center !important;
    }

    .enh-toolbar .card-top-right-controls > *,
    .enh-toolbar .resource-links-container > * {
        background: transparent !important;
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        height: 100% !important;
        padding: 0 var(--fc2-space-md) !important;
        margin: 0 !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        color: var(--fc2-text) !important;
        transition: background var(--fc2-motion-fast), transform var(--fc2-motion-fast);
    }

    .enh-toolbar .resource-links-container > .icon-only {
        padding: 0 var(--fc2-space-sm) !important;
        width: var(--fc2-btn-height-lg) !important;
    }

    .enh-toolbar .card-top-right-controls .fc2-id-badge {
        font-size: var(--fc2-text-sm) !important;
    }

    .enh-toolbar .card-top-right-controls > *:not(:last-child),
    .enh-toolbar .resource-links-container > *:not(:last-child) {
        border-right: var(--fc2-border-width) solid rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle)) !important;
    }

    .enh-toolbar .card-top-right-controls > *:hover,
    .enh-toolbar .resource-links-container > *:hover {
        background: rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle)) !important;
    }
    
    .enh-toolbar .btn-actress:hover {
        background: rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle)) !important;
        border-color: rgba(var(--fc2-primary-rgb), var(--fc2-opacity-10)) !important;
        transform: translateY(calc(-1 * var(--fc2-border-width))) !important;
    }

    .enh-toolbar .resource-links-container .magnet {
        animation: none !important;
        color: var(--fc2-primary) !important;
    }
    
    .enh-toolbar .resource-links-container .magnet:hover {
        background: rgba(var(--fc2-primary-rgb), var(--fc2-opacity-10)) !important;
    }

    @media (max-width: 920px) {
        .enh-toolbar .info-area {
            grid-template-columns: auto minmax(0, 1fr) auto !important;
            gap: var(--fc2-space-sm) !important;
        }
        .enh-toolbar .toolbar-section-controls,
        .enh-toolbar .toolbar-section-links {
            width: auto !important;
        }
        .enh-toolbar .btn-actress {
            max-width: min(100%, 20rem) !important;
        }
    }

    @media (max-width: 768px) and (hover: hover), (max-width: 768px) and (pointer: fine) {
        .enh-toolbar .info-area {
            grid-template-columns: minmax(0, 1fr) auto !important;
        }
        .enh-toolbar .toolbar-section-controls {
            grid-row: 1 !important;
        }
        .enh-toolbar .toolbar-section-links {
            grid-row: 1 !important;
        }
        .enh-toolbar .btn-actress {
            grid-column: 1 / -1 !important;
            grid-row: 2 !important;
            justify-self: center !important;
            height: 34px !important;
            line-height: 32px !important;
            font-size: var(--fc2-text-xs) !important;
            width: fit-content !important;
            max-width: min(100%, 18rem) !important;
            padding: 0 var(--fc2-space-md) !important;
        }
    }

    @media (max-width: 768px) {
        .enh-toolbar .info-area {
            grid-template-columns: minmax(0, 1fr) auto !important;
        }
        .enh-toolbar .btn-actress {
            grid-column: 1 / -1 !important;
            grid-row: 2 !important;
            height: var(--fc2-btn-height-sm) !important;
            line-height: var(--fc2-line-base) !important;
            font-size: var(--fc2-text-xs) !important;
            max-width: min(100%, 18rem) !important;
        }
    }
`;

  const gallery = (_C) => `
    /* ============================================================
       GALLERY & VIEWER
       ============================================================ */
    .enh-viewer-backdrop {
        position:fixed;
        inset:0;
        z-index:var(--fc2-z-gallery);
        display:flex;
        flex-direction:column;
        background:var(--fc2-surface-float);
        backdrop-filter:blur(calc(var(--fc2-blur) * 2)) saturate(var(--fc2-glass-saturate));
        -webkit-backdrop-filter:blur(calc(var(--fc2-blur) * 2)) saturate(var(--fc2-glass-saturate));
        pointer-events: auto;
    }

    .enh-viewer-stage {
        position:relative;
        display:flex;
        flex:1;
        align-items:center;
        justify-content:center;
        overflow:hidden;
        padding:var(--fc2-space-md);
        width: 100%;
    }

    .enh-viewer-stage img, .enh-viewer-stage video {
        max-width:100%;
        max-height:100%;
        object-fit:contain;
        border-radius:var(--fc2-radius-lg);
        box-shadow:var(--fc2-shadow);
        transition:transform var(--fc2-motion-base) var(--fc2-ease-out);
        will-change:transform;
    }

    .slide-next img, .slide-next video { animation: fc2-slide-right-in var(--fc2-motion-base) var(--fc2-ease-out); }
    .slide-prev img, .slide-prev video { animation: fc2-slide-left-in var(--fc2-motion-base) var(--fc2-ease-out); }
    .slide-init img, .slide-init video { animation: fc2-fade-in var(--fc2-motion-base) var(--fc2-ease-out); }

    .enh-viewer-nav {
        position:absolute;
        top:50%;
        transform:translateY(-50%);
        z-index:var(--fc2-z-toast);
        width:calc(var(--fc2-space-lg) + var(--fc2-space-lg));
        height:calc(var(--fc2-space-lg) + var(--fc2-space-lg));
        display:flex;
        align-items:center;
        justify-content:center;
        background:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle));
        border-radius: var(--fc2-radius-full);
        cursor:pointer;
        transition:all var(--fc2-motion-fast);
        color: var(--fc2-text);
    }

    .enh-viewer-nav:hover {
        background:rgba(var(--fc2-primary-rgb), var(--fc2-opacity-20));
        transform:translateY(-50%) scale(1.1);
    }

    .enh-viewer-nav.prev { left:calc(var(--fc2-space-sm) + var(--fc2-space-base)); }
    .enh-viewer-nav.next { right:calc(var(--fc2-space-sm) + var(--fc2-space-base)); }

    .enh-viewer-close {
        position:absolute;
        top:calc(var(--fc2-space-sm) + var(--fc2-space-base));
        right:calc(var(--fc2-space-sm) + var(--fc2-space-base));
        z-index:var(--fc2-z-toast);
        width:var(--fc2-space-2xl);
        height:var(--fc2-space-2xl);
        display:flex;
        align-items:center;
        justify-content:center;
        background:rgba(var(--fc2-black-rgb),var(--fc2-opacity-20));
        border-radius: var(--fc2-radius-full);
        cursor:pointer;
        color:var(--fc2-text);
        transition:background var(--fc2-motion-fast);
    }

    .enh-viewer-close:hover { background:rgba(var(--fc2-black-rgb),var(--fc2-opacity-50)); }

    .enh-viewer-actions {
        position:absolute;
        bottom:calc(var(--fc2-space-2xl) + var(--fc2-space-2xl) + var(--fc2-space-sm) + var(--fc2-space-base));
        right:calc(var(--fc2-space-sm) + var(--fc2-space-base));
        z-index:var(--fc2-z-toast);
        display:flex;
        flex-direction:column;
        gap:var(--fc2-btn-pad-xs);
    }

    .enh-viewer-action {
        width:var(--fc2-space-2xl);
        height:var(--fc2-space-2xl);
        border-radius: var(--fc2-radius-full);
        background:rgba(var(--fc2-black-rgb), var(--fc2-opacity-muted));
        border: var(--fc2-border-width) solid rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle));
        color:var(--fc2-text);
        display:flex;
        align-items:center;
        justify-content:center;
        cursor:pointer;
        transition:all var(--fc2-motion-fast);
    }

    .enh-viewer-action:hover {
        background:var(--fc2-primary);
        color:var(--fc2-on-primary);
    }

    .enh-viewer-counter {
        position:absolute;
        top:calc(var(--fc2-space-sm) + var(--fc2-space-base));
        left:calc(var(--fc2-space-sm) + var(--fc2-space-base));
        z-index:var(--fc2-z-toast);
        background:rgba(var(--fc2-black-rgb),var(--fc2-opacity-50));
        padding: var(--fc2-space-xs) var(--fc2-space-base);
        border-radius:var(--fc2-radius-xl);
        color:var(--fc2-text);
        font-size: var(--fc2-text-base);
    }

    .enh-viewer-thumbs {
        height:calc(var(--fc2-space-2xl) + var(--fc2-space-2xl));
        width:100%;
        display:flex;
        gap:var(--fc2-btn-pad-xs);
        padding:var(--fc2-btn-pad-xs) calc(var(--fc2-space-sm) + var(--fc2-space-base));
        overflow-x:auto;
        background:rgba(var(--fc2-black-rgb),var(--fc2-opacity-30));
        z-index:var(--fc2-z-toast);
    }

    .enh-thumb-item {
        height:100%;
        aspect-ratio:16/9;
        border-radius:var(--fc2-radius-sm);
        overflow:hidden;
        cursor:pointer;
        opacity:var(--fc2-opacity-50);
        transition:opacity var(--fc2-motion-fast);
        border:calc(var(--fc2-border-width) * 2) solid transparent;
        flex-shrink:0;
    }

    .enh-thumb-item.active {
        opacity:1;
        border-color:var(--fc2-primary);
    }

    .enh-thumb-item img, .enh-thumb-item video {
        width:100%;
        height:100%;
        object-fit:cover;
    }
`;

  const common = (_C) => `
    /* ============================================================
       GLOBAL ANIMATIONS (OVERWRITES OR SPECIALS)
       ============================================================ */
    @keyframes fc2-dropdown-in {
        from { transform: translateY(calc(-1 * var(--fc2-btn-pad-xs))); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }

    /* ============================================================
       DROPDOWN & TOOLTIP
       ============================================================ */
    .enh-dropdown { position:relative; display:inline-flex; }
    .enh-dropdown-content {
        position:absolute;
        top:calc(100% + var(--fc2-space-sm));
        right:0;
        z-index:var(--fc2-z-dropdown);
        display:none;
        flex-direction:column;
        gap:var(--fc2-space-xs);
        min-width:calc(var(--fc2-space-2xl) + var(--fc2-space-2xl) + var(--fc2-space-lg) + var(--fc2-space-lg) + var(--fc2-space-xs) + var(--fc2-space-xxs));
        padding:var(--fc2-space-sm);
        background:rgba(var(--fc2-black-rgb),var(--fc2-opacity-dim));
        border:var(--fc2-border-width) solid var(--fc2-border);
        border-radius:var(--fc2-radius-md);
        box-shadow:var(--fc2-shadow-lg);
        backdrop-filter:blur(var(--fc2-blur));
        -webkit-backdrop-filter:blur(var(--fc2-blur));
        animation:fc2-dropdown-in var(--fc2-motion-fast) var(--fc2-ease-standard);
    }
    .enh-dropdown.active .enh-dropdown-content { display:flex; }

    .tooltip {
        display:none;
        position:absolute;
        bottom:100%;
        left:50%;
        transform:translateX(-50%) translateY(calc(-1 * var(--fc2-space-sm)));
        padding: var(--fc2-space-xs) var(--fc2-space-sm);
        background:var(--fc2-surface-float);
        color:var(--fc2-text);
        border:var(--fc2-border-width) solid var(--fc2-border);
        border-radius:var(--fc2-radius-sm);
        font-size: var(--fc2-text-xs);
        white-space:nowrap;
        pointer-events:none;
        opacity:0;
        transition:opacity var(--fc2-motion-fast);
        z-index:var(--fc2-z-tooltip);
    }
    .resource-btn:hover .tooltip { display:block; opacity:1; }

    /* ============================================================
       SKELETON & LOADING
       ============================================================ */
    .fc2-skeleton {
        position:relative;
        overflow:hidden!important;
        background:var(--fc2-surface-low);
        border-radius:var(--fc2-radius-sm);
    }
    .fc2-skeleton::after {
        content:'';
        position:absolute;
        inset:0;
        background:linear-gradient(90deg, transparent, rgba(var(--fc2-primary-rgb), var(--fc2-opacity-ghost)) 20%, rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle)) 50%, rgba(var(--fc2-primary-rgb), var(--fc2-opacity-ghost)) 80%, transparent);
        background-size:200% 100%;
        animation:fc2-shimmer 2.5s infinite linear;
    }
`;

  const batch = (_C) => `
    .fc2-batch-bar {
        position: fixed;
        bottom: var(--fc2-space-xl);
        left: 50%;
        transform: translateX(-50%) translateY(150%);
        display: flex;
        align-items: center;
        gap: var(--fc2-space-lg);
        padding: var(--fc2-space-sm) var(--fc2-space-lg);
        background: var(--fc2-surface-float);
        border: var(--fc2-border-width) solid var(--fc2-border);
        border-radius: var(--fc2-radius-full);
        box-shadow: var(--fc2-shadow-lg);
        backdrop-filter: blur(var(--fc2-blur));
        -webkit-backdrop-filter: blur(var(--fc2-blur));
        z-index: var(--fc2-z-actionsheet);
        transition: transform var(--fc2-motion-slow) var(--fc2-ease-spring), opacity var(--fc2-motion-base);
        pointer-events: none;
        opacity: 0;
    }

    .fc2-batch-bar.is-visible {
        transform: translateX(-50%) translateY(0);
        pointer-events: all;
        opacity: 1;
    }

    .batch-bar-count {
        font-size: var(--fc2-text-sm);
        font-weight: var(--fc2-font-bold);
        color: var(--fc2-primary);
        padding-right: var(--fc2-space-md);
        border-right: var(--fc2-border-width) solid var(--fc2-border);
    }

    .batch-bar-actions {
        display: flex;
        gap: var(--fc2-space-sm);
    }

    .batch-btn {
        height: var(--fc2-btn-height-sm);
        padding: 0 var(--fc2-space-md);
        border-radius: var(--fc2-radius-full);
        font-size: var(--fc2-text-xs);
        font-weight: var(--fc2-font-semibold);
        background: var(--fc2-surface-item);
        border: var(--fc2-border-width) solid var(--fc2-border);
        color: var(--fc2-text);
        cursor: pointer;
        transition: all var(--fc2-motion-fast) var(--fc2-ease-out);
        display: flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
    }

    .batch-btn:hover {
        background: rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle));
        border-color: var(--fc2-primary);
    }

    .batch-btn.primary {
        background: var(--fc2-primary);
        color: var(--fc2-on-primary);
        border-color: var(--fc2-primary);
    }

    .batch-btn.accent {
        background: rgba(var(--fc2-info-rgb), var(--fc2-opacity-20));
        color: var(--fc2-info);
        border-color: var(--fc2-info);
    }

    .batch-btn.danger {
        color: var(--fc2-danger);
    }
    
    .batch-btn.danger:hover {
        background: rgba(var(--fc2-danger-rgb), var(--fc2-opacity-10));
        border-color: var(--fc2-danger);
    }

    @media (max-width: 768px) {
        .fc2-batch-bar {
            width: 90%;
            flex-direction: column;
            border-radius: var(--fc2-radius-lg);
            padding: var(--fc2-space-md);
            bottom: var(--fc2-space-md);
            gap: var(--fc2-space-md);
        }
        
        .batch-bar-count {
            border-right: none;
            border-bottom: var(--fc2-border-width) solid var(--fc2-border);
            padding-right: 0;
            padding-bottom: var(--fc2-space-xs);
            width: 100%;
            text-align: center;
        }

        .batch-bar-actions {
            flex-wrap: wrap;
            justify-content: center;
        }
    }
`;

  const getComponentStyles = (C) => `
    ${tokens}
    ${base()}
    ${toast()}
    ${fab()}
    ${card(C)}
    ${button(C)}
    ${form()}
    ${tabs()}
    ${settings()}
    ${modal()}
    ${actionsheet()}
    
    /* Refactored Blocks */
    ${common()}
    ${toolbar()}
    ${gallery()}
    ${batch()}
`;

  const getMobileStyles = (C) => `
    /* ============================================================
       MOBILE TOUCH OPTIMIZATIONS
       ============================================================ */

    @media (max-width: 768px) and (hover: none), (max-width: 768px) and (pointer: coarse) {
        /* Keep mobile interaction tuning scoped to userscript-owned UI only */
        .${C.processedCard},
        .${C.cardRebuilt},
        .${C.resourceBtn},
        .card-top-right-controls > *,
        .fc2-enh-tab-btn,
        .portal-item,
        .data-management-actions > *,
        .fc2-fab-btn,
        .fc2-fab-trigger,
        .enh-viewer-action,
        .enh-viewer-close,
        .enh-thumb-item {
            touch-action: manipulation;
            animation-duration: 0.2s !important;
            transition-duration: 0.2s !important;
        }

        /* Hardware Acceleration for Mobile */
        .${C.processedCard},
        .${C.cardRebuilt},
        .${C.resourceBtn},
        .fc2-fab-btn,
        .fc2-fab-trigger {
            transform: translateZ(0);
            -webkit-transform: translateZ(0);
            will-change: transform;
        }
        
        /* Disable hover effects on touch devices to prevent "sticky" hover */
        @media (hover: none) {
            .${C.resourceBtn}:hover,
            .card-top-right-controls > *:hover,
            .fc2-fab-btn:hover,
            .fc2-fab-trigger:hover,
            .${C.processedCard}:hover {
                transform: none !important;
                box-shadow: none !important;
                border-color: rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle)) !important;
            }
        }
        
        /* ============================================================
           SETTINGS PANEL MOBILE
           ============================================================ */

        .fc2-enh-settings-panel { 
            display: flex !important;
            flex-direction: column !important;
        }

        .fc2-enh-settings-body {
            flex-direction: column !important;
        }

        .fc2-enh-settings-content {
            padding: 0 !important;
        }

        .fc2-enh-tab-btn {
            display: flex;
            flex: 1 1 var(--fc2-layout-max-width);
            width: auto !important;
            justify-content: center;
            padding: var(--fc2-space-sm) var(--fc2-space-xs) !important;
            min-height: var(--fc2-btn-height-lg) !important;
            height: auto !important;
            font-size: var(--fc2-text-xs) !important;
            border-radius: var(--fc2-radius-md) !important;
            min-width: 0;
        }
        
        .fc2-enh-form-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: var(--fc2-space-sm) !important;
            padding: var(--fc2-space-base) 0 !important;
            border-bottom: var(--fc2-border-width) solid rgba(var(--fc2-primary-rgb), var(--fc2-opacity-ghost)) !important;
        }

        /* Prevent checkboxes from splitting on mobile */
        .fc2-enh-form-row.checkbox {
            flex-direction: row !important;
            align-items: center !important;
            padding: var(--fc2-space-base) var(--fc2-space-sm) !important;
        }

        .fc2-enh-settings-group {
            margin-bottom: var(--fc2-space-lg) !important;
            padding: var(--fc2-space-xs) 0 !important;
        }

        .portal-grid {
            grid-template-columns: 1fr !important;
            gap: var(--fc2-space-sm) !important;
        }

        .portal-item {
            padding: var(--fc2-space-sm) !important;
            font-size: var(--fc2-text-sm) !important;
        }

        .data-management-actions {
            flex-direction: row !important;
            flex-wrap: wrap !important;
            gap: var(--fc2-space-sm) !important;
        }

        .data-management-actions > * {
            flex: 1 1 calc(50% - var(--fc2-space-sm)) !important;
            min-width: var(--fc2-layout-sidebar-min-width) !important;
            height: var(--fc2-btn-height-lg) !important;
        }


        /* ============================================================
           GRID & CARD LAYOUT MOBILE
           ============================================================ */

        .${C.cardRebuilt} {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            flex-basis: auto !important; /* Allow grid to define width */
        }
        
        /* Larger Touch Targets for Mobile */
        .card-top-right-controls { 
            top: var(--fc2-space-base) !important; 
            right: var(--fc2-space-base) !important; 
            gap: var(--fc2-space-sm) !important; 
        }

        .card-top-right-controls > * { 
            min-height: var(--fc2-btn-height-lg);
            min-width: var(--fc2-btn-height-lg);
            height: var(--fc2-btn-height-md) !important; 
            padding: 0 var(--fc2-space-base) !important; 
            font-size: var(--fc2-text-base) !important; 
        }

        .${C.resourceBtn} { 
            min-height: var(--fc2-btn-height-lg);
            height: var(--fc2-btn-height-lg) !important; 
            padding: 0 var(--fc2-btn-pad-md) !important; 
            font-size: var(--fc2-text-base) !important; 
        }

        .${C.infoArea} {
            padding: var(--fc2-space-base) !important;
        }

        .${C.customTitle} {
            height: auto !important;
            min-height: var(--fc2-btn-height-md);
            margin-bottom: var(--fc2-space-sm) !important;
        }

        .${C.cardMeta} {
            margin-bottom: var(--fc2-space-sm) !important;
        }

        .${C.cardActionRow} {
            width: 100% !important;
            justify-content: flex-start !important;
        }

        .${C.cardActionRow} {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) auto !important;
            align-items: stretch !important;
            gap: var(--fc2-space-sm) !important;
        }

        .${C.resourceLinksContainer} {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: var(--fc2-space-sm) !important;
            margin-left: 0 !important;
            width: auto !important;
            max-width: 100% !important;
            justify-content: flex-start !important;
        }

        .card-primary-actions {
            width: auto !important;
            min-width: 0 !important;
            max-width: 100% !important;
            justify-self: start !important;
        }

        .card-secondary-actions {
            width: auto !important;
            min-width: fit-content !important;
            max-width: 100% !important;
            justify-self: end !important;
        }

        .card-primary-actions > *,
        .card-secondary-actions > * {
            flex: 0 0 auto !important;
        }

        .card-action-stash,
        .card-overflow-actions[hidden] {
            display: none !important;
            width: 0 !important;
            min-width: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
        }

        .${C.resourceLinksContainer} .btn-gallery,
        .${C.resourceLinksContainer} .btn-external-links,
        .${C.resourceLinksContainer} .${C.btnMagnet} {
            flex: 1 1 calc(50% - var(--fc2-space-xs)) !important;
            min-width: 0 !important;
        }

        .btn-actress { 
            width: 90% !important; 
            margin: var(--fc2-space-sm) auto !important; 
            min-height: var(--fc2-btn-height-lg) !important;
            padding: 0 var(--fc2-btn-pad-md) !important; 
            font-size: var(--fc2-text-base) !important; 
        }

        .fc2-fab-trigger { 
            width: var(--fc2-btn-height-lg); 
            height: var(--fc2-btn-height-lg); 
            font-size: var(--fc2-space-lg) !important; 
        }

        .fc2-fab-btn { 
            width: var(--fc2-btn-height-md); 
            height: var(--fc2-btn-height-md); 
            font-size: var(--fc2-text-xl) !important; 
        }
        
        /* ============================================================
           TOOLBAR & MODAL MOBILE
           ============================================================ */

        .enh-toolbar { 
            display: block !important;
            height: auto !important;
            min-height: 0 !important;
            margin: var(--fc2-space-base) 0 !important; 
            padding: 0 !important;
            border-radius: var(--fc2-radius-md) !important;
            overflow: hidden !important;
        }

        .enh-toolbar .info-area { 
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) auto !important;
            gap: var(--fc2-space-sm) !important;
            width: 100% !important;
            min-width: 0 !important;
            height: auto !important;
            padding: var(--fc2-space-sm) !important;
            align-items: center !important;
        }

        .enh-toolbar .card-top-right-controls,
        .enh-toolbar .resource-links-container { 
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: nowrap !important;
            justify-content: flex-start !important;
            align-items: center !important;
            margin: 0 !important;
            min-width: 0 !important;
            width: auto !important;
            max-width: 100% !important;
        }

        .enh-toolbar .toolbar-section-controls {
            grid-column: 1 !important;
            justify-self: start !important;
        }

        .enh-toolbar .toolbar-section-links {
            grid-column: 2 !important;
            justify-self: end !important;
        }

        .enh-toolbar .resource-links-container { 
            gap: 0 !important; 
            overflow: hidden !important;
        }

        .enh-toolbar .btn-actress {
            grid-column: 1 / -1 !important;
            justify-self: stretch !important;
            display: inline-flex !important;
            width: 100% !important;
            max-width: none !important;
            min-height: var(--fc2-btn-height-lg) !important;
            padding: 0 var(--fc2-btn-pad-md) !important;
        }

        .enh-toolbar .card-top-right-controls > *,
        .enh-toolbar .resource-links-container .${C.resourceBtn} {
            flex: 0 0 auto !important;
            justify-content: center !important;
            min-width: var(--fc2-btn-height-lg) !important;
        }

        .enh-toolbar .card-top-right-controls .${C.fc2IdBadge} {
            flex-basis: auto !important;
            min-width: 0 !important;
        }

        .enh-viewer-nav { 
            display: none !important; /* Hide arrows on mobile, rely on swipe */
        }
        
        .enh-viewer-thumbs {
            bottom: var(--fc2-space-lg) !important;
            width: 95% !important;
            height: var(--fc2-btn-height-lg) !important;
            gap: var(--fc2-space-xs) !important;
        }

        .enh-thumb-item {
            width: var(--fc2-btn-height-lg) !important;
            height: var(--fc2-btn-height-lg) !important;
        }

        .enh-viewer-actions {
            top: var(--fc2-btn-pad-xs) !important;
            padding: var(--fc2-space-xs) !important;
        }

        .enh-viewer-action {
            width: var(--fc2-btn-height-lg) !important;
            height: var(--fc2-btn-height-lg) !important;
        }

        .enh-viewer-close { 
            top: var(--fc2-space-sm) !important; 
            right: var(--fc2-space-sm) !important; 
            width: var(--fc2-btn-height-lg) !important; 
            height: var(--fc2-btn-height-lg) !important; 
            background: rgba(var(--fc2-black-rgb), var(--fc2-opacity-muted)) !important;
            border-radius: var(--fc2-radius-full) !important;
            backdrop-filter: blur(var(--fc2-blur)) !important;
        }
        
        .enh-modal-panel {
            width: 95% !important;
            max-width: 95% !important;
            max-height: 90vh !important;
        }

        /* Improved Grid Responsiveness */
        .preview-hero-section {
            margin-bottom: var(--fc2-space-md) !important;
        }

        .preview-hero-card {
            border-radius: var(--fc2-radius-md) !important;
            overflow: hidden !important;
        }

        .${C.extraPreviewGrid} {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: var(--fc2-space-sm) !important;
        }

        .preview-item {
            height: var(--fc2-layout-preview-height) !important;
            border-radius: var(--fc2-radius-sm) !important;
        }
        
        /* FAB Container - safely above bottom bar by default, but allow JS to override */
        .fc2-fab-container {
            bottom: calc(var(--fc2-space-2xl) + var(--fc2-space-2xl)); 
            right: var(--fc2-space-lg);
        }

        /* Toasts mobile positioning with safe area */
        .fc2-toast-container {
            top: calc(var(--fc2-space-sm) + env(safe-area-inset-top, 0px)) !important;
            right: var(--fc2-space-sm) !important;
            left: var(--fc2-space-sm) !important; /* Full width on mobile looks better */
        }

        .fc2-toast-item {
            min-width: 0 !important;
            width: 100% !important;
        }

        .fc2-enh-settings-tabs {
            flex-wrap: wrap !important;
            scroll-snap-type: x mandatory;
            scrollbar-width: none;
        }

        .fc2-enh-tab-btn {
            scroll-snap-align: start;
        }

        /* Better touch feedback */
        .fc2-fab-trigger,
        .fc2-fab-btn,
        .enh-viewer-action,
        .enh-thumb-item {
            -webkit-tap-highlight-color: rgba(var(--fc2-primary-rgb), 0.2) !important;
        }
    }
`;

  const getConsolidatedCss = () => {
    const C = Config.CLASSES;
    const performanceFix = location.hostname.includes("missav") || location.hostname.includes("supjav") || location.hostname.includes("javdb") ? `
        .${C.processedCard}:nth-child(n+51) { content-visibility: auto; contain-intrinsic-size: var(--fc2-layout-pane-width) var(--fc2-layout-card-intrinsic-height); }
    ` : "";
    const siteSpecificFix = location.hostname.includes("fd2ppv") ? `
        .artist-card.card-rebuilt,
        .work-card.card-rebuilt,
        .work-list > div,
        .artist-list > div { overflow: visible !important; }
    ` : "";
    return `
        ${tokens}
        ${getSiteFusionStyles(C)}
        ${getAnimations(C)}
        ${getBaseStyles(C)}
        ${getComponentStyles(C)}
        ${performanceFix}
        ${siteSpecificFix}
        ${getMobileStyles(C)}
    `;
  };

  const log$z = Logger.scope("Style");
  class StyleService {
    themeObserver = null;
    injectedStyle = null;
    domReadyHandler = null;
    preferredSchemeQuery = null;
    preferredSchemeHandler = null;
    currentSiteToneClass = null;
    pendingThemeDetection = false;
    async onInit() {
      log$z.debug("Injecting global styles");
      this.injectCss();
      this.initThemeDetection();
    }
    onCleanup() {
      this.themeObserver?.disconnect();
      this.themeObserver = null;
      if (this.domReadyHandler) {
        document.removeEventListener("DOMContentLoaded", this.domReadyHandler);
        this.domReadyHandler = null;
      }
      if (this.preferredSchemeQuery && this.preferredSchemeHandler) {
        if (typeof this.preferredSchemeQuery.removeEventListener === "function") {
          this.preferredSchemeQuery.removeEventListener("change", this.preferredSchemeHandler);
        } else if (typeof this.preferredSchemeQuery.removeListener === "function") {
          this.preferredSchemeQuery.removeListener(this.preferredSchemeHandler);
        }
      }
      this.preferredSchemeQuery = null;
      this.preferredSchemeHandler = null;
      if (this.injectedStyle?.isConnected) {
        this.injectedStyle.remove();
      }
      this.injectedStyle = null;
      const root = document.documentElement;
      if (this.currentSiteToneClass && root.classList.contains(this.currentSiteToneClass)) {
        root.classList.remove(this.currentSiteToneClass);
      }
      this.currentSiteToneClass = null;
      root.style.removeProperty("--fc2-host-bg-rgb");
      root.style.removeProperty("--fc2-host-bg-luma");
    }
    parseRgbColor(color) {
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      if (!match) {
        return null;
      }
      const r = Number(match[1]);
      const g = Number(match[2]);
      const b = Number(match[3]);
      if ([r, g, b].some((value) => Number.isNaN(value))) {
        return null;
      }
      return { r, g, b };
    }
    resolveHostBackgroundColor() {
      if (document.documentElement?.classList.contains("dark") || document.body?.classList.contains("dark")) {
        return "rgb(17, 24, 39)";
      }
      if (window.location.hostname.includes("missav") || window.location.hostname.includes("javfc2.xyz") || document.querySelector('[class*="bg-nord"]')) {
        return "rgb(18, 18, 18)";
      }
      const candidates = [
        document.body,
        document.querySelector("#app"),
        document.querySelector("#__nuxt"),
        document.querySelector(".app"),
        document.querySelector(".wrapper"),
        document.querySelector("main"),
        document.querySelector("#main"),
        document.documentElement
      ];
      for (const candidate of candidates) {
        if (!candidate) continue;
        const bg = window.getComputedStyle(candidate).backgroundColor;
        if (!bg || bg === "transparent" || bg === "rgba(0, 0, 0, 0)") {
          continue;
        }
        return bg;
      }
      return null;
    }
    applySiteToneClass(root) {
      const nextClass = resolveSiteToneClass(location.hostname);
      if (this.currentSiteToneClass === nextClass) {
        return;
      }
      if (this.currentSiteToneClass) {
        root.classList.remove(this.currentSiteToneClass);
      }
      root.classList.add(nextClass);
      this.currentSiteToneClass = nextClass;
    }
    applyHostBackgroundVars(root, rgb, isLight) {
      const fallback = isLight ? { r: 246, g: 247, b: 249 } : { r: 16, g: 18, b: 22 };
      const effective = rgb || fallback;
      const luma = effective.r * 0.299 + effective.g * 0.587 + effective.b * 0.114;
      const rgbStr = `${effective.r}, ${effective.g}, ${effective.b}`;
      const lumaStr = luma.toFixed(2);
      if (root.style.getPropertyValue("--fc2-host-bg-rgb") !== rgbStr) {
        root.style.setProperty("--fc2-host-bg-rgb", rgbStr);
      }
      if (root.style.getPropertyValue("--fc2-host-bg-luma") !== lumaStr) {
        root.style.setProperty("--fc2-host-bg-luma", lumaStr);
      }
    }
    injectCss() {
      if (this.injectedStyle?.isConnected) {
        return;
      }
      const css = getConsolidatedCss();
      if (typeof GM_addStyle !== "undefined") {
        this.injectedStyle = GM_addStyle(css);
      } else {
        const style = document.createElement("style");
        style.textContent = css;
        document.head.appendChild(style);
        this.injectedStyle = style;
      }
    }
    removePreferredSchemeListener() {
      if (!this.preferredSchemeQuery || !this.preferredSchemeHandler) {
        return;
      }
      if (typeof this.preferredSchemeQuery.removeEventListener === "function") {
        this.preferredSchemeQuery.removeEventListener("change", this.preferredSchemeHandler);
      } else if (typeof this.preferredSchemeQuery.removeListener === "function") {
        this.preferredSchemeQuery.removeListener(this.preferredSchemeHandler);
      }
    }
    addPreferredSchemeListener(detectTheme) {
      if (!this.preferredSchemeQuery) {
        return;
      }
      this.preferredSchemeHandler = () => detectTheme();
      if (typeof this.preferredSchemeQuery.addEventListener === "function") {
        this.preferredSchemeQuery.addEventListener("change", this.preferredSchemeHandler);
      } else if (typeof this.preferredSchemeQuery.addListener === "function") {
        this.preferredSchemeQuery.addListener(this.preferredSchemeHandler);
      }
    }
    setupThemeObservation(detectTheme) {
      const scheduleThemeDetection = () => {
        if (this.pendingThemeDetection) {
          return;
        }
        this.pendingThemeDetection = true;
        queueMicrotask(() => {
          this.pendingThemeDetection = false;
          detectTheme();
        });
      };
      const hasThemeSignal = (className) => {
        return /(^|\s)(dark|light|theme|night|day|nord|black|white)(-|\b)/i.test(className);
      };
      const startObserving = () => {
        if (!document.body) {
          return;
        }
        this.themeObserver?.disconnect();
        this.themeObserver = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.type !== "attributes" || mutation.attributeName !== "class") {
              continue;
            }
            const target = mutation.target;
            if (target === document.documentElement) {
              scheduleThemeDetection();
              return;
            }
            if (target === document.body && hasThemeSignal(document.body.className)) {
              scheduleThemeDetection();
              return;
            }
          }
        });
        this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        this.themeObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
      };
      if (document.body) {
        detectTheme();
        startObserving();
        this.domReadyHandler = null;
        return;
      }
      this.domReadyHandler = () => {
        detectTheme();
        startObserving();
        this.domReadyHandler = null;
      };
      document.addEventListener("DOMContentLoaded", this.domReadyHandler, { once: true });
    }
    initThemeDetection() {
      let lastUpdate = 0;
      this.removePreferredSchemeListener();
      this.preferredSchemeHandler = null;
      this.preferredSchemeQuery = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: light)") : null;
      this.themeObserver?.disconnect();
      this.themeObserver = null;
      const detectTheme = () => {
        const root = document.documentElement;
        if (!root) {
          return;
        }
        const now = Date.now();
        if (now - lastUpdate < 500) return;
        lastUpdate = now;
        const applyTheme = (isLight2) => {
          const hasClass = root.classList.contains("fc2-light-theme");
          if (isLight2 && !hasClass) {
            root.classList.add("fc2-light-theme");
          } else if (!isLight2 && hasClass) {
            root.classList.remove("fc2-light-theme");
          }
        };
        if (!document.body) {
          applyTheme(this.preferredSchemeQuery?.matches ?? false);
          this.applySiteToneClass(root);
          this.applyHostBackgroundVars(root, null, this.preferredSchemeQuery?.matches ?? false);
          return;
        }
        const hostBg = this.resolveHostBackgroundColor();
        const rgb = hostBg ? this.parseRgbColor(hostBg) : null;
        if (!rgb) {
          applyTheme(this.preferredSchemeQuery?.matches ?? false);
          this.applySiteToneClass(root);
          this.applyHostBackgroundVars(root, null, this.preferredSchemeQuery?.matches ?? false);
          return;
        }
        const isLight = rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114 > 180;
        applyTheme(isLight);
        this.applySiteToneClass(root);
        this.applyHostBackgroundVars(root, rgb, isLight);
      };
      if (this.domReadyHandler) {
        document.removeEventListener("DOMContentLoaded", this.domReadyHandler);
      }
      this.setupThemeObservation(detectTheme);
      this.addPreferredSchemeListener(detectTheme);
    }
    getCss() {
      return getConsolidatedCss();
    }
  }

  const createStyleManager = () => {
    return new StyleService();
  };
  const StyleManager = AppContainer.register("style", createStyleManager());

  const log$y = Logger.scope("UIHost");
  class OverlayStackImpl {
    stack = [];
    handleKeyDown = (e) => {
      if (e.key === "Escape") {
        const top = this.stack[this.stack.length - 1];
        if (top) {
          e.preventDefault();
          e.stopPropagation();
          top.close();
        }
      }
    };
    push(overlay) {
      if (this.stack.length === 0) {
        document.addEventListener("keydown", this.handleKeyDown, true);
      }
      if (!this.stack.includes(overlay)) {
        this.stack.push(overlay);
      }
    }
    remove(overlay) {
      const index = this.stack.indexOf(overlay);
      if (index > -1) {
        this.stack.splice(index, 1);
      }
      if (this.stack.length === 0) {
        document.removeEventListener("keydown", this.handleKeyDown, true);
      }
    }
  }
  const OverlayStack = new OverlayStackImpl();
  class UIHostImpl {
    host = null;
    _shadow = null;
    styleSheet = null;
    resetHostState() {
      this.host = null;
      this._shadow = null;
      this.styleSheet = null;
    }
    ensureConnectedHost() {
      if (!this.host?.isConnected || !this._shadow) {
        this.resetHostState();
        this.onInit();
      }
    }
    onInit() {
      if (this.host && this.host.isConnected) return;
      log$y.debug("Initializing shadow host");
      this.host = h("div", {
        id: DOM_IDS.UI_HOST,
        style: {
          position: "fixed",
          inset: "0",
          pointerEvents: "none",
          zIndex: String(UI_CONSTANTS.Z_INDEX_MAX)
        }
      });
      this._shadow = this.host.attachShadow({ mode: "open" });
      const css = StyleManager.getCss();
      try {
        if ("adoptedStyleSheets" in this._shadow) {
          this.styleSheet = new CSSStyleSheet();
          this.styleSheet.replaceSync(css);
          this._shadow.adoptedStyleSheets = [this.styleSheet];
        } else {
          throw new Error("Not supported");
        }
      } catch {
        const style = h("style", { innerHTML: css });
        this._shadow.appendChild(style);
      }
      document.body.appendChild(this.host);
    }
    get shadow() {
      this.ensureConnectedHost();
      return this._shadow;
    }
    add(el) {
      this.ensureConnectedHost();
      this._shadow.appendChild(el);
    }
  }
  const UIHost = new UIHostImpl();

  const ENH_GRID_CONTAINER_ATTR = "data-enh-grid-container";
  const ENH_GRID_CONTAINER_SELECTOR = `[${ENH_GRID_CONTAINER_ATTR}]`;
  const markGridContainer = (container) => {
    if (!container) {
      return;
    }
    container.setAttribute(ENH_GRID_CONTAINER_ATTR, "1");
  };
  const SITE_GRID_MAP = [
    [
      "fc2ppvdb.com",
      {
        cont: ENH_GRID_CONTAINER_SELECTOR,
        card: `> .${Config.CLASSES.cardRebuilt}`
      }
    ],
    [
      "fd2ppv.cc",
      {
        cont: ENH_GRID_CONTAINER_SELECTOR,
        card: `> .${Config.CLASSES.cardRebuilt}`
      }
    ],
    [
      "supjav.com",
      {
        cont: ENH_GRID_CONTAINER_SELECTOR,
        card: `> .${Config.CLASSES.cardRebuilt}`
      }
    ],
    [
      "missav",
      {
        cont: ENH_GRID_CONTAINER_SELECTOR,
        card: `> .${Config.CLASSES.cardRebuilt}`
      }
    ],
    [
      "javdb",
      {
        cont: ENH_GRID_CONTAINER_SELECTOR,
        card: `> .${Config.CLASSES.cardRebuilt}`
      }
    ],
    [
      "fc2db",
      {
        cont: ENH_GRID_CONTAINER_SELECTOR,
        card: `> .${Config.CLASSES.cardRebuilt}`
      }
    ],
    [
      "javfc2.xyz",
      {
        cont: `${ENH_GRID_CONTAINER_SELECTOR}:not(.owl-stage)`,
        card: `> *`
      }
    ]
  ];
  const shouldSkipGridApply = (hostname, pathname) => {
    if (!hostname.includes("missav")) {
      return false;
    }
    return /\/(cn\/|en\/|ja\/)?(fc2-ppv-|[a-z]{2,5}-)\d+/i.test(pathname);
  };
  const resolveGridSelectors = (hostname) => {
    return SITE_GRID_MAP.find(([match]) => hostname.includes(match))?.[1] ?? null;
  };
  const buildGridCss = (hostname, pathname, cols) => {
    if (shouldSkipGridApply(hostname, pathname)) {
      return "";
    }
    const selectors = resolveGridSelectors(hostname);
    if (!selectors || cols <= 0) {
      return "";
    }
    const containerList = selectors.cont.split(",").map((selector) => selector.trim());
    const cardRules = containerList.map((selector) => `${selector} ${selectors.card}`).join(", ");
    const baseGridCss = `
            display: grid !important;
            grid-template-columns: repeat(${Math.min(2, cols)}, minmax(0, 1fr)) !important;
            gap: var(--fc2-space-md) !important;
            margin: 0 !important;
            padding: var(--fc2-space-md) var(--fc2-btn-pad-xs) !important;
            width: 100% !important;
            max-width: none !important;
            box-sizing: border-box !important;
        `;
    const cardCss = selectors.card ? `${cardRules} { padding: 0 !important; margin: 0 !important; width: 100% !important; box-sizing: border-box !important; }` : "";
    let siteSpecificCss = "";
    if (hostname.includes("javfc2.xyz")) {
      const C = Config.CLASSES;
      siteSpecificCss = `
            ${selectors.cont} > [class*="col-"] {
                width: 100% !important;
                max-width: none !important;
                flex: none !important;
                padding: 0 !important;
                display: flex !important;
            }
            .${C.cardRebuilt} {
                width: 100% !important;
                max-width: none !important;
                height: 100% !important;
                display: flex !important;
            }
            .${C.processedCard} {
                width: 100% !important;
                height: 100% !important;
                flex: 1 1 auto !important;
            }
            .${C.videoPreviewContainer} {
                aspect-ratio: 3 / 4 !important;
                background-color: var(--fc2-bg) !important;
                flex: 0 0 auto !important;
            }
            .${C.infoArea} {
                flex: 1 1 auto !important;
                min-height: calc(var(--fc2-btn-height-lg) + var(--fc2-space-xl) + var(--fc2-space-xs)) !important;
                padding: var(--fc2-space-sm) !important;
            }
        `;
    }
    const tabletCols = Math.min(cols, 4);
    return `
            ${siteSpecificCss}
            ${selectors.cont} { ${baseGridCss} }
            ${cardCss}
            ${selectors.cont} .inner { padding: 0 !important; }

            @media (max-width: 480px) {
                ${selectors.cont} {
                    grid-template-columns: minmax(0, 1fr) !important;
                    gap: var(--fc2-space-sm) !important;
                }
            }

            @media (min-width: 768px) {
                ${selectors.cont} {
                    grid-template-columns: repeat(${tabletCols}, minmax(0, 1fr)) !important;
                }
            }

            @media (min-width: 1200px) {
                ${selectors.cont} {
                    grid-template-columns: repeat(${cols}, minmax(0, 1fr)) !important;
                }
            }
        `;
  };

  class GridService {
    styleEl = null;
    cleanupFns = [];
    onBootstrap() {
      this.onCleanup();
      this.cleanupFns.push(CoreEvents.on(AppEvents.GRID_CHANGED, (cols2) => this.apply(cols2)));
      this.cleanupFns.push(
        CoreEvents.on(AppEvents.STATE_CHANGED, ({ prop, value }) => {
          if (prop === "userGridColumns") {
            this.apply(Number(value));
          }
        })
      );
      const cols = State.proxy.userGridColumns;
      if (cols > 0) {
        this.apply(cols);
      }
    }
    onCleanup() {
      this.cleanupFns.splice(0).forEach((cleanup) => cleanup());
      this.styleEl?.remove();
      this.styleEl = null;
    }
    apply(cols) {
      if (!this.styleEl) {
        this.styleEl = document.createElement("style");
        this.styleEl.id = "fc2-modern-grid-style";
        document.head.appendChild(this.styleEl);
      }
      this.styleEl.textContent = buildGridCss(location.hostname, location.pathname, cols);
    }
  }

  const createGridManager = () => {
    return new GridService();
  };
  AppContainer.register("grid", createGridManager());

  const normalizeText = (value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : void 0;
  };
  const normalizeImageUrl = (value) => {
    const normalized = normalizeText(value);
    return normalized ? MediaUtils.cleanImageUrl(normalized) : void 0;
  };
  const withListImageFallbacks = (fields) => {
    const primaryImageUrl = normalizeImageUrl(fields.primaryImageUrl);
    const imageUrl = normalizeImageUrl(fields.imageUrl);
    const fallbackImageUrl = normalizeImageUrl(fields.fallbackImageUrl);
    const resolvedImageUrl = imageUrl || primaryImageUrl || fallbackImageUrl;
    const resolvedPrimaryImageUrl = primaryImageUrl || resolvedImageUrl;
    const resolvedFallbackImageUrl = fallbackImageUrl || resolvedImageUrl || resolvedPrimaryImageUrl;
    return {
      primaryImageUrl: resolvedPrimaryImageUrl,
      imageUrl: resolvedImageUrl,
      fallbackImageUrl: resolvedFallbackImageUrl
    };
  };
  const normalizeListArticleUrl = (href) => {
    return normalizeText(href);
  };
  const normalizeListOptionalText = (value) => {
    return normalizeText(value);
  };
  const normalizeListTags = (values) => {
    if (!values || values.length === 0) {
      return void 0;
    }
    const normalized = Array.from(new Set(values.map((value) => normalizeText(value)).filter((v) => !!v)));
    return normalized.length > 0 ? normalized : void 0;
  };
  const resolveListPreviewSlug = (type, id, slug) => {
    const normalizedSlug = normalizeText(slug);
    if (normalizedSlug) {
      return normalizedSlug.toLowerCase();
    }
    if (type === "fc2" && /^\d{5,8}$/.test(id)) {
      return `fc2-ppv-${id}`;
    }
    if (type === "jav") {
      const dateParts = MediaUtils.parseDateIdParts(id);
      if (dateParts) {
        const brandMap = {
          "1PONDO": "pondo",
          "10MUSUME": "musume",
          PACOPACOMAMA: "pacopacomama",
          CARIBBEANCOM: "caribbeancom"
        };
        const brand = brandMap[dateParts.brand] || dateParts.brand.toLowerCase();
        const sep = dateParts.brand === "CARIBBEANCOM" ? "-" : "_";
        return `${brand}-${dateParts.date}${sep}${dateParts.serial}`;
      }
      return id.toLowerCase();
    }
    return null;
  };

  const preserveHostBadges = (card, selector) => {
    return Array.from(card.querySelectorAll(selector)).map((node) => {
      const clone = node.cloneNode(true);
      if (clone.classList.contains("absolute")) {
        clone.style.position = "relative";
        clone.style.display = "inline-flex";
        clone.style.alignItems = "center";
        clone.style.marginRight = "8px";
      }
      return clone.outerHTML;
    }).join("");
  };

  class FC2Database extends Dexie {
    history;
    cache;
    constructor() {
      super(DATABASE.NAME);
      this.version(6).stores({
        history: "&id, timestamp, status, updated_at, is_deleted, sync_dirty, retry_count, [is_deleted+timestamp], [sync_dirty+updated_at], [status+is_deleted], [retry_count+sync_dirty]",
        cache: "&id, timestamp"
      });
      this.version(8).stores({
        history: "&id, timestamp, status, updated_at, is_deleted, sync_dirty, retry_count, [is_deleted+timestamp], [sync_dirty+updated_at], [status+is_deleted], [retry_count+sync_dirty]",
        cache: "&id, timestamp",
        itemDetails: null
      });
    }
  }

  class QueryCache {
    cache = new Map();
    version = 0;
    get(key) {
      const entry = this.cache.get(key);
      return entry && entry.version === this.version ? entry.data : null;
    }
    set(key, data) {
      this.cache.set(key, { data, version: this.version });
    }
    invalidate() {
      this.cache.clear();
      this.version = this.version >= Number.MAX_SAFE_INTEGER ? 0 : this.version + 1;
    }
  }
  class MemoryCache {
    cache = new Map();
    get(id, expirationMs) {
      const item = this.cache.get(id);
      if (item && Date.now() - item.timestamp < expirationMs) return item.value;
      if (item) this.cache.delete(id);
      return null;
    }
    set(id, value) {
      if (this.cache.size >= CACHE.MEMORY_MAX_SIZE) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) this.cache.delete(firstKey);
      }
      this.cache.set(id, { value, timestamp: Date.now() });
    }
    clear() {
      this.cache.clear();
    }
    delete(id) {
      this.cache.delete(id);
    }
  }

  const CACHE_NO_MAGNET = "@@NO_MAGNET@@";
  const createNegativeMagnetCacheValue = () => ({
    kind: "no-magnet",
    expiresAt: Date.now() + CACHE.NEGATIVE_MAGNET_EXPIRATION_MS,
    retryable: true
  });
  const isNegativeMagnetCacheValue = (value) => {
    return value === CACHE_NO_MAGNET || !!value && typeof value === "object" && value.kind === "no-magnet";
  };
  const isExpiredNegativeMagnetCacheValue = (value) => {
    if (value === CACHE_NO_MAGNET) return false;
    if (!isNegativeMagnetCacheValue(value)) return false;
    return typeof value.expiresAt === "number" && value.expiresAt <= Date.now();
  };

  const getNowIsoString = () => ( new Date()).toISOString();
  const createHistoryRuntime = (db, qCache, log) => ({
    table: db.history,
    async add(id, status = "watched") {
      const now = getNowIsoString();
      await db.history.put({
        id: String(id),
        timestamp: Date.now(),
        status,
        updated_at: now,
        is_deleted: 0,
        sync_dirty: 1
      });
      qCache.invalidate();
      log.trace(`History added: ${id} as ${status}`);
    },
    async getAll() {
      const cached = qCache.get("all");
      if (cached) {
        return cached;
      }
      const items = await db.history.where("is_deleted").equals(0).toArray();
      qCache.set("all", items);
      return items;
    },
    async remove(id) {
      await db.history.update(String(id), { is_deleted: 1, updated_at: getNowIsoString(), sync_dirty: 1 });
      qCache.invalidate();
    },
    async bulkAdd(ids, status = "watched") {
      const now = getNowIsoString();
      const timestamp = Date.now();
      const items = ids.map((id) => ({
        id: String(id),
        timestamp,
        status,
        updated_at: now,
        is_deleted: 0,
        sync_dirty: 1
      }));
      await db.history.bulkPut(items);
      qCache.invalidate();
      log.trace(`History bulk added: ${ids.length} items as ${status}`);
    },
    async bulkRemove(ids) {
      const now = getNowIsoString();
      await db.history.where("id").anyOf(ids.map(String)).modify({
        is_deleted: 1,
        updated_at: now,
        sync_dirty: 1
      });
      qCache.invalidate();
      log.trace(`History bulk removed: ${ids.length} items`);
    },
    async clear() {
      await db.history.toCollection().modify({
        is_deleted: 1,
        sync_dirty: 1,
        updated_at: getNowIsoString()
      });
      qCache.invalidate();
    },
    async markDirty(id) {
      await db.history.update(String(id), { sync_dirty: 1, updated_at: getNowIsoString() });
      qCache.invalidate();
    }
  });
  const resolveCachedDbValue = async (db, id, mCache) => {
    const row = await db.cache.get(id);
    if (!row) {
      return null;
    }
    const isNegative = isNegativeMagnetCacheValue(row.value);
    const expired = isNegative ? isExpiredNegativeMagnetCacheValue(row.value) : Date.now() - row.timestamp >= CACHE.EXPIRATION_MS;
    if (expired) {
      await db.cache.delete(id);
      return null;
    }
    mCache.set(id, row.value);
    return row.value;
  };
  const createCacheRuntime = (db, mCache) => ({
    async get(id) {
      const memoryValue = mCache.get(id, CACHE.MEMORY_EXPIRATION_MS);
      if (memoryValue !== null) {
        return memoryValue;
      }
      return resolveCachedDbValue(db, id, mCache);
    },
    async set(id, value) {
      await db.cache.put({ id: String(id), value, timestamp: Date.now() });
      mCache.set(id, value);
    },
    async delete(id) {
      await db.cache.delete(String(id));
      mCache.delete(id);
    },
    async clear() {
      await db.cache.clear();
      mCache.clear();
    },
    async getAll() {
      return await db.cache.toArray();
    }
  });
  const createDataServiceRuntime = ({
    db,
    qCache,
    mCache,
    log
  }) => ({
    history: createHistoryRuntime(db, qCache, log),
    cache: createCacheRuntime(db, mCache)
  });

  const log$x = Logger.scope("Database");
  class DataService {
    db;
    qCache = new QueryCache();
    mCache = new MemoryCache();
    runtime;
    constructor() {
      this.db = new FC2Database();
      this.runtime = createDataServiceRuntime({
        db: this.db,
        qCache: this.qCache,
        mCache: this.mCache,
        log: log$x
      });
    }
    async onInit() {
      log$x.debug("Opening Dexie database");
      await this.db.open();
      log$x.info("Database opened");
    }
    onCleanup() {
      this.qCache.invalidate();
      this.mCache.clear();
      this.db.close();
    }
    get history() {
      return this.runtime.history;
    }
    get cache() {
      return this.runtime.cache;
    }
    async runGC() {
      Logger.group("Database", "Garbage collection");
      const now = Date.now();
      await this.db.cache.where("timestamp").below(now - CACHE.EXPIRATION_MS).delete();
      this.mCache.clear();
      Logger.groupEnd();
    }
  }
  const createDataService = () => {
    return new DataService();
  };

  const Repository = AppContainer.register("data-service", createDataService());
  Repository.cache;
  Repository.db;

  var PageContext = ((PageContext2) => {
    PageContext2["Unknown"] = "unknown";
    PageContext2["List"] = "list";
    PageContext2["Detail"] = "detail";
    PageContext2["User"] = "user";
    PageContext2["Search"] = "search";
    return PageContext2;
  })(PageContext || {});

  const FC2PPVDB_ACTRESS_PAGE_NAME = ".sm\\:w-11\\/12.text-white";
  const FC2PPVDB_PRESERVED_BADGES = ".float .icon, .badges span, span.absolute.top-0.right-0, svg.absolute.top-0.right-0";
  const getFc2ppvdbActressPageName = () => {
    const headerName = MediaUtils.cleanActressName(document.querySelector(FC2PPVDB_ACTRESS_PAGE_NAME)?.textContent);
    if (headerName) {
      return headerName;
    }
    const titleName = document.title.split(" - ")[0]?.replace(/\s*女優\s*$/, "").trim();
    return MediaUtils.cleanActressName(titleName) || "";
  };
  const fc2ppvdb = {
    name: "FC2PPVDB",
    hostnames: ["fc2ppvdb.com"],
    listOnDetail: true,
    detectContext: () => {
      const path = location.pathname;
      if (/^\/articles\/\d+/.test(path)) return PageContext.Detail;
      if (/^\/actresses\/\d+/.test(path)) return PageContext.Search;
      return PageContext.List;
    },
    list: {
      containerSelector: "#actress-articles .flex.flex-wrap:not(.flex-end):not(.flex-between), .container .flex.flex-wrap:not(.flex-end):not(.flex-between), .max-w-screen-xl .flex.flex-wrap:not(.flex-end):not(.flex-between), main .flex.flex-wrap:not(.flex-end):not(.flex-between)",
      cardSelector: ".flex.flex-wrap > div:not(.card-rebuilt)",
      identityKey: (card) => {
        const link = card.querySelector('a[href*="/articles/"]');
        const normalized = normalizeListArticleUrl(link?.href);
        return normalized ? normalized.toLowerCase() : null;
      },
      extractor: (card) => {
        const link = card.querySelector('a[href*="/articles/"]');
        const id = MediaUtils.extractFC2Id(link?.href || "") || MediaUtils.extractFC2Id(card.querySelector("span.absolute.top-0.left-0")?.textContent || "");
        if (!id) return null;
        const isActressPage = location.pathname.includes("/actresses/");
        const globalActress = isActressPage ? getFc2ppvdbActressPageName() : "";
        const img = card.querySelector("img:not(.hidden)") || card.querySelector("img");
        const imageUrl = getBestImageSource(img);
        const imageFields = withListImageFallbacks({
          primaryImageUrl: EXTERNAL_URLS.FOURHOI_COVER.replace("{id}", id.padStart(7, "0")),
          imageUrl,
          fallbackImageUrl: imageUrl
        });
        const extraFallbacks = [];
        const writer = card.querySelector('a[href^="/writers/"]')?.textContent?.trim();
        const actress = globalActress || writer;
        const title = normalizeListOptionalText(
          card.querySelector("a.title-font, div.mt-1 a.text-white, h2 a")?.textContent || card.querySelector('a[href*="/articles/"][title]')?.getAttribute("title")
        ) || `FC2-PPV-${id}`;
        return {
          id,
          type: "fc2",
          title,
          ...imageFields,
          extraFallbacks,
          articleUrl: normalizeListArticleUrl(link?.href) || `/articles/${id}`,
          actress: normalizeListOptionalText(actress),
          previewSlug: resolveListPreviewSlug("fc2", id, `fc2-ppv-${id}`)
        };
      },
      getExtraUi: (card) => ({ preservedIconsHTML: preserveHostBadges(card, FC2PPVDB_PRESERVED_BADGES) })
    },
    detail: {
      mainImageSelector: "div.lg\\:w-2\\/5",
      customDetailAction: (cont) => {
        return {
          mode: "card",
          anchorSelector: "div.lg\\:w-2\\/5",
          idExtractor: () => {
            const pid = MediaUtils.extractFC2Id(document.querySelector(".work-title")?.textContent || "");
            const id = pid || MediaUtils.extractFC2Id(location.href) || "";
            return id ? { id, type: "fc2" } : null;
          },
          metadataExtractor: (id) => {
            const title = (document.querySelector("#article-info h2")?.textContent || document.title.split("-")[0] || `FC2-PPV-${id}`).trim();
            const actress = MediaUtils.cleanActressName(document.querySelector(".actress-name")?.textContent);
            const img = cont.querySelector("img:not(.hidden)") || cont.querySelector("img");
            const fallbackImageUrl = getBestImageSource(img) || void 0;
            return {
              title,
              actress: actress ?? void 0,
              primaryImageUrl: EXTERNAL_URLS.FOURHOI_COVER.replace("{id}", id.padStart(7, "0")),
              imageUrl: fallbackImageUrl,
              fallbackImageUrl,
              articleUrl: location.href
            };
          },
          mountOptions: {
            primaryActionsOverride: ["id", "viewed", "magnet"],
            width: ""
          },
          onMounted: async (id) => {
            const actress = MediaUtils.cleanActressName(document.querySelector(".actress-name")?.textContent);
            if (actress) Repository.cache.set(`actress_${id}`, actress);
          }
        };
      }
    }
  };

  const fc2db = {
    name: "FC2DB",
    hostnames: ["fc2db.net"],
    listOnDetail: true,
    detectContext: () => {
      const path = location.pathname;
      if (/^\/work\/\d+(\/|$)/.test(path)) return PageContext.Detail;
      return PageContext.List;
    },
    list: {
      containerSelector: '.grid.gap-4:not([class*="minmax"]), #rec-carousel',
      gridContainerSelector: '.grid.gap-4:not([class*="minmax"])',
      cardSelector: ".bg-card:not(.card-rebuilt), .rec-carousel__slide:not(.card-rebuilt)",
      identityKey: (card) => {
        const link = card.querySelector('a[href*="/work/"]');
        const normalized = normalizeListArticleUrl(link?.href);
        return normalized ? normalized.toLowerCase() : null;
      },
      extractor: (card) => {
        const link = card.querySelector('a[href*="/work/"]');
        const id = MediaUtils.extractFC2Id(link?.href || "");
        if (!id) return null;
        const img = card.querySelector("img.wp-post-image, img.rec-carousel__img, img");
        const imageUrl = getBestImageSource(img);
        const imageFields = withListImageFallbacks({
          primaryImageUrl: imageUrl,
          imageUrl,
          fallbackImageUrl: imageUrl
        });
        const isActressPage = location.pathname.includes("/actress/");
        const actress = isActressPage ? "" : card.querySelector(".text-xs.mt-1.text-text-sub.truncate")?.textContent?.trim() || "";
        const title = normalizeListOptionalText(
          card.querySelector(".mt-1.font-bold")?.textContent || card.querySelector(".rec-carousel__title")?.textContent || card.querySelector("h3 a")?.textContent || card.querySelector("h3")?.textContent
        ) || `FC2-PPV-${id}`;
        return {
          id,
          type: "fc2",
          title,
          ...imageFields,
          articleUrl: normalizeListArticleUrl(link?.href) || `/work/${id}`,
          actress: normalizeListOptionalText(actress) || void 0,
          previewSlug: resolveListPreviewSlug("fc2", id, `fc2-ppv-${id}`)
        };
      }
    },
    detail: {
      mainImageSelector: '.grid > div:first-child > a[href*="fc2.com/article/"]',
      customDetailAction: (cont) => {
        return {
          mode: "card",
          anchorElement: cont,
          idExtractor: () => {
            const id = MediaUtils.extractFC2Id(location.href);
            return id ? { id, type: "fc2" } : null;
          },
          metadataExtractor: (id) => {
            const title = (document.querySelector("h2.text-xl.font-extrabold")?.textContent || document.title.split("–")[0] || `FC2-PPV-${id}`).trim();
            const actress = MediaUtils.cleanActressName(
              document.querySelector('a[href*="/actress/"]')?.textContent
            );
            const img = cont.querySelector("img.wp-post-image");
            const imageUrl = getBestImageSource(img) || void 0;
            return {
              title,
              actress: actress ?? void 0,
              primaryImageUrl: imageUrl,
              fallbackImageUrl: imageUrl,
              articleUrl: location.href
            };
          },
          mountOptions: {
            primaryActionsOverride: ["id", "viewed", "magnet"],
            width: ""
          },
          onMounted: async (id) => {
            const actress = MediaUtils.cleanActressName(
              document.querySelector('a[href*="/actress/"]')?.textContent
            );
            if (actress) Repository.cache.set(`actress_${id}`, actress);
          }
        };
      }
    }
  };

  const enUS = {
    managementCenter: "Management Center",
    tabSettings: "Preferences",
    tabStatistics: "Analytics",
    tabData: "Data & Sync",
    tabAbout: "About",
    tabDmca: "Disclaimer",
    groupFilters: "Filters",
    optionHideNoMagnet: "Filter No-Magnet",
    optionHideCensored: "Filter Censored",
    optionHideViewed: "Filter Viewed",
    optionHideBlocked: "Filter Blocked",
    groupAppearance: "Appearance",
    groupExternalPortals: "External Sites",
    labelPreviewMode: "Preview Mode",
    labelCardDensity: "Card Density",
    labelAccentColor: "Accent Color",
    accentColorDefault: "Classic White",
    accentColorPurple: "Cyber Purple",
    accentColorPink: "Sakura Pink",
    accentColorBlue: "Deep Sea Blue",
    accentColorGreen: "Emerald Green",
    accentColorOrange: "Vibrant Orange",
    accentColorGold: "Royal Gold",
    previewModeStatic: "Static Cover",
    previewModeHover: "Hover/Click Play",
    cardDensityMinimal: "Minimal",
    cardDensityBalanced: "Balanced",
    cardDensityImmersive: "Immersive",
    labelGridColumns: "Grid Columns",
    labelDefault: "Default",
    labelLanguage: "Language",
    langAuto: "Auto",
    langZh: "Chinese",
    langEn: "English",
    langJa: "Japanese",
    groupDataHistory: "Enhancements",
    groupCardActions: "Card Shortcuts",
    cardActionDirectHint: "Checked actions stay visible on the card; unchecked actions collapse into the more menu.",
    cardActionId: "Copy ID",
    cardActionViewed: "Toggle Viewed",
    cardActionMagnet: "Magnet Search",
    cardActionPlay: "Video Preview",
    cardActionPreview: "Gallery Preview",
    cardActionExternal: "External Sites",
    optionEnableHistory: "Track History",
    optionLoadExtraPreviews: "Enable Gallery Preview (Paipancon)",
    optionEnableQuickBar: "Show Quick FAB",
    optionShowViewedBtn: "Show Viewed Button on Card",
    optionShowIdBadge: "Show ID Badge on Card",
    optionEnableMagnets: "Aggregate Magnet Search (Sukebei/0cili)",
    optionEnableExternalLinks: "Show External Links",
    optionEnableActressName: "Fetch Actress Name from FD2PPV (Player Page)",
    optionReplaceFc2Covers: "Auto-replace HD Covers (Fourhoi)",
    optionSupjavSortByViews: "Sort Supjav List by Views",
    labelCacheManagement: "Storage",
    btnClearCache: "Clear Magnet Search Cache",
    labelHistoryManagement: "History",
    btnClearHistory: "Clear History",
    alertSettingsSaved: "Settings saved",
    alertCacheCleared: "Magnet search cache cleared",
    alertHistoryCleared: "History cleared",
    menuOpenSettings: "⚙️ Settings",
    tooltipCopyMagnet: "Copy Magnet",
    tooltipCopied: "Copied",
    tooltipOpenPreviewGallery: "Open gallery preview",
    tooltipOpenExternalLinks: "Open external sites",
    tooltipHealthRecent: "Recently verified healthy",
    tooltipHealthStale: "Health check is stale",
    extraPreviewTitle: "Gallery Preview",
    alertNoPreview: "No Previews",
    alertNoVideoPreview: "No Video Previews",
    alertNoExternalLinks: "No external links found",
    labelExternalLinks: "External Sites",
    groupDataManagement: "Backup",
    btnExportData: "Export Backup",
    btnImportData: "Restore Backup",
    alertExportSuccess: "Backup started",
    alertImportSuccess: "Restore successful, refreshing...",
    alertImportError: "Restore failed: Invalid file",
    tooltipMarkAsViewed: "Mark viewed",
    tooltipMarkAsUnviewed: "Unmark viewed",
    confirmResetDatabase: "Reset script? This will wipe ALL local data and settings permanently.",
    groupWebDAV: "WebDAV Sync",
    labelWebDAVUrl: "Server URL",
    labelWebDAVUser: "Username",
    labelWebDAVPass: "Password/Token",
    btnWebDAVTest: "Test",
    btnWebDAVSync: "Sync Now",
    btnSyncNow: "Sync Now",
    btnForceSync: "Force Full Sync",
    alertWebDAVSuccess: "Connected",
    alertWebDAVError: "Connection failed. Check settings.",
    alertWebDAVSyncSuccess: "Sync Complete",
    alertWebDAVSyncError: "Sync Failed: ",
    syncStatus: "Status",
    labelSyncMode: "Sync Strategy",
    syncModeNone: "Off",
    syncModeSupabase: "Supabase (Advanced)",
    syncModeWebDAV: "WebDAV (Recommended)",
    labelLastSync: "Last Sync",
    labelNever: "Never",
    labelSyncing: "Syncing...",
    alertAlreadyUpToDate: "Already up to date",
    alertSyncLocked: "Sync already in progress in another tab",
    alertSyncLockActive: "Sync in progress in another tab...",
    labelSyncInterval: "Auto-Sync Interval",
    syncInterval0: "Real-time (High load)",
    syncInterval2: "2 minutes",
    syncInterval5: "5 minutes (Recommended)",
    syncInterval10: "10 minutes",
    syncInterval30: "30 minutes",
    syncIntervalManual: "Manual only",
    labelAuthEmail: "Email",
    labelAuthPass: "Password",
    btnConnectAndSync: "Login",
    btnPullSync: "Force Pull Sync",
    btnLogout: "Logout",
    alertLoginRequired: "Credentials missing",
    alertSbUrlRequired: "URL missing",
    alertSyncAccountConnected: "Account connected",
    alertPushAllQuery: "Push all local data?",
    alertPullAllQuery: "Restore all data from cloud? This will overwrite local conflicts.",
    labelSupabaseSync: "Supabase",
    labelSupabaseUrl: "Supabase URL",
    labelSupabaseKey: "Supabase Key",
    aboutDescription: "Inject magnet links, HD covers, gallery mode, and history sync for FC2PPVDB, Supjav, and more.",
    aboutHelpTitle: "Features",
    aboutHelpContent: "• <b>Magnet Search</b>: Aggregate Sukebei / 0cili results with smart filtering.\n• <b>HD Covers</b>: Auto-replace covers from Fourhoi, gallery preview with keyboard nav.\n• <b>Cloud Sync</b>: Sync history via WebDAV / Supabase across devices.\n• <b>Efficiency</b>: Quick FAB, instant ID copy, external link shortcuts.",
    aboutFooterTagline: "Designed for efficiency and privacy.",
    labelTechnicalLogs: "Technical Logs",
    btnCopyAll: "Copy All",
    btnSelectAll: "Select All",
    btnDeselectAll: "Deselect All",
    btnClearLogs: "Clear",
    alertLogsCopied: "Logs copied to clipboard",
    alertLogsCleared: "System logs cleared",
    labelLogFilters: "Filters",
    btnCancel: "Cancel",
    btnSave: "Save",
    btnMoreOptions: "More Options",
    btnClose: "Close",
    btnBackToTop: "Top",
    labelDebugMode: "Debug",
    statusDebugOn: "Debug ON",
    statusDebugOff: "Normal",
    alertDebugOn: "Debug Enabled",
    alertDebugOff: "Debug Disabled",
    btnCopyEnv: "Copy Diagnostics",
    tooltipCopyId: "Copy ID",
    dmcaContent: "This script is a utility tool and <b>does NOT host any video or image files</b>. All content (including images, magnet links) is provided by third-party public websites. Users assume full responsibility for using this tool. If content displayed by this tool infringes your rights, please contact the source website directly for removal.",
    labelDisclaimer: "Disclaimer",
    labelGreasyFork: "Greasy Fork",
    labelLoading: "Loading...",
    labelPreview: "Gallery Preview",
    labelPlayPreview: "Play Preview Video",
    alertPreviewLoadFailed: "Preview failed to load",
    toastNetworkRetrying: "Network error, retrying ({attempt}/{total})...",
    alertLoggedOut: "Logged out",
    mainPreview: "Feature Preview",
    gallerySearch: "Search Image",
    gallerySlideshow: "Slideshow",
    searchPlaceholder: "Search in collection...",
    labelError: "Error",
    confirmDestructiveAction: "Warning: Irreversible action. Continue?",
    groupScraperDiagnosis: "Scraper Connectivity",
    btnTestScrapers: "Run Diagnostics",
    scraperStatusOk: "Healthy",
    scraperStatusError: "Connection Failed",
    scraperStatusCF: "CF Blocked",
    scraperStatus429: "Rate Limited",
    scraperStatusLoading: "Testing...",
    scraperTargetSukebei: "Sukebei (Magnet Search)",
    scraperTargetFd2: "FD2PPV (Actress Fetch)",
    scraperTargetPaipancon: "Paipancon (Gallery Preview)",
    alertScraperBlocked: "Scraper blocked: {target}",
    btnGoVerify: "Verify Now",
    settingsSearchPlaceholder: "Search settings...",
    settingsAdvancedSection: "Advanced options",
    settingsSearchEmptyTitle: "No settings matched",
    settingsSearchEmptyHint: "Try a broader keyword or clear the search to see every settings group.",
    syncLatestTitle: "Latest sync",
    syncLatestEmpty: "No sync result yet.",
    syncCompletedAt: "Completed",
    syncNoConflictYet: "No conflicts reported yet.",
    syncConflictLocalNewer: "Local newer: {count}",
    syncConflictRemoteNewer: "Remote newer: {count}",
    syncConflictMerged: "Merged: {count}",
    debugTraceIdPlaceholder: "Filter by Trace ID",
    debugExportJson: "Export JSON",
    debugPayload: "Payload",
    perfSyncExecute: "Sync Execute",
    perfUpdatedAt: "Updated",
    syncActionDebugLogs: "Debug logs",
    backupImportPreviewPlaceholder: "Import preview will appear here.",
    backupExportSuccessPlain: "Backup exported.",
    backupImportErrorInvalidJson: "Backup file is not valid JSON.",
    backupImportErrorInvalidPayload: "Backup file structure is invalid.",
    backupImportErrorUnsupportedVersion: "Backup version is newer than this script and cannot be imported yet.",
    backupImportErrorReadFailed: "Failed to read the backup file.",
    backupImportErrorApplyFailed: "Backup parsed successfully, but applying it failed.",
    backupImportConfirm: "Import this backup?",
    backupSettingsAdded: "Settings added: {count}",
    backupSettingsChanged: "Settings changed: {count}",
    backupHistoryRows: "History rows: {count}",
    backupHistoryRowsWithCurrent: "History rows to import: {count} (current: {current})",
    backupChangedKeys: "Changed keys: {keys}",
    syncSummaryFailed: "Sync failed",
    syncSummaryFailedWithMessage: "Sync failed: {message}",
    syncSummaryCompleted: "Sync completed",
    syncSummaryMode: "Mode: {mode}",
    syncSummaryPushed: "Pushed {count}",
    syncSummaryPulled: "Pulled {count}",
    syncSummaryDirty: "Dirty {count}",
    syncSummaryUpToDate: "Already up to date",
    syncSummaryConflictRetry: "Conflict detected, retrying with fresh remote state",
    syncConflictWebdavRetry: "WebDAV ETag conflict detected. The app retried after refreshing remote state.",
    syncErrorSupabase: "Supabase sync failed",
    syncErrorWebdav: "WebDAV sync failed",
    syncErrorNoProvider: "No sync provider configured",
    syncErrorLocked: "Sync already in progress in another tab",
    settingsTaskSync: "Sync Tasks",
    settingsTaskConfigure: "Configure",
    settingsTaskDiagnose: "Diagnosis",
    settingsTaskInfo: "Information",
    labelSelectionMode: "Batch Selection Mode",
    batchActionMarkViewed: "Mark as Viewed",
    batchActionMarkUnviewed: "Mark as Unviewed",
    batchActionCopyIds: "Copy IDs",
    batchActionExtractMagnets: "Extract Magnets",
    batchSelectionCount: "{count} items selected",
    batchActionConfirm: "Execute",
    batchActionCancel: "Cancel",
    batchExtractTitle: "Batch Extract Magnets",
    batchExtractPlaceholder: "Fetching magnet links...",
    batchExtractEmpty: "No magnets found",
    batchExtractSuccess: "Successfully extracted {count} magnets"
  };

  const jaJP = {
    managementCenter: "管理センター",
    tabSettings: "基本設定",
    tabStatistics: "統計",
    tabData: "同期とエクスポート",
    tabAbout: "バージョン情報",
    tabDmca: "免責事項",
    groupFilters: "コンテンツフィルタ",
    optionHideNoMagnet: "マグネットなしを非表示",
    optionHideCensored: "有修正をフィルタ",
    optionHideViewed: "既読をフィルタ",
    optionHideBlocked: "ブラックリストをフィルタ",
    groupAppearance: "外観と操作",
    groupExternalPortals: "外部サイト",
    labelPreviewMode: "プレビュー機能",
    labelCardDensity: "カード密度",
    labelAccentColor: "アクセントカラー",
    accentColorDefault: "クラシックホワイト",
    accentColorPurple: "サイバーパープル",
    accentColorPink: "サクラピンク",
    accentColorBlue: "ディープシーブルー",
    accentColorGreen: "エメラルドグリーン",
    accentColorOrange: "ビブラントオレンジ",
    accentColorGold: "ロイヤルゴールド",
    previewModeStatic: "静止画カバー",
    previewModeHover: "ホバー/クリック再生",
    cardDensityMinimal: "ミニマル",
    cardDensityBalanced: "バランス",
    cardDensityImmersive: "イマーシブ",
    labelGridColumns: "グリッドレイアウト",
    labelDefault: "デフォルト",
    labelLanguage: "表示言語",
    langAuto: "ブラウザ設定に従う",
    langZh: "简体中文",
    langEn: "English",
    langJa: "日本語",
    groupDataHistory: "機能拡張",
    groupCardActions: "ショートカットボタン",
    cardActionDirectHint: "チェックした項目はカード上に直接表示されます。",
    cardActionId: "品番をコピー",
    cardActionViewed: "既読状態",
    cardActionMagnet: "マグネット検索",
    cardActionPlay: "動画プレビュー",
    cardActionPreview: "ギャラリー",
    cardActionExternal: "外部サイト",
    optionEnableHistory: "閲覧履歴を記録",
    optionLoadExtraPreviews: "ギャラリープレビューを有効化 (Paipancon)",
    optionEnableQuickBar: "クイック操作球を表示",
    optionShowViewedBtn: "既読スイッチを表示",
    optionShowIdBadge: "品番コピーボタンを表示",
    optionEnableMagnets: "Sukebei/0cili マグネット検索を統合",
    optionEnableExternalLinks: "外部サイトへのジャンプを有効化",
    optionEnableActressName: "FD2PPV から出演者名を取得 (Player)",
    optionReplaceFc2Covers: "Fourhoi 高画質カバーを自動適用",
    optionSupjavSortByViews: "Supjav リストを再生数順にソート",
    labelCacheManagement: "キャッシュ管理",
    btnClearCache: "マグネット検索キャッシュを消去",
    labelHistoryManagement: "履歴管理",
    btnClearHistory: "すべての閲覧履歴を消去",
    alertSettingsSaved: "設定を保存しました",
    alertCacheCleared: "キャッシュを消去しました",
    alertHistoryCleared: "履歴を消去しました",
    menuOpenSettings: "⚙️ スクリプト設定",
    tooltipCopyMagnet: "マグネットをコピー",
    tooltipCopied: "コピー完了",
    tooltipOpenPreviewGallery: "ギャラリーを開く",
    tooltipOpenExternalLinks: "外部サイトを開く",
    tooltipHealthRecent: "最近の検証で正常",
    tooltipHealthStale: "検証データが古い",
    extraPreviewTitle: "プレビュー",
    alertNoPreview: "プレビューが見つかりません",
    alertNoVideoPreview: "動画プレビューが見つかりません",
    alertNoExternalLinks: "外部リンクが見つかりません",
    labelExternalLinks: "外部サイト",
    groupDataManagement: "バックアップと復元",
    btnExportData: "バックアップをエクスポート",
    btnImportData: "バックアップから復元",
    alertExportSuccess: "エクスポートを開始しました",
    alertImportSuccess: "復元に成功しました。再読み込みします",
    alertImportError: "復元失敗：無効なファイルです",
    tooltipMarkAsViewed: "既読にする",
    tooltipMarkAsUnviewed: "未読にする",
    confirmResetDatabase: "スクリプトをリセットしますか？すべてのデータが消去されます。",
    groupWebDAV: "WebDAV 同期",
    labelWebDAVUrl: "サーバーURL",
    labelWebDAVUser: "ユーザー名",
    labelWebDAVPass: "パスワード/トークン",
    btnWebDAVTest: "接続テスト",
    btnWebDAVSync: "今すぐ同期",
    btnSyncNow: "同期実行",
    btnForceSync: "強制再同期",
    alertWebDAVSuccess: "接続成功",
    alertWebDAVError: "接続失敗。設定を確認してください",
    alertWebDAVSyncSuccess: "同期が完了しました",
    alertWebDAVSyncError: "同期失敗：",
    syncStatus: "接続ステータス",
    labelSyncMode: "同期モード",
    syncModeNone: "無効",
    syncModeSupabase: "Supabase (クラウド)",
    syncModeWebDAV: "WebDAV (推奨)",
    labelLastSync: "最終同期",
    labelNever: "未同期",
    labelSyncing: "同期中...",
    alertAlreadyUpToDate: "最新の状態です",
    alertSyncLocked: "他のタブで同期が実行中です",
    alertSyncLockActive: "同期処理中、お待ちください",
    labelSyncInterval: "自動同期の間隔",
    syncInterval0: "リアルタイム",
    syncInterval2: "2分ごと",
    syncInterval5: "5分ごと (推奨)",
    syncInterval10: "10分ごと",
    syncInterval30: "30分ごと",
    syncIntervalManual: "手動のみ",
    labelAuthEmail: "メールアドレス",
    labelAuthPass: "パスワード",
    btnConnectAndSync: "ログインして同期",
    btnPullSync: "クラウドから強制取得",
    btnLogout: "ログアウト",
    alertLoginRequired: "ログイン情報を入力してください",
    alertSbUrlRequired: "Supabase 設定が不足しています",
    alertSyncAccountConnected: "アカウントに接続しました",
    alertPushAllQuery: "ローカルデータをクラウドに上書きしますか？",
    alertPullAllQuery: "クラウドデータでローカルを上書きしますか？",
    labelSupabaseSync: "Supabase 同期",
    labelSupabaseUrl: "API URL",
    labelSupabaseKey: "API Key (anon)",
    aboutDescription: "FC2PPVDB 等のサイトにマグネット検索、高画質カバー、ギャラリーモード、同期機能を提供します。",
    aboutHelpTitle: "主な機能",
    aboutHelpContent: "Sukebei / 0cili マグネット検索の統合とフィルタリング。\nFourhoi 高画質カバーへの自動置換、キーボード操作対応のギャラリー。\nWebDAV / Supabase 経由のマルチデバイス履歴同期。\nクイックボタン、品番コピー、外部サイト連携。",
    aboutFooterTagline: "効率とプライバシーのために設計。",
    labelTechnicalLogs: "システムログ",
    btnCopyAll: "すべてコピー",
    btnSelectAll: "すべて選択",
    btnDeselectAll: "選択解除",
    btnClearLogs: "ログをクリア",
    alertLogsCopied: "ログをクリップボードにコピーしました",
    alertLogsCleared: "ログを消去しました",
    labelLogFilters: "フィルタ",
    btnCancel: "キャンセル",
    btnSave: "保存",
    btnMoreOptions: "詳細設定",
    btnClose: "閉じる",
    btnBackToTop: "トップへ",
    labelDebugMode: "デバッグモード",
    statusDebugOn: "デバッグ有効",
    statusDebugOff: "通常モード",
    alertDebugOn: "デバッグを有効にしました",
    alertDebugOff: "通常モードに戻りました",
    btnCopyEnv: "診断情報をコピー",
    tooltipCopyId: "品番をコピー",
    dmcaContent: "このスクリプトはローカル拡張ツールであり、<b>動画や画像ファイルをホストまたは保存しません</b>。すべての内容は第三者の公開サイトから取得されています。使用者は自己の責任において利用するものとします。",
    labelDisclaimer: "免责事项",
    labelGreasyFork: "Greasy Fork ページ",
    labelLoading: "読み込み中...",
    labelPreview: "ギャラリー",
    labelPlayPreview: "プレビュー再生",
    alertPreviewLoadFailed: "読み込み失敗",
    toastNetworkRetrying: "ネットワークエラー。リトライ中 ({attempt}/{total})...",
    alertLoggedOut: "ログアウトしました",
    mainPreview: "機能デモ",
    gallerySearch: "画像検索",
    gallerySlideshow: "スライドショー",
    searchPlaceholder: "リスト内を検索...",
    labelError: "エラー",
    confirmDestructiveAction: "警告：この操作は取り消せません。続行しますか？",
    groupScraperDiagnosis: "スクレイパー診断",
    btnTestScrapers: "診断を開始",
    scraperStatusOk: "正常",
    scraperStatusError: "接続エラー",
    scraperStatusCF: "CF 検証が必要",
    scraperStatus429: "レート制限",
    scraperStatusLoading: "テスト中...",
    scraperTargetSukebei: "Sukebei (マグネット)",
    scraperTargetFd2: "FD2PPV (出演者)",
    scraperTargetPaipancon: "Paipancon (ギャラリー)",
    alertScraperBlocked: "ブロックされました: {target}",
    btnGoVerify: "検証に行く",
    settingsSearchPlaceholder: "設定を検索...",
    settingsAdvancedSection: "詳細オプション",
    settingsSearchEmptyTitle: "一致する設定がありません",
    settingsSearchEmptyHint: "別のキーワードで試してください。",
    syncLatestTitle: "最新の同期",
    syncLatestEmpty: "同期記録なし。",
    syncCompletedAt: "完了時刻",
    syncNoConflictYet: "コンフリクトはありません。",
    syncConflictLocalNewer: "ローカルが新しい: {count}",
    syncConflictRemoteNewer: "クラウドが新しい: {count}",
    syncConflictMerged: "マージ済み: {count}",
    debugTraceIdPlaceholder: "Trace ID でフィルタ",
    debugExportJson: "JSON 出力",
    debugPayload: "ペイロード",
    perfSyncExecute: "同期実行",
    perfUpdatedAt: "更新時刻",
    syncActionDebugLogs: "デバッグログ",
    backupImportPreviewPlaceholder: "プレビューがここに表示されます。",
    backupExportSuccessPlain: "エクスポート完了。",
    backupImportErrorInvalidJson: "無効な JSON です。",
    backupImportErrorInvalidPayload: "無効なバックアップ構造です。",
    backupImportErrorUnsupportedVersion: "バージョンが新しすぎるため読み込めません。",
    backupImportErrorReadFailed: "読み込みに失敗しました。",
    backupImportErrorApplyFailed: "データの適用に失敗しました。",
    backupImportConfirm: "このバックアップを復元しますか？",
    backupSettingsAdded: "新規設定: {count}",
    backupSettingsChanged: "変更設定: {count}",
    backupHistoryRows: "履歴: {count}",
    backupHistoryRowsWithCurrent: "履歴: {count} (現在: {current})",
    backupChangedKeys: "変更キー: {keys}",
    syncSummaryFailed: "同期失敗",
    syncSummaryFailedWithMessage: "失敗: {message}",
    syncSummaryCompleted: "同期完了",
    syncSummaryMode: "モード: {mode}",
    syncSummaryPushed: "アップロード {count}",
    syncSummaryPulled: "ダウンロード {count}",
    syncSummaryDirty: "未同期 {count}",
    syncSummaryUpToDate: "最新の状態です。",
    syncSummaryConflictRetry: "衝突を検出し、新しい状態で再試行しました。",
    syncConflictWebdavRetry: "WebDAV ETag 衝突。リフレッシュ後に再試行しました。",
    syncErrorSupabase: "Supabase 同期エラー",
    syncErrorWebdav: "WebDAV 同期エラー",
    syncErrorNoProvider: "プロバイダー未設定",
    syncErrorLocked: "他のタブで同期が進行中です",
    settingsTaskSync: "同期タスク",
    settingsTaskConfigure: "設定",
    settingsTaskDiagnose: "診断",
    settingsTaskInfo: "情報",
    labelSelectionMode: "一括操作モード",
    batchActionMarkViewed: "既読にする",
    batchActionMarkUnviewed: "未读にする",
    batchActionCopyIds: "IDをコピー",
    batchActionExtractMagnets: "マグネットを抽出",
    batchSelectionCount: "{count}個を選択中",
    batchActionConfirm: "実行",
    batchActionCancel: "キャンセル",
    batchExtractTitle: "マグネットリンクの一括抽出",
    batchExtractPlaceholder: "マグネットリンクを取得中...",
    batchExtractEmpty: "マグネットリンクが見つかりません",
    batchExtractSuccess: "{count}個のマグネットリンクを抽出しました"
  };

  const zhCN = {
    managementCenter: "管理中心",
    tabSettings: "基本设置",
    tabStatistics: "数据概览",
    tabData: "同步与导出",
    tabAbout: "关于",
    tabDmca: "免责声明",
    groupFilters: "内容过滤",
    optionHideNoMagnet: "隐藏无磁力资源",
    optionHideCensored: "过滤有码内容",
    optionHideViewed: "过滤已阅内容",
    optionHideBlocked: "屏蔽黑名单内容",
    groupAppearance: "界面与交互",
    groupExternalPortals: "外部站点",
    labelPreviewMode: "预览功能",
    labelCardDensity: "卡片密度",
    labelAccentColor: "主题色",
    accentColorDefault: "经典白",
    accentColorPurple: "极光紫",
    accentColorPink: "落樱粉",
    accentColorBlue: "深海蓝",
    accentColorGreen: "翡翠绿",
    accentColorOrange: "活力橙",
    accentColorGold: "皇家金",
    previewModeStatic: "静态封面",
    previewModeHover: "悬停/点击播放预览",
    cardDensityMinimal: "极简",
    cardDensityBalanced: "平衡",
    cardDensityImmersive: "沉浸",
    labelGridColumns: "网格排版",
    labelDefault: "默认",
    labelLanguage: "显示语言",
    langAuto: "跟随浏览器",
    langZh: "简体中文",
    langEn: "English",
    langJa: "日本語",
    groupDataHistory: "功能增强",
    groupCardActions: "卡片快捷按钮",
    cardActionDirectHint: "勾选后直出显示，未勾选则收进更多菜单。",
    cardActionId: "复制番号",
    cardActionViewed: "已阅状态",
    cardActionMagnet: "磁力搜索",
    cardActionPlay: "视频预览",
    cardActionPreview: "图集预览",
    cardActionExternal: "外部站点",
    optionEnableHistory: "记录浏览历史",
    optionLoadExtraPreviews: "开启图集预览抓取 (Paipancon)",
    optionEnableQuickBar: "显示右下角悬浮球",
    optionShowViewedBtn: "卡片显示已阅开关",
    optionShowIdBadge: "卡片显示番号复制按钮",
    optionEnableMagnets: "聚合 Sukebei/0cili 的磁力搜索",
    optionEnableExternalLinks: "开启外部站点跳转",
    optionEnableActressName: "播放器页抓取 FD2PPV 的演员名",
    optionReplaceFc2Covers: "自动补全 Fourhoi 的高清封面",
    optionSupjavSortByViews: "Supjav 列表按播放量排序",
    labelCacheManagement: "缓存管理",
    btnClearCache: "清理磁力搜索结果缓存",
    labelHistoryManagement: "历史管理",
    btnClearHistory: "清空所有历史记录",
    alertSettingsSaved: "设置已保存",
    alertCacheCleared: "磁力搜索结果已清理",
    alertHistoryCleared: "所有历史记录已清空",
    menuOpenSettings: "⚙️ 脚本配置",
    tooltipCopyMagnet: "复制磁力链接",
    tooltipCopied: "已复制",
    tooltipOpenPreviewGallery: "打开图集预览",
    tooltipOpenExternalLinks: "打开外部站点",
    tooltipHealthRecent: "近期已验证正常",
    tooltipHealthStale: "健康检查已过期",
    extraPreviewTitle: "图集预览",
    alertNoPreview: "未找到预览图",
    alertNoVideoPreview: "未找到视频预览",
    alertNoExternalLinks: "未找到外部站点",
    labelExternalLinks: "外部站点",
    groupDataManagement: "备份与恢复",
    btnExportData: "导出备份",
    btnImportData: "恢复备份",
    alertExportSuccess: "备份文件已开始下载",
    alertImportSuccess: "数据恢复成功，即将重新加载",
    alertImportError: "恢复失败：无效的备份文件",
    tooltipMarkAsViewed: "标为已阅",
    tooltipMarkAsUnviewed: "标为未阅",
    confirmResetDatabase: "确定重置脚本？这将清空所有本地数据与配置且无法恢复。",
    groupWebDAV: "WebDAV 同步",
    labelWebDAVUrl: "服务器地址",
    labelWebDAVUser: "账号",
    labelWebDAVPass: "密码/Token",
    btnWebDAVTest: "测试连接",
    btnWebDAVSync: "立即同步",
    btnSyncNow: "立即同步",
    btnForceSync: "强制重新同步",
    alertWebDAVSuccess: "连接成功",
    alertWebDAVError: "连接失败，请检查配置",
    alertWebDAVSyncSuccess: "云同步已完成",
    alertWebDAVSyncError: "同步失败：",
    syncStatus: "连接状态",
    labelSyncMode: "同步策略",
    syncModeNone: "关闭",
    syncModeSupabase: "Supabase 云端 (高频)",
    syncModeWebDAV: "WebDAV 协议 (推荐)",
    labelLastSync: "上次同步时间",
    labelNever: "从未同步",
    labelSyncing: "同步中...",
    alertAlreadyUpToDate: "数据已同步到最新",
    alertSyncLocked: "同步任务已在其他标签页运行中",
    alertSyncLockActive: "其他标签页正在更新，请稍候",
    labelSyncInterval: "自动同步频率",
    syncInterval0: "实时 (较高占用)",
    syncInterval2: "每 2 分钟",
    syncInterval5: "每 5 分钟 (推荐)",
    syncInterval10: "每 10 分钟",
    syncInterval30: "每 30 分钟",
    syncIntervalManual: "仅手动触发",
    labelAuthEmail: "邮箱",
    labelAuthPass: "密码",
    btnConnectAndSync: "登录并同步",
    btnPullSync: "仅强制拉取云端数据",
    btnLogout: "注销",
    alertLoginRequired: "请填写登录信息",
    alertSbUrlRequired: "缺少 Supabase 配置信息",
    alertSyncAccountConnected: "账号连接成功",
    alertPushAllQuery: "确定将本地数据全量推送到云端？",
    alertPullAllQuery: "确定从云端覆盖本地数据？这将丢弃所有本地未同步的改动。",
    labelSupabaseSync: "Supabase 同步",
    labelSupabaseUrl: "服务器地址",
    labelSupabaseKey: "密钥 (anon key)",
    aboutDescription: "为 FC2PPVDB 等站点提供磁力评分聚合、高清封面替换、图集模式及历史记录同步。",
    aboutHelpTitle: "主要功能",
    aboutHelpContent: "聚合 Sukebei / 0cili 磁力搜索，并自动过滤失效条目。\n自动补全 Fourhoi 高清封面，详情页支持图集预览及键盘操作。\n支持 WebDAV 或 Supabase 协议，安全同步多设备浏览历史。\n快捷悬浮球、一键复制番号、外部站点快速跳转。",
    aboutFooterTagline: "为效率与隐私而设计。",
    labelTechnicalLogs: "系统日志",
    btnCopyAll: "复制全部",
    btnSelectAll: "全选",
    btnDeselectAll: "取消全选",
    btnClearLogs: "清空日志",
    alertLogsCopied: "日志已复制到剪贴板",
    alertLogsCleared: "系统日志已清空",
    labelLogFilters: "日志过滤",
    btnCancel: "取消",
    btnSave: "保存设置",
    btnMoreOptions: "更多功能",
    btnClose: "关闭",
    btnBackToTop: "回顶部",
    labelDebugMode: "调试模式",
    statusDebugOn: "开发模式",
    statusDebugOff: "常规模式",
    alertDebugOn: "调试模式已激活",
    alertDebugOff: "已回到常规模式",
    btnCopyEnv: "导出诊断信息",
    tooltipCopyId: "复制番号",
    dmcaContent: "本脚本仅为本地增强型工具，<b>不托管或存储任何视频或图片文件</b>。所有索引内容均来自第三方公开网站。使用者需对使用行为涉及的法律风险自行负责。如有侵权内容展示，请联系该内容的来源网站发起移除。",
    labelDisclaimer: "声明条款",
    labelGreasyFork: "Greasy Fork 主页",
    labelLoading: "加载中...",
    labelPreview: "图集预览",
    labelPlayPreview: "播放视频预览",
    alertPreviewLoadFailed: "预览加载失败",
    toastNetworkRetrying: "网络错误，正在重试（{attempt}/{total}）...",
    alertLoggedOut: "已成功退出",
    mainPreview: "功能演示",
    gallerySearch: "以图搜图",
    gallerySlideshow: "开启幻灯片播放",
    searchPlaceholder: "在当前列表中搜索...",
    labelError: "发生错误",
    confirmDestructiveAction: "注意：此操作具有破坏性，执行后数据无法找回。",
    groupScraperDiagnosis: "爬虫连通性诊断",
    btnTestScrapers: "开始连通性诊断",
    scraperStatusOk: "连接正常",
    scraperStatusError: "连接失败",
    scraperStatusCF: "需要验证 CF",
    scraperStatus429: "请求频繁",
    scraperStatusLoading: "测试中...",
    scraperTargetSukebei: "Sukebei（磁力搜索）",
    scraperTargetFd2: "FD2PPV（演员抓取）",
    scraperTargetPaipancon: "Paipancon（图集预览）",
    alertScraperBlocked: "爬虫已被拦截：{target}",
    btnGoVerify: "去验证",
    settingsSearchPlaceholder: "搜索设置...",
    settingsAdvancedSection: "高级选项",
    settingsSearchEmptyTitle: "没有匹配项",
    settingsSearchEmptyHint: "试试更短的关键词，或切换到其他设置分类。",
    syncLatestTitle: "最近一次同步",
    syncLatestEmpty: "暂无同步结果。",
    syncCompletedAt: "完成时间",
    syncNoConflictYet: "当前没有冲突记录。",
    syncConflictLocalNewer: "本地较新: {count}",
    syncConflictRemoteNewer: "云端较新: {count}",
    syncConflictMerged: "已合并: {count}",
    debugTraceIdPlaceholder: "按 Trace ID 过滤",
    debugExportJson: "导出 JSON",
    debugPayload: "载荷",
    perfSyncExecute: "同步执行",
    perfUpdatedAt: "更新时间",
    syncActionDebugLogs: "调试日志",
    backupImportPreviewPlaceholder: "导入预览会显示在这里。",
    backupExportSuccessPlain: "已导出备份。",
    backupImportErrorInvalidJson: "备份文件不是有效的 JSON。",
    backupImportErrorInvalidPayload: "备份文件结构无效。",
    backupImportErrorUnsupportedVersion: "备份版本高于当前脚本，暂时无法导入。",
    backupImportErrorReadFailed: "读取备份文件失败。",
    backupImportErrorApplyFailed: "备份解析成功，但应用数据时失败。",
    backupImportConfirm: "确定导入这个备份吗？",
    backupSettingsAdded: "新增设置：{count}",
    backupSettingsChanged: "变更设置：{count}",
    backupHistoryRows: "历史记录：{count}",
    backupHistoryRowsWithCurrent: "历史记录：{count}（当前：{current}）",
    backupChangedKeys: "变更键：{keys}",
    syncSummaryFailed: "同步失败",
    syncSummaryFailedWithMessage: "同步失败: {message}",
    syncSummaryCompleted: "同步完成",
    syncSummaryMode: "模式: {mode}",
    syncSummaryPushed: "上传 {count}",
    syncSummaryPulled: "下载 {count}",
    syncSummaryDirty: "脏数据 {count}",
    syncSummaryUpToDate: "无需同步，数据已是最新。",
    syncSummaryConflictRetry: "检测到冲突，已按较新版重试。",
    syncConflictWebdavRetry: "WebDAV ETag 冲突，系统已刷新云端状态后再次合并。",
    syncErrorSupabase: "Supabase 同步失败",
    syncErrorWebdav: "WebDAV 同步失败",
    syncErrorNoProvider: "未配置同步提供方",
    syncErrorLocked: "另一标签页中已有同步正在进行",
    settingsTaskSync: "同步任务",
    settingsTaskConfigure: "配置选项",
    settingsTaskDiagnose: "诊断工具",
    settingsTaskInfo: "关于信息",
    labelSelectionMode: "批量操作模式",
    batchActionMarkViewed: "标记已看",
    batchActionMarkUnviewed: "标记未看",
    batchActionCopyIds: "复制番号",
    batchActionExtractMagnets: "提取磁力",
    batchSelectionCount: "已选中 {count} 项",
    batchActionConfirm: "确认执行",
    batchActionCancel: "取消",
    batchExtractTitle: "批量提取磁力链接",
    batchExtractPlaceholder: "正在抓取磁力链接...",
    batchExtractEmpty: "未找到磁力链接",
    batchExtractSuccess: "已成功提取 {count} 条磁力链接"
  };

  const translations = {
    "zh-CN": zhCN,
    "en-US": enUS,
    "ja-JP": jaJP
  };
  const baseTranslations = { ...translations };
  const getActiveLocale = () => {
    return resolveLocalePreference(String(State.proxy.language || "auto"), navigator.language);
  };
  const Localization = {
    _translations: baseTranslations,
    get locale() {
      return getActiveLocale();
    },
    t(key, params) {
      const locale = getActiveLocale();
      const set = this._translations[locale] || this._translations[DEFAULT_LOCALE];
      let value = set?.[key] || this._translations[DEFAULT_LOCALE]?.[key] || key;
      if (params && typeof value === "string") {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          value = value.replace(new RegExp(`{${paramKey}}`, "g"), String(paramValue));
        });
      }
      return value;
    },
    resolvePath(obj, path) {
      try {
        return path.split(".").reduce((prev, curr) => {
          if (prev && typeof prev === "object") return prev[curr];
          return void 0;
        }, obj);
      } catch {
        return null;
      }
    },
    register(locale, newTranslations) {
      if (!this._translations[locale]) {
        this._translations[locale] = {};
      }
      const target = this._translations[locale];
      if (target) this.deepMerge(target, newTranslations);
    },
    deepMerge(target, source) {
      for (const key in source) {
        if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
          this.deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
      return target;
    }
  };
  const t = (key, params) => Localization.t(key, params);

  const log$w = Logger.scope("ScraperQueue");
  class ScraperQueue {
    constructor(maxConcurrent, scope) {
      this.maxConcurrent = maxConcurrent;
      this.scope = scope;
    }
    queue = [];
    activeRequests = 0;
    getBackoff() {
      return Number(Storage.get(`scraper_backoff_${this.scope}_until`, 0));
    }
    getBackoffLevel() {
      return Number(Storage.get(`scraper_backoff_${this.scope}_level`, 0));
    }
    triggerBackoff(baseDelay, source = "Unknown") {
      const currentLevel = this.getBackoffLevel();
      const exponentialDelay = baseDelay * Math.pow(2, currentLevel);
      const finalDelay = Math.min(exponentialDelay, TIMING.MAX_BACKOFF_MS);
      const jitter = Math.min(3e3, finalDelay * 0.1) * Math.random();
      const totalDuration = finalDelay + jitter;
      const until = Date.now() + totalDuration;
      const nextLevel = Math.min(currentLevel + 1, 6);
      Storage.set(`scraper_backoff_${this.scope}_until`, until);
      Storage.set(`scraper_backoff_${this.scope}_level`, nextLevel);
      log$w.warn(
        `[${this.scope}] Backoff triggered by ${source} for ${Math.ceil(totalDuration / 1e3)}s (L${nextLevel})`
      );
    }
    resetBackoff() {
      if (this.getBackoffLevel() > 0) {
        Storage.set(`scraper_backoff_${this.scope}_level`, 0);
        log$w.debug(`[${this.scope}] Backoff level reset`);
      }
    }
    resetFullBackoff() {
      Storage.delete(`scraper_backoff_${this.scope}_until`);
      Storage.delete(`scraper_backoff_${this.scope}_level`);
      log$w.debug(`[${this.scope}] Full backoff reset`);
    }
    async checkBackoff() {
      const backoffUntil = this.getBackoff();
      const now = Date.now();
      if (now < backoffUntil) {
        return false;
      }
      return true;
    }
    async waitBackoff() {
      const backoffUntil = this.getBackoff();
      const now = Date.now();
      if (now < backoffUntil) {
        await Utils.sleep(backoffUntil - now);
      }
    }
    enqueue(task) {
      this.queue.push(task);
      this.processQueue();
    }
    async processQueue() {
      if (this.activeRequests >= this.maxConcurrent || this.queue.length === 0) return;
      this.activeRequests++;
      const task = this.queue.shift();
      try {
        await task();
      } finally {
        this.activeRequests--;
        void this.processQueue();
      }
    }
  }

  const log$v = Logger.scope("MagnetProvider");
  class MagnetProvider {
    constructor(sukebeiQueue) {
      this.sukebeiQueue = sukebeiQueue;
    }
    async fetchFromSukebei(chunk, onResult, traceId) {
      const queryParts = [];
      for (const id of chunk) {
        const dateParts = MediaUtils.parseDateIdParts(id);
        if (dateParts) {
          const sep = dateParts.brand === "CARIBBEANCOM" ? "-" : "_";
          queryParts.push(`${dateParts.date}${sep}${dateParts.serial}-${dateParts.short}`);
        } else {
          queryParts.push(id);
        }
      }
      const query = queryParts.join("|");
      const url = Config.SCRAPER_URLS.SUKEBEI_SEARCH.replace("{query}", encodeURIComponent(query));
      try {
        const rawHtml = await http(url, { type: "text" });
        const doc = new DOMParser().parseFromString(rawHtml, "text/html");
        if (doc.title && (doc.title.includes("Cloudflare") || doc.title.includes("Attention Required"))) {
          log$v.warn("Cloudflare blocked, backing off 60s", void 0, traceId);
          this.sukebeiQueue.triggerBackoff(TIMING.CLOUDFLARE_BACKOFF_MS, "Sukebei (Cloudflare)");
          return new Set();
        }
        const rows = doc.querySelectorAll("table.torrent-list tbody tr");
        const foundIds = new Set();
        const regexes = chunk.map((id) => {
          const escaped = id.toUpperCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const parts = MediaUtils.parseDateIdParts(id);
          return {
            id,
            regex: new RegExp(
              `(?<=[^0-9a-zA-Z]|^)${escaped.replace(/[-_\s]/g, "[-_\\s]")}(?=[^0-9a-zA-Z]|$)`,
              "i"
            ),
            parts,
searchId: id.toUpperCase()
          };
        });
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (!row) continue;
          const magnetAnchor = row.querySelector("a[href^='magnet:?']");
          const linkAnchor = row.querySelector('a[href*="/view/"]') || row.querySelector("td:nth-child(2) a");
          if (magnetAnchor && linkAnchor) {
            const title = linkAnchor.textContent?.trim().toUpperCase() || "";
            const magnet = magnetAnchor.href;
            for (const { id, regex, searchId, parts } of regexes) {
              if (foundIds.has(id)) continue;
              const match = title.match(regex);
              let matchedIndex = match?.index ?? null;
              let isFlexibleMatch = false;
              if (!match && parts) {
                const { date, serial, short } = parts;
                const hasDate = title.includes(date);
                const hasSerial = title.includes(serial);
                if (hasDate && hasSerial) {
                  const dateIdx = title.indexOf(date);
                  const serialIdx = title.indexOf(serial);
                  if (Math.abs(dateIdx - serialIdx) < 15) {
                    if (title.includes(short) || !/[A-Z]{2,}-\d+/.test(title.replace(date, "").replace(serial, ""))) {
                      matchedIndex = dateIdx;
                      isFlexibleMatch = true;
                    }
                  }
                }
              }
              if (match || isFlexibleMatch) {
                if (!isFlexibleMatch) {
                  if (!match) continue;
                  const idx = matchedIndex;
                  const matchedStr = match[0];
                  if (idx === null || !matchedStr) continue;
                  const before = title[idx - 1], after = title[idx + matchedStr.length];
                  const isDigit = (c) => c !== void 0 && c >= "0" && c <= "9";
                  if (isDigit(searchId[0]) && isDigit(before)) continue;
                  if (isDigit(searchId[searchId.length - 1]) && isDigit(after)) continue;
                }
                onResult(id, magnet);
                foundIds.add(id);
              }
            }
          }
        }
        log$v.info(`Sukebei: ${foundIds.size}/${chunk.length} found`, void 0, traceId);
        this.sukebeiQueue.resetBackoff();
        return foundIds;
      } catch (e) {
        const err = e;
        if (err.status === 429) {
          this.sukebeiQueue.triggerBackoff(TIMING.RATE_LIMIT_BACKOFF_MS, "Sukebei (429)");
        } else {
          log$v.error("Sukebei fetch error", e, traceId);
        }
        return new Set();
      }
    }
    async fetchFrom0cili(id, type, onResult, traceId) {
      try {
        let searchQuery;
        const dateParts = MediaUtils.parseDateIdParts(id);
        if (dateParts) {
          const sep = dateParts.brand === "CARIBBEANCOM" ? "-" : "_";
          searchQuery = `${dateParts.date}${sep}${dateParts.serial}-${dateParts.short}`;
        } else {
          searchQuery = type === "fc2" ? id : id.replace(/-/g, " ");
        }
        const url = Config.SCRAPER_URLS.OCILI_SEARCH.replace("{query}", encodeURIComponent(searchQuery));
        const rawHtml = await http(url, { type: "text" });
        const doc = new DOMParser().parseFromString(rawHtml, "text/html");
        const rows = doc.querySelectorAll("table tbody tr, .torrent-list tr");
        let found = false;
        const searchId = id.toUpperCase();
        const regex = new RegExp(
          `(?<=[^0-9a-zA-Z]|^)${searchId.replace(/[-_\s]/g, "[-_\\s]")}(?=[^0-9a-zA-Z]|$)`,
          "i"
        );
        for (const row of Array.from(rows)) {
          const magnetAnchor = row.querySelector("a[href^='magnet:?']");
          const titleElement = row.querySelector("a[title], td:nth-child(2) a, .torrent-name a");
          if (magnetAnchor && titleElement) {
            const title = (titleElement.getAttribute("title") || titleElement.textContent || "").trim().toUpperCase();
            if (regex.test(title)) {
              onResult(id, magnetAnchor.href);
              found = true;
              log$v.info(`0cili: Found magnet for ${id}`, void 0, traceId);
              break;
            }
          }
        }
        if (!found) {
          onResult(id, null);
          log$v.debug(`0cili: No magnet for ${id}`, void 0, traceId);
        }
        await Utils.sleep(TIMING.OCILI_DELAY_MS + Math.random() * TIMING.OCILI_RANDOM_DELAY_MS);
      } catch (e) {
        log$v.error(`0cili fetch error for ${id}`, e, traceId);
        onResult(id, null);
      }
    }
  }

  const log$u = Logger.scope("PreviewProvider");
  class PreviewProvider {
    constructor(paipanconQueue) {
      this.paipanconQueue = paipanconQueue;
    }
    async fetchExtraPreviews(fc2Id) {
      try {
        const normalizedId = fc2Id.padStart(7, "0");
        const idPattern = `${PATTERNS.FC2_PPV_PREFIX}${normalizedId}`;
        const url = Config.SCRAPER_URLS.PAIPANCON_DETAIL.replace("{id}", normalizedId);
        const rawHtml = await http(url, { type: "text" });
        const doc = new DOMParser().parseFromString(rawHtml, "text/html");
        const results = [];
        const blacklist = PREVIEW_BLACKLIST;
        doc.querySelectorAll("img").forEach((img) => {
          let src = img.getAttribute("src");
          if (src) {
            const lowSrc = src.toLowerCase();
            const isBad = blacklist.some((key) => lowSrc.includes(key));
            const isRelevant = src.includes(idPattern) || src.includes(fc2Id);
            if (!isBad && isRelevant) {
              if (src.startsWith("/")) src = Config.SCRAPER_URLS.PAIPANCON_BASE + src;
              results.push({ type: "image", src });
            }
          }
        });
        doc.querySelectorAll("video").forEach((video) => {
          let src = video.getAttribute("src") || video.querySelector("source")?.getAttribute("src");
          if (src) {
            const isRelevant = src.includes(idPattern) || src.includes(fc2Id);
            if (isRelevant) {
              if (src.startsWith("/")) src = Config.SCRAPER_URLS.PAIPANCON_BASE + src;
              results.push({ type: "video", src });
            }
          }
        });
        return results;
      } catch (err) {
        const e = err;
        if (e.status === 404) {
          log$u.debug(`No previews found on Paipancon for ${fc2Id}`);
        } else if (e.status === 429 || e.status === 503) {
          this.paipanconQueue.triggerBackoff(TIMING.RATE_LIMIT_BACKOFF_MS, `Paipancon (${e.status})`);
        } else {
          log$u.warn(`Failed to fetch extra previews: ${fc2Id} (Status: ${e.status || "Unknown"})`);
        }
        return [];
      }
    }
  }

  const log$t = Logger.scope("ActressProvider");
  class ActressProvider {
    async fetchActressFromFD2(id) {
      const cacheKey = `actress_${id}`;
      const cached = await Repository.cache.get(cacheKey);
      if (cached) {
        const cleanCached = MediaUtils.cleanActressName(cached);
        if (cleanCached) {
          log$t.debug(`Actress cache hit: ${id} = ${cleanCached}`);
          return cleanCached;
        } else {
          log$t.warn(`Removing invalid cached actress for ${id}: ${cached}`);
          await Repository.cache.delete(cacheKey);
        }
      }
      const backoffEnd = Number(Storage.get("fd2_backoff_until", 0));
      if (Date.now() < backoffEnd) {
        log$t.debug(
          `Skipping FD2 request, backoff active (${Math.ceil((backoffEnd - Date.now()) / 1e3)}s remaining)`
        );
        return null;
      }
      const now = Date.now();
      const lastFetch = Number(Storage.get("last_actress_fetch", 0));
      const waitTime = Math.max(
        0,
        lastFetch + TIMING.ACTRESS_BASE_DELAY_MS + Math.random() * TIMING.ACTRESS_RANDOM_DELAY_MS - now
      );
      if (waitTime > 0) await Utils.sleep(waitTime);
      Storage.set("last_actress_fetch", Date.now());
      try {
        const url = EXTERNAL_URLS.FD2PPV.replace("{id}", id);
        const headers = getBypassHeaders(url);
        const html = await http(url, {
          type: "text",
          headers,
          timeout: 1e4
        });
        const doc = new DOMParser().parseFromString(html, "text/html");
        if (doc.title && CLOUDFLARE_INDICATORS.some((s) => doc.title.includes(s))) {
          log$t.warn("FD2PPV Cloudflare detected, backing off 5m");
          Storage.set("fd2_backoff_until", Date.now() + TIMING.FD2_BACKOFF_MS);
          return null;
        }
        const actressLinks = Array.from(
          doc.querySelectorAll(
            [".artist-info-card .artist-name a", ".artist-name a", "a.artistUrl", "h3.artist-name a"].join(",")
          )
        );
        let actress = null;
        for (const link of actressLinks) {
          const cleaned = MediaUtils.cleanActressName(link.textContent);
          if (cleaned) {
            actress = cleaned;
            break;
          }
        }
        if (actress) {
          await Repository.cache.set(cacheKey, actress);
          log$t.info(`Fetched actress: ${id} = ${actress}`);
        }
        return actress;
      } catch (e) {
        const err = e;
        if (err.status === 403 || err.status === 429 || err.status === 503) {
          log$t.warn(`FD2PPV error (${err.status}), backing off 5m`);
          Storage.set("fd2_backoff_until", Date.now() + TIMING.FD2_BACKOFF_MS);
        } else {
          log$t.error(`Failed to fetch actress: ${id}`, e);
        }
        return null;
      }
    }
    resetBackoff() {
      Storage.delete("fd2_backoff_until");
      log$t.debug("FD2PPV backoff reset");
    }
  }

  const resolveScraperHealthUrl = (target, paipanconBaseUrl) => {
    if (target === "sukebei") return "https://sukebei.nyaa.si";
    if (target === "fd2") return "https://fd2ppv.cc";
    return paipanconBaseUrl;
  };
  const detectScraperHealthStatus = (html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (doc.title && CLOUDFLARE_INDICATORS.some((indicator) => doc.title.includes(indicator))) {
      return "cf";
    }
    return "ok";
  };
  const groupMagnetRequestItems = (items) => {
    const grouped = new Map();
    items.forEach((item) => {
      const key = item.type || "fc2";
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(item);
    });
    return grouped;
  };
  const chunkMagnetIds = (ids) => {
    const chunkSize = NETWORK.CHUNK_SIZE;
    const chunks = [];
    for (let index = 0; index < ids.length; index += chunkSize) {
      chunks.push(ids.slice(index, index + chunkSize));
    }
    return chunks;
  };
  const createPreviewExistsCacheKey = (fc2Id) => `has_previews_${fc2Id}`;

  const log$s = Logger.scope("Scraper");
  class ScraperServiceImplementation {
    MAX_MAGNET_CONCURRENT = 3;
    MAX_PREVIEW_CONCURRENT = 2;
    magnetQueue;
    previewQueue;
    magnetProvider;
    previewProvider;
    actressProvider;
    constructor() {
      this.magnetQueue = new ScraperQueue(this.MAX_MAGNET_CONCURRENT, "sukebei");
      this.previewQueue = new ScraperQueue(this.MAX_PREVIEW_CONCURRENT, "paipancon");
      this.magnetProvider = new MagnetProvider(this.magnetQueue);
      this.previewProvider = new PreviewProvider(this.previewQueue);
      this.actressProvider = new ActressProvider();
    }
    onBootstrap() {
      log$s.debug("Scraper service bootstrapped, queues ready");
    }
    notifyBlocked(target, url) {
      const { t } = Localization;
      CoreEvents.emit(AppEvents.SHOW_TOAST, {
        message: t("alertScraperBlocked", { target }),
        type: "warn",
        options: {
          duration: 15e3,
          action: {
            label: t("btnGoVerify"),
            onClick: () => BrowserService.openTab(url)
          }
        }
      });
    }
    async testHealth(target) {
      const url = resolveScraperHealthUrl(target, Config.SCRAPER_URLS.PAIPANCON_BASE);
      try {
        const html = await http(url, { type: "text", timeout: NETWORK.HEALTH_CHECK_TIMEOUT });
        return detectScraperHealthStatus(html);
      } catch (error) {
        const requestError = error;
        if (requestError.status === 429) {
          return "429";
        }
        if (requestError.status === 403 || requestError.status === 503) {
          return "cf";
        }
        return "error";
      }
    }
    async fetchMagnets(items, onResult) {
      if (!items?.length) {
        return;
      }
      const traceId = Logger.traceId;
      log$s.info(`Starting magnet fetch for ${items.length} items`, { ids: items.map((item) => item.id) }, traceId);
      const pendingPromises = [];
      for (const [type, itemList] of groupMagnetRequestItems(items)) {
        for (const chunk of chunkMagnetIds(itemList.map((item) => item.id))) {
          pendingPromises.push(
            new Promise((resolve) => {
              this.magnetQueue.enqueue(async () => {
                const foundIds = new Set();
                try {
                  await this.magnetQueue.waitBackoff();
                  const delay = TIMING.MAGNET_BASE_DELAY_MS + Math.random() * TIMING.MAGNET_RANDOM_DELAY_MS;
                  await Utils.sleep(delay);
                  const sukebeiResults = await this.magnetProvider.fetchFromSukebei(
                    chunk,
                    (id, url) => {
                      foundIds.add(id);
                      onResult(id, url);
                    },
                    traceId
                  );
                  sukebeiResults.forEach((id) => foundIds.add(id));
                  if (foundIds.size === 0) {
                    const status = await this.testHealth("sukebei");
                    if (status === "cf") {
                      this.notifyBlocked("Sukebei", "https://sukebei.nyaa.si");
                    }
                  }
                  const failedIds = chunk.filter((id) => !foundIds.has(id));
                  if (failedIds.length > 0) {
                    await Promise.all(
                      failedIds.map(async (id) => {
                        try {
                          await this.magnetProvider.fetchFrom0cili(
                            id,
                            type,
                            (subId, url) => {
                              if (url) foundIds.add(subId);
                              onResult(subId, url);
                            },
                            traceId
                          );
                        } catch (error) {
                          log$s.trace(`0cili fallback failed for ${id}`, error);
                          onResult(id, null);
                        }
                      })
                    );
                  }
                } catch (error) {
                  log$s.error("Magnet fetch task failed", error, traceId);
                } finally {
                  chunk.forEach((id) => {
                    if (!foundIds.has(id)) {
                      onResult(id, null);
                    }
                  });
                  resolve();
                }
              });
            })
          );
        }
      }
      await Promise.all(pendingPromises);
    }
    async fetchActressFromFD2(id) {
      return this.actressProvider.fetchActressFromFD2(id);
    }
    resetFD2Backoff() {
      this.actressProvider.resetBackoff();
    }
    async fetchExtraPreviews(fc2Id) {
      return this.previewProvider.fetchExtraPreviews(fc2Id);
    }
    async checkPreviewExists(fc2Id) {
      const cacheKey = createPreviewExistsCacheKey(fc2Id);
      const cached = await Repository.cache.get(cacheKey);
      if (cached !== null) {
        return cached === true;
      }
      return new Promise((resolve) => {
        this.previewQueue.enqueue(async () => {
          const canProceed = await this.previewQueue.checkBackoff();
          if (!canProceed) {
            resolve(false);
            return;
          }
          const jitter = Math.random() * TIMING.PREVIEW_JITTER_MS;
          await Utils.sleep(TIMING.POLITE_DELAY_MS + jitter);
          try {
            const results = await this.fetchExtraPreviews(fc2Id);
            const exists = results.length > 0;
            if (exists) {
              this.previewQueue.resetBackoff();
            }
            await Repository.cache.set(cacheKey, exists);
            resolve(exists);
          } catch (error) {
            log$s.trace(`Preview check failed for ${fc2Id}`, error);
            resolve(false);
          }
        });
      });
    }
  }
  const ScraperService = AppContainer.register("scraper-service", new ScraperServiceImplementation());

  const FD2PPV_PRESERVED_BADGES = ".float i, .float .icon, .badges span, span.absolute.top-0.right-0, .artist-tags a";
  const extractActresses = (card) => {
    const anchors = Array.from(card.querySelectorAll(".artist-avatar-container a"));
    return anchors.map((a) => {
      const img = a.querySelector("img");
      const nameRaw = a.querySelector("h4")?.textContent || img?.getAttribute("alt") || img?.title || "";
      const name = MediaUtils.cleanActressName(nameRaw);
      if (!name) return null;
      return {
        name,
        avatarUrl: img?.src || void 0,
        url: a.href || void 0
      };
    }).filter((a) => a !== null);
  };
  const extractTags = (card) => {
    const tags = [];
    card.querySelectorAll(".float i, .float-icons i, .badges i").forEach((icon) => {
      const title = icon.getAttribute("title");
      if (title && !tags.includes(title)) {
        tags.push(title);
      }
    });
    card.querySelectorAll(".artist-tags a").forEach((tag) => {
      const text = tag.textContent?.trim();
      if (text && !tags.includes(text)) {
        tags.push(text);
      }
    });
    return tags;
  };
  const fd2ppv = {
    name: "FD2PPV",
    hostnames: ["fd2ppv.cc"],
    listOnDetail: true,
    onInit: () => {
      ScraperService.resetFD2Backoff();
    },
    detectContext: () => {
      const path = window.location.pathname;
      const segments = path.split("/").filter(Boolean);
      if (segments[0] === "articles" && segments.length >= 2 && segments[1] && /^\d+$/.test(segments[1])) {
        return PageContext.Detail;
      }
      return PageContext.List;
    },
    list: {
      containerSelector: ".artist-list, .work-list, .flex.flex-wrap:not(.flex-end):not(.flex-between), .container .grid, .other-works-grid",
      cardSelector: [
        ".artist-card:not(.card-rebuilt)",
        ".work-card:not(.card-rebuilt)",
        ".work-list > div:not(.card-rebuilt)"
      ].join(", "),
      identityKey: (card) => {
        const link = card.querySelector('a[href*="/articles/"]');
        const normalized = normalizeListArticleUrl(link?.href);
        return normalized ? normalized.toLowerCase() : null;
      },
      extractor: (card) => {
        const link = card.querySelector('a[href*="/articles/"]');
        const id = MediaUtils.extractFC2Id(link?.href || "");
        const carouselImages = Array.from(card.querySelectorAll(".carousel-slide img"));
        let imageUrl = "";
        if (carouselImages.length > 0) {
          const bestImg = carouselImages.find(
            (img) => img.dataset.src?.includes("ppvdatabank.com") || img.src?.includes("ps1.webp")
          ) || carouselImages[0];
          imageUrl = getBestImageSource(bestImg || null);
        }
        if (!imageUrl) {
          const img = card.querySelector("img.other-work-image") || card.querySelector("img");
          imageUrl = getBestImageSource(img);
        }
        const isActressPage = !!document.querySelector(".artist-detail-name");
        const pageActressName = isActressPage ? MediaUtils.cleanActressName(document.querySelector(".artist-detail-name")?.textContent) : null;
        const actresses = isActressPage ? [] : extractActresses(card);
        const firstActress = actresses[0];
        const actress = pageActressName || firstActress?.name || null;
        const title = normalizeListOptionalText(
          card.querySelector(".artist-content a")?.textContent || card.querySelector(".other-work-title a")?.textContent || card.querySelector("p a")?.textContent || card.querySelector("p")?.textContent || card.querySelector("h3 a")?.textContent
        ) || (id ? `FC2-PPV-${id}` : void 0);
        const tags = extractTags(card);
        return id ? {
          id,
          type: "fc2",
          site: "FD2PPV",
          title,
          actress: normalizeListOptionalText(actress),
          actresses,
          actressAvatarUrl: firstActress?.avatarUrl,
          actressUrl: firstActress?.url,
          ...withListImageFallbacks({
            primaryImageUrl: imageUrl,
            imageUrl: State.proxy.replaceFc2Covers ? EXTERNAL_URLS.FOURHOI_COVER.replace("{id}", id.padStart(7, "0")) : imageUrl,
            fallbackImageUrl: State.proxy.replaceFc2Covers ? EXTERNAL_URLS.PAIPANCON_COVER.replace("{id}", id.padStart(7, "0")) : imageUrl
          }),
          tags: tags.length > 0 ? tags : void 0,
          articleUrl: normalizeListArticleUrl(link?.href) || `/articles/${id}`,
          previewSlug: resolveListPreviewSlug("fc2", id)
        } : null;
      },
      postProcess: (card, _el, newCard, _data, classes) => {
        const stats = card.querySelector(".stats");
        if (stats) {
          const infoArea = newCard.querySelector(`.${classes.infoArea}`);
          if (infoArea) {
            infoArea.insertBefore(stats.cloneNode(true), infoArea.querySelector(`.${classes.cardActionRow}`));
          }
        }
      },
      getExtraUi: (card) => {
        const preservedIconsHTML = preserveHostBadges(card, FD2PPV_PRESERVED_BADGES);
        return { preservedIconsHTML };
      }
    },
    detail: {
      mainImageSelector: ".work-image-large",
      customDetailAction: (cont) => {
        return {
          mode: "card",
          anchorElement: cont,
          idExtractor: () => {
            const id = MediaUtils.extractFC2Id(location.href) || MediaUtils.extractFC2Id(document.querySelector(".work-title")?.textContent || "") || MediaUtils.parseVideoId(
              document.querySelector('.work-meta-value a[href*="article"]')?.getAttribute("href") || ""
            )?.id;
            return id ? { id, type: "fc2" } : null;
          },
          metadataExtractor: (id) => {
            const title = (document.querySelector(".work-brief")?.textContent || document.querySelector(".work-title")?.textContent || document.title.split("|")[0] || `FC2-PPV-${id}`).replace(/\d{7,8}/, "").trim() || `FC2-PPV-${id}`;
            const actressRaw = document.querySelector(".artist-info-card .artist-name a")?.textContent || document.querySelector(".artist-name a")?.textContent || Array.from(document.querySelectorAll(".work-meta-label")).find((el) => el.textContent?.trim() === PATTERNS.FD2PPV_SELLER_MARKER)?.nextElementSibling?.querySelector("a")?.textContent;
            const actress = MediaUtils.cleanActressName(actressRaw);
            const img = cont.querySelector("img");
            const primaryImageUrl = getBestImageSource(img) || void 0;
            return {
              title,
              actress: actress ?? void 0,
              primaryImageUrl,
              imageUrl: State.proxy.replaceFc2Covers ? EXTERNAL_URLS.FOURHOI_COVER.replace("{id}", id.padStart(7, "0")) : primaryImageUrl,
              fallbackImageUrl: State.proxy.replaceFc2Covers ? EXTERNAL_URLS.PAIPANCON_COVER.replace("{id}", id.padStart(7, "0")) : primaryImageUrl,
              articleUrl: location.href
            };
          },
          mountOptions: { width: "" },
          onMounted: async (id) => {
            const actressRaw = document.querySelector(".artist-info-card .artist-name a")?.textContent || document.querySelector(".artist-name a")?.textContent || Array.from(document.querySelectorAll(".work-meta-label")).find((el) => el.textContent?.trim() === PATTERNS.FD2PPV_SELLER_MARKER)?.nextElementSibling?.querySelector("a")?.textContent;
            const actress = MediaUtils.cleanActressName(actressRaw);
            if (actress) Repository.cache.set(`actress_${id}`, actress);
          }
        };
      }
    }
  };

  const SUPJAV_LIST_CONTAINERS = ".posts.clearfix, .posts";
  const SUPJAV_TITLE_TRIGGER = ".archive-title h1, h1.entry-title, .post-title h1";
  const SUPJAV_TITLE_BLOCK = ".archive-title, .post-title";
  const SUPJAV_MEDIA_BLOCK = "#player-wrap, #player-wrap.player-wrap, .player-wrap, #dz_video, .video-container, .entry-content .video-player";
  const SUPJAV_VIEW_BLOCK = ".dz_view";
  const SUPJAV_POST_META = ".post-meta.clearfix";
  const SUPJAV_EXCLUDE_SELECTORS = ".recommend, .swiper-slide-duplicate";
  const findNextSiblingMatching = (element, selector) => {
    let current = element?.nextElementSibling;
    while (current) {
      if (current.matches(selector)) {
        return current;
      }
      if (current.matches(SUPJAV_TITLE_BLOCK) || current.matches(".posts.clearfix, .posts")) {
        break;
      }
      current = current.nextElementSibling;
    }
    return null;
  };
  const resolveSupjavDetailContext = (titleEl) => {
    const titleBlock = titleEl.closest(SUPJAV_TITLE_BLOCK) || null;
    const titleAnchor = titleBlock || titleEl;
    const mediaBlock = findNextSiblingMatching(titleAnchor, SUPJAV_MEDIA_BLOCK);
    const viewBlock = findNextSiblingMatching(mediaBlock, SUPJAV_VIEW_BLOCK);
    const postMeta = findNextSiblingMatching(viewBlock || mediaBlock, SUPJAV_POST_META);
    const anchor = postMeta || viewBlock || mediaBlock || titleAnchor;
    return { anchor, postMeta };
  };
  const supjav = {
    name: "Supjav",
    hostnames: ["supjav.com"],
    listOnDetail: true,
    detectContext: () => {
      const path = window.location.pathname;
      if (path.includes("/search/") || window.location.search.includes("s=")) return PageContext.Search;
      const cleanPath = path.replace(/^\/(zh|en|ja)\//, "/");
      const segments = cleanPath.split("/").filter(Boolean);
      if (segments.length === 1 && segments[0] && /^\d+\.html$/.test(segments[0])) return PageContext.Detail;
      if (segments.length === 1 && segments[0]?.toLowerCase() !== "new" && !["popular", "maker", "cast", "tag", "category"].includes(segments[0]?.toLowerCase() || "")) {
        return PageContext.Detail;
      }
      return PageContext.List;
    },
    list: {
      containerSelector: SUPJAV_LIST_CONTAINERS,
      cardSelector: ".post:has(a.img):not(.card-rebuilt)",
      mutationObserverTarget: "container",
      shouldProcessCard: (card) => {
        if (card.closest(SUPJAV_EXCLUDE_SELECTORS)) {
          return false;
        }
        const link = card.querySelector('h3 a, a[rel="bookmark"]');
        if (!link?.href) {
          return false;
        }
        const text = link.title || link.textContent || card.textContent || "";
        return Boolean(MediaUtils.parseVideoId(text, link.href));
      },
      identityKey: (card) => {
        const link = card.querySelector('h3 a, a[rel="bookmark"]');
        const normalized = normalizeListArticleUrl(link?.href);
        return normalized ? normalized.toLowerCase() : null;
      },
      extractor: (card) => {
        const tLink = card.querySelector('h3 a, a[rel="bookmark"]');
        const img = card.querySelector("img.thumb, img");
        const text = tLink?.title || tLink?.textContent || img?.alt || "";
        const info = MediaUtils.parseVideoId(text, tLink?.href || "");
        if (!info) return null;
        const imageSource = card.querySelector("img")?.getAttribute("data-original") || getBestImageSource(img) || "";
        const imageFields = withListImageFallbacks({
          primaryImageUrl: imageSource,
          imageUrl: imageSource,
          fallbackImageUrl: imageSource
        });
        return {
          ...info,
          title: normalizeListOptionalText(text) || info.id,
          ...imageFields,
          articleUrl: normalizeListArticleUrl(tLink?.href),
          previewSlug: resolveListPreviewSlug(info.type, info.id, info.previewSlug),
          actress: normalizeListOptionalText(
            card.querySelector('.post-meta a[href*="/cast/"]')?.textContent || card.querySelector('.meta a[href*="/cast/"]')?.textContent
          )
        };
      },
      postProcess: (card, _el, newCard, data, classes) => {
        if ((data.title?.includes("[有]") || card.innerText.includes("有码")) && classes.isCensored) {
          card.classList.add(classes.isCensored);
          newCard.classList.add(classes.isCensored);
        }
        const meta = card.querySelector(".meta");
        if (meta) {
          const infoArea = newCard.querySelector(`.${classes.infoArea}`);
          if (infoArea)
            infoArea.insertBefore(meta.cloneNode(true), infoArea.querySelector(`.${classes.cardActionRow}`));
        }
        if (State.proxy.supjavSortByViews) {
          const container = card.closest(SUPJAV_LIST_CONTAINERS);
          if (container && container.style.display !== "flex") {
            container.style.display = "flex";
            container.style.flexWrap = "wrap";
          }
          const viewsEl = meta?.querySelector(".date, .pv, .views, .stats") || meta;
          const metaText = viewsEl?.textContent || card.textContent || "";
          const match = metaText.match(/([\d,.]+)[kKmM]?\s*(?:Views|views|播放)/);
          let views = 0;
          if (match && match[1]) {
            const numStr = match[1].replace(/,/g, "");
            views = parseFloat(numStr);
            const matchText = match[0].toLowerCase();
            if (matchText.includes("k")) views *= 1e3;
            if (matchText.includes("m")) views *= 1e6;
          }
          if (views > 0) {
            card.style.order = `${-Math.round(views)}`;
          }
        }
      }
    },
    detail: {
      triggerSelector: SUPJAV_TITLE_TRIGGER,
      customDetailAction: async (titleEl) => {
        await new Promise((r) => setTimeout(r, TIMING.SCRIPT_INJECTION_DELAY));
        const { anchor } = resolveSupjavDetailContext(titleEl);
        const info = MediaUtils.parseVideoId(titleEl.textContent || "", location.href);
        if (!info) return;
        return {
          mode: "toolbar",
          anchorElement: anchor,
          idExtractor: () => info,
          metadataExtractor: () => {
            return {
              title: titleEl.textContent?.trim() || "",
              actress: void 0,
              previewSlug: info.previewSlug ?? void 0
            };
          },
          onMounted: async (id, type, containers, api) => {
            if (type === "fc2") {
              const fetchedActress = await ScraperService.fetchActressFromFD2(id);
              if (fetchedActress && containers.linksContainer) {
                api.addActressButton(containers.linksContainer, fetchedActress);
              }
            }
          }
        };
      }
    }
  };

  const MISSAV_LIST_BLACKLIST = ["search", "new", "actress", "maker", "dm", "genres", "series", "tags", "makers"];
  const MISSAV_TITLE_SELECTORS = [
    "a.text-secondary",
    "a.hover\\:text-primary",
    "div.my-2 a",
    "div.mt-1 a",
    ".video-title a",
    ".thumbnail + div a"
  ].join(",");
  const MISSAV_FALLBACK_LINK_SELECTORS = 'a[href*="/fc2-ppv-"], a[href*="/en/"], a[href*="/ja/"], a[href*="/cn/"]';
  const MISSAV_HOST_TAG_SELECTORS = [
    'a[x-show*="has_chinese_subtitle"]',
    'a[x-show*="has_english_subtitle"]',
    'a[x-show*="is_uncensored_leak"]'
  ].join(",");
  const getMissavLastSegment = (path) => {
    const segments = path.split("/").filter(Boolean);
    return (segments[segments.length - 1] || "").toLowerCase();
  };
  const isMissavDetailPattern = (segment) => /^(fc2-ppv-|[a-z0-9]{2,20}-)\d+/i.test(segment) || /^[a-z0-9]{15,}$/.test(segment);
  const isMissavBlacklistedListPath = (segments) => segments.some((segment) => MISSAV_LIST_BLACKLIST.some((blacklist) => segment.toLowerCase().startsWith(blacklist)));
  const shouldSkipMissavCard = (card) => {
    return Boolean(card.closest('[x-for*="recommend"]')) || Boolean(card.closest('[x-for*="trending"]')) || Boolean(card.querySelector('[x-text*="item."]')) || card.hasAttribute("x-show");
  };
  const resolveMissavTitleLink = (card) => {
    return card.querySelector(MISSAV_TITLE_SELECTORS) || card.querySelector(MISSAV_FALLBACK_LINK_SELECTORS);
  };
  const resolveMissavPreviewSlug = (video, fallbackSlug) => {
    return video?.dataset.src?.match(/fourhoi\.com\/([^/]+)\/preview\.mp4/)?.[1] || video?.src?.match(/fourhoi\.com\/([^/]+)\/preview\.mp4/)?.[1] || fallbackSlug || null;
  };
  const resolveMissavHostTags = (card) => {
    return Array.from(card.querySelectorAll(MISSAV_HOST_TAG_SELECTORS)).map((node) => node.textContent?.trim() || "").filter(Boolean);
  };
  const missav = {
    name: "MissAV",
    hostnames: ["missav.ws", "missav.ai"],
    listOnDetail: true,
    detectContext: () => {
      const path = window.location.pathname;
      const segments = path.split("/").filter(Boolean);
      const lastSegment = getMissavLastSegment(path);
      const isDetailPattern = isMissavDetailPattern(lastSegment);
      if (isDetailPattern && segments.length <= 3) {
        return PageContext.Detail;
      }
      if (isMissavBlacklistedListPath(segments)) return PageContext.List;
      if (segments.length === 1 && !MISSAV_LIST_BLACKLIST.includes(lastSegment)) {
        return PageContext.Detail;
      }
      return path.includes("/search/") ? PageContext.Search : PageContext.List;
    },
    list: {
      containerSelector: 'main, div.grid[class*="grid-cols-"], .sm\\:container > div.grid, div.posts, #main',
      cardSelector: 'div.grid[class*="grid-cols-"] > div.thumbnail.group:not(.card-rebuilt), div.grid[class*="grid-cols-"] > a.thumbnail.group:not(.card-rebuilt), div.thumbnail.group:not(.card-rebuilt), a.thumbnail.group:not(.card-rebuilt), div.thumbnail:not(.card-rebuilt), a.thumbnail:not(.card-rebuilt)',
      shouldProcessCard: (card) => {
        if (shouldSkipMissavCard(card)) {
          return false;
        }
        const anyLink = resolveMissavTitleLink(card);
        const href = anyLink?.getAttribute("href");
        return Boolean(anyLink?.href && href && href !== "#");
      },
      identityKey: (card) => {
        const anyLink = resolveMissavTitleLink(card);
        const normalized = normalizeListArticleUrl(anyLink?.href?.split("#")[0] || anyLink?.href);
        return normalized ? normalized.toLowerCase() : null;
      },
      extractor: (card) => {
        if (shouldSkipMissavCard(card)) {
          return null;
        }
        const img = card.querySelector("img");
        const video = card.querySelector("video");
        const anyLink = resolveMissavTitleLink(card);
        if (!anyLink || !anyLink.getAttribute("href") || anyLink.getAttribute("href") === "#") return null;
        const info = MediaUtils.parseVideoId(anyLink.textContent || "", anyLink.href || "");
        if (!info) return null;
        if (info.id.length < 5 && info.type === "fc2") return null;
        const imageUrl = getBestImageSource(img);
        const imageFields = withListImageFallbacks({
          primaryImageUrl: imageUrl,
          imageUrl,
          fallbackImageUrl: imageUrl
        });
        const previewSlug = resolveListPreviewSlug(
          info.type,
          info.id,
          resolveMissavPreviewSlug(video, info.previewSlug)
        );
        const tags = normalizeListTags(resolveMissavHostTags(card));
        const actress = normalizeListOptionalText(
          card.querySelector('a[href*="/actress/"]')?.textContent || card.querySelector('a[href*="/actresses/"]')?.textContent
        );
        const articleUrl = normalizeListArticleUrl(anyLink.href.split("#")[0] || anyLink.href);
        return {
          ...info,
          title: normalizeListOptionalText(anyLink.textContent || img?.alt) || info.id,
          ...imageFields,
          articleUrl,
          previewSlug,
          tags,
          actress
        };
      },
      postProcess: (card) => {
        card.removeAttribute("x-data");
        card.addEventListener("mouseenter", (e) => e.stopPropagation(), true);
      }
    },
    detail: {
      triggerSelector: 'div[x-data*="player"], div.player-container, h1.text-base, div.mt-4',
      customDetailAction: async (el) => {
        const title = document.querySelector("h1.text-base")?.textContent || document.title;
        const info = MediaUtils.parseVideoId(title, location.href);
        if (!info) return;
        const titleEl = document.querySelector("h1.text-base");
        const anchor = titleEl?.closest("div.mt-4") || titleEl || el;
        return {
          mode: "toolbar",
          anchorElement: anchor,
          idExtractor: () => info,
          metadataExtractor: (_id, type) => {
            let actress = null;
            if (type === "jav") {
              const contentArea = document.querySelector("div.mt-4, div.text-secondary, main");
              const actresses = Array.from(
                (contentArea || document).querySelectorAll('a[href*="/actresses/"]')
              ).map((a) => MediaUtils.cleanActressName(a.textContent));
              actress = actresses.find((a) => !!a) || null;
            }
            return {
              title,
              actress: actress ?? void 0,
              previewSlug: info.previewSlug ?? void 0
            };
          },
          onMounted: async (id, type, containers, api) => {
            if (type === "fc2") {
              const fetchedActress = await ScraperService.fetchActressFromFD2(id);
              if (fetchedActress && containers.linksContainer) {
                api.addActressButton(containers.linksContainer, fetchedActress);
              }
            }
          }
        };
      }
    }
  };

  const touchHistoryCacheEntry = (cache, key, value, maxSize) => {
    if (cache.has(key)) {
      cache.delete(key);
    }
    cache.set(key, value);
    if (cache.size > maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey) {
        cache.delete(firstKey);
      }
    }
  };
  const hydrateHistoryCache = (cache, items, normalizeId) => {
    cache.clear();
    for (let index = items.length - 1; index >= 0; index--) {
      const item = items[index];
      if (item && !item.is_deleted) {
        cache.set(normalizeId(item.id), item.status || "watched");
      }
    }
  };
  const hasHistoryEntry = (enabled, cache, id, status) => {
    if (!enabled) {
      return false;
    }
    if (status) {
      return cache.get(id) === status;
    }
    return cache.has(id);
  };

  const log$r = Logger.scope("History");
  class HistoryServiceImplementation {
    CACHE_SIZE = 5e3;
    historyCache = new Map();
    detachMessageListener = null;
    loadReadyPromise = Promise.resolve();
    getHistorySnapshot() {
      return this.historyCache;
    }
    onBootstrap() {
      this.onCleanup();
      log$r.debug("Warming up cache");
      this.loadReadyPromise = this.load().catch((error) => log$r.error("Failed to load history cache", error));
      this.detachMessageListener = MessagingService.onMessage((message) => {
        if (message.type !== MessageType.HISTORY_UPDATE) {
          return;
        }
        const { action, id, status } = message.payload;
        if (action === "add" && status) {
          this.add(id, status, true);
          return;
        }
        if (action === "remove") {
          this.remove(id, true);
          return;
        }
        if (action === "add-batch" && message.payload.ids && status) {
          this.addBatch(message.payload.ids, status, true);
          return;
        }
        if (action === "remove-batch" && message.payload.ids) {
          this.removeBatch(message.payload.ids, true);
          return;
        }
        if (action === "clear") {
          this.clear(true);
        }
      });
    }
    onCleanup() {
      this.detachMessageListener?.();
      this.detachMessageListener = null;
    }
    getCache() {
      return new Map(this.historyCache);
    }
    async waitUntilReady() {
      await this.loadReadyPromise;
    }
    async load() {
      Logger.time("HistoryService.load");
      if (!State.proxy.enableHistory) {
        this.historyCache.clear();
        return;
      }
      try {
        let items = [];
        try {
          items = await Repository.history.table.orderBy("timestamp").reverse().limit(this.CACHE_SIZE).toArray();
        } catch (indexError) {
          log$r.warn("Index scan failed, falling back to full scan", indexError);
          items = await Repository.history.table.toArray();
          items.sort((left, right) => right.timestamp - left.timestamp);
          if (items.length > this.CACHE_SIZE) {
            items = items.slice(0, this.CACHE_SIZE);
          }
        }
        items = items.filter((item) => !item.is_deleted);
        hydrateHistoryCache(this.historyCache, items, (id) => this.getNormalizedId(id));
        CoreEvents.emit(AppEvents.HISTORY_LOADED, items.length);
        log$r.info(`Loaded ${items.length} recent items`);
      } catch (error) {
        log$r.error("Failed to load history", error);
        this.historyCache.clear();
      }
      Logger.timeEnd("HistoryService.load");
    }
    async add(id, status = "watched", remote = false) {
      if (!State.proxy.enableHistory || !id) {
        return;
      }
      const normalizedId = this.getNormalizedId(String(id));
      if (this.historyCache.get(normalizedId) === status) {
        this.touch(normalizedId, status);
        if (!remote) {
          return;
        }
      }
      this.touch(normalizedId, status);
      if (!remote) {
        try {
          await Repository.history.add(normalizedId, status);
        } catch (error) {
          log$r.error(`Failed to persist history add for ${normalizedId}`, error);
          this.historyCache.delete(normalizedId);
          return;
        }
        MessagingService.broadcast(MessageType.HISTORY_UPDATE, { action: "add", id: normalizedId, status });
      }
      CoreEvents.emit(AppEvents.HISTORY_ADDED, { id: normalizedId, status });
      log$r.debug(`${remote ? "Remote" : "Local"} added: ${normalizedId} as ${status}`);
      if (!remote) {
        CoreEvents.emit(AppEvents.HISTORY_CHANGED, {});
      }
    }
    async remove(id, remote = false) {
      if (!State.proxy.enableHistory || !id) {
        return;
      }
      const normalizedId = this.getNormalizedId(String(id));
      const previousStatus = this.historyCache.get(normalizedId);
      this.historyCache.delete(normalizedId);
      if (!remote) {
        try {
          await Repository.history.remove(normalizedId);
        } catch (error) {
          log$r.error(`Failed to persist history remove for ${normalizedId}`, error);
          if (previousStatus) {
            this.touch(normalizedId, previousStatus);
          }
          return;
        }
        MessagingService.broadcast(MessageType.HISTORY_UPDATE, { action: "remove", id: normalizedId });
      }
      CoreEvents.emit(AppEvents.HISTORY_REMOVED, { id: normalizedId, prevStatus: previousStatus });
      log$r.debug(`${remote ? "Remote" : "Local"} removed: ${normalizedId}`);
      if (!remote) {
        CoreEvents.emit(AppEvents.HISTORY_CHANGED, {});
      }
    }
    async addBatch(ids, status = "watched", remote = false) {
      if (!State.proxy.enableHistory || ids.length === 0) return;
      const normalizedIds = ids.map((id) => this.getNormalizedId(id));
      normalizedIds.forEach((id) => this.touch(id, status));
      if (!remote) {
        try {
          await Repository.history.bulkAdd(normalizedIds, status);
          MessagingService.broadcast(MessageType.HISTORY_UPDATE, {
            action: "add-batch",
            ids: normalizedIds,
            status
          });
        } catch (error) {
          log$r.error(`Failed to persist history bulk add`, error);
          return;
        }
      }
      normalizedIds.forEach((id) => {
        CoreEvents.emit(AppEvents.HISTORY_ADDED, { id, status });
      });
      if (!remote) {
        CoreEvents.emit(AppEvents.HISTORY_CHANGED, {});
      }
    }
    async removeBatch(ids, remote = false) {
      if (!State.proxy.enableHistory || ids.length === 0) return;
      const normalizedIds = ids.map((id) => this.getNormalizedId(id));
      const prevStates = new Map();
      normalizedIds.forEach((id) => {
        prevStates.set(id, this.historyCache.get(id));
        this.historyCache.delete(id);
      });
      if (!remote) {
        try {
          await Repository.history.bulkRemove(normalizedIds);
          MessagingService.broadcast(MessageType.HISTORY_UPDATE, { action: "remove-batch", ids: normalizedIds });
        } catch (error) {
          log$r.error(`Failed to persist history bulk remove`, error);
          prevStates.forEach((status, id) => {
            if (status) this.touch(id, status);
          });
          return;
        }
      }
      normalizedIds.forEach((id) => {
        CoreEvents.emit(AppEvents.HISTORY_REMOVED, { id, prevStatus: prevStates.get(id) });
      });
      if (!remote) {
        CoreEvents.emit(AppEvents.HISTORY_CHANGED, {});
      }
    }
    async clear(remote = false) {
      const count = this.historyCache.size;
      const backup = new Map(this.historyCache);
      this.historyCache.clear();
      if (!remote) {
        try {
          await Repository.history.clear();
        } catch (error) {
          log$r.error("Failed to persist history clear", error);
          backup.forEach((value, key) => this.historyCache.set(key, value));
          return;
        }
        MessagingService.broadcast(MessageType.HISTORY_UPDATE, { action: "clear" });
      }
      CoreEvents.emit(AppEvents.HISTORY_CLEARED, count);
      log$r.warn(`${remote ? "Remote" : "Local"} cleared ${count} items`);
      if (!remote) {
        CoreEvents.emit(AppEvents.HISTORY_CHANGED, {});
      }
    }
    has(id, status) {
      return hasHistoryEntry(State.proxy.enableHistory, this.historyCache, this.getNormalizedId(String(id)), status);
    }
    getStatus(id) {
      return this.historyCache.get(this.getNormalizedId(String(id))) || null;
    }
    touch(key, value) {
      touchHistoryCacheEntry(this.historyCache, key, value, this.CACHE_SIZE);
    }
    getNormalizedId(id) {
      return IdNormalizer.normalize(id);
    }
  }
  const HistoryService = AppContainer.register("history-service", new HistoryServiceImplementation());

  const getJavdbMagnetLinks = () => {
    return Array.from(document.querySelectorAll('#magnets-content a[href^="magnet:?"]'));
  };
  const bindJavdbNativeHistoryButton = (selector, id) => {
    const btn = document.querySelector(selector);
    if (btn && !btn.hasAttribute("data-hooked")) {
      btn.setAttribute("data-hooked", "true");
      btn.addEventListener("click", () => {
        HistoryService.add(id);
      });
    }
  };
  const backfillJavdbActressForFc2 = async (id, actress, finalElement, api) => {
    if (actress) {
      return;
    }
    const fetchedActress = await ScraperService.fetchActressFromFD2(id);
    if (!fetchedActress) {
      return;
    }
    api.addActressButton(finalElement, fetchedActress);
  };
  const attachJavdbNativeMagnets = async (id, type, magnetContainer, linksContainer, api) => {
    const magnetLinks = getJavdbMagnetLinks();
    const firstLink = magnetLinks[0];
    if (magnetLinks.length > 0 && firstLink) {
      Repository.cache.set(id, firstLink.href);
      api.addMagnetButton(magnetContainer, firstLink.href);
      magnetLinks.slice(1, 3).forEach((link) => {
        api.addMagnetButton(linksContainer, link.href);
      });
      return;
    }
    await api.attachFetchedMagnet?.(id, type, magnetContainer);
  };
  const javdb = {
    name: "JavDB",
    hostnames: ["javdb.com"],
    listOnDetail: true,
    detectContext: () => {
      const path = location.pathname;
      if (path.includes("/search/") || location.search.includes("q=")) return PageContext.Search;
      if (path.startsWith("/v/")) return PageContext.Detail;
      return PageContext.List;
    },
    list: {
      containerSelector: ".movie-list, .tile-images:not(.preview-images)",
      cardSelector: ".item:not(.card-rebuilt), .tile-item:not(.card-rebuilt)",
      identityKey: (card) => {
        const link = card.matches('a.box, a.tile-item, a[href^="/v/"]') ? card : card.querySelector('a.box, a.tile-item, a[href^="/v/"]');
        const normalized = normalizeListArticleUrl(link?.href);
        return normalized ? normalized.toLowerCase() : null;
      },
      extractor: (card) => {
        const link = card.matches('a.box, a.tile-item, a[href^="/v/"]') ? card : card.querySelector('a.box, a.tile-item, a[href^="/v/"]');
        if (!link) return null;
        const idStrong = card.querySelector(".video-title strong, .video-number");
        const idText = idStrong ? idStrong.textContent : link.title || link.innerText;
        const titleEl = card.querySelector(".video-title");
        let titleText;
        if (titleEl) {
          const clone = titleEl.cloneNode(true);
          clone.querySelector("strong")?.remove();
          titleText = clone.textContent?.trim() || "";
        } else {
          titleText = link.title || link.innerText;
        }
        const img = card.querySelector("img");
        const info = MediaUtils.parseVideoId(idText || "", link.href);
        const imageFields = withListImageFallbacks({ imageUrl: getBestImageSource(img) });
        const tagsContainer = card.querySelector(".tags");
        const tags = tagsContainer ? Array.from(tagsContainer.querySelectorAll(".tag")).map((t) => t.textContent?.trim()).filter(Boolean) : void 0;
        return info ? {
          ...info,
          title: normalizeListOptionalText(titleText) || info.id,
          ...imageFields,
          articleUrl: normalizeListArticleUrl(link.href),
          previewSlug: resolveListPreviewSlug(info.type, info.id, info.previewSlug),
          tags
        } : null;
      },
      postProcess: (card, _el, newCard, _data, classes) => {
        const score = card.querySelector(".score");
        const meta = card.querySelector(".meta");
        const tags = card.querySelector(".tags");
        const infoArea = newCard.querySelector(`.${classes.infoArea}`);
        if (infoArea) {
          const actionRow = infoArea.querySelector(`.${classes.cardActionRow}`);
          if (score) infoArea.insertBefore(score.cloneNode(true), actionRow);
          if (meta) infoArea.insertBefore(meta.cloneNode(true), actionRow);
          if (tags) infoArea.insertBefore(tags.cloneNode(true), actionRow);
        }
      }
    },
    detail: {
      mainImageSelector: ".column-video-cover",
      customDetailAction: (cont) => {
        return {
          mode: "card",
          anchorElement: cont,
          idExtractor: () => {
            const titleEl = document.querySelector("h2.title");
            return MediaUtils.parseVideoId(titleEl?.textContent || "", location.href);
          },
          metadataExtractor: (id, type) => {
            const titleEl = document.querySelector("h2.title");
            const img = cont.querySelector("img.video-cover");
            return {
              id,
              type,
              title: titleEl?.textContent?.trim() || "",
              primaryImageUrl: img?.src || "",
              articleUrl: location.href
            };
          },
          skipDefaultServices: true,
          onMounted: async (id, type, containers, api) => {
            const actress = MediaUtils.cleanActressName(cont.querySelector(".meta")?.textContent);
            api.addPreviewButton(containers.previewContainer, id);
            await attachJavdbNativeMagnets(
              id,
              type,
              containers.magnetContainer,
              containers.linksContainer,
              api
            );
            if (type === "fc2") {
              await backfillJavdbActressForFc2(id, actress, containers.mainElement, api);
            }
            bindJavdbNativeHistoryButton('form.button_to[action*="/reviews/watched"] button', id);
            bindJavdbNativeHistoryButton("button.js-watched-video", id);
          },
          mountOptions: { maxWidth: "100%", width: "" }
        };
      }
    }
  };

  const sukebei = {
    name: "Sukebei",
    hostnames: ["sukebei.nyaa.si"],
    detectContext: () => {
      return PageContext.List;
    },
    list: {
      containerSelector: "table.torrent-list tbody",
      cardSelector: "tr",
      extractor: () => null
    },
    detail: {
      customDetailAction: async () => {
      }
    }
  };

  const ocili = {
    name: "0cili",
    hostnames: ["0cili.org", "0cili.cc"],
    detectContext: () => {
      return PageContext.List;
    },
    list: {
      containerSelector: "table.torrent-list tbody",
      cardSelector: "tr",
      extractor: () => null
    },
    detail: {
      customDetailAction: async () => {
      }
    }
  };

  const JAVFC2_PRESERVED_BADGES = ".video_quality span";
  const javfc2 = {
    name: "JavFC2",
    hostnames: ["javfc2.xyz"],
    listOnDetail: true,
    detectContext: () => {
      const path = window.location.pathname;
      if (path.includes("/watch/")) {
        return PageContext.Detail;
      }
      return PageContext.List;
    },
    list: {
      containerSelector: [
        "#movie-details .row",
        ".movie-container",
        ".owl-stage",
        ".movie-list-container .row",
        ".similler-movie .row",
        ".similar-movie .row",
        "#main-content .row",
        ".main-content .row",
        "#hot .row",
        "#section-opt .row",
        "#latest-all .row",
        "#latest-all-all .row",
        'div[id^="section-"] .row',
        'div[id^="latest-"] .row',
        ".col-md-9 .row",
        ".col-md-12 .row"
      ].join(", "),
      cardSelector: [".latest-movie-img-container", ".movie-img", ".item"].join(", "),
      identityKey: (card) => {
        const link = card.querySelector("a");
        return link?.getAttribute("href") || null;
      },
      extractor: (card) => {
        const titleLink = card.querySelector('.movie-title a, h3 a, a[href*="/watch/"]');
        const img = card.querySelector("img");
        const altText = img?.getAttribute("alt");
        const linkText = titleLink?.textContent;
        const rawTitleText = altText && altText.length > (linkText?.length || 0) ? altText : linkText || altText;
        const href = titleLink?.getAttribute("href") || card.querySelector("a")?.getAttribute("href") || "";
        const videoInfo = MediaUtils.parseVideoId(rawTitleText || "", href);
        if (!videoInfo) return null;
        const { id, type } = videoInfo;
        const imageUrl = getBestImageSource(img);
        const title = normalizeListOptionalText(rawTitleText) || `${type.toUpperCase()}-${id}`;
        return {
          id,
          type,
          site: "JavFC2",
          title,
          ...withListImageFallbacks({ primaryImageUrl: imageUrl, imageUrl, fallbackImageUrl: imageUrl }),
          articleUrl: href,
          previewSlug: resolveListPreviewSlug(type, id)
        };
      },
      getExtraUi: (card) => {
        const preservedIconsHTML = preserveHostBadges(card, JAVFC2_PRESERVED_BADGES);
        return { preservedIconsHTML };
      }
    },
    detail: {
      mainImageSelector: '#info img, meta[property="og:image"]',
      triggerSelector: "#player-div",
      customDetailAction: (playerDiv) => {
        const titleText = document.querySelector(".ml-title span.title")?.textContent || document.querySelector("h1")?.textContent || document.title;
        const videoInfo = MediaUtils.parseVideoId(titleText, location.href);
        if (!videoInfo) return;
        return {
          mode: "toolbar",
          anchorElement: playerDiv,
          idExtractor: () => videoInfo,
          metadataExtractor: () => {
            const actressRaw = document.querySelector('.col-md-9 a[href*="/star/"]')?.textContent;
            const actress = MediaUtils.cleanActressName(actressRaw);
            return {
              title: titleText.trim(),
              actress: actress ?? void 0,
              previewSlug: videoInfo.previewSlug ?? void 0
            };
          },
          onMounted: async (id, type, containers, api) => {
            const actressRaw = document.querySelector('.col-md-9 a[href*="/star/"]')?.textContent;
            const actress = MediaUtils.cleanActressName(actressRaw);
            if (actress) Repository.cache.set(`actress_${id}`, actress);
            const videoJs = playerDiv.querySelector(".video-js, #play");
            if (videoJs) {
              videoJs.after(containers.mainElement);
            } else {
              playerDiv.after(containers.mainElement);
            }
            if (type === "fc2") {
              const fetchedActress = await ScraperService.fetchActressFromFD2(id);
              if (fetchedActress && containers.linksContainer) {
                api.addActressButton(containers.linksContainer, fetchedActress);
              }
            }
          }
        };
      }
    }
  };

  const SiteRegistry = {
    fc2ppvdb,
    fc2db,
    fd2ppv,
    supjav,
    missav,
    javdb,
    sukebei,
    ocili,
    javfc2
  };

  const SiteConfigs = SiteRegistry;

  const log$q = Logger.scope("ViewStore");
  class ViewStoreImpl {
    states = new Map();
    maxStateEntries;
    constructor(maxStateEntries = 2e3) {
      this.maxStateEntries = maxStateEntries;
      CoreEvents.on(AppEvents.SITE_RESET, () => this.clear());
    }
    getDefaults() {
      return {
        isSearching: false,
        hasMagnet: false,
        hasPreviews: false
      };
    }
get(id) {
      const normalizedId = IdNormalizer.normalize(id);
      const existing = this.states.get(normalizedId);
      if (existing) {
        this.states.delete(normalizedId);
        this.states.set(normalizedId, existing);
        return existing;
      }
      const initialState = this.getDefaults();
      this.states.set(normalizedId, initialState);
      this.enforceLimit();
      return initialState;
    }
set(id, key, value) {
      const normalizedId = IdNormalizer.normalize(id);
      const current = this.get(normalizedId);
      if (current[key] === value) return;
      current[key] = value;
      log$q.trace(`[${normalizedId}] ${String(key)} = ${value}`);
      CoreEvents.emit(AppEvents.VIEW_STATE_CHANGED, { id: normalizedId, key: String(key), value });
    }
update(id, updates) {
      Object.entries(updates).forEach(([key, value]) => {
        this.set(id, key, value);
      });
    }
    release(id) {
      if (this.states.has(id)) {
        this.states.delete(id);
        log$q.trace(`State released for ${id}`);
      }
    }
    clear() {
      this.states.clear();
      log$q.debug("All view states cleared");
    }
    enforceLimit() {
      if (this.states.size <= this.maxStateEntries) {
        return;
      }
      const overflow = this.states.size - this.maxStateEntries;
      const keys = this.states.keys();
      for (let i = 0; i < overflow; i += 1) {
        const oldestKey = keys.next().value;
        if (!oldestKey) {
          break;
        }
        this.states.delete(oldestKey);
      }
    }
  }
  const ViewStore = new ViewStoreImpl();

  class FilterManager {
    static REFRESH_DELAY_MS = 250;
    pendingTimer = null;
    lastCounts = null;
    static isSearchPage() {
      const p = location.pathname;
      const s = location.search;
      return p.includes("/search") || s.includes("s=") || s.includes("search") || s.includes("q=") || s.includes("keyword=");
    }
    requestRefresh() {
      if (this.pendingTimer !== null) return;
      this.pendingTimer = setTimeout(() => {
        this.pendingTimer = null;
        this.refreshNow();
      }, FilterManager.REFRESH_DELAY_MS);
    }
    requestCardRefresh(id, hasMagnet) {
      const target = this.findCardById(id);
      if (target) {
        this.applyCardVisibility(target, hasMagnet);
      }
      this.requestRefresh();
    }
    refreshNow() {
      const C = Config.CLASSES;
      const counts = {
        hideViewed: 0,
        hideNoMagnet: 0,
        hideCensored: 0
      };
      document.querySelectorAll(`.${C.cardRebuilt}`).forEach((card) => {
        const el = card;
        if (el.classList.contains(C.hideViewed)) counts.hideViewed += 1;
        if (el.classList.contains(C.hideNoMagnet)) counts.hideNoMagnet += 1;
        if (el.classList.contains(C.hideCensored)) counts.hideCensored += 1;
      });
      if (!this.hasChanged(counts)) return;
      this.syncToBody(counts);
      this.lastCounts = counts;
      CoreEvents.emit(AppEvents.FILTER_COUNTS_CHANGED, counts);
    }
    findCardById(id) {
      const escapedId = FilterManager.escapeAttributeValue(id);
      const C = Config.CLASSES;
      return document.querySelector(
        `.${C.cardRebuilt}[data-id="${escapedId}"], .${C.processedCard}[data-id="${escapedId}"]`
      );
    }
    static escapeAttributeValue(value) {
      return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    }
    hasChanged(next) {
      if (!this.lastCounts) return true;
      return this.lastCounts.hideViewed !== next.hideViewed || this.lastCounts.hideNoMagnet !== next.hideNoMagnet || this.lastCounts.hideCensored !== next.hideCensored;
    }
    syncToBody(counts) {
      const d = document.body.dataset;
      const v = String(counts.hideViewed);
      const n = String(counts.hideNoMagnet);
      const c = String(counts.hideCensored);
      if (d.fc2HideViewedCount !== v) d.fc2HideViewedCount = v;
      if (d.fc2HideNoMagnetCount !== n) d.fc2HideNoMagnetCount = n;
      if (d.fc2HideCensoredCount !== c) d.fc2HideCensoredCount = c;
    }
static resolveCardRoot(el) {
      return el.classList.contains(Config.CLASSES.cardRebuilt) ? el : el.closest(`.${Config.CLASSES.cardRebuilt}`) || el;
    }
    static shouldSkipFilters(target) {
      if (this.isSearchPage()) return true;
      const processed = target.classList.contains(Config.CLASSES.processedCard) ? target : target.querySelector(`.${Config.CLASSES.processedCard}`);
      if (processed?.classList.contains("is-detail")) return true;
      return false;
    }
    applyCardVisibility(c, hasM) {
      if (!c) return;
      const target = FilterManager.resolveCardRoot(c);
      if (FilterManager.shouldSkipFilters(target)) {
        target.classList.remove(Config.CLASSES.hideNoMagnet);
        return;
      }
      const processed = target.classList.contains(Config.CLASSES.processedCard) ? target : target.querySelector(`.${Config.CLASSES.processedCard}`);
      const isSearching = processed?.dataset?.enhSearching === "true";
      const shouldHide = State.proxy.hideNoMagnet && !hasM && !isSearching;
      target.classList.toggle(Config.CLASSES.hideNoMagnet, shouldHide);
    }
    applyCensoredFilter(c) {
      if (!c) return;
      const target = FilterManager.resolveCardRoot(c);
      if (FilterManager.shouldSkipFilters(target)) {
        target.classList.remove(Config.CLASSES.hideCensored);
        return;
      }
      const isCensored = target.classList.contains(Config.CLASSES.isCensored) || !!target.querySelector(`.${Config.CLASSES.isCensored}`);
      const isSupjav = location.hostname.includes("supjav");
      target.classList.toggle(Config.CLASSES.hideCensored, isSupjav && State.proxy.hideCensored && isCensored);
    }
    applyHistoryVisibility(c) {
      if (!c) return;
      const target = FilterManager.resolveCardRoot(c);
      if (FilterManager.shouldSkipFilters(target)) {
        target.classList.remove(Config.CLASSES.hideViewed);
        return;
      }
      const isViewed = HistoryService.has(target.dataset.id || "");
      target.classList.toggle(Config.CLASSES.hideViewed, State.proxy.hideViewed && isViewed);
    }
  }
  const GlobalFilterManager = new FilterManager();

  class SourceKeyManager {
    inFlight = new Set();
    history = new Map();
    windowMs;
    limit;
    constructor(windowMs = 6e4, limit = 3e3) {
      this.windowMs = windowMs;
      this.limit = limit;
    }
    isProcessing(key) {
      return this.inFlight.has(key);
    }
    isRecentlyProcessed(key) {
      const now = Date.now();
      this.prune(now);
      const timestamp = this.history.get(key);
      return typeof timestamp === "number" && now - timestamp < this.windowMs;
    }
    markInFlight(key) {
      this.inFlight.add(key);
    }
    markProcessed(key) {
      const now = Date.now();
      this.history.delete(key);
      this.history.set(key, now);
      this.inFlight.delete(key);
      this.prune(now);
    }
    release(key, markProcessed = false) {
      this.inFlight.delete(key);
      if (markProcessed) {
        this.markProcessed(key);
      }
    }
    clear() {
      this.inFlight.clear();
      this.history.clear();
    }
    prune(now) {
      const expireBefore = now - this.windowMs;
      for (const [key, timestamp] of this.history.entries()) {
        if (timestamp < expireBefore) {
          this.history.delete(key);
        }
      }
      if (this.history.size <= this.limit) {
        return;
      }
      const overflow = this.history.size - this.limit;
      const keys = this.history.keys();
      for (let i = 0; i < overflow; i += 1) {
        const oldest = keys.next().value;
        if (!oldest) break;
        this.history.delete(oldest);
      }
    }
  }

  class SiteHostGuard {
    processedHosts = new WeakSet();
    hostProcessedAttr;
    constructor(hostProcessedAttr) {
      this.hostProcessedAttr = hostProcessedAttr;
    }
    isAlreadyProcessed(host) {
      if (this.processedHosts.has(host)) return true;
      if (host.getAttribute("data-enh-processed") === "true") {
        this.markProcessed(host);
        return true;
      }
      if (host.hasAttribute(this.hostProcessedAttr) || host.classList.contains(Config.CLASSES.cardRebuilt)) {
        this.markProcessed(host);
        return true;
      }
      const processedDescendants = host.querySelectorAll(`.${Config.CLASSES.processedCard}`);
      if (processedDescendants.length > 0) {
        if (processedDescendants.length > 1) {
          for (let i = 1; i < processedDescendants.length; i++) {
            processedDescendants[i]?.remove();
          }
        }
        host.classList.add(Config.CLASSES.cardRebuilt);
        this.markProcessed(host);
        return true;
      }
      return false;
    }
    isNestedInsideProcessed(node) {
      return Boolean(
        node.parentElement?.closest(
          `[${this.hostProcessedAttr}="1"], [data-enh-rebuilding="true"], .${Config.CLASSES.cardRebuilt}`
        )
      );
    }
    markProcessed(host) {
      this.processedHosts.add(host);
      host.setAttribute(this.hostProcessedAttr, "1");
    }
    isKnownHost(host) {
      return this.processedHosts.has(host);
    }
    clear() {
      this.processedHosts = new WeakSet();
    }
  }

  const log$p = Logger.scope("DomObserver");
  class DomObserverService {
    observer = null;
    handlers = new Set();
    isInitialized = false;
    constructor() {
      if (typeof document !== "undefined") {
        if (document.body) {
          this.init();
        } else {
          document.addEventListener("DOMContentLoaded", () => this.init(), { once: true });
        }
      }
    }
    init() {
      if (this.isInitialized || typeof MutationObserver === "undefined" || !document.body) return;
      try {
        this.observer = new MutationObserver((mutations) => this.handleMutations(mutations));
        this.observer.observe(document.body, { childList: true, subtree: true });
        this.isInitialized = true;
        log$p.debug("Global DomObserver initialized on document.body");
      } catch (e) {
        log$p.error("Failed to initialize MutationObserver", e);
      }
    }
    handleMutations(mutations) {
      const added = [];
      const removed = [];
      for (const m of mutations) {
        if (m.addedNodes.length > 0) {
          m.addedNodes.forEach((node) => {
            if (typeof HTMLElement !== "undefined" && node instanceof HTMLElement) added.push(node);
          });
        }
        if (m.removedNodes.length > 0) {
          m.removedNodes.forEach((node) => {
            if (typeof HTMLElement !== "undefined" && node instanceof HTMLElement) removed.push(node);
          });
        }
      }
      if (added.length > 0 || removed.length > 0) {
        this.handlers.forEach((handler) => {
          try {
            handler(added, removed);
          } catch (e) {
            log$p.error("DomMutationHandler failed", e);
          }
        });
      }
    }
subscribe(handler) {
      this.handlers.add(handler);
      if (!this.isInitialized) {
        this.init();
      }
      return () => {
        this.handlers.delete(handler);
      };
    }
    disconnect() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
        this.isInitialized = false;
      }
      this.handlers.clear();
    }
  }
  const DomObserver = new DomObserverService();

  class SiteListObserver {
    observers = [];
    cardSelector;
    containerSelector;
    process;
    unsubs = [];
    constructor(cardSelector, containerSelector, process) {
      this.cardSelector = cardSelector;
      this.containerSelector = containerSelector;
      this.process = process;
    }
    init(mutationObserverTarget, observeMutations = true) {
      const obs = this.setupListMutationObserver();
      if (mutationObserverTarget === "container" && !!this.containerSelector) {
        this.setupContainerObserver();
      } else if (observeMutations !== false) {
        this.unsubs.push(
          DomObserver.subscribe((added, _removed) => {
            this.handleAddedNodes(added);
          })
        );
      }
      this.observers.push(obs);
      return this.observers;
    }
    setupListMutationObserver() {
      return new MutationObserver((muts) => {
        const added = [];
        for (const m of muts) {
          m.addedNodes.forEach((n) => {
            if (n.nodeType === 1) added.push(n);
          });
        }
        if (added.length > 0) {
          this.handleAddedNodes(added);
        }
      });
    }
    handleAddedNodes(nodes) {
      const added = new Set();
      for (const el of nodes) {
        if (!this.isInListScope(el)) continue;
        if (el.matches(this.cardSelector)) {
          added.add(el);
        } else {
          el.querySelectorAll(this.cardSelector).forEach((child) => added.add(child));
          const closestCard = el.closest(this.cardSelector);
          if (closestCard) {
            added.add(closestCard);
          }
        }
      }
      if (added.size > 0) {
        this.process(Array.from(added));
      }
    }
    isInListScope(el) {
      if (!this.containerSelector) return true;
      return el.matches(this.containerSelector) || el.closest(this.containerSelector) !== null || el.querySelector(this.containerSelector) !== null;
    }
    setupContainerObserver() {
      if (!this.containerSelector) return;
      const selector = this.containerSelector;
      const observedContainers = new WeakSet();
      const listObs = this.setupListMutationObserver();
      const observe = (container) => {
        if (observedContainers.has(container)) return;
        observedContainers.add(container);
        listObs.observe(container, { childList: true, subtree: true });
      };
      const scan = (el) => {
        const found = [];
        if (el.matches(selector)) found.push(el);
        el.querySelectorAll(selector).forEach((c) => found.push(c));
        return found;
      };
      document.querySelectorAll(selector).forEach((c) => observe(c));
      this.unsubs.push(
        DomObserver.subscribe((added, _removed) => {
          const newContainers = new Set();
          for (const el of added) {
            if (el.classList.contains(Config.CLASSES.processedCard) || el.closest(`.${Config.CLASSES.processedCard}`))
              continue;
            scan(el).forEach((c) => newContainers.add(c));
          }
          if (newContainers.size === 0) return;
          newContainers.forEach((c) => observe(c));
          const candidates = new Set();
          newContainers.forEach((c) => {
            if (c.matches(this.cardSelector)) candidates.add(c);
            c.querySelectorAll(this.cardSelector).forEach((card) => candidates.add(card));
          });
          if (candidates.size > 0) this.process(Array.from(candidates));
        })
      );
      this.observers.push(listObs);
    }
    disconnect() {
      this.observers.forEach((o) => o.disconnect());
      this.observers = [];
      this.unsubs.forEach((fn) => fn());
      this.unsubs = [];
    }
  }

  const log$o = Logger.scope("Site");
  class BaseSite {
    config;
    observers = [];
    listObserver = null;
    activeContext = PageContext.Unknown;
    _unsubs = [];
    hostProcessedAttr = "data-enh-card-host";
    sourceKeyAttr = "data-enh-source-key";
    sourceKeyManager = new SourceKeyManager();
    hostGuard = new SiteHostGuard(this.hostProcessedAttr);
    constructor(config) {
      this.config = config;
    }
    clearSubscriptions() {
      this._unsubs.forEach((fn) => fn());
      this._unsubs = [];
    }
    async init() {
      try {
        log$o.debug(`Initializing ${this.config.name}`);
        this.clearSubscriptions();
        if (this.config.onBeforeInit) await this.config.onBeforeInit();
        this.activeContext = this.detectContext();
        if (this.config.list && ([PageContext.List, PageContext.Search].includes(this.activeContext) || this.activeContext === PageContext.Detail && this.config.listOnDetail)) {
          await this.initListMode();
        }
        if (this.config.detail && this.activeContext === PageContext.Detail) {
          this.initDetailMode();
        }
        if (this.config.customInit) this.config.customInit();
        if (this.config.onInit) await this.config.onInit();
        if (this.config.onAfterInit) await this.config.onAfterInit();
        this._unsubs.push(
          State.on(({ prop }) => {
            if (["hideNoMagnet", "enableMagnets", "hideCensored", "hideViewed"].includes(prop)) {
              this.refreshVisibility();
            }
          })
        );
        this._unsubs.push(
          CoreEvents.on(AppEvents.HISTORY_LOADED, () => {
            this.refreshHistoryState();
            this.refreshVisibility();
          })
        );
        this.refreshHistoryState();
      } catch (error) {
        log$o.error(`Init failed for ${this.config.name}`, error);
      }
    }
    refreshVisibility() {
      const cards = document.querySelectorAll(`.${Config.CLASSES.cardRebuilt}`);
      cards.forEach((card) => {
        const processedCard = card.querySelector(`.${Config.CLASSES.processedCard}`);
        if (processedCard) {
          const hasMagnet = processedCard.dataset.hasMagnet === "true";
          GlobalFilterManager.applyCardVisibility(card, hasMagnet);
        }
      });
    }
    refreshHistoryState() {
      const cards = document.querySelectorAll(`.${Config.CLASSES.processedCard}`);
      cards.forEach((card) => {
        const id = card.dataset.id;
        if (id) {
          const status = HistoryService.getStatus(id);
          if (status === "watched") {
            card.classList.add(Config.CLASSES.isViewed);
            ViewStore.set(id, "status", "watched");
          }
        }
      });
    }
    async initListMode() {
      if (!this.config.list) return;
      const list = this.config.list;
      const process = async (nodes) => {
        for (const c of nodes) {
          try {
            const host = c;
            if (list.containerSelector && !c.closest(list.containerSelector)) continue;
            if (this.hostGuard.isNestedInsideProcessed(host)) continue;
            if (this.hostGuard.isAlreadyProcessed(host) || host.hasAttribute("data-enh-rebuilding")) continue;
            if (list.shouldProcessCard && !list.shouldProcessCard(host)) continue;
            const sourceKey = list.identityKey ? list.identityKey(host)?.trim() || null : null;
            if (sourceKey) {
              if (this.sourceKeyManager.isProcessing(sourceKey) || this.sourceKeyManager.isRecentlyProcessed(sourceKey)) {
                continue;
              }
              this.sourceKeyManager.markInFlight(sourceKey);
              host.setAttribute(this.sourceKeyAttr, sourceKey);
            }
            host.setAttribute("data-enh-rebuilding", "true");
            try {
              await this.processCard(host);
            } catch (err) {
              log$o.error("processCard failed", err);
              host.removeAttribute("data-enh-rebuilding");
              const k = host.getAttribute(this.sourceKeyAttr);
              if (k) this.sourceKeyManager.release(k, false);
              host.removeAttribute(this.sourceKeyAttr);
            }
          } catch (e) {
            log$o.error("Card iteration error", e);
          }
        }
      };
      const initialNodes = Array.from(document.querySelectorAll(list.cardSelector));
      if (initialNodes.length > 0) {
        await process(initialNodes);
      }
      this.listObserver = new SiteListObserver(list.cardSelector, list.containerSelector, (nodes) => {
        void process(nodes);
      });
      const obs = this.listObserver.init(list.mutationObserverTarget, list.observeMutations !== false);
      this.observers.push(...obs);
    }
    initDetailMode() {
      if (!this.config.detail) return;
      const detail = this.config.detail;
      const check = () => {
        const target = document.querySelector(detail.triggerSelector || detail.mainImageSelector || "");
        if (target && !target.hasAttribute("data-enh-processed")) {
          target.setAttribute("data-enh-processed", "true");
          if (detail.customDetailAction) {
            Promise.resolve(detail.customDetailAction(target, obs)).then((result) => {
              if (result) {
                CoreEvents.emit(AppEvents.DETAIL_ENHANCEMENT_REQUESTED, {
                  siteName: this.config.name,
                  config: result,
                  observer: obs
                });
              }
            }).catch((err) => {
              log$o.error("Detail action failed", err);
              target.removeAttribute("data-enh-processed");
            });
          }
        }
      };
      const obs = new MutationObserver(check);
      check();
      obs.observe(document.body, { childList: true, subtree: true });
      this.observers.push(obs);
    }
    async processCard(card) {
      if (!this.config.list) return;
      const list = this.config.list;
      try {
        let data = list.extractor(card);
        if (data instanceof Promise) data = await data;
        if (!data) {
          card.removeAttribute("data-enh-rebuilding");
          const k2 = card.getAttribute(this.sourceKeyAttr);
          if (k2) this.sourceKeyManager.release(k2, false);
          card.removeAttribute(this.sourceKeyAttr);
          return;
        }
        card.setAttribute("data-enh-processed", "true");
        card.classList.add(Config.CLASSES.cardRebuilt);
        this.hostGuard.markProcessed(card);
        const gridContainerSelector = list.gridContainerSelector ?? list.containerSelector;
        const gridContainer = gridContainerSelector ? card.closest(gridContainerSelector) : null;
        markGridContainer(gridContainer);
        const extraUi = list.getExtraUi ? list.getExtraUi(card) : {};
        CoreEvents.emit(AppEvents.CARD_DISCOVERED, {
          id: data.id,
          type: data.type,
          data,
          host: card,
          extraUi,
          postProcess: list.postProcess ? (final, newCard, classes) => {
            list.postProcess(card, final, newCard, data, classes);
          } : void 0
        });
        card.dataset.id = data.id;
        card.removeAttribute("data-enh-rebuilding");
        const k = card.getAttribute(this.sourceKeyAttr);
        if (k) this.sourceKeyManager.release(k, true);
      } catch (error) {
        log$o.error("processCard failed", error);
        card.removeAttribute("data-enh-rebuilding");
        const k = card.getAttribute(this.sourceKeyAttr);
        if (k) this.sourceKeyManager.release(k, false);
        card.removeAttribute(this.sourceKeyAttr);
      }
    }
    cleanup() {
      this.observers.forEach((o) => o.disconnect());
      this.observers = [];
      if (this.listObserver) {
        this.listObserver.disconnect();
        this.listObserver = null;
      }
      this.hostGuard.clear();
      this.sourceKeyManager.clear();
      this.clearSubscriptions();
      if (this.config.onCleanup) this.config.onCleanup();
    }
  }

  const log$n = Logger.scope("SiteManager");
  const urlWatchers = new Set();
  let originalPushState = null;
  let originalReplaceState = null;
  const notifyUrlWatchers = () => {
    urlWatchers.forEach((check) => {
      try {
        check();
      } catch (error) {
        log$n.error("URL watcher callback failed", error);
      }
    });
  };
  const installHistoryPatch = () => {
    if (originalPushState && originalReplaceState) {
      return;
    }
    originalPushState = history.pushState;
    originalReplaceState = history.replaceState;
    history.pushState = function(...args) {
      const result = originalPushState.apply(history, args);
      notifyUrlWatchers();
      return result;
    };
    history.replaceState = function(...args) {
      const result = originalReplaceState.apply(history, args);
      notifyUrlWatchers();
      return result;
    };
    window.addEventListener("popstate", notifyUrlWatchers);
  };
  const uninstallHistoryPatch = () => {
    if (!originalPushState || !originalReplaceState || urlWatchers.size > 0) {
      return;
    }
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
    originalPushState = null;
    originalReplaceState = null;
    window.removeEventListener("popstate", notifyUrlWatchers);
  };
  class GenericSite extends BaseSite {
    detectContext() {
      if (this.config.detectContext) {
        try {
          return this.config.detectContext();
        } catch (error) {
          log$n.error("Custom detectContext failed", error);
        }
      }
      const path = window.location.pathname;
      if (path.includes("/search/") || window.location.search.includes("keyword=")) {
        return PageContext.Search;
      }
      if (path.includes("/v/") || path.includes("/detail/") || path.includes("/movie/") || path.endsWith(".html")) {
        return PageContext.Detail;
      }
      return PageContext.List;
    }
  }
  const createSiteRegistry = (configs) => {
    const registry = new Map();
    Object.entries(configs).forEach(([name, config]) => {
      config.name = name;
      registry.set(name, config);
    });
    return registry;
  };
  const matchSiteConfig = (registry, hostname) => {
    for (const config of registry.values()) {
      const matches = config.hostnames.some(
        (hostnameMatcher) => typeof hostnameMatcher === "string" ? hostname.includes(hostnameMatcher) : hostnameMatcher.test(hostname)
      );
      if (matches) {
        return config;
      }
    }
    return null;
  };
  const installUrlWatcher = (check) => {
    installHistoryPatch();
    urlWatchers.add(check);
    return () => {
      urlWatchers.delete(check);
      uninstallHistoryPatch();
    };
  };

  const log$m = Logger.scope("SiteManager");
  class SiteServiceImplementation {
    registry = new Map();
    activeSite = null;
    currentUrl = location.href;
    disposeUrlWatcher = null;
    async onBootstrap() {
      log$m.debug("Bootstrapped, initiating site matching");
      this.registry = createSiteRegistry(SiteConfigs);
      await this.bootstrap();
    }
    onCleanup() {
      this.disposeUrlWatcher?.();
      this.disposeUrlWatcher = null;
      this.activeSite?.cleanup();
    }
    async bootstrap() {
      const matchedConfig = matchSiteConfig(this.registry, location.hostname);
      if (!matchedConfig) {
        log$m.warn(`No site config matched for ${location.hostname}`);
        return;
      }
      log$m.info(`Matched site: ${matchedConfig.name}`);
      this.activeSite = new GenericSite(matchedConfig);
      CoreEvents.emit(AppEvents.SITE_RESET, { siteName: matchedConfig.name });
      await this.activeSite.init();
      this.disposeUrlWatcher?.();
      this.disposeUrlWatcher = installUrlWatcher(() => {
        if (location.href === this.currentUrl) {
          return;
        }
        this.currentUrl = location.href;
        log$m.debug("URL change detected");
        this.activeSite?.cleanup();
        CoreEvents.emit(AppEvents.SITE_RESET, { siteName: matchedConfig.name });
        void this.activeSite?.init().then(() => {
          CoreEvents.emit(AppEvents.SITE_READY, { siteName: matchedConfig.name });
        }).catch((error) => {
          log$m.error(`Re-init failed for ${matchedConfig.name}`, error);
        });
        return;
      });
      CoreEvents.emit(AppEvents.SITE_READY, { siteName: matchedConfig.name });
    }
    getActiveSite() {
      return this.activeSite;
    }
  }

  const createSiteService = () => {
    return new SiteServiceImplementation();
  };
  AppContainer.register("site-service", createSiteService());

  const log$l = Logger.scope("Magnet");
  class MagnetServiceImplementation {
    queue = new Map();
    activeSearches = new Set();
    taskTimeouts = new Map();
    maxConcurrency = MAGNET_CONFIG.MAX_CONCURRENCY;
    onProgress = null;
    flushTimer = null;
    detachUiReady = null;
    onBootstrap() {
      log$l.debug("Subscribed to UI_READY");
      this.detachUiReady?.();
      this.detachUiReady = CoreEvents.on(AppEvents.UI_READY, () => {
        log$l.info("Manager active");
      });
    }
    onCleanup() {
      this.detachUiReady?.();
      this.detachUiReady = null;
      if (this.flushTimer) {
        clearTimeout(this.flushTimer);
        this.flushTimer = null;
      }
      this.taskTimeouts.forEach((timer) => clearTimeout(timer));
      this.taskTimeouts.clear();
      this.queue.forEach((task) => {
        if (task.status !== "found" && task.status !== "failed") {
          task.status = "failed";
          task.resolve(null);
        }
      });
      this.queue.clear();
      this.activeSearches.clear();
      this._updateStatus();
    }
    async fetchMagnet(id, type, options = {}) {
      if (options.forceRetry) {
        await Repository.cache.delete(id);
      }
      const cached = await Repository.cache.get(id);
      if (cached) {
        if (isNegativeMagnetCacheValue(cached)) {
          this._notifyUI(id, "failed");
          return null;
        }
        this._notifyUI(id, "found", cached);
        return cached;
      }
      const existingTask = this.queue.get(id);
      if (existingTask) {
        return new Promise((resolve) => {
          const originalResolve = existingTask.resolve;
          existingTask.resolve = (url) => {
            originalResolve(url);
            resolve(url);
          };
        });
      }
      return new Promise((resolve) => {
        const task = {
          id,
          type: type || MAGNET_CONFIG.DEFAULT_TYPE,
          resolve,
          retryCount: 0,
          status: "pending",
          startTime: Date.now()
        };
        this.queue.set(id, task);
        const timeoutHandle = setTimeout(() => {
          this.taskTimeouts.delete(id);
          const currentTask = this.queue.get(id);
          if (currentTask === task && currentTask.status !== "found" && currentTask.status !== "failed") {
            log$l.warn(`Search timed out for ${task.id}`);
            currentTask.status = "failed";
            this._notifyUI(task.id, "failed");
            currentTask.resolve(null);
            this.queue.delete(id);
          }
        }, MAGNET_CONFIG.SEARCH_TIMEOUT_MS);
        this.taskTimeouts.set(id, timeoutHandle);
        this._requestProcess();
      });
    }
    async retryFailedMagnet(id, type) {
      return await this.fetchMagnet(id, type, { forceRetry: true });
    }
    predictiveSearch(card) {
      const { id, type } = card.dataset;
      if (id && type && !this.queue.has(id) && this.queue.size < MAGNET_CONFIG.PREDICTIVE_LIMIT) {
        this.fetchMagnet(id, type);
      }
    }
    _requestProcess() {
      if (this.flushTimer) {
        clearTimeout(this.flushTimer);
      }
      this.flushTimer = setTimeout(() => {
        this._processQueue();
        this.flushTimer = null;
      }, 100);
    }
    async _processQueue() {
      if (this.activeSearches.size >= this.maxConcurrency) return;
      const pending = Array.from(this.queue.values()).filter((task) => task.status === "pending").sort((left, right) => left.startTime - right.startTime);
      const batch = pending.slice(0, this.maxConcurrency - this.activeSearches.size);
      if (batch.length === 0) return;
      batch.forEach((task) => {
        task.status = "searching";
        this.activeSearches.add(task.id);
      });
      this._updateStatus();
      try {
        await ScraperService.fetchMagnets(
          batch.map((task) => ({ id: task.id, type: task.type })),
          (id, url) => {
            const task = this.queue.get(id);
            if (!task) return;
            if (url) {
              this._onTaskSuccess(task, url);
            } else {
              this._onTaskFailed(task, true);
            }
          }
        );
      } catch (error) {
        log$l.error("Batch search error", error);
        batch.forEach((task) => {
          if (task.status === "searching") {
            this._onTaskFailed(task, true);
          }
        });
      } finally {
        batch.forEach((task) => this.activeSearches.delete(task.id));
        this._requestProcess();
      }
    }
    async _onTaskSuccess(task, url) {
      this._clearTaskTimeout(task.id);
      await Repository.cache.set(task.id, url);
      task.status = "found";
      task.resolve(url);
      this.queue.delete(task.id);
      this._updateStatus();
      this._notifyUI(task.id, "found", url);
    }
    async _onTaskFailed(task, forceFail = false) {
      const maxRetries = MAGNET_CONFIG.MAX_RETRIES;
      if (!forceFail && task.retryCount < maxRetries) {
        task.retryCount++;
        task.status = "pending";
        task.startTime = Date.now() + Math.pow(2, task.retryCount) * MAGNET_CONFIG.RETRY_DELAY;
        log$l.debug(`Retrying ${task.id} (${task.retryCount}/${maxRetries})`);
        this._updateStatus();
        return;
      }
      this._clearTaskTimeout(task.id);
      task.status = "failed";
      task.resolve(null);
      this.queue.delete(task.id);
      this._notifyUI(task.id, "failed");
      await Repository.cache.set(task.id, createNegativeMagnetCacheValue());
      this._updateStatus();
    }
    _notifyUI(id, status, url) {
      if (status === "found" && url) {
        CoreEvents.emit(AppEvents.MAGNET_FOUND, { id, url });
      } else if (status === "failed") {
        CoreEvents.emit(AppEvents.MAGNET_FAILED, { id });
      }
    }
    _updateStatus() {
      if (!this.onProgress) return;
      this.onProgress({
        total: this.queue.size,
        active: this.activeSearches.size,
        found: 0,
        failed: Array.from(this.queue.values()).filter((t) => t.status === "failed").length
      });
    }
    _clearTaskTimeout(id) {
      const timer = this.taskTimeouts.get(id);
      if (timer) {
        clearTimeout(timer);
        this.taskTimeouts.delete(id);
      }
    }
  }
  const MagnetService = AppContainer.register("magnet-service", new MagnetServiceImplementation());

  const SmartTooltips = {
    currentTooltip: null,
    hideTimeout: null,
    initialized: false,
    mouseOverHandler: null,
    mouseOutHandler: null,
    resolveTooltipTarget(target) {
      if (!(target instanceof HTMLElement)) {
        return null;
      }
      return target.closest("[data-tooltip], [data-title]");
    },
    init() {
      if (this.initialized) {
        return;
      }
      this.initialized = true;
      this.mouseOverHandler = (e) => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        const tooltipTarget = this.resolveTooltipTarget(target);
        const tooltipText = tooltipTarget?.getAttribute("data-tooltip") || tooltipTarget?.getAttribute("data-title");
        if (tooltipTarget && tooltipText && this.shouldShowTooltip(tooltipTarget)) {
          this.show(tooltipTarget, tooltipText);
        }
      };
      this.mouseOutHandler = (e) => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        const tooltipTarget = this.resolveTooltipTarget(target);
        if (!tooltipTarget) return;
        const related = e.relatedTarget instanceof Element ? this.resolveTooltipTarget(e.relatedTarget) : null;
        if (related && related === tooltipTarget) {
          return;
        }
        this.hide();
      };
      document.addEventListener("mouseover", this.mouseOverHandler, true);
      document.addEventListener("mouseout", this.mouseOutHandler, true);
    },
    shouldShowTooltip(element) {
      if ("ontouchstart" in window) return false;
      if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") return false;
      if (element.querySelector(".tooltip")) return false;
      return true;
    },
    show(element, text) {
      this.hide(true);
      const tooltip = h(
        "div",
        {
          className: "smart-tooltip",
          style: {
            position: "fixed",
            background: "var(--fc2-surface-float)",
            color: "var(--fc2-text-bright)",
            padding: "var(--fc2-space-xs) var(--fc2-space-md)",
            borderRadius: "var(--fc2-radius-md)",
            fontSize: "var(--fc2-text-xs)",
            zIndex: String(UI_CONSTANTS.Z_INDEX_TOOLTIP),
            pointerEvents: "none",
            whiteSpace: "normal",
            maxWidth: "min(var(--fc2-layout-tooltip-max-width), calc(100vw - var(--fc2-space-md)))",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
            lineHeight: "var(--fc2-line-base)",
            backdropFilter: "blur(var(--fc2-blur))",
            boxShadow: "var(--fc2-shadow-md)",
            border: "var(--fc2-border-width) solid var(--fc2-border)",
            opacity: "0",
            willChange: "transform, opacity",
            transition: "opacity var(--fc2-motion-fast) var(--fc2-ease-standard), transform var(--fc2-motion-fast) var(--fc2-ease-standard)",
            transform: "translateY(calc(var(--fc2-space-xs) + var(--fc2-border-width)))"
          }
        },
        text
      );
      UIHost.add(tooltip);
      const rect = element.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      let top = rect.bottom + 8;
      let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
      if (left < 8) left = 8;
      if (left + tooltipRect.width > window.innerWidth - 8) {
        left = window.innerWidth - tooltipRect.width - 8;
      }
      if (top + tooltipRect.height > window.innerHeight - 8) {
        top = rect.top - tooltipRect.height - 8;
      }
      if (top < 8) {
        top = 8;
      }
      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;
      requestAnimationFrame(() => {
        tooltip.style.opacity = "1";
      });
      this.currentTooltip = tooltip;
    },
    hide(immediate = false) {
      const tooltip = this.currentTooltip;
      if (!tooltip) {
        return;
      }
      this.currentTooltip = null;
      if (this.hideTimeout !== null) {
        window.clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
      if (immediate) {
        tooltip.remove();
        return;
      }
      tooltip.style.opacity = "0";
      this.hideTimeout = window.setTimeout(() => {
        tooltip.remove();
        this.hideTimeout = null;
      }, 200);
    },
    destroy() {
      this.hide(true);
      if (this.hideTimeout !== null) {
        window.clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
      if (this.mouseOverHandler) {
        document.removeEventListener("mouseover", this.mouseOverHandler, true);
        this.mouseOverHandler = null;
      }
      if (this.mouseOutHandler) {
        document.removeEventListener("mouseout", this.mouseOutHandler, true);
        this.mouseOutHandler = null;
      }
      this.initialized = false;
    }
  };

  const GlobalClick = {
    initialized: false,
    clickHandler: null,
    init() {
      if (this.initialized) {
        return;
      }
      this.initialized = true;
      this.clickHandler = (e) => {
        const target = e.target;
        if (!target.closest(".enh-dropdown")) {
          document.querySelectorAll(".enh-dropdown.active").forEach((d) => {
            d.classList.remove("active");
            const card = d.closest(".processed-card") || d.closest(".card-rebuilt");
            if (card) card.classList.remove("has-active-dropdown");
          });
        }
      };
      document.addEventListener("click", this.clickHandler);
    },
    destroy() {
      if (this.clickHandler) {
        document.removeEventListener("click", this.clickHandler);
        this.clickHandler = null;
      }
      this.initialized = false;
    }
  };

  const IconArrowUp = '<svg viewBox="0 0 384 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.3l105.4 105.3c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"/></svg>';
  const IconGear = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M495.9 166.6c3.2 8.7.5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4l-55.6 17.8c-8.8 2.8-18.6.3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4c-1.1-8.4-1.7-16.9-1.7-25.5s.6-17.1 1.7-25.4l-43.3-39.4c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160a80 80 0 1 0 0 160"/></svg>';
  const IconBan = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M367.2 412.5L99.5 144.8C77.1 176.1 64 214.5 64 256c0 106 86 192 192 192c41.5 0 79.9-13.1 111.2-35.5m45.3-45.3C434.9 335.9 448 297.5 448 256c0-106-86-192-192-192c-41.5 0-79.9 13.1-111.2 35.5zM0 256a256 256 0 1 1 512 0a256 256 0 1 1-512 0"/></svg>';
  const IconMagnet = '<svg viewBox="0 0 448 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M0 160v96c0 123.7 100.3 224 224 224s224-100.3 224-224v-96H320v96c0 53-43 96-96 96s-96-43-96-96v-96zm0-32h128V64c0-17.7-14.3-32-32-32H32C14.3 32 0 46.3 0 64zm320 0h128V64c0-17.7-14.3-32-32-32h-64c-17.7 0-32 14.3-32 32z"/></svg>';
  const IconEyeSlash = '<svg viewBox="0 0 640 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2s-6.3 25.5 4.1 33.7l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7l-105.2-82.4c39.6-40.6 66.4-86.1 79.9-118.4c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C465.5 68.8 400.8 32 320 32c-68.2 0-125 26.3-169.3 60.8zm184.3 144.4c25.5-23.3 59.6-37.5 96.9-37.5c79.5 0 144 64.5 144 144c0 24.9-6.3 48.3-17.4 68.7L408 294.5c8.4-19.3 10.6-41.4 4.8-63.3c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3c0 10.2-2.4 19.8-6.6 28.3l-90.3-70.8zM373 389.9c-16.4 6.5-34.3 10.1-53 10.1c-79.5 0-144-64.5-144-144c0-6.9.5-13.6 1.4-20.2l-94.3-74.3c-22.8 29.7-39.1 59.3-48.6 82.2c-3.3 7.9-3.3 16.7 0 24.6c14.9 35.7 46.2 87.7 93 131.1c47 43.8 111.7 80.6 192.5 80.6c47.8 0 89.9-12.9 126.2-32.5z"/></svg>';
  const IconRotate = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M142.9 142.9c-17.5 17.5-30.1 38-37.8 59.8c-5.9 16.7-24.2 25.4-40.8 19.5S38.9 198 44.8 181.4c10.8-30.7 28.4-59.4 52.8-83.8c87.2-87.2 228.3-87.5 315.8-1L455 55c6.9-6.9 17.2-8.9 26.2-5.2S496 62.3 496 72v128c0 13.3-10.7 24-24 24H344c-9.7 0-18.5-5.8-22.2-14.8s-1.7-19.3 5.2-26.2l41.1-41.1c-62.6-61.5-163.1-61.2-225.3 1zM16 312c0-13.3 10.7-24 24-24h128c9.7 0 18.5 5.8 22.2 14.8s1.7 19.3-5.2 26.2l-41.1 41.1c62.6 61.5 163.1 61.2 225.3-1c17.5-17.5 30.1-38 37.8-59.8c5.9-16.7 24.2-25.4 40.8-19.5s25.4 24.2 19.5 40.8c-10.8 30.6-28.4 59.3-52.9 83.8c-87.2 87.2-228.3 87.5-315.8 1L57 457c-6.9 6.9-17.2 8.9-26.2 5.2S16 449.7 16 440V312.1z"/></svg>';
  const IconPlus = '<svg viewBox="0 0 448 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32v144H48c-17.7 0-32 14.3-32 32s14.3 32 32 32h144v144c0 17.7 14.3 32 32 32s32-14.3 32-32V288h144c17.7 0 32-14.3 32-32s-14.3-32-32-32H256z"/></svg>';
  const IconImages = '<svg viewBox="0 0 576 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M160 32c-35.3 0-64 28.7-64 64v224c0 35.3 28.7 64 64 64h352c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64zm236 106.7l96 144c4.9 7.4 5.4 16.8 1.2 24.6S480.9 320 472 320H200c-9.2 0-17.6-5.3-21.6-13.6s-2.9-18.2 2.9-25.4l64-80c4.6-5.7 11.4-9 18.7-9s14.2 3.3 18.7 9l17.3 21.6l56-84c4.5-6.6 12-10.6 20-10.6s15.5 4 20 10.7M192 128a32 32 0 1 1 64 0a32 32 0 1 1-64 0m-144-8c0-13.3-10.7-24-24-24S0 106.7 0 120v224c0 75.1 60.9 136 136 136h320c13.3 0 24-10.7 24-24s-10.7-24-24-24H136c-48.6 0-88-39.4-88-88z"/></svg>';
  const IconSpinner = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M304 48a48 48 0 1 0-96 0a48 48 0 1 0 96 0m0 416a48 48 0 1 0-96 0a48 48 0 1 0 96 0M48 304a48 48 0 1 0 0-96a48 48 0 1 0 0 96m464-48a48 48 0 1 0-96 0a48 48 0 1 0 96 0M142.9 437A48 48 0 1 0 75 369.1a48 48 0 1 0 67.9 67.9m0-294.2A48 48 0 1 0 75 75a48 48 0 1 0 67.9 67.9zM369.1 437a48 48 0 1 0 67.9-67.9a48 48 0 1 0-67.9 67.9"/></svg>';
  const IconCircleCheck = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M256 512a256 256 0 1 0 0-512a256 256 0 1 0 0 512m113-303L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"/></svg>';
  const IconCircleXmark = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M256 512a256 256 0 1 0 0-512a256 256 0 1 0 0 512m-81-337c9.4-9.4 24.6-9.4 33.9 0l47 47l47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47l47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47l-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47l-47-47c-9.4-9.4-9.4-24.6 0-33.9"/></svg>';
  const IconTriangleExclamation = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7.2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8.2-40.1l216-368C228.7 39.5 241.8 32 256 32m0 128c-13.3 0-24 10.7-24 24v112c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24m32 224a32 32 0 1 0-64 0a32 32 0 1 0 64 0"/></svg>';
  const IconCircleInfo = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M256 512a256 256 0 1 0 0-512a256 256 0 1 0 0 512m-40-176h24v-64h-24c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24h-80c-13.3 0-24-10.7-24-24s10.7-24 24-24m40-208a32 32 0 1 1 0 64a32 32 0 1 1 0-64"/></svg>';
  const IconXmark = '<svg viewBox="0 0 384 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7L86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256L41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3l105.4 105.3c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256z"/></svg>';
  const IconSliders = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M0 416c0 17.7 14.3 32 32 32h54.7c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H233.3c-12.3-28.3-40.5-48-73.3-48s-61 19.7-73.3 48H32c-17.7 0-32 14.3-32 32m128 0a32 32 0 1 1 64 0a32 32 0 1 1-64 0m192-160a32 32 0 1 1 64 0a32 32 0 1 1-64 0m32-80c-32.8 0-61 19.7-73.3 48H32c-17.7 0-32 14.3-32 32s14.3 32 32 32h246.7c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48H480c17.7 0 32-14.3 32-32s-14.3-32-32-32h-54.7c-12.3-28.3-40.5-48-73.3-48m-160-48a32 32 0 1 1 0-64a32 32 0 1 1 0 64m73.3-64C253 35.7 224.8 16 192 16s-61 19.7-73.3 48H32C14.3 64 0 78.3 0 96s14.3 32 32 32h86.7c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48H480c17.7 0 32-14.3 32-32s-14.3-32-32-32z"/></svg>';
  const IconDatabase = '<svg viewBox="0 0 448 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M448 80v48c0 44.2-100.3 80-224 80S0 172.2 0 128V80C0 35.8 100.3 0 224 0s224 35.8 224 80m-54.8 134.7c20.8-7.4 39.9-16.9 54.8-28.6V288c0 44.2-100.3 80-224 80S0 332.2 0 288V186.1c14.9 11.8 34 21.2 54.8 28.6C99.7 230.7 159.5 240 224 240s124.3-9.3 169.2-25.3M0 346.1c14.9 11.8 34 21.2 54.8 28.6C99.7 390.7 159.5 400 224 400s124.3-9.3 169.2-25.3c20.8-7.4 39.9-16.9 54.8-28.6V432c0 44.2-100.3 80-224 80S0 476.2 0 432z"/></svg>';
  const IconFilter = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M3.9 54.9C10.5 40.9 24.5 32 40 32h432c15.5 0 29.5 8.9 36.1 22.9s4.6 30.5-5.2 42.5L320 320.9V448c0 12.1-6.8 23.2-17.7 28.6s-23.8 4.3-33.5-3l-64-48c-8.1-6-12.8-15.5-12.8-25.6v-79.1L9 97.3C-.7 85.4-2.8 68.8 3.9 54.9"/></svg>';
  const IconPalette = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M512 256v2.7c-.4 36.5-33.6 61.3-70.1 61.3H344c-26.5 0-48 21.5-48 48c0 3.4.4 6.7 1 9.9c2.1 10.2 6.5 20 10.8 29.9c6.1 13.8 12.1 27.5 12.1 42c0 31.8-21.6 60.7-53.4 62c-3.5.1-7 .2-10.6.2C114.6 512 0 397.4 0 256S114.6 0 256 0s256 114.6 256 256m-384 32a32 32 0 1 0-64 0a32 32 0 1 0 64 0m0-96a32 32 0 1 0 0-64a32 32 0 1 0 0 64m160-96a32 32 0 1 0-64 0a32 32 0 1 0 64 0m96 96a32 32 0 1 0 0-64a32 32 0 1 0 0 64"/></svg>';
  const IconClockRotateLeft = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M75 75L41 41C25.9 25.9 0 36.6 0 57.9V168c0 13.3 10.7 24 24 24h110.1c21.4 0 32.1-25.9 17-41l-30.8-30.8C155 85.5 203 64 256 64c106 0 192 86 192 192s-86 192-192 192c-40.8 0-78.6-12.7-109.7-34.4c-14.5-10.1-34.4-6.6-44.6 7.9s-6.6 34.4 7.9 44.6C151.2 495 201.7 512 256 512c141.4 0 256-114.6 256-256S397.4 0 256 0C185.3 0 121.3 28.7 75 75m181 53c-13.3 0-24 10.7-24 24v104c0 6.4 2.5 12.5 7 17l72 72c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-65-65V152c0-13.3-10.7-24-24-24z"/></svg>';
  const IconFileExport = '<svg viewBox="0 0 576 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M0 64C0 28.7 28.7 0 64 0h160v128c0 17.7 14.3 32 32 32h128v128H216c-13.3 0-24 10.7-24 24s10.7 24 24 24h168v112c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64zm384 272v-48h110.1l-39-39c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l80 80c9.4 9.4 9.4 24.6 0 33.9l-80 80c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l39-39zm0-208H256V0z"/></svg>';
  const IconFileImport = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M128 64c0-35.3 28.7-64 64-64h160v128c0 17.7 14.3 32 32 32h128v288c0 35.3-28.7 64-64 64H192c-35.3 0-64-28.7-64-64V336h174.1l-39 39c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l80-80c9.4-9.4 9.4-24.6 0-33.9l-80-80c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l39 39l-174.1.1zm0 224v48H24c-13.3 0-24-10.7-24-24s10.7-24 24-24zm384-160H384V0z"/></svg>';
  const IconChevronLeft = '<svg viewBox="0 0 320 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256L246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/></svg>';
  const IconChevronRight = '<svg viewBox="0 0 320 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256L73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/></svg>';
  const IconEye = '<svg viewBox="0 0 576 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32M144 256a144 144 0 1 1 288 0a144 144 0 1 1-288 0m144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3"/></svg>';
  const IconLink = '<svg viewBox="0 0 640 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M579.8 267.7c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114L422.3 334.8c-31.5 31.5-82.5 31.5-114 0c-27.9-27.9-31.5-71.8-8.6-103.8l1.1-1.6c10.3-14.4 6.9-34.4-7.4-44.6s-34.4-6.9-44.6 7.4l-1.1 1.6C206.5 251.2 213 330 263 380c56.5 56.5 148 56.5 204.5 0zM60.2 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372 74 321 105.5 289.5l112.2-112.3c31.5-31.5 82.5-31.5 114 0c27.9 27.9 31.5 71.8 8.6 103.9l-1.1 1.6c-10.3 14.4-6.9 34.4 7.4 44.6s34.4 6.9 44.6-7.4l1.1-1.6C433.5 260.8 427 182 377 132c-56.5-56.5-148-56.5-204.5 0z"/></svg>';
  const IconBolt = '<svg viewBox="0 0 448 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M349.4 44.6c5.9-13.7 1.5-29.7-10.6-38.5s-28.6-8-39.9 1.8l-256 224c-10 8.8-13.6 22.9-8.9 35.3S50.7 288 64 288h111.5L98.6 467.4c-5.9 13.7-1.5 29.7 10.6 38.5s28.6 8 39.9-1.8l256-224c10-8.8 13.6-22.9 8.9-35.3s-16.6-20.7-30-20.7H272.5z"/></svg>';
  const IconPlayCircle = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M0 256a256 256 0 1 1 512 0a256 256 0 1 1-512 0m188.3-108.9c-7.6 4.2-12.3 12.3-12.3 20.9v176c0 8.7 4.7 16.7 12.3 20.9s16.8 4.1 24.3-.5l144-88c7.1-4.4 11.5-12.1 11.5-20.5s-4.4-16.1-11.5-20.5l-144-88c-7.4-4.5-16.7-4.7-24.3-.5z"/></svg>';
  const IconPlay = '<svg viewBox="0 0 384 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80v352c0 17.4 9.4 33.4 24.5 41.9S58.2 482 73 473l288-176c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41z"/></svg>';
  const IconPause = '<svg viewBox="0 0 320 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M48 64C21.5 64 0 85.5 0 112v288c0 26.5 21.5 48 48 48h32c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48zm192 0c-26.5 0-48 21.5-48 48v288c0 26.5 21.5 48 48 48h32c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48z"/></svg>';
  const IconVial = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M342.6 9.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l9.4 9.4L28.1 342.6C10.1 360.6 0 385 0 410.5v5.5c0 53 43 96 96 96h5.5c25.5 0 49.9-10.1 67.9-28.1L448 205.3l9.4 9.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-32-32l-96-96l-32-32zM205.3 256L352 109.3l50.7 50.7l-96 96H205.2z"/></svg>';
  const IconImageSearch = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M416 208c0 45.9-14.9 88.3-40 122.7l126.6 126.7c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0s208 93.1 208 208M208 352a144 144 0 1 0 0-288a144 144 0 1 0 0 288"/></svg>';
  const IconListUl = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M64 144a48 48 0 1 0 0-96a48 48 0 1 0 0 96m128-80c-17.7 0-32 14.3-32 32s14.3 32 32 32h288c17.7 0 32-14.3 32-32s-14.3-32-32-32zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32h288c17.7 0 32-14.3 32-32s-14.3-32-32-32zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32h288c17.7 0 32-14.3 32-32s-14.3-32-32-32zM64 464a48 48 0 1 0 0-96a48 48 0 1 0 0 96m48-208a48 48 0 1 0-96 0a48 48 0 1 0 96 0"/></svg>';
  const IconServer = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M64 32C28.7 32 0 60.7 0 96v64c0 35.3 28.7 64 64 64h384c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64zm280 72a24 24 0 1 1 0 48a24 24 0 1 1 0-48m48 24a24 24 0 1 1 48 0a24 24 0 1 1-48 0M64 288c-35.3 0-64 28.7-64 64v64c0 35.3 28.7 64 64 64h384c35.3 0 64-28.7 64-64v-64c0-35.3-28.7-64-64-64zm280 72a24 24 0 1 1 0 48a24 24 0 1 1 0-48m56 24a24 24 0 1 1 48 0a24 24 0 1 1-48 0"/></svg>';
  const IconMagnifyingGlass = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" fill="currentColor"><path fill="currentColor" d="M416 208c0 45.9-14.9 88.3-40 122.7l126.6 126.7c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0s208 93.1 208 208M208 352a144 144 0 1 0 0-288a144 144 0 1 0 0 288"/></svg>';
  const PORTAL_ICONS = {
    dmm: IconPlayCircle,
    fc2: IconLink,
    supjav: IconBolt,
    missav: IconPlayCircle,
    javdb: IconDatabase,
    javbus: IconDatabase,
    javlibrary: IconDatabase,
    fc2ppvdb: IconListUl,
    fd2ppv: IconServer,
    fc2db: IconDatabase,
    sukebei: IconMagnifyingGlass
  };

  const log$k = Logger.scope("PreviewService");
  const isGMResponseBlobPayload = (value) => typeof value === "object" && value !== null && "arrayBuffer" in value && typeof value.arrayBuffer === "function";
  class PreviewServiceImplementation {
    cache = new Map();
    maxCacheSize = CACHE.PREVIEW_MAX_SIZE;
    inflightPreviewRequests = new Map();
    lastPreviewRequestAt = Number.NEGATIVE_INFINITY;
    previewCooldownUntil = 0;
    async onBootstrap() {
      log$k.debug("Preview service bootstrapped");
    }
    onCleanup() {
      this.clearCache();
      this.inflightPreviewRequests.clear();
      this.previewCooldownUntil = 0;
      this.lastPreviewRequestAt = Number.NEGATIVE_INFINITY;
    }
async getPreviewBlob(id, type, previewSlug) {
      const url = this.getPreviewUrl(id, type, previewSlug);
      const inflight = this.inflightPreviewRequests.get(url);
      if (inflight) return inflight;
      const now = Date.now();
      if (now < this.previewCooldownUntil) throw { status: 403, message: "Cooldown" };
      const elapsed = now - this.lastPreviewRequestAt;
      if (elapsed < TIMING.POLITE_DELAY_MS) {
        throw { retryAfterMs: TIMING.POLITE_DELAY_MS - elapsed };
      }
      this.lastPreviewRequestAt = now;
      const request = this.fetchBlob(url).catch((error) => {
        if (error?.status === 403) {
          this.previewCooldownUntil = Date.now() + TIMING.RATE_LIMIT_BACKOFF_MS;
        }
        throw error;
      }).finally(() => {
        if (this.inflightPreviewRequests.get(url) === request) {
          this.inflightPreviewRequests.delete(url);
        }
      });
      this.inflightPreviewRequests.set(url, request);
      return request;
    }
    getPreviewUrl(id, type, previewSlug) {
      if (previewSlug) {
        return `${EXTERNAL_URLS.FOURHOI_BASE}/${previewSlug.toLowerCase()}/preview.mp4`;
      }
      if (type === "fc2") {
        return `${EXTERNAL_URLS.FOURHOI_BASE}/fc2-ppv-${id}/preview.mp4`;
      }
      return `${EXTERNAL_URLS.FOURHOI_BASE}/${id.toLowerCase()}/preview.mp4`;
    }
    async checkExistence(id, type, previewSlug) {
      const url = this.getPreviewUrl(id, type, previewSlug);
      return new Promise((resolve) => {
        GM_xmlhttpRequest({
          method: "HEAD",
          url,
          timeout: 5e3,
          onload: (response) => resolve(response.status >= 200 && response.status < 300),
          onerror: () => resolve(false),
          ontimeout: () => resolve(false)
        });
      });
    }
getCachedElement(id) {
      const entry = this.cache.get(id);
      if (entry) {
        entry.timestamp = Date.now();
        return entry.element;
      }
      return void 0;
    }
    cacheElement(id, element) {
      if (this.cache.has(id)) {
        this.cache.get(id).timestamp = Date.now();
        return;
      }
      if (this.cache.size >= this.maxCacheSize) {
        const oldest = Array.from(this.cache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
        if (oldest) {
          this.disposeElement(oldest[1].element);
          this.cache.delete(oldest[0]);
        }
      }
      this.cache.set(id, { url: element.src, element, timestamp: Date.now() });
    }
    clearCache() {
      this.cache.forEach((item) => this.disposeElement(item.element));
      this.cache.clear();
      log$k.debug("Cache cleared");
    }
async fetchBlob(url) {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "GET",
          url,
          responseType: "blob",
          timeout: Config.TIMEOUTS.API,
          onload: async (response) => {
            if (response.status < 200 || response.status >= 300) {
              reject({ status: response.status, statusText: response.statusText });
              return;
            }
            try {
              if (response.response instanceof Blob) {
                resolve(response.response);
                return;
              }
              const blobLike = response.response;
              if (isGMResponseBlobPayload(blobLike)) {
                const blob = new Blob([await blobLike.arrayBuffer()], { type: blobLike.type || "" });
                resolve(blob);
                return;
              }
              reject(new Error("Invalid blob response"));
            } catch (e) {
              reject(e);
            }
          },
          onerror: reject,
          ontimeout: () => reject(new Error("Timeout"))
        });
      });
    }
    disposeElement(element) {
      if (element instanceof HTMLVideoElement) {
        const src = element.src || element.currentSrc || element.getAttribute("src");
        element.pause();
        element.removeAttribute("src");
        try {
          element.load();
        } catch {
        }
        element.remove();
        if (src?.startsWith("blob:")) URL.revokeObjectURL(src);
      } else {
        element.remove();
      }
    }
  }
  const PreviewService = AppContainer.register("preview-service", new PreviewServiceImplementation());

  class PreviewLogic {
    static activePreviewTokens = new WeakMap();
    static warmCleanupBindings = new WeakMap();
    static activeVideos = new Set();
    static containerBindings = new Map();
    static registerContainer(container) {
      const existing = this.containerBindings.get(container);
      if (existing) {
        container.removeEventListener(existing.mode, existing.handler, existing.capture);
        this.containerBindings.delete(container);
      }
      const mode = State.proxy.previewMode;
      if (mode === "static") return;
      const selector = `.${Config.CLASSES.processedCard}`;
      const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const handler = (event) => {
        const target = event.target;
        if (isTouch) {
          const img = target.closest(`img.${Config.CLASSES.staticPreview}`);
          if (!img) return;
          const card = img.closest(selector);
          if (card && !card.querySelector("video")) {
            event.preventDefault();
            event.stopPropagation();
            void this.loadVideoProgressive(card);
          }
        } else if (mode === "hover") {
          const card = target.closest(selector);
          if (card && target === card) {
            void this.loadVideoProgressive(card);
          }
        }
      };
      const eventMode = isTouch ? "click" : "mouseenter";
      container.addEventListener(eventMode, handler, true);
      this.containerBindings.set(container, { mode: eventMode, handler, capture: true });
    }
    static disposePreviewForCard(card) {
      this.activePreviewTokens.delete(card);
      const video = card.querySelector("video");
      if (video) {
        this.activeVideos.delete(video);
        this.disposePreviewElement(video);
      }
      const binding = this.warmCleanupBindings.get(card);
      if (binding) {
        card.removeEventListener("mouseleave", binding.listener, binding.capture);
        this.warmCleanupBindings.delete(card);
      }
    }
    static async loadVideoProgressive(card) {
      const container = card.querySelector(`.${Config.CLASSES.videoPreviewContainer}`);
      const image = container?.querySelector(`img.${Config.CLASSES.staticPreview}`);
      if (!container || !image) return;
      const { id, type, previewSlug } = card.dataset;
      if (!id || !type) return;
      const cached = PreviewService.getCachedElement(id);
      if (cached && cached instanceof HTMLVideoElement) {
        if (cached.parentNode !== container) {
          cached.remove();
          container.appendChild(cached);
        }
        this.showActivePreview(container, image, cached);
        this.attachWarmCleanup(card, cached, image, container);
        return;
      }
      const existingVideo = container.querySelector("video");
      if (existingVideo && (existingVideo.currentSrc || existingVideo.getAttribute("src"))) {
        this.showActivePreview(container, image, existingVideo);
        this.attachWarmCleanup(card, existingVideo, image, container);
        return;
      }
      if (existingVideo) {
        this.activeVideos.delete(existingVideo);
        this.disposePreviewElement(existingVideo);
      }
      this.hideErrorIndicator(container);
      this.showLoadingIndicator(container);
      const video = h("video", {
        referrerpolicy: "no-referrer",
        autoplay: true,
        loop: true,
        muted: true,
        playsInline: true,
        preload: "auto",
        className: `${Config.CLASSES.previewElement} ${Config.CLASSES.hidden}`
      });
      this.activeVideos.add(video);
      container.appendChild(video);
      const previewToken = Symbol(id);
      this.activePreviewTokens.set(card, previewToken);
      let isStillHovered = true;
      const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      if (!isTouch) {
        this.attachWarmCleanup(card, video, image, container, () => {
          isStillHovered = false;
        });
      }
      video.addEventListener("progress", () => {
        if (video.buffered.length > 0 && isStillHovered && video.isConnected) {
          const percent = video.buffered.end(0) / video.duration * 100;
          const progress = container.querySelector(".preview-progress");
          if (progress) progress.textContent = `${Math.round(percent)}%`;
        }
      });
      const reveal = () => {
        if (!isStillHovered) return;
        container.classList.add("fc2-preview-active");
        video.classList.remove(Config.CLASSES.hidden);
        video.classList.add("fc2-reveal-content");
        image.classList.add(Config.CLASSES.hidden);
        this.hideLoadingIndicator(container);
        this.hideErrorIndicator(container);
      };
      video.addEventListener("loadeddata", reveal, { once: true });
      video.addEventListener(
        "playing",
        () => {
          if (!isStillHovered || !video.isConnected) {
            video.pause();
            PreviewService.cacheElement(id, video);
            return;
          }
          requestAnimationFrame(() => {
            if (isStillHovered && video.isConnected) reveal();
            else {
              video.pause();
              PreviewService.cacheElement(id, video);
            }
          });
        },
        { once: true }
      );
      video.addEventListener("error", () => {
        if (isStillHovered) this.restoreStaticPreview(container, image, video);
      });
      try {
        const blob = await PreviewService.getPreviewBlob(id, type, previewSlug);
        if (!isStillHovered || !card.isConnected || this.activePreviewTokens.get(card) !== previewToken) {
          this.activeVideos.delete(video);
          this.disposePreviewElement(video);
          return;
        }
        const blobUrl = URL.createObjectURL(blob);
        video.src = blobUrl;
        video.load();
        void video.play().catch(() => {
        });
      } catch (error) {
        const rateLimitError = error;
        if (typeof rateLimitError?.retryAfterMs === "number") {
          if (isStillHovered && card.isConnected && this.activePreviewTokens.get(card) === previewToken) {
            setTimeout(() => {
              if (isStillHovered && card.isConnected && this.activePreviewTokens.get(card) === previewToken) {
                void this.loadVideoProgressive(card);
              }
            }, rateLimitError.retryAfterMs);
          }
          return;
        }
        if (isStillHovered && card.isConnected && this.activePreviewTokens.get(card) === previewToken) {
          this.restoreStaticPreview(container, image, video, true);
        } else {
          this.activeVideos.delete(video);
          this.disposePreviewElement(video);
        }
      }
    }
    static showActivePreview(container, image, video) {
      container.classList.add("fc2-preview-active");
      video.classList.remove(Config.CLASSES.hidden);
      video.classList.add("fc2-reveal-content");
      image.classList.add(Config.CLASSES.hidden);
      video.play().catch(() => {
      });
    }
    static restoreStaticPreview(container, image, video, showError = true) {
      container.classList.remove("fc2-preview-active");
      image.classList.remove(Config.CLASSES.hidden);
      this.hideLoadingIndicator(container);
      this.disposePreviewElement(video);
      if (showError) this.showErrorIndicator(container);
    }
    static attachWarmCleanup(card, video, image, container, onCleanup) {
      const cleanup = () => {
        onCleanup?.();
        container.classList.remove("fc2-preview-active");
        if (video.isConnected) {
          video.pause();
          video.classList.add(Config.CLASSES.hidden);
          video.classList.remove("fc2-reveal-content");
        }
        image.classList.remove(Config.CLASSES.hidden);
        this.hideLoadingIndicator(container);
        const id = card.dataset.id;
        if (id && (video.currentSrc || video.getAttribute("src"))) {
          PreviewService.cacheElement(id, video);
        }
        this.hideErrorIndicator(container);
      };
      const existing = this.warmCleanupBindings.get(card);
      if (existing) card.removeEventListener("mouseleave", existing.listener, existing.capture);
      card.addEventListener("mouseleave", cleanup, { once: true });
      this.warmCleanupBindings.set(card, { listener: cleanup, capture: false });
    }
    static showLoadingIndicator(container) {
      if (container.querySelector(".preview-loading")) return;
      const loader = h(
        "div",
        {
          className: "preview-loading",
          style: "position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(180deg, var(--fc2-surface-low), var(--fc2-surface-float)); z-index: var(--fc2-z-tooltip);"
        },
        h("div", {
          className: "preview-spinner",
          style: "width: var(--fc2-space-2xl); height: var(--fc2-space-2xl); border: calc(var(--fc2-border-width) * 3) solid rgba(var(--fc2-primary-rgb), var(--fc2-opacity-muted)); border-top-color: var(--fc2-text-bright); border-radius: 50%; animation: fc2-spin 0.8s linear infinite;"
        }),
        h(
          "div",
          {
            className: "preview-progress",
            style: "margin-top: var(--fc2-btn-pad-xs); color: var(--fc2-text-bright); font-size: var(--fc2-text-xs); text-align: center;"
          },
          t("labelLoading")
        )
      );
      container.appendChild(loader);
    }
    static hideLoadingIndicator(container) {
      container.querySelector(".preview-loading")?.remove();
    }
    static showErrorIndicator(container) {
      this.hideErrorIndicator(container);
      const error = h(
        "div",
        {
          className: "preview-error",
          style: "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: var(--fc2-danger); font-size: var(--fc2-text-xs); text-align: center; z-index: var(--fc2-z-tooltip);"
        },
        h("span", {
          className: "fc2-icon",
          innerHTML: IconTriangleExclamation,
          style: "font-size: var(--fc2-space-lg); margin-bottom: var(--fc2-space-xs); display: inline-block;"
        }),
        h("div", {}, t("alertPreviewLoadFailed"))
      );
      container.appendChild(error);
      setTimeout(() => error.remove(), TIMING.PREVIEW_ERROR_DELAY);
    }
    static hideErrorIndicator(container) {
      container.querySelectorAll(".preview-error").forEach((e) => e.remove());
    }
    static disposePreviewElement(element) {
      if (element instanceof HTMLVideoElement) {
        const src = element.src || element.currentSrc || element.getAttribute("src");
        element.pause();
        element.removeAttribute("src");
        try {
          element.load();
        } catch {
        }
        element.remove();
        if (src?.startsWith("blob:")) URL.revokeObjectURL(src);
      } else {
        element.remove();
      }
    }
    static clearActive() {
      this.activeVideos.forEach((v) => this.disposePreviewElement(v));
      this.activeVideos.clear();
    }
  }

  const log$j = Logger.scope("Registry");
  const COMP_SYM = Symbol("fc2_comp");
  class Registry {
    components = new Map();
    constructor() {
      this.initGC();
      this.initEvents();
    }
    initEvents() {
      CoreEvents.on(AppEvents.SITE_RESET, () => {
        log$j.debug("Site change detected via events, clearing registry");
        this.clear();
      });
      CoreEvents.on(AppEvents.VIEW_STATE_CHANGED, (payload) => {
        this.notify(payload.id, { key: payload.key, value: payload.value });
      });
    }
    initGC() {
      DomObserver.subscribe((_added, removed) => {
        removed.forEach((node) => this.gc(node));
      });
    }
    gc(root) {
      const elementsWithComponents = root.querySelectorAll("[data-fc2-comp]");
      const checkAndClean = (el) => {
        const boundElement = el;
        const set = boundElement[COMP_SYM];
        if (set) {
          Array.from(set).forEach((ins) => {
            log$j.trace(`Auto-GC: detached ${ins.id}`);
            this.unregister(ins);
          });
        }
      };
      if (root.hasAttribute("data-fc2-comp")) {
        checkAndClean(root);
      }
      elementsWithComponents.forEach((el) => checkAndClean(el));
    }
    register(component) {
      if (!this.components.has(component.id)) {
        this.components.set(component.id, new Set());
      }
      this.components.get(component.id).add(component);
      if (component.element) {
        const boundElement = component.element;
        let set = boundElement[COMP_SYM];
        if (!set) {
          set = new Set();
          boundElement[COMP_SYM] = set;
          component.element.setAttribute("data-fc2-comp", "");
        }
        set.add(component);
      }
      log$j.trace(`Registered: ${component.id}`);
    }
    unregister(component) {
      const id = component.id;
      const set = this.components.get(id);
      if (set) {
        set.delete(component);
        if (set.size === 0) {
          this.components.delete(id);
          ViewStore.release(id);
        }
      }
      if (component.element) {
        const boundElement = component.element;
        const symSet = boundElement[COMP_SYM];
        if (symSet) {
          symSet.delete(component);
          if (symSet.size === 0) {
            delete boundElement[COMP_SYM];
            component.element.removeAttribute("data-fc2-comp");
          }
        }
      }
      if (component.destroy) {
        try {
          component.destroy();
        } catch (err) {
          log$j.warn(`Failed to destroy component ${id}`, err);
        }
        delete component.destroy;
      }
    }
    getInstances(id) {
      const set = this.components.get(id);
      return set ? Array.from(set) : [];
    }
    getAllRegisteredIds() {
      return Array.from(this.components.keys());
    }
    notify(id, data) {
      const instances = this.getInstances(id);
      instances.forEach((ins) => {
        try {
          ins.update(data);
        } catch (e) {
          log$j.error(`Notify failed for ${id}`, e);
        }
      });
    }
    clear() {
      this.components.forEach((set) => {
        set.forEach((ins) => this.unregister(ins));
      });
      this.components.clear();
      log$j.debug("Component registry cleared");
    }
  }
  const ComponentRegistry = new Registry();

  const log$i = Logger.scope("HistoryManager");
  class HistoryManager {
    isSyncing = false;
    pendingSync = false;
    constructor() {
      CoreEvents.on(AppEvents.HISTORY_LOADED, () => this.requestSync());
      CoreEvents.on(AppEvents.UI_READY, () => this.requestSync());
      CoreEvents.on(AppEvents.HISTORY_CHANGED, () => this.requestSync());
    }
requestSync() {
      if (this.isSyncing) {
        this.pendingSync = true;
        return;
      }
      this.syncAllComponents();
    }
    schedulePendingSync() {
      if (this.pendingSync) {
        this.pendingSync = false;
        requestAnimationFrame(() => this.syncAllComponents());
      }
    }
    normalizeId(id) {
      return IdNormalizer.normalize(id);
    }
async toggleWatched(id, isManual = true) {
      try {
        const normalizedId = IdNormalizer.normalize(id);
        const isCurrentlyWatched = HistoryService.has(normalizedId, "watched");
        const targetStatus = isCurrentlyWatched ? "none" : "watched";
        if (isCurrentlyWatched) {
          await HistoryService.remove(normalizedId);
        } else {
          await HistoryService.add(normalizedId, "watched");
        }
        ViewStore.set(normalizedId, "status", targetStatus);
        CoreEvents.emit(AppEvents.HISTORY_CHANGED, {});
        GlobalFilterManager.requestRefresh();
        log$i.debug(`Toggled watched status for ${normalizedId}: ${targetStatus} (Manual: ${isManual})`);
      } catch (error) {
        log$i.error(`Failed to toggle watched status for ${id}`, error);
      }
    }
async setWatched(id) {
      try {
        const normalizedId = IdNormalizer.normalize(id);
        if (HistoryService.has(normalizedId, "watched")) return;
        await HistoryService.add(normalizedId, "watched");
        ViewStore.set(normalizedId, "status", "watched");
        CoreEvents.emit(AppEvents.HISTORY_CHANGED, {});
        GlobalFilterManager.requestRefresh();
        log$i.debug(`Set watched status for ${normalizedId}`);
      } catch (error) {
        log$i.error(`Failed to set watched status for ${id}`, error);
      }
    }
async markBatchWatched(ids) {
      log$i.info(`Batch marking ${ids.length} items as watched`);
      for (const id of ids) {
        const normalizedId = IdNormalizer.normalize(id);
        await HistoryService.add(normalizedId, "watched");
        ViewStore.set(normalizedId, "status", "watched");
      }
      CoreEvents.emit(AppEvents.HISTORY_CHANGED, {});
      GlobalFilterManager.requestRefresh();
    }
syncAllComponents() {
      this.isSyncing = true;
      const ids = ComponentRegistry.getAllRegisteredIds();
      log$i.debug(`Syncing ${ids.length} components with history`);
      ids.forEach((id) => {
        const status = HistoryService.getStatus(id);
        if (status) {
          ViewStore.set(id, "status", status);
        }
      });
      this.isSyncing = false;
      this.schedulePendingSync();
    }
syncElement(el, id, classes) {
      const isWatched = HistoryService.has(id, "watched");
      el.classList.toggle(classes.isViewed, isWatched);
    }
  }
  const GlobalHistoryManager = new HistoryManager();

  const UIUtils = {
h: h,
icon: (svgContent, className = "") => {
      return h("span", { className: `fc2-icon ${className}`.trim(), innerHTML: svgContent });
    },
copyButtonBehavior: (btn, textToCopy, i18nCopied) => {
      if (btn.dataset.copied === "true") return;
      Utils.copyToClipboard(textToCopy);
      btn.dataset.copied = "true";
      const tt = btn.querySelector(`.${Config.CLASSES.tooltip}`);
      if (tt) {
        const originalTip = tt.textContent;
        tt.textContent = i18nCopied;
        setTimeout(() => {
          tt.textContent = originalTip;
          btn.dataset.copied = "false";
        }, Config.COPIED_BADGE_DURATION);
      } else {
        const originalText = btn.textContent;
        btn.textContent = i18nCopied;
        setTimeout(() => {
          btn.textContent = originalText;
          btn.dataset.copied = "false";
        }, Config.COPIED_BADGE_DURATION);
      }
    },
toggleLoading: (cont, show, btnCreator) => {
      if (!cont?.isConnected) return;
      const spinner = cont.querySelector(`.${Config.CLASSES.btnLoading}`);
      if (show) {
        if (!spinner) {
          const btn = btnCreator(IconSpinner, t("labelLoading"));
          btn.classList.add(Config.CLASSES.btnLoading);
          cont.appendChild(btn);
        }
        cont.classList.add("fc2-skeleton");
      } else {
        if (spinner) spinner.remove();
        cont.classList.remove("fc2-skeleton");
      }
    }
  };

  const isNavigableHref = (href) => {
    {
      return false;
    }
  };
  const Button$1 = (iconSvg, tip, href, onClick, className = "", options = {}) => {
    const classes = Config.CLASSES;
    const children = [];
    if (iconSvg) {
      children.push(UIUtils.icon(iconSvg));
    }
    if (!options.iconOnly || options.size !== "micro") {
      children.push(h("span", { className: classes.buttonText }, tip));
    }
    children.push(h("span", { className: classes.tooltip }, tip));
    const variantClass = options.variant ? `${options.variant}` : "";
    const sizeClass = options.size ? `${options.size}` : "";
    const iconOnlyClass = options.iconOnly ? "icon-only" : "";
    const combinedClassName = [
      classes.resourceBtn,
      "fc2-enh-btn",
variantClass,
      sizeClass,
      iconOnlyClass,
      className,
      options.className || ""
    ].filter(Boolean).join(" ").trim();
    const buttonTitle = options.title || tip;
    const buttonProps = {
      className: combinedClassName,
      "aria-label": options.ariaLabel || buttonTitle,
      "data-title": options.dataTitle || buttonTitle,
      onclick: (e) => {
        if (!onClick) return;
        if (!isNavigableHref()) e.preventDefault();
        e.stopPropagation();
        onClick(e);
      }
    };
    const button = isNavigableHref() ? h("a", { ...buttonProps, href, target: "_blank" }, ...children) : h("button", { ...buttonProps, type: options.type || "button" }, ...children);
    return button;
  };

  const getMagnetButtonSelector = () => `.${Config.CLASSES.resourceBtn}.${Config.CLASSES.btnMagnet}`;
  const hasMagnetButton = (root) => !!root?.querySelector(getMagnetButtonSelector());
  const findMagnetButton = (root) => root?.querySelector(getMagnetButtonSelector()) || null;

  const MagnetButton = (cont, url) => {
    if (cont && !hasMagnetButton(cont)) {
      const btn = Button$1(
        IconMagnet,
        t("tooltipCopyMagnet"),
        void 0,
        () => UIUtils.copyButtonBehavior(btn, url, t("tooltipCopied")),
        Config.CLASSES.btnMagnet,
        {
          ariaLabel: t("tooltipCopyMagnet"),
          title: t("tooltipCopyMagnet")
        }
      );
      cont.appendChild(btn);
      const card = cont.closest(`.${Config.CLASSES.cardRebuilt}`);
      if (card) {
        GlobalFilterManager.applyCardVisibility(card, true);
      }
    }
  };

  const getInitialToggleState = (id, type) => {
    const status = HistoryService.getStatus(id);
    return status === type;
  };
  const getToggleVisualConfig = () => ({
    activeClass: "is-viewed",
    className: "btn-toggle-view",
    iconClass: "icon-viewed",
    iconOff: IconEyeSlash,
    iconOn: IconEye,
    tooltipOff: t("tooltipMarkAsViewed"),
    tooltipOn: t("tooltipMarkAsUnviewed")
  });
  const decorateToggleIcons = (button, config, type) => {
    const firstIcon = button.querySelector(".fc2-icon");
    if (firstIcon) {
      firstIcon.classList.add(config.iconClass);
      const iconOffClass = `icon-un${"viewed" }`;
      firstIcon.after(UIUtils.icon(config.iconOff, iconOffClass));
    }
  };
  const runToggleAnimation = (button) => {
    button.classList.add("fc2-animate-pop");
    window.setTimeout(() => button.classList.remove("fc2-animate-pop"), TIMING.UI_TRANSITION_NORMAL);
  };
  const syncToggleAccessibility = (button, label) => {
    button.setAttribute("aria-label", label);
    button.setAttribute("data-title", label);
  };
  const applyToggleState = (button, isActive, config, _type) => {
    const classes = Config.CLASSES;
    const currentTip = isActive ? config.tooltipOn : config.tooltipOff;
    button.classList.toggle(config.activeClass, isActive);
    if (isActive) {
      runToggleAnimation(button);
    }
    const tooltip = button.querySelector(`.${classes.tooltip}`);
    if (tooltip) {
      tooltip.textContent = currentTip;
    }
    const buttonText = button.querySelector(`.${classes.buttonText}`);
    if (buttonText) {
      buttonText.textContent = currentTip;
    }
    button.setAttribute("aria-pressed", String(isActive));
    syncToggleAccessibility(button, currentTip);
  };
  const handleToggleClick = async (_button, id, _type, _activeClass) => {
    await GlobalHistoryManager.toggleWatched(id, true);
  };
  const isTargetUpdate = (_type, key) => key === "status";
  const StatusToggle = (id, type) => {
    const config = getToggleVisualConfig();
    const isActive = getInitialToggleState(id, type);
    const currentLabel = isActive ? config.tooltipOn : config.tooltipOff;
    const button = Button$1(
      config.iconOn,
      currentLabel,
      void 0,
      () => handleToggleClick(button, id),
      `${config.className} ${isActive ? config.activeClass : ""}`,
      {
        ariaLabel: currentLabel,
        title: currentLabel
      }
    );
    button.setAttribute("aria-pressed", String(isActive));
    decorateToggleIcons(button, config);
    const component = {
      id,
      element: button,
      update: (raw) => {
        const data = raw;
        if (!isTargetUpdate(type, data?.key)) {
          return;
        }
        const isNextActive = data?.value === type;
        applyToggleState(button, isNextActive, config);
      }
    };
    ComponentRegistry.register(component);
    return component;
  };

  const PORTAL_CATALOG = [
    {
      id: "dmm",
      name: "DMM",
      urlTemplate: EXTERNAL_URLS.DMM,
      shouldShow: ({ hostname }) => !hostname.includes("dmm.co.jp")
    },
    {
      id: "fc2",
      name: "FC2",
      urlTemplate: EXTERNAL_URLS.FC2,
      shouldShow: ({ type, hostname }) => type === "fc2" && !hostname.includes("fc2.com")
    },
    {
      id: "supjav",
      name: "Supjav",
      urlTemplate: EXTERNAL_URLS.SUPJAV,
      shouldShow: ({ hostname }) => !hostname.includes("supjav")
    },
    {
      id: "missav",
      name: "MissAV",
      urlTemplate: "",
      shouldShow: ({ hostname }) => !hostname.includes("missav")
    },
    {
      id: "javdb",
      name: "JavDB",
      urlTemplate: EXTERNAL_URLS.JAVDB,
      shouldShow: ({ hostname }) => !hostname.includes("javdb")
    },
    {
      id: "javbus",
      name: "JavBus",
      urlTemplate: EXTERNAL_URLS.JAVBUS,
      shouldShow: ({ hostname }) => !hostname.includes("javbus")
    },
    {
      id: "javlibrary",
      name: "JavLibrary",
      urlTemplate: EXTERNAL_URLS.JAVLIBRARY,
      shouldShow: ({ hostname }) => !hostname.includes("javlibrary")
    },
    {
      id: "fc2ppvdb",
      name: "FC2PPVDB",
      urlTemplate: EXTERNAL_URLS.FC2PPVDB,
      shouldShow: ({ type, hostname }) => type === "fc2" && !hostname.includes("fc2ppvdb")
    },
    {
      id: "fd2ppv",
      name: "FD2PPV",
      urlTemplate: EXTERNAL_URLS.FD2PPV,
      shouldShow: ({ type, hostname }) => type === "fc2" && !hostname.includes("fd2ppv")
    },
    {
      id: "fc2db",
      name: "FC2DB",
      urlTemplate: EXTERNAL_URLS.FC2DB,
      shouldShow: ({ type, hostname }) => type === "fc2" && !hostname.includes("fc2db")
    },
    {
      id: "sukebei",
      name: "Sukebei",
      urlTemplate: EXTERNAL_URLS.SUKEBEI,
      shouldShow: () => true
    }
  ];
  const resolvePortalUrlTemplate = (portal, type) => {
    if (portal.id !== "missav") {
      return portal.urlTemplate;
    }
    return type === "fc2" ? EXTERNAL_URLS.MISSAV_FC2 : EXTERNAL_URLS.MISSAV;
  };
  const createAvailablePortals = ({
    portals,
    enabledPortals,
    hostname,
    id,
    type
  }) => {
    return portals.filter((portal) => enabledPortals.includes(portal.id) && portal.shouldShow({ id, type, hostname })).map((portal) => ({
      id: portal.id,
      name: portal.name,
      url: resolvePortalUrlTemplate(portal, type).replace("{id}", () => {
        const dateParts = MediaUtils.parseDateIdParts(id);
        if (portal.id === "sukebei" && dateParts) {
          const sep = dateParts.brand === "CARIBBEANCOM" ? "-" : "_";
          return `${dateParts.date}${sep}${dateParts.serial}-${dateParts.short}`;
        }
        if (portal.id === "missav") {
          let missavId = id.toLowerCase();
          if (missavId.startsWith("1pondo-") || missavId.startsWith("1pon-")) {
            missavId = missavId.replace(/^(1pondo-|1pon-)/, "pondo-");
          }
          if (missavId.startsWith("10musume-") || missavId.startsWith("10mu-")) {
            missavId = missavId.replace(/^(10musume-|10mu-)/, "musume-");
          }
          if (/^(pondo|pacopacomama|musume|caribbeancom)-/.test(missavId)) {
            missavId = missavId.replace(/-(\d{2,4})$/, "_$1");
          }
          return missavId;
        }
        return id;
      })
    }));
  };
  const getAllPortals = (portals) => {
    return portals.map((portal) => ({ id: portal.id, name: portal.name }));
  };
  const getAllPortalSites = (portals) => {
    return Array.from(new Set(portals.map((portal) => portal.id)));
  };

  const DEFAULT_PORTAL_CACHE_MAX_SIZE = 300;
  const DEFAULT_PORTAL_CACHE_TTL_MS = 10 * 60 * 1e3;
  class PortalServiceImplementation {
    cache = new Map();
    portals;
    cacheMaxSize;
    cacheTtlMs;
    detachEnabledPortalsListener = null;
    constructor(portals = PORTAL_CATALOG, options = {}) {
      this.portals = portals;
      this.cacheMaxSize = options.cacheMaxSize ?? DEFAULT_PORTAL_CACHE_MAX_SIZE;
      this.cacheTtlMs = options.cacheTtlMs ?? DEFAULT_PORTAL_CACHE_TTL_MS;
    }
    async onInit() {
      this.onCleanup();
      this.detachEnabledPortalsListener = State.on("enabledPortals", () => this.clearCache());
    }
    onCleanup() {
      this.detachEnabledPortalsListener?.();
      this.detachEnabledPortalsListener = null;
      this.clearCache();
    }
    getAvailablePortals(data) {
      this.evictExpiredEntries();
      const hostname = location.hostname;
      const { id, type } = data;
      const cacheKey = `${id}-${type}-${hostname}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.cache.delete(cacheKey);
        this.cache.set(cacheKey, cached);
        return cached.results;
      }
      const results = createAvailablePortals({
        portals: this.portals,
        enabledPortals: State.proxy.enabledPortals || [],
        hostname,
        id,
        type
      });
      this.cache.set(cacheKey, { results, timestamp: Date.now() });
      this.enforceCacheLimit();
      return results;
    }
    getAllPortals() {
      return getAllPortals(this.portals);
    }
    getAllSites() {
      return getAllPortalSites(this.portals);
    }
    clearCache() {
      this.cache.clear();
    }
    evictExpiredEntries() {
      if (this.cache.size === 0) {
        return;
      }
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp >= this.cacheTtlMs) {
          this.cache.delete(key);
        }
      }
    }
    enforceCacheLimit() {
      if (this.cache.size <= this.cacheMaxSize) {
        return;
      }
      const overflow = this.cache.size - this.cacheMaxSize;
      const keysToDelete = this.cache.keys();
      for (let i = 0; i < overflow; i += 1) {
        const oldestKey = keysToDelete.next().value;
        if (!oldestKey) {
          break;
        }
        this.cache.delete(oldestKey);
      }
    }
  }
  const PortalService = AppContainer.register("portal-service", new PortalServiceImplementation());

  const hasActionSheetUrl = (url) => typeof url === "string" && url.trim().length > 0;
  class ActionSheet {
    static backdrop = null;
    static sheet = null;
    static hideTimer = null;
    static touchStartY = 0;
    static touchCurrentY = 0;
    static cancelPendingHide() {
      if (this.hideTimer !== null) {
        window.clearTimeout(this.hideTimer);
        this.hideTimer = null;
      }
    }
    static ensureElements() {
      if (this.backdrop && !this.backdrop.isConnected || this.sheet && !this.sheet.isConnected) {
        this.backdrop = null;
        this.sheet = null;
      }
      if (this.backdrop && this.sheet) {
        return;
      }
      this.backdrop = h("div", {
        className: "fc2-action-sheet-backdrop",
        role: "none",
        "aria-hidden": "true"
      });
      this.sheet = h("div", {
        className: "fc2-action-sheet",
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "fc2-sheet-title"
      });
      UIHost.add(this.backdrop);
      UIHost.add(this.sheet);
      if (!DeviceService.isMobile()) {
        this.sheet.classList.add("desktop");
      }
      this.backdrop.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.hide();
      };
      this.initTouchEvents();
    }
    static createCloseButton() {
      return h(
        "button",
        {
          className: "fc2-action-sheet-close-btn",
          "aria-label": t("btnClose"),
          onclick: (e) => {
            e.preventDefault();
            this.hide();
          }
        },
        "×"
      );
    }
    static createOptionItem(opt) {
      const sourceIcon = typeof opt.icon === "string" ? UIUtils.icon(opt.icon) : opt.icon;
      const iconEl = sourceIcon.cloneNode(true);
      if (opt.onSelect) {
        return h(
          "button",
          {
            className: "fc2-action-sheet-item",
            type: "button",
            onclick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              this.hide();
              window.setTimeout(() => opt.onSelect?.(), 0);
            }
          },
          iconEl,
          h("span", {}, opt.name)
        );
      }
      if (hasActionSheetUrl(opt.url)) {
        const item = h(
          "a",
          {
            className: "fc2-action-sheet-item",
            href: opt.url,
            target: "_blank",
            rel: "noopener noreferrer"
          },
          iconEl,
          h("span", {}, opt.name)
        );
        item.onclick = () => this.hide();
        return item;
      }
      return h(
        "button",
        {
          className: "fc2-action-sheet-item",
          type: "button",
          disabled: true,
          "aria-disabled": "true"
        },
        iconEl,
        h("span", {}, opt.name)
      );
    }
    static createOptionsGrid(options) {
      const grid = h("div", { className: "fc2-action-sheet-grid" });
      options.forEach((opt) => {
        grid.appendChild(this.createOptionItem(opt));
      });
      return grid;
    }
    static show(title, options) {
      this.cancelPendingHide();
      this.ensureElements();
      this.sheet.style.transform = "";
      this.sheet.style.transition = "";
      this.touchStartY = 0;
      this.touchCurrentY = 0;
      this.sheet.textContent = "";
      this.sheet.appendChild(h("div", { className: "fc2-action-sheet-handle" }));
      const header = h(
        "div",
        { className: "fc2-action-sheet-header" },
        h("div", { className: "fc2-action-sheet-title", id: "fc2-sheet-title" }, title)
      );
      header.appendChild(this.createCloseButton());
      this.sheet.appendChild(header);
      this.sheet.appendChild(this.createOptionsGrid(options));
      requestAnimationFrame(() => {
        this.backdrop.classList.add("active");
        this.sheet.classList.add("active");
      });
      OverlayStack.push(this);
    }
    static initTouchEvents() {
      if (!this.sheet) return;
      this.sheet.addEventListener(
        "touchstart",
        (e) => {
          const touch = e.touches[0];
          if (!touch) return;
          this.touchStartY = touch.clientY;
          if (this.sheet) this.sheet.style.transition = "none";
        },
        { passive: true }
      );
      this.sheet.addEventListener(
        "touchmove",
        (e) => {
          const touch = e.touches[0];
          if (!touch) return;
          this.touchCurrentY = touch.clientY;
          const deltaY = this.touchCurrentY - this.touchStartY;
          if (deltaY > 0 && this.sheet) {
            this.sheet.style.transform = `translateY(${deltaY}px)`;
          }
        },
        { passive: true }
      );
      this.sheet.addEventListener("touchend", () => {
        if (!this.sheet) return;
        this.sheet.style.transition = "";
        const deltaY = this.touchCurrentY - this.touchStartY;
        if (deltaY > UI_CONSTANTS.SWIPE_DISMISS_THRESHOLD) {
          this.hide();
        } else {
          this.sheet.style.transform = "";
        }
        this.touchStartY = 0;
        this.touchCurrentY = 0;
      });
    }
    static close() {
      this.hide();
    }
    static hide() {
      if (!this.backdrop || !this.sheet) return;
      this.cancelPendingHide();
      OverlayStack.remove(this);
      this.backdrop.classList.remove("active");
      this.sheet.classList.remove("active");
      const b = this.backdrop;
      const s = this.sheet;
      this.hideTimer = window.setTimeout(() => {
        if (s && s.parentElement) s.remove();
        if (b && b.parentElement) b.remove();
        if (this.backdrop === b) this.backdrop = null;
        if (this.sheet === s) this.sheet = null;
        if (this.hideTimer !== null) {
          this.hideTimer = null;
        }
      }, TIMING.UI_TRANSITION_NORMAL);
    }
  }

  const log$h = Logger.scope("Toast");
  const MAX_TOASTS = 8;
  const resolveToastDisplayOptions = (options) => ({
    duration: options.duration === 0 ? 0 : options.duration || TIMING.TOAST_DEFAULT_DURATION,
    showClose: options.showClose ?? true
  });
  const getToastIconSvg = (type) => {
    switch (type) {
      case "success":
        return IconCircleCheck;
      case "error":
        return IconCircleXmark;
      case "warn":
        return IconTriangleExclamation;
      default:
        return IconCircleInfo;
    }
  };
  const getToastColor = (type) => {
    switch (type) {
      case "success":
        return "var(--fc2-success)";
      case "error":
        return "var(--fc2-danger)";
      case "warn":
        return "var(--fc2-warn)";
      default:
        return "var(--fc2-info)";
    }
  };
  const createToastContainer = () => h("div", { className: "fc2-toast-container" });
  const createToastProgress = (duration, color) => duration > 0 ? h("div", {
    className: "fc2-toast-progress",
    style: {
      background: color,
      animation: `fc2-toast-shrink ${duration}ms linear forwards`
    }
  }) : null;
  const createToastElement = (message, type, duration, showClose, options, onDismiss) => {
    const toast = h("div", {
      className: `fc2-toast-item toast-${type}`,
      onclick: options.onClick
    });
    const dismissToast = (event) => {
      event.stopPropagation();
      onDismiss(toast);
    };
    const actionButton = options.action ? h(
      "button",
      {
        className: "fc2-toast-action",
        onclick: (event) => {
          event.stopPropagation();
          options.action?.onClick();
          onDismiss(toast);
        }
      },
      options.action.label
    ) : null;
    const closeButton = showClose ? h(
      "button",
      {
        className: "fc2-toast-close",
        onclick: dismissToast
      },
      UIUtils.icon(IconXmark)
    ) : null;
    const color = getToastColor(type);
    const icon = h("div", { className: "fc2-toast-icon" }, UIUtils.icon(getToastIconSvg(type)));
    const content = h("span", { className: "fc2-toast-content" }, message);
    const progress = createToastProgress(duration, color);
    toast.append(icon, content);
    if (actionButton) toast.appendChild(actionButton);
    if (closeButton) toast.appendChild(closeButton);
    if (progress) toast.appendChild(progress);
    return toast;
  };
  class ToastManager {
    container = null;
    toasts = new Set();
    MAX_TOASTS = MAX_TOASTS;
    init() {
      if (this.container && !this.container.isConnected) {
        this.container = null;
        this.toasts.clear();
      }
      if (this.container) return;
      this.container = createToastContainer();
      UIHost.add(this.container);
    }
    show(message, type = "info", options = {}) {
      this.init();
      const { duration, showClose } = resolveToastDisplayOptions(options);
      const toast = createToastElement(message, type, duration, showClose, options, (el) => this.remove(el));
      log$h.trace(`Showing [${type}]: ${message}`);
      this.container?.appendChild(toast);
      this.toasts.add(toast);
      this.evictOverflowToasts();
      if (duration > 0) {
        setTimeout(() => this.remove(toast), duration);
      }
      if (options.system) {
        BrowserService.notify(message, void 0, void 0, options.onClick);
      }
      return toast;
    }
    remove(toast) {
      if (!this.toasts.has(toast)) return;
      this.toasts.delete(toast);
      toast.classList.add("hiding");
      const onEnd = () => toast.remove();
      const fallbackTimer = setTimeout(onEnd, TIMING.UI_TRANSITION_SLOW);
      toast.addEventListener(
        "animationend",
        (event) => {
          if (event.animationName === "fc2-toast-out") {
            clearTimeout(fallbackTimer);
            onEnd();
          }
        },
        { once: true }
      );
    }
    evictOverflowToasts() {
      while (this.toasts.size > MAX_TOASTS) {
        const oldest = this.toasts.values().next().value;
        if (oldest) this.remove(oldest);
      }
    }
  }
  const Toast = new ToastManager();
  CoreEvents.on(AppEvents.SHOW_TOAST, (payload) => {
    Toast.show(payload.message, payload.type);
  });

  const buildCardMetaParts = (actress, site, tags, hasAvatar = false) => {
    const parts = [];
    if (actress && !hasAvatar) parts.push(actress);
    if (site) parts.push(site.toUpperCase());
    if (tags) parts.push(...tags.slice(0, 5));
    return parts.filter(Boolean);
  };
  const resolveHealthIndicatorMeta = (lastCheck, now = Date.now()) => {
    const isRecent = now - lastCheck < 24 * 60 * 60 * 1e3;
    return {
      isRecent,
      title: isRecent ? t("tooltipHealthRecent") : `${t("tooltipHealthStale")}: ${new Date(lastCheck).toLocaleDateString()}`,
      symbol: isRecent ? "?" : "?",
      color: isRecent ? "var(--fc2-success)" : "var(--fc2-text-dim)",
      opacity: isRecent ? "1" : "0.5"
    };
  };
  const createActressUnit = (info) => h(
    "div",
    {
      className: "actress-unit",
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 var(--fc2-btn-pad-xs)",
        cursor: info.url ? "pointer" : "default",
        transition: "transform var(--fc2-motion-fast) var(--fc2-ease-standard), opacity var(--fc2-motion-fast) var(--fc2-ease-standard)"
      },
      title: info.name,
      onclick: (e) => {
        if (info.url) {
          e.stopPropagation();
          BrowserService.openTab(info.url);
        }
      }
    },
    info.avatarUrl ? h("img", {
      src: info.avatarUrl,
      className: "actress-avatar-original",
      style: {
        width: "var(--fc2-size-avatar)",
        height: "var(--fc2-size-avatar)",
        borderRadius: "50%",
        objectFit: "cover",
        border: "calc(var(--fc2-border-width) * 2) solid rgba(var(--fc2-primary-rgb), var(--fc2-opacity-muted))",
        boxShadow: "var(--fc2-shadow-md)",
        backgroundColor: "rgba(var(--fc2-primary-rgb), var(--fc2-opacity-subtle))"
      },
      onerror: function() {
        this.style.display = "none";
      }
    }) : null,
    info.name ? h(
      "span",
      {
        className: "actress-name-original",
        style: {
          marginTop: "var(--fc2-space-sm)",
          fontSize: "var(--fc2-text-base)",
          fontWeight: "var(--fc2-font-bold)",
          color: "var(--fc2-text-bright)",
          textAlign: "center",
          textShadow: "var(--fc2-text-shadow)",
          maxWidth: "calc(var(--fc2-space-2xl) + var(--fc2-space-2xl) + var(--fc2-btn-pad-xs))",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }
      },
      info.name
    ) : null
  );
  const createActressProfile = (data) => {
    const list = data.actresses || [];
    if (list.length === 0 && (data.actress || data.actressAvatarUrl)) {
      list.push({ name: data.actress || "", avatarUrl: data.actressAvatarUrl, url: data.actressUrl });
    }
    if (list.length === 0) return null;
    return h(
      "div",
      {
        className: "actress-profile-badge-original",
        style: {
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: "var(--fc2-space-sm)",
          marginBottom: "var(--fc2-space-md)"
        }
      },
      ...list.map(createActressUnit)
    );
  };
  const createHealthIndicator = (lastCheck) => {
    if (!lastCheck) return null;
    const meta = resolveHealthIndicatorMeta(lastCheck);
    return h(
      "div",
      {
        className: "fc2-health-indicator",
        style: {
          marginLeft: "calc(var(--fc2-space-sm) - var(--fc2-space-xxs))",
          fontSize: "calc(var(--fc2-text-xs) - var(--fc2-space-xxs))",
          color: meta.color,
          opacity: meta.opacity,
          display: "flex"
        },
        title: meta.title,
        "aria-label": meta.title
      },
      meta.symbol
    );
  };
  const createBadge = (id, classes) => {
    const badge = Button$1(
      "",
      id,
      void 0,
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        UIUtils.copyButtonBehavior(badge, id, t("tooltipCopied"));
        badge.classList.add("pulse-once");
        setTimeout(() => badge.classList.remove("pulse-once"), TIMING.UI_ANIMATION_BADGE);
      },
      classes.fc2IdBadge,
      { ariaLabel: t("tooltipCopyId"), title: t("tooltipCopyId"), dataTitle: id }
    );
    const text = badge.querySelector(`.${classes.buttonText}`);
    if (text) text.textContent = id;
    return badge;
  };

  const isPrimaryAction$1 = (action) => {
    const actions = State.proxy.cardPrimaryActions;
    return Array.isArray(actions) ? actions.includes(action) : ["id", "viewed", "play", "preview", "magnet", "external"].includes(action);
  };
  const resolveActionLabel = (button) => button.getAttribute("data-title") || button.getAttribute("aria-label") || button.getAttribute("title") || button.textContent?.trim() || t("btnMoreOptions");
  const resolveActionIcon = (button) => {
    const icon = button.querySelector(".fc2-icon");
    return icon ? icon.cloneNode(true) : IconGear;
  };
  const buildMoreActionOptions = (links) => Array.from(links.children).filter((child) => child instanceof HTMLElement).filter((el) => window.getComputedStyle(el).display !== "none").map((button, index) => ({
    id: `${button.className || "action"}-${index}`,
    name: resolveActionLabel(button),
    icon: resolveActionIcon(button),
    onSelect: () => button.click()
  }));
  const createPortalButton = (data, minimal) => {
    if (minimal || !State.proxy.enableExternalLinks) return null;
    return Button$1(
      IconLink,
      t("labelExternalLinks"),
      void 0,
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        const portals = PortalService.getAvailablePortals(data);
        if (portals.length > 0) {
          const options = portals.map((p) => ({
            ...p,
            icon: PORTAL_ICONS[p.id] || IconLink
          }));
          ActionSheet.show(t("labelExternalLinks"), options);
        } else {
          Toast.show(t("alertNoExternalLinks"), "info");
        }
      },
      "btn-external-links",
      { ariaLabel: t("tooltipOpenExternalLinks"), title: t("tooltipOpenExternalLinks") }
    );
  };
  const isJavdbCard = (data) => {
    return data.site === "javdb" || data.articleUrl?.includes("://javdb.com/") || window.location.hostname.includes("javdb");
  };
  const applyAdaptiveJavdbPreviewRatio = (img, data) => {
    if (!isJavdbCard(data)) return;
    const container = img.parentElement;
    if (!container) return;
    const { naturalWidth, naturalHeight } = img;
    if (!naturalWidth || !naturalHeight) return;
    if (naturalWidth / naturalHeight > 1.05) {
      container.style.setProperty("--fc2-javdb-cover-ratio", `${naturalWidth} / ${naturalHeight}`);
      return;
    }
    container.style.removeProperty("--fc2-javdb-cover-ratio");
  };
  const createThumbnail = (data, classes) => {
    const img = h("img", {
      alt: data.title || data.id,
      className: `${classes.staticPreview} ${classes.previewElement}`,
      onload: function() {
        this.parentElement?.classList.replace("fc2-skeleton", "is-loaded");
        applyAdaptiveJavdbPreviewRatio(this, data);
        this.classList.add("fc2-reveal-content");
      }
    });
    const initialSrc = data.primaryImageUrl || data.imageUrl || UI_CONSTANTS.PLACEHOLDER_IMAGE;
    smartLoadMedia(img, initialSrc, data.imageUrl, data.fallbackImageUrl, ...data.extraFallbacks || []);
    return h(
      data.articleUrl ? "a" : "div",
      {
        className: `${classes.videoPreviewContainer} fc2-skeleton`,
        ...data.articleUrl ? { href: data.articleUrl, target: "_blank" } : {}
      },
      img
    );
  };
  const createHeaderRow = (idBadge, healthIndicator, statusToggle) => h(
    "div",
    { className: "card-meta-row" },
    h("div", { className: "card-identity-slot" }, idBadge),
    h(
      "div",
      { className: "card-status-slot", onclick: (e) => e.stopPropagation() },
      healthIndicator,
      statusToggle?.element ? statusToggle.element : null
    )
  );
  const createPlayButton = (data) => {
    return Button$1(
      IconPlay,
      t("labelPlayPreview"),
      void 0,
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        const card = event.currentTarget.closest(
          `.${Config.CLASSES.processedCard}`
        );
        if (card) {
          const playEvent = new CustomEvent("fc2-play-fullscreen", {
            detail: { card, data },
            bubbles: true,
            composed: true
          });
          card.dispatchEvent(playEvent);
        }
      },
      Config.CLASSES.btnPlayFullscreen,
      { iconOnly: true, size: "micro" }
    );
  };
  const createGalleryButton = (data) => {
    return Button$1(
      IconImages,
      t("extraPreviewTitle"),
      void 0,
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        const card = event.currentTarget.closest(
          `.${Config.CLASSES.processedCard}`
        );
        if (card) {
          const galleryEvent = new CustomEvent("fc2-open-gallery", {
            detail: { card, data },
            bubbles: true,
            composed: true
          });
          card.dispatchEvent(galleryEvent);
        }
      },
      "btn-open-gallery",
      { iconOnly: true, size: "micro" }
    );
  };
  const buildActionArea = (data, minimal, links) => {
    const portalEntry = createPortalButton({ id: data.id, type: data.type }, minimal);
    const playEntry = createPlayButton(data);
    const galleryEntry = data.type === "fc2" ? createGalleryButton(data) : null;
    if (galleryEntry && !isPrimaryAction$1("preview")) {
      links.appendChild(galleryEntry.cloneNode(true));
    }
    if (playEntry && !isPrimaryAction$1("play")) {
      links.appendChild(playEntry.cloneNode(true));
    }
    return {
      portalEntry,
      playEntry,
      galleryEntry,
      secondaryActions: h(
        "div",
        { className: "resource-links-container card-secondary-actions" },
        playEntry,
        galleryEntry,
        portalEntry,
        Button$1(
          IconGear,
          t("btnMoreOptions"),
          void 0,
          (event) => {
            event.preventDefault();
            event.stopPropagation();
            const options = buildMoreActionOptions(links);
            if (options.length > 0) ActionSheet.show(t("btnMoreOptions"), options);
          },
          "btn-more-actions",
          { ariaLabel: t("btnMoreOptions"), title: t("btnMoreOptions") }
        )
      )
    };
  };
  const createCardTitle = (data, classes) => {
    if (!data.title) return null;
    return data.articleUrl ? h(
      "a",
      {
        className: classes.customTitle,
        href: data.articleUrl,
        target: "_blank",
        title: data.title,
        onclick: () => GlobalHistoryManager.toggleWatched(data.id, true)
      },
      data.title
    ) : h("span", { className: classes.customTitle, title: data.title }, data.title);
  };
  const createEnhancedCardMeta = (classes, items) => items.length === 0 ? null : h("div", { className: classes.cardMeta, title: items.join(" · ") }, items.join(" · "));
  const createEnhancedCardView = ({
    classes,
    data,
    onCardClick,
    minimal,
    suppressNativeDetailMeta = false
  }) => {
    const statusToggle = State.proxy.enableHistory ? StatusToggle(data.id, "watched") : null;
    const idBadge = createBadge(data.id, classes);
    const healthIndicator = createHealthIndicator(data.lastCheck);
    const primaryLinks = h("div", { className: "resource-links-container card-primary-actions" });
    const links = h("div", {
      className: "resource-links-container card-overflow-actions card-action-stash",
      hidden: true
    });
    if (!isPrimaryAction$1("id")) links.appendChild(idBadge);
    if (!isPrimaryAction$1("viewed") && statusToggle?.element) links.appendChild(statusToggle.element);
    const { portalEntry, galleryEntry, playEntry, secondaryActions } = buildActionArea(data, minimal, links);
    const shouldShowMeta = (data.site || "").toLowerCase() !== "fd2ppv";
    const meta = shouldShowMeta ? createEnhancedCardMeta(
      classes,
      buildCardMetaParts(
        data.actress,
        data.site,
        data.tags,
        !!data.actressAvatarUrl || !!(data.actresses && data.actresses.length > 0)
      )
    ) : null;
    const card = h("div", {
      className: `${classes.processedCard} ${classes.cardRebuilt} ${data.type}-card ${data.customClass || ""} ${minimal ? "is-minimal" : ""}`,
      dataset: {
        id: data.id,
        type: data.type,
        previewSlug: data.previewSlug || "",
        enhSearching: "true",
        hasMagnet: "false"
      },
      onclick: onCardClick
    });
    const selectionOverlay = h(
      "div",
      { className: "card-selection-overlay" },
      h("input", {
        type: "checkbox",
        className: "card-selection-checkbox",
        onclick: (e) => e.stopPropagation()
})
    );
    const infoArea = h(
      "div",
      { className: classes.infoArea },
      createHeaderRow(idBadge, healthIndicator, statusToggle),
      suppressNativeDetailMeta ? null : createActressProfile(data),
      suppressNativeDetailMeta ? null : createCardTitle(data, classes),
      data.preservedIconsHTML ? h("div", { className: classes.preservedIconsContainer, innerHTML: data.preservedIconsHTML }) : null,
      meta,
      h("div", { className: classes.cardActionRow }, secondaryActions),
      links
    );
    card.appendChild(createThumbnail(data, classes));
    card.appendChild(infoArea);
    card.appendChild(selectionOverlay);
    return {
      card,
      links,
      primaryLinks,
      secondaryLinks: secondaryActions,
      meta,
      idBadge,
      healthIndicator,
      statusToggle,
      portalEntry,
      galleryEntry,
      playEntry,
      selectionOverlay
    };
  };
  const redistributeCardActions = (primaryLinks, links, secondaryLinks, controls, isPrimaryActionFn) => {
    const moreBtn = secondaryLinks.querySelector(".btn-more-actions");
    const moveToTarget = (btn, isPrimary, container) => {
      if (!btn) return;
      if (isPrimary) {
        container.appendChild(btn);
      } else {
        links.appendChild(btn);
      }
    };
    if (!isPrimaryActionFn("id") && !links.contains(controls.idBadge)) links.appendChild(controls.idBadge);
    if (controls.statusToggle?.element && !isPrimaryActionFn("viewed") && !links.contains(controls.statusToggle.element))
      links.appendChild(controls.statusToggle.element);
    const playBtn = controls.playEntry || primaryLinks.querySelector(`.${Config.CLASSES.btnPlayFullscreen}`) || links.querySelector(`.${Config.CLASSES.btnPlayFullscreen}`) || secondaryLinks.querySelector(`.${Config.CLASSES.btnPlayFullscreen}`);
    moveToTarget(playBtn, isPrimaryActionFn("play"), secondaryLinks);
    const galleryBtn = controls.galleryEntry || primaryLinks.querySelector(".btn-open-gallery") || links.querySelector(".btn-open-gallery") || secondaryLinks.querySelector(".btn-open-gallery");
    moveToTarget(galleryBtn, isPrimaryActionFn("preview"), secondaryLinks);
    const portalBtn = controls.portalEntry || primaryLinks.querySelector(".btn-external-links") || links.querySelector(".btn-external-links") || secondaryLinks.querySelector(".btn-external-links");
    moveToTarget(portalBtn, isPrimaryActionFn("external"), secondaryLinks);
    if (moreBtn instanceof HTMLElement) {
      secondaryLinks.appendChild(moreBtn);
    }
    const magnetBtn = findMagnetButton(primaryLinks) || findMagnetButton(links) || findMagnetButton(secondaryLinks);
    moveToTarget(magnetBtn, isPrimaryActionFn("magnet"), secondaryLinks);
    if (moreBtn instanceof HTMLElement) {
      const hasOverflow = Array.from(links.children).some((child) => child.style.display !== "none");
      moreBtn.style.display = hasOverflow ? "" : "none";
    }
  };

  const DOUBLE_TAP_DELTA = 10;
  const SWIPE_NAV_THRESHOLD = 50;
  const GALLERY_SLIDESHOW_INTERVAL = 3e3;
  const isGalleryImage = (preview) => preview?.type === "image";
  const getGalleryWrappedIndex = (currentIndex, length, delta) => {
    if (length <= 0) {
      return 0;
    }
    return (currentIndex + delta + length) % length;
  };
  const buildGallerySearchUrl = (src) => EXTERNAL_URLS.GOOGLE_LENS.replace("{url}", encodeURIComponent(src));
  const getGalleryStageStyle = (isZoomed) => isZoomed ? "overflow: auto; align-items: flex-start; justify-content: flex-start;" : "";
  const getGalleryImageStyle = (isZoomed) => isZoomed ? "cursor: zoom-out; max-width: none; max-height: none; width: auto; height: auto; margin: auto; transform: scale(1);" : "cursor: zoom-in; width: 100%; height: 100%; object-fit: contain;";
  const resolveGalleryTouchAction = ({
    diffX,
    diffY,
    isZoomed,
    item,
    lastTapTime,
    now
  }) => {
    const isDoubleTap = Boolean(item) && isGalleryImage(item) && now - lastTapTime < TIMING.UI_TRANSITION_NORMAL && Math.abs(diffX) < DOUBLE_TAP_DELTA && Math.abs(diffY) < DOUBLE_TAP_DELTA;
    if (isDoubleTap) {
      return "toggleZoom";
    }
    if (isZoomed) {
      return "none";
    }
    if (diffY > UI_CONSTANTS.SWIPE_DISMISS_THRESHOLD && Math.abs(diffX) < SWIPE_NAV_THRESHOLD) {
      return "dismiss";
    }
    if (Math.abs(diffX) > SWIPE_NAV_THRESHOLD && Math.abs(diffY) < SWIPE_NAV_THRESHOLD) {
      return diffX > 0 ? "prev" : "next";
    }
    return "none";
  };

  const createGalleryCounter = (total) => {
    const current = h("span", { style: { color: "var(--fc2-text-bright)", fontWeight: "var(--fc2-font-bold)" } }, "1");
    const counter = h(
      "div",
      { className: "enh-viewer-counter" },
      current,
      h("span", { style: { opacity: "var(--fc2-opacity-dim)", margin: "0 var(--fc2-space-xs)" } }, "/"),
      h("span", {}, total.toString())
    );
    return { counter, current };
  };
  const createGalleryThumbStrip = (previews, currentIndex) => {
    const thumbItems = previews.map((preview, index) => {
      const el = preview.type === "image" ? h("img", {}) : h("video", { muted: true });
      smartLoadMedia(el, preview.src);
      return h(
        "div",
        {
          className: `enh-thumb-item ${index === currentIndex ? "active" : ""}`,
          "data-idx": index
        },
        el
      );
    });
    const thumbStrip = h("div", { className: "enh-viewer-thumbs" }, ...thumbItems);
    return { thumbItems, thumbStrip };
  };
  const createGalleryNavigation = (previews) => {
    if (previews.length <= 1) {
      return { navNext: null, navPrev: null };
    }
    return {
      navPrev: h(
        "div",
        { className: "enh-viewer-nav prev" },
        h("span", { className: "fc2-icon", style: { transform: "scale(1.5)" }, innerHTML: IconChevronLeft })
      ),
      navNext: h(
        "div",
        { className: "enh-viewer-nav next" },
        h("span", { className: "fc2-icon", style: { transform: "scale(1.5)" }, innerHTML: IconChevronRight })
      )
    };
  };
  const createGalleryElements = (previews, currentIndex) => {
    const container = h("div", { className: "enh-viewer-backdrop" });
    const closeBtn = h(
      "div",
      { className: "enh-viewer-close" },
      h("span", { className: "fc2-icon", innerHTML: IconXmark })
    );
    const btnSlideshow = h("button", {
      className: "enh-viewer-action pb-play",
      title: t("gallerySlideshow"),
      innerHTML: IconPlay
    });
    const btnSearch = h("button", {
      className: "enh-viewer-action pb-search",
      title: t("gallerySearch"),
      innerHTML: IconImageSearch
    });
    const actionBar = h("div", { className: "enh-viewer-actions" }, btnSlideshow, btnSearch);
    const { counter, current } = createGalleryCounter(previews.length);
    const stage = h("div", { className: "enh-viewer-stage" });
    const { thumbItems, thumbStrip } = createGalleryThumbStrip(previews, currentIndex);
    const { navNext, navPrev } = createGalleryNavigation(previews);
    if (previews.length <= 1) {
      btnSlideshow.style.display = "none";
      counter.style.display = "none";
      thumbStrip.style.display = "none";
    }
    container.append(stage, closeBtn, actionBar, counter, thumbStrip);
    if (navPrev && navNext) {
      container.append(navPrev, navNext);
    }
    return {
      btnSearch,
      btnSlideshow,
      closeBtn,
      container,
      counterCurrent: current,
      navNext,
      navPrev,
      stage,
      thumbItems,
      thumbStrip
    };
  };
  const scrollActiveThumbIntoView = (thumbStrip) => {
    const activeThumb = thumbStrip.querySelector(".enh-thumb-item.active");
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  };

  const createGalleryCloseHandler = (refs, state, cleanupFns, getDeferredScrollTimer, clearDeferredScrollTimer, stopSlideshow, isActive, clearActive) => {
    let isClosed = false;
    return () => {
      if (isClosed) {
        return;
      }
      isClosed = true;
      const deferredScrollTimer = getDeferredScrollTimer();
      if (deferredScrollTimer !== null) {
        window.clearTimeout(deferredScrollTimer);
        clearDeferredScrollTimer();
      }
      stopSlideshow(state, refs.btnSlideshow);
      cleanupFns.forEach((cleanup) => cleanup());
      refs.container.remove();
      if (isActive()) {
        clearActive();
      }
    };
  };
  const attachThumbSelection = (refs, state, render) => {
    refs.thumbItems.forEach((thumbItem, index) => {
      thumbItem.onclick = (event) => {
        event.stopPropagation();
        if (index !== state.index) {
          state.isZoomed = false;
          state.index = index;
          render("init");
        }
      };
    });
  };
  const bindGalleryControls = (previews, refs, state, render, close, navigate, toggleSlideshow) => {
    refs.closeBtn.onclick = (event) => {
      event.stopPropagation();
      close();
    };
    refs.stage.onclick = (event) => {
      if (event.target === refs.stage) {
        close();
      }
    };
    refs.btnSlideshow.onclick = (event) => {
      event.stopPropagation();
      toggleSlideshow(state, refs.btnSlideshow, () => navigate("next"));
    };
    refs.btnSearch.onclick = (event) => {
      event.stopPropagation();
      const item = previews[state.index];
      if (isGalleryImage(item)) {
        BrowserService.openTab(buildGallerySearchUrl(item.src));
      }
    };
    attachThumbSelection(refs, state, render);
    if (refs.navPrev && refs.navNext) {
      refs.navPrev.onclick = (event) => {
        event.stopPropagation();
        navigate("prev");
      };
      refs.navNext.onclick = (event) => {
        event.stopPropagation();
        navigate("next");
      };
    }
  };
  const scheduleInitialThumbSync = (refs, close, setDeferredScrollTimer, isActive) => {
    setDeferredScrollTimer(
      window.setTimeout(() => {
        setDeferredScrollTimer(null);
        if (isActive(close)) {
          scrollActiveThumbIntoView(refs.thumbStrip);
        }
      }, 50)
    );
  };

  let activeGalleryClose = null;
  const createViewerState = (startIndex) => ({
    index: startIndex,
    isZoomed: false,
    isTransitioning: false,
    slideshowInterval: null,
    lastTapTime: 0,
    touchStartX: 0,
    touchStartY: 0
  });
  const preloadGalleryItems = (previews) => {
    previews.forEach((item) => {
      if (item.type === "image") {
        const image = new Image();
        image.src = item.src;
        return;
      }
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = item.src;
    });
  };
  const setSlideshowButtonState = (button, isActive) => {
    button.classList.toggle("active", isActive);
    button.innerHTML = isActive ? IconPause : IconPlay;
  };
  const stopSlideshow = (state, button) => {
    if (state.slideshowInterval) {
      clearInterval(state.slideshowInterval);
      state.slideshowInterval = null;
    }
    setSlideshowButtonState(button, false);
  };
  const toggleSlideshow = (state, button, onAdvance) => {
    if (state.slideshowInterval) {
      stopSlideshow(state, button);
      return;
    }
    state.slideshowInterval = window.setInterval(onAdvance, GALLERY_SLIDESHOW_INTERVAL);
    setSlideshowButtonState(button, true);
  };
  const createGalleryStageMedia = (item, isZoomed, onToggleZoom) => {
    const el = item.type === "video" ? h("video", {
      controls: true,
      autoplay: true,
      loop: true,
      onclick: (event) => event.stopPropagation(),
      style: "width: 100%; height: 100%; object-fit: contain; border-radius: var(--fc2-space-sm);"
    }) : h("img", {
      draggable: false,
      onclick: (event) => {
        event.stopPropagation();
        onToggleZoom();
      },
      style: getGalleryImageStyle(isZoomed)
    });
    smartLoadMedia(el, item.src);
    return el;
  };
  const renderGalleryView = (previews, state, refs, render, direction = "init") => {
    if (state.isTransitioning) {
      return;
    }
    const item = previews[state.index];
    if (!item) {
      return;
    }
    state.isTransitioning = true;
    refs.counterCurrent.textContent = (state.index + 1).toString();
    refs.btnSearch.style.display = isGalleryImage(item) ? "flex" : "none";
    refs.thumbItems.forEach((thumbItem, index) => thumbItem.classList.toggle("active", index === state.index));
    scrollActiveThumbIntoView(refs.thumbStrip);
    refs.stage.className = `enh-viewer-stage slide-${direction}`;
    refs.stage.style.cssText = getGalleryStageStyle(state.isZoomed);
    refs.stage.textContent = "";
    refs.stage.appendChild(
      createGalleryStageMedia(item, state.isZoomed, () => {
        state.isZoomed = !state.isZoomed;
        render("init");
      })
    );
    window.setTimeout(() => {
      state.isTransitioning = false;
    }, TIMING.UI_TRANSITION_NORMAL);
  };
  const attachKeyboardNavigation = (previews, state, render, close) => {
    const keyHandler = (event) => {
      const key = event.key.toLowerCase();
      if (key === "a" || key === "arrowleft") {
        event.stopPropagation();
        state.isZoomed = false;
        state.index = getGalleryWrappedIndex(state.index, previews.length, -1);
        render("prev");
      } else if (key === "d" || key === "arrowright") {
        event.stopPropagation();
        state.isZoomed = false;
        state.index = getGalleryWrappedIndex(state.index, previews.length, 1);
        render("next");
      } else if (key === "escape") {
        event.stopPropagation();
        close();
      }
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  };
  const attachTouchNavigation = (container, previews, state, render, close) => {
    const onTouchStart = (event) => {
      const touch = event.changedTouches[0];
      if (!touch) {
        return;
      }
      state.touchStartX = touch.screenX;
      state.touchStartY = touch.screenY;
    };
    const onTouchEnd = (event) => {
      const touch = event.changedTouches[0];
      if (!touch) {
        return;
      }
      const diffX = touch.screenX - state.touchStartX;
      const diffY = touch.screenY - state.touchStartY;
      const now = Date.now();
      const action = resolveGalleryTouchAction({
        diffX,
        diffY,
        isZoomed: state.isZoomed,
        item: previews[state.index],
        lastTapTime: state.lastTapTime,
        now
      });
      state.lastTapTime = now;
      if (action === "toggleZoom") {
        event.preventDefault();
        state.isZoomed = !state.isZoomed;
        render("init");
        return;
      }
      if (action === "dismiss") {
        close();
        return;
      }
      if (action === "prev" || action === "next") {
        state.index = getGalleryWrappedIndex(state.index, previews.length, action === "prev" ? -1 : 1);
        render(action);
      }
    };
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchend", onTouchEnd, { passive: false });
    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchend", onTouchEnd);
    };
  };
  const openGalleryViewer = (_id, previews, startIndex = 0) => {
    if (!previews.length) {
      return;
    }
    activeGalleryClose?.();
    const state = createViewerState(startIndex);
    preloadGalleryItems(previews);
    const refs = createGalleryElements(previews, state.index);
    const cleanupFns = [];
    let deferredScrollTimer = null;
    const close = createGalleryCloseHandler(
      refs,
      state,
      cleanupFns,
      () => deferredScrollTimer,
      () => {
        deferredScrollTimer = null;
      },
      stopSlideshow,
      () => activeGalleryClose === close,
      () => {
        activeGalleryClose = null;
      }
    );
    activeGalleryClose = close;
    const render = (direction = "init") => renderGalleryView(previews, state, refs, render, direction);
    const navigate = (direction) => {
      state.isZoomed = false;
      state.index = getGalleryWrappedIndex(state.index, previews.length, direction === "prev" ? -1 : 1);
      render(direction);
    };
    bindGalleryControls(previews, refs, state, render, close, navigate, toggleSlideshow);
    cleanupFns.push(attachKeyboardNavigation(previews, state, render, close));
    cleanupFns.push(attachTouchNavigation(refs.container, previews, state, render, close));
    scheduleInitialThumbSync(
      refs,
      close,
      (timer) => {
        deferredScrollTimer = timer;
      },
      (candidateClose) => activeGalleryClose === candidateClose
    );
    render();
    UIHost.add(refs.container);
  };

  class BatchSelectionService {
    selectedIds = new Set();
    onInit() {
      State.on("isSelectionMode", (value) => {
        if (!value) {
          this.clearSelection();
        }
      });
    }
    onCleanup() {
      this.clearSelection();
    }
    toggleSelection(id) {
      if (this.selectedIds.has(id)) {
        this.selectedIds.delete(id);
      } else {
        this.selectedIds.add(id);
      }
      this.emitUpdate();
    }
    setSelection(id, selected) {
      if (selected) {
        this.selectedIds.add(id);
      } else {
        this.selectedIds.delete(id);
      }
      this.emitUpdate();
    }
    isSelected(id) {
      return this.selectedIds.has(id);
    }
    getSelectedIds() {
      return Array.from(this.selectedIds);
    }
    getCount() {
      return this.selectedIds.size;
    }
    clearSelection() {
      if (this.selectedIds.size === 0) return;
      this.selectedIds.clear();
      this.emitUpdate();
    }
    selectAll(ids) {
      ids.forEach((id) => this.selectedIds.add(id));
      this.emitUpdate();
    }
    emitUpdate() {
      CoreEvents.emit(AppEvents.SELECTION_CHANGED, {
        ids: this.getSelectedIds(),
        count: this.getCount()
      });
    }
  }
  const SelectionService = AppContainer.register("selection-service", new BatchSelectionService());

  const hasCensoredIndicator = (preservedIconsHTML) => Boolean(preservedIconsHTML?.includes(PATTERNS.CENSORED_INDICATOR));
  const applyInitialCardState = (card, data, initialState, options, classes) => {
    applyCardVisualState(
      card,
      {
        hasMagnet: initialState.hasMagnet,
        isSearching: initialState.isSearching,
        isViewed: HistoryService.has(data.id, "watched"),
        isCensored: hasCensoredIndicator(data.preservedIconsHTML)
      },
      classes
    );
    if (!options.skipFilters) {
      GlobalFilterManager.applyCardVisibility(card, initialState.hasMagnet);
      GlobalFilterManager.applyCensoredFilter(card);
      GlobalFilterManager.applyHistoryVisibility(card);
    }
  };
  const isPrimaryAction = (action) => {
    const actions = State.proxy.cardPrimaryActions;
    return Array.isArray(actions) ? actions.includes(action) : ["id", "viewed", "play", "preview", "magnet", "external"].includes(action);
  };
  const applyCardVisualState = (card, state, classes) => {
    if (typeof state.isSearching === "boolean") {
      if (state.isSearching) card.dataset.enhSearching = "true";
      else delete card.dataset.enhSearching;
    }
    if (typeof state.hasMagnet === "boolean") {
      card.dataset.hasMagnet = String(state.hasMagnet);
      card.classList.toggle(classes.noMagnet || "no-magnet", !state.hasMagnet);
    }
    if (typeof state.isViewed === "boolean") card.classList.toggle(classes.isViewed, state.isViewed);
    if (typeof state.isBlocked === "boolean" && classes.isBlocked)
      card.classList.toggle(classes.isBlocked, state.isBlocked);
    if (typeof state.isCensored === "boolean" && classes.isCensored)
      card.classList.toggle(classes.isCensored, state.isCensored);
  };
  const updateMagnetState = ({
    card,
    links,
    primaryLinks,
    secondaryLinks,
    state,
    options,
    classes,
    controls,
    isPrimaryActionFn
  }) => {
    const targetContainer = isPrimaryActionFn("magnet") ? secondaryLinks : links;
    if (state.hasMagnet && state.magnetUrl && !hasMagnetButton(targetContainer)) {
      MagnetButton(targetContainer, state.magnetUrl);
    }
    applyCardVisualState(card, { hasMagnet: state.hasMagnet }, classes);
    if (!options.skipFilters) GlobalFilterManager.applyCardVisibility(card, state.hasMagnet);
    redistributeCardActions(primaryLinks, links, secondaryLinks, controls, isPrimaryActionFn);
  };
  const attachCardPreviewListeners = (card, data) => {
    card.addEventListener("fc2-play-fullscreen", async (e) => {
      const btn = e.target.closest(".fc2-enh-btn");
      const iconContainer = btn?.querySelector(".fc2-icon");
      const originalIcon = iconContainer?.innerHTML;
      if (iconContainer) iconContainer.innerHTML = IconSpinner;
      if (btn) btn.classList.add(Config.CLASSES.btnLoading);
      try {
        const exists = await PreviewService.checkExistence(data.id, data.type, data.previewSlug || void 0);
        if (exists) {
          const url = PreviewService.getPreviewUrl(data.id, data.type, data.previewSlug || void 0);
          openGalleryViewer(data.id, [{ type: "video", src: url }]);
        } else {
          Toast.show(t("alertNoVideoPreview"), "info");
        }
      } catch {
        Toast.show(t("alertPreviewLoadFailed"), "error");
      } finally {
        if (iconContainer && originalIcon) iconContainer.innerHTML = originalIcon;
        if (btn) btn.classList.remove(Config.CLASSES.btnLoading);
      }
    });
    card.addEventListener("fc2-open-gallery", async (e) => {
      const btn = e.target.closest(".fc2-enh-btn");
      const iconContainer = btn?.querySelector(".fc2-icon");
      const originalIcon = iconContainer?.innerHTML;
      if (iconContainer) iconContainer.innerHTML = IconSpinner;
      if (btn) btn.classList.add(Config.CLASSES.btnLoading);
      try {
        const res = await ScraperService.fetchExtraPreviews(data.id);
        if (res?.length) {
          openGalleryViewer(data.id, res);
        } else {
          Toast.show(t("alertNoPreview"), "info");
        }
      } catch {
        Toast.show(t("alertPreviewLoadFailed"), "error");
      } finally {
        if (iconContainer && originalIcon) iconContainer.innerHTML = originalIcon;
        if (btn) btn.classList.remove(Config.CLASSES.btnLoading);
      }
    });
  };
  const bindSelectionLogic = (data, card, checkbox, syncSelection) => {
    const unbindSelection = CoreEvents.on(AppEvents.SELECTION_CHANGED, () => {
      syncSelection();
    });
    const unbindMode = State.on("isSelectionMode", (value) => {
      card.classList.toggle("selection-mode-active", !!value);
      if (!value) {
        syncSelection();
      }
    });
    checkbox.onchange = () => {
      SelectionService.setSelection(data.id, checkbox.checked);
    };
    syncSelection();
    card.classList.toggle("selection-mode-active", !!State.proxy.isSelectionMode);
    return () => {
      unbindSelection();
      unbindMode();
    };
  };
  const handleCardUpdate = (change, data, card, options, classes, controls, isPrimaryActionFn, links, primaryLinks, secondaryLinks, statusToggle) => {
    if (!change) return;
    const state = ViewStore.get(data.id);
    if (change.key === "isSearching") {
      applyCardVisualState(card, { isSearching: state.isSearching }, classes);
      if (!state.isSearching && !options.skipFilters) {
        GlobalFilterManager.applyCardVisibility(card, state.hasMagnet);
      }
    } else if (change.key === "hasMagnet" || change.key === "magnetUrl") {
      updateMagnetState({
        card,
        links,
        primaryLinks,
        secondaryLinks,
        state,
        options,
        classes,
        controls,
        isPrimaryActionFn
      });
    } else if (change.key === "status") {
      const status = String(change.value || "");
      applyCardVisualState(card, { isViewed: status === "watched" }, classes);
      if (!options.skipFilters) GlobalFilterManager.applyHistoryVisibility(card);
      statusToggle?.update?.(change);
    }
  };
  const EnhancedCard = (data, options = {}) => {
    const classes = Config.CLASSES;
    const originalId = data.id;
    data.id = GlobalHistoryManager.normalizeId(originalId);
    const suppressNativeDetailMeta = Boolean(options.skipFilters);
    const handleSelectionToggle = (id) => {
      SelectionService.toggleSelection(id);
    };
    const {
      card,
      links,
      primaryLinks,
      secondaryLinks,
      statusToggle,
      idBadge,
      portalEntry,
      galleryEntry,
      playEntry,
      selectionOverlay
    } = createEnhancedCardView({
      classes,
      data,
      minimal: Boolean(options.minimal),
      suppressNativeDetailMeta,
      onCardClick: (event) => {
        if (State.proxy.isSelectionMode) {
          event.preventDefault();
          event.stopPropagation();
          handleSelectionToggle(data.id);
          return;
        }
        if (!event.target.closest(`.${classes.resourceBtn}`)) {
          void GlobalHistoryManager.setWatched(data.id);
        }
      }
    });
    const checkbox = selectionOverlay.querySelector("input");
    attachCardPreviewListeners(card, data);
    const unbindConfig = CoreEvents.on(AppEvents.CONFIG_CHANGED, ({ key }) => {
      if (key === "cardPrimaryActions") {
        redistributeCardActions(
          primaryLinks,
          links,
          secondaryLinks,
          { idBadge, statusToggle, portalEntry, galleryEntry, playEntry },
          isPrimaryAction
        );
      }
    });
    redistributeCardActions(
      primaryLinks,
      links,
      secondaryLinks,
      { idBadge, statusToggle, portalEntry, galleryEntry, playEntry },
      isPrimaryAction
    );
    const syncSelection = () => {
      const isSelected = SelectionService.isSelected(data.id);
      checkbox.checked = isSelected;
      card.classList.toggle("is-selected", isSelected);
    };
    const unbindSelection = bindSelectionLogic(data, card, checkbox, syncSelection);
    const initialState = ViewStore.get(data.id);
    applyInitialCardState(card, data, initialState, options, classes);
    if (initialState.hasMagnet && initialState.magnetUrl) {
      updateMagnetState({
        card,
        links,
        primaryLinks,
        secondaryLinks,
        state: initialState,
        options,
        classes,
        controls: { idBadge, statusToggle, portalEntry, galleryEntry, playEntry },
        isPrimaryActionFn: isPrimaryAction
      });
    }
    const destroyHooks = [];
    const component = {
      id: data.id,
      element: card,
      update: (raw) => {
        handleCardUpdate(
          raw,
          data,
          card,
          options,
          classes,
          { idBadge, statusToggle, portalEntry, galleryEntry, playEntry },
          isPrimaryAction,
          links,
          primaryLinks,
          secondaryLinks,
          statusToggle
        );
      },
      addDestroyHook: (fn) => destroyHooks.push(fn),
      destroy: () => {
        unbindConfig();
        unbindSelection();
        statusToggle?.destroy?.();
        PreviewLogic.disposePreviewForCard(card);
        destroyHooks.forEach((hook) => {
          try {
            hook();
          } catch {
          }
        });
      }
    };
    ComponentRegistry.register(component);
    return {
      finalElement: card,
      linksContainer: links,
      primaryLinksContainer: primaryLinks,
      secondaryLinksContainer: secondaryLinks,
      newCard: card,
      component
    };
  };

  const ActressButton = (cont, actress) => {
    if (!cont || !actress || cont.querySelector(".btn-actress")) return;
    const actBtn = Button$1(
      null,
      actress,
      void 0,
      () => UIUtils.copyButtonBehavior(actBtn, actress, t("tooltipCopied")),
      "btn-actress"
    );
    const actionRow = cont.querySelector(`.${Config.CLASSES.cardActionRow}`);
    const links = cont.querySelector(`.${Config.CLASSES.resourceLinksContainer}`);
    if (actionRow) cont.insertBefore(actBtn, actionRow);
    else if (links) cont.insertBefore(actBtn, links);
    else cont.appendChild(actBtn);
    const toolbar = cont.closest(".enh-toolbar");
    if (toolbar) {
      toolbar.dataset.layout = "with-actress";
    }
  };

  const UIToolbar = {
    createDetailToolbar: (data, addPreviewButton, addPlayButton) => {
      const { id, type, actress } = data;
      const C = Config.CLASSES;
      const toolbar = h("div", {
        className: "enh-toolbar enh-toolbar--detail",
        dataset: {
          layout: actress ? "with-actress" : "without-actress"
        }
      });
      const infoArea = h("div", { className: C.infoArea });
      const ctrls = h("div", { className: "card-top-right-controls toolbar-section toolbar-section-controls" });
      if (State.proxy.enableHistory) {
        const toggle = StatusToggle(id, "watched");
        if (toggle && toggle.element) ctrls.appendChild(toggle.element);
      }
      const badge = Button$1(
        "",
        id,
        void 0,
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          UIUtils.copyButtonBehavior(badge, id, t("tooltipCopied"));
        },
        C.fc2IdBadge
      );
      const btnText = badge.querySelector(`.${C.buttonText}`);
      if (btnText) btnText.textContent = id;
      ctrls.appendChild(badge);
      const links = h("div", {
        className: `${C.resourceLinksContainer} toolbar-section toolbar-section-links`.trim()
      });
      addPlayButton(links, id, type, data.previewSlug);
      if (type === "fc2" && State.proxy.loadExtraPreviews) {
        addPreviewButton(links, id);
      }
      if (State.proxy.enableExternalLinks) {
        const trigger = Button$1(IconLink, t("labelExternalLinks"), void 0, (e) => {
          e.preventDefault();
          e.stopPropagation();
          const portals = PortalService.getAvailablePortals({ id, type });
          if (portals.length > 0) {
            const options = portals.map((p) => ({
              ...p,
              icon: PORTAL_ICONS[p.id] || IconLink
            }));
            ActionSheet.show(`${id} - ${t("labelExternalLinks")}`, options);
          }
        });
        links.appendChild(trigger);
      }
      infoArea.appendChild(ctrls);
      if (actress) ActressButton(infoArea, actress);
      infoArea.appendChild(links);
      toolbar.appendChild(infoArea);
      void MagnetService.fetchMagnet(id, type).then((url) => {
        if (url && url.startsWith("magnet:?")) {
          MagnetButton(links, url);
        }
      });
      return toolbar;
    }
  };

  const UIBuilder = {
    createEnhancedCard: EnhancedCard,
    addMagnetButton: MagnetButton,
    addActressButton: ActressButton,
    addPlayButton: (container, id, type, previewSlug) => {
      if (!container || container.querySelector(`.${Config.CLASSES.btnPlayFullscreen}`)) return;
      const btn = Button$1(
        IconPlay,
        t("labelPlayPreview"),
        void 0,
        async (e) => {
          const target = e.currentTarget;
          if (target.classList.contains(Config.CLASSES.btnLoading)) return;
          target.classList.add(Config.CLASSES.btnLoading);
          try {
            const exists = await PreviewService.checkExistence(id, type, previewSlug);
            if (exists) {
              const url = PreviewService.getPreviewUrl(id, type, previewSlug);
              openGalleryViewer(id, [{ type: "video", src: url }]);
            } else {
              Toast.show(t("alertNoVideoPreview"), "info");
            }
          } catch {
            Toast.show(t("alertPreviewLoadFailed"), "error");
          } finally {
            target.classList.remove(Config.CLASSES.btnLoading);
          }
        },
        Config.CLASSES.btnPlayFullscreen,
        { iconOnly: true, size: "micro" }
      );
      container.appendChild(btn);
    },
    addPreviewButton: (container, id) => {
      if (!container || container.querySelector(".btn-preview")) return;
      const btn = Button$1(
        IconImages,
        t("labelPreview"),
        void 0,
        async (e) => {
          const target = e.currentTarget;
          const card = target.closest(`.${Config.CLASSES.processedCard}`);
          if (card) {
            PreviewLogic.loadVideoProgressive(card);
          } else {
            if (target.classList.contains(Config.CLASSES.btnLoading)) return;
            target.classList.add(Config.CLASSES.btnLoading);
            try {
              const res = await ScraperService.fetchExtraPreviews(id);
              if (res?.length) {
                openGalleryViewer(id, res);
              } else {
                Toast.show(t("alertNoPreview"), "info");
              }
            } finally {
              target.classList.remove(Config.CLASSES.btnLoading);
            }
          }
        },
        "btn-preview",
        { iconOnly: true, size: "micro" }
      );
      container.appendChild(btn);
    },
    injectHistoryHandler: (handler) => {
      UIBuilder._historyHandler = handler;
    },
    createDetailToolbar: UIToolbar.createDetailToolbar,
createElement: (tag) => document.createElement(tag)
  };
  const BaseBuilder = UIBuilder;

  const log$g = Logger.scope("Reactive");
  class ReactiveController {
    bindings = new Map();
    cleanups = [];
    disposed = false;
    constructor() {
      const unbind = State.on(({ prop, value }) => {
        if (this.disposed) return;
        this.bindings.forEach((options, el) => {
          if (options.key === prop) {
            this.updateElement(el, options, value);
          }
        });
      });
      this.cleanups.push(unbind);
    }
    get isDisposed() {
      return this.disposed;
    }
    bind(el, options) {
      if (this.disposed) {
        log$g.warn("Attempted to bind on a disposed controller");
        return;
      }
      this.bindings.set(el, options);
      const currentValue = State.proxy[options.key];
      this.updateElement(el, options, currentValue);
      const inputEl = el;
      const isTextControl = el.tagName === "TEXTAREA" || el.tagName === "INPUT" && ["text", "password", "url", "email", "number", "range"].includes(el.type);
      const eventType = isTextControl ? "input" : "change";
      const listener = () => {
        if (this.disposed) return;
        let newValue;
        if (options.mode === "checked") {
          newValue = el.checked;
        } else if (options.mode === "toggle") {
          newValue = !State.proxy[options.key];
        } else {
          const raw = inputEl.value;
          newValue = typeof State.proxy[options.key] === "number" ? Number(raw) : raw;
        }
        State.proxy[options.key] = newValue;
        if (options.onChange) options.onChange(newValue);
      };
      el.addEventListener(eventType, listener);
      this.cleanups.push(() => el.removeEventListener(eventType, listener));
    }
    updateElement(el, options, value) {
      const inputEl = el;
      switch (options.mode) {
        case "checked":
          el.checked = !!value;
          break;
        case "value":
          inputEl.value = String(value ?? "");
          break;
        case "text":
          el.textContent = String(value ?? "");
          break;
        case "html":
          el.textContent = String(value ?? "");
          break;
        default:
          inputEl.value = String(value ?? "");
      }
    }
    bindList(container, options) {
      if (this.disposed) return;
      const render = () => {
        const list = State.proxy[options.key] || [];
        container.textContent = "";
        list.forEach((item, index) => {
          container.appendChild(options.renderItem(item, index));
        });
      };
      const unbind = State.on(({ prop }) => {
        if (this.disposed) return;
        if (prop === options.key) render();
      });
      this.cleanups.push(unbind);
      render();
    }
    listen(key, callback) {
      if (this.disposed) return;
      const unbind = State.on(({ prop, value }) => {
        if (this.disposed) return;
        if (prop === key) callback(value);
      });
      this.cleanups.push(unbind);
      callback(State.proxy[key]);
    }
    dispose() {
      if (this.disposed) return;
      this.disposed = true;
      this.cleanups.forEach((fn) => fn());
      this.cleanups = [];
      this.bindings.clear();
    }
    static create() {
      return new ReactiveController();
    }
  }

  class CardOrchestrator {
    observer = null;
    observedElements = new WeakSet();
    pendingTasks = new Map();
    static LOAD_DELAY_MS = 150;
    resolveCardTargets(cardEl) {
      const C = Config.CLASSES;
      const processedCard = cardEl.classList.contains(C.processedCard) ? cardEl : cardEl.querySelector(`.${C.processedCard}`);
      const hostCard = cardEl.classList.contains(C.processedCard) ? cardEl.parentElement?.closest(`.${C.cardRebuilt}:not(.${C.processedCard})`) : cardEl;
      return { hostCard, processedCard };
    }
    init() {
      this.initObserver();
    }
    disconnect() {
      this.observer?.disconnect();
      this.observer = null;
      this.observedElements = new WeakSet();
      this.clearAllPendingTasks();
    }
    clearAllPendingTasks() {
      this.pendingTasks.forEach((timeoutId) => window.clearTimeout(timeoutId));
      this.pendingTasks.clear();
    }
    initObserver() {
      this.observer?.disconnect();
      this.observedElements = new WeakSet();
      this.clearAllPendingTasks();
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const el = entry.target;
            if (entry.isIntersecting) {
              if (this.pendingTasks.has(el)) {
                window.clearTimeout(this.pendingTasks.get(el));
              }
              const timeoutId = window.setTimeout(() => {
                this.pendingTasks.delete(el);
                this.processVisibleCard(el);
                this.observer?.unobserve(el);
              }, CardOrchestrator.LOAD_DELAY_MS);
              this.pendingTasks.set(el, timeoutId);
            } else {
              if (this.pendingTasks.has(el)) {
                window.clearTimeout(this.pendingTasks.get(el));
                this.pendingTasks.delete(el);
              }
            }
          });
        },
        { rootMargin: "200px" }
      );
    }
    observe(el) {
      if (this.observedElements.has(el)) return;
      this.observer?.observe(el);
      this.observedElements.add(el);
    }
    processVisibleCard(cardEl) {
      this.applyCardFilters(cardEl);
      GlobalFilterManager.requestRefresh();
    }
    applyCardFilters(cardEl) {
      const C = Config.CLASSES;
      const id = cardEl.dataset.id;
      const { hostCard, processedCard } = this.resolveCardTargets(cardEl);
      if (State.proxy.enableHistory && id) {
        const isViewed = HistoryService.has(id, "watched");
        const isDownloaded = HistoryService.has(id, "downloaded");
        const status = isViewed ? "watched" : isDownloaded ? "downloaded" : "none";
        if (ViewStore.get(id).status !== status) {
          ViewStore.set(id, "status", status);
        }
        hostCard?.classList.toggle(C.isViewed, isViewed);
        processedCard?.classList.toggle(C.isViewed, isViewed);
      }
      GlobalFilterManager.applyHistoryVisibility(hostCard || cardEl);
      const hasMagnet = hasMagnetButton(processedCard || cardEl) || (processedCard || cardEl).dataset.hasMagnet === "true";
      GlobalFilterManager.applyCardVisibility(hostCard || cardEl, hasMagnet);
      GlobalFilterManager.applyCensoredFilter(hostCard || cardEl);
    }
    setupLazyResources(container, id, type, el) {
      let hydrated = false;
      const hydrate = () => {
        if (hydrated) return;
        hydrated = true;
        if (type === "fc2" && State.proxy.loadExtraPreviews) {
          void UIBuilder.addPreviewButton(container, id);
        }
      };
      const onceHover = () => {
        hydrate();
        el.removeEventListener("mouseenter", onceHover);
        el.removeEventListener("focusin", onceFocus);
      };
      const onceFocus = () => {
        hydrate();
        el.removeEventListener("mouseenter", onceHover);
        el.removeEventListener("focusin", onceFocus);
      };
      el.addEventListener("mouseenter", onceHover, { passive: true });
      el.addEventListener("focusin", onceFocus);
      const components = ComponentRegistry.getInstances(id);
      const comp = components.find((c) => c.element === el);
      if (comp && typeof comp.addDestroyHook === "function") {
        comp.addDestroyHook(() => {
          el.removeEventListener("mouseenter", onceHover);
          el.removeEventListener("focusin", onceFocus);
        });
      }
    }
  }
  const GlobalCardOrchestrator = new CardOrchestrator();

  const log$f = Logger.scope("CardEnhancement");
  class CardEnhancementServiceImplementation {
    initialized = false;
    cleanupFns = [];
    init() {
      if (this.initialized) return;
      this.initialized = true;
      log$f.debug("Initializing CardEnhancementService");
      this.cleanupFns.push(
        CoreEvents.on(AppEvents.CARD_DISCOVERED, (payload) => {
          this.enhance(payload);
        })
      );
      this.cleanupFns.push(
        CoreEvents.on(AppEvents.VIEW_REFRESH_REQUESTED, ({ reason }) => {
          log$f.info(`Refresh requested: ${reason}`);
          this.refreshAll();
        })
      );
    }
    destroy() {
      if (!this.initialized && this.cleanupFns.length === 0) return;
      this.initialized = false;
      this.cleanupFns.splice(0).forEach((cleanup) => cleanup());
    }
    enhance(payload) {
      const { id, data, host, extraUi, postProcess } = payload;
      try {
        ViewStore.set(id, "isSearching", true);
        const { finalElement, newCard } = UIBuilder.createEnhancedCard({
          ...data,
          ...extraUi
        });
        if (postProcess) {
          postProcess(finalElement, newCard, Config.CLASSES);
        }
        host.replaceChildren(finalElement);
        this.applyFilters(host, newCard, id);
        CoreEvents.emit(AppEvents.CARD_READY, {
          id,
          type: payload.type,
          el: host
        });
      } catch (error) {
        log$f.error(`Failed to enhance card ${id}`, error);
      }
    }
    applyFilters(host, newCard, id) {
      if (newCard.classList.contains(Config.CLASSES.isCensored)) host.classList.add(Config.CLASSES.isCensored);
      if (newCard.classList.contains(Config.CLASSES.isViewed)) host.classList.add(Config.CLASSES.isViewed);
      const state = ViewStore.get(id);
      GlobalFilterManager.applyCardVisibility(host, state.hasMagnet || !State.proxy.enableMagnets);
      GlobalFilterManager.applyCensoredFilter(host);
      GlobalFilterManager.applyHistoryVisibility(host);
    }
    refreshAll() {
      const cards = document.querySelectorAll(`.${Config.CLASSES.processedCard}`);
      log$f.debug(`Refreshing ${cards.length} cards`);
      cards.forEach((c) => {
        const host = c;
        const id = host.dataset.id;
        if (!id) return;
        const status = HistoryService.getStatus(id);
        ViewStore.set(id, "status", status || "none");
        host.classList.toggle(Config.CLASSES.isViewed, status === "watched");
        const state = ViewStore.get(id);
        GlobalFilterManager.applyCardVisibility(host, state.hasMagnet || !State.proxy.enableMagnets);
        GlobalFilterManager.applyHistoryVisibility(host);
        GlobalFilterManager.applyCensoredFilter(host);
      });
    }
  }
  const CardEnhancementService = new CardEnhancementServiceImplementation();

  const getPrimaryActionKeys = (override) => Array.isArray(override) ? override : Array.isArray(State.proxy.cardPrimaryActions) ? State.proxy.cardPrimaryActions : ["id", "viewed", "magnet", "external"];
  const resolveDetailActionContainers = (_primaryLinksContainer, secondaryLinksContainer, primaryActionsOverride) => {
    const primaryActions = getPrimaryActionKeys(primaryActionsOverride);
    const visibleActionContainer = secondaryLinksContainer;
    return {
      magnetContainer: primaryActions.includes("magnet") ? visibleActionContainer : secondaryLinksContainer,
      previewContainer: primaryActions.includes("preview") ? visibleActionContainer : secondaryLinksContainer
    };
  };
  const createDetailCardMount = (data, options = {}, primaryActionsOverride) => {
    const { finalElement, linksContainer, primaryLinksContainer, secondaryLinksContainer } = UIBuilder.createEnhancedCard(data, {
      ...options,
      skipFilters: true
    });
    finalElement.classList.add("is-detail");
    return {
      finalElement,
      linksContainer,
      primaryLinksContainer,
      secondaryLinksContainer,
      ...resolveDetailActionContainers(primaryLinksContainer, secondaryLinksContainer, primaryActionsOverride)
    };
  };
  const attachFetchedDetailMagnet = async (id, type, magnetContainer, bindings = {}) => {
    const fetchMagnet = bindings.fetchMagnet || MagnetService.fetchMagnet.bind(MagnetService);
    const addMagnetButton = bindings.addMagnetButton || UIBuilder.addMagnetButton;
    const url = await fetchMagnet(id, type);
    if (!url || !url.startsWith("magnet:?")) {
      return;
    }
    addMagnetButton(magnetContainer, url);
  };
  const attachDetailPreviewButton = (id, type, previewContainer, bindings = {}) => {
    const addPreviewButton = bindings.addPreviewButton || UIBuilder.addPreviewButton;
    const loadExtraPreviews = typeof bindings.loadExtraPreviews === "boolean" ? bindings.loadExtraPreviews : State.proxy.loadExtraPreviews;
    if (type === "fc2" && previewContainer.querySelector(".btn-open-gallery")) {
      return;
    }
    if (type === "fc2" && loadExtraPreviews) {
      addPreviewButton(previewContainer, id);
    }
  };

  const normalizeDetailCardHost = (host, options) => {
    host.style.display = "block";
    if (options.width) {
      host.style.width = options.width;
    } else if (options.width !== "") {
      host.style.width = "100%";
    }
    host.style.padding = "0";
    host.style.margin = "0";
    host.style.lineHeight = "0";
    host.style.background = "transparent";
    host.style.height = "auto";
    host.style.overflow = "visible";
    if (options.maxWidth) {
      host.style.maxWidth = options.maxWidth;
    }
    if (!options.hideExistingChildren) {
      return;
    }
    Array.from(host.children).forEach((child) => {
      if (child instanceof HTMLElement) {
        child.style.display = "none";
      }
    });
  };
  const mountDetailCardEnhancement = (host, data, options = {}) => {
    const mount = createDetailCardMount(data, options.options, options.primaryActionsOverride);
    normalizeDetailCardHost(host, options);
    if (options.hideExistingChildren) {
      host.appendChild(mount.finalElement);
    } else {
      host.replaceChildren(mount.finalElement);
    }
    return mount;
  };

  class DetailOrchestrator {
    static MOUNT_ATTR = "data-enh-detail-mounted";
    static initialized = false;
    static cleanupFns = [];
    static init() {
      if (this.initialized) return;
      this.initialized = true;
      this.cleanupFns.push(
        CoreEvents.on(AppEvents.DETAIL_ENHANCEMENT_REQUESTED, ({ siteName, config, observer }) => {
          void this.enhance(siteName, config, observer);
        })
      );
    }
    static destroy() {
      if (!this.initialized && this.cleanupFns.length === 0) return;
      this.initialized = false;
      this.cleanupFns.splice(0).forEach((cleanup) => cleanup());
    }
    static async enhance(siteName, config, observer) {
      try {
        const anchor = config.anchorElement || (config.anchorSelector ? document.querySelector(config.anchorSelector) : null);
        if (!anchor) return;
        const info = config.idExtractor();
        if (!info) return;
        const mountId = `${info.type}:${info.id}`;
        if (anchor.getAttribute(this.MOUNT_ATTR) === mountId) return;
        const metadata = config.metadataExtractor(info.id, info.type);
        const defaultTitle = info.type === "fc2" ? `FC2-PPV-${info.id}` : `${String(info.type).toUpperCase()}-${info.id}`;
        const cardData = {
          id: info.id,
          type: info.type,
          title: metadata.title || defaultTitle,
          ...metadata
        };
        let containers;
        if (config.mode === "card") {
          const result = mountDetailCardEnhancement(anchor, cardData, config.mountOptions);
          containers = {
            mainElement: result.finalElement,
            magnetContainer: result.magnetContainer,
            previewContainer: result.previewContainer,
            linksContainer: result.linksContainer
          };
        } else {
          const toolbar = UIBuilder.createDetailToolbar(
            {
              id: cardData.id,
              type: cardData.type,
              title: cardData.title || "",
              actress: cardData.actress,
              previewSlug: cardData.previewSlug || void 0
            },
            UIBuilder.addPreviewButton,
            UIBuilder.addPlayButton
          );
          toolbar.setAttribute("data-enh-site-toolbar", siteName.toLowerCase());
          toolbar.setAttribute("data-enh-detail-id", mountId);
          anchor.after(toolbar);
          const infoArea = toolbar.querySelector(`.${Config.CLASSES.infoArea}`);
          containers = {
            mainElement: toolbar,
            magnetContainer: toolbar,
            previewContainer: toolbar,
            linksContainer: infoArea
          };
        }
        anchor.setAttribute(this.MOUNT_ATTR, mountId);
        if (!config.skipDefaultServices) {
          this.attachServices(info.id, info.type, containers);
        }
        if (config.onMounted) {
          const api = {
            addActressButton: UIBuilder.addActressButton,
            addMagnetButton: UIBuilder.addMagnetButton,
            addPreviewButton: UIBuilder.addPreviewButton,
            attachFetchedMagnet: (id, type, container) => attachFetchedDetailMagnet(id, type, container),
            attachDetailPreviewButton: (id, type, container) => attachDetailPreviewButton(id, type, container)
          };
          await config.onMounted(info.id, info.type, containers, api);
        }
        if (observer) {
          observer.disconnect();
        }
      } catch (err) {
        Logger.warn(siteName, "Detail enhancement failed", err);
      }
    }
    static attachServices(id, type, containers) {
      const videoType = type;
      attachDetailPreviewButton(id, videoType, containers.previewContainer, {
        loadExtraPreviews: State.proxy.loadExtraPreviews
      });
      attachFetchedDetailMagnet(id, videoType, containers.magnetContainer);
    }
  }

  const log$e = Logger.scope("UI");
  BaseBuilder.injectHistoryHandler((id) => GlobalHistoryManager.toggleWatched(id, true));
  class UIManager {
    cleanupFns = [];
    isValidMagnetUrl(url) {
      return typeof url === "string" && url.startsWith("magnet:?");
    }
    canAttachGalleryPreview(el, type) {
      return el.classList.contains("is-detail") && type === "fc2" && State.proxy.loadExtraPreviews;
    }
    isPrimaryAction(action) {
      const actions = State.proxy.cardPrimaryActions;
      return Array.isArray(actions) && actions.length > 0 ? actions.includes(action) : ["id", "viewed", "magnet", "external"].includes(action);
    }
    async resolveMagnetForCard(id, type, source) {
      try {
        const cached = await Repository.cache.get(id);
        if (isNegativeMagnetCacheValue(cached)) {
          CoreEvents.emit(AppEvents.MAGNET_FAILED, { id });
          return;
        }
        if (this.isValidMagnetUrl(cached)) {
          CoreEvents.emit(AppEvents.MAGNET_FOUND, { id, url: cached });
          return;
        }
        await MagnetService.fetchMagnet(id, type);
      } catch (err) {
        log$e.error(`Magnet lookup failed for ${id} via ${source}`, err);
        CoreEvents.emit(AppEvents.MAGNET_FAILED, { id });
      }
    }
    queueMagnetLookup(id, type, source) {
      ViewStore.set(id, "isSearching", true);
      void this.resolveMagnetForCard(id, type, source);
    }
    onInit() {
      this.onCleanup();
      log$e.debug("Initializing UI interactions");
      SmartTooltips.init();
      GlobalClick.init();
      CardEnhancementService.init();
      DetailOrchestrator.init();
      GlobalCardOrchestrator.init();
      PreviewLogic.registerContainer(document.body);
      this.bindStateListeners();
      this.bindEventListeners();
      this.updateGlobalClasses();
      this.applyAccentColor();
      this.updateVisibilityForCards();
    }
    scanAndTriggerInitialSearches(options = {}) {
      if (!State.proxy.enableMagnets) return;
      const { includeSettledNoMagnet = false } = options;
      const C = Config.CLASSES;
      const existingCards = document.querySelectorAll(`.${C.cardRebuilt}`);
      existingCards.forEach((card) => {
        const el = card;
        const processed = el.querySelector(`.${C.processedCard}`);
        if (!processed) return;
        const { id, type } = processed.dataset;
        const hasMagnet = processed.dataset.hasMagnet === "true";
        const isSearching = processed.dataset.enhSearching === "true";
        const shouldLookup = includeSettledNoMagnet ? !hasMagnet : isSearching && !hasMagnet;
        if (id && type && shouldLookup) {
          this.queueMagnetLookup(id, type, includeSettledNoMagnet ? "enable-magnets" : "site-ready-scan");
        }
      });
    }
    onCleanup() {
      GlobalCardOrchestrator.disconnect();
      this.cleanupFns.splice(0).forEach((cleanup) => {
        cleanup();
      });
      CardEnhancementService.destroy();
      DetailOrchestrator.destroy();
      SmartTooltips.destroy();
      GlobalClick.destroy();
    }
    bindStateListeners() {
      this.cleanupFns.push(State.on("showViewedBtn", () => this.updateGlobalClasses()));
      this.cleanupFns.push(State.on("showIdBadge", () => this.updateGlobalClasses()));
      this.cleanupFns.push(State.on("cardDensity", () => this.updateGlobalClasses()));
      this.cleanupFns.push(State.on("accentColor", () => this.applyAccentColor()));
      this.cleanupFns.push(
        State.on("enableMagnets", (value) => {
          this.updateVisibilityForCards();
          if (value) {
            this.scanAndTriggerInitialSearches({ includeSettledNoMagnet: true });
          }
        })
      );
      const filterProps = [
        "hideViewed",
        "hideNoMagnet",
        "hideCensored"
      ];
      filterProps.forEach((prop) => {
        this.cleanupFns.push(State.on(prop, () => this.updateVisibilityForCards()));
      });
    }
    bindEventListeners() {
      this.cleanupFns.push(
        CoreEvents.on(AppEvents.CARD_READY, async ({ id, type, el }) => {
          GlobalCardOrchestrator.observe(el);
          GlobalCardOrchestrator.applyCardFilters(el);
          await HistoryService.waitUntilReady();
          GlobalCardOrchestrator.applyCardFilters(el);
          if (this.canAttachGalleryPreview(el, type)) {
            const primaryContainer = el.querySelector(".card-primary-actions");
            const secondaryContainer = el.querySelector(".card-secondary-actions");
            const stashContainer = el.querySelector(".card-overflow-actions");
            const container = (this.isPrimaryAction("preview") ? primaryContainer : secondaryContainer) || secondaryContainer || primaryContainer || stashContainer;
            if (container) {
              GlobalCardOrchestrator.setupLazyResources(container, id, type, el);
            }
          }
          if (State.proxy.enableMagnets) {
            this.queueMagnetLookup(id, type, "card-ready");
          } else {
            this.handleMagnetResult(id, null);
          }
        })
      );
      this.cleanupFns.push(CoreEvents.on(AppEvents.MAGNET_FOUND, (data) => this.handleMagnetResult(data.id, data.url)));
      this.cleanupFns.push(CoreEvents.on(AppEvents.MAGNET_FAILED, (data) => this.handleMagnetResult(data.id, null)));
      this.cleanupFns.push(
        CoreEvents.on(AppEvents.HISTORY_ADDED, (data) => this.syncUIWithHistory(data.id, data.status))
      );
      this.cleanupFns.push(CoreEvents.on(AppEvents.HISTORY_REMOVED, (data) => this.syncUIWithHistory(data.id, "none")));
      this.cleanupFns.push(CoreEvents.on(AppEvents.HISTORY_LOADED, () => this.updateVisibilityForCards()));
      this.cleanupFns.push(
        CoreEvents.on(AppEvents.SITE_READY, () => {
          GlobalCardOrchestrator.init();
          this.updateVisibilityForCards();
          this.scanAndTriggerInitialSearches();
        })
      );
    }
    updateGlobalClasses() {
      const isShowViewed = State.proxy.showViewedBtn !== false;
      const isShowId = State.proxy.showIdBadge !== false;
      document.body.classList.toggle("hide-viewed-btn", !isShowViewed);
      document.body.classList.toggle("hide-id-badge", !isShowId);
      document.body.classList.toggle("card-density-minimal", State.proxy.cardDensity === "minimal");
      document.body.classList.toggle("card-density-balanced", State.proxy.cardDensity === "balanced");
      document.body.classList.toggle("card-density-immersive", State.proxy.cardDensity === "immersive");
    }
    applyAccentColor() {
      const color = State.proxy.accentColor || "#ffffff";
      const rgb = this.hexToRgb(color);
      document.documentElement.style.setProperty("--fc2-primary", color);
      document.documentElement.style.setProperty("--fc2-primary-rgb", rgb);
    }
    hexToRgb(hex) {
      const h = hex.startsWith("#") ? hex : `#${hex}`;
      const r = parseInt(h.slice(1, 3), 16) || 0;
      const g = parseInt(h.slice(3, 5), 16) || 0;
      const b = parseInt(h.slice(5, 7), 16) || 0;
      return `${r}, ${g}, ${b}`;
    }
    updateVisibilityForCards() {
      const C = Config.CLASSES;
      document.querySelectorAll(`.${C.cardRebuilt}`).forEach((card) => {
        const cardEl = card;
        GlobalCardOrchestrator.observe(cardEl);
        GlobalCardOrchestrator.applyCardFilters(cardEl);
      });
      GlobalFilterManager.requestRefresh();
    }
    handleMagnetResult(id, url) {
      const resolvedUrl = this.isValidMagnetUrl(url) ? url : null;
      ViewStore.set(id, "isSearching", false);
      ViewStore.set(id, "hasMagnet", !!resolvedUrl);
      ViewStore.set(id, "magnetUrl", resolvedUrl);
      GlobalFilterManager.requestCardRefresh(id, !!resolvedUrl);
    }
    syncUIWithHistory(id, status) {
      ViewStore.set(IdNormalizer.normalize(id), "status", status);
      GlobalFilterManager.requestRefresh();
    }
  }
  AppContainer.register("ui-manager", new UIManager());

  const log$d = Logger.scope("Supabase");
  class SupabaseClient {
    static getConfig() {
      let url = State.proxy.supabaseUrl || "";
      if (url.endsWith("/")) url = url.slice(0, -1);
      url = url.trim();
      const key = (State.proxy.supabaseKey || "").trim();
      if (key) {
        const masked = key.length > 10 ? `${key.slice(0, 4)}...${key.slice(-4)}` : "***";
        log$d.debug(`Using API Key (len: ${key.length}, masked: ${masked})`);
      }
      return { url, key };
    }
    static async request(endpoint, method, body = null, headers = {}) {
      const { url, key } = this.getConfig();
      if (!url || !key) throw new Error("No Supabase config");
      const isAuth = endpoint.includes("/auth/v1/");
      const requestHeaders = {
        apikey: key,
        "Content-Type": "application/json",
        ...headers
      };
      if (!requestHeaders.Authorization && !isAuth) {
        requestHeaders.Authorization = `Bearer ${key}`;
      }
      log$d.trace(`Request: ${method} ${endpoint}`, { body, headers: requestHeaders });
      try {
        const response = await http(`${url}${endpoint}`, {
          method,
          headers: requestHeaders,
          data: body ?? void 0
        });
        log$d.trace(`Response: ${method} ${endpoint}`, { response });
        return response;
      } catch (e) {
        const err = e;
        if (err.status === 401 || err.status === 403) {
          const { key: key2 } = this.getConfig();
          let hint = "";
          if (!key2) hint = " (Key is missing)";
          else if (key2.length < 20) hint = ` (Key is suspiciously short: ${key2.length} chars)`;
          else if (!isAuth && !requestHeaders.Authorization) hint = " (Missing Authorization header)";
          log$d.error(`Supabase Request failed: ${method} ${endpoint}${hint}`, e);
        } else {
          log$d.error(`Request failed: ${method} ${endpoint}`, e);
        }
        throw e;
      }
    }
    static async getAuthHeader() {
      const jwt = GM_getValue(STORAGE_KEYS.SUPABASE_JWT);
      if (jwt) {
        try {
          const parts = jwt.split(".");
          if (parts.length >= 2 && parts[1]) {
            const payload = JSON.parse(atob(parts[1]));
            if (payload.exp * 1e3 > Date.now() + 6e4) return `Bearer ${jwt}`;
          }
        } catch {
        }
      }
      const refresh = GM_getValue(STORAGE_KEYS.SUPABASE_REFRESH);
      if (!refresh) return null;
      try {
        const data = await this.request(
          `${SUPABASE_ENDPOINTS.TOKEN}?grant_type=refresh_token`,
          "POST",
          { refresh_token: refresh }
        );
        if (data?.access_token) {
          GM_setValue(STORAGE_KEYS.SUPABASE_JWT, data.access_token);
          GM_setValue(STORAGE_KEYS.SUPABASE_REFRESH, data.refresh_token);
          GM_setValue(STORAGE_KEYS.SYNC_USER_ID, data.user.id);
          return `Bearer ${data.access_token}`;
        }
      } catch (e) {
        log$d.error("Token refresh failed", e);
        const err = e;
        if (err.status === 400 || err.status === 401 || err.response && err.response.includes("invalid_grant")) {
          [
            STORAGE_KEYS.SYNC_USER_ID,
            STORAGE_KEYS.SUPABASE_JWT,
            STORAGE_KEYS.SUPABASE_REFRESH,
            STORAGE_KEYS.CURRENT_USER_EMAIL,
            STORAGE_KEYS.LAST_SYNC_TS
          ].forEach((k) => GM_deleteValue(k));
        }
      }
      return null;
    }
  }

  const clearSupabaseSession = () => {
    [
      STORAGE_KEYS.SYNC_USER_ID,
      STORAGE_KEYS.SUPABASE_JWT,
      STORAGE_KEYS.SUPABASE_REFRESH,
      STORAGE_KEYS.CURRENT_USER_EMAIL,
      STORAGE_KEYS.LAST_SYNC_TS
    ].forEach((key) => {
      GM_deleteValue(key);
    });
  };
  const persistSupabaseLogin = (data) => {
    GM_setValue(STORAGE_KEYS.SYNC_USER_ID, data.user.id);
    GM_setValue(STORAGE_KEYS.SUPABASE_JWT, data.access_token);
    GM_setValue(STORAGE_KEYS.SUPABASE_REFRESH, data.refresh_token);
    GM_setValue(STORAGE_KEYS.CURRENT_USER_EMAIL, data.user.email);
    GM_setValue(STORAGE_KEYS.LAST_SYNC_TS, UI_CONSTANTS.DEFAULT_TIMESTAMP);
    return data.user;
  };
  const buildSupabaseUpsertPayload = async ({
    dirty,
    userId,
    onProgress,
    log,
    traceId
  }) => {
    if (dirty.length === 0) {
      return [];
    }
    onProgress?.({ phase: "Pushing local data", percent: 30 });
    const payload = await Promise.all(
      dirty.map(async (record) => {
        const item = {
          fc2_id: isNaN(Number(record.id)) ? record.id : parseInt(record.id, 10),
          last_watched_at: new Date(record.timestamp).toISOString(),
          status: record.status || "watched",
          is_deleted: !!record.is_deleted,
          user_id: userId || null
        };
        return item;
      })
    );
    if (payload.length > 1) {
      const firstKeys = Object.keys(payload[0]).sort().join(",");
      const lastKeys = Object.keys(payload[payload.length - 1]).sort().join(",");
      if (firstKeys !== lastKeys) {
        log.error("Payload keys inconsistent", { first: firstKeys, last: lastKeys }, traceId);
      }
    }
    return payload;
  };
  const normalizeSupabaseRemoteRows = (remote) => {
    const history = [];
    const deletes = [];
    remote.forEach((item) => {
      if (item.is_deleted) {
        deletes.push(String(item.fc2_id));
        return;
      }
      history.push({
        id: String(item.fc2_id),
        timestamp: new Date(item.last_watched_at).getTime(),
        status: item.status || "watched",
        updated_at: item.updated_at,
        is_deleted: 0,
        sync_dirty: 0
      });
    });
    return { history, deletes };
  };

  const notifyManualSyncStart = (isManual, syncingMessage) => {
    if (isManual) {
      CoreEvents.emit(AppEvents.SHOW_TOAST, { message: syncingMessage, type: "info" });
    }
  };
  const createSyncProviderErrorHandler = ({
    mode,
    defaultErrorMessage,
    manualErrorToastPrefix,
    translate,
    buildSummary,
    logError
  }) => {
    return (error, isManual, traceId) => {
      const err = error;
      logError?.(error, traceId);
      State.proxy.lastSyncResult = buildSummary({
        mode,
        status: SYNC_STATUS.ERROR,
        completedAt: ( new Date()).toISOString(),
        errorMessage: err.message || translate(defaultErrorMessage),
        translate
      });
      State.proxy.syncStatus = SYNC_STATUS.ERROR;
      if (isManual) {
        CoreEvents.emit(AppEvents.SHOW_TOAST, {
          message: translate(manualErrorToastPrefix) + (err.message || ""),
          type: "error"
        });
      }
    };
  };

  const defaultTranslate$1 = (key, params) => {
    const map = {
      syncSummaryFailed: "Sync failed",
      syncSummaryFailedWithMessage: "Sync failed: {message}",
      syncSummaryCompleted: "Sync completed",
      syncSummaryMode: "Mode: {mode}",
      syncSummaryPushed: "Pushed {count}",
      syncSummaryPulled: "Pulled {count}",
      syncSummaryDirty: "Dirty {count}"
    };
    let value = map[key] || key;
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value.replace(new RegExp(`{${paramKey}}`, "g"), String(paramValue));
      });
    }
    return value;
  };
  const buildSyncSummaryText = (input) => {
    const translate = input.translate || defaultTranslate$1;
    if (input.summary && !input.excludeMode) {
      return input.summary;
    }
    if (input.status === "error") {
      return input.errorMessage ? translate("syncSummaryFailedWithMessage", { message: input.errorMessage }) : translate("syncSummaryFailed");
    }
    const parts = [
      input.excludeMode ? null : translate("syncSummaryMode", { mode: input.mode }),
      typeof input.pushedCount === "number" ? translate("syncSummaryPushed", { count: input.pushedCount }) : null,
      typeof input.pulledCount === "number" ? translate("syncSummaryPulled", { count: input.pulledCount }) : null,
      typeof input.dirtyCount === "number" ? translate("syncSummaryDirty", { count: input.dirtyCount }) : null
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : translate("syncSummaryCompleted");
  };
  const createSyncResultSummary = (input) => ({
    mode: input.mode,
    status: input.status,
    startedAt: input.startedAt,
    completedAt: input.completedAt || ( new Date()).toISOString(),
    lastSyncTs: input.lastSyncTs,
    pushedCount: input.pushedCount,
    pulledCount: input.pulledCount,
    dirtyCount: input.dirtyCount,
    conflict: input.conflict || null,
    errorMessage: input.errorMessage,
    summary: buildSyncSummaryText(input),
    detailSummary: buildSyncSummaryText({ ...input, excludeMode: true })
  });

  const log$c = Logger.scope("Supabase");
  class SupabaseProviderImpl {
    name = "supabase";
    isSyncing = false;
    needsRetry = false;
    _onProgress = null;
    onInit() {
    }
    logout(silent = false) {
      clearSupabaseSession();
      if (!silent) {
        CoreEvents.emit(AppEvents.SHOW_TOAST, { message: t("alertLoggedOut"), type: "success" });
        setTimeout(() => location.reload(), TIMING.RELOAD_DELAY_FAST);
      }
    }
    async login(email, password) {
      const data = await SupabaseClient.request(
        `${SUPABASE_ENDPOINTS.TOKEN}?grant_type=password`,
        "POST",
        { email, password }
      );
      if (data?.access_token) {
        return persistSupabaseLogin(data);
      }
      throw new Error("Login failed");
    }
    async signup(email, password) {
      return SupabaseClient.request(SUPABASE_ENDPOINTS.SIGNUP, "POST", { email, password });
    }
    get onProgress() {
      return this._onProgress;
    }
    set onProgress(value) {
      this._onProgress = value;
    }
    async handleMissingAuth(auth, isManual, traceId) {
      if (auth) {
        return false;
      }
      log$c.debug("No auth session, skipping sync", void 0, traceId);
      State.proxy.syncStatus = SYNC_STATUS.IDLE;
      if (isManual) {
        CoreEvents.emit(AppEvents.SHOW_TOAST, { message: t("alertLoginRequired"), type: "warn" });
      }
      return true;
    }
    resolveLastSync(forceRefresh) {
      return forceRefresh ? UI_CONSTANTS.DEFAULT_TIMESTAMP : GM_getValue(STORAGE_KEYS.LAST_SYNC_TS, UI_CONSTANTS.DEFAULT_TIMESTAMP);
    }
    async finalizeSuccessfulSync(syncStartedAt, dirtyBeforeSync, preferRemote, isManual) {
      await HistoryService.load();
      GM_setValue(STORAGE_KEYS.LAST_SYNC_TS, syncStartedAt);
      State.proxy.lastSyncResult = createSyncResultSummary({
        mode: "supabase",
        status: SYNC_STATUS.SUCCESS,
        startedAt: syncStartedAt,
        completedAt: ( new Date()).toISOString(),
        lastSyncTs: syncStartedAt,
        pushedCount: preferRemote ? 0 : dirtyBeforeSync,
        dirtyCount: await Repository.db.history.where("sync_dirty").equals(1).count(),
        translate: t
      });
      State.proxy.syncStatus = SYNC_STATUS.SUCCESS;
      log$c.info("Sync completed");
      if (isManual) {
        CoreEvents.emit(AppEvents.SHOW_TOAST, { message: t("alertWebDAVSyncSuccess"), type: "success" });
      }
    }
    handleSyncError(error, isManual, traceId) {
      createSyncProviderErrorHandler({
        mode: "supabase",
        defaultErrorMessage: "syncErrorSupabase",
        manualErrorToastPrefix: "alertWebDAVSyncError",
        translate: t,
        buildSummary: (input) => createSyncResultSummary(input),
        logError: (err, trace) => log$c.error("Sync failed", err, trace)
      })(error, isManual, traceId);
    }
    async pushDirtyItems(auth, traceId) {
      const dirty = await Repository.db.history.where("sync_dirty").equals(1).limit(200).toArray();
      if (dirty.length === 0) {
        return;
      }
      const payload = await buildSupabaseUpsertPayload({
        dirty,
        userId: GM_getValue(STORAGE_KEYS.SYNC_USER_ID),
        onProgress: this._onProgress,
        log: log$c,
        traceId
      });
      await SupabaseClient.request(SUPABASE_ENDPOINTS.USER_HISTORY, "POST", payload, {
        Authorization: auth,
        Prefer: "resolution=merge-duplicates"
      });
      await Repository.db.history.where("id").anyOf(dirty.map((record) => record.id)).modify({ sync_dirty: 0, retry_count: 0 });
    }
    async pullRemoteHistory(auth, lastSync) {
      this._onProgress?.({ phase: "Fetching remote data", percent: 60 });
      let page = 0;
      let hasMore = true;
      while (hasMore) {
        const remote = await SupabaseClient.request(
          `${SUPABASE_ENDPOINTS.USER_HISTORY}?updated_at=gt.${encodeURIComponent(lastSync)}&select=fc2_id,last_watched_at,is_deleted,updated_at,status&order=updated_at.asc`,
          "GET",
          null,
          { Authorization: auth, Range: `${page * 1e3}-${(page + 1) * 1e3 - 1}` }
        );
        if (!remote?.length) {
          hasMore = false;
          continue;
        }
        const { history, deletes } = normalizeSupabaseRemoteRows(remote);
        await Repository.db.transaction("rw", Repository.db.history, async () => {
          if (history.length) {
            await Repository.db.history.bulkPut(history);
          }
          if (deletes.length) {
            await Repository.db.history.where("id").anyOf(deletes).modify({ is_deleted: 1, sync_dirty: 0 });
          }
        });
        hasMore = remote.length >= 1e3;
        if (hasMore) {
          page += 1;
        }
      }
    }
    async performSync(isManual = false, forceRefresh = false, preferRemote = false, traceId) {
      if (this.isSyncing) {
        this.needsRetry = true;
        return;
      }
      if (preferRemote) {
        forceRefresh = true;
      }
      Logger.group("Supabase", `Sync (Force: ${forceRefresh})`, traceId);
      this.isSyncing = true;
      notifyManualSyncStart(isManual, t("labelSyncing"));
      try {
        State.proxy.syncStatus = SYNC_STATUS.SYNCING;
        const auth = await SupabaseClient.getAuthHeader();
        if (await this.handleMissingAuth(auth, isManual, traceId)) {
          return;
        }
        const lastSync = this.resolveLastSync(forceRefresh);
        const syncStartedAt = ( new Date()).toISOString();
        const dirtyBeforeSync = await Repository.db.history.where("sync_dirty").equals(1).count();
        if (!preferRemote) {
          await this.pushDirtyItems(auth, traceId);
        }
        await this.pullRemoteHistory(auth, lastSync);
        await this.finalizeSuccessfulSync(syncStartedAt, dirtyBeforeSync, preferRemote, isManual);
      } catch (error) {
        this.handleSyncError(error, isManual, traceId);
      } finally {
        this.isSyncing = false;
        Logger.groupEnd();
        if (this.needsRetry) {
          this.needsRetry = false;
          this.performSync(false, false, false, traceId);
        }
      }
    }
  }
  const createSupabaseProvider = () => {
    return new SupabaseProviderImpl();
  };
  const SupabaseProvider = AppContainer.register("supabase-provider", createSupabaseProvider());

  class MergeEngine {
    static resolveRecordTime(updatedAt, fallbackTimestamp) {
      const parsed = updatedAt ? Date.parse(updatedAt) : Number.NaN;
      return Number.isFinite(parsed) ? parsed : fallbackTimestamp;
    }
    static normalizeHistoryItem(item) {
      const fallbackTime = typeof item.timestamp === "number" ? item.timestamp : 0;
      return {
        ...item,
        updated_at: new Date(this.resolveRecordTime(item.updated_at, fallbackTime)).toISOString()
      };
    }
    static merge(localHistory, remoteHistory, preferRemote = false) {
      const historyMap = new Map();
      if (remoteHistory) {
        remoteHistory.forEach((r) => {
          const normalized = this.normalizeHistoryItem(r);
          historyMap.set(normalized.id, normalized);
        });
      }
      for (const candidate of localHistory) {
        const local = this.normalizeHistoryItem(candidate);
        const remote = historyMap.get(local.id);
        if (!remote) {
          historyMap.set(local.id, local);
        } else {
          const localTime = new Date(local.updated_at).getTime();
          const remoteTime = new Date(remote.updated_at).getTime();
          if (!preferRemote && localTime >= remoteTime) {
            historyMap.set(local.id, local);
          }
        }
      }
      return {
        history: Array.from(historyMap.values())
      };
    }
  }

  const log$b = Logger.scope("WebDAV");
  class WebDAVClient {
    static getAuthHeader() {
      const { webdavUser, webdavPass } = State.proxy;
      return "Basic " + btoa(`${webdavUser}:${webdavPass}`);
    }
    static async request(method, url, body = null, headers = {}, responseType = "text") {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method,
          url,
          headers: { Authorization: this.getAuthHeader(), ...headers },
          data: body,
          responseType,
          timeout: 3e4,
          onload: resolve,
          onerror: reject,
          ontimeout: () => reject(new Error("WebDAV Timeout"))
        });
      });
    }
    static async ensureDirectory(baseUrl, fullPath) {
      const parts = fullPath.split("/").filter((p) => p && !p.includes("."));
      let currentPath = baseUrl.replace(/\/$/, "");
      for (const part of parts) {
        currentPath += "/" + part;
        try {
          const res = await this.request("PROPFIND", currentPath, null, { Depth: "0" });
          if (res.status === 404) {
            log$b.debug(`Creating directory: ${currentPath}`);
            await this.request("MKCOL", currentPath);
          }
        } catch (e) {
          log$b.error(`EnsureDirectory failed: ${currentPath}`, e);
        }
      }
    }
    static async fetchFile(url, isGzip) {
      try {
        const res = await this.request("GET", url, null, {}, isGzip ? "blob" : "text");
        if (res.status === 200) {
          const etag = res.responseHeaders.match(/etag:\s*(.*)/i)?.[1]?.replace(/"/g, "").trim();
          let text = res.responseText;
          if (isGzip && res.response) {
            text = await GzipService.decompress(res.response);
          }
          return { data: JSON.parse(text), etag };
        }
      } catch (e) {
        log$b.debug(`Fetch failed for ${url}`, e);
      }
      return null;
    }
  }

  const extractWebDAVEtag = (responseHeaders) => {
    return responseHeaders.match(/etag:\s*(.*)/i)?.[1]?.replace(/"/g, "").trim();
  };
  const shouldSkipWebDAVSync = ({
    preferRemote,
    forceRefresh,
    remoteETag,
    lastEtag,
    dirtyCount
  }) => {
    return !preferRemote && !forceRefresh && !!remoteETag && lastEtag === remoteETag && dirtyCount === 0;
  };
  const createWebDAVTarget = (webdavUrl, webdavPath, useGzip) => {
    const baseUrl = webdavUrl.replace(/\/$/, "");
    return `${baseUrl}/${webdavPath}${useGzip ? ".gz" : ""}`;
  };
  const createWebDAVSyncPayload = async ({
    mergedHistory,
    calculateChecksum
  }) => {
    return {
      version: 2,
      updated_at: ( new Date()).toISOString(),
      history: mergedHistory,
      checksum: await calculateChecksum(mergedHistory)
    };
  };
  const clearWebDAVSession = () => {
    [
      STORAGE_KEYS.WEBDAV_URL,
      STORAGE_KEYS.WEBDAV_USER,
      STORAGE_KEYS.WEBDAV_PASS,
      STORAGE_KEYS.WEBDAV_PATH,
      STORAGE_KEYS.WEBDAV_LAST_ETAG
    ].forEach((key) => {
      GM_deleteValue(key);
    });
  };
  const acquireWebDAVSyncLock = ({ isManual, emitLocked }) => {
    const now = Date.now();
    const lastLock = GM_getValue(STORAGE_KEYS.WEBDAV_SYNC_LOCK, 0);
    if (now - lastLock < 1e4) {
      if (isManual) {
        emitLocked();
      }
      return false;
    }
    GM_setValue(STORAGE_KEYS.WEBDAV_SYNC_LOCK, now);
    return true;
  };
  const shouldFetchWebDAVRemoteState = ({
    forceRefresh,
    preferRemote,
    lastEtag,
    remoteETag,
    headStatus
  }) => {
    return forceRefresh || preferRemote || !lastEtag || lastEtag !== remoteETag || headStatus === 404;
  };
  const verifyRemoteChecksum = async ({
    remoteData,
    calculateChecksum
  }) => {
    if (remoteData.checksum && await calculateChecksum(remoteData.history) !== remoteData.checksum) {
      throw new Error("Remote checksum mismatch");
    }
  };

  const log$a = Logger.scope("WebDAV");
  class WebDAVProviderImpl {
    name = "webdav";
    isSyncing = false;
    onInit() {
    }
    checkSyncLock(isManual) {
      return acquireWebDAVSyncLock({
        isManual,
        emitLocked: () => {
          CoreEvents.emit(AppEvents.SHOW_TOAST, { message: t("alertSyncLockActive"), type: "warn" });
        }
      });
    }
    resolveSyncTarget() {
      const { webdavUrl, webdavPath } = State.proxy;
      if (!webdavUrl || !webdavPath) {
        return null;
      }
      return { webdavUrl, webdavPath };
    }
    markSyncUpToDate(isManual) {
      State.proxy.lastSyncResult = createSyncResultSummary({
        mode: "webdav",
        status: SYNC_STATUS.SUCCESS,
        completedAt: ( new Date()).toISOString(),
        summary: t("syncSummaryUpToDate"),
        translate: t
      });
      State.proxy.syncStatus = SYNC_STATUS.SUCCESS;
      if (isManual) {
        CoreEvents.emit(AppEvents.SHOW_TOAST, { message: t("alertAlreadyUpToDate"), type: "info" });
      }
    }
    handleSyncError(error, isManual, traceId) {
      createSyncProviderErrorHandler({
        mode: "webdav",
        defaultErrorMessage: "syncErrorWebdav",
        manualErrorToastPrefix: "alertWebDAVSyncError",
        translate: t,
        buildSummary: (input) => createSyncResultSummary(input),
        logError: (err, trace) => log$a.error("Sync error", err, trace)
      })(error, isManual, traceId);
    }
    async fetchRemoteState(targetUrl, useGzip, forceRefresh, preferRemote) {
      const headResponse = await WebDAVClient.request("HEAD", targetUrl);
      const remoteETag = headResponse.status === 200 ? extractWebDAVEtag(headResponse.responseHeaders) : void 0;
      const lastEtag = GM_getValue(STORAGE_KEYS.WEBDAV_LAST_ETAG);
      const dirtyCount = await Repository.db.history.where("sync_dirty").equals(1).count();
      if (shouldSkipWebDAVSync({ preferRemote, forceRefresh, remoteETag, lastEtag, dirtyCount })) {
        return { remoteETag, shouldSkip: true };
      }
      let remoteData;
      if (shouldFetchWebDAVRemoteState({
        forceRefresh,
        preferRemote,
        lastEtag,
        remoteETag,
        headStatus: headResponse.status
      })) {
        const fetched = await WebDAVClient.fetchFile(targetUrl, useGzip);
        if (fetched?.data) {
          await verifyRemoteChecksum({
            remoteData: fetched.data,
            calculateChecksum: (history) => CryptoService.calculateChecksum(history)
          });
          remoteData = fetched.data;
        }
      }
      return { remoteETag, remoteData, shouldSkip: false };
    }
    async mergeAndUpload(targetUrl, useGzip, remoteETag, remoteData, preferRemote, isManual, retryOnConflict, _forceRefresh, traceId, propagateErrors = false) {
      const localHistory = await Repository.db.history.toArray();
      const { history: mergedHistory } = MergeEngine.merge(localHistory, remoteData?.history, preferRemote);
      const payload = await createWebDAVSyncPayload({
        mergedHistory,
        calculateChecksum: (history) => CryptoService.calculateChecksum(history)
      });
      const putHeaders = {
        "Content-Type": useGzip ? "application/gzip" : "application/json"
      };
      if (remoteETag) {
        putHeaders["If-Match"] = `"${remoteETag.replace(/"/g, "")}"`;
      }
      const body = useGzip ? await GzipService.compress(JSON.stringify(payload)) : JSON.stringify(payload);
      const response = await WebDAVClient.request("PUT", targetUrl, body, putHeaders);
      if (response.status >= 200 && response.status < 300) {
        await this.handleSuccessfulUpload(response.responseHeaders, remoteETag, mergedHistory, isManual);
        return;
      }
      if (response.status === 412 && retryOnConflict) {
        State.proxy.lastSyncResult = createSyncResultSummary({
          mode: "webdav",
          status: SYNC_STATUS.CONFLICT,
          completedAt: ( new Date()).toISOString(),
          summary: t("syncSummaryConflictRetry"),
          conflict: {
            localNewer: 0,
            remoteNewer: 0,
            merged: 0,
            explanation: t("syncConflictWebdavRetry")
          },
          translate: t
        });
        State.proxy.syncStatus = SYNC_STATUS.CONFLICT;
        this.isSyncing = false;
        return this.runSync(isManual, true, false, false, traceId, propagateErrors);
      }
      throw new Error(`WebDAV PUT failed: ${response.status}`);
    }
    async handleSuccessfulUpload(responseHeaders, remoteETag, mergedHistory, isManual) {
      const newEtag = extractWebDAVEtag(responseHeaders) || remoteETag;
      if (newEtag) {
        GM_setValue(STORAGE_KEYS.WEBDAV_LAST_ETAG, newEtag);
      }
      await Repository.db.transaction("rw", Repository.db.history, async () => {
        await Repository.db.history.where("sync_dirty").equals(1).modify({ sync_dirty: 0, retry_count: 0 });
        await Repository.db.history.bulkPut(mergedHistory.map((history) => ({ ...history, sync_dirty: 0 })));
      });
      await HistoryService.load();
      const completedAt = ( new Date()).toISOString();
      GM_setValue(STORAGE_KEYS.LAST_SYNC_TS, completedAt);
      State.proxy.lastSyncResult = createSyncResultSummary({
        mode: "webdav",
        status: SYNC_STATUS.SUCCESS,
        completedAt,
        lastSyncTs: completedAt,
        dirtyCount: await Repository.db.history.where("sync_dirty").equals(1).count(),
        translate: t
      });
      State.proxy.syncStatus = SYNC_STATUS.SUCCESS;
      if (isManual) {
        CoreEvents.emit(AppEvents.SHOW_TOAST, { message: t("alertWebDAVSyncSuccess"), type: "success" });
      }
    }
    async runSync(isManual = false, forceRefresh = false, retryOnConflict = true, preferRemote = false, traceId, propagateErrors = false) {
      if (this.isSyncing || !this.checkSyncLock(isManual)) {
        return;
      }
      const syncTarget = this.resolveSyncTarget();
      if (!syncTarget) {
        return;
      }
      Logger.group("WebDAV", `Sync (Force: ${forceRefresh}, CloudFirst: ${preferRemote})`, traceId);
      this.isSyncing = true;
      State.proxy.syncStatus = SYNC_STATUS.SYNCING;
      try {
        await WebDAVClient.ensureDirectory(syncTarget.webdavUrl, syncTarget.webdavPath);
        const useGzip = GzipService.isSupported();
        const targetUrl = createWebDAVTarget(syncTarget.webdavUrl, syncTarget.webdavPath, useGzip);
        const { remoteETag, remoteData, shouldSkip } = await this.fetchRemoteState(
          targetUrl,
          useGzip,
          forceRefresh,
          preferRemote
        );
        if (shouldSkip) {
          this.markSyncUpToDate(isManual);
          return;
        }
        await this.mergeAndUpload(
          targetUrl,
          useGzip,
          remoteETag,
          remoteData,
          preferRemote,
          isManual,
          retryOnConflict,
          forceRefresh,
          traceId,
          propagateErrors
        );
      } catch (error) {
        if (propagateErrors) {
          throw error;
        }
        this.handleSyncError(error, isManual, traceId);
      } finally {
        this.isSyncing = false;
        GM_setValue(STORAGE_KEYS.WEBDAV_SYNC_LOCK, 0);
        Logger.groupEnd();
      }
    }
    async test() {
      const { webdavUrl } = State.proxy;
      if (!webdavUrl) {
        throw new Error("URL is empty");
      }
      return WebDAVClient.request("PROPFIND", webdavUrl.replace(/\/$/, "") + "/", null, { Depth: "0" });
    }
    async logout() {
      clearWebDAVSession();
    }
    async performSync(isManual = false, forceRefresh = false, preferRemote = false, traceId) {
      if (forceRefresh || preferRemote) {
        GM_deleteValue(STORAGE_KEYS.WEBDAV_LAST_ETAG);
      }
      notifyManualSyncStart(isManual, t("labelSyncing"));
      try {
        await RetryManager.executeWithRetry(
          () => this.runSync(isManual, forceRefresh, true, preferRemote, traceId, true),
          RetryManager.presets.sync
        );
      } catch (error) {
        this.handleSyncError(error, isManual, traceId);
      }
    }
  }
  const createWebDAVProvider = () => {
    return new WebDAVProviderImpl();
  };
  const WebDAVProvider = AppContainer.register("webdav-provider", createWebDAVProvider());

  const getActiveSyncProvider = () => {
    const mode = State.proxy.syncMode;
    if (mode === "webdav") return WebDAVProvider;
    if (mode === "supabase") return SupabaseProvider;
    return null;
  };
  const getSupabaseAuthProvider = () => SupabaseProvider;
  const getWebDAVTestProvider = () => WebDAVProvider;

  class SyncAccessGateway {
    constructor(dependencies) {
      this.dependencies = dependencies;
    }
    setProgressHandler(handler) {
      this.dependencies.getAuthProvider().onProgress = handler;
    }
    async login(email, password) {
      return await this.dependencies.getAuthProvider().login(email, password);
    }
    async signup(email, password) {
      return await this.dependencies.getAuthProvider().signup(email, password);
    }
    async logout(silent = false) {
      const provider = this.dependencies.getActiveProvider();
      if (provider) {
        await provider.logout(silent);
      } else {
        await this.dependencies.getAuthProvider().logout(silent);
      }
      State.proxy.syncMode = "none";
      State.proxy.syncStatus = SYNC_STATUS.IDLE;
      State.proxy.lastSyncResult = null;
      GM_setValue(STORAGE_KEYS.LAST_SYNC_TS, UI_CONSTANTS.DEFAULT_TIMESTAMP);
    }
    async testWebDAV() {
      return await this.dependencies.getTestProvider().test();
    }
  }

  const log$9 = Logger.scope("Sync");
  class SyncExecutor {
    constructor(dependencies) {
      this.dependencies = dependencies;
    }
    async execute(options = {}) {
      const { isManual = false, forceRefresh = false, preferRemote = false } = options;
      const traceId = Logger.traceId;
      try {
        const provider = this.dependencies.getProvider();
        if (!provider) {
          if (isManual) {
            this.recordSyncFailure(t("syncErrorNoProvider"));
          }
          return;
        }
        const executed = await this.dependencies.runWithLock(async () => {
          log$9.info(`Starting sync (manual: ${isManual}, force: ${forceRefresh})`, traceId);
          await provider.performSync(isManual, forceRefresh, preferRemote, traceId);
        }, isManual);
        if (!executed && isManual) {
          this.recordSyncFailure(t("syncErrorLocked"));
        }
      } catch (error) {
        log$9.error("Sync failed", error, traceId);
        this.recordSyncFailure(error instanceof Error ? error.message : String(error));
      }
    }
    recordSyncFailure(message) {
      State.proxy.lastSyncResult = createSyncResultSummary({
        mode: this.getCurrentMode(),
        status: SYNC_STATUS.ERROR,
        completedAt: ( new Date()).toISOString(),
        errorMessage: message,
        translate: t
      });
      State.proxy.syncStatus = SYNC_STATUS.ERROR;
    }
    getCurrentMode() {
      const mode = State.proxy.syncMode;
      return mode === "webdav" || mode === "supabase" ? mode : "none";
    }
  }

  class SyncRecoveryActions {
    constructor(dependencies) {
      this.dependencies = dependencies;
    }
    async forceFullSync(skipConfirm = false) {
      if (!skipConfirm) {
        const confirmed = this.dependencies.confirmAction(this.dependencies.getPushAllMessage());
        if (!confirmed) return false;
      }
      try {
        await this.dependencies.markAllHistoryDirty();
        this.dependencies.resetLastSync();
        await this.dependencies.performSync(true, true, false);
        return true;
      } catch {
        return false;
      }
    }
    async forcePullSync(skipConfirm = false) {
      if (!skipConfirm) {
        const confirmed = this.dependencies.confirmAction(this.dependencies.getPullAllMessage());
        if (!confirmed) return false;
      }
      try {
        this.dependencies.resetLastSync();
        await this.dependencies.performSync(true, true, true);
        return true;
      } catch {
        return false;
      }
    }
  }

  const log$8 = Logger.scope("SyncLock");
  const SYNC_LOCK_NAME = "fc2_sync_lock";
  class SyncLockCoordinator {
    async runWithLock(task, isManual = false) {
      if (typeof navigator !== "undefined" && navigator.locks) {
        return await navigator.locks.request(SYNC_LOCK_NAME, { ifAvailable: true }, async (lock) => {
          if (!lock) {
            this.handleLockedSync(isManual);
            return false;
          }
          await task();
          return true;
        });
      }
      log$8.debug("navigator.locks not available, syncing without lock");
      await task();
      return true;
    }
    handleLockedSync(isManual) {
      if (isManual) {
        log$8.info("Manual sync skipped: lock held by another tab");
        CoreEvents.emit(AppEvents.SHOW_TOAST, {
          message: t("alertSyncLocked") || "Sync already in progress in another tab",
          type: "warn"
        });
        return;
      }
      log$8.debug("Auto-sync skipped: lock held by another tab");
    }
  }
  const syncLockCoordinator = new SyncLockCoordinator();

  const log$7 = Logger.scope("SyncScheduler");
  class SyncScheduler {
    constructor(dependencies) {
      this.dependencies = dependencies;
    }
    initialSyncTimer = null;
    syncRequestTimer = null;
    detachHistoryChanged = null;
    detachCollectionUpdated = null;
    recordAutoSyncTimestamp() {
      GM_setValue(STORAGE_KEYS.LAST_AUTO_SYNC_TS, Date.now());
    }
    start() {
      log$7.debug("Starting auto-sync scheduler");
      this.clearInitialSyncTimer();
      this.detachHistoryChanged?.();
      this.detachCollectionUpdated?.();
      this.initialSyncTimer = setTimeout(
        () => this.dependencies.performSync(false).catch((error) => {
          log$7.warn("Initial auto-sync failed", error);
        }),
        TIMING.SYNC_INIT_DELAY
      );
      this.detachHistoryChanged = CoreEvents.on(AppEvents.HISTORY_CHANGED, () => {
        this.requestSync();
      });
      this.detachCollectionUpdated = CoreEvents.on(AppEvents.COLLECTION_UPDATED, () => {
        this.requestSync();
      });
    }
    stop() {
      this.clearInitialSyncTimer();
      this.clearRequestSyncTimer();
      this.detachHistoryChanged?.();
      this.detachHistoryChanged = null;
      this.detachCollectionUpdated?.();
      this.detachCollectionUpdated = null;
    }
    requestSync() {
      const interval = State.proxy.syncInterval;
      const mode = State.proxy.syncMode;
      if (interval === -1 || mode === "none") return;
      if (interval === 0) {
        Logger.info("SyncService", `Sync requested (real-time mode), executing in ${TIMING.SYNC_DEBOUNCE_MS}ms`);
        this.clearRequestSyncTimer();
        this.syncRequestTimer = setTimeout(
          () => this.dependencies.performSync().catch((error) => log$7.error("Debounced sync failed", error)),
          TIMING.SYNC_DEBOUNCE_MS
        );
        return;
      }
      const lastAutoSync = GM_getValue(STORAGE_KEYS.LAST_AUTO_SYNC_TS, 0);
      const now = Date.now();
      const minInterval = interval * 60 * 1e3;
      if (now - lastAutoSync < minInterval) return;
      Logger.info(
        "SyncService",
        `Sync requested (interval: ${interval}min), executing in ${TIMING.SYNC_DEBOUNCE_MS}ms`
      );
      this.clearRequestSyncTimer();
      this.syncRequestTimer = setTimeout(() => {
        this.dependencies.performSync().then(() => {
          this.recordAutoSyncTimestamp();
        }).catch((error) => log$7.error("Scheduled sync failed", error));
      }, TIMING.SYNC_DEBOUNCE_MS);
    }
    clearInitialSyncTimer() {
      if (!this.initialSyncTimer) return;
      clearTimeout(this.initialSyncTimer);
      this.initialSyncTimer = null;
    }
    clearRequestSyncTimer() {
      if (!this.syncRequestTimer) return;
      clearTimeout(this.syncRequestTimer);
      this.syncRequestTimer = null;
    }
  }

  const createSyncServiceDependencies = ({
    performSync,
    getProvider = getActiveSyncProvider
  }) => {
    const resolveProvider = () => getProvider();
    return {
      scheduler: new SyncScheduler({
        performSync: (isManual) => performSync(isManual)
      }),
      executor: new SyncExecutor({
        getProvider: resolveProvider,
        runWithLock: (task, isManual) => syncLockCoordinator.runWithLock(task, isManual)
      }),
      accessGateway: new SyncAccessGateway({
        getActiveProvider: resolveProvider,
        getAuthProvider: () => getSupabaseAuthProvider(),
        getTestProvider: () => getWebDAVTestProvider()
      }),
      recoveryActions: new SyncRecoveryActions({
        confirmAction: (message) => confirm(message),
        markAllHistoryDirty: async () => {
          await Repository.db.history.toCollection().modify({ sync_dirty: 1 });
        },
        resetLastSync: () => {
          GM_setValue(STORAGE_KEYS.LAST_SYNC_TS, UI_CONSTANTS.DEFAULT_TIMESTAMP);
        },
        performSync,
        getPushAllMessage: () => t("alertPushAllQuery"),
        getPullAllMessage: () => t("alertPullAllQuery")
      })
    };
  };

  const MAX_HISTORY = 200;
  const roundMetric = (value) => Math.round(value * 100) / 100;
  class PerformanceMonitorImpl {
    history = [];
    record(name, durationMs, metadata) {
      const completedAt = new Date();
      const startedAt = new Date(completedAt.getTime() - Math.max(0, durationMs));
      const entry = {
        name,
        durationMs: roundMetric(durationMs),
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        metadata: metadata ? { ...metadata } : void 0
      };
      this.history.push(entry);
      if (this.history.length > MAX_HISTORY) {
        this.history.splice(0, this.history.length - MAX_HISTORY);
      }
      return entry;
    }
    measureSync(name, callback, metadata) {
      const start = performance.now();
      try {
        return callback();
      } finally {
        this.record(name, performance.now() - start, metadata);
      }
    }
    async measure(name, callback, metadata) {
      const start = performance.now();
      try {
        return await callback();
      } finally {
        this.record(name, performance.now() - start, metadata);
      }
    }
    getSummary() {
      const metrics = this.history.reduce((acc, entry) => {
        const current = acc[entry.name] || {
          count: 0,
          totalMs: 0,
          avgMs: 0,
          maxMs: 0,
          lastMs: 0
        };
        current.count += 1;
        current.totalMs = roundMetric(current.totalMs + entry.durationMs);
        current.maxMs = roundMetric(Math.max(current.maxMs, entry.durationMs));
        current.lastMs = roundMetric(entry.durationMs);
        current.avgMs = roundMetric(current.totalMs / current.count);
        acc[entry.name] = current;
        return acc;
      }, {});
      return {
        updatedAt: this.history.length > 0 ? this.history[this.history.length - 1]?.completedAt || null : null,
        metrics
      };
    }
    exportSnapshot() {
      return {
        summary: this.getSummary(),
        history: this.history.map((entry) => ({
          ...entry,
          metadata: entry.metadata ? { ...entry.metadata } : void 0
        }))
      };
    }
    clear() {
      this.history = [];
    }
  }
  const PerformanceMonitor = new PerformanceMonitorImpl();

  class SyncServiceImplementation {
    scheduler;
    executor;
    accessGateway;
    recoveryActions;
    constructor(dependencies) {
      const resolvedDependencies = dependencies ?? createSyncServiceDependencies({
        getProvider: () => this.getProvider(),
        performSync: (isManual, forceRefresh, preferRemote) => this.performSync(isManual, forceRefresh, preferRemote)
      });
      this.scheduler = resolvedDependencies.scheduler;
      this.executor = resolvedDependencies.executor;
      this.accessGateway = resolvedDependencies.accessGateway;
      this.recoveryActions = resolvedDependencies.recoveryActions;
    }
    onBootstrap() {
      this.scheduler.start();
    }
    onCleanup() {
      this.scheduler.stop();
    }
    getProvider() {
      return getActiveSyncProvider();
    }
    set onProgress(val) {
      this.accessGateway.setProgressHandler(val);
    }
    async login(email, password) {
      return await this.accessGateway.login(email, password);
    }
    async signup(email, password) {
      return await this.accessGateway.signup(email, password);
    }
    async logout(silent = false) {
      return await this.accessGateway.logout(silent);
    }
    async testWebDAV() {
      return await this.accessGateway.testWebDAV();
    }
    requestSync() {
      this.scheduler.requestSync();
    }
    async performSync(isManual = false, forceRefresh = false, preferRemote = false) {
      await PerformanceMonitor.measure(
        "sync.execute",
        async () => {
          await this.executor.execute({ isManual, forceRefresh, preferRemote });
        },
        {
          isManual,
          forceRefresh,
          preferRemote,
          provider: this.getProvider()?.name || "none"
        }
      );
    }
    async forceFullSync(skipConfirm = false) {
      return await this.recoveryActions.forceFullSync(skipConfirm);
    }
    async forcePullSync(skipConfirm = false) {
      return await this.recoveryActions.forcePullSync(skipConfirm);
    }
  }
  const SyncService = AppContainer.register("sync-service", new SyncServiceImplementation());

  const log$6 = Logger.scope("Cleanup");
  class CleanupServiceImplementation {
    RETENTION_PERIOD = 30 * 24 * 60 * 60 * 1e3;
maintenanceTimer = null;
    onBootstrap() {
      this.onCleanup();
      log$6.debug("Scheduling maintenance");
      this.maintenanceTimer = setTimeout(() => {
        this.maintenanceTimer = null;
        this.runAllGC().catch((e) => log$6.error("Maintenance failed", e));
      }, 5e3);
    }
    onCleanup() {
      if (this.maintenanceTimer) {
        clearTimeout(this.maintenanceTimer);
        this.maintenanceTimer = null;
      }
    }
    async runAllGC() {
      Logger.group("Cleanup", "System maintenance");
      try {
        await this.runTombstoneGC();
        await Repository.runGC();
        log$6.info("Maintenance complete");
      } finally {
        Logger.groupEnd();
      }
    }
    async runTombstoneGC() {
      try {
        const thresholdDate = new Date(Date.now() - this.RETENTION_PERIOD).toISOString();
        const deletedCount = await Repository.db.history.where("is_deleted").equals(1).and((item) => item.updated_at < thresholdDate).delete();
        if (deletedCount > 0) {
          log$6.info(`Purged ${deletedCount} tombstone records`);
        }
      } catch (e) {
        log$6.error("Tombstone GC failed", e);
      }
    }
  }
  AppContainer.register("cleanup-service", new CleanupServiceImplementation());

  const log$5 = Logger.scope("Menu");
  class MenuServiceImplementation {
    menuIds = [];
    onBootstrap() {
      this.onCleanup();
      log$5.debug("Registering UserScript menus");
      this.register();
    }
    onCleanup() {
      if (typeof GM_unregisterMenuCommand === "undefined") {
        this.menuIds = [];
        return;
      }
      this.menuIds.forEach((id) => {
        try {
          GM_unregisterMenuCommand(id);
        } catch {
        }
      });
      this.menuIds = [];
    }
    register() {
      if (typeof GM_registerMenuCommand === "undefined") return;
      const settingsId = GM_registerMenuCommand(
        t("menuOpenSettings"),
        () => {
          CoreEvents.emit(AppEvents.OPEN_SETTINGS, {});
        },
        "s"
      );
      this.menuIds.push(settingsId);
    }
  }
  const MenuService = AppContainer.register("menu-service", new MenuServiceImplementation());

  const parseMigratedHistoryItems = (raw, nowIso) => {
    const validItemsMap = new Map();
    if (!Array.isArray(raw)) {
      return [];
    }
    for (const item of raw) {
      let id = "";
      let timestamp = Date.now();
      if (typeof item === "number") {
        id = String(item);
      } else if (typeof item === "string") {
        id = item.trim();
      } else if (typeof item === "object" && item !== null) {
        const objectItem = item;
        if (objectItem.id) id = String(objectItem.id).trim();
        if (typeof objectItem.timestamp === "number" && !isNaN(objectItem.timestamp) && objectItem.timestamp > 0) {
          timestamp = objectItem.timestamp;
        }
      }
      if (!id) {
        continue;
      }
      if (validItemsMap.has(id)) {
        const existing = validItemsMap.get(id);
        if (timestamp > existing.timestamp) {
          existing.timestamp = timestamp;
        }
        continue;
      }
      validItemsMap.set(id, {
        id,
        timestamp,
        status: "watched",
        updated_at: nowIso,
        is_deleted: 0,
        sync_dirty: 1
      });
    }
    return Array.from(validItemsMap.values());
  };
  const parseMigratedCacheItems = (raw, now) => {
    if (typeof raw !== "object" || raw === null) {
      return [];
    }
    const validItems = [];
    for (const [key, value] of Object.entries(raw)) {
      const id = String(key).trim();
      if (!id) {
        continue;
      }
      const valueObject = value;
      if (!valueObject || typeof valueObject.v !== "string") {
        continue;
      }
      const magnetUrl = valueObject.v;
      if (!magnetUrl.startsWith("magnet:?")) {
        continue;
      }
      const timestamp = typeof valueObject.t === "number" && !isNaN(valueObject.t) && valueObject.t > 0 ? valueObject.t : now;
      validItems.push({ id, value: magnetUrl, timestamp });
    }
    return validItems;
  };

  const log$4 = Logger.scope("Migration");
  const MIGRATION_VERSION_KEY = "migration_version";
  const LEGACY_HISTORY_KEY = "history_v1";
  const LEGACY_CACHE_KEY = "magnet_cache_v1";
  const TARGET_VERSION = 1;
  class MigrationServiceImplementation {
    onBootstrap() {
      log$4.debug("Checking for pending migrations");
      this.run().catch((error) => log$4.error("Run failed", error));
    }
    async run() {
      const traceId = Logger.traceId;
      const currentVersion = Storage.get(MIGRATION_VERSION_KEY, 0);
      if (currentVersion >= TARGET_VERSION) {
        return;
      }
      Logger.group("Migration", `v${currentVersion} -> v${TARGET_VERSION}`, traceId);
      try {
        const [historyMigrated, cacheMigrated] = await Promise.all([
          this.migrateHistory(traceId),
          this.migrateCache(traceId)
        ]);
        if (!historyMigrated || !cacheMigrated) {
          log$4.warn("Migration incomplete; keeping legacy version for retry", void 0, traceId);
          return;
        }
        Storage.set(MIGRATION_VERSION_KEY, TARGET_VERSION);
        log$4.info("Migration completed", void 0, traceId);
      } catch (error) {
        log$4.error("Migration failed", error, traceId);
      } finally {
        Logger.groupEnd();
      }
    }
    async migrateHistory(traceId) {
      const oldDataStr = Storage.get(LEGACY_HISTORY_KEY, null);
      if (!oldDataStr) {
        log$4.debug("No old history found", void 0, traceId);
        return true;
      }
      let oldData = oldDataStr;
      if (typeof oldDataStr === "string") {
        try {
          oldData = JSON.parse(oldDataStr);
        } catch {
          log$4.warn("Failed to parse history JSON; discarding legacy payload", void 0, traceId);
          this.clearLegacyKey(LEGACY_HISTORY_KEY, traceId);
          return true;
        }
      }
      if (!Array.isArray(oldData)) {
        log$4.warn("Invalid history format (not array); discarding legacy payload", typeof oldData, traceId);
        this.clearLegacyKey(LEGACY_HISTORY_KEY, traceId);
        return true;
      }
      log$4.info(`Found ${oldData.length} raw history items`, void 0, traceId);
      const items = parseMigratedHistoryItems(oldData, ( new Date()).toISOString());
      if (items.length > 0) {
        try {
          await Repository.db.history.bulkPut(items);
          log$4.info(`Migrated ${items.length} unique history items`, void 0, traceId);
        } catch (error) {
          log$4.error("Critical error migrating history", error, traceId);
          return false;
        }
      }
      this.clearLegacyKey(LEGACY_HISTORY_KEY, traceId);
      return true;
    }
    async migrateCache(traceId) {
      const oldDataStr = Storage.get(LEGACY_CACHE_KEY, null);
      if (!oldDataStr) {
        return true;
      }
      let oldData = oldDataStr;
      if (typeof oldDataStr === "string") {
        try {
          oldData = JSON.parse(oldDataStr);
        } catch {
          log$4.warn("Failed to parse cache JSON; discarding legacy payload", void 0, traceId);
          this.clearLegacyKey(LEGACY_CACHE_KEY, traceId);
          return true;
        }
      }
      const entries = parseMigratedCacheItems(oldData, Date.now());
      if (typeof oldData === "object" && oldData !== null) {
        log$4.info(`Found ${Object.keys(oldData).length} cache items to migrate`, void 0, traceId);
      }
      if (entries.length > 0) {
        try {
          await Repository.db.cache.bulkPut(entries);
          log$4.info(`Migrated ${entries.length} cache items`, void 0, traceId);
        } catch (error) {
          log$4.error("Error migrating cache", error, traceId);
          return false;
        }
      }
      this.clearLegacyKey(LEGACY_CACHE_KEY, traceId);
      return true;
    }
    clearLegacyKey(key, traceId) {
      Storage.delete(key);
      log$4.debug(`Cleared legacy key: ${key}`, void 0, traceId);
    }
  }
  AppContainer.register("migration-service", new MigrationServiceImplementation());

  const BACKUP_FORMAT_VERSION = 4;
  const ALLOWED_BACKUP_SETTINGS_KEYS = new Set([
    "previewMode",
    "hideNoMagnet",
    "hideCensored",
    "enableHistory",
    "hideViewed",
    "enableFollows",
    "loadExtraPreviews",
    "enableQuickBar",
    "showViewedBtn",
    "showIdBadge",
    "enableMagnets",
    "enableExternalLinks",
    "enableActressName",
    "language",
    "syncMode",
    "syncInterval",
    "replaceFc2Covers",
    "enabledPortals",
    "userGridColumns",
    "debugMode",
    "cardDensity",
    "cardPrimaryActions",
    "settingsPreset"
  ]);
  const createBackupExportPayload = ({
    settings,
    history
  }) => ({
    appName: SCRIPT_INFO.NAME,
    version: BACKUP_FORMAT_VERSION,
    timestamp: Date.now(),
    settings,
    history
  });
  const filterImportedSettings = (settings) => {
    const filtered = [];
    for (const [key, value] of Object.entries(settings)) {
      if (ALLOWED_BACKUP_SETTINGS_KEYS.has(key)) {
        filtered.push([key, value]);
      }
    }
    return filtered;
  };

  const VALID_HISTORY_STATUSES = new Set(["watched", "downloaded"]);
  const parseTimestamp = (value) => {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Date.parse(value);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return null;
  };
  const normalizeBinaryFlag = (value) => value === 1 || value === true ? 1 : 0;
  const getRecordTimestamp = (record) => {
    return parseTimestamp(record.updated_at) ?? parseTimestamp(record.timestamp) ?? 0;
  };
  const shouldReplaceImportedRecord = (incoming, existing) => {
    return getRecordTimestamp(incoming) > getRecordTimestamp(existing);
  };
  const normalizeHistoryItem = (value, now) => {
    if (!value || typeof value !== "object") {
      return null;
    }
    const candidate = value;
    const id = typeof candidate.id === "string" ? candidate.id.trim() : "";
    const status = typeof candidate.status === "string" ? candidate.status : "";
    if (!id || !VALID_HISTORY_STATUSES.has(status)) {
      return null;
    }
    const updatedAtTimestamp = parseTimestamp(candidate.updated_at) ?? parseTimestamp(candidate.timestamp) ?? now;
    return {
      id,
      status,
      timestamp: parseTimestamp(candidate.timestamp) ?? updatedAtTimestamp,
      updated_at: new Date(updatedAtTimestamp).toISOString(),
      is_deleted: normalizeBinaryFlag(candidate.is_deleted),
      sync_dirty: normalizeBinaryFlag(candidate.sync_dirty)
    };
  };
  const normalizeUniqueRecords = (items, normalizeItem, now) => {
    const dedupedItems = new Map();
    items.forEach((item) => {
      const normalized = normalizeItem(item, now);
      if (!normalized) {
        return;
      }
      const existing = dedupedItems.get(normalized.id);
      if (!existing || shouldReplaceImportedRecord(normalized, existing)) {
        dedupedItems.set(normalized.id, normalized);
      }
    });
    return Array.from(dedupedItems.values());
  };
  const normalizeBackupPayload = (value) => {
    const now = Date.now();
    return {
      appName: typeof value.appName === "string" && value.appName.trim() ? value.appName : SCRIPT_INFO.NAME,
      version: value.version,
      timestamp: parseTimestamp(value.timestamp) ?? now,
      settings: value.settings,
      history: normalizeUniqueRecords(value.history, normalizeHistoryItem, now)
    };
  };

  const parseBackupTimestamp = (value) => {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Date.parse(value);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return null;
  };
  const classifyBackupPayload = (data) => {
    if (!data || typeof data !== "object") {
      return { ok: false, errorCode: "invalid_payload" };
    }
    const candidate = data;
    const version = Number(candidate.version);
    if (!Number.isInteger(version) || version <= 0) {
      return { ok: false, errorCode: "invalid_payload" };
    }
    if (version > BACKUP_FORMAT_VERSION) {
      return { ok: false, errorCode: "unsupported_version" };
    }
    if (!candidate.settings || typeof candidate.settings !== "object" || !Array.isArray(candidate.history)) {
      return { ok: false, errorCode: "invalid_payload" };
    }
    const payload = {
      appName: typeof candidate.appName === "string" ? candidate.appName : SCRIPT_INFO.NAME,
      version,
      timestamp: parseBackupTimestamp(candidate.timestamp) ?? Date.now(),
      settings: candidate.settings,
      history: candidate.history
    };
    return {
      ok: true,
      payload: normalizeBackupPayload(payload)
    };
  };
  const parseBackupContentWithMetadataDetailed = async (content) => {
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return { ok: false, errorCode: "invalid_json" };
    }
    const payloadResult = classifyBackupPayload(parsed);
    return payloadResult.ok ? { ok: true, payload: payloadResult.payload } : { ok: false, errorCode: payloadResult.errorCode };
  };

  const buildBackupImportDiff = ({
    payload,
    currentSettings,
    existingHistoryCount
  }) => {
    const settingsAdded = [];
    const settingsChanged = [];
    for (const [key, value] of filterImportedSettings(payload.settings || {})) {
      if (!(key in currentSettings)) {
        settingsAdded.push(String(key));
        continue;
      }
      const currentValue = currentSettings[key];
      if (JSON.stringify(currentValue) !== JSON.stringify(value)) {
        settingsChanged.push(String(key));
      }
    }
    return {
      settingsAdded,
      settingsChanged,
      historyToImport: payload.history.length,
      existingHistoryCount
    };
  };
  const createBackupImportPreview = ({
    payload,
    currentSettings,
    existingHistoryCount
  }) => ({
    payload,
    diff: buildBackupImportDiff({
      payload,
      currentSettings,
      existingHistoryCount
    })
  });
  const defaultTranslate = (key, params) => {
    const map = {
      backupSettingsAdded: "Settings added: {count}",
      backupSettingsChanged: "Settings changed: {count}",
      backupHistoryRowsWithCurrent: "History rows to import: {count} (current: {current})",
      backupChangedKeys: "Changed keys: {keys}"
    };
    let value = map[key] || key;
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value.replace(new RegExp(`{${paramKey}}`, "g"), String(paramValue));
      });
    }
    return value;
  };
  const formatBackupImportDiff = (diff, translate = defaultTranslate) => {
    const lines = [
      translate("backupSettingsAdded", { count: diff.settingsAdded.length }),
      translate("backupSettingsChanged", { count: diff.settingsChanged.length }),
      translate("backupHistoryRowsWithCurrent", {
        count: diff.historyToImport,
        current: diff.existingHistoryCount
      })
    ];
    if (diff.settingsChanged.length > 0) {
      lines.push(translate("backupChangedKeys", { keys: diff.settingsChanged.join(", ") }));
    }
    return lines.join("\n");
  };

  const log$3 = Logger.scope("Backup");
  class BackupServiceImplementation {
    async onInit() {
      log$3.debug("Service initialized");
    }
    async readFileAsText(file) {
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(String(event.target?.result || ""));
        reader.onerror = () => reject(new Error("Failed to read backup file"));
        reader.readAsText(file);
      });
    }
    async parseFile(file) {
      const text = await this.readFileAsText(file);
      return await parseBackupContentWithMetadataDetailed(text);
    }
    async exportData() {
      const history = await Repository.history.getAll();
      const { syncStatus: _syncStatus, ...persistentSettings } = State.proxy;
      const data = createBackupExportPayload({
        settings: persistentSettings,
        history
      });
      try {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        const dateStr = ( new Date()).toISOString().slice(0, 10);
        anchor.href = url;
        anchor.download = `fc2_enhanced_backup_${dateStr}.json`;
        anchor.click();
        setTimeout(() => {
          URL.revokeObjectURL(url);
          anchor.remove();
        }, 100);
        log$3.info("Data exported successfully");
        return true;
      } catch (error) {
        log$3.error("Export failed", error);
        return false;
      }
    }
    async previewImportDetailed(file) {
      try {
        const parsed = await this.parseFile(file);
        if (!parsed.ok) {
          return { ok: false, errorCode: parsed.errorCode };
        }
        const historyCount = await Repository.db.history.count();
        return {
          ok: true,
          preview: createBackupImportPreview({
            payload: parsed.payload,
            currentSettings: State.proxy,
            existingHistoryCount: historyCount
          })
        };
      } catch (error) {
        log$3.error("Preview import failed", error);
        return { ok: false, errorCode: "read_failed" };
      }
    }
    async previewImport(file) {
      const result = await this.previewImportDetailed(file);
      return result.preview ?? null;
    }
    async importDataDetailed(file) {
      const previewResult = await this.previewImportDetailed(file);
      if (!previewResult.ok || !previewResult.preview) {
        return {
          success: false,
          errorCode: previewResult.errorCode ?? "invalid_payload"
        };
      }
      try {
        await this.applyImport(previewResult.preview.payload);
        log$3.info("Backup imported", { diff: formatBackupImportDiff(previewResult.preview.diff) });
        return {
          success: true,
          preview: previewResult.preview
        };
      } catch (error) {
        log$3.error("Import failed during parsing/saving", error);
        return {
          success: false,
          preview: previewResult.preview,
          errorCode: "apply_failed"
        };
      }
    }
    async importData(file) {
      const result = await this.importDataDetailed(file);
      return result.success;
    }
    async applyImport(data) {
      log$3.debug("Importing settings...");
      const settings = data.settings || {};
      for (const [key, value] of filterImportedSettings(settings)) {
        const nextValue = key === "language" && typeof value === "string" ? normalizeLocalePreference(value) : value;
        State.proxy[key] = nextValue;
      }
      log$3.debug("Importing history...");
      await Repository.db.transaction("rw", [Repository.db.history], async () => {
        if (Array.isArray(data.history)) {
          await Repository.db.history.bulkPut(data.history);
        }
      });
    }
  }
  const BackupService = AppContainer.register("backup-service", new BackupServiceImplementation());

  class DragManager {
    container;
    trigger;
    onDragEndCallback;
    documentCleanup = [];
    currentConfig = { anchorX: "right", x: 20, anchorY: "bottom", y: 40 };
    isDragging = false;
    hasMoved = false;
    startX = 0;
    startY = 0;
    startLeft = 0;
    startTop = 0;
    constructor(container, trigger, onDragEndCallback) {
      this.container = container;
      this.trigger = trigger;
      this.onDragEndCallback = onDragEndCallback;
      this.init();
    }
    init() {
      const savedConfig = typeof GM_getValue !== "undefined" ? GM_getValue(STORAGE_KEYS.FAB_POSITION) : null;
      if (savedConfig) {
        try {
          this.applyAnchor(JSON.parse(savedConfig));
        } catch {
          this.applyAnchor(this.currentConfig);
        }
      } else {
        this.applyAnchor(this.currentConfig);
      }
      this.trigger.addEventListener("mousedown", this.onDragStart);
      this.trigger.addEventListener("touchstart", this.onDragStart, { passive: false });
      document.addEventListener("mousemove", this.onDragMove, { passive: false });
      document.addEventListener("touchmove", this.onDragMove, { passive: false });
      document.addEventListener("mouseup", this.onDragEnd);
      document.addEventListener("touchend", this.onDragEnd);
      this.documentCleanup.push(() => document.removeEventListener("mousemove", this.onDragMove));
      this.documentCleanup.push(() => document.removeEventListener("touchmove", this.onDragMove));
      this.documentCleanup.push(() => document.removeEventListener("mouseup", this.onDragEnd));
      this.documentCleanup.push(() => document.removeEventListener("touchend", this.onDragEnd));
      const onResize = () => this.applyAnchor(this.currentConfig);
      window.addEventListener("resize", onResize);
      this.documentCleanup.push(() => window.removeEventListener("resize", onResize));
    }
    applyAnchor(config) {
      this.currentConfig = config;
      this.container.style.transition = "none";
      this.container.style.transform = "translate3d(0,0,0)";
      this.container.style.left = config.anchorX === "left" ? `${config.x}px` : "auto";
      this.container.style.right = config.anchorX === "right" ? `${config.x}px` : "auto";
      this.container.style.top = config.anchorY === "top" ? `${config.y}px` : "auto";
      this.container.style.bottom = config.anchorY === "bottom" ? `${config.y}px` : "auto";
    }
    getClientPos(e) {
      if ("touches" in e && e.touches.length > 0) {
        const touch = e.touches[0];
        return touch ? { x: touch.clientX, y: touch.clientY } : { x: 0, y: 0 };
      }
      const mEvent = e;
      return { x: mEvent.clientX, y: mEvent.clientY };
    }
    onDragStart = (e) => {
      if ("button" in e && e.button !== 0) return;
      this.isDragging = true;
      this.hasMoved = false;
      const pos = this.getClientPos(e);
      this.startX = pos.x;
      this.startY = pos.y;
      const rect = this.container.getBoundingClientRect();
      this.startLeft = rect.left;
      this.startTop = rect.top;
      this.container.style.transition = "none";
      this.container.style.right = "auto";
      this.container.style.bottom = "auto";
      this.container.style.left = `${this.startLeft}px`;
      this.container.style.top = `${this.startTop}px`;
      this.container.style.transform = "translate3d(0,0,0)";
      e.stopPropagation();
    };
    onDragMove = (e) => {
      if (!this.isDragging) return;
      if (e.cancelable) e.preventDefault();
      const pos = this.getClientPos(e);
      const dx = pos.x - this.startX;
      const dy = pos.y - this.startY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) this.hasMoved = true;
      requestAnimationFrame(() => {
        if (!this.isDragging) return;
        this.container.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      });
    };
    onDragEnd = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      const rect = this.container.getBoundingClientRect();
      this.container.style.transform = "translate3d(0,0,0)";
      if (this.hasMoved) {
        const isRight = rect.left + rect.width / 2 > window.innerWidth / 2;
        const isBottom = rect.top + rect.height / 2 > window.innerHeight / 2;
        const targetMargin = 20;
        const targetTopPx = Math.min(
          window.innerHeight - rect.height - targetMargin,
          Math.max(targetMargin, rect.top)
        );
        const targetLeftPx = isRight ? window.innerWidth - rect.width - targetMargin : targetMargin;
        this.container.style.transition = "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)";
        this.container.style.left = `${targetLeftPx}px`;
        this.container.style.top = `${targetTopPx}px`;
        const config = {
          anchorX: isRight ? "right" : "left",
          x: targetMargin,
          anchorY: isBottom ? "bottom" : "top",
          y: isBottom ? window.innerHeight - targetTopPx - rect.height : targetTopPx
        };
        if (typeof GM_setValue !== "undefined") {
          GM_setValue(STORAGE_KEYS.FAB_POSITION, JSON.stringify(config));
        }
        setTimeout(() => {
          if (!this.isDragging) this.applyAnchor(config);
        }, 300);
        if (this.onDragEndCallback) {
          this.onDragEndCallback();
        }
      } else {
        this.applyAnchor(this.currentConfig);
      }
    };
    destroy() {
      this.documentCleanup.forEach((fn) => fn());
      this.documentCleanup = [];
      this.trigger.removeEventListener("mousedown", this.onDragStart);
      this.trigger.removeEventListener("touchstart", this.onDragStart);
    }
  }

  const scriptRel = (function detectScriptRel() {
    const relList = typeof document !== "undefined" && document.createElement("link").relList;
    return relList && relList.supports && relList.supports("modulepreload") ? "modulepreload" : "preload";
  })();const assetsURL = function(dep) { return "/"+dep };const seen = {};const __vitePreload = function preload(baseModule, deps, importerUrl) {
    let promise = Promise.resolve();
    if (deps && deps.length > 0) {
      let allSettled2 = function(promises) {
        return Promise.all(
          promises.map(
            (p) => Promise.resolve(p).then(
              (value) => ({ status: "fulfilled", value }),
              (reason) => ({ status: "rejected", reason })
            )
          )
        );
      };
      document.getElementsByTagName("link");
      const cspNonceMeta = document.querySelector(
        "meta[property=csp-nonce]"
      );
      const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
      promise = allSettled2(
        deps.map((dep) => {
          dep = assetsURL(dep);
          if (dep in seen) return;
          seen[dep] = true;
          const isCss = dep.endsWith(".css");
          const cssSelector = isCss ? '[rel="stylesheet"]' : "";
          if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
            return;
          }
          const link = document.createElement("link");
          link.rel = isCss ? "stylesheet" : scriptRel;
          if (!isCss) {
            link.as = "script";
          }
          link.crossOrigin = "";
          link.href = dep;
          if (cspNonce) {
            link.setAttribute("nonce", cspNonce);
          }
          document.head.appendChild(link);
          if (isCss) {
            return new Promise((res, rej) => {
              link.addEventListener("load", res);
              link.addEventListener(
                "error",
                () => rej(new Error(`Unable to preload CSS for ${dep}`))
              );
            });
          }
        })
      );
    }
    function handlePreloadError(err) {
      const e = new Event("vite:preloadError", {
        cancelable: true
      });
      e.payload = err;
      window.dispatchEvent(e);
      if (!e.defaultPrevented) {
        throw err;
      }
    }
    return promise.then((res) => {
      for (const item of res || []) {
        if (item.status !== "rejected") continue;
        handlePreloadError(item.reason);
      }
      return baseModule().catch(handlePreloadError);
    });
  };

  const createDataTabDefinition = () => ({
    id: "data",
    title: t("tabData"),
    navLabel: t("tabData"),
    category: "sync",
    entrypoints: ["sync-center"],
    icon: IconDatabase,
    render: async (shadow, switchTab) => {
      const { renderDataTab } = await __vitePreload(async () => { const { renderDataTab } = await Promise.resolve().then(() => DataTab);return { renderDataTab }},void 0);
      return renderDataTab(shadow, switchTab);
    },
    onUnmount: async () => {
      const { onUnmount } = await __vitePreload(async () => { const { onUnmount } = await Promise.resolve().then(() => DataTab);return { onUnmount }},void 0);
      onUnmount();
    }
  });
  const createSettingsTabDefinition = () => ({
    id: "settings",
    title: t("tabSettings"),
    navLabel: t("tabSettings"),
    category: "configure",
    entrypoints: ["quick-preferences"],
    icon: IconSliders,
    render: async () => {
      const { renderSettingsTab } = await __vitePreload(async () => { const { renderSettingsTab } = await Promise.resolve().then(() => SettingsTab);return { renderSettingsTab }},void 0);
      return renderSettingsTab();
    },
    onUnmount: async () => {
      const { onUnmount } = await __vitePreload(async () => { const { onUnmount } = await Promise.resolve().then(() => SettingsTab);return { onUnmount }},void 0);
      onUnmount();
    }
  });
  const createDebugTabDefinition = () => ({
    id: "debug",
    title: t("labelTechnicalLogs"),
    navLabel: t("labelTechnicalLogs"),
    category: "diagnose",
    entrypoints: ["support-bundle"],
    icon: IconBolt,
    render: async () => {
      const { renderDebugTab } = await __vitePreload(async () => { const { renderDebugTab } = await Promise.resolve().then(() => DebugTab);return { renderDebugTab }},void 0);
      return renderDebugTab();
    },
    onUnmount: async () => {
      const { onUnmount } = await __vitePreload(async () => { const { onUnmount } = await Promise.resolve().then(() => DebugTab);return { onUnmount }},void 0);
      onUnmount();
    }
  });
  const createAboutTabDefinition = () => ({
    id: "about",
    title: t("tabAbout"),
    navLabel: t("tabAbout"),
    category: "info",
    entrypoints: [],
    icon: IconCircleInfo,
    render: async () => {
      const { renderAboutTab } = await __vitePreload(async () => { const { renderAboutTab } = await Promise.resolve().then(() => AboutTab);return { renderAboutTab }},void 0);
      return renderAboutTab();
    }
  });
  const getTabsConfig = () => [
    createDataTabDefinition(),
    createSettingsTabDefinition(),
    createDebugTabDefinition(),
    createAboutTabDefinition()
  ];

  const SETTINGS_PANEL_DEFAULT_TAB_ID = "data";
  const createLoadingOverlay = () => h(
    "div",
    { className: "fc2-loading-overlay" },
    h("div", { className: "fc2-loading-spinner" }),
    h("div", { className: "fc2-loading-text" }, `${t("labelLoading")}...`)
  );
  const createErrorState = (tabId) => h("div", { className: "fc2-error-state" }, `${t("labelError")}: ${tabId}`);
  const createTabContentWrapper = (tabId, element, isFullWidth) => h(
    "div",
    {
      className: `fc2-tab-content-wrapper${isFullWidth ? " full-width" : ""}`,
      "data-tab": tabId
    },
    element
  );
  const shouldInvalidateTabCache = (currentTabId, nextTabId, hasCachedTab) => currentTabId === nextTabId && hasCachedTab;
  const resolveTabEnterDelay = (hasOldContent, hasCachedTab) => hasOldContent && hasCachedTab ? TIMING.UI_TRANSITION_FAST : 0;
  const waitForTabTransition = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

  const mkIcon = (svg) => UIUtils.icon(svg);
  const buildWorkspaceButtons = (tabsConfig, onTabSelect) => tabsConfig.map(
    (tab) => h(
      "button",
      {
        className: "fc2-enh-tab-btn fc2-enh-workspace-btn",
        "data-tab": tab.id,
        "data-settings-category": tab.category,
        onclick: () => onTabSelect(tab.id)
      },
      mkIcon(tab.icon),
      tab.navLabel
    )
  );
  const createSettingsPanelView = ({
    tabsConfig,
    onTabSelect,
    onHide
  }) => {
    const panel = h("div", {
      id: DOM_IDS.SETTINGS_HOST,
      className: "is-hidden"
    });
    const container = h("div", { id: DOM_IDS.SETTINGS_CONTAINER });
    const shadow = container.attachShadow({ mode: "open" });
    shadow.appendChild(h("style", {}, getComponentStyles(Config.CLASSES)));
    const header = h(
      "div",
      { className: "fc2-enh-settings-header" },
      h("div", { className: "fc2-enh-settings-heading" }, h("h2", {}, t("managementCenter") || "Management Center")),
      h(
        "div",
        { className: "fc2-header-actions" },
        h(
          "button",
          { className: "close-btn", onclick: () => onHide(), title: t("btnCancel") || "Close" },
          mkIcon(IconXmark)
        )
      )
    );
    const workspaceNav = h(
      "div",
      { className: "fc2-enh-settings-primary-nav", id: "tab-buttons" },
      ...buildWorkspaceButtons(tabsConfig, onTabSelect)
    );
    const contentArea = h("div", {
      className: "fc2-enh-settings-content",
      id: DOM_IDS.TAB_CONTENT
    });
    const body = h("div", { className: "fc2-enh-settings-body" }, workspaceNav, contentArea);
    const panelInner = h("div", { className: "fc2-enh-settings-panel has-shadow-isolate" }, header, body);
    const backdrop = h("div", {
      className: "enh-modal-backdrop",
      onclick: () => onHide()
    });
    shadow.append(backdrop, panelInner);
    panel.appendChild(container);
    return { panel, shadow };
  };

  let pendingIntent = null;
  const setPendingSettingsNavigationIntent = (intent) => {
    pendingIntent = intent ? { ...intent } : null;
  };
  const consumePendingSettingsNavigationIntent = (targetTab) => {
    if (!pendingIntent || pendingIntent.targetTab !== targetTab) {
      return null;
    }
    const nextIntent = pendingIntent;
    pendingIntent = null;
    return nextIntent;
  };
  const resolveSettingsFocusGroupsFromIntent = (intent) => {
    if (!intent || intent.targetTab !== "settings" || intent.presetKey !== "quick-preferences") {
      return [];
    }
    return ["appearance", "card-actions", "enhancements"];
  };

  const log$2 = Logger.scope("Settings");
  class SettingsPanelControllerImpl {
    constructor(tabsConfig) {
      this.tabsConfig = tabsConfig;
    }
    panel = null;
    shadow = null;
    currentTab = SETTINGS_PANEL_DEFAULT_TAB_ID;
    isSwitching = false;
    pendingTabId = null;
    pendingMountTimer = null;
    switchToken = 0;
    tabCache = new Map();
    overlay = { close: () => this.hide() };
    show(activeTabId) {
      this.ensurePanel();
      if (!this.panel) return;
      const initialTabId = this.resolveInitialTabId(activeTabId);
      if (this.panel.classList.contains("is-hidden") || this.currentTab !== initialTabId) {
        this.panel.classList.remove("is-hidden");
        document.body.classList.add("fc2-settings-open");
        document.addEventListener("keydown", this.handleKeyDown);
        OverlayStack.push(this.overlay);
        CoreEvents.emit(AppEvents.PANEL_OPENED, {});
        void this.switchTab(initialTabId);
      }
    }
    render(activeTabId) {
      this.show(activeTabId);
    }
    hide(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      if (!this.panel) return;
      this.panel.classList.add("is-hidden");
      document.body.classList.remove("fc2-settings-open");
      document.removeEventListener("keydown", this.handleKeyDown);
      if (this.pendingMountTimer !== null) {
        window.clearTimeout(this.pendingMountTimer);
        this.pendingMountTimer = null;
      }
      this.switchToken += 1;
      this.isSwitching = false;
      this.pendingTabId = null;
      OverlayStack.remove(this.overlay);
      CoreEvents.emit(AppEvents.PANEL_CLOSED, {});
    }
    clearCache() {
      this.tabCache.clear();
    }
    get currentTabId() {
      return this.currentTab;
    }
    async switchTab(tabId, intent) {
      this.ensurePanel();
      if (this.isSwitching) {
        this.pendingTabId = tabId;
        if (intent) {
          setPendingSettingsNavigationIntent({ ...intent, targetTab: tabId });
        }
        return;
      }
      if (intent) {
        setPendingSettingsNavigationIntent({ ...intent, targetTab: tabId });
      }
      if (shouldInvalidateTabCache(this.currentTab, tabId, this.tabCache.has(tabId))) {
        this.tabCache.delete(tabId);
      }
      const previousTab = this.tabsConfig.find((tab) => tab.id === this.currentTab);
      const nextTab = this.tabsConfig.find((tab) => tab.id === tabId);
      if (!nextTab || !this.shadow) return;
      const token = ++this.switchToken;
      this.isSwitching = true;
      this.pendingTabId = null;
      const contentContainer = this.getContentContainer();
      if (!contentContainer) {
        log$2.error("Tab content container not found");
        this.finishSwitchCycle(token);
        return;
      }
      try {
        this.unmountTab(previousTab);
        const oldContent = contentContainer.querySelector(".fc2-tab-content-wrapper");
        if (oldContent) {
          oldContent.classList.add("fc2-leaving");
        }
        this.updateNavigationState(tabId);
        let content = this.tabCache.get(tabId);
        if (!content) {
          if (oldContent) {
            await waitForTabTransition(TIMING.UI_TRANSITION_FAST);
          }
          content = await this.renderTabContent(nextTab, tabId, contentContainer);
        }
        const enterDelay = resolveTabEnterDelay(Boolean(oldContent), this.tabCache.has(tabId));
        this.mountTabContent(contentContainer, content, tabId, enterDelay, token);
      } catch (error) {
        this.handleTabRenderError(tabId, contentContainer, error, token);
      }
    }
    handleKeyDown = (event) => {
      if (!this.panel || this.panel.classList.contains("is-hidden")) return;
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        this.saveAndClose();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        this.hide();
      }
    };
    saveAndClose() {
      Toast.show(t("alertSettingsSaved"), "success");
      this.hide();
    }
    ensurePanel() {
      if (this.panel && this.shadow) return;
      const view = createSettingsPanelView({
        tabsConfig: this.tabsConfig,
        onTabSelect: (tabId) => {
          void this.switchTab(tabId);
        },
        onHide: (event) => this.hide(event)
      });
      this.panel = view.panel;
      this.shadow = view.shadow;
      document.body.appendChild(this.panel);
    }
    resolveInitialTabId(activeTabId) {
      if (activeTabId) {
        return activeTabId;
      }
      return SETTINGS_PANEL_DEFAULT_TAB_ID;
    }
    getContentContainer() {
      return this.shadow?.getElementById(DOM_IDS.TAB_CONTENT) ?? null;
    }
    updateNavigationState(tabId) {
      this.shadow?.querySelectorAll(".fc2-enh-workspace-btn").forEach((button) => {
        button.classList.toggle("active", button.dataset.tab === tabId);
      });
    }
    unmountTab(tabDef) {
      if (!tabDef?.onUnmount || !this.shadow) return;
      try {
        tabDef.onUnmount(this.shadow);
      } catch (error) {
        log$2.warn(`Tab unmount error: ${tabDef.id}`, error);
      }
    }
    async renderTabContent(tabDef, tabId, contentContainer) {
      contentContainer.textContent = "";
      contentContainer.appendChild(createLoadingOverlay());
      const element = await tabDef.render(this.shadow, (nextTabId) => this.switchTab(nextTabId));
      const content = createTabContentWrapper(tabId, element, Boolean(tabDef.isFullWidth));
      this.tabCache.set(tabId, content);
      return content;
    }
    mountTabContent(contentContainer, content, tabId, enterDelay, token) {
      if (this.pendingMountTimer !== null) {
        window.clearTimeout(this.pendingMountTimer);
      }
      this.pendingMountTimer = window.setTimeout(() => {
        this.pendingMountTimer = null;
        if (token !== this.switchToken || !this.panel || !this.shadow) {
          return;
        }
        contentContainer.textContent = "";
        content.classList.remove("fc2-entering", "fc2-leaving");
        contentContainer.appendChild(content);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (token !== this.switchToken) {
              return;
            }
            content.classList.add("fc2-entering");
            this.currentTab = tabId;
            Storage.set(STORAGE_KEYS.LAST_SETTINGS_TAB, tabId);
            this.finishSwitchCycle(token);
          });
        });
      }, enterDelay);
    }
    handleTabRenderError(tabId, contentContainer, error, token) {
      log$2.error(`Failed to render tab: ${tabId}`, error);
      contentContainer.textContent = "";
      contentContainer.appendChild(createErrorState(tabId));
      Toast.show(`${t("labelError")}: ${tabId}`, "error");
      this.finishSwitchCycle(token);
    }
    finishSwitchCycle(token) {
      if (token !== this.switchToken) {
        return;
      }
      this.isSwitching = false;
      const nextTabId = this.pendingTabId;
      this.pendingTabId = null;
      if (nextTabId && nextTabId !== this.currentTab) {
        void this.switchTab(nextTabId);
      }
    }
  }
  const createSettingsPanelController = ({
    tabsConfig = getTabsConfig()
  } = {}) => new SettingsPanelControllerImpl(tabsConfig);

  const SettingsPanel = createSettingsPanelController();
  CoreEvents.on(AppEvents.OPEN_SETTINGS, () => {
    SettingsPanel.show();
  });
  CoreEvents.on(AppEvents.LANGUAGE_CHANGED, () => {
    SettingsPanel.clearCache();
    if (!document.body.classList.contains("fc2-settings-open")) return;
    void SettingsPanel.switchTab(SettingsPanel.currentTabId);
  });

  const log$1 = Logger.scope("QuickBar");
  const QUICKBAR_TOGGLE_PROPS = ["hideViewed", "hideNoMagnet", "hideCensored", "isSelectionMode"];
  const QUICKBAR_SYNC_SUCCESS_DOT_DURATION_MS = TIMING.TOAST_DEFAULT_DURATION;
  const isQuickBarToggleProp = (prop) => QUICKBAR_TOGGLE_PROPS.includes(prop);
  const getQuickBarSuccessDotRemainingMs = (syncStatus, lastSyncResult, now = Date.now()) => {
    if (syncStatus !== SYNC_STATUS.SUCCESS || !lastSyncResult?.completedAt) {
      return 0;
    }
    const completedAt = Date.parse(lastSyncResult.completedAt);
    if (Number.isNaN(completedAt)) {
      return 0;
    }
    return Math.max(0, QUICKBAR_SYNC_SUCCESS_DOT_DURATION_MS - (now - completedAt));
  };
  const shouldShowQuickBarSyncDot = (syncMode, syncStatus, lastSyncResult, now = Date.now()) => {
    if (syncMode === "none" || syncStatus === SYNC_STATUS.IDLE) {
      return false;
    }
    if (syncStatus === SYNC_STATUS.SUCCESS) {
      return getQuickBarSuccessDotRemainingMs(syncStatus, lastSyncResult, now) > 0;
    }
    return true;
  };
  const formatQuickBarFilterTitle = (baseTitle, count) => count > 0 ? `${baseTitle} (${count})` : baseTitle;
  const applyQuickBarFilterCountUpdate = (actions, counts) => {
    QUICKBAR_TOGGLE_PROPS.forEach((prop) => {
      if (prop === "isSelectionMode") return;
      const button = actions.querySelector(`[data-prop="${prop}"]`);
      if (!button) return;
      const baseTitle = button.getAttribute("data-base-title") || button.getAttribute("data-title") || "";
      const nextTitle = formatQuickBarFilterTitle(baseTitle, Number(counts[prop] || 0));
      button.setAttribute("data-title", nextTitle);
      button.setAttribute("aria-label", nextTitle);
      button.setAttribute("title", nextTitle);
    });
  };
  const readQuickBarFilterCountsFromBody = () => ({
    hideViewed: Number(document.body.dataset.fc2HideViewedCount || 0),
    hideNoMagnet: Number(document.body.dataset.fc2HideNoMagnetCount || 0),
    hideCensored: Number(document.body.dataset.fc2HideCensoredCount || 0)
  });
  const applyQuickBarStateChange = (elements, change, state) => {
    const dot = elements.trigger.querySelector(".fc2-sync-dot");
    if (dot) {
      const nextSyncMode = change.prop === "syncMode" ? String(change.value) : state.syncMode;
      const nextSyncStatus = change.prop === "syncStatus" ? String(change.value) : state.syncStatus;
      const nextSyncResult = change.prop === "lastSyncResult" ? change.value ?? null : state.lastSyncResult;
      if (change.prop === "syncStatus") {
        dot.className = `fc2-sync-dot ${String(change.value)}`;
      }
      if (change.prop === "syncStatus" || change.prop === "syncMode" || change.prop === "lastSyncResult") {
        dot.style.display = shouldShowQuickBarSyncDot(nextSyncMode, nextSyncStatus, nextSyncResult) ? "block" : "none";
      }
    }
    if (change.prop === "syncStatus") {
      elements.syncButton.classList.toggle("active", change.value === "syncing");
    }
    if (isQuickBarToggleProp(change.prop)) {
      const button = elements.actions.querySelector(`[data-prop="${change.prop}"]`);
      if (button) button.classList.toggle("active", !!change.value);
    }
  };
  const createQuickBarButton = (iconSvg, title, prop, onClick) => {
    const appState = State.proxy;
    return h(
      "button",
      {
        className: `fc2-fab-btn ${prop && appState[prop] ? "active" : ""}`,
        "data-title": title,
        "data-base-title": title,
        title,
        ...prop ? { "data-prop": prop } : {},
        onclick: (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (prop) {
            appState[prop] = !appState[prop];
            return;
          }
          onClick?.();
        }
      },
      UIUtils.icon(iconSvg)
    );
  };
  const createQuickBarView = () => {
    const container = h("div", { className: "fc2-fab-container" });
    const actions = h("div", { className: "fc2-fab-actions" });
    const syncButton = createQuickBarButton(IconRotate, t("labelSyncing"), null, () => {
      if (State.proxy.syncMode === "none") {
        Toast.show(t("syncModeNone"), "info");
        SettingsPanel.show("data");
        return;
      }
      if (State.proxy.syncStatus === "syncing") {
        Toast.show(t("labelSyncing"), "info");
        return;
      }
      void SyncService.performSync(true).catch(() => void 0);
    });
    actions.append(
      syncButton,
      createQuickBarButton(IconEyeSlash, t("optionHideViewed"), "hideViewed"),
      createQuickBarButton(IconMagnet, t("optionHideNoMagnet"), "hideNoMagnet"),
      createQuickBarButton(IconBan, t("optionHideCensored"), "hideCensored"),
      createQuickBarButton(IconListUl, t("labelSelectionMode"), "isSelectionMode"),
      createQuickBarButton(IconGear, t("tabSettings"), null, () => SettingsPanel.show()),
      createQuickBarButton(
        IconArrowUp,
        t("btnBackToTop"),
        null,
        () => window.scrollTo({ top: 0, behavior: "smooth" })
      )
    );
    const trigger = h(
      "button",
      { className: "fc2-fab-trigger", "aria-label": t("btnMoreOptions") },
      UIUtils.icon(IconPlus),
      h("div", {
        className: `fc2-sync-dot ${State.proxy.syncStatus}`,
        style: {
          display: shouldShowQuickBarSyncDot(
            State.proxy.syncMode,
            State.proxy.syncStatus,
            State.proxy.lastSyncResult
          ) ? "block" : "none"
        }
      })
    );
    applyQuickBarFilterCountUpdate(actions, readQuickBarFilterCountsFromBody());
    container.append(actions, trigger);
    return { container, actions, trigger, syncButton };
  };
  class QuickBarService {
    container = null;
    hostWrapper = null;
    documentCleanup = [];
    serviceCleanup = [];
    syncDotHideTimer = null;
    async onInit() {
      log$1.debug("Initializing QuickBar");
      this.cleanupServiceListeners();
      this.render();
      this.bindGlobalEvents();
    }
    onCleanup() {
      this.cleanupDocumentListeners();
      this.cleanupServiceListeners();
      this.unmount();
    }
    bindGlobalEvents() {
      this.serviceCleanup.push(
        CoreEvents.on(AppEvents.LANGUAGE_CHANGED, () => {
          MenuService.register();
          this.render();
        })
      );
      this.serviceCleanup.push(
        CoreEvents.on(AppEvents.PANEL_OPENED, () => {
          if (this.container) this.container.style.display = "none";
        })
      );
      this.serviceCleanup.push(
        CoreEvents.on(AppEvents.PANEL_CLOSED, () => {
          if (this.container) this.container.style.display = "";
        })
      );
    }
    cleanupDocumentListeners() {
      this.clearSyncDotHideTimer();
      this.documentCleanup.forEach((fn) => fn());
      this.documentCleanup = [];
    }
    clearSyncDotHideTimer() {
      if (this.syncDotHideTimer) {
        clearTimeout(this.syncDotHideTimer);
        this.syncDotHideTimer = null;
      }
    }
    syncDotDisplayState() {
      return shouldShowQuickBarSyncDot(State.proxy.syncMode, State.proxy.syncStatus, State.proxy.lastSyncResult) ? "block" : "none";
    }
    scheduleSyncDotAutoHide(trigger) {
      this.clearSyncDotHideTimer();
      const remainingMs = getQuickBarSuccessDotRemainingMs(State.proxy.syncStatus, State.proxy.lastSyncResult);
      if (remainingMs <= 0) {
        return;
      }
      this.syncDotHideTimer = setTimeout(() => {
        const dot = trigger.querySelector(".fc2-sync-dot");
        if (dot) {
          dot.style.display = this.syncDotDisplayState();
        }
        this.syncDotHideTimer = null;
      }, remainingMs);
    }
    bindStateUpdates(trigger, syncButton, actions) {
      const unsubscribe = State.on((change) => {
        applyQuickBarStateChange(
          { trigger, syncButton, actions },
          { prop: String(change.prop), value: change.value },
          {
            syncMode: State.proxy.syncMode,
            syncStatus: State.proxy.syncStatus,
            lastSyncResult: State.proxy.lastSyncResult
          }
        );
        if (change.prop === "syncStatus" || change.prop === "syncMode" || change.prop === "lastSyncResult") {
          this.scheduleSyncDotAutoHide(trigger);
        }
      });
      this.documentCleanup.push(unsubscribe);
      const filterUnsubscribe = CoreEvents.on(AppEvents.FILTER_COUNTS_CHANGED, (counts) => {
        applyQuickBarFilterCountUpdate(actions, counts);
      });
      this.documentCleanup.push(filterUnsubscribe);
      applyQuickBarFilterCountUpdate(actions, readQuickBarFilterCountsFromBody());
      this.scheduleSyncDotAutoHide(trigger);
    }
    cleanupServiceListeners() {
      this.serviceCleanup.forEach((fn) => fn());
      this.serviceCleanup = [];
    }
    mount(container) {
      this.container = container;
      this.hostWrapper = h("div", { className: "fc2-quickbar-host" }, container);
      UIHost.add(this.hostWrapper);
    }
    unmount() {
      this.container?.remove();
      this.hostWrapper?.remove();
      this.container = null;
      this.hostWrapper = null;
    }
    render() {
      this.cleanupDocumentListeners();
      this.unmount();
      if (!State.proxy.enableQuickBar) return;
      const { container, actions, trigger, syncButton } = createQuickBarView();
      this.bindStateUpdates(trigger, syncButton, actions);
      this.initDraggable(container, trigger, actions);
      this.mount(container);
    }
    initDraggable(container, trigger, actions) {
      const dragManager = new DragManager(container, trigger);
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!dragManager.hasMoved) {
          const visible = actions.classList.toggle("visible");
          trigger.classList.toggle("active", visible);
        }
      });
      const closeFAB = (event) => {
        if (!event.composedPath().includes(container) && actions.classList.contains("visible")) {
          actions.classList.remove("visible");
          trigger.classList.remove("active");
        }
      };
      document.addEventListener("click", closeFAB, true);
      this.documentCleanup.push(() => {
        document.removeEventListener("click", closeFAB, true);
        dragManager.destroy();
      });
    }
  }
  AppContainer.register("quickbar", new QuickBarService());

  class BatchBar {
    static element = null;
    static countElement = null;
    static init() {
      CoreEvents.on(AppEvents.SELECTION_CHANGED, ({ count }) => {
        this.updateVisibility(count);
        this.updateCount(count);
      });
      State.on("isSelectionMode", (value) => {
        if (!value) {
          this.hide();
        } else {
          this.updateVisibility(SelectionService.getCount());
        }
      });
    }
    static updateVisibility(count) {
      if (State.proxy.isSelectionMode && count > 0) {
        this.show();
      } else {
        this.hide();
      }
    }
    static show() {
      if (!this.element) {
        this.render();
      }
      if (this.element) {
        this.element.classList.add("is-visible");
      }
    }
    static hide() {
      if (this.element) {
        this.element.classList.remove("is-visible");
      }
    }
    static updateCount(count) {
      if (this.countElement) {
        this.countElement.textContent = t("batchSelectionCount", { count });
      }
    }
    static render() {
      this.countElement = h("span", { className: "batch-bar-count" });
      const actions = h(
        "div",
        { className: "batch-bar-actions" },
        h(
          "button",
          {
            className: "batch-btn primary",
            onclick: () => this.handleMarkViewed(true)
          },
          t("batchActionMarkViewed")
        ),
        h(
          "button",
          {
            className: "batch-btn",
            onclick: () => this.handleMarkViewed(false)
          },
          t("batchActionMarkUnviewed")
        ),
        h(
          "button",
          {
            className: "batch-btn",
            onclick: () => this.handleCopyIds()
          },
          t("batchActionCopyIds")
        ),
        h(
          "button",
          {
            className: "batch-btn accent",
            onclick: () => this.handleExtractMagnets()
          },
          t("batchActionExtractMagnets")
        ),
        h(
          "button",
          {
            className: "batch-btn danger",
            onclick: () => SelectionService.clearSelection()
          },
          t("batchActionCancel")
        )
      );
      this.element = h("div", { id: "fc2-batch-bar", className: "fc2-batch-bar" }, this.countElement, actions);
      UIHost.add(this.element);
    }
    static async handleMarkViewed(viewed) {
      const ids = SelectionService.getSelectedIds();
      if (ids.length === 0) return;
      try {
        if (viewed) {
          await HistoryService.addBatch(ids, "watched");
        } else {
          await HistoryService.removeBatch(ids);
        }
        Toast.show(t("alertSettingsSaved"), "success");
        SelectionService.clearSelection();
        State.proxy.isSelectionMode = false;
      } catch {
        Toast.show(t("labelError"), "error");
      }
    }
    static handleCopyIds() {
      const ids = SelectionService.getSelectedIds();
      if (ids.length === 0) return;
      const text = ids.join("\n");
      navigator.clipboard.writeText(text).then(() => {
        Toast.show(t("tooltipCopied"), "success");
      });
    }
    static async handleExtractMagnets() {
      const ids = SelectionService.getSelectedIds();
      if (ids.length === 0) return;
      Toast.show(t("batchExtractPlaceholder"), "info");
      const magnets = [];
      for (const id of ids) {
        try {
          const url = await MagnetService.fetchMagnet(id, "fc2");
          if (url) magnets.push(url);
        } catch {
        }
      }
      if (magnets.length === 0) {
        Toast.show(t("batchExtractEmpty"), "warn");
        return;
      }
      const text = magnets.join("\n");
      navigator.clipboard.writeText(text).then(() => {
        Toast.show(t("batchExtractSuccess", { count: magnets.length }), "success");
      });
    }
  }

  const log = Logger.scope("Main");
  const isCloudflareChallenge = () => {
    return document.title.includes("Just a moment...") || !!document.querySelector("#challenge-running") || !!document.querySelector('iframe[src*="challenges.cloudflare.com"]');
  };
  const main = async () => {
    Logger.init();
    if (isCloudflareChallenge()) {
      log.warn("Cloudflare challenge detected, skipping initialization");
      return;
    }
    try {
      Logger.group("Main", `${SCRIPT_INFO.NAME} bootstrap`);
      await AppContainer.bootstrap();
      CoreEvents.emit(AppEvents.UI_READY, {});
      log.info("System initialized");
      Logger.groupEnd();
    } catch (error) {
      log.error("Bootstrap failed", error);
    }
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
  } else {
    main();
  }
  BatchBar.init();

  class TabLifecycle {
    controller = null;
    cleanups = [];
    reset() {
      this.dispose();
      this.controller = ReactiveController.create();
      return this.controller;
    }
    get ctrl() {
      if (!this.controller) {
        throw new Error("TabLifecycle: reset() must be called before accessing ctrl");
      }
      return this.controller;
    }
    addCleanup(fn) {
      this.cleanups.push(fn);
    }
    dispose() {
      if (this.controller) {
        this.controller.dispose();
        this.controller = null;
      }
      this.cleanups.forEach((fn) => fn());
      this.cleanups = [];
    }
  }

  const Checkbox = (props) => {
    const { id, label, checked, onChange, controller, binding } = props;
    const checkbox = h("input", {
      id: `set-${id}`,
      type: "checkbox",
      checked: checked || false,
      onchange: !controller || !binding ? (e) => {
        const isChecked = e.target.checked;
        if (onChange) onChange(isChecked);
      } : void 0
    });
    const container = h(
      "label",
      { className: "fc2-enh-checkbox-label", htmlFor: `set-${id}` },
      checkbox,
      h("span", { className: "fc2-enh-checkbox-text" }, label)
    );
    if (controller && binding) {
      controller.bind(checkbox, { key: binding, mode: "checked" });
    }
    return container;
  };

  const FormRow = (props) => {
    const { label, children, className = "" } = props;
    const childArray = Array.isArray(children) ? children : [children];
    return h(
      "div",
      { className: `fc2-enh-form-row ${className}` },
      label ? h("label", { className: "fc2-enh-label" }, label) : null,
      ...childArray
    );
  };
  const CheckboxRow = (props) => {
    const { className = "" } = props;
    const checkboxLabel = Checkbox(props);
    checkboxLabel.className = `${checkboxLabel.className} fc2-enh-form-row checkbox ${className}`;
    return checkboxLabel;
  };

  const resolveIcon$1 = (icon) => typeof icon === "string" ? UIUtils.icon(icon) : icon;
  const Button = (props) => {
    const { text, onClick, className = "", icon, title, disabled, style } = props;
    const btn = h(
      "button",
      {
        className: `fc2-enh-btn ${className}`.trim(),
        title: title || "",
        disabled: !!disabled,
        onclick: (e) => {
          const result = onClick(e);
          if (result instanceof Promise) {
            result.catch((err) => Logger.error("UI", "Button action error", err));
          }
        }
      },
      icon ? resolveIcon$1(icon) : null,
      text ? h("span", { className: "fc2-btn-text" }, text) : null
    );
    if (style) {
      Object.assign(btn.style, style);
    }
    return btn;
  };

  const Input = (props) => {
    const { id, type, value, placeholder, validator, onChange, controller, binding } = props;
    const input = h("input", {
      id: `set-${id}`,
      className: "fc2-enh-input",
      type: type === "number" ? "text" : type,
      inputMode: type === "number" ? "numeric" : void 0,
      pattern: type === "number" ? "[0-9]*" : void 0,
      value: value || "",
      placeholder: placeholder || "",
      oninput: (e) => {
        const target = e.target;
        const newValue = target.value;
        if (validator) {
          const result = validator(newValue);
          if (!result.valid) {
            target.classList.add("invalid");
            target.title = result.error || "Invalid input";
          } else {
            target.classList.remove("invalid");
            target.title = "";
          }
        }
        if (!controller || !binding) {
          if (onChange) {
            onChange(newValue);
          }
        }
      },
      autocomplete: "off",
      spellcheck: false
    });
    if (controller && binding) {
      controller.bind(input, {
        key: binding,
        mode: "value",
        onChange: onChange ? (v) => onChange(v) : void 0
      });
    }
    return input;
  };

  const Select = (props) => {
    const { id, options, value, onChange, controller, binding } = props;
    const select = h(
      "select",
      {
        id: `set-${id}`,
        className: "fc2-enh-select",
        onchange: !controller || !binding ? (e) => {
          const newValue = e.target.value;
          if (onChange) {
            onChange(newValue);
          }
        } : void 0
      },
      ...options.map(
        (opt) => h(
          "option",
          {
            value: opt.value,
            selected: value !== void 0 ? opt.value === value : false
          },
          opt.label
        )
      )
    );
    if (controller && binding) {
      controller.bind(select, {
        key: binding,
        mode: "value",
        onChange: onChange ? (v) => onChange(v) : void 0
      });
    }
    return select;
  };

  const resolveIcon = (icon) => typeof icon === "string" ? UIUtils.icon(icon) : icon;
  const Card = (props) => {
    const { title, subtitle, icon, children, className = "", collapsed, dataGroupKey } = props;
    const childArray = Array.isArray(children) ? children : [children];
    const body = h("div", { className: "fc2-panel-card-body" }, ...childArray);
    const root = h(
      "div",
      {
        className: `fc2-panel-card${collapsed ? " is-collapsed" : ""} ${className}`.trim(),
        "data-settings-group": dataGroupKey
      },
      h(
        "h4",
        { className: "fc2-panel-card-heading" },
        icon ? resolveIcon(icon) : null,
        h("span", { className: "fc2-card-title" }, title),
        subtitle ? h("div", { className: "fc2-card-subtitle" }, subtitle) : null,
        subtitle ? h("div", { className: "fc2-card-subtitle" }, subtitle) : null
      ),
      body
    );
    return root;
  };

  const StatItem = (props) => {
    const { id, label, value, unit } = props;
    const valContainer = h("div", {
      className: "fc2-stat-value",
      id: id ? `stat-${id}` : void 0
    });
    if (value instanceof HTMLElement) {
      valContainer.appendChild(value);
    } else {
      valContainer.textContent = String(value);
    }
    if (unit) {
      valContainer.appendChild(h("span", { className: "fc2-stat-unit" }, unit));
    }
    return h("div", { className: "fc2-stat-item" }, h("div", { className: "fc2-stat-label" }, label), valContainer);
  };

  const renderToggleIcon = (isPassword) => UIUtils.icon(isPassword ? IconEye : IconEyeSlash);
  const PasswordInput = (props) => {
    const input = Input({ ...props, type: "password" });
    const toggle = h("button", {
      className: "fc2-input-toggle",
      type: "button",
      onclick: () => {
        const isPass = input.type === "password";
        input.type = isPass ? "text" : "password";
        toggle.textContent = "";
        toggle.appendChild(renderToggleIcon(!isPass));
      }
    });
    toggle.appendChild(renderToggleIcon(true));
    return h("div", { className: "fc2-input-group" }, input, toggle);
  };

  const ColorPicker = ({ id, options, controller, binding, onChange }) => {
    const container = h("div", { className: "fc2-color-picker", id });
    const updateSelection = (value) => {
      container.querySelectorAll(".fc2-color-option").forEach((el) => {
        const elValue = el.getAttribute("data-value");
        el.classList.toggle("is-active", elValue === value);
      });
    };
    options.forEach((option) => {
      const item = h("button", {
        className: "fc2-color-option",
        title: option.label,
        dataset: { value: option.value },
        style: { "--option-color": option.value }
      });
      item.addEventListener("click", () => {
        const value = option.value;
        updateSelection(value);
        {
          State.proxy[binding] = value;
        }
        onChange?.(value);
      });
      container.appendChild(item);
    });
    if (controller && binding) {
      const initialValue = State.proxy[binding];
      updateSelection(initialValue);
      controller.listen(binding, (val) => updateSelection(val));
    }
    return container;
  };

  const BACKUP_IMPORT_ERROR_TRANSLATION_KEYS = {
    invalid_json: "backupImportErrorInvalidJson",
    invalid_payload: "backupImportErrorInvalidPayload",
    unsupported_version: "backupImportErrorUnsupportedVersion",
    read_failed: "backupImportErrorReadFailed",
    apply_failed: "backupImportErrorApplyFailed"
  };
  const buildStoragePreviewEntries = (textValue, tags = []) => {
    const lines = textValue.split(/\r?\n/).filter(Boolean);
    return [...tags, ...lines];
  };
  const shouldConfirmDestructiveAction = (confirmDialog, confirmResetMessage, confirmDestructiveMessage) => confirmDialog(confirmResetMessage) && confirmDialog(confirmDestructiveMessage);
  const buildDebugEnvPayload = (input) => JSON.stringify(
    {
      version: input.version,
      ua: input.ua,
      url: input.url,
      syncMode: input.syncMode,
      debugMode: input.debugMode
    },
    null,
    2
  );
  const getBackupImportErrorTranslationKey = (errorCode) => BACKUP_IMPORT_ERROR_TRANSLATION_KEYS[errorCode];
  const buildBackupImportErrorMessage = (errorCode, translate) => translate(getBackupImportErrorTranslationKey(errorCode));

  const capitalize = (value) => value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;
  const formatDataTabLastSync = (rawValue, neverLabel, formatter = (value) => new Date(value).toLocaleString()) => {
    if (rawValue === null || rawValue === void 0 || rawValue === "" || rawValue === neverLabel) {
      return neverLabel;
    }
    if (typeof rawValue === "number") {
      return Number.isFinite(rawValue) ? formatter(rawValue) : neverLabel;
    }
    const parsedTime = Date.parse(rawValue);
    if (Number.isNaN(parsedTime)) {
      return rawValue;
    }
    return formatter(rawValue);
  };
  const buildDataTabSyncViewModel = (syncMode, syncStatus, translate, lastSyncDisplay, syncResult) => {
    const modeLabel = syncMode === "webdav" ? translate("syncModeWebDAV") : syncMode === "supabase" ? translate("syncModeSupabase") : translate("syncModeNone");
    const resultSummary = syncResult?.summary ? ` · ${syncResult.summary}` : "";
    if (syncMode === "none") {
      return {
        modeLabel,
        statusLabel: modeLabel,
        detail: `${translate("labelLastSync")}: ${lastSyncDisplay}${resultSummary}`,
        tone: "idle"
      };
    }
    return {
      modeLabel,
      statusLabel: capitalize(syncStatus),
      detail: `${translate("labelLastSync")}: ${lastSyncDisplay}${resultSummary}`,
      tone: syncStatus
    };
  };
  const buildSyncResultPanelViewModel = (syncResult, neverLabel, translate, formatter = (value) => new Date(value).toLocaleString()) => {
    if (!syncResult) {
      return {
        title: translate("syncLatestTitle"),
        summary: translate("syncLatestEmpty"),
        completedAt: neverLabel,
        conflictText: "",
        conflictStats: []
      };
    }
    const conflictStats = syncResult.conflict ? [
      translate("syncConflictLocalNewer", { count: syncResult.conflict.localNewer }),
      translate("syncConflictRemoteNewer", { count: syncResult.conflict.remoteNewer }),
      translate("syncConflictMerged", { count: syncResult.conflict.merged })
    ] : [];
    const detailText = syncResult.errorMessage || syncResult.conflict?.explanation || "";
    return {
      title: translate("syncLatestTitle"),
      summary: syncResult.detailSummary || syncResult.summary,
      completedAt: syncResult.completedAt ? formatDataTabLastSync(syncResult.completedAt, neverLabel, formatter) : neverLabel,
      conflictText: detailText,
      conflictStats
    };
  };
  const buildBackupDiffLines = (diff, translate) => {
    const lines = [
      translate("backupSettingsAdded", { count: diff.settingsAdded.length }),
      translate("backupSettingsChanged", { count: diff.settingsChanged.length }),
      translate("backupHistoryRows", { count: diff.historyToImport })
    ];
    if (diff.settingsChanged.length > 0) {
      lines.push(translate("backupChangedKeys", { keys: diff.settingsChanged.join(", ") }));
    }
    return lines;
  };

  const showImportError = (message) => {
    Toast.show(message || t("alertImportError"), "error");
  };
  const createDestructiveHandler = (action, successMessage, render, confirmDialog) => async () => {
    if (!shouldConfirmDestructiveAction(confirmDialog, t("confirmResetDatabase"), t("confirmDestructiveAction"))) {
      return;
    }
    await action();
    Toast.show(successMessage, "success");
    render("data");
  };
  const createImportHandler = ({
    setPreview,
    pickBackupFile,
    confirmDialog,
    reloadPage
  }) => async () => {
    const file = await pickBackupFile();
    if (!file) return;
    const previewResult = await BackupService.previewImportDetailed(file);
    if (!previewResult.ok || !previewResult.preview) {
      const errorMessage = buildBackupImportErrorMessage(previewResult.errorCode ?? "invalid_payload", t);
      setPreview(errorMessage, [t("labelError")]);
      Toast.show(errorMessage, "error");
      return;
    }
    const preview = previewResult.preview;
    const tags = buildBackupDiffLines(preview.diff, t);
    const previewText = formatBackupImportDiff(preview.diff, t);
    setPreview(previewText, tags);
    if (!confirmDialog(`${t("backupImportConfirm")}

${previewText}`)) {
      return;
    }
    const importResult = await BackupService.importDataDetailed(file);
    if (!importResult.success) {
      const errorMessage = buildBackupImportErrorMessage(importResult.errorCode ?? "apply_failed", t);
      setPreview(errorMessage, [t("labelError")]);
      showImportError(errorMessage);
      return;
    }
    Toast.show(t("alertImportSuccess"), "success");
    setTimeout(() => reloadPage(), TIMING.RELOAD_DELAY_NORMAL);
  };
  const createExportHandler = () => async () => {
    const success = await BackupService.exportData();
    if (!success) {
      showImportError();
      return;
    }
    Toast.show(t("backupExportSuccessPlain"), "success");
  };
  const createStorageSectionActions = ({
    render,
    setPreview,
    pickBackupFile,
    confirmDialog,
    reloadPage,
    copyText
  }) => ({
    handleExport: createExportHandler(),
    handleImport: createImportHandler({ setPreview, pickBackupFile, confirmDialog, reloadPage }),
    handleClearCache: createDestructiveHandler(
      () => Repository.cache.clear(),
      t("alertCacheCleared"),
      render,
      confirmDialog
    ),
    handleClearHistory: createDestructiveHandler(
      () => HistoryService.clear(),
      t("alertHistoryCleared"),
      render,
      confirmDialog
    ),
    handleToggleDebugMode: () => {
      State.proxy.debugMode = !State.proxy.debugMode;
      Toast.show(State.proxy.debugMode ? t("alertDebugOn") : t("alertDebugOff"), "info");
      render("data");
    },
    handleCopyEnv: () => {
      copyText(
        buildDebugEnvPayload({
          version: SCRIPT_INFO.VERSION,
          ua: navigator.userAgent,
          url: location.href,
          syncMode: State.proxy.syncMode,
          debugMode: State.proxy.debugMode
        })
      );
      Toast.show(t("alertLogsCopied"), "success");
    }
  });

  const createBackupFilePicker = () => new Promise((resolve) => {
    const input = h("input", { type: "file", accept: ".json" });
    input.onchange = () => resolve(input.files?.[0] || null);
    input.click();
  });
  const buildStorageSection = (render) => {
    const previewLines = h("div", { className: "fc2-backup-preview-lines" });
    const setPreview = (textValue, tags = []) => {
      previewLines.textContent = "";
      const entries = buildStoragePreviewEntries(textValue, tags);
      if (entries.length === 0) {
        previewLines.style.display = "none";
        return;
      }
      previewLines.style.display = "flex";
      entries.forEach((entry) => {
        previewLines.appendChild(h("div", { className: "fc2-backup-preview-line" }, entry));
      });
    };
    const actions = createStorageSectionActions({
      render,
      setPreview,
      pickBackupFile: createBackupFilePicker,
      confirmDialog: (message) => confirm(message),
      reloadPage: () => location.reload(),
      copyText: (text) => {
        void navigator.clipboard.writeText(text);
      }
    });
    setPreview("");
    return Card({
      title: t("groupDataManagement"),
      icon: IconDatabase,
      children: [
        h(
          "div",
          { className: "fc2-grid-actions" },
          Button({ text: t("btnClearCache"), className: "danger ghost", onClick: actions.handleClearCache }),
          Button({ text: t("btnClearHistory"), className: "danger ghost", onClick: actions.handleClearHistory }),
          Button({
            text: t("btnExportData"),
            icon: UIUtils.icon(IconFileExport),
            onClick: actions.handleExport
          }),
          Button({
            text: t("btnImportData"),
            icon: UIUtils.icon(IconFileImport),
            onClick: actions.handleImport
          })
        ),
        h("div", { className: "fc2-sync-result-panel" }, previewLines),
        FormRow({
          label: t("labelDebugMode"),
          children: h(
            "div",
            { className: "fc2-input-group" },
            Button({
              text: State.proxy.debugMode ? t("statusDebugOn") : t("statusDebugOff"),
              className: State.proxy.debugMode ? "primary" : "",
              onClick: actions.handleToggleDebugMode
            }),
            Button({
              text: t("btnCopyEnv"),
              icon: UIUtils.icon(IconSliders),
              onClick: actions.handleCopyEnv
            })
          )
        })
      ]
    });
  };

  const createSyncStatusElements = (render) => {
    const statusPill = h("span", { className: "fc2-sync-status-pill idle" }, t("syncModeNone"));
    const statusTitle = h("span", { className: "fc2-sync-summary-title" }, t("syncModeNone"));
    const statusDetail = h(
      "span",
      { className: "fc2-sync-summary-detail" },
      `${t("labelLastSync")}: ${t("labelNever")}`
    );
    const resultSummary = h("div", { className: "fc2-sync-result-summary" }, t("syncLatestEmpty"));
    const resultMeta = h("div", { className: "fc2-label-dim" }, `${t("labelLastSync")}: ${t("labelNever")}`);
    const conflictHint = h("div", { className: "fc2-label-dim" }, t("syncNoConflictYet"));
    const conflictStats = h("div", { className: "fc2-sync-conflicts-list" });
    const element = h(
      "div",
      { className: "fc2-sync-result-panel" },
      h(
        "div",
        { className: "fc2-sync-summary" },
        statusPill,
        h("div", { className: "fc2-sync-summary-copy" }, statusTitle, statusDetail)
      ),
      h("div", { className: "fc2-sync-result-body" }, resultSummary, resultMeta, conflictHint, conflictStats),
      h(
        "div",
        { className: "fc2-portal-actions" },
        Button({ text: t("syncActionDebugLogs"), className: "ghost", onClick: () => render("debug") })
      )
    );
    return { statusPill, statusTitle, statusDetail, resultSummary, resultMeta, conflictHint, conflictStats, element };
  };
  const createSummaryRefresher = (ui, getLastSyncDisplay) => {
    return () => {
      const viewModel = buildDataTabSyncViewModel(
        State.proxy.syncMode,
        State.proxy.syncStatus,
        t,
        getLastSyncDisplay(),
        State.proxy.lastSyncResult
      );
      const resultView = buildSyncResultPanelViewModel(State.proxy.lastSyncResult, t("labelNever"), t);
      ui.statusPill.className = `fc2-sync-status-pill ${viewModel.tone}`;
      ui.statusPill.textContent = viewModel.statusLabel;
      ui.statusTitle.textContent = viewModel.modeLabel;
      ui.statusDetail.textContent = viewModel.detail;
      ui.resultSummary.textContent = resultView.summary;
      ui.resultMeta.textContent = `${t("syncCompletedAt")}: ${resultView.completedAt}`;
      ui.conflictHint.textContent = resultView.conflictText || t("syncNoConflictYet");
      ui.conflictStats.textContent = "";
      resultView.conflictStats.forEach((line) => {
        ui.conflictStats.appendChild(h("div", { className: "fc2-label-dim" }, line));
      });
    };
  };
  const buildSyncModeRow = (ctrl, render) => FormRow({
    label: t("labelSyncMode"),
    children: Select({
      id: "syncMode",
      options: [
        { value: "none", label: t("syncModeNone") },
        { value: "webdav", label: t("syncModeWebDAV") },
        { value: "supabase", label: t("syncModeSupabase") }
      ],
      controller: ctrl,
      binding: "syncMode",
      onChange: () => render("data")
    })
  });
  const buildSyncIntervalRow = (ctrl) => FormRow({
    label: t("labelSyncInterval"),
    children: Select({
      id: "syncInterval",
      options: [
        { value: "0", label: t("syncInterval0") },
        { value: "2", label: t("syncInterval2") },
        { value: "5", label: t("syncInterval5") },
        { value: "10", label: t("syncInterval10") },
        { value: "30", label: t("syncInterval30") },
        { value: "-1", label: t("syncIntervalManual") }
      ],
      controller: ctrl,
      binding: "syncInterval"
    })
  });
  const buildSyncSettingsRows = (ctrl, render) => {
    const rows = [buildSyncModeRow(ctrl, render)];
    if (State.proxy.syncMode !== "none") {
      rows.push(buildSyncIntervalRow(ctrl));
    }
    return rows;
  };
  const buildSyncConfigSection = (ctrl, render, lifecycle, getLastSyncDisplay) => {
    const ui = createSyncStatusElements(render);
    const refresh = createSummaryRefresher(ui, getLastSyncDisplay);
    lifecycle.addCleanup(State.on("syncStatus", refresh));
    lifecycle.addCleanup(State.on("syncMode", refresh));
    lifecycle.addCleanup(State.on("lastSyncResult", refresh));
    const children = [ui.element, ...buildSyncSettingsRows(ctrl, render)];
    refresh();
    return Card({
      title: t("syncStatus"),
      icon: IconLink,
      children
    });
  };

  const createProviderActionRow = (actions) => h("div", { className: "fc2-card-actions" }, ...actions);
  const createSyncStatusSection = ({
    lastSyncText,
    diagnosticText,
    actions
  }) => h("div", { className: "fc2-auth-section" }, lastSyncText, diagnosticText, createProviderActionRow(actions));
  const createStandardSyncButtons = ({
    syncLabel,
    forcePushLabel,
    forcePullLabel,
    onSync,
    onForcePush,
    onForcePull,
    confirmDestructive
  }) => {
    const buttons = [
      Button({ text: syncLabel, className: "primary", onClick: onSync }),
      Button({
        text: forcePushLabel,
        className: "danger ghost",
        onClick: () => {
          if (!confirmDestructive("push")) {
            return;
          }
          onForcePush();
        }
      })
    ];
    if (forcePullLabel && onForcePull) {
      buttons.push(
        Button({
          text: forcePullLabel,
          className: "danger ghost",
          onClick: () => {
            if (!confirmDestructive("pull")) {
              return;
            }
            onForcePull();
          }
        })
      );
    }
    return buttons;
  };

  const toErrorMessage = (error) => {
    let message = error instanceof Error ? error.message : String(error);
    if (error && typeof error === "object" && "response" in error && typeof error.response === "string") {
      try {
        const parsed = JSON.parse(error.response);
        if (parsed.message) {
          message = `${parsed.message}${parsed.hint ? ` (${parsed.hint})` : ""}`;
        }
      } catch {
        return message;
      }
    }
    return message;
  };
  const getSyncProviderDiagnostic = (mode, syncResult) => {
    if (!syncResult || syncResult.mode !== mode) {
      return "";
    }
    if (syncResult.status === "error") {
      return syncResult.errorMessage || syncResult.summary;
    }
    if (syncResult.status === "conflict") {
      return syncResult.conflict?.explanation || syncResult.summary;
    }
    return "";
  };

  const confirmDestructiveSyncAction = (mode) => {
    const messageKey = mode === "push" ? "alertPushAllQuery" : "alertPullAllQuery";
    return confirm(t(messageKey));
  };

  const runDataTabSyncAction = async (action) => {
    try {
      await action();
    } catch (error) {
      Toast.show(`${t("labelError") || "Error"}: ${toErrorMessage(error)}`, "error", {
        duration: 1e4
      });
    }
  };
  const createSyncStatusSummary = (provider, lifecycle, getLastSyncDisplay) => {
    const lastSyncText = h("p", { className: "dim" }, `${t("labelLastSync")}: ${getLastSyncDisplay()}`);
    const diagnosticText = h("p", { className: "dim" });
    const refreshStatus = () => {
      lastSyncText.textContent = `${t("labelLastSync")}: ${getLastSyncDisplay()}`;
      diagnosticText.textContent = getSyncProviderDiagnostic(provider, State.proxy.lastSyncResult);
      diagnosticText.style.display = diagnosticText.textContent ? "" : "none";
    };
    lifecycle.addCleanup(State.on("syncStatus", refreshStatus));
    lifecycle.addCleanup(State.on("lastSyncResult", refreshStatus));
    refreshStatus();
    return {
      lastSyncText,
      diagnosticText,
      refreshStatus
    };
  };

  const handleSupabaseConnectAndSync = async (render) => {
    Logger.debug("DataTab", "Connect and Sync clicked", {
      url: State.proxy.supabaseUrl,
      key: !!State.proxy.supabaseKey,
      hasEmail: !!State.proxy.supabaseEmail,
      hasPass: !!State.proxy.supabasePassword
    });
    try {
      if (!State.proxy.supabaseUrl || !State.proxy.supabaseKey) {
        throw new Error(t("alertSbUrlRequired") || "Missing Supabase URL or Key");
      }
      if (State.proxy.supabaseEmail && State.proxy.supabasePassword) {
        Logger.debug("DataTab", "Attempting login...");
        await SyncService.login(State.proxy.supabaseEmail, State.proxy.supabasePassword);
        Toast.show(t("alertSyncAccountConnected") || "Account connected", "success");
        render("data");
      }
      await SyncService.performSync(true);
    } catch (error) {
      Logger.error("DataTab", "Action failed", error);
      Toast.show(`${t("labelError") || "Error"}: ${toErrorMessage(error)}`, "error", {
        duration: 1e4
      });
    }
  };
  const createSupabaseActionButtons = (render) => [
    Button({
      text: t("btnConnectAndSync"),
      className: "primary",
      onClick: () => handleSupabaseConnectAndSync(render)
    }),
    ...createStandardSyncButtons({
      syncLabel: t("btnSyncNow"),
      forcePushLabel: t("btnForceSync") || "Force Push",
      forcePullLabel: t("btnPullSync") || "Force Pull",
      onSync: () => void runDataTabSyncAction(() => SyncService.performSync(true)),
      onForcePush: () => void runDataTabSyncAction(() => SyncService.forceFullSync(true)),
      onForcePull: () => void runDataTabSyncAction(() => SyncService.forcePullSync(true)),
      confirmDestructive: confirmDestructiveSyncAction
    }),
    Button({
      text: t("btnLogout"),
      className: "danger",
      onClick: async () => {
        await SyncService.logout();
        render("data");
      }
    })
  ];
  const buildSupabaseSection = (ctrl, render, lifecycle, getLastSyncDisplay) => {
    const { lastSyncText, diagnosticText } = createSyncStatusSummary("supabase", lifecycle, getLastSyncDisplay);
    return Card({
      title: t("labelSupabaseSync"),
      icon: IconRotate,
      children: [
        FormRow({
          label: t("labelSupabaseUrl"),
          children: Input({ id: "supabaseUrl", type: "url", controller: ctrl, binding: "supabaseUrl" })
        }),
        FormRow({
          label: t("labelSupabaseKey"),
          children: PasswordInput({ id: "supabaseKey", controller: ctrl, binding: "supabaseKey" })
        }),
        FormRow({
          label: t("labelAuthEmail") || "Email",
          children: Input({ id: "supabaseEmail", type: "email", controller: ctrl, binding: "supabaseEmail" })
        }),
        FormRow({
          label: t("labelAuthPass"),
          children: PasswordInput({ id: "supabasePassword", controller: ctrl, binding: "supabasePassword" })
        }),
        createSyncStatusSection({
          lastSyncText,
          diagnosticText,
          actions: createSupabaseActionButtons(render)
        })
      ]
    });
  };

  const buildWebDAVSection = (ctrl, lifecycle, getLastSyncDisplay) => {
    const { lastSyncText, diagnosticText } = createSyncStatusSummary("webdav", lifecycle, getLastSyncDisplay);
    return Card({
      title: t("groupWebDAV"),
      icon: IconServer,
      children: [
        FormRow({
          label: t("labelWebDAVUrl"),
          children: Input({
            id: "webdavUrl",
            type: "url",
            controller: ctrl,
            binding: "webdavUrl",
            placeholder: "https://..."
          })
        }),
        FormRow({
          label: t("labelWebDAVUser"),
          children: Input({ id: "webdavUser", type: "text", controller: ctrl, binding: "webdavUser" })
        }),
        FormRow({
          label: t("labelWebDAVPass"),
          children: PasswordInput({ id: "webdavPass", controller: ctrl, binding: "webdavPass" })
        }),
        createSyncStatusSection({
          lastSyncText,
          diagnosticText,
          actions: [
            Button({
              text: t("btnWebDAVTest"),
              onClick: async () => {
                try {
                  await SyncService.testWebDAV();
                  Toast.show(t("alertWebDAVSuccess"), "success");
                } catch {
                  Toast.show(t("alertWebDAVError"), "error");
                }
              }
            }),
            ...createStandardSyncButtons({
              syncLabel: t("btnWebDAVSync"),
              forcePushLabel: t("btnForceSync"),
              onSync: () => void runDataTabSyncAction(() => SyncService.performSync(true)),
              onForcePush: () => void runDataTabSyncAction(() => SyncService.forceFullSync(true)),
              confirmDestructive: confirmDestructiveSyncAction
            })
          ]
        })
      ]
    });
  };

  const buildSystemDiagnosisSection = () => {
    const statusMap = {};
    const targets = [
      { id: "sukebei", label: t("scraperTargetSukebei"), url: "https://sukebei.nyaa.si" },
      { id: "fd2", label: t("scraperTargetFd2"), url: "https://fd2ppv.cc" },
      { id: "paipancon", label: t("scraperTargetPaipancon"), url: "https://paipancon.com" }
    ];
    const createStatusRow = (label, id, url) => {
      const statusEl = h("span", { className: "status-indicator loading" }, t("scraperStatusLoading"));
      statusMap[id] = statusEl;
      return h(
        "div",
        { className: "fc2-scraper-row" },
        h(
          "div",
          { className: "scraper-info" },
          h("span", { className: "scraper-label" }, label),
          h(
            "a",
            { href: url, target: "_blank", rel: "noopener noreferrer", className: "scraper-url micro-link" },
            UIUtils.icon(IconLink)
          )
        ),
        statusEl
      );
    };
    const runTest = async () => {
      for (const target of targets) {
        const el = statusMap[target.id];
        if (!el) continue;
        el.className = "status-indicator loading";
        el.textContent = t("scraperStatusLoading");
        const result = await ScraperService.testHealth(target.id);
        el.className = `status-indicator ${result}`;
        if (result === "ok") el.textContent = t("scraperStatusOk");
        else if (result === "cf") el.textContent = t("scraperStatusCF");
        else if (result === "429") el.textContent = t("scraperStatus429");
        else el.textContent = t("scraperStatusError");
      }
    };
    return Card({
      title: t("groupScraperDiagnosis"),
      icon: IconVial,
      children: [
        h(
          "div",
          { className: "fc2-scraper-list" },
          ...targets.map((target) => createStatusRow(target.label, target.id, target.url))
        ),
        h(
          "div",
          { className: "fc2-card-actions" },
          Button({
            text: t("btnTestScrapers"),
            icon: UIUtils.icon(IconPlay),
            onClick: runTest
          })
        )
      ]
    });
  };

  const buildDataOverviewSection = (lifecycle) => {
    const cacheValue = h("span", {}, t("labelLoading"));
    const historyValue = h("span", {}, t("labelLoading"));
    let disposed = false;
    const loadCounts = async () => {
      try {
        const [cacheCount, historyCount] = await Promise.all([
          Repository.db.cache.count(),
          Repository.db.history.where("is_deleted").equals(0).count()
        ]);
        if (disposed) {
          return;
        }
        cacheValue.textContent = String(cacheCount);
        historyValue.textContent = String(historyCount);
      } catch (error) {
        Logger.error("DataTab", "Failed to load overview counts", error);
        if (disposed) {
          return;
        }
        cacheValue.textContent = "--";
        historyValue.textContent = "--";
      }
    };
    lifecycle.addCleanup(() => {
      disposed = true;
    });
    lifecycle.addCleanup(CoreEvents.on(AppEvents.COLLECTION_UPDATED, () => void loadCounts()));
    lifecycle.addCleanup(CoreEvents.on(AppEvents.HISTORY_CHANGED, () => void loadCounts()));
    void loadCounts();
    return Card({
      title: t("tabStatistics"),
      icon: IconServer,
      children: [
        h(
          "div",
          { className: "fc2-settings-card-grid fc2-data-overview-grid" },
          StatItem({ label: t("labelCacheManagement"), value: cacheValue }),
          StatItem({ label: t("labelHistoryManagement"), value: historyValue })
        )
      ]
    });
  };

  const lifecycle$1 = new TabLifecycle();
  const getLastSyncDisplay = () => {
    const rawValue = typeof GM_getValue !== "undefined" ? GM_getValue(STORAGE_KEYS.LAST_SYNC_TS, t("labelNever")) : t("labelNever");
    return formatDataTabLastSync(rawValue, t("labelNever"), (value) => new Date(value).toLocaleString());
  };
  const renderDataTab = (_shadow, render) => {
    const ctrl = lifecycle$1.reset();
    const navigationIntent = consumePendingSettingsNavigationIntent("data");
    const prioritizeSync = navigationIntent?.presetKey === "sync-center";
    const overviewSection = buildDataOverviewSection(lifecycle$1);
    const storageSection = buildStorageSection(render);
    const syncConfigSection = buildSyncConfigSection(ctrl, render, lifecycle$1, getLastSyncDisplay);
    const providerSections = [
      State.proxy.syncMode === "webdav" ? buildWebDAVSection(ctrl, lifecycle$1, getLastSyncDisplay) : null,
      State.proxy.syncMode === "supabase" ? buildSupabaseSection(ctrl, render, lifecycle$1, getLastSyncDisplay) : null
    ];
    const sections = prioritizeSync ? [syncConfigSection, overviewSection, storageSection, buildSystemDiagnosisSection(), ...providerSections] : [overviewSection, storageSection, buildSystemDiagnosisSection(), syncConfigSection, ...providerSections];
    return h(
      "div",
      {
        className: "fc2-data-container",
        "data-intent-focus": navigationIntent?.presetKey || ""
      },
      ...sections.filter((section) => section !== null)
    );
  };
  const onUnmount$2 = () => {
    lifecycle$1.dispose();
  };

  const DataTab = Object.freeze( Object.defineProperty({
      __proto__: null,
      onUnmount: onUnmount$2,
      renderDataTab
  }, Symbol.toStringTag, { value: 'Module' }));

  const normalizeSettingsSearchQuery = (value) => value.trim().toLowerCase();
  const SETTINGS_GROUP_KEYS = ["appearance", "filters", "enhancements", "card-actions", "portals"];
  const getCollapsedSettingsGroups = (collapsedGroups) => SETTINGS_GROUP_KEYS.filter((groupKey) => collapsedGroups.includes(groupKey));
  const applySettingsCollapsedGroups = (grid, collapsedGroups) => {
    const collapsedSet = new Set(getCollapsedSettingsGroups(collapsedGroups));
    grid.querySelectorAll("[data-settings-group]").forEach((card) => {
      const groupKey = card.getAttribute("data-settings-group");
      if (!groupKey) {
        return;
      }
      const isCollapsed = collapsedSet.has(groupKey);
      card.classList.toggle("is-collapsed", isCollapsed);
      const toggle = card.querySelector(".fc2-card-collapse-toggle");
      toggle?.classList.toggle("is-collapsed", isCollapsed);
      toggle?.setAttribute("aria-expanded", String(!isCollapsed));
    });
  };
  const applySettingsGroupSpotlight = (grid, groupKeys) => {
    const spotlightGroups = new Set(groupKeys);
    grid.querySelectorAll("[data-settings-group]").forEach((card) => {
      const groupKey = card.getAttribute("data-settings-group");
      card.classList.toggle("is-home-spotlight", !!groupKey && spotlightGroups.has(groupKey));
    });
  };
  const getNextEnabledPortals = (currentEnabled, portalId, checked) => {
    const enabled = [...currentEnabled];
    if (checked && !enabled.includes(portalId)) {
      enabled.push(portalId);
    }
    if (!checked) {
      return enabled.filter((id) => id !== portalId);
    }
    return enabled;
  };
  const getAllPortalIds = (portals) => portals.map((portal) => portal.id);
  const syncPortalGridState = (portalGrid, enabled) => {
    portalGrid.querySelectorAll(".portal-item").forEach((element) => {
      const portalId = element.getAttribute("data-portal-id");
      if (!portalId) return;
      const isActive = enabled.includes(portalId);
      element.classList.toggle("active", isActive);
      const input = element.querySelector("input");
      if (input instanceof HTMLInputElement) {
        input.checked = isActive;
      }
    });
  };

  const previewModeOptions = [
    { value: "static", label: t("previewModeStatic") },
    { value: "hover", label: t("previewModeHover") }
  ];
  const cardDensityOptions = [
    { value: "minimal", label: t("cardDensityMinimal") },
    { value: "balanced", label: t("cardDensityBalanced") },
    { value: "immersive", label: t("cardDensityImmersive") }
  ];
  const accentColorOptions = [
    { value: "#ffffff", label: t("accentColorDefault") },
    { value: "#cba6f7", label: t("accentColorPurple") },
    { value: "#f5c2e7", label: t("accentColorPink") },
    { value: "#89b4fa", label: t("accentColorBlue") },
    { value: "#a6e3a1", label: t("accentColorGreen") },
    { value: "#fab387", label: t("accentColorOrange") },
    { value: "#f9e2af", label: t("accentColorGold") }
  ];
  const languageOptions = [
    { value: "auto", label: t("langAuto") },
    { value: "zh-CN", label: t("langZh") },
    { value: "en-US", label: t("langEn") },
    { value: "ja-JP", label: t("langJa") }
  ];
  const gridColumnOptions = [0, 1, 2, 3, 4, 5, 6].map((value) => ({
    value: String(value),
    label: value === 0 ? t("labelDefault") : String(value)
  }));

  const DEFAULT_CARD_PRIMARY_ACTIONS = ["id", "viewed", "magnet", "external"];
  const getCardPrimaryActions = () => {
    const value = State.proxy.cardPrimaryActions;
    return Array.isArray(value) ? value : DEFAULT_CARD_PRIMARY_ACTIONS;
  };
  const toggleCardPrimaryAction = (action, checked) => {
    const current = getCardPrimaryActions();
    const next = checked ? Array.from( new Set([...current, action])) : current.filter((item) => item !== action);
    State.proxy.cardPrimaryActions = [...next];
  };
  const createCardActionLayoutCard = (ctrl) => {
    const actionOptions = [
      { key: "id", label: t("cardActionId") },
      { key: "viewed", label: t("cardActionViewed") },
      { key: "magnet", label: t("cardActionMagnet") },
      { key: "play", label: t("cardActionPlay") },
      { key: "preview", label: t("cardActionPreview") },
      { key: "external", label: t("cardActionExternal") }
    ];
    const rows = actionOptions.map((option) => {
      const row = CheckboxRow({
        id: `card-action-${option.key}`,
        label: option.label,
        checked: getCardPrimaryActions().includes(option.key),
        onChange: (checked) => toggleCardPrimaryAction(option.key, checked)
      });
      const input = row.querySelector("input");
      ctrl.listen("cardPrimaryActions", (value) => {
        if (input) {
          input.checked = Array.isArray(value) && value.includes(option.key);
        }
      });
      return row;
    });
    return Card({
      title: t("groupCardActions"),
      icon: IconGear,
      className: "is-advanced",
      dataGroupKey: "card-actions",
      children: [
        h("div", { className: "fc2-enh-hint dim" }, t("cardActionDirectHint")),
        h("div", { className: "fc2-settings-card-grid" }, ...rows)
      ]
    });
  };
  const createFilterCard = (ctrl) => Card({
    title: t("groupFilters"),
    icon: IconFilter,
    dataGroupKey: "filters",
    children: [
      CheckboxRow({
        id: "hideNoMagnet",
        label: t("optionHideNoMagnet"),
        controller: ctrl,
        binding: "hideNoMagnet"
      }),
      CheckboxRow({
        id: "hideCensored",
        label: t("optionHideCensored"),
        controller: ctrl,
        binding: "hideCensored"
      }),
      CheckboxRow({ id: "hideViewed", label: t("optionHideViewed"), controller: ctrl, binding: "hideViewed" })
    ]
  });
  const createAppearanceCard = (ctrl) => Card({
    title: t("groupAppearance"),
    icon: IconPalette,
    dataGroupKey: "appearance",
    children: [
      FormRow({
        label: t("labelPreviewMode"),
        children: Select({
          id: "previewMode",
          options: previewModeOptions,
          controller: ctrl,
          binding: "previewMode"
        })
      }),
      FormRow({
        label: t("labelGridColumns"),
        children: Select({
          id: "gridColumns",
          options: gridColumnOptions,
          controller: ctrl,
          binding: "userGridColumns",
          onChange: (value) => {
            CoreEvents.emit(AppEvents.GRID_CHANGED, Number(value));
          }
        })
      }),
      FormRow({
        label: t("labelCardDensity"),
        children: Select({
          id: "cardDensity",
          options: cardDensityOptions,
          controller: ctrl,
          binding: "cardDensity"
        })
      }),
      FormRow({
        label: t("labelAccentColor"),
        children: ColorPicker({
          id: "accentColor",
          options: accentColorOptions,
          controller: ctrl,
          binding: "accentColor"
        })
      }),
      FormRow({
        label: t("labelLanguage"),
        children: Select({ id: "language", options: languageOptions, controller: ctrl, binding: "language" })
      })
    ]
  });
  const createAdvancedFeatureBlock = (ctrl) => h(
    "div",
    { className: "fc2-settings-advanced-block" },
    h("div", { className: "fc2-settings-advanced-label", textContent: t("settingsAdvancedSection") }),
    h(
      "div",
      { className: "fc2-settings-card-grid" },
      CheckboxRow({
        id: "enableActressName",
        label: t("optionEnableActressName"),
        controller: ctrl,
        binding: "enableActressName"
      }),
      CheckboxRow({
        id: "loadExtraPreviews",
        label: t("optionLoadExtraPreviews"),
        controller: ctrl,
        binding: "loadExtraPreviews"
      }),
      CheckboxRow({
        id: "showViewedBtn",
        label: t("optionShowViewedBtn"),
        controller: ctrl,
        binding: "showViewedBtn"
      }),
      CheckboxRow({
        id: "showIdBadge",
        label: t("optionShowIdBadge"),
        controller: ctrl,
        binding: "showIdBadge"
      }),
      CheckboxRow({
        id: "supjavSortByViews",
        label: t("optionSupjavSortByViews"),
        controller: ctrl,
        binding: "supjavSortByViews"
      })
    )
  );
  const createFeatureCard = (ctrl) => Card({
    title: t("groupDataHistory"),
    icon: IconClockRotateLeft,
    dataGroupKey: "enhancements",
    children: [
      h(
        "div",
        { className: "fc2-settings-card-grid" },
        CheckboxRow({
          id: "enableMagnets",
          label: t("optionEnableMagnets"),
          controller: ctrl,
          binding: "enableMagnets"
        }),
        CheckboxRow({
          id: "enableExternalLinks",
          label: t("optionEnableExternalLinks"),
          controller: ctrl,
          binding: "enableExternalLinks"
        }),
        CheckboxRow({
          id: "replaceFc2Covers",
          label: t("optionReplaceFc2Covers"),
          controller: ctrl,
          binding: "replaceFc2Covers"
        }),
        CheckboxRow({
          id: "enableQuickBar",
          label: t("optionEnableQuickBar"),
          controller: ctrl,
          binding: "enableQuickBar"
        }),
        CheckboxRow({
          id: "enableHistory",
          label: t("optionEnableHistory"),
          controller: ctrl,
          binding: "enableHistory"
        })
      ),
      createAdvancedFeatureBlock(ctrl)
    ]
  });
  const createPortalsCard = ({
    portalGrid,
    portals,
    onPortalSelectionChange
  }) => Card({
    title: t("groupExternalPortals"),
    icon: IconLink,
    className: "is-advanced",
    dataGroupKey: "portals",
    children: [
      h(
        "div",
        { className: "fc2-portal-actions" },
        Button({
          text: t("btnSelectAll"),
          className: "ghost micro",
          onClick: () => onPortalSelectionChange(getAllPortalIds(portals))
        }),
        Button({
          text: t("btnDeselectAll"),
          className: "ghost micro",
          onClick: () => onPortalSelectionChange([])
        })
      ),
      portalGrid
    ]
  });

  const createPortalGridItem = (portal, onPortalSelectionChange) => {
    const enabledPortals = State.proxy.enabledPortals || [];
    const isEnabled = enabledPortals.includes(portal.id);
    return h(
      "label",
      {
        className: `portal-item ${isEnabled ? "active" : ""}`,
        "data-portal-id": portal.id
      },
      h("input", {
        type: "checkbox",
        checked: isEnabled,
        onchange: (event) => {
          const checked = event.target.checked;
          onPortalSelectionChange(getNextEnabledPortals(State.proxy.enabledPortals || [], portal.id, checked));
        }
      }),
      h("span", {}, portal.name)
    );
  };
  const createPortalGrid = (ctrl, portals, onPortalSelectionChange) => {
    const portalGrid = h(
      "div",
      { className: "portal-grid" },
      ...portals.map((portal) => createPortalGridItem(portal, onPortalSelectionChange))
    );
    ctrl.listen("enabledPortals", (value) => {
      syncPortalGridState(portalGrid, value || []);
    });
    return portalGrid;
  };

  const createSettingsTabGrid = ({
    ctrl,
    portalGrid,
    portals,
    onPortalSelectionChange
  }) => h(
    "div",
    { className: "fc2-settings-grid" },
    h(
      "div",
      { className: "fc2-settings-grid-main" },
      createAppearanceCard(ctrl),
      createFilterCard(ctrl),
      createFeatureCard(ctrl)
    ),
    h(
      "div",
      { className: "fc2-settings-grid-side" },
      createCardActionLayoutCard(ctrl),
      createPortalsCard({ portalGrid, portals, onPortalSelectionChange })
    )
  );

  const lifecycle = new TabLifecycle();
  const updateEnabledPortals = (enabledPortalIds) => {
    State.proxy.enabledPortals = enabledPortalIds;
    PortalService.clearCache();
  };
  const renderSettingsTab = () => {
    const ctrl = lifecycle.reset();
    const navigationIntent = consumePendingSettingsNavigationIntent("settings");
    const spotlightGroups = resolveSettingsFocusGroupsFromIntent(navigationIntent);
    const initialQuery = normalizeSettingsSearchQuery(State.proxy.settingsSearchQuery || "");
    State.proxy.settingsSearchQuery = initialQuery;
    const portals = PortalService.getAllPortals();
    const portalGrid = createPortalGrid(ctrl, portals, updateEnabledPortals);
    const grid = createSettingsTabGrid({
      ctrl,
      portalGrid,
      portals,
      onPortalSelectionChange: updateEnabledPortals
    });
    const root = h(
      "div",
      {
        className: `fc2-settings-tab ${"is-advanced-visible" }`.trim(),
        "data-intent-focus": navigationIntent?.presetKey || ""
      },
      grid
    );
    if (spotlightGroups.length > 0) {
      State.proxy.settingsCollapsedGroups = [];
    }
    applySettingsCollapsedGroups(grid, State.proxy.settingsCollapsedGroups || []);
    applySettingsGroupSpotlight(grid, spotlightGroups);
    return root;
  };
  const onUnmount$1 = () => {
    lifecycle.dispose();
  };

  const SettingsTab = Object.freeze( Object.defineProperty({
      __proto__: null,
      onUnmount: onUnmount$1,
      renderSettingsTab
  }, Symbol.toStringTag, { value: 'Module' }));

  const downloadJsonFile = (filename, payload) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      anchor.remove();
    }, 100);
  };

  const createDefaultDebugLogFilters = () => ({
    [LogLevel.ERROR]: true,
    [LogLevel.WARN]: true,
    [LogLevel.INFO]: true,
    [LogLevel.DEBUG]: false,
    [LogLevel.TRACE]: false
  });
  const filterDebugLogs = (entries, activeFilters, traceId) => {
    const normalizedTraceId = traceId?.trim();
    return entries.filter((entry) => {
      const matchesLevel = !!activeFilters[entry.level];
      const matchesTraceId = !normalizedTraceId || entry.traceId === normalizedTraceId;
      return matchesLevel && matchesTraceId;
    });
  };
  const formatDebugClipboardText = (entries) => entries.map((entry) => {
    const count = entry.count && entry.count > 1 ? ` x${entry.count}` : "";
    return `[${entry.timestamp}] [${entry.levelName}${count}] [${entry.module}] ${entry.message}`;
  }).join("\n");

  const createDebugLogItem = (entry) => {
    const countTag = entry.count && entry.count > 1 ? ` x${entry.count}` : "";
    const item = h(
      "div",
      { className: `fc2-log-item level-${(entry.levelName || "INFO").toLowerCase()}` },
      h("span", { className: "fc2-log-time" }, `[${entry.timestamp}]`),
      h("span", { className: "fc2-log-level" }, `${entry.levelName}${countTag}`),
      h("span", { className: "fc2-log-module" }, `[${entry.module}]`),
      h("span", { className: "fc2-log-msg" }, entry.message),
      entry.traceId ? h("span", { className: "fc2-log-trace" }, `#${entry.traceId}`) : null
    );
    if (entry.data) {
      const dataView = h(
        "pre",
        { className: "fc2-log-payload", style: { display: "none" } },
        JSON.stringify(entry.data, null, 2)
      );
      const toggle = h(
        "button",
        {
          className: "fc2-log-payload-toggle",
          onclick: () => {
            const isHidden = dataView.style.display === "none";
            dataView.style.display = isHidden ? "block" : "none";
          }
        },
        UIUtils.icon(IconDatabase),
        ` ${t("debugPayload")}`
      );
      item.append(toggle, dataView);
    }
    return item;
  };

  let container = null;
  let listContainer = null;
  let traceFilterInput = null;
  const activeFilters = createDefaultDebugLogFilters();
  const getTraceId = () => traceFilterInput?.value.trim() || "";
  const getFilteredLogs = () => {
    const traceId = getTraceId();
    return filterDebugLogs(exportLogHistory({ traceId: traceId || void 0 }), activeFilters, traceId);
  };
  const refresh = () => {
    if (!listContainer) return;
    listContainer.textContent = "";
    getFilteredLogs().reverse().forEach((entry) => listContainer.appendChild(createDebugLogItem(entry)));
  };
  const downloadLogs = (sanitized) => {
    const traceId = getTraceId();
    const payload = exportLogHistory({ sanitized, traceId: traceId || void 0 });
    downloadJsonFile("fc2-debug.json", payload);
  };
  const renderDebugTab = () => {
    const navigationIntent = consumePendingSettingsNavigationIntent("debug");
    traceFilterInput = h("input", {
      className: "fc2-enh-input",
      placeholder: t("debugTraceIdPlaceholder"),
      oninput: () => refresh()
    });
    container = h(
      "div",
      {
        className: "fc2-debug-container",
        "data-intent-focus": navigationIntent?.presetKey || ""
      },
      h(
        "div",
        { className: "fc2-debug-header" },
        h(
          "div",
          { className: "fc2-debug-actions" },
          Button({
            icon: UIUtils.icon(IconMagnifyingGlass),
            text: t("btnCopyAll"),
            onClick: () => {
              navigator.clipboard.writeText(formatDebugClipboardText(getFilteredLogs()));
              Toast.show(t("alertLogsCopied"), "success");
            }
          }),
          Button({
            text: t("debugExportJson"),
            onClick: () => downloadLogs(false)
          }),
          Button({
            text: t("btnClearLogs"),
            className: "danger",
            onClick: () => {
              Logger.clear();
              refresh();
              Toast.show(t("alertLogsCleared"), "success");
            }
          })
        ),
        h(
          "div",
          { className: "fc2-debug-filters" },
          h("span", { className: "fc2-label-dim" }, t("labelLogFilters")),
          traceFilterInput,
          ...[LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG, LogLevel.TRACE].map(
            (level) => Checkbox({
              id: `filter-${level}`,
              label: LogLevel[level],
              checked: activeFilters[level],
              onChange: (val) => {
                activeFilters[level] = val;
                refresh();
              }
            })
          )
        )
      ),
      listContainer = h("div", { id: DOM_IDS.LOG_LIST, className: "fc2-log-list-container" })
    );
    refresh();
    return container;
  };
  const onUnmount = () => {
    container = null;
    listContainer = null;
    traceFilterInput = null;
  };

  const DebugTab = Object.freeze( Object.defineProperty({
      __proto__: null,
      onUnmount,
      renderDebugTab
  }, Symbol.toStringTag, { value: 'Module' }));

  const safeContent = (htmlStr, className) => h("div", { className, innerHTML: htmlStr });
  const renderAboutTab = () => {
    return h(
      "div",
      { className: "fc2-about-tab" },
      h(
        "div",
        { className: "fc2-about-header" },
        h("h2", {}, SCRIPT_INFO.NAME),
        h("div", { className: "fc2-version-badge" }, `v${SCRIPT_INFO.VERSION}`),
        h("p", { className: "fc2-about-desc" }, t("aboutDescription"))
      ),
      Card({
        title: t("aboutHelpTitle"),
        icon: IconCircleInfo,
        children: safeContent(t("aboutHelpContent"), "fc2-about-content")
      }),
      Card({
        title: t("tabDmca"),
        icon: IconTriangleExclamation,
        className: "warning",
        children: safeContent(t("dmcaContent"), "fc2-about-content dmca")
      }),
      h(
        "div",
        { className: "fc2-about-footer" },
        h(
          "a",
          {
            href: SCRIPT_INFO.GREASYFORK_URL,
            target: "_blank",
            rel: "noopener noreferrer",
            className: "fc2-link"
          },
          t("labelGreasyFork")
        ),
        h("span", { className: "dim" }, " | "),
        h("span", { className: "dim" }, t("aboutFooterTagline"))
      )
    );
  };

  const AboutTab = Object.freeze( Object.defineProperty({
      __proto__: null,
      renderAboutTab
  }, Symbol.toStringTag, { value: 'Module' }));

})(Dexie);