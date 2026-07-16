import { describe, expect, it } from 'vitest';
import {
  validateActorRecords,
  validateSettings,
  validateVideoRecords,
} from './restoreValidationModel';

describe('WebDAV restore validation model', () => {
  it('accepts valid video records', () => {
    expect(() => validateVideoRecords({
      'AAA-001': {
        id: 'AAA-001',
        title: 'Title',
        status: 'viewed',
        createdAt: 1,
        updatedAt: 2,
        tags: [],
      },
    })).not.toThrow();
  });

  it('rejects invalid video records with original messages', () => {
    expect(() => validateVideoRecords({
      'AAA-001': { id: 'AAA-001', title: 'Title', status: 'invalid', createdAt: 1, updatedAt: 2, tags: [] },
    })).toThrow('视频记录 AAA-001 状态值无效: invalid');

    expect(() => validateVideoRecords({
      'AAA-002': { id: 'AAA-002', title: 'Title', status: 'viewed', createdAt: 1, updatedAt: 2, tags: 'bad' },
    })).toThrow('视频记录 AAA-002 标签格式错误');
  });

  it('accepts valid actor records', () => {
    expect(() => validateActorRecords({
      actorA: {
        id: 'actorA',
        name: 'Actor A',
        gender: 'female',
        category: 'censored',
        aliases: [],
      },
    })).not.toThrow();
  });

  it('rejects invalid actor records with original messages', () => {
    expect(() => validateActorRecords({
      actorA: { id: 'actorA', name: 'Actor A', gender: 'bad', category: 'censored', aliases: [] },
    })).toThrow('演员记录 actorA 性别值无效: bad');

    expect(() => validateActorRecords({
      actorB: { id: 'actorB', name: 'Actor B', gender: 'female', category: 'bad', aliases: [] },
    })).toThrow('演员记录 actorB 分类值无效: bad');
  });

  it('validates required settings sections', () => {
    expect(() => validateSettings({
      display: {},
      webdav: {},
      dataSync: {},
      actorSync: {},
    })).not.toThrow();

    expect(() => validateSettings(null)).toThrow('设置数据格式错误');
    expect(() => validateSettings({ display: {}, webdav: {}, dataSync: {} })).toThrow('设置缺少必要部分: actorSync');
  });
});
