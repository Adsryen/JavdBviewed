// 115 v2 日志：改为写入统一日志页（后台持久化 STORAGE_KEYS.LOGS）

export interface V2LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

export async function addLogV2(entry: V2LogEntry): Promise<void> {
  try {
    // 直接使用 console 输出，让 consoleProxy 处理格式化
    // 无论在哪个环境（background/dashboard/content），都使用统一的方式
    const method = entry.level === 'error' ? 'error' : entry.level === 'warn' ? 'warn' : 'info';
    // eslint-disable-next-line no-console
    console[method](`[115V2] ${entry.message}`, { timestamp: entry.timestamp });
  } catch (e) {
    // 静默失败，避免影响主流程
    // eslint-disable-next-line no-console
    console.warn('[115V2] addLogV2 failed:', e);
  }
}

// 兼容旧API：不再从 settings.drive115.v2Logs 读取/清空，改为空实现
export async function getLogsV2(): Promise<V2LogEntry[]> {
  return [];
}

export async function clearLogsV2(): Promise<void> {
  // no-op：统一在日志页清理 STORAGE_KEYS.LOGS
}
