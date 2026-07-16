export type EnhancementHoverHost = any;

export function setupSubSettingsHoverBehavior(host: EnhancementHoverHost): void {
  if (host.subSettingsHoverInitialized) return;
  host.subSettingsHoverInitialized = true;

  const groups = document.querySelectorAll('#enhancement-settings .form-group');
  groups.forEach(group => {
    const container = group as HTMLElement;
    const sub = container.querySelector(':scope > .sub-settings') as HTMLElement | null;
    if (!sub) return;

    sub.style.display = 'block';
    sub.style.maxHeight = '0px';
    sub.classList.remove('is-open');
    sub.style.borderTopWidth = '0px';
    sub.style.borderBottomWidth = '0px';
    sub.style.paddingTop = '0px';
    sub.style.paddingBottom = '0px';

    const onTransitionEnd = (ev: TransitionEvent) => {
      if (ev.propertyName !== 'max-height') return;
      if (sub.classList.contains('is-open')) {
        sub.style.maxHeight = 'none';
      }
    };
    sub.addEventListener('transitionend', onTransitionEnd);

    const openWithIntent = () => {
      const cTimer = host.subSettingsCollapseTimers.get(container);
      if (cTimer) { clearTimeout(cTimer); host.subSettingsCollapseTimers.delete(container); }
      sub.classList.add('is-open');
      host.subSettingsOpenedAt.set(container, Date.now());
      sub.style.borderTopWidth = '';
      sub.style.borderBottomWidth = '';
      sub.style.paddingTop = '';
      sub.style.paddingBottom = '';
      if (sub.style.maxHeight === 'none') {
        sub.style.maxHeight = `${sub.scrollHeight}px`;
      }
      void sub.offsetHeight;
      sub.style.maxHeight = `${sub.scrollHeight}px`;
    };

    const closeWithDelay = () => {
      const oTimer = host.subSettingsOpenTimers.get(container);
      if (oTimer) { clearTimeout(oTimer); host.subSettingsOpenTimers.delete(container); }
      const minOpenMs = 420;
      const openedAt = host.subSettingsOpenedAt.get(container) || 0;
      const elapsed = Date.now() - openedAt;
      const waitMore = elapsed < minOpenMs ? (minOpenMs - elapsed) : 0;
      const timer = window.setTimeout(() => {
        if (sub.style.maxHeight === 'none') {
          sub.style.maxHeight = `${sub.scrollHeight}px`;
          requestAnimationFrame(() => {
            sub.classList.remove('is-open');
            sub.style.maxHeight = '0px';
            sub.style.borderTopWidth = '0px';
            sub.style.borderBottomWidth = '0px';
            sub.style.paddingTop = '0px';
            sub.style.paddingBottom = '0px';
          });
        } else {
          sub.classList.remove('is-open');
          sub.style.maxHeight = '0px';
          sub.style.borderTopWidth = '0px';
          sub.style.borderBottomWidth = '0px';
          sub.style.paddingTop = '0px';
          sub.style.paddingBottom = '0px';
        }
      }, 180 + waitMore);
      host.subSettingsCollapseTimers.set(container, timer);
    };

    container.addEventListener('mouseenter', () => {
      const timer = window.setTimeout(openWithIntent, 120);
      host.subSettingsOpenTimers.set(container, timer);
    });

    container.addEventListener('mouseleave', () => {
      closeWithDelay();
    });

    container.addEventListener('focusin', () => {
      openWithIntent();
    });

    container.addEventListener('focusout', () => {
      setTimeout(() => {
        if (!container.contains(document.activeElement)) {
          closeWithDelay();
        }
      }, 0);
    });
  });
}

export function handleSubSettingsToggle(_host: EnhancementHoverHost, targetId: string, isEnabled: boolean): void {
  const checkbox = document.getElementById(targetId) as HTMLInputElement | null;
  const formGroup = checkbox?.closest('.form-group') as HTMLElement | null;
  const subSettings = formGroup?.querySelector(':scope > .sub-settings') as HTMLElement | null;
  if (!subSettings) return;
  subSettings.setAttribute('data-enabled', isEnabled ? '1' : '0');
}

export function updateAllToggleStates(host: EnhancementHoverHost): void {
  console.log('[Enhancement] 强制更新所有滑块状态');
  const toggles = document.querySelectorAll('#enhancement-settings .enhancement-toggle');
  toggles.forEach((toggleEl) => {
    const targetId = toggleEl.getAttribute('data-target');
    if (!targetId) return;
    const hiddenCheckbox = document.getElementById(targetId) as HTMLInputElement | null;
    if (!hiddenCheckbox) return;
    if (toggleEl.hasAttribute('data-always-on')) {
      hiddenCheckbox.checked = true;
      (toggleEl as HTMLButtonElement).disabled = true;
      toggleEl.classList.add('always-on');
      toggleEl.setAttribute('aria-disabled', 'true');
    }
    toggleEl.classList.toggle('active', hiddenCheckbox.checked);
    host.handleSubSettingsToggle(targetId, hiddenCheckbox.checked);
    if (targetId === 'enableTranslation') {
      host.updateTranslationConfigVisibility();
    }
  });
}
