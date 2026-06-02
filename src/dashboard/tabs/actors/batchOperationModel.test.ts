import { describe, expect, it } from 'vitest';
import {
  applyActorPageSelection,
  buildActorBatchResultMessage,
  buildBatchBlacklistConfirmationMessage,
  buildBatchSelectionUiState,
  buildBatchSubscribeConfirmationMessage,
} from './batchOperationModel';

describe('actors batch operation model', () => {
  it('applies page selection without dropping selections from other pages', () => {
    expect(Array.from(applyActorPageSelection(new Set(['old']), ['a', 'b'], true))).toEqual(['old', 'a', 'b']);
    expect(Array.from(applyActorPageSelection(new Set(['old', 'a', 'b']), ['a', 'b'], false))).toEqual(['old']);
  });

  it('builds batch selection ui state', () => {
    expect(buildBatchSelectionUiState(new Set(), ['a', 'b'])).toEqual({
      count: 0,
      selectedCountText: '已选择 0 项',
      showBatchOperations: false,
      selectAllChecked: false,
      selectAllIndeterminate: false,
    });

    expect(buildBatchSelectionUiState(new Set(['a']), ['a', 'b'])).toEqual({
      count: 1,
      selectedCountText: '已选择 1 项',
      showBatchOperations: true,
      selectAllChecked: false,
      selectAllIndeterminate: true,
    });

    expect(buildBatchSelectionUiState(new Set(['a', 'b', 'old']), ['a', 'b'])).toMatchObject({
      count: 3,
      showBatchOperations: true,
      selectAllChecked: true,
      selectAllIndeterminate: false,
    });
  });

  it('builds blacklist confirmation messages', () => {
    expect(buildBatchBlacklistConfirmationMessage({ selectedCount: 3, blacklistedCount: 0, notBlacklistedCount: 3 }))
      .toBe('确定要拉黑选中的 3 个演员吗？');
    expect(buildBatchBlacklistConfirmationMessage({ selectedCount: 3, blacklistedCount: 3, notBlacklistedCount: 0 }))
      .toBe('确定要取消拉黑选中的 3 个演员吗？');
    expect(buildBatchBlacklistConfirmationMessage({ selectedCount: 3, blacklistedCount: 1, notBlacklistedCount: 2 }))
      .toContain('选中的演员中有 1 个已拉黑，2 个未拉黑。');
  });

  it('builds subscribe confirmation and result messages', () => {
    expect(buildBatchSubscribeConfirmationMessage({ selectedCount: 2, subscribedCount: 0, notSubscribedCount: 2 }))
      .toBe('确定要订阅选中的 2 个演员吗？');
    expect(buildBatchSubscribeConfirmationMessage({ selectedCount: 2, subscribedCount: 2, notSubscribedCount: 0 }))
      .toBe('确定要取消订阅选中的 2 个演员吗？');
    expect(buildBatchSubscribeConfirmationMessage({ selectedCount: 2, subscribedCount: 1, notSubscribedCount: 1 }))
      .toContain('选中的演员中有 1 个已订阅，1 个未订阅。');

    expect(buildActorBatchResultMessage('批量删除', 2, 1)).toBe('批量删除完成！成功: 2，失败: 1');
  });
});
