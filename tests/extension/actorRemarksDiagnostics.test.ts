import { describe, expect, it, vi } from 'vitest';
import { NetworkError } from '../../src/platform/network/httpClient';

describe('actor remarks diagnostics', () => {
  it('preserves Wikipedia and xslist HTTP failures for actor metadata refresh', async () => {
    vi.resetModules();
    const getDocument = vi.fn()
      .mockRejectedValueOnce(new NetworkError('HTTP 404', 'https://ja.wikipedia.org/wiki/Alice', 404))
      .mockRejectedValueOnce(new NetworkError('HTTP 403', 'https://xslist.org/search?query=Alice&lg=zh', 403));

    vi.doMock('../../src/platform/network/httpClient', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../src/platform/network/httpClient')>();
      return {
        ...actual,
        defaultHttpClient: {
          getDocument,
        },
      };
    });

    try {
      const { actorExtraInfoService } = await import('../../src/features/actorRemarks');
      const result = await actorExtraInfoService.getActorRemarksWithDiagnostics('Alice');

      expect(result.data).toBeNull();
      expect(result.failures).toEqual([
        {
          source: 'wikipedia',
          message: 'HTTP 404',
          statusCode: 404,
          url: 'https://ja.wikipedia.org/wiki/Alice',
        },
        {
          source: 'xslist',
          message: 'HTTP 403',
          statusCode: 403,
          url: 'https://xslist.org/search?query=Alice&lg=zh',
          reason: 'cloudflare_challenge',
        },
      ]);
      expect(getDocument).toHaveBeenNthCalledWith(2, 'https://xslist.org/search?query=Alice&lg=zh', expect.objectContaining({
        retries: 0,
        referrer: 'https://xslist.org/',
      }));
    } finally {
      vi.doUnmock('../../src/platform/network/httpClient');
      vi.resetModules();
    }
  });
});
