/**
 * @file actorEnhancementContextInvalidated.test.ts
 * @description 演员页增强在扩展上下文失效时的日志降级回归测试
 * @module tests/dom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

const getValueMock = vi.fn();
const setValueMock = vi.fn();

vi.mock('../../src/utils/storage', () => ({
  getValue: getValueMock,
  setValue: setValueMock,
  getSettings: vi.fn(() => Promise.resolve({})),
}));

vi.mock('../../src/platform/browser/toast', () => ({
  showToast: vi.fn(),
}));

vi.mock('../../src/features/actors', () => ({
  actorManager: {},
}));

vi.mock('../../src/features/newWorks', () => ({
  newWorksManager: {},
}));

vi.mock('../../src/features/actorRemarks', () => ({
  actorExtraInfoService: {},
}));

vi.mock('../../src/platform/tasks', () => ({
  completeManagedTask: vi.fn(),
  createManagedTaskDescriptor: vi.fn(),
  ensureManagedTaskRegistered: vi.fn(),
  failManagedTask: vi.fn(),
  requestTaskLease: vi.fn(),
  trackActiveManagedTask: vi.fn(),
  untrackActiveManagedTask: vi.fn(),
}));

vi.mock('../../src/platform/browser/enhancementLoadingIndicator', () => ({
  showEnhancementDone: vi.fn(),
  showEnhancementLoading: vi.fn(),
}));

describe('actor enhancement context invalidated handling', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    getValueMock.mockReset();
    setValueMock.mockReset();
    document.body.innerHTML = '';
    window.history.replaceState(null, '', '/');
  });

  it('does not log an error when saving tag filters after extension context invalidates', async () => {
    const { actorEnhancementManager } = await import('../../src/features/actorEnhancement/actorEnhancementManager');
    const managerState = actorEnhancementManager as unknown as {
      isActorPage: boolean;
      currentActorId: string;
    };
    managerState.isActorPage = true;
    managerState.currentActorId = 'xv6BV';
    window.history.replaceState(null, '', '/actors/xv6BV?sort_type=0&t=s%2Cd');
    getValueMock.mockRejectedValueOnce(new Error('Extension context invalidated.'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    await actorEnhancementManager.saveCurrentTagFilter();

    expect(errorSpy).not.toHaveBeenCalled();
    expect(debugSpy).toHaveBeenCalledWith(
      '[ActorEnhancement] 保存标签过滤器已跳过：扩展上下文已失效',
      expect.objectContaining({ error: 'Extension context invalidated.' }),
    );
    expect(setValueMock).not.toHaveBeenCalled();
  });
});
