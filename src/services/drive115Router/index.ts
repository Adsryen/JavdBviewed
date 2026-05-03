/**
 * 115 统一路由（过渡期兼容层）
 * 对外继续暴露历史接口，但内部统一转发到 v2 应用服务层。
 */

import type { Drive115BatchOptionsUnified, Drive115OfflineOptionsUnified } from '../drive115App';
import { getDrive115AppService } from '../drive115App';

export async function isDrive115Enabled(): Promise<boolean> {
  return getDrive115AppService().isEnabled();
}

export async function searchFiles(query: string) {
  return getDrive115AppService().searchFiles(query);
}

export async function downloadOffline(options: Drive115OfflineOptionsUnified) {
  return getDrive115AppService().downloadOffline(options);
}

export async function downloadBatch(options: Drive115BatchOptionsUnified) {
  return getDrive115AppService().downloadBatch(options);
}

export async function verifyDownload(videoId: string) {
  return getDrive115AppService().verifyDownload(videoId);
}

export async function getLogs() {
  return getDrive115AppService().getLogs();
}

export async function getLogStats() {
  return getDrive115AppService().getLogStats();
}

export async function clearLogs() {
  return getDrive115AppService().clearLogs();
}

export async function exportLogs() {
  return getDrive115AppService().exportLogs();
}

export async function addTaskUrlsV2(params: { urls: string; wp_path_id?: string }): Promise<{ success: boolean; message?: string; data?: any[]; raw?: any }>{
  return getDrive115AppService().addTaskUrls(params);
}
