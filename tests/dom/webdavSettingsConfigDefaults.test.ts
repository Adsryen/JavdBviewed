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

function installWebdavRuntimeResponder(): { sendMessage: ReturnType<typeof vi.fn>; messages: any[] } {
  const messages: any[] = [];
  const sendMessage = vi.fn((message: any, callback?: (response: any) => void) => {
    messages.push(structuredClone(message));
    if (message?.type === 'webdav-get-client-profile') {
      callback?.({
        success: true,
        profile: {
          clientId: 'local-device',
          deviceLabel: '本机',
          browserName: 'Chrome',
          lastSeenAt: '2026-07-08T00:00:00.000Z',
          extensionVersion: '1.21.2',
        },
      });
      return;
    }
    if (message?.type === 'webdav-list-clients') {
      callback?.({ success: true, clients: [] });
      return;
    }
    if (message?.type === 'webdav-upload-config') {
      callback?.({
        success: true,
        configId: message.configId,
        configName: message.configId === 'config-b' ? '备用端' : '坚果云',
      });
      return;
    }
    if (message?.type === 'webdav-upload-all') {
      callback?.({
        success: false,
        total: 2,
        succeeded: 1,
        failed: 1,
        results: [
          { configId: 'config-a', configName: '坚果云', success: true },
          { configId: 'config-b', configName: '备用端', success: false, error: '连接失败' },
        ],
      });
      return;
    }
    callback?.({ success: true });
  });

  Object.defineProperty(globalThis, 'chrome', {
    value: {
      ...(globalThis.chrome || {}),
      runtime: {
        ...(globalThis.chrome?.runtime || {}),
        id: 'test-runtime',
        lastError: undefined,
        sendMessage,
      },
    },
    configurable: true,
  });

  return { sendMessage, messages };
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

  it('backs up a single config from the row action without switching the default endpoint', async () => {
    const runtime = installWebdavRuntimeResponder();
    const { doLoadSettings } = createWebdavSettings();
    await doLoadSettings();
    runtime.sendMessage.mockClear();
    runtime.messages.length = 0;
    vi.mocked(saveSettings).mockClear();

    const standbyConfig = document.querySelector<HTMLElement>('[data-config-id="config-b"]');
    const backupButton = standbyConfig?.querySelector<HTMLButtonElement>('[data-action="backup-now"]');

    expect(backupButton).toBeInstanceOf(HTMLButtonElement);
    expect(backupButton?.title).toBe('立即备份到此端');
    expect(backupButton?.getAttribute('aria-label')).toBe('立即备份到此端');

    backupButton?.click();
    await flushAsyncAction();

    expect(runtime.messages).toContainEqual({ type: 'webdav-upload-config', configId: 'config-b' });
    expect(saveSettings).not.toHaveBeenCalled();
    expect(STATE.settings.webdav?.activeConfigId).toBe('config-a');
  });

  it('backs up to all configured endpoints from the config manager action', async () => {
    const runtime = installWebdavRuntimeResponder();
    const { doLoadSettings } = createWebdavSettings();
    await doLoadSettings();
    runtime.sendMessage.mockClear();
    runtime.messages.length = 0;

    const backupAllButton = document.querySelector<HTMLButtonElement>('#backupAllWebdavConfigs');

    expect(backupAllButton).toBeInstanceOf(HTMLButtonElement);
    expect(backupAllButton?.textContent || '').toContain('备份到全部备份端');

    backupAllButton?.click();
    await flushAsyncAction();

    expect(runtime.messages).toContainEqual({ type: 'webdav-upload-all' });
  });

  it('keeps edit and delete buttons visually merged into the config row', () => {
    const actionContainerRule = readCssRule('.webdav-config-item .config-actions');
    const defaultBadgeRule = readCssRule('.config-default-badge');
    const defaultButtonRule = readCssRule('.config-default-btn');
    const scopedDefaultButtonRule = readCssRule('.webdav-config-item .config-actions .config-default-btn');
    const actionButtonRule = readCssRule('.config-action-btn');
    const scopedActionButtonRule = readCssRule('.webdav-config-item .config-actions .config-action-btn');
    const scopedBackupButtonRule = readCssRule('.webdav-config-item .config-actions .config-action-btn.backup');
    const scopedBackupHoverRule = readCssRule('.webdav-config-item .config-actions .config-action-btn.backup:hover');
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
    expect(scopedBackupButtonRule).toContain('background: transparent');
    expect(scopedBackupButtonRule).toContain('border: 1px solid transparent');
    expect(scopedBackupButtonRule).toContain('box-shadow: none');
    expect(scopedBackupHoverRule).toContain('color: var(--webdav-primary)');
    expect(rowHoverActionRule).toContain('opacity: 1');
    expect(darkActionButtonRule).toContain('background: transparent');
    expect(darkActionButtonRule).toContain('border-color: transparent');
  });
});
