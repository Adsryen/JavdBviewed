import { renderTemplate, generateReportHTML } from "../../services/insights/reportGenerator";
import { aiService } from "../../services/ai/aiService";
import { dbInsReportsPut, dbInsReportsList, dbInsReportsGet, dbInsReportsDelete, dbInsReportsExport, dbInsReportsImport } from "../dbClient";
import type { ReportMonthly } from "../../types/insights";
import { dbInsViewsRange, dbViewedPage } from "../dbClient";
import { aggregateMonthly } from "../../services/insights/aggregator";
import { getSettings, saveSettings } from "../../utils/storage";
import { buildPrompts } from "../../services/insights/prompts";
import { getLastGenerationTrace, addTrace } from "../../services/insights/generationTrace";
import { aggregateCompareFromRecords } from "../../services/insights/compareAggregator";
import type { VideoRecord } from "../../types";
import { showMessage } from "../ui/toast";
import { initInsightsMonthPicker } from "../components/MonthRangePickerIntegration";
import { themeManager } from "../services/themeManager";
import { log } from '../../utils/logController';

function getEl<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function ensurePromptsButton(): HTMLButtonElement | null {
  try {
    const BTN_ID = 'insights-edit-prompts';
    const actionBar = document.getElementById('insights-toolbar-row2-actions');
    let btn = document.getElementById(BTN_ID) as HTMLButtonElement | null;
    if (actionBar) {
      if (!btn) {
        btn = document.createElement('button');
        btn.id = BTN_ID;
        btn.className = 'btn-ghost';
        btn.innerHTML = '<i class="fas fa-pen"></i>&nbsp;编辑提示词';
        actionBar.appendChild(btn);
      }
      return btn as HTMLButtonElement;
    }
    return null;
  } catch { return null; }
}

async function openPromptsModal(): Promise<void> {
  try {
    const settings = await getSettings();
    const p = ((settings as any)?.insights?.prompts) || {};
    const defaults = buildPrompts({ persona: 'doctor' });
    const OVERLAY_ID = 'insights-prompts-overlay';
    let overlay = document.getElementById(OVERLAY_ID) as HTMLDivElement | null;
    if (overlay) overlay.remove();
    overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'var(--surface-overlay)';
    overlay.style.backdropFilter = 'blur(2px)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    const modal = document.createElement('div');
    modal.style.width = '820px';
    modal.style.maxWidth = '95%';
    modal.style.maxHeight = '85%';
    modal.style.overflow = 'auto';
    modal.style.background = 'var(--surface-primary)';
    modal.style.borderRadius = '10px';
    modal.style.boxShadow = 'var(--shadow-xl)';
    modal.style.padding = '16px 18px';
    modal.style.border = '1px solid var(--border-primary)';
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';
    header.style.marginBottom = '12px';
    const title = document.createElement('div');
    title.textContent = '编辑提示词';
    title.style.fontWeight = '700';
    title.style.fontSize = '14px';
    title.style.color = 'var(--text-primary)';
    header.appendChild(title);
    const closeBtn = document.createElement('button');
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
    closeBtn.onmouseenter = () => { try { closeBtn.style.setProperty('background', 'var(--bg-hover)', 'important'); } catch { closeBtn.style.background = 'var(--bg-hover)'; } closeBtn.style.opacity = '1'; };
    closeBtn.onmouseleave = () => { try { closeBtn.style.setProperty('background', 'transparent', 'important'); } catch { closeBtn.style.background = 'transparent'; } closeBtn.style.opacity = '0.9'; };
    header.appendChild(closeBtn);
    const body = document.createElement('div');
    body.style.fontSize = '12px';
    body.style.color = 'var(--text-primary)';
    body.style.display = 'grid';
    body.style.gridTemplateColumns = '1fr';
    body.style.gap = '12px';
    const row1 = document.createElement('div');
    row1.style.display = 'flex';
    row1.style.gap = '12px';
    row1.style.alignItems = 'center';
    const enableLabel = document.createElement('label');
    enableLabel.textContent = '启用自定义';
    const enableChk = document.createElement('input');
    enableChk.type = 'checkbox';
    enableChk.checked = !!p.enableCustom;
    row1.appendChild(enableLabel);
    row1.appendChild(enableChk);
    const sysWrap = document.createElement('div');
    const sysLab = document.createElement('div');
    sysLab.textContent = 'System';
    const sysTa = document.createElement('textarea');
    sysTa.style.width = '100%';
    sysTa.style.height = '140px';
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
    const rulesWrap = document.createElement('div');
    const rulesLab = document.createElement('div');
    rulesLab.textContent = 'Rules';
    const rulesTa = document.createElement('textarea');
    rulesTa.style.width = '100%';
    rulesTa.style.height = '200px';
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
    const hint = document.createElement('div');
    hint.textContent = '未勾选“启用自定义”时，将使用系统默认提示词（当前已展示）。勾选后保存才会覆盖默认值。';
    hint.style.color = 'var(--text-secondary)';
    hint.style.fontSize = '12px';
    sysWrap.appendChild(sysLab);
    sysWrap.appendChild(sysTa);
    rulesWrap.appendChild(rulesLab);
    rulesWrap.appendChild(rulesTa);
    rulesWrap.appendChild(hint);
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.justifyContent = 'flex-end';
    actions.style.gap = '8px';
    const cancel = document.createElement('button');
    cancel.textContent = '取消';
    cancel.className = 'btn-secondary';
    const save = document.createElement('button');
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
            persona: 'doctor',
            enableCustom: !!enableChk.checked,
            systemOverride: sysTa.value || '',
            rulesOverride: rulesTa.value || '',
          }
        };
        (s as any).insights = next;
        await saveSettings(s as any);
        try { showMessage('已保存提示词设置', 'success'); } catch {}
      } catch {
        try { showMessage('保存失败', 'error'); } catch {}
      } finally {
        overlay?.remove();
      }
    };
    document.body.appendChild(overlay);
  } catch {}
}

function updateDeleteSelectedEnabled(): void {
  try {
    const btn = getEl<HTMLButtonElement>('insights-delete-selected');
    if (!btn) return;
    const cnt = getSelectedHistoryMonths().length;
    btn.disabled = cnt === 0;
  } catch {}
}

function setModelErrorBanner(msg: string): void {
  try {
    const cont = document.querySelector('.tab-section[data-tab-id="insights"] .container') as HTMLDivElement | null;
    if (!cont) return;
    let el = document.getElementById('insights-model-error') as HTMLDivElement | null;
    if (!el) {
      el = document.createElement('div');
      el.id = 'insights-model-error';
      el.className = 'alert-banner';
      try { el.style.borderColor = '#fecaca'; el.style.backgroundColor = '#fee2e2'; el.style.color = '#991b1b'; } catch {}
      const icon = document.createElement('span');
      icon.className = 'icon';
      icon.textContent = '⛔';
      const text = document.createElement('span');
      el.appendChild(icon);
      el.appendChild(text);
      const toolbar = cont.querySelector('.insights-toolbar');
      cont.insertBefore(el, toolbar || null);
    }
    const spans = el.querySelectorAll('span');
    const textSpan = spans.length > 1 ? spans[1] : null;
    if (textSpan) textSpan.textContent = msg;
    else el.textContent = msg;
  } catch {}
}

function clearModelErrorBanner(): void {
  try {
    const el = document.getElementById('insights-model-error');
    if (el && el.parentElement) el.parentElement.removeChild(el);
  } catch {}
}

// 预览动作的可用状态：生成后才允许“保存为月报”
let canSaveReport = false;
// 页面级：AI 模型覆盖，仅作用于本页面（不改全局设置）
let pageModelOverride: string | undefined = undefined;
// 保存当前预览的原始 HTML（未经 prepareForPreview 处理）
let currentPreviewRawHTML: string = '';

// ========== 查看生成过程：按钮与弹窗 ==========
function ensureTraceButton(): HTMLButtonElement | null {
  try {
    const BTN_ID = 'insights-trace';
    // 插入到“第二行右侧动作区”
    const actionBar = document.getElementById('insights-toolbar-row2-actions');
    let btn = document.getElementById(BTN_ID) as HTMLButtonElement | null;
    if (actionBar) {
      if (!btn) {
        btn = document.createElement('button');
        btn.id = BTN_ID;
        btn.className = 'btn-ghost';
        btn.innerHTML = '<i class="fas fa-list-ul"></i>&nbsp;查看生成过程';
        actionBar.appendChild(btn);
      }
      return btn as HTMLButtonElement;
    }

    // 回退：插入到预览 iframe 之前
    const container = getPreviewContainer();
    if (!container) return null;
    const iframe = document.getElementById('insights-preview');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = BTN_ID;
      container.insertBefore(btn, iframe || null);
    }
    const b = btn as HTMLButtonElement;
    b.textContent = '查看生成过程';
    b.style.margin = '6px 0';
    b.style.marginRight = '8px';
    b.style.padding = '6px 10px';
    b.style.fontSize = '12px';
    b.style.background = '#2563eb';
    b.style.border = '1px solid #1d4ed8';
    b.style.color = '#fff';
    b.style.borderRadius = '4px';
    b.style.cursor = 'pointer';
    b.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
    b.onmouseenter = () => { b.style.background = '#1d4ed8'; };
    b.onmouseleave = () => { b.style.background = '#2563eb'; };
    return b;
  } catch {
    return null;
  }
}

// ========== 工具栏：AI 模型下拉（页面级覆盖） ==========
async function ensureModelDropdown(): Promise<HTMLDivElement | null> {
  try {
    const container = document.querySelector('.tab-section[data-tab-id="insights"] .insights-toolbar .toolbar-row.row-2 .toolbar-left') as HTMLDivElement | null;
    if (!container) return null;
    const WRAP_ID = 'insights-model-wrap';
    const STORAGE_KEY = 'insights_model_override';
    const SEP_ID = 'insights-model-sep';
    let wrap = document.getElementById(WRAP_ID) as HTMLDivElement | null;
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = WRAP_ID;
      wrap.className = 'field-inline';
      wrap.style.marginLeft = '12px';
      const lab = document.createElement('label');
      lab.htmlFor = 'insights-model-select';
      lab.textContent = 'AI模型：';
      const sel = document.createElement('select');
      sel.id = 'insights-model-select';
      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'insights-model-custom';
      input.placeholder = '输入模型ID';
      input.style.display = 'none';
      input.style.marginLeft = '6px';
      input.style.height = 'var(--ins-row2-h)';
      input.style.fontSize = 'var(--ins-row2-font)';
      wrap.appendChild(lab);
      wrap.appendChild(sel);
      wrap.appendChild(input);
      const refresh = document.createElement('button');
      refresh.id = 'insights-model-refresh';
      refresh.textContent = '刷新模型';
      refresh.style.marginLeft = '6px';
      refresh.style.height = 'var(--ins-row2-h)';
      refresh.style.fontSize = 'var(--ins-row2-font)';
      refresh.style.padding = '0 10px';
      refresh.style.border = '1px solid #e2e8f0';
      refresh.style.background = '#f8fafc';
      refresh.style.color = '#334155';
      refresh.style.borderRadius = 'var(--ins-row2-radius)';
      refresh.onclick = async () => {
        try {
          const cfg = aiService.getSettings();
          if (!cfg.enabled) { setModelErrorBanner('AI 未启用，无法刷新模型'); try { showMessage('AI 未启用，无法刷新模型', 'error'); } catch {} return; }
          clearModelErrorBanner();
          const old = refresh.textContent || '';
          refresh.disabled = true;
          refresh.textContent = '刷新中…';
          try {
            await aiService.getAvailableModels(true);
            await ensureModelDropdown();
            clearModelErrorBanner();
            try { showMessage('模型列表已刷新', 'success'); } catch {}
          } catch (err) {
            let m = '';
            try { m = err instanceof Error ? err.message : String(err || ''); } catch {}
            setModelErrorBanner(`AI 模型列表加载失败：${m || '请检查设置或网络'}`);
            try { showMessage(`模型列表刷新失败：${m || '请检查设置或网络'}`, 'error'); } catch {}
          } finally {
            refresh.disabled = false;
            refresh.textContent = old || '刷新模型';
          }
        } catch {}
      };
      wrap.appendChild(refresh);
      // 插在时间范围后、生成按钮前
      const genBtn = document.getElementById('insights-generate');
      // 分隔符：日期与模型之间
      let sep = document.getElementById(SEP_ID) as HTMLSpanElement | null;
      if (!sep) {
        sep = document.createElement('span');
        sep.id = SEP_ID;
        sep.className = 'dot-sep';
        sep.textContent = '·';
      }
      const rangeGroup = container.querySelector('.field-inline');
      if (genBtn && genBtn.parentElement === container) {
        if (rangeGroup) {
          container.insertBefore(sep, genBtn);
          container.insertBefore(wrap, genBtn);
        } else {
          container.insertBefore(wrap, genBtn);
        }
      } else {
        if (rangeGroup) {
          container.appendChild(sep);
          container.appendChild(wrap);
        } else {
          container.appendChild(wrap);
        }
      }
      // 事件：选择即更新页面覆盖
      sel.onchange = () => {
        const v = sel.value || '';
        if (v === '__custom__') {
          input.style.display = '';
          input.focus();
          const cur = (input.value || '').trim();
          pageModelOverride = cur ? cur : undefined;
          try { if (cur) sessionStorage.setItem(STORAGE_KEY, cur); else sessionStorage.removeItem(STORAGE_KEY); } catch {}
        } else {
          input.style.display = 'none';
          pageModelOverride = v ? v : undefined;
          try { if (v) sessionStorage.setItem(STORAGE_KEY, v); else sessionStorage.removeItem(STORAGE_KEY); } catch {}
        }
      };
      input.oninput = () => {
        const cur = (input.value || '').trim();
        pageModelOverride = cur ? cur : undefined;
        try { if (cur) sessionStorage.setItem(STORAGE_KEY, cur); else sessionStorage.removeItem(STORAGE_KEY); } catch {}
      };
    }
    // 填充选项
    const sel = document.getElementById('insights-model-select') as HTMLSelectElement | null;
    const input = document.getElementById('insights-model-custom') as HTMLInputElement | null;
    const refreshEl = document.getElementById('insights-model-refresh') as HTMLButtonElement | null;
    if (sel) {
      sel.innerHTML = '';
      const aiCfg = aiService.getSettings();
      const follow = document.createElement('option');
      follow.value = '';
      follow.textContent = aiCfg.selectedModel ? `跟随全局（${aiCfg.selectedModel}）` : '跟随全局（未选择）';
      sel.appendChild(follow);
      if (aiCfg.enabled) {
        try {
          clearModelErrorBanner();
          const models = await aiService.getAvailableModels();
          for (const m of (models || [])) {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.name ? `${m.name} (${m.id})` : m.id;
            sel.appendChild(opt);
          }
        } catch (err) {
          let m = '';
          try { m = err instanceof Error ? err.message : String(err || ''); } catch {}
          setModelErrorBanner(`AI 模型列表加载失败：${m || '请检查设置或网络'}`);
        }
      } else {
        clearModelErrorBanner();
      }
      const custom = document.createElement('option');
      custom.value = '__custom__';
      custom.textContent = '自定义…';
      sel.appendChild(custom);
      // 恢复：sessionStorage 记忆
      let restored = '';
      try { restored = sessionStorage.getItem(STORAGE_KEY) || ''; } catch {}
      if (restored && Array.from(sel.options).some(o => o.value === restored)) {
        sel.value = restored;
        pageModelOverride = restored;
        if (input) input.style.display = 'none';
      } else if (restored) {
        sel.value = '__custom__';
        if (input) { input.style.display = ''; input.value = restored; }
        pageModelOverride = restored;
      } else {
        // 默认：不覆盖（跟随全局）
        sel.value = '';
        pageModelOverride = undefined;
        if (input) input.style.display = 'none';
      }
      // 若全局未启用 AI，则禁用下拉但仍展示
      try { sel.disabled = !aiCfg.enabled; if (input) input.disabled = !aiCfg.enabled; if (refreshEl) refreshEl.disabled = !aiCfg.enabled; } catch {}
    }
    return wrap;
  } catch { return null; }
}

function openTraceModal(): void {
  try {
    const trace = getLastGenerationTrace();
    const OVERLAY_ID = 'insights-trace-overlay';
    let overlay = document.getElementById(OVERLAY_ID) as HTMLDivElement | null;
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = OVERLAY_ID;
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.background = 'var(--surface-overlay)';
      overlay.style.backdropFilter = 'blur(2px)';
      overlay.style.zIndex = '9999';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';

      const modal = document.createElement('div');
      modal.style.width = '860px';
      modal.style.maxWidth = '95%';
      modal.style.maxHeight = '85%';
      modal.style.overflow = 'auto';
      modal.style.background = 'var(--surface-primary)';
      modal.style.borderRadius = '8px';
      modal.style.boxShadow = 'var(--shadow-xl)';
      modal.style.padding = '12px 14px';
      modal.style.border = '1px solid var(--border-primary)';

      // 复制文案构建器
      const buildCopyText = (): string => {
        const fmt = (n?: number) => (typeof n === 'number' ? new Date(n).toLocaleString() : '-');
        const fmtDur = (ms?: number): string => {
          if (typeof ms !== 'number' || !isFinite(ms) || ms < 0) return '-';
          if (ms < 1000) return `${ms} ms`;
          if (ms < 60_000) return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)} s`;
          if (ms < 3_600_000) {
            const m = Math.floor(ms / 60_000);
            const s = Math.round((ms % 60_000) / 1000);
            return `${m}m ${s}s`;
          }
          const h = Math.floor(ms / 3_600_000);
          const m = Math.round((ms % 3_600_000) / 60_000);
          return `${h}h ${m}m`;
        };
        if (!trace) return '暂无生成过程';
        const lines: string[] = [];
        const duration = (trace.endedAt && trace.startedAt) ? (trace.endedAt - trace.startedAt) : undefined;
        lines.push('本次生成过程');
        lines.push(`开始时间：${fmt(trace.startedAt)}`);
        lines.push(`结束时间：${fmt(trace.endedAt)}`);
        lines.push(`耗时：${fmtDur(duration)}`);
        lines.push(`状态：${trace.status || '-'}`);
        lines.push('');
        lines.push('上下文');
        try { lines.push(JSON.stringify(trace.context || {}, null, 2)); } catch { lines.push(String(trace.context || {})); }
        lines.push('');
        lines.push('摘要');
        try { lines.push(JSON.stringify(trace.summary || {}, null, 2)); } catch { lines.push(String(trace.summary || {})); }
        lines.push('');
        lines.push('步骤');
        try {
          const entries = Array.isArray(trace.entries) ? trace.entries : [];
          for (const e of entries) {
            lines.push(`${fmt(e.time)} [${(e.level||'').toUpperCase()}][${e.tag}] ${e.message || ''}`);
            if (e.data) {
              try { lines.push(JSON.stringify(e.data, null, 2)); } catch { lines.push(String(e.data)); }
            }
          }
        } catch {}
        return lines.join('\n');
      };

      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.justifyContent = 'space-between';
      header.style.marginBottom = '10px';
      header.style.position = 'sticky';
      header.style.top = '0';
      header.style.zIndex = '10';
      header.style.background = 'var(--surface-primary)';
      header.style.padding = '10px 0 12px 0';
      header.style.boxShadow = 'var(--shadow-sm)';
      header.style.minHeight = '36px';
      header.style.paddingRight = '120px';
      header.style.borderBottom = '1px solid var(--border-primary)';
      const titleWrap = document.createElement('div');
      titleWrap.style.display = 'flex';
      titleWrap.style.alignItems = 'center';
      titleWrap.style.gap = '8px';
      const title = document.createElement('div');
      title.textContent = '本次生成过程';
      title.style.fontWeight = '700';
      title.style.color = 'var(--text-primary)';
      const status = (trace?.status || '-').toLowerCase();
      const badge = document.createElement('span');
      const badgeCfg: Record<string, {bg: string;color: string;border: string;label: string}> = {
        success: { bg: '#dcfce7', color: '#166534', border: '#86efac', label: 'success' },
        fallback: { bg: '#fef3c7', color: '#92400e', border: '#fde68a', label: 'fallback' },
        error: { bg: '#fee2e2', color: '#991b1b', border: '#fecaca', label: 'error' },
        '-': { bg: '#e2e8f0', color: '#334155', border: '#cbd5e1', label: '-' }
      };
      const bc = badgeCfg[status] || badgeCfg['-'];
      badge.textContent = bc.label;
      badge.style.padding = '2px 8px';
      badge.style.borderRadius = '999px';
      badge.style.fontSize = '11px';
      badge.style.background = bc.bg;
      badge.style.color = bc.color;
      badge.style.border = `1px solid ${bc.border}`;
      titleWrap.appendChild(title);
      titleWrap.appendChild(badge);
      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.alignItems = 'center';
      actions.style.gap = '8px';
      // 固定到右上角
      actions.style.position = 'absolute';
      actions.style.right = '8px';
      actions.style.top = '8px';

      const copyBtn = document.createElement('button');
      copyBtn.textContent = '复制';
      copyBtn.style.padding = '4px 10px';
      copyBtn.style.fontSize = '12px';
      copyBtn.style.background = 'var(--primary)';
      copyBtn.style.border = '1px solid var(--primary-hover)';
      copyBtn.style.color = 'var(--text-inverse)';
      copyBtn.style.borderRadius = '4px';
      copyBtn.onclick = async () => {
        const text = buildCopyText();
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
          } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-1000px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
          }
          const old = copyBtn.textContent;
          copyBtn.textContent = '已复制';
          setTimeout(() => { copyBtn.textContent = old || '复制'; }, 1200);
        } catch {}
      };

      const close = document.createElement('button');
      close.textContent = '关闭';
      close.style.padding = '4px 10px';
      close.style.fontSize = '12px';
      close.style.background = 'var(--surface-secondary)';
      close.style.border = '1px solid var(--border-primary)';
      close.style.color = 'var(--text-primary)';
      close.style.borderRadius = '4px';
      close.onclick = () => overlay?.remove();

      actions.appendChild(copyBtn);
      actions.appendChild(close);
      // 先放标题组，再放右上角操作
      header.appendChild(titleWrap);
      header.appendChild(actions);
      // 动态保证头部高度 >= 操作区高度（防止按钮比白底高）
      try {
        const h = Math.max(36, actions.offsetHeight + 12);
        header.style.minHeight = h + 'px';
      } catch {}

      const body = document.createElement('div');
      body.style.fontSize = '12px';
      body.style.color = 'var(--text-primary)';
      body.style.paddingTop = '4px';
      body.style.display = 'block';

      const fmt = (n?: number) => (typeof n === 'number' ? new Date(n).toLocaleString() : '-');
      const fmtDur = (ms?: number): string => {
        if (typeof ms !== 'number' || !isFinite(ms) || ms < 0) return '-';
        if (ms < 1000) return `${ms} ms`;
        if (ms < 60_000) return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)} s`;
        if (ms < 3_600_000) {
          const m = Math.floor(ms / 60_000);
          const s = Math.round((ms % 60_000) / 1000);
          return `${m}m ${s}s`;
        }
        const h = Math.floor(ms / 3_600_000);
        const m = Math.round((ms % 3_600_000) / 60_000);
        return `${h}h ${m}m`;
      };
      const pre = (obj: any) => `<pre style="white-space:pre-wrap;word-break:break-word;background:#0f172a;color:#e2e8f0;border:1px solid #1f2937;border-radius:8px;padding:10px 12px;overflow:auto;">${
        (()=>{ try { return JSON.stringify(obj, null, 2); } catch { return String(obj); } })()
      }</pre>`;
      const prePlain = (s: string) => `<pre style="white-space:pre-wrap;word-break:break-word;background:#0f172a;color:#e2e8f0;border:1px solid #1f2937;border-radius:8px;padding:10px 12px;overflow:auto;">${
        String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'} as any)[c] || c)
      }</pre>`;
      const card = (title: string, content: string) => `
        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;margin-bottom:12px;background:#ffffff;">
          <div style="font-weight:600;color:#0f172a;margin-bottom:6px;">${title}</div>
          ${content}
        </div>`;

      if (!trace) {
        body.innerHTML = '<div style="color:#999;">暂无生成过程，请先点击“生成报告”。</div>';
      } else {
        const duration = (trace.endedAt && trace.startedAt) ? (trace.endedAt - trace.startedAt) : undefined;
        const ctx = trace.context || {};
        const baseInfo = `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div><b>开始时间</b>：${fmt(trace.startedAt)}</div>
            <div><b>结束时间</b>：${fmt(trace.endedAt)}</div>
            <div><b>耗时</b>：${fmtDur(duration)}</div>
            <div><b>状态</b>：${trace.status || '-'}</div>
            <div><b>请求地址</b>：${ctx.apiUrl || '-'}</div>
            <div><b>接口</b>：${ctx.endpoint || '-'}</div>
            <div><b>模型</b>：${ctx.model || '-'}</div>
            <div><b>温度</b>：${typeof ctx.temperature === 'number' ? ctx.temperature : '-'}</div>
            <div><b>最大Tokens</b>：${typeof ctx.maxTokens === 'number' ? ctx.maxTokens : '-'}</div>
            <div><b>超时(s)</b>：${typeof ctx.timeout_s === 'number' ? ctx.timeout_s : '-'}</div>
            <div><b>重试策略</b>：
              ${(ctx.autoRetryEmpty?`空重试开(${ctx.autoRetryMax??'-'})`:'空重试关')} / 
              ${(ctx.errorRetryEnabled?`错重试开(${ctx.errorRetryMax??'-'})`:'错重试关')}
            </div>
          </div>`;
        // 步骤：附带耗时（相对上一步与相对开始）
        const rawEntries = Array.isArray(trace.entries) ? trace.entries : [];
        const tStart = typeof trace.startedAt === 'number' ? trace.startedAt : (rawEntries[0]?.time || 0);
        const fullDur = (typeof trace.startedAt === 'number' && typeof trace.endedAt === 'number')
          ? (trace.endedAt - trace.startedAt)
          : (rawEntries.length ? (Math.max(0, (rawEntries[rawEntries.length - 1]?.time || 0) - tStart)) : 0);

        // 注入“AI请求中”虚拟步骤（覆盖 dt 为 callStart→callEnd 的等待时长）
        const entries: any[] = [...rawEntries];
        try {
          const aiStart = rawEntries.find((x: any) => x?.tag === 'AI' && x?.message === 'callStart');
          const aiEnd = rawEntries.find((x: any) => x?.tag === 'AI' && x?.message === 'callEnd');
          if (aiStart?.time && aiEnd?.time && aiEnd.time > aiStart.time) {
            const waitMs = aiEnd.time - aiStart.time;
            const insertAt = Math.max(0, entries.indexOf(aiEnd));
            entries.splice(insertAt, 0, { time: aiEnd.time, level: 'info', tag: 'AI', message: 'AI请求中', data: { virtual: true, waitMs }, __dt: waitMs });
          }
        } catch {}

        let prevT = tStart;
        const stepBlocks: string[] = [];
        for (const e of entries as any[]) {
          const dt = typeof (e as any).__dt === 'number'
            ? (e as any).__dt
            : (typeof e.time === 'number' ? (e.time - prevT) : 0);
          const tot = typeof e.time === 'number' ? (e.time - tStart) : 0;
          prevT = typeof e.time === 'number' ? e.time : prevT;
          const color = e.level==='error'?'#ef4444':(e.level==='warn'?'#f59e0b':'#3b82f6');
          // 进度条改为“单步耗时占比”，并设置最小可见宽度1%
          const barPct = fullDur > 0 ? Math.min(100, Math.max((dt > 0 ? 1 : 0), Math.round((dt / fullDur) * 100))) : 0;
          stepBlocks.push(`
            <div style="border-left:3px solid ${color}; padding-left:8px; margin:8px 0;">
              <div style="display:flex; flex-wrap:wrap; gap:8px; color:#475569; align-items:center;">
                <span style="min-width:160px;">${fmt(e.time)}</span>
                <span>[${(e.level||'').toUpperCase()}][${e.tag}] ${e.message || ''}</span>
                <span style="margin-left:auto; color:#64748b; font-size:11px;">+${fmtDur(dt)} / 总 ${fmtDur(tot)}</span>
              </div>
              <div style="height:6px; background:#e2e8f0; border-radius:999px; overflow:hidden; margin-top:6px;">
                <div style="width:${barPct}%; height:100%; background:${color};"></div>
              </div>
              <div style="display:flex; gap:8px; color:#64748b; font-size:11px; margin-top:4px;">
                <span>区间：${tStart ? fmt(prevT - dt) : '-'} → ${fmt(e.time)}（${fmtDur(dt)}）</span>
                <span style="margin-left:auto;">累计：${fmtDur(tot)} / ${fmtDur(fullDur)}</span>
              </div>
              ${ e.data ? pre(e.data) : '' }
            </div>
          `);
        }
        const stepsHtml = stepBlocks.length ? stepBlocks.join('') : '<div style="color:#999;">无步骤</div>';
        const nonStreamNote = (ctx && ctx.streamEnabled === false)
          ? '<div style="color:#64748b;font-size:11px;margin-bottom:6px;">本次为非流式调用，等待阶段不产生中间步骤</div>'
          : '';

        // 提示词：展示最近一次 PROMPT/messages 的内容
        let promptHtml = '';
        try {
          const p = [...entries].reverse().find(x => x?.tag === 'PROMPT' && x?.message === 'messages' && x?.data?.messages);
          if (p && Array.isArray(p.data?.messages)) {
            const msgs = p.data.messages as Array<{ role: string; content: string }>;
            const text = msgs.map((m, i) => `#${i+1} [${m.role}]\n${String(m.content||'').slice(0, 2000)}`).join('\n\n');
            promptHtml = card('提示词', prePlain(text));
          }
        } catch {}

        // AI 耗时：来自 AI/callEnd
        let aiCost = '';
        try {
          const aiEnd = entries.find(x => x?.tag === 'AI' && x?.message === 'callEnd');
          const ms = aiEnd?.data?.elapsedMs;
          if (typeof ms === 'number') aiCost = `<div><b>AI耗时</b>：${fmtDur(ms)}</div>`;
        } catch {}

        body.innerHTML = [
          card('基本信息', baseInfo + (aiCost||'')),
          promptHtml,
          card('上下文', pre(ctx)),
          card('步骤', nonStreamNote + stepsHtml),
          card('摘要', pre(trace.summary || {})),
        ].filter(Boolean).join('');
      }

      modal.appendChild(header);
      modal.appendChild(body);
      overlay.appendChild(modal);
      overlay.onclick = (ev) => { if (ev.target === overlay) overlay?.remove(); };
      document.body.appendChild(overlay);
    } else {
      // 已存在则刷新内容
      overlay.remove();
      openTraceModal();
      return;
    }
  } catch {}
}

function onTraceClick(): void {
  try {
    const trace = getLastGenerationTrace();
    if (!trace) {
      // 无记录：仅右下角 toast 提示，不弹出遮罩窗
      try { showMessage('暂无生成过程，请先点击“生成报告”。', 'info'); } catch {}
      return;
    }
    openTraceModal();
  } catch {
    // 兜底：静默
  }
}

function prepareForPreview(html: string): string {
  try {
    let res = html || '';
    
    // 获取当前主题
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const bgColor = isDarkMode ? '#1e293b' : '#ffffff';
    const textColor = isDarkMode ? '#f1f5f9' : '#111827';
    
    // 1) 移除全部脚本（内联与外链），避免 about:srcdoc 下 CSP 报错
    try { res = res.replace(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi, ''); } catch {}
    // 2) 确保 base 指向扩展根
    const base = chrome.runtime.getURL('') || './';
    if (/<base[^>]*>/i.test(res)) {
      res = res.replace(/<base[^>]*>/i, `<base href="${base}">`);
    } else if (/<head[^>]*>/i.test(res)) {
      res = res.replace(/<head[^>]*>/i, (m) => `${m}\n  <base href="${base}">`);
    } else {
      // 若意外缺少 head，则加一个简单的头部
      res = res.replace(/<html[^>]*>/i, (m) => `${m}\n<head><base href="${base}"></head>`);
    }
    // 2.0) 预清理：将任何显式白色字体替换为主题色，避免白底白字（仅作用于预览）
    try {
      const whiteColorRe = /color\s*:\s*(?:#fff(?:fff)?|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)|rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*(?:0?\.\d+|1)\s*\))\s*(!important)?/ig;
      res = res.replace(whiteColorRe, `color:${textColor}$1`);
    } catch {}
    // 2.0.1) 强制为 <body> 注入内联样式，并确保有唯一 root id（优先级最高）
    try {
      res = res.replace(/<body([^>]*)>/i, (m, attrs) => {
        void m;
        const styleRe = /style=("|')([\s\S]*?)\1/i;
        const m2 = attrs.match(styleRe);
        // 确保 root id 存在
        let addId = '';
        if (!/\bid\s*=/.test(attrs)) addId = ' id="__ins_preview_root__"';
        if (m2) {
          const quote = m2[1];
          let style = m2[2] || '';
          // 规范化并覆写 color/background
          if (/color\s*:/i.test(style)) style = style.replace(/color\s*:[^;]*/i, `color:${textColor} !important`);
          else style += `; color:${textColor} !important`;
          if (/background\s*:/i.test(style)) style = style.replace(/background\s*:[^;]*/i, `background:${bgColor} !important`);
          else style += `; background:${bgColor} !important`;
          attrs = attrs.replace(styleRe, `style=${quote}${style}${quote}`);
          return `<body${attrs}${addId}>`;
        } else {
          return `<body${attrs}${addId} style="background:${bgColor} !important; color:${textColor} !important">`;
        }
      });
    } catch {}
    // 2.0.2) 进一步清理：移除任意元素内联的 color 声明并统一为主题色（防止 inline !important 覆盖）
    try {
      res = res.replace(/style=("|')([\s\S]*?)\1/ig, (all, q, style) => {
        void all;
        let s = String(style || '');
        // 删除所有 color 与 -webkit-text-fill-color（不影响 border-color/outline-color 等）
        s = s.replace(/(^|;)\s*color\s*:\s*[^;]*;?/ig, (m0, p1) => { void m0; return (p1 || ''); });
        s = s.replace(/(^|;)\s*-webkit-text-fill-color\s*:\s*[^;]*;?/ig, (m0, p1) => { void m0; return (p1 || ''); });
        // 收敛多余分号
        s = s.replace(/;;+/g, ';').replace(/^\s*;|;\s*$/g, '');
        // 重新追加主题色字体
        const sep = s ? '; ' : '';
        return `style=${q}${s}${sep}color:${textColor} !important; -webkit-text-fill-color:${textColor} !important${q}`;
      });
    } catch {}
    // 2.1) 注入兜底样式，强制使用主题色，避免出现白底白字
    try {
      const hasFallback = /insights-preview-fallback/i.test(res);
      // 免责声明的主题颜色
      const noticeColors = isDarkMode 
        ? { bg: '#422006', border: '#78350f', text: '#fef3c7' }  // 深色模式：深棕背景，浅黄文字
        : { bg: '#fff7ed', border: '#fdba74', text: '#92400e' }; // 浅色模式：浅橙背景，深棕文字
      const fallback = `\n<style id="insights-preview-fallback">\n  #__ins_preview_root__, #__ins_preview_root__ *:not(svg):not(path):not(canvas) { color:${textColor} !important; -webkit-text-fill-color:${textColor} !important; filter: none !important; mix-blend-mode: normal !important; }\n  #__ins_preview_root__ { background:${bgColor} !important; }\n  /* 免责声明主题适配 */\n  .notice { background: ${noticeColors.bg} !important; border-color: ${noticeColors.border} !important; color: ${noticeColors.text} !important; }\n  .notice * { color: ${noticeColors.text} !important; }\n  /* 其他补充覆盖 */\n  body, p, div, span, li, td, th, small, strong, em, code, pre, blockquote { color:${textColor} !important; }\n  :where(body *) :where(*):not(svg):not(path):not(canvas) { color:${textColor} !important; }\n  .text-white, .text-light, [class*="text-white"] { color:${textColor} !important; }\n  [style*="color:#fff"], [style*="color: #fff"], [style*="color:#ffffff"], [style*="color: #ffffff"], [style*="color:white"], [style*="color: white"], [style*="color:rgb(255,255,255)"], [style*="color: rgb(255, 255, 255)"], [style*="color:rgba(255,255,255"], [style*="color: rgba(255, 255, 255"] { color:${textColor} !important; }\n</style>`;
      if (!hasFallback) {
        if (/<\/body>/i.test(res)) {
          res = res.replace(/<\/body>/i, (m) => `${fallback}\n${m}`);
        } else if (/<\/head>/i.test(res)) {
          res = res.replace(/<\/head>/i, (m) => `${fallback}\n${m}`);
        } else if (/<head[^>]*>/i.test(res)) {
          res = res.replace(/<head[^>]*>/i, (m) => `${m}\n  ${fallback}`);
        } else {
          res = res.replace(/<html[^>]*>/i, (m) => `${m}\n<head>${fallback}</head>`);
        }
      }
    } catch {}
    // 3) 不注入任何脚本，保持纯静态预览（图表在导出 HTML 或外部页展示）
    try {
      const needData = /id=["']insights-data["']/i.test(res);
      const hasE = /echarts(\.min)?\.js/i.test(res);
      const hasR = /insights-runtime\.js/i.test(res);
      if (needData && (!hasE || !hasR)) {
        const scripts = [
          !hasE ? '<script src="assets/templates/echarts.min.js"></script>' : '',
          !hasR ? '<script src="assets/templates/insights-runtime.js"></script>' : '',
        ].filter(Boolean).join('\n  ');
        if (/<\/body>/i.test(res)) {
          res = res.replace(/<\/body>/i, (m) => `  ${scripts}\n${m}`);
        } else {
          res += `\n  ${scripts}\n`;
        }
      }
    } catch {}
    return res;
  } catch {
    return html;
  }
}

async function loadTemplate(): Promise<string> {
  try {
    const url = chrome.runtime.getURL('assets/templates/insights-report.html');
    const res = await fetch(url);
    return await res.text();
  } catch {
    return '<!doctype html><html><head><meta charset="utf-8"/></head><body><p>模板加载失败</p></body></html>';
  }
}

// 分页读取番号库（避免一次性全量加载内存暴涨）
async function fetchAllVideoRecordsPaged(pageSize = 500): Promise<VideoRecord[]> {
  const items: VideoRecord[] = [];
  let offset = 0;
  while (true) {
    const { items: page, total } = await dbViewedPage({ offset, limit: pageSize, orderBy: 'updatedAt', order: 'desc' });
    const len = Array.isArray(page) ? page.length : 0;
    if (!len) break;
    items.push(...page);
    offset += len;
    if (items.length >= (total || 0)) break;
    if (len < pageSize) break;
  }
  return items;
}

// ========== 生成过程 UI：加载动画与状态提示 ==========
function ensureLoadingStyles(): void {
  const SID = 'insights-loading-style';
  if (document.getElementById(SID)) return;
  const style = document.createElement('style');
  style.id = SID;
  style.textContent = `
  @keyframes insights-spin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);
}

function setActionsDisabled(disabled: boolean): void {
  try {
    const ids = [
      'insights-generate',
      'insights-export',
      'insights-export-json',
      'insights-refresh-history',
      'insights-delete-selected',
      'insights-preview-save',
      'insights-preview-copy'
    ];
    for (const id of ids) {
      const btn = document.getElementById(id) as HTMLButtonElement | null;
      if (btn) btn.disabled = disabled;
    }
  } catch {}
}

function getPreviewContainer(): HTMLElement | null {
  const iframe = document.getElementById('insights-preview');
  if (!iframe) return null;
  const container = iframe.parentElement as HTMLElement | null;
  if (container) {
    const cs = getComputedStyle(container);
    if (cs.position === 'static') container.style.position = 'relative';
  }
  return container;
}

// 在预览框右上角放置复制 HTML 按钮
function ensurePreviewCopyButton(): HTMLDivElement | null {
  try {
    const container = getPreviewContainer();
    if (!container) return null;
    const WRAP_ID = 'insights-preview-actions';
    let wrap = document.getElementById(WRAP_ID) as HTMLDivElement | null;
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = WRAP_ID;
      try {
        wrap.style.position = 'absolute';
        wrap.style.right = '8px';
        wrap.style.top = '8px';
        wrap.style.zIndex = '6';
        wrap.style.display = 'flex';
        wrap.style.gap = '8px';
      } catch {}
      container.appendChild(wrap);
    }

    // 依据 iframe 顶部位置放置动作容器，避免与标题重叠
    try {
      const iframe = document.getElementById('insights-preview') as HTMLIFrameElement | null;
      if (iframe && wrap) {
        const top = (iframe.offsetTop || 0) + 8;
        wrap.style.top = top + 'px';
      }
      // 监听窗口尺寸变化，动态修正位置
      const REPOS_KEY = '__insights_preview_actions_repos__';
      const anyWrap = wrap as any;
      if (!anyWrap[REPOS_KEY]) {
        const onResize = () => {
          const iframe = document.getElementById('insights-preview') as HTMLIFrameElement | null;
          if (!iframe || !wrap) return;
          wrap.style.top = ((iframe.offsetTop || 0) + 8) + 'px';
        };
        window.addEventListener('resize', onResize);
        anyWrap[REPOS_KEY] = true;
      }
    } catch {}

    // 复制按钮（胶囊造型）
    const COPY_ID = 'insights-preview-copy';
    let copyBtn = document.getElementById(COPY_ID) as HTMLButtonElement | null;
    if (!copyBtn) {
      copyBtn = document.createElement('button');
      copyBtn.id = COPY_ID;
      copyBtn.className = 'preview-copy-btn';
      copyBtn.title = '复制预览HTML';
      copyBtn.innerHTML = '<i class="fas fa-copy"></i>&nbsp;复制预览';
      try {
        copyBtn.style.padding = '6px 10px';
        copyBtn.style.borderRadius = '999px';
        copyBtn.style.background = '#fff';
        copyBtn.style.border = '1px solid #e5e7eb';
        copyBtn.style.color = '#334155';
        copyBtn.style.display = 'flex';
        copyBtn.style.alignItems = 'center';
        copyBtn.style.justifyContent = 'center';
        copyBtn.style.boxShadow = '0 1px 2px rgba(0,0,0,0.06)';
        copyBtn.style.cursor = 'pointer';
        copyBtn.style.fontSize = '12px';
      } catch {}
      copyBtn.addEventListener('click', copyPreviewHtml);
      wrap.appendChild(copyBtn);
    }

    // 保存按钮（生成后可用）
    const SAVE_ID = 'insights-preview-save';
    let saveBtn = document.getElementById(SAVE_ID) as HTMLButtonElement | null;
    if (!saveBtn) {
      saveBtn = document.createElement('button');
      saveBtn.id = SAVE_ID;
      saveBtn.className = 'preview-save-btn';
      saveBtn.title = '保存为月报';
      saveBtn.innerHTML = '<i class="fas fa-save"></i>&nbsp;保存为月报';
      try {
        saveBtn.style.padding = '6px 10px';
        saveBtn.style.borderRadius = '999px';
        saveBtn.style.background = '#2563eb';
        saveBtn.style.border = '1px solid #1d4ed8';
        saveBtn.style.color = '#fff';
        saveBtn.style.display = 'flex';
        saveBtn.style.alignItems = 'center';
        saveBtn.style.justifyContent = 'center';
        saveBtn.style.boxShadow = '0 1px 2px rgba(0,0,0,0.06)';
        saveBtn.style.cursor = 'pointer';
        saveBtn.style.fontSize = '12px';
        saveBtn.style.opacity = canSaveReport ? '1' : '0.6';
      } catch {}
      saveBtn.onclick = () => { if (canSaveReport) insightsTab.saveCurrentAsMonthly(); };
      wrap.appendChild(saveBtn);
    }
    // 每次调用时同步禁用态
    try {
      const btn = document.getElementById(SAVE_ID) as HTMLButtonElement | null;
      if (btn) {
        (btn as HTMLButtonElement).disabled = !canSaveReport;
        btn.style.opacity = canSaveReport ? '1' : '0.6';
        btn.style.cursor = canSaveReport ? 'pointer' : 'not-allowed';
      }
    } catch {}

    return wrap;
  } catch {
    return null;
  }
}

async function copyPreviewHtml() {
  try {
    const iframe = getEl<HTMLIFrameElement>('insights-preview');
    if (!iframe) return;
    const html = iframe.srcdoc || '';
    if (!html) { try { showMessage('暂无预览内容可复制', 'info'); } catch {} return; }
    // 内联依赖，便于外部粘贴复现
    let finalHtml = await inlineAssets(html);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(finalHtml);
      } else {
        const ta = document.createElement('textarea');
        ta.value = finalHtml;
        ta.style.position = 'fixed';
        ta.style.left = '-1000px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      try { showMessage('预览HTML已复制', 'info'); } catch {}
    } catch (e) {
      try { showMessage('复制失败：' + ((e as any)?.message || e), 'error'); } catch {}
    }
  } catch {}
}

function showLoading(show: boolean): void {
  try {
    const container = getPreviewContainer();
    if (!container) return;
    ensureLoadingStyles();

    const OID = 'insights-loading-overlay';
    let overlay = document.getElementById(OID) as HTMLDivElement | null;

    if (show) {
      setActionsDisabled(true);
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = OID;
        overlay.style.position = 'absolute';
        overlay.style.inset = '0';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.background = 'rgba(255,255,255,0.6)';
        overlay.style.backdropFilter = 'blur(1px)';
        overlay.style.zIndex = '5';
        overlay.innerHTML = `
          <div style="display:flex; align-items:center; gap:10px; color:#334155; font-size:14px;">
            <div style="width:28px; height:28px; border:3px solid #cbd5e1; border-top-color:#3b82f6; border-radius:50%; animation: insights-spin 0.9s linear infinite;"></div>
            <span>生成中…</span>
          </div>
        `;
        container.appendChild(overlay);
      } else {
        overlay.style.display = 'flex';
      }
    } else {
      setActionsDisabled(false);
      if (overlay) overlay.style.display = 'none';
    }
  } catch {}
}

function showStatus(message: string, kind: 'info' | 'error' = 'info'): void {
  try {
    const container = getPreviewContainer();
    if (!container) return;
    const SID = 'insights-status';
    let bar = document.getElementById(SID) as HTMLDivElement | null;
    if (!bar) {
      bar = document.createElement('div');
      bar.id = SID;
      bar.style.margin = '6px 0';
      bar.style.padding = '8px 10px';
      bar.style.borderRadius = '6px';
      bar.style.fontSize = '12px';
      // 插入到 iframe 之前
      const iframe = document.getElementById('insights-preview');
      container.insertBefore(bar, iframe || null);
    }
    if (kind === 'error') {
      bar.style.background = '#fef2f2';
      bar.style.color = '#991b1b';
      bar.style.border = '1px solid #fecaca';
    } else {
      bar.style.background = '#eff6ff';
      bar.style.color = '#1e3a8a';
      bar.style.border = '1px solid #bfdbfe';
    }
    bar.textContent = message;
    bar.style.display = 'block';
  } catch {}
}

function clearStatus(): void {
  const bar = document.getElementById('insights-status') as HTMLDivElement | null;
  if (bar) bar.style.display = 'none';
}

function download(filename: string, content: string, mime = 'text/html;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function previewSample() {
  const iframe = getEl<HTMLIFrameElement>('insights-preview');
  if (!iframe) return;
  const now = new Date();
  const fields = {
    reportTitle: '我的观影标签月报（示例）',
    periodText: '统计范围：示例',
    summary: '这里将展示由 AI 生成的摘要文本示例占位。',
    insightList: '<li>示例洞察 A</li><li>示例洞察 B</li>',
    methodology: '仅演示用途，真实报告会根据本地统计与模板填充。',
    disclaimerHTML: '<b>免责声明</b>：本报告仅用于个人研究与学术讨论。<br/>涉及“成人/色情”相关标签的统计仅为客观数据分析，不构成鼓励或引导。<br/>报告严格面向成年语境，不涉及未成年人或非法情境；如发现不当内容请立即停止并删除。<br/>可在设置中关闭相关分析或隐藏敏感内容。',
    generatedAt: now.toLocaleString(),
    version: '0.0.1',
    baseHref: chrome.runtime.getURL('') || './',
    statsJSON: '{}',
  } as Record<string, string>;
  const tpl = await loadTemplate();
  const html = renderTemplate({ templateHTML: tpl, fields });
  currentPreviewRawHTML = html; // 保存原始 HTML
  iframe.srcdoc = prepareForPreview(html);
  // 示例预览不允许保存
  canSaveReport = false;
  try { ensurePreviewCopyButton(); } catch {}
  try {
    const grid = document.querySelector('.tab-section[data-tab-id="insights"] .insights-grid') as HTMLElement | null;
    if (grid) grid.style.gridTemplateColumns = '0.9fr 1.5fr';
  } catch {}
}

async function handleGenerate() {
  showLoading(true);
  clearStatus();
  const startEl = getEl<HTMLInputElement>('insights-month-start');
  const endEl = getEl<HTMLInputElement>('insights-month-end');
  const startMonthStr = (startEl?.value || '').trim();
  const endMonthStr = (endEl?.value || '').trim();
  try {
    if (!startMonthStr || !endMonthStr) { await previewSample(); return; }
    // 若开始>结束，自动对调
    let sStr0 = startMonthStr;
    let eStr0 = endMonthStr;
    if (sStr0 > eStr0) { const tmp = sStr0; sStr0 = eStr0; eStr0 = tmp; }
    const [sy, sm] = sStr0.split('-');
    const [ey, em] = eStr0.split('-');
    const startDate = new Date(Number(sy), Number(sm) - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(Number(ey), Number(em), 0, 23, 59, 59, 999);
    const start = `${startDate.getFullYear()}-${String(startDate.getMonth()+1).padStart(2,'0')}-01`;
    const end = `${endDate.getFullYear()}-${String(endDate.getMonth()+1).padStart(2,'0')}-${String(endDate.getDate()).padStart(2,'0')}`;
    // 如当月月报已存在，则在“生成”前提示风险并确认（仅预览，不会覆盖保存）
    try {
      const periodKey = `${sStr0}~${eStr0}`;
      const exists = await dbInsReportsGet(periodKey);
      if (exists) {
        const ok = await confirmDialog({
          title: '确认生成（已存在同范围报告）',
          message: '该时间范围的报告已存在。继续将仅在右侧生成“预览”，不会自动覆盖已保存的报告；如需覆盖，请在“保存为月报”时再确认。',
          okText: '继续仅预览',
          cancelText: '取消'
        });
        if (!ok) { return; }
      }
    } catch {}
    // 1) 读取设置与当月/上月 views（用于视图口径与回退）
    const settings = await getSettings();
    const ins = settings?.insights || {};
    const days = await dbInsViewsRange(start, end);
    // 计算等长的上一周期（用于 views 变化对比）
    const dayMs = 24 * 60 * 60 * 1000;
    const rangeDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / dayMs) + 1);
    const prevEndDate = new Date(startDate.getTime() - dayMs);
    const prevStartDate = new Date(prevEndDate.getTime() - (rangeDays - 1) * dayMs);
    const prevStart = `${prevStartDate.getFullYear()}-${String(prevStartDate.getMonth()+1).padStart(2,'0')}-${String(prevStartDate.getDate()).padStart(2,'0')}`;
    const prevEnd = `${prevEndDate.getFullYear()}-${String(prevEndDate.getMonth()+1).padStart(2,'0')}-${String(prevEndDate.getDate()).padStart(2,'0')}`;
    const prevDays = await dbInsViewsRange(prevStart, prevEnd);

    // 2) 根据数据源模式聚合统计（compare/auto 支持样本量不足回退）
    const source: 'views' | 'compare' | 'auto' = (ins.source as any) || 'auto';
    const statusScope = String((ins.statusScope as any) || 'viewed_browsed');
    const startMs = startDate.getTime();
    const endMs = endDate.getTime();
    let stats: ReturnType<typeof aggregateMonthly> | ReturnType<typeof aggregateCompareFromRecords>['stats'];
    let modeUsed: 'views' | 'compare' | 'views-fallback' = 'views';
    let baselineCount = 0, newCount = 0;
    if (source === 'views') {
      stats = aggregateMonthly(days, {
        topN: ins.topN ?? 10,
        previousDays: prevDays,
        changeThresholdRatio: ins.changeThresholdRatio,
        minTagCount: ins.minTagCount,
        risingLimit: ins.risingLimit,
        fallingLimit: ins.fallingLimit,
      });
      modeUsed = 'views';
    } else {
      const all = await fetchAllVideoRecordsPaged(800);
      const ret = aggregateCompareFromRecords(all, startMs, endMs, {
        topN: ins.topN ?? 10,
        changeThresholdRatio: ins.changeThresholdRatio,
        minTagCount: ins.minTagCount,
        risingLimit: ins.risingLimit,
        fallingLimit: ins.fallingLimit,
        statusScope: statusScope as any,
      });
      stats = ret.stats;
      baselineCount = ret.baselineCount;
      newCount = ret.newCount;
      const minSamples = Number(ins.minMonthlySamples ?? 10);
      if (source === 'auto' && newCount < minSamples) {
        // 回退到 views 口径
        stats = aggregateMonthly(days, {
          topN: ins.topN ?? 10,
          previousDays: prevDays,
          changeThresholdRatio: ins.changeThresholdRatio,
          minTagCount: ins.minTagCount,
          risingLimit: ins.risingLimit,
          fallingLimit: ins.fallingLimit,
        });
        modeUsed = 'views-fallback';
        showStatus(`compare 样本不足（${newCount} < 阈值 ${minSamples}），已回退到“观看日表”口径。`);
      } else {
        modeUsed = 'compare';
      }
      try { addTrace('info', 'COMPARE', 'mode', { modeUsed, baselineCount, newCount, thresholds: { minMonthlySamples: ins.minMonthlySamples ?? 10 } }); } catch {}
    }

    // 3) 生成 HTML（优先 AI；失败回退本地模板）
    const topBrief = (stats.tagsTop || []).slice(0, 5).map(t => `${t.name}(${t.count})`).join('、');
    const changeInsights: string[] = [];
    try {
      const ch = (stats as any)?.changes || { newTags: [], rising: [], falling: [] };
      if (Array.isArray(ch.newTags) && ch.newTags.length) changeInsights.push(`新出现标签：${ch.newTags.slice(0,5).join('、')}`);
      if (Array.isArray(ch.rising) && ch.rising.length) changeInsights.push(`明显上升：${ch.rising.slice(0,5).join('、')}`);
      if (Array.isArray(ch.falling) && ch.falling.length) changeInsights.push(`明显下降：${ch.falling.slice(0,5).join('、')}`);
    } catch {}
    const methodology = (modeUsed === 'compare')
      ? '口径：与上月对比，看看这个月新增看的内容，按标签的次数和占比来比较变化。'
      : '口径：按你的观看记录做简单统计，按天汇总后再算本月的前几名、占比和整体趋势（图表和排行由程序生成）。';
    const metrics = (stats as any)?.metrics || {};
    const top3 = typeof metrics.concentrationTop3 === 'number' && isFinite(metrics.concentrationTop3) ? (metrics.concentrationTop3 * 100).toFixed(1) + '%' : '-';
    const concWord = (typeof metrics.concentrationTop3 === 'number' && isFinite(metrics.concentrationTop3))
      ? (metrics.concentrationTop3 >= 0.6 ? '较集中' : (metrics.concentrationTop3 <= 0.4 ? '较分散' : '比较均衡'))
      : '-';
    const trend = typeof metrics.trendSlope === 'number' ? (metrics.trendSlope > 0.1 ? '上升' : (metrics.trendSlope < -0.1 ? '回落' : '平稳')) : '-';
    const risingTop = (stats as any)?.changes?.risingDetailed?.[0];
    const fallingTop = (stats as any)?.changes?.fallingDetailed?.[0];
    const styleShift = (risingTop && fallingTop)
      ? `风格变化：偏好从「${fallingTop.name}」向「${risingTop.name}」迁移（+${(Math.abs(risingTop.diffRatio || 0) * 100).toFixed(1)} 个百分点）`
      : '';
    const extraLine = (modeUsed === 'compare') ? `新增样本：${newCount}；基线样本：${baselineCount}` : `累计观看天数：${days.length} 天`;
    const insightList = [
      topBrief ? `本月偏好标签集中于：${topBrief}` : '数据量较少，暂无法判断主要偏好',
      `集中度与分散度：Top3 占比 ${top3}（结构${concWord}）`,
      `趋势：总体 ${trend}`,
      ...(styleShift ? [styleShift] : []),
      extraLine,
      ...changeInsights,
    ].map(s => `<li>${s}</li>`).join('');
    const topList: any[] = Array.isArray((stats as any)?.tagsTop) ? (stats as any).tagsTop : [];
    const totalAllNum: number = Number((stats as any)?.metrics?.totalAll) || topList.reduce((s, t) => s + (Number(t?.count) || 0), 0) || 1;
    const esc = (s: any) => String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    const pct = (r: any) => {
      const v = typeof r === 'number' && isFinite(r) ? r : (Number(r) || 0);
      return (v * 100).toFixed(1) + '%';
    };
    const rankingRows = topList.map((t, i) => {
      const ratio = (typeof t?.ratio === 'number' && isFinite(t.ratio)) ? t.ratio : ((Number(t?.count) || 0) / totalAllNum);
      return `<tr><td>${i + 1}</td><td>${esc(t?.name)}</td><td>${Number(t?.count) || 0}</td><td>${pct(ratio)}</td></tr>`;
    }).join('');
    const fields: Record<string, string> = {
      reportTitle: `我的观影标签报告`,
      periodText: `统计范围：${start} ~ ${end}`,
      summary: [
        `这个月你的口味更集中，Top3 约 ${top3}，整体${trend}。`,
        (Array.isArray((stats as any)?.changes?.newTags) && (stats as any).changes.newTags.length
          ? `也有点新鲜感：${(stats as any).changes.newTags.slice(0,3).join('、')} 出现过。`
          : '结构基本稳定，没有明显的偏好跳变。'),
        (modeUsed === 'compare'
          ? `样本不多（新增 ${newCount} / 基线 ${baselineCount}），这些判断更偏趋势参考。`
          : ''),
        '下月不妨留意前述标签的占比会不会继续上扬，看看新人是否延续热度。'
      ].filter(Boolean).join(' '),
      insightList,
      methodology,
      disclaimerHTML: '<b>免责声明</b>：本报告仅用于个人研究与学术讨论。<br/>涉及“成人/色情”相关标签的统计仅为客观数据分析，不构成鼓励或引导。<br/>报告严格面向成年语境，不涉及未成年人或非法情境；如发现不当内容请立即停止并删除。<br/>可在设置中关闭相关分析或隐藏敏感内容。',
      generatedAt: new Date().toLocaleString(),
      version: '0.0.1',
      baseHref: chrome.runtime.getURL('') || './',
      statsJSON: JSON.stringify(stats || {}),
      rankingRows,
    } as Record<string, string>;
    const tpl = await loadTemplate();
    const modelSel = getEl<HTMLSelectElement>('insights-model-select');
    const modelInput = getEl<HTMLInputElement>('insights-model-custom');
    let modelOverride: string | undefined;
    if (modelSel) {
      const v = (modelSel.value || '').trim();
      if (v === '__custom__') {
        const cur = (modelInput?.value || '').trim();
        modelOverride = cur || undefined;
      } else {
        modelOverride = v || undefined;
      }
    } else {
      modelOverride = pageModelOverride;
    }
    const html = await generateReportHTML({ templateHTML: tpl, stats: stats as any, baseFields: fields, modelOverride });
    const iframe = getEl<HTMLIFrameElement>('insights-preview');
    if (iframe) {
      currentPreviewRawHTML = html; // 保存原始 HTML
      iframe.srcdoc = prepareForPreview(html);
    }
    canSaveReport = true;
    try { ensurePreviewCopyButton(); } catch {}
    try {
      const grid = document.querySelector('.tab-section[data-tab-id="insights"] .insights-grid') as HTMLElement | null;
      if (grid) grid.style.gridTemplateColumns = '0.9fr 1.5fr';
    } catch {}

    // 根据 AI 服务状态给出提示
    try {
      const { lastError } = aiService.getStatus();
      if (lastError) {
        showStatus(`AI 生成失败，已使用本地模板：${lastError}`, 'error');
      } else {
        clearStatus();
      }
    } catch {}
  } catch (err: any) {
    log.error('[Insights] 生成报告失败', err);
    showStatus(`生成失败：${err?.message || err}`, 'error');
  } finally {
    showLoading(false);
  }
}

// 简易确认弹窗
function confirmDialog(opts: { title?: string; message: string; okText?: string; cancelText?: string }): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const OVERLAY_ID = 'insights-confirm-overlay';
      let overlay = document.getElementById(OVERLAY_ID) as HTMLDivElement | null;
      if (overlay) overlay.remove();
      overlay = document.createElement('div');
      overlay.id = OVERLAY_ID;
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.background = 'var(--surface-overlay)';
      overlay.style.backdropFilter = 'blur(2px)';
      overlay.style.zIndex = '9999';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      const modal = document.createElement('div');
      modal.style.width = '520px';
      modal.style.maxWidth = '95%';
      modal.style.background = 'var(--surface-primary)';
      modal.style.borderRadius = '8px';
      modal.style.boxShadow = 'var(--shadow-xl)';
      modal.style.border = '1px solid var(--border-primary)';
      modal.style.padding = '14px 16px';
      const title = document.createElement('div');
      title.textContent = opts.title || '确认';
      title.style.fontWeight = '700';
      title.style.marginBottom = '8px';
      title.style.color = 'var(--text-primary)';
      const msg = document.createElement('div');
      msg.textContent = opts.message;
      msg.style.color = 'var(--text-primary)';
      msg.style.fontSize = '13px';
      msg.style.margin = '6px 0 12px';
      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.justifyContent = 'flex-end';
      actions.style.gap = '8px';
      const cancel = document.createElement('button');
      cancel.textContent = opts.cancelText || '取消';
      cancel.style.padding = '6px 12px';
      cancel.style.fontSize = '12px';
      cancel.style.background = 'var(--surface-secondary)';
      cancel.style.border = '1px solid var(--border-primary)';
      cancel.style.color = 'var(--text-primary)';
      cancel.style.borderRadius = '4px';
      const ok = document.createElement('button');
      ok.textContent = opts.okText || '确认';
      ok.style.padding = '6px 12px';
      ok.style.fontSize = '12px';
      ok.style.background = 'var(--primary)';
      ok.style.border = '1px solid var(--primary-hover)';
      ok.style.color = 'var(--text-inverse)';
      ok.style.borderRadius = '4px';
      cancel.onclick = () => { overlay?.remove(); resolve(false); };
      ok.onclick = () => { overlay?.remove(); resolve(true); };
      actions.appendChild(cancel);
      actions.appendChild(ok);
      modal.appendChild(title);
      modal.appendChild(msg);
      modal.appendChild(actions);
      overlay.appendChild(modal);
      overlay.onclick = (ev) => { if (ev.target === overlay) { overlay?.remove(); resolve(false); } };
      document.body.appendChild(overlay);
    } catch {
      resolve(true);
    }
  });
}

async function inlineAssets(html: string): Promise<string> {
  try {
    const echartsUrl = chrome.runtime.getURL('assets/templates/echarts.min.js');
    const runtimeUrl = chrome.runtime.getURL('assets/templates/insights-runtime.js');
    let resHtml = html;
    // 移除 <base>，避免导出后路径指向扩展协议
    resHtml = resHtml.replace(/<base[^>]*>/i, '');
    // 内联 echarts
    try {
      const echartsRes = await fetch(echartsUrl);
      if (echartsRes.ok) {
        const js = await echartsRes.text();
        const reE = /<script[^>]+src=["']assets\/(?:templates\/)?echarts\.min\.js["'][^>]*><\/script>/i;
        resHtml = reE.test(resHtml) ? resHtml.replace(reE, `<script>${js}\n<\/script>`) : resHtml;
      }
    } catch {}
    // 内联 runtime
    try {
      const rtRes = await fetch(runtimeUrl);
      if (rtRes.ok) {
        const js = await rtRes.text();
        const reR = /<script[^>]+src=["']assets\/(?:templates\/)?insights-runtime\.js["'][^>]*><\/script>/i;
        resHtml = reR.test(resHtml) ? resHtml.replace(reR, `<script>${js}\n<\/script>`) : resHtml;
      }
    } catch {}
    // 最后清理任何残留的外链脚本，避免 srcdoc 中继续发起请求
    try {
      resHtml = resHtml.replace(/<script[^>]+src=["']assets\/[^"]*echarts\.min\.js["'][^>]*><\/script>/ig, '');
      resHtml = resHtml.replace(/<script[^>]+src=["']assets\/[^"]*insights-runtime\.js["'][^>]*><\/script>/ig, '');
    } catch {}
    return resHtml;
  } catch {
    return html;
  }
}

async function handleExportHTML() {
  const iframe = getEl<HTMLIFrameElement>('insights-preview');
  if (!iframe) return;
  const html = iframe.srcdoc || '<!doctype html><html><body><p>暂无预览</p></body></html>';
  let finalHtml = await inlineAssets(html);
  const sEl = getEl<HTMLInputElement>('insights-month-start');
  const eEl = getEl<HTMLInputElement>('insights-month-end');
  const s = (sEl?.value || '').replaceAll('-', '') || 'cur';
  const e = (eEl?.value || '').replaceAll('-', '') || 'cur';
  download(`javdb-insights-${s}~${e}.html`, finalHtml);
}

function handleExportMD() {
  // TODO: 生成 Markdown 模式。先导出占位内容，避免空实现。
  const md = [
    '# 观影标签月报（预览）',
    '',
    '- 该导出为占位，后续将输出结构化 Markdown 内容',
  ].join('\n');
  const sEl = getEl<HTMLInputElement>('insights-month-start');
  const eEl = getEl<HTMLInputElement>('insights-month-end');
  const s = (sEl?.value || '').replaceAll('-', '') || 'cur';
  const e = (eEl?.value || '').replaceAll('-', '') || 'cur';
  download(`javdb-insights-${s}~${e}.md`, md, 'text/markdown;charset=utf-8');
}

// 读取历史列表中被勾选的月份键
function getSelectedHistoryMonths(): string[] {
  try {
    const list = getEl<HTMLDivElement>('insights-history-list');
    if (!list) return [];
    const inputs = Array.from(list.querySelectorAll('input.history-select[type="checkbox"]')) as HTMLInputElement[];
    return inputs.filter(i => i.checked).map(i => i.getAttribute('data-month') || '').filter(Boolean);
  } catch { return []; }
}

async function exportSelectedJson(months: string[]): Promise<void> {
  try {
    const items = [] as any[];
    for (const m of months) {
      const rec = await dbInsReportsGet(m);
      if (rec) items.push(rec);
    }
    if (!items.length) { try { showMessage('未选择可导出的历史项', 'info'); } catch {} return; }
    const json = JSON.stringify({ items }, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const a = document.createElement('a');
    const now = new Date();
    const name = `javdb-insights-selected-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}.json`;
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch {}
}

async function exportSelectedHtml(months: string[]): Promise<void> {
  try {
    for (const m of months) {
      const rec = await dbInsReportsGet(m);
      if (!rec?.html) continue;
      // 保持外链脚本与 base，不内联；历史导出无需粘贴复现
      download(`javdb-insights-${m}.html`, rec.html);
    }
    if (!months.length) { try { showMessage('未选择可导出的历史项', 'info'); } catch {} }
  } catch {}
}

async function exportSelectedMd(months: string[]): Promise<void> {
  try {
    for (const m of months) {
      const md = [
        `# 观影标签月报（${m}）`,
        '',
        '- 该导出为占位，后续将输出结构化 Markdown 内容',
      ].join('\n');
      download(`javdb-insights-${m}.md`, md, 'text/markdown;charset=utf-8');
    }
    if (!months.length) { try { showMessage('未选择可导出的历史项', 'info'); } catch {} }
  } catch {}
}

async function performExport(format: 'html'|'md'|'json'): Promise<void> {
  const months = getSelectedHistoryMonths();
  if (months.length > 0) {
    if (format === 'html') return exportSelectedHtml(months);
    if (format === 'md') return exportSelectedMd(months);
    if (format === 'json') return exportSelectedJson(months);
    return;
  }
  // 未选择历史项：对当前预览导出（仅支持 html/md）
  if (format === 'html') return handleExportHTML();
  if (format === 'md') return handleExportMD();
  try { showMessage('请先勾选历史项以导出 JSON', 'info'); } catch {}
}

function setupExportDropdown(btn: HTMLButtonElement | null): void {
  if (!btn) return;
  const MID = 'insights-export-menu';
  let timer: number | undefined;
  const show = () => {
    let menu = document.getElementById(MID) as HTMLDivElement | null;
    if (!menu) {
      menu = document.createElement('div');
      menu.id = MID;
      menu.style.position = 'fixed';
      menu.style.zIndex = '1000';
      menu.style.minWidth = '150px';
      menu.style.background = '#fff';
      menu.style.border = '1px solid #e2e8f0';
      menu.style.borderRadius = '8px';
      menu.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
      menu.style.padding = '6px';
      menu.style.fontSize = '13px';
      menu.innerHTML = [
        '<div data-fmt="html" style="padding:6px 10px; border-radius:6px; cursor:pointer;">导出 HTML</div>',
        '<div data-fmt="md" style="padding:6px 10px; border-radius:6px; cursor:pointer;">导出 Markdown</div>',
        '<div data-fmt="json" style="padding:6px 10px; border-radius:6px; cursor:pointer;">导出 JSON</div>'
      ].join('');
      menu.onmouseenter = () => { if (timer) { clearTimeout(timer); timer = undefined as any; } };
      menu.onmouseleave = () => { timer = window.setTimeout(() => menu?.remove(), 160); };
      menu.onclick = async (ev) => {
        const t = ev.target as HTMLElement;
        const fmt = t?.getAttribute('data-fmt') as any;
        if (fmt) {
          await performExport(fmt);
          menu?.remove();
        }
      };
      document.body.appendChild(menu);
    }
    // 定位到按钮下方
    const rect = btn.getBoundingClientRect();
    menu.style.left = Math.round(rect.left) + 'px';
    menu.style.top = Math.round(rect.bottom + 6) + 'px';
  };
  const hideLater = () => {
    const menu = document.getElementById(MID) as HTMLDivElement | null;
    if (!menu) return;
    timer = window.setTimeout(() => menu?.remove(), 160);
  };
  btn.addEventListener('mouseenter', show);
  btn.addEventListener('mouseleave', hideLater);
}

export const insightsTab = {
  isInitialized: false,
  async initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    const genBtn = getEl<HTMLButtonElement>('insights-generate');
    const exportBtn = getEl<HTMLButtonElement>('insights-export');
    const refreshHistoryBtn = getEl<HTMLButtonElement>('insights-refresh-history');
    const deleteSelectedBtn = getEl<HTMLButtonElement>('insights-delete-selected');

    genBtn?.addEventListener('click', handleGenerate);
    // 将“生成报告”主按钮移动到右侧动作区
    try {
      const actionsBar = document.getElementById('insights-toolbar-row2-actions');
      if (actionsBar && genBtn && genBtn.parentElement !== actionsBar) {
        actionsBar.insertBefore(genBtn, actionsBar.firstChild);
      }
    } catch {}
    exportBtn?.addEventListener('click', () => { performExport('html'); });
    setupExportDropdown(exportBtn || null);
    // 保存按钮由预览区右上角动态注入与控制
    refreshHistoryBtn?.addEventListener('click', () => this.refreshHistory());
    deleteSelectedBtn?.addEventListener('click', async () => {
      const months = getSelectedHistoryMonths();
      if (!months.length) { try { showMessage('请先勾选要删除的历史项', 'info'); } catch {} return; }
      const ok = await confirmDialog({
        title: '确认删除',
        message: `将删除 ${months.length} 个已保存的月报，操作不可恢复。`,
        okText: '删除',
        cancelText: '取消'
      });
      if (!ok) return;
      setActionsDisabled(true);
      try {
        for (const m of months) { try { await dbInsReportsDelete(m); } catch {} }
        await this.refreshHistory();
        try { showMessage('删除完成', 'info'); } catch {}
      } finally { setActionsDisabled(false); }
    });

    // 默认选中上一个月
    try {
      const sEl = getEl<HTMLInputElement>('insights-month-start');
      const eEl = getEl<HTMLInputElement>('insights-month-end');
      if (sEl && !sEl.value) {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        sEl.value = `${y}-${m}`;
      }
      if (eEl && !eEl.value) {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        eEl.value = `${y}-${m}`;
      }
    } catch {}

    // 初始化新的月份选择器（替换原生控件）
    try {
      initInsightsMonthPicker();
    } catch (err) {
      log.warn('[Insights] 初始化月份选择器失败，回退到原生输入', err);
    }

    // 按钮：查看生成过程
    try {
      const traceBtn = ensureTraceButton();
      traceBtn?.addEventListener('click', onTraceClick);
    } catch {}
    try {
      const promptsBtn = ensurePromptsButton();
      promptsBtn?.addEventListener('click', () => { openPromptsModal(); });
    } catch {}
    try { await ensureModelDropdown(); } catch {}

    // 初次进入显示示例预览
    try { await previewSample(); } catch {}

    // 刷新历史
    try { await this.refreshHistory(); updateDeleteSelectedEnabled(); } catch {}

    // 监听主题切换，自动重新渲染预览
    try {
      themeManager.onThemeChange(() => {
        const iframe = getEl<HTMLIFrameElement>('insights-preview');
        if (iframe && currentPreviewRawHTML) {
          // 使用保存的原始 HTML 重新应用主题
          iframe.srcdoc = prepareForPreview(currentPreviewRawHTML);
        }
      });
    } catch (err) {
      log.warn('[Insights] 主题切换监听器注册失败', err);
    }
  },

  async saveCurrentAsMonthly(): Promise<void> {
    const sEl = getEl<HTMLInputElement>('insights-month-start');
    const eEl = getEl<HTMLInputElement>('insights-month-end');
    const sStr = (sEl?.value || '').trim();
    const eStr = (eEl?.value || '').trim();
    if (!sStr || !eStr) return;
    let sStr0 = sStr;
    let eStr0 = eStr;
    if (sStr0 > eStr0) { const tmp = sStr0; sStr0 = eStr0; eStr0 = tmp; }
    const [sy, sm] = sStr0.split('-');
    const [ey, em] = eStr0.split('-');
    const sDate = new Date(Number(sy), Number(sm) - 1, 1, 0, 0, 0, 0);
    const eDate = new Date(Number(ey), Number(em), 0, 23, 59, 59, 999);
    const periodStart = `${sDate.getFullYear()}-${String(sDate.getMonth()+1).padStart(2,'0')}-01`;
    const periodEnd = `${eDate.getFullYear()}-${String(eDate.getMonth()+1).padStart(2,'0')}-${String(eDate.getDate()).padStart(2,'0')}`;

    // 如已存在同月月报，先确认是否覆盖
    try {
      const periodKey = `${sStr0}~${eStr0}`;
      const exists = await dbInsReportsGet(periodKey);
      if (exists) {
        const ok = await confirmDialog({
          title: '覆盖已存在的月报？',
          message: '该时间范围的报告已存在。继续将覆盖已保存的内容（不可撤销）。如需保留原版本，建议先导出或备份。',
          okText: '覆盖保存',
          cancelText: '取消'
        });
        if (!ok) return;
      }
    } catch {}

    // 先计算真实 stats（用于保存以及占位渲染）
    const days = await dbInsViewsRange(periodStart, periodEnd);
    // 计算等长上一周期
    const dayMs = 24 * 60 * 60 * 1000;
    const rangeDays = Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / dayMs) + 1);
    const pPrevEndDate = new Date(sDate.getTime() - dayMs);
    const pPrevStartDate = new Date(pPrevEndDate.getTime() - (rangeDays - 1) * dayMs);
    const prevStart = `${pPrevStartDate.getFullYear()}-${String(pPrevStartDate.getMonth()+1).padStart(2,'0')}-${String(pPrevStartDate.getDate()).padStart(2,'0')}`;
    const prevEnd = `${pPrevEndDate.getFullYear()}-${String(pPrevEndDate.getMonth()+1).padStart(2,'0')}-${String(pPrevEndDate.getDate()).padStart(2,'0')}`;
    const prevDays = await dbInsViewsRange(prevStart, prevEnd);
    const settings = await getSettings();
    const ins = settings?.insights || {};
    const source: 'views' | 'compare' | 'auto' = (ins.source as any) || 'auto';
    const startMs = sDate.getTime();
    const endMs = eDate.getTime();
    let stats: any;
    if (source === 'views') {
      stats = aggregateMonthly(days, {
        topN: ins.topN ?? 10,
        previousDays: prevDays,
        changeThresholdRatio: ins.changeThresholdRatio,
        minTagCount: ins.minTagCount,
        risingLimit: ins.risingLimit,
        fallingLimit: ins.fallingLimit,
      });
    } else {
      const all = await fetchAllVideoRecordsPaged(800);
      const ret = aggregateCompareFromRecords(all, startMs, endMs, {
        topN: ins.topN ?? 10,
        changeThresholdRatio: ins.changeThresholdRatio,
        minTagCount: ins.minTagCount,
        risingLimit: ins.risingLimit,
        fallingLimit: ins.fallingLimit,
        statusScope: (ins.statusScope as any) || 'viewed',
      });
      const minSamples = Number(ins.minMonthlySamples ?? 10);
      if (source === 'auto' && ret.newCount < minSamples) {
        stats = aggregateMonthly(days, {
          topN: ins.topN ?? 10,
          previousDays: prevDays,
          changeThresholdRatio: ins.changeThresholdRatio,
          minTagCount: ins.minTagCount,
          risingLimit: ins.risingLimit,
          fallingLimit: ins.fallingLimit,
        });
      } else {
        stats = ret.stats;
      }
    }

    // 使用当前预览 HTML（若无则生成示例，包含图表依赖字段）
    const iframe = getEl<HTMLIFrameElement>('insights-preview');
    let html = iframe?.srcdoc || '';
    if (!html) {
      const tpl = await loadTemplate();
      const now = new Date();
      const topBrief = (stats.tagsTop || []).slice(0, 5).map((t: any) => `${t.name}(${t.count})`).join('、');
      const ch = stats?.changes || { newTags: [], rising: [], falling: [] };
      const changeIns: string[] = [];
      if (Array.isArray(ch.newTags) && ch.newTags.length) changeIns.push(`新出现标签：${ch.newTags.slice(0,5).join('、')}`);
      if (Array.isArray(ch.rising) && ch.rising.length) changeIns.push(`明显上升：${ch.rising.slice(0,5).join('、')}`);
      if (Array.isArray(ch.falling) && ch.falling.length) changeIns.push(`明显下降：${ch.falling.slice(0,5).join('、')}`);
      const fields = {
        reportTitle: `我的观影标签报告`,
        periodText: `统计范围：${periodStart} ~ ${periodEnd}`,
        summary: '（占位）基于本地统计与模板生成的摘要。',
        insightList: [
          topBrief ? `本月偏好标签集中于：${topBrief}` : '数据量较少，暂无法判断主要偏好',
          `累计观看天数：${days.length} 天`,
          ...changeIns,
        ].map(s => `<li>${s}</li>`).join(''),
        methodology: '仅统计标签，按影片去重，图表本地渲染。',
        generatedAt: now.toLocaleString(),
        version: '0.0.1',
        baseHref: chrome.runtime.getURL('') || './',
        statsJSON: JSON.stringify(stats || {}),
      } as Record<string, string>;
      const modelSel = getEl<HTMLSelectElement>('insights-model-select');
      const modelInput = getEl<HTMLInputElement>('insights-model-custom');
      let modelOverride: string | undefined;
      if (modelSel) {
        const v = (modelSel.value || '').trim();
        if (v === '__custom__') {
          const cur = (modelInput?.value || '').trim();
          modelOverride = cur || undefined;
        } else {
          modelOverride = v || undefined;
        }
      } else {
        modelOverride = pageModelOverride;
      }
      html = await generateReportHTML({ templateHTML: tpl, stats, baseFields: fields, modelOverride });
    }
    // 保存时保留外链脚本与 base，避免内联触发 CSP

    const nowMs = Date.now();
    const report: ReportMonthly = {
      month: `${sStr0}~${eStr0}`,
      period: { start: periodStart, end: periodEnd },
      stats,
      html,
      createdAt: nowMs,
      finalizedAt: nowMs,
      status: 'final',
      origin: 'manual',
      version: '0.0.1',
    };
    await dbInsReportsPut(report);
    await this.enforceRetention(24);
    await this.refreshHistory();
  },

  async refreshHistory(): Promise<void> {
    const listEl = getEl<HTMLDivElement>('insights-history-list');
    if (!listEl) return;
    const records = await dbInsReportsList(24);
    if (!records || records.length === 0) {
      listEl.innerHTML = '<div style="color:#888; font-size:12px;">暂无历史月报</div>';
      return;
    }
    listEl.innerHTML = records.map(r => {
      const ts = r.createdAt ? new Date(r.createdAt).toLocaleString() : '';
      const month = r.month || '';
      return `
        <div class="history-item" data-month="${month}" style="display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid #eee;">
          <input type="checkbox" class="history-select" data-month="${month}" />
          <div style="flex:1;">
            <div style="font-weight:600;">${month}</div>
            <div style="color:#888; font-size:12px;">创建于 ${ts}</div>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="btn-secondary btn-sm history-preview-btn" style="background:#ffffff; border:1px solid #e5e7eb; color:#334155; -webkit-text-fill-color:#334155" data-action="preview" data-month="${month}"><i class="fas fa-eye"></i>&nbsp;预览</button>
          </div>
        </div>
      `;
    }).join('');

    // 勾选变化时，联动“删除所选”可用态
    try {
      listEl.addEventListener('change', (ev) => {
        const t = ev.target as HTMLElement;
        if (!t) return;
        if (t.matches && t.matches('input.history-select')) {
          updateDeleteSelectedEnabled();
        }
      });
    } catch {}

    // 初次渲染后更新一次
    updateDeleteSelectedEnabled();

    // 事件委托
    listEl.onclick = async (ev) => {
      const target = ev.target as HTMLElement;
      const action = target?.getAttribute?.('data-action');
      const month = target?.getAttribute?.('data-month') || target?.closest('.history-item')?.getAttribute('data-month') || '';
      if (!action || !month) return;
      if (action === 'preview') {
        const rec = await dbInsReportsGet(month);
        const iframe = getEl<HTMLIFrameElement>('insights-preview');
        if (iframe && rec?.html) {
          currentPreviewRawHTML = rec.html; // 保存原始 HTML
          iframe.srcdoc = prepareForPreview(rec.html);
        }
      }
    };
  },

  async enforceRetention(maxMonths = 24): Promise<void> {
    const list = await dbInsReportsList(200);
    if (!list || list.length <= maxMonths) return;
    const toDelete = list.slice(maxMonths); // 列表按 createdAt 倒序
    for (const r of toDelete) {
      if (r?.month) await dbInsReportsDelete(r.month);
    }
  }
  ,
  async exportAllJson(): Promise<void> {
    const json = await dbInsReportsExport();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    const name = `javdb-insights-reports-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}.json`;
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  ,
  async importAllJson(): Promise<void> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      await dbInsReportsImport(text);
      await this.refreshHistory();
    };
    input.click();
  }
};
