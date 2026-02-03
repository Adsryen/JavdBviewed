// src/dashboard/tabs/mount.ts
// 负责在需要时挂载 Tab 的 partial 与样式

import { ensureMounted, loadPartial, injectPartial } from '../loaders/partialsLoader';
import { ensureStylesLoaded } from '../loaders/stylesLoader';
import { TAB_PARTIALS } from './resources';

export async function mountTabIfNeeded(tabId: string): Promise<void> {
  try {
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
