/**
 * @file index.ts
 * @description 网络子系统统一导出（HTTP 客户端、fetch 封装、请求调度、IP 查询）
 */
export {
  createHttpClient,
  defaultHttpClient,
  getErrorMessage,
  HttpClient,
  isNetworkError,
  type RequestConfig,
} from './httpClient';
export {
  RequestScheduler,
  requestScheduler,
  type RequestSchedulerOptions,
  type SchedulerConfig,
} from './requestScheduler';
export { registerNetProxyRouter } from './backgroundFetchRouter';
export { bgFetchJSON, bgFetchText } from './clientFetch';
export { lookupIpOrDomain } from './ipLookup';
export { NetworkError } from './types';
export type { BgFetchJSONResult, BgFetchTextResult } from './clientFetch';
export type { IpWhoisResult } from './ipLookup';
export type { FetchOptions } from './types';
