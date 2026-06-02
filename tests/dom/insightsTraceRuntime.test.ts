import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInsightsTraceRuntime } from '../../src/dashboard/tabs/insights/traceRuntime';

describe('insights trace runtime', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('inserts the trace button, shows empty toast, and renders the trace modal', () => {
    let trace: any = null;
    const showMessage = vi.fn();

    document.body.innerHTML = `
      <div id="insights-toolbar-row2-actions">
        <button id="insights-generate">生成报告</button>
      </div>
    `;

    const runtime = createInsightsTraceRuntime({
      documentRef: document,
      getLastGenerationTrace: () => trace,
      showMessage,
    });

    const button = runtime.ensureTraceButton();
    const actionBar = document.querySelector('#insights-toolbar-row2-actions');

    expect(button?.id).toBe('insights-trace');
    expect(actionBar?.children[0]).toBe(button);
    expect(actionBar?.children[1]?.id).toBe('insights-generate');

    runtime.onTraceClick();
    expect(showMessage).toHaveBeenCalledWith('暂无生成过程，请先点击“生成报告”。', 'info');
    expect(document.querySelector('#insights-trace-overlay')).toBeNull();

    trace = {
      startedAt: Date.UTC(2026, 5, 2, 1, 0, 0),
      endedAt: Date.UTC(2026, 5, 2, 1, 0, 3),
      status: 'success',
      context: {
        model: 'gpt-test',
        endpoint: '/v1/chat/completions',
        temperature: 0.6,
        streamEnabled: false,
      },
      entries: [
        { time: Date.UTC(2026, 5, 2, 1, 0, 1), level: 'info', tag: 'AI', message: 'callStart' },
        { time: Date.UTC(2026, 5, 2, 1, 0, 2), level: 'info', tag: 'AI', message: 'callEnd', data: { elapsedMs: 1000 } },
      ],
      summary: { outputLen: 128, parsedAs: 'json' },
    };

    runtime.onTraceClick();
    const overlay = document.querySelector<HTMLDivElement>('#insights-trace-overlay');

    expect(overlay).toBeTruthy();
    expect(overlay?.textContent).toContain('本次生成过程');
    expect(overlay?.textContent).toContain('success');
    expect(overlay?.textContent).toContain('gpt-test');
    expect(overlay?.textContent).toContain('AI请求中');

    overlay?.querySelector<HTMLButtonElement>('button:last-child')?.click();
    expect(document.querySelector('#insights-trace-overlay')).toBeNull();
  });
});
