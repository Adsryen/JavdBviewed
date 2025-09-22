// src/content/contentFilter.ts
// 内容过滤系统

import { STATE, log } from './state';
import { showToast } from './toast';
import { VIDEO_STATUS } from '../utils/config';

export interface KeywordFilterRule {
  id: string;
  name: string;
  keyword: string;
  isRegex: boolean;
  caseSensitive: boolean;
  action: 'hide' | 'highlight' | 'blur' | 'mark';
  enabled: boolean;
  fields: ('title' | 'actor' | 'studio' | 'genre' | 'tag' | 'video-id')[];
  style?: {
    backgroundColor?: string;
    color?: string;
    border?: string;
    opacity?: number;
    filter?: string;
  };
  message?: string;
}

export interface ContentFilterConfig {
  enabled: boolean;
  showFilteredCount: boolean;
  keywordRules: KeywordFilterRule[];
}

export class ContentFilterManager {
  private config: ContentFilterConfig;
  private filteredElements: Map<HTMLElement, KeywordFilterRule> = new Map();
  private observer: MutationObserver | null = null;
  private isInitialized = false;
  private filterStats = {
    hidden: 0,
    highlighted: 0,
    blurred: 0,
    marked: 0,
  };
  private lastApplyTime = 0; // 防止重复应用
  private isApplyingFilters = false; // 防止无限循环

  constructor(config: Partial<ContentFilterConfig> = {}) {
    this.config = {
      enabled: true,
      showFilteredCount: true,
      keywordRules: [],
      ...config,
    };
  }

  /**
   * 初始化关键字过滤系统
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled || this.isInitialized) {
      return;
    }

    try {
      log('Initializing keyword filter system...');

      // 清理之前的观察器（防止重复初始化）
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }

      // 加载默认关键字规则
      this.loadDefaultKeywordRules();

      // 应用过滤规则
      this.applyFilters();

      // 监听页面变化
      this.observePageChanges();

      // 显示过滤统计
      if (this.config.showFilteredCount) {
        this.showFilterStats();
      }

      this.isInitialized = true;
      log('Keyword filter system initialized');
    } catch (error) {
      log('Error initializing keyword filter:', error);
    }
  }

  /**
   * 加载默认关键字过滤规则
   */
  private loadDefaultKeywordRules(): void {
    // 从配置中加载已保存的规则
    // 规则现在通过设置页面管理，这里只需要确保规则已加载
    log(`Loaded ${this.config.keywordRules.length} keyword filter rules`);
  }

  /**
   * 应用过滤规则
   */
  private applyFilters(): void {
    try {
      // 防止无限循环
      if (this.isApplyingFilters) {
        return;
      }

      // 防止短时间内重复应用
      const now = Date.now();
      if (now - this.lastApplyTime < 1000) { // 1秒内不重复应用
        return;
      }
      this.lastApplyTime = now;
      this.isApplyingFilters = true;

      // 检查是否在详情页，如果是则不应用过滤器
      if (this.isDetailPage()) {
        log('Content filter skipped: on detail page');
        // 清理详情页可能存在的过滤效果
        this.clearDetailPageFilters();
        return;
      }

      // 重置统计
      this.filterStats = { hidden: 0, highlighted: 0, blurred: 0, marked: 0 };

      // 查找所有视频项目
      const videoItems = this.findVideoItems();

      // 简化日志输出
      const activeRules = this.config.keywordRules.filter(r => r.enabled);
      if (activeRules.length > 0) {
        log(`Content filter: ${activeRules.length} active rules, ${videoItems.length} items`);
      }

      videoItems.forEach(item => {
        this.applyFiltersToItem(item);
      });

      log(`Applied filters to ${videoItems.length} items (hidden: ${this.filterStats.hidden}, highlighted: ${this.filterStats.highlighted})`);
    } catch (error) {
      log('Error applying filters:', error);
    } finally {
      // 重置标志，允许下次应用
      this.isApplyingFilters = false;
    }
  }

  /**
   * 对单个项目应用关键字过滤规则
   */
  private applyFiltersToItem(item: HTMLElement): void {
    try {
      // 检查是否已经处理过
      if (item.hasAttribute('data-filter-processed')) {
        return;
      }

      // 检查是否应该被默认功能隐藏
      const shouldBeHiddenByDefault = this.shouldBeHiddenByDefault(item);

      // 清除之前的过滤效果（但保留默认隐藏状态）
      this.clearItemFilters(item, shouldBeHiddenByDefault);

      // 如果元素应该被默认功能隐藏，不应用智能过滤规则
      if (shouldBeHiddenByDefault) {
        item.setAttribute('data-hidden-by-default', 'true');
        item.setAttribute('data-filter-processed', 'true');
        return;
      }

      // 提取项目信息
      const itemData = this.extractItemData(item);

      // 简化调试：只在需要时输出
      // if (this.filterStats.hidden + this.filterStats.highlighted < 3) {
      //   log(`Item ${this.filterStats.hidden + this.filterStats.highlighted + 1} data:`, itemData);
      // }

      // 应用启用的关键字规则
      const enabledRules = this.config.keywordRules.filter(rule => rule.enabled);

      // 应用匹配的规则
      for (const rule of enabledRules) {
        if (this.evaluateKeywordRule(rule, itemData)) {
          log(`Applying rule "${rule.name}" (${rule.action}) to item: ${itemData.title}`);
          this.applyRuleAction(item, rule);
          this.filteredElements.set(item, rule);
          break; // 只应用第一个匹配的规则
        }
      }

      // 标记为已处理
      item.setAttribute('data-filter-processed', 'true');
    } catch (error) {
      log('Error applying filters to item:', error);
    }
  }

  /**
   * 检查是否在详情页
   */
  private isDetailPage(): boolean {
    // 检查URL是否为详情页格式 (/v/xxx)
    const isDetailUrl = /\/v\/[^\/]+/.test(window.location.pathname);

    // 检查页面是否有详情页特有的元素
    const hasDetailElements = !!(
      document.querySelector('.movie-panel-info') ||
      document.querySelector('.video-detail') ||
      document.querySelector('.movie-info') ||
      document.querySelector('.preview-images') ||
      document.querySelector('.tile-images') ||
      document.querySelector('[href^="magnet:"]')
    );

    return isDetailUrl || hasDetailElements;
  }

  /**
   * 清理详情页的过滤效果
   */
  private clearDetailPageFilters(): void {
    try {
      // 查找所有可能被过滤的元素
      const filteredElements = document.querySelectorAll('[data-filter-applied], .content-filter-highlighted, .content-filter-hidden, .content-filter-blurred, .content-filter-marked');

      filteredElements.forEach(element => {
        const htmlElement = element as HTMLElement;

        // 移除过滤相关的类
        htmlElement.classList.remove('content-filter-highlighted', 'content-filter-hidden', 'content-filter-blurred', 'content-filter-marked');

        // 移除过滤相关的属性
        htmlElement.removeAttribute('data-filter-applied');
        htmlElement.removeAttribute('data-filtered-by');
        htmlElement.removeAttribute('data-filter-type');
        htmlElement.removeAttribute('data-filter-processed');

        // 清理样式
        const stylesToClear = ['backgroundColor', 'border', 'borderRadius', 'boxShadow', 'transform', 'transition', 'filter', 'opacity', 'display'];
        stylesToClear.forEach(style => {
          htmlElement.style.removeProperty(style);
        });
      });

      log(`Cleared filter effects from ${filteredElements.length} elements on detail page`);
    } catch (error) {
      log('Error clearing detail page filters:', error);
    }
  }

  /**
   * 查找视频项目元素
   */
  private findVideoItems(): HTMLElement[] {
    // 仅选择具体的卡片元素，避免误选列表容器
    const selectors = [
      '.movie-list .item',
      '.video-list .item',
      '.movie-item',
      '.video-item',
      '.item',
      '.grid-item'
    ];

    const items: HTMLElement[] = [];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(node => {
        let el = node as HTMLElement;

        // 如果命中的是容器，跳过
        if (el.matches('.movie-list, .video-list, .videos, .movies, .list, .grid, .grid-list')) {
          return;
        }

        // 如果命中的是子元素，提升到最近的卡片元素
        const card = el.closest('.item, .movie-item, .video-item, .grid-item') as HTMLElement || el;

        // 如果卡片本身仍是容器（极端情况），跳过
        if (card.matches('.movie-list, .video-list, .videos, .movies, .list, .grid, .grid-list')) {
          return;
        }

        // 仅当确认为视频卡片，且不包含其它卡片（避免对容器应用样式）
        if (this.isVideoItem(card)) {
          items.push(card);
        }
      });
    });

    // 去重
    return Array.from(new Set(items));
  }

  /**
   * 判断是否为视频项目
   */
  private isVideoItem(element: HTMLElement): boolean {
    // 明确排除列表/网格容器
    if (element.matches('.movie-list, .video-list, .videos, .movies, .list, .grid, .grid-list')) {
      return false;
    }

    // 必须是卡片类或其本身有链接到详情页
    const isCardClass = element.matches('.item, .movie-item, .video-item, .grid-item');
    const hasLink = !!element.querySelector('a[href*="/v/"], a[href*="/movie/"]');

    // 若该元素内部仍包含其它卡片，视为容器而非单个卡片
    const containsCards = !!element.querySelector('.item, .movie-item, .video-item, .grid-item');

    if (containsCards) {
      return false;
    }

    // 简化条件：是卡片类，或具备到详情页的链接
    return isCardClass || hasLink;
  }

  /**
   * 提取项目数据
   */
  private extractItemData(item: HTMLElement): Record<string, string> {
    const data: Record<string, string> = {};

    try {
      // 提取标题 - JavDB列表页结构分析
      // 在JavDB列表页，标题信息通常在以下位置：
      // 1. a[title] 属性中包含完整标题
      // 2. .video-title 中的文本内容
      // 3. 链接的title属性

      let titleText = '';

      // 方法1: 从链接的title属性获取（最可靠）
      const linkWithTitle = item.querySelector('a[title]');
      if (linkWithTitle) {
        titleText = linkWithTitle.getAttribute('title')?.trim() || '';
        if (titleText && titleText.length > 10) {
          data.title = titleText;
        }
      }

      // 方法2: 如果没有找到，尝试从data-title属性获取
      if (!data.title) {
        const elementWithDataTitle = item.querySelector('[data-title]');
        if (elementWithDataTitle) {
          titleText = elementWithDataTitle.getAttribute('data-title')?.trim() || '';
          if (titleText && titleText.length > 10) {
            data.title = titleText;
          }
        }
      }

      // 方法3: 从.video-title或类似容器获取
      if (!data.title) {
        const titleSelectors = [
          '.video-title',
          '.movie-title',
          '.item-title',
          '.title'
        ];

        for (const selector of titleSelectors) {
          const titleElement = item.querySelector(selector);
          if (titleElement) {
            titleText = titleElement.textContent?.trim() || '';
            // 过滤掉看起来像番号的文本（通常是字母+数字的组合）
            if (titleText && titleText.length > 10 && !titleText.match(/^[A-Z]+-\d+$/)) {
              data.title = titleText;
              break;
            }
          }
        }
      }

      // 方法4: 智能文本提取 - 从所有文本中找到最像标题的内容
      if (!data.title) {
        const allText = item.textContent?.trim() || '';
        const lines = allText.split('\n').map(line => line.trim()).filter(Boolean);

        for (const line of lines) {
          // 跳过番号格式的文本
          if (line.match(/^[A-Z]+-\d+$/)) continue;
          // 跳过纯数字
          if (line.match(/^\d+$/)) continue;
          // 跳过太短的文本
          if (line.length < 10) continue;
          // 跳过太长的文本（可能是描述）
          if (line.length > 200) continue;
          // 跳过包含特殊标记的文本
          if (line.includes('含磁鏈') || line.includes('今日新種')) continue;

          // 找到合适的标题
          data.title = line;
          break;
        }
      }

      // 如果仍然没有找到，至少记录番号作为标识
      if (!data.title) {
        const codeElement = item.querySelector('.video-title strong:first-child, .code, .video-code');
        if (codeElement) {
          const code = codeElement.textContent?.trim();
          if (code) {
            data['video-code'] = code;
            // 临时使用番号，但标记为需要改进
            data.title = `[${code}] - 标题提取失败`;
          }
        }
      }

      // 提取视频ID
      const linkElement = item.querySelector('a[href*="/v/"], a[href*="/movie/"]');
      if (linkElement) {
        const href = (linkElement as HTMLAnchorElement).href;
        const match = href.match(/\/v\/([^\/\?]+)/);
        if (match) {
          data['video-id'] = match[1];
        }
        data.url = href;
      }

      // 提取演员信息
      const actorElements = item.querySelectorAll('.actor, .cast, .performer');
      if (actorElements.length > 0) {
        data.actor = Array.from(actorElements)
          .map(el => el.textContent?.trim())
          .filter(Boolean)
          .join(', ');
      }

      // 提取制作商
      const studioElement = item.querySelector('.studio, .maker');
      if (studioElement) {
        data.studio = studioElement.textContent?.trim() || '';
      }

      // 提取类别/标签
      const genreElements = item.querySelectorAll('.genre, .tag, .category');
      if (genreElements.length > 0) {
        data.genre = Array.from(genreElements)
          .map(el => el.textContent?.trim())
          .filter(Boolean)
          .join(', ');
      }

    } catch (error) {
      log('Error extracting item data:', error);
    }

    // 简化调试：只在标题提取失败时输出警告
    if (!data.title || data.title.includes('标题提取失败')) {
      log('Warning: Title extraction failed for item');
    }

    return data;
  }

  /**
   * 清除项目的过滤效果
   */
  private clearItemFilters(item: HTMLElement, shouldBeHiddenByDefault: boolean = false): void {
    // 恢复显示状态 - 但要考虑默认隐藏功能
    if (!shouldBeHiddenByDefault) {
      item.style.display = '';
      item.removeAttribute('data-hidden-by-default');
    } else {
      // 保持默认隐藏状态
      item.style.display = 'none';
      item.setAttribute('data-hidden-by-default', 'true');
    }

    // 清除智能过滤相关的样式
    item.style.backgroundColor = '';
    item.style.color = '';
    item.style.border = '';
    item.style.opacity = '';
    item.style.filter = '';

    // 移除智能过滤相关的CSS类
    item.classList.remove('content-filter-marked', 'content-filter-hidden', 'content-filter-highlighted', 'content-filter-blurred');

    // 移除智能过滤相关的属性
    item.removeAttribute('data-filter-applied');
    item.removeAttribute('data-filtered-by');
    item.removeAttribute('data-filter-type');
    item.removeAttribute('data-hidden-by-filter');
    item.removeAttribute('data-filter-processed');

    // 移除过滤消息
    const filterMessage = item.querySelector('.filter-message');
    if (filterMessage) {
      filterMessage.remove();
    }
  }

  /**
   * 评估关键字过滤规则
   */
  private evaluateKeywordRule(rule: KeywordFilterRule, itemData: Record<string, string>): boolean {
    try {
      // 检查指定字段中是否有匹配的关键字
      for (const field of rule.fields) {
        const fieldValue = itemData[field] || '';
        const isMatch = this.matchKeyword(rule.keyword, fieldValue, rule.isRegex, rule.caseSensitive);

        // 只在匹配成功时输出日志
        if (isMatch) {
          log(`✓ Rule "${rule.name}" matched: "${rule.keyword}" in ${field}="${fieldValue}"`);
        }

        if (isMatch) {
          return true;
        }
      }
      return false;
    } catch (error) {
      log('Error evaluating keyword rule:', error);
      return false;
    }
  }

  /**
   * 匹配关键字
   */
  private matchKeyword(keyword: string, text: string, isRegex: boolean, caseSensitive: boolean): boolean {
    try {
      if (isRegex) {
        const flags = caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(keyword, flags);
        return regex.test(text);
      } else {
        const searchText = caseSensitive ? text : text.toLowerCase();
        const searchKeyword = caseSensitive ? keyword : keyword.toLowerCase();
        return searchText.includes(searchKeyword);
      }
    } catch (error) {
      log('Error matching keyword:', error);
      return false;
    }
  }



  /**
   * 应用规则动作
   */
  private applyRuleAction(item: HTMLElement, rule: KeywordFilterRule): void {
    switch (rule.action) {
      case 'hide':
        // 只有在不被默认功能隐藏的情况下才应用智能过滤隐藏
        if (!item.hasAttribute('data-hidden-by-default')) {
          item.style.display = 'none';
          item.classList.add('content-filter-hidden');
          item.setAttribute('data-filter-applied', 'hide');
          item.setAttribute('data-hidden-by-filter', 'true');
          this.filterStats.hidden++;
        }
        break;

      case 'highlight':
        // 应用自定义样式或默认高亮样式
        if (rule.style) {
          Object.assign(item.style, rule.style);
        } else {
          // 默认高亮样式 - 明显的黄色背景和边框
          item.style.backgroundColor = '#fff3cd';
          item.style.border = '3px solid #ffc107';
          item.style.borderRadius = '8px';
          item.style.boxShadow = '0 4px 12px rgba(255, 193, 7, 0.3)';
          item.style.transform = 'scale(1.02)';
          item.style.transition = 'all 0.3s ease';
        }
        // 添加CSS类以便于识别
        item.classList.add('content-filter-highlighted');
        item.setAttribute('data-filter-applied', 'highlight');
        this.filterStats.highlighted++;
        break;

      case 'blur':
        item.style.filter = rule.style?.filter || 'blur(5px)';
        if (rule.style?.opacity !== undefined) {
          item.style.opacity = rule.style.opacity.toString();
        } else {
          item.style.opacity = '0.6';
        }
        item.classList.add('content-filter-blurred');
        item.setAttribute('data-filter-applied', 'blur');
        this.filterStats.blurred++;
        break;

      case 'mark':
        if (rule.style) {
          Object.assign(item.style, rule.style);
        } else {
          // 默认标记样式 - 红色边框
          item.style.border = '2px solid #dc3545';
          item.style.borderRadius = '6px';
        }
        item.classList.add('content-filter-marked');
        item.setAttribute('data-filter-applied', 'mark');
        if (rule.message) {
          this.addFilterMessage(item, rule.message);
        }
        this.filterStats.marked++;
        break;
    }

    // 添加过滤标记
    item.setAttribute('data-filtered-by', rule.id);
    item.setAttribute('data-filter-type', rule.action);
  }

  /**
   * 添加过滤消息
   */
  private addFilterMessage(item: HTMLElement, message: string): void {
    const messageElement = document.createElement('div');
    messageElement.className = 'filter-message';
    messageElement.textContent = message;
    messageElement.style.cssText = `
      position: absolute;
      top: 5px;
      right: 5px;
      background: rgba(255, 193, 7, 0.9);
      color: #333;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 12px;
      z-index: 10;
    `;

    // 确保父元素有相对定位
    if (getComputedStyle(item).position === 'static') {
      item.style.position = 'relative';
    }

    item.appendChild(messageElement);
  }

  /**
   * 检查元素是否应该被默认功能隐藏
   * 复制 itemProcessor.ts 中的逻辑以保持一致性
   */
  private shouldBeHiddenByDefault(item: HTMLElement): boolean {
    // 首先检查是否已经有默认隐藏标记
    if (item.hasAttribute('data-hidden-by-default')) {
      return true;
    }

    if (!STATE.settings || STATE.isSearchPage) {
      return false;
    }

    // 提取视频ID
    const videoId = this.extractVideoId(item);
    if (!videoId) {
      return false;
    }

    // 检查VR隐藏设置
    if (STATE.settings.display.hideVR) {
      // 检查VR标签
      const vrTag = item.querySelector('.tag.is-link');
      const isVR = vrTag?.textContent?.trim() === 'VR';

      // 检查data-title属性中是否包含VR标识
      const dataTitleElement = item.querySelector('div.video-title > span.x-btn');
      const dataTitle = dataTitleElement?.getAttribute('data-title') || '';
      const isVRInDataTitle = dataTitle.includes('【VR】');

      if (isVR || isVRInDataTitle) {
        return true;
      }
    }

    // 检查已看过和已浏览的隐藏设置
    const { hideViewed, hideBrowsed } = STATE.settings.display;
    const record = STATE.records[videoId];

    if (!record) {
      return false;
    }

    const isViewed = record.status === VIDEO_STATUS.VIEWED;
    const isBrowsed = record.status === VIDEO_STATUS.BROWSED;

    if (hideViewed && isViewed) {
      return true;
    }
    if (hideBrowsed && isBrowsed) {
      return true;
    }

    return false;
  }

  /**
   * 从项目元素中提取视频ID
   */
  private extractVideoId(item: HTMLElement): string | null {
    try {
      // 尝试从链接href中提取
      const link = item.querySelector('a[href*="/v/"]') as HTMLAnchorElement;
      if (link) {
        const match = link.href.match(/\/v\/([^/?]+)/);
        if (match) {
          return match[1];
        }
      }

      // 尝试从data-code属性中提取
      const codeElement = item.querySelector('[data-code]');
      if (codeElement) {
        return codeElement.getAttribute('data-code');
      }

      return null;
    } catch (error) {
      log('Error extracting video ID:', error);
      return null;
    }
  }





  /**
   * 添加关键字规则
   */
  addKeywordRule(keyword: string, action: 'hide' | 'highlight', isRegex: boolean, caseSensitive: boolean): void {
    const rule: KeywordFilterRule = {
      id: `keyword-${action}-${Date.now()}`,
      name: `${action === 'hide' ? '隐藏' : '高亮'}: ${keyword}`,
      keyword,
      isRegex,
      caseSensitive,
      action,
      enabled: true,
      fields: ['title', 'actor', 'studio', 'video-id'],
    };

    if (action === 'highlight') {
      rule.style = {
        backgroundColor: '#fff3cd',
        border: '2px solid #ffc107',
      };
    }

    this.config.keywordRules.push(rule);
  }

  /**
   * 重置过滤器
   */
  resetFilters(): void {
    // 清除所有关键字规则
    this.config.keywordRules = [];

    // 清除所有过滤效果
    this.clearAllFilters();

    this.showFilterStats();
    showToast('关键字过滤已重置', 'info');
  }

  /**
   * 清除所有过滤效果
   */
  private clearAllFilters(): void {
    this.filteredElements.forEach((_, element) => {
      // 检查是否应该被默认功能隐藏
      const shouldBeHiddenByDefault = this.shouldBeHiddenByDefault(element);

      // 恢复显示状态 - 但要考虑默认隐藏功能
      if (!shouldBeHiddenByDefault) {
        element.style.display = '';
        element.removeAttribute('data-hidden-by-default');
      } else {
        // 保持默认隐藏状态
        element.style.display = 'none';
        element.setAttribute('data-hidden-by-default', 'true');
      }

      // 清除智能过滤相关的样式
      element.style.backgroundColor = '';
      element.style.color = '';
      element.style.border = '';
      element.style.opacity = '';
      element.style.filter = '';

      // 移除智能过滤相关的类和属性
      element.classList.remove('content-filter-marked', 'content-filter-hidden', 'content-filter-highlighted', 'content-filter-blurred');
      element.removeAttribute('data-filtered-by');
      element.removeAttribute('data-filter-type');
      element.removeAttribute('data-filter-applied');
      element.removeAttribute('data-hidden-by-filter');
      element.removeAttribute('data-filter-processed');

      // 移除过滤消息
      const message = element.querySelector('.filter-message');
      if (message) {
        message.remove();
      }
    });

    this.filteredElements.clear();
  }

  /**
   * 显示过滤统计
   */
  private showFilterStats(): void {
    if (!this.config.showFilteredCount) return;

    const total = this.filterStats.hidden + this.filterStats.highlighted + 
                 this.filterStats.blurred + this.filterStats.marked;

    if (total > 0) {
      const message = `过滤: 隐藏${this.filterStats.hidden} 高亮${this.filterStats.highlighted} 模糊${this.filterStats.blurred} 标记${this.filterStats.marked}`;
      showToast(message, 'info');
    }
  }

  /**
   * 监听页面变化
   */
  private observePageChanges(): void {
    this.observer = new MutationObserver((mutations) => {
      // 检查是否有新的视频项目添加
      let hasNewVideoItems = false;

      for (let m = 0; m < mutations.length; m++) {
        const mutation = mutations[m];
        if (mutation.type === 'childList') {
          const added = mutation.addedNodes;
          for (let i = 0; i < added.length; i++) {
            const node = added[i];
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              // 只有当添加的元素可能是视频项目时才重新应用过滤
              if (element.classList.contains('item') ||
                  element.classList.contains('movie-item') ||
                  element.classList.contains('video-item') ||
                  element.querySelector('.item, .movie-item, .video-item')) {
                hasNewVideoItems = true;
                break;
              }
            }
          }
        }
        if (hasNewVideoItems) break;
      }

      if (hasNewVideoItems) {
        // 延迟应用过滤，避免频繁操作
        setTimeout(() => {
          this.applyFilters();
        }, 500);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      // 不监听属性变化，减少触发频率
      attributes: false,
      characterData: false,
    });
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ContentFilterConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.isInitialized) {
      // 重新应用过滤规则
      this.clearAllFilters();
      this.applyFilters();
    }
  }

  /**
   * 更新关键字规则
   */
  updateKeywordRules(keywordRules: KeywordFilterRule[]): void {
    this.config.keywordRules = keywordRules;

    if (this.isInitialized) {
      // 重新应用过滤规则
      this.clearAllFilters();
      this.applyFilters();
      log(`Updated ${keywordRules.length} keyword filter rules`);
    }
  }

  /**
   * 销毁过滤系统
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.clearAllFilters();
    this.isInitialized = false;
    this.isApplyingFilters = false; // 重置标志
  }
}

// 导出默认实例
export const contentFilterManager = new ContentFilterManager();
