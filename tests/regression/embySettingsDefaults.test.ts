import { describe, expect, it } from 'vitest';

import { DEFAULT_SETTINGS } from '../../src/utils/config';

describe('Emby settings defaults', () => {
  it('does not store media server URLs as manual extra match URLs by default', () => {
    expect(DEFAULT_SETTINGS.emby.matchUrls).toEqual([]);
  });
});
