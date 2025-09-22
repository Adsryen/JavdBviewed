/**
 * 115网盘日志模块
 */

import type { Drive115LogEntry, Drive115LogType } from './types';
import { DRIVE115_STORAGE_KEYS, DRIVE115_LOG_CONFIG } from './config';
import { getValue, setValue } from '../../utils/storage';

// 导入现有日志系统（如果在浏览器环境中）
let logAsync: ((level: string, message: string, data?: any) => Promise<void>) | null = null;

// 尝试导入现有日志系统
try {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        // 在扩展环境中，使用现有的日志系统
        logAsync = (level: string, message: string, data?: any): Promise<void> => {
            return new Promise((resolve) => {
                chrome.runtime.sendMessage({
                    type: 'log-message',
                    payload: { level, message: `[115] ${message}`, data }
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.error(`115日志发送失败: ${chrome.runtime.lastError.message}`);
                    }
                    resolve();
                });
            });
        };
    }
} catch (error) {
    // 忽略导入错误，使用本地日志
}

/**
 * 115网盘日志管理器
 */
export class Drive115Logger {
  /**
   * 记录日志
   */
  async log(type: Drive115LogType, videoId: string, message: string, data?: any): Promise<void> {
    const entry: Drive115LogEntry = {
      type,
      videoId,
      message,
      timestamp: Date.now(),
      data
    };

    try {
      // 同时记录到115专用日志和全局日志系统
      await Promise.all([
        this.logToLocal(entry),
        this.logToGlobal(type, message, { videoId, ...data })
      ]);

      // 同时输出到控制台（开发调试用）
      // console.log(`[Drive115] ${type}: ${message}`, data || '');
    } catch (error) {
      console.error('记录115日志失败:', error);
    }
  }

  /**
   * 记录到本地115日志
   */
  private async logToLocal(entry: Drive115LogEntry): Promise<void> {
    const logs = await this.getLogs();
    logs.unshift(entry); // 新日志添加到开头

    // 限制日志数量
    if (logs.length > DRIVE115_LOG_CONFIG.maxEntries) {
      logs.splice(DRIVE115_LOG_CONFIG.maxEntries);
    }

    // 清理过期日志
    const cutoffTime = Date.now() - (DRIVE115_LOG_CONFIG.retentionDays * 24 * 60 * 60 * 1000);
    const filteredLogs = logs.filter(log => log.timestamp > cutoffTime);

    await setValue(DRIVE115_STORAGE_KEYS.LOGS, filteredLogs);
  }

  /**
   * 记录到全局日志系统
   */
  private async logToGlobal(type: Drive115LogType, message: string, data?: any): Promise<void> {
    if (!logAsync) return;

    // 将115日志类型映射到全局日志级别
    const level = this.mapTypeToLevel(type);

    try {
      await logAsync(level, message, data);
    } catch (error) {
      // 忽略全局日志错误，不影响本地日志
      console.warn('发送到全局日志系统失败:', error);
    }
  }

  /**
   * 将115日志类型映射到全局日志级别
   */
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

  /**
   * 记录信息日志
   */
  async info(message: string, data?: any): Promise<void> {
    await this.log('offline_start', '', message, data);
  }

  /**
   * 记录警告日志
   */
  async warn(message: string, data?: any): Promise<void> {
    await this.log('verify_failed', '', message, data);
  }

  /**
   * 记录错误日志
   */
  async error(message: string, data?: any): Promise<void> {
    await this.log('offline_failed', '', message, data);
  }

  /**
   * 记录离线开始日志
   */
  async logOfflineStart(videoId: string, magnetUrl: string): Promise<void> {
    await this.log('offline_start', videoId, `开始离线下载: ${videoId}`, { magnetUrl });
  }

  /**
   * 记录离线成功日志
   */
  async logOfflineSuccess(videoId: string, fileCount: number): Promise<void> {
    await this.log('offline_success', videoId, `离线下载成功: ${videoId}`, { fileCount });
  }

  /**
   * 记录离线失败日志
   */
  async logOfflineFailed(videoId: string, error: string): Promise<void> {
    await this.log('offline_failed', videoId, `离线下载失败: ${videoId}`, { error });
  }

  /**
   * 记录验证开始日志
   */
  async logVerifyStart(videoId: string): Promise<void> {
    await this.log('verify_start', videoId, `开始验证下载: ${videoId}`);
  }

  /**
   * 记录验证成功日志
   */
  async logVerifySuccess(videoId: string, fileCount: number): Promise<void> {
    await this.log('verify_success', videoId, `验证成功: ${videoId}`, { fileCount });
  }

  /**
   * 记录验证失败日志
   */
  async logVerifyFailed(videoId: string, attempts: number): Promise<void> {
    await this.log('verify_failed', videoId, `验证失败: ${videoId}`, { attempts });
  }

  /**
   * 记录批量开始日志
   */
  async logBatchStart(taskCount: number): Promise<void> {
    await this.log('batch_start', '', `开始批量下载`, { taskCount });
  }

  /**
   * 记录批量完成日志
   */
  async logBatchComplete(successCount: number, failureCount: number): Promise<void> {
    await this.log('batch_complete', '', `批量下载完成`, { successCount, failureCount });
  }

  /**
   * 获取所有日志
   */
  async getLogs(): Promise<Drive115LogEntry[]> {
    try {
      const logs = await getValue<Drive115LogEntry[]>(DRIVE115_STORAGE_KEYS.LOGS, []);
      return Array.isArray(logs) ? logs : [];
    } catch (error) {
      console.error('获取115日志失败:', error);
      return [];
    }
  }

  /**
   * 获取指定视频的日志
   */
  async getLogsByVideoId(videoId: string): Promise<Drive115LogEntry[]> {
    const logs = await this.getLogs();
    return logs.filter(log => log.videoId === videoId);
  }

  /**
   * 获取指定类型的日志
   */
  async getLogsByType(type: Drive115LogType): Promise<Drive115LogEntry[]> {
    const logs = await this.getLogs();
    return logs.filter(log => log.type === type);
  }

  /**
   * 获取最近的日志
   */
  async getRecentLogs(count: number = 50): Promise<Drive115LogEntry[]> {
    const logs = await this.getLogs();
    return logs.slice(0, count);
  }

  /**
   * 清空所有日志
   */
  async clearLogs(): Promise<void> {
    try {
      await setValue(DRIVE115_STORAGE_KEYS.LOGS, []);
    } catch (error) {
      console.error('清空115日志失败:', error);
    }
  }

  /**
   * 获取日志统计信息
   */
  async getLogStats(): Promise<{
    total: number;
    byType: Record<Drive115LogType, number>;
    recent24h: number;
  }> {
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
      batch_complete: 0
    };

    let recent24h = 0;

    logs.forEach(log => {
      byType[log.type]++;
      if (log.timestamp > oneDayAgo) {
        recent24h++;
      }
    });

    return {
      total: logs.length,
      byType,
      recent24h
    };
  }

  /**
   * 导出日志为JSON
   */
  async exportLogs(): Promise<string> {
    const logs = await this.getLogs();
    return JSON.stringify(logs, null, 2);
  }

  /**
   * 从JSON导入日志
   */
  async importLogs(jsonData: string): Promise<void> {
    try {
      const importedLogs = JSON.parse(jsonData) as Drive115LogEntry[];
      
      if (!Array.isArray(importedLogs)) {
        throw new Error('导入数据格式错误');
      }

      // 验证日志格式
      const validLogs = importedLogs.filter(log => 
        log.type && log.message && typeof log.timestamp === 'number'
      );

      const existingLogs = await this.getLogs();
      const mergedLogs = [...validLogs, ...existingLogs];

      // 去重（基于时间戳和消息）
      const uniqueLogs = mergedLogs.filter((log, index, arr) => 
        arr.findIndex(l => l.timestamp === log.timestamp && l.message === log.message) === index
      );

      // 排序（最新的在前）
      uniqueLogs.sort((a, b) => b.timestamp - a.timestamp);

      // 限制数量
      if (uniqueLogs.length > DRIVE115_LOG_CONFIG.maxEntries) {
        uniqueLogs.splice(DRIVE115_LOG_CONFIG.maxEntries);
      }

      await setValue(DRIVE115_STORAGE_KEYS.LOGS, uniqueLogs);
    } catch (error) {
      throw new Error(`导入日志失败: ${error}`);
    }
  }
}
