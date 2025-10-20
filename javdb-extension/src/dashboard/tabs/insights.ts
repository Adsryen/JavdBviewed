import { renderTemplate, generateReportHTML } from "../../services/insights/reportGenerator";
import { aiService } from "../../services/ai/aiService";
import { dbInsReportsPut, dbInsReportsList, dbInsReportsGet, dbInsReportsDelete, dbInsReportsExport, dbInsReportsImport } from "../dbClient";
import type { ReportMonthly } from "../../types/insights";
import { dbInsViewsRange } from "../dbClient";
import { aggregateMonthly } from "../../services/insights/aggregator";
import { getSettings } from "../../utils/storage";
import { getLastGenerationTrace } from "../../services/insights/generationTrace";

function getEl<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

// ========== 查看生成过程：按钮与弹窗 ==========
function ensureTraceButton(): HTMLButtonElement | null {
  try {
    const container = getPreviewContainer();
    if (!container) return null;
    const BTN_ID = 'insights-trace';
    let btn = document.getElementById(BTN_ID) as HTMLButtonElement | null;
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
    // 主题色与悬停效果
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
        if (!trace) return '暂无生成过程';
        const lines: string[] = [];
        const duration = (trace.endedAt && trace.startedAt) ? (trace.endedAt - trace.startedAt) : undefined;
        lines.push('本次生成过程');
        lines.push(`开始时间：${fmt(trace.startedAt)}`);
        lines.push(`结束时间：${fmt(trace.endedAt)}`);
        lines.push(`耗时：${typeof duration==='number' ? duration + ' ms' : '-'}`);
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
      header.style.background = '#fff';
      header.style.padding = '6px 0 8px 0';
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
      header.appendChild(actions);

      const body = document.createElement('div');
      body.style.fontSize = '12px';
      body.style.color = '#334155';

      const fmt = (n?: number) => (typeof n === 'number' ? new Date(n).toLocaleString() : '-');
      const pre = (obj: any) => `<pre style="white-space:pre-wrap;word-break:break-word;background:#0f172a;color:#e2e8f0;border:1px solid #1f2937;border-radius:8px;padding:10px 12px;overflow:auto;">${
        (()=>{ try { return JSON.stringify(obj, null, 2); } catch { return String(obj); } })()
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
            <div><b>耗时</b>：${typeof duration==='number' ? duration + ' ms' : '-'}</div>
            <div><b>状态</b>：${trace.status || '-'}</div>
          </div>`;
        const stepsHtml = (
          Array.isArray(trace.entries) && trace.entries.length
            ? trace.entries.map(e => `
                <div style="border-left:3px solid ${e.level==='error'?'#ef4444':(e.level==='warn'?'#f59e0b':'#3b82f6')}; padding-left:8px; margin:6px 0;">
                  <div style="display:flex; gap:8px; color:#475569;">
                    <span style="min-width:160px;">${fmt(e.time)}</span>
                    <span>[${e.level.toUpperCase()}][${e.tag}] ${e.message || ''}</span>
                  </div>
                  ${ e.data ? pre(e.data) : '' }
                </div>
              `).join('')
            : '<div style="color:#999;">无步骤</div>'
        );

        body.innerHTML = [
          card('基本信息', baseInfo),
          card('上下文', pre(ctx)),
          card('步骤', stepsHtml),
          card('摘要', pre(trace.summary || {})),
        ].join('');
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
    const end = new Date(Number(y), Number(m), 0).toISOString().slice(0, 10);

    // 1) 读取当月与上月 views
    const days = await dbInsViewsRange(start, end);
    let prevY = Number(y);
    let prevM = Number(m) - 1;
    if (prevM <= 0) { prevY -= 1; prevM = 12; }
    const prevStart = `${prevY}-${String(prevM).padStart(2,'0')}-01`;
    const prevEnd = new Date(prevY, prevM, 0).toISOString().slice(0, 10);
    const prevDays = await dbInsViewsRange(prevStart, prevEnd);

    // 2) 聚合统计
    const settings = await getSettings();
    const ins = settings?.insights || {};
    const stats = aggregateMonthly(days, {
      topN: ins.topN ?? 10,
      previousDays: prevDays,
      changeThresholdRatio: ins.changeThresholdRatio,
      minTagCount: ins.minTagCount,
      risingLimit: ins.risingLimit,
      fallingLimit: ins.fallingLimit,
    });

    // 3) 生成 HTML（优先 AI；失败回退本地模板）
    const topBrief = (stats.tagsTop || []).slice(0, 5).map(t => `${t.name}(${t.count})`).join('、');
    const changeInsights: string[] = [];
    try {
      const ch = stats?.changes || { newTags: [], rising: [], falling: [] };
      if (Array.isArray(ch.newTags) && ch.newTags.length) changeInsights.push(`新出现标签：${ch.newTags.slice(0,5).join('、')}`);
      if (Array.isArray(ch.rising) && ch.rising.length) changeInsights.push(`明显上升：${ch.rising.slice(0,5).join('、')}`);
      if (Array.isArray(ch.falling) && ch.falling.length) changeInsights.push(`明显下降：${ch.falling.slice(0,5).join('、')}`);
    } catch {}
    const insightList = [
      topBrief ? `本月偏好标签集中于：${topBrief}` : '数据量较少，暂无法判断主要偏好',
      `累计观看天数：${days.length} 天`,
      ...changeInsights,
    ].map(s => `<li>${s}</li>`).join('');
    const fields: Record<string, string> = {
      reportTitle: `我的观影标签月报（${y}年${m}月）`,
      periodText: `统计范围：${start} ~ ${end}`,
      summary: '本报告基于本地统计数据生成，未包含演员/系列，仅统计标签。',
      insightList,
      methodology: '按影片ID去重，每部影片的标签计入当日计数；月度聚合统计 TopN、占比与趋势（图表将本地渲染）。',
      generatedAt: new Date().toLocaleString(),
      version: '0.0.1',
      baseHref: chrome.runtime.getURL('') || './',
      statsJSON: JSON.stringify(stats || {}),
    } as Record<string, string>;
    const tpl = await loadTemplate();
    const html = await generateReportHTML({ templateHTML: tpl, stats, baseFields: fields });
    const iframe = getEl<HTMLIFrameElement>('insights-preview');
    if (iframe) {
      iframe.srcdoc = prepareForPreview(html);
    }

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
        d.setMonth(d.getMonth() - 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        monthEl.value = `${y}-${m}`;
      }
    } catch {}

    // 按钮：查看生成过程
    try {
      const traceBtn = ensureTraceButton();
      traceBtn?.addEventListener('click', openTraceModal);
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
    const stats = aggregateMonthly(days, {
      topN: ins.topN ?? 10,
      previousDays: prevDays,
      changeThresholdRatio: ins.changeThresholdRatio,
      minTagCount: ins.minTagCount,
      risingLimit: ins.risingLimit,
      fallingLimit: ins.fallingLimit,
    });

    // 使用当前预览 HTML（若无则生成示例，包含图表依赖字段）
    const iframe = getEl<HTMLIFrameElement>('insights-preview');
    let html = iframe?.srcdoc || '';
    if (!html) {
      const tpl = await loadTemplate();
      const now = new Date();
      const topBrief = (stats.tagsTop || []).slice(0, 5).map(t => `${t.name}(${t.count})`).join('、');
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
            <button data-action="preview" data-month="${month}">预览</button>
            <button data-action="delete" data-month="${month}">删除</button>
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
