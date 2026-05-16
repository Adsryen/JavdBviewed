import { log } from '../../../../../../utils/logController';

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
      if (targetId === 'enableTranslation') {
        host.updateTranslationConfigVisibility();
      }
      host.emit('change');
      host.scheduleAutoSave();
    });

    hiddenCheckbox.addEventListener('change', () => {
      updateToggleState();
      host.handleSubSettingsToggle(targetId, hiddenCheckbox.checked);
      if (targetId === 'enableTranslation') {
        host.updateTranslationConfigVisibility();
      }
    });
  });

  host.enhancementTogglesInitialized = true;
  log.verbose('[Enhancement] 功能增强开关初始化完成');
}

export function toggleConfigSections(host: EnhancementTogglesHost): void {
  if (host.magnetSourcesConfig) {
    host.magnetSourcesConfig.setAttribute('data-enabled', host.enableMagnetSearch.checked ? '1' : '0');
    host.magnetSourcesConfig.style.display = 'block';
  }

  if (host.contentFilterConfig) {
    host.contentFilterConfig.setAttribute('data-enabled', host.enableContentFilter.checked ? '1' : '0');
    host.contentFilterConfig.style.display = 'block';
  }

  if (host.anchorOptimizationConfig) {
    host.anchorOptimizationConfig.setAttribute('data-enabled', host.enableAnchorOptimization.checked ? '1' : '0');
    host.anchorOptimizationConfig.style.display = 'block';
  }

  if (host.videoEnhancementConfig) {
    const enabled = (
      host.veEnableCoverImage?.checked === true ||
      host.enableTranslation?.checked === true ||
      host.veShowLoadingIndicator?.checked === true
    );
    host.videoEnhancementConfig.setAttribute('data-enabled', enabled ? '1' : '0');
    host.videoEnhancementConfig.style.display = 'block';
  }

  const actorRemarksConfig = document.getElementById('actorRemarksConfig');
  if (actorRemarksConfig) {
    actorRemarksConfig.setAttribute('data-enabled', host.veEnableActorRemarks?.checked ? '1' : '0');
    actorRemarksConfig.style.display = 'block';
  }

  const actorAutoApplyConfig = document.getElementById('actorAutoApplyConfig');
  if (actorAutoApplyConfig) {
    actorAutoApplyConfig.setAttribute('data-enabled', host.enableAutoApplyTags?.checked ? '1' : '0');
    actorAutoApplyConfig.style.display = 'block';
  }
}

export function handleSettingChange(host: EnhancementTogglesHost): void {
  host.emit('change');
  host.scheduleAutoSave();
}
