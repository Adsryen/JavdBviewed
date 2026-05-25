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
    ]));

    const byId = new Map(engines.map((engine: any) => [engine.id, engine]));
    expect(byId.get('sehuatang')?.urlTemplate).toContain('sehuatang.net');
    expect(byId.get('btsow')?.urlTemplate).toContain('btsow');
    expect(byId.get('javlib')?.urlTemplate).toContain('javlibrary');
    expect(byId.get('123av')?.urlTemplate).toContain('123av.com');
    expect(byId.get('google')?.urlTemplate).toContain('google.com/search');

    expect(byId.get('sehuatang')?.icon).toBe('assets/sehuatang.ico');
    expect(byId.get('btsow')?.icon).toBe('assets/btsow.png');
    expect(byId.get('javlib')?.icon).toBe('assets/javlibrary.ico');
    expect(byId.get('jable')?.icon).toBe('assets/jable.ico');
    expect(byId.get('missav')?.icon).toBe('assets/missav.ico');
    expect(byId.get('123av')?.icon).toBe('assets/123av.png');
    expect(byId.get('google')?.icon).toBe('assets/google.ico');
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
