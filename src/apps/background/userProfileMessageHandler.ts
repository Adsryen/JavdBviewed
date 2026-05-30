import type { UserProfile } from '../../types';
import { STORAGE_KEYS } from '../../utils/config';
import {
  getValue as defaultGetValue,
  setValue as defaultSetValue,
} from '../../utils/storage';
import { requestScheduler as defaultRequestScheduler } from '../../platform/network/requestScheduler';
import type { RequestSchedulerLike } from './networkMessageHandlers';

export interface FetchUserProfileDependencies {
  getValue?: typeof defaultGetValue;
  setValue?: typeof defaultSetValue;
  requestScheduler?: RequestSchedulerLike;
  now?: () => number;
}

export async function fetchUserProfileFromJavDB(deps: FetchUserProfileDependencies = {}): Promise<any> {
  const getValue = deps.getValue ?? defaultGetValue;
  const setValue = deps.setValue ?? defaultSetValue;
  const requestScheduler = deps.requestScheduler ?? defaultRequestScheduler;
  const nowFn = deps.now ?? Date.now;

  try {
    const baseProfile = await getValue<UserProfile | null>(STORAGE_KEYS.USER_PROFILE, null).catch(() => null);

    const fetchHtml = async (url: string): Promise<{ ok: boolean; html?: string; finalUrl?: string; status?: number }> => {
      try {
        const res = await requestScheduler.enqueue(url, {
          method: 'GET',
          credentials: 'include' as any,
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Referer': 'https://javdb.com/',
            'Cache-Control': 'no-cache',
          },
        } as RequestInit);
        const html = await res.text();
        return { ok: res.ok, html, finalUrl: (res as any).url, status: res.status };
      } catch {
        return { ok: false };
      }
    };

    const profileUrl = 'https://javdb.com/users/profile';
    const profileRes = await fetchHtml(profileUrl);
    const isLoggedIn = !!(
      profileRes.ok && profileRes.html && !((profileRes.finalUrl || '').includes('/sign_in'))
    );

    if (!isLoggedIn) {
      throw new Error('未登录 JavDB');
    }

    const html = profileRes.html || '';
    const wantCount = parseWantCountFromHtml(html) ?? 0;
    const watchedCount = parseWatchedCountFromHtml(html) ?? 0;
    const detail = await extractUserInfoDetail(fetchHtml).catch(() => null);

    const now = nowFn();
    const profile = {
      email: (detail?.email ?? baseProfile?.email) || '',
      username: (detail?.username ?? baseProfile?.username) || '',
      userType: (detail?.userType ?? baseProfile?.userType) || '',
      isLoggedIn: true,
      lastUpdated: now,
      serverStats: {
        wantCount,
        watchedCount,
        lastSyncTime: now,
      },
    };

    try { await setValue(STORAGE_KEYS.USER_PROFILE, profile); } catch {}
    return profile;
  } catch (error) {
    throw error instanceof Error ? error : new Error('获取账号信息失败');
  }
}

function parseWantCountFromHtml(html: string): number | undefined {
  try {
    const match = html.match(/href=["']\/users\/want_watch_videos["'][\s\S]*?想看[\s\S]*?\(([0-9][0-9,\.]*)\)/i);
    return normalizeCount(match?.[1]);
  } catch {
    return undefined;
  }
}

function parseWatchedCountFromHtml(html: string): number | undefined {
  try {
    const match = html.match(/href=["']\/users\/watched_videos["'][\s\S]*?(?:看過|看过)[\s\S]*?\(([0-9][0-9,\.]*)\)/i);
    return normalizeCount(match?.[1]);
  } catch {
    return undefined;
  }
}

async function extractUserInfoDetail(
  fetchHtml: (url: string) => Promise<{ ok: boolean; html?: string; finalUrl?: string; status?: number }>,
): Promise<{ email?: string; username?: string; userType?: string } | null> {
  const candidates = [
    'https://javdb.com/users/profile',
  ];
  for (const url of candidates) {
    try {
      const ret = await fetchHtml(url);
      if (ret.ok && ret.html && !((ret.finalUrl || '').includes('/sign_in'))) {
        const detail = parseUserInfoDetail(ret.html);
        if (detail.email || detail.username || detail.userType) return detail;
      }
    } catch {}
  }
  return null;
}

function parseUserInfoDetail(html: string): { email?: string; username?: string; userType?: string } {
  const emailFromProfile = (html.match(/<span[^>]*class=["']label["'][^>]*>\s*(?:电邮地址|電郵地址|邮箱|電子郵件|电子邮件)\s*:<\/span>\s*([^<\n]+)/i) || [])[1]?.trim();
  const usernameFromProfile = (html.match(/<span[^>]*class=["']label["'][^>]*>\s*(?:用戶名|用户名|使用者名稱|使用者名称)\s*:<\/span>\s*([^<\n]+)/i) || [])[1]?.trim();
  const userTypeFromProfile = (html.match(/<span[^>]*class=["']label["'][^>]*>\s*(?:用戶類型|用户类型|使用者類型|使用者类型)\s*:<\/span>\s*([^<\n]+)/i) || [])[1]?.trim();
  const usernameFromAnchor = (html.match(/<a[^>]*href=["']\/users\/profile["'][^>]*>\s*([^<]{1,40})\s*<\/a>/i) || [])[1]?.trim();

  const emailMatch = html.match(/name="user\[email\]"[^>]*value="([^"]*)"/i) || html.match(/id="user_email"[^>]*value="([^"]*)"/i);
  const usernameMatch = html.match(/name="user\[username\]"[^>]*value="([^"]*)"/i) || html.match(/id="user_username"[^>]*value="([^"]*)"/i);
  const email = (emailMatch?.[1]?.trim()) || emailFromProfile;
  const username = (usernameMatch?.[1]?.trim()) || usernameFromProfile || usernameFromAnchor;

  const userTypeRaw = (userTypeFromProfile || '').replace(/[，,]/g, '').trim();
  let userType: string | undefined;
  if (userTypeRaw) {
    if (/vip|premium/i.test(userTypeRaw)) userType = 'VIP';
    else if (/(普通用戶|普通用户|normal|regular)/i.test(userTypeRaw)) userType = '普通用户';
    else if (/(會員|会员)/.test(userTypeRaw)) userType = '会员';
    else userType = userTypeRaw;
  }

  return { email, username, userType };
}

function normalizeCount(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const count = Number(String(value).replace(/[\s,\.]/g, ''));
  return Number.isFinite(count) ? count : undefined;
}
