/**
 * 115网盘服务主入口
 */

export * from './types';
export * from './config';
export * from './utils';
export * from './api';
export * from './verification';
export * from './logger';

import type { Drive115Settings, OfflineDownloadOptions, BatchOfflineOptions } from './types';
import { DEFAULT_DRIVE115_SETTINGS } from './config';
import { Drive115ApiClient } from './api';
import { Drive115Logger } from './logger';
import { getSettings, saveSettings as saveMainSettings } from '../../utils/storage';

/**
 * 115网盘服务管理器
 */
export class Drive115Service {
  private static instance: Drive115Service;
  private apiClient: Drive115ApiClient;
  private logger: Drive115Logger;
  private settings: Drive115Settings;

  private constructor() {
    this.apiClient = new Drive115ApiClient();
    this.logger = new Drive115Logger();
    this.settings = DEFAULT_DRIVE115_SETTINGS;
  }

  /**
   * 获取单例实例
   */
  static getInstance(): Drive115Service {
    if (!Drive115Service.instance) {
      Drive115Service.instance = new Drive115Service();
    }
    return Drive115Service.instance;
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    await this.loadSettings();
  }

  /**
   * 加载设置
   */
  async loadSettings(): Promise<void> {
    try {
      const mainSettings = await getSettings();
      this.settings = { ...DEFAULT_DRIVE115_SETTINGS, ...mainSettings.drive115 };
    } catch (error) {
      console.error('加载115设置失败:', error);
      this.settings = DEFAULT_DRIVE115_SETTINGS;
    }
  }

  /**
   * 保存设置
   */
  async saveSettings(settings: Partial<Drive115Settings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...settings };

      // 获取当前主设置
      const mainSettings = await getSettings();
      // 更新115设置部分
      mainSettings.drive115 = this.settings;
      // 保存到主设置系统
      await saveMainSettings(mainSettings);
    } catch (error) {
      console.error('保存115设置失败:', error);
      throw error;
    }
  }

  /**
   * 获取当前设置
   */
  getSettings(): Drive115Settings {
    return { ...this.settings };
  }

  /**
   * 检查是否启用115功能
   */
  isEnabled(): boolean {
    return this.settings.enabled;
  }

  /**
   * 单个离线下载
   */
  async downloadOffline(options: OfflineDownloadOptions) {
    if (!this.isEnabled()) {
      throw new Error('115功能未启用');
    }

    // 使用配置中的默认下载目录
    const downloadOptions = {
      ...options,
      downloadDir: options.downloadDir || this.settings.downloadDir
    };

    return this.apiClient.downloadOffline(downloadOptions);
  }

  /**
   * 批量离线下载
   */
  async downloadBatch(options: BatchOfflineOptions) {
    if (!this.isEnabled()) {
      throw new Error('115功能未启用');
    }

    // 使用配置中的默认值
    const batchOptions = {
      ...options,
      downloadDir: options.downloadDir || this.settings.downloadDir,
      maxFailures: options.maxFailures ?? this.settings.maxFailures
    };

    return this.apiClient.downloadBatch(batchOptions);
  }

  /**
   * 搜索文件
   */
  async searchFiles(query: string) {
    if (!this.isEnabled()) {
      throw new Error('115功能未启用');
    }

    return this.apiClient.searchFiles(query);
  }

  /**
   * 验证下载结果
   */
  async verifyDownload(videoId: string) {
    if (!this.isEnabled()) {
      throw new Error('115功能未启用');
    }

    return this.apiClient.verifyDownload(videoId, this.settings.verifyCount);
  }

  /**
   * 获取日志
   */
  async getLogs() {
    return this.logger.getLogs();
  }

  /**
   * 获取日志统计
   */
  async getLogStats() {
    return this.logger.getLogStats();
  }

  /**
   * 清空日志
   */
  async clearLogs() {
    return this.logger.clearLogs();
  }

  /**
   * 导出日志
   */
  async exportLogs() {
    return this.logger.exportLogs();
  }

  /**
   * 导入日志
   */
  async importLogs(jsonData: string) {
    return this.logger.importLogs(jsonData);
  }

  /**
   * 测试搜索功能
   */
  async testSearch(query: string): Promise<{ success: boolean; count?: number; error?: string; results?: any[] }> {
    try {
      if (!this.isEnabled()) {
        return {
          success: false,
          error: '115功能未启用，请先在设置中启用115网盘功能'
        };
      }

      console.log('开始测试115搜索功能:', query);

      const results = await this.searchFiles(query);

      console.log('115搜索测试完成:', {
        query,
        resultCount: results.length,
        results: results.slice(0, 3) // 只显示前3个结果用于调试
      });

      return {
        success: true,
        count: results.length,
        results: results
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
        error: errorMessage
      };
    }
  }
}

/**
 * 获取115服务实例
 */
export function getDrive115Service(): Drive115Service {
  return Drive115Service.getInstance();
}

/**
 * 初始化115服务
 */
export async function initializeDrive115Service(): Promise<Drive115Service> {
  const service = getDrive115Service();
  await service.initialize();
  return service;
}
