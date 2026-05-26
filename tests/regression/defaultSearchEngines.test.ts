import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../../src/utils/config';
import { mergeSearchEngineTemplates } from '../../src/utils/storage';
import { dedupeSearchEngines } from '../../src/utils/searchEngines';

describe('default search engine templates', () => {
  it('ships common JavdbBuddy-compatible search templates by default', () => {
    const engines = DEFAULT_SETTINGS.searchEngines || [];
    const ids = engines.map((engine: any) => engine.id);

    expect(ids).toEqual(expect.arrayContaining([
      'javdb',
      'javbus',
      'sehuatang',
      'btsow',
      'javlib',
      'jable',
      'missav',
      '123av',
      'google',
      'dmm',
      'sukebei',
      'subtitlecat',
      'xunlei-subtitle',
      'fc2ppvdb',
      'fc2db',
    ]));

    const byId = new Map(engines.map((engine: any) => [engine.id, engine]));
    expect(byId.get('sehuatang')?.urlTemplate).toContain('sehuatang.net');
    expect(byId.get('btsow')?.urlTemplate).toContain('btsow');
    expect(byId.get('javlib')?.urlTemplate).toContain('javlibrary');
    expect(byId.get('123av')?.urlTemplate).toContain('123av.com');
    expect(byId.get('google')?.urlTemplate).toContain('google.com/search');
    expect(byId.get('dmm')?.urlTemplate).toContain('dmm.co.jp');
    expect(byId.get('sukebei')?.urlTemplate).toContain('sukebei.nyaa.si');
    expect(byId.get('subtitlecat')?.urlTemplate).toContain('subtitlecat.com');
    expect(byId.get('xunlei-subtitle')?.urlTemplate).toContain('api-shoulei-ssl.xunlei.com');
    expect(byId.get('fc2ppvdb')?.urlTemplate).toContain('{{FC2_ID}}');
    expect(byId.get('fc2ppvdb')?.match).toBe('fc2');
    expect(byId.get('fc2db')?.urlTemplate).toContain('{{FC2_ID}}');
    expect(byId.get('fc2db')?.match).toBe('fc2');
    expect(byId.get('javdb')?.category).toBe('search');
    expect(byId.get('jable')?.category).toBe('resource');
    expect(byId.get('subtitlecat')?.category).toBe('subtitle');
    expect(byId.get('xunlei-subtitle')?.category).toBe('subtitle');

    expect(byId.get('sehuatang')?.icon).toBe('assets/sehuatang.ico');
    expect(byId.get('btsow')?.icon).toBe('assets/btsow.png');
    expect(byId.get('javlib')?.icon).toBe('assets/javlibrary.ico');
    expect(byId.get('jable')?.icon).toBe('assets/jable.ico');
    expect(byId.get('missav')?.icon).toBe('assets/missav.ico');
    expect(byId.get('123av')?.icon).toBe('assets/123av.png');
    expect(byId.get('google')?.icon).toBe('assets/google.ico');
    expect(byId.get('dmm')?.icon).toBe('assets/dmm.ico');
    expect(byId.get('sukebei')?.icon).toBe('assets/sukebei.png');
    expect(byId.get('subtitlecat')?.icon).toBe('assets/subtitlecat.ico');
    expect(byId.get('xunlei-subtitle')?.icon).toBe('assets/xunlei.png');
    expect(byId.get('fc2ppvdb')?.icon).toBe('assets/fc2ppvdb.ico');
    expect(byId.get('fc2db')?.icon).toBe('assets/fc2db.png');
  });

  it('adds missing default templates while preserving custom user engines', () => {
    const merged = mergeSearchEngineTemplates([
      {
        id: 'javdb',
        icon: 'assets/javdb.ico',
        name: 'JavDB Custom',
        urlTemplate: 'https://javdb.com/search?q={{ID}}',
      },
      {
        id: 'private-site',
        icon: '',
        name: 'Private Site',
        urlTemplate: 'https://private.example/search?q={{ID}}',
      },
    ]);

    const byId = new Map(merged.map((engine: any) => [engine.id, engine]));
    expect(byId.get('javdb')?.name).toBe('JavDB');
    expect(byId.get('javdb')?.urlTemplate).toBe('https://javdb.com/search?q={{ID}}&f=all');
    expect(byId.get('private-site')?.urlTemplate).toContain('private.example');
    expect(byId.get('sehuatang')?.name).toBe('98堂');
    expect(byId.get('123av')?.name).toBe('123AV');
  });

  it('keeps bundled defaults when user engines repeat a default URL template', () => {
    const merged = mergeSearchEngineTemplates([
      {
        id: 'custom-javbus',
        icon: '',
        name: 'JavBus Copy',
        urlTemplate: ' https://www.javbus.com/search/{{id}}&type=&parent=ce ',
      },
    ]);

    const javbusLike = merged.filter((engine: any) =>
      String(engine.urlTemplate || '').toLowerCase().includes('javbus.com/search/{{id}}'),
    );

    expect(javbusLike).toHaveLength(1);
    expect(javbusLike[0].id).toBe('javbus');
    expect(javbusLike[0].name).toBe('Javbus');
  });

  it('preserves bundled search engine visibility overrides during default template merge', () => {
    const merged = mergeSearchEngineTemplates([
      {
        id: 'javdb',
        icon: 'assets/javdb.ico',
        name: 'Renamed JavDB',
        urlTemplate: 'https://custom.invalid/search?q={{ID}}',
        enabled: false,
      },
    ]);

    const javdb = merged.find((engine: any) => engine.id === 'javdb');
    expect(javdb).toEqual(expect.objectContaining({
      id: 'javdb',
      name: 'JavDB',
      urlTemplate: 'https://javdb.com/search?q={{ID}}&f=all',
      enabled: false,
    }));
  });

  it('upgrades old fallback icons for bundled search engines', () => {
    const merged = mergeSearchEngineTemplates([
      {
        id: 'jable',
        icon: 'assets/alternate-search.png',
        name: 'Jable',
        urlTemplate: 'https://jable.tv/search/{{ID}}/',
      },
      {
        id: 'missav',
        icon: 'chrome-extension://test-runtime/assets/alternate-search.png',
        name: 'MISSAV',
        urlTemplate: 'https://missav.ws/search/{{ID}}',
      },
      {
        id: 'private-site',
        icon: 'assets/alternate-search.png',
        name: 'Private Site',
        urlTemplate: 'https://private.example/search?q={{ID}}',
      },
    ]);

    const byId = new Map(merged.map((engine: any) => [engine.id, engine]));

    expect(byId.get('jable')?.icon).toBe('assets/jable.ico');
    expect(byId.get('missav')?.icon).toBe('assets/missav.ico');
    expect(byId.get('private-site')?.icon).toBe('assets/alternate-search.png');
  });

  it('builds search URLs from templates with flexible ID placeholders', async () => {
    const { buildSearchEngineUrl } = await import('../../src/utils/searchEngines');

    expect(buildSearchEngineUrl('https://example.test/search/{{ id }}', 'FC2-123 456')).toBe(
      'https://example.test/search/FC2-123%20456',
    );
  });

  it('builds FC2 portal URLs from numeric FC2 placeholders', async () => {
    const { buildSearchEngineUrl } = await import('../../src/utils/searchEngines');

    expect(buildSearchEngineUrl('https://fc2ppvdb.com/articles/{{FC2_ID}}', 'FC2-4903984')).toBe(
      'https://fc2ppvdb.com/articles/4903984',
    );
    expect(buildSearchEngineUrl('https://fc2db.net/work/{{ fc2_id }}/', 'FC2-PPV-4903984')).toBe(
      'https://fc2db.net/work/4903984/',
    );
  });

  it('filters detail-only and FC2-only search engines by context and video id', async () => {
    const { getSearchEnginesForVideo } = await import('../../src/utils/searchEngines');
    const engines = [
      { id: 'javdb', name: 'JavDB', urlTemplate: 'https://javdb.com/search?q={{ID}}' },
      { id: 'subtitlecat', name: 'SubTitleCat', urlTemplate: 'https://subtitlecat.com/?search={{ID}}', category: 'subtitle', contexts: ['detail'] },
      { id: 'fc2ppvdb', name: 'FC2PPVDB', urlTemplate: 'https://fc2ppvdb.com/articles/{{FC2_ID}}', match: 'fc2', contexts: ['detail'] },
    ];

    expect(getSearchEnginesForVideo(engines, 'SSIS-795', 'detail').map(engine => engine.id)).toEqual([
      'javdb',
      'subtitlecat',
    ]);
    expect(getSearchEnginesForVideo(engines, 'FC2-4903984', 'detail').map(engine => engine.id)).toEqual([
      'javdb',
      'subtitlecat',
      'fc2ppvdb',
    ]);
    expect(getSearchEnginesForVideo(engines, 'FC2-4903984', 'records').map(engine => engine.id)).toEqual([
      'javdb',
    ]);
  });

  it('treats missing search engine enabled state as visible and filters disabled engines', async () => {
    const { getSearchEnginesForVideo } = await import('../../src/utils/searchEngines');
    const engines = [
      { id: 'javdb', name: 'JavDB', urlTemplate: 'https://javdb.com/search?q={{ID}}' },
      { id: 'javbus', name: 'JavBus', urlTemplate: 'https://javbus.com/search/{{ID}}', enabled: false },
      { id: 'subtitlecat', name: 'SubTitleCat', urlTemplate: 'https://subtitlecat.com/?search={{ID}}', enabled: true },
    ];

    expect(getSearchEnginesForVideo(engines, 'SSIS-795', 'detail').map(engine => engine.id)).toEqual([
      'javdb',
      'subtitlecat',
    ]);
  });

  it('normalizes search engine categories for legacy and custom engines', async () => {
    const {
      getSearchEngineCategory,
      getSearchEngineCategoryLabel,
      filterSearchEnginesByCategory,
    } = await import('../../src/utils/searchEngines');
    const engines = [
      { id: 'javdb', name: 'JavDB' },
      { id: 'missav', name: 'MISSAV' },
      { id: 'subtitlecat', name: 'SubTitleCat' },
      { id: 'custom', name: 'Custom', category: 'subtitle' },
    ];

    expect(getSearchEngineCategory(engines[0])).toBe('search');
    expect(getSearchEngineCategory(engines[1])).toBe('resource');
    expect(getSearchEngineCategory(engines[2])).toBe('subtitle');
    expect(getSearchEngineCategoryLabel('subtitle')).toBe('字幕');
    expect(filterSearchEnginesByCategory(engines, 'subtitle').map(engine => engine.id)).toEqual([
      'subtitlecat',
      'custom',
    ]);
  });

  it('reports duplicate search engines so the settings page can prompt the user', () => {
    const result = dedupeSearchEngines([
      {
        id: 'first',
        icon: '',
        name: 'First',
        urlTemplate: 'https://example.test/search?q={{ID}}',
      },
      {
        id: 'second',
        icon: '',
        name: 'Second',
        urlTemplate: 'https://example.test/search?q={{ id }}',
      },
    ]);

    expect(result.engines.map(engine => engine.name)).toEqual(['First']);
    expect(result.duplicates).toEqual([
      expect.objectContaining({
        duplicateName: 'Second',
        keptName: 'First',
        reason: 'urlTemplate',
      }),
    ]);
  });
});
