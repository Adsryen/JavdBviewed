/**
 * @file resources.test.ts
 * @description Dashboard Tab 资源映射测试
 * @module dashboard/tabs
 */
import { describe, expect, it } from 'vitest';

import { TAB_PARTIALS } from './resources';

describe('Dashboard tab resources', () => {
  it('registers the media library placeholder partial and styles', () => {
    expect(TAB_PARTIALS['tab-media']).toEqual({
      name: 'tabs/media.html',
      styles: ['./styles/05-pages/media.css'],
    });
  });

  it('registers the backup and restore partial with page-scoped styles', () => {
    expect(TAB_PARTIALS['tab-backup']).toEqual({
      name: 'tabs/backup.html',
      styles: ['./styles/05-pages/backup.css'],
    });
  });
});
