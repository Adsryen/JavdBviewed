// HTTP 客户端，处理网络请求、跨域 background fetch 和错误重试。

import { FetchOptions, NetworkError } from './types';

export { NetworkError } from './types';
export type { FetchOptions } from './types';

export interface RequestConfig extends FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: string | FormData;
  responseType?: 'text' | 'json' | 'blob' | 'document';
}

export class HttpClient {
  private defaultTimeout = 10000;
  private defaultRetries = 3;
  private requestQueue: Map<string, Promise<any>> = new Map();

  constructor(
    private baseUrl: string = '',
    private defaultHeaders: Record<string, string> = {},
  ) {}

  async request<T>(url: string, config: RequestConfig = {}): Promise<T> {
    const fullUrl = this.resolveUrl(url);
    const requestKey = this.getRequestKey(fullUrl, config);

    if (this.requestQueue.has(requestKey)) {
      return this.requestQueue.get(requestKey);
    }

    const requestPromise = this.executeRequest<T>(fullUrl, config);
    this.requestQueue.set(requestKey, requestPromise);

    try {
      return await requestPromise;
    } finally {
      this.requestQueue.delete(requestKey);
    }
  }

  async get<T>(url: string, options: FetchOptions = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  async post<T>(url: string, body?: any, options: FetchOptions = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  }

  async getDocument(url: string, options: FetchOptions = {}): Promise<Document> {
    const html = await this.get<string>(url, { ...options, responseType: 'text' });
    const parser = new DOMParser();
    return parser.parseFromString(html, 'text/html');
  }

  async getJson<T>(url: string, options: FetchOptions = {}): Promise<T> {
    return this.get<T>(url, { ...options, responseType: 'json' });
  }

  async batchRequest<T>(
    requests: Array<{ url: string; config?: RequestConfig }>,
    concurrency: number = 3,
  ): Promise<Array<{ success: boolean; data?: T; error?: string; url: string }>> {
    const results: Array<{ success: boolean; data?: T; error?: string; url: string }> = [];

    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchPromises = batch.map(async ({ url, config }) => {
        try {
          const data = await this.request<T>(url, config);
          return { success: true, data, url };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            url,
          };
        }
      });

      results.push(...await Promise.all(batchPromises));
    }

    return results;
  }

  clearQueue(): void {
    this.requestQueue.clear();
  }

  getQueueStatus(): { pending: number; urls: string[] } {
    const urls = Array.from(this.requestQueue.keys()).map(key => key.split(':')[1]);
    return {
      pending: this.requestQueue.size,
      urls,
    };
  }

  private async executeRequest<T>(url: string, config: RequestConfig): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      responseType = 'json',
      referrer,
    } = config;

    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers,
    };

    if (method === 'POST' && body && typeof body === 'string' && !requestHeaders['Content-Type']) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (this.needsBackgroundFetch(url)) {
          return await this.fetchViaBackground<T>(url, {
            method,
            headers: requestHeaders,
            body,
            timeout,
            responseType,
            referrer,
          });
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          body,
          signal: controller.signal,
          ...(referrer ? { referrer } : {}),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new NetworkError(
            `HTTP ${response.status}: ${response.statusText}`,
            url,
            response.status,
          );
        }

        return await this.parseResponse<T>(response, responseType);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt === retries) {
          break;
        }

        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    throw lastError!;
  }

  private async parseResponse<T>(response: Response, responseType: string): Promise<T> {
    switch (responseType) {
      case 'json':
        return await response.json();
      case 'text':
        return (await response.text()) as unknown as T;
      case 'blob':
        return (await response.blob()) as unknown as T;
      case 'document': {
        const html = await response.text();
        const parser = new DOMParser();
        return parser.parseFromString(html, 'text/html') as unknown as T;
      }
      default:
        return await response.json();
    }
  }

  private resolveUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${this.baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
  }

  private getRequestKey(url: string, config: RequestConfig): string {
    const { method = 'GET', body } = config;
    return `${method}:${url}:${body || ''}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private needsBackgroundFetch(url: string): boolean {
    if (typeof chrome === 'undefined' || !chrome.runtime) {
      return false;
    }

    try {
      const urlObj = new URL(url);
      const currentOrigin = window.location.origin;
      return urlObj.origin !== currentOrigin;
    } catch {
      return false;
    }
  }

  private async fetchViaBackground<T>(url: string, options: any): Promise<T> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'fetch-external-data',
        url,
        options,
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!response) {
          reject(new Error('No response from background script'));
          return;
        }

        if (!response.success) {
          reject(new NetworkError(response.error, url));
          return;
        }

        if (typeof response.status === 'number' && response.status >= 400) {
          reject(new NetworkError(`HTTP ${response.status}`, url, response.status));
          return;
        }

        try {
          let data = response.data;

          if (options.responseType === 'document' && typeof data === 'string') {
            const parser = new DOMParser();
            data = parser.parseFromString(data, 'text/html');
          }

          resolve(data as T);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      });
    });
  }
}

export const defaultHttpClient = new HttpClient('', {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
});

export function createHttpClient(baseUrl: string, headers: Record<string, string> = {}): HttpClient {
  return new HttpClient(baseUrl, headers);
}

export function isNetworkError(error: any): error is NetworkError {
  return error instanceof NetworkError;
}

export function getErrorMessage(error: any): string {
  if (error instanceof NetworkError) {
    return `Network error (${error.statusCode}): ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error occurred';
}
