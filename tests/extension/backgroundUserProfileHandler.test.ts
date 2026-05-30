import { describe, expect, it, vi } from 'vitest';
import {
  fetchUserProfileFromJavDB,
} from '../../src/apps/background/userProfileMessageHandler';

describe('background user profile message handler', () => {
  it('parses JavDB profile counts and profile fields from profile html', async () => {
    const html = `
      <a href="/users/profile">amixture</a>
      <a href="/users/want_watch_videos">想看 (97)</a>
      <a href="/users/watched_videos">看过 (4,166)</a>
      <span class="label">电邮地址:</span> user@example.com
      <span class="label">用户类型:</span> VIP
    `;
    const requestScheduler = {
      enqueue: vi.fn(async () => ({
        ok: true,
        status: 200,
        url: 'https://javdb.com/users/profile',
        text: async () => html,
      })),
    };
    const setValue = vi.fn();

    const profile = await fetchUserProfileFromJavDB({
      getValue: vi.fn(async () => ({ email: 'old@example.com' })),
      setValue,
      requestScheduler: requestScheduler as any,
      now: () => 123456,
    });

    expect(profile).toEqual({
      email: 'user@example.com',
      username: 'amixture',
      userType: 'VIP',
      isLoggedIn: true,
      lastUpdated: 123456,
      serverStats: {
        wantCount: 97,
        watchedCount: 4166,
        lastSyncTime: 123456,
      },
    });
    expect(setValue).toHaveBeenCalledWith(expect.any(String), profile);
  });

  it('throws when the profile page is not logged in', async () => {
    const requestScheduler = {
      enqueue: vi.fn(async () => ({
        ok: true,
        status: 200,
        url: 'https://javdb.com/users/sign_in',
        text: async () => '<form>login</form>',
      })),
    };

    await expect(fetchUserProfileFromJavDB({
      getValue: vi.fn(async () => null),
      setValue: vi.fn(),
      requestScheduler: requestScheduler as any,
      now: () => 123456,
    })).rejects.toThrow('未登录 JavDB');
  });
});
