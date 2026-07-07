/**
 * @file webdavSettingsConfigDefaults.test.ts
 * @description WebDAV 设置页默认备份端切换测试
 * @module tests/dom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { STATE } from '../../src/dashboard/state';
import { WebDAVSettings } from '../../src/dashboard/tabs/settings/webdav/WebDAVSettings';
import { DEFAULT_SETTINGS } from '../../src/utils/config';
import { saveSettings } from '../../src/utils/storage';

vi.mock('../../src/utils/storage', () => ({
  getSettings: vi.fn(async () => STATE.settings),
  saveSettings: vi.fn(async () => undefined),
}));

const root = process.cwd();
const webdavCssPath = path.resolve(root, 'src/dashboard/styles/05-pages/settings/webdav.css');

function setWebdavSettingsHtml(): void {
  const htmlPath = path.resolve(root, 'src/dashboard/partials/tabs/settings-webdav.html');
  document.body.innerHTML = `<div id="messageContainer"></div>${fs.readFileSync(htmlPath, 'utf8')}`;
}

function readCssRule(selector: string): string {
  const css = fs.readFileSync(webdavCssPath, 'utf8');
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`));
  return match?.[1] || '';
}

function createWebdavSettings(): {
  panel: WebDAVSettings;
  doLoadSettings: () => Promise<void>;
} {
  const panel = new WebDAVSettings() as unknown as WebDAVSettings & {
    initializeElements(): void;
    bindEvents(): void;
    doLoadSettings(): Promise<void>;
  };
  panel.initializeElements();
  panel.bindEvents();
  return {
    panel,
    doLoadSettings: () => panel.doLoadSettings(),
  };
}

async function flushAsyncAction(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe('WebDAV settings config default endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setWebdavSettingsHtml();
    STATE.settings = structuredClone(DEFAULT_SETTINGS);
    STATE.settings.webdav = {
      ...(STATE.settings.webdav || {}),
      enabled: true,
      activeConfigId: 'config-a',
      url: 'https://dav-a.example.com/dav/',
      username: 'user-a',
      password: 'pass-a',
      configs: [
        {
          id: 'config-a',
          name: '坚果云',
          url: 'https://dav-a.example.com/dav/',
          username: 'user-a',
          password: 'pass-a',
          provider: 'jianguoyun',
          createdAt: 1000,
          updatedAt: 1000,
          lastSync: null,
        },
        {
          id: 'config-b',
          name: '备用端',
          url: 'https://dav-b.example.com/dav/',
          username: 'user-b',
          password: 'pass-b',
          provider: 'custom',
          createdAt: 2000,
          updatedAt: 2000,
          lastSync: null,
        },
      ],
    };
  });

  it('renders the default endpoint status and switches it from an explicit button', async () => {
    const { doLoadSettings } = createWebdavSettings();
    await doLoadSettings();

    const activeConfig = document.querySelector<HTMLElement>('[data-config-id="config-a"]');
    const standbyConfig = document.querySelector<HTMLElement>('[data-config-id="config-b"]');
    expect(activeConfig?.textContent || '').toContain('默认备份端');
    expect(standbyConfig?.textContent || '').toContain('设为默认');

    standbyConfig?.querySelector<HTMLButtonElement>('[data-action="set-default"]')?.click();
    await flushAsyncAction();

    expect(saveSettings).toHaveBeenCalledWith(expect.objectContaining({
      webdav: expect.objectContaining({
        activeConfigId: 'config-b',
        url: 'https://dav-b.example.com/dav/',
        username: 'user-b',
        password: 'pass-b',
      }),
    }));
  });

  it('keeps edit and delete buttons visually merged into the config row', () => {
    const actionContainerRule = readCssRule('.webdav-config-item .config-actions');
    const defaultBadgeRule = readCssRule('.config-default-badge');
    const defaultButtonRule = readCssRule('.config-default-btn');
    const scopedDefaultButtonRule = readCssRule('.webdav-config-item .config-actions .config-default-btn');
    const actionButtonRule = readCssRule('.config-action-btn');
    const scopedActionButtonRule = readCssRule('.webdav-config-item .config-actions .config-action-btn');
    const rowHoverActionRule = readCssRule('.webdav-config-item:hover .config-action-btn');
    const darkActionButtonRule = readCssRule('[data-theme="dark"] .config-action-btn');

    expect(actionContainerRule).toContain('padding: 0');
    expect(actionContainerRule).toContain('background: transparent');
    expect(actionContainerRule).toContain('border-top: none');
    expect(actionContainerRule).toContain('box-shadow: none');
    expect(defaultBadgeRule).toContain('background: transparent');
    expect(defaultBadgeRule).toContain('border: none');
    expect(defaultButtonRule).toContain('background: transparent');
    expect(defaultButtonRule).toContain('border: 1px solid transparent');
    expect(scopedDefaultButtonRule).toContain('flex: 0 0 auto');
    expect(scopedDefaultButtonRule).toContain('box-shadow: none');
    expect(actionButtonRule).toContain('background: transparent');
    expect(actionButtonRule).toContain('border: 1px solid transparent');
    expect(actionButtonRule).toContain('opacity: 0.5');
    expect(scopedActionButtonRule).toContain('flex: 0 0 auto');
    expect(scopedActionButtonRule).toContain('box-shadow: none');
    expect(rowHoverActionRule).toContain('opacity: 1');
    expect(darkActionButtonRule).toContain('background: transparent');
    expect(darkActionButtonRule).toContain('border-color: transparent');
  });
});
