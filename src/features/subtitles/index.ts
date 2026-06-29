/**
 * @file index.ts
 * @description 字幕搜索统一导出
 * @module features/subtitles
 */
export type { SubtitleSearchLink, XunleiSubtitleItem, XunleiSubtitleResponse } from './domain/types';
export {
  formatXunleiSubtitleDuration,
  normalizeXunleiSubtitleHash,
  normalizeXunleiSubtitleItems,
  normalizeXunleiSubtitleLanguage,
  normalizeXunleiSubtitleRate,
  normalizeXunleiSubtitleSource,
} from './domain/normalizeXunleiSubtitle';
export { fetchXunleiSubtitleResponse } from './adapters/xunleiSubtitleApi';
export { injectXunleiSubtitleStyles, isXunleiSubtitleLink, openXunleiSubtitleModal } from './ui/xunleiSubtitleModal';
