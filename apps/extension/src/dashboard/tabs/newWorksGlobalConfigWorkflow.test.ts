import { describe, expect, it, vi } from 'vitest';
import { runNewWorksGlobalConfigWorkflow } from './newWorksGlobalConfigWorkflow';

const currentConfig = { autoCheckEnabled: true, maxWorksPerCheck: 20 };
const nextConfig = { autoCheckEnabled: false, maxWorksPerCheck: 30 };

function deps(overrides: Partial<Parameters<typeof runNewWorksGlobalConfigWorkflow>[0]['deps']> = {}) {
  return {
    initialize: vi.fn(async () => undefined),
    getGlobalConfig: vi.fn(async () => currentConfig),
    showConfigModal: vi.fn(async () => nextConfig),
    updateGlobalConfig: vi.fn(async () => undefined),
    restartScheduler: vi.fn(async () => undefined),
    render: vi.fn(async () => undefined),
    showMessage: vi.fn(),
    logInfo: vi.fn(),
    logWarn: vi.fn(),
    logError: vi.fn(),
    ...overrides,
  };
}

describe('new works global config workflow', () => {
  it('loads current config and stops when user cancels modal', async () => {
    const runtimeDeps = deps({
      showConfigModal: vi.fn(async () => null),
    });

    await runNewWorksGlobalConfigWorkflow({ deps: runtimeDeps });

    expect(runtimeDeps.initialize).toHaveBeenCalledTimes(1);
    expect(runtimeDeps.getGlobalConfig).toHaveBeenCalledTimes(1);
    expect(runtimeDeps.showConfigModal).toHaveBeenCalledWith(currentConfig);
    expect(runtimeDeps.updateGlobalConfig).not.toHaveBeenCalled();
    expect(runtimeDeps.restartScheduler).not.toHaveBeenCalled();
    expect(runtimeDeps.render).not.toHaveBeenCalled();
    expect(runtimeDeps.logInfo).toHaveBeenCalledWith('用户取消了设置');
  });

  it('saves config, restarts scheduler, renders and shows success', async () => {
    const runtimeDeps = deps();

    await runNewWorksGlobalConfigWorkflow({ deps: runtimeDeps });

    expect(runtimeDeps.updateGlobalConfig).toHaveBeenCalledWith(nextConfig);
    expect(runtimeDeps.restartScheduler).toHaveBeenCalledTimes(1);
    expect(runtimeDeps.render).toHaveBeenCalledTimes(1);
    expect(runtimeDeps.showMessage).toHaveBeenCalledWith('设置已保存', 'success');
  });

  it('continues save success when scheduler restart fails', async () => {
    const runtimeDeps = deps({
      restartScheduler: vi.fn(async () => { throw new Error('restart failed'); }),
    });

    await runNewWorksGlobalConfigWorkflow({ deps: runtimeDeps });

    expect(runtimeDeps.logWarn).toHaveBeenCalledWith('重启自动检查失败:', expect.any(Error));
    expect(runtimeDeps.render).toHaveBeenCalledTimes(1);
    expect(runtimeDeps.showMessage).toHaveBeenCalledWith('设置已保存', 'success');
  });

  it('reports errors while opening or saving config', async () => {
    const runtimeDeps = deps({
      updateGlobalConfig: vi.fn(async () => { throw new Error('save failed'); }),
    });

    await runNewWorksGlobalConfigWorkflow({ deps: runtimeDeps });

    expect(runtimeDeps.logError).toHaveBeenCalledWith('打开或保存设置失败:', expect.any(Error));
    expect(runtimeDeps.showMessage).toHaveBeenCalledWith('设置失败，请重试: save failed', 'error');
    expect(runtimeDeps.render).not.toHaveBeenCalled();
  });
});
