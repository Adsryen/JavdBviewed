/**
 * @file parseEntryMeta.ts
 * @description 番号解析与最小 NFO 文本摘要
 * @module features/drive115/mediaLibrary
 */
import { normalizeVideoCodeCandidate } from '../../../shared/utils/videoCodeExtractor';

export type ParsedNfoSummary = {
  title?: string;
  plot?: string;
  year?: string;
};

/**
 * 从单个名称提取规范化番号
 */
export function parseCodeFromName(name: string): string {
  const text = String(name || '').trim();
  if (!text) return '';
  // 去掉扩展名再解析
  const withoutExt = text.replace(/\.[a-z0-9]{1,5}$/i, '');
  return normalizeVideoCodeCandidate(withoutExt) || normalizeVideoCodeCandidate(text) || '';
}

/**
 * 按优先级解析番号：文件夹名 → 主视频文件名 → nfo 文件名
 */
export function resolveEntryCode(params: {
  folderName?: string;
  videoFileName?: string;
  nfoFileName?: string;
}): { code: string; source: 'folder' | 'video' | 'nfo' | 'none' } {
  const folderCode = parseCodeFromName(params.folderName || '');
  if (folderCode) return { code: folderCode, source: 'folder' };
  const videoCode = parseCodeFromName(params.videoFileName || '');
  if (videoCode) return { code: videoCode, source: 'video' };
  const nfoCode = parseCodeFromName(params.nfoFileName || '');
  if (nfoCode) return { code: nfoCode, source: 'nfo' };
  return { code: '', source: 'none' };
}

/**
 * 最小 NFO 解析（Kodi/Emby 风格 XML 文本；无内容时返回空）
 * MVP 索引不下载 NFO 正文，此函数供未来扩展与单测使用。
 */
export function parseNfoSummary(text: string | null | undefined): ParsedNfoSummary | undefined {
  const raw = String(text || '').trim();
  if (!raw) return undefined;

  const pickTag = (tag: string): string | undefined => {
    const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
    const m = raw.match(re);
    if (!m?.[1]) return undefined;
    const value = m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim();
    return value || undefined;
  };

  const title = pickTag('title') || pickTag('originaltitle');
  const plot = pickTag('plot') || pickTag('outline') || pickTag('description');
  const year = pickTag('year') || pickTag('premiered')?.slice(0, 4);

  if (!title && !plot && !year) return undefined;
  return { title, plot, year };
}

/**
 * 展示标题：优先番号，否则文件夹名/文件名
 */
export function resolveEntryTitle(params: {
  code?: string;
  folderName?: string;
  videoFileName?: string;
  nfoTitle?: string;
}): string {
  const nfoTitle = String(params.nfoTitle || '').trim();
  if (nfoTitle) return nfoTitle;
  const code = String(params.code || '').trim();
  if (code) return code;
  const folder = String(params.folderName || '').trim();
  if (folder) return folder;
  const video = String(params.videoFileName || '').trim();
  return video || '未命名';
}
