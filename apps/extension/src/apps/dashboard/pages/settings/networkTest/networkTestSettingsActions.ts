/**
 * @file networkTestSettingsActions.ts
 * @description 网络配置连通性测试动作（对齐遗留 NetworkTestSettings）
 * @module apps/dashboard/pages/settings/networkTest
 */
import { getRepoRawUrl } from '../../../../../shared/repoIdentity';
import {
  EXTENSION_DOMAINS,
  getAllEnabledDomains,
  getDomainStats,
  getDomainsByCategory,
  loadDomainConfig,
  saveDomainConfig,
  type DomainInfo,
} from '../../../../../features/networkTest';
import {
  formatLastTestTime,
  getProxyBaseUrl,
  type GithubProxyService,
} from './networkTestSettingsModel';

export type ToastType = 'success' | 'info' | 'error' | 'warning' | 'warn';

export async function toast(message: string, type: ToastType = 'info'): Promise<void> {
  try {
    const { showMessage } = await import('../../../../../dashboard/ui/toast');
    const mapped = type === 'warn' ? 'warning' : type;
    showMessage(message, mapped as any);
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// 线路延迟缓存（sessionStorage，5 分钟）
// ---------------------------------------------------------------------------

const ROUTE_LATENCY_PREFIX = 'route_latency_';
const ROUTE_LATENCY_TTL_MS = 5 * 60 * 1000;
export const LAST_TEST_TIME_KEY = 'network_test_last_time';

export function getRouteLatency(url: string): number | null {
  try {
    const cached = sessionStorage.getItem(ROUTE_LATENCY_PREFIX + url);
    if (!cached) return null;
    const data = JSON.parse(cached) as { latency: number; timestamp: number };
    if (Date.now() - data.timestamp < ROUTE_LATENCY_TTL_MS) {
      return data.latency;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function saveRouteLatency(url: string, latency: number): void {
  try {
    sessionStorage.setItem(
      ROUTE_LATENCY_PREFIX + url,
      JSON.stringify({ latency, timestamp: Date.now() }),
    );
  } catch {
    /* ignore */
  }
}

export function readLastTestTime(): string | null {
  try {
    return localStorage.getItem(LAST_TEST_TIME_KEY);
  } catch {
    return null;
  }
}

export function saveLastTestTime(): string {
  const now = new Date().toISOString();
  try {
    localStorage.setItem(LAST_TEST_TIME_KEY, now);
  } catch {
    /* ignore */
  }
  return now;
}

export function getLastTestTimeLabel(): string {
  return formatLastTestTime(readLastTestTime());
}

// ---------------------------------------------------------------------------
// GitHub 代理测试
// ---------------------------------------------------------------------------

export type ProxyProbeSide = {
  success: boolean;
  latency: number;
};

export type ProxyTestResult = {
  direct: ProxyProbeSide;
  proxy: ProxyProbeSide;
  summary: string;
  summaryTone: 'success' | 'warning' | 'error' | 'info';
  proxyOk: boolean;
};

/**
 * 测试 GitHub 加速代理（HEAD 直连 vs 代理）
 */
export async function testGithubProxy(
  proxyService: GithubProxyService | string,
  customProxyUrl: string,
): Promise<ProxyTestResult> {
  const testFileUrl = getRepoRawUrl('public/routes.json');
  const proxyBase = getProxyBaseUrl(proxyService, customProxyUrl);
  const proxiedUrl = proxyBase + testFileUrl;

  const probe = async (url: string): Promise<ProxyProbeSide> => {
    const start = Date.now();
    try {
      await fetch(url, { method: 'HEAD', cache: 'no-cache' });
      return { success: true, latency: Date.now() - start };
    } catch {
      return { success: false, latency: Date.now() - start };
    }
  };

  const direct = await probe(testFileUrl);
  const proxy = await probe(proxiedUrl);

  let summary = '';
  let summaryTone: ProxyTestResult['summaryTone'] = 'info';

  if (direct.success && proxy.success) {
    const improvement =
      ((direct.latency - proxy.latency) / Math.max(direct.latency, 1)) * 100;
    if (proxy.latency < direct.latency) {
      summary = `代理加速 ${improvement.toFixed(1)}%`;
      summaryTone = 'success';
    } else {
      summary = `代理较慢 ${Math.abs(improvement).toFixed(1)}%`;
      summaryTone = 'warning';
    }
  } else if (proxy.success && !direct.success) {
    summary = '代理可用，直连失败';
    summaryTone = 'success';
  } else if (!proxy.success) {
    summary = '代理不可用';
    summaryTone = 'error';
  }

  return {
    direct,
    proxy,
    summary,
    summaryTone,
    proxyOk: proxy.success,
  };
}

// ---------------------------------------------------------------------------
// 线路测试
// ---------------------------------------------------------------------------

export type RouteProbeResult = {
  url: string;
  success: boolean;
  latency: number;
};

/**
 * 测试单条线路（HEAD + no-cors）
 */
export async function testSingleRoute(url: string): Promise<RouteProbeResult> {
  const start = Date.now();
  try {
    await fetch(url, { method: 'HEAD', mode: 'no-cors', cache: 'no-cache' });
    const latency = Date.now() - start;
    saveRouteLatency(url, latency);
    return { url, success: true, latency };
  } catch {
    const latency = Date.now() - start;
    saveRouteLatency(url, -1);
    return { url, success: false, latency };
  }
}

/**
 * 顺序测试多条线路
 */
export async function testAllRoutes(urls: string[]): Promise<RouteProbeResult[]> {
  const results: RouteProbeResult[] = [];
  for (const url of urls) {
    results.push(await testSingleRoute(url));
  }
  return results;
}

/**
 * 从 GitHub / 远程更新线路配置
 */
export async function updateRoutesFromGithub(): Promise<{
  updated: boolean;
  message: string;
}> {
  const { RouteManager } = await import('../../../../../features/routeManagement');
  const routeManager = RouteManager.getInstance();
  const updated = await routeManager.checkAndUpdateRoutes(true);
  return {
    updated,
    message: updated ? '线路配置已从 GitHub 更新成功！' : '当前已是最新版本，无需更新',
  };
}

/**
 * 清除路由管理器缓存（设首选后）
 */
export async function clearRouteManagerCache(service: 'javdb' | 'javbus' = 'javdb'): Promise<void> {
  try {
    const { getRouteManager } = await import('../../../../../features/routeManagement');
    getRouteManager().clearCache(service);
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// 手动 Ping
// ---------------------------------------------------------------------------

export type PingProgressItem = {
  id: string;
  kind: 'progress' | 'reply' | 'failure' | 'summary' | 'error' | 'separator';
  message: string;
  success?: boolean;
  latency?: number;
  summaryHtml?: never;
  stats?: {
    url: string;
    sent: number;
    received: number;
    lost: number;
    lossPct: number;
    min?: number;
    max?: number;
    avg?: number;
  };
};

let pingIdSeq = 0;
function nextPingId(): string {
  pingIdSeq += 1;
  return `ping-${pingIdSeq}`;
}

/**
 * 模拟 ping：HEAD + no-cors，默认 4 次
 */
export async function runPing(
  url: string,
  count = 4,
  onProgress?: (item: PingProgressItem) => void,
): Promise<number[]> {
  const latencies: number[] = [];
  onProgress?.({
    id: nextPingId(),
    kind: 'progress',
    message: `正在 Ping ${url} ...`,
    success: true,
  });

  for (let i = 0; i < count; i++) {
    const startTime = Date.now();
    try {
      const cacheBuster = `?t=${Date.now()}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      await fetch(url + cacheBuster, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;
      latencies.push(latency);
      onProgress?.({
        id: nextPingId(),
        kind: 'reply',
        message: `来自 ${url} 的回复`,
        success: true,
        latency,
      });
      if (i < count - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      let errorMessage = '未知错误';
      if (error instanceof Error) {
        errorMessage = error.name === 'AbortError' ? '请求超时' : error.message;
      }
      onProgress?.({
        id: nextPingId(),
        kind: 'failure',
        message: `请求失败: ${errorMessage}`,
        success: false,
        latency,
      });
      latencies.push(-1);
    }
  }
  return latencies;
}

/**
 * 手动 URL 测试入口：自动补协议，汇总统计
 */
export async function runManualPingTest(
  urlValue: string,
  onItem: (item: PingProgressItem) => void,
): Promise<void> {
  const trimmed = urlValue.trim();
  if (!trimmed) {
    onItem({
      id: nextPingId(),
      kind: 'error',
      message: '请输入一个有效的 URL。',
      success: false,
    });
    return;
  }

  const urlsToTest: string[] = [];
  if (/^https?:\/\//i.test(trimmed)) {
    urlsToTest.push(trimmed);
  } else {
    urlsToTest.push(`https://${trimmed}`);
    urlsToTest.push(`http://${trimmed}`);
  }

  for (let i = 0; i < urlsToTest.length; i++) {
    const url = urlsToTest[i];
    try {
      const latencies = await runPing(url, 4, onItem);
      // 移除“正在 Ping...”进度项由调用方按 kind 过滤
      const valid = latencies.filter((l) => l >= 0);
      if (valid.length > 0) {
        const sum = valid.reduce((a, b) => a + b, 0);
        onItem({
          id: nextPingId(),
          kind: 'summary',
          message: `Ping 统计信息 for ${url}`,
          success: true,
          stats: {
            url,
            sent: latencies.length,
            received: valid.length,
            lost: latencies.length - valid.length,
            lossPct: ((latencies.length - valid.length) / latencies.length) * 100,
            min: Math.min(...valid),
            max: Math.max(...valid),
            avg: Math.round(sum / valid.length),
          },
        });
      } else {
        onItem({
          id: nextPingId(),
          kind: 'summary',
          message: `Ping 统计信息 for ${url}`,
          success: false,
          stats: {
            url,
            sent: latencies.length,
            received: 0,
            lost: latencies.length,
            lossPct: 100,
          },
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      onItem({
        id: nextPingId(),
        kind: 'error',
        message: `测试 ${url} 过程中出现错误: ${message}`,
        success: false,
      });
    }

    if (i < urlsToTest.length - 1) {
      onItem({ id: nextPingId(), kind: 'separator', message: '' });
    }
  }
}

// ---------------------------------------------------------------------------
// 批量域名测试
// ---------------------------------------------------------------------------

export type DomainProbeResult = {
  domain: DomainInfo;
  success: boolean;
  latency: number;
  error?: string;
  categoryKey: string;
  categoryLabel: string;
};

export type DomainStatsSnapshot = {
  total: number;
  enabled: number;
};

export function ensureDomainConfigLoaded(): DomainStatsSnapshot {
  loadDomainConfig();
  const stats = getDomainStats();
  return { total: stats.total, enabled: stats.enabled };
}

export function refreshDomainStats(): DomainStatsSnapshot {
  const stats = getDomainStats();
  return { total: stats.total, enabled: stats.enabled };
}

export function listDomainCategories(): Array<{
  key: string;
  name: string;
  description: string;
  icon: string;
  domains: DomainInfo[];
}> {
  return Object.entries(EXTENSION_DOMAINS).map(([key, category]) => ({
    key,
    name: category.name,
    description: category.description,
    icon: category.icon,
    domains: category.domains,
  }));
}

export function setDomainEnabledInConfig(
  categoryKey: string,
  domainIndex: number,
  enabled: boolean,
): DomainStatsSnapshot {
  if (EXTENSION_DOMAINS[categoryKey]?.domains[domainIndex]) {
    EXTENSION_DOMAINS[categoryKey].domains[domainIndex].enabled = enabled;
  }
  saveDomainConfig();
  return refreshDomainStats();
}

export function selectAllDomains(enabled: boolean): DomainStatsSnapshot {
  Object.values(EXTENSION_DOMAINS).forEach((category) => {
    category.domains.forEach((domain) => {
      domain.enabled = enabled;
    });
  });
  saveDomainConfig();
  return refreshDomainStats();
}

export function resetDefaultDomains(): DomainStatsSnapshot {
  Object.values(EXTENSION_DOMAINS).forEach((category) => {
    category.domains.forEach((domain) => {
      domain.enabled = true;
    });
  });
  saveDomainConfig();
  return refreshDomainStats();
}

export async function testSingleDomain(
  domain: DomainInfo,
): Promise<{ success: boolean; latency: number; error?: string }> {
  const testUrl = `https://${domain.domain}`;
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    await fetch(testUrl, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return { success: true, latency: Date.now() - startTime };
  } catch (error) {
    const latency = Date.now() - startTime;
    let errorMessage = '未知错误';
    if (error instanceof Error) {
      errorMessage = error.name === 'AbortError' ? '请求超时' : error.message;
    }
    return { success: false, latency, error: errorMessage };
  }
}

function resolveCategoryForDomain(domain: DomainInfo): {
  key: string;
  label: string;
} {
  for (const [key, category] of Object.entries(EXTENSION_DOMAINS)) {
    if (category.domains.some((d) => d.domain === domain.domain)) {
      return { key, label: `${category.icon} ${category.name}` };
    }
  }
  return { key: 'unknown', label: '其他' };
}

/**
 * 批量测试域名（顺序），每完成一项回调
 */
export async function runBatchDomainTest(
  domains: DomainInfo[],
  onProgress?: (payload: {
    completed: number;
    total: number;
    result: DomainProbeResult;
  }) => void,
): Promise<{
  results: DomainProbeResult[];
  successCount: number;
  failureCount: number;
}> {
  const results: DomainProbeResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (const domain of domains) {
    const probe = await testSingleDomain(domain);
    const cat = resolveCategoryForDomain(domain);
    const result: DomainProbeResult = {
      domain,
      success: probe.success,
      latency: probe.latency,
      error: probe.error,
      categoryKey: cat.key,
      categoryLabel: cat.label,
    };
    results.push(result);
    if (probe.success) successCount += 1;
    else failureCount += 1;
    onProgress?.({
      completed: results.length,
      total: domains.length,
      result,
    });
  }

  saveLastTestTime();
  return { results, successCount, failureCount };
}

export function getEnabledDomainsForBatch(mode: 'all' | 'core'): DomainInfo[] {
  loadDomainConfig();
  if (mode === 'core') {
    return getDomainsByCategory('core');
  }
  return getAllEnabledDomains();
}

export { getAllEnabledDomains, getDomainsByCategory, EXTENSION_DOMAINS };
