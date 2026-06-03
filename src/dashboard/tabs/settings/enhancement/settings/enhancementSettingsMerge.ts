import type { ExtensionSettings } from '../../../../../types';
import { collectOnlineAvailabilitySiteStates } from './onlineAvailabilitySites';

type EnhancementSaveHost = {
  enableSuperRanking?: HTMLInputElement;
  enableListEnhancement?: HTMLInputElement;
  enableClickEnhancement?: HTMLInputElement;
  enableClickEnhancementList?: HTMLInputElement;
  enableClickEnhancementDetail?: HTMLInputElement;
  enableListVideoPreview?: HTMLInputElement;
  enableVideoPreviewList?: HTMLInputElement;
  enableVideoPreviewDetail?: HTMLInputElement;
  enableScrollPaging?: HTMLInputElement;
  previewDelay?: HTMLInputElement;
  previewVolume?: HTMLInputElement;
  enableActorWatermark?: HTMLInputElement;
  actorWatermarkPosition?: HTMLSelectElement;
  actorWatermarkOpacity?: HTMLInputElement;
  listColumnCount?: HTMLInputElement;
  listContainerWidth?: HTMLInputElement;
  enableContainerExpansion?: HTMLInputElement;
  showStatusBadge?: HTMLInputElement;
  enableStatusQuickAction?: HTMLInputElement;
  enablePopularityEffects?: HTMLInputElement;
  popularityMinRating?: HTMLInputElement;
  popularityMinRatingCount?: HTMLInputElement;
  veEnableRelatedLists?: HTMLInputElement;
  veEnableExternalEntryPanel?: HTMLInputElement;
  veEnableExternalSearch?: HTMLInputElement;
  veEnableOnlineAvailability?: HTMLInputElement;
  veShowOnlineAvailabilityFailures?: HTMLInputElement;
  veEnableSubtitleSearch?: HTMLInputElement;
  onlineAvailabilitySiteInputs?: ArrayLike<HTMLInputElement>;
  getPreferredPreviewSource?: () => 'auto' | 'javdb' | 'javspyl' | 'avpreview' | 'vbgfl';
};

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function mergeEnhancementSettingsForSave(
  current: ExtensionSettings,
  host: EnhancementSaveHost
): ExtensionSettings {
  const existingListEnhancement = current.listEnhancement || {};
  const existingListDisplayControl = (existingListEnhancement as any).listDisplayControl || {};
  const existingPopularityEffects = (existingListEnhancement as any).popularityEffects || {};
  const existingVideoEnhancement = (current as any).videoEnhancement || {};
  const existingUserExperience = (current as any).userExperience || {};
  const onlineAvailabilitySites = collectOnlineAvailabilitySiteStates(host.onlineAvailabilitySiteInputs);

  return {
    ...current,
    userExperience: {
      ...existingUserExperience,
      enableSuperRanking: host.enableSuperRanking?.checked ?? existingUserExperience.enableSuperRanking ?? true,
    },
    videoEnhancement: {
      ...existingVideoEnhancement,
      enableRelatedLists: host.veEnableRelatedLists?.checked ?? existingVideoEnhancement.enableRelatedLists ?? true,
      enableExternalEntryPanel: host.veEnableExternalEntryPanel?.checked ?? existingVideoEnhancement.enableExternalEntryPanel ?? true,
      enableExternalSearch: host.veEnableExternalSearch?.checked ?? existingVideoEnhancement.enableExternalSearch ?? true,
      enableOnlineAvailability: host.veEnableOnlineAvailability?.checked ?? existingVideoEnhancement.enableOnlineAvailability ?? true,
      showOnlineAvailabilityFailures: host.veShowOnlineAvailabilityFailures?.checked ?? existingVideoEnhancement.showOnlineAvailabilityFailures ?? false,
      onlineAvailabilitySites: onlineAvailabilitySites ?? existingVideoEnhancement.onlineAvailabilitySites ?? {},
      enableSubtitleSearch: host.veEnableSubtitleSearch?.checked ?? existingVideoEnhancement.enableSubtitleSearch ?? true,
    },
    listEnhancement: {
      ...existingListEnhancement,
      enabled: host.enableListEnhancement?.checked ?? existingListEnhancement.enabled,
      enableClickEnhancement: host.enableClickEnhancement?.checked ?? existingListEnhancement.enableClickEnhancement,
      enableClickEnhancementList: host.enableClickEnhancementList?.checked ?? (existingListEnhancement as any).enableClickEnhancementList,
      enableClickEnhancementDetail: host.enableClickEnhancementDetail?.checked ?? (existingListEnhancement as any).enableClickEnhancementDetail,
      enableVideoPreview: host.enableListVideoPreview?.checked ?? existingListEnhancement.enableVideoPreview,
      enableVideoPreviewList: host.enableVideoPreviewList?.checked ?? (existingListEnhancement as any).enableVideoPreviewList,
      enableVideoPreviewDetail: host.enableVideoPreviewDetail?.checked ?? (existingListEnhancement as any).enableVideoPreviewDetail,
      enableScrollPaging: host.enableScrollPaging?.checked ?? existingListEnhancement.enableScrollPaging,
      enableListOptimization: true,
      previewDelay: parseNumber(host.previewDelay?.value, existingListEnhancement.previewDelay ?? 1000),
      previewVolume: parseNumber(host.previewVolume?.value, existingListEnhancement.previewVolume ?? 0.2),
      enableRightClickBackground: true,
      preferredPreviewSource: host.getPreferredPreviewSource?.() ?? (existingListEnhancement as any).preferredPreviewSource ?? 'auto',
      enableActorWatermark: host.enableActorWatermark?.checked ?? (existingListEnhancement as any).enableActorWatermark,
      actorWatermarkPosition: host.actorWatermarkPosition?.value || (existingListEnhancement as any).actorWatermarkPosition || 'top-right',
      actorWatermarkOpacity: parseNumber(host.actorWatermarkOpacity?.value, (existingListEnhancement as any).actorWatermarkOpacity ?? 0.8),
      listDisplayControl: {
        ...existingListDisplayControl,
        enabled: true,
        columnCount: parseNumber(host.listColumnCount?.value, existingListDisplayControl.columnCount ?? 4),
        containerWidth: parseNumber(host.listContainerWidth?.value, existingListDisplayControl.containerWidth ?? 100),
        enableContainerExpansion: host.enableContainerExpansion?.checked ?? existingListDisplayControl.enableContainerExpansion ?? false,
      },
      showStatusBadge: host.showStatusBadge?.checked ?? (existingListEnhancement as any).showStatusBadge ?? true,
      enableStatusQuickAction: host.enableStatusQuickAction?.checked ?? (existingListEnhancement as any).enableStatusQuickAction ?? false,
      popularityEffects: {
        ...existingPopularityEffects,
        enabled: host.enablePopularityEffects?.checked ?? existingPopularityEffects.enabled ?? false,
        minRating: Math.max(0, Math.min(5, parseNumber(host.popularityMinRating?.value, existingPopularityEffects.minRating ?? 4))),
        minRatingCount: Math.max(0, Math.round(parseNumber(host.popularityMinRatingCount?.value, existingPopularityEffects.minRatingCount ?? 350))),
      },
    },
  };
}
