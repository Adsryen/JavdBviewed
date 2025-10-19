import { renderTemplate } from "../../services/insights/reportGenerator";
import { dbInsReportsPut, dbInsReportsList, dbInsReportsGet, dbInsReportsDelete, dbInsReportsExport, dbInsReportsImport } from "../dbClient";
import type { ReportMonthly } from "../../types/insights";
import { dbInsViewsRange } from "../dbClient";
import { aggregateMonthly } from "../../services/insights/aggregator";

function getEl<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

async function openPreview(fields: Record<string, string>): Promise<void> {
  try {
    await new Promise<void>((resolve) => {
      try { chrome.storage?.local?.set?.({ insights_preview_payload: fields }, () => resolve()); }
      catch { resolve(); }
    });
  } catch {}
  const iframe = getEl<HTMLIFrameElement>('insights-preview');
  if (iframe) {
    try {
      const url = chrome.runtime.getURL('assets/templates/insights-report.html');
      iframe.src = `${url}?t=${Date.now()}`;
    } catch {}
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
  const tpl = await loadTemplate();
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
  await openPreview(fields);
}

async function handleGenerate() {
  const monthEl = getEl<HTMLInputElement>('insights-month');
  const monthStr = (monthEl?.value || '').trim();
  if (!monthStr) { await previewSample(); return; }
  const [y, m] = monthStr.split('-');
  const start = `${y}-${m}-01`;
  const end = new Date(Number(y), Number(m), 0).toISOString().slice(0, 10);

  // 1) 读取当月 views（日粒度）
  const days = await dbInsViewsRange(start, end);
  // 2) 聚合统计（本地）
  const stats = aggregateMonthly(days, { topN: 10 });
  // 3) 渲染模板（仅文本占位符；图表后续用 ECharts 渲染）
  const tpl = await loadTemplate();
  const topBrief = (stats.tagsTop || []).slice(0, 5).map(t => `${t.name}(${t.count})`).join('、');
  const insightList = [
    topBrief ? `本月偏好标签集中于：${topBrief}` : '数据量较少，暂无法判断主要偏好',
    `累计观看天数：${days.length} 天`,
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
  };
  await openPreview(fields);
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
    const stats = aggregateMonthly(days, { topN: 10 });

    // 使用当前预览 HTML（若无则生成示例，包含图表依赖字段）
    const iframe = getEl<HTMLIFrameElement>('insights-preview');
    let html = iframe?.srcdoc || '';
    if (!html) {
      const tpl = await loadTemplate();
      const now = new Date();
      const fields = {
        reportTitle: `我的观影标签月报（${y}年${m}月）`,
        periodText: `统计范围：${periodStart} ~ ${periodEnd}`,
        summary: '（占位）基于本地统计与模板生成的摘要。',
        insightList: '<li>（占位）本月新增偏好标签 …</li>',
        methodology: '仅统计标签，按影片去重，图表本地渲染。',
        generatedAt: now.toLocaleString(),
        version: '0.0.1',
        baseHref: chrome.runtime.getURL('') || './',
        statsJSON: JSON.stringify(stats || {}),
      } as Record<string, string>;
      html = renderTemplate({ templateHTML: tpl, fields });
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
