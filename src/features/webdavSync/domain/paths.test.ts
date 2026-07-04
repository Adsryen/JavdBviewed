/**
 * @file paths.test.ts
 * @description WebDAV 路径与地址辅助函数测试
 * @module features/webdavSync
 */
import { describe, expect, it } from 'vitest';
import { getAlistWebDavUrlHint } from './paths';

describe('WebDAV path helpers', () => {
  it('suggests the Alist /dav/ endpoint for common root or webdav paths', () => {
    expect(getAlistWebDavUrlHint('https://alist.example.com')).toEqual({
      kind: 'alist-dav-path',
      suggestedUrl: 'https://alist.example.com/dav/',
      message: '如果这是 Alist 服务，WebDAV 地址通常需要以 /dav/ 结尾。',
    });
    expect(getAlistWebDavUrlHint('https://alist.example.com/webdav/backups')?.suggestedUrl)
      .toBe('https://alist.example.com/dav/backups');
    expect(getAlistWebDavUrlHint(' https://alist.example.com/dav ')).toMatchObject({
      suggestedUrl: 'https://alist.example.com/dav/',
    });
  });

  it('does not suggest changes for existing dav paths or known non-Alist providers', () => {
    expect(getAlistWebDavUrlHint('https://alist.example.com/dav/backups')).toBeNull();
    expect(getAlistWebDavUrlHint('https://dav.jianguoyun.com/dav/')).toBeNull();
    expect(getAlistWebDavUrlHint('https://ogi.teracloud.jp/dav/')).toBeNull();
    expect(getAlistWebDavUrlHint('not a url')).toBeNull();
  });
});
