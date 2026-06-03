import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('getSettings listEnhancement regression', () => {
  beforeEach(() => {
    vi.resetModules();

    Object.defineProperty(globalThis, 'chrome', {
      value: {
        storage: {
          local: {
            get(keys: any, callback: (result: Record<string, any>) => void) {
              const storageData: Record<string, any> = {
                settings: {
                  listEnhancement: {
                    previewVolume: 0.65,
                    listDisplayControl: {
                      enabled: false,
                      columnCount: 6,
                    },
                  },
                },
              };

              if (keys === null) {
                callback({ ...storageData });
                return;
              }

              const requestedKeys = Array.isArray(keys) ? keys : [keys];
              const result: Record<string, any> = {};
              for (const key of requestedKeys) {
                if (key in storageData) result[key] = storageData[key];
              }
              callback(result);
            },
            set(_payload: Record<string, any>) {
              return Promise.resolve();
            },
            remove(_keys: string[] | string, callback?: () => void) {
              callback?.();
            },
          },
        },
        runtime: {
          id: 'test-runtime',
          sendMessage() {},
        },
      },
      configurable: true,
    });
  });

  it('preserves stored values while filling missing list display defaults', async () => {
    const { getSettings } = await import('../../src/utils/storage');
    const settings = await getSettings();

    expect(settings.listEnhancement.previewVolume).toBe(0.65);
    expect(settings.listEnhancement.listDisplayControl.enabled).toBe(true);
    expect(settings.listEnhancement.listDisplayControl.columnCount).toBe(6);
    expect(settings.listEnhancement.listDisplayControl.containerWidth).toBe(100);
    expect(settings.listEnhancement.enableVideoPreview).toBe(true);
    expect(settings.listEnhancement.enableStatusQuickAction).toBe(false);
  });
});
