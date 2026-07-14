/**
 * @file lastPageResumePrompt.test.ts
 * @description 上次页面恢复气泡 DOM 测试
 * @module tests/dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  maybeShowLastPageResumePrompt,
  mountLastPageResumePrompt,
  unmountLastPageResumePrompt,
} from '../../src/dashboard/lastPage/resumePrompt';
import type { DashboardLastPageRecord } from '../../src/dashboard/lastPage/types';

function record(overrides: Partial<DashboardLastPageRecord> = {}): DashboardLastPageRecord {
  return {
    hash: '#tab-new-works',
    title: '资料库 · 新作品',
    updatedAt: 1,
    ...overrides,
  };
}

describe('last page resume prompt', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="dashboard-user-menu-root"></div>';
    window.location.hash = '#tab-home';
  });

  afterEach(() => {
    unmountLastPageResumePrompt(document);
    document.body.innerHTML = '';
    window.location.hash = '';
  });

  it('mounts bubble with page title and actions', () => {
    const el = mountLastPageResumePrompt(record());
    expect(el?.id).toBe('dashboard-last-page-resume');
    expect(el?.textContent).toContain('恢复上次页面');
    expect(el?.textContent).toContain('资料库 · 新作品');
    expect(el?.querySelector('[data-action="go"]')).toBeTruthy();
    expect(el?.querySelector('[data-action="dismiss"]')).toBeTruthy();
  });

  it('shows prompt only when last page differs from current', async () => {
    const getRecord = vi.fn(async () => record());
    const shown = await maybeShowLastPageResumePrompt({
      getRecord,
      getCurrentHash: () => '#tab-home',
    });
    expect(shown).toBe(true);
    expect(document.getElementById('dashboard-last-page-resume')).toBeTruthy();

    unmountLastPageResumePrompt(document);
    const hidden = await maybeShowLastPageResumePrompt({
      getRecord,
      getCurrentHash: () => '#tab-new-works',
    });
    expect(hidden).toBe(false);
    expect(document.getElementById('dashboard-last-page-resume')).toBeNull();
  });

  it('navigates and clears record on go', async () => {
    const clearRecord = vi.fn(async () => undefined);
    const navigateToHash = vi.fn();
    mountLastPageResumePrompt(record(), { clearRecord, navigateToHash });

    document.querySelector<HTMLElement>('[data-action="go"]')?.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(clearRecord).toHaveBeenCalledTimes(1);
    expect(navigateToHash).toHaveBeenCalledWith('#tab-new-works');
    expect(document.getElementById('dashboard-last-page-resume')).toBeNull();
  });

  it('clears record without navigating on dismiss', async () => {
    const clearRecord = vi.fn(async () => undefined);
    const navigateToHash = vi.fn();
    mountLastPageResumePrompt(record(), { clearRecord, navigateToHash });

    document.querySelector<HTMLElement>('[data-action="dismiss"]')?.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(clearRecord).toHaveBeenCalledTimes(1);
    expect(navigateToHash).not.toHaveBeenCalled();
    expect(document.getElementById('dashboard-last-page-resume')).toBeNull();
  });
});
