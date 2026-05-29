import { aiService } from '../../../../../features/ai';

export type EnhancementTranslationHost = any;

export function updateTranslationConfigVisibility(host: EnhancementTranslationHost): void {
  if (!host.translationConfig) return;
  const enabled = host.enableTranslation?.checked === true;
  host.translationConfig.setAttribute('data-enabled', enabled ? '1' : '0');
}

export function onTranslationProviderChange(host: EnhancementTranslationHost): void {
  applyTranslationProviderUI(host);
  if (host.currentTranslationServiceLabel) {
    const isAI = host.translationProviderSel?.value === 'ai';
    host.currentTranslationServiceLabel.textContent = isAI ? 'AI 翻译' : 'Google 翻译';
  }
  if (host.translationProviderSel?.value === 'ai') {
    void updateAiCurrentModelUI(host);
  }
  host.handleSettingChange();
}

export function onTraditionalServiceChange(host: EnhancementTranslationHost): void {
  if (host.traditionalApiKeyGroup) host.traditionalApiKeyGroup.style.display = 'none';
  host.handleSettingChange();
}

export function applyTranslationProviderUI(host: EnhancementTranslationHost): void {
  const isAI = host.translationProviderSel?.value === 'ai';
  if (host.traditionalConfigContainer) host.traditionalConfigContainer.style.display = isAI ? 'none' : 'block';
  if (host.aiConfigContainer) host.aiConfigContainer.style.display = isAI ? 'block' : 'none';
}

export async function updateAiCurrentModelUI(host: EnhancementTranslationHost): Promise<void> {
  try {
    if (!host.aiCurrentModelLabel || !host.aiModelEmptyTip) return;
    const ai = aiService.getSettings();
    const model = (ai?.selectedModel || '').trim();
    host.aiCurrentModelLabel.textContent = model || '未设置';
    host.aiModelEmptyTip.style.display = model ? 'none' : 'block';
  } catch (e) {
    console.warn('[Enhancement] 获取AI当前模型失败:', e);
  }
}

export function navigateToAISettings(): void {
  try {
    window.location.hash = '#tab-settings/ai-settings';
    window.dispatchEvent(new CustomEvent('settingsSubSectionChange' as any, { detail: { section: 'ai-settings' } }));
  } catch (e) {
    console.warn('[Enhancement] 跳转 AI 设置失败:', e);
  }
}
