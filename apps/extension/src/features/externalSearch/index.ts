/**
 * @file index.ts
 * @description 外部搜索引擎（配置管理、搜索跳转）统一导出
 * @module features/externalSearch
 */
export type {
  DetailSearchInsertionTarget,
  DetailSearchLink,
  RenderDetailSearchLinksOptions,
} from './domain/types';
export * from './domain/searchEngines';
export { buildDetailSearchLinks } from './application/buildDetailSearchLinks';
export { findDetailSearchInsertionTarget, renderDetailSearchLinks } from './ui/detailSearchPanel';
export { injectDetailSearchStyles } from './ui/detailSearchStyles';
