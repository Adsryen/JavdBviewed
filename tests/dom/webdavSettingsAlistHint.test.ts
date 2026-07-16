/**
 * @file webdavSettingsAlistHint.test.ts
 * @description WebDAV 设置 Alist URL 提示测试
 * @module tests/dom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { STATE } from '../../apps/extension/src/dashboard/state';
import { WebDAVSettings } from '../../apps/extension/src/dashboard/tabs/settings/webdav/WebDAVSettings';
import { DEFAULT_SETTINGS } from '../../apps/extension/src/utils/config';

vi.mock('../../apps/extension/src/utils/storage', () => ({
  getSettings: vi.fn(async () => STATE.settings),
  saveSettings: vi.fn(async () => undefined),
}));

const root = process.cwd();

function setWebdavSettingsHtml(): void {
  const htmlPath = path.resolve(root, 'apps/extension/src/dashboard/partials/tabs/settings-webdav.html');
  document.body.innerHTML = `<div id="messageContainer"></div>${fs.readFileSync(htmlPath, 'utf8')}`;
}

function createWebdavSettings(): WebDAVSettings {
  const settings = new WebDAVSettings() as unknown as {
    initializeElements(): void;
    bindEvents(): void;
  };
  settings.initializeElements();
  settings.bindEvents();
  return settings as unknown as WebDAVSettings;
}

describe('WebDAV settings Alist URL hint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setWebdavSettingsHtml();
    STATE.settings = structuredClone(DEFAULT_SETTINGS);
  });

  it('shows an actionable Alist /dav/ hint and applies it in the config modal', () => {
    createWebdavSettings();
    (document.getElementById('addWebdavConfig') as HTMLButtonElement).click();

    const urlInput = document.getElementById('modalWebdavUrl') as HTMLInputElement;
    urlInput.value = 'https://alist.example.com';
    urlInput.dispatchEvent(new Event('input'));

    const hint = document.getElementById('modalWebdavAlistHint') as HTMLDivElement;
    expect(hint.hidden).toBe(false);
    expect(hint.textContent).toContain('Alist');
    expect(hint.textContent).toContain('https://alist.example.com/dav/');

    (hint.querySelector('[data-action="apply-alist-url-hint"]') as HTMLButtonElement).click();

    expect(urlInput.value).toBe('https://alist.example.com/dav/');
    expect((document.getElementById('modalWebdavFolder') as HTMLInputElement).value).toBe('');
    expect(hint.hidden).toBe(true);
  });
});
