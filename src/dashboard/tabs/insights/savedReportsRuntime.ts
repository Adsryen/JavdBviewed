import type { PersonaId } from '../../../features/insights';
import type { ReportMonthly } from '../../../types/insights';
import { buildMonthRangePeriod } from './reportPeriodModel';
import {
  buildReportPlaceholderFields,
  resolveInsightsModelOverride,
} from './reportGenerationModel';
import {
  buildInsightsHistoryEmptyHtml as defaultBuildHistoryEmptyHtml,
  buildInsightsHistoryListHtml as defaultBuildHistoryListHtml,
} from './historyListModel';

type ConfirmDialog = (options: {
  title?: string;
  message: string;
  okText?: string;
  cancelText?: string;
}) => Promise<boolean>;

interface CreateInsightsSavedReportsRuntimeOptions {
  documentRef?: Document;
  dbInsReportsGet: (month: string) => Promise<any>;
  dbInsReportsList: (limit: number) => Promise<any[]>;
  dbInsReportsPut: (report: ReportMonthly) => Promise<void>;
  dbInsReportsDelete: (month: string) => Promise<void>;
  dbInsReportsExport: () => Promise<string>;
  dbInsReportsImport: (json: string) => Promise<unknown>;
  confirmDialog: ConfirmDialog;
  getSettings: () => Promise<any>;
  buildStatsForPeriod: (input: any) => Promise<any>;
  dbInsViewsRange: (...args: any[]) => Promise<any>;
  fetchAllVideoRecordsPaged: (pageSize?: number) => Promise<any[]>;
  loadTemplate: () => Promise<string>;
  getPersonaName: (persona: PersonaId) => string;
  generateReportHTML: (input: any) => Promise<string>;
  writePreview: (html: string, options?: { ensureActions?: boolean; updateGrid?: boolean; canSave?: boolean }) => unknown;
  getPageModelOverride: () => string | undefined;
  getBaseHref: () => string;
  updateDeleteSelectedEnabled: () => void;
  buildHistoryEmptyHtml?: () => string;
  buildHistoryListHtml?: (records: any[]) => string;
  now?: () => Date;
}

export interface InsightsSavedReportsRuntime {
  saveCurrentAsMonthly: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  enforceRetention: (maxMonths?: number) => Promise<void>;
  exportAllJson: () => Promise<void>;
  importAllJson: () => Promise<void>;
}

const ALLOWED_PERSONAS = ['doctor', 'default', 'maid', 'tsundere', 'yandere', 'analyst', 'friend', 'bro'];

export function createInsightsSavedReportsRuntime(
  options: CreateInsightsSavedReportsRuntimeOptions,
): InsightsSavedReportsRuntime {
  const doc = options.documentRef ?? document;
  const buildHistoryEmptyHtml = options.buildHistoryEmptyHtml ?? defaultBuildHistoryEmptyHtml;
  const buildHistoryListHtml = options.buildHistoryListHtml ?? defaultBuildHistoryListHtml;

  function getEl<T extends HTMLElement>(id: string): T | null {
    return doc.getElementById(id) as T | null;
  }

  function getNow(): Date {
    return options.now?.() ?? new Date();
  }

  async function saveCurrentAsMonthly(): Promise<void> {
    const startEl = getEl<HTMLInputElement>('insights-month-start');
    const endEl = getEl<HTMLInputElement>('insights-month-end');
    const startValue = (startEl?.value || '').trim();
    const endValue = (endEl?.value || '').trim();
    if (!startValue || !endValue) return;

    const period = buildMonthRangePeriod(startValue, endValue);
    try {
      const exists = await options.dbInsReportsGet(period.periodKey);
      if (exists) {
        const ok = await options.confirmDialog({
          title: '覆盖已存在的月报？',
          message: '该时间范围的报告已存在。继续将覆盖已保存的内容（不可撤销）。如需保留原版本，建议先导出或备份。',
          okText: '覆盖保存',
          cancelText: '取消',
        });
        if (!ok) return;
      }
    } catch {}

    const settings = await options.getSettings();
    const aggregation = await options.buildStatsForPeriod({
      period,
      insightsSettings: settings?.insights || {},
      dbInsViewsRange: options.dbInsViewsRange,
      fetchAllVideoRecordsPaged: options.fetchAllVideoRecordsPaged,
      statusScopeFallback: 'viewed',
    });
    const stats = aggregation.stats;
    const days = aggregation.days;

    const iframe = getEl<HTMLIFrameElement>('insights-preview');
    let html = iframe?.srcdoc || '';
    if (!html) {
      const templateHTML = await options.loadTemplate();
      const latestSettings = await options.getSettings();
      const persona = latestSettings?.insights?.prompts?.persona;
      const personaId = (ALLOWED_PERSONAS.includes(persona) ? persona : 'doctor') as PersonaId;
      const fields = buildReportPlaceholderFields({
        stats,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        daysCount: days.length,
        personaName: options.getPersonaName(personaId),
        baseHref: options.getBaseHref(),
        generatedAt: getNow().toLocaleString(),
      });
      const modelSelect = getEl<HTMLSelectElement>('insights-model-select');
      const modelInput = getEl<HTMLInputElement>('insights-model-custom');
      const modelOverride = resolveInsightsModelOverride({
        hasSelector: !!modelSelect,
        selectedValue: modelSelect?.value,
        customValue: modelInput?.value,
        fallbackOverride: options.getPageModelOverride(),
      });
      html = await options.generateReportHTML({
        templateHTML,
        stats,
        baseFields: fields,
        modelOverride,
      });
    }

    const nowMs = getNow().getTime();
    const report: ReportMonthly = {
      month: `${period.normalizedStartMonth}~${period.normalizedEndMonth}`,
      period: { start: period.periodStart, end: period.periodEnd },
      stats,
      html,
      createdAt: nowMs,
      finalizedAt: nowMs,
      status: 'final',
      origin: 'manual',
      version: '0.0.1',
    };

    await options.dbInsReportsPut(report);
    await enforceRetention(24);
    await refreshHistory();
  }

  async function refreshHistory(): Promise<void> {
    const listEl = getEl<HTMLDivElement>('insights-history-list');
    if (!listEl) return;
    const records = await options.dbInsReportsList(24);
    if (!records || records.length === 0) {
      listEl.innerHTML = buildHistoryEmptyHtml();
      return;
    }
    listEl.innerHTML = buildHistoryListHtml(records);

    try {
      listEl.onchange = (event) => {
        const target = event.target as HTMLElement;
        if (!target) return;
        if (target.matches && target.matches('input.history-select')) {
          options.updateDeleteSelectedEnabled();
        }
      };
    } catch {}

    options.updateDeleteSelectedEnabled();

    listEl.onclick = async (event) => {
      const target = event.target as HTMLElement;
      const actionTarget = target?.closest?.('[data-action]') as HTMLElement | null;
      const action = actionTarget?.getAttribute?.('data-action');
      const month = actionTarget?.getAttribute?.('data-month') || target?.closest('.history-item')?.getAttribute('data-month') || '';
      if (!action || !month) return;
      if (action === 'preview') {
        const record = await options.dbInsReportsGet(month);
        if (record?.html) {
          options.writePreview(record.html, { ensureActions: false, updateGrid: false });
        }
      }
    };
  }

  async function enforceRetention(maxMonths = 24): Promise<void> {
    const list = await options.dbInsReportsList(200);
    if (!list || list.length <= maxMonths) return;
    const toDelete = list.slice(maxMonths);
    for (const item of toDelete) {
      if (item?.month) await options.dbInsReportsDelete(item.month);
    }
  }

  async function exportAllJson(): Promise<void> {
    const json = await options.dbInsReportsExport();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = doc.createElement('a');
    const now = getNow();
    const name = `javdb-insights-reports-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.json`;
    anchor.href = url;
    anchor.download = name;
    doc.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function importAllJson(): Promise<void> {
    const input = doc.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      await options.dbInsReportsImport(text);
      await refreshHistory();
    };
    input.click();
  }

  return {
    saveCurrentAsMonthly,
    refreshHistory,
    enforceRetention,
    exportAllJson,
    importAllJson,
  };
}
