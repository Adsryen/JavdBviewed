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
