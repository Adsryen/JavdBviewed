// 115 v2 日志：改为写入统一日志页（后台持久化 STORAGE_KEYS.LOGS）

export interface V2LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

// 发送到后台统一日志系统
function mapLevel(level: V2LogEntry['level']): 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' {
  switch (level) {
    case 'info': return 'INFO';
    case 'warn': return 'WARN';
    case 'error': return 'ERROR';
    case 'debug': default: return 'DEBUG';
  }
}

export async function addLogV2(entry: V2LogEntry): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      await new Promise<void>((resolve) => {
        try {
          chrome.runtime.sendMessage(
            {
              type: 'log-message',
              payload: {
                level: mapLevel(entry.level),
                message: `[115V2] ${entry.message}`,
                data: { timestamp: entry.timestamp }
              }
            },
            () => resolve()
          );
        } catch {
          resolve();
        }
      });
    } else {
      // 非扩展环境回退到控制台
      const lvl = mapLevel(entry.level);
      const prefix = `[${lvl}]`;
      // eslint-disable-next-line no-console
      console.log(prefix, `[115V2] ${entry.message}`, { timestamp: entry.timestamp });
    }
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
