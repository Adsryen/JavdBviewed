/**
 * @file mountDashboardShell.test.ts
 * @description 挂载相关说明性合约（完整 React DOM 挂载由手工/扩展验证）
 * @module apps/dashboard/shell
 */
import { describe, expect, it } from 'vitest';
import { getDashboardShellStructure } from './shellStructure';

describe('mountDashboardShell (contract alias)', () => {
  it('documents required hosts for bootstrap mount', () => {
    const s = getDashboardShellStructure();
    expect(s.hasTopbar).toBe(true);
    expect(s.tabContentIds.length).toBeGreaterThan(8);
  });
});
