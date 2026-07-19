/**
 * @file syncStats.test.ts
 */
import { describe, expect, it } from 'vitest';
import type { SyncEntity } from '@javdb/sync-protocol';
import { countByType, formatTypeCounts, humanizeCloudError } from './syncStats';

describe('syncStats', () => {
  it('counts and formats types', () => {
    const entities: SyncEntity[] = [
      { id: '1', type: 'video', revision: 1, updatedAt: 1, payload: {} },
      { id: '2', type: 'video', revision: 1, updatedAt: 1, payload: {} },
      { id: 'a', type: 'actor', revision: 1, updatedAt: 1, payload: {} },
    ];
    const c = countByType(entities);
    expect(c.video).toBe(2);
    expect(c.actor).toBe(1);
    expect(formatTypeCounts(c)).toContain('视频/番号 2');
    expect(formatTypeCounts(c)).toContain('演员 1');
  });

  it('humanizes network and auth errors', () => {
    expect(humanizeCloudError({ status: 401, message: 'unauthorized' })).toMatch(/登录/);
    expect(humanizeCloudError({ status: 401, message: 'invalid credentials' })).toMatch(
      /账号或密码错误/,
    );
    expect(humanizeCloudError({ message: 'Failed to fetch' })).toMatch(/无法连接/);
    expect(humanizeCloudError({ status: 409, message: 'user exists' })).toMatch(/已存在/);
  });
});
