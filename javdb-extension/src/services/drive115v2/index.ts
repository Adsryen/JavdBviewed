import { getSettings, saveSettings } from '../../utils/storage';
import { describe115Error } from './errorCodes';
import { addLogV2 } from './logs';

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


// v2 文件搜索：查询参数与返回类型
export interface Drive115V2SearchQuery {
  search_value: string; // 关键字（必填）
  limit: number;        // 单页记录数（必填）
  offset: number;       // 偏移量（必填）
  file_label?: string;  // 标签（可选）
  cid?: string | number; // 目录ID，-1 表示不返回列表任何内容（可选）
  gte_day?: string;     // 开始时间 YYYY-MM-DD（可选）
  lte_day?: string;     // 结束时间 YYYY-MM-DD（可选）
  fc?: 1 | 2;           // 只显示文件或文件夹：1 文件夹；2 文件（可选）
  type?: 1 | 2 | 3 | 4 | 5 | 6; // 一级分类：文档/图片/音乐/视频/压缩包/应用（可选）
  suffix?: string;      // 其他后缀（可选）
}

export interface Drive115V2SearchItem {
  file_id: string;
  user_id: string;
  sha1: string;
  file_name: string;
  file_size: string;
  user_ptime: string;
  user_utime: string;
  pick_code: string;
  parent_id: string;
  area_id: string; // 1 正常，7 回收站，120 彻底删除
  is_private: number; // 0 未隐藏，1 已隐藏
  file_category: string; // 1 文件；0 文件夹（按文档原文）
  ico: string; // 文件后缀
  [k: string]: any;
}

export interface Drive115V2SearchResponse {
  state?: boolean;
  message?: string;
  code?: number;
  count?: number; // 符合条件总数
  data?: Drive115V2SearchItem[];
  limit?: number;
  offset?: number;
  [k: string]: any;
}


// 配额信息类型（/open/offline/get_quota_info）
export interface Drive115V2QuotaExpireInfo {
  expire_time?: number | string | null;
  expire_text?: string;
  [k: string]: any;
}

export interface Drive115V2QuotaItem {
  name?: string;          // 配额类型名称
  type?: string | number; // 配额类型标识
  count?: number;         // 配额总数
  used?: number;          // 已用
  surplus?: number;       // 剩余
  expire_info?: Drive115V2QuotaExpireInfo | null; // 过期信息
  [k: string]: any;
}

export interface Drive115V2QuotaInfo {
  total?: number;               // 总额度（若返回）
  used?: number;                // 已使用总额（若返回）
  surplus?: number;             // 总剩余（若返回）
  list?: Drive115V2QuotaItem[]; // 各配额项
  [k: string]: any;
}

export interface Drive115V2QuotaResponse {
  state?: boolean;
  message?: string;
  code?: number;
  data?: Drive115V2QuotaInfo | Drive115V2QuotaItem[] | any;
  [k: string]: any;
}


class Drive115V2Service {
  private static instance: Drive115V2Service | null = null;
  // 并发刷新保护：避免多处同时触发 refresh 导致频繁请求
  private refreshingPromise: Promise<{ success: boolean; message?: string; token?: TokenPair; raw?: any }> | null = null;
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
      await addLogV2({ timestamp: Date.now(), level: 'info', message: '开始刷新 access_token（v2）' });
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({ refresh_token: rt }).toString(),
      });

      if (!res.ok) {
        const msg = `刷新 access_token 网络错误: ${res.status} ${res.statusText}`;
        await addLogV2({ timestamp: Date.now(), level: 'warn', message: msg });
        return { success: false, message: msg };
      }

      const json: any = await res.json().catch(() => ({} as any));
      // 兼容多种返回：{state, code, message, data:{access_token, refresh_token, expires_in}}
      const ok = (typeof json.state === 'boolean') ? json.state : true; // 若无 state 字段，则按照成功处理并通过字段兜底
      const data = json?.data || {};
      const at: string | undefined = data?.access_token || json?.access_token;
      const newRt: string | undefined = data?.refresh_token || json?.refresh_token || rt;
      const expiresIn: number | undefined = Number(data?.expires_in ?? json?.expires_in);

      if (!ok || !at) {
        const msg = describe115Error(json) || json?.message || json?.error || '刷新失败';
        await addLogV2({ timestamp: Date.now(), level: 'error', message: `刷新 access_token 失败：${msg}` });
        return { success: false, message: msg, raw: json };
      }

      const nowSec = Math.floor(Date.now() / 1000);
      const token: TokenPair = {
        access_token: at,
        refresh_token: newRt || rt,
        expires_at: expiresIn && !isNaN(expiresIn) ? nowSec + Math.max(0, expiresIn) : null,
      };
      await addLogV2({ timestamp: Date.now(), level: 'info', message: `刷新 access_token 成功（expires_in=${expiresIn ?? '未知'}）` });
      return { success: true, token, raw: json };
    } catch (e: any) {
      const msg = describe115Error(e) || e?.message || '刷新失败';
      await addLogV2({ timestamp: Date.now(), level: 'error', message: `刷新 access_token 异常：${msg}` });
      return { success: false, message: msg };
    }
  }

  /**
   * 获取有效的 access_token。若已过期且允许自动刷新，将使用 refresh_token 刷新并持久化。
   */
  async getValidAccessToken(opts?: { forceAutoRefresh?: boolean }): Promise<{ success: true; accessToken: string } | { success: false; message: string }>{
    const settings = await getSettings();
    const drv = (settings?.drive115 || {}) as any;
    const accessToken: string = (drv.v2AccessToken || '').trim();
    const refreshToken: string = (drv.v2RefreshToken || '').trim();
    const expiresAt: number | null | undefined = drv.v2TokenExpiresAt;
    const autoRefreshSetting: boolean = drv.v2AutoRefresh !== false; // 默认开启
    const autoRefresh: boolean = (opts?.forceAutoRefresh !== undefined) ? !!opts.forceAutoRefresh : autoRefreshSetting;
    const skewSec: number = Math.max(0, Number(drv.v2AutoRefreshSkewSec ?? 60) || 0);

    if (!accessToken && !refreshToken) return { success: false, message: '缺少 access_token/refresh_token' };

    const now = Math.floor(Date.now() / 1000);
    // 仅当存在明确的过期时间且尚未接近过期时，才视为仍然有效
    const stillValid = !!accessToken && (typeof expiresAt === 'number' && expiresAt - skewSec > now);
    if (stillValid) {
      await addLogV2({ timestamp: Date.now(), level: 'debug', message: 'access_token 仍在有效期内（v2）' });
      return { success: true, accessToken };
    }

    if (!autoRefresh) {
      const msg = 'access_token 已过期且未开启自动刷新（v2）';
      await addLogV2({ timestamp: Date.now(), level: 'warn', message: msg });
      return { success: false, message: msg };
    }
    if (!refreshToken) return { success: false, message: '缺少 refresh_token，无法自动刷新' };

    // 刷新并发保护：若已有刷新在进行，复用同一个 Promise
    let ret: { success: boolean; message?: string; token?: TokenPair; raw?: any };
    if (this.refreshingPromise) {
      await addLogV2({ timestamp: Date.now(), level: 'debug', message: '发现正在进行中的刷新任务，复用 Promise（v2）' });
      ret = await this.refreshingPromise;
    } else {
      await addLogV2({ timestamp: Date.now(), level: 'info', message: 'access_token 已过期，开始自动刷新（v2）' });
      this.refreshingPromise = this.refreshToken(refreshToken);
      try {
        ret = await this.refreshingPromise;
      } finally {
        this.refreshingPromise = null;
      }
    }
    if (!ret.success || !ret.token) {
      const msg = ret.message || '刷新失败';
      await addLogV2({ timestamp: Date.now(), level: 'error', message: `自动刷新 access_token 失败：${msg}` });
      return { success: false, message: msg };
    }

    // 持久化新的 token
    const newAt = ret.token.access_token || '';
    const newRt = ret.token.refresh_token || refreshToken;
    const newExp = typeof ret.token.expires_at === 'number' ? ret.token.expires_at : null;
    const newSettings: any = { ...(settings || {}) };
    newSettings.drive115 = { ...(settings?.drive115 || {}) };
    newSettings.drive115.v2AccessToken = newAt;
    newSettings.drive115.v2RefreshToken = newRt;
    newSettings.drive115.v2TokenExpiresAt = newExp;
    await saveSettings(newSettings);
    await addLogV2({ timestamp: Date.now(), level: 'info', message: '自动刷新 access_token 成功并已持久化（v2）' });

    return { success: true, accessToken: newAt };
  }

  /**
   * 判断返回是否为 access_token 无效/过期
   */
  private isTokenInvalidResponse(json: any): boolean {
    if (!json || typeof json !== 'object') return false;
    const code = Number(json.code ?? json.errNo ?? json.errno ?? NaN);
    const msgRaw = String(json.message || json.error || '');
    const msg = msgRaw.toLowerCase();
    // 常见 code 组合
    if (
      code === 40140125 || // token 无效
      code === 40140126 || // token 过期/校验失败
      code === 401 ||
      code === 401401 ||
      code === 400401 || // 某些网关返回
      code === 401001 // 未授权/登录信息失效
    ) return true;
    // 关键字匹配（尽量宽松覆盖不同文案）
    if (
      msg.includes('access_token') && (msg.includes('invalid') || msg.includes('无效') || msg.includes('过期') || msgRaw.includes('校验失败'))
      || msg.includes('token invalid')
      || msg.includes('token 无效')
      || msg.includes('token 失效')
      || msg.includes('登录信息失效')
      || msg.includes('unauthorized')
      || msg.includes('未授权')
    ) return true;
    return false;
  }

  /**
   * 获取用户信息（自动处理 access_token 失效：刷新并重试一次）
   */
  async fetchUserInfoAuto(opts?: { forceAutoRefresh?: boolean }): Promise<{ success: boolean; data?: Drive115V2UserInfo; message?: string; raw?: Drive115V2UserInfoResponse }>{
    const settings = await getSettings();
    const drv = (settings?.drive115 || {}) as any;
    const autoRefresh: boolean = (opts?.forceAutoRefresh !== undefined) ? !!opts.forceAutoRefresh : (drv.v2AutoRefresh !== false); // 默认使用设置；可被强制覆盖

    const vt = await this.getValidAccessToken({ forceAutoRefresh: autoRefresh });
    if (!vt.success) return { success: false, message: vt.message } as any;

    await addLogV2({ timestamp: Date.now(), level: 'debug', message: '开始获取用户信息（v2）' });
    let first = await this.fetchUserInfo(vt.accessToken);
    if (first.success) return first;

    const tokenInvalid = this.isTokenInvalidResponse((first as any).raw) || /access[_\s-]?token/i.test(String(first.message || ''));
    if (tokenInvalid) {
      console.debug('[drive115v2] 检测到 access_token 失效/过期，准备刷新并重试', {
        raw: (first as any).raw,
        message: first.message,
      });
      await addLogV2({ timestamp: Date.now(), level: 'warn', message: '获取用户信息失败，疑似 token 失效（v2）' });
    } else {
      console.debug('[drive115v2] 首次获取用户信息失败，但非 token 失效', {
        raw: (first as any).raw,
        message: first.message,
      });
      await addLogV2({ timestamp: Date.now(), level: 'warn', message: `获取用户信息失败：${first.message || '未知错误'}` });
    }
    // 为避免重复刷新，这里不再进行二次 refreshToken 调用。
    // 自动刷新应由 getValidAccessToken 根据设置统一处理；若仍失败，直接返回首次结果供上层处理。
    return first;
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
        const msg = `获取用户信息网络错误: ${res.status} ${res.statusText}`;
        await addLogV2({ timestamp: Date.now(), level: 'warn', message: msg });
        return { success: false, message: msg };
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
        const msg = describe115Error(json) || json.error || json.message || `接口返回失败 errNo=${json.errNo ?? ''}`;
        await addLogV2({ timestamp: Date.now(), level: 'warn', message: `获取用户信息失败：${msg}` });
        return { success: false, message: msg, raw: json };
      }
      if (!user || Object.keys(user).length === 0) {
        await addLogV2({ timestamp: Date.now(), level: 'warn', message: '获取用户信息成功但数据为空' });
        return { success: false, message: '未获取到用户数据', raw: json };
      }
      await addLogV2({ timestamp: Date.now(), level: 'info', message: '获取用户信息成功（v2）' });
      return { success: true, data: user, raw: json };
    } catch (e: any) {
      const msg = describe115Error(e) || e?.message || '获取用户信息失败';
      await addLogV2({ timestamp: Date.now(), level: 'error', message: `获取用户信息异常：${msg}` });
      return { success: false, message: msg };
    }
  }

  /**
   * 文件搜索（v2）
   * GET {baseURL}/open/ufile/search
   * Header: Authorization: Bearer <access_token>
   * Query: search_value, limit, offset, file_label?, cid?, gte_day?, lte_day?, fc?, type?, suffix?
   */
  async searchFiles(params: { accessToken: string } & Drive115V2SearchQuery): Promise<
    { success: boolean; message?: string; raw?: Drive115V2SearchResponse } &
    { count?: number; data?: Drive115V2SearchItem[]; limit?: number; offset?: number }
  > {
    try {
      const token = (params.accessToken || '').trim();
      if (!token) return { success: false, message: '缺少 access_token' } as any;

      const base = await this.getBaseURL();
      const url = `${base}/open/ufile/search`;

      const qs = new URLSearchParams();
      qs.set('search_value', String(params.search_value ?? ''));
      qs.set('limit', String(params.limit ?? 20));
      qs.set('offset', String(params.offset ?? 0));
      if (params.file_label) qs.set('file_label', String(params.file_label));
      if (params.cid !== undefined && params.cid !== null && String(params.cid).length > 0) qs.set('cid', String(params.cid));
      if (params.gte_day) qs.set('gte_day', String(params.gte_day));
      if (params.lte_day) qs.set('lte_day', String(params.lte_day));
      if (params.fc) qs.set('fc', String(params.fc));
      if (params.type) qs.set('type', String(params.type));
      if (params.suffix) qs.set('suffix', String(params.suffix));

      await addLogV2({ timestamp: Date.now(), level: 'debug', message: `开始搜索（v2）：q="${String(params.search_value ?? '').slice(0, 50)}"` });
      const res = await fetch(`${url}?${qs.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!res.ok) {
        const msg = `搜索网络错误: ${res.status} ${res.statusText}`;
        await addLogV2({ timestamp: Date.now(), level: 'warn', message: msg });
        return { success: false, message: msg } as any;
      }

      const json: Drive115V2SearchResponse = await res.json().catch(() => ({} as any));
      const ok = typeof json.state === 'boolean' ? json.state : true;
      if (!ok) {
        const msg = describe115Error(json) || json.message || '搜索失败';
        await addLogV2({ timestamp: Date.now(), level: 'warn', message: `搜索失败：${msg}` });
        return { success: false, message: msg, raw: json } as any;
      }
      const data = Array.isArray(json?.data) ? json.data as Drive115V2SearchItem[] : undefined;
      await addLogV2({ timestamp: Date.now(), level: 'info', message: `搜索成功（v2）：返回 ${Array.isArray(data) ? data.length : 0} 条` });
      return {
        success: true,
        count: typeof json.count === 'number' ? json.count : undefined,
        data,
        limit: typeof json.limit === 'number' ? json.limit : undefined,
        offset: typeof json.offset === 'number' ? json.offset : undefined,
        raw: json,
      } as any;
    } catch (e: any) {
      const msg = describe115Error(e) || e?.message || '搜索失败';
      await addLogV2({ timestamp: Date.now(), level: 'error', message: `搜索异常：${msg}` });
      return { success: false, message: msg } as any;
    }
  }

  /**
   * 获取离线下载配额信息（v2）
   * GET {baseURL}/open/offline/get_quota_info
   * Header: Authorization: Bearer <access_token>
   */
  async getQuotaInfo(params: { accessToken: string }): Promise<
    { success: boolean; message?: string; raw?: Drive115V2QuotaResponse } & { data?: Drive115V2QuotaInfo }
  > {
    try {
      const token = (params.accessToken || '').trim();
      if (!token) return { success: false, message: '缺少 access_token' } as any;

      const base = await this.getBaseURL();
      const url = `${base}/open/offline/get_quota_info`;
      await addLogV2({ timestamp: Date.now(), level: 'debug', message: '开始获取离线配额信息（v2）' });
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!res.ok) {
        const msg = `获取配额网络错误: ${res.status} ${res.statusText}`;
        await addLogV2({ timestamp: Date.now(), level: 'warn', message: msg });
        return { success: false, message: msg } as any;
      }

      const json: Drive115V2QuotaResponse = await res.json().catch(() => ({} as any));
      const ok = typeof json.state === 'boolean' ? json.state : true;
      if (!ok) {
        const msg = describe115Error(json) || json.message || json.error || '获取配额失败';
        await addLogV2({ timestamp: Date.now(), level: 'warn', message: `获取配额失败：${msg}` });
        return { success: false, message: msg, raw: json } as any;
      }

      // 兼容 data 为对象或数组的两种形态
      let info: Drive115V2QuotaInfo | undefined = undefined;
      if (json && typeof json === 'object') {
        if (Array.isArray(json.data)) {
          info = { list: json.data as Drive115V2QuotaItem[] } as Drive115V2QuotaInfo;
        } else if (json.data && typeof json.data === 'object') {
          const d: any = json.data;
          const list: Drive115V2QuotaItem[] | undefined = Array.isArray(d.list) ? d.list : (Array.isArray(d.quota_list) ? d.quota_list : undefined);
          const total: number | undefined = typeof d.total === 'number' ? d.total : (typeof d.quota_total === 'number' ? d.quota_total : undefined);
          const used: number | undefined = typeof d.used === 'number' ? d.used : (typeof d.quota_used === 'number' ? d.quota_used : undefined);
          const surplus: number | undefined = typeof d.surplus === 'number' ? d.surplus : (typeof d.quota_surplus === 'number' ? d.quota_surplus : undefined);
          info = { total, used, surplus, list } as Drive115V2QuotaInfo;
        }
      }
      if (!info) info = {} as Drive115V2QuotaInfo;

      await addLogV2({ timestamp: Date.now(), level: 'info', message: '获取离线配额信息成功（v2）' });
      return { success: true, data: info, raw: json } as any;
    } catch (e: any) {
      const msg = describe115Error(e) || e?.message || '获取配额失败';
      await addLogV2({ timestamp: Date.now(), level: 'error', message: `获取配额异常：${msg}` });
      return { success: false, message: msg } as any;
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

      // 优先走后台代理，避免内容脚本在 javdb.com 环境的 CORS 限制
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime?.id && typeof chrome.runtime.sendMessage === 'function') {
          const bgResp: any = await new Promise((resolve) => {
            try {
              chrome.runtime.sendMessage(
                {
                  type: 'drive115.add_task_urls_v2',
                  payload: {
                    accessToken: token,
                    urls: params.urls,
                    wp_path_id: params.wp_path_id,
                    baseUrl: base,
                  },
                },
                (resp) => resolve(resp)
              );
            } catch {
              resolve(undefined);
            }
          });
          if (bgResp && typeof bgResp.success === 'boolean') {
            // 与原函数返回结构对齐
            return {
              success: !!bgResp.success,
              message: bgResp.message,
              raw: bgResp.raw,
              data: bgResp.data,
            } as any;
          }
        }
      } catch {
        // 忽略，继续走前台 fetch 回退
      }

      // 改为 multipart/form-data（FormData），便于携带 wp_path_id 且与官方接口一致
      const fd = new FormData();
      fd.set('urls', params.urls);
      // 当外部提供 wp_path_id（即使为 '0'）时，始终携带
      if (params.wp_path_id !== undefined) {
        fd.set('wp_path_id', String(params.wp_path_id));
      }

      const count = String(params.urls || '').split('\n').filter(s => s.trim()).length;
      await addLogV2({ timestamp: Date.now(), level: 'info', message: `开始添加离线任务（v2）：${count} 项，目录=${params.wp_path_id ?? '未指定（根）'}` });
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // 不手动设置 Content-Type，交由浏览器注入含 boundary 的 multipart/form-data
          'Accept': 'application/json'
        },
        body: fd,
      });

      if (!res.ok) {
        const msg = `添加离线任务网络错误: ${res.status} ${res.statusText}`;
        await addLogV2({ timestamp: Date.now(), level: 'warn', message: msg });
        return { success: false, message: msg };
      }

      const json: any = await res.json().catch(() => ({} as any));
      const ok = typeof json.state === 'boolean' ? json.state : true;
      if (!ok) {
        const msg = describe115Error(json) || json.message || json.error || '添加任务失败';
        await addLogV2({ timestamp: Date.now(), level: 'error', message: `添加离线任务失败：${msg}` });
        return { success: false, message: msg, raw: json };
      }
      const data: any[] | undefined = Array.isArray(json?.data) ? json.data : undefined;
      await addLogV2({ timestamp: Date.now(), level: 'info', message: `添加离线任务成功（v2）：返回 ${Array.isArray(data) ? data.length : 0} 项` });
      return { success: true, data, raw: json };
    } catch (e: any) {
      const msg = describe115Error(e) || e?.message || '添加任务失败';
      await addLogV2({ timestamp: Date.now(), level: 'error', message: `添加离线任务异常：${msg}` });
      return { success: false, message: msg };
    }
  }
}

export function getDrive115V2Service(): Drive115V2Service {
  return Drive115V2Service.getInstance();
}
