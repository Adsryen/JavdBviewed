/**
 * 主题管理器 - Theme Manager
 * 负责主题的初始化、切换和应用
 */

import { Theme, ThemeStorage } from './themeStorage';

type ThemeChangeCallback = (theme: Theme) => void;

/**
 * 主题管理器类
 */
export class ThemeManager {
  private currentTheme: Theme = 'light';
  private listeners: ThemeChangeCallback[] = [];
  private initialized = false;
  private storageListenerBound = false;

  /**
   * 初始化主题系统
   * 从存储中读取用户偏好并应用
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('[ThemeManager] 主题系统已初始化');
      return;
    }

    try {
      // 1. 立即应用默认主题到 DOM（避免闪烁）
      this.applyTheme('light');
      
      // 2. 从存储中读取用户偏好
      const savedTheme = await ThemeStorage.getTheme();
      
      // 3. 如果有保存的偏好且与默认不同，重新应用
      if (savedTheme && savedTheme !== 'light') {
        this.currentTheme = savedTheme;
        this.applyTheme(savedTheme);
      } else {
        this.currentTheme = 'light';
      }
      
      // 4. 设置 storage 监听器，实现跨页面主题同步
      this.setupStorageListener();
      
      this.initialized = true;
      console.log(`[ThemeManager] 主题系统已初始化，当前主题: ${this.currentTheme}`);
    } catch (error) {
      console.error('[ThemeManager] 初始化失败:', error);
      // 降级：使用默认主题
      this.currentTheme = 'light';
      this.applyTheme(this.currentTheme);
      this.initialized = true;
    }
  }

  /**
   * 设置 storage 监听器，监听其他页面的主题变更
   */
  private setupStorageListener(): void {
    if (this.storageListenerBound) {
      return;
    }

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.theme_preference) {
        const newTheme = changes.theme_preference.newValue as Theme;
        if (newTheme && (newTheme === 'light' || newTheme === 'dark')) {
          // 只有当主题真的变化时才更新
          if (newTheme !== this.currentTheme) {
            console.log(`[ThemeManager] 检测到外部主题变更: ${this.currentTheme} -> ${newTheme}`);
            this.currentTheme = newTheme;
            this.applyTheme(newTheme);
            this.notifyListeners(newTheme);
          }
        }
      }
    });

    this.storageListenerBound = true;
    console.log('[ThemeManager] Storage 监听器已设置');
  }

  /**
   * 获取当前主题
   */
  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * 切换主题（在浅色和深色之间切换）
   */
  async toggleTheme(): Promise<void> {
    const newTheme: Theme = this.currentTheme === 'light' ? 'dark' : 'light';
    await this.setTheme(newTheme);
  }

  /**
   * 设置指定主题
   * @param theme 要设置的主题
   */
  async setTheme(theme: Theme): Promise<void> {
    const startTime = performance.now();

    try {
      // 1. 更新内部状态
      this.currentTheme = theme;
      
      // 2. 应用主题到 DOM
      this.applyTheme(theme);
      
      // 3. 保存到存储
      await ThemeStorage.saveTheme(theme);
      
      // 4. 通知监听器
      this.notifyListeners(theme);
      
      // 5. 性能监控
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`[ThemeManager] 主题切换完成: ${theme} (耗时: ${duration.toFixed(2)}ms)`);
      
      if (duration > 100) {
        console.warn(`[ThemeManager] 主题切换耗时超过 100ms: ${duration.toFixed(2)}ms`);
      }
    } catch (error) {
      console.error('[ThemeManager] 设置主题失败:', error);
      throw error;
    }
  }

  /**
   * 应用主题到 DOM
   * @param theme 要应用的主题
   */
  private applyTheme(theme: Theme): void {
    // 更新根元素的 data-theme 属性
    document.documentElement.setAttribute('data-theme', theme);
  }

  /**
   * 监听主题变更
   * @param callback 主题变更时的回调函数
   */
  onThemeChange(callback: ThemeChangeCallback): void {
    this.listeners.push(callback);
  }

  /**
   * 移除主题变更监听器
   * @param callback 要移除的回调函数
   */
  offThemeChange(callback: ThemeChangeCallback): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 通知所有监听器
   * @param theme 当前主题
   */
  private notifyListeners(theme: Theme): void {
    this.listeners.forEach(callback => {
      try {
        callback(theme);
      } catch (error) {
        console.error('[ThemeManager] 监听器执行失败:', error);
      }
    });
  }
}

// 导出单例实例
export const themeManager = new ThemeManager();
