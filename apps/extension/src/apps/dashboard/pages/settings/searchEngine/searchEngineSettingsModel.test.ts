/**
 * @file searchEngineSettingsModel.test.ts
 * @description 搜索引擎设置模型测试
 * @module apps/dashboard/pages/settings/searchEngine
 */
import { describe, expect, it } from 'vitest';
import {
  addSearchEngine,
  applySearchEngineFormToSettings,
  dedupeEngineList,
  getVisibleEngines,
  mapSettingsToSearchEngineForm,
  normalizeEngines,
  removeEngineAt,
  updateEngineAt,
  validateNewSearchEngine,
  validateSearchEngines,
} from './searchEngineSettingsModel';

describe('searchEngineSettingsModel', () => {
  it('normalizes and filters junk engines', () => {
    const engines = normalizeEngines([
      { id: 'javdb', name: 'JavDB', urlTemplate: 'https://javdb.com/{{ID}}', icon: 'assets/javdb.ico' },
      { id: 'bad', name: 'Bad', urlTemplate: 'https://example.com/{{ID}}', icon: '' },
      { id: 'g', name: 'G', urlTemplate: 'https://x.com/{{ID}}', icon: 'https://google.com/s2/favicons?domain=x' },
    ]);
    expect(engines).toHaveLength(1);
    expect(engines[0].id).toBe('javdb');
    expect(engines[0].enabled).toBe(true);
  });

  it('maps settings and applies back', () => {
    const form = mapSettingsToSearchEngineForm({
      searchEngines: [
        { id: 'custom', name: 'C', urlTemplate: 'https://c.test/{{ID}}', category: 'subtitle' },
      ],
    } as any);
    expect(form.engines[0].category).toBe('subtitle');
    const next = applySearchEngineFormToSettings({} as any, form);
    expect((next as any).searchEngines[0].name).toBe('C');
  });

  it('filters by category', () => {
    const form = mapSettingsToSearchEngineForm({
      searchEngines: [
        { id: 'a', name: 'A', urlTemplate: 'https://a/{{ID}}', category: 'search' },
        { id: 'b', name: 'B', urlTemplate: 'https://b/{{ID}}', category: 'subtitle' },
      ],
    } as any);
    form.categoryFilter = 'subtitle';
    expect(getVisibleEngines(form)).toHaveLength(1);
    expect(getVisibleEngines(form)[0].id).toBe('b');
  });

  it('validates placeholders', () => {
    expect(validateNewSearchEngine({ name: '', urlTemplate: '' }).ok).toBe(false);
    expect(validateNewSearchEngine({ name: 'X', urlTemplate: 'https://x.com/q' }).ok).toBe(false);
    expect(validateNewSearchEngine({ name: 'X', urlTemplate: 'https://x.com/{{ID}}' }).ok).toBe(true);

    const bad = validateSearchEngines([
      { id: '1', name: 'A', urlTemplate: '', icon: '', enabled: true, category: 'search' },
      { id: '2', name: 'B', urlTemplate: 'https://b', icon: '', enabled: true, category: 'search' },
    ]);
    expect(bad.isValid).toBe(false);
    expect(bad.warnings.length).toBeGreaterThan(0);
  });

  it('updates bundled engines enabled only', () => {
    const engines = normalizeEngines([
      { id: 'javdb', name: 'JavDB', urlTemplate: 'https://javdb.com/{{ID}}', enabled: true },
    ]);
    const next = updateEngineAt(engines, 0, { name: 'Hacked', enabled: false });
    expect(next[0].name).toBe('JavDB');
    expect(next[0].enabled).toBe(false);
  });

  it('blocks deleting bundled engines', () => {
    const engines = normalizeEngines([
      { id: 'javdb', name: 'JavDB', urlTemplate: 'https://javdb.com/{{ID}}' },
      { id: 'custom', name: 'C', urlTemplate: 'https://c/{{ID}}' },
    ]);
    expect(removeEngineAt(engines, 0).blocked).toBe(true);
    expect(removeEngineAt(engines, 1).engines).toHaveLength(1);
  });

  it('adds and dedupes engines', () => {
    const base = normalizeEngines([
      { id: 'custom', name: 'C', urlTemplate: 'https://c.test/{{ID}}' },
    ]);
    const dup = addSearchEngine(base, {
      name: 'C2',
      urlTemplate: 'https://c.test/{{ID}}',
    });
    expect(dup.duplicate).toBeTruthy();

    const added = addSearchEngine(base, {
      name: 'New',
      urlTemplate: 'https://new.test/{{ID}}',
      category: 'resource',
    });
    expect(added.engines).toHaveLength(2);

    const deduped = dedupeEngineList([
      ...added.engines,
      { id: 'custom', name: 'dup', urlTemplate: 'https://other/{{ID}}', icon: '', enabled: true, category: 'search' },
    ]);
    expect(deduped.duplicates.length).toBeGreaterThan(0);
  });
});
