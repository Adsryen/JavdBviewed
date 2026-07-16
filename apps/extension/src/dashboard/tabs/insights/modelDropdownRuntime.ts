import {
  buildInsightsModelOptions,
  resolveModelCustomInputState,
  resolveModelRestoredState,
  resolveModelSelectionState,
} from './modelDropdownModel';

interface AiSettings {
  enabled?: boolean;
  selectedModel?: string;
  apiUrl?: string;
  apiKey?: string;
}

interface ModelOptionInput {
  id: string;
  name?: string;
}

interface CreateInsightsModelDropdownRuntimeOptions {
  documentRef?: Document;
  storageRef?: Storage;
  storageKey?: string;
  readyAi: () => Promise<void>;
  getAiSettings: () => AiSettings;
  getAvailableModels: (forceRefresh?: boolean) => Promise<ModelOptionInput[]>;
  setPageModelOverride: (value: string | undefined) => void;
  setModelErrorBanner?: (message: string) => void;
  clearModelErrorBanner?: () => void;
  showMessage?: (message: string, type?: 'info' | 'warn' | 'warning' | 'error' | 'success') => void;
}

export interface InsightsModelDropdownRuntime {
  ensureModelDropdown: () => Promise<HTMLDivElement | null>;
}

const DEFAULT_STORAGE_KEY = 'insights_model_override';
const WRAP_ID = 'insights-model-wrap';
const SELECT_ID = 'insights-model-select';
const INPUT_ID = 'insights-model-custom';
const REFRESH_ID = 'insights-model-refresh';
const SEP_ID = 'insights-model-sep';

export function createInsightsModelDropdownRuntime(
  options: CreateInsightsModelDropdownRuntimeOptions,
): InsightsModelDropdownRuntime {
  const doc = options.documentRef ?? document;
  const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
  const storage = options.storageRef;

  function getStorage(): Storage | null {
    if (storage) return storage;
    try { return doc.defaultView?.sessionStorage ?? sessionStorage; } catch { return null; }
  }

  function readStoredOverride(): string {
    try { return getStorage()?.getItem(storageKey) || ''; } catch { return ''; }
  }

  function writeStoredOverride(value?: string): void {
    try {
      const storageRef = getStorage();
      if (!storageRef) return;
      if (value) storageRef.setItem(storageKey, value);
      else storageRef.removeItem(storageKey);
    } catch {}
  }

  function showMessage(message: string, type?: 'info' | 'warn' | 'warning' | 'error' | 'success'): void {
    try { options.showMessage?.(message, type); } catch {}
  }

  function setModelErrorBanner(message: string): void {
    try { options.setModelErrorBanner?.(message); } catch {}
  }

  function clearModelErrorBanner(): void {
    try { options.clearModelErrorBanner?.(); } catch {}
  }

  function createControls(): HTMLDivElement {
    const wrap = doc.createElement('div');
    wrap.id = WRAP_ID;
    wrap.className = 'field-inline';
    wrap.style.marginLeft = '12px';

    const label = doc.createElement('label');
    label.htmlFor = SELECT_ID;
    label.textContent = 'AI模型：';

    const select = doc.createElement('select');
    select.id = SELECT_ID;

    const input = doc.createElement('input');
    input.type = 'text';
    input.id = INPUT_ID;
    input.placeholder = '输入模型ID';
    input.style.display = 'none';
    input.style.marginLeft = '6px';
    input.style.height = 'var(--ins-row2-h)';
    input.style.fontSize = 'var(--ins-row2-font)';

    const refresh = doc.createElement('button');
    refresh.id = REFRESH_ID;
    refresh.textContent = '刷新模型';
    refresh.style.marginLeft = '6px';
    refresh.style.height = 'var(--ins-row2-h)';
    refresh.style.fontSize = 'var(--ins-row2-font)';
    refresh.style.padding = '0 10px';
    refresh.style.border = '1px solid #e2e8f0';
    refresh.style.background = '#f8fafc';
    refresh.style.color = '#334155';
    refresh.style.borderRadius = 'var(--ins-row2-radius)';

    wrap.appendChild(label);
    wrap.appendChild(select);
    wrap.appendChild(input);
    wrap.appendChild(refresh);

    bindSelectionEvents(select, input);
    bindRefreshEvent(refresh);

    return wrap;
  }

  function insertControls(container: HTMLDivElement, wrap: HTMLDivElement): void {
    const genBtn = doc.getElementById('insights-generate');
    const rangeGroup = container.querySelector('.field-inline');
    let sep = doc.getElementById(SEP_ID) as HTMLSpanElement | null;
    if (!sep) {
      sep = doc.createElement('span');
      sep.id = SEP_ID;
      sep.className = 'dot-sep';
      sep.textContent = '·';
    }

    if (genBtn && genBtn.parentElement === container) {
      if (rangeGroup) container.insertBefore(sep, genBtn);
      container.insertBefore(wrap, genBtn);
      return;
    }

    if (rangeGroup) container.appendChild(sep);
    container.appendChild(wrap);
  }

  function bindSelectionEvents(select: HTMLSelectElement, input: HTMLInputElement): void {
    select.onchange = () => {
      const state = resolveModelSelectionState(select.value || '', input.value || '');
      input.style.display = state.customVisible ? '' : 'none';
      if (state.customVisible) input.focus();
      options.setPageModelOverride(state.pageModelOverride);
      writeStoredOverride(state.storageValue);
    };

    input.oninput = () => {
      const state = resolveModelCustomInputState(input.value || '');
      options.setPageModelOverride(state.pageModelOverride);
      writeStoredOverride(state.storageValue);
    };
  }

  function bindRefreshEvent(refresh: HTMLButtonElement): void {
    refresh.onclick = async () => {
      try {
        await options.readyAi();
        const cfg = options.getAiSettings();
        if (!cfg.enabled) {
          setModelErrorBanner('AI 未启用，无法刷新模型');
          showMessage('AI 未启用，无法刷新模型', 'error');
          return;
        }
        if (!cfg.apiUrl || !cfg.apiKey) {
          setModelErrorBanner('AI API 地址或密钥未配置，无法刷新模型');
          showMessage('AI API 地址或密钥未配置', 'error');
          return;
        }
        clearModelErrorBanner();
        const old = refresh.textContent || '';
        refresh.disabled = true;
        refresh.textContent = '刷新中…';
        try {
          await options.getAvailableModels(true);
          await ensureModelDropdown();
          clearModelErrorBanner();
          showMessage('模型列表已刷新', 'success');
        } catch (err) {
          const message = getErrorMessage(err);
          setModelErrorBanner(`AI 模型列表加载失败：${message || '请检查设置或网络'}`);
          showMessage(`模型列表刷新失败：${message || '请检查设置或网络'}`, 'error');
        } finally {
          refresh.disabled = false;
          refresh.textContent = old || '刷新模型';
        }
      } catch {}
    };
  }

  async function populateControls(): Promise<void> {
    const select = doc.getElementById(SELECT_ID) as HTMLSelectElement | null;
    const input = doc.getElementById(INPUT_ID) as HTMLInputElement | null;
    const refresh = doc.getElementById(REFRESH_ID) as HTMLButtonElement | null;
    if (!select) return;

    select.innerHTML = '';
    await options.readyAi();
    const aiCfg = options.getAiSettings();
    let models: ModelOptionInput[] = [];
    if (aiCfg.enabled) {
      try {
        clearModelErrorBanner();
        models = await options.getAvailableModels();
      } catch (err) {
        const message = getErrorMessage(err);
        setModelErrorBanner(`AI 模型列表加载失败：${message || '请检查设置或网络'}`);
      }
    } else {
      clearModelErrorBanner();
    }

    const optionSpecs = buildInsightsModelOptions({
      selectedModel: aiCfg.selectedModel,
      enabled: !!aiCfg.enabled,
      models,
    });
    for (const spec of optionSpecs) {
      const option = doc.createElement('option');
      option.value = spec.value;
      option.textContent = spec.label;
      select.appendChild(option);
    }

    const restoredState = resolveModelRestoredState(readStoredOverride(), optionSpecs.map(spec => spec.value));
    select.value = restoredState.selectValue;
    options.setPageModelOverride(restoredState.pageModelOverride);
    if (input) {
      input.style.display = restoredState.customVisible ? '' : 'none';
      input.value = restoredState.customValue;
      input.disabled = !aiCfg.enabled;
    }
    try {
      select.disabled = !aiCfg.enabled;
      if (refresh) refresh.disabled = !aiCfg.enabled;
    } catch {}
  }

  async function ensureModelDropdown(): Promise<HTMLDivElement | null> {
    try {
      const container = doc.querySelector('.tab-section[data-tab-id="insights"] .insights-toolbar .toolbar-row.row-2 .toolbar-left') as HTMLDivElement | null;
      if (!container) return null;
      let wrap = doc.getElementById(WRAP_ID) as HTMLDivElement | null;
      if (!wrap) {
        wrap = createControls();
        insertControls(container, wrap);
      }
      await populateControls();
      return wrap;
    } catch {
      return null;
    }
  }

  return {
    ensureModelDropdown,
  };
}

function getErrorMessage(error: unknown): string {
  try { return error instanceof Error ? error.message : String(error || ''); } catch { return ''; }
}
