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
  buildServerApiUrl,
  buildTelemetryReportUrl,
  DEFAULT_SERVER_API_BASE_URL,
  GITHUB_BOOTSTRAP_URL,
  PRIMARY_BOOTSTRAP_URL,
  refreshServerEndpoint,
  resolveServerEndpoint,
  SERVER_ENDPOINT_STATE_KEY,
  stableStringifyWithoutChecksum,
  verifyJsonChecksum,
  type BootstrapApiBaseUrl,
  type RefreshServerEndpointOptions,
  type ServerBootstrapDocument,
  type ServerEndpointState,
} from './serverEndpointResolver';
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
