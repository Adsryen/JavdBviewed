/**
 * @file aiSettingsModel.test.ts
 * @description AI 设置模型单测
 * @module apps/dashboard/pages/settings/ai
 */
import { describe, expect, it } from 'vitest';
import {
  applyAiFormToSettings,
  DEFAULT_AI_SETTINGS_FORM,
  formToAiSettings,
  getConversationParamsPartial,
  isValidUrl,
  mapSettingsToAiForm,
  mergeImportedAiSettings,
  toExportableAiSettings,
  validateAiForm,
} from './aiSettingsModel';

describe('aiSettingsModel', () => {
  it('defaults match DEFAULT_AI_SETTINGS', () => {
    expect(DEFAULT_AI_SETTINGS_FORM.enabled).toBe(false);
    expect(DEFAULT_AI_SETTINGS_FORM.temperature).toBe(0.7);
    expect(DEFAULT_AI_SETTINGS_FORM.maxTokens).toBe(2048);
    expect(DEFAULT_AI_SETTINGS_FORM.timeout).toBe(600);
    expect(DEFAULT_AI_SETTINGS_FORM.streamEnabled).toBe(true);
    expect(DEFAULT_AI_SETTINGS_FORM.systemPrompt).toContain('中文');
  });

  it('maps empty settings to defaults', () => {
    expect(mapSettingsToAiForm(undefined)).toEqual(DEFAULT_AI_SETTINGS_FORM);
    expect(mapSettingsToAiForm({})).toEqual(DEFAULT_AI_SETTINGS_FORM);
  });

  it('maps nested ExtensionSettings.ai', () => {
    const form = mapSettingsToAiForm({
      ai: {
        enabled: true,
        apiUrl: 'https://api.example.com',
        apiKey: 'sk-test',
        selectedModel: 'gpt-4',
        temperature: 0.5,
        maxTokens: 1024,
        streamEnabled: false,
        systemPrompt: 'hi',
        timeout: 30,
        autoRetryEmpty: true,
        autoRetryMax: 3,
        errorRetryEnabled: true,
        errorRetryMax: 1,
      },
    } as any);
    expect(form.enabled).toBe(true);
    expect(form.apiUrl).toBe('https://api.example.com');
    expect(form.apiKey).toBe('sk-test');
    expect(form.selectedModel).toBe('gpt-4');
    expect(form.temperature).toBe(0.5);
    expect(form.maxTokens).toBe(1024);
    expect(form.streamEnabled).toBe(false);
    expect(form.timeout).toBe(30);
    expect(form.autoRetryEmpty).toBe(true);
    expect(form.autoRetryMax).toBe(3);
    expect(form.errorRetryEnabled).toBe(true);
    expect(form.errorRetryMax).toBe(1);
  });

  it('maps bare AISettings object', () => {
    const form = mapSettingsToAiForm({
      enabled: true,
      apiUrl: 'https://x',
      apiKey: 'k',
      selectedModel: 'm',
      temperature: 1,
      maxTokens: 100,
      streamEnabled: true,
      systemPrompt: 's',
      timeout: 60,
      autoRetryEmpty: false,
      autoRetryMax: 0,
    });
    expect(form.enabled).toBe(true);
    expect(form.selectedModel).toBe('m');
  });

  it('formToAiSettings trims url/key', () => {
    const ai = formToAiSettings({
      ...DEFAULT_AI_SETTINGS_FORM,
      apiUrl: '  https://a.com  ',
      apiKey: '  sk  ',
      enabled: true,
    });
    expect(ai.apiUrl).toBe('https://a.com');
    expect(ai.apiKey).toBe('sk');
  });

  it('applies form back to settings', () => {
    const next = applyAiFormToSettings({} as any, {
      ...DEFAULT_AI_SETTINGS_FORM,
      enabled: true,
      selectedModel: 'gpt',
    });
    expect(next.ai?.enabled).toBe(true);
    expect(next.ai?.selectedModel).toBe('gpt');
  });

  it('getConversationParamsPartial covers legacy auto-save fields', () => {
    const partial = getConversationParamsPartial({
      ...DEFAULT_AI_SETTINGS_FORM,
      temperature: 1.2,
      maxTokens: 512,
    });
    expect(partial.temperature).toBe(1.2);
    expect(partial.maxTokens).toBe(512);
    expect(partial).not.toHaveProperty('apiKey');
    expect(partial).not.toHaveProperty('enabled');
  });

  it('validates enabled form ranges', () => {
    expect(validateAiForm(DEFAULT_AI_SETTINGS_FORM).isValid).toBe(true);

    const bad = validateAiForm({
      ...DEFAULT_AI_SETTINGS_FORM,
      enabled: true,
      apiKey: '',
      apiUrl: 'not-a-url',
      temperature: 3,
      timeout: 1,
      maxTokens: 0,
    });
    expect(bad.isValid).toBe(false);
    expect(bad.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('warns when model missing while enabled', () => {
    const r = validateAiForm({
      ...DEFAULT_AI_SETTINGS_FORM,
      enabled: true,
      apiKey: 'sk',
      selectedModel: '',
    });
    expect(r.isValid).toBe(true);
    expect(r.warnings.some((w) => w.includes('模型'))).toBe(true);
  });

  it('isValidUrl', () => {
    expect(isValidUrl('https://api.openai.com')).toBe(true);
    expect(isValidUrl('nope')).toBe(false);
  });

  it('export strips apiKey; import keeps current key', () => {
    const form = {
      ...DEFAULT_AI_SETTINGS_FORM,
      apiKey: 'secret',
      apiUrl: 'https://a.com',
      enabled: true,
    };
    const exported = toExportableAiSettings(form);
    expect((exported as any).apiKey).toBeUndefined();
    expect(exported.apiUrl).toBe('https://a.com');

    const merged = mergeImportedAiSettings(form, {
      apiUrl: 'https://b.com',
      apiKey: 'should-not-overwrite',
      temperature: 1.5,
    });
    expect(merged.apiKey).toBe('secret');
    expect(merged.apiUrl).toBe('https://b.com');
    expect(merged.temperature).toBe(1.5);
  });
});
