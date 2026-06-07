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
  });
});
