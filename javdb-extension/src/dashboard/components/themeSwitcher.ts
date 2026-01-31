/**
 * 主题切换器组件 - Theme Switcher Component
 * 提供用户界面来切换主题
 */

import { ThemeManager } from '../services/themeManager';
import { Theme } from '../services/themeStorage';

/**
 * 主题切换器类
 */
export class ThemeSwitcher {
  private button: HTMLButtonElement;
  private icon: HTMLElement;
  private themeManager: ThemeManager;
  private switching = false;

  constructor(themeManager: ThemeManager) {
    this.themeManager = themeManager;
    this.button = this.createButton();
    this.icon = this.button.querySelector('.theme-icon')!;
    this.bindEvents();
    this.updateUI(themeManager.getCurrentTheme());
  }

  /**
   * 创建按钮元素
   */
  private createButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.id = 'theme-switcher-btn';
    button.className = 'theme-switcher';
    button.setAttribute('aria-label', '切换主题');
    button.setAttribute('type', 'button');
    
    const icon = document.createElement('i');
    icon.className = 'fas fa-sun theme-icon';
    button.appendChild(icon);
    
    return button;
  }

  /**
   * 绑定事件
   */
  private bindEvents(): void {
    // 点击事件
    this.button.addEventListener('click', () => this.handleClick());
    
    // 监听主题变更
    this.themeManager.onThemeChange((theme) => this.updateUI(theme));
  }

  /**
   * 处理点击事件
   */
  private async handleClick(): Promise<void> {
    if (this.switching) {
      return; // 防止重复点击
    }

    try {
      this.switching = true;
      
      // 添加切换动画类
      this.button.classList.add('switching');
      
      // 执行主题切换
      await this.themeManager.toggleTheme();
      
      // 移除动画类
      setTimeout(() => {
        this.button.classList.remove('switching');
        this.switching = false;
      }, 500);
    } catch (error) {
      console.error('[ThemeSwitcher] 切换主题失败:', error);
      this.button.classList.remove('switching');
      this.switching = false;
      
      // 显示错误提示（如果有 toast 系统）
      if (typeof (window as any).showToast === 'function') {
        (window as any).showToast('主题切换失败', 'error');
      }
    }
  }

  /**
   * 更新 UI 显示
   * @param theme 当前主题
   */
  private updateUI(theme: Theme): void {
    // 更新图标
    if (theme === 'light') {
      this.icon.className = 'fas fa-sun theme-icon';
      this.button.title = '切换到深色模式';
      this.button.setAttribute('aria-label', '切换到深色模式');
    } else {
      this.icon.className = 'fas fa-moon theme-icon';
      this.button.title = '切换到浅色模式';
      this.button.setAttribute('aria-label', '切换到浅色模式');
    }
  }

  /**
   * 挂载到指定容器
   * @param container 容器元素
   */
  mount(container: HTMLElement): void {
    container.appendChild(this.button);
  }

  /**
   * 从 DOM 中移除
   */
  unmount(): void {
    this.button.remove();
  }

  /**
   * 获取按钮元素
   */
  getElement(): HTMLButtonElement {
    return this.button;
  }
}
