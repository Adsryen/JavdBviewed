/**
 * @file embyPlayback.ts
 * @description 使用已保存的用户 AccessToken / ApiKey 解析 Emby/JF 可播直链（不依赖浏览器网页登录态）
 * @module features/embyLibrary
 *
 * 依据本仓 reference/emby-api-4.9.5.0：
 * - GET/POST /Items/{Id}/PlaybackInfo → MediaSources + PlaySessionId
 * - GET /Videos/{Id}/stream → 视频流（可 Static 直出）
 */
import type { EmbyMediaServer } from '../types';
import { buildEmbyAuthHeaders } from './embyUserAuth';
import { normalizeServerUrl } from './libraryIndex';

export type EmbyResolvedStream = {
  success: boolean;
  streamUrl?: string;
  /** 官方网页详情（需浏览器已登录才方便继续操作） */
  detailUrl?: string;
  mediaSourceId?: string;
  playSessionId?: string;
  container?: string;
  /** 是否直出（Static） */
  static?: boolean;
  message?: string;
};

type PlaybackMediaSource = {
  Id?: string;
  Path?: string;
  Container?: string;
  SupportsDirectPlay?: boolean;
  SupportsDirectStream?: boolean;
  SupportsTranscoding?: boolean;
  DirectStreamUrl?: string;
  TranscodingUrl?: string;
};

/**
 * 解析可在扩展 <video> 中播放的流地址。
 * 鉴权：优先 accessToken（用户会话），否则 apiKey query。
 */
export async function resolveEmbyStreamUrl(params: {
  server: Pick<EmbyMediaServer, 'url' | 'apiKey' | 'accessToken' | 'userId' | 'type'>;
  itemId: string;
  serverId?: string;
  fetchImpl?: typeof fetch;
}): Promise<EmbyResolvedStream> {
  const base = normalizeServerUrl(params.server.url);
  const itemId = String(params.itemId || '').trim();
  const fetchImpl = params.fetchImpl || fetch;
  const token = String(params.server.accessToken || params.server.apiKey || '').trim();
  const userId = String(params.server.userId || '').trim();

  if (!base || !itemId) {
    return { success: false, message: '缺少服务器地址或 itemId' };
  }
  if (!token) {
    return { success: false, message: '请先配置 API Key，或登录媒体服务器用户账号' };
  }

  const detailRoute = params.server.type === 'jellyfin' ? 'details' : 'item';
  const serverIdParam = params.serverId ? `&serverId=${encodeURIComponent(params.serverId)}` : '';
  const detailUrl = `${base}/web/index.html#!/${detailRoute}?id=${encodeURIComponent(itemId)}${serverIdParam}`;

  try {
    // 1) PlaybackInfo（有 UserId 时更完整）
    const infoParams = new URLSearchParams();
    if (userId) infoParams.set('UserId', userId);
    // 无 accessToken 时用 api_key
    if (!params.server.accessToken && params.server.apiKey) {
      infoParams.set('api_key', params.server.apiKey);
    }

    const infoUrl = `${base}/Items/${encodeURIComponent(itemId)}/PlaybackInfo?${infoParams.toString()}`;
    const headers = buildEmbyAuthHeaders(params.server);

    const infoRes = await fetchImpl(infoUrl, {
      method: 'GET',
      headers,
    });

    if (infoRes.status === 401 || infoRes.status === 403) {
      return {
        success: false,
        detailUrl,
        message: '鉴权失败：请重新登录媒体服务器用户账号，或检查 API Key 权限',
      };
    }
    if (!infoRes.ok) {
      // 回退：不经 PlaybackInfo，直接拼 Static 流（部分服务器可用）
      const fallback = buildStaticStreamUrl(base, itemId, token, undefined, undefined);
      return {
        success: true,
        streamUrl: fallback,
        detailUrl,
        static: true,
        message: `PlaybackInfo 失败 (${infoRes.status})，已尝试直链`,
      };
    }

    const info = await infoRes.json().catch(() => ({} as any));
    const sources: PlaybackMediaSource[] = Array.isArray(info?.MediaSources) ? info.MediaSources : [];
    const playSessionId = String(info?.PlaySessionId || '').trim() || undefined;
    const source = sources[0];
    if (!source?.Id) {
      const fallback = buildStaticStreamUrl(base, itemId, token, undefined, playSessionId);
      return {
        success: true,
        streamUrl: fallback,
        detailUrl,
        playSessionId,
        static: true,
        message: '无 MediaSources，已尝试直链',
      };
    }

    const mediaSourceId = String(source.Id);
    const container = String(source.Container || 'mp4').replace(/^\./, '');

    // 服务端若直接给了相对/绝对直链，优先用（补全 host + token）
    const direct = pickServerProvidedUrl(base, source.DirectStreamUrl || source.TranscodingUrl, token);
    if (direct) {
      return {
        success: true,
        streamUrl: direct,
        detailUrl,
        mediaSourceId,
        playSessionId,
        container,
        static: Boolean(source.SupportsDirectPlay || source.SupportsDirectStream),
      };
    }

    const streamUrl = buildStaticStreamUrl(base, itemId, token, mediaSourceId, playSessionId, container);
    return {
      success: true,
      streamUrl,
      detailUrl,
      mediaSourceId,
      playSessionId,
      container,
      static: true,
    };
  } catch (e: any) {
    return {
      success: false,
      detailUrl,
      message: e?.message || '解析播放地址失败',
    };
  }
}

function pickServerProvidedUrl(
  base: string,
  raw: string | undefined,
  token: string,
): string | undefined {
  const s = String(raw || '').trim();
  if (!s) return undefined;
  let url = s;
  if (s.startsWith('/')) url = `${base}${s}`;
  // 补 token
  if (!/[?&](api_key|ApiKey)=/i.test(url) && token) {
    url += (url.includes('?') ? '&' : '?') + `api_key=${encodeURIComponent(token)}`;
  }
  return url;
}

/**
 * 直出流（Static=true）：浏览器 <video> 最常见可用形态
 */
export function buildStaticStreamUrl(
  base: string,
  itemId: string,
  token: string,
  mediaSourceId?: string,
  playSessionId?: string,
  container?: string,
): string {
  const ext = container ? `.${container.replace(/^\./, '')}` : '';
  const params = new URLSearchParams();
  params.set('Static', 'true');
  if (mediaSourceId) params.set('MediaSourceId', mediaSourceId);
  if (playSessionId) params.set('PlaySessionId', playSessionId);
  params.set('api_key', token);
  return `${base}/Videos/${encodeURIComponent(itemId)}/stream${ext}?${params.toString()}`;
}
