/**
 * @file enhancementSettingsActions.ts
 * @description 功能增强设置动作：持久化、诊断导出、AI 模型读取
 * @module apps/dashboard/pages/settings/enhancement
 */
import type { ExtensionSettings } from '../../../../../types';
import {
  applyEnhancementFormToSettings,
  mapSettingsToEnhancementForm,
  validateEnhancementForm,
  type EnhancementSettingsFormState,
} from './enhancementSettingsModel';
import {
  getSettings,
  saveSettings,
  syncDashboardState,
  notifyJavdbTabsSettingsUpdated,
} from '../shared/settingsPersist';

export async function toast(
  message: string,
  type: 'success' | 'info' | 'error' | 'warning' = 'info',
): Promise<void> {
  try {
    const { showMessage } = await import('../../../../../dashboard/ui/toast');
    showMessage(message, type as any);
  } catch {
    /* ignore */
  }
}

/**
 * 加载表单
 */
export async function loadEnhancementSettingsForm(): Promise<EnhancementSettingsFormState> {
  const settings = await getSettings();
  return mapSettingsToEnhancementForm(settings);
}

/**
 * 广播设置更新（大小写两套，对齐遗留）
 */
export function broadcastEnhancementSettings(settings: ExtensionSettings): void {
  notifyJavdbTabsSettingsUpdated();
  try {
    chrome.tabs.query({ url: '*://javdb.com/*' }, (tabs) => {
      tabs.forEach((tab) => {
        if (!tab.id) return;
        try {
          chrome.tabs.sendMessage(
            tab.id,
            { type: 'SETTINGS_UPDATED', settings },
            () => {
              if (chrome.runtime.lastError) {
                /* ignore */
              }
            },
          );
        } catch {
          /* ignore */
        }
      });
    });
  } catch {
    /* ignore */
  }
}

/**
 * 持久化增强设置
 */
export async function persistEnhancementForm(
  form: EnhancementSettingsFormState,
): Promise<{ ok: boolean; error?: string }> {
  const validation = validateEnhancementForm(form);
  if (!validation.isValid) {
    return { ok: false, error: validation.errors[0] || '校验失败' };
  }
  try {
    const current = await getSettings();
    const next = applyEnhancementFormToSettings(current, form);
    await saveSettings(next);
    await syncDashboardState(next);
    broadcastEnhancementSettings(next);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : '保存失败',
    };
  }
}

/**
 * 读取 AI 当前模型名（翻译区展示）
 */
export async function readAiSelectedModelLabel(): Promise<string> {
  try {
    const { aiService } = await import('../../../../../features/ai');
    await aiService.ready();
    const model = (aiService.getSettings()?.selectedModel || '').trim();
    return model || '';
  } catch {
    return '';
  }
}

/**
 * 跳转 AI 设置
 */
export function navigateToAISettings(): void {
  try {
    window.location.hash = '#tab-settings/ai-settings';
    window.dispatchEvent(
      new CustomEvent('settingsSubSectionChange' as any, {
        detail: { section: 'ai-settings' },
      }),
    );
  } catch {
    /* ignore */
  }
}

/**
 * 导出编排诊断包（简化：告警诊断 + 版本信息）
 */
export async function exportOrchestrationDiagnostics(): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    let alarmDiagnostics: Record<string, unknown> | null = null;
    try {
      const resp = await chrome.runtime.sendMessage({ type: 'GET_ALARM_DIAGNOSTICS' });
      if (resp && typeof resp === 'object') {
        alarmDiagnostics = (resp as any).data || (resp as any);
      }
    } catch {
      /* background 可能未就绪 */
    }

    const { buildOrchestrationDiagnosticsBundle, stringifyDiagnosticsBundle } = await import(
      '../../../../../dashboard/tabs/settings/enhancement/diagnostics/orchestrationDiagnosticsBundle'
    );

    let extensionVersion = 'unknown';
    try {
      extensionVersion = chrome.runtime.getManifest()?.version || 'unknown';
    } catch {
      /* ignore */
    }

    const bundle = buildOrchestrationDiagnosticsBundle({
      extensionVersion,
      alarmDiagnostics,
      meta: {
        note: 'React enhancement settings page export',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      },
    });
    const text = stringifyDiagnosticsBundle(bundle);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orchestration-diagnostics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : '导出失败',
    };
  }
}

/**
 * 请求后台告警诊断摘要（用于 UI 提示）
 */
export async function fetchAlarmDiagnosticsSummary(): Promise<string> {
  try {
    const resp = await chrome.runtime.sendMessage({ type: 'GET_ALARM_DIAGNOSTICS' });
    if (!resp) return '未获取到后台定时诊断数据';
    const data = (resp as any).data || resp;
    const alarms = Array.isArray(data?.alarms)
      ? data.alarms
      : Array.isArray(data?.items)
        ? data.items
        : null;
    if (alarms) {
      return `后台定时任务：共 ${alarms.length} 条记录`;
    }
    if (typeof data === 'object') {
      const keys = Object.keys(data as object);
      return `后台定时诊断已返回（字段：${keys.slice(0, 6).join(', ')}${keys.length > 6 ? '…' : ''}）`;
    }
    return '已收到后台定时诊断响应';
  } catch (err) {
    return `获取失败：${err instanceof Error ? err.message : '未知错误'}`;
  }
}
