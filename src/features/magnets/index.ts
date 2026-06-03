export type {
  MagnetExternalSearchResult,
  MagnetResult,
  MagnetSearchConfig,
  MagnetSourceKey,
  MagnetSourceRunState,
  MagnetSourceSearchState,
} from './domain/types';
export {
  appendMagnetResults,
  extractMagnetHash,
  getResultSources,
} from './application/resultMerge';
export {
  buildMagnetPaginationState,
  MAGNET_PAGINATION_PAGE_SIZE,
  MAGNET_PAGINATION_THRESHOLD,
  type MagnetPaginationState,
} from './application/pagination';
export {
  buildMagnetSourceTagView,
  countUniqueResultsBySource,
  getMagnetSourceLabel,
  type MagnetSourceTagView,
} from './application/sourceTagState';
export {
  MAGNET_SOURCE_BACKOFF_MS,
  clearMagnetSourceBackoff,
  describeMagnetSourceBackoff,
  getMagnetSourceBackoff,
  recordMagnetSourceFailure,
  recordMagnetSourceSuccess,
  shouldSkipMagnetSource,
  type MagnetSourceBackoffEntry,
  type MagnetSourceBackoffState,
} from './application/sourceBackoff';
export {
  deduplicateMagnetResults,
  detectMagnetQuality,
  detectMagnetSubtitle,
  extractHashFromMagnet,
  getVideoIdMatchCandidates,
  isCrackedVersion,
  isValidMagnetResultName,
  normalizeMagnetDate,
  parseRelativeMagnetDate,
  parseSizeToBytes,
  sortMagnetResults,
} from './application/resultMetadata';
export {
  buildJavbusAjaxUrl,
  extractJavbusAjaxParams,
  getJavbusResponseDiagnostics,
  parseJavbusFallbackMagnets,
  parseJavbusMagnetRows,
  type JavbusAjaxParams,
  type JavbusResponseDiagnostics,
} from './adapters/javbus/source';
export {
  MagnetSearchManager,
  magnetSearchManager,
} from './ui/magnetSearchManager';
