import { ThemeSwitcher } from '../../dashboard/components/themeSwitcher';
import { initThemeListener } from '../../dashboard/loaders/partialsLoader';
import { themeManager } from '../../dashboard/services/themeManager';

export function initializeDashboardThemeEarly(): void {
  void (async () => {
    try {
      await themeManager.initialize();
      console.log('[Dashboard] 主题系统已提前初始化');
    } catch (error) {
      console.error('[Dashboard] 主题系统提前初始化失败:', error);
    }
  })();
}

export async function initializeDashboardThemeForDom(): Promise<void> {
  try {
    await themeManager.initialize();
    console.log('[Dashboard] 主题系统已初始化');
    initThemeListener();
    console.log('[Dashboard] 主题监听器已初始化');
  } catch (error) {
    console.error('[Dashboard] 主题系统初始化失败:', error);
  }
}

export function mountDashboardThemeSwitcher(): void {
  try {
    const topbarRight = document.querySelector('.topbar-right');
    if (topbarRight) {
      const themeSwitcher = new ThemeSwitcher(themeManager);
      const helpBtn = document.getElementById('helpBtn');
      if (helpBtn) {
        topbarRight.insertBefore(themeSwitcher.getElement(), helpBtn);
      } else {
        themeSwitcher.mount(topbarRight as HTMLElement);
      }
      console.debug('[Dashboard] 主题切换器已挂载');
      return;
    }
    console.warn('[Dashboard] 未找到 .topbar-right 容器，主题切换器未挂载');
  } catch (error) {
    console.error('[Dashboard] 主题切换器挂载失败:', error);
  }
}
