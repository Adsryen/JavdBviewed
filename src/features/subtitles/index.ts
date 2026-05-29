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
