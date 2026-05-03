import { getDrive115V2Service } from '../drive115v2';
import { searchFilesV2 } from '../drive115v2/search';
import { getDrive115AppLogger } from './logger';
import { mapV2SearchItem } from './adapters';
import { getDrive115RuntimeState, isDrive115EnabledState } from './runtime';
import type {
  Drive115BatchOptionsUnified,
  Drive115BatchResultUnified,
  Drive115OfflineOptionsUnified,
  Drive115OfflineResultUnified,
  Drive115SearchResultUnified,
  NormalizedDrive115Settings,
} from './types';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isValidMagnetUrl(url: string): boolean {
  return /^magnet:\?xt=urn:btih:/i.test(String(url || '').trim());
}

function isVideoLikeFile(name: string): boolean {
  return /\.(mp4|mkv|avi|mov|wmv|flv|ts|m4v|iso)$/i.test(name);
}

function normalizeCode(input: string): string {
  return String(input || '').trim().toUpperCase().replace(/[_\s]+/g, '-');
}

function matchesVideoCode(name: string, videoId: string): boolean {
  const code = normalizeCode(videoId);
  const target = normalizeCode(name);
  return !!code && target.includes(code);
}

export class Drive115AppService {
  async getRuntimeState(): Promise<NormalizedDrive115Settings> {
    return getDrive115RuntimeState();
  }

  async isEnabled(): Promise<boolean> {
    const state = await this.getRuntimeState();
    return isDrive115EnabledState(state);
  }

  async searchFiles(query: string): Promise<Drive115SearchResultUnified> {
    const enabled = await this.isEnabled();
    if (!enabled) {
      throw new Error('115功能未启用');
    }

    const ret = await searchFilesV2({
      search_value: query,
      limit: 50,
      offset: 0,
      type: 4,
      fc: 2,
    });

    if (!ret.success) {
      throw new Error(ret.message || '115搜索失败');
    }

    return Array.isArray(ret.data) ? ret.data.map(mapV2SearchItem) : [];
  }

  async verifyDownload(videoId: string): Promise<Drive115SearchResultUnified> {
    const state = await this.getRuntimeState();
    const maxAttempts = Math.max(1, state.verifyCount || 5);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await delay(1000);
        const results = await this.searchFiles(videoId);
        const matched = results.filter(file => {
          const name = file.name || '';
          return (isVideoLikeFile(name) || !name.includes('.')) && matchesVideoCode(name, videoId);
        });
        if (matched.length > 0) return matched;
      } catch {
      }
    }

    return [];
  }

  async addTaskUrls(params: { urls: string; wp_path_id?: string }): Promise<{ success: boolean; message?: string; data?: any[]; raw?: any }> {
    const state = await this.getRuntimeState();
    if (!isDrive115EnabledState(state)) {
      throw new Error('115功能未启用');
    }

    const svc = getDrive115V2Service();
    const vt = await svc.getValidAccessToken();
    if (!vt.success) {
      throw new Error(vt.message || '获取 access_token 失败');
    }

    const res = await svc.addTaskUrls({
      accessToken: vt.accessToken,
      urls: params.urls,
      wp_path_id: params.wp_path_id,
    });

    return {
      success: res.success,
      message: res.message,
      data: (res as any).data,
      raw: res.raw,
    };
  }

  async downloadOffline(options: Drive115OfflineOptionsUnified): Promise<Drive115OfflineResultUnified> {
    const state = await this.getRuntimeState();
    if (!isDrive115EnabledState(state)) {
      throw new Error('115功能未启用');
    }

    const logger = getDrive115AppLogger();
    const { videoId, magnetUrl, downloadDir, autoVerify = true } = options;
    const taskId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    try {
      if (!isValidMagnetUrl(magnetUrl)) {
        throw new Error('磁链格式无效');
      }

      await logger.logOfflineStart(videoId, magnetUrl);

      const wpPathId = String(downloadDir || state.defaultWpPathId || '').trim() || undefined;
      const ret = await this.addTaskUrls({ urls: magnetUrl, wp_path_id: wpPathId });
      if (!ret.success) {
        throw new Error(ret.message || '添加离线任务失败');
      }

      let verificationResult: Drive115OfflineResultUnified['verificationResult'] | undefined;
      if (autoVerify) {
        await logger.logVerifyStart(videoId);
        const foundFiles = await this.verifyDownload(videoId);
        verificationResult = {
          verified: foundFiles.length > 0,
          foundFiles: foundFiles as any,
        };
        if (foundFiles.length > 0) {
          await logger.logVerifySuccess(videoId, foundFiles.length);
        } else {
          await logger.logVerifyFailed(videoId, state.verifyCount || 5);
        }
      }

      await logger.logOfflineSuccess(videoId, Array.isArray(ret.data) ? ret.data.length : 1);
      return {
        success: true,
        taskId,
        verificationResult,
      };
    } catch (error: any) {
      const message = error?.message || '离线下载失败';
      await logger.logOfflineFailed(videoId, message);
      return {
        success: false,
        taskId,
        error: message,
      };
    }
  }

  async downloadBatch(options: Drive115BatchOptionsUnified): Promise<Drive115BatchResultUnified> {
    const logger = getDrive115AppLogger();
    const state = await this.getRuntimeState();
    const tasks = Array.isArray(options.tasks) ? options.tasks : [];
    const maxFailures = options.maxFailures ?? state.maxFailures ?? 5;
    const results: Drive115BatchResultUnified['results'] = [];
    let failureCount = 0;

    await logger.logBatchStart(tasks.length);

    for (const task of tasks) {
      if (maxFailures > 0 && failureCount >= maxFailures) break;

      const result = await this.downloadOffline({
        videoId: task.videoId,
        magnetUrl: task.magnetUrl,
        downloadDir: options.downloadDir,
        autoVerify: options.autoVerify,
        notify: false,
      });

      results.push({ videoId: task.videoId, result });
      if (!result.success) failureCount += 1;
      await delay(2000);
    }

    const successCount = results.filter(item => item.result.success).length;
    const finalFailureCount = results.filter(item => !item.result.success).length;
    await logger.logBatchComplete(successCount, finalFailureCount);

    return {
      totalTasks: tasks.length,
      successCount,
      failureCount: finalFailureCount,
      results,
    };
  }

  async getLogs() {
    return getDrive115AppLogger().getLogs();
  }

  async getLogStats() {
    return getDrive115AppLogger().getLogStats();
  }

  async clearLogs() {
    return getDrive115AppLogger().clearLogs();
  }

  async exportLogs() {
    return getDrive115AppLogger().exportLogs();
  }

  getV2Service() {
    return getDrive115V2Service();
  }
}

let instance: Drive115AppService | null = null;

export function getDrive115AppService(): Drive115AppService {
  if (!instance) {
    instance = new Drive115AppService();
  }
  return instance;
}

export * from './types';
export * from './runtime';
export * from './adapters';
