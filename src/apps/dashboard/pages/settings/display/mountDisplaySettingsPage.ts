/**
 * @file mountDisplaySettingsPage.ts
 * @description 挂载显示设置 React 全页（flushSync 保证同步就绪）
 * @module apps/dashboard/pages/settings/display
 */
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import {
  clearSettingsReactRoot,
  setSettingsReactRoot,
} from '../settingsReactRoots';
import { DisplaySettingsPage } from './DisplaySettingsPage';
import '../settingsSubpageShell.css';
import '../../../../../ui/styles/globals.css';

/**
 * 在 #tab-settings 挂载显示设置 React 页（跳过 partial HTML）
 */
export function mountDisplaySettingsPage(hostSelector = '#tab-settings'): void {
  const host = document.querySelector(hostSelector);
  if (!host) {
    throw new Error(`[DisplaySettingsPage] missing host ${hostSelector}`);
  }

  clearSettingsReactRoot(host);
  host.innerHTML = '';

  const mount = document.createElement('div');
  mount.dataset.settingsSubpageRoot = '1';
  mount.dataset.displaySettingsReact = '1';
  host.appendChild(mount);

  const root = createRoot(mount);
  setSettingsReactRoot(host, 'subpage', root, mount);

  flushSync(() => {
    root.render(createElement(DisplaySettingsPage));
  });
}

/**
 * 卸载显示设置 React 页
 */
export function unmountDisplaySettingsPage(hostSelector = '#tab-settings'): void {
  const host = document.querySelector(hostSelector);
  if (!host) return;
  clearSettingsReactRoot(host);
}
