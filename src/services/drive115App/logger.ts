import { getValue, setValue } from '../../utils/storage';
import type { Drive115LogEntryUnified } from './types';

export type Drive115LogType = 'offline_start' | 'offline_success' | 'offline_failed' | 'verify_start' | 'verify_success' | 'verify_failed' | 'batch_start' | 'batch_complete';

const DRIVE115_LOG_STORAGE_KEY = 'drive115_logs';
const DRIVE115_LOG_CONFIG = {
  maxEntries: 1000,
  retentionDays: 30,
} as const;

let logAsync: ((level: string, message: string, data?: any) => Promise<void>) | null = null;

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
      await Promise.all([
        this.logToLocal(entry),
        this.logToGlobal(type, message, { videoId, ...data })
      ]);
    } catch (error) {
      console.error('记录115日志失败:', error);
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
      case 'offline_success':
      case 'verify_success':
      case 'batch_complete':
        return 'INFO';
      case 'offline_failed':
      case 'verify_failed':
        return 'ERROR';
      case 'offline_start':
      case 'verify_start':
      case 'batch_start':
        return 'DEBUG';
      default:
        return 'INFO';
    }
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

  async clearLogs(): Promise<void> {
    await setValue(DRIVE115_LOG_STORAGE_KEY as any, []);
  }

  async getLogStats(): Promise<{ total: number; byType: Record<Drive115LogType, number>; recent24h: number; }> {
    const logs = await this.getLogs();
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const byType: Record<Drive115LogType, number> = {
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
}

const logger = new Drive115AppLogger();

export function getDrive115AppLogger(): Drive115AppLogger {
  return logger;
}
