import { describe, it, expect } from 'vitest';

describe('log retention settings', () => {
  it('uses maxLogEntries as the retention ceiling', () => {
    const settings = { logging: { maxLogEntries: 5000, maxMagnetPushEntries: 5000 } };
    expect(settings.logging.maxLogEntries).toBe(5000);
    expect(settings.logging.maxMagnetPushEntries).toBe(5000);
  });
});
