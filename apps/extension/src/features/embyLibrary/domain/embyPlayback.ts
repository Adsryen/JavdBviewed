/**
 * @file embyPlayback.ts
 * @description 使用已保存的用户 AccessToken / ApiKey 解析 Emby/JF 可播地址（直链 / HLS / 字幕 / 清晰度）
 * @module features/embyLibrary
 *
 * 依据本仓 reference/emby-api-4.9.5.0：
 * - GET /Items/{Id}/PlaybackInfo → MediaSources + PlaySessionId + MediaStreams
 * - GET /Videos/{Id}/stream → 视频流（Static 直出）
 * - GET /Videos/{Id}/{MediaSourceId}/Subtitles/{Index}/Stream.vtt → 外挂/可转封装字幕
 * - TranscodingUrl 多为 m3u8，需 hls.js
 */
import type { EmbyMediaServer } from '../types';
import { buildEmbyAuthHeaders } from './embyUserAuth';
import { normalizeServerUrl } from './libraryIndex';

export type EmbyStreamType = 'mp4' | 'm3u8' | 'auto';

export type EmbySubtitleTrack = {
  index: number;
  label: string;
  language?: string;
  url: string;
  /** ArtPlayer 字幕类型；统一走服务器转 vtt */
  type: 'vtt' | 'srt';
  default?: boolean;
};

export type EmbyQualityOption = {
  html: string;
  url: string;
  streamType: EmbyStreamType;
  mediaSourceId?: string;
  default?: boolean;
};

export type EmbyResolvedStream = {
  success: boolean;
  streamUrl?: string;
  /** 供播放器选择 native / hls.js */
  streamType?: EmbyStreamType;
  /** 官方网页详情（需浏览器已登录才方便继续操作） */
  detailUrl?: string;
  mediaSourceId?: string;
  playSessionId?: string;
  container?: string;
  /** 是否直出（Static / DirectStream） */
  static?: boolean;
  message?: string;
  /** 可切换字幕（服务器转 vtt） */
  subtitles?: EmbySubtitleTrack[];
  /** 清晰度 / 源切换（直链 / 转码 / 多 MediaSource） */
  qualities?: EmbyQualityOption[];
};

type PlaybackMediaStream = {
  Type?: string;
  Index?: number;
  Language?: string;
  DisplayTitle?: string;
  Title?: string;
  Codec?: string;
  IsDefault?: boolean;
  IsForced?: boolean;
  IsExternal?: boolean;
  IsTextSubtitleStream?: boolean;
  DeliveryUrl?: string;
  Path?: string;
};

type PlaybackMediaSource = {
  Id?: string;
  Name?: string;
  Path?: string;
  Container?: string;
  Bitrate?: number;
  Width?: number;
  Height?: number;
  SupportsDirectPlay?: boolean;
  SupportsDirectStream?: boolean;
  SupportsTranscoding?: boolean;
  DirectStreamUrl?: string;
  TranscodingUrl?: string;
  TranscodingSubProtocol?: string;
  TranscodingContainer?: string;
  MediaStreams?: PlaybackMediaStream[];
};

/**
 * 根据 URL / 容器推断流类型
 */
export function detectEmbyStreamType(
  streamUrl: string,
  hints?: { container?: string; transcodingSubProtocol?: string },
): EmbyStreamType {
  const url = String(streamUrl || '').toLowerCase();
  const container = String(hints?.container || '').toLowerCase().replace(/^\./, '');
  const sub = String(hints?.transcodingSubProtocol || '').toLowerCase();
  if (
    sub.includes('hls')
    || container === 'm3u8'
    || container === 'hls'
    || url.includes('.m3u8')
    || url.includes('master.m3u8')
    || url.includes('playlist.m3u8')
    || /[?&](container|transcodingprotocol)=hls\b/i.test(streamUrl)
  ) {
    return 'm3u8';
  }
  if (container === 'mp4' || container === 'webm' || url.includes('.mp4') || url.includes('Static=true')) {
    return 'mp4';
  }
  return 'auto';
}

/**
 * 拼字幕流 URL（请求 vtt，浏览器 / ArtPlayer 最稳）
 * GET /Videos/{Id}/{MediaSourceId}/Subtitles/{Index}/Stream.vtt
 */
export function buildEmbySubtitleStreamUrl(params: {
  base: string;
  itemId: string;
  mediaSourceId: string;
  index: number;
  token: string;
  format?: 'vtt' | 'srt';
}): string {
  const base = normalizeServerUrl(params.base);
  const format = params.format || 'vtt';
  const q = new URLSearchParams();
  if (params.token) q.set('api_key', params.token);
  return `${base}/Videos/${encodeURIComponent(params.itemId)}/${encodeURIComponent(params.mediaSourceId)}/Subtitles/${encodeURIComponent(String(params.index))}/Stream.${format}?${q.toString()}`;
}

/**
 * 从 MediaSource.MediaStreams 提取文本字幕轨
 */
export function extractSubtitleTracks(params: {
  base: string;
  itemId: string;
  mediaSourceId: string;
  token: string;
  streams?: PlaybackMediaStream[];
}): EmbySubtitleTrack[] {
  const streams = Array.isArray(params.streams) ? params.streams : [];
  const subs = streams.filter((s) => {
    const type = String(s.Type || '').toLowerCase();
    if (type !== 'subtitle') return false;
    // 优先文本字幕；外挂也接受
    if (s.IsTextSubtitleStream === false && !s.IsExternal) return false;
    return Number.isFinite(Number(s.Index));
  });

  return subs.map((s, i) => {
    const index = Number(s.Index);
    const language = String(s.Language || '').trim() || undefined;
    const display = String(s.DisplayTitle || s.Title || '').trim();
    const codec = String(s.Codec || '').toLowerCase();
    const labelParts = [
      display || (language ? language.toUpperCase() : `字幕 ${index}`),
      s.IsForced ? 'Forced' : '',
      s.IsExternal ? '外挂' : '',
      codec && !display.toLowerCase().includes(codec) ? codec : '',
    ].filter(Boolean);
    const label = labelParts.join(' · ') || `字幕 ${i + 1}`;

    // DeliveryUrl 若已是可访问地址则优先（补 token）
    let url = '';
    const delivery = String(s.DeliveryUrl || '').trim();
    if (delivery) {
      url = delivery.startsWith('/')
        ? `${params.base}${delivery}`
        : delivery;
      if (!/[?&](api_key|ApiKey)=/i.test(url) && params.token) {
        url += (url.includes('?') ? '&' : '?') + `api_key=${encodeURIComponent(params.token)}`;
      }
    } else {
      url = buildEmbySubtitleStreamUrl({
        base: params.base,
        itemId: params.itemId,
        mediaSourceId: params.mediaSourceId,
        index,
        token: params.token,
        format: 'vtt',
      });
    }

    return {
      index,
      label,
      language,
      url,
      type: 'vtt' as const,
      default: Boolean(s.IsDefault) || i === 0,
    };
  });
}

function formatBitrate(bps?: number): string {
  if (!bps || !Number.isFinite(bps) || bps <= 0) return '';
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(1)}Mbps`;
  if (bps >= 1_000) return `${Math.round(bps / 1_000)}kbps`;
  return `${bps}bps`;
}

function qualityLabel(source: PlaybackMediaSource, kind: 'direct' | 'transcode' | 'source'): string {
  const h = source.Height || 0;
  const res = h >= 2000 ? '4K' : h >= 1000 ? '1080P' : h >= 700 ? '720P' : h >= 400 ? '480P' : '';
  const br = formatBitrate(source.Bitrate);
  const name = String(source.Name || '').trim();
  if (kind === 'direct') {
    return ['原画', res, br, name].filter(Boolean).join(' · ') || '原画直链';
  }
  if (kind === 'transcode') {
    return ['转码', res || '自适应', 'HLS', br].filter(Boolean).join(' · ') || '转码 HLS';
  }
  return [name || '媒体源', res, br].filter(Boolean).join(' · ') || '媒体源';
}

/**
 * 从 MediaSources 构建清晰度列表（直链 / 转码 / 多源）
 */
export function buildQualityOptions(params: {
  base: string;
  itemId: string;
  token: string;
  playSessionId?: string;
  sources: PlaybackMediaSource[];
}): EmbyQualityOption[] {
  const { base, itemId, token, playSessionId, sources } = params;
  const out: EmbyQualityOption[] = [];
  const seen = new Set<string>();

  const push = (opt: EmbyQualityOption) => {
    const key = `${opt.url}|${opt.html}`;
    if (!opt.url || seen.has(key)) return;
    seen.add(key);
    out.push(opt);
  };

  sources.forEach((source, idx) => {
    const mediaSourceId = String(source.Id || '').trim() || undefined;
    const container = String(source.Container || source.TranscodingContainer || 'mp4').replace(/^\./, '');

    // 仅在有 DirectStreamUrl，或明确支持直链时，才提供直链档
    const providedDirect = pickServerProvidedUrl(base, source.DirectStreamUrl, token);
    const canAssumeStatic = Boolean(
      source.SupportsDirectPlay || source.SupportsDirectStream,
    ) && !source.TranscodingUrl;
    const direct = providedDirect
      || (canAssumeStatic && mediaSourceId
        ? buildStaticStreamUrl(base, itemId, token, mediaSourceId, playSessionId, container)
        : undefined);
    if (direct) {
      push({
        html: qualityLabel(source, sources.length > 1 ? 'source' : 'direct'),
        url: direct,
        streamType: detectEmbyStreamType(direct, { container }),
        mediaSourceId,
        default: false,
      });
    }

    const transcode = pickServerProvidedUrl(base, source.TranscodingUrl, token);
    if (transcode) {
      push({
        html: qualityLabel(source, 'transcode'),
        url: transcode,
        streamType: detectEmbyStreamType(transcode, {
          container: source.TranscodingContainer || container,
          transcodingSubProtocol: source.TranscodingSubProtocol,
        }),
        mediaSourceId,
        default: false,
      });
    }

    // 多源且既无 direct 也无 transcode：仍给一条 static 兜底
    if (!direct && !transcode && mediaSourceId) {
      const fallback = buildStaticStreamUrl(base, itemId, token, mediaSourceId, playSessionId, container);
      push({
        html: qualityLabel(source, 'source'),
        url: fallback,
        streamType: detectEmbyStreamType(fallback, { container }),
        mediaSourceId,
        default: false,
      });
    }

    // 标记默认：优先第一条源的 direct，否则 transcode，否则第一条
    if (idx === 0) {
      const preferred = out.find((q) => q.url === direct)
        || out.find((q) => q.url === transcode)
        || out[0];
      if (preferred) preferred.default = true;
    }
  });

  if (out.length && !out.some((q) => q.default)) {
    out[0].default = true;
  }
  return out;
}

/**
 * 解析可在扩展播放器中播放的流地址 + 字幕 + 清晰度。
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
    const infoParams = new URLSearchParams();
    if (userId) infoParams.set('UserId', userId);
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
      const fallback = buildStaticStreamUrl(base, itemId, token, undefined, undefined);
      return {
        success: true,
        streamUrl: fallback,
        streamType: 'mp4',
        detailUrl,
        static: true,
        qualities: [{ html: '原画直链', url: fallback, streamType: 'mp4', default: true }],
        message: `PlaybackInfo 失败 (${infoRes.status})，已尝试直链`,
      };
    }

    const info = await infoRes.json().catch(() => ({} as any));
    const sources: PlaybackMediaSource[] = Array.isArray(info?.MediaSources) ? info.MediaSources : [];
    const playSessionId = String(info?.PlaySessionId || '').trim() || undefined;

    if (!sources.length || !sources[0]?.Id) {
      const fallback = buildStaticStreamUrl(base, itemId, token, undefined, playSessionId);
      return {
        success: true,
        streamUrl: fallback,
        streamType: 'mp4',
        detailUrl,
        playSessionId,
        static: true,
        qualities: [{ html: '原画直链', url: fallback, streamType: 'mp4', default: true }],
        message: '无 MediaSources，已尝试直链',
      };
    }

    const qualities = buildQualityOptions({
      base,
      itemId,
      token,
      playSessionId,
      sources,
    });
    const defaultQuality = qualities.find((q) => q.default) || qualities[0];
    const primary = sources[0];
    const mediaSourceId = String(defaultQuality?.mediaSourceId || primary.Id || '');
    const container = String(primary.Container || primary.TranscodingContainer || 'mp4').replace(/^\./, '');

    const streamUrl = defaultQuality?.url
      || pickServerProvidedUrl(base, primary.DirectStreamUrl, token)
      || pickServerProvidedUrl(base, primary.TranscodingUrl, token)
      || buildStaticStreamUrl(base, itemId, token, mediaSourceId, playSessionId, container);

    const streamType = defaultQuality?.streamType
      || detectEmbyStreamType(streamUrl, {
        container,
        transcodingSubProtocol: primary.TranscodingSubProtocol,
      });

    // 字幕：优先默认质量对应 MediaSource 的流，否则合并所有源的字幕（按 index 去重）
    const subMap = new Map<number, EmbySubtitleTrack>();
    for (const source of sources) {
      const msId = String(source.Id || mediaSourceId);
      const tracks = extractSubtitleTracks({
        base,
        itemId,
        mediaSourceId: msId,
        token,
        streams: source.MediaStreams,
      });
      for (const t of tracks) {
        if (!subMap.has(t.index)) subMap.set(t.index, t);
      }
    }
    const subtitles = Array.from(subMap.values());
    if (subtitles.length && !subtitles.some((s) => s.default)) {
      subtitles[0].default = true;
    }

    return {
      success: true,
      streamUrl,
      streamType,
      detailUrl,
      mediaSourceId: mediaSourceId || undefined,
      playSessionId,
      container,
      static: streamType !== 'm3u8' && Boolean(primary.SupportsDirectPlay || primary.SupportsDirectStream || !primary.TranscodingUrl),
      subtitles: subtitles.length ? subtitles : undefined,
      qualities: qualities.length ? qualities : undefined,
      message: streamType === 'm3u8' ? '使用服务器转码流' : undefined,
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
