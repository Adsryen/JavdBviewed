import { beforeEach, describe, expect, it } from 'vitest';
import { createInsightsConfirmRuntime } from '../../src/dashboard/tabs/insights/confirmRuntime';

describe('insights confirm runtime', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('resolves false when user clicks cancel', async () => {
    const runtime = createInsightsConfirmRuntime({ documentRef: document });
    const resultPromise = runtime.confirmDialog({
      title: '确认生成',
      message: '该时间范围的报告已存在。',
      okText: '继续',
      cancelText: '取消生成',
    });

    const overlay = document.querySelector<HTMLDivElement>('#insights-confirm-overlay');
    expect(overlay?.textContent).toContain('确认生成');
    expect(overlay?.textContent).toContain('该时间范围的报告已存在。');

    overlay?.querySelectorAll<HTMLButtonElement>('button')[0]?.click();

    await expect(resultPromise).resolves.toBe(false);
    expect(document.querySelector('#insights-confirm-overlay')).toBeNull();
  });

  it('replaces existing overlay and resolves true when user confirms', async () => {
    document.body.innerHTML = '<div id="insights-confirm-overlay"></div>';
    const runtime = createInsightsConfirmRuntime({ documentRef: document });

    const resultPromise = runtime.confirmDialog({
      message: '覆盖已保存内容？',
      okText: '覆盖保存',
    });

    const overlay = document.querySelector<HTMLDivElement>('#insights-confirm-overlay');
    expect(overlay?.textContent).toContain('确认');
    expect(overlay?.textContent).toContain('覆盖保存');

    overlay?.querySelectorAll<HTMLButtonElement>('button')[1]?.click();

    await expect(resultPromise).resolves.toBe(true);
    expect(document.querySelector('#insights-confirm-overlay')).toBeNull();
  });
});
