/**
 * @file embySettingsDefaults.test.ts
 * @description Emby settings defaults 测试
 * @module tests/regression
 */
import { describe, expect, it } from 'vitest';

import { DEFAULT_SETTINGS } from '../../apps/extension/src/utils/config';

describe('Emby settings defaults', () => {
  it('does not store media server URLs as manual extra match URLs by default', () => {
    expect(DEFAULT_SETTINGS.emby.matchUrls).toEqual([]);
  });
});
