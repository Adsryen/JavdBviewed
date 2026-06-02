import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInsightsGenerationRuntime } from '../../src/dashboard/tabs/insights/generationRuntime';

describe('insights generation runtime', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('shows sample preview when month range is incomplete', async () => {
    const showLoading = vi.fn();
    const clearStatus = vi.fn();
    const previewSample = vi.fn(async () => {});

    document.body.innerHTML = `
      <input id="insights-month-start" value="">
      <input id="insights-month-end" value="">
    `;

    const runtime = createInsightsGenerationRuntime({
      documentRef: document,
      showLoading,
      clearStatus,
      showStatus: vi.fn(),
      previewSample,
      dbInsReportsGet: vi.fn(),
      confirmDialog: vi.fn(),
      getSettings: vi.fn(),
      buildStatsForPeriod: vi.fn(),
      dbInsViewsRange: vi.fn(),
      fetchAllVideoRecordsPaged: vi.fn(),
      addTrace: vi.fn(),
      getPersonaName: vi.fn(),
      loadTemplate: vi.fn(),
      generateReportHTML: vi.fn(),
      writePreview: vi.fn(),
      getAiLastError: vi.fn(),
      logError: vi.fn(),
      getBaseHref: () => './',
    });

    await runtime.handleGenerate();

    expect(showLoading).toHaveBeenNthCalledWith(1, true);
    expect(clearStatus).toHaveBeenCalledTimes(1);
    expect(previewSample).toHaveBeenCalledTimes(1);
    expect(showLoading).toHaveBeenLastCalledWith(false);
  });

  it('generates report html and writes it to preview', async () => {
    const writePreview = vi.fn();
    const clearStatus = vi.fn();
    const buildStatsForPeriod = vi.fn(async () => ({
      stats: { total: 3 },
      days: ['2026-05-01'],
      modeUsed: 'viewed',
      baselineCount: 1,
      newCount: 2,
    }));
    const generateReportHTML = vi.fn(async () => '<html>report</html>');

    document.body.innerHTML = `
      <input id="insights-month-start" value="2026-05">
      <input id="insights-month-end" value="2026-05">
      <select id="insights-model-select">
        <option value="gpt-a" selected>GPT A</option>
      </select>
      <input id="insights-model-custom" value="">
    `;

    const runtime = createInsightsGenerationRuntime({
      documentRef: document,
      showLoading: vi.fn(),
      clearStatus,
      showStatus: vi.fn(),
      previewSample: vi.fn(),
      dbInsReportsGet: vi.fn(async () => null),
      confirmDialog: vi.fn(),
      getSettings: vi.fn(async () => ({ insights: { prompts: { persona: 'maid' } } })),
      buildStatsForPeriod,
      dbInsViewsRange: vi.fn(),
      fetchAllVideoRecordsPaged: vi.fn(),
      addTrace: vi.fn(),
      getPersonaName: vi.fn(() => '女仆'),
      loadTemplate: vi.fn(async () => '<template>{{content}}</template>'),
      generateReportHTML,
      writePreview,
      getAiLastError: vi.fn(() => ''),
      logError: vi.fn(),
      getBaseHref: () => 'chrome-extension://id/',
      now: () => new Date('2026-06-02T10:00:00Z'),
      buildReportGenerationFields: vi.fn(() => ({ content: 'fields' })),
    });

    await runtime.handleGenerate();

    expect(buildStatsForPeriod).toHaveBeenCalledWith(expect.objectContaining({
      statusScopeFallback: 'viewed_browsed',
    }));
    expect(generateReportHTML).toHaveBeenCalledWith(expect.objectContaining({
      templateHTML: '<template>{{content}}</template>',
      stats: { total: 3 },
      baseFields: { content: 'fields' },
      modelOverride: 'gpt-a',
    }));
    expect(writePreview).toHaveBeenCalledWith('<html>report</html>', { canSave: true });
    expect(clearStatus).toHaveBeenCalledTimes(2);
  });
});
