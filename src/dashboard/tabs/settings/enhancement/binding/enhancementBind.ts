export type EnhancementBindHost = any;

export function bindSubtabLinks(host: EnhancementBindHost): void {
  const links = document.querySelectorAll('#enhancement-settings .subtab-link');
  links.forEach((link) => {
    if ((link as HTMLElement).dataset.bound === '1') return;
    (link as HTMLElement).dataset.bound = '1';
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sub = (link as HTMLElement).dataset.subtab as 'list' | 'video' | 'actor' | 'other';
      host.switchSubtab(sub);
    });
  });
}

export function bindOrchestratorControls(host: EnhancementBindHost): void {
  if (host.orchestratorFullscreenBtn && host.orchestratorFullscreenBtn.dataset.orchestratorBound !== '1') {
    host.orchestratorFullscreenBtn.dataset.orchestratorBound = '1';
    host.orchestratorFullscreenBtn.addEventListener('click', () => {
      const content = document.getElementById('orchestratorModalContent');
      if (!content) return;
      const isFs = content.classList.toggle('fullscreen');
      host.orchestratorFullscreenBtn!.textContent = isFs ? '退出全屏' : '全屏';
      host.orchestratorTimeline?.scrollTo({ top: host.orchestratorTimeline.scrollHeight });
    });
  }

  if (host.orchestratorOpenJavdbBtn && host.orchestratorOpenJavdbBtn.dataset.orchestratorBound !== '1') {
    host.orchestratorOpenJavdbBtn.dataset.orchestratorBound = '1';
    host.orchestratorOpenJavdbBtn.addEventListener('click', async () => {
      try {
        if (!chrome?.tabs?.create) return;
        await new Promise<void>((resolve) => {
          chrome.tabs.create({ url: 'https://javdb.com/' }, () => resolve());
        });
        setTimeout(() => host.refreshOrchestratorState(), 1500);
      } catch (e) {
        console.warn('[Enhancement] 打开 JavDB 失败:', e);
      }
    });
  }
}

export function mountTranslationConfigIntoVideoBlock(host: EnhancementBindHost): void {
  try {
    const videoTranslationBlock = document.getElementById('videoTranslationBlock');
    if (!videoTranslationBlock || !host.translationConfig) return;
    if (!videoTranslationBlock.contains(host.translationConfig)) {
      videoTranslationBlock.appendChild(host.translationConfig);
    }
    if (!host.translationConfig.classList.contains('sub-settings')) {
      host.translationConfig.classList.add('sub-settings');
    }
    host.updateTranslationConfigVisibility();
  } catch {}
}
