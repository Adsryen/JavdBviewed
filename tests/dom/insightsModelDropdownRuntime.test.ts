import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInsightsModelDropdownRuntime } from '../../src/dashboard/tabs/insights/modelDropdownRuntime';

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('insights model dropdown runtime', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    sessionStorage.clear();
  });

  it('inserts model controls, restores override, and updates page selection state', async () => {
    sessionStorage.setItem('insights_model_override', 'custom-model');
    const showMessage = vi.fn();
    const getAvailableModels = vi.fn(async (_force?: boolean) => [
      { id: 'gpt-a', name: 'GPT A' },
      { id: 'gpt-b' },
    ]);
    let pageModelOverride: string | undefined;

    document.body.innerHTML = `
      <div class="tab-section" data-tab-id="insights">
        <div class="container">
          <div class="insights-toolbar">
            <div class="toolbar-row row-2">
              <div class="toolbar-left">
                <div class="field-inline" id="range-group">范围</div>
                <button id="insights-generate">生成报告</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const runtime = createInsightsModelDropdownRuntime({
      documentRef: document,
      storageRef: sessionStorage,
      readyAi: async () => {},
      getAiSettings: () => ({
        enabled: true,
        selectedModel: 'global-model',
        apiUrl: 'https://example.test/v1',
        apiKey: 'sk-test',
      }),
      getAvailableModels,
      showMessage,
      setPageModelOverride: value => { pageModelOverride = value; },
    });

    const wrap = await runtime.ensureModelDropdown();

    const container = document.querySelector<HTMLDivElement>('.toolbar-left')!;
    expect(wrap?.id).toBe('insights-model-wrap');
    expect(Array.from(container.children).map(el => el.id)).toEqual([
      'range-group',
      'insights-model-sep',
      'insights-model-wrap',
      'insights-generate',
    ]);

    const select = document.querySelector<HTMLSelectElement>('#insights-model-select')!;
    const input = document.querySelector<HTMLInputElement>('#insights-model-custom')!;
    expect(Array.from(select.options).map(opt => [opt.value, opt.textContent])).toEqual([
      ['', '跟随全局（global-model）'],
      ['gpt-a', 'GPT A (gpt-a)'],
      ['gpt-b', 'gpt-b'],
      ['__custom__', '自定义…'],
    ]);
    expect(select.value).toBe('__custom__');
    expect(input.value).toBe('custom-model');
    expect(input.style.display).toBe('');
    expect(pageModelOverride).toBe('custom-model');

    select.value = 'gpt-a';
    select.dispatchEvent(new Event('change'));
    expect(input.style.display).toBe('none');
    expect(pageModelOverride).toBe('gpt-a');
    expect(sessionStorage.getItem('insights_model_override')).toBe('gpt-a');

    select.value = '__custom__';
    input.value = 'manual-model';
    select.dispatchEvent(new Event('change'));
    expect(input.style.display).toBe('');
    expect(pageModelOverride).toBe('manual-model');

    input.value = 'typed-model';
    input.dispatchEvent(new Event('input'));
    expect(pageModelOverride).toBe('typed-model');
    expect(sessionStorage.getItem('insights_model_override')).toBe('typed-model');

    document.querySelector<HTMLButtonElement>('#insights-model-refresh')?.click();
    await flushPromises();
    await flushPromises();

    expect(getAvailableModels).toHaveBeenCalledWith(true);
    expect(showMessage).toHaveBeenCalledWith('模型列表已刷新', 'success');
  });
});
