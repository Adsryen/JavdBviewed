// src/content/magnetSearch.ts
// 磁力搜索功能

import { log } from './state';
import { showToast } from './toast';
import { extractVideoIdFromPage } from './videoId';
import { defaultHttpClient } from '../services/dataAggregator/httpClient';
import { pushToDrive115ViaCrossDomain, markVideoAsWatched } from './drive115';

// 正则表达式常量
const ZH_REGEX = /中文|字幕|中字|(-|_)c(?!d)/i;
const FC2_REGEX = /^FC2-/i;

/**
 * 解析视频代码，生成匹配正则表达式
 */
function codeParse(code: string): { prefix: string; regex: RegExp } {
  const _ = FC2_REGEX.test(code) ? "|_" : "";
  const parts = code.split("-").map((item, index) => (index ? item.replace(/^0/, "") : item));

  return {
    prefix: parts[0],
    regex: new RegExp(`(?<![a-z])${parts.join(`\\s?(0|-${_}){0,4}\\s?`)}(?!\\d)`, "i"),
  };
}

export interface MagnetResult {
  name: string;
  magnet: string;
  size: string;
  sizeBytes: number;
  date: string;
  seeders?: number;
  leechers?: number;
  source: string;
  quality?: string;
  hasSubtitle: boolean;
}

export interface MagnetSearchConfig {
  enabled: boolean;
  showInlineResults: boolean;
  showFloatingButton: boolean;
  autoSearch: boolean;
  sources: {
    sukebei: boolean;
    btdig: boolean;
    btsow: boolean;
    torrentz2: boolean;
    custom: string[];
  };
  maxResults: number;
  timeout: number;
}

export class MagnetSearchManager {
  private config: MagnetSearchConfig;
  private isInitialized = false;
  private currentVideoId: string | null = null;
  private lastPathname: string = '';

  constructor(config: Partial<MagnetSearchConfig> = {}) {
    this.config = {
      enabled: true,
      showInlineResults: true,
      showFloatingButton: true,
      autoSearch: false,
      sources: {
        sukebei: true,
        btdig: true,
        btsow: true,
        torrentz2: false,
        custom: [],
      },
      maxResults: 20,
      timeout: 15000, // 增加超时时间
      ...config,
    };
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

      // 添加搜索源标签
      this.addSearchSourceTags();

      // 自动搜索
      if (this.config.autoSearch) {
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
   * 在磁力区域添加搜索按钮
   */
  private addSearchButtonToMagnetArea(): void {
    const topMeta = document.querySelector('.top-meta');
    if (!topMeta) return;

    // 检查是否已经添加过按钮
    if (topMeta.querySelector('.magnet-search-btn')) return;

    // 创建搜索按钮
    const searchButton = document.createElement('button');
    searchButton.className = 'button is-info is-outlined is-small magnet-search-btn mb-2';
    searchButton.style.marginLeft = '8px';
    searchButton.innerHTML = '🔍 搜索磁力资源';

    searchButton.addEventListener('click', () => {
      if (this.currentVideoId) {
        searchButton.disabled = true;
        searchButton.innerHTML = '🔍 搜索中...';

        this.searchMagnets(this.currentVideoId).finally(() => {
          searchButton.disabled = false;
          searchButton.innerHTML = '🔍 搜索磁力资源';
        });
      }
    });

    // 添加到top-meta区域
    topMeta.appendChild(searchButton);
  }



  /**
   * 搜索磁力链接
   */
  async searchMagnets(videoId: string): Promise<void> {
    try {
      log(`Searching magnets for: ${videoId}`);

      // 收集所有磁力数据（包括JavDB原生 + 搜索结果）
      const allMagnetResults: MagnetResult[] = [];

      // 1. 首先收集JavDB原生磁力数据
      const javdbMagnets = this.collectJavdbMagnets();
      allMagnetResults.push(...javdbMagnets);
      log(`Collected ${javdbMagnets.length} JavDB native magnets`);

      // 2. 搜索外部源
      const searchSources = [];

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

      log(`Starting search on ${searchSources.length} sources: ${searchSources.map(s => s.name).join(', ')}`);

      // 3. 为每个搜索源添加超时包装
      const createTimeoutPromise = <T>(promise: Promise<T>, timeoutMs: number, sourceName: string): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) => {
            setTimeout(() => {
              reject(new Error(`${sourceName} search timeout after ${timeoutMs}ms`));
            }, timeoutMs);
          })
        ]);
      };

      // 4. 如果没有外部搜索源，直接显示JavDB结果
      if (searchSources.length === 0) {
        log('No external sources configured, displaying JavDB results only');
        this.processAndDisplayAllMagnets(allMagnetResults);
        return;
      }

      // 5. 并行搜索所有外部源，使用Promise.all等待全部完成
      const searchPromises = searchSources.map(source => {
        // 设置搜索中状态
        this.updateSourceTagStatus(source.key, 'searching');

        // 为每个搜索添加10秒超时
        const timeoutPromise = createTimeoutPromise(source.fn(), 10000, source.name);

        return timeoutPromise.then(sourceResults => {
          log(`${source.name} search completed: ${sourceResults.length} results`);
          this.updateSourceTagStatus(source.key, 'success', sourceResults.length);
          return sourceResults;
        }).catch(error => {
          log(`${source.name} search failed:`, error);
          this.updateSourceTagStatus(source.key, 'failed');
          return []; // 返回空数组而不是抛出错误
        });
      });

      // 6. 等待所有搜索完成（包括超时的）
      Promise.all(searchPromises).then(searchResultsArray => {
        // 合并所有搜索结果
        searchResultsArray.forEach(results => {
          allMagnetResults.push(...results);
        });

        log(`All searches completed, total results: ${allMagnetResults.length}`);

        // 统一去重、排序和显示
        this.processAndDisplayAllMagnets(allMagnetResults);
      }).catch(error => {
        // 这个catch理论上不会被触发，因为我们已经在每个promise中处理了错误
        log('Unexpected error in Promise.all:', error);
        this.processAndDisplayAllMagnets(allMagnetResults);
      });
    } catch (error) {
      log('Error searching magnets:', error);
      showToast('搜索磁力链接时发生错误', 'error');
    }
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
      return [];
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
      return [];
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
      return [];
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
      return [];
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
              sizeBytes: this.parseSizeToBytes(size),
              date: this.normalizeDate(date, 'Sukebei'),
              seeders,
              leechers,
              source: 'Sukebei',
              hasSubtitle: this.detectSubtitle(name),
              quality: this.detectQuality(name),
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
              sizeBytes: this.parseSizeToBytes(size),
              date: this.normalizeDate(date, 'BTdig'),
              source: 'BTdig',
              hasSubtitle: this.detectSubtitle(name),
              quality: this.detectQuality(name),
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
              sizeBytes: this.parseSizeToBytes(size),
              date: this.normalizeDate(date, 'BTSOW'),
              source: 'BTSOW',
              hasSubtitle: this.detectSubtitle(name),
              quality: this.detectQuality(name),
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
              sizeBytes: this.parseSizeToBytes(size),
              date,
              source: 'Torrentz2',
              hasSubtitle: this.detectSubtitle(name),
              quality: this.detectQuality(name),
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
   * 去重结果（基于磁力链接hash）
   */
  private deduplicateResults(results: MagnetResult[]): MagnetResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const hash = this.extractHashFromMagnet(result.magnet);
      if (seen.has(hash)) {
        return false;
      }
      seen.add(hash);
      return true;
    });
  }

  /**
   * 排序结果：字幕 > 破解 > 磁力大小 > 磁力时间
   */
  private sortResults(results: MagnetResult[]): MagnetResult[] {
    return results.sort((a, b) => {
      // 1. 优先显示有字幕的
      if (a.hasSubtitle && !b.hasSubtitle) return -1;
      if (!a.hasSubtitle && b.hasSubtitle) return 1;

      // 2. 然后显示破解版（检查名称中是否包含破解相关关键词）
      const aIsCracked = this.isCrackedVersion(a.name);
      const bIsCracked = this.isCrackedVersion(b.name);
      if (aIsCracked && !bIsCracked) return -1;
      if (!aIsCracked && bIsCracked) return 1;

      // 3. 按文件大小排序（大的在前）
      if (a.sizeBytes !== b.sizeBytes) {
        return b.sizeBytes - a.sizeBytes;
      }

      // 4. 按时间排序（新的在前）
      if (a.date && b.date) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }

      // 5. 最后按种子数排序（多的在前）
      return (b.seeders || 0) - (a.seeders || 0);
    });
  }

  /**
   * 检查是否为破解版
   */
  private isCrackedVersion(name: string): boolean {
    const crackKeywords = ['破解', 'crack', 'uncensored', '无码', '無碼', 'leaked'];
    const normalizedName = name.toLowerCase();
    return crackKeywords.some(keyword => normalizedName.includes(keyword.toLowerCase()));
  }

  /**
   * 标准化时间格式
   */
  private normalizeDate(dateStr: string, source: string): string {
    if (!dateStr) return '';

    try {
      // 处理不同来源的时间格式
      switch (source) {
        case 'JavDB':
          // JavDB: "2025-07-13" 格式已经标准
          return dateStr;

        case 'Sukebei':
          // Sukebei: "2025-06-24" 格式已经标准
          return dateStr;

        case 'BTdig':
          // BTdig: "found 3 weeks ago", "found 1 month ago" 等
          return this.parseRelativeDate(dateStr);

        case 'BTSOW':
          // BTSOW: 可能是相对时间或绝对时间
          if (dateStr.includes('ago') || dateStr.includes('found')) {
            return this.parseRelativeDate(dateStr);
          }
          return dateStr;

        default:
          return dateStr;
      }
    } catch (error) {
      log(`Error normalizing date "${dateStr}" from ${source}:`, error);
      return dateStr;
    }
  }

  /**
   * 解析相对时间（如 "found 3 weeks ago"）
   */
  private parseRelativeDate(relativeStr: string): string {
    const now = new Date();
    const lowerStr = relativeStr.toLowerCase();

    try {
      // 提取数字和时间单位
      const match = lowerStr.match(/(\d+)\s*(minute|hour|day|week|month|year)s?\s*ago/);
      if (!match) {
        // 如果无法解析，返回一个较旧的日期
        return '2024-01-01';
      }

      const amount = parseInt(match[1]);
      const unit = match[2];

      // 计算具体日期
      switch (unit) {
        case 'minute':
          now.setMinutes(now.getMinutes() - amount);
          break;
        case 'hour':
          now.setHours(now.getHours() - amount);
          break;
        case 'day':
          now.setDate(now.getDate() - amount);
          break;
        case 'week':
          now.setDate(now.getDate() - (amount * 7));
          break;
        case 'month':
          now.setMonth(now.getMonth() - amount);
          break;
        case 'year':
          now.setFullYear(now.getFullYear() - amount);
          break;
      }

      // 返回 YYYY-MM-DD 格式
      return now.toISOString().split('T')[0];
    } catch (error) {
      log(`Error parsing relative date "${relativeStr}":`, error);
      return '2024-01-01';
    }
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
              sizeBytes: this.parseSizeToBytes(size),
              date: this.normalizeDate(date, 'JavDB'),
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
  private processAndDisplayAllMagnets(allResults: MagnetResult[]): void {
    try {
      log(`Processing ${allResults.length} total magnet results`);

      // 显示来源统计
      const sourceStats: Record<string, number> = {};
      allResults.forEach(result => {
        sourceStats[result.source] = (sourceStats[result.source] || 0) + 1;
      });
      log('Source statistics:', sourceStats);

      // 去重和排序
      const uniqueResults = this.deduplicateResults(allResults);
      const sortedResults = this.sortResults(uniqueResults);
      const limitedResults = sortedResults.slice(0, this.config.maxResults);

      log(`After processing: ${uniqueResults.length} unique, displaying ${limitedResults.length}`);

      // 清空现有磁力列表
      this.clearMagnetList();

      // 重新显示所有磁力数据
      this.displayAllMagnets(limitedResults);

      showToast(`共找到 ${limitedResults.length} 个磁力链接`, 'success');
      log(`Successfully displayed ${limitedResults.length} total magnet results`);
    } catch (error) {
      log('Error processing all magnets:', error);
      showToast('处理磁力数据时发生错误', 'error');
    }
  }

  /**
   * 清空磁力列表
   */
  private clearMagnetList(): void {
    const magnetContent = document.querySelector('#magnets-content');
    if (magnetContent) {
      magnetContent.innerHTML = '';
      log('Cleared existing magnet list');
    }
  }

  /**
   * 显示所有磁力数据（统一样式）
   */
  private displayAllMagnets(results: MagnetResult[]): void {
    const magnetContent = document.querySelector('#magnets-content');
    if (!magnetContent) {
      log('Magnet content area not found');
      return;
    }

    results.forEach((result, index) => {
      try {
        const magnetItem = this.createUnifiedMagnetItem(result, index);
        magnetContent.appendChild(magnetItem);
        log(`Added unified magnet item ${index + 1}: ${result.name.substring(0, 50)}...`);
      } catch (error) {
        log(`Error creating unified magnet item ${index + 1}:`, error);
      }
    });

    log(`Successfully displayed ${results.length} unified magnet items`);
  }

  /**
   * 显示单个搜索源的结果
   */
  private displaySourceResults(results: MagnetResult[], sourceName: string): void {
    try {
      const magnetContent = document.querySelector('#magnets-content');
      if (!magnetContent) {
        log('Magnet content area not found');
        return;
      }

      log(`Displaying ${results.length} results from ${sourceName}`);

      // 将搜索结果添加到现有磁力列表中
      results.forEach((result, index) => {
        try {
          const magnetItem = this.createMagnetItem(result);
          magnetContent.appendChild(magnetItem);
          log(`Added magnet item from ${sourceName} ${index + 1}: ${result.name.substring(0, 50)}...`);
        } catch (error) {
          log(`Error creating magnet item from ${sourceName} ${index + 1}:`, error);
        }
      });

      // 更新总数显示
      this.updateTotalCount();

      showToast(`从 ${sourceName} 找到 ${results.length} 个磁力链接`, 'success');
      log(`Successfully displayed ${results.length} results from ${sourceName}`);
    } catch (error) {
      log(`Error displaying results from ${sourceName}:`, error);
    }
  }

  /**
   * 显示结果到磁力列表区域
   */
  private displayResults(results: MagnetResult[]): void {
    try {
      const magnetContent = document.querySelector('#magnets-content');
      if (!magnetContent) {
        log('Magnet content area not found');
        showToast('磁力链接区域未找到', 'error');
        return;
      }

      if (results.length === 0) {
        log('No magnet results to display');
        showToast('未找到磁力链接', 'info');
        return;
      }

      log(`Displaying ${results.length} magnet results`);

      // 添加搜索结果标识
      this.addSearchResultsHeader(results.length);

      // 将搜索结果添加到现有磁力列表中
      results.forEach((result, index) => {
        try {
          const magnetItem = this.createMagnetItem(result);
          magnetContent.appendChild(magnetItem);
          log(`Added magnet item ${index + 1}: ${result.name.substring(0, 50)}...`);
        } catch (error) {
          log(`Error creating magnet item ${index + 1}:`, error);
        }
      });

      // 更新总数显示
      this.updateTotalCount();

      showToast(`找到 ${results.length} 个磁力链接`, 'success');
      log(`Successfully displayed ${results.length} magnet results`);
    } catch (error) {
      log('Error displaying magnet results:', error);
      showToast('显示磁力链接时发生错误', 'error');
    }
  }

  /**
   * 创建统一样式的磁力项目元素
   */
  private createUnifiedMagnetItem(result: MagnetResult, index: number): HTMLElement {
    // 创建主容器
    const item = document.createElement('div');
    item.className = `item columns is-desktop ${index % 2 === 0 ? '' : 'odd'} privacy-protected`;
    item.setAttribute('data-privacy-protected', 'true');

    // 如果是搜索结果，添加特殊样式
    if (result.source !== 'JavDB') {
      item.style.backgroundColor = 'rgb(248, 249, 250)';
      item.style.borderLeft = '4px solid rgb(0, 123, 255)';
    }

    // 创建磁力名称列 - 使用固定宽度以对齐按钮
    const nameColumn = document.createElement('div');
    nameColumn.className = 'magnet-name column';
    nameColumn.style.width = 'calc(100% - 280px)'; // 为按钮和日期列预留固定空间
    nameColumn.style.minWidth = '300px'; // 确保最小宽度

    const magnetLink = document.createElement('a');
    magnetLink.href = result.magnet;
    magnetLink.title = '右键点击并选择「复制链接地址」';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'name privacy-protected';
    nameSpan.setAttribute('data-privacy-protected', 'true');
    nameSpan.textContent = result.name;
    nameSpan.style.display = 'block';
    nameSpan.style.overflow = 'hidden';
    nameSpan.style.textOverflow = 'ellipsis';
    nameSpan.style.whiteSpace = 'nowrap';
    nameSpan.title = result.name; // 悬停显示完整名称

    const metaSpan = document.createElement('span');
    metaSpan.className = 'meta';
    metaSpan.innerHTML = `<br>${result.size}${result.source !== 'JavDB' ? `, 来源: ${result.source}` : ''}`;

    // 创建标签容器
    const tagsDiv = document.createElement('div');
    tagsDiv.className = 'tags';
    tagsDiv.innerHTML = '<br>';

    // 添加来源标签
    const sourceTag = document.createElement('span');
    sourceTag.className = `tag is-${result.source === 'JavDB' ? 'info' : 'danger'} is-small`;
    sourceTag.textContent = result.source;
    tagsDiv.appendChild(sourceTag);

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
    if (this.isCrackedVersion(result.name)) {
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
    buttonsColumn.className = 'buttons column';
    buttonsColumn.style.width = '200px'; // 固定按钮列宽度
    buttonsColumn.style.flexShrink = '0'; // 防止收缩

    // 复制按钮
    const copyButton = document.createElement('button');
    copyButton.className = 'button is-info is-small';
    copyButton.textContent = '复制';
    copyButton.addEventListener('click', () => this.copyMagnet(result.magnet));

    // 下载按钮（保持JavDB原有样式）
    const downloadButton = document.createElement('a');
    downloadButton.className = 'button is-info is-small';
    downloadButton.href = `https://keepshare.org/aa36p03v/magnet%3A%3Fxt%3Durn%3Abtih%3A${this.extractHashFromMagnet(result.magnet)}`;
    downloadButton.target = '_blank';
    downloadButton.innerHTML = '&nbsp;下载&nbsp;';

    // 115推送按钮
    const push115Button = document.createElement('button');
    push115Button.className = 'button is-success is-small drive115-push-btn';
    push115Button.title = '推送到115网盘离线下载';
    push115Button.style.marginLeft = '5px';
    push115Button.innerHTML = '&nbsp;推送115&nbsp;';
    push115Button.addEventListener('click', () => this.push115(result.magnet, result.name));

    buttonsColumn.appendChild(copyButton);
    buttonsColumn.appendChild(downloadButton);
    buttonsColumn.appendChild(push115Button);

    // 创建日期列 - 固定宽度
    const dateColumn = document.createElement('div');
    dateColumn.className = 'date column';
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
   * 创建磁力项目（与JavDB格式一致）
   */
  private createMagnetItem(result: MagnetResult): HTMLElement {
    const item = document.createElement('div');
    item.className = 'item columns is-desktop';
    item.style.backgroundColor = '#f8f9fa'; // 区分搜索结果
    item.style.borderLeft = '4px solid #007bff'; // 添加蓝色边框标识

    // 创建磁力名称列
    const nameColumn = document.createElement('div');
    nameColumn.className = 'magnet-name column is-four-fifths';

    const magnetLink = document.createElement('a');
    magnetLink.href = result.magnet;
    magnetLink.title = '右键点击并选择「复制链接地址」';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'name';
    nameSpan.textContent = result.name;

    const metaSpan = document.createElement('span');
    metaSpan.className = 'meta';
    metaSpan.innerHTML = `<br>${result.size}, 来源: ${result.source}`;

    // 添加标签
    const tagsDiv = document.createElement('div');
    tagsDiv.className = 'tags';
    tagsDiv.innerHTML = '<br>';

    if (result.quality) {
      const qualityTag = document.createElement('span');
      qualityTag.className = 'tag is-primary is-small is-light';
      qualityTag.textContent = result.quality;
      qualityTag.style.marginRight = '4px';
      tagsDiv.appendChild(qualityTag);
    }

    if (result.hasSubtitle) {
      const subtitleTag = document.createElement('span');
      subtitleTag.className = 'tag is-info is-small is-light';
      subtitleTag.textContent = '字幕';
      tagsDiv.appendChild(subtitleTag);
    }

    magnetLink.appendChild(nameSpan);
    magnetLink.appendChild(metaSpan);
    magnetLink.appendChild(tagsDiv);
    nameColumn.appendChild(magnetLink);

    // 创建按钮列
    const buttonsColumn = document.createElement('div');
    buttonsColumn.className = 'column';

    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.alignItems = 'center';
    buttonContainer.style.gap = '8px';

    // 来源标签（红色）
    const sourceTag = document.createElement('span');
    sourceTag.className = 'tag is-danger is-small';
    sourceTag.textContent = result.source;

    // 复制按钮
    const copyButton = document.createElement('button');
    copyButton.className = 'button is-info is-small';
    copyButton.textContent = '复制';
    copyButton.addEventListener('click', () => this.copyMagnet(result.magnet));

    // 115推送按钮
    const push115Button = document.createElement('button');
    push115Button.className = 'button is-success is-small';
    push115Button.textContent = '推送115';
    push115Button.addEventListener('click', () => this.push115(result.magnet, result.name));

    buttonContainer.appendChild(sourceTag);
    buttonContainer.appendChild(copyButton);
    buttonContainer.appendChild(push115Button);
    buttonsColumn.appendChild(buttonContainer);

    // 创建日期列
    const dateColumn = document.createElement('div');
    dateColumn.className = 'date column';
    const timeSpan = document.createElement('span');
    timeSpan.className = 'time';
    timeSpan.textContent = result.date;
    dateColumn.appendChild(timeSpan);

    item.appendChild(nameColumn);
    item.appendChild(buttonsColumn);
    item.appendChild(dateColumn);

    return item;
  }

  /**
   * 添加搜索源标签到标题区域
   */
  private addSearchSourceTags(): void {
    const topMeta = document.querySelector('.top-meta');
    if (!topMeta) return;

    // 添加动画样式
    this.addSearchTagStyles();

    // 确保有tags容器
    let tagsContainer = topMeta.querySelector('.tags');
    if (!tagsContainer) {
      tagsContainer = document.createElement('div');
      tagsContainer.className = 'tags';
      topMeta.insertBefore(tagsContainer, topMeta.firstChild);
    }

    // 为每个启用的搜索源添加标签
    const sources = [
      { key: 'sukebei', name: 'SUK', enabled: this.config.sources.sukebei },
      { key: 'btdig', name: 'BTD', enabled: this.config.sources.btdig },
      { key: 'btsow', name: 'BTS', enabled: this.config.sources.btsow },
      { key: 'torrentz2', name: 'TZ2', enabled: this.config.sources.torrentz2 }
    ];

    sources.forEach(source => {
      if (!source.enabled) return;

      // 检查是否已经添加过标签
      if (tagsContainer!.querySelector(`#magnet-${source.key}-tag`)) return;

      const tag = document.createElement('span');
      tag.id = `magnet-${source.key}-tag`;
      tag.className = 'tag is-light magnet-search-tag';
      tag.textContent = `${source.name}搜索`;
      tagsContainer!.appendChild(tag);
    });
  }

  /**
   * 更新搜索源标签状态
   */
  private updateSourceTagStatus(sourceKey: string, status: 'searching' | 'success' | 'failed', resultCount?: number): void {
    const tag = document.querySelector(`#magnet-${sourceKey}-tag`) as HTMLElement;
    if (!tag) return;

    const sourceNames: Record<string, string> = {
      'sukebei': 'SUK',
      'btdig': 'BTD',
      'btsow': 'BTS',
      'torrentz2': 'TZ2'
    };

    const sourceName = sourceNames[sourceKey] || sourceKey.toUpperCase();

    // 清除所有状态类
    tag.classList.remove('is-light', 'is-success', 'is-danger', 'is-warning', 'is-loading');

    switch (status) {
      case 'searching':
        tag.classList.add('is-warning');
        tag.innerHTML = `${sourceName}搜索中...`;
        // 添加加载动画效果
        tag.style.animation = 'pulse 1.5s infinite';
        break;
      case 'success':
        tag.classList.add('is-success');
        tag.innerHTML = `${sourceName}✓${resultCount ? `(${resultCount})` : ''}`;
        tag.style.animation = '';
        break;
      case 'failed':
        tag.classList.add('is-danger');
        tag.innerHTML = `${sourceName}✗`;
        tag.style.animation = '';
        break;
    }
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
    `;
    document.head.appendChild(style);
  }





  /**
   * 添加搜索结果标题
   */
  private addSearchResultsHeader(count: number): void {
    const magnetContent = document.querySelector('#magnets-content');
    if (!magnetContent) return;

    // 检查是否已经有搜索结果标题
    const existingHeader = magnetContent.querySelector('.search-results-header');
    if (existingHeader) {
      existingHeader.remove();
    }

    // 创建搜索结果标题
    const header = document.createElement('div');
    header.className = 'search-results-header item columns is-desktop';
    header.style.backgroundColor = '#e3f2fd';
    header.style.borderLeft = '4px solid #2196f3';
    header.style.fontWeight = 'bold';
    header.style.color = '#1976d2';

    header.innerHTML = `
      <div class="column">
        🔍 搜索到 ${count} 个磁力链接 (来自外部搜索源)
      </div>
    `;

    magnetContent.appendChild(header);
  }



  /**
   * 更新总数显示
   */
  private updateTotalCount(): void {
    const totalElement = document.querySelector('#x-total');
    if (totalElement) {
      const magnetItems = document.querySelectorAll('#magnets-content .item:not(.search-results-header)');
      totalElement.textContent = `总数 ${magnetItems.length}`;
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
   * 推送磁力链接到115（使用公共功能）
   */
  private async push115(magnet: string, name: string): Promise<void> {
    try {
      showToast(`正在推送到115: ${name.substring(0, 30)}...`, 'info');
      log(`Pushing to 115: ${name}`);

      // 使用公共的推送115功能
      const result = await pushToDrive115ViaCrossDomain({
        videoId: this.currentVideoId || 'unknown',
        magnetUrl: magnet,
        magnetName: name
      });

      if (result.success) {
        showToast('推送到115成功', 'success');
        log('115推送成功:', result);

        // 推送成功后自动标记为已看
        if (this.currentVideoId && this.currentVideoId !== 'unknown') {
          try {
            await markVideoAsWatched(this.currentVideoId);
            showToast(`${this.currentVideoId} 已自动标记为已看`, 'info');
          } catch (error) {
            console.warn('自动标记已看失败:', error);
            showToast('推送成功，但自动标记已看失败', 'info');
          }
        }
      } else {
        throw new Error(result.error || '推送失败');
      }
    } catch (error) {
      log('Error pushing to 115:', error);
      showToast(`推送到115失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
    }
  }





  // 辅助方法

  private parseSizeToBytes(sizeStr: string): number {
    const match = sizeStr.match(/([0-9.]+)\s*(B|KB|MB|GB|TB)/i);
    if (!match) return 0;

    const size = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    const multipliers: Record<string, number> = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024,
    };

    return size * (multipliers[unit] || 0);
  }

  private detectQuality(name: string): string | undefined {
    const qualityPatterns = [
      { pattern: /4K|2160p/i, quality: '4K' },
      { pattern: /1080p/i, quality: '1080p' },
      { pattern: /720p/i, quality: '720p' },
      { pattern: /480p/i, quality: '480p' },
    ];

    for (const { pattern, quality } of qualityPatterns) {
      if (pattern.test(name)) {
        return quality;
      }
    }

    return undefined;
  }

  /**
   * 验证搜索结果是否匹配视频ID
   */
  private isValidResult(name: string, videoId: string): boolean {
    if (!name || !videoId) return false;

    try {
      const normalizedName = name.toUpperCase();
      const normalizedVideoId = videoId.toUpperCase();

      // 简化匹配逻辑：只检查是否包含视频ID
      const isMatch = normalizedName.includes(normalizedVideoId);
      log(`Validating result: "${name}" contains "${videoId}": ${isMatch}`);

      return isMatch;
    } catch (error) {
      log('Error validating result:', error);
      // 如果匹配失败，返回true以便调试
      return true;
    }
  }





  /**
   * 从磁力链接提取hash
   */
  private extractHashFromMagnet(magnet: string): string {
    const match = magnet.match(/xt=urn:btih:([a-fA-F0-9]{40})/);
    return match ? match[1].toLowerCase() : magnet;
  }

  private detectSubtitle(name: string): boolean {
    return ZH_REGEX.test(name);
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
