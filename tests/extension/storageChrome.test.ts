import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../../src/utils/config';
import { getValue, setValue } from '../../src/utils/storage';
import { getChromeStorageSnapshot, resetChromeMock, setChromeStorage } from '../setup/chrome';

describe('storage chrome adapter', () => {
  beforeEach(() => {
    resetChromeMock();
  });

  it('stores and reads regular values through chrome.storage.local', async () => {
    await setValue('sample-key', { title: 'saved' });

    await expect(getValue('sample-key', { title: 'fallback' })).resolves.toEqual({ title: 'saved' });
    expect(getChromeStorageSnapshot()).toMatchObject({
      'sample-key': { title: 'saved' },
    });
  });

  it('returns the caller fallback when a value is absent or null', async () => {
    setChromeStorage({ nullable: null });

    await expect(getValue('missing-key', 'fallback')).resolves.toBe('fallback');
    await expect(getValue('nullable', 'fallback')).resolves.toBe('fallback');
  });

  it('splits viewed records into chunks and reassembles them on read', async () => {
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

    await setValue(STORAGE_KEYS.VIEWED_RECORDS, records);

    const snapshot = getChromeStorageSnapshot();
    const chunkKeys = Object.keys(snapshot).filter((key) => key.startsWith('__chunk__:viewed::'));
    expect(chunkKeys.length).toBeGreaterThan(1);
    expect(snapshot[STORAGE_KEYS.VIEWED_RECORDS]).toBeUndefined();

    await expect(getValue(STORAGE_KEYS.VIEWED_RECORDS, {})).resolves.toEqual(records);
  });
});
