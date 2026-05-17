import { STATE } from '../../../../state';
import { getDefaultTags } from '../../../../config/actorFilterTags';

export type EnhancementLoadHost = any;

export async function doLoadSettings(host: EnhancementLoadHost): Promise<void> {
  const settings = STATE.settings;
  const dataEnhancement = settings?.dataEnhancement || {};
  const userExperience = settings?.userExperience || {};
  const anchorOptimization = settings?.anchorOptimization || {};
  const listEnhancement = settings?.listEnhancement || {};

  host.enableTranslation.checked = dataEnhancement?.enableTranslation || false;
  host.enableContentFilter.checked = userExperience?.enableContentFilter || false;
  host.enableMagnetSearch.checked = userExperience?.enableMagnetSearch || false;
  host.enableAnchorOptimization.checked = userExperience?.enableAnchorOptimization || false;
  if (userExperience.enableListEnhancement !== undefined) host.enableListEnhancement.checked = userExperience.enableListEnhancement;
  if (userExperience.enableActorEnhancement !== undefined) host.enableActorEnhancement.checked = userExperience.enableActorEnhancement;
  if (userExperience.enablePasswordHelper !== undefined) host.enablePasswordHelper.checked = userExperience.enablePasswordHelper;

  const passwordHelper = (settings as any).passwordHelper || { showMethod: 0, waitTime: 300 };
  if (host.passwordShowMethod) host.passwordShowMethod.value = String(passwordHelper.showMethod || 0);
  if (host.passwordWaitTime) host.passwordWaitTime.value = String(passwordHelper.waitTime || 300);

  const magnetSearch = (settings as any).magnetSearch || {};
  const msSources = magnetSearch.sources || {};
  host.magnetSourceSukebei.checked = msSources.sukebei !== false;
  host.magnetSourceBtdig.checked = msSources.btdig !== false;
  host.magnetSourceBtsow.checked = msSources.btsow !== false;
  host.magnetSourceTorrentz2.checked = !!msSources.torrentz2;

  const cc = (magnetSearch.concurrency || {}) as any;
  if (host.magnetPageMaxConcurrentRequests) host.magnetPageMaxConcurrentRequests.value = String(typeof cc.pageMaxConcurrentRequests === 'number' ? cc.pageMaxConcurrentRequests : 2);
  if (host.magnetBgGlobalMaxConcurrent) host.magnetBgGlobalMaxConcurrent.value = String(typeof cc.bgGlobalMaxConcurrent === 'number' ? cc.bgGlobalMaxConcurrent : 4);
  if (host.magnetBgPerHostMaxConcurrent) host.magnetBgPerHostMaxConcurrent.value = String(typeof cc.bgPerHostMaxConcurrent === 'number' ? cc.bgPerHostMaxConcurrent : 1);
  if (host.magnetBgPerHostRateLimitPerMin) host.magnetBgPerHostRateLimitPerMin.value = String(typeof cc.bgPerHostRateLimitPerMin === 'number' ? cc.bgPerHostRateLimitPerMin : 12);

  if (anchorOptimization) {
    if (anchorOptimization.buttonPosition && host.anchorButtonPosition) host.anchorButtonPosition.value = anchorOptimization.buttonPosition;
    if (anchorOptimization.showPreviewButton !== undefined && host.showPreviewButton) host.showPreviewButton.checked = anchorOptimization.showPreviewButton;
  }

  if (host.enableClickEnhancement) host.enableClickEnhancement.checked = listEnhancement.enableClickEnhancement !== false;
  if (host.enableClickEnhancementList) host.enableClickEnhancementList.checked = (listEnhancement as any).enableClickEnhancementList !== false;
  if (host.enableClickEnhancementDetail) host.enableClickEnhancementDetail.checked = (listEnhancement as any).enableClickEnhancementDetail !== false;
  if (host.enableListVideoPreview) host.enableListVideoPreview.checked = listEnhancement.enableVideoPreview !== false;
  if (host.enableVideoPreviewList) host.enableVideoPreviewList.checked = (listEnhancement as any).enableVideoPreviewList !== false;
  if (host.enableVideoPreviewDetail) host.enableVideoPreviewDetail.checked = (listEnhancement as any).enableVideoPreviewDetail !== false;
  if (host.enableScrollPaging) host.enableScrollPaging.checked = listEnhancement.enableScrollPaging || false;
  if (host.enableActorWatermark) host.enableActorWatermark.checked = (listEnhancement as any).enableActorWatermark === true;
  if (host.showStatusBadge) host.showStatusBadge.checked = (listEnhancement as any).showStatusBadge !== false;

  const preferred = (listEnhancement as any).preferredPreviewSource || 'auto';
  if (host.previewSourceAuto) host.previewSourceAuto.checked = preferred === 'auto';
  if (host.previewSourceJavDB) host.previewSourceJavDB.checked = preferred === 'javdb';
  if (host.previewSourceJavSpyl) host.previewSourceJavSpyl.checked = preferred === 'javspyl';
  if (host.previewSourceAVPreview) host.previewSourceAVPreview.checked = preferred === 'avpreview';
  if (host.previewSourceVBGFL) host.previewSourceVBGFL.checked = preferred === 'vbgfl';

  const actorEnhancement = settings.actorEnhancement || { enabled: true, autoApplyTags: true, defaultTags: getDefaultTags(), defaultSortType: 0 };
  if (host.enableAutoApplyTags) host.enableAutoApplyTags.checked = (actorEnhancement as any).autoApplyTags !== false;
  if (host.aeEnableActionButtons) host.aeEnableActionButtons.checked = (actorEnhancement as any).enableActionButtons !== false;
  if (host.aeEnableTimeSegmentationDivider) host.aeEnableTimeSegmentationDivider.checked = (actorEnhancement as any).enableTimeSegmentationDivider === true;
  if (host.aeTimeSegmentationMonths) host.aeTimeSegmentationMonths.value = String((actorEnhancement as any).timeSegmentationMonths ?? 6);

  const ve = settings?.videoEnhancement || {};
  if (host.enableVideoEnhancement) host.enableVideoEnhancement.checked = !!(ve as any).enabled;
  if (host.veEnableCoverImage) host.veEnableCoverImage.checked = (ve as any).enableCoverImage !== false;
  if (host.veShowLoadingIndicator) host.veShowLoadingIndicator.checked = (ve as any).showLoadingIndicator !== false;
  if (host.veEnableReviewBreaker) host.veEnableReviewBreaker.checked = (ve as any).enableReviewBreaker === true;
  if (host.veEnableFC2Breaker) host.veEnableFC2Breaker.checked = (ve as any).enableFC2Breaker === true;
  if (host.veEnableWantSync) host.veEnableWantSync.checked = (ve as any).enableWantSync !== false;
  if (host.veAutoMarkWatchedAfter115) host.veAutoMarkWatchedAfter115.checked = (ve as any).autoMarkWatchedAfter115 !== false;
  if (host.veAutoMarkWatchedStars) host.veAutoMarkWatchedStars.value = String((ve as any).autoMarkWatchedStars ?? 4);
  if (host.veEnableActorRemarks) host.veEnableActorRemarks.checked = (ve as any).enableActorRemarks === true;
  if (host.veEnableActorNameMarks) host.veEnableActorNameMarks.checked = (ve as any).enableActorNameMarks !== false;
  if (host.translateCurrentTitleChk) host.translateCurrentTitleChk.checked = settings?.translation?.targets ? settings.translation.targets.currentTitle !== false : true;
  if (host.veActorRemarksMode) host.veActorRemarksMode.value = ((ve as any).actorRemarksMode === 'inline') ? 'inline' : 'panel';
  if (host.veActorRemarksTTL) host.veActorRemarksTTL.value = String((ve as any).actorRemarksTTLDays ?? 0);
  if (host.veActorRemarksTaskTimeout) host.veActorRemarksTaskTimeout.value = String((ve as any).actorRemarksTaskTimeoutSeconds ?? 10);
  if (host.veEnableVideoFavoriteRating) host.veEnableVideoFavoriteRating.checked = (ve as any).enableVideoFavoriteRating !== false;
  if (host.enableActorQuickActions) host.enableActorQuickActions.checked = (ve as any).enableActorQuickActions !== false;

  const contentFilter = settings?.contentFilter || {};
  host.currentFilterRules = contentFilter?.keywordRules || [];
  host.renderFilterRules();

  host.mountTranslationConfigIntoVideoBlock();
  host.toggleConfigSections();
  host.injectMagnetConcurrencyControls();
  host.initEnhancementToggles();
  host.updateAllToggleStates();
  host.bindSubtabLinks();
  host.bindOrchestratorControls();
  try {
    const last = localStorage.getItem('enhancementSubtab') as 'list' | 'video' | 'actor' | 'other' | null;
    host.switchSubtab(last || 'list');
  } catch {
    host.switchSubtab('list');
  }
}
