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
      
      // 如果有子路径，直接加载对应的子页面
      if (mainTab === 'tab-settings' && subSection) {
        console.debug('[mount] 检测到设置子页面:', subSection);
        
        // 构建子页面的配置键（例如：network-test-settings -> tab-settings-network-test）
        const subPageKey = `tab-settings-${subSection.replace('-settings', '')}`;
        const subCfg = (TAB_PARTIALS as any)[subPageKey];
        
        console.debug('[mount] 子页面配置键:', subPageKey);
        console.debug('[mount] 子页面配置:', subCfg);
        
        if (subCfg) {
          const selector = '#tab-settings';
          const html = await loadPartial(subCfg.name);
          
          if (html) {
            await injectPartial(selector, html, { mode: 'replace' });
            console.debug('[mount] 子页面 HTML 加载完成:', subSection);
          }
          
          if (subCfg.styles && subCfg.styles.length) {
            await ensureStylesLoaded(subCfg.styles);
          }
          
          return;
        } else {
          console.warn('[mount] 未找到子页面配置，回退到导航页:', subPageKey);
        }
      }
      
      // 没有子路径或子页面配置不存在，加载设置导航页
      const cfg = (TAB_PARTIALS as any)['tab-settings'];
      if (cfg) {
        const selector = '#tab-settings';
        const html = await loadPartial(cfg.name);
        
        if (html) {
          await injectPartial(selector, html, { mode: 'replace' });
          console.debug('[mount] 设置导航页加载完成');
        }
        
        if (cfg.styles && cfg.styles.length) {
          await ensureStylesLoaded(cfg.styles);
        }
      }
      
      return;
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
