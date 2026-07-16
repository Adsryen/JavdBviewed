/**
 * @file webdavSettingsKnownDevices.test.ts
 * @description WebDAV 设置页已知设备列表展示测试
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

async function flushAsyncAction(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe('WebDAV settings known devices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setWebdavSettingsHtml();
    STATE.settings = structuredClone(DEFAULT_SETTINGS);
    STATE.settings.webdav = {
      ...(STATE.settings.webdav || {}),
      clientId: 'current-device',
      deviceLabel: '当前设备',
    };

    vi.mocked(chrome.runtime.sendMessage).mockImplementation((message: any, callback?: (response?: any) => void) => {
      if (message?.type === 'webdav-get-client-profile') {
        callback?.({
          success: true,
          profile: {
            clientId: 'current-device',
            deviceLabel: '当前设备',
            browserName: 'Chrome',
            lastSeenAt: '2026-07-05T08:00:00.000Z',
          },
        });
        return undefined;
      }
      if (message?.type === 'webdav-list-clients') {
        callback?.({
          success: true,
          currentClientId: 'current-device',
          remoteSync: { attempted: true, written: 0, failed: 0 },
          clients: [
            {
              clientId: 'current-device',
              deviceLabel: '当前设备',
              browserName: 'Chrome',
              lastSeenAt: '2026-07-05T08:00:00.000Z',
              lastKnownAt: Date.parse('2026-07-05T08:00:00.000Z'),
              sources: [],
              isCurrent: true,
              currentRemote: {
                configId: 'config-active',
                configName: 'B 端',
                hasClientProfile: true,
                hasBackup: false,
              },
            },
            {
              clientId: 'other-device',
              deviceLabel: '另一台设备',
              browserName: 'Edge',
              lastSeenAt: '2026-07-04T08:00:00.000Z',
              lastKnownAt: Date.parse('2026-07-04T08:00:00.000Z'),
              sources: [],
              isCurrent: false,
              currentRemote: {
                configId: 'config-active',
                configName: 'B 端',
                hasClientProfile: false,
                hasBackup: true,
                lastUploadId: 'upload-1',
                lastUploadAt: Date.parse('2026-07-04T08:00:00.000Z'),
              },
            },
          ],
        });
        return undefined;
      }
      callback?.({ success: true });
      return undefined;
    });
  });

  it('renders known devices with current remote profile and backup status', async () => {
    createWebdavSettings();

    (document.getElementById('refreshWebdavClients') as HTMLButtonElement).click();
    await flushAsyncAction();

    const sectionText = document.getElementById('webdavClientsSection')?.textContent || '';
    const currentCardText = document.querySelector('.webdav-client-card.current')?.textContent || '';
    expect(sectionText).toContain('已知设备');
    expect(currentCardText).toContain('当前端有设备记录');
    expect(currentCardText).toContain('当前端暂无备份');
    expect(sectionText).toContain('另一台设备');
    expect(sectionText).toContain('当前端暂无设备记录');
    expect(sectionText).toContain('当前端有备份');
    expect(sectionText).not.toContain('云端设备列表');
  });
});
