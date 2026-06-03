import type { PreviewSourceName } from '../../previews';

export interface ListDisplayControlConfig {
  enabled: boolean;
  columnCount: number;
  containerWidth: number;
  enableContainerExpansion: boolean;
}

export interface PopularityEffectsConfig {
  enabled: boolean;
  minRating: number;
  minRatingCount: number;
}

export interface ListEnhancementConfig {
  enabled: boolean;
  enableClickEnhancement: boolean;
  enableClickEnhancementList?: boolean;
  enableClickEnhancementDetail?: boolean;
  enableVideoPreview: boolean;
  enableVideoPreviewList?: boolean;
  enableVideoPreviewDetail?: boolean;
  enableListOptimization: boolean;
  enableScrollPaging: boolean;
  enableHighQualityCover: boolean;
  previewDelay: number;
  previewVolume: number;
  enableRightClickBackground: boolean;
  preferredPreviewSource?: 'auto' | 'javdb' | 'javspyl' | 'avpreview' | 'vbgfl';
  enableActorWatermark?: boolean;
  actorWatermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  actorWatermarkOpacity?: number;
  hideBlacklistedActorsInList?: boolean;
  hideNonFavoritedActorsInList?: boolean;
  hideUnrecognizedActorsInList?: boolean;
  treatSubscribedAsFavorited?: boolean;
  listDisplayControl?: ListDisplayControlConfig;
  showStatusBadge?: boolean;
  enableStatusQuickAction?: boolean;
  popularityEffects?: PopularityEffectsConfig;
}

export interface VideoPreviewSource {
  url: string;
  type: string;
  source?: PreviewSourceName;
}

export interface VideoPreviewOptions {
  cacheKey: string;
  code: string;
  onCacheError?: () => void;
}

export function createDefaultListEnhancementConfig(): ListEnhancementConfig {
  return {
    enabled: false,
    enableClickEnhancement: true,
    enableClickEnhancementList: true,
    enableClickEnhancementDetail: true,
    enableVideoPreview: true,
    enableVideoPreviewList: true,
    enableVideoPreviewDetail: true,
    enableListOptimization: true,
    enableScrollPaging: false,
    enableHighQualityCover: true,
    previewDelay: 1000,
    previewVolume: 0.2,
    enableRightClickBackground: true,
    enableActorWatermark: false,
    actorWatermarkPosition: 'top-right',
    actorWatermarkOpacity: 0.8,
    hideBlacklistedActorsInList: false,
    hideNonFavoritedActorsInList: false,
    hideUnrecognizedActorsInList: true,
    treatSubscribedAsFavorited: true,
    listDisplayControl: {
      enabled: true,
      columnCount: 4,
      containerWidth: 100,
      enableContainerExpansion: false,
    },
    showStatusBadge: true,
    enableStatusQuickAction: false,
    popularityEffects: {
      enabled: false,
      minRating: 4,
      minRatingCount: 350,
    },
  };
}
