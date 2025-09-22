/**
 * 115网盘API接口封装
 */

// Greasemonkey/Tampermonkey 环境变量声明，避免 TS 找不到符号
declare const GM_xmlhttpRequest: any;

import type {
  Drive115SignResponse,
  Drive115AddTaskResponse,
  Drive115SearchResponse,
  Drive115SearchResult,
  OfflineDownloadOptions,
  OfflineDownloadResult,
  BatchOfflineOptions,
  BatchOfflineResult
} from './types';

import {
  DRIVE115_ENDPOINTS,
  SEARCH_CONFIG,
  OFFLINE_CONFIG,
  DRIVE115_ERROR_MESSAGES,
  DRIVE115_ERROR_CODES
} from './config';

import {
  isValidMagnetUrl,
  filterVideoFiles,
  matchVideoByCode,
  generateTaskId,
  delay,
  parseErrorMessage
} from './utils';

import { performVerification } from './verification';

/**
 * 115网盘API客户端
 */
export class Drive115ApiClient {
  constructor() {
    // Logger will be imported dynamically when needed
  }

  /**
   * 过滤 headers 中的 undefined 值，保持类型为 Record<string, string>
   */
  private sanitizeHeaders(h: Record<string, string | undefined>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(h || {})) {
      if (typeof v === 'string') out[k] = v;
    }
    return out;
  }

  /**
   * 发送HTTP请求
   */
  private async request<T = any>(
    url: string,
    options: {
      method?: 'GET' | 'POST';
      data?: Record<string, any>;
      headers?: Record<string, string | undefined>;
      responseType?: 'json' | 'text' | 'document';
    } = {}
  ): Promise<T> {
    const {
      method = 'GET',
      data,
      headers = {},
      responseType = 'json'
    } = options;

    return new Promise((resolve, reject) => {
      // 使用GM_xmlhttpRequest发送请求
      if (typeof GM_xmlhttpRequest !== 'undefined') {
        const requestOptions: any = {
          method,
          url,
          headers: this.sanitizeHeaders({
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-US;q=0.7,zh-HK;q=0.6',
            'X-Requested-With': 'XMLHttpRequest',
            ...headers
          }),
          timeout: 30000,
          withCredentials: true, // 确保发送Cookie
          onload: (response: any) => {
            if (response.status >= 400) {
              reject(new Error(`HTTP ${response.status}: ${response.statusText}`));
              return;
            }

            let result = response.response;
            
            if (responseType === 'json' && typeof result === 'string') {
              try {
                result = JSON.parse(result);
              } catch (e) {
                reject(new Error('Invalid JSON response'));
                return;
              }
            }

            resolve(result);
          },
          ontimeout: () => reject(new Error('Request timeout')),
          onerror: () => reject(new Error('Network error'))
        };

        // 处理POST数据
        if (method === 'POST' && data) {
          if (typeof data === 'object') {
            requestOptions.data = Object.keys(data)
              .map(key => `${key}=${encodeURIComponent(data[key])}`)
              .join('&');
          } else {
            requestOptions.data = data;
          }
        } else if (method === 'GET' && data) {
          const params = Object.keys(data)
            .map(key => `${key}=${encodeURIComponent(data[key])}`)
            .join('&');
          requestOptions.url = `${url}${url.includes('?') ? '&' : '?'}${params}`;
        }

        GM_xmlhttpRequest(requestOptions);
      } else {
        // 降级到fetch API
        this.fetchRequest<T>(url, options).then(resolve).catch(reject);
      }
    });
  }

  /**
   * 使用fetch API的降级实现
   */
  private async fetchRequest<T>(
    url: string,
    options: {
      method?: 'GET' | 'POST';
      data?: Record<string, any>;
      headers?: Record<string, string | undefined>;
      responseType?: 'json' | 'text' | 'document';
    }
  ): Promise<T> {
    const { method = 'GET', data, headers = {}, responseType = 'json' } = options;

    const fetchOptions: RequestInit = {
      method,
      headers: this.sanitizeHeaders({
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-US;q=0.7,zh-HK;q=0.6',
        'X-Requested-With': 'XMLHttpRequest',
        ...headers
      }),
      credentials: 'include' // 确保发送Cookie
    };

    if (method === 'POST' && data) {
      if (typeof data === 'object') {
        fetchOptions.body = Object.keys(data)
          .map(key => `${key}=${encodeURIComponent(data[key])}`)
          .join('&');
      } else {
        fetchOptions.body = data;
      }
    } else if (method === 'GET' && data) {
      const params = Object.keys(data)
        .map(key => `${key}=${encodeURIComponent(data[key])}`)
        .join('&');
      url = `${url}${url.includes('?') ? '&' : '?'}${params}`;
    }

    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (responseType === 'json') {
      return response.json();
    } else if (responseType === 'text') {
      return response.text() as any;
    } else {
      return response.text() as any;
    }
  }

  /**
   * 获取用户信息和签名
   */
  async getSignAndUserInfo(): Promise<{ sign: string; time: string; uid: string; wp_path_id: string }> {
    try {
      // 首先获取签名
      const response = await this.request<Drive115SignResponse>(
        DRIVE115_ENDPOINTS.SIGN,
        {
          method: 'GET',
          data: {
            ct: 'offline',
            ac: 'space',
            _: Date.now()
          },
          headers: {
            'Referer': 'https://115.com/?tab=offline&mode=wangpan',
            'X-Requested-With': 'XMLHttpRequest'
          },
          responseType: 'json'
        }
      );

      if (!response.state) {
        throw new Error(response.error || '获取签名失败');
      }

      if (!response.sign || !response.time) {
        throw new Error('签名响应格式错误');
      }

      // 从Cookie中提取UID
      const uid = this.extractUidFromCookie();
      if (!uid) {
        throw new Error('无法获取用户ID，请确保已登录115网盘');
      }

      // 获取默认下载目录ID
      const wp_path_id = await this.getDefaultDownloadDirId();

      return {
        sign: response.sign,
        time: response.time,
        uid,
        wp_path_id
      };
    } catch (error) {
      console.error('获取115签名和用户信息失败:', error);
      throw error;
    }
  }

  /**
   * 从Cookie中提取UID
   */
  private extractUidFromCookie(): string | null {
    try {
      // 尝试从document.cookie中提取UID
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'UID') {
          // UID格式通常是 "数字_A1_时间戳"
          const uidMatch = value.match(/^(\d+)_/);
          return uidMatch ? uidMatch[1] : null;
        }
      }
      return null;
    } catch (error) {
      console.error('提取UID失败:', error);
      return null;
    }
  }

  /**
   * 获取默认下载目录ID
   */
  private async getDefaultDownloadDirId(): Promise<string> {
    try {
      // 尝试获取"云下载"目录的ID
      const response = await this.request<any>(
        DRIVE115_ENDPOINTS.GET_DIR_INFO,
        {
          method: 'GET',
          data: {
            aid: 1,
            cid: 0,
            o: 'user_ptime',
            asc: 0,
            offset: 0,
            show_dir: 1,
            limit: 115,
            code: '',
            scid: '',
            snap: 0,
            natsort: 1,
            record_open_time: 1,
            source_path: '',
            format: 'json'
          },
          headers: {
            'Referer': 'https://115.com/?cid=0&offset=0&mode=wangpan',
            'X-Requested-With': 'XMLHttpRequest'
          }
        }
      );

      if (response.state && response.data) {
        // 查找"云下载"目录
        const cloudDownloadDir = response.data.find((item: any) =>
          item.n === '云下载' || item.n === 'CloudDownload'
        );

        if (cloudDownloadDir) {
          console.log('找到云下载目录:', cloudDownloadDir.cid);
          return cloudDownloadDir.cid;
        }
      }

      // 如果没找到云下载目录，返回根目录
      console.warn('未找到云下载目录，使用根目录');
      return '0';
    } catch (error) {
      console.warn('获取下载目录ID失败，使用根目录:', error);
      return '0';
    }
  }

  /**
   * 添加离线下载任务
   */
  async addOfflineTask(
    magnetUrl: string,
    uid: string,
    wp_path_id: string,
    sign: string,
    time: string,
    savepath: string = ''
  ): Promise<Drive115AddTaskResponse> {
    try {
      const response = await this.request<Drive115AddTaskResponse>(
        DRIVE115_ENDPOINTS.ADD_TASK,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-US;q=0.7,zh-HK;q=0.6',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': 'https://115.com/?tab=offline&mode=wangpan'
          },
          data: {
            url: magnetUrl,
            savepath,
            wp_path_id,
            uid,
            sign,
            time
          }
        }
      );

      return response;
    } catch (error) {
      console.error('添加离线任务失败:', { magnetUrl, wp_path_id, error });
      throw error;
    }
  }

  /**
   * 搜索文件
   */
  async searchFiles(query: string): Promise<Drive115SearchResult[]> {
    try {
      const response = await this.request<Drive115SearchResponse>(
        DRIVE115_ENDPOINTS.SEARCH,
        {
          method: 'GET',
          data: {
            ...SEARCH_CONFIG,
            search_value: query
          }
        }
      );

      if (!response.state) {
        if (response.errNo === DRIVE115_ERROR_CODES.NOT_LOGGED_IN) {
          throw new Error(DRIVE115_ERROR_MESSAGES[DRIVE115_ERROR_CODES.NOT_LOGGED_IN]);
        }
        throw new Error(response.error || '搜索失败');
      }

      return response.data || [];
    } catch (error) {
      console.error('搜索文件失败:', { query, error });
      throw error;
    }
  }

  /**
   * 验证下载结果
   */
  async verifyDownload(videoId: string, maxAttempts: number = 5): Promise<Drive115SearchResult[]> {
    console.log('开始验证下载结果:', { videoId, maxAttempts });

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await delay(OFFLINE_CONFIG.defaultVerifyDelay);

        const results = await this.searchFiles(videoId);
        const videoFiles = filterVideoFiles(results);
        const matchedFiles = matchVideoByCode(videoFiles, videoId);

        if (matchedFiles.length > 0) {
          console.log('验证成功，找到匹配文件:', {
            videoId,
            attempt,
            fileCount: matchedFiles.length
          });
          return matchedFiles;
        }

        console.log('验证中，未找到文件:', { videoId, attempt });
      } catch (error) {
        console.warn('验证尝试失败:', {
          videoId,
          attempt,
          error: parseErrorMessage(error)
        });
      }
    }

    console.warn('验证失败，未找到匹配文件:', { videoId, maxAttempts });
    return [];
  }

  /**
   * 单个离线下载
   */
  async downloadOffline(options: OfflineDownloadOptions): Promise<OfflineDownloadResult> {
    const { videoId, magnetUrl, downloadDir, autoVerify = true } = options;
    const taskId = generateTaskId();

    console.log('开始离线下载:', { taskId, videoId, magnetUrl });

    try {
      // 验证磁链格式
      if (!isValidMagnetUrl(magnetUrl)) {
        throw new Error('磁链格式无效');
      }

      // 检查是否需要验证码
      const needsVerification = await performVerification();
      if (!needsVerification) {
        throw new Error('115验证失败');
      }

      // 获取签名和用户信息
      const { sign, time, uid, wp_path_id } = await this.getSignAndUserInfo();

      // 使用用户指定的下载目录或默认目录
      const finalWpPathId = downloadDir || wp_path_id;

      // 添加离线任务
      const response = await this.addOfflineTask(magnetUrl, uid, finalWpPathId, sign, time);

      if (!response.state) {
        throw new Error(response.error || '添加离线任务失败');
      }

      console.log('离线任务添加成功:', { taskId, videoId });

      // 自动验证下载结果
      let verificationResult;
      if (autoVerify) {
        const foundFiles = await this.verifyDownload(videoId);
        verificationResult = {
          verified: foundFiles.length > 0,
          foundFiles
        };
      }

      const result: OfflineDownloadResult = {
        success: true,
        taskId,
        verificationResult
      };

      console.log('离线下载完成:', { taskId, videoId, result });
      return result;

    } catch (error) {
      const errorMessage = parseErrorMessage(error);
      console.error('离线下载失败:', { taskId, videoId, error: errorMessage });

      return {
        success: false,
        taskId,
        error: errorMessage
      };
    }
  }

  /**
   * 批量离线下载
   */
  async downloadBatch(options: BatchOfflineOptions): Promise<BatchOfflineResult> {
    const { tasks, downloadDir, maxFailures = 5, autoVerify = true } = options;

    console.log('开始批量离线下载:', {
      taskCount: tasks.length,
      maxFailures
    });

    const results: BatchOfflineResult['results'] = [];
    let failureCount = 0;

    for (const task of tasks) {
      // 检查失败次数
      if (maxFailures > 0 && failureCount >= maxFailures) {
        console.warn('达到最大失败次数，终止批量下载:', {
          failureCount,
          maxFailures
        });
        break;
      }

      try {
        const result = await this.downloadOffline({
          ...task,
          downloadDir,
          autoVerify,
          notify: false // 批量下载时不单独通知
        });

        results.push({
          videoId: task.videoId,
          result
        });

        if (!result.success) {
          failureCount++;
        }

        // 批量下载间隔
        await delay(OFFLINE_CONFIG.batchDelay);

      } catch (error) {
        failureCount++;
        results.push({
          videoId: task.videoId,
          result: {
            success: false,
            error: parseErrorMessage(error)
          }
        });
      }
    }

    const successCount = results.filter(r => r.result.success).length;
    const finalFailureCount = results.filter(r => !r.result.success).length;

    const batchResult: BatchOfflineResult = {
      totalTasks: tasks.length,
      successCount,
      failureCount: finalFailureCount,
      results
    };

    console.log('批量离线下载完成:', batchResult);
    return batchResult;
  }
}
