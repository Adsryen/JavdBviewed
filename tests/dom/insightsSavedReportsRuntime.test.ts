import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInsightsSavedReportsRuntime } from '../../src/dashboard/tabs/insights/savedReportsRuntime';

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('insights saved reports runtime', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('saves current preview as a finalized monthly report and refreshes history', async () => {
    const dbInsReportsPut = vi.fn(async (_report: any) => {});
    const buildStatsForPeriod = vi.fn(async () => ({
      stats: { total: 2 },
      days: ['2026-05-01', '2026-05-02'],
    }));

    document.body.innerHTML = `
      <input id="insights-month-start" value="2026-05">
      <input id="insights-month-end" value="2026-05">
      <iframe id="insights-preview"></iframe>
      <div id="insights-history-list"></div>
    `;
    document.querySelector<HTMLIFrameElement>('#insights-preview')!.srcdoc = '<html>preview</html>';

    const runtime = createInsightsSavedReportsRuntime({
      documentRef: document,
      dbInsReportsGet: vi.fn(async () => null),
      dbInsReportsList: vi.fn(async () => []),
      dbInsReportsPut,
      dbInsReportsDelete: vi.fn(),
      dbInsReportsExport: vi.fn(),
      dbInsReportsImport: vi.fn(),
      confirmDialog: vi.fn(),
      getSettings: vi.fn(async () => ({ insights: {} })),
      buildStatsForPeriod,
      dbInsViewsRange: vi.fn(),
      fetchAllVideoRecordsPaged: vi.fn(),
      loadTemplate: vi.fn(),
      getPersonaName: vi.fn(),
      generateReportHTML: vi.fn(),
      writePreview: vi.fn(),
      getPageModelOverride: vi.fn(),
      getBaseHref: () => './',
      updateDeleteSelectedEnabled: vi.fn(),
      buildHistoryEmptyHtml: () => '<p>empty</p>',
      buildHistoryListHtml: vi.fn(),
      now: () => new Date('2026-06-02T10:00:00Z'),
    });

    await runtime.saveCurrentAsMonthly();

    expect(buildStatsForPeriod).toHaveBeenCalledWith(expect.objectContaining({
      statusScopeFallback: 'viewed',
    }));
    expect(dbInsReportsPut).toHaveBeenCalledWith(expect.objectContaining({
      month: '2026-05~2026-05',
      html: '<html>preview</html>',
      status: 'final',
      origin: 'manual',
      stats: { total: 2 },
    }));
    expect(document.querySelector('#insights-history-list')?.innerHTML).toBe('<p>empty</p>');
  });

  it('renders history list and previews selected saved report', async () => {
    const writePreview = vi.fn();
    const updateDeleteSelectedEnabled = vi.fn();

    document.body.innerHTML = '<div id="insights-history-list"></div>';

    const runtime = createInsightsSavedReportsRuntime({
      documentRef: document,
      dbInsReportsGet: vi.fn(async () => ({ month: '2026-05', html: '<html>saved</html>' })),
      dbInsReportsList: vi.fn(async () => [{ month: '2026-05', html: '<html>saved</html>' }]),
      dbInsReportsPut: vi.fn(),
      dbInsReportsDelete: vi.fn(),
      dbInsReportsExport: vi.fn(),
      dbInsReportsImport: vi.fn(),
      confirmDialog: vi.fn(),
      getSettings: vi.fn(),
      buildStatsForPeriod: vi.fn(),
      dbInsViewsRange: vi.fn(),
      fetchAllVideoRecordsPaged: vi.fn(),
      loadTemplate: vi.fn(),
      getPersonaName: vi.fn(),
      generateReportHTML: vi.fn(),
      writePreview,
      getPageModelOverride: vi.fn(),
      getBaseHref: () => './',
      updateDeleteSelectedEnabled,
      buildHistoryEmptyHtml: vi.fn(),
      buildHistoryListHtml: () => `
        <div class="history-item" data-month="2026-05">
          <input class="history-select" type="checkbox">
          <button data-action="preview" data-month="2026-05">预览</button>
        </div>
      `,
    });

    await runtime.refreshHistory();

    const list = document.querySelector<HTMLDivElement>('#insights-history-list')!;
    list.querySelector<HTMLInputElement>('.history-select')?.dispatchEvent(new Event('change', { bubbles: true }));
    list.querySelector<HTMLButtonElement>('[data-action="preview"]')?.click();
    await flushPromises();

    expect(updateDeleteSelectedEnabled).toHaveBeenCalled();
    expect(writePreview).toHaveBeenCalledWith('<html>saved</html>', {
      ensureActions: false,
      updateGrid: false,
    });
  });
});
