import { describe, expect, it } from 'vitest';

import { getEffectiveEmbyMatchUrls, matchesEmbyUrlPattern, normalizeEmbyServerMatchUrl } from './matchUrls';

describe('Emby match URLs', () => {
  it('derives match patterns from enabled media server URLs and keeps manual extras', () => {
    const urls = getEffectiveEmbyMatchUrls({
      mediaServers: [
        { url: 'http://192.168.1.10:8096/', enabled: true },
        { url: 'https://media.example.com/emby/', enabled: true },
        { url: 'http://disabled.local:8096', enabled: false },
        { url: '', enabled: true },
      ],
      matchUrls: [
        'https://media.example.com/emby/*',
        'https://alternate.example.com/*',
        '  ',
      ],
    });

    expect(urls).toEqual([
      'http://192.168.1.10:8096/*',
      'https://media.example.com/emby/*',
      'https://alternate.example.com/*',
    ]);
  });

  it('ignores invalid media server URLs', () => {
    expect(normalizeEmbyServerMatchUrl('ftp://example.com')).toBeNull();
    expect(normalizeEmbyServerMatchUrl('not a url')).toBeNull();
    expect(normalizeEmbyServerMatchUrl('')).toBeNull();
  });

  it('matches wildcard URL patterns without widening path-prefixed server URLs', () => {
    expect(matchesEmbyUrlPattern(
      'https://media.example.com/emby/web/index.html',
      'https://media.example.com/emby/*',
    )).toBe(true);
    expect(matchesEmbyUrlPattern(
      'https://media.example.com/other/index.html',
      'https://media.example.com/emby/*',
    )).toBe(false);
  });
});
