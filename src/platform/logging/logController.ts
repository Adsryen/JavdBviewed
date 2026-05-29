export interface LogControllerConfig {
  verboseMode: boolean;
  showPrivacyLogs: boolean;
  showStorageLogs: boolean;
  suppressConsoleOutput: boolean;
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

export interface LogConsole {
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

export interface LogControllerOptions {
  console?: LogConsole;
  persistLog?: (entry: LogEntry) => void;
  now?: () => Date;
}

const DEFAULT_CONFIG: LogControllerConfig = {
  verboseMode: false,
  showPrivacyLogs: false,
  showStorageLogs: false,
  suppressConsoleOutput: false,
};

export function normalizeLogControllerConfig(config: Partial<LogControllerConfig> = {}): LogControllerConfig {
  return {
    verboseMode: config.verboseMode || false,
    showPrivacyLogs: config.showPrivacyLogs || false,
    showStorageLogs: config.showStorageLogs || false,
    suppressConsoleOutput: config.suppressConsoleOutput || false,
  };
}

export class LogController {
  private config: LogControllerConfig = { ...DEFAULT_CONFIG };
  private initialized = false;
  private readonly console: LogConsole;
  private readonly persistLog?: (entry: LogEntry) => void;
  private readonly now: () => Date;

  constructor(options: LogControllerOptions = {}) {
    this.console = options.console ?? globalThis.console;
    this.persistLog = options.persistLog;
    this.now = options.now ?? (() => new Date());
  }

  async initialize(loadConfig?: () => Promise<Partial<LogControllerConfig>>): Promise<void> {
    try {
      const loadedConfig = loadConfig ? await loadConfig() : {};
      this.config = normalizeLogControllerConfig(loadedConfig);
      this.initialized = true;
      this.console.log('[LogController] Initialized with config:', JSON.stringify(this.config));
    } catch {
      this.initialized = true;
      this.console.warn('Failed to initialize log controller, using defaults');
    }
  }

  updateConfig(config: Partial<LogControllerConfig>): void {
    this.config = { ...this.config, ...normalizeLogControllerConfig({ ...this.config, ...config }) };
  }

  shouldShowVerbose(): boolean {
    if (!this.initialized) return false;
    return this.config.verboseMode;
  }

  shouldShowPrivacyLogs(): boolean {
    if (!this.initialized) return false;
    return this.config.showPrivacyLogs;
  }

  shouldShowStorageLogs(): boolean {
    if (!this.initialized) return false;
    return this.config.showStorageLogs;
  }

  verbose(message: string, ...args: any[]): void {
    if (this.initialized && this.config.verboseMode === true) {
      this.console.log(`[VERBOSE] ${message}`, ...args);
    }
  }

  privacy(message: string, ...args: any[]): void {
    if (this.initialized && this.config.showPrivacyLogs === true) {
      this.console.log(`[PRIVACY] ${message}`, ...args);
    }
  }

  storage(message: string, ...args: any[]): void {
    if (this.initialized && this.config.showStorageLogs === true) {
      this.console.log(`[STORAGE] ${message}`, ...args);
    }
  }

  debug(category: 'privacy' | 'storage' | 'verbose', message: string, ...args: any[]): void {
    switch (category) {
      case 'privacy':
        this.privacy(message, ...args);
        break;
      case 'storage':
        this.storage(message, ...args);
        break;
      case 'verbose':
        this.verbose(message, ...args);
        break;
    }
  }

  info(message: string, ...args: any[]): void {
    this.important('INFO', message, args, this.console.log);
  }

  warn(message: string, ...args: any[]): void {
    this.important('WARN', message, args, this.console.warn);
  }

  error(message: string, ...args: any[]): void {
    this.important('ERROR', message, args, this.console.error);
  }

  getConfig(): LogControllerConfig {
    return { ...this.config };
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  private important(level: LogLevel, message: string, args: any[], consoleMethod: (...args: any[]) => void): void {
    if (!this.config.suppressConsoleOutput) {
      consoleMethod.call(this.console, `[${level}] ${message}`, ...args);
    }
    this.persistLog?.(this.buildEntry(level, message, args));
  }

  private buildEntry(level: LogLevel, message: string, args: any[]): LogEntry {
    const entry: LogEntry = {
      timestamp: this.now().toISOString(),
      level,
      message,
    };
    if (args.length > 0) {
      entry.data = args.length === 1 ? args[0] : args;
    }
    return entry;
  }
}
