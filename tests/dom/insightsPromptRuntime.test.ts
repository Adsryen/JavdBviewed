import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInsightsPromptRuntime } from '../../src/dashboard/tabs/insights/promptRuntime';

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('insights prompt runtime', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('inserts the prompt button, displays current persona, and saves modal settings', async () => {
    let settings: any = {
      insights: {
        prompts: {
          persona: 'maid',
          enableCustom: false,
        },
      },
    };
    const showMessage = vi.fn();

    document.body.innerHTML = `
      <span id="insights-current-persona"></span>
      <div id="insights-toolbar-row2-actions">
        <button id="insights-generate">生成报告</button>
      </div>
    `;

    const runtime = createInsightsPromptRuntime({
      documentRef: document,
      getSettings: async () => settings,
      saveSettings: async next => { settings = next; },
      showMessage,
      getAllPersonas: () => [
        { id: 'doctor', name: '医生', description: '专业医生' },
        { id: 'maid', name: '女仆', description: '温柔女仆' },
      ],
      buildPrompts: ({ persona }) => ({
        system: `system-${persona}`,
        rules: `rules-${persona}`,
      }),
    });

    const button = runtime.ensurePromptsButton();

    expect(button?.id).toBe('insights-edit-prompts');
    expect(document.querySelector('#insights-toolbar-row2-actions')?.firstElementChild).toBe(button);

    await runtime.updateCurrentPersonaDisplay();
    expect(document.querySelector('#insights-current-persona')?.textContent).toBe('女仆');

    await runtime.openPromptsModal();
    const overlay = document.querySelector<HTMLDivElement>('#insights-prompts-overlay');
    expect(overlay).toBeTruthy();

    const select = overlay?.querySelector('select') as HTMLSelectElement;
    const enableCheckbox = overlay?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    const textareas = Array.from(overlay?.querySelectorAll('textarea') ?? []) as HTMLTextAreaElement[];

    expect(select.value).toBe('maid');
    expect(textareas[0].disabled).toBe(true);
    expect(textareas[1].disabled).toBe(true);

    select.value = 'doctor';
    select.dispatchEvent(new Event('change'));
    expect(textareas[0].value).toBe('system-doctor');
    expect(textareas[1].value).toBe('rules-doctor');

    enableCheckbox.checked = true;
    enableCheckbox.dispatchEvent(new Event('change'));
    textareas[0].value = 'custom-system';
    textareas[1].value = 'custom-rules';

    overlay?.querySelector<HTMLButtonElement>('.btn-primary')?.click();
    await flushPromises();

    expect(settings.insights.prompts).toEqual({
      persona: 'doctor',
      enableCustom: true,
      systemOverride: 'custom-system',
      rulesOverride: 'custom-rules',
    });
    expect(showMessage).toHaveBeenCalledWith('已保存提示词设置', 'success');
    expect(document.querySelector('#insights-prompts-overlay')).toBeNull();
  });
});
