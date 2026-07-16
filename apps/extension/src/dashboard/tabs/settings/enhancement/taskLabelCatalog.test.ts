/**
 * @file taskLabelCatalog.test.ts
 * @description 任务 label 展示名 catalog 单测
 */
import { describe, expect, it } from 'vitest';
import {
  getTaskDescription,
  getTaskLabelDisplay,
  getTaskLabelShort,
} from './taskLabelCatalog';

describe('taskLabelCatalog', () => {
  it('returns short names for known labels', () => {
    expect(getTaskLabelShort('onlineAvailability:check')).toBe('在线可看性检测');
    expect(getTaskDescription('videoEnhancement:initCore')).toBe('影片页核心初始化');
  });

  it('marks clickEnhancement as legacy', () => {
    expect(getTaskLabelShort('videoEnhancement:clickEnhancement')).toContain('legacy');
  });

  it('formats display with label suffix', () => {
    expect(getTaskLabelDisplay('emby:badge')).toBe(
      'Emby/Jellyfin 徽标增强 (emby:badge)',
    );
  });

  it('falls back for unknown labels', () => {
    expect(getTaskLabelShort('unknown:custom')).toBe('');
    expect(getTaskLabelDisplay('unknown:custom')).toBe('unknown:custom');
  });

  it('derives sub-step names from parent', () => {
    expect(getTaskLabelShort('videoEnhancement:translateCurrentTitle:request')).toContain(
      '标题定点翻译',
    );
  });
});
