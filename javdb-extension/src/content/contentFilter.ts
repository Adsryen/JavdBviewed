// src/content/contentFilter.ts
// 内容过滤系统

import { STATE, log } from './state';
import { showToast } from './toast';

export interface FilterRule {
  id: string;
  name: string;
  type: 'hide' | 'highlight' | 'blur' | 'mark';
  enabled: boolean;
  conditions: FilterCondition[];
  action: FilterAction;
  priority: number;
}

export interface FilterCondition {
  field: 'title' | 'actor' | 'studio' | 'genre' | 'tag' | 'video-id' | 'url';
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex' | 'not-contains';
  value: string;
  caseSensitive: boolean;
}

export interface FilterAction {
  type: 'hide' | 'highlight' | 'blur' | 'mark';
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
  enableQuickFilters: boolean;
  rules: FilterRule[];
  quickFilters: {
    hideViewed: boolean;
    hideVR: boolean;
    hideFC2: boolean;
    hideUncensored: boolean;
  };
}

export class ContentFilterManager {
  private config: ContentFilterConfig;
  private filteredElements: Map<HTMLElement, FilterRule> = new Map();
  private observer: MutationObserver | null = null;
  private isInitialized = false;
  private filterStats = {
    hidden: 0,
    highlighted: 0,
    blurred: 0,
    marked: 0,
  };

  constructor(config: Partial<ContentFilterConfig> = {}) {
    this.config = {
      enabled: true,
      showFilteredCount: true,
      enableQuickFilters: true,
      rules: [],
      quickFilters: {
        hideViewed: false,
        hideVR: false,
        hideFC2: false,
        hideUncensored: false,
      },
      ...config,
    };
  }

  /**
   * 初始化内容过滤系统
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled || this.isInitialized) {
      return;
    }

    try {
      log('Initializing content filter system...');

      // 加载默认规则
      this.loadDefaultRules();

      // 应用过滤规则
      this.applyFilters();

      // 创建快速过滤器UI
      if (this.config.enableQuickFilters) {
        this.createQuickFiltersUI();
      }

      // 监听页面变化
      this.observePageChanges();

      // 显示过滤统计
      if (this.config.showFilteredCount) {
        this.showFilterStats();
      }

      this.isInitialized = true;
      log('Content filter system initialized');
    } catch (error) {
      log('Error initializing content filter:', error);
    }
  }

  /**
   * 加载默认过滤规则
   */
  private loadDefaultRules(): void {
    const defaultRules: FilterRule[] = [
      {
        id: 'hide-viewed',
        name: '隐藏已观看',
        type: 'hide',
        enabled: this.config.quickFilters.hideViewed,
        conditions: [{
          field: 'video-id',
          operator: 'contains',
          value: '', // 将在运行时检查STATE.records
          caseSensitive: false,
        }],
        action: { type: 'hide' },
        priority: 1,
      },
      {
        id: 'hide-vr',
        name: '隐藏VR内容',
        type: 'hide',
        enabled: this.config.quickFilters.hideVR,
        conditions: [{
          field: 'title',
          operator: 'regex',
          value: '\\b(VR|SIVR|DSVR|KMPVR)\\b',
          caseSensitive: false,
        }],
        action: { type: 'hide' },
        priority: 2,
      },
      {
        id: 'hide-fc2',
        name: '隐藏FC2内容',
        type: 'hide',
        enabled: this.config.quickFilters.hideFC2,
        conditions: [{
          field: 'video-id',
          operator: 'regex',
          value: '^(FC2|\\d{6,7})[-_]',
          caseSensitive: false,
        }],
        action: { type: 'hide' },
        priority: 3,
      },
      {
        id: 'hide-uncensored',
        name: '隐藏无码内容',
        type: 'hide',
        enabled: this.config.quickFilters.hideUncensored,
        conditions: [{
          field: 'video-id',
          operator: 'regex',
          value: '^(CARIB|1PONDO|HEYZO|PACOPACOMAMA)',
          caseSensitive: false,
        }],
        action: { type: 'hide' },
        priority: 4,
      },
      {
        id: 'highlight-new',
        name: '高亮新内容',
        type: 'highlight',
        enabled: true,
        conditions: [{
          field: 'title',
          operator: 'contains',
          value: '新作',
          caseSensitive: false,
        }],
        action: {
          type: 'highlight',
          style: {
            backgroundColor: '#fff3cd',
            border: '2px solid #ffc107',
          },
        },
        priority: 5,
      },
    ];

    // 合并用户自定义规则
    this.config.rules = [...defaultRules, ...this.config.rules];
  }

  /**
   * 应用过滤规则
   */
  private applyFilters(): void {
    try {
      // 重置统计
      this.filterStats = { hidden: 0, highlighted: 0, blurred: 0, marked: 0 };

      // 查找所有视频项目
      const videoItems = this.findVideoItems();
      
      videoItems.forEach(item => {
        this.applyFiltersToItem(item);
      });

      log(`Applied filters to ${videoItems.length} items`);
    } catch (error) {
      log('Error applying filters:', error);
    }
  }

  /**
   * 对单个项目应用过滤规则
   */
  private applyFiltersToItem(item: HTMLElement): void {
    try {
      // 提取项目信息
      const itemData = this.extractItemData(item);
      
      // 按优先级排序规则
      const sortedRules = this.config.rules
        .filter(rule => rule.enabled)
        .sort((a, b) => a.priority - b.priority);

      // 应用匹配的规则
      for (const rule of sortedRules) {
        if (this.evaluateRule(rule, itemData)) {
          this.applyRuleAction(item, rule);
          this.filteredElements.set(item, rule);
          break; // 只应用第一个匹配的规则
        }
      }
    } catch (error) {
      log('Error applying filters to item:', error);
    }
  }

  /**
   * 查找视频项目元素
   */
  private findVideoItems(): HTMLElement[] {
    const selectors = [
      '.movie-list .item',
      '.video-list .item',
      '.grid-item',
      '.movie-item',
      '.video-item',
      '.item',
      '[class*="movie"]',
      '[class*="video"]',
    ];

    const items: HTMLElement[] = [];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (this.isVideoItem(element as HTMLElement)) {
          items.push(element as HTMLElement);
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
    // 检查是否包含视频相关信息
    const hasTitle = element.querySelector('.title, h1, h2, h3, h4, h5, h6');
    const hasImage = element.querySelector('img');
    const hasLink = element.querySelector('a[href*="/v/"], a[href*="/movie/"]');
    
    return !!(hasTitle || hasImage || hasLink);
  }

  /**
   * 提取项目数据
   */
  private extractItemData(item: HTMLElement): Record<string, string> {
    const data: Record<string, string> = {};

    try {
      // 提取标题
      const titleElement = item.querySelector('.title, h1, h2, h3, h4, h5, h6');
      if (titleElement) {
        data.title = titleElement.textContent?.trim() || '';
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

    return data;
  }

  /**
   * 评估过滤规则
   */
  private evaluateRule(rule: FilterRule, itemData: Record<string, string>): boolean {
    try {
      // 特殊处理已观看规则
      if (rule.id === 'hide-viewed') {
        const videoId = itemData['video-id'];
        return videoId && STATE.records && STATE.records[videoId];
      }

      // 评估所有条件（AND逻辑）
      return rule.conditions.every(condition => {
        return this.evaluateCondition(condition, itemData);
      });
    } catch (error) {
      log('Error evaluating rule:', error);
      return false;
    }
  }

  /**
   * 评估单个条件
   */
  private evaluateCondition(condition: FilterCondition, itemData: Record<string, string>): boolean {
    const fieldValue = itemData[condition.field] || '';
    let { value } = condition;
    let testValue = fieldValue;

    // 处理大小写敏感性
    if (!condition.caseSensitive) {
      value = value.toLowerCase();
      testValue = testValue.toLowerCase();
    }

    switch (condition.operator) {
      case 'contains':
        return testValue.includes(value);
      case 'not-contains':
        return !testValue.includes(value);
      case 'equals':
        return testValue === value;
      case 'startsWith':
        return testValue.startsWith(value);
      case 'endsWith':
        return testValue.endsWith(value);
      case 'regex':
        try {
          const flags = condition.caseSensitive ? 'g' : 'gi';
          const regex = new RegExp(value, flags);
          return regex.test(testValue);
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  /**
   * 应用规则动作
   */
  private applyRuleAction(item: HTMLElement, rule: FilterRule): void {
    const { action } = rule;

    switch (action.type) {
      case 'hide':
        item.style.display = 'none';
        this.filterStats.hidden++;
        break;

      case 'highlight':
        if (action.style) {
          Object.assign(item.style, action.style);
        }
        this.filterStats.highlighted++;
        break;

      case 'blur':
        item.style.filter = action.style?.filter || 'blur(5px)';
        if (action.style?.opacity !== undefined) {
          item.style.opacity = action.style.opacity.toString();
        }
        this.filterStats.blurred++;
        break;

      case 'mark':
        item.classList.add('content-filter-marked');
        if (action.style) {
          Object.assign(item.style, action.style);
        }
        if (action.message) {
          this.addFilterMessage(item, action.message);
        }
        this.filterStats.marked++;
        break;
    }

    // 添加过滤标记
    item.setAttribute('data-filtered-by', rule.id);
    item.setAttribute('data-filter-type', action.type);
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
   * 创建快速过滤器UI
   */
  private createQuickFiltersUI(): void {
    const container = document.createElement('div');
    container.className = 'quick-filters-container';
    container.style.cssText = `
      position: fixed;
      top: 50%;
      right: 20px;
      transform: translateY(-50%);
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      min-width: 150px;
    `;

    const title = document.createElement('div');
    title.textContent = '快速过滤';
    title.style.cssText = `
      font-weight: bold;
      margin-bottom: 8px;
      text-align: center;
      color: #333;
    `;

    container.appendChild(title);

    // 创建过滤选项
    const filters = [
      { key: 'hideViewed', label: '隐藏已看' },
      { key: 'hideVR', label: '隐藏VR' },
      { key: 'hideFC2', label: '隐藏FC2' },
      { key: 'hideUncensored', label: '隐藏无码' },
    ];

    filters.forEach(filter => {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        display: flex;
        align-items: center;
        margin-bottom: 6px;
      `;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `filter-${filter.key}`;
      checkbox.checked = this.config.quickFilters[filter.key as keyof typeof this.config.quickFilters];
      checkbox.style.marginRight = '6px';

      const label = document.createElement('label');
      label.htmlFor = checkbox.id;
      label.textContent = filter.label;
      label.style.cssText = `
        cursor: pointer;
        font-size: 12px;
        user-select: none;
      `;

      checkbox.addEventListener('change', () => {
        this.config.quickFilters[filter.key as keyof typeof this.config.quickFilters] = checkbox.checked;
        this.updateRuleEnabled(`hide-${filter.key.replace('hide', '').toLowerCase()}`, checkbox.checked);
        this.applyFilters();
        this.showFilterStats();
      });

      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);
      container.appendChild(wrapper);
    });

    // 添加重置按钮
    const resetButton = document.createElement('button');
    resetButton.textContent = '重置';
    resetButton.style.cssText = `
      width: 100%;
      padding: 4px 8px;
      margin-top: 8px;
      border: 1px solid #ddd;
      background: #f9f9f9;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    `;

    resetButton.addEventListener('click', () => {
      this.resetFilters();
    });

    container.appendChild(resetButton);
    document.body.appendChild(container);
  }

  /**
   * 更新规则启用状态
   */
  private updateRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.config.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * 重置过滤器
   */
  private resetFilters(): void {
    // 重置快速过滤器
    Object.keys(this.config.quickFilters).forEach(key => {
      this.config.quickFilters[key as keyof typeof this.config.quickFilters] = false;
    });

    // 重置规则
    this.config.rules.forEach(rule => {
      if (rule.id.startsWith('hide-')) {
        rule.enabled = false;
      }
    });

    // 清除所有过滤效果
    this.clearAllFilters();

    // 重新应用过滤
    this.applyFilters();

    // 更新UI
    const checkboxes = document.querySelectorAll('.quick-filters-container input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      (checkbox as HTMLInputElement).checked = false;
    });

    this.showFilterStats();
    showToast('过滤器已重置', 'info');
  }

  /**
   * 清除所有过滤效果
   */
  private clearAllFilters(): void {
    this.filteredElements.forEach((rule, element) => {
      // 恢复显示
      element.style.display = '';
      
      // 清除样式
      element.style.backgroundColor = '';
      element.style.color = '';
      element.style.border = '';
      element.style.opacity = '';
      element.style.filter = '';
      
      // 移除类和属性
      element.classList.remove('content-filter-marked');
      element.removeAttribute('data-filtered-by');
      element.removeAttribute('data-filter-type');
      
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
    this.observer = new MutationObserver(() => {
      // 延迟应用过滤，避免频繁操作
      setTimeout(() => {
        this.applyFilters();
      }, 500);
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ContentFilterConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.isInitialized) {
      this.applyFilters();
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

    const quickFilters = document.querySelector('.quick-filters-container');
    if (quickFilters) {
      quickFilters.remove();
    }

    this.isInitialized = false;
  }
}

// 导出默认实例
export const contentFilterManager = new ContentFilterManager();
