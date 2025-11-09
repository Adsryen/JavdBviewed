// src/dashboard/tabs/resources.ts
// 集中维护各 Tab 的 partial 与样式资源，以及悬停预取逻辑

import { loadPartial } from '../loaders/partialsLoader';
import { prefetchStyles } from '../loaders/stylesLoader';

export const TAB_PARTIALS: Record<string, { name: string; styles?: string[] }> = {
  // 首页（首屏）
  'tab-home': {
    name: 'tabs/home.html',
    styles: [
      './styles/_home.css',
      './styles/_stats.css',
    ],
  },
  // 号码库
  'tab-records': {
    name: 'tabs/records.html',
    styles: [
      './styles/_records.css',
    ],
  },
  // 演员库
  'tab-actors': {
    name: 'tabs/actors.html',
    styles: [
      './actors.css',
    ],
  },
  // 新作品
  'tab-new-works': {
    name: 'tabs/new-works.html',
    styles: [
      './styles/_newWorks.css',
    ],
  },
  // 数据同步
  'tab-sync': {
    name: 'tabs/sync.html',
    styles: [
      './styles/_dataSync.css',
    ],
  },
  // 115 任务
  'tab-drive115-tasks': {
    name: 'tabs/drive115-tasks.html',
    styles: [
      './styles/drive115Tasks.css',
    ],
  },
  'tab-insights': {
    name: 'tabs/insights.html',
    styles: [
    ],
  },
  // 设置（基础样式，其余细分样式由各子面板自行导入或保留全局）
  'tab-settings': {
    name: 'tabs/settings.html',
    styles: [
      './styles/settings/index.css',
      './styles/settings/settings.css',
    ],
  },
  // 日志
  'tab-logs': {
    name: 'tabs/logs.html',
    styles: [
      './styles/logs.css',
      './styles/settings/logs.css',
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
