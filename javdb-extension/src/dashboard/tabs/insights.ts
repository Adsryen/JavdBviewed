import { renderTemplate, generateReportHTML } from "../../services/insights/reportGenerator";
import { aiService } from "../../services/ai/aiService";
import { dbInsReportsPut, dbInsReportsList, dbInsReportsGet, dbInsReportsDelete, dbInsReportsExport, dbInsReportsImport } from "../dbClient";
import type { ReportMonthly } from "../../types/insights";
import { dbInsViewsRange, dbViewedPage } from "../dbClient";
import { aggregateMonthly } from "../../services/insights/aggregator";
import { getSettings } from "../../utils/storage";
import { getLastGenerationTrace, addTrace } from "../../services/insights/generationTrace";
import { aggregateCompareFromRecords } from "../../services/insights/compareAggregator";
import type { VideoRecord } from "../../types";
import { showMessage } from "../ui/toast";

function getEl<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

// ========== 查看生成过程：按钮与弹窗 ==========
function ensureTraceButton(): HTMLButtonElement | null {
  try {
    const BTN_ID = 'insights-trace';
    // 优先插入到工具栏右侧动作区
    const actionBar = document.getElementById('insights-toolbar-actions');
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
      overlay.style.background = 'rgba(15,23,42,0.42)';
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
      modal.style.background = '#fff';
      modal.style.borderRadius = '8px';
      modal.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
      modal.style.padding = '12px 14px';
      modal.style.border = '1px solid #e2e8f0';

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
      header.style.background = 'rgba(255,255,255,0.92)';
      header.style.padding = '10px 0 12px 0';
      header.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
      header.style.minHeight = '36px';
      header.style.paddingRight = '120px';
      header.style.borderBottom = '1px solid #e2e8f0';
      const titleWrap = document.createElement('div');
      titleWrap.style.display = 'flex';
      titleWrap.style.alignItems = 'center';
      titleWrap.style.gap = '8px';
      const title = document.createElement('div');
      title.textContent = '本次生成过程';
      title.style.fontWeight = '700';
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
      copyBtn.style.background = '#2563eb';
      copyBtn.style.border = '1px solid #1d4ed8';
      copyBtn.style.color = '#fff';
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
      close.style.background = '#f1f5f9';
      close.style.border = '1px solid #cbd5e1';
      close.style.color = '#334155';
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
      body.style.color = '#334155';
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
          </div>`;
        // 步骤：附带耗时（相对上一步与相对开始）
        const entries = Array.isArray(trace.entries) ? trace.entries : [];
        const tStart = typeof trace.startedAt === 'number' ? trace.startedAt : (entries[0]?.time || 0);
        let prevT = tStart;
        const fullDur = (typeof trace.startedAt === 'number' && typeof trace.endedAt === 'number')
          ? (trace.endedAt - trace.startedAt)
          : (entries.length ? (Math.max(0, (entries[entries.length - 1]?.time || 0) - tStart)) : 0);
        const stepBlocks: string[] = [];
        for (const e of entries) {
          const dt = typeof e.time === 'number' ? (e.time - prevT) : 0;
          const tot = typeof e.time === 'number' ? (e.time - tStart) : 0;
          prevT = typeof e.time === 'number' ? e.time : prevT;
          const color = e.level==='error'?'#ef4444':(e.level==='warn'?'#f59e0b':'#3b82f6');
          const pct = fullDur > 0 ? Math.min(100, Math.max(0, Math.round((tot / fullDur) * 100))) : 0;
          stepBlocks.push(`
            <div style="border-left:3px solid ${color}; padding-left:8px; margin:8px 0;">
              <div style="display:flex; flex-wrap:wrap; gap:8px; color:#475569; align-items:center;">
                <span style="min-width:160px;">${fmt(e.time)}</span>
                <span>[${(e.level||'').toUpperCase()}][${e.tag}] ${e.message || ''}</span>
                <span style="margin-left:auto; color:#64748b; font-size:11px;">+${fmtDur(dt)} / 总 ${fmtDur(tot)}</span>
              </div>
              <div style="height:6px; background:#e2e8f0; border-radius:999px; overflow:hidden; margin-top:6px;">
                <div style="width:${pct}%; height:100%; background:${color};"></div>
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
          card('步骤', stepsHtml),
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
    // 1) 移除全部脚本（内联与外链），避免 about:srcdoc 下 CSP 报错
    try { res = res.replace(/<script\b[\s\S]*?<\/script>/gi, ''); } catch {}
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
    // 3) 不注入任何脚本，保持纯静态预览（图表在导出 HTML 或外部页展示）
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
      'insights-save',
      'insights-export-html',
      'insights-export-md',
      'insights-export-json',
      'insights-import-json',
      'insights-refresh-history'
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
function ensurePreviewCopyButton(): HTMLButtonElement | null {
  try {
    const container = getPreviewContainer();
    if (!container) return null;
    const ID = 'insights-preview-copy';
    let btn = document.getElementById(ID) as HTMLButtonElement | null;
    if (!btn) {
      btn = document.createElement('button');
      btn.id = ID;
      btn.className = 'preview-copy-btn';
      btn.title = '复制预览HTML';
      btn.innerHTML = '<i class="fas fa-copy"></i>';
      // 内联样式，避免样式未加载时不可见
      try {
        btn.style.position = 'absolute';
        btn.style.right = '8px';
        btn.style.top = '8px';
        btn.style.zIndex = '6';
        btn.style.width = '28px';
        btn.style.height = '28px';
        btn.style.borderRadius = '50%';
        btn.style.background = '#fff';
        btn.style.border = '1px solid #e5e7eb';
        btn.style.color = '#334155';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.boxShadow = '0 1px 2px rgba(0,0,0,0.06)';
        btn.style.cursor = 'pointer';
        btn.style.fontSize = '13px';
      } catch {}
      container.appendChild(btn);
      btn.addEventListener('click', copyPreviewHtml);
    }
    return btn;
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
    generatedAt: now.toLocaleString(),
    version: '0.0.1',
    baseHref: chrome.runtime.getURL('') || './',
    statsJSON: '{}',
  } as Record<string, string>;
  const tpl = await loadTemplate();
  const html = renderTemplate({ templateHTML: tpl, fields });
  iframe.srcdoc = prepareForPreview(html);
  try { ensurePreviewCopyButton(); } catch {}
  try {
    const grid = document.querySelector('.tab-section[data-tab-id="insights"] .insights-grid') as HTMLElement | null;
    if (grid) grid.style.gridTemplateColumns = '0.9fr 1.5fr';
  } catch {}
}

async function handleGenerate() {
  showLoading(true);
  clearStatus();
  const monthEl = getEl<HTMLInputElement>('insights-month');
  const monthStr = (monthEl?.value || '').trim();
  try {
    if (!monthStr) { await previewSample(); return; }
    const [y, m] = monthStr.split('-');
    const start = `${y}-${m}-01`;
    const endDate = new Date(Number(y), Number(m), 0);
    const end = `${endDate.getFullYear()}-${String(endDate.getMonth()+1).padStart(2,'0')}-${String(endDate.getDate()).padStart(2,'0')}`;
    // 如当月月报已存在，则在“生成”前提示风险并确认（仅预览，不会覆盖保存）
    try {
      const exists = await dbInsReportsGet(`${y}-${m}`);
      if (exists) {
        const ok = await confirmDialog({
          title: '确认生成（已存在同月月报）',
          message: '该月份的月报已存在。继续将仅在右侧生成“预览”，不会自动覆盖已保存的月报；如需覆盖，请在“保存为月报”时再确认。',
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
    let prevY = Number(y);
    let prevM = Number(m) - 1;
    if (prevM <= 0) { prevY -= 1; prevM = 12; }
    const prevStart = `${prevY}-${String(prevM).padStart(2,'0')}-01`;
    const prevEndDate = new Date(prevY, prevM, 0);
    const prevEnd = `${prevEndDate.getFullYear()}-${String(prevEndDate.getMonth()+1).padStart(2,'0')}-${String(prevEndDate.getDate()).padStart(2,'0')}`;
    const prevDays = await dbInsViewsRange(prevStart, prevEnd);

    // 2) 根据数据源模式聚合统计（compare/auto 支持样本量不足回退）
    const source: 'views' | 'compare' | 'auto' = (ins.source as any) || 'auto';
    const statusScope = String((ins.statusScope as any) || 'viewed_browsed');
    const startMs = new Date(Number(y), Number(m) - 1, 1, 0, 0, 0, 0).getTime();
    const endMs = new Date(Number(y), Number(m), 0, 23, 59, 59, 999).getTime();
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
      ? 'compare 模式：基线=月初之前（按状态口径），新增=本月 updatedAt；按标签计数与占比计算变化。'
      : '按影片ID去重，每部影片的标签计入当日计数；月度聚合统计 TopN、占比与趋势（图表将本地渲染）。';
    const extraLine = (modeUsed === 'compare') ? `新增样本：${newCount}；基线样本：${baselineCount}` : `累计观看天数：${days.length} 天`;
    const insightList = [
      topBrief ? `本月偏好标签集中于：${topBrief}` : '数据量较少，暂无法判断主要偏好',
      extraLine,
      ...changeInsights,
    ].map(s => `<li>${s}</li>`).join('');
    const fields: Record<string, string> = {
      reportTitle: `我的观影标签月报（${y}年${m}月）`,
      periodText: `统计范围：${start} ~ ${end}`,
      summary: '本报告基于本地统计数据生成，未包含演员/系列，仅统计标签。',
      insightList,
      methodology,
      generatedAt: new Date().toLocaleString(),
      version: '0.0.1',
      baseHref: chrome.runtime.getURL('') || './',
      statsJSON: JSON.stringify(stats || {}),
    } as Record<string, string>;
    const tpl = await loadTemplate();
    const html = await generateReportHTML({ templateHTML: tpl, stats: stats as any, baseFields: fields });
    const iframe = getEl<HTMLIFrameElement>('insights-preview');
    if (iframe) {
      iframe.srcdoc = prepareForPreview(html);
    }
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
    console.error('[Insights] 生成报告失败：', err);
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
      overlay.style.background = 'rgba(15,23,42,0.42)';
      overlay.style.backdropFilter = 'blur(2px)';
      overlay.style.zIndex = '9999';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      const modal = document.createElement('div');
      modal.style.width = '520px';
      modal.style.maxWidth = '95%';
      modal.style.background = '#fff';
      modal.style.borderRadius = '8px';
      modal.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
      modal.style.border = '1px solid #e2e8f0';
      modal.style.padding = '14px 16px';
      const title = document.createElement('div');
      title.textContent = opts.title || '确认';
      title.style.fontWeight = '700';
      title.style.marginBottom = '8px';
      const msg = document.createElement('div');
      msg.textContent = opts.message;
      msg.style.color = '#334155';
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
      cancel.style.background = '#f1f5f9';
      cancel.style.border = '1px solid #cbd5e1';
      cancel.style.color = '#334155';
      cancel.style.borderRadius = '4px';
      const ok = document.createElement('button');
      ok.textContent = opts.okText || '确认';
      ok.style.padding = '6px 12px';
      ok.style.fontSize = '12px';
      ok.style.background = '#2563eb';
      ok.style.border = '1px solid #1d4ed8';
      ok.style.color = '#fff';
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
  const monthEl = getEl<HTMLInputElement>('insights-month');
  const month = (monthEl?.value || '').replaceAll('-', '') || 'preview';
  download(`javdb-insights-${month}.html`, finalHtml);
}

function handleExportMD() {
  // TODO: 生成 Markdown 模式。先导出占位内容，避免空实现。
  const md = [
    '# 观影标签月报（预览）',
    '',
    '- 该导出为占位，后续将输出结构化 Markdown 内容',
  ].join('\n');
  const monthEl = getEl<HTMLInputElement>('insights-month');
  const month = (monthEl?.value || '').replaceAll('-', '') || 'preview';
  download(`javdb-insights-${month}.md`, md, 'text/markdown;charset=utf-8');
}

export const insightsTab = {
  isInitialized: false,
  async initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    const genBtn = getEl<HTMLButtonElement>('insights-generate');
    const expHtml = getEl<HTMLButtonElement>('insights-export-html');
    const expMd = getEl<HTMLButtonElement>('insights-export-md');
    const saveBtn = getEl<HTMLButtonElement>('insights-save');
    const refreshHistoryBtn = getEl<HTMLButtonElement>('insights-refresh-history');
    const exportJsonBtn = getEl<HTMLButtonElement>('insights-export-json');
    const importJsonBtn = getEl<HTMLButtonElement>('insights-import-json');
    const monthEl = getEl<HTMLInputElement>('insights-month');

    genBtn?.addEventListener('click', handleGenerate);
    expHtml?.addEventListener('click', () => { handleExportHTML(); });
    expMd?.addEventListener('click', handleExportMD);
    saveBtn?.addEventListener('click', () => this.saveCurrentAsMonthly());
    refreshHistoryBtn?.addEventListener('click', () => this.refreshHistory());
    exportJsonBtn?.addEventListener('click', () => this.exportAllJson());
    importJsonBtn?.addEventListener('click', () => this.importAllJson());

    // 默认选中上一个月
    try {
      if (monthEl && !monthEl.value) {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        monthEl.value = `${y}-${m}`; // 默认当前月
      }
    } catch {}

    // 按钮：查看生成过程
    try {
      const traceBtn = ensureTraceButton();
      traceBtn?.addEventListener('click', onTraceClick);
    } catch {}

    // 初次进入显示示例预览
    try { await previewSample(); } catch {}

    // 刷新历史
    try { await this.refreshHistory(); } catch {}
  },

  async saveCurrentAsMonthly(): Promise<void> {
    const monthEl = getEl<HTMLInputElement>('insights-month');
    const monthStr = (monthEl?.value || '').trim(); // YYYY-MM
    if (!monthStr) return;
    const [y, m] = monthStr.split('-');
    const periodStart = `${y}-${m}-01`;
    const periodEnd = new Date(Number(y), Number(m), 0).toISOString().slice(0, 10);

    // 如已存在同月月报，先确认是否覆盖
    try {
      const exists = await dbInsReportsGet(`${y}-${m}`);
      if (exists) {
        const ok = await confirmDialog({
          title: '覆盖已存在的月报？',
          message: '该月份的月报已存在。继续将覆盖已保存的内容（不可撤销）。如需保留原版本，建议先导出或备份。',
          okText: '覆盖保存',
          cancelText: '取消'
        });
        if (!ok) return;
      }
    } catch {}

    // 先计算真实 stats（用于保存以及占位渲染）
    const days = await dbInsViewsRange(periodStart, periodEnd);
    let prevY = Number(y);
    let prevM = Number(m) - 1;
    if (prevM <= 0) { prevY -= 1; prevM = 12; }
    const prevStart = `${prevY}-${String(prevM).padStart(2,'0')}-01`;
    const prevEnd = new Date(prevY, prevM, 0).toISOString().slice(0, 10);
    const prevDays = await dbInsViewsRange(prevStart, prevEnd);
    const settings = await getSettings();
    const ins = settings?.insights || {};
    const source: 'views' | 'compare' | 'auto' = (ins.source as any) || 'views';
    const startMs = new Date(Number(y), Number(m) - 1, 1, 0, 0, 0, 0).getTime();
    const endMs = new Date(Number(y), Number(m), 0, 23, 59, 59, 999).getTime();
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
        reportTitle: `我的观影标签月报（${y}年${m}月）`,
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
      html = await generateReportHTML({ templateHTML: tpl, stats, baseFields: fields });
    }
    // 保存时保留外链脚本与 base，避免内联触发 CSP

    const nowMs = Date.now();
    const report: ReportMonthly = {
      month: `${y}-${m}`,
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
          <div style="flex:1;">
            <div style="font-weight:600;">${month}</div>
            <div style="color:#888; font-size:12px;">创建于 ${ts}</div>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="btn-secondary btn-sm" data-action="preview" data-month="${month}"><i class="fas fa-eye"></i>&nbsp;预览</button>
            <button class="btn-danger btn-sm" data-action="delete" data-month="${month}"><i class="fas fa-trash-alt"></i>&nbsp;删除</button>
          </div>
        </div>
      `;
    }).join('');

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
          iframe.srcdoc = prepareForPreview(rec.html);
        }
      } else if (action === 'delete') {
        await dbInsReportsDelete(month);
        await this.refreshHistory();
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
