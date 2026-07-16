/**
 * @file aiSettingsActions.ts
 * @description AI 设置动作：连接测试、刷新模型、测试消息、导入导出
 * @module apps/dashboard/pages/settings/ai
 */
import type { AIModel, ChatCompletionResponse, ConnectionTestResult } from '../../../../../types/ai';
import {
  formToAiSettings,
  getConversationParamsPartial,
  toExportableAiSettings,
  type AiSettingsFormState,
} from './aiSettingsModel';

async function toast(
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
 * 确保 aiService 已就绪并返回当前设置映射用原始对象
 */
export async function loadAiSettingsFromService(): Promise<AiSettingsFormState> {
  const { aiService } = await import('../../../../../features/ai');
  await aiService.ready();
  const { mapSettingsToAiForm } = await import('./aiSettingsModel');
  return mapSettingsToAiForm(aiService.getSettings());
}

/**
 * 持久化完整表单到 aiService
 */
export async function persistAiForm(form: AiSettingsFormState): Promise<void> {
  const { aiService } = await import('../../../../../features/ai');
  await aiService.saveSettings(formToAiSettings(form));
}

/**
 * 仅保存对话参数（遗留 auto-save 范围）
 */
export async function persistConversationParams(form: AiSettingsFormState): Promise<void> {
  const { aiService } = await import('../../../../../features/ai');
  await aiService.saveSettings(getConversationParamsPartial(form));
}

/**
 * 立即保存模型选择
 */
export async function persistSelectedModel(selectedModel: string): Promise<void> {
  const { aiService } = await import('../../../../../features/ai');
  await aiService.saveSettings({ selectedModel });
}

/**
 * 保存凭据（测试连接 / 刷新模型前）
 */
export async function persistCredentials(form: Pick<AiSettingsFormState, 'apiUrl' | 'apiKey'>): Promise<void> {
  const { aiService } = await import('../../../../../features/ai');
  await aiService.saveSettings({
    apiUrl: form.apiUrl.trim(),
    apiKey: form.apiKey.trim(),
  });
}

/**
 * 测试连接
 */
export async function testAiConnection(
  form: AiSettingsFormState,
): Promise<ConnectionTestResult> {
  await persistCredentials(form);
  const { aiService } = await import('../../../../../features/ai');
  return aiService.testConnection();
}

/**
 * 刷新模型列表
 */
export async function refreshAiModels(form: AiSettingsFormState): Promise<AIModel[]> {
  await persistCredentials(form);
  const { aiService } = await import('../../../../../features/ai');
  return aiService.getAvailableModels(true);
}

/**
 * 非强制刷新（首屏若已有 selectedModel）
 */
export async function loadAiModelsCached(): Promise<AIModel[]> {
  const { aiService } = await import('../../../../../features/ai');
  return aiService.getAvailableModels(false);
}

export type StreamTestHandlers = {
  onChunk: (chunk: ChatCompletionResponse, fullReply: string) => void;
  onComplete: (info: { fullReply: string; modelName: string; durationSec: number; tokens: number }) => void;
  onError: (error: Error) => void;
};

/**
 * 发送流式测试消息
 */
export async function sendAiTestMessage(
  message: string,
  handlers: StreamTestHandlers,
): Promise<void> {
  const { aiService } = await import('../../../../../features/ai');
  let fullReply = '';
  let modelName = '';
  const startTime = Date.now();

  await aiService.sendStreamMessage(
    [{ role: 'user', content: message }],
    (chunk) => {
      const content = chunk.choices?.[0]?.delta?.content || '';
      if (content) {
        fullReply += content;
        modelName = chunk.model || modelName;
        handlers.onChunk(chunk, fullReply);
      }
    },
    () => {
      const durationSec = (Date.now() - startTime) / 1000;
      const tokens = aiService.estimateTokenUsage(`${message}\n${fullReply}`);
      handlers.onComplete({
        fullReply,
        modelName,
        durationSec,
        tokens,
      });
    },
    (error) => {
      handlers.onError(error instanceof Error ? error : new Error(String(error || '未知错误')));
    },
  );
}

/**
 * 重置为默认
 */
export async function resetAiSettings(): Promise<void> {
  const { aiService } = await import('../../../../../features/ai');
  await aiService.resetSettings();
}

/**
 * 导出设置 JSON 文件（不含 apiKey）
 */
export function exportAiSettingsFile(form: AiSettingsFormState): void {
  const settings = toExportableAiSettings(form);
  const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ai-settings-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 通过文件选择器导入设置（保留当前 apiKey）
 */
export function pickImportAiSettingsFile(): Promise<Record<string, unknown> | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (typeof parsed !== 'object' || parsed == null) {
          throw new Error('无效的设置文件格式');
        }
        resolve(parsed as Record<string, unknown>);
      } catch (err) {
        resolve(null);
        await toast(
          '导入AI设置失败：' + (err instanceof Error ? err.message : '未知错误'),
          'error',
        );
      }
    };
    input.click();
  });
}

export { toast };
