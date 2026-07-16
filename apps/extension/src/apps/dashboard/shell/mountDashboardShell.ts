/**
 * @file mountDashboardShell.ts
 * @description 将 React Dashboard 外壳同步挂载到 #app-root，供 bootstrap 在 initTabs 前使用
 * @module apps/dashboard/shell
 */
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { DashboardShell } from './DashboardShell';

/** 已挂载过的宿主节点，避免重复 createRoot */
let mountedFor: Element | null = null;

/**
 * 挂载外壳；若同一宿主已挂载且关键节点存在则跳过
 *
 * @param rootSelector - 挂载选择器，默认 `#app-root`
 */
export function mountDashboardShell(rootSelector = '#app-root'): void {
  const host = document.querySelector(rootSelector);
  if (!host) {
    throw new Error(`[DashboardShell] missing host ${rootSelector}`);
  }
  if (mountedFor === host && host.querySelector('#dashboard-main-tabs')) {
    return;
  }

  const root = createRoot(host);
  // bootstrap 需要同步 DOM，便于随后 initTabs 查询节点
  flushSync(() => {
    root.render(createElement(DashboardShell));
  });
  mountedFor = host;
}
