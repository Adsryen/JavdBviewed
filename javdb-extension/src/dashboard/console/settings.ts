// src/dashboard/console/settings.ts
// 控制台设置：从 storage 读取并应用；监听 storage 变化后动态更新

export async function applyConsoleSettingsFromStorage_DB(): Promise<void> {
  try {
    const { getSettings } = await import('../../utils/storage');
    const settings = await getSettings();
    const logging: any = (settings as any).logging || {};
    const ctrl: any = (window as any).__JDB_CONSOLE__;
    if (!ctrl) return;
    if (logging.consoleLevel) ctrl.setLevel(logging.consoleLevel);
    if (logging.consoleFormat) {
      ctrl.setFormat({
        showTimestamp: logging.consoleFormat.showTimestamp ?? true,
        showSource: logging.consoleFormat.showSource ?? true,
        color: logging.consoleFormat.color ?? true,
        timeZone: logging.consoleFormat.timeZone || 'Asia/Shanghai',
      });
    }
    
    // 应用日志模块配置（优先使用 logModules，向后兼容 consoleCategories）
    const modules = logging.logModules || logging.consoleCategories || {};
    const cfg = ctrl.getConfig();
    const allKeys = Object.keys(cfg?.categories || {});
    for (const key of allKeys) {
      const flag = modules[key];
      if (flag === false) ctrl.disable(key);
      else if (flag === true) ctrl.enable(key);
    }
  } catch (e) {
    console.warn('[ConsoleProxy] Failed to apply settings in DB:', e);
  }
}

export function bindConsoleSettingsListener(): void {
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && (changes as any)['settings']) {
        applyConsoleSettingsFromStorage_DB();
      }
    });
  } catch {}
}
