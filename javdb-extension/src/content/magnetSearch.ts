// src/content/magnetSearch.ts
// 磁力搜索功能

import { STATE, log } from './state';
import { showToast } from './toast';
import { extractVideoId } from './videoId';
import { defaultHttpClient } from '../services/dataAggregator/httpClient';

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
    torrentz2: boolean;
    custom: string[];
  };
  maxResults: number;
  timeout: number;
}

export class MagnetSearchManager {
  private config: MagnetSearchConfig;
  private searchButton: HTMLElement | null = null;
  private resultsPanel: HTMLElement | null = null;
  private isInitialized = false;
  private currentVideoId: string | null = null;

  constructor(config: Partial<MagnetSearchConfig> = {}) {
    this.config = {
      enabled: true,
      showInlineResults: true,
      showFloatingButton: true,
      autoSearch: false,
      sources: {
        sukebei: true,
        btdig: true,
        torrentz2: false,
        custom: [],
      },
      maxResults: 20,
      timeout: 10000,
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

      this.currentVideoId = extractVideoId();
      
      if (!this.currentVideoId) {
        log('No video ID found, skipping magnet search initialization');
        return;
      }

      // 创建搜索按钮
      if (this.config.showFloatingButton) {
        this.createSearchButton();
      }

      // 创建结果面板
      this.createResultsPanel();

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
   * 创建搜索按钮
   */
  private createSearchButton(): void {
    this.searchButton = document.createElement('button');
    this.searchButton.className = 'magnet-search-button';
    this.searchButton.innerHTML = '🧲 搜索磁力';
    this.searchButton.title = '搜索磁力链接';
    this.searchButton.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      padding: 12px 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      z-index: 9998;
      transition: all 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // 添加悬停效果
    this.searchButton.addEventListener('mouseenter', () => {
      this.searchButton!.style.transform = 'translateY(-2px)';
      this.searchButton!.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
    });

    this.searchButton.addEventListener('mouseleave', () => {
      this.searchButton!.style.transform = 'translateY(0)';
      this.searchButton!.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
    });

    // 添加点击事件
    this.searchButton.addEventListener('click', () => {
      if (this.currentVideoId) {
        this.searchMagnets(this.currentVideoId);
      }
    });

    document.body.appendChild(this.searchButton);
  }

  /**
   * 创建结果面板
   */
  private createResultsPanel(): void {
    this.resultsPanel = document.createElement('div');
    this.resultsPanel.className = 'magnet-results-panel';
    this.resultsPanel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80%;
      max-width: 900px;
      max-height: 80vh;
      background: white;
      border: 1px solid #ddd;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 10002;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: none;
      overflow: hidden;
    `;

    // 创建头部
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    `;

    const title = document.createElement('h3');
    title.textContent = '磁力搜索结果';
    title.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.3s ease;
    `;

    closeBtn.addEventListener('click', () => {
      this.hideResults();
    });

    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.backgroundColor = 'rgba(255,255,255,0.2)';
    });

    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.backgroundColor = 'transparent';
    });

    // 创建内容区域
    const content = document.createElement('div');
    content.className = 'magnet-results-content';
    content.style.cssText = `
      padding: 20px;
      max-height: calc(80vh - 80px);
      overflow-y: auto;
    `;

    header.appendChild(title);
    header.appendChild(closeBtn);
    this.resultsPanel.appendChild(header);
    this.resultsPanel.appendChild(content);

    document.body.appendChild(this.resultsPanel);

    // 点击背景关闭
    this.resultsPanel.addEventListener('click', (e) => {
      if (e.target === this.resultsPanel) {
        this.hideResults();
      }
    });
  }

  /**
   * 搜索磁力链接
   */
  async searchMagnets(videoId: string): Promise<void> {
    if (!this.resultsPanel) return;

    try {
      this.showResults();
      this.showLoading();

      log(`Searching magnets for: ${videoId}`);

      const results: MagnetResult[] = [];
      const searchPromises: Promise<MagnetResult[]>[] = [];

      // 搜索各个源
      if (this.config.sources.sukebei) {
        searchPromises.push(this.searchSukebei(videoId));
      }

      if (this.config.sources.btdig) {
        searchPromises.push(this.searchBtdig(videoId));
      }

      if (this.config.sources.torrentz2) {
        searchPromises.push(this.searchTorrentz2(videoId));
      }

      // 等待所有搜索完成
      const allResults = await Promise.allSettled(searchPromises);
      
      allResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(...result.value);
        } else {
          log(`Search source ${index} failed:`, result.reason);
        }
      });

      // 去重和排序
      const uniqueResults = this.deduplicateResults(results);
      const sortedResults = this.sortResults(uniqueResults);
      const limitedResults = sortedResults.slice(0, this.config.maxResults);

      this.displayResults(limitedResults);

      log(`Found ${limitedResults.length} magnet results`);
    } catch (error) {
      log('Error searching magnets:', error);
      this.showError('搜索失败，请稍后重试');
    }
  }

  /**
   * 搜索Sukebei
   */
  private async searchSukebei(videoId: string): Promise<MagnetResult[]> {
    try {
      const searchUrl = `https://sukebei.nyaa.si/?f=0&c=0_0&q=${encodeURIComponent(videoId)}`;
      const response = await defaultHttpClient.getDocument(searchUrl, {
        timeout: this.config.timeout,
      });

      return this.parseSukebeiResults(response);
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
      const searchUrl = `https://btdig.com/search?q=${encodeURIComponent(videoId)}`;
      const response = await defaultHttpClient.getDocument(searchUrl, {
        timeout: this.config.timeout,
      });

      return this.parseBtdigResults(response);
    } catch (error) {
      log('BTdig search failed:', error);
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
      const rows = doc.querySelectorAll('tbody tr');
      
      rows.forEach(row => {
        const nameElement = row.querySelector('td:nth-child(2) a[title]');
        const magnetElement = row.querySelector('a[href^="magnet:"]');
        const sizeElement = row.querySelector('td:nth-child(4)');
        const dateElement = row.querySelector('td:nth-child(5)');
        const seedersElement = row.querySelector('td:nth-child(6)');
        const leechersElement = row.querySelector('td:nth-child(7)');

        if (nameElement && magnetElement) {
          const name = nameElement.getAttribute('title') || nameElement.textContent?.trim() || '';
          const magnet = (magnetElement as HTMLAnchorElement).href;
          const size = sizeElement?.textContent?.trim() || '';
          const date = dateElement?.textContent?.trim() || '';
          const seeders = parseInt(seedersElement?.textContent?.trim() || '0', 10);
          const leechers = parseInt(leechersElement?.textContent?.trim() || '0', 10);

          results.push({
            name,
            magnet,
            size,
            sizeBytes: this.parseSizeToBytes(size),
            date,
            seeders,
            leechers,
            source: 'Sukebei',
            hasSubtitle: this.detectSubtitle(name),
            quality: this.detectQuality(name),
          });
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
        const magnetElement = item.querySelector('a[href^="magnet:"]');
        const sizeElement = item.querySelector('.torrent_size');
        const dateElement = item.querySelector('.torrent_age');

        if (nameElement && magnetElement) {
          const name = nameElement.textContent?.trim() || '';
          const magnet = (magnetElement as HTMLAnchorElement).href;
          const size = sizeElement?.textContent?.trim() || '';
          const date = dateElement?.textContent?.trim() || '';

          results.push({
            name,
            magnet,
            size,
            sizeBytes: this.parseSizeToBytes(size),
            date,
            source: 'BTdig',
            hasSubtitle: this.detectSubtitle(name),
            quality: this.detectQuality(name),
          });
        }
      });
    } catch (error) {
      log('Error parsing BTdig results:', error);
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
          const name = nameElement.textContent?.trim() || '';
          const href = (nameElement as HTMLAnchorElement).href;
          const infoText = infoElement.textContent?.trim() || '';
          
          // 从info中提取大小和日期
          const sizeMatch = infoText.match(/Size: ([^,]+)/);
          const dateMatch = infoText.match(/Age: ([^,]+)/);
          
          const size = sizeMatch ? sizeMatch[1] : '';
          const date = dateMatch ? dateMatch[1] : '';

          // 构造磁力链接（需要进一步处理）
          const hash = href.split('/').pop();
          const magnet = `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(name)}`;

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
      });
    } catch (error) {
      log('Error parsing Torrentz2 results:', error);
    }

    return results;
  }

  /**
   * 去重结果
   */
  private deduplicateResults(results: MagnetResult[]): MagnetResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = result.magnet.split('&')[0]; // 使用hash部分作为唯一标识
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 排序结果
   */
  private sortResults(results: MagnetResult[]): MagnetResult[] {
    return results.sort((a, b) => {
      // 优先级：有种子数 > 文件大小 > 日期
      if (a.seeders !== undefined && b.seeders !== undefined) {
        return b.seeders - a.seeders;
      }
      
      if (a.sizeBytes !== b.sizeBytes) {
        return b.sizeBytes - a.sizeBytes;
      }
      
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }

  /**
   * 显示结果
   */
  private displayResults(results: MagnetResult[]): void {
    if (!this.resultsPanel) return;

    const content = this.resultsPanel.querySelector('.magnet-results-content');
    if (!content) return;

    if (results.length === 0) {
      content.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
          <div style="font-size: 18px; margin-bottom: 8px;">未找到磁力链接</div>
          <div style="font-size: 14px;">尝试搜索其他关键词或稍后重试</div>
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <div style="margin-bottom: 16px; padding: 12px; background: #f8f9fa; border-radius: 8px;">
        <strong>找到 ${results.length} 个结果</strong>
        <span style="margin-left: 16px; color: #666; font-size: 14px;">
          点击磁力链接复制到剪贴板
        </span>
      </div>
      ${results.map((result, index) => this.createResultItem(result, index)).join('')}
    `;

    // 添加复制事件
    content.querySelectorAll('.magnet-link').forEach(link => {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        const magnet = (e.target as HTMLElement).getAttribute('data-magnet') || '';
        await this.copyMagnet(magnet);
      });
    });
  }

  /**
   * 创建结果项
   */
  private createResultItem(result: MagnetResult, index: number): string {
    const qualityBadge = result.quality ? 
      `<span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px; margin-left: 8px;">${result.quality}</span>` : '';
    
    const subtitleBadge = result.hasSubtitle ? 
      `<span style="background: #17a2b8; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px; margin-left: 4px;">字幕</span>` : '';

    const seedersInfo = result.seeders !== undefined ? 
      `<span style="color: #28a745; margin-left: 8px;">↑${result.seeders}</span>` : '';
    
    const leechersInfo = result.leechers !== undefined ? 
      `<span style="color: #dc3545; margin-left: 4px;">↓${result.leechers}</span>` : '';

    return `
      <div style="
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
        transition: all 0.3s ease;
        cursor: pointer;
      " onmouseenter="this.style.backgroundColor='#f8f9fa'; this.style.borderColor='#007bff';" 
         onmouseleave="this.style.backgroundColor='white'; this.style.borderColor='#e9ecef';">
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div style="flex: 1; margin-right: 16px;">
            <div style="font-weight: 500; color: #333; margin-bottom: 4px; line-height: 1.4;">
              ${this.escapeHtml(result.name)}
              ${qualityBadge}
              ${subtitleBadge}
            </div>
            <div style="font-size: 12px; color: #666;">
              来源: ${result.source} | 大小: ${result.size} | 日期: ${result.date}
              ${seedersInfo}${leechersInfo}
            </div>
          </div>
          <button class="magnet-link" data-magnet="${this.escapeHtml(result.magnet)}" style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            transition: all 0.3s ease;
            white-space: nowrap;
          " onmouseenter="this.style.transform='scale(1.05)';" 
             onmouseleave="this.style.transform='scale(1)';">
            🧲 复制磁力
          </button>
        </div>
      </div>
    `;
  }

  /**
   * 显示加载状态
   */
  private showLoading(): void {
    if (!this.resultsPanel) return;

    const content = this.resultsPanel.querySelector('.magnet-results-content');
    if (!content) return;

    content.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <div style="margin-top: 16px; color: #666;">正在搜索磁力链接...</div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </div>
    `;
  }

  /**
   * 显示错误
   */
  private showError(message: string): void {
    if (!this.resultsPanel) return;

    const content = this.resultsPanel.querySelector('.magnet-results-content');
    if (!content) return;

    content.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #dc3545;">
        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
        <div style="font-size: 18px; margin-bottom: 8px;">搜索失败</div>
        <div style="font-size: 14px;">${message}</div>
      </div>
    `;
  }

  /**
   * 显示结果面板
   */
  private showResults(): void {
    if (this.resultsPanel) {
      this.resultsPanel.style.display = 'block';
    }
  }

  /**
   * 隐藏结果面板
   */
  private hideResults(): void {
    if (this.resultsPanel) {
      this.resultsPanel.style.display = 'none';
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

  private detectSubtitle(name: string): boolean {
    const subtitlePatterns = [
      /字幕/i,
      /subtitle/i,
      /sub/i,
      /中文/i,
      /chinese/i,
      /chs/i,
      /cht/i,
    ];

    return subtitlePatterns.some(pattern => pattern.test(name));
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
    if (this.searchButton) {
      this.searchButton.remove();
      this.searchButton = null;
    }

    if (this.resultsPanel) {
      this.resultsPanel.remove();
      this.resultsPanel = null;
    }

    this.isInitialized = false;
  }
}

// 导出默认实例
export const magnetSearchManager = new MagnetSearchManager();
