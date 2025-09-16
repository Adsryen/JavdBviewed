/*
 * Unified Console Proxy for extension-only contexts
 * - Controls console output level, category-based filtering, timestamp formatting, and colors
 * - Does NOT persist logs; purely display-layer control
 * - Safe to install multiple times (idempotent guard)
 */

export type LogLevel = 'OFF' | 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

interface FormatOptions {
  showTimestamp: boolean; // prepend [HH:mm:ss]
  timestampStyle?: 'hms';
  timeZone?: string; // e.g. 'Asia/Shanghai'
  showSource: boolean; // show [SOURCE]
  color: boolean; // enable colored prefix
}

export interface CategoryRule {
  enabled: boolean;
  // Determine if args belong to this category
  match: RegExp | ((args: any[]) => boolean);
  label?: string; // label to show in [SOURCE]
  color?: string; // css color for category label
}

export interface ConsoleProxyOptions {
  level?: LogLevel;
  format?: Partial<FormatOptions>;
  categories?: Record<string, Partial<CategoryRule> & { match: CategoryRule['match'] } >;
}

interface InternalConfig {
  level: LogLevel;
  levelValue: number; // numeric for comparison
  format: FormatOptions;
  categories: Record<string, CategoryRule>;
}

// Numeric severity mapping (higher means more important)
const LEVEL_SEVERITY: Record<Exclude<LogLevel, 'OFF'>, number> = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
};

function toSeverity(level: LogLevel): number {
  if (level === 'OFF') return Infinity; // nothing passes
  return LEVEL_SEVERITY[level];
}

// Default categories (extension self logs common tags)
function buildDefaultCategories(): Record<string, CategoryRule> {
  return {
    core: {
      enabled: true,
      match: /\[(JavDB\s*Ext|JavDB\s*Extension)\]/i,
      label: 'CORE',
      color: '#16a085',
    },
    orchestrator: {
      enabled: true,
      match: /\[Orchestrator\]/i,
      label: 'ORCH',
      color: '#8e44ad',
    },
    drive115: {
      enabled: true,
      match: /\[(Drive115|115V?2?)\]|\bDrive115\b/i,
      label: '115',
      color: '#d35400',
    },
    privacy: {
      enabled: true,
      match: /Privacy|隐私|\[PRIVACY\]/i,
      label: 'PRIVACY',
      color: '#c0392b',
    },
    magnet: {
      enabled: true,
      match: /Magnet|磁链|magnet/i,
      label: 'MAGNET',
      color: '#27ae60',
    },
    actor: {
      enabled: true,
      match: /ActorManager/i,
      label: 'ACTOR',
      color: '#2980b9',
    },
    storage: {
      enabled: true,
      match: /\[(StorageManager|STORAGE)\]|Storage|存储/i,
      label: 'STORAGE',
      color: '#2c3e50',
    },
    general: {
      enabled: true,
      match: () => true,
      label: 'GENERAL',
      color: '#7f8c8d',
    },
  };
}

function mergeCategories(base: Record<string, CategoryRule>, extra?: ConsoleProxyOptions['categories']): Record<string, CategoryRule> {
  if (!extra) return base;
  const out: Record<string, CategoryRule> = { ...base };
  for (const [k, v] of Object.entries(extra)) {
    const prev = out[k] || { enabled: true, match: v.match, label: k.toUpperCase() } as CategoryRule;
    out[k] = {
      enabled: v.enabled ?? prev.enabled,
      match: v.match ?? prev.match,
      label: v.label ?? prev.label ?? k.toUpperCase(),
      color: v.color ?? prev.color,
    };
  }
  return out;
}

function getLocalTimeHHMMSS(tz?: string): string {
  try {
    if (tz) {
      return new Intl.DateTimeFormat('zh-CN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: tz,
      }).format(new Date());
    }
    // default local
    return new Intl.DateTimeFormat('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date());
  } catch {
    // Fallback
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
}

function safeToString(x: any): string {
  try {
    if (x == null) return String(x);
    if (typeof x === 'string') return x;
    if (typeof x === 'number' || typeof x === 'boolean') return String(x);
    if (typeof x === 'function') return '[Function]';
    if (typeof x === 'object') {
      // Avoid circular reference issues
      const cache = new WeakSet();
      return JSON.stringify(x, (_k, v) => {
        if (typeof v === 'object' && v !== null) {
          if (cache.has(v)) return '[Circular]';
          cache.add(v);
        }
        return v;
      });
    }
    return String(x);
  } catch {
    return '[Unserializable]';
  }
}

function pickCategory(args: any[], categories: Record<string, CategoryRule>): string {
  // try match by scanning first 2-3 args as string
  const sample = args
    .slice(0, 3)
    .map((x) => safeToString(x))
    .join(' ');

  for (const [key, rule] of Object.entries(categories)) {
    if (typeof rule.match === 'function') {
      try { if ((rule.match as (a: any[]) => boolean)(args)) return key; } catch {}
    } else {
      try { if ((rule.match as RegExp).test(sample)) return key; } catch {}
    }
  }
  return 'general';
}

const nativeConsole = {
  log: console.log.bind(console),
  info: console.info ? console.info.bind(console) : console.log.bind(console),
  warn: console.warn ? console.warn.bind(console) : console.log.bind(console),
  error: console.error ? console.error.bind(console) : console.log.bind(console),
  debug: console.debug ? console.debug.bind(console) : console.log.bind(console),
  group: console.group ? console.group.bind(console) : undefined,
  groupCollapsed: console.groupCollapsed ? console.groupCollapsed.bind(console) : undefined,
  groupEnd: console.groupEnd ? console.groupEnd.bind(console) : undefined,
  time: console.time ? console.time.bind(console) : undefined,
  timeEnd: console.timeEnd ? console.timeEnd.bind(console) : undefined,
};

let INSTALLED = false;
let CONFIG: InternalConfig;

function buildInitialConfig(options?: ConsoleProxyOptions): InternalConfig {
  const level = options?.level ?? 'DEBUG';
  const format: FormatOptions = {
    showTimestamp: options?.format?.showTimestamp ?? true,
    timestampStyle: 'hms',
    timeZone: options?.format?.timeZone ?? 'Asia/Shanghai',
    showSource: options?.format?.showSource ?? true,
    color: options?.format?.color ?? true,
  };
  const baseCategories = buildDefaultCategories();
  const categories = mergeCategories(baseCategories, options?.categories);
  return {
    level,
    levelValue: toSeverity(level),
    format,
    categories,
  };
}

function formatPrefix(level: Exclude<LogLevel, 'OFF'>, categoryKey: string): { text: string; styles: string[] } {
  const f = CONFIG.format;
  const parts: string[] = [];
  const styles: string[] = [];

  // Colors by level
  const levelColors: Record<Exclude<LogLevel, 'OFF'>, string> = {
    ERROR: '#e74c3c',
    WARN: '#f39c12',
    INFO: '#3498db',
    DEBUG: '#95a5a6',
  };

  const cat = CONFIG.categories[categoryKey] || CONFIG.categories.general;
  const catColor = cat.color || '#7f8c8d';

  const push = (text: string, style?: string) => {
    if (f.color && style) {
      parts.push(`%c${text}`);
      styles.push(style);
    } else {
      parts.push(text);
    }
  };

  if (f.showTimestamp) {
    const ts = getLocalTimeHHMMSS(f.timeZone);
    push(`[${ts}]`, 'color:#888; font-weight:500;');
  }

  push(`[${level}]`, f.color ? `color:${levelColors[level]}; font-weight:700;` : undefined);

  if (f.showSource) {
    push(`[${cat.label || categoryKey.toUpperCase()}]`, f.color ? `color:${catColor}; font-weight:600;` : undefined);
  }

  return { text: parts.join(' '), styles };
}

function shouldPrint(level: Exclude<LogLevel, 'OFF'>, categoryKey: string): boolean {
  if (CONFIG.level === 'OFF') return false;
  if (LEVEL_SEVERITY[level] < CONFIG.levelValue) return false;
  const rule = CONFIG.categories[categoryKey];
  if (rule && rule.enabled === false) return false;
  return true;
}

function wrapMethod(level: Exclude<LogLevel, 'OFF'>, native: (...args: any[]) => void) {
  return function proxied(...args: any[]) {
    try {
      const catKey = pickCategory(args, CONFIG.categories);
      if (!shouldPrint(level, catKey)) return;
      const { text, styles } = formatPrefix(level, catKey);
      if (CONFIG.format.color && styles.length > 0) {
        native(text, ...styles, ...args);
      } else {
        native(text, ...args);
      }
    } catch (e) {
      // Fallback to native if anything goes wrong to avoid breaking logs
      native('[ConsoleProxy:FALLBACK]', ...args);
    }
  };
}

export function installConsoleProxy(options?: ConsoleProxyOptions) {
  if (INSTALLED) return getConsoleControl();
  CONFIG = buildInitialConfig(options);

  // Replace console methods
  // Use minimal set to avoid unexpected behaviors in third-party libs
  console.log = wrapMethod('INFO', nativeConsole.log) as any; // treat log as INFO
  console.info = wrapMethod('INFO', nativeConsole.info) as any;
  console.warn = wrapMethod('WARN', nativeConsole.warn) as any;
  console.error = wrapMethod('ERROR', nativeConsole.error) as any;
  console.debug = wrapMethod('DEBUG', nativeConsole.debug) as any;

  if (nativeConsole.group && nativeConsole.groupCollapsed && nativeConsole.groupEnd) {
    console.group = wrapMethod('INFO', nativeConsole.group) as any;
    console.groupCollapsed = wrapMethod('INFO', nativeConsole.groupCollapsed) as any;
    console.groupEnd = nativeConsole.groupEnd;
  }

  if (nativeConsole.time && nativeConsole.timeEnd) {
    const timers = new Map<string, number>();
    console.time = (label = 'default') => timers.set(label, Date.now());
    console.timeEnd = (label = 'default') => {
      const start = timers.get(label);
      if (start) {
        const dur = Date.now() - start;
        wrapMethod('DEBUG', nativeConsole.debug)(`${label}: ${dur}ms`);
        timers.delete(label);
      }
    };
  }

  INSTALLED = true;
  const ctrl = getConsoleControl();
  // Expose control to globalThis for runtime tweaks
  try {
    const g: any = (typeof window !== 'undefined') ? window : (globalThis as any);
    g.__JDB_CONSOLE__ = ctrl;
  } catch {}

  return ctrl;
}

export function uninstallConsoleProxy() {
  if (!INSTALLED) return;
  // Restore
  console.log = nativeConsole.log as any;
  console.info = nativeConsole.info as any;
  console.warn = nativeConsole.warn as any;
  console.error = nativeConsole.error as any;
  console.debug = nativeConsole.debug as any;
  if (nativeConsole.group) console.group = nativeConsole.group as any;
  if (nativeConsole.groupCollapsed) console.groupCollapsed = nativeConsole.groupCollapsed as any;
  if (nativeConsole.groupEnd) console.groupEnd = nativeConsole.groupEnd as any;
  if (nativeConsole.time) console.time = nativeConsole.time as any;
  if (nativeConsole.timeEnd) console.timeEnd = nativeConsole.timeEnd as any;
  INSTALLED = false;
}

function updateConfig(patch: Partial<ConsoleProxyOptions & { level?: LogLevel; format?: Partial<FormatOptions> }>) {
  if (!CONFIG) return;
  if (patch.level) {
    CONFIG.level = patch.level;
    CONFIG.levelValue = toSeverity(patch.level);
  }
  if (patch.format) {
    CONFIG.format = { ...CONFIG.format, ...patch.format };
  }
  if (patch.categories) {
    CONFIG.categories = mergeCategories(CONFIG.categories, patch.categories);
  }
}

export interface ConsoleControl {
  getConfig(): InternalConfig;
  setLevel(level: LogLevel): void;
  enable(category: string): void;
  disable(category: string): void;
  setFormat(format: Partial<FormatOptions>): void;
  registerCategory(key: string, rule: Omit<CategoryRule, 'enabled'> & { enabled?: boolean }): void;
  restore(): void; // restore native console
  updateConfig(patch: Partial<ConsoleProxyOptions>): void;
}

function getConsoleControl(): ConsoleControl {
  return {
    getConfig: () => JSON.parse(JSON.stringify(CONFIG)),
    setLevel: (level: LogLevel) => updateConfig({ level }),
    enable: (category: string) => {
      if (!CONFIG.categories[category]) return;
      CONFIG.categories[category].enabled = true;
    },
    disable: (category: string) => {
      if (!CONFIG.categories[category]) return;
      CONFIG.categories[category].enabled = false;
    },
    setFormat: (format: Partial<FormatOptions>) => updateConfig({ format }),
    registerCategory: (key: string, rule: Omit<CategoryRule, 'enabled'> & { enabled?: boolean }) => {
      updateConfig({ categories: { [key]: { ...rule, enabled: rule.enabled ?? true, match: rule.match } } });
    },
    restore: () => uninstallConsoleProxy(),
    updateConfig: (patch) => updateConfig(patch),
  };
}

// Convenience named export for code wishing to log with category explicitly
export const cx = {
  debug: (category: string, ...args: any[]) => console.debug(`[${category}]`, ...args),
  info: (category: string, ...args: any[]) => console.info(`[${category}]`, ...args),
  warn: (category: string, ...args: any[]) => console.warn(`[${category}]`, ...args),
  error: (category: string, ...args: any[]) => console.error(`[${category}]`, ...args),
};
