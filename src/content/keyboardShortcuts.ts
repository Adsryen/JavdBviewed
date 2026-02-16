// src/content/keyboardShortcuts.ts
// 键盘快捷键系统

import { log } from './state';
import { showToast } from './toast';
import { contentFilterManager } from './contentFilter';

export interface ShortcutAction {
  id: string;
  name: string;
  description: string;
  keys: string[];
  handler: () => void | Promise<void>;
  enabled: boolean;
  category: 'navigation' | 'copy' | 'filter' | 'view' | 'custom';
}

export interface KeyboardShortcutsConfig {
  enabled: boolean;
  showHelp: boolean;
  enableGlobalShortcuts: boolean;
  enablePageSpecificShortcuts: boolean;
  customShortcuts: Record<string, string[]>;
}

export class KeyboardShortcutsManager {
  private config: KeyboardShortcutsConfig;
  private shortcuts: Map<string, ShortcutAction> = new Map();
  private helpPanel: HTMLElement | null = null;
  private isInitialized = false;
  private pressedKeys: Set<string> = new Set();

  constructor(config: Partial<KeyboardShortcutsConfig> = {}) {
    this.config = {
      enabled: true,
      showHelp: true,
      enableGlobalShortcuts: true,
      enablePageSpecificShortcuts: true,
      customShortcuts: {},
      ...config,
    };
  }

  /**
   * 初始化键盘快捷键系统
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled || this.isInitialized) {
      return;
    }

    try {
      log('Initializing keyboard shortcuts system...');

      // 注册默认快捷键
      this.registerDefaultShortcuts();

      // 设置事件监听
      this.setupEventListeners();

      // 创建帮助面板
      if (this.config.showHelp) {
        this.createHelpPanel();
      }

      this.isInitialized = true;
      log('Keyboard shortcuts system initialized');
    } catch (error) {
      log('Error initializing keyboard shortcuts:', error);
    }
  }

  /**
   * 注册默认快捷键
   */
  private registerDefaultShortcuts(): void {
    const shortcuts: ShortcutAction[] = [
      // 导航快捷键
      {
        id: 'go-home',
        name: '返回首页',
        description: '快速返回JavDB首页',
        keys: ['Alt', 'h'],
        handler: () => this.navigateToHome(),
        enabled: true,
        category: 'navigation',
      },
      {
        id: 'go-search',
        name: '搜索页面',
        description: '跳转到搜索页面',
        keys: ['Alt', 's'],
        handler: () => this.navigateToSearch(),
        enabled: true,
        category: 'navigation',
      },
      {
        id: 'focus-search',
        name: '聚焦搜索框',
        description: '将光标移动到搜索框',
        keys: ['/'],
        handler: () => this.focusSearchBox(),
        enabled: true,
        category: 'navigation',
      },
      {
        id: 'scroll-to-top',
        name: '回到顶部',
        description: '快速滚动到页面顶部',
        keys: ['Home'],
        handler: () => this.scrollToTop(),
        enabled: true,
        category: 'navigation',
      },
      {
        id: 'scroll-to-bottom',
        name: '滚动到底部',
        description: '快速滚动到页面底部',
        keys: ['End'],
        handler: () => this.scrollToBottom(),
        enabled: true,
        category: 'navigation',
      },

      // 复制快捷键
      {
        id: 'copy-video-id',
        name: '复制番号',
        description: '复制当前视频的番号',
        keys: ['Ctrl', 'Shift', 'v'],
        handler: () => this.copyVideoId(),
        enabled: true,
        category: 'copy',
      },
      {
        id: 'copy-title',
        name: '复制标题',
        description: '复制当前视频的标题',
        keys: ['Ctrl', 'Shift', 't'],
        handler: () => this.copyTitle(),
        enabled: true,
        category: 'copy',
      },
      {
        id: 'copy-url',
        name: '复制链接',
        description: '复制当前页面链接',
        keys: ['Ctrl', 'Shift', 'u'],
        handler: () => this.copyUrl(),
        enabled: true,
        category: 'copy',
      },

      // 过滤快捷键
      {
        id: 'toggle-viewed-filter',
        name: '切换已看过滤',
        description: '显示/隐藏已观看的视频',
        keys: ['Alt', 'v'],
        handler: () => this.toggleViewedFilter(),
        enabled: true,
        category: 'filter',
      },
      {
        id: 'toggle-vr-filter',
        name: '切换VR过滤',
        description: '显示/隐藏VR内容',
        keys: ['Alt', 'r'],
        handler: () => this.toggleVRFilter(),
        enabled: true,
        category: 'filter',
      },
      {
        id: 'reset-filters',
        name: '重置过滤器',
        description: '清除所有过滤条件',
        keys: ['Alt', 'Shift', 'r'],
        handler: () => this.resetFilters(),
        enabled: true,
        category: 'filter',
      },

      // 视图快捷键
      {
        id: 'toggle-help',
        name: '显示帮助',
        description: '显示/隐藏快捷键帮助',
        keys: ['?'],
        handler: () => this.toggleHelp(),
        enabled: true,
        category: 'view',
      },
      {
        id: 'refresh-page',
        name: '刷新页面',
        description: '刷新当前页面',
        keys: ['F5'],
        handler: () => this.refreshPage(),
        enabled: true,
        category: 'view',
      },
      {
        id: 'toggle-fullscreen',
        name: '全屏模式',
        description: '进入/退出全屏模式',
        keys: ['F11'],
        handler: () => this.toggleFullscreen(),
        enabled: true,
        category: 'view',
      },

      // 页面特定快捷键
      {
        id: 'next-page',
        name: '下一页',
        description: '跳转到下一页（列表页）',
        keys: ['ArrowRight'],
        handler: () => this.navigateToNextPage(),
        enabled: this.isListPage(),
        category: 'navigation',
      },
      {
        id: 'prev-page',
        name: '上一页',
        description: '跳转到上一页（列表页）',
        keys: ['ArrowLeft'],
        handler: () => this.navigateToPrevPage(),
        enabled: this.isListPage(),
        category: 'navigation',
      },
    ];

    // 注册快捷键
    shortcuts.forEach(shortcut => {
      this.registerShortcut(shortcut);
    });
  }

  /**
   * 注册快捷键
   */
  registerShortcut(shortcut: ShortcutAction): void {
    const key = this.getShortcutKey(shortcut.keys);
    this.shortcuts.set(key, shortcut);
    log(`Registered shortcut: ${shortcut.name} (${shortcut.keys.join('+')})`);
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // 防止在输入框中触发快捷键
    document.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement;
      if (this.isInputElement(target)) {
        return;
      }
    });
  }

  /**
   * 处理按键按下
   */
  private handleKeyDown(e: KeyboardEvent): void {
    // 忽略在输入元素中的按键
    if (this.isInputElement(e.target as HTMLElement)) {
      return;
    }

    // 记录按下的键
    this.pressedKeys.add(e.code);
    this.pressedKeys.add(e.key);

    // 添加修饰键
    if (e.ctrlKey) this.pressedKeys.add('Ctrl');
    if (e.shiftKey) this.pressedKeys.add('Shift');
    if (e.altKey) this.pressedKeys.add('Alt');
    if (e.metaKey) this.pressedKeys.add('Meta');

    // 检查是否匹配快捷键
    this.checkShortcuts(e);
  }

  /**
   * 处理按键释放
   */
  private handleKeyUp(e: KeyboardEvent): void {
    this.pressedKeys.delete(e.code);
    this.pressedKeys.delete(e.key);
    
    if (!e.ctrlKey) this.pressedKeys.delete('Ctrl');
    if (!e.shiftKey) this.pressedKeys.delete('Shift');
    if (!e.altKey) this.pressedKeys.delete('Alt');
    if (!e.metaKey) this.pressedKeys.delete('Meta');
  }

  /**
   * 检查快捷键匹配
   */
  private checkShortcuts(e: KeyboardEvent): void {
    for (const [, shortcut] of this.shortcuts) {
      if (!shortcut.enabled) continue;

      if (this.isShortcutMatch(shortcut.keys)) {
        e.preventDefault();
        e.stopPropagation();
        
        try {
          shortcut.handler();
          log(`Executed shortcut: ${shortcut.name}`);
        } catch (error) {
          log(`Error executing shortcut ${shortcut.name}:`, error);
        }
        break;
      }
    }
  }

  /**
   * 检查快捷键是否匹配
   */
  private isShortcutMatch(keys: string[]): boolean {
    if (keys.length !== this.pressedKeys.size) {
      return false;
    }

    return keys.every(key => this.pressedKeys.has(key));
  }

  /**
   * 获取快捷键标识
   */
  private getShortcutKey(keys: string[]): string {
    return keys.sort().join('+');
  }

  /**
   * 判断是否为输入元素
   */
  private isInputElement(element: HTMLElement): boolean {
    if (!element) return false;
    
    const tagName = element.tagName.toLowerCase();
    const inputTypes = ['input', 'textarea', 'select'];
    
    return inputTypes.includes(tagName) || 
           element.contentEditable === 'true' ||
           element.getAttribute('role') === 'textbox';
  }

  /**
   * 判断是否为列表页
   */
  private isListPage(): boolean {
    return window.location.pathname.includes('/search') ||
           window.location.pathname.includes('/page') ||
           document.querySelector('.movie-list, .video-list') !== null;
  }

  // 快捷键处理函数

  private navigateToHome(): void {
    window.location.href = '/';
  }

  private navigateToSearch(): void {
    window.location.href = '/search';
  }

  private focusSearchBox(): void {
    const searchBox = document.querySelector('input[type="search"], input[name="q"], .search-input') as HTMLInputElement;
    if (searchBox) {
      searchBox.focus();
      searchBox.select();
    }
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private scrollToBottom(): void {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  private async copyVideoId(): Promise<void> {
    const videoId = this.extractVideoId();
    if (videoId) {
      await this.copyToClipboard(videoId);
      showToast(`已复制番号: ${videoId}`, 'success');
    } else {
      showToast('未找到番号', 'error');
    }
  }

  private async copyTitle(): Promise<void> {
    const title = this.extractTitle();
    if (title) {
      await this.copyToClipboard(title);
      showToast(`已复制标题: ${this.truncateText(title, 30)}`, 'success');
    } else {
      showToast('未找到标题', 'error');
    }
  }

  private async copyUrl(): Promise<void> {
    await this.copyToClipboard(window.location.href);
    showToast('已复制链接', 'success');
  }

  private toggleViewedFilter(): void {
    // 注意：已观看过滤现在由其他系统处理，这里只是显示提示
    showToast('已观看过滤功能已移至显示设置中', 'info');
  }

  private toggleVRFilter(): void {
    // 添加VR关键字过滤规则
    if (contentFilterManager) {
      const manager = contentFilterManager as any;
      manager.addKeywordRule('VR|SIVR|DSVR|KMPVR', 'hide', true, false);
      manager.applyFilters();
      showToast('已添加VR内容过滤规则', 'info');
    }
  }

  private resetFilters(): void {
    if (contentFilterManager) {
      (contentFilterManager as any).resetFilters();
    }
  }

  private toggleHelp(): void {
    if (this.helpPanel) {
      const isVisible = this.helpPanel.style.display !== 'none';
      this.helpPanel.style.display = isVisible ? 'none' : 'block';
      
      if (!isVisible) {
        this.updateHelpContent();
      }
    }
  }

  private refreshPage(): void {
    window.location.reload();
  }

  private toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  private navigateToNextPage(): void {
    const nextLink = document.querySelector('a[rel="next"], .next-page, .pagination .next') as HTMLAnchorElement;
    if (nextLink) {
      nextLink.click();
    }
  }

  private navigateToPrevPage(): void {
    const prevLink = document.querySelector('a[rel="prev"], .prev-page, .pagination .prev') as HTMLAnchorElement;
    if (prevLink) {
      prevLink.click();
    }
  }

  /**
   * 创建帮助面板
   */
  private createHelpPanel(): void {
    this.helpPanel = document.createElement('div');
    this.helpPanel.className = 'keyboard-shortcuts-help';
    this.helpPanel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 600px;
      max-height: 80vh;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: none;
      overflow: hidden;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #f8f9fa;
      border-bottom: 1px solid #ddd;
    `;

    const title = document.createElement('h3');
    title.textContent = '键盘快捷键';
    title.style.cssText = `
      margin: 0;
      color: #333;
      font-size: 18px;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    closeBtn.addEventListener('click', () => {
      this.helpPanel!.style.display = 'none';
    });

    const content = document.createElement('div');
    content.className = 'shortcuts-content';
    content.style.cssText = `
      padding: 20px;
      max-height: calc(80vh - 80px);
      overflow-y: auto;
    `;

    header.appendChild(title);
    header.appendChild(closeBtn);
    this.helpPanel.appendChild(header);
    this.helpPanel.appendChild(content);

    document.body.appendChild(this.helpPanel);

    // 点击背景关闭
    this.helpPanel.addEventListener('click', (e) => {
      if (e.target === this.helpPanel) {
        this.helpPanel!.style.display = 'none';
      }
    });
  }

  /**
   * 更新帮助内容
   */
  private updateHelpContent(): void {
    if (!this.helpPanel) return;

    const content = this.helpPanel.querySelector('.shortcuts-content');
    if (!content) return;

    const categories = this.groupShortcutsByCategory();
    
    content.innerHTML = Object.entries(categories).map(([category, shortcuts]) => {
      const categoryNames: Record<string, string> = {
        navigation: '导航',
        copy: '复制',
        filter: '过滤',
        view: '视图',
        custom: '自定义',
      };

      return `
        <div class="shortcut-category">
          <h4 style="margin: 0 0 12px 0; color: #555; font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
            ${categoryNames[category] || category}
          </h4>
          ${shortcuts.map(shortcut => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
              <div>
                <div style="font-weight: 500; color: #333; margin-bottom: 2px;">${shortcut.name}</div>
                <div style="font-size: 12px; color: #666;">${shortcut.description}</div>
              </div>
              <div style="display: flex; gap: 4px;">
                ${shortcut.keys.map(key => `
                  <kbd style="
                    padding: 2px 6px;
                    background: #f8f9fa;
                    border: 1px solid #ddd;
                    border-radius: 3px;
                    font-size: 11px;
                    font-family: monospace;
                    color: #333;
                  ">${key}</kbd>
                `).join(' + ')}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }).join('');
  }

  /**
   * 按类别分组快捷键
   */
  private groupShortcutsByCategory(): Record<string, ShortcutAction[]> {
    const categories: Record<string, ShortcutAction[]> = {};
    
    this.shortcuts.forEach(shortcut => {
      if (!shortcut.enabled) return;
      
      if (!categories[shortcut.category]) {
        categories[shortcut.category] = [];
      }
      categories[shortcut.category].push(shortcut);
    });

    return categories;
  }

  // 辅助方法

  private extractVideoId(): string {
    // 从URL或页面内容提取视频ID
    const match = window.location.pathname.match(/\/v\/([^\/]+)/);
    if (match) {
      return match[1];
    }

    // 从页面标题提取
    const title = document.title;
    const titleMatch = title.match(/([A-Z]+-\d+)/);
    if (titleMatch) {
      return titleMatch[1];
    }

    return '';
  }

  private extractTitle(): string {
    const selectors = ['h1', '.title', '.video-title', '.movie-title'];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        return element.textContent.trim();
      }
    }
    
    return document.title;
  }

  private async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<KeyboardShortcutsConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 销毁快捷键系统
   */
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));

    if (this.helpPanel) {
      this.helpPanel.remove();
      this.helpPanel = null;
    }

    this.shortcuts.clear();
    this.pressedKeys.clear();
    this.isInitialized = false;
  }
}

// 导出默认实例
export const keyboardShortcutsManager = new KeyboardShortcutsManager();

