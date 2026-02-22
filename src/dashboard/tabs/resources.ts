// src/dashboard/tabs/resources.ts
// 集中维护各 Tab 的 partial 与样式资源，以及悬停预取逻辑

import { loadPartial } from '../loaders/partialsLoader';
import { prefetchStyles } from '../loaders/stylesLoader';

export const TAB_PARTIALS: Record<string, { name: string; styles?: string[] }> = {
  // 首页（首屏）
  'tab-home': {
    name: 'tabs/home.html',
    styles: [
      './styles/05-pages/home.css',
    ],
  },
  // 号码库
  'tab-records': {
    name: 'tabs/records.html',
    styles: [
      './styles/05-pages/records.css',
    ],
  },
  // 清单
  'tab-lists': {
    name: 'tabs/lists.html',
    styles: [
      './styles/05-pages/lists.css',
    ],
  },
  // 演员库
  'tab-actors': {
    name: 'tabs/actors.html',
    styles: [
      './styles/05-pages/actors.css',
    ],
  },
  // 新作品
  'tab-new-works': {
    name: 'tabs/new-works.html',
    styles: [
      './styles/05-pages/newWorks.css',
    ],
  },
  // 数据同步
  'tab-sync': {
    name: 'tabs/sync.html',
    styles: [
      './styles/05-pages/sync.css',
    ],
  },
  // 115 任务
  'tab-drive115-tasks': {
    name: 'tabs/drive115-tasks.html',
    styles: [
      './styles/05-pages/drive115Tasks.css',
    ],
  },
  'tab-insights': {
    name: 'tabs/insights.html',
    styles: [
      './styles/05-pages/settings/enhancement.css',
    ],
  },
  // 设置导航页
  'tab-settings': {
    name: 'tabs/settings-index.html',
    styles: [
      './styles/05-pages/settings/settings.css',
    ],
  },
  // 设置子页面
  'tab-settings-display': {
    name: 'tabs/settings-display.html',
    styles: [
      './styles/05-pages/settings/settings.css',
      './styles/05-pages/settings/display.css',
    ],
  },
  'tab-settings-enhancement': {
    name: 'tabs/settings-enhancement.html',
    styles: [
      './styles/05-pages/settings/settings.css',
      './styles/05-pages/settings/enhancement.css',
    ],
  },
  'tab-settings-search-engine': {
    name: 'tabs/settings-search-engine.html',
    styles: [
      './styles/05-pages/settings/settings.css',
      './styles/05-pages/settings/searchEngine.css',
    ],
  },
  'tab-settings-ai': {
    name: 'tabs/settings-ai.html',
    styles: [
      './styles/05-pages/settings/settings.css',
      './styles/05-pages/settings/aiSettings.css',
    ],
  },
  'tab-settings-privacy': {
    name: 'tabs/settings-privacy.html',
    styles: [
      './styles/05-pages/settings/settings.css',
      './styles/05-pages/settings/privacy.css',
    ],
  },
  'tab-settings-webdav': {
    name: 'tabs/settings-webdav.html',
    styles: [
      './styles/05-pages/settings/settings.css',
      './styles/05-pages/settings/webdav.css',
    ],
  },
  'tab-settings-sync': {
    name: 'tabs/settings-sync.html',
    styles: [
      './styles/05-pages/settings/settings.css',
      './styles/05-pages/settings/sync.css',
    ],
  },
  'tab-settings-drive115': {
    name: 'tabs/settings-drive115.html',
    styles: [
      './styles/05-pages/settings/settings.css',
      './styles/05-pages/settings/drive115.css',
    ],
  },
  'tab-settings-emby': {
    name: 'tabs/settings-emby.html',
    styles: [
      './styles/05-pages/settings/settings.css',
      './styles/05-pages/settings/emby.css',
      './styles/05-pages/settings/enhancement.css',
    ],
  },
  'tab-settings-insights': {
    name: 'tabs/settings-insights.html',
    styles: [
      './styles/05-pages/settings/settings.css',
      './styles/05-pages/settings/insightsSettings.css',
    ],
  },
  'tab-settings-log': {
    name: 'tabs/settings-log.html',
    styles: [
      './styles/05-pages/settings/settings.css',
      './styles/05-pages/settings/logs.css',
    ],
  },
  'tab-settings-advanced': {
    name: 'tabs/settings-advanced.html',
    styles: [
      './styles/05-pages/settings/settings.css',
      './styles/05-pages/settings/advanced.css',
    ],
  },
  'tab-settings-network-test': {
    name: 'tabs/settings-network-test.html',
    styles: [
      './styles/05-pages/settings/settings.css',
      './styles/05-pages/settings/networkTest.css',
    ],
  },
  'tab-settings-global-actions': {
    name: 'tabs/settings-global-actions.html',
    styles: [
      './styles/05-pages/settings/settings.css',
      './styles/05-pages/settings/globalActions.css',
    ],
  },
  'tab-settings-update': {
    name: 'tabs/settings-update.html',
    styles: [
      './styles/05-pages/settings/settings.css',
      './styles/05-pages/settings/update.css',
    ],
  },
  // 日志
  'tab-logs': {
    name: 'tabs/logs.html',
    styles: [
      './styles/05-pages/logs.css',
    ],
  },
};

// 悬停预取：避免重复预取
export const prefetchedTabs = new Set<string>();

export async function prefetchTabResources(tabId: string): Promise<void> {
  try {
    const cfg = (TAB_PARTIALS as any)[tabId];
    if (!cfg) return;
    // 预取 partial（raw 内联命中则无网络）
    loadPartial(cfg.name).catch(() => {});
    // 预取 CSS（不应用，仅热身缓存）
    if (cfg.styles && cfg.styles.length) {
      await prefetchStyles(cfg.styles);
    }
    prefetchedTabs.add(tabId);
  } catch {}
}
