import { buildPrompts as defaultBuildPrompts } from '../../../features/insights/prompts';
import { getAllPersonas as defaultGetAllPersonas } from '../../../features/insights/personas';

interface PersonaOption {
  id: string;
  name: string;
  description?: string;
}

interface PromptContent {
  system: string;
  rules: string;
}

interface PromptRuntimeDeps {
  documentRef?: Document;
  getSettings?: () => Promise<any>;
  saveSettings?: (settings: any) => Promise<void>;
  showMessage?: (message: string, type?: 'info' | 'warn' | 'warning' | 'error' | 'success') => void;
  getAllPersonas?: () => PersonaOption[];
  buildPrompts?: (options?: { persona?: any }) => PromptContent;
}

export interface InsightsPromptRuntime {
  updateCurrentPersonaDisplay: () => Promise<void>;
  ensurePromptsButton: () => HTMLButtonElement | null;
  openPromptsModal: () => Promise<void>;
}

export function createInsightsPromptRuntime(options: PromptRuntimeDeps = {}): InsightsPromptRuntime {
  const doc = options.documentRef ?? document;
  const getSettings = options.getSettings ?? (async () => {
    const storage = await import('../../../utils/storage');
    return storage.getSettings();
  });
  const saveSettings = options.saveSettings ?? (async (settings: any) => {
    const storage = await import('../../../utils/storage');
    await storage.saveSettings(settings);
  });
  const showMessage = options.showMessage ?? ((message: string, type?: 'info' | 'warn' | 'warning' | 'error' | 'success') => {
    void import('../../ui/toast').then(module => {
      module.showMessage(message, type);
    }).catch(() => {});
  });
  const getAllPersonas = options.getAllPersonas ?? defaultGetAllPersonas;
  const buildPrompts = options.buildPrompts ?? defaultBuildPrompts;

  async function updateCurrentPersonaDisplay(): Promise<void> {
    try {
      const settings = await getSettings();
      const personaId = ((settings as any)?.insights?.prompts?.persona) || 'doctor';
      const personas = getAllPersonas();
      const persona = personas.find(p => p.id === personaId);
      const displayEl = doc.getElementById('insights-current-persona');
      if (displayEl && persona) {
        displayEl.textContent = persona.name;
      }
    } catch {}
  }

  function ensurePromptsButton(): HTMLButtonElement | null {
    try {
      const BTN_ID = 'insights-edit-prompts';
      const actionBar = doc.getElementById('insights-toolbar-row2-actions');
      let btn = doc.getElementById(BTN_ID) as HTMLButtonElement | null;
      if (actionBar) {
        if (!btn) {
          btn = doc.createElement('button');
          btn.id = BTN_ID;
          btn.className = 'btn-ghost';
          btn.innerHTML = '<i class="fas fa-pen"></i>&nbsp;编辑提示词';
          actionBar.insertBefore(btn, actionBar.firstChild);
        }
        return btn;
      }
      return null;
    } catch {
      return null;
    }
  }

  async function openPromptsModal(): Promise<void> {
    try {
      const settings = await getSettings();
      const p = ((settings as any)?.insights?.prompts) || {};
      const defaults = buildPrompts({ persona: 'doctor' });
      const OVERLAY_ID = 'insights-prompts-overlay';
      let overlay = doc.getElementById(OVERLAY_ID) as HTMLDivElement | null;
      if (overlay) overlay.remove();
      overlay = doc.createElement('div');
      overlay.id = OVERLAY_ID;
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.background = 'var(--surface-overlay)';
      overlay.style.backdropFilter = 'blur(2px)';
      overlay.style.zIndex = '9999';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      const modal = doc.createElement('div');
      modal.style.width = '1100px';
      modal.style.maxWidth = '95%';
      modal.style.maxHeight = '92%';
      modal.style.overflow = 'auto';
      modal.style.background = 'var(--surface-primary)';
      modal.style.borderRadius = '10px';
      modal.style.boxShadow = 'var(--shadow-xl)';
      modal.style.padding = '16px 18px';
      modal.style.border = '1px solid var(--border-primary)';
      const header = doc.createElement('div');
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.justifyContent = 'space-between';
      header.style.marginBottom = '12px';
      const title = doc.createElement('div');
      title.textContent = '编辑提示词';
      title.style.fontWeight = '700';
      title.style.fontSize = '14px';
      title.style.color = 'var(--text-primary)';
      header.appendChild(title);
      const closeBtn = doc.createElement('button');
      closeBtn.textContent = '×';
      closeBtn.style.fontSize = '18px';
      closeBtn.style.lineHeight = '18px';
      closeBtn.style.background = 'transparent';
      closeBtn.style.border = 'none';
      closeBtn.style.cursor = 'pointer';
      try { closeBtn.style.setProperty('color', 'var(--text-secondary)', 'important'); } catch { closeBtn.style.color = 'var(--text-secondary)'; }
      closeBtn.style.opacity = '0.9';
      closeBtn.style.padding = '2px 6px';
      closeBtn.style.borderRadius = '6px';
      closeBtn.onmouseenter = () => {
        try { closeBtn.style.setProperty('background', 'var(--bg-hover)', 'important'); } catch { closeBtn.style.background = 'var(--bg-hover)'; }
        closeBtn.style.opacity = '1';
      };
      closeBtn.onmouseleave = () => {
        try { closeBtn.style.setProperty('background', 'transparent', 'important'); } catch { closeBtn.style.background = 'transparent'; }
        closeBtn.style.opacity = '0.9';
      };
      header.appendChild(closeBtn);
      const body = doc.createElement('div');
      body.style.fontSize = '12px';
      body.style.color = 'var(--text-primary)';
      body.style.display = 'grid';
      body.style.gridTemplateColumns = '1fr';
      body.style.gap = '12px';
      const row1 = doc.createElement('div');
      row1.style.display = 'flex';
      row1.style.gap = '12px';
      row1.style.alignItems = 'center';

      const personaLabel = doc.createElement('label');
      personaLabel.textContent = '人设：';
      personaLabel.style.marginRight = '4px';
      const personaSelect = doc.createElement('select');
      personaSelect.style.padding = '4px 8px';
      personaSelect.style.borderRadius = '4px';
      personaSelect.style.border = '1px solid var(--border-primary)';
      personaSelect.style.background = 'var(--input-bg)';
      personaSelect.style.color = 'var(--text-primary)';

      const personas = getAllPersonas();
      personaSelect.innerHTML = personas.map(persona =>
        `<option value="${persona.id}" title="${persona.description ?? ''}">${persona.name}</option>`
      ).join('');
      personaSelect.value = p.persona || 'doctor';

      const personaHint = doc.createElement('span');
      personaHint.style.marginLeft = '8px';
      personaHint.style.fontSize = '11px';
      personaHint.style.color = 'var(--text-secondary)';
      personaHint.style.fontStyle = 'italic';
      const updateHint = () => {
        const selected = personas.find(p => p.id === personaSelect.value);
        personaHint.textContent = selected ? `（${selected.description ?? ''}）` : '';
      };
      updateHint();

      const enableLabel = doc.createElement('label');
      enableLabel.textContent = '启用自定义';
      enableLabel.style.marginLeft = '16px';
      const enableChk = doc.createElement('input');
      enableChk.type = 'checkbox';
      enableChk.checked = !!p.enableCustom;
      row1.appendChild(personaLabel);
      row1.appendChild(personaSelect);
      row1.appendChild(personaHint);
      row1.appendChild(enableLabel);
      row1.appendChild(enableChk);

      personaSelect.onchange = () => {
        const selectedPersona = personaSelect.value as any;
        const newDefaults = buildPrompts({ persona: selectedPersona });
        if (!enableChk.checked) {
          sysTa.value = newDefaults.system;
          rulesTa.value = newDefaults.rules;
        }
        updateHint();
      };
      const sysWrap = doc.createElement('div');
      const sysLab = doc.createElement('div');
      sysLab.textContent = 'System';
      const sysTa = doc.createElement('textarea');
      sysTa.style.width = '100%';
      sysTa.style.height = '180px';
      sysTa.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
      sysTa.style.fontSize = '12px';
      sysTa.style.lineHeight = '1.5';
      sysTa.style.padding = '10px';
      sysTa.style.background = 'var(--input-bg)';
      sysTa.style.border = '1px solid var(--border-primary)';
      sysTa.style.borderRadius = '6px';
      sysTa.style.resize = 'vertical';
      sysTa.style.color = 'var(--text-primary)';
      sysTa.value = (typeof p.systemOverride === 'string' && p.systemOverride.trim()) ? p.systemOverride : defaults.system;
      const rulesWrap = doc.createElement('div');
      const rulesLab = doc.createElement('div');
      rulesLab.textContent = 'Rules';
      const rulesTa = doc.createElement('textarea');
      rulesTa.style.width = '100%';
      rulesTa.style.height = '280px';
      rulesTa.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
      rulesTa.style.fontSize = '12px';
      rulesTa.style.lineHeight = '1.5';
      rulesTa.style.padding = '10px';
      rulesTa.style.background = 'var(--input-bg)';
      rulesTa.style.border = '1px solid var(--border-primary)';
      rulesTa.style.borderRadius = '6px';
      rulesTa.style.resize = 'vertical';
      rulesTa.style.color = 'var(--text-primary)';
      rulesTa.value = (typeof p.rulesOverride === 'string' && p.rulesOverride.trim()) ? p.rulesOverride : defaults.rules;
      const hint = doc.createElement('div');
      hint.textContent = '未勾选“启用自定义”时，将使用系统默认提示词（当前已展示）。勾选后保存才会覆盖默认值。';
      hint.style.color = 'var(--text-secondary)';
      hint.style.fontSize = '12px';
      sysWrap.appendChild(sysLab);
      sysWrap.appendChild(sysTa);
      rulesWrap.appendChild(rulesLab);
      rulesWrap.appendChild(rulesTa);
      rulesWrap.appendChild(hint);
      const actions = doc.createElement('div');
      actions.style.display = 'flex';
      actions.style.justifyContent = 'flex-end';
      actions.style.gap = '8px';
      const cancel = doc.createElement('button');
      cancel.textContent = '取消';
      cancel.className = 'btn-secondary';
      const save = doc.createElement('button');
      save.textContent = '保存';
      save.className = 'btn-primary';
      actions.appendChild(cancel);
      actions.appendChild(save);
      body.appendChild(row1);
      body.appendChild(sysWrap);
      body.appendChild(rulesWrap);
      body.appendChild(actions);
      modal.appendChild(header);
      modal.appendChild(body);
      overlay.appendChild(modal);
      overlay.onclick = (ev) => { if (ev.target === overlay) overlay?.remove(); };
      cancel.onclick = () => overlay?.remove();
      closeBtn.onclick = () => overlay?.remove();

      const syncDisabled = () => {
        const enabled = !!enableChk.checked;
        sysTa.disabled = !enabled;
        rulesTa.disabled = !enabled;
        sysTa.style.opacity = enabled ? '1' : '0.7';
        rulesTa.style.opacity = enabled ? '1' : '0.7';
      };
      syncDisabled();
      enableChk.onchange = syncDisabled;
      save.onclick = async () => {
        try {
          const s = await getSettings();
          const cur = (s as any).insights || {};
          const next = {
            ...cur,
            prompts: {
              persona: personaSelect.value || 'doctor',
              enableCustom: !!enableChk.checked,
              systemOverride: sysTa.value || '',
              rulesOverride: rulesTa.value || '',
            },
          };
          (s as any).insights = next;
          await saveSettings(s as any);
          await updateCurrentPersonaDisplay();
          try { showMessage('已保存提示词设置', 'success'); } catch {}
        } catch {
          try { showMessage('保存失败', 'error'); } catch {}
        } finally {
          overlay?.remove();
        }
      };
      doc.body.appendChild(overlay);
    } catch {}
  }

  return {
    updateCurrentPersonaDisplay,
    ensurePromptsButton,
    openPromptsModal,
  };
}
