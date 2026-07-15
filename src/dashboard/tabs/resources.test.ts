/**
 * @file resources.test.ts
 * @description Dashboard Tab 资源映射测试
 * @module dashboard/tabs
 */
import { describe, expect, it } from 'vitest';

import { TAB_PARTIALS } from './resources';

describe('Dashboard tab resources', () => {
  it('registers the media library as a React-owned tab without page CSS partial styles', () => {
    expect(TAB_PARTIALS['tab-media']).toEqual({
      name: 'tabs/media.html',
      skipPartial: true,
      styles: [],
    });
  });

  it('registers the backup and restore partial with page-scoped styles', () => {
    expect(TAB_PARTIALS['tab-backup']).toEqual({
      name: 'tabs/backup.html',
      styles: ['./styles/05-pages/backup.css'],
    });
  });

  it('aliases the legacy about settings route to the merged version page', () => {
    expect(TAB_PARTIALS['tab-settings-about']).toEqual({
      name: 'tabs/settings-update.html',
      styles: [
        './styles/05-pages/settings/settings.css',
        './styles/05-pages/settings/update.css',
        './styles/05-pages/settings/about.css',
      ],
    });
  });
});
