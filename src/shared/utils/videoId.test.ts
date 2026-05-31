import { describe, expect, it } from 'vitest';
import { extractVideoId } from './videoId';

describe('extractVideoId', () => {
  it('extracts common JavDB video ids from mixed text', () => {
    expect(extractVideoId('HODV-22069 破壊力抜群')).toBe('HODV-22069');
    expect(extractVideoId('fc2-ppv-4903984 title')).toBe('FC2-PPV-4903984');
    expect(extractVideoId('072625_01 Sample')).toBe('072625_01');
    expect(extractVideoId('4903984 FC2 title')).toBe('4903984');
    expect(extractVideoId('1pondo-123456_01 title')).toBe('1PONDO-123456_01');
  });

  it('falls back to the first ascii token when no strict pattern matches', () => {
    expect(extractVideoId('abcxyz title')).toBe('ABCXYZ');
    expect(extractVideoId('中文标题')).toBeNull();
  });
});
