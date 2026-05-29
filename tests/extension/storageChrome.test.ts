import { beforeEach, describe, expect, it } from 'vitest';
import { createChromeStorage } from '../../src/platform/storage/chromeStorage';
import { STORAGE_KEYS } from '../../src/utils/config';
import { getValue as getLegacyValue, setValue as setLegacyValue } from '../../src/utils/storage';
import {
  getChromeStorageSnapshot,
  getRuntimeMessages,
  resetChromeMock,
  setChromeStorage,
  setRuntimeMessageHandler,
} from '../setup/chrome';

const createViewedStorage = () =>
  createChromeStorage({
    largeKeys: [STORAGE_KEYS.VIEWED_RECORDS],
    migratedLargeObjectLoaders: {
      [STORAGE_KEYS.VIEWED_RECORDS]: {
        migratedFlagKey: STORAGE_KEYS.IDB_MIGRATED,
        messageType: 'DB:VIEWED_GET_ALL',
        mapResponseToObject(response) {
          return Object.fromEntries(
            (Array.isArray(response?.records) ? response.records : [])
              .filter((record: any) => record?.id)
              .map((record: any) => [record.id, record]),
          );
        },
      },
    },
  });

describe('storage chrome adapter', () => {
  beforeEach(() => {
    resetChromeMock();
  });

  it('stores and reads regular values through chrome.storage.local', async () => {
    const storage = createViewedStorage();

    await storage.setValue('sample-key', { title: 'saved' });

    await expect(storage.getValue('sample-key', { title: 'fallback' })).resolves.toEqual({ title: 'saved' });
    expect(getChromeStorageSnapshot()).toMatchObject({
      'sample-key': { title: 'saved' },
    });
  });

  it('returns the caller fallback when a value is absent or null', async () => {
    const storage = createViewedStorage();
    setChromeStorage({ nullable: null });

    await expect(storage.getValue('missing-key', 'fallback')).resolves.toBe('fallback');
    await expect(storage.getValue('nullable', 'fallback')).resolves.toBe('fallback');
  });

  it('splits viewed records into chunks and reassembles them on read', async () => {
    const storage = createViewedStorage();
    const records = Object.fromEntries(
      Array.from({ length: 1_600 }, (_value, index) => [
        `ID-${index}`,
        {
          id: `ID-${index}`,
          title: `Video ${index}`,
          notes: 'x'.repeat(500),
        },
      ]),
    );

    await storage.setValue(STORAGE_KEYS.VIEWED_RECORDS, records);

    const snapshot = getChromeStorageSnapshot();
    const chunkKeys = Object.keys(snapshot).filter((key) => key.startsWith('__chunk__:viewed::'));
    expect(chunkKeys.length).toBeGreaterThan(1);
    expect(snapshot[STORAGE_KEYS.VIEWED_RECORDS]).toBeUndefined();

    await expect(storage.getValue(STORAGE_KEYS.VIEWED_RECORDS, {})).resolves.toEqual(records);
  });

  it('loads migrated viewed records through the configured runtime message', async () => {
    const storage = createViewedStorage();
    setChromeStorage({ [STORAGE_KEYS.IDB_MIGRATED]: true });
    setRuntimeMessageHandler(() => ({
      success: true,
      records: [
        { id: 'ABC-001', title: 'A' },
        { id: 'ABC-002', title: 'B' },
      ],
    }));

    await expect(storage.getValue(STORAGE_KEYS.VIEWED_RECORDS, {})).resolves.toEqual({
      'ABC-001': { id: 'ABC-001', title: 'A' },
      'ABC-002': { id: 'ABC-002', title: 'B' },
    });
    expect(getRuntimeMessages()).toEqual([{ type: 'DB:VIEWED_GET_ALL' }]);
  });

  it('keeps the legacy utils storage exports wired to the platform adapter', async () => {
    await setLegacyValue('legacy-key', { title: 'saved' });

    await expect(getLegacyValue('legacy-key', { title: 'fallback' })).resolves.toEqual({ title: 'saved' });
  });
});
