/**
 * @file drive115PlaybackModel.ts
 * @description 115 扩展内播放：搜索命中 → 播放意图模型（取流 API 后续接）
 * @module features/drive115
 */
import type { Drive115V2SearchItem } from './index';

/** 媒体库侧发起的 115 播放请求 */
export type Drive115PlayRequest = {
  /** 番号或标题关键字 */
  query: string;
  /** 可选：已缓存的 pick_code / file_id */
  pickCode?: string;
  fileId?: string;
};

/** 一次搜索命中的可播候选 */
export type Drive115PlayCandidate = {
  fileId: string;
  fileName: string;
  fileSize: number;
  pickCode: string;
  parentId: string;
  sha1: string;
};

/** 播放会话意图（尚无直链时也可展示候选项） */
export type Drive115PlaySessionIntent = {
  query: string;
  candidates: Drive115PlayCandidate[];
  /** 后续由取流 API 填充 */
  streamUrl?: string;
  status: 'need_search' | 'candidates' | 'ready' | 'error';
  message?: string;
};

/**
 * 将 v2 搜索结果映射为播放候选
 */
export function mapSearchItemsToPlayCandidates(
  items: Drive115V2SearchItem[] | null | undefined,
): Drive115PlayCandidate[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      fileId: String(item.file_id || '').trim(),
      fileName: String(item.file_name || '').trim(),
      fileSize: Number(item.file_size) || 0,
      pickCode: String(item.pick_code || '').trim(),
      parentId: String(item.parent_id || '').trim(),
      sha1: String(item.sha1 || '').trim(),
    }))
    .filter((c) => c.fileId && c.pickCode);
}

/**
 * 从候选中挑默认项：优先视频后缀，其次体积最大
 */
export function pickDefaultPlayCandidate(
  candidates: Drive115PlayCandidate[],
): Drive115PlayCandidate | null {
  if (!candidates.length) return null;
  const videoExt = /\.(mp4|mkv|avi|ts|m2ts|wmv|mov|flv|webm)$/i;
  const videos = candidates.filter((c) => videoExt.test(c.fileName));
  const pool = videos.length ? videos : candidates;
  return [...pool].sort((a, b) => b.fileSize - a.fileSize)[0] || null;
}

/**
 * 由搜索结果构建播放意图
 */
export function buildPlaySessionFromSearch(
  query: string,
  items: Drive115V2SearchItem[] | null | undefined,
): Drive115PlaySessionIntent {
  const candidates = mapSearchItemsToPlayCandidates(items);
  if (!candidates.length) {
    return {
      query,
      candidates: [],
      status: 'error',
      message: '未在 115 找到可匹配文件',
    };
  }
  return {
    query,
    candidates,
    status: 'candidates',
    message: `找到 ${candidates.length} 个候选文件（取流接口后续接入）`,
  };
}
