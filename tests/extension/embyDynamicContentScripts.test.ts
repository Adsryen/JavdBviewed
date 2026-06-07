import { beforeEach, describe, expect, it, vi } from 'vitest';

import { registerEmbyDynamicScripts } from '../../src/apps/background/embyDynamicContentScripts';

describe('registerEmbyDynamicScripts', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('matches enabled media server URLs when no extra match URLs are configured', async () => {
    vi.mocked(chrome.runtime.getManifest).mockReturnValue({
      content_scripts: [
        {
          js: ['content/index.ts-loader.js'],
          css: ['content/index.css'],
        },
      ],
    } as chrome.runtime.Manifest);

    await registerEmbyDynamicScripts({
      enabled: true,
      matchUrls: [],
      mediaServers: [
        {
          type: 'emby',
          name: '家庭 Emby',
          url: 'http://192.168.1.10:8096/',
          apiKey: 'secret',
          enabled: true,
        },
      ],
    });

    expect(chrome.tabs.onUpdated.addListener).toHaveBeenCalledTimes(1);

    const listener = vi.mocked(chrome.tabs.onUpdated.addListener).mock.calls[0]?.[0];
    expect(listener).toBeTypeOf('function');

    vi.mocked(chrome.scripting.executeScript)
      .mockResolvedValueOnce([{ result: false } as chrome.scripting.InjectionResult<boolean>])
      .mockResolvedValueOnce([]);

    listener?.(7, { status: 'complete' }, {
      id: 7,
      url: 'http://192.168.1.10:8096/web/index.html#!/item',
    } as chrome.tabs.Tab);

    await Promise.resolve();
    await Promise.resolve();

    expect(chrome.scripting.executeScript).toHaveBeenCalledWith(expect.objectContaining({
      target: { tabId: 7 },
      files: expect.any(Array),
    }));
  });
});
