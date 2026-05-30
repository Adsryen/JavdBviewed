import { describe, expect, it } from 'vitest';
import { setChromeStorage } from '../setup/chrome';

describe('viewed tag statistics', () => {
  it('collects tags from legacy and enriched record shapes', async () => {
    const { buildViewedTagStats } = await import('../../src/features/records/tagStats');

    const stats = buildViewedTagStats([
      { tags: ['巨乳', '中出', '單體作品'] },
      { categories: ['巨乳', '制服'] },
      { genres: ['中出'] },
      { enhancedData: { tags: ['美尻'] } },
      { detail: { categories: [{ name: '剧情' }, { label: '高画质' }] } },
      { metadata: { genre: ['企画'] } },
      { tags: '人妻, 巨乳 / 熟女' },
    ], 10);

    expect(stats).toEqual([
      { name: '巨乳', count: 3 },
      { name: '中出', count: 2 },
      { name: '制服', count: 1 },
      { name: '美尻', count: 1 },
      { name: '剧情', count: 1 },
      { name: '高画质', count: 1 },
      { name: '企画', count: 1 },
      { name: '人妻', count: 1 },
      { name: '熟女', count: 1 },
    ]);
  });

  it('builds stats from multiple viewed record sources without double counting the same video', async () => {
    const { buildViewedTagStatsFromSources } = await import('../../src/features/records/tagStats');

    const stats = buildViewedTagStatsFromSources([
      [],
      {
        'SSIS-001': { tags: ['巨乳'], categories: ['中出'] },
        'SSIS-002': { id: 'SSIS-002', tags: ['制服'] },
      },
      [
        { id: 'SSIS-001', tags: ['巨乳', '剧情'] },
        { id: 'SSIS-003', categories: ['中出'] },
      ],
    ], 10);

    expect(stats).toEqual([
      { name: '中出', count: 2 },
      { name: '巨乳', count: 1 },
      { name: '剧情', count: 1 },
      { name: '制服', count: 1 },
    ]);
  });

  it('reads viewed records from legacy chunked chrome storage', async () => {
    setChromeStorage({
      '__chunks_meta__:viewed': { chunks: 2, totalEntries: 2, updatedAt: Date.now(), version: 1 },
      '__chunk__:viewed::1': {
        'SSIS-101': { id: 'SSIS-101', tags: ['巨乳'] },
      },
      '__chunk__:viewed::2': {
        'SSIS-102': { id: 'SSIS-102', categories: ['中出'] },
      },
    });

    const { getLegacyViewedRecordsFromStorage } = await import('../../src/background/dbRouter');

    await expect(getLegacyViewedRecordsFromStorage()).resolves.toEqual({
      'SSIS-101': { id: 'SSIS-101', tags: ['巨乳'] },
      'SSIS-102': { id: 'SSIS-102', categories: ['中出'] },
    });
  });

  it('converts viewedByTag index rows into record-shaped tag sources', async () => {
    const { buildViewedRecordSourceFromTagIndexRows, buildViewedTagStatsFromSources } = await import('../../src/features/records/tagStats');
    const indexedSource = buildViewedRecordSourceFromTagIndexRows([
      { key: '巨乳::SSIS-001', tag: '巨乳', videoId: 'SSIS-001' },
      { key: '中出::SSIS-001', tag: '中出', videoId: 'SSIS-001' },
      { key: '巨乳::SSIS-002', tag: '巨乳', videoId: 'SSIS-002' },
      { key: '单体作品::SSIS-003', tag: '單體作品', videoId: 'SSIS-003' },
    ]);

    expect(indexedSource).toEqual({
      'SSIS-001': { id: 'SSIS-001', tags: ['巨乳', '中出'] },
      'SSIS-002': { id: 'SSIS-002', tags: ['巨乳'] },
      'SSIS-003': { id: 'SSIS-003', tags: ['單體作品'] },
    });
    expect(buildViewedTagStatsFromSources([[], indexedSource], 10)).toEqual([
      { name: '巨乳', count: 2 },
      { name: '中出', count: 1 },
    ]);
  });
});
