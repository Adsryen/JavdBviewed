export type {
  DetailSearchInsertionTarget,
  DetailSearchLink,
  RenderDetailSearchLinksOptions,
} from './domain/types';
export { buildDetailSearchLinks } from './application/buildDetailSearchLinks';
export { findDetailSearchInsertionTarget, renderDetailSearchLinks } from './ui/detailSearchPanel';
export { injectDetailSearchStyles } from './ui/detailSearchStyles';
