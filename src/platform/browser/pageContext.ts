/**
 * @file pageContext.ts
 * @description 页面上下文工具 —— 从 URL 解析页面类型、主标识、生成页面实例 ID
 * @module platform/browser
 *
 * 页面类型：video（详情页）、actor（演员页）、list（列表页）、home（首页）、unknown
 */

/** 页面实例 ID 的全局变量 key */
const PAGE_INSTANCE_ID_KEY = '__JAVDB_EXT_PAGE_INSTANCE_ID__';

function parsePageUrl(rawUrl?: string): URL | null {
  try {
    return new URL(rawUrl || window.location.href);
  } catch {
    return null;
  }
}

export function getPageTypeFromUrl(rawUrl?: string): string {
  const url = parsePageUrl(rawUrl);
  const path = url?.pathname || '';
  if (path.startsWith('/v/')) return 'video';
  if (path.startsWith('/actors/')) return 'actor';
  if (path.startsWith('/search')) return 'search';
  return 'generic';
}

export function getPageMainId(rawUrl?: string): string {
  const url = parsePageUrl(rawUrl);
  if (!url) return '';
  const path = url.pathname || '';
  if (path.startsWith('/v/')) {
    return path.split('/v/')[1]?.split('/')[0]?.split('?')[0]?.split('#')[0] || '';
  }
  if (path.startsWith('/actors/')) {
    return path.split('/actors/')[1]?.split('/')[0]?.split('?')[0]?.split('#')[0] || '';
  }
  if (path.startsWith('/search')) {
    const query = url.searchParams.get('q') || url.searchParams.get('f') || '';
    return query || path;
  }
  return path || '/';
}

export function getPageInstanceId(): string {
  const globalScope = window as typeof window & { [PAGE_INSTANCE_ID_KEY]?: string };
  if (globalScope[PAGE_INSTANCE_ID_KEY]) {
    return globalScope[PAGE_INSTANCE_ID_KEY] as string;
  }
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const instanceId = `page:${ts}:${rand}`;
  globalScope[PAGE_INSTANCE_ID_KEY] = instanceId;
  return instanceId;
}

export function getPageContext(rawUrl?: string): {
  pageUrl: string;
  pageType: string;
  mainId: string;
  pageInstanceId: string;
} {
  const pageUrl = rawUrl || window.location.href;
  return {
    pageUrl,
    pageType: getPageTypeFromUrl(pageUrl),
    mainId: getPageMainId(pageUrl),
    pageInstanceId: getPageInstanceId(),
  };
}
