import { describe, expect, it } from 'vitest';
import { buildRestoreFooterButtonSpecs } from './restoreFooterModel';

describe('WebDAV restore footer model', () => {
  it('builds the restore modal footer button specs', () => {
    expect(buildRestoreFooterButtonSpecs()).toEqual([
      {
        id: 'webdavRestoreBack',
        className: 'btn btn-secondary hidden',
        html: '<i class="fas fa-arrow-left"></i> 返回',
      },
      {
        id: 'webdavRestoreCancel',
        className: 'btn btn-secondary',
        html: '取消',
      },
    ]);
  });
});
