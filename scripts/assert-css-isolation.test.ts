/**
 * @file assert-css-isolation.test.ts
 * @description 确保 CSS 隔离扫描脚本在 warn 模式下可成功运行
 * @module scripts
 */
import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

describe('assert-css-isolation script', () => {
  it('exits 0 in warn-only mode', () => {
    const script = resolve(process.cwd(), 'scripts/assert-css-isolation.cjs');
    const result = spawnSync(process.execPath, [script], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: { ...process.env, CSS_ISOLATION_STRICT: '0' },
    });
    expect(result.status).toBe(0);
    expect(result.stdout + result.stderr).toMatch(/CSS isolation/i);
  });
});
