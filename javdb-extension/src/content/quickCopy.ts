// src/content/quickCopy.ts
// 快捷复制功能

import { STATE, log } from './state';
import { showToast } from './toast';
import { extractVideoId } from './videoId';

export interface CopyableItem {
  type: 'video-id' | 'title' | 'url' | 'magnet' | 'actor' | 'custom';
  label: string;
  value: string;
  icon?: string;
}

export interface QuickCopyConfig {
  enabled: boolean;
  showButtons: boolean;
  showTooltips: boolean;
  enableKeyboardShortcuts: boolean;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  items: string[]; // 启用的复制项类型
}

export class QuickCopyManager {
  private config: QuickCopyConfig;
  private copyButtons: Map<string, HTMLElement> = new Map();
  private floatingPanel: HTMLElement | null = null;
  private isInitialized = false;

  constructor(config: Partial<QuickCopyConfig> = {}) {
    this.config = {
      enabled: true,
      showButtons: true,
      showTooltips: true,
      enableKeyboardShortcuts: true,
      position: 'top-right',
      items: ['video-id', 'title', 'url'],
      ...config,
    };
  }

  /**
   * 初始化快捷复制功能
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled || this.isInitialized) {
      return;
    }

    try {
      log('Initializing quick copy functionality...');

      // 创建浮动复制面板
      if (this.config.showButtons) {
        this.createFloatingPanel();
      }

      // 添加内联复制按钮
      this.addInlineCopyButtons();

      // 设置键盘快捷键
      if (this.config.enableKeyboardShortcuts) {
        this.setupKeyboardShortcuts();
      }

      // 监听页面变化
      this.observePageChanges();

      this.isInitialized = true;
      log('Quick copy functionality initialized');
    } catch (error) {
      log('Error initializing quick copy:', error);
    }
  }

  /**
   * 获取可复制的项目
   */
  private getCopyableItems(): CopyableItem[] {
    const items: CopyableItem[] = [];

    try {
      // 视频ID
      if (this.config.items.includes('video-id')) {
        const videoId = extractVideoId();
        if (videoId) {
          items.push({
            type: 'video-id',
            label: '番号',
            value: videoId,
            icon: '🎬',
          });
        }
      }

      // 标题
      if (this.config.items.includes('title')) {
        const title = this.extractTitle();
        if (title) {
          items.push({
            type: 'title',
            label: '标题',
            value: title,
            icon: '📝',
          });
        }
      }

      // 当前URL
      if (this.config.items.includes('url')) {
        items.push({
          type: 'url',
          label: '链接',
          value: window.location.href,
          icon: '🔗',
        });
      }

      // 磁力链接
      if (this.config.items.includes('magnet')) {
        const magnets = this.extractMagnets();
        magnets.forEach((magnet, index) => {
          items.push({
            type: 'magnet',
            label: `磁力${index + 1}`,
            value: magnet,
            icon: '🧲',
          });
        });
      }

      // 演员
      if (this.config.items.includes('actor')) {
        const actors = this.extractActors();
        actors.forEach((actor, index) => {
          items.push({
            type: 'actor',
            label: `演员${index + 1}`,
            value: actor,
            icon: '👤',
          });
        });
      }

    } catch (error) {
      log('Error getting copyable items:', error);
    }

    return items;
  }

  /**
   * 创建浮动复制面板
   */
  private createFloatingPanel(): void {
    if (this.floatingPanel) {
      this.floatingPanel.remove();
    }

    this.floatingPanel = document.createElement('div');
    this.floatingPanel.className = 'quick-copy-panel';
    this.floatingPanel.style.cssText = this.getPanelStyles();

    // 创建标题
    const header = document.createElement('div');
    header.className = 'quick-copy-header';
    header.innerHTML = `
      <span class="title">快捷复制</span>
      <button class="close-btn" title="关闭">×</button>
    `;
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #f5f5f5;
      border-bottom: 1px solid #ddd;
      font-weight: bold;
      font-size: 12px;
    `;

    // 创建内容区域
    const content = document.createElement('div');
    content.className = 'quick-copy-content';
    content.style.cssText = `
      padding: 8px;
      max-height: 300px;
      overflow-y: auto;
    `;

    this.floatingPanel.appendChild(header);
    this.floatingPanel.appendChild(content);

    // 添加事件监听
    header.querySelector('.close-btn')?.addEventListener('click', () => {
      this.togglePanel(false);
    });

    // 更新内容
    this.updatePanelContent();

    // 添加到页面
    document.body.appendChild(this.floatingPanel);

    // 默认隐藏
    this.togglePanel(false);
  }

  /**
   * 更新面板内容
   */
  private updatePanelContent(): void {
    if (!this.floatingPanel) return;

    const content = this.floatingPanel.querySelector('.quick-copy-content');
    if (!content) return;

    const items = this.getCopyableItems();
    
    if (items.length === 0) {
      content.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">暂无可复制内容</div>';
      return;
    }

    content.innerHTML = items.map(item => `
      <div class="copy-item" data-type="${item.type}" data-value="${this.escapeHtml(item.value)}">
        <span class="icon">${item.icon || '📋'}</span>
        <span class="label">${item.label}</span>
        <span class="value">${this.truncateText(item.value, 30)}</span>
        <button class="copy-btn" title="复制">📋</button>
      </div>
    `).join('');

    // 添加复制按钮事件
    content.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = (e.target as HTMLElement).closest('.copy-item');
        if (item) {
          const value = item.getAttribute('data-value') || '';
          const type = item.getAttribute('data-type') || '';
          this.copyToClipboard(value, type);
        }
      });
    });

    // 添加项目点击事件
    content.querySelectorAll('.copy-item').forEach(item => {
      item.addEventListener('click', () => {
        const value = item.getAttribute('data-value') || '';
        const type = item.getAttribute('data-type') || '';
        this.copyToClipboard(value, type);
      });
    });

    // 添加样式
    this.addCopyItemStyles();
  }

  /**
   * 添加内联复制按钮
   */
  private addInlineCopyButtons(): void {
    try {
      // 为视频ID添加复制按钮
      if (this.config.items.includes('video-id')) {
        this.addVideoIdCopyButton();
      }

      // 为标题添加复制按钮
      if (this.config.items.includes('title')) {
        this.addTitleCopyButton();
      }

      // 为磁力链接添加复制按钮
      if (this.config.items.includes('magnet')) {
        this.addMagnetCopyButtons();
      }

    } catch (error) {
      log('Error adding inline copy buttons:', error);
    }
  }

  /**
   * 为视频ID添加复制按钮
   */
  private addVideoIdCopyButton(): void {
    const videoId = extractVideoId();
    if (!videoId) return;

    // 查找视频ID显示位置
    const selectors = [
      '.video-title',
      '.movie-title', 
      'h1',
      '.title',
      '.video-meta'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent?.includes(videoId)) {
        this.addCopyButtonToElement(element as HTMLElement, videoId, 'video-id');
        break;
      }
    }
  }

  /**
   * 为标题添加复制按钮
   */
  private addTitleCopyButton(): void {
    const title = this.extractTitle();
    if (!title) return;

    const titleElements = document.querySelectorAll('h1, .title, .video-title, .movie-title');
    titleElements.forEach(element => {
      if (element.textContent?.trim() === title) {
        this.addCopyButtonToElement(element as HTMLElement, title, 'title');
      }
    });
  }

  /**
   * 为磁力链接添加复制按钮
   */
  private addMagnetCopyButtons(): void {
    const magnetLinks = document.querySelectorAll('a[href^="magnet:"]');
    magnetLinks.forEach(link => {
      const magnetUrl = (link as HTMLAnchorElement).href;
      this.addCopyButtonToElement(link as HTMLElement, magnetUrl, 'magnet');
    });
  }

  /**
   * 为元素添加复制按钮
   */
  private addCopyButtonToElement(element: HTMLElement, value: string, type: string): void {
    // 避免重复添加
    if (element.querySelector('.inline-copy-btn')) {
      return;
    }

    const copyBtn = document.createElement('button');
    copyBtn.className = 'inline-copy-btn';
    copyBtn.innerHTML = '📋';
    copyBtn.title = '复制';
    copyBtn.style.cssText = `
      margin-left: 8px;
      padding: 2px 6px;
      border: 1px solid #ddd;
      background: #f9f9f9;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
      opacity: 0.7;
      transition: opacity 0.3s ease;
    `;

    copyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.copyToClipboard(value, type);
    });

    copyBtn.addEventListener('mouseenter', () => {
      copyBtn.style.opacity = '1';
    });

    copyBtn.addEventListener('mouseleave', () => {
      copyBtn.style.opacity = '0.7';
    });

    element.appendChild(copyBtn);
    this.copyButtons.set(`${type}-${value}`, copyBtn);
  }

  /**
   * 设置键盘快捷键
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+C: 显示/隐藏复制面板
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyC') {
        e.preventDefault();
        this.togglePanel();
        return;
      }

      // Ctrl+Shift+V: 复制视频ID
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyV') {
        e.preventDefault();
        const videoId = extractVideoId();
        if (videoId) {
          this.copyToClipboard(videoId, 'video-id');
        }
        return;
      }

      // Ctrl+Shift+T: 复制标题
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyT') {
        e.preventDefault();
        const title = this.extractTitle();
        if (title) {
          this.copyToClipboard(title, 'title');
        }
        return;
      }

      // Ctrl+Shift+U: 复制URL
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyU') {
        e.preventDefault();
        this.copyToClipboard(window.location.href, 'url');
        return;
      }
    });
  }

  /**
   * 复制到剪贴板
   */
  private async copyToClipboard(text: string, type: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      
      const typeLabels: Record<string, string> = {
        'video-id': '番号',
        'title': '标题',
        'url': '链接',
        'magnet': '磁力链接',
        'actor': '演员',
      };

      const label = typeLabels[type] || '内容';
      showToast(`已复制${label}: ${this.truncateText(text, 50)}`, 'success');
      
      log(`Copied ${type}:`, text);
    } catch (error) {
      log('Failed to copy to clipboard:', error);
      showToast('复制失败，请手动复制', 'error');
    }
  }

  /**
   * 切换面板显示状态
   */
  private togglePanel(show?: boolean): void {
    if (!this.floatingPanel) return;

    const isVisible = this.floatingPanel.style.display !== 'none';
    const shouldShow = show !== undefined ? show : !isVisible;

    this.floatingPanel.style.display = shouldShow ? 'block' : 'none';
    
    if (shouldShow) {
      this.updatePanelContent();
    }
  }

  /**
   * 监听页面变化
   */
  private observePageChanges(): void {
    const observer = new MutationObserver(() => {
      // 延迟更新，避免频繁操作
      setTimeout(() => {
        if (this.floatingPanel && this.floatingPanel.style.display !== 'none') {
          this.updatePanelContent();
        }
        this.addInlineCopyButtons();
      }, 500);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // 辅助方法

  private extractTitle(): string {
    const selectors = ['h1', '.title', '.video-title', '.movie-title', 'title'];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        const title = element.textContent.trim();
        if (title && title.length > 5) {
          return title;
        }
      }
    }
    
    return '';
  }

  private extractMagnets(): string[] {
    const magnets: string[] = [];
    const magnetLinks = document.querySelectorAll('a[href^="magnet:"]');
    
    magnetLinks.forEach(link => {
      const href = (link as HTMLAnchorElement).href;
      if (href && !magnets.includes(href)) {
        magnets.push(href);
      }
    });
    
    return magnets;
  }

  private extractActors(): string[] {
    const actors: string[] = [];
    const actorSelectors = [
      '.actor a',
      '.cast a', 
      '.performer a',
      '.star a',
      '[class*="actor"] a',
      '[class*="cast"] a'
    ];
    
    actorSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const name = element.textContent?.trim();
        if (name && !actors.includes(name)) {
          actors.push(name);
        }
      });
    });
    
    return actors;
  }

  private getPanelStyles(): string {
    const positions = {
      'top-right': 'top: 20px; right: 20px;',
      'top-left': 'top: 20px; left: 20px;',
      'bottom-right': 'bottom: 20px; right: 20px;',
      'bottom-left': 'bottom: 20px; left: 20px;',
    };

    return `
      position: fixed;
      ${positions[this.config.position]}
      width: 300px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
    `;
  }

  private addCopyItemStyles(): void {
    if (document.getElementById('quick-copy-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'quick-copy-styles';
    styles.textContent = `
      .copy-item {
        display: flex;
        align-items: center;
        padding: 8px;
        margin-bottom: 4px;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }
      .copy-item:hover {
        background-color: #f0f0f0;
      }
      .copy-item .icon {
        margin-right: 8px;
        font-size: 16px;
      }
      .copy-item .label {
        font-weight: bold;
        margin-right: 8px;
        min-width: 40px;
        font-size: 12px;
        color: #666;
      }
      .copy-item .value {
        flex: 1;
        margin-right: 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 12px;
      }
      .copy-item .copy-btn {
        padding: 2px 6px;
        border: 1px solid #ddd;
        background: #f9f9f9;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
      }
      .copy-item .copy-btn:hover {
        background: #e9e9e9;
      }
    `;
    document.head.appendChild(styles);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<QuickCopyConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.isInitialized) {
      // 重新初始化
      this.destroy();
      this.initialize();
    }
  }

  /**
   * 销毁功能
   */
  destroy(): void {
    if (this.floatingPanel) {
      this.floatingPanel.remove();
      this.floatingPanel = null;
    }

    this.copyButtons.forEach(btn => btn.remove());
    this.copyButtons.clear();

    const styles = document.getElementById('quick-copy-styles');
    if (styles) {
      styles.remove();
    }

    this.isInitialized = false;
  }
}

// 导出默认实例
export const quickCopyManager = new QuickCopyManager();
