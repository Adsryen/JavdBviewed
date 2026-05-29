export type {
  MagnetSourceKey,
  MagnetSourceSearchState,
} from '../features/magnets/domain/types';
export type {
  MagnetSourceTagView,
} from '../features/magnets/application/sourceTagState';
export {
  buildMagnetSourceTagView,
  countUniqueResultsBySource,
  getMagnetSourceLabel,
} from '../features/magnets/application/sourceTagState';
