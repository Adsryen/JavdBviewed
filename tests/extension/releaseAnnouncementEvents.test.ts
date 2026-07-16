/**
 * @file releaseAnnouncementEvents.test.ts
 * @description release announcement background events 测试
 * @module tests/extension
 */
import { describe, expect, it } from 'vitest';
import { RELEASE_ANNOUNCEMENT_STORAGE_KEY } from '../../apps/extension/src/features/releaseAnnouncement';
import { registerReleaseAnnouncementEvents } from '../../apps/extension/src/apps/background/releaseAnnouncementEvents';
import manifest from '../../apps/extension/src/manifest.json';
import { dispatchRuntimeInstalled, getChromeStorageSnapshot } from '../setup/chrome';

const currentVersion = manifest.version;

describe('release announcement background events', () => {
  it('records install details as a pending announcement', async () => {
    registerReleaseAnnouncementEvents();

    dispatchRuntimeInstalled({
      reason: 'install',
      temporary: false,
    });
    await flushMicrotasks();

    expect(getChromeStorageSnapshot()[RELEASE_ANNOUNCEMENT_STORAGE_KEY]).toEqual(expect.objectContaining({
      pending: expect.objectContaining({
        type: 'install',
        version: currentVersion,
      }),
    }));
  });

  it('records update details with previous version', async () => {
    registerReleaseAnnouncementEvents();

    dispatchRuntimeInstalled({
      reason: 'update',
      previousVersion: '1.20.1',
      temporary: false,
    });
    await flushMicrotasks();

    expect(getChromeStorageSnapshot()[RELEASE_ANNOUNCEMENT_STORAGE_KEY]).toEqual(expect.objectContaining({
      pending: expect.objectContaining({
        type: 'update',
        version: currentVersion,
        previousVersion: '1.20.1',
      }),
    }));
  });
});

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}
