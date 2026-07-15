// src/dashboard/tabs/mount.ts
// 负责在需要时挂载 Tab 的 partial 与样式

import { ensureMounted, loadPartial, injectPartial } from '../loaders/partialsLoader';
import { ensureStylesLoaded } from '../loaders/stylesLoader';
import { TAB_PARTIALS } from './resources';

function getTabPartial(tabId: string) {
  return TAB_PARTIALS[tabId] ?? null;
}

export async function mountTabIfNeeded(tabId: string): Promise<void> {
  try {
    // 处理设置页面的子路径（tab-settings/xxx-settings）
    if (tabId === 'tab-settings') {
      const hash = window.location.hash.substring(1);
      const [mainTab, subSection] = hash.split('/');
      
      // 如果有子路径，直接加载对应的子页面
      if (mainTab === 'tab-settings' && subSection) {
        console.debug('[mount] 检测到设置子页面:', subSection);

        // 进入子页前卸掉 React 索引，避免与 partial 叠层
        try {
          const { unmountSettingsIndexPage } = await import('../../apps/dashboard/pages/settings/mountSettingsIndexPage');
          unmountSettingsIndexPage('#tab-settings');
        } catch {}

        // 构建子页面的配置键（例如：network-test-settings -> tab-settings-network-test）
        const subPageKey = `tab-settings-${subSection.replace('-settings', '')}`;
        const subCfg = getTabPartial(subPageKey);
        
        console.debug('[mount] 子页面配置键:', subPageKey);
        console.debug('[mount] 子页面配置:', subCfg);
        
        if (subCfg) {
          // 所有设置子页：React 壳（返回栏/标题）+ 原 partial HTML/样式/交互不变
          const html = await loadPartial(subCfg.name);
          if (html) {
            const { resolveSettingsSubpageMeta } = await import('../../apps/dashboard/pages/settings/settingsNavModel');
            const { mountSettingsSubpageShell } = await import('../../apps/dashboard/pages/settings/mountSettingsSubpageShell');
            const meta = resolveSettingsSubpageMeta(subSection);
            mountSettingsSubpageShell({
              title: meta.title,
              description: meta.description,
              panelHtml: html,
              panelRootId: meta.panelRootId,
            });
            console.debug('[mount] 设置子页：React 壳 + 原 partial', subSection);
          } else {
            console.warn('[mount] 设置子页 partial 为空:', subCfg.name);
          }

          if (subCfg.styles && subCfg.styles.length) {
            await ensureStylesLoaded(subCfg.styles);
          }

          return;
        } else {
          console.warn('[mount] 未找到子页面配置，回退到导航页:', subPageKey);
        }
      }
      
      // 没有子路径：设置中心索引页由 React 接管，跳过 HTML partial
      const cfg = getTabPartial('tab-settings');
      if (cfg?.styles?.length) {
        await ensureStylesLoaded(cfg.styles);
      }
      // 清空可能残留的子页 HTML，交给 initSettingsTab 挂 React
      const host = document.getElementById('tab-settings');
      if (host && host.querySelector('[data-settings-react-root]') == null) {
        // 保留空容器；init 会渲染
      }
      console.debug('[mount] 设置导航页交给 React 入口');
      return;
    }
    
    // 原有逻辑
    const cfg = getTabPartial(tabId);
    if (!cfg) return;

    // React/脚本自建 DOM 的 tab：不注入 HTML partial
    if (cfg.skipPartial) {
      if (cfg.styles && cfg.styles.length) {
        await ensureStylesLoaded(cfg.styles);
      }
      return;
    }

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
