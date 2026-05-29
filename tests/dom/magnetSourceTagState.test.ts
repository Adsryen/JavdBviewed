import { describe, expect, it } from 'vitest';
import {
  buildMagnetSourceTagView,
  countUniqueResultsBySource,
} from '../../src/features/magnets/application/sourceTagState';
import type { MagnetResult } from '../../src/features/magnets/domain/types';

function magnet(name: string, source: string, hash = name.padEnd(40, '0').slice(0, 40)): MagnetResult {
  return {
    name,
    magnet: `magnet:?xt=urn:btih:${hash}`,
    size: '1 GB',
    sizeBytes: 1024 * 1024 * 1024,
    date: '2026-05-24',
    source,
    hasSubtitle: false,
  };
}

describe('magnet source tag state', () => {
  it('counts current unique results by source', () => {
    const sameHash = '1234567890abcdef1234567890abcdef12345678';

    const counts = countUniqueResultsBySource([
      magnet('cached-sukebei', 'Sukebei', sameHash),
      magnet('duplicate-sukebei', 'Sukebei', sameHash),
      magnet('javbus-a', 'JAVBUS'),
      magnet('javbus-b', 'JAVBUS'),
    ]);

    expect(counts).toEqual({
      sukebei: 1,
      javbus: 2,
    });
  });

  it('counts combined source labels for a deduplicated result', () => {
    const counts = countUniqueResultsBySource([
      {
        ...magnet('merged', 'JavDB / Sukebei', '1234567890abcdef1234567890abcdef12345678'),
        sources: ['JavDB', 'Sukebei'],
      },
    ]);

    expect(counts).toEqual({
      sukebei: 1,
    });
  });

  it('shows success count using current unique results', () => {
    expect(buildMagnetSourceTagView('javbus', 'success', 2)).toMatchObject({
      text: 'JVB✓(2)',
      className: 'is-success',
    });
  });

  it('shows a warning when the latest search failed but cached results remain visible', () => {
    expect(buildMagnetSourceTagView('sukebei', 'failed', 3)).toMatchObject({
      text: 'SUK⚠(3)',
      className: 'is-warning',
    });
  });

  it('shows failure with zero when a source failed and has no visible results', () => {
    expect(buildMagnetSourceTagView('btdig', 'failed', 0)).toMatchObject({
      text: 'BTD✗(0)',
      className: 'is-danger',
    });
  });
});
