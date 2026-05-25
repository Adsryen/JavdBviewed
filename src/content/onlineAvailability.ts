import { extractVideoIdFromPage } from './videoId';
import { defaultHttpClient } from '../services/dataAggregator/httpClient';
import { log } from './state';

export type OnlineAvailabilityFetchType = 'get' | 'parser';

export interface OnlineAvailabilitySite {
  key: string;
  name: string;
  url: string;
  fetchType: OnlineAvailabilityFetchType;
  enabled: boolean;
  codeFormatter?: (code: string) => string;
  domQuery?: {
    linkQuery?: string;
    titleQuery?: string;
    subQuery?: string;
    leakQuery?: string;
  };
}

export interface OnlineAvailabilityResult {
  siteKey: string;
  siteName: string;
  available: boolean;
  url: string;
  tags: string[];
  error?: string;
}

export interface OnlineAvailabilityConfig {
  enabled: boolean;
  autoCheck: boolean;
  timeoutMs: number;
  sites: OnlineAvailabilitySite[];
}

export interface OnlineAvailabilityInsertionTarget {
  parent: Element;
  before: ChildNode | null;
}

const SP_PREFIX = '300';

export const DEFAULT_ONLINE_AVAILABILITY_SITES: OnlineAvailabilitySite[] = [
  {
    key: 'fanza',
    name: 'FANZA 動画',
    url: 'https://www.dmm.co.jp/digital/videoa/-/detail/=/cid={{code}}/',
    fetchType: 'get',
    enabled: true,
    codeFormatter: formatFanzaCode,
  },
  {
    key: 'jable',
    name: 'Jable',
    url: 'https://jable.tv/videos/{{code}}/',
    fetchType: 'get',
    enabled: true,
    domQuery: {
      subQuery: '.info-header',
      leakQuery: '.info-header',
    },
  },
  {
    key: 'missav',
    name: 'MISSAV',
    url: 'https://missav.ws/{{code}}/',
    fetchType: 'get',
    enabled: true,
    domQuery: {
      subQuery: '.space-y-2 a.text-nord13[href*="chinese-subtitle"]',
      leakQuery: '.order-first div.rounded-md a[href]:last-child',
    },
  },
  {
    key: 'supjav',
    name: 'Supjav',
    url: 'https://supjav.com/zh/?s={{code}}',
    fetchType: 'parser',
    enabled: true,
    domQuery: {
      linkQuery: '.posts.clearfix>.post>a.img[title]',
      titleQuery: 'h3>a[rel="bookmark"][itemprop="url"]',
    },
  },
  {
    key: 'javbus',
    name: 'JavBus',
    url: 'https://javbus.com/{{code}}',
    fetchType: 'get',
    enabled: true,
    codeFormatter: code => code.startsWith('MIUM') ? `${SP_PREFIX}${code}` : code,
  },
];

const DEFAULT_CONFIG: OnlineAvailabilityConfig = {
  enabled: true,
  autoCheck: true,
  timeoutMs: 8000,
  sites: DEFAULT_ONLINE_AVAILABILITY_SITES,
};

export class OnlineAvailabilityManager {
  private config: OnlineAvailabilityConfig = DEFAULT_CONFIG;
  private initialized = false;
  private currentVideoId: string | null = null;

  updateConfig(config: Partial<OnlineAvailabilityConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      sites: config.sites || this.config.sites,
    };
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled || this.initialized) return;
    this.currentVideoId = extractVideoIdFromPage();
    if (!this.currentVideoId) return;

    this.injectPanel('checking');
    this.initialized = true;

    if (this.config.autoCheck) {
      await this.checkAvailability(this.currentVideoId);
    }
  }

  async checkAvailability(videoId: string): Promise<void> {
    const sites = this.config.sites.filter(site => site.enabled);
    if (sites.length === 0) {
      this.renderResults([], 0);
      return;
    }

    const results: OnlineAvailabilityResult[] = [];
    await Promise.all(sites.map(async site => {
      const result = await this.checkSite(site, videoId);
      results.push(result);
      this.renderResults([...results], sites.length);
    }));
  }

  destroy(): void {
    this.initialized = false;
    document.getElementById('jdb-online-availability-panel')?.remove();
  }

  private async checkSite(site: OnlineAvailabilitySite, videoId: string): Promise<OnlineAvailabilityResult> {
    const url = buildOnlineAvailabilityUrl(site, videoId);
    const result = await this.checkSiteUrl(site, videoId, url);
    if (result.available || site.key !== 'jable') {
      return result;
    }

    const fallbackUrl = buildJableChineseSubtitleUrl(url);
    if (!fallbackUrl || fallbackUrl === url) {
      return result;
    }

    const fallbackResult = await this.checkSiteUrl(site, videoId, fallbackUrl);
    return fallbackResult.available ? fallbackResult : result;
  }

  private async checkSiteUrl(site: OnlineAvailabilitySite, videoId: string, url: string): Promise<OnlineAvailabilityResult> {
    try {
      const doc = await withOnlineAvailabilityTimeout(defaultHttpClient.getDocument(url, {
        timeout: this.config.timeoutMs,
        retries: 0,
        headers: {
          Referer: 'https://javdb.com/',
        },
      }), this.config.timeoutMs, `${site.name} availability check`);
      return parseOnlineAvailabilityDocument(site, doc, videoId, url, 200);
    } catch (error) {
      return {
        siteKey: site.key,
        siteName: site.name,
        available: false,
        url,
        tags: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private injectPanel(status: 'checking' | 'ready'): void {
    if (document.getElementById('jdb-online-availability-panel')) return;

    const target = findOnlineAvailabilityInsertionTarget();
    if (!target) return;

    const panel = document.createElement('div');
    panel.id = 'jdb-online-availability-panel';
    panel.className = 'panel-block jdb-online-availability';
    panel.innerHTML = `
      <strong>在线可看:</strong>
      &nbsp;<span class="value jdb-online-availability-links">
        <span class="jdb-online-status">${status === 'checking' ? '检测中...' : ''}</span>
      </span>
    `;

    target.parent.insertBefore(panel, target.before);
  }

  private renderResults(results: OnlineAvailabilityResult[], totalCount = results.length): void {
    this.injectPanel('ready');
    const panel = document.getElementById('jdb-online-availability-panel');
    if (!panel) return;

    panel.innerHTML = '<strong>在线可看:</strong>&nbsp;';
    const value = document.createElement('span');
    value.className = 'value jdb-online-availability-links';
    panel.appendChild(value);

    const shown = results.filter(result => result.available);
    if (shown.length === 0) {
      const empty = document.createElement('span');
      empty.textContent = results.length < totalCount ? '检测中...' : '暂无命中';
      empty.className = 'is-size-7 has-text-grey';
      value.appendChild(empty);
      log(`Online availability checked: ${shown.length}/${results.length}/${totalCount} sites available`);
      return;
    }

    shown.forEach(result => {
      const link = document.createElement('a');
      link.href = result.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'tag is-success is-light is-small';
      link.textContent = result.tags.length ? `${result.siteName} ${result.tags.join(' ')}` : result.siteName;
      value.appendChild(link);
    });

    log(`Online availability checked: ${shown.length}/${results.length}/${totalCount} sites available`);
  }
}

export function findOnlineAvailabilityInsertionTarget(): OnlineAvailabilityInsertionTarget | null {
  const enhancePanel = document.getElementById('jdb-video-enhance-panel');
  if (enhancePanel?.parentElement) {
    return { parent: enhancePanel.parentElement, before: enhancePanel };
  }

  const moviePanel = document.querySelector('.movie-panel-info');
  const directReviewButtons = moviePanel
    ? Array.from(moviePanel.children).find(child => child.classList.contains('review-buttons'))
    : null;
  if (directReviewButtons?.parentElement) {
    return { parent: directReviewButtons.parentElement, before: directReviewButtons.nextSibling };
  }

  const reviewButtons = document.querySelector('.review-buttons');
  if (reviewButtons?.parentElement) {
    return { parent: reviewButtons.parentElement, before: reviewButtons.nextSibling };
  }

  const host = document.querySelector('.top-meta') || document.querySelector('.video-meta-panel') || moviePanel;
  if (!host) return null;
  return { parent: host, before: null };
}

export function buildOnlineAvailabilityUrl(site: OnlineAvailabilitySite, videoId: string): string {
  const formatted = site.codeFormatter ? site.codeFormatter(videoId) : videoId.toLowerCase();
  return site.url.replace('{{code}}', encodeURIComponent(formatted));
}

export function parseOnlineAvailabilityDocument(
  site: OnlineAvailabilitySite,
  doc: Document,
  videoId: string,
  requestUrl: string,
  status: number,
): OnlineAvailabilityResult {
  if (status >= 400) {
    return unavailable(site, requestUrl);
  }

  if (site.fetchType === 'get') {
    if (!isDirectDetailPageMatch(site, doc, videoId, requestUrl)) {
      return unavailable(site, requestUrl);
    }

    return {
      siteKey: site.key,
      siteName: site.name,
      available: true,
      url: requestUrl,
      tags: extractTags(doc, site.domQuery),
    };
  }

  const match = findParserMatch(site, doc, videoId, requestUrl);
  if (!match) return unavailable(site, requestUrl);

  return {
    siteKey: site.key,
    siteName: site.name,
    available: true,
    url: match.url,
    tags: extractTags(doc, site.domQuery, match.text),
  };
}

function unavailable(site: OnlineAvailabilitySite, url: string): OnlineAvailabilityResult {
  return {
    siteKey: site.key,
    siteName: site.name,
    available: false,
    url,
    tags: [],
  };
}

function findParserMatch(site: OnlineAvailabilitySite, doc: Document, videoId: string, requestUrl: string): { url: string; text: string } | null {
  const linkQuery = site.domQuery?.linkQuery;
  if (!linkQuery) return null;

  const normalizedCode = normalizeCode(videoId);
  const links = Array.from(doc.querySelectorAll<HTMLAnchorElement>(linkQuery));
  for (const link of links) {
    const text = `${link.textContent || ''} ${link.getAttribute('title') || ''} ${link.getAttribute('href') || ''}`;
    if (!normalizeCode(text).includes(normalizedCode)) continue;
    const href = link.getAttribute('href') || requestUrl;
    return {
      url: new URL(href, requestUrl).toString(),
      text,
    };
  }

  const titleQuery = site.domQuery?.titleQuery;
  if (titleQuery) {
    const title = Array.from(doc.querySelectorAll<HTMLElement>(titleQuery))
      .find(item => normalizeCode(item.textContent || item.getAttribute('title') || '').includes(normalizedCode));
    if (title) {
      return { url: requestUrl, text: title.textContent || title.getAttribute('title') || '' };
    }
  }

  return null;
}

function extractTags(doc: Document, query?: OnlineAvailabilitySite['domQuery'], extraText = ''): string[] {
  const text = [
    extraText,
    query?.subQuery ? Array.from(doc.querySelectorAll(query.subQuery)).map(item => item.textContent || '').join(' ') : '',
    query?.leakQuery ? Array.from(doc.querySelectorAll(query.leakQuery)).map(item => item.textContent || '').join(' ') : '',
  ].join(' ');
  const tags: string[] = [];
  if (/中文|字幕|subtitle|chinese/i.test(text)) tags.push('字幕');
  if (/无码|無碼|泄漏|泄露|uncensored|leak/i.test(text)) tags.push('无码');
  return tags;
}

function normalizeCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function isDirectDetailPageMatch(site: OnlineAvailabilitySite, doc: Document, videoId: string, requestUrl: string): boolean {
  const normalizedVideoId = normalizeCode(videoId);
  const titleText = doc.title || '';
  const bodyText = doc.body?.textContent || '';
  const searchableText = `${titleText} ${bodyText}`;
  const normalizedText = normalizeCode(searchableText);

  if (site.key === 'fanza') {
    const expectedCid = normalizeCode(site.codeFormatter ? site.codeFormatter(videoId) : formatFanzaCode(videoId));
    if (/年齢認証|age[_ -]?check/i.test(titleText) || /\/age_check\//i.test(requestUrl)) return false;
    if (Array.from(doc.querySelectorAll('script[src]')).some(script => /not-found/i.test(script.getAttribute('src') || ''))) return false;
    return normalizedText.includes(expectedCid) || normalizedText.includes(normalizedVideoId);
  }

  if (site.key === 'jable') {
    if (!doc.querySelector('.info-header')) return false;
    return normalizedText.includes(normalizedVideoId);
  }

  if (site.key === 'missav' || site.key === 'javbus') {
    return normalizedText.includes(normalizedVideoId);
  }

  return true;
}

function buildJableChineseSubtitleUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!/^(?:www\.)?jable\.tv$/i.test(parsed.hostname)) return null;
    const pathname = parsed.pathname.endsWith('/') ? parsed.pathname.slice(0, -1) : parsed.pathname;
    if (pathname.endsWith('-c')) return url;
    parsed.pathname = `${pathname}-c/`;
    return parsed.toString();
  } catch {
    return null;
  }
}

function formatFanzaCode(preCode: string): string {
  const [pre, num = ''] = preCode.split('-');
  const padNum = num.padStart(5, '0');
  if (pre.toLowerCase().startsWith('start')) {
    return `1${pre.toLowerCase()}${padNum}`;
  }
  return `${pre}${padNum}`;
}

function withOnlineAvailabilityTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  const ms = Number.isFinite(timeoutMs) && timeoutMs > 0 ? Math.floor(timeoutMs) : 8000;
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`${label} timeout after ${ms}ms`));
    }, ms);

    promise.then(
      value => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export const onlineAvailabilityManager = new OnlineAvailabilityManager();
