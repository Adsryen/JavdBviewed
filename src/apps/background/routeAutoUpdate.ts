import { registerDynamicContentScripts } from './dynamicContentScripts';

export async function autoUpdateRoutes(): Promise<void> {
  try {
    if (typeof document !== 'undefined') {
      console.info('[Background] 检测到 document，上下文可能不是 Service Worker');
    }
    const { RouteManager } = await import('../../features/routeManagement');
    const routeManager = RouteManager.getInstance();
    const updated = await routeManager.checkAndUpdateRoutes(false);

    if (updated) {
      console.info('[Background] 线路配置已自动更新');
      await registerDynamicContentScripts();
    }
  } catch (e: any) {
    const message = e?.message || String(e);
    console.warn('[Background] 自动更新线路配置失败:', message);
    console.warn('[Background] 自动更新线路配置错误详情:', e);
  }
}

export function initializeRouteAutoUpdate(): void {
  autoUpdateRoutes();
}
