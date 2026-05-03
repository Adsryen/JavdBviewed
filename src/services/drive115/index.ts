/**
 * 115网盘服务主入口（兼容层）
 *
 * 保留历史调用方式，但实现统一转发到 `drive115App`，
 * 避免继续维护旧 v1/v2 双实现。
 */

export * from './types';
export * from './config';

import type {
  BatchOfflineOptions,
  BatchOfflineResult,
  Drive115LogEntry,
  Drive115LogType,
  Drive115SearchResult,
  Drive115Settings,
  OfflineDownloadOptions,
  OfflineDownloadResult,
} from './types';
import { DEFAULT_DRIVE115_SETTINGS } from './config';
import { getDrive115AppLogger, getDrive115AppService, normalizeDrive115Settings } from '../drive115App';
import { getSettings, saveSettings as saveMainSettings } from '../../utils/storage';

function mapUnifiedFileToLegacy(file: any): Drive115SearchResult {
  return {
    n: String(file?.name || ''),
    pc: String(file?.pickCode || ''),
    fid: String(file?.fileId || ''),
    cid: String(file?.parentId || ''),
    s: Number(file?.size || 0),
    t: Number(file?.updatedAt || 0),
  };
}

function mapRuntimeToLegacySettings(raw: any): Drive115Settings {
  const normalized = normalizeDrive115Settings(raw);
  return {
    ...DEFAULT_DRIVE115_SETTINGS,
    enabled: normalized.enabled,
    downloadDir: normalized.downloadDir,
    verifyCount: normalized.verifyCount,
    maxFailures: normalized.maxFailures,
    autoNotify: normalized.autoNotify,
    v2AccessToken: normalized.v2AccessToken,
    v2RefreshToken: normalized.v2RefreshToken,
    v2TokenExpiresAt: normalized.v2TokenExpiresAt,
    v2RefreshTokenStatus: normalized.v2RefreshTokenStatus,
    v2RefreshTokenLastError: normalized.v2RefreshTokenLastError,
    v2RefreshTokenLastErrorCode: normalized.v2RefreshTokenLastErrorCode,
    v2AccessTokenStatus: normalized.v2AccessTokenStatus,
    v2AccessTokenLastError: normalized.v2AccessTokenLastError,
    v2AccessTokenLastErrorCode: normalized.v2AccessTokenLastErrorCode,
    v2ApiBaseUrl: normalized.v2ApiBaseUrl,
    v2AutoRefresh: normalized.v2AutoRefresh,
    v2AutoRefreshSkewSec: normalized.v2AutoRefreshSkewSec,
    quotaCache: normalized.quotaCache,
  };
}

function mapOfflineResult(result: any): OfflineDownloadResult {
  return {
    success: !!result?.success,
    taskId: result?.taskId,
    error: result?.error,
    verificationResult: result?.verificationResult
      ? {
          verified: !!result.verificationResult.verified,
          foundFiles: Array.isArray(result.verificationResult.foundFiles)
            ? result.verificationResult.foundFiles.map(mapUnifiedFileToLegacy)
            : undefined,
        }
      : undefined,
  };
}

function mapBatchResult(result: any): BatchOfflineResult {
  return {
    totalTasks: Number(result?.totalTasks || 0),
    successCount: Number(result?.successCount || 0),
    failureCount: Number(result?.failureCount || 0),
    results: Array.isArray(result?.results)
      ? result.results.map((item: any) => ({
          videoId: String(item?.videoId || ''),
          result: mapOfflineResult(item?.result),
        }))
      : [],
  };
}

export class Drive115Service {
  private static instance: Drive115Service;
  private settings: Drive115Settings;

  private constructor() {
    this.settings = { ...DEFAULT_DRIVE115_SETTINGS };
  }

  static getInstance(): Drive115Service {
    if (!Drive115Service.instance) {
      Drive115Service.instance = new Drive115Service();
    }
    return Drive115Service.instance;
  }

  async initialize(): Promise<void> {
    await this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    try {
      const mainSettings = await getSettings();
      this.settings = mapRuntimeToLegacySettings(mainSettings?.drive115 || {});
    } catch (error) {
      console.error('加载115设置失败:', error);
      this.settings = { ...DEFAULT_DRIVE115_SETTINGS };
    }
  }

  async saveSettings(settings: Partial<Drive115Settings>): Promise<void> {
    try {
      const currentSettings: any = await getSettings();
      const nextDrive115 = {
        ...(currentSettings?.drive115 || {}),
        ...settings,
      };
      await saveMainSettings({
        ...currentSettings,
        drive115: nextDrive115,
      });
      this.settings = mapRuntimeToLegacySettings(nextDrive115);
    } catch (error) {
      console.error('保存115设置失败:', error);
      throw error;
    }
  }

  getSettings(): Drive115Settings {
    return { ...this.settings };
  }

  isEnabled(): boolean {
    return !!this.settings.enabled;
  }

  async downloadOffline(options: OfflineDownloadOptions): Promise<OfflineDownloadResult> {
    const result = await getDrive115AppService().downloadOffline({
      ...options,
      downloadDir: options.downloadDir || this.settings.downloadDir,
    });
    return mapOfflineResult(result);
  }

  async downloadBatch(options: BatchOfflineOptions): Promise<BatchOfflineResult> {
    const result = await getDrive115AppService().downloadBatch({
      ...options,
      downloadDir: options.downloadDir || this.settings.downloadDir,
      maxFailures: options.maxFailures ?? this.settings.maxFailures,
    });
    return mapBatchResult(result);
  }

  async searchFiles(query: string): Promise<Drive115SearchResult[]> {
    const results = await getDrive115AppService().searchFiles(query);
    return results.map(mapUnifiedFileToLegacy);
  }

  async verifyDownload(videoId: string): Promise<Drive115SearchResult[]> {
    const results = await getDrive115AppService().verifyDownload(videoId);
    return results.map(mapUnifiedFileToLegacy);
  }

  async getLogs(): Promise<Drive115LogEntry[]> {
    return await getDrive115AppLogger().getLogs() as Drive115LogEntry[];
  }

  async getLogsByVideoId(videoId: string): Promise<Drive115LogEntry[]> {
    return await getDrive115AppLogger().getLogsByVideoId(videoId) as Drive115LogEntry[];
  }

  async getLogsByType(type: Drive115LogType): Promise<Drive115LogEntry[]> {
    return await getDrive115AppLogger().getLogsByType(type as any) as Drive115LogEntry[];
  }

  async getRecentLogs(count: number = 50): Promise<Drive115LogEntry[]> {
    return await getDrive115AppLogger().getRecentLogs(count) as Drive115LogEntry[];
  }

  async getLogStats() {
    return getDrive115AppLogger().getLogStats();
  }

  async clearLogs(): Promise<void> {
    await getDrive115AppLogger().clearLogs();
  }

  async exportLogs(): Promise<string> {
    return getDrive115AppLogger().exportLogs();
  }

  async importLogs(jsonData: string): Promise<void> {
    await getDrive115AppLogger().importLogs(jsonData);
  }

  async testSearch(query: string): Promise<{ success: boolean; count?: number; error?: string; results?: any[] }> {
    try {
      if (!this.isEnabled()) {
        return {
          success: false,
          error: '115功能未启用，请先在设置中启用115网盘功能'
        };
      }

      const results = await this.searchFiles(query);
      return {
        success: true,
        count: results.length,
        results,
      };
    } catch (error) {
      console.error('115搜索测试失败:', error);
      let errorMessage = '搜索测试失败';
      if (error instanceof Error) {
        if (error.message.includes('未登录') || error.message.includes('not logged in')) {
          errorMessage = '请先登录115网盘';
        } else if (error.message.includes('网络') || error.message.includes('network')) {
          errorMessage = '网络连接失败，请检查网络状态';
        } else {
          errorMessage = error.message;
        }
      }
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

export function getDrive115Service(): Drive115Service {
  return Drive115Service.getInstance();
}

export async function initializeDrive115Service(): Promise<Drive115Service> {
  const service = getDrive115Service();
  await service.initialize();
  return service;
}
