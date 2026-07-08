/**
 * @file embySettings.test.ts
 * @description Emby settings 测试
 * @module tests/dom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { STATE } from '../../src/dashboard/state';
import { DEFAULT_SETTINGS } from '../../src/utils/config';
import { EmbySettings } from '../../src/dashboard/tabs/settings/emby/EmbySettings';

vi.mock('../../src/utils/storage', () => ({
  getValue: vi.fn(async (_key: string, fallback: unknown) => fallback),
  setValue: vi.fn(async () => undefined),
  getSettings: vi.fn(async () => STATE.settings),
  saveSettings: vi.fn(async () => undefined),
}));

const root = process.cwd();

function createSettings(): any {
  const settings = new EmbySettings() as any;
  settings.initializeElements();
  settings.bindEvents();
  settings.doLoadSettings();
  return settings;
}

function setEmbySettingsHtml(): void {
  const htmlPath = path.resolve(root, 'src/dashboard/partials/tabs/settings-emby.html');
  document.body.innerHTML = `<div id="messageContainer"></div>${fs.readFileSync(htmlPath, 'utf8')}`;
}

describe('Emby settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    (chrome.runtime.sendMessage as any).mockImplementation((_message: unknown, callback?: (response: unknown) => void) => {
      callback?.({ ok: true, success: true });
    });
    STATE.settings = structuredClone(DEFAULT_SETTINGS);
    STATE.settings.emby = {
      ...structuredClone(DEFAULT_SETTINGS.emby),
      enabled: true,
      mediaServers: [],
    };
  });

  it('places media server settings directly after the page toggle section', () => {
    const htmlPath = path.resolve(root, 'src/dashboard/partials/tabs/settings-emby.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const sectionTitles = Array.from(doc.querySelectorAll('.settings-page-body > .settings-card h4'))
      .map((heading) => heading.textContent?.trim());

    expect(sectionTitles).toEqual([
      '基本设置',
      '媒体服务器',
      '额外匹配地址（高级）',
      '链接行为',
      '快捷按钮',
      '媒体库入库状态',
      '使用说明',
    ]);
  });

  it('keeps a new media server as a draft until the user confirms it', () => {
    setEmbySettingsHtml();
    const settings = createSettings();
    const addButton = document.getElementById('add-emby-media-server') as HTMLButtonElement;

    addButton.click();

    expect(document.querySelector('.emby-media-server-create-item')).not.toBeNull();
    expect(STATE.settings.emby.mediaServers).toEqual([]);
    expect(settings.getSettings().emby.mediaServers).toEqual([]);

    (document.querySelector('.emby-create-server-name') as HTMLInputElement).value = '家庭 Emby';
    (document.querySelector('.emby-create-server-url') as HTMLInputElement).value = 'http://192.168.1.10:8096/';
    (document.querySelector('.emby-create-server-api-key') as HTMLInputElement).value = 'secret-key';
    (document.querySelector('.create-emby-media-server-confirm') as HTMLButtonElement).click();

    expect(document.querySelector('.emby-media-server-create-item')).toBeNull();
    expect(STATE.settings.emby.mediaServers).toMatchObject([
      {
        type: 'emby',
        name: '家庭 Emby',
        url: 'http://192.168.1.10:8096',
        apiKey: 'secret-key',
        enabled: true,
      },
    ]);
  });

  it('checks media library membership for an entered video code', async () => {
    setEmbySettingsHtml();
    createSettings();
    (chrome.runtime.sendMessage as any).mockImplementationOnce((message: unknown, callback?: (response: unknown) => void) => {
      expect(message).toEqual({
        type: 'EMBY_LIBRARY_CHECK_CODES',
        codes: ['abc-123'],
      });
      callback?.({
        success: true,
        checked: 1,
        matches: {
          'ABC-123': [
            {
              serverType: 'emby',
              serverName: '家庭 Emby',
              serverUrl: 'http://192.168.1.10:8096',
              itemId: 'item-123',
              itemName: 'ABC-123 Movie',
              updatedAt: 100,
            },
          ],
        },
      });
    });

    (document.getElementById('emby-library-check-code') as HTMLInputElement).value = 'abc-123';
    (document.getElementById('test-emby-library-check') as HTMLButtonElement).click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const result = document.getElementById('emby-library-check-result') as HTMLDivElement;
    expect(result.textContent).toContain('已入库');
    expect(result.textContent).toContain('家庭 Emby');
    expect(result.textContent).toContain('ABC-123 Movie');
    expect(result.querySelector('.emby-library-check-cover')).toBeNull();
  });

  it('shows a diagnostic thumbnail when a media library match has a cover URL', async () => {
    setEmbySettingsHtml();
    createSettings();
    vi.mocked(chrome.runtime.sendMessage).mockImplementationOnce((message: unknown, callback?: (response: unknown) => void) => {
      expect(message).toEqual({
        type: 'EMBY_LIBRARY_CHECK_CODES',
        codes: ['abc-124'],
      });
      callback?.({
        success: true,
        checked: 1,
        matches: {
          'ABC-124': [
            {
              serverType: 'emby',
              serverName: 'Home Emby',
              serverUrl: 'http://192.168.1.10:8096',
              itemId: 'item-124',
              itemName: 'ABC-124 Movie',
              coverImageUrl: 'http://192.168.1.10:8096/Items/item-124/Images/Primary?tag=cover-tag',
              updatedAt: 100,
            },
          ],
        },
      });
    });

    (document.getElementById('emby-library-check-code') as HTMLInputElement).value = 'abc-124';
    (document.getElementById('test-emby-library-check') as HTMLButtonElement).click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const result = document.getElementById('emby-library-check-result') as HTMLDivElement;
    const cover = result.querySelector<HTMLImageElement>('.emby-library-check-cover');

    expect(cover).not.toBeNull();
    expect(cover?.getAttribute('src')).toBe('http://192.168.1.10:8096/Items/item-124/Images/Primary?tag=cover-tag');
    expect(cover?.getAttribute('alt')).toBe('');
  });

  it('renders actionable diagnostics when manual media library sync fails', async () => {
    STATE.settings.emby.mediaServers = [
      {
        id: 'home',
        type: 'emby',
        name: '家庭 Emby',
        url: 'http://192.168.1.10:8096',
        apiKey: 'secret-key',
        enabled: true,
      },
    ];
    setEmbySettingsHtml();
    createSettings();
    vi.mocked(chrome.runtime.sendMessage).mockImplementationOnce((message: unknown, callback?: (response: unknown) => void) => {
      expect(message).toEqual({ type: 'EMBY_LIBRARY_SYNC', manual: true });
      callback?.({
        success: false,
        synced: 0,
        failed: 1,
        serverResults: [
          {
            serverId: 'home',
            serverType: 'emby',
            serverName: '家庭 Emby',
            success: false,
            itemCount: 0,
            indexedCount: 0,
            error: 'API Key 错误',
            checkedAt: 1000,
          },
        ],
      });
    });

    (document.getElementById('sync-emby-library') as HTMLButtonElement).click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const status = document.getElementById('emby-library-sync-status') as HTMLDivElement;

    expect(status.classList.contains('is-error')).toBe(true);
    expect(status.textContent).toContain('家庭 Emby');
    expect(status.textContent).toContain('API Key 可能无效');
    expect(status.textContent).toContain('请在媒体服务器后台重新生成 API Key');
  });

  it('shows a setup hint instead of success when no media server can sync', async () => {
    setEmbySettingsHtml();
    createSettings();
    vi.mocked(chrome.runtime.sendMessage).mockImplementationOnce((message: unknown, callback?: (response: unknown) => void) => {
      expect(message).toEqual({ type: 'EMBY_LIBRARY_SYNC', manual: true });
      callback?.({
        success: true,
        synced: 0,
        failed: 0,
        serverResults: [],
      });
    });

    (document.getElementById('sync-emby-library') as HTMLButtonElement).click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const status = document.getElementById('emby-library-sync-status') as HTMLDivElement;

    expect(status.classList.contains('is-warning')).toBe(true);
    expect(status.textContent).toContain('还没有可同步的媒体服务器');
    expect(status.textContent).toContain('添加服务器并填写 API Key');
  });
});
