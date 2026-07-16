import { describe, expect, it, vi } from 'vitest';
import { runNewWorksManualCheckWorkflow } from './newWorksManualCheckWorkflow';

function deps(overrides: Partial<Parameters<typeof runNewWorksManualCheckWorkflow>[0]['deps']> = {}) {
  return {
    setCheckingButtonLoading: vi.fn(),
    getSubscriptions: vi.fn(async () => [{ enabled: true }, { enabled: false }]),
    ensureProgressUI: vi.fn(),
    updateProgressUI: vi.fn(),
    attachProgressListener: vi.fn(),
    detachProgressListener: vi.fn(),
    hideProgressUIAfter: vi.fn(),
    sendManualCheck: vi.fn(async () => ({
      success: true,
      result: {
        identifiedTotal: 4,
        effectiveTotal: 2,
        discovered: 1,
        errors: [],
      },
    })),
    render: vi.fn(async () => undefined),
    showMessage: vi.fn(),
    logWarn: vi.fn(),
    logError: vi.fn(),
    ...overrides,
  };
}

describe('new works manual check workflow', () => {
  it('shows warning and skips background check when there are no active subscriptions', async () => {
    const runtimeDeps = deps({
      getSubscriptions: vi.fn(async () => [{ enabled: false }]),
    });

    await runNewWorksManualCheckWorkflow({ deps: runtimeDeps });

    expect(runtimeDeps.setCheckingButtonLoading).toHaveBeenNthCalledWith(1, true);
    expect(runtimeDeps.showMessage).toHaveBeenCalledWith('没有活跃的订阅演员，请先添加订阅', 'warn');
    expect(runtimeDeps.ensureProgressUI).not.toHaveBeenCalled();
    expect(runtimeDeps.sendManualCheck).not.toHaveBeenCalled();
    expect(runtimeDeps.detachProgressListener).toHaveBeenCalledTimes(1);
    expect(runtimeDeps.hideProgressUIAfter).toHaveBeenCalledWith(1500);
    expect(runtimeDeps.setCheckingButtonLoading).toHaveBeenLastCalledWith(false);
  });

  it('runs manual check, renders results and marks progress done on success', async () => {
    const runtimeDeps = deps();

    await runNewWorksManualCheckWorkflow({ deps: runtimeDeps });

    expect(runtimeDeps.ensureProgressUI).toHaveBeenCalledTimes(1);
    expect(runtimeDeps.updateProgressUI).toHaveBeenNthCalledWith(1, {
      processed: 0,
      total: 1,
      identifiedTotal: 0,
      effectiveTotal: 0,
    });
    expect(runtimeDeps.attachProgressListener).toHaveBeenCalledTimes(1);
    expect(runtimeDeps.sendManualCheck).toHaveBeenCalledTimes(1);
    expect(runtimeDeps.render).toHaveBeenCalledTimes(1);
    expect(runtimeDeps.showMessage).toHaveBeenCalledWith('检查完成！已识别 4，有效 2，新增 1', 'success');
    expect(runtimeDeps.updateProgressUI).toHaveBeenLastCalledWith({ done: true });
    expect(runtimeDeps.detachProgressListener).toHaveBeenCalledTimes(1);
    expect(runtimeDeps.hideProgressUIAfter).toHaveBeenCalledWith(1500);
  });

  it('shows cancelled warning message with first error and error count', async () => {
    const runtimeDeps = deps({
      sendManualCheck: vi.fn(async () => ({
        success: true,
        result: {
          identifiedTotal: 6,
          effectiveTotal: 3,
          discovered: 0,
          cancelled: true,
          errors: ['站点 A 失败', '站点 B 失败'],
        },
      })),
    });

    await runNewWorksManualCheckWorkflow({ deps: runtimeDeps });

    expect(runtimeDeps.logWarn).toHaveBeenCalledWith('新作品检查错误详情:', ['站点 A 失败', '站点 B 失败']);
    expect(runtimeDeps.showMessage).toHaveBeenCalledWith(
      '检查已取消（已识别 6，有效 3，新增 0，已保留已获取数据），错误：站点 A 失败（共2个错误，详情请查看控制台）',
      'warn',
    );
  });

  it('reports failed background response and still restores button and progress listener', async () => {
    const runtimeDeps = deps({
      sendManualCheck: vi.fn(async () => ({ success: false, error: '后台失败' })),
    });

    await runNewWorksManualCheckWorkflow({ deps: runtimeDeps });

    expect(runtimeDeps.render).not.toHaveBeenCalled();
    expect(runtimeDeps.logError).toHaveBeenCalledWith('立即检查失败:', expect.any(Error));
    expect(runtimeDeps.showMessage).toHaveBeenCalledWith('检查失败，请重试', 'error');
    expect(runtimeDeps.detachProgressListener).toHaveBeenCalledTimes(1);
    expect(runtimeDeps.hideProgressUIAfter).toHaveBeenCalledWith(1500);
    expect(runtimeDeps.setCheckingButtonLoading).toHaveBeenLastCalledWith(false);
  });
});
