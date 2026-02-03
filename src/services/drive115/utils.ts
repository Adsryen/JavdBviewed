/**
 * 115网盘工具函数
 */

import type { Drive115SearchResult } from './types';
import { DYNAMIC_DIR_PARAMS, MAGNET_REGEX } from './config';

/**
 * 验证磁链格式
 */
export function isValidMagnetUrl(url: string): boolean {
  return MAGNET_REGEX.test(url);
}

/**
 * 解析动态目录参数
 * @param dirTemplate 目录模板，如 "${#star}/云下载"
 * @param params 参数对象
 * @returns 解析后的目录路径
 */
export function parseDynamicDirectory(
  dirTemplate: string,
  params: {
    star?: string;
    series?: string;
    studio?: string;
  } = {}
): string {
  let result = dirTemplate;
  
  // 替换演员参数
  if (params.star) {
    result = result.replace(DYNAMIC_DIR_PARAMS.STAR, params.star);
  }
  
  // 替换系列参数
  if (params.series) {
    result = result.replace(DYNAMIC_DIR_PARAMS.SERIES, params.series);
  }
  
  // 替换制作商参数
  if (params.studio) {
    result = result.replace(DYNAMIC_DIR_PARAMS.STUDIO, params.studio);
  }
  
  // 清理路径中的特殊字符
  result = result.replace(/[<>:"|?*]/g, '_');
  
  // 移除未替换的参数
  result = result.replace(/\$\{[^}]+\}/g, '');
  
  // 清理多余的斜杠
  result = result.replace(/\/+/g, '/');
  result = result.replace(/^\/|\/$/g, '');
  
  return result || '云下载';
}

/**
 * 生成验证码窗口位置
 */
export function getVerificationWindowPosition(width: number, height: number) {
  const screenWidth = window.screen.availWidth;
  const screenHeight = window.screen.availHeight;
  
  return {
    left: Math.round((screenWidth - width) / 2),
    top: Math.round((screenHeight - height) / 2),
  };
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 检查文件是否为视频文件
 */
export function isVideoFile(filename: string): boolean {
  const videoExtensions = [
    '.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', 
    '.webm', '.m4v', '.3gp', '.ts', '.rmvb', '.rm'
  ];
  
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return videoExtensions.includes(ext);
}

/**
 * 从搜索结果中筛选视频文件
 */
export function filterVideoFiles(results: Drive115SearchResult[]): Drive115SearchResult[] {
  return results.filter(file => isVideoFile(file.n));
}

/**
 * 根据番号匹配文件
 */
export function matchVideoByCode(
  results: Drive115SearchResult[], 
  videoCode: string
): Drive115SearchResult[] {
  const normalizedCode = videoCode.toUpperCase().replace(/[-_]/g, '');
  
  return results.filter(file => {
    const normalizedFilename = file.n.toUpperCase().replace(/[-_]/g, '');
    return normalizedFilename.includes(normalizedCode);
  });
}

/**
 * 生成任务ID
 */
export function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 延迟函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 重试函数
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxAttempts) {
        await delay(delayMs * attempt); // 递增延迟
      }
    }
  }
  
  throw lastError!;
}

/**
 * 解析115错误响应
 */
export function parseErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.error) {
    return error.error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return '未知错误';
}

/**
 * 检查是否为115域名
 */
export function is115Domain(url: string): boolean {
  try {
    const domain = new URL(url).hostname;
    return domain.includes('115.com');
  } catch {
    return false;
  }
}

/**
 * 生成115文件跳转链接
 */
export function generateFileUrl(cid: string): string {
  return `https://115.com/?cid=${cid}&offset=0&mode=wangpan`;
}

/**
 * 生成115播放链接
 */
export function generatePlayUrl(pickcode: string): string {
  return `https://v.anxia.com/?pickcode=${pickcode}`;
}
