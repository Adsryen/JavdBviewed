import { describe, expect, it } from 'vitest';
import { appendMagnetResults, getResultSources } from '../../src/features/magnets/application/resultMerge';
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

describe('magnet result merge', () => {
  it('keeps cached results when later source results arrive', () => {
    const allResults: MagnetResult[] = [];

    appendMagnetResults(allResults, [magnet('cache-a', 'JavDB')]);
    appendMagnetResults(allResults, [magnet('fresh-a', 'Sukebei')]);

    expect(allResults.map((result) => result.source)).toEqual(['JavDB', 'Sukebei']);
    expect(allResults.map((result) => result.name)).toEqual(['cache-a', 'fresh-a']);
  });

  it('returns the merged total after each completed source batch', () => {
    const allResults: MagnetResult[] = [];

    expect(appendMagnetResults(allResults, [magnet('javdb-a', 'JavDB')])).toBe(1);
    expect(appendMagnetResults(allResults, [
      magnet('sukebei-a', 'Sukebei'),
      magnet('sukebei-b', 'Sukebei'),
    ])).toBe(3);
    expect(appendMagnetResults(allResults, [magnet('javbus-a', 'JAVBUS')])).toBe(4);
  });

  it('deduplicates by magnet hash and lets fresh source results replace cached copies', () => {
    const allResults: MagnetResult[] = [];
    const hash = '1234567890abcdef1234567890abcdef12345678';

    appendMagnetResults(allResults, [magnet('cached-sukebei', 'Sukebei', hash)]);
    const total = appendMagnetResults(allResults, [magnet('fresh-sukebei', 'Sukebei', hash)]);

    expect(total).toBe(1);
    expect(allResults).toHaveLength(1);
    expect(allResults[0].name).toBe('fresh-sukebei');
  });

  it('merges duplicate hashes from different sources into one visible result with combined source labels', () => {
    const allResults: MagnetResult[] = [];
    const hash = 'abcdefabcdefabcdefabcdefabcdefabcdefabcd';

    appendMagnetResults(allResults, [magnet('javdb-native', 'JavDB', hash)]);
    const total = appendMagnetResults(allResults, [magnet('sukebei-fresh', 'Sukebei', hash)]);

    expect(total).toBe(1);
    expect(allResults).toHaveLength(1);
    expect(allResults[0].source).toBe('JavDB / Sukebei');
    expect(allResults[0].sources).toEqual(['JavDB', 'Sukebei']);
  });

  it('normalizes combined source labels before merging duplicate hashes', () => {
    const allResults: MagnetResult[] = [];
    const hash = '285d09c0aa4a8934cf83299fdebc5bf30b6a764c';

    appendMagnetResults(allResults, [{
      ...magnet('cached-combo', 'BTdig / Sukebei', hash),
      sources: ['BTdig / Sukebei', 'Sukebei'],
    }]);
    appendMagnetResults(allResults, [magnet('fresh-btdig', 'BTdig', hash)]);
    appendMagnetResults(allResults, [magnet('fresh-sukebei', 'Sukebei', hash)]);

    expect(allResults).toHaveLength(1);
    expect(allResults[0].source).toBe('BTdig / Sukebei');
    expect(allResults[0].sources).toEqual(['BTdig', 'Sukebei']);
    expect(getResultSources(allResults[0])).toEqual(['BTdig', 'Sukebei']);
  });
});
