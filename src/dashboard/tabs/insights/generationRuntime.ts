import type { PersonaId } from '../../../features/insights';
import { buildMonthRangePeriod } from './reportPeriodModel';
import {
  buildReportGenerationFields as defaultBuildReportGenerationFields,
  resolveInsightsModelOverride,
} from './reportGenerationModel';

type ConfirmDialog = (options: {
  title?: string;
  message: string;
  okText?: string;
  cancelText?: string;
}) => Promise<boolean>;

interface CreateInsightsGenerationRuntimeOptions {
  documentRef?: Document;
  showLoading: (show: boolean) => void;
  clearStatus: () => void;
  showStatus: (message: string, kind?: 'info' | 'error') => void;
  previewSample: () => Promise<void>;
  dbInsReportsGet: (month: string) => Promise<unknown>;
  confirmDialog: ConfirmDialog;
  getSettings: () => Promise<any>;
  buildStatsForPeriod: (input: any) => Promise<any>;
  dbInsViewsRange: (...args: any[]) => Promise<any>;
  fetchAllVideoRecordsPaged: (pageSize?: number) => Promise<any[]>;
  addTrace: (...args: any[]) => void;
  getPersonaName: (persona: PersonaId) => string;
  loadTemplate: () => Promise<string>;
  generateReportHTML: (input: any) => Promise<string>;
  writePreview: (html: string, options: { canSave: boolean }) => unknown;
  getAiLastError: () => string | undefined;
  getPageModelOverride?: () => string | undefined;
  logError: (message: string, error: unknown) => void;
  getBaseHref: () => string;
  now?: () => Date;
  buildReportGenerationFields?: typeof defaultBuildReportGenerationFields;
}

export interface InsightsGenerationRuntime {
  handleGenerate: () => Promise<void>;
}

const ALLOWED_PERSONAS = ['doctor', 'default', 'maid', 'tsundere', 'yandere', 'analyst', 'friend', 'bro'];

export function createInsightsGenerationRuntime(
  options: CreateInsightsGenerationRuntimeOptions,
): InsightsGenerationRuntime {
  const doc = options.documentRef ?? document;
  const buildReportGenerationFields = options.buildReportGenerationFields ?? defaultBuildReportGenerationFields;

  function getEl<T extends HTMLElement>(id: string): T | null {
    return doc.getElementById(id) as T | null;
  }

  async function handleGenerate(): Promise<void> {
    options.showLoading(true);
    options.clearStatus();
    const startEl = getEl<HTMLInputElement>('insights-month-start');
    const endEl = getEl<HTMLInputElement>('insights-month-end');
    const startMonthStr = (startEl?.value || '').trim();
    const endMonthStr = (endEl?.value || '').trim();
    try {
      if (!startMonthStr || !endMonthStr) {
        await options.previewSample();
        return;
      }

      const period = buildMonthRangePeriod(startMonthStr, endMonthStr);
      try {
        const exists = await options.dbInsReportsGet(period.periodKey);
        if (exists) {
          const ok = await options.confirmDialog({
            title: '确认生成（已存在同范围报告）',
            message: '该时间范围的报告已存在。继续将仅在右侧生成“预览”，不会自动覆盖已保存的报告；如需覆盖，请在“保存为月报”时再确认。',
            okText: '继续仅预览',
            cancelText: '取消',
          });
          if (!ok) return;
        }
      } catch {}

      const settings = await options.getSettings();
      const insightsSettings = settings?.insights || {};
      const aggregation = await options.buildStatsForPeriod({
        period,
        insightsSettings,
        dbInsViewsRange: options.dbInsViewsRange,
        fetchAllVideoRecordsPaged: options.fetchAllVideoRecordsPaged,
        statusScopeFallback: 'viewed_browsed',
        onFallback: options.showStatus,
        addTrace: options.addTrace,
      });
      const { stats, days, modeUsed, baselineCount, newCount } = aggregation;

      const extSettings = await options.getSettings();
      const promptSettings = extSettings?.insights?.prompts || {};
      const usePersona = (ALLOWED_PERSONAS.includes(promptSettings?.persona) ? promptSettings.persona : 'doctor') as PersonaId;
      const fields = buildReportGenerationFields({
        stats,
        startDate: period.startDate,
        endDate: period.endDate,
        startText: period.periodStart,
        endText: period.periodEnd,
        daysCount: days.length,
        modeUsed,
        baselineCount,
        newCount,
        personaName: options.getPersonaName(usePersona),
        baseHref: options.getBaseHref(),
        generatedAt: (options.now?.() ?? new Date()).toLocaleString(),
      });
      const templateHTML = await options.loadTemplate();
      const modelSelect = getEl<HTMLSelectElement>('insights-model-select');
      const modelInput = getEl<HTMLInputElement>('insights-model-custom');
      const modelOverride = resolveInsightsModelOverride({
        hasSelector: !!modelSelect,
        selectedValue: modelSelect?.value,
        customValue: modelInput?.value,
        fallbackOverride: options.getPageModelOverride?.(),
      });
      const html = await options.generateReportHTML({
        templateHTML,
        stats,
        baseFields: fields,
        modelOverride,
      });
      options.writePreview(html, { canSave: true });

      const lastError = options.getAiLastError();
      if (lastError) {
        options.showStatus(`AI 生成失败，已使用本地模板：${lastError}`, 'error');
      } else {
        options.clearStatus();
      }
    } catch (error) {
      options.logError('[Insights] 生成报告失败', error);
      const message = error instanceof Error ? error.message : String(error || '');
      options.showStatus(`生成失败：${message}`, 'error');
    } finally {
      options.showLoading(false);
    }
  }

  return {
    handleGenerate,
  };
}
