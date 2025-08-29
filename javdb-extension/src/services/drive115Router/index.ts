/**
 * 115 统一路由（v1/v2 门面）
 * 目标：对外暴露一个稳定接口，内部根据设置选择 v1 或 v2 实现。
 */

import { getSettings } from '../../utils/storage';
import type { ExtensionSettings } from '../../types';
import type { OfflineDownloadOptions, BatchOfflineOptions } from '../drive115/types';
import { getDrive115Service as getV1, initializeDrive115Service as initV1 } from '../drive115';

/**
 * 获取当前激活版本：true => v2，false => v1
 */
async function isV2Enabled(): Promise<boolean> {
  try {
    const settings: ExtensionSettings = await getSettings();
    const sel = settings.drive115?.lastSelectedVersion;
    if (sel === 'v1') return false;
    if (sel === 'v2') return true;
    return !!settings.drive115?.enableV2;
  } catch {
    return false;
  }
}

/**
 * 是否整体启用 115 功能
 */
export async function isDrive115Enabled(): Promise<boolean> {
  try {
    const settings: ExtensionSettings = await getSettings();
    return !!settings.drive115?.enabled;
  } catch {
    return false;
  }
}

/**
 * 统一：搜索文件
 */
export async function searchFiles(query: string) {
  if (await isV2Enabled()) {
    // v2 尚未实现搜索，暂时降级到 v1 的搜索，避免功能中断
    await initV1();
    return getV1().searchFiles(query);
  }
  await initV1();
  return getV1().searchFiles(query);
}

/**
 * 统一：单任务离线下载
 */
export async function downloadOffline(options: OfflineDownloadOptions) {
  if (await isV2Enabled()) {
    // v2 下载尚未实现：显式抛错，提示切回 v1
    throw new Error('115 v2 下载功能暂未实现，请在设置中切换到 v1 模式使用下载');
  }
  await initV1();
  return getV1().downloadOffline(options);
}

/**
 * 统一：批量离线下载
 */
export async function downloadBatch(options: BatchOfflineOptions) {
  if (await isV2Enabled()) {
    throw new Error('115 v2 批量下载暂未实现，请在设置中切换到 v1 模式使用下载');
  }
  await initV1();
  return getV1().downloadBatch(options);
}

/**
 * 统一：验证下载
 */
export async function verifyDownload(videoId: string) {
  if (await isV2Enabled()) {
    throw new Error('115 v2 下载验证暂未实现，请在设置中切换到 v1 模式');
  }
  await initV1();
  return getV1().verifyDownload(videoId);
}

/**
 * 统一：日志能力（沿用 v1 日志，v2 可独立实现后再分流）
 */
export async function getLogs() {
  await initV1();
  return getV1().getLogs();
}
export async function getLogStats() {
  await initV1();
  return getV1().getLogStats();
}
export async function clearLogs() {
  await initV1();
  return getV1().clearLogs();
}
export async function exportLogs() {
  await initV1();
  return getV1().exportLogs();
}
