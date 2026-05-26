import { describe, expect, it } from 'vitest';
import { getVitestProxyUrl } from '../setup/proxy';

describe('vitest proxy setup', () => {
  it('centralizes the proxy used by network-capable dom tests', () => {
    expect(getVitestProxyUrl()).toBeTruthy();
    expect(process.env.HTTP_PROXY).toBe(getVitestProxyUrl());
    expect(process.env.HTTPS_PROXY).toBe(getVitestProxyUrl());
    expect((globalThis as any).__JAVDB_VITEST_PROXY_URL__).toBe(getVitestProxyUrl());
    expect((globalThis as any).__JAVDB_VITEST_PROXY_FETCH_INSTALLED__).toBe(true);
  });
});
