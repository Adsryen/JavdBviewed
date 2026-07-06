/**
 * @file dashboardNavigation.test.ts
 * @description Dashboard 9C 导航 DOM 行为测试
 * @module tests/dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const navigationMocks = vi.hoisted(() => ({
  initializeTabById: vi.fn(() => Promise.resolve()),
  mountTabIfNeeded: vi.fn(() => Promise.resolve()),
  prefetchModuleById: vi.fn(() => Promise.resolve()),
  prefetchTabResources: vi.fn(() => Promise.resolve()),
  prefetchedTabs: new Set<string>(),
}));

vi.mock('../../src/dashboard/tabs/mount', () => ({
  mountTabIfNeeded: navigationMocks.mountTabIfNeeded,
}));

vi.mock('../../src/dashboard/tabs/registry', () => ({
  initializeTabById: navigationMocks.initializeTabById,
  prefetchModuleById: navigationMocks.prefetchModuleById,
}));

vi.mock('../../src/dashboard/tabs/resources', () => ({
  prefetchedTabs: navigationMocks.prefetchedTabs,
  prefetchTabResources: navigationMocks.prefetchTabResources,
}));

describe('Dashboard 9C navigation runtime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigationMocks.prefetchedTabs.clear();
    setupDashboardShell();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    window.history.replaceState({}, '', '/dashboard/dashboard.html');
  });

  it('renders grouped menus and activates old direct tab hashes', async () => {
    window.history.replaceState({}, '', '/dashboard/dashboard.html#tab-records');
    const showEvents: string[] = [];
    window.addEventListener('tab:show', event => {
      const customEvent = event as CustomEvent<{ tabId?: string }>;
      if (customEvent.detail?.tabId) {
        showEvents.push(customEvent.detail.tabId);
      }
    }, { once: true });

    const { initTabs } = await import('../../src/dashboard/tabs/navigation');
    await initTabs();
    await flushNavigationTasks();

    expect(readButtonLabels('.dashboard-main-tab')).toEqual([
      '首页',
      '资料库',
      '媒体库',
      '同步与任务',
      '分析与诊断',
      '设置',
    ]);
    expect(readButtonLabels('.dashboard-sub-tab')).toEqual([
      '番号库',
      '演员库',
      '新作品',
      '收藏中心',
      '回收站',
    ]);
    expect(document.querySelector('.dashboard-main-tab.active')?.textContent).toBe('资料库');
    expect(document.querySelector('.dashboard-sub-tab.active')?.textContent).toBe('番号库');
    expect(document.getElementById('dashboard-section-nav')?.parentElement).toBe(document.getElementById('tab-records'));
    expect(document.getElementById('tab-records')?.classList.contains('active')).toBe(true);
    expect(document.getElementById('tab-home')?.classList.contains('active')).toBe(false);
    expect(navigationMocks.mountTabIfNeeded).toHaveBeenCalledWith('tab-records');
    expect(navigationMocks.initializeTabById).toHaveBeenCalledWith('tab-records');
    expect(showEvents).toContain('tab-records');
  });

  it('keeps primary menu in the 9B head and leaves secondary menu for the page area', () => {
    const host = document.createElement('div');
    host.innerHTML = readFileSync(
      resolve(process.cwd(), 'src/dashboard/partials/layout/tabs-nav.html'),
      'utf8',
    );

    const shell = host.querySelector('.dashboard-nav-shell');
    const mainTabs = host.querySelector('#dashboard-main-tabs');
    const sectionNav = host.querySelector('#dashboard-section-nav');

    expect(shell).toBeTruthy();
    expect(shell?.classList.contains('tabs-nav')).toBe(true);
    expect(shell?.getAttribute('data-area')).toBe('navigation');
    expect(mainTabs?.closest('.dashboard-nav-shell')).toBe(shell);
    expect(host.querySelector('.dashboard-nav-quick')).toBeNull();
    expect(host.textContent).not.toContain('页面内二级目录');
    expect(sectionNav?.closest('.dashboard-nav-shell')).toBeNull();
  });

  it('uses the dashboard blue theme instead of the indigo 9C prototype colors', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'src/dashboard/styles/04-components/layout.css'),
      'utf8',
    );

    expect(css).toContain('background: var(--primary-light)');
    expect(css).toContain('color: var(--primary-active)');
    expect(css).not.toContain('#3730a3');
    expect(css).not.toContain('#eef2ff');
    expect(css).not.toContain('#c7d2fe');
  });

  it('presents the media library as an in-development preview instead of a live library', () => {
    const mediaHtml = readFileSync(
      resolve(process.cwd(), 'src/dashboard/partials/tabs/media.html'),
      'utf8',
    );

    expect(mediaHtml).toContain('媒体库 · 开发中');
    expect(mediaHtml).toContain('正在规划媒体库');
    expect(mediaHtml).toContain('媒体库入口先开放');
    expect(mediaHtml).toContain('优先看到的使用场景');
    expect(mediaHtml).toContain('暂时不会连接你的 115、Emby 或 Jellyfin');
    expect(mediaHtml).toContain('115');
    expect(mediaHtml).toContain('Emby');
    expect(mediaHtml).toContain('Jellyfin');
    expect(mediaHtml).not.toContain('当前页面不会读取');
    expect(mediaHtml).not.toContain('避免用户误以为');
    expect(mediaHtml).not.toContain('先把入口放出来');
    expect(mediaHtml).not.toContain('我想');
    expect(mediaHtml).not.toContain('我放');
    expect(mediaHtml).not.toContain('立即播放');
    expect(mediaHtml).not.toContain('已接入');
  });

  it('links the media library preview to GitHub issues for requirement feedback', () => {
    const host = document.createElement('div');
    host.innerHTML = readFileSync(
      resolve(process.cwd(), 'src/dashboard/partials/tabs/media.html'),
      'utf8',
    );

    const feedbackPanel = host.querySelector('.media-feedback-panel');
    const issueLink = feedbackPanel?.querySelector<HTMLAnchorElement>('a[href="https://github.com/Adsryen/JavdBviewed/issues"]');

    expect(feedbackPanel).toBeTruthy();
    expect(feedbackPanel?.textContent ?? '').toContain('媒体库优先做哪一块');
    expect(feedbackPanel?.textContent ?? '').toContain('提交需求或建议');
    expect(issueLink).toBeTruthy();
    expect(issueLink?.target).toBe('_blank');
    expect(issueLink?.rel).toContain('noopener');
    expect(issueLink?.rel).toContain('noreferrer');
  });

  it('hides the secondary menu for the single-entry home group', async () => {
    window.history.replaceState({}, '', '/dashboard/dashboard.html#tab-home');

    const { initTabs } = await import('../../src/dashboard/tabs/navigation');
    await initTabs();
    await flushNavigationTasks();

    const sectionNav = document.getElementById('dashboard-section-nav');
    expect(readButtonLabels('.dashboard-sub-tab')).toEqual([]);
    expect(sectionNav?.hidden).toBe(true);
    expect(document.querySelector('.dashboard-main-tab.active')?.textContent).toBe('首页');
    expect(document.getElementById('tab-home')?.classList.contains('active')).toBe(true);
  });

  it('switches media source subitems with source hashes', async () => {
    window.history.replaceState({}, '', '/dashboard/dashboard.html#tab-home');

    const { initTabs } = await import('../../src/dashboard/tabs/navigation');
    await initTabs();
    await flushNavigationTasks();

    document.querySelector<HTMLButtonElement>('.dashboard-main-tab[data-nav-group-id="media"]')?.click();
    await flushNavigationTasks();

    expect(readButtonLabels('.dashboard-sub-tab')).toEqual(['全部', '115', 'Emby', 'Jellyfin']);

    document.querySelector<HTMLButtonElement>('.dashboard-sub-tab[data-nav-item-id="media-emby"]')?.click();
    await flushNavigationTasks();

    expect(window.location.hash).toBe('#tab-media/emby');
    expect(document.querySelector('.dashboard-main-tab.active')?.textContent).toBe('媒体库');
    expect(document.querySelector('.dashboard-sub-tab.active')?.textContent).toBe('Emby');
    expect(document.getElementById('tab-media')?.classList.contains('active')).toBe(true);
    expect(navigationMocks.mountTabIfNeeded).toHaveBeenCalledWith('tab-media');
    expect(navigationMocks.initializeTabById).toHaveBeenCalledWith('tab-media');
  });

  it('keeps settings subpage hashes active under the settings group', async () => {
    window.history.replaceState({}, '', '/dashboard/dashboard.html#tab-settings/drive115-settings');

    const { initTabs } = await import('../../src/dashboard/tabs/navigation');
    await initTabs();
    await flushNavigationTasks();

    expect(window.location.hash).toBe('#tab-settings/drive115-settings');
    expect(document.querySelector('.dashboard-main-tab.active')?.textContent).toBe('设置');
    expect(readButtonLabels('.dashboard-sub-tab')).toEqual([]);
    expect(document.getElementById('dashboard-section-nav')?.hidden).toBe(true);
    expect(document.getElementById('tab-settings')?.classList.contains('active')).toBe(true);
    expect(navigationMocks.mountTabIfNeeded).toHaveBeenCalledWith('tab-settings');
    expect(navigationMocks.initializeTabById).toHaveBeenCalledWith('tab-settings');
  });
});

function setupDashboardShell(): void {
  document.body.innerHTML = `
    <div class="tabs-nav dashboard-nav-shell" data-area="navigation">
      <div class="dashboard-nav-head">
        <div class="tabs dashboard-main-tabs" id="dashboard-main-tabs"></div>
      </div>
    </div>
    <div class="dashboard-section-nav" id="dashboard-section-nav" data-area="navigation"></div>
    <div id="tab-home" class="tab-content active"></div>
    <div id="tab-records" class="tab-content"></div>
    <div id="tab-lists" class="tab-content"></div>
    <div id="tab-actors" class="tab-content"></div>
    <div id="tab-new-works" class="tab-content"></div>
    <div id="tab-recycle-bin" class="tab-content"></div>
    <div id="tab-media" class="tab-content"></div>
    <div id="tab-sync" class="tab-content"></div>
    <div id="tab-drive115-tasks" class="tab-content"></div>
    <div id="tab-insights" class="tab-content"></div>
    <div id="tab-settings" class="tab-content"></div>
    <div id="tab-logs" class="tab-content"></div>
  `;
}

function readButtonLabels(selector: string): string[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>(selector))
    .map(button => button.textContent?.trim() ?? '');
}

async function flushNavigationTasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}
