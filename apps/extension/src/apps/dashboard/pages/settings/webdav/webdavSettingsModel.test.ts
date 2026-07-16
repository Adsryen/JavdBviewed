/**
 * @file webdavSettingsModel.test.ts
 * @description WebDAV 设置模型单测
 * @module apps/dashboard/pages/settings/webdav
 */
import { describe, expect, it } from 'vitest';
import {
  applyProviderToDraft,
  applyWebdavFormToSettings,
  combineUrl,
  DEFAULT_WEBDAV_SETTINGS_FORM,
  deleteConfig,
  detectProviderType,
  draftFromConfig,
  formatNextSyncLabel,
  friendlyWebdavError,
  mapSettingsToWebdavForm,
  migrateLegacyWebdavConfig,
  splitUrl,
  switchActiveConfig,
  upsertConfigFromDraft,
  validateConfigModalDraft,
  validateWebdavForm,
} from './webdavSettingsModel';

describe('webdavSettingsModel', () => {
  it('defaults match legacy HTML defaults', () => {
    expect(DEFAULT_WEBDAV_SETTINGS_FORM.enabled).toBe(false);
    expect(DEFAULT_WEBDAV_SETTINGS_FORM.autoSync).toBe(false);
    expect(DEFAULT_WEBDAV_SETTINGS_FORM.syncInterval).toBe(30);
    expect(DEFAULT_WEBDAV_SETTINGS_FORM.retentionDays).toBe(10);
    expect(DEFAULT_WEBDAV_SETTINGS_FORM.warningDays).toBe(7);
    expect(DEFAULT_WEBDAV_SETTINGS_FORM.backupRange.coreData).toBe(true);
    expect(DEFAULT_WEBDAV_SETTINGS_FORM.backupRange.newWorksData).toBe(false);
    expect(DEFAULT_WEBDAV_SETTINGS_FORM.configs).toEqual([]);
  });

  it('maps empty settings with legacy load fallbacks', () => {
    const form = mapSettingsToWebdavForm(undefined);
    expect(form.enabled).toBe(false);
    expect(form.syncInterval).toBe(30);
    expect(form.retentionDays).toBe(7);
    expect(form.warningDays).toBe(7);
    expect(form.backupRange.actorData).toBe(true);
    expect(form.backupRange.logsData).toBe(false);
  });

  it('maps nested settings.webdav including configs', () => {
    const form = mapSettingsToWebdavForm({
      webdav: {
        enabled: true,
        autoSync: true,
        syncInterval: 60,
        retentionDays: 5,
        warningDays: 3,
        activeConfigId: 'c1',
        backupRange: {
          coreData: true,
          actorData: false,
          newWorksData: true,
          systemConfig: false,
          logsData: true,
        },
        configs: [
          {
            id: 'c1',
            name: '坚果云',
            url: 'https://dav.jianguoyun.com/dav/backup',
            username: 'u1',
            password: 'p1',
            provider: 'jianguoyun',
            updatedAt: 1,
            lastSync: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
    } as any);

    expect(form.enabled).toBe(true);
    expect(form.autoSync).toBe(true);
    expect(form.syncInterval).toBe(60);
    expect(form.retentionDays).toBe(5);
    expect(form.warningDays).toBe(3);
    expect(form.activeConfigId).toBe('c1');
    expect(form.configs).toHaveLength(1);
    expect(form.username).toBe('u1');
    expect(form.backupRange.actorData).toBe(false);
    expect(form.backupRange.newWorksData).toBe(true);
  });

  it('migrates legacy single-config webdav', () => {
    const migrated = migrateLegacyWebdavConfig({
      url: 'https://dav.jianguoyun.com/dav/',
      username: 'old',
      password: 'secret',
      lastSync: null,
    });
    expect(migrated).not.toBeNull();
    expect(migrated!.configs).toHaveLength(1);
    expect(migrated!.configs[0].name).toBe('默认配置');
    expect(migrated!.configs[0].provider).toBe('jianguoyun');
    expect(migrated!.activeConfigId).toBe(migrated!.configs[0].id);

    const form = mapSettingsToWebdavForm({
      webdav: {
        url: 'https://dav.jianguoyun.com/dav/',
        username: 'old',
        password: 'secret',
      },
    } as any);
    expect(form.configs).toHaveLength(1);
    expect(form.activeConfigId).toBeTruthy();
  });

  it('validates enabled form requirements', () => {
    expect(validateWebdavForm(DEFAULT_WEBDAV_SETTINGS_FORM).isValid).toBe(true);

    const enabledEmpty = validateWebdavForm({
      ...DEFAULT_WEBDAV_SETTINGS_FORM,
      enabled: true,
    });
    expect(enabledEmpty.isValid).toBe(false);
    expect(enabledEmpty.errors.some((e) => e.includes('配置'))).toBe(true);

    const ok = validateWebdavForm({
      ...DEFAULT_WEBDAV_SETTINGS_FORM,
      enabled: true,
      activeConfigId: 'c1',
      syncInterval: 30,
      retentionDays: 10,
      warningDays: 7,
      configs: [
        {
          id: 'c1',
          name: 'a',
          url: 'https://x',
          username: 'u',
          password: 'p',
          provider: 'custom',
          updatedAt: 1,
          lastSync: null,
        },
      ],
    });
    expect(ok.isValid).toBe(true);

    const badRange = validateWebdavForm({
      ...DEFAULT_WEBDAV_SETTINGS_FORM,
      enabled: true,
      activeConfigId: 'c1',
      backupRange: {
        coreData: false,
        actorData: false,
        newWorksData: false,
        systemConfig: false,
        logsData: false,
      },
    });
    expect(badRange.isValid).toBe(false);
  });

  it('split/combine url and detect provider', () => {
    expect(detectProviderType('https://dav.jianguoyun.com/dav/x')).toBe('jianguoyun');
    expect(detectProviderType('https://ogi.teracloud.jp/dav/')).toBe('teracloud');
    expect(detectProviderType('https://example.com/dav/')).toBe('custom');

    const split = splitUrl('https://dav.jianguoyun.com/dav/myfolder');
    expect(split.baseUrl).toBe('https://dav.jianguoyun.com/dav/');
    expect(split.folder).toBe('myfolder');
    expect(combineUrl(split.baseUrl, split.folder)).toBe(
      'https://dav.jianguoyun.com/dav/myfolder',
    );
  });

  it('upserts / switches / deletes configs', () => {
    const added = upsertConfigFromDraft(
      [],
      {
        name: 'A',
        url: 'https://example.com/dav/',
        folder: 'f',
        username: 'u',
        password: 'p',
        provider: 'custom',
      },
      null,
    );
    expect(added.configs).toHaveLength(1);
    expect(added.configs[0].url).toBe('https://example.com/dav/f');

    let form = {
      ...DEFAULT_WEBDAV_SETTINGS_FORM,
      configs: added.configs,
      activeConfigId: added.savedConfigId,
    };

    const second = upsertConfigFromDraft(
      form.configs,
      {
        name: 'B',
        url: 'https://dav.jianguoyun.com/dav/',
        folder: '',
        username: 'u2',
        password: 'p2',
        provider: 'jianguoyun',
      },
      null,
    );
    form = { ...form, configs: second.configs };
    form = switchActiveConfig(form, second.savedConfigId);
    expect(form.activeConfigId).toBe(second.savedConfigId);
    expect(form.username).toBe('u2');

    form = deleteConfig(form, second.savedConfigId);
    expect(form.configs).toHaveLength(1);
    expect(form.activeConfigId).toBe(added.savedConfigId);
  });

  it('applies provider defaults and validates modal draft', () => {
    const draft = applyProviderToDraft(
      {
        name: '',
        url: '',
        folder: '',
        username: '',
        password: '',
        provider: 'custom',
      },
      'jianguoyun',
      true,
    );
    expect(draft.name).toBe('坚果云');
    expect(draft.url).toContain('jianguoyun');

    expect(validateConfigModalDraft(draft).ok).toBe(false);
    expect(
      validateConfigModalDraft({
        ...draft,
        username: 'u',
        password: 'p',
      }).ok,
    ).toBe(true);
  });

  it('applies form back to settings', () => {
    const form = mapSettingsToWebdavForm({
      webdav: {
        enabled: true,
        autoSync: true,
        syncInterval: 45,
        activeConfigId: 'c1',
        configs: [
          {
            id: 'c1',
            name: 'A',
            url: 'https://x/dav/',
            username: 'u',
            password: 'p',
            provider: 'custom',
            updatedAt: 1,
            lastSync: null,
          },
        ],
      },
    } as any);
    const next = applyWebdavFormToSettings({} as any, form);
    expect((next as any).webdav.enabled).toBe(true);
    expect((next as any).webdav.syncInterval).toBe(45);
    expect((next as any).webdav.configs).toHaveLength(1);
    expect((next as any).webdav.url).toBe('https://x/dav/');
  });

  it('formats helpers', () => {
    expect(formatNextSyncLabel(false, true)).toBe('（未启用）');
    expect(formatNextSyncLabel(true, false)).toBe('（未启用）');
    expect(friendlyWebdavError('HTTP 401 Unauthorized')).toBe('用户名或密码错误');
    const draft = draftFromConfig({
      id: '1',
      name: 'n',
      url: 'https://dav.jianguoyun.com/dav/box',
      username: 'u',
      password: 'p',
      provider: 'jianguoyun',
      updatedAt: 1,
      lastSync: null,
    });
    expect(draft.folder).toBe('box');
  });
});
