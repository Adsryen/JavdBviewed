/**
 * @file embyUserAuth.ts
 * @description Emby/Jellyfin 用户登录（AuthenticateByName）与令牌辅助
 * @module features/embyLibrary
 */
import type { EmbyMediaServer } from '../types';
import { normalizeServerUrl } from '../domain/libraryIndex';

export type EmbyAuthResult = {
  success: boolean;
  accessToken?: string;
  userId?: string;
  userName?: string;
  serverId?: string;
  message?: string;
  raw?: any;
};

/**
 * 使用用户名密码登录 Emby/Jellyfin
 * POST /Users/AuthenticateByName
 */
export async function authenticateEmbyUser(params: {
  url: string;
  username: string;
  password: string;
  /** 设备显示名 */
  deviceName?: string;
  fetchImpl?: typeof fetch;
}): Promise<EmbyAuthResult> {
  const base = normalizeServerUrl(params.url);
  const username = String(params.username || '').trim();
  const password = String(params.password || '');
  const fetchImpl = params.fetchImpl || fetch;

  if (!base) return { success: false, message: '服务器地址无效' };
  if (!username) return { success: false, message: '请填写用户名' };

  const authHeader = buildMediaBrowserAuthHeader({
    token: '',
    deviceName: params.deviceName || 'JavdBviewed',
  });

  try {
    const res = await fetchImpl(`${base}/Users/AuthenticateByName`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Emby-Authorization': authHeader,
        Accept: 'application/json',
      },
      body: JSON.stringify({
        Username: username,
        Pw: password,
        Password: password,
      }),
    });

    const raw = await res.json().catch(() => ({} as any));
    if (!res.ok) {
      const msg =
        raw?.message
        || raw?.Message
        || (res.status === 401 ? '用户名或密码错误' : `登录失败 (${res.status})`);
      return { success: false, message: msg, raw };
    }

    const accessToken = String(raw?.AccessToken || raw?.accessToken || '').trim();
    const userId = String(raw?.User?.Id || raw?.user?.id || raw?.UserId || '').trim();
    const userName = String(raw?.User?.Name || raw?.user?.name || username).trim();
    const serverId = String(raw?.ServerId || raw?.serverId || '').trim() || undefined;

    if (!accessToken || !userId) {
      return { success: false, message: '登录响应缺少 AccessToken 或 UserId', raw };
    }

    return {
      success: true,
      accessToken,
      userId,
      userName,
      serverId,
      raw,
    };
  } catch (e: any) {
    return { success: false, message: e?.message || '登录请求失败' };
  }
}

/**
 * MediaBrowser 鉴权头（Emby/JF 通用）
 */
export function buildMediaBrowserAuthHeader(opts: {
  token?: string;
  client?: string;
  device?: string;
  deviceName?: string;
  version?: string;
}): string {
  const client = opts.client || 'JavdBviewed';
  const device = opts.device || 'ChromeExtension';
  const deviceName = opts.deviceName || 'Dashboard';
  const version = opts.version || '1.0.0';
  const token = opts.token ? `, Token="${opts.token}"` : '';
  return `MediaBrowser Client="${client}", Device="${device}", DeviceId="${deviceName}", Version="${version}"${token}`;
}

/**
 * 请求头：优先用户令牌，否则 api_key 查询参数由调用方拼
 */
export function buildEmbyAuthHeaders(server: Pick<EmbyMediaServer, 'accessToken' | 'apiKey'>): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (server.accessToken) {
    headers['X-Emby-Token'] = server.accessToken;
    headers['X-Emby-Authorization'] = buildMediaBrowserAuthHeader({ token: server.accessToken });
  }
  return headers;
}

/**
 * 是否已具备用户会话（可稳定写 UserData）
 */
export function hasEmbyUserSession(server: Pick<EmbyMediaServer, 'accessToken' | 'userId'>): boolean {
  return Boolean(server.accessToken && server.userId);
}
