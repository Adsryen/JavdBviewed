import { getValue, setValue } from '../../../utils/storage';
import type { Drive115LogEntryUnified, Drive115LogType, Drive115PushContext } from './types';


const DRIVE115_LOG_STORAGE_KEY = 'drive115_logs';
const DRIVE115_LOG_CONFIG = {
  maxEntries: 1000,
  retentionDays: 30,
} as const;

let logAsync: ((level: string, message: string, data?: any) => Promise<void>) | null = null;

async function sendRuntimeDbMessage<T = any>(type: string, payload?: any): Promise<T> {
  if (typeof chrome === 'undefined' || !chrome.runtime?.id || typeof chrome.runtime.sendMessage !== 'function') {
    throw new Error('runtime unavailable');
  }

  return new Promise<T>((resolve, reject) => {
    try {
      chrome.runtime.sendMessage({ type, payload }, (resp) => {
        const lastErr = chrome.runtime.lastError;
        if (lastErr) {
          reject(new Error(lastErr.message || 'runtime error'));
          return;
        }
        if (!resp || resp.success !== true) {
          reject(new Error(resp?.error || 'db error'));
          return;
        }
        resolve(resp as T);
      });
    } catch (error) {
      reject(error);
    }
  });
}

function traceMagnetPush(message: string, data?: any): void {
  try {
    if (data !== undefined) console.info(`[115Trace] ${message}`, data);
    else console.info(`[115Trace] ${message}`);
  } catch {}
}

try {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    logAsync = (level: string, message: string, data?: any): Promise<void> => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({
          type: 'log-message',
          payload: { level, message: `[115] ${message}`, data }
        }, () => {
          resolve();
        });
      });
    };
  }
} catch {}

export class Drive115AppLogger {
  async log(type: Drive115LogType, videoId: string, message: string, data?: any): Promise<void> {
    const entry: Drive115LogEntryUnified = {
      type,
      videoId,
      message,
      timestamp: Date.now(),
      data,
    } as Drive115LogEntryUnified;

    try {
      await Promise.allSettled([
        this.logToLocal(entry),
        this.logToDedicatedMagnetPool(entry),
        this.logToGlobal(type, message, { videoId, ...data })
      ]);
    } catch (error) {
      console.error('记录115日志失败:', error);
    }
  }

  private async logToDedicatedMagnetPool(entry: Drive115LogEntryUnified): Promise<void> {
    if (!(entry.type === 'push_start' || entry.type === 'push_success' || entry.type === 'push_failed')) return;
    const data = (entry.data || {}) as any;
    const trace = {
      traceId: data.traceId || data.correlationId || '',
      correlationId: data.correlationId || '',
      taskId: data.taskId || '',
      type: entry.type,
      videoId: entry.videoId,
      action: data.action || entry.type,
      source: data.source || '',
      magnetName: data.magnetName || '',
      wpPathId: data.wpPathId,
    };
    try {
      traceMagnetPush('logger:magnet-log:add:start', trace);
      await sendRuntimeDbMessage('DB:MAGNET_PUSH_LOGS_ADD', {
        entry: {
          type: entry.type,
          videoId: entry.videoId,
          message: entry.message,
          timestamp: entry.timestamp,
          data: entry.data,
        },
      });
      traceMagnetPush('logger:magnet-log:add:success', trace);
    } catch (error) {
      traceMagnetPush('logger:magnet-log:add:error', { ...trace, error: error instanceof Error ? error.message : String(error) });
      console.warn('[115] magnet push log write failed:', error);
    }
  }

  private async logToLocal(entry: Drive115LogEntryUnified): Promise<void> {
    const logs = await this.getLogs();
    logs.unshift(entry);
    if (logs.length > DRIVE115_LOG_CONFIG.maxEntries) {
      logs.splice(DRIVE115_LOG_CONFIG.maxEntries);
    }
    const cutoffTime = Date.now() - (DRIVE115_LOG_CONFIG.retentionDays * 24 * 60 * 60 * 1000);
    const filteredLogs = logs.filter(log => log.timestamp > cutoffTime);
    await setValue(DRIVE115_LOG_STORAGE_KEY as any, filteredLogs);
  }

  private async logToGlobal(type: Drive115LogType, message: string, data?: any): Promise<void> {
    if (!logAsync) return;
    const level = this.mapTypeToLevel(type);
    try {
      await logAsync(level, message, data);
    } catch {}
  }

  private mapTypeToLevel(type: Drive115LogType): string {
    switch (type) {
      case 'push_success':
      case 'offline_success':
      case 'verify_success':
      case 'batch_complete':
        return 'INFO';
      case 'push_failed':
      case 'offline_failed':
      case 'verify_failed':
        return 'ERROR';
      case 'push_start':
      case 'offline_start':
      case 'verify_start':
      case 'batch_start':
        return 'DEBUG';
      default:
        return 'INFO';
    }
  }

  async logPushStart(context: Drive115PushContext & { magnetUrl: string }): Promise<void> {
    const videoId = String(context.videoId || '').trim();
    await this.log('push_start', videoId, `开始推送到115: ${videoId || 'unknown'}`, {
      source: context.source || 'unknown',
      magnetName: context.magnetName,
      magnetUrl: context.magnetUrl,
      pageUrl: context.pageUrl,
      wpPathId: context.wpPathId,
      taskId: context.taskId,
      correlationId: context.correlationId,
      traceId: context.traceId || context.correlationId,
      action: 'push_start',
    });
  }

  async logPushSuccess(context: Drive115PushContext & { magnetUrl: string; response?: any }): Promise<void> {
    const videoId = String(context.videoId || '').trim();
    await this.log('push_success', videoId, `115 推送成功: ${videoId || 'unknown'}`, {
      source: context.source || 'unknown',
      magnetName: context.magnetName,
      magnetUrl: context.magnetUrl,
      pageUrl: context.pageUrl,
      wpPathId: context.wpPathId,
      taskId: context.taskId,
      correlationId: context.correlationId,
      traceId: context.traceId || context.correlationId,
      response: context.response,
      action: 'push_success',
    });
  }

  async logPushFailed(context: Drive115PushContext & { magnetUrl: string; error: string; response?: any }): Promise<void> {
    const videoId = String(context.videoId || '').trim();
    await this.log('push_failed', videoId, `115 推送失败: ${videoId || 'unknown'}`, {
      source: context.source || 'unknown',
      magnetName: context.magnetName,
      magnetUrl: context.magnetUrl,
      pageUrl: context.pageUrl,
      wpPathId: context.wpPathId,
      taskId: context.taskId,
      correlationId: context.correlationId,
      traceId: context.traceId || context.correlationId,
      error: context.error,
      response: context.response,
      action: 'push_failed',
    });
  }

  async logOfflineStart(videoId: string, magnetUrl: string): Promise<void> {
    await this.log('offline_start', videoId, `开始离线下载: ${videoId}`, { magnetUrl });
  }

  async logOfflineSuccess(videoId: string, fileCount: number): Promise<void> {
    await this.log('offline_success', videoId, `离线下载成功: ${videoId}`, { fileCount });
  }

  async logOfflineFailed(videoId: string, error: string): Promise<void> {
    await this.log('offline_failed', videoId, `离线下载失败: ${videoId}`, { error });
  }

  async logVerifyStart(videoId: string): Promise<void> {
    await this.log('verify_start', videoId, `开始验证下载: ${videoId}`);
  }

  async logVerifySuccess(videoId: string, fileCount: number): Promise<void> {
    await this.log('verify_success', videoId, `验证成功: ${videoId}`, { fileCount });
  }

  async logVerifyFailed(videoId: string, attempts: number): Promise<void> {
    await this.log('verify_failed', videoId, `验证失败: ${videoId}`, { attempts });
  }

  async logBatchStart(taskCount: number): Promise<void> {
    await this.log('batch_start', '', `开始批量下载`, { taskCount });
  }

  async logBatchComplete(successCount: number, failureCount: number): Promise<void> {
    await this.log('batch_complete', '', `批量下载完成`, { successCount, failureCount });
  }

  async getLogs(): Promise<Drive115LogEntryUnified[]> {
    try {
      const logs = await getValue<Drive115LogEntryUnified[]>(DRIVE115_LOG_STORAGE_KEY as any, [] as any);
      return Array.isArray(logs) ? logs : [];
    } catch {
      return [];
    }
  }

  async getLogsByVideoId(videoId: string): Promise<Drive115LogEntryUnified[]> {
    const logs = await this.getLogs();
    return logs.filter(log => log.videoId === videoId);
  }

  async getLogsByType(type: Drive115LogType): Promise<Drive115LogEntryUnified[]> {
    const logs = await this.getLogs();
    return logs.filter(log => log.type === type);
  }

  async getRecentLogs(count: number = 50): Promise<Drive115LogEntryUnified[]> {
    const logs = await this.getLogs();
    return logs.slice(0, count);
  }

  async clearLogs(): Promise<void> {
    await setValue(DRIVE115_LOG_STORAGE_KEY as any, []);
  }

  async getLogStats(): Promise<{ total: number; byType: Record<Drive115LogType, number>; recent24h: number; }> {
    const logs = await this.getLogs();
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const byType: Record<Drive115LogType, number> = {
      push_start: 0,
      push_success: 0,
      push_failed: 0,
      offline_start: 0,
      offline_success: 0,
      offline_failed: 0,
      verify_start: 0,
      verify_success: 0,
      verify_failed: 0,
      batch_start: 0,
      batch_complete: 0,
    };
    let recent24h = 0;
    logs.forEach(log => {
      byType[log.type as Drive115LogType]++;
      if (log.timestamp > oneDayAgo) recent24h++;
    });
    return { total: logs.length, byType, recent24h };
  }

  async exportLogs(): Promise<string> {
    const logs = await this.getLogs();
    return JSON.stringify(logs, null, 2);
  }

  async importLogs(jsonData: string): Promise<void> {
    const importedLogs = JSON.parse(jsonData) as Drive115LogEntryUnified[];
    if (!Array.isArray(importedLogs)) {
      throw new Error('导入数据格式错误');
    }

    const validLogs = importedLogs.filter(log =>
      log?.type && log?.message && typeof log?.timestamp === 'number'
    );

    const existingLogs = await this.getLogs();
    const mergedLogs = [...validLogs, ...existingLogs];
    const uniqueLogs = mergedLogs.filter((log, index, arr) =>
      arr.findIndex(item => item.timestamp === log.timestamp && item.message === log.message) === index
    );
    uniqueLogs.sort((a, b) => b.timestamp - a.timestamp);
    if (uniqueLogs.length > DRIVE115_LOG_CONFIG.maxEntries) {
      uniqueLogs.splice(DRIVE115_LOG_CONFIG.maxEntries);
    }

    await setValue(DRIVE115_LOG_STORAGE_KEY as any, uniqueLogs);
  }
}

const logger = new Drive115AppLogger();

export function getDrive115AppLogger(): Drive115AppLogger {
  return logger;
}
