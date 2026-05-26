import { log } from '../../../../../utils/logController';

export type EnhancementTogglesHost = any;

export function initEnhancementToggles(host: EnhancementTogglesHost): void {
  if (host.enhancementTogglesInitialized) return;

  const toggles = document.querySelectorAll('#enhancement-settings .enhancement-toggle[data-target]');
  toggles.forEach((toggleEl) => {
    const targetId = toggleEl.getAttribute('data-target');
    if (!targetId) return;
    const hiddenCheckbox = document.getElementById(targetId) as HTMLInputElement | null;
    if (!hiddenCheckbox) return;

    const updateToggleState = () => {
      toggleEl.classList.toggle('active', hiddenCheckbox.checked);
    };

    updateToggleState();

    toggleEl.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (toggleEl.hasAttribute('disabled')) return;
      hiddenCheckbox.checked = !hiddenCheckbox.checked;
      updateToggleState();
      host.handleSubSettingsToggle(targetId, hiddenCheckbox.checked);
      toggleConfigSections(host);
      if (targetId === 'enableTranslation') {
        host.updateTranslationConfigVisibility();
      }
      host.emit('change');
      host.scheduleAutoSave();
    });

    hiddenCheckbox.addEventListener('change', () => {
      updateToggleState();
      host.handleSubSettingsToggle(targetId, hiddenCheckbox.checked);
      toggleConfigSections(host);
      if (targetId === 'enableTranslation') {
        host.updateTranslationConfigVisibility();
      }
    });
  });

  host.enhancementTogglesInitialized = true;
  log.verbose('[Enhancement] 功能增强开关初始化完成');
}

export function toggleConfigSections(host: EnhancementTogglesHost): void {
  const setConfigEnabled = (element: HTMLElement | null | undefined, enabled: boolean): void => {
    if (!element) return;
    element.setAttribute('data-enabled', enabled ? '1' : '0');
    element.style.display = 'block';
    element.querySelectorAll('.enhancement-toggle[data-target]').forEach(el => {
      (el as HTMLButtonElement).toggleAttribute('disabled', !enabled);
    });
  };

  if (host.magnetSourcesConfig) {
    setConfigEnabled(host.magnetSourcesConfig, host.enableMagnetSearch.checked === true);
  }

  if (host.contentFilterConfig) {
    setConfigEnabled(host.contentFilterConfig, host.enableContentFilter.checked === true);
  }

  if (host.anchorOptimizationConfig) {
    setConfigEnabled(host.anchorOptimizationConfig, host.enableAnchorOptimization.checked === true);
  }

  if (host.videoEnhancementConfig) {
    setConfigEnabled(host.videoEnhancementConfig, host.enableVideoEnhancement?.checked === true);
  }

  const externalEntryEnabled = host.veEnableExternalEntryPanel?.checked !== false;
  setConfigEnabled(document.getElementById('actorRemarksConfig') as HTMLElement | null, host.veEnableActorRemarks?.checked === true);
  setConfigEnabled(document.getElementById('externalEntryConfig') as HTMLElement | null, externalEntryEnabled);
  setConfigEnabled(document.getElementById('onlineAvailabilityConfig') as HTMLElement | null, externalEntryEnabled && host.veEnableOnlineAvailability?.checked !== false);
  setConfigEnabled(document.getElementById('autoMarkWatchedConfig') as HTMLElement | null, host.veAutoMarkWatchedAfter115?.checked === true);
  setConfigEnabled(document.getElementById('clickEnhancementConfig') as HTMLElement | null, host.enableClickEnhancement?.checked === true);
  setConfigEnabled(document.getElementById('listVideoPreviewConfig') as HTMLElement | null, host.enableListVideoPreview?.checked === true);
  setConfigEnabled(document.getElementById('actorWatermarkConfig') as HTMLElement | null, host.enableActorWatermark?.checked === true);
  setConfigEnabled(document.getElementById('actorEnhancementConfig') as HTMLElement | null, host.enableActorEnhancement?.checked === true);
  setConfigEnabled(document.getElementById('actorTimeSegmentationConfig') as HTMLElement | null, host.aeEnableTimeSegmentationDivider?.checked === true);
  setConfigEnabled(document.getElementById('passwordHelperConfig') as HTMLElement | null, host.enablePasswordHelper?.checked === true);

  const reviewEnhancementConfig = document.getElementById('reviewEnhancementConfig');
  if (reviewEnhancementConfig) {
    const enabled = host.veEnableReviewEnhancement?.checked === true;
    setConfigEnabled(reviewEnhancementConfig, enabled);
  }

  setConfigEnabled(document.getElementById('actorAutoApplyConfig') as HTMLElement | null, host.enableAutoApplyTags?.checked === true);
  setConfigEnabled(document.getElementById('popularityEffectsConfig') as HTMLElement | null, host.enablePopularityEffects?.checked === true);
}

export function handleSettingChange(host: EnhancementTogglesHost): void {
  toggleConfigSections(host);
  host.emit('change');
  host.scheduleAutoSave();
}
