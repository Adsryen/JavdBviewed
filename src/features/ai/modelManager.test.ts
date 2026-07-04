import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AISettings } from '../../types/ai';
import { ModelManager } from './modelManager';

const baseSettings: AISettings = {
  enabled: true,
  apiUrl: 'https://api.example.com',
  apiKey: 'test-api-key',
  selectedModel: 'qwen3-test',
  temperature: 0.7,
  maxTokens: 1024,
  streamEnabled: false,
  systemPrompt: '',
  timeout: 10,
  autoRetryEmpty: false,
  autoRetryMax: 0,
  errorRetryEnabled: false,
  errorRetryMax: 0,
};

describe('ModelManager', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('skips model cache storage quietly when chrome storage is unavailable', async () => {
    vi.stubGlobal('chrome', undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    new ModelManager(baseSettings);
    await Promise.resolve();

    expect(warnSpy).not.toHaveBeenCalled();
  });
});
