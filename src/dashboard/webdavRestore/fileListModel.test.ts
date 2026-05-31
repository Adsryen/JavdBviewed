import { describe, expect, it } from 'vitest';
import {
  buildBackupDateRangeLabel,
  formatFileSize,
  formatRelativeTime,
  getUploaderMeta,
  parseDateFromFilename,
} from './fileListModel';

describe('WebDAV restore file list model', () => {
  it('formats file sizes for backup rows', () => {
    expect(formatFileSize()).toBe('未知大小');
    expect(formatFileSize(0)).toBe('未知大小');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2.0 MB');
  });

  it('formats relative times from a stable now value', () => {
    const now = new Date('2026-05-31T12:00:00.000Z');

    expect(formatRelativeTime('2026-05-31T11:59:30.000Z', now)).toBe('刚刚');
    expect(formatRelativeTime('2026-05-31T11:30:00.000Z', now)).toBe('30分钟前');
    expect(formatRelativeTime('2026-05-31T09:00:00.000Z', now)).toBe('3小时前');
    expect(formatRelativeTime('2026-05-30T12:00:00.000Z', now)).toBe('昨天');
  });

  it('parses backup dates from json and zip filenames', () => {
    expect(parseDateFromFilename('javdb-extension-backup-2026-05-30.json')?.toISOString()).toBe('2026-05-30T00:00:00.000Z');
    expect(parseDateFromFilename('javdb-extension-backup-2026-05-30-13-14-15.zip')?.toISOString()).toBe('2026-05-30T13:14:15.000Z');
    expect(parseDateFromFilename('notes.zip')).toBeNull();
  });

  it('builds backup range label from filenames before lastModified fallback', () => {
    const label = buildBackupDateRangeLabel([
      {
        name: 'javdb-extension-backup-2026-05-31.zip',
        path: '/a',
        lastModified: '2026-01-01T00:00:00.000Z',
      },
      {
        name: 'javdb-extension-backup-2026-05-29.zip',
        path: '/b',
        lastModified: '2026-01-02T00:00:00.000Z',
      },
    ]);

    expect(label).toBe('2026-05-29 ~ 2026-05-31');
  });

  it('builds uploader meta with unknown fallback', () => {
    expect(getUploaderMeta({ name: 'a.zip', path: '/a', lastModified: '' })).toEqual({
      device: '未知设备',
      browser: '未知浏览器',
      isUnknown: true,
    });
    expect(getUploaderMeta({
      name: 'a.zip',
      path: '/a',
      lastModified: '',
      uploaderClientId: 'client-a',
      uploaderBrowserName: 'Chrome',
    })).toEqual({
      device: 'client-a',
      browser: 'Chrome',
      isUnknown: false,
    });
  });
});
