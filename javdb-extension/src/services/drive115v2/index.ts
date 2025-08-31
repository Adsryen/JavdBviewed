import { getSettings, saveSettings } from '../../utils/storage';

/**
 * drive115v2: 基于 access_token/refresh_token 的新版 115 服务骨架
 * 仅用于承载设置与后续刷新逻辑，不影响旧版实现。
 */

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_at?: number | null; // 秒级时间戳
}

// 115 v2 用户信息（基于 /open/user/info 推测的常见字段集合，做可选兜底）
export interface Drive115V2UserInfo {
  // 基础
  id?: number | string;
  uid?: number | string;
  user_id?: number | string;
  name?: string;
  username?: string;
  nick?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  avatar_small?: string;
  avatar_middle?: string;
  avatar_large?: string;

  // 空间与会员
  space_total?: number;
  space_used?: number;
  space_free?: number;
  is_vip?: boolean | number;
  vip_level?: number | string;
  vip_expire?: number | string; // 可能为时间戳或可解析字符串
}

export interface Drive115V2UserInfoResponse {
  state?: boolean;
  errNo?: number;
  error?: string;
  data?: Drive115V2UserInfo;
  // 有些实现可能直接平铺返回用户字段，因此保留索引签名
  [k: string]: any;
}


class Drive115V2Service {
  private static instance: Drive115V2Service | null = null;
  // 基础域名：从设置读取（默认 https://proapi.115.com）
  private async getBaseURL(): Promise<string> {
    try {
      const settings = await getSettings();
      const url = (settings?.drive115?.v2ApiBaseUrl || '').toString().trim();
      if (url) return url.replace(/\/$/, '');
    } catch {}
    return 'https://proapi.115.com';
  }
  // 刷新域名：按文档使用 passportapi
  private readonly refreshURL = 'https://passportapi.115.com';

  static getInstance(): Drive115V2Service {
    if (!this.instance) this.instance = new Drive115V2Service();
    return this.instance;
  }

  private constructor() {}

  // 预留：手动刷新 access_token（未来会调用 https://api.oplist.org/ 流程）
  async manualRefresh(_refreshToken: string): Promise<{ success: boolean; message?: string; token?: TokenPair }> {
    // 占位：当前逻辑在设置面板中仅复制 refresh_token 并打开帮助页面
    return { success: true, message: '请按帮助页指引完成刷新流程' };
  }

  /**
   * 刷新 access_token
   * POST https://passportapi.115.com/open/refreshToken
   * Headers: Content-Type: application/x-www-form-urlencoded
   * Body: refresh_token=<token>
   */
  async refreshToken(refreshToken: string): Promise<{ success: boolean; message?: string; token?: TokenPair; raw?: any }>{
    try {
      const rt = (refreshToken || '').trim();
      if (!rt) return { success: false, message: '缺少 refresh_token' };

      const url = `${this.refreshURL}/open/refreshToken`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({ refresh_token: rt }).toString(),
      });

      if (!res.ok) {
        return { success: false, message: `网络错误: ${res.status} ${res.statusText}` };
      }

      const json: any = await res.json().catch(() => ({} as any));
      // 兼容多种返回：{state, code, message, data:{access_token, refresh_token, expires_in}}
      const ok = (typeof json.state === 'boolean') ? json.state : true; // 若无 state 字段，则按照成功处理并通过字段兜底
      const data = json?.data || {};
      const at: string | undefined = data?.access_token || json?.access_token;
      const newRt: string | undefined = data?.refresh_token || json?.refresh_token || rt;
      const expiresIn: number | undefined = Number(data?.expires_in ?? json?.expires_in);

      if (!ok || !at) {
        const msg = json?.message || json?.error || '刷新失败';
        return { success: false, message: msg, raw: json };
      }

      const nowSec = Math.floor(Date.now() / 1000);
      const token: TokenPair = {
        access_token: at,
        refresh_token: newRt || rt,
        expires_at: expiresIn && !isNaN(expiresIn) ? nowSec + Math.max(0, expiresIn) : null,
      };
      return { success: true, token, raw: json };
    } catch (e: any) {
      return { success: false, message: e?.message || '刷新失败' };
    }
  }

  /**
   * 返回一个当前可用的 access_token。
   * 若设置允许自动刷新且 token 将在 skew 秒内过期或已过期，则使用 refresh_token 刷新并持久化。
   */
  async getValidAccessToken(): Promise<{ success: true; accessToken: string } | { success: false; message: string }>{
    const settings = await getSettings();
    const drv = settings?.drive115 || {} as any;
    const enabledV2 = !!drv.enableV2;
    const accessToken: string = (drv.v2AccessToken || '').trim();
    const refreshToken: string = (drv.v2RefreshToken || '').trim();
    const expiresAt: number | null | undefined = drv.v2TokenExpiresAt ?? drv.v2TokenExpiresAt;
    const autoRefresh: boolean = drv.v2AutoRefresh !== false; // 默认开启
    const skewSec: number = Math.max(0, Number(drv.v2AutoRefreshSkewSec ?? 60) || 0);

    if (!enabledV2) return { success: false, message: '115 v2 未启用' };
    if (!accessToken && !refreshToken) return { success: false, message: '缺少 access_token/refresh_token' };

    const now = Math.floor(Date.now() / 1000);
    const stillValid = !!accessToken && (typeof expiresAt !== 'number' || expiresAt === null || expiresAt - skewSec > now);
    if (stillValid) {
      return { success: true, accessToken };
    }

    if (!autoRefresh) {
      return { success: false, message: 'access_token 已过期且未开启自动刷新' };
    }
    if (!refreshToken) {
      return { success: false, message: '缺少 refresh_token，无法自动刷新' };
    }

    const ret = await this.refreshToken(refreshToken);
    if (!ret.success || !ret.token) {
      return { success: false, message: ret.message || '刷新失败' };
    }

    // 持久化新的 token
    const newAt = ret.token.access_token || '';
    const newRt = ret.token.refresh_token || refreshToken;
    const newExp = typeof ret.token.expires_at === 'number' ? ret.token.expires_at : null;
    const newSettings = { ...settings } as any;
    newSettings.drive115 = { ...(settings.drive115 || {}) };
    newSettings.drive115.v2AccessToken = newAt;
    newSettings.drive115.v2RefreshToken = newRt;
    newSettings.drive115.v2TokenExpiresAt = newExp;
    await saveSettings(newSettings);

    return { success: true, accessToken: newAt };
  }

  /**
   * 获取 115 v2 用户信息
   * 请求：GET {baseURL}/open/user/info
   * Header：Authorization: Bearer <access_token>
   */
  async fetchUserInfo(accessToken: string): Promise<{ success: boolean; data?: Drive115V2UserInfo; message?: string; raw?: Drive115V2UserInfoResponse }> {
    try {
      const token = (accessToken || '').trim();
      if (!token) return { success: false, message: '缺少 access_token' };

      const base = await this.getBaseURL();
      const url = `${base}/open/user/info`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        // 带上凭据通常不需要（token足够），保持默认
      });

      if (!res.ok) {
        return { success: false, message: `网络错误: ${res.status} ${res.statusText}` };
      }

      const json: Drive115V2UserInfoResponse = await res.json().catch(() => ({} as any));

      // 常见包裹：{ state, data } 或直接平铺
      const ok = typeof json.state === 'boolean' ? json.state : true; // 若无 state 字段，按成功处理再做兜底校验
      let user: Drive115V2UserInfo | undefined = undefined;
      if (json && typeof json === 'object') {
        if (json.data && typeof json.data === 'object') {
          user = json.data as Drive115V2UserInfo;
        } else {
          // 某些实现可能直接平铺返回，将已知字段映射出来
          const candidate: any = json;
          const keys = ['id','uid','user_id','name','username','nick','email','phone','avatar','avatar_small','avatar_middle','avatar_large','space_total','space_used','space_free','is_vip','vip_level','vip_expire'];
          const picked: any = {};
          let hasAny = false;
          for (const k of keys) {
            if (k in candidate) {
              picked[k] = candidate[k];
              hasAny = true;
            }
          }
          if (hasAny) user = picked as Drive115V2UserInfo;
        }
      }

      if (!ok) {
        return { success: false, message: json.error || `接口返回失败 errNo=${json.errNo ?? ''}`, raw: json };
      }
      if (!user || Object.keys(user).length === 0) {
        return { success: false, message: '未获取到用户数据', raw: json };
      }
      return { success: true, data: user, raw: json };
    } catch (e: any) {
      return { success: false, message: e?.message || '获取用户信息失败' };
    }
  }

  /**
   * 添加离线下载任务（批量 URL）
   * 请求：POST {baseURL}/open/offline/add_task_urls
   * Header：Authorization: Bearer <access_token>
   * Body: urls=... (以\n分隔); 可选 wp_path_id
   * 返回：{ state?: boolean, message?: string, code?: number, data?: any[] }
   */
  async addTaskUrls(params: {
    accessToken: string;
    urls: string; // 多个URL以\n分隔
    wp_path_id?: string; // 目标目录，缺省为根目录
  }): Promise<{ success: boolean; message?: string; raw?: any } & { data?: any[] }> {
    try {
      const token = (params.accessToken || '').trim();
      if (!token) return { success: false, message: '缺少 access_token' };

      const base = await this.getBaseURL();
      const url = `${base}/open/offline/add_task_urls`;

      // 优先使用 application/x-www-form-urlencoded，兼容性更好
      const body = new URLSearchParams({ urls: params.urls });
      if (params.wp_path_id && params.wp_path_id !== '0') body.set('wp_path_id', params.wp_path_id);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: body.toString(),
      });

      if (!res.ok) {
        return { success: false, message: `网络错误: ${res.status} ${res.statusText}` };
      }

      const json: any = await res.json().catch(() => ({} as any));
      const ok = typeof json.state === 'boolean' ? json.state : true;
      if (!ok) {
        return { success: false, message: json.message || json.error || '添加任务失败', raw: json };
      }
      const data: any[] | undefined = Array.isArray(json?.data) ? json.data : undefined;
      return { success: true, data, raw: json };
    } catch (e: any) {
      return { success: false, message: e?.message || '添加任务失败' };
    }
  }
}

export function getDrive115V2Service(): Drive115V2Service {
  return Drive115V2Service.getInstance();
}
