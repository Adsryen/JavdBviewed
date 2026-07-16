/**
 * @file embyUserAuth.test.ts
 * @description Emby 用户登录辅助单测
 * @module features/embyLibrary
 */
import { describe, expect, it, vi } from 'vitest';
import {
  authenticateEmbyUser,
  buildMediaBrowserAuthHeader,
  hasEmbyUserSession,
} from './embyUserAuth';

describe('embyUserAuth', () => {
  it('builds MediaBrowser auth header', () => {
    const h = buildMediaBrowserAuthHeader({ token: 'abc', deviceName: 'Test' });
    expect(h).toContain('MediaBrowser');
    expect(h).toContain('Token="abc"');
    expect(h).toContain('DeviceId="Test"');
  });

  it('detects user session', () => {
    expect(hasEmbyUserSession({ accessToken: 't', userId: 'u' })).toBe(true);
    expect(hasEmbyUserSession({ accessToken: '', userId: 'u' })).toBe(false);
  });

  it('parses AuthenticateByName success', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          AccessToken: 'tok-1',
          User: { Id: 'user-1', Name: 'alice' },
          ServerId: 'srv',
        }),
        { status: 200 },
      ),
    );
    const ret = await authenticateEmbyUser({
      url: 'http://emby.local:8096/',
      username: 'alice',
      password: 'secret',
      fetchImpl: fetchImpl as any,
    });
    expect(ret.success).toBe(true);
    expect(ret.accessToken).toBe('tok-1');
    expect(ret.userId).toBe('user-1');
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://emby.local:8096/Users/AuthenticateByName',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('maps 401 to password error', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 401 }));
    const ret = await authenticateEmbyUser({
      url: 'http://emby.local',
      username: 'a',
      password: 'b',
      fetchImpl: fetchImpl as any,
    });
    expect(ret.success).toBe(false);
    expect(ret.message).toMatch(/用户名或密码/);
  });
});
