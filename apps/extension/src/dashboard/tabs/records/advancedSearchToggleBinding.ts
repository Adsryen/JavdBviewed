export interface AdvancedSearchToggleDelegationOptions {
  windowRef?: Window & typeof globalThis;
  documentRef?: Document;
}

interface AdvancedSearchToggleWindowFlag {
  __recordsAdvToggleDelegated?: boolean;
}

export function bindAdvancedSearchToggleDelegation(options: AdvancedSearchToggleDelegationOptions = {}): void {
  const windowRef = (options.windowRef || window) as Window & typeof globalThis & AdvancedSearchToggleWindowFlag;
  const documentRef = options.documentRef || document;

  try {
    if (windowRef.__recordsAdvToggleDelegated) return;

    documentRef.addEventListener('click', (ev) => {
      const target = ev.target as HTMLElement | null;
      const btn = target && (target.closest as any)?.call(target, '#advancedSearchToggle') as HTMLButtonElement | null;
      if (!btn) return;

      try {
        ev.preventDefault();
        ev.stopPropagation();
      } catch {}

      const panel = documentRef.getElementById('advancedSearchPanel') as HTMLDivElement | null;
      if (!panel) return;

      const show = panel.style.display === 'none' || !panel.style.display;
      panel.style.display = show ? 'block' : 'none';
      try { console.info('[AdvancedSearch] toggled', { visible: panel.style.display !== 'none' }); } catch {}
    }, true);

    windowRef.__recordsAdvToggleDelegated = true;
  } catch {}
}
