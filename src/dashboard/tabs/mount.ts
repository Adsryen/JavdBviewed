// src/dashboard/tabs/mount.ts
// 负责在需要时挂载 Tab 的 partial 与样式

import { ensureMounted, loadPartial, injectPartial } from '../loaders/partialsLoader';
import { ensureStylesLoaded } from '../loaders/stylesLoader';
import { TAB_PARTIALS } from './resources';

export async function mountTabIfNeeded(tabId: string): Promise<void> {
  try {
    // 处理设置页面的子路径（tab-settings/xxx-settings）
    if (tabId === 'tab-settings') {
      const hash = window.location.hash.substring(1);
      const [mainTab, subSection] = hash.split('/');
      
      if (mainTab === 'tab-settings' && subSection) {
        // 有子路径：加载对应的设置页面
        const sectionToTabId: Record<string, string> = {
          'display-settings': 'tab-settings-display',
          'ai-settings': 'tab-settings-ai',
          'search-engine-settings': 'tab-settings-search-engine',
          'privacy-settings': 'tab-settings-privacy',
          'webdav-settings': 'tab-settings-webdav',
          'sync-settings': 'tab-settings-sync',
          'drive115-settings': 'tab-settings-drive115',
          'emby-settings': 'tab-settings-emby',
          'enhancement-settings': 'tab-settings-enhancement',
          'advanced-settings': 'tab-settings-advanced',
          'log-settings': 'tab-settings-log',
          'insights-settings': 'tab-settings-insights',
          'network-test-settings': 'tab-settings-network-test',
          'global-actions': 'tab-settings-global-actions',
          'update-settings': 'tab-settings-update',
        };
        
        const newTabId = sectionToTabId[subSection];
        
        if (newTabId) {
          const cfg = (TAB_PARTIALS as any)[newTabId];
          
          if (cfg) {
            const selector = '#tab-settings';
            const html = await loadPartial(cfg.name);
            
            if (html) {
              await injectPartial(selector, html, { mode: 'replace' });
            }
            if (cfg.styles && cfg.styles.length) {
              await ensureStylesLoaded(cfg.styles);
            }
            return;
          }
        }
      } else if (mainTab === 'tab-settings' && !subSection) {
        // 没有子路径：加载导航页
        const cfg = (TAB_PARTIALS as any)['tab-settings'];
        if (cfg) {
          const selector = '#tab-settings';
          const html = await loadPartial(cfg.name);
          
          if (html) {
            await injectPartial(selector, html, { mode: 'replace' });
          }
          if (cfg.styles && cfg.styles.length) {
            await ensureStylesLoaded(cfg.styles);
          }
          return;
        }
      }
    }
    
    // 原有逻辑
    const cfg = (TAB_PARTIALS as any)[tabId];
    if (!cfg) return;

    const selector = `#${tabId}`;
    const el = document.querySelector(selector) as HTMLElement | null;

    // 先尝试仅在空容器时挂载，兼容已迁移完成的占位容器
    await ensureMounted(selector, cfg.name);

    // 如果仍然是旧的内联DOM（未标记partialLoaded），执行一次性替换为partial
    if (el && (el as any).dataset?.partialLoaded !== 'true') {
      const html = await loadPartial(cfg.name);
      if (html) {
        await injectPartial(selector, html, { mode: 'replace' });
      }
    }

    if (cfg.styles && cfg.styles.length) {
      await ensureStylesLoaded(cfg.styles);
    }
  } catch (e) {
    console.warn('[Dashboard] mountTabIfNeeded failed for', tabId, e);
  }
}
