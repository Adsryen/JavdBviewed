// src/features/magnets/ui/magnetSearchManager.ts
// 磁力搜索功能

import { log } from '../../contentState';
import { showToast } from '../../../platform/browser/toast';
import { extractVideoIdFromPage } from '../../../platform/browser';
import { defaultHttpClient } from '../../../platform/network/httpClient';
import { handlePushToDrive115 } from '../../drive115/content';
import { performanceOptimizer } from '../../../platform/tasks';
import { dbMagnetsQuery, dbMagnetsUpsert } from '../../../platform/storage/dbRuntimeClient';
import {
  appendMagnetResults,
  getResultSources,
} from '../application/resultMerge';
import {
  buildMagnetPaginationState,
} from '../application/pagination';
import {
  buildMagnetSourceTagView,
  countUniqueResultsBySource,
  getMagnetSourceLabel,
} from '../application/sourceTagState';
import {
  deduplicateMagnetResults,
  detectMagnetQuality,
  detectMagnetSubtitle,
  extractHashFromMagnet,
  isCrackedVersion,
  isValidMagnetResultName,
  normalizeMagnetDate,
  parseSizeToBytes,
  sortMagnetResults,
} from '../application/resultMetadata';
import {
  buildJavbusAjaxUrl,
  extractJavbusAjaxParams,
  getJavbusResponseDiagnostics,
  parseJavbusFallbackMagnets,
  parseJavbusMagnetRows,
} from '../adapters/javbus/source';
import type {
  MagnetSourceKey,
  MagnetSourceSearchState,
  MagnetResult,
  MagnetSearchConfig,
  MagnetSourceRunState,
  MagnetExternalSearchResult,
} from '../domain/types';
import { fetchJavbusAjaxViaRuntime } from '../../../platform/browser/javbusRuntimeClient';

// 磁链缓存 TTL（默认 7 天）
const MAGNET_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type {
  MagnetExternalSearchResult,
  MagnetResult,
  MagnetSearchConfig,
  MagnetSourceRunState,
};

export class MagnetSearchManager {
  private config: MagnetSearchConfig;
  private isInitialized = false;
  private currentVideoId: string | null = null;
  private baseMagnetWidth = 0;
  private currentMagnetResults: MagnetResult[] = [];
  private currentMagnetDisplayResults: MagnetResult[] = [];
  private currentMagnetPage = 1;
  private currentMagnetSourceFilter = 'all';
  private nativeMagnetPage = 1;
  private searchRunId = 0;
  private sourceTagStates: Partial<Record<MagnetSourceKey, MagnetSourceSearchState>> = {};
  private sourceTagLatestResultCounts: Partial<Record<MagnetSourceKey, number>> = {};

  constructor(config: Partial<MagnetSearchConfig> = {}) {
    this.config = {
      enabled: true,
      showInlineResults: true,
      showFloatingButton: true,
      autoSearch: false,
      blockMojContent: true,
      sources: {
        sukebei: true,
        btdig: true,
        btsow: true,
        torrentz2: false,
        javbus: false,
        custom: [],
      },
      maxResults: 20,
      timeout: 15000, // 增加超时时间
      ...config,
    };
  }

  private clampMagnetContainerWidth(): void {
    try {
      const el = document.querySelector('#magnets-content') as HTMLElement | null;
      if (!el) return;
      if (!this.baseMagnetWidth || this.baseMagnetWidth < 600 || this.baseMagnetWidth > 2000) {
        this.baseMagnetWidth = el.clientWidth || 1344;
      }
      el.style.maxWidth = `${Math.round(this.baseMagnetWidth)}px`;
      el.style.width = '100%';
      el.style.marginLeft = 'auto';
      el.style.marginRight = 'auto';
      el.style.boxSizing = 'border-box';
    } catch {}
  }

  private debugOverflow(): void {
    try {
      const container = document.querySelector('#magnets-content') as HTMLElement | null;
      if (!container) return;
      const cw = container.clientWidth;
      const sw = container.scrollWidth;
      if (sw <= cw) return;
      let culprit: HTMLElement | null = null;
      let max = 0;
      container.querySelectorAll<HTMLElement>('*').forEach(el => {
        const w = el.scrollWidth;
        if (w > cw && w > max) {
          max = w;
          culprit = el;
        }
      });
      if (culprit) {
        try { (culprit as HTMLElement).style.outline = '2px solid #e74c3c'; } catch {}
        console.log('[Magnet Overflow] container', { clientWidth: cw, scrollWidth: sw, culprit, culpritWidth: max, style: getComputedStyle(culprit) });
      } else {
        console.log('[Magnet Overflow] container', { clientWidth: cw, scrollWidth: sw, note: 'no explicit culprit found' });
      }
    } catch {}
  }

  /**
   * 初始化磁力搜索功能
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled || this.isInitialized) {
      return;
    }

    try {
      log('Initializing magnet search functionality...');

      this.currentVideoId = extractVideoIdFromPage();

      if (!this.currentVideoId) {
        log('No video ID found, skipping magnet search initialization');
        return;
      }

      // 检查是否存在磁力列表区域
      const magnetContent = document.querySelector('#magnets-content');
      if (!magnetContent) {
        log('No magnet content area found, skipping magnet search initialization');
        return;
      }

      // 记录并钳制磁力容器的基线宽度，避免触发搜索后整体变宽
      try {
        const cw = (magnetContent as HTMLElement).clientWidth;
        if (cw && cw >= 600 && cw <= 2000) {
          this.baseMagnetWidth = cw;
        }
        this.clampMagnetContainerWidth();
      } catch {}

      // 注入统一样式，确保磁力列表布局不会溢出
      this.addUnifiedMagnetStyles();

      // 添加搜索源标签
      this.addSearchSourceTags();

      // 屏蔽磁力区域广告
      if (this.config.blockMojContent) {
        document.querySelectorAll<HTMLElement>('.moj-content').forEach(el => {
          el.classList.add('jdb-hidden-moj-content');
          el.style.display = 'none';
        });
      }

      this.applyNativeMagnetPresentation();

      // 检查影片是否已看
      const isViewed = await this.checkIfVideoViewed();

      if (!this.config.autoSearch) {
        // 自动加载关闭：始终显示手动按钮
        this.showManualSearchButton(false);
      } else if (isViewed) {
        // 自动加载开启但已看：显示手动按钮
        log('Video is viewed, showing manual search button instead of auto-search');
        this.showManualSearchButton(true);
      } else {
        // 自动加载开启且未看：自动搜索
        setTimeout(() => {
          this.searchMagnets(this.currentVideoId!);
        }, 2000);
      }

      this.isInitialized = true;
      log('Magnet search functionality initialized');
    } catch (error) {
      log('Error initializing magnet search:', error);
    }
  }

  /**
   * 搜索磁力链接
   */
  async searchMagnets(videoId: string): Promise<void> {
    try {
      const runId = ++this.searchRunId;
      log(`Searching magnets for: ${videoId}`);

      // 收集所有磁力数据（包括JavDB原生 + 搜索结果）
      const allMagnetResults: MagnetResult[] = [];
      let discoveredCount = 0;

      const appendAndCountResults = (results: MagnetResult[]): number => {
        discoveredCount += results.length;
        return appendMagnetResults(allMagnetResults, results);
      };

      // 优先尝试从缓存加载并快速展示
      try {
        const cached = await this.loadCachedMagnets(videoId);
        if (cached.length > 0) {
          log(`Loaded ${cached.length} magnets from cache for ${videoId}`);
          appendAndCountResults(cached);
          this.processAndDisplayAllMagnets(allMagnetResults, { notify: false, discoveredCount });
        }
      } catch (e) {
        log('Load cached magnets failed:', e);
      }

      // 1. 首先收集JavDB原生磁力数据
      const javdbMagnets = this.collectJavdbMagnets();
      appendAndCountResults(javdbMagnets);
      log(`Collected ${javdbMagnets.length} JavDB native magnets`);

      // 提前渲染：JavDB 原生磁力加入缓存结果后立即参与排序显示
      if (javdbMagnets.length > 0) {
        this.processAndDisplayAllMagnets(allMagnetResults, { notify: false, discoveredCount });
      }

      // 2. 搜索外部源
      const searchSources: Array<{ name: string; key: MagnetSourceKey; fn: () => Promise<MagnetResult[]> }> = [];

      if (this.config.sources.sukebei) {
        searchSources.push({ name: 'Sukebei', key: 'sukebei', fn: () => this.searchSukebei(videoId) });
      }

      if (this.config.sources.btdig) {
        searchSources.push({ name: 'BTdig', key: 'btdig', fn: () => this.searchBtdig(videoId) });
      }

      if (this.config.sources.btsow) {
        searchSources.push({ name: 'BTSOW', key: 'btsow', fn: () => this.searchBtsow(videoId) });
      }

      if (this.config.sources.torrentz2) {
        searchSources.push({ name: 'Torrentz2', key: 'torrentz2', fn: () => this.searchTorrentz2(videoId) });
      }

      if (this.config.sources.javbus) {
        searchSources.push({ name: 'JAVBUS', key: 'javbus', fn: () => this.searchJavbus(videoId) });
      }

      log(`Starting search on ${searchSources.length} sources: ${searchSources.map(s => s.name).join(', ')}`);

      // 4. 如果没有外部搜索源，直接显示JavDB结果
      if (searchSources.length === 0) {
        log('No external sources configured, displaying JavDB results only');
        this.processAndDisplayAllMagnets(allMagnetResults);
        return;
      }

      // 5. 使用性能优化器限制并发搜索，避免同时发起过多网络请求
      const searchPromises = searchSources.map(source => {
        // 设置搜索中状态
        this.setSourceTagState(source.key, 'searching', allMagnetResults);

        // 使用性能优化器调度网络请求，自动限制并发数量
        return performanceOptimizer.scheduleRequest(async () => {
          return source.fn();
        }, 9000) // 适度延长，给外部源更多完成机会
        .then(sourceResults => {
          if (runId !== this.searchRunId) return sourceResults;
          log(`${source.name} search completed: ${sourceResults.length} results`);
          if (sourceResults.length > 0) {
            appendAndCountResults(sourceResults);
            log(`Merged ${source.name} results, total collected: ${allMagnetResults.length}`);
            this.processAndDisplayAllMagnets(allMagnetResults, { notify: false, discoveredCount });
            this.upsertMagnetsToCache(videoId, sourceResults).catch(err => log(`${source.name} cache upsert failed:`, err));
          }
          this.setSourceTagState(source.key, 'success', allMagnetResults, sourceResults.length);
          return sourceResults;
        }).catch(error => {
          if (runId !== this.searchRunId) return [];
          log(`${source.name} search failed:`, error);
          this.setSourceTagState(source.key, 'failed', allMagnetResults);
          return []; // 返回空数组而不是抛出错误
        });
      });

      // 6. 等待所有搜索完成（包括超时的）
      Promise.all(searchPromises).then(() => {
        if (runId !== this.searchRunId) return;
        log(`All searches completed, total results: ${allMagnetResults.length}`);

        // 最终刷新一次总列表，并给出完成提示
        this.processAndDisplayAllMagnets(allMagnetResults, { discoveredCount });

        // 异步写入缓存（带 TTL）
        this.upsertMagnetsToCache(videoId, allMagnetResults).catch(err => log('Upsert magnets cache failed:', err));
      }).catch(error => {
        if (runId !== this.searchRunId) return;
        // 这个catch理论上不会被触发，因为我们已经在每个promise中处理了错误
        log('Unexpected error in Promise.all:', error);
        this.processAndDisplayAllMagnets(allMagnetResults, { discoveredCount });
        this.upsertMagnetsToCache(videoId, allMagnetResults).catch(err => log('Upsert magnets cache failed:', err));
      });
    } catch (error) {
      log('Error searching magnets:', error);
      showToast('搜索磁力链接时发生错误', 'error');
    }
  }

  /**
   * 搜索外部磁力源，只返回结果，不读取或写入详情页 DOM。
   */
  async searchExternalSources(videoId: string): Promise<MagnetExternalSearchResult> {
    const allResults: MagnetResult[] = [];
    const sourceStates: Partial<Record<MagnetSourceKey, MagnetSourceRunState>> = {};
    const searchSources = this.buildExternalSearchSources(videoId);

    this.currentVideoId = videoId;

    if (searchSources.length === 0) {
      return {
        discoveredCount: 0,
        duplicateCount: 0,
        uniqueResults: [],
        sourceStates,
      };
    }

    const searchPromises = searchSources.map(async (source) => {
      sourceStates[source.key] = { status: 'searching' };
      try {
        const sourceResults = await performanceOptimizer.scheduleRequest(() => source.fn(), 9000);
        appendMagnetResults(allResults, sourceResults);
        sourceStates[source.key] = { status: 'success', resultCount: sourceResults.length };
        return sourceResults;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log(`${source.name} external search failed:`, error);
        sourceStates[source.key] = { status: 'failed', resultCount: 0, error: message };
        return [];
      }
    });

    const sourceResults = await Promise.all(searchPromises);
    const discoveredCount = sourceResults.reduce((total, results) => total + results.length, 0);
      const uniqueResults = sortMagnetResults(deduplicateMagnetResults(allResults));

    return {
      discoveredCount,
      duplicateCount: Math.max(0, discoveredCount - uniqueResults.length),
      uniqueResults,
      sourceStates,
    };
  }

  private buildExternalSearchSources(videoId: string): Array<{ name: string; key: MagnetSourceKey; fn: () => Promise<MagnetResult[]> }> {
    const searchSources: Array<{ name: string; key: MagnetSourceKey; fn: () => Promise<MagnetResult[]> }> = [];

    if (this.config.sources.sukebei) {
      searchSources.push({ name: 'Sukebei', key: 'sukebei', fn: () => this.searchSukebei(videoId) });
    }

    if (this.config.sources.btdig) {
      searchSources.push({ name: 'BTdig', key: 'btdig', fn: () => this.searchBtdig(videoId) });
    }

    if (this.config.sources.btsow) {
      searchSources.push({ name: 'BTSOW', key: 'btsow', fn: () => this.searchBtsow(videoId) });
    }

    if (this.config.sources.torrentz2) {
      searchSources.push({ name: 'Torrentz2', key: 'torrentz2', fn: () => this.searchTorrentz2(videoId) });
    }

    if (this.config.sources.javbus) {
      searchSources.push({ name: 'JAVBUS', key: 'javbus', fn: () => this.searchJavbus(videoId) });
    }

    return searchSources;
  }

  /**
   * 搜索Sukebei
   */
  private async searchSukebei(videoId: string): Promise<MagnetResult[]> {
    try {
      log(`Starting Sukebei search for: ${videoId}`);
      const searchUrl = `https://sukebei.nyaa.si/?f=0&c=0_0&q=${encodeURIComponent(videoId)}`;
      log(`Sukebei search URL: ${searchUrl}`);

      const response = await defaultHttpClient.getDocument(searchUrl, {
        timeout: this.config.timeout,
      });

      const results = this.parseSukebeiResults(response);
      log(`Sukebei search returned ${results.length} results`);
      return results;
    } catch (error) {
      log('Sukebei search failed:', error);
      throw error;
    }
  }

  /**
   * 搜索BTdig
   */
  private async searchBtdig(videoId: string): Promise<MagnetResult[]> {
    try {
      const searchUrl = `https://btdig.com/search?order=0&q=${encodeURIComponent(videoId)}`;
      const response = await defaultHttpClient.getDocument(searchUrl, {
        timeout: this.config.timeout,
        retries: 2,
      });

      return this.parseBtdigResults(response);
    } catch (error) {
      log('BTdig search failed:', error);
      throw error;
    }
  }

  /**
   * 搜索BTSOW
   */
  private async searchBtsow(videoId: string): Promise<MagnetResult[]> {
    try {
      const searchUrl = `https://btsow.com/search/${encodeURIComponent(videoId)}`;
      const response = await defaultHttpClient.getDocument(searchUrl, {
        timeout: this.config.timeout,
        retries: 2,
      });

      return this.parseBtsowResults(response);
    } catch (error) {
      log('BTSOW search failed:', error);
      throw error;
    }
  }

  /**
   * 搜索Torrentz2
   */
  private async searchTorrentz2(videoId: string): Promise<MagnetResult[]> {
    try {
      const searchUrl = `https://torrentz2.eu/search?f=${encodeURIComponent(videoId)}`;
      const response = await defaultHttpClient.getDocument(searchUrl, {
        timeout: this.config.timeout,
      });

      return this.parseTorrentz2Results(response);
    } catch (error) {
      log('Torrentz2 search failed:', error);
      throw error;
    }
  }

  /**
   * 搜索JAVBUS
   */
  private async searchJavbus(videoId: string): Promise<MagnetResult[]> {
    try {
      const pageUrl = `https://www.javbus.com/${encodeURIComponent(videoId)}`;
      const javbusHeaders = {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        Referer: 'https://www.javbus.com/',
        Cookie: 'agegate=1; over18=1; existmag=all',
      };
      const pageHtml = await defaultHttpClient.get<string>(pageUrl, {
        timeout: this.config.timeout,
        retries: 1,
        responseType: 'text',
        headers: javbusHeaders,
      });
      log(`[JAVBUS] Detail page loaded for ${videoId}: ${pageHtml.length} chars`);

      const ajaxParams = extractJavbusAjaxParams(pageHtml);
      if (!ajaxParams) {
        const fallbackResults = parseJavbusFallbackMagnets(pageHtml, videoId);
        log(`[JAVBUS] Ajax params not found for ${videoId}, fallback parsed ${fallbackResults.length} results`);
        return fallbackResults;
      }
      log(`[JAVBUS] Ajax params found for ${videoId}:`, { gid: ajaxParams.gid, uc: ajaxParams.uc, hasImg: !!ajaxParams.img });

      const ajaxUrl = buildJavbusAjaxUrl(ajaxParams);
      const ajaxHtml = await defaultHttpClient.get<string>(ajaxUrl, {
        timeout: this.config.timeout,
        retries: 1,
        responseType: 'text',
        referrer: pageUrl,
        headers: {
          ...javbusHeaders,
          Referer: pageUrl,
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      log(`[JAVBUS] Ajax response loaded for ${videoId}: ${ajaxHtml.length} chars`);

      const results = parseJavbusMagnetRows(ajaxHtml, videoId);
      if (results.length > 0) {
        log(`[JAVBUS] Ajax parsed ${results.length} results for ${videoId}`);
        return results;
      }
      log(`[JAVBUS] Ajax parsed 0 diagnostics for ${videoId}:`, getJavbusResponseDiagnostics(ajaxHtml));

      try {
        log(`[JAVBUS] Ajax empty for ${videoId}, retrying in JAVBUS tab context`);
        const tabAjaxHtml = await fetchJavbusAjaxViaRuntime(pageUrl, this.config.timeout);
        log(`[JAVBUS] Tab ajax response loaded for ${videoId}: ${tabAjaxHtml.length} chars`);
        const tabResults = parseJavbusMagnetRows(tabAjaxHtml, videoId);
        if (tabResults.length > 0) {
          log(`[JAVBUS] Tab ajax parsed ${tabResults.length} results for ${videoId}`);
          return tabResults;
        }
        log(`[JAVBUS] Tab ajax parsed 0 diagnostics for ${videoId}:`, getJavbusResponseDiagnostics(tabAjaxHtml));
      } catch (tabError) {
        log(`[JAVBUS] Tab ajax retry failed for ${videoId}:`, tabError);
      }

      const fallbackResults = parseJavbusFallbackMagnets(pageHtml, videoId);
      log(`[JAVBUS] Ajax parsed 0 results for ${videoId}, fallback parsed ${fallbackResults.length} results`);
      return fallbackResults;
    } catch (error) {
      log('JAVBUS search failed:', error);
      throw error;
    }
  }

  /**
   * 解析Sukebei结果
   */
  private parseSukebeiResults(doc: Document): MagnetResult[] {
    const results: MagnetResult[] = [];

    try {
      log('Parsing Sukebei results...');
      const rows = doc.querySelectorAll('tbody tr');
      log(`Found ${rows.length} rows in Sukebei response`);

      rows.forEach((row, index) => {
        const nameElement = row.querySelector('td:nth-child(2) a[title]');
        const magnetElement = row.querySelector('a[href^="magnet:"]');
        const sizeElement = row.querySelector('td:nth-child(4)');
        const dateElement = row.querySelector('td:nth-child(5)');
        const seedersElement = row.querySelector('td:nth-child(6)');
        const leechersElement = row.querySelector('td:nth-child(7)');

        if (nameElement && magnetElement) {
          const name = (nameElement.getAttribute('title') || nameElement.textContent?.trim() || '').replace(/[\u200B-\u200D\uFEFF]/g, '');
          const magnet = (magnetElement as HTMLAnchorElement).href.split('&')[0]; // 清理磁力链接
          const size = sizeElement?.textContent?.trim() || '';
          const date = dateElement?.textContent?.trim().split(' ')[0] || '';
          const seeders = parseInt(seedersElement?.textContent?.trim() || '0', 10);
          const leechers = parseInt(leechersElement?.textContent?.trim() || '0', 10);

          log(`Sukebei row ${index + 1}: ${name.substring(0, 50)}... (${size})`);

          // 使用改进的匹配逻辑
          const isValid = this.isValidResult(name, this.currentVideoId || '');
          log(`Sukebei row ${index + 1} valid: ${isValid}`);

          if (isValid) {
            results.push({
              name,
              magnet,
              size,
              sizeBytes: parseSizeToBytes(size),
              date: normalizeMagnetDate(date, 'Sukebei'),
              seeders,
              leechers,
              source: 'Sukebei',
              hasSubtitle: detectMagnetSubtitle(name),
              quality: detectMagnetQuality(name),
            });
          }
        } else {
          log(`Sukebei row ${index + 1}: Missing name or magnet element`);
        }
      });
    } catch (error) {
      log('Error parsing Sukebei results:', error);
    }

    return results;
  }

  /**
   * 解析BTdig结果
   */
  private parseBtdigResults(doc: Document): MagnetResult[] {
    const results: MagnetResult[] = [];

    try {
      const items = doc.querySelectorAll('.one_result');

      items.forEach(item => {
        const nameElement = item.querySelector('.torrent_name a');
        const magnetElement = item.querySelector('.torrent_magnet a');
        const sizeElement = item.querySelector('.torrent_size');
        const dateElement = item.querySelector('.torrent_age');

        if (nameElement && magnetElement) {
          const name = (nameElement.textContent?.trim() || '').replace(/[\u200B-\u200D\uFEFF]/g, '');
          const magnet = (magnetElement as HTMLAnchorElement).href;
          const size = sizeElement?.textContent?.trim() || '';
          const date = dateElement?.textContent?.trim() || '';

          // 使用改进的匹配逻辑
          if (this.isValidResult(name, this.currentVideoId || '')) {
            results.push({
              name,
              magnet,
              size,
              sizeBytes: parseSizeToBytes(size),
              date: normalizeMagnetDate(date, 'BTdig'),
              source: 'BTdig',
              hasSubtitle: detectMagnetSubtitle(name),
              quality: detectMagnetQuality(name),
            });
          }
        }
      });
    } catch (error) {
      log('Error parsing BTdig results:', error);
    }

    return results;
  }

  /**
   * 解析BTSOW结果
   */
  private parseBtsowResults(doc: Document): MagnetResult[] {
    const results: MagnetResult[] = [];

    try {
      const items = doc.querySelectorAll('.data-list .row:not(.hidden-xs)');

      items.forEach(item => {
        const nameElement = item.querySelector('.file');
        const linkElement = item.querySelector('a');
        const sizeElement = item.querySelector('.size');
        const dateElement = item.querySelector('.date');

        if (nameElement && linkElement) {
          const name = (nameElement.textContent?.trim() || '').replace(/[\u200B-\u200D\uFEFF]/g, '');
          const href = linkElement.getAttribute('href') || '';
          const size = sizeElement?.textContent?.trim() || '';
          const date = dateElement?.textContent?.trim() || '';

          // 从href提取hash构造磁力链接
          const hash = href.split('/').pop();
          const magnet = hash ? `magnet:?xt=urn:btih:${hash}` : '';

          // 使用改进的匹配逻辑
          if (magnet && this.isValidResult(name, this.currentVideoId || '')) {
            results.push({
              name,
              magnet,
              size,
              sizeBytes: parseSizeToBytes(size),
              date: normalizeMagnetDate(date, 'BTSOW'),
              source: 'BTSOW',
              hasSubtitle: detectMagnetSubtitle(name),
              quality: detectMagnetQuality(name),
            });
          }
        }
      });
    } catch (error) {
      log('Error parsing BTSOW results:', error);
    }

    return results;
  }

  /**
   * 解析Torrentz2结果
   */
  private parseTorrentz2Results(doc: Document): MagnetResult[] {
    const results: MagnetResult[] = [];

    try {
      const rows = doc.querySelectorAll('.results dl');

      rows.forEach(row => {
        const nameElement = row.querySelector('dt a');
        const infoElement = row.querySelector('dd');

        if (nameElement && infoElement) {
          const name = (nameElement.textContent?.trim() || '').replace(/[\u200B-\u200D\uFEFF]/g, '');
          const href = (nameElement as HTMLAnchorElement).href;
          const infoText = infoElement.textContent?.trim() || '';

          // 从info中提取大小和日期
          const sizeMatch = infoText.match(/Size: ([^,]+)/);
          const dateMatch = infoText.match(/Age: ([^,]+)/);

          const size = sizeMatch ? sizeMatch[1] : '';
          const date = dateMatch ? dateMatch[1] : '';

          // 构造磁力链接
          const hash = href.split('/').pop();
          const magnet = hash ? `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(name)}` : '';

          // 使用改进的匹配逻辑
          if (magnet && this.isValidResult(name, this.currentVideoId || '')) {
            results.push({
              name,
              magnet,
              size,
              sizeBytes: parseSizeToBytes(size),
              date,
              source: 'Torrentz2',
              hasSubtitle: detectMagnetSubtitle(name),
              quality: detectMagnetQuality(name),
            });
          }
        }
      });
    } catch (error) {
      log('Error parsing Torrentz2 results:', error);
    }

    return results;
  }

  /**
   * 收集JavDB原生磁力数据
   */
  private collectJavdbMagnets(): MagnetResult[] {
    const results: MagnetResult[] = [];

    try {
      const magnetContent = document.querySelector('#magnets-content');
      if (!magnetContent) {
        log('No magnet content area found');
        return results;
      }

      const magnetItems = magnetContent.querySelectorAll('.item.columns');
      log(`Found ${magnetItems.length} JavDB native magnet items`);

      magnetItems.forEach((item, index) => {
        try {
          const nameElement = item.querySelector('.magnet-name .name');
          const magnetLink = item.querySelector('a[href^="magnet:"]');
          const metaElement = item.querySelector('.meta');
          const dateElement = item.querySelector('.date .time');
          const tagsElements = item.querySelectorAll('.tags .tag');

          if (nameElement && magnetLink) {
            const name = nameElement.textContent?.trim() || '';
            const magnet = (magnetLink as HTMLAnchorElement).href;
            const meta = metaElement?.textContent?.trim() || '';
            const date = dateElement?.textContent?.trim() || '';

            // 解析文件大小
            const sizeMatch = meta.match(/([0-9.]+)\s*(GB|MB|KB|TB)/i);
            const size = sizeMatch ? `${sizeMatch[1]} ${sizeMatch[2]}` : '';

            // 检查标签
            let hasSubtitle = false;
            let quality = '';

            tagsElements.forEach(tag => {
              const tagText = tag.textContent?.trim() || '';
              if (tagText.includes('字幕') || tagText.includes('subtitle')) {
                hasSubtitle = true;
              }
              if (tagText.includes('高清') || tagText.includes('HD')) {
                quality = 'HD';
              }
              if (tagText.includes('1080P') || tagText.includes('1080p')) {
                quality = '1080P';
              }
              if (tagText.includes('720P') || tagText.includes('720p')) {
                quality = '720P';
              }
              if (tagText.includes('4K')) {
                quality = '4K';
              }
            });

            results.push({
              name,
              magnet,
              size,
              sizeBytes: parseSizeToBytes(size),
              date: normalizeMagnetDate(date, 'JavDB'),
              seeders: 0, // JavDB不提供种子数
              leechers: 0,
              source: 'JavDB',
              hasSubtitle,
              quality,
            });

            log(`Collected JavDB magnet ${index + 1}: ${name.substring(0, 50)}...`);
          }
        } catch (error) {
          log(`Error collecting JavDB magnet ${index + 1}:`, error);
        }
      });

      log(`Successfully collected ${results.length} JavDB native magnets`);
    } catch (error) {
      log('Error collecting JavDB magnets:', error);
    }

    return results;
  }

  /**
   * 统一处理和显示所有磁力数据
   */
  private processAndDisplayAllMagnets(allResults: MagnetResult[], options: { notify?: boolean; discoveredCount?: number } = {}): void {
    try {
      const notify = options.notify !== false;
      const discoveredCount = Math.max(options.discoveredCount ?? allResults.length, allResults.length);
      log(`Processing ${discoveredCount} discovered magnet results`);

      // 显示来源统计
      const sourceStats: Record<string, number> = {};
      allResults.forEach(result => {
        getResultSources(result).forEach((source) => {
          sourceStats[source] = (sourceStats[source] || 0) + 1;
        });
      });
      log('Source statistics:', sourceStats);

      // 去重和排序
      const uniqueResults = deduplicateMagnetResults(allResults);
      const sortedResults = sortMagnetResults(uniqueResults);
      const displayLimit = sortedResults.length > 30 ? sortedResults.length : this.config.maxResults;
      const limitedResults = sortedResults.slice(0, displayLimit);
      const duplicateCount = Math.max(0, discoveredCount - uniqueResults.length);

      log(`After processing: ${discoveredCount} discovered, ${uniqueResults.length} unique, ${duplicateCount} deduplicated, displaying ${limitedResults.length}`);

      // 清空现有磁力列表
      this.clearMagnetList();

      // 重新显示所有磁力数据
      this.currentMagnetResults = limitedResults;
      this.currentMagnetSourceFilter = 'all';
      this.currentMagnetDisplayResults = this.getFilteredMagnetResults(limitedResults);
      this.currentMagnetPage = 1;
      this.displayAllMagnets(this.currentMagnetDisplayResults);

      // 更新总数显示
      this.updateTotalCount(this.currentMagnetDisplayResults.length);

      // 渲染后再次钳制容器宽度，防止新增节点导致回流拉宽
      this.clampMagnetContainerWidth();

      // 检测并标记横向溢出来源
      this.debugOverflow();

      if (notify) {
        showToast(`磁力搜索完成：发现 ${discoveredCount} 条，去重 ${duplicateCount} 条，显示 ${limitedResults.length} 条`, 'success');
      }
      log(`Successfully displayed ${limitedResults.length} total magnet results`);
    } catch (error) {
      log('Error processing all magnets:', error);
      showToast('处理磁力数据时发生错误', 'error');
    }
  }

  /**
   * 清空磁力列表（同步，供内部使用）
   */
  private clearMagnetList(): void {
    const magnetContent = document.querySelector('#magnets-content');
    if (magnetContent) {
      magnetContent.innerHTML = '';
      log('Cleared existing magnet list');
    }
  }

  /**
   * 显示所有磁力数据（统一样式）- 清空与追加在同一个 DOM 批次中执行，避免乱序
   */
  private displayAllMagnets(results: MagnetResult[], scrollToTop = false): void {
    this.currentMagnetDisplayResults = results;
    const pagination = buildMagnetPaginationState(results.length, this.currentMagnetPage);
    this.currentMagnetPage = pagination.currentPage;
    const pageResults = results.slice(pagination.startIndex, pagination.endIndex);

    // 先同步构建 DocumentFragment，不触及真实 DOM
    const fragment = document.createDocumentFragment();
    pageResults.forEach((result, index) => {
      try {
        const magnetItem = this.createUnifiedMagnetItem(result, pagination.startIndex + index);
        fragment.appendChild(magnetItem);
        log(`Added unified magnet item ${index + 1}: ${result.name.substring(0, 50)}...`);
      } catch (error) {
        log(`Error creating unified magnet item ${index + 1}:`, error);
      }
    });

    // 清空 + 追加在同一个调度批次内，保证原子性
    performanceOptimizer.scheduleDOMOperation(() => {
      const magnetContent = document.querySelector('#magnets-content');
      if (!magnetContent) {
        log('Magnet content area not found');
        return;
      }
      magnetContent.innerHTML = '';
      log('Cleared existing magnet list');
      this.renderMagnetSourceFilterBar(magnetContent);
      magnetContent.appendChild(fragment);
      this.renderMagnetPaginationControls(magnetContent, pagination, results.length);
      if (scrollToTop && magnetContent instanceof HTMLElement) {
        magnetContent.scrollTo({ top: 0, behavior: 'smooth' });
      }
      log(`Successfully displayed ${pageResults.length} unified magnet items`);
    });
  }

  private renderMagnetPaginationControls(container: Element, pagination: ReturnType<typeof buildMagnetPaginationState>, total: number): void {
    if (!pagination.enabled) return;

    const controls = document.createElement('div');
    controls.className = 'jdb-magnet-pagination';

    const prev = document.createElement('button');
    prev.className = 'button is-small';
    prev.dataset.jdbMagnetPrev = '1';
    prev.textContent = '上一页';
    prev.disabled = pagination.currentPage <= 1;
    prev.addEventListener('click', () => this.goToMagnetPage(pagination.currentPage - 1));

    const pageInfo = document.createElement('span');
    pageInfo.className = 'jdb-magnet-page-info';
    pageInfo.textContent = `${pagination.currentPage}/${pagination.totalPages} · 共 ${total} 条`;

    const next = document.createElement('button');
    next.className = 'button is-small';
    next.dataset.jdbMagnetNext = '1';
    next.textContent = '下一页';
    next.disabled = pagination.currentPage >= pagination.totalPages;
    next.addEventListener('click', () => this.goToMagnetPage(pagination.currentPage + 1));

    controls.appendChild(prev);
    controls.appendChild(pageInfo);
    controls.appendChild(next);
    container.appendChild(controls);
  }

  private goToMagnetPage(page: number): void {
    if (this.currentMagnetDisplayResults.length === 0) return;
    this.currentMagnetPage = page;
    this.displayAllMagnets(this.currentMagnetDisplayResults, true);
    this.updateTotalCount(this.currentMagnetDisplayResults.length);
  }

  private normalizeMagnetSourceFilter(source: string): string {
    return source.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private getFilteredMagnetResults(results = this.currentMagnetResults): MagnetResult[] {
    if (this.currentMagnetSourceFilter === 'all') return results;
    return results.filter((result) => getResultSources(result)
      .some(source => this.normalizeMagnetSourceFilter(source) === this.currentMagnetSourceFilter));
  }

  private getMagnetSourceFilterOptions(results = this.currentMagnetResults): Array<{ key: string; label: string; count: number }> {
    const counts = new Map<string, { label: string; count: number }>();
    results.forEach((result) => {
      getResultSources(result).forEach((source) => {
        const key = this.normalizeMagnetSourceFilter(source);
        const current = counts.get(key);
        counts.set(key, { label: source, count: (current?.count || 0) + 1 });
      });
    });

    return [
      { key: 'all', label: '全部', count: results.length },
      ...Array.from(counts.entries())
        .map(([key, value]) => ({ key, ...value }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    ];
  }

  private renderMagnetSourceFilterBar(container: Element): void {
    if (this.currentMagnetResults.length === 0) return;

    const options = this.getMagnetSourceFilterOptions();
    if (options.length <= 2) return;

    const activeExists = options.some(option => option.key === this.currentMagnetSourceFilter);
    if (!activeExists) this.currentMagnetSourceFilter = 'all';

    const bar = document.createElement('div');
    bar.className = 'jdb-magnet-source-filter-bar';

    options.forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `jdb-magnet-source-filter${option.key === this.currentMagnetSourceFilter ? ' is-active' : ''}`;
      button.dataset.jdbMagnetSourceFilter = option.key;
      button.textContent = `${option.label} ${option.count}`;
      button.addEventListener('click', () => {
        if (this.currentMagnetSourceFilter === option.key) return;
        this.currentMagnetSourceFilter = option.key;
        this.currentMagnetPage = 1;
        const filtered = this.getFilteredMagnetResults();
        this.displayAllMagnets(filtered, true);
        this.updateTotalCount(filtered.length);
      });
      bar.appendChild(button);
    });

    container.appendChild(bar);
  }

  private applyNativeMagnetPresentation(page = this.nativeMagnetPage): void {
    const container = document.querySelector('#magnets-content');
    if (!container) return;

    const rows = Array.from(container.querySelectorAll<HTMLElement>(':scope > .item.columns.is-desktop'));
    if (rows.length === 0) return;

    this.addUnifiedMagnetStyles();
    container.querySelector('.jdb-native-magnet-pagination')?.remove();

    const pagination = buildMagnetPaginationState(rows.length, page);
    this.nativeMagnetPage = pagination.currentPage;

    rows.forEach((row, index) => {
      this.decorateNativeMagnetRow(row);
      const isVisible = index >= pagination.startIndex && index < pagination.endIndex;
      row.classList.toggle('jdb-magnet-page-hidden', !isVisible);
      row.style.display = '';
    });

    if (!pagination.enabled) return;

    const controls = document.createElement('div');
    controls.className = 'jdb-magnet-pagination jdb-native-magnet-pagination';

    const prev = document.createElement('button');
    prev.className = 'button is-small';
    prev.dataset.jdbMagnetPrev = '1';
    prev.textContent = '上一页';
    prev.disabled = pagination.currentPage <= 1;
    prev.addEventListener('click', () => this.applyNativeMagnetPresentation(pagination.currentPage - 1));

    const pageInfo = document.createElement('span');
    pageInfo.className = 'jdb-magnet-page-info';
    pageInfo.textContent = `${pagination.currentPage}/${pagination.totalPages} · 共 ${rows.length} 条`;

    const next = document.createElement('button');
    next.className = 'button is-small';
    next.dataset.jdbMagnetNext = '1';
    next.textContent = '下一页';
    next.disabled = pagination.currentPage >= pagination.totalPages;
    next.addEventListener('click', () => this.applyNativeMagnetPresentation(pagination.currentPage + 1));

    controls.appendChild(prev);
    controls.appendChild(pageInfo);
    controls.appendChild(next);
    container.appendChild(controls);
  }

  private decorateNativeMagnetRow(row: HTMLElement): void {
    row.classList.add('jdb-magnet-row', 'jdb-native-magnet-row', 'privacy-protected');
    row.setAttribute('data-privacy-protected', 'true');
    row.setAttribute('data-source', row.getAttribute('data-source') || 'JavDB');

    const nameColumn = row.querySelector<HTMLElement>('.magnet-name');
    nameColumn?.classList.add('jdb-magnet-main');

    const link = row.querySelector<HTMLAnchorElement>('.magnet-name a');
    link?.classList.add('jdb-magnet-link');

    const name = row.querySelector<HTMLElement>('.magnet-name .name');
    name?.classList.add('jdb-magnet-title', 'privacy-protected');
    name?.setAttribute('data-privacy-protected', 'true');

    const meta = row.querySelector<HTMLElement>('.magnet-name .meta');
    meta?.classList.add('jdb-magnet-meta');

    let tags = row.querySelector<HTMLElement>('.magnet-name .tags');
    if (!tags && link) {
      tags = document.createElement('div');
      tags.className = 'tags';
      link.appendChild(tags);
    }
    tags?.classList.add('jdb-magnet-tags');
    if (tags && !tags.querySelector('.jdb-native-source-tag')) {
      const sourceTag = document.createElement('span');
      sourceTag.className = 'tag is-info is-small jdb-native-source-tag';
      sourceTag.textContent = 'JavDB';
      tags.prepend(sourceTag);
    }
  }

  /**
   * 显示单个搜索源的结果
   */


  /**
   * 创建统一样式的磁力项目元素
   */
  private createUnifiedMagnetItem(result: MagnetResult, index: number): HTMLElement {
    // 创建主容器
    const item = document.createElement('div');
    item.className = `item is-desktop jdb-magnet-row ${index % 2 === 0 ? '' : 'odd'} privacy-protected`;
    if (result.source !== 'JavDB') {
      item.classList.add('is-external-source');
    }
    item.setAttribute('data-privacy-protected', 'true');
    item.setAttribute('data-source', result.source);
    // 统一使用弹性布局，避免 Bulma columns 的列宽不一致导致溢出
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.flexWrap = 'nowrap';

    // 创建磁力名称列 - 使用固定宽度以对齐按钮
    const nameColumn = document.createElement('div');
    nameColumn.className = 'magnet-name jdb-magnet-main';
    // 自适应宽度，并允许内容被省略号正确截断
    nameColumn.style.flex = '1 1 auto';
    nameColumn.style.minWidth = '0';

    const magnetLink = document.createElement('a');
    magnetLink.className = 'jdb-magnet-link';
    magnetLink.href = result.magnet;
    magnetLink.title = '右键点击并选择「复制链接地址」';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'name jdb-magnet-title privacy-protected';
    nameSpan.setAttribute('data-privacy-protected', 'true');
    nameSpan.textContent = result.name;
    nameSpan.style.display = 'block';
    nameSpan.style.overflow = 'hidden';
    nameSpan.style.textOverflow = 'ellipsis';
    nameSpan.style.whiteSpace = 'nowrap';
    nameSpan.title = result.name; // 悬停显示完整名称

    const metaSpan = document.createElement('span');
    metaSpan.className = 'meta jdb-magnet-meta';
    const sourceLabels = getResultSources(result);
    const sourceText = sourceLabels.join(' / ');
    metaSpan.textContent = result.size
      ? `${result.size}${sourceText !== 'JavDB' ? ` · 来源 ${sourceText}` : ''}`
      : `${sourceText !== 'JavDB' ? `来源 ${sourceText}` : 'JavDB'}`;

    // 创建标签容器
    const tagsDiv = document.createElement('div');
    tagsDiv.className = 'tags jdb-magnet-tags';

    // 添加来源标签
    sourceLabels.forEach((source) => {
      const sourceTag = document.createElement('span');
      sourceTag.className = `tag is-${source === 'JavDB' ? 'info' : 'danger'} is-small jdb-magnet-source-tag`;
      sourceTag.textContent = source;
      tagsDiv.appendChild(sourceTag);
    });

    // 添加质量标签
    if (result.quality) {
      const qualityTag = document.createElement('span');
      qualityTag.className = 'tag is-primary is-small is-light';
      qualityTag.textContent = result.quality;
      qualityTag.style.marginLeft = '4px';
      tagsDiv.appendChild(qualityTag);
    }

    // 添加字幕标签
    if (result.hasSubtitle) {
      const subtitleTag = document.createElement('span');
      subtitleTag.className = 'tag is-warning is-small is-light';
      subtitleTag.textContent = '字幕';
      subtitleTag.style.marginLeft = '4px';
      tagsDiv.appendChild(subtitleTag);
    }

    // 添加破解标签
    if (isCrackedVersion(result.name)) {
      const crackedTag = document.createElement('span');
      crackedTag.className = 'tag is-success is-small is-light';
      crackedTag.textContent = '破解';
      crackedTag.style.marginLeft = '4px';
      tagsDiv.appendChild(crackedTag);
    }

    magnetLink.appendChild(nameSpan);
    magnetLink.appendChild(metaSpan);
    magnetLink.appendChild(tagsDiv);
    nameColumn.appendChild(magnetLink);

    // 创建按钮列 - 固定宽度
    const buttonsColumn = document.createElement('div');
    buttonsColumn.className = 'buttons';
    // 使用自然宽度，避免固定宽度导致整体溢出
    buttonsColumn.style.flex = '0 0 auto';
    buttonsColumn.style.display = 'flex';
    buttonsColumn.style.alignItems = 'center';
    buttonsColumn.style.gap = '6px';

    // 复制按钮
    const copyButton = document.createElement('button');
    copyButton.className = 'button is-info is-small';
    copyButton.textContent = '复制';
    copyButton.addEventListener('click', () => this.copyMagnet(result.magnet));

    // 下载按钮（保持JavDB原有样式）
    const downloadButton = document.createElement('a');
    downloadButton.className = 'button is-info is-small';
    downloadButton.href = `https://keepshare.org/aa36p03v/magnet%3A%3Fxt%3Durn%3Abtih%3A${extractHashFromMagnet(result.magnet)}`;
    downloadButton.target = '_blank';
    downloadButton.innerHTML = '&nbsp;下载&nbsp;';

    // 115推送按钮
    const push115Button = document.createElement('button');
    push115Button.className = 'button is-success is-small drive115-push-btn';
    push115Button.title = '推送到115网盘离线下载';
    push115Button.innerHTML = '&nbsp;推送115&nbsp;';
    push115Button.addEventListener('click', () => this.push115(push115Button, result.magnet, result.name));

    buttonsColumn.appendChild(copyButton);
    buttonsColumn.appendChild(downloadButton);
    buttonsColumn.appendChild(push115Button);

    // 创建日期列 - 固定宽度
    const dateColumn = document.createElement('div');
    dateColumn.className = 'date';
    dateColumn.style.width = '80px'; // 固定日期列宽度
    dateColumn.style.flexShrink = '0'; // 防止收缩
    dateColumn.style.textAlign = 'center'; // 居中对齐
    const timeSpan = document.createElement('span');
    timeSpan.className = 'time';
    timeSpan.textContent = result.date || 'Unknown';
    dateColumn.appendChild(timeSpan);

    // 组装完整项目
    item.appendChild(nameColumn);
    item.appendChild(buttonsColumn);
    item.appendChild(dateColumn);

    return item;
  }

  /**
   * 检查影片是否已看
   */
  private async checkIfVideoViewed(): Promise<boolean> {
    try {
      const { STATE } = await import('../../contentState');
      const videoId = this.currentVideoId;
      if (!videoId) return false;
      
      const record = STATE.records[videoId];
      const { VIDEO_STATUS } = await import('../../../utils/config');
      
      return record?.status === VIDEO_STATUS.VIEWED;
    } catch (error) {
      log('Error checking video viewed status:', error);
      return false;
    }
  }

  /**
   * 显示手动搜索按钮
   */
  private showManualSearchButton(isViewed = false): void {
    try {
      const topMeta = document.querySelector('.top-meta');
      if (!topMeta) return;

      // 检查是否已经添加过按钮
      if (document.getElementById('manual-magnet-search-btn')) return;

      // 创建按钮容器
      const buttonContainer = document.createElement('div');
      this.addUnifiedMagnetStyles();
      buttonContainer.className = 'jdb-magnet-manual-search';

      // 创建搜索按钮
      const searchButton = document.createElement('button');
      searchButton.id = 'manual-magnet-search-btn';
      searchButton.className = 'button is-info is-small jdb-magnet-manual-button';
      searchButton.innerHTML = '🧲 加载磁力资源';

      searchButton.addEventListener('click', async () => {
        searchButton.disabled = true;
        searchButton.innerHTML = '🔄 搜索中...';

        try {
          await this.searchMagnets(this.currentVideoId!);
          // 搜索完成后移除按钮
          buttonContainer.remove();
        } catch (error) {
          searchButton.disabled = false;
          searchButton.innerHTML = '🧲 加载磁力资源';
          showToast('搜索失败，请重试', 'error');
        }
      });

      // 创建提示文本
      const hintText = document.createElement('span');
      hintText.className = 'has-text-grey is-size-7 jdb-magnet-manual-hint';
      hintText.textContent = isViewed ? '（影片已看，点击按钮加载磁力资源）' : '（点击按钮加载磁力资源）';

      buttonContainer.appendChild(searchButton);
      buttonContainer.appendChild(hintText);

      // 插入到磁力内容区域之前
      const magnetContent = document.querySelector('#magnets-content');
      if (magnetContent && magnetContent.parentElement) {
        magnetContent.parentElement.insertBefore(buttonContainer, magnetContent);
      } else {
        topMeta.appendChild(buttonContainer);
      }

      log('Manual search button added for viewed video');
    } catch (error) {
      log('Error showing manual search button:', error);
    }
  }

  /**
   * 添加搜索源标签到标题区域
   */
  private addSearchSourceTags(): void {
    const topMeta = document.querySelector('.top-meta');
    if (!topMeta) return;
    topMeta.classList.add('jdb-magnet-meta-bar');

    // 添加动画样式
    this.addSearchTagStyles();

    // 确保有tags容器
    let tagsContainer = topMeta.querySelector('.tags');
    if (!tagsContainer) {
      tagsContainer = document.createElement('div');
      tagsContainer.className = 'tags';
      topMeta.insertBefore(tagsContainer, topMeta.firstChild);
    }
    tagsContainer.classList.add('jdb-magnet-source-tags');

    // 为每个启用的搜索源添加标签
    const sources: Array<{ key: MagnetSourceKey; enabled: boolean }> = [
      { key: 'sukebei', enabled: this.config.sources.sukebei },
      { key: 'btdig', enabled: this.config.sources.btdig },
      { key: 'btsow', enabled: this.config.sources.btsow },
      { key: 'torrentz2', enabled: this.config.sources.torrentz2 },
      { key: 'javbus', enabled: this.config.sources.javbus }
    ];

    sources.forEach(source => {
      if (!source.enabled) return;
      this.sourceTagStates[source.key] = this.sourceTagStates[source.key] || 'idle';

      // 检查是否已经添加过标签
      if (tagsContainer!.querySelector(`#magnet-${source.key}-tag`)) return;

      const tag = document.createElement('span');
      tag.id = `magnet-${source.key}-tag`;
      tag.className = 'tag is-light magnet-search-tag';
      tag.textContent = `${getMagnetSourceLabel(source.key)}搜索`;
      tagsContainer!.appendChild(tag);
    });
  }

  /**
   * 更新搜索源标签状态
   */
  private setSourceTagState(
    sourceKey: MagnetSourceKey,
    status: MagnetSourceSearchState,
    currentResults: MagnetResult[],
    latestResultCount?: number,
  ): void {
    this.sourceTagStates[sourceKey] = status;
    if (typeof latestResultCount === 'number') {
      this.sourceTagLatestResultCounts[sourceKey] = latestResultCount;
    }
    if (status === 'searching' || status === 'failed') {
      delete this.sourceTagLatestResultCounts[sourceKey];
    }
    this.refreshSourceTagStatuses(currentResults);
  }

  private refreshSourceTagStatuses(currentResults: MagnetResult[]): void {
    const counts = countUniqueResultsBySource(currentResults);
    (Object.keys(this.sourceTagStates) as MagnetSourceKey[]).forEach(sourceKey => {
      this.updateSourceTagStatus(
        sourceKey,
        this.sourceTagStates[sourceKey] || 'idle',
        counts[sourceKey] || 0,
        this.sourceTagLatestResultCounts[sourceKey],
      );
    });
  }

  private updateSourceTagStatus(
    sourceKey: MagnetSourceKey,
    status: MagnetSourceSearchState,
    currentUniqueCount: number,
    latestResultCount?: number,
  ): void {
    const tag = document.querySelector(`#magnet-${sourceKey}-tag`) as HTMLElement;
    if (!tag) return;

    const view = buildMagnetSourceTagView(sourceKey, status, currentUniqueCount, latestResultCount);

    // 清除所有状态类
    tag.classList.remove('is-light', 'is-success', 'is-danger', 'is-warning', 'is-loading');
    tag.classList.add(view.className);
    tag.textContent = view.text;
    tag.title = view.title;
    tag.style.animation = status === 'searching' ? 'pulse 1.5s infinite' : '';
  }

  /**
   * 添加搜索标签样式
   */
  private addSearchTagStyles(): void {
    // 检查是否已经添加过样式
    if (document.getElementById('magnet-search-tag-styles')) return;

    const style = document.createElement('style');
    style.id = 'magnet-search-tag-styles';
    style.textContent = `
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.6; }
        100% { opacity: 1; }
      }

      .magnet-search-tag {
        transition: all 0.3s ease;
      }

      .magnet-search-tag.is-warning {
        animation: pulse 1.5s infinite;
      }

      /* 避免顶部 meta 区域的 source 标签把页面横向撑宽 */
      .top-meta.jdb-magnet-meta-bar {
        --jdb-magnet-meta-bg: #ffffff;
        --jdb-magnet-meta-border: rgba(15, 23, 42, 0.10);
        --jdb-magnet-meta-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
        --jdb-magnet-meta-muted: #64748b;
        --jdb-magnet-meta-success-bg: #dcfce7;
        --jdb-magnet-meta-success-text: #166534;
        --jdb-magnet-meta-danger-bg: #fee2e2;
        --jdb-magnet-meta-danger-text: #991b1b;
        --jdb-magnet-meta-warning-bg: #fef3c7;
        --jdb-magnet-meta-warning-text: #92400e;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px 8px;
        min-height: 0 !important;
        margin-bottom: 6px !important;
        padding: 7px 9px !important;
        border: 1px solid var(--jdb-magnet-meta-border);
        border-radius: 10px;
        background: var(--jdb-magnet-meta-bg);
        box-shadow: var(--jdb-magnet-meta-shadow);
      }

      html[data-theme="dark"] .top-meta.jdb-magnet-meta-bar {
        --jdb-magnet-meta-bg: #1f2937;
        --jdb-magnet-meta-border: rgba(148, 163, 184, 0.22);
        --jdb-magnet-meta-shadow: 0 10px 24px rgba(0, 0, 0, 0.22);
        --jdb-magnet-meta-muted: #9ca3af;
        --jdb-magnet-meta-success-bg: rgba(34, 197, 94, 0.18);
        --jdb-magnet-meta-success-text: #bbf7d0;
        --jdb-magnet-meta-danger-bg: rgba(239, 68, 68, 0.18);
        --jdb-magnet-meta-danger-text: #fecaca;
        --jdb-magnet-meta-warning-bg: rgba(245, 158, 11, 0.18);
        --jdb-magnet-meta-warning-text: #fde68a;
      }

      .top-meta.jdb-magnet-meta-bar .tags,
      .top-meta.jdb-magnet-meta-bar .jdb-magnet-source-tags {
        display: flex;
        flex-wrap: wrap !important;
        align-items: center;
        gap: 6px;
        max-width: 100% !important;
        overflow: hidden !important;
        margin: 0 !important;
      }

      .top-meta.jdb-magnet-meta-bar .magnet-search-tag {
        height: 24px;
        margin: 0 !important;
        padding: 0 9px;
        border-radius: 999px;
        border: 0;
        color: var(--jdb-magnet-meta-muted);
        background: rgba(148, 163, 184, 0.14);
        font-size: 11px;
        font-weight: 800;
        line-height: 24px;
      }

      .top-meta.jdb-magnet-meta-bar .magnet-search-tag.is-success {
        color: var(--jdb-magnet-meta-success-text);
        background: var(--jdb-magnet-meta-success-bg);
      }

      .top-meta.jdb-magnet-meta-bar .magnet-search-tag.is-danger {
        color: var(--jdb-magnet-meta-danger-text);
        background: var(--jdb-magnet-meta-danger-bg);
      }

      .top-meta.jdb-magnet-meta-bar .magnet-search-tag.is-warning,
      .top-meta.jdb-magnet-meta-bar .magnet-search-tag.is-loading {
        color: var(--jdb-magnet-meta-warning-text);
        background: var(--jdb-magnet-meta-warning-bg);
      }

      .top-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px 8px;
        min-height: 0 !important;
        margin-bottom: 6px !important;
        padding-bottom: 0 !important;
      }

      .top-meta .tags {
        display: flex;
        flex-wrap: wrap !important;
        max-width: 100% !important;
        overflow: hidden !important;
        margin-bottom: 0 !important;
      }

      .top-meta .moj-content.jdb-hidden-moj-content,
      .top-meta .moj-content[style*="display: none"],
      .top-meta .moj-content[style*="display:none"] {
        width: 0 !important;
        height: 0 !important;
        min-width: 0 !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        line-height: 0 !important;
        overflow: hidden !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 注入统一的磁力列表样式，解决宽度溢出及换行不当问题
   */
  private addUnifiedMagnetStyles(): void {
    if (document.getElementById('unified-magnet-list-styles')) return;

    const style = document.createElement('style');
    style.id = 'unified-magnet-list-styles';
    style.textContent = `
      #magnets-content,
      .jdb-magnet-manual-search {
        --jdb-magnet-panel-bg: #f7fafc;
        --jdb-magnet-card-bg: #ffffff;
        --jdb-magnet-card-border: rgba(15, 23, 42, 0.10);
        --jdb-magnet-card-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
        --jdb-magnet-text: #1f2937;
        --jdb-magnet-muted: #64748b;
        --jdb-magnet-title: #0f73a8;
        --jdb-magnet-accent: #0ea5e9;
        --jdb-magnet-surface: #eef2f7;
        --jdb-magnet-button-bg: #e1f5fe;
        --jdb-magnet-button-hover: #c8ecfb;
        --jdb-magnet-button-text: #0277bd;
        --jdb-magnet-success-bg: #dcfce7;
        --jdb-magnet-success-text: #166534;
        --jdb-magnet-disabled-bg: #e5e7eb;
        --jdb-magnet-disabled-text: #94a3b8;
      }

      html[data-theme="dark"] #magnets-content,
      html[data-theme="dark"] .jdb-magnet-manual-search {
        --jdb-magnet-panel-bg: #111827;
        --jdb-magnet-card-bg: #1f2937;
        --jdb-magnet-card-border: rgba(148, 163, 184, 0.22);
        --jdb-magnet-card-shadow: 0 10px 24px rgba(0, 0, 0, 0.26);
        --jdb-magnet-text: #e5e7eb;
        --jdb-magnet-muted: #9ca3af;
        --jdb-magnet-title: #7dd3fc;
        --jdb-magnet-accent: #38bdf8;
        --jdb-magnet-surface: rgba(148, 163, 184, 0.12);
        --jdb-magnet-button-bg: rgba(14, 165, 233, 0.18);
        --jdb-magnet-button-hover: rgba(14, 165, 233, 0.28);
        --jdb-magnet-button-text: #bae6fd;
        --jdb-magnet-success-bg: rgba(34, 197, 94, 0.18);
        --jdb-magnet-success-text: #bbf7d0;
        --jdb-magnet-disabled-bg: rgba(148, 163, 184, 0.12);
        --jdb-magnet-disabled-text: #64748b;
      }

      /* 容器级别约束，避免出现横向滚动和超宽 */
      #magnets-content {
        max-width: 100% !important;
        max-height: 720px !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        box-sizing: border-box !important;
        padding: 12px !important;
        border-radius: 12px;
        background: var(--jdb-magnet-panel-bg);
        scroll-behavior: smooth;
      }

      .jdb-magnet-manual-search {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px 10px;
        margin: 10px 0;
        padding: 10px 12px;
        border: 1px solid var(--jdb-magnet-card-border);
        border-radius: 10px;
        color: var(--jdb-magnet-text);
        background: var(--jdb-magnet-card-bg);
        box-shadow: var(--jdb-magnet-card-shadow);
      }

      .jdb-magnet-manual-search .jdb-magnet-manual-button {
        height: 28px;
        border-color: transparent;
        border-radius: 8px;
        color: var(--jdb-magnet-button-text);
        background: var(--jdb-magnet-button-bg);
        font-weight: 700;
      }

      .jdb-magnet-manual-search .jdb-magnet-manual-hint {
        color: var(--jdb-magnet-muted) !important;
        font-size: 12px;
        line-height: 1.4;
      }

      .top-meta.jdb-magnet-meta-bar {
        --jdb-magnet-meta-bg: #ffffff;
        --jdb-magnet-meta-border: rgba(15, 23, 42, 0.10);
        --jdb-magnet-meta-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
        --jdb-magnet-meta-muted: #64748b;
        --jdb-magnet-meta-success-bg: #dcfce7;
        --jdb-magnet-meta-success-text: #166534;
        --jdb-magnet-meta-danger-bg: #fee2e2;
        --jdb-magnet-meta-danger-text: #991b1b;
        --jdb-magnet-meta-warning-bg: #fef3c7;
        --jdb-magnet-meta-warning-text: #92400e;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px 8px;
        min-height: 0 !important;
        margin-bottom: 6px !important;
        padding: 7px 9px !important;
        border: 1px solid var(--jdb-magnet-meta-border);
        border-radius: 10px;
        background: var(--jdb-magnet-meta-bg);
        box-shadow: var(--jdb-magnet-meta-shadow);
      }

      html[data-theme="dark"] .top-meta.jdb-magnet-meta-bar {
        --jdb-magnet-meta-bg: #1f2937;
        --jdb-magnet-meta-border: rgba(148, 163, 184, 0.22);
        --jdb-magnet-meta-shadow: 0 10px 24px rgba(0, 0, 0, 0.22);
        --jdb-magnet-meta-muted: #9ca3af;
        --jdb-magnet-meta-success-bg: rgba(34, 197, 94, 0.18);
        --jdb-magnet-meta-success-text: #bbf7d0;
        --jdb-magnet-meta-danger-bg: rgba(239, 68, 68, 0.18);
        --jdb-magnet-meta-danger-text: #fecaca;
        --jdb-magnet-meta-warning-bg: rgba(245, 158, 11, 0.18);
        --jdb-magnet-meta-warning-text: #fde68a;
      }

      .top-meta.jdb-magnet-meta-bar .tags,
      .top-meta.jdb-magnet-meta-bar .jdb-magnet-source-tags {
        display: flex;
        flex-wrap: wrap !important;
        align-items: center;
        gap: 6px;
        max-width: 100% !important;
        overflow: hidden !important;
        margin: 0 !important;
      }

      .top-meta.jdb-magnet-meta-bar .magnet-search-tag {
        height: 24px;
        margin: 0 !important;
        padding: 0 9px;
        border-radius: 999px;
        border: 0;
        color: var(--jdb-magnet-meta-muted);
        background: rgba(148, 163, 184, 0.14);
        font-size: 11px;
        font-weight: 800;
        line-height: 24px;
      }

      .top-meta.jdb-magnet-meta-bar .magnet-search-tag.is-success {
        color: var(--jdb-magnet-meta-success-text);
        background: var(--jdb-magnet-meta-success-bg);
      }

      .top-meta.jdb-magnet-meta-bar .magnet-search-tag.is-danger {
        color: var(--jdb-magnet-meta-danger-text);
        background: var(--jdb-magnet-meta-danger-bg);
      }

      .top-meta.jdb-magnet-meta-bar .magnet-search-tag.is-warning,
      .top-meta.jdb-magnet-meta-bar .magnet-search-tag.is-loading {
        color: var(--jdb-magnet-meta-warning-text);
        background: var(--jdb-magnet-meta-warning-bg);
      }

      .top-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px 8px;
        min-height: 0 !important;
        margin-bottom: 6px !important;
        padding-bottom: 0 !important;
      }

      .top-meta > .tags {
        margin-bottom: 0 !important;
      }

      .top-meta .moj-content.jdb-hidden-moj-content,
      .top-meta .moj-content[style*="display: none"],
      .top-meta .moj-content[style*="display:none"] {
        width: 0 !important;
        height: 0 !important;
        min-width: 0 !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        line-height: 0 !important;
        overflow: hidden !important;
      }

      /* 恢复 Bulma 在该区域的负边距行为，避免列 padding 叠加导致超宽 */
      #magnets-content .columns {
        margin-left: -0.75rem !important;
        margin-right: -0.75rem !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }

      /* 统一磁力列表的 flex 布局与溢出处理 */
      #magnets-content .item {
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        overflow: hidden !important; /* 防止内部偶发性溢出 */
        padding-left: 8px !important;   /* 兼容原生磁力节点 */
        padding-right: 8px !important;
      }

      #magnets-content .item, #magnets-content .item * {
        min-width: 0 !important;
      }

      #magnets-content .jdb-magnet-row {
        gap: 12px;
        margin-bottom: 8px;
        padding: 9px 12px !important;
        border: 1px solid var(--jdb-magnet-card-border);
        border-radius: 10px;
        color: var(--jdb-magnet-text);
        background: var(--jdb-magnet-card-bg);
        box-shadow: var(--jdb-magnet-card-shadow);
      }

      #magnets-content .jdb-magnet-row.odd {
        background: var(--jdb-magnet-card-bg);
      }

      #magnets-content .jdb-native-magnet-row,
      #magnets-content > .item.columns.is-desktop.jdb-native-magnet-row {
        gap: 10px;
        padding: 7px 10px !important;
      }

      #magnets-content .jdb-native-magnet-row br,
      #magnets-content > .item.columns.is-desktop.jdb-native-magnet-row br {
        display: none !important;
      }

      #magnets-content .jdb-native-magnet-row .jdb-magnet-title,
      #magnets-content > .item.columns.is-desktop.jdb-native-magnet-row .jdb-magnet-title {
        line-height: 1.22;
      }

      #magnets-content .jdb-native-magnet-row .jdb-magnet-meta,
      #magnets-content > .item.columns.is-desktop.jdb-native-magnet-row .jdb-magnet-meta {
        margin-top: 2px;
        line-height: 1.18;
      }

      #magnets-content .jdb-native-magnet-row .jdb-magnet-tags,
      #magnets-content > .item.columns.is-desktop.jdb-native-magnet-row .jdb-magnet-tags {
        gap: 4px;
        margin-top: 3px !important;
      }

      #magnets-content .jdb-native-magnet-row .jdb-magnet-tags .tag,
      #magnets-content > .item.columns.is-desktop.jdb-native-magnet-row .jdb-magnet-tags .tag {
        height: 18px;
        font-size: 10.5px;
        line-height: 18px;
      }

      #magnets-content .jdb-native-magnet-row .buttons .button,
      #magnets-content > .item.columns.is-desktop.jdb-native-magnet-row .buttons .button {
        height: 24px;
        line-height: 1;
      }

      #magnets-content .jdb-native-magnet-row .date .time,
      #magnets-content > .item.columns.is-desktop.jdb-native-magnet-row .date .time {
        min-height: 20px;
        padding: 1px 6px;
      }

      #magnets-content > .item.columns.is-desktop {
        display: flex !important;
        align-items: center;
        gap: 12px;
        margin: 0 0 8px !important;
        padding: 9px 12px !important;
        border: 1px solid var(--jdb-magnet-card-border);
        border-radius: 10px;
        color: var(--jdb-magnet-text);
        background: var(--jdb-magnet-card-bg);
        box-shadow: var(--jdb-magnet-card-shadow);
      }

      #magnets-content > .item.columns.is-desktop.odd {
        background: var(--jdb-magnet-card-bg);
      }

      #magnets-content > .item.columns.is-desktop.jdb-magnet-page-hidden {
        display: none !important;
      }

      #magnets-content > .item.columns.is-desktop .column {
        padding: 0 !important;
      }

      #magnets-content > .item.columns.is-desktop .magnet-name {
        flex: 1 1 auto !important;
      }

      /* 名称链接与文本本身的宽度约束与省略号 */
      #magnets-content .item .magnet-name a {
        display: block !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }

      #magnets-content .jdb-magnet-link {
        color: inherit;
        text-decoration: none;
      }

      #magnets-content .item .magnet-name .name {
        display: block !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        max-width: 100% !important;
      }

      #magnets-content .jdb-magnet-title {
        color: var(--jdb-magnet-title);
        font-size: 13px;
        font-weight: 750;
        line-height: 1.3;
      }

      #magnets-content > .item.columns.is-desktop .magnet-name .name {
        color: var(--jdb-magnet-title);
        font-size: 13px;
        font-weight: 750;
        line-height: 1.3;
      }

      #magnets-content .jdb-magnet-link:hover .jdb-magnet-title {
        text-decoration: underline;
      }

      #magnets-content .jdb-magnet-meta {
        display: block;
        margin-top: 3px;
        color: var(--jdb-magnet-muted);
        font-size: 12px;
        line-height: 1.25;
      }

      #magnets-content > .item.columns.is-desktop .meta {
        display: block;
        margin-top: 3px;
        color: var(--jdb-magnet-muted);
        font-size: 12px;
        line-height: 1.25;
      }

      #magnets-content .jdb-magnet-tags {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 5px;
        margin: 5px 0 0 !important;
      }

      #magnets-content .jdb-magnet-tags .tag {
        height: 20px;
        margin: 0 !important;
        border-radius: 999px;
        font-size: 11px;
        line-height: 20px;
      }

      #magnets-content > .item.columns.is-desktop .tags {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 5px;
        margin: 5px 0 0 !important;
      }

      #magnets-content > .item.columns.is-desktop .tags .tag {
        height: 20px;
        margin: 0 !important;
        border-radius: 999px;
        font-size: 11px;
        line-height: 20px;
      }

      #magnets-content .item .buttons {
        display: flex;
        align-items: center;
        gap: 6px;
        flex: 0 0 auto !important;
        white-space: nowrap !important;
        max-width: 100% !important;
      }

      #magnets-content .jdb-magnet-row .buttons {
        margin-bottom: 0;
      }

      #magnets-content .jdb-magnet-row .buttons .button {
        height: 26px;
        margin: 0;
        border-radius: 8px;
        font-weight: 700;
      }

      #magnets-content > .item.columns.is-desktop .buttons {
        margin: 0 !important;
        flex: 0 0 auto !important;
      }

      #magnets-content > .item.columns.is-desktop .buttons .button {
        height: 26px;
        margin: 0 !important;
        border-radius: 8px;
        font-weight: 700;
      }

      #magnets-content > .item.columns.is-desktop .buttons .button.is-info {
        border-color: transparent;
        color: var(--jdb-magnet-button-text);
        background: var(--jdb-magnet-button-bg);
      }

      #magnets-content > .item.columns.is-desktop .buttons .button.is-info:hover {
        background: var(--jdb-magnet-button-hover);
      }

      #magnets-content > .item.columns.is-desktop .buttons .button.is-success {
        border-color: transparent;
        color: var(--jdb-magnet-success-text);
        background: var(--jdb-magnet-success-bg);
      }

      #magnets-content .jdb-magnet-row .buttons .button.is-info {
        border-color: transparent;
        color: var(--jdb-magnet-button-text);
        background: var(--jdb-magnet-button-bg);
      }

      #magnets-content .jdb-magnet-row .buttons .button.is-info:hover {
        background: var(--jdb-magnet-button-hover);
      }

      #magnets-content .jdb-magnet-row .buttons .button.is-success {
        border-color: transparent;
        color: var(--jdb-magnet-success-text);
        background: var(--jdb-magnet-success-bg);
      }

      #magnets-content .item .date {
        flex: 0 0 80px !important;
        text-align: center !important;
      }

      #magnets-content .jdb-magnet-row .date {
        flex-basis: 96px !important;
      }

      #magnets-content .jdb-magnet-row .date .time {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 22px;
        padding: 2px 7px;
        border-radius: 999px;
        color: var(--jdb-magnet-muted);
        background: var(--jdb-magnet-surface);
        font-size: 11px;
        font-weight: 700;
        line-height: 1.2;
        white-space: nowrap;
      }

      #magnets-content > .item.columns.is-desktop .date {
        flex: 0 0 96px !important;
      }

      #magnets-content > .item.columns.is-desktop .date .time {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 22px;
        padding: 2px 7px;
        border-radius: 999px;
        color: var(--jdb-magnet-muted);
        background: var(--jdb-magnet-surface);
        font-size: 11px;
        font-weight: 700;
        line-height: 1.2;
        white-space: nowrap;
      }

      #magnets-content .jdb-magnet-pagination {
        position: sticky;
        bottom: 0;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 10px 8px;
        background: color-mix(in srgb, var(--jdb-magnet-panel-bg) 94%, transparent);
        border-top: 1px solid var(--jdb-magnet-card-border);
        box-sizing: border-box;
      }

      #magnets-content .jdb-magnet-page-info {
        min-width: 110px;
        text-align: center;
        font-size: 12px;
        color: var(--jdb-magnet-muted);
        font-weight: 700;
        white-space: nowrap;
      }

      #magnets-content .jdb-magnet-pagination .button {
        flex: 0 0 auto;
        border-radius: 8px;
        color: var(--jdb-magnet-button-text);
        background: var(--jdb-magnet-button-bg);
      }

      #magnets-content .jdb-magnet-source-filter-bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin: 0 0 10px;
        padding: 0 0 10px;
        border-bottom: 1px solid var(--jdb-magnet-card-border);
      }

      #magnets-content .jdb-magnet-source-filter {
        height: 24px;
        padding: 0 9px;
        border: 1px solid transparent;
        border-radius: 999px;
        color: var(--jdb-magnet-muted);
        background: var(--jdb-magnet-surface);
        font-size: 11px;
        font-weight: 800;
        line-height: 22px;
        cursor: pointer;
      }

      #magnets-content .jdb-magnet-source-filter:hover,
      #magnets-content .jdb-magnet-source-filter.is-active {
        color: var(--jdb-magnet-button-text);
        background: var(--jdb-magnet-button-bg);
      }

      @media (prefers-color-scheme: dark) {
        html:not([data-theme="light"]) #magnets-content,
        html:not([data-theme="light"]) .jdb-magnet-manual-search {
          --jdb-magnet-panel-bg: #111827;
          --jdb-magnet-card-bg: #1f2937;
          --jdb-magnet-card-border: rgba(148, 163, 184, 0.22);
          --jdb-magnet-card-shadow: 0 10px 24px rgba(0, 0, 0, 0.26);
          --jdb-magnet-text: #e5e7eb;
          --jdb-magnet-muted: #9ca3af;
          --jdb-magnet-title: #7dd3fc;
          --jdb-magnet-accent: #38bdf8;
          --jdb-magnet-surface: rgba(148, 163, 184, 0.12);
          --jdb-magnet-button-bg: rgba(14, 165, 233, 0.18);
          --jdb-magnet-button-hover: rgba(14, 165, 233, 0.28);
          --jdb-magnet-button-text: #bae6fd;
          --jdb-magnet-success-bg: rgba(34, 197, 94, 0.18);
          --jdb-magnet-success-text: #bbf7d0;
          --jdb-magnet-disabled-bg: rgba(148, 163, 184, 0.12);
          --jdb-magnet-disabled-text: #64748b;
        }
        #magnets-content .jdb-magnet-pagination {
          background: color-mix(in srgb, var(--jdb-magnet-panel-bg) 94%, transparent);
          border-top-color: var(--jdb-magnet-card-border);
        }
        #magnets-content .jdb-magnet-page-info {
          color: var(--jdb-magnet-muted);
        }
      }
      /* 小屏优化：当空间不足时允许在按钮前换行，避免横向溢出 */
      @media (max-width: 768px) {
        #magnets-content .item.is-desktop {
          flex-wrap: wrap;
          align-items: flex-start;
        }
        #magnets-content .item .date {
          order: 3;
        }
        #magnets-content .jdb-magnet-row {
          gap: 10px;
        }
        #magnets-content .jdb-magnet-row .buttons {
          order: 4;
          flex: 1 1 100% !important;
          justify-content: flex-start;
          flex-wrap: wrap;
        }
        #magnets-content .jdb-magnet-row .date {
          flex: 0 0 auto !important;
          text-align: left !important;
        }
        #magnets-content > .item.columns.is-desktop {
          flex-wrap: wrap;
          align-items: flex-start;
          gap: 10px;
        }
        #magnets-content > .item.columns.is-desktop .buttons {
          order: 4;
          flex: 1 1 100% !important;
          justify-content: flex-start;
          flex-wrap: wrap;
        }
        #magnets-content > .item.columns.is-desktop .date {
          flex: 0 0 auto !important;
          text-align: left !important;
        }
      }

      /* 页面级溢出约束（仅限影片详情区块）*/
      article.message.video-panel,
      article.message.video-panel .message-body {
        max-width: 100% !important;
        box-sizing: border-box !important;
        overflow-x: hidden !important;
      }

      /* 统一限制影片详情主要内容宽度，保持与站点容器一致的上限（约 1344px） */
      article.message.video-panel .message-body,
      article.message.video-panel .moj-content,
      article.message.video-panel .magnet-links,
      article.message.video-panel #magnets-content {
        width: 100% !important;
        max-width: 1344px !important;
        margin-left: auto !important;
        margin-right: auto !important;
        box-sizing: border-box !important;
      }

      /* 约束顶部切页 tabs，避免白屏撑宽 body */
      article.message.video-panel .tabs,
      article.message.video-panel .tabs ul {
        max-width: 100% !important;
        box-sizing: border-box !important;
        overflow-x: auto !important; /* 局部滚动，而非撑宽整个页面 */
        white-space: normal !important; /* 允许换行 */
        flex-wrap: wrap !important;
      }

      /* 针对站点上的 .tabs.no-bottom（你的诊断里出现了 nowrap）做兜底，限定在详情区 */
      article.message.video-panel .tabs.no-bottom,
      article.message.video-panel .tabs.no-bottom ul {
        max-width: 100% !important;
        box-sizing: border-box !important;
        overflow-x: auto !important;
        white-space: normal !important;
        display: flex !important;
        flex-wrap: wrap !important;
      }

      /* Bulma columns 在详情区的列允许收缩 */
      article.message.video-panel .columns > .column {
        min-width: 0 !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 更新总数显示
   */
  private updateTotalCount(totalOverride?: number): void {
    const totalElement = document.querySelector('#x-total');
    if (totalElement) {
      const count = typeof totalOverride === 'number'
        ? totalOverride
        : document.querySelectorAll('#magnets-content .item:not(.search-results-header)').length;
      totalElement.textContent = `总数 ${count}`;
    }
  }









  /**
   * 复制磁力链接
   */
  private async copyMagnet(magnet: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(magnet);
      showToast('磁力链接已复制到剪贴板', 'success');
    } catch (error) {
      log('Failed to copy magnet:', error);
      showToast('复制失败，请手动复制', 'error');
    }
  }

  /**
   * 推送磁力链接到115（直接使用详情页的完整逻辑）
   */
  private async push115(button: HTMLButtonElement, magnet: string, name: string): Promise<void> {
    try {
      log(`Pushing to 115: ${name}`);

      // 直接调用详情页的完整推送逻辑，包含所有功能：
      // - 完整的日志记录
      // - 推送成功后自动标记已看
      // - 标记已看后自动刷新页面
      await handlePushToDrive115(
        button,
        this.currentVideoId || 'unknown',
        magnet,
        name
      );

    } catch (error) {
      log('Error pushing to 115:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      showToast(`推送到115失败: ${errorMessage}`, 'error');
    }
  }






  /**
   * 验证搜索结果是否匹配视频ID
   */
  private isValidResult(name: string, videoId: string): boolean {
    if (!name || !videoId) return false;

    try {
      const isMatch = isValidMagnetResultName(name, videoId);
      log(`Validating result: "${name}" matches "${videoId}": ${isMatch}`);
      return isMatch;
    } catch (error) {
      log('Error validating result:', error);
      return true;
    }
  }

  /**
   * 从 IndexedDB 磁链缓存加载
   */
  private async loadCachedMagnets(videoId: string): Promise<MagnetResult[]> {
    if (!videoId) return [];
    try {
      const { items } = await dbMagnetsQuery({ videoId, orderBy: 'sizeBytes', order: 'desc' });
      return (items || []).map((m) => ({
        name: m.name,
        magnet: m.magnet,
        size: m.size || '',
        sizeBytes: m.sizeBytes || 0,
        date: m.date || '',
        seeders: m.seeders,
        leechers: m.leechers,
        source: String(m.source || 'cache'),
        quality: m.quality,
        hasSubtitle: !!m.hasSubtitle,
      }));
    } catch (e) {
      return [];
    }
  }

  /**
   * 将搜索结果写入磁链缓存（批量 upsert）
   */
  private async upsertMagnetsToCache(videoId: string, results: MagnetResult[]): Promise<void> {
    if (!videoId || !Array.isArray(results) || results.length === 0) return;
    const now = Date.now();
    const expireAt = now + MAGNET_CACHE_TTL_MS;
    const recs = results.map((r) => {
      const hash = extractHashFromMagnet(r.magnet);
      return {
        key: `${videoId}|${r.source}|${hash}`,
        videoId,
        source: r.source,
        name: r.name,
        magnet: r.magnet,
        size: r.size,
        sizeBytes: r.sizeBytes,
        date: r.date,
        seeders: r.seeders,
        leechers: r.leechers,
        hasSubtitle: r.hasSubtitle,
        quality: r.quality,
        createdAt: now,
        expireAt,
      } as any;
    });
    await dbMagnetsUpsert(recs);
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<MagnetSearchConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 销毁磁力搜索功能
   */
  destroy(): void {
    this.isInitialized = false;
  }
}

// 导出默认实例
export const magnetSearchManager = new MagnetSearchManager();
