import { afterEach, describe, expect, it } from 'vitest';
import {
  setBatchDeleteSelectedButtonLoading,
  setCheckNowButtonLoading,
  setSyncStatusButtonLoading,
  updateBatchOpenUnreadButtonState,
} from '../../src/dashboard/tabs/newWorksButtonStateRuntime';

describe('new works button state runtime', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('updates unread batch open button for loading, cooldown and ready states', () => {
    document.body.innerHTML = '<button id="batchOpenUnreadBtn"></button>';
    const button = document.getElementById('batchOpenUnreadBtn') as HTMLButtonElement;

    updateBatchOpenUnreadButtonState({
      loading: true,
      cooldownSeconds: 0,
      maxOpenCount: 5,
    });

    expect(button.disabled).toBe(true);
    expect(button.innerHTML).toContain('正在打开');

    updateBatchOpenUnreadButtonState({
      cooldownSeconds: 9,
      maxOpenCount: 5,
    });

    expect(button.disabled).toBe(true);
    expect(button.title).toContain('冷却剩余 9 秒');
    expect(button.innerHTML).toContain('冷却中（9s）');

    updateBatchOpenUnreadButtonState({
      cooldownSeconds: 0,
      maxOpenCount: 5,
    });

    expect(button.disabled).toBe(false);
    expect(button.title).toContain('最多 5 个');
    expect(button.innerHTML).toContain('批量打开未读');
  });

  it('updates sync status button content wrapper when present', () => {
    document.body.innerHTML = '<button id="syncStatusBtn"><span class="btn-content"></span></button>';
    const button = document.getElementById('syncStatusBtn') as HTMLButtonElement;
    const content = button.querySelector('.btn-content') as HTMLElement;

    setSyncStatusButtonLoading(true);

    expect(button.disabled).toBe(true);
    expect(content.innerHTML).toContain('同步中');

    setSyncStatusButtonLoading(false);

    expect(button.disabled).toBe(false);
    expect(content.innerHTML).toContain('同步状态');
  });

  it('updates check now button loading state', () => {
    document.body.innerHTML = '<button id="checkNowBtn"></button>';
    const button = document.getElementById('checkNowBtn') as HTMLButtonElement;

    setCheckNowButtonLoading(true);

    expect(button.disabled).toBe(true);
    expect(button.innerHTML).toContain('检查中');

    setCheckNowButtonLoading(false);

    expect(button.disabled).toBe(false);
    expect(button.innerHTML).toContain('立即检查');
  });

  it('updates selected batch delete button loading and idle states', () => {
    document.body.innerHTML = '<button id="batchDeleteSelectedBtn"></button>';
    const button = document.getElementById('batchDeleteSelectedBtn') as HTMLButtonElement;

    setBatchDeleteSelectedButtonLoading({ loading: true, selectedCount: 2 });

    expect(button.disabled).toBe(true);
    expect(button.innerHTML).toContain('删除中');

    setBatchDeleteSelectedButtonLoading({ loading: false, selectedCount: 0 });

    expect(button.disabled).toBe(true);
    expect(button.innerHTML).toContain('删除已选');

    setBatchDeleteSelectedButtonLoading({ loading: false, selectedCount: 1 });

    expect(button.disabled).toBe(false);
  });
});
