/**
 * @file types.ts
 * @description 网络层公共类型定义
 * @module platform/network
 */

/** fetch 请求选项 */
export interface FetchOptions {
  timeout?: number;                                   // 超时时间（毫秒），默认 10000
  retries?: number;                                   // 最大重试次数，默认 3
  headers?: Record<string, string>;
  referrer?: string;
  proxy?: boolean;                                    // 是否通过 background 代理请求（规避 CORS）
  responseType?: 'text' | 'json' | 'blob' | 'document';
}

/** 网络请求错误，携带 URL 和状态码信息 */
export class NetworkError extends Error {
  constructor(
    message: string,
    public url: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}
