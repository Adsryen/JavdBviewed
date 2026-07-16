/**
 * @file index.ts
 * @description 日志子系统统一导出（控制台代理、日志控制器、background 日志配置）
 */
export {
  LogController,
  normalizeLogControllerConfig,
  type LogConsole,
  type LogControllerConfig,
  type LogControllerOptions,
  type LogEntry,
  type LogLevel,
} from './logController';
export {
  installConsoleProxy,
  uninstallConsoleProxy,
  cx,
  type CategoryRule,
  type ConsoleControl,
  type ConsoleProxyOptions,
} from './consoleProxy';
export { installConsoleProxyWithSettings } from './backgroundConsole';
