import { describe, expect, it } from 'vitest';
import {
  buildConflictVersionContentHtml,
  buildConflictVersionFields,
  buildConflictVersionFieldsHtml,
  buildConflictVersionFieldHtml,
  getConflictTypeLabel,
  getResolutionText,
  getStatusText,
  type ConflictDetailType,
} from './conflictDetailModel';

describe('WebDAV restore conflict detail model', () => {
  it('builds video conflict fields with tags, shortened URL, and status text', () => {
    const fields = buildConflictVersionFields(
      {
        title: 'AAA-001 title',
        status: 'viewed',
        tags: ['高清', '收藏'],
        releaseDate: '2026-05-30',
        javdbUrl: 'https://javdb.com/v/'.padEnd(72, 'a'),
        updatedAt: Date.UTC(2026, 4, 30, 8, 0, 0),
      },
      'video',
    );

    expect(fields.map(field => field.label)).toEqual(['标题:', '状态:', '标签:', '发行日期:', '链接:', '更新时间:']);
    expect(fields.find(field => field.label === '状态:')).toMatchObject({
      value: '已观看',
      valueClass: 'status-viewed',
    });
    expect(fields.find(field => field.label === '标签:')?.tags).toEqual(['高清', '收藏']);
    expect(fields.find(field => field.label === '链接:')?.href).toBe('https://javdb.com/v/'.padEnd(72, 'a'));
    expect(fields.find(field => field.label === '链接:')?.value.endsWith('...')).toBe(true);
  });

  it('uses empty tag field and unknown title fallback for sparse video records', () => {
    const fields = buildConflictVersionFields({ status: 'want' }, 'video');

    expect(fields.find(field => field.label === '标题:')?.value).toBe('未知');
    expect(fields.find(field => field.label === '标签:')).toMatchObject({
      value: '无标签',
      valueClass: 'empty',
    });
    expect(fields.find(field => field.label === '状态:')?.value).toBe('我想看');
  });

  it('builds actor conflict fields with optional metadata', () => {
    const fields = buildConflictVersionFields(
      {
        name: '演员 A',
        gender: 'female',
        category: 'favorite',
        profileUrl: 'https://javdb.com/actors/'.padEnd(80, 'b'),
        updatedAt: Date.UTC(2026, 4, 31, 1, 2, 3),
      },
      'actor',
    );

    expect(fields.map(field => field.label)).toEqual(['姓名:', '性别:', '分类:', '资料链接:', '更新时间:']);
    expect(fields.find(field => field.label === '资料链接:')?.href).toContain('/actors/');
    expect(fields.find(field => field.label === '资料链接:')?.value.endsWith('...')).toBe(true);
  });

  it('builds new works subscription fields', () => {
    const fields = buildConflictVersionFields(
      {
        actorName: '演员 B',
        enabled: false,
        lastCheckTime: Date.UTC(2026, 4, 29, 1, 0, 0),
        subscribedAt: Date.UTC(2026, 4, 28, 1, 0, 0),
      },
      'newWorksSub',
    );

    expect(fields.map(field => field.label)).toEqual(['演员：', '订阅状态：', '最后检查：', '订阅时间：']);
    expect(fields.find(field => field.label === '订阅状态：')?.value).toBe('停用');
  });

  it('builds new works record fields with tags and timestamp fallback', () => {
    const fields = buildConflictVersionFields(
      {
        title: '新作品',
        actorName: '演员 C',
        releaseDate: '2026-06-01',
        tags: ['新作'],
        javdbUrl: 'https://javdb.com/v/abc',
        discoveredAt: Date.UTC(2026, 4, 27, 1, 0, 0),
      },
      'newWorksRec',
      { now: Date.UTC(2026, 4, 31, 3, 0, 0) },
    );

    expect(fields.map(field => field.label)).toEqual(['标题：', '演员：', '发行日期：', '标签：', '链接：', '发现时间：', '更新时间：']);
    expect(fields.find(field => field.label === '标签：')?.tags).toEqual(['新作']);
    expect(fields.find(field => field.label === '更新时间：')?.value).toContain('2026');
  });

  it('provides type, status, and resolution labels', () => {
    const types: Record<ConflictDetailType, string> = {
      video: '视频记录',
      actor: '演员记录',
      newWorksSub: '新作品订阅',
      newWorksRec: '新作品记录',
    };

    for (const [type, label] of Object.entries(types)) {
      expect(getConflictTypeLabel(type as ConflictDetailType)).toBe(label);
    }

    expect(getStatusText('browsed')).toBe('已浏览');
    expect(getStatusText('custom')).toBe('custom');
    expect(getResolutionText('local')).toBe('保留本地');
    expect(getResolutionText('unknown')).toBe('unknown');
  });

  it('renders field html with plain values, tags, and links', () => {
    expect(buildConflictVersionFieldHtml({
      iconClass: 'fas fa-video',
      label: '标题:',
      value: 'AAA-001',
    })).toContain('<span class="field-value">AAA-001</span>');

    expect(buildConflictVersionFieldHtml({
      iconClass: 'fas fa-tags',
      label: '标签:',
      value: '',
      valueClass: 'tags',
      tags: ['高清', '收藏'],
    })).toContain('<span class="tag">高清</span><span class="tag">收藏</span>');

    expect(buildConflictVersionFieldHtml({
      iconClass: 'fas fa-link',
      label: '链接:',
      value: 'https://javdb.com/v/abc',
      href: 'https://javdb.com/v/abc',
    })).toContain('<a href="https://javdb.com/v/abc" target="_blank" class="external-link">https://javdb.com/v/abc</a>');
  });

  it('renders all version fields for a conflict side', () => {
    const html = buildConflictVersionFieldsHtml([
      { iconClass: 'fas fa-video', label: '标题:', value: 'AAA-001' },
      { iconClass: 'fas fa-eye', label: '状态:', value: '已观看', valueClass: 'status-viewed' },
    ]);

    expect(html).toContain('标题:');
    expect(html).toContain('AAA-001');
    expect(html).toContain('field-value status-viewed');
  });

  it('renders version content html from raw conflict data and type', () => {
    const html = buildConflictVersionContentHtml(
      {
        title: 'AAA-001 title',
        status: 'viewed',
        tags: ['高清'],
        updatedAt: Date.UTC(2026, 4, 30, 8, 0, 0),
      },
      'video',
    );

    expect(html).toContain('AAA-001 title');
    expect(html).toContain('已观看');
    expect(html).toContain('<span class="tag">高清</span>');
  });
});
