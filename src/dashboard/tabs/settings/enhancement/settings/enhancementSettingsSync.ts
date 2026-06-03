import { getDefaultTags } from '../../../../config/actorFilterTags';
import type { ExtensionSettings } from '../../../../../types';
import { applyOnlineAvailabilitySiteStates, collectOnlineAvailabilitySiteStates } from './onlineAvailabilitySites';

export type EnhancementSettingsSyncHost = any;

export function doGetSettings(host: EnhancementSettingsSyncHost): Partial<ExtensionSettings> {
  return {
    dataEnhancement: {
      enableTranslation: host.enableTranslation.checked,
    },
    translation: {
      provider: host.translationProviderSel?.value || 'traditional',
      traditional: { service: 'google', sourceLanguage: 'ja', targetLanguage: 'zh-CN' },
      ai: { useGlobalModel: true, customModel: '' },
    } as any,
    userExperience: {
      enableContentFilter: host.enableContentFilter.checked,
      enableMagnetSearch: host.enableMagnetSearch.checked,
      enableAnchorOptimization: host.enableAnchorOptimization.checked,
      enableListEnhancement: host.enableListEnhancement.checked,
      enableActorEnhancement: host.enableActorEnhancement.checked,
      enablePasswordHelper: host.enablePasswordHelper.checked,
      enableSuperRanking: host.enableSuperRanking?.checked !== false,
      enableKeyboardShortcuts: host.enableKeyboardShortcuts?.checked !== false,
    } as any,
    magnetSearch: {
      sources: {
        sukebei: host.magnetSourceSukebei?.checked !== false,
        btdig: host.magnetSourceBtdig?.checked !== false,
        btsow: host.magnetSourceBtsow?.checked !== false,
        torrentz2: host.magnetSourceTorrentz2?.checked === true,
        javbus: host.magnetSourceJavbus?.checked === true,
        custom: [],
      },
    } as any,
    videoEnhancement: {
      enableRelatedLists: host.veEnableRelatedLists?.checked !== false,
      enableExternalEntryPanel: host.veEnableExternalEntryPanel?.checked !== false,
      enableExternalSearch: host.veEnableExternalSearch?.checked !== false,
      enableOnlineAvailability: host.veEnableOnlineAvailability?.checked !== false,
      showOnlineAvailabilityFailures: host.veShowOnlineAvailabilityFailures?.checked === true,
      onlineAvailabilitySites: collectOnlineAvailabilitySiteStates(host.onlineAvailabilitySiteInputs) ?? {},
      enableSubtitleSearch: host.veEnableSubtitleSearch?.checked !== false,
    } as any,
    contentFilter: {
      keywordRules: host.currentFilterRules,
    } as any,
    actorEnhancement: {
      enabled: host.enableActorEnhancement.checked,
      autoApplyTags: host.enableAutoApplyTags?.checked !== false,
      defaultTags: host.actorDefaultTagInputs && host.actorDefaultTagInputs.length > 0
        ? Array.from(host.actorDefaultTagInputs as HTMLInputElement[]).filter((i: HTMLInputElement) => i.checked).map((i: HTMLInputElement) => i.value)
        : getDefaultTags(),
      defaultSortType: 0,
      enableActionButtons: host.aeEnableActionButtons?.checked !== false,
      enableTimeSegmentationDivider: host.aeEnableTimeSegmentationDivider?.checked === true,
      timeSegmentationMonths: parseInt(host.aeTimeSegmentationMonths?.value || '6', 10),
    },
  };
}

export function doSetSettings(host: EnhancementSettingsSyncHost, settings: Partial<ExtensionSettings>): void {
  try {
    if (settings.userExperience) {
      const ux = settings.userExperience as any;
      if (host.enableContentFilter && typeof ux.enableContentFilter === 'boolean') host.enableContentFilter.checked = ux.enableContentFilter;
      if (host.enableMagnetSearch && typeof ux.enableMagnetSearch === 'boolean') host.enableMagnetSearch.checked = ux.enableMagnetSearch;
      if (host.enableAnchorOptimization && typeof ux.enableAnchorOptimization === 'boolean') host.enableAnchorOptimization.checked = ux.enableAnchorOptimization;
      if (host.enableListEnhancement && typeof ux.enableListEnhancement === 'boolean') host.enableListEnhancement.checked = ux.enableListEnhancement;
      if (host.enableActorEnhancement && typeof ux.enableActorEnhancement === 'boolean') host.enableActorEnhancement.checked = ux.enableActorEnhancement;
      if (host.enablePasswordHelper && typeof ux.enablePasswordHelper === 'boolean') host.enablePasswordHelper.checked = ux.enablePasswordHelper;
      if (host.enableSuperRanking) host.enableSuperRanking.checked = ux.enableSuperRanking !== false;
    }

    if (settings.listEnhancement) {
      const le = settings.listEnhancement as any;
      if (host.enableClickEnhancement && typeof le.enableClickEnhancement === 'boolean') host.enableClickEnhancement.checked = le.enableClickEnhancement;
      if (host.enableClickEnhancementList && typeof le.enableClickEnhancementList === 'boolean') host.enableClickEnhancementList.checked = le.enableClickEnhancementList;
      if (host.enableClickEnhancementDetail && typeof le.enableClickEnhancementDetail === 'boolean') host.enableClickEnhancementDetail.checked = le.enableClickEnhancementDetail;
      if (host.enableListVideoPreview && typeof le.enableVideoPreview === 'boolean') host.enableListVideoPreview.checked = le.enableVideoPreview;
      if (host.enableVideoPreviewList && typeof le.enableVideoPreviewList === 'boolean') host.enableVideoPreviewList.checked = le.enableVideoPreviewList;
      if (host.enableVideoPreviewDetail && typeof le.enableVideoPreviewDetail === 'boolean') host.enableVideoPreviewDetail.checked = le.enableVideoPreviewDetail;
      if (host.enableScrollPaging && typeof le.enableScrollPaging === 'boolean') host.enableScrollPaging.checked = le.enableScrollPaging;
      if (host.previewDelay && typeof le.previewDelay === 'number') host.previewDelay.value = String(le.previewDelay);
      if (host.previewVolume && typeof le.previewVolume === 'number') host.previewVolume.value = String(le.previewVolume);
      if (host.enableActorWatermark && typeof le.enableActorWatermark === 'boolean') host.enableActorWatermark.checked = le.enableActorWatermark;
      if (host.actorWatermarkPosition && le.actorWatermarkPosition) host.actorWatermarkPosition.value = le.actorWatermarkPosition;
      if (host.actorWatermarkOpacity && typeof le.actorWatermarkOpacity === 'number') host.actorWatermarkOpacity.value = String(le.actorWatermarkOpacity);
      if (host.showStatusBadge && typeof le.showStatusBadge === 'boolean') host.showStatusBadge.checked = le.showStatusBadge;
      if (host.enableStatusQuickAction && typeof le.enableStatusQuickAction === 'boolean') host.enableStatusQuickAction.checked = le.enableStatusQuickAction;
      if (host.enablePopularityEffects && typeof le.popularityEffects?.enabled === 'boolean') host.enablePopularityEffects.checked = le.popularityEffects.enabled;
      if (host.popularityMinRating && typeof le.popularityEffects?.minRating === 'number') host.popularityMinRating.value = String(le.popularityEffects.minRating);
      if (host.popularityMinRatingCount && typeof le.popularityEffects?.minRatingCount === 'number') host.popularityMinRatingCount.value = String(le.popularityEffects.minRatingCount);
      if (le.listDisplayControl) {
        const ldc = le.listDisplayControl;
        if (host.listColumnCount && typeof ldc.columnCount === 'number') host.listColumnCount.value = String(ldc.columnCount);
        if (host.listContainerWidth && typeof ldc.containerWidth === 'number') host.listContainerWidth.value = String(ldc.containerWidth);
        if (host.enableContainerExpansion && typeof ldc.enableContainerExpansion === 'boolean') host.enableContainerExpansion.checked = ldc.enableContainerExpansion;
      }
    }

    if (settings.actorEnhancement) {
      const ae = settings.actorEnhancement as any;
      if (host.enableAutoApplyTags && typeof ae.autoApplyTags === 'boolean') host.enableAutoApplyTags.checked = ae.autoApplyTags;
      if (host.aeEnableActionButtons && typeof ae.enableActionButtons === 'boolean') host.aeEnableActionButtons.checked = ae.enableActionButtons;
      if (host.aeEnableTimeSegmentationDivider && typeof ae.enableTimeSegmentationDivider === 'boolean') host.aeEnableTimeSegmentationDivider.checked = ae.enableTimeSegmentationDivider;
      if (host.aeTimeSegmentationMonths && typeof ae.timeSegmentationMonths !== 'undefined') host.aeTimeSegmentationMonths.value = String(ae.timeSegmentationMonths ?? 6);
    }

    if (settings.videoEnhancement) {
      const ve = settings.videoEnhancement as any;
      if (host.veEnableCoverImage && typeof ve.enableCoverImage === 'boolean') host.veEnableCoverImage.checked = ve.enableCoverImage;
      if (host.veShowLoadingIndicator && typeof ve.showLoadingIndicator === 'boolean') host.veShowLoadingIndicator.checked = ve.showLoadingIndicator;
      if (host.veEnableReviewEnhancement && typeof ve.enableReviewEnhancement === 'boolean') host.veEnableReviewEnhancement.checked = ve.enableReviewEnhancement;
      if (host.veEnableReviewBreaker && typeof ve.enableReviewBreaker === 'boolean') host.veEnableReviewBreaker.checked = ve.enableReviewBreaker;
      if (host.veEnableFC2Breaker && typeof ve.enableFC2Breaker === 'boolean') host.veEnableFC2Breaker.checked = ve.enableFC2Breaker;
      if (host.veEnableReviewMagnetLinkify && typeof ve.enableReviewMagnetLinkify === 'boolean') host.veEnableReviewMagnetLinkify.checked = ve.enableReviewMagnetLinkify;
      if (host.veEnableReviewPush115 && typeof ve.enableReviewPush115 === 'boolean') host.veEnableReviewPush115.checked = ve.enableReviewPush115;
      if (host.veEnableWantSync && typeof ve.enableWantSync === 'boolean') host.veEnableWantSync.checked = ve.enableWantSync;
      if (host.veAutoMarkWatchedAfter115 && typeof ve.autoMarkWatchedAfter115 === 'boolean') host.veAutoMarkWatchedAfter115.checked = ve.autoMarkWatchedAfter115;
      if (host.veAutoMarkWatchedStars && typeof ve.autoMarkWatchedStars !== 'undefined') host.veAutoMarkWatchedStars.value = String(ve.autoMarkWatchedStars ?? 4);
      if (host.veEnableActorRemarks && typeof ve.enableActorRemarks === 'boolean') host.veEnableActorRemarks.checked = ve.enableActorRemarks;
      if (host.veEnableActorNameMarks && typeof ve.enableActorNameMarks === 'boolean') host.veEnableActorNameMarks.checked = ve.enableActorNameMarks;
      if (host.veEnableRelatedLists && typeof ve.enableRelatedLists === 'boolean') host.veEnableRelatedLists.checked = ve.enableRelatedLists;
      if (host.veEnableExternalEntryPanel && typeof ve.enableExternalEntryPanel === 'boolean') host.veEnableExternalEntryPanel.checked = ve.enableExternalEntryPanel;
      if (host.veEnableExternalSearch && typeof ve.enableExternalSearch === 'boolean') host.veEnableExternalSearch.checked = ve.enableExternalSearch;
      if (host.veEnableOnlineAvailability && typeof ve.enableOnlineAvailability === 'boolean') host.veEnableOnlineAvailability.checked = ve.enableOnlineAvailability;
      if (host.veShowOnlineAvailabilityFailures && typeof ve.showOnlineAvailabilityFailures === 'boolean') host.veShowOnlineAvailabilityFailures.checked = ve.showOnlineAvailabilityFailures;
      applyOnlineAvailabilitySiteStates(host.onlineAvailabilitySiteInputs, ve.onlineAvailabilitySites);
      if (host.veEnableSubtitleSearch && typeof ve.enableSubtitleSearch === 'boolean') host.veEnableSubtitleSearch.checked = ve.enableSubtitleSearch;
      if (host.veActorRemarksMode && typeof ve.actorRemarksMode === 'string') host.veActorRemarksMode.value = ve.actorRemarksMode === 'inline' ? 'inline' : 'panel';
      if (host.veActorRemarksTTL && typeof ve.actorRemarksTTLDays !== 'undefined') host.veActorRemarksTTL.value = String(ve.actorRemarksTTLDays ?? 0);
      if (host.veActorRemarksTaskTimeout && typeof ve.actorRemarksTaskTimeoutSeconds !== 'undefined') host.veActorRemarksTaskTimeout.value = String(ve.actorRemarksTaskTimeoutSeconds ?? 10);
    }

    host.updateAllToggleStates();
  } catch {}
}
