import { afterEach, describe, expect, it, vi } from 'vitest';
import { NewApiClient } from './newApiClient';
import type { AISettings } from '../../types/ai';

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

describe('NewApiClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sets enable_thinking false for non-stream chat completions', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      id: 'chatcmpl-test',
      object: 'chat.completion',
      created: 0,
      model: 'qwen3-test',
      choices: [{
        index: 0,
        message: { role: 'assistant', content: 'ok' },
        finish_reason: 'stop',
      }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const client = new NewApiClient(baseSettings);
    await client.createChatCompletion({
      model: 'qwen3-test',
      messages: [{ role: 'user', content: '生成报告' }],
      stream: false,
    });

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.stream).toBe(false);
    expect(body.enable_thinking).toBe(false);
  });
});
