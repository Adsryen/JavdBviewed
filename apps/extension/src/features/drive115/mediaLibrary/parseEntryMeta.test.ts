/**
 * @file parseEntryMeta.test.ts
 * @description 番号与 NFO 解析单测
 * @module features/drive115/mediaLibrary
 */
import { describe, expect, it } from 'vitest';
import {
  parseCodeFromName,
  parseNfoSummary,
  resolveEntryCode,
  resolveEntryTitle,
} from './parseEntryMeta';

describe('parseEntryMeta', () => {
  it('parses code from folder / file names', () => {
    expect(parseCodeFromName('SSIS-001')).toBe('SSIS-001');
    expect(parseCodeFromName('ssis_001.mp4')).toBe('SSIS-001');
    expect(parseCodeFromName('FC2-PPV-1234567')).toBe('FC2-PPV-1234567');
  });

  it('resolves code by priority folder > video > nfo', () => {
    expect(
      resolveEntryCode({
        folderName: 'SSIS-001 标题',
        videoFileName: 'OTHER-002.mp4',
        nfoFileName: 'OTHER-003.nfo',
      }),
    ).toEqual({ code: 'SSIS-001', source: 'folder' });

    expect(
      resolveEntryCode({
        folderName: '无番号目录',
        videoFileName: 'ABC-123.mp4',
      }),
    ).toEqual({ code: 'ABC-123', source: 'video' });

    expect(
      resolveEntryCode({
        folderName: 'misc',
        videoFileName: 'video.mp4',
        nfoFileName: 'IPX-999.nfo',
      }),
    ).toEqual({ code: 'IPX-999', source: 'nfo' });
  });

  it('parses minimal nfo xml', () => {
    const summary = parseNfoSummary(`
      <movie>
        <title>示例标题</title>
        <year>2024</year>
        <plot>简介内容</plot>
      </movie>
    `);
    expect(summary?.title).toBe('示例标题');
    expect(summary?.year).toBe('2024');
    expect(summary?.plot).toContain('简介');
  });

  it('builds display title', () => {
    expect(resolveEntryTitle({ code: 'ABC-1', folderName: 'x' })).toBe('ABC-1');
    expect(resolveEntryTitle({ nfoTitle: 'NFO名', code: 'ABC-1' })).toBe('NFO名');
    expect(resolveEntryTitle({ folderName: 'folder' })).toBe('folder');
  });
});
