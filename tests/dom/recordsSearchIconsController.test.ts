import { describe, expect, it, vi } from 'vitest';
import { createRecordsSearchIconsContainer } from '../../src/dashboard/tabs/records/searchIconsController';
import type { SearchEngineTemplate } from '../../src/features/externalSearch/domain/searchEngines';

function createEngine(overrides: Partial<SearchEngineTemplate> = {}): SearchEngineTemplate {
  return {
    id: 'javdb',
    name: 'JavDB',
    urlTemplate: 'https://javdb.com/search?q={{ID}}',
    enabled: true,
    icon: 'assets/javdb.ico',
    category: 'search',
    ...overrides,
  };
}

describe('records search icons controller', () => {
  it('creates record search icon links and applies fallback icon on image error', () => {
    const container = createRecordsSearchIconsContainer({
      engines: [createEngine()],
      videoId: 'ABC-123',
      fallbackIconUrl: 'chrome-extension://test/assets/alternate-search.png',
      buildUrl: () => 'https://javdb.com/search?q=ABC-123',
      resolveIcon: () => 'chrome-extension://test/assets/javdb.ico',
    });

    const link = container.querySelector('a') as HTMLAnchorElement;
    const image = container.querySelector('img') as HTMLImageElement;

    expect(container.className).toBe('video-search-icons');
    expect(link.href).toBe('https://javdb.com/search?q=ABC-123');
    expect(link.target).toBe('_blank');
    expect(link.title).toBe('Search on JavDB');
    expect(image.src).toBe('chrome-extension://test/assets/javdb.ico');
    expect(image.alt).toBe('JavDB');

    image.onerror?.(new Event('error'));
    expect(image.src).toBe('chrome-extension://test/assets/alternate-search.png');
  });

  it('skips invalid engines and continues rendering valid ones', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const container = createRecordsSearchIconsContainer({
      engines: [createEngine({ name: '' }), createEngine({ id: 'btsow', name: 'BTSOW' })],
      videoId: 'ABC-123',
      fallbackIconUrl: 'fallback.png',
      buildUrl: (template, id) => `${template}:${id}`,
      resolveIcon: () => 'icon.png',
    });

    expect(container.querySelectorAll('a')).toHaveLength(1);
    expect(consoleWarn).toHaveBeenCalled();
    consoleWarn.mockRestore();
  });
});
