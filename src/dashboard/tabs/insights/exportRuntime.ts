import {
  buildCurrentReportExportFilename,
  buildInsightsMarkdownPlaceholder,
  buildSelectedReportsJsonFilename,
  getSelectedInsightHistoryMonths,
} from './reportExportModel';

export type InsightsRuntimeExportFormat = 'html' | 'md' | 'json';

interface InsightsExportRuntimeDeps {
  documentRef?: Document;
  fetchImpl?: typeof fetch;
  getExtensionUrl?: (path: string) => string;
  getReportByMonth?: (month: string) => Promise<any | null>;
  showMessage?: (message: string, type?: 'info' | 'warn' | 'warning' | 'error' | 'success') => void;
  downloadFile?: (filename: string, content: string, mime?: string) => void;
  inlineAssets?: (html: string) => Promise<string>;
  now?: () => Date;
}

export interface InsightsExportRuntime {
  getSelectedHistoryMonths: () => string[];
  performExport: (format: InsightsRuntimeExportFormat) => Promise<void>;
  setupExportDropdown: (button: HTMLButtonElement | null) => void;
  inlineAssets: (html: string) => Promise<string>;
}

export function createInsightsExportRuntime(options: InsightsExportRuntimeDeps = {}): InsightsExportRuntime {
  const doc = options.documentRef ?? document;
  const fetchImpl = options.fetchImpl ?? fetch;
  const getExtensionUrl = options.getExtensionUrl ?? ((path: string) => chrome.runtime.getURL(path));
  const getReportByMonth = options.getReportByMonth ?? (async (month: string) => {
    const db = await import('../../dbClient');
    return db.dbInsReportsGet(month);
  });
  const showMessage = options.showMessage ?? ((message: string, type?: 'info' | 'warn' | 'warning' | 'error' | 'success') => {
    void import('../../ui/toast').then(module => {
      module.showMessage(message, type);
    }).catch(() => {});
  });
  const downloadFile = options.downloadFile ?? ((filename: string, content: string, mime = 'text/html;charset=utf-8') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = doc.createElement('a');
    a.href = url;
    a.download = filename;
    doc.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
  const inlineAssets = options.inlineAssets ?? defaultInlineAssets;
  const now = options.now ?? (() => new Date());

  function getEl<T extends HTMLElement>(id: string): T | null {
    return doc.getElementById(id) as T | null;
  }

  async function defaultInlineAssets(html: string): Promise<string> {
    try {
      const echartsUrl = getExtensionUrl('assets/templates/echarts.min.js');
      const runtimeUrl = getExtensionUrl('assets/templates/insights-runtime.js');
      let resHtml = html;
      resHtml = resHtml.replace(/<base[^>]*>/i, '');
      try {
        const echartsRes = await fetchImpl(echartsUrl);
        if (echartsRes.ok) {
          const js = await echartsRes.text();
          const reE = /<script[^>]+src=["']assets\/(?:templates\/)?echarts\.min\.js["'][^>]*><\/script>/i;
          resHtml = reE.test(resHtml) ? resHtml.replace(reE, `<script>${js}\n<\/script>`) : resHtml;
        }
      } catch {}
      try {
        const rtRes = await fetchImpl(runtimeUrl);
        if (rtRes.ok) {
          const js = await rtRes.text();
          const reR = /<script[^>]+src=["']assets\/(?:templates\/)?insights-runtime\.js["'][^>]*><\/script>/i;
          resHtml = reR.test(resHtml) ? resHtml.replace(reR, `<script>${js}\n<\/script>`) : resHtml;
        }
      } catch {}
      try {
        resHtml = resHtml.replace(/<script[^>]+src=["']assets\/[^"]*echarts\.min\.js["'][^>]*><\/script>/ig, '');
        resHtml = resHtml.replace(/<script[^>]+src=["']assets\/[^"]*insights-runtime\.js["'][^>]*><\/script>/ig, '');
      } catch {}
      return resHtml;
    } catch {
      return html;
    }
  }

  function getSelectedHistoryMonths(): string[] {
    try {
      const list = getEl<HTMLDivElement>('insights-history-list');
      return getSelectedInsightHistoryMonths(list);
    } catch {
      return [];
    }
  }

  async function handleExportHTML(): Promise<void> {
    const iframe = getEl<HTMLIFrameElement>('insights-preview');
    if (!iframe) return;
    const html = iframe.srcdoc || '<!doctype html><html><body><p>暂无预览</p></body></html>';
    const finalHtml = await inlineAssets(html);
    const sEl = getEl<HTMLInputElement>('insights-month-start');
    const eEl = getEl<HTMLInputElement>('insights-month-end');
    downloadFile(
      buildCurrentReportExportFilename('html', sEl?.value, eEl?.value),
      finalHtml,
      'text/html;charset=utf-8',
    );
  }

  function handleExportMD(): void {
    const md = buildInsightsMarkdownPlaceholder();
    const sEl = getEl<HTMLInputElement>('insights-month-start');
    const eEl = getEl<HTMLInputElement>('insights-month-end');
    downloadFile(
      buildCurrentReportExportFilename('md', sEl?.value, eEl?.value),
      md,
      'text/markdown;charset=utf-8',
    );
  }

  async function exportSelectedJson(months: string[]): Promise<void> {
    try {
      const items = [] as any[];
      for (const m of months) {
        const rec = await getReportByMonth(m);
        if (rec) items.push(rec);
      }
      if (!items.length) {
        try { showMessage('未选择可导出的历史项', 'info'); } catch {}
        return;
      }
      downloadFile(
        buildSelectedReportsJsonFilename(now()),
        JSON.stringify({ items }, null, 2),
        'application/json;charset=utf-8',
      );
    } catch {}
  }

  async function exportSelectedHtml(months: string[]): Promise<void> {
    try {
      for (const m of months) {
        const rec = await getReportByMonth(m);
        if (!rec?.html) continue;
        downloadFile(`javdb-insights-${m}.html`, rec.html, 'text/html;charset=utf-8');
      }
      if (!months.length) {
        try { showMessage('未选择可导出的历史项', 'info'); } catch {}
      }
    } catch {}
  }

  async function exportSelectedMd(months: string[]): Promise<void> {
    try {
      for (const m of months) {
        const md = buildInsightsMarkdownPlaceholder(m);
        downloadFile(`javdb-insights-${m}.md`, md, 'text/markdown;charset=utf-8');
      }
      if (!months.length) {
        try { showMessage('未选择可导出的历史项', 'info'); } catch {}
      }
    } catch {}
  }

  async function performExport(format: InsightsRuntimeExportFormat): Promise<void> {
    const months = getSelectedHistoryMonths();
    if (months.length > 0) {
      if (format === 'html') return exportSelectedHtml(months);
      if (format === 'md') return exportSelectedMd(months);
      if (format === 'json') return exportSelectedJson(months);
      return;
    }
    if (format === 'html') return handleExportHTML();
    if (format === 'md') return handleExportMD();
    try { showMessage('请先勾选历史项以导出 JSON', 'info'); } catch {}
  }

  function setupExportDropdown(btn: HTMLButtonElement | null): void {
    if (!btn) return;
    const MID = 'insights-export-menu';
    let timer: number | undefined;
    const show = () => {
      let menu = doc.getElementById(MID) as HTMLDivElement | null;
      if (!menu) {
        menu = doc.createElement('div');
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
          '<div data-fmt="json" style="padding:6px 10px; border-radius:6px; cursor:pointer;">导出 JSON</div>',
        ].join('');
        menu.onmouseenter = () => { if (timer) { clearTimeout(timer); timer = undefined as any; } };
        menu.onmouseleave = () => { timer = window.setTimeout(() => menu?.remove(), 160); };
        menu.onclick = async (ev) => {
          const t = ev.target as HTMLElement;
          const fmt = t?.getAttribute('data-fmt') as InsightsRuntimeExportFormat | null;
          if (fmt) {
            await performExport(fmt);
            menu?.remove();
          }
        };
        doc.body.appendChild(menu);
      }
      const rect = btn.getBoundingClientRect();
      menu.style.left = Math.round(rect.left) + 'px';
      menu.style.top = Math.round(rect.bottom + 6) + 'px';
    };
    const hideLater = () => {
      const menu = doc.getElementById(MID) as HTMLDivElement | null;
      if (!menu) return;
      timer = window.setTimeout(() => menu?.remove(), 160);
    };
    btn.addEventListener('mouseenter', show);
    btn.addEventListener('mouseleave', hideLater);
  }

  return {
    getSelectedHistoryMonths,
    performExport,
    setupExportDropdown,
    inlineAssets,
  };
}
