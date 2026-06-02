import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInsightsExportRuntime } from '../../src/dashboard/tabs/insights/exportRuntime';

describe('insights export runtime', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('exports current preview and selected history reports', async () => {
    const downloadFile = vi.fn();
    const showMessage = vi.fn();
    const getReportByMonth = vi.fn(async (month: string) => {
      if (month === '2026-05') return { month, html: '<html>saved</html>', value: 1 };
      return null;
    });

    document.body.innerHTML = `
      <input id="insights-month-start" value="2026-05">
      <input id="insights-month-end" value="2026-06">
      <iframe id="insights-preview"></iframe>
      <div id="insights-history-list"></div>
    `;
    const iframe = document.querySelector<HTMLIFrameElement>('#insights-preview')!;
    iframe.srcdoc = '<html><body>preview</body></html>';

    const runtime = createInsightsExportRuntime({
      documentRef: document,
      downloadFile,
      showMessage,
      getReportByMonth,
      inlineAssets: async html => `inlined:${html}`,
      now: () => new Date('2026-06-02T00:00:00Z'),
    });

    await runtime.performExport('html');
    expect(downloadFile).toHaveBeenCalledWith(
      'javdb-insights-202605~202606.html',
      'inlined:<html><body>preview</body></html>',
      'text/html;charset=utf-8',
    );

    await runtime.performExport('md');
    expect(downloadFile).toHaveBeenCalledWith(
      'javdb-insights-202605~202606.md',
      expect.stringContaining('# 观影标签月报（预览）'),
      'text/markdown;charset=utf-8',
    );

    await runtime.performExport('json');
    expect(showMessage).toHaveBeenCalledWith('请先勾选历史项以导出 JSON', 'info');

    document.querySelector('#insights-history-list')!.innerHTML = `
      <input class="history-select" type="checkbox" data-month="2026-05" checked>
      <input class="history-select" type="checkbox" data-month="2026-06" checked>
    `;

    await runtime.performExport('json');
    expect(getReportByMonth).toHaveBeenCalledWith('2026-05');
    expect(getReportByMonth).toHaveBeenCalledWith('2026-06');
    expect(downloadFile).toHaveBeenCalledWith(
      'javdb-insights-selected-20260602.json',
      JSON.stringify({ items: [{ month: '2026-05', html: '<html>saved</html>', value: 1 }] }, null, 2),
      'application/json;charset=utf-8',
    );
  });
});
