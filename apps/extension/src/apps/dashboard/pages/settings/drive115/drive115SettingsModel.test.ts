/**
 * @file drive115SettingsModel.test.ts
 * @description 115 网盘设置模型单测
 * @module apps/dashboard/pages/settings/drive115
 */
import { describe, expect, it } from 'vitest';
import {
  applyDrive115FormToSettings,
  computeNextAutoRefreshAt,
  countRefreshIn2h,
  decodeOpenlistScanClientId,
  DEFAULT_DRIVE115_SETTINGS_FORM,
  extractUserInfoDisplay,
  formToDrive115Patch,
  formatDrive115DateTime,
  formatDrive115Remain,
  getAccessTokenExpiryLabel,
  getAccessTokenStatusLabel,
  getRefreshTokenStatusLabel,
  mapSettingsToDrive115Form,
  validateDrive115Form,
} from './drive115SettingsModel';

describe('drive115SettingsModel', () => {
  it('defaults match expected runtime defaults', () => {
    expect(DEFAULT_DRIVE115_SETTINGS_FORM.enabled).toBe(false);
    expect(DEFAULT_DRIVE115_SETTINGS_FORM.v2AuthMode).toBe('openlist_manual');
    expect(DEFAULT_DRIVE115_SETTINGS_FORM.v2ApiBaseUrl).toBe('https://proapi.115.com');
    expect(DEFAULT_DRIVE115_SETTINGS_FORM.v2AutoRefresh).toBe(true);
    expect(DEFAULT_DRIVE115_SETTINGS_FORM.v2AutoRefreshSkewSec).toBe(60);
    expect(DEFAULT_DRIVE115_SETTINGS_FORM.v2MinRefreshIntervalMin).toBe(60);
    expect(DEFAULT_DRIVE115_SETTINGS_FORM.verifyCount).toBe(5);
    expect(DEFAULT_DRIVE115_SETTINGS_FORM.maxFailures).toBe(5);
  });

  it('maps empty settings to defaults', () => {
    expect(mapSettingsToDrive115Form(undefined)).toEqual(DEFAULT_DRIVE115_SETTINGS_FORM);
    expect(mapSettingsToDrive115Form({})).toEqual(DEFAULT_DRIVE115_SETTINGS_FORM);
  });

  it('maps nested ExtensionSettings.drive115', () => {
    const form = mapSettingsToDrive115Form({
      drive115: {
        enabled: true,
        v2AuthMode: 'self_app',
        v2ApiBaseUrl: 'https://proapi.115.com',
        v2ClientId: 'app-1',
        v2AccessToken: 'access-token-xxxx',
        v2RefreshToken: 'refresh-token-xxxx',
        v2TokenExpiresAt: 1_700_000_000,
        v2AutoRefresh: false,
        v2AutoRefreshSkewSec: 120,
        v2MinRefreshIntervalMin: 90,
        downloadDir: '12345',
        downloadDirName: 'Movies',
        downloadDirPath: '/Movies',
        verifyCount: 3,
        maxFailures: 2,
        v2RefreshTokenStatus: 'valid',
        v2AccessTokenStatus: 'valid',
      },
    } as any);
    expect(form.enabled).toBe(true);
    expect(form.v2AuthMode).toBe('self_app');
    expect(form.v2ClientId).toBe('app-1');
    expect(form.v2AccessToken).toBe('access-token-xxxx');
    expect(form.v2RefreshToken).toBe('refresh-token-xxxx');
    expect(form.v2TokenExpiresAt).toBe(1_700_000_000);
    expect(form.v2AutoRefresh).toBe(false);
    expect(form.v2AutoRefreshSkewSec).toBe(120);
    expect(form.v2MinRefreshIntervalMin).toBe(90);
    expect(form.downloadDir).toBe('12345');
    expect(form.downloadDirName).toBe('Movies');
    expect(form.verifyCount).toBe(3);
    expect(form.maxFailures).toBe(2);
    expect(form.v2RefreshTokenStatus).toBe('valid');
    expect(form.v2AccessTokenStatus).toBe('valid');
  });

  it('maps bare drive115 object and legacy defaultWpPathId', () => {
    const form = mapSettingsToDrive115Form({
      enabled: true,
      v2AuthMode: 'openlist_scan',
      defaultWpPathId: 'legacy-cid',
    });
    expect(form.enabled).toBe(true);
    expect(form.v2AuthMode).toBe('openlist_scan');
    expect(form.downloadDir).toBe('legacy-cid');
  });

  it('clamps min refresh interval to 60-120', () => {
    const low = mapSettingsToDrive115Form({ v2MinRefreshIntervalMin: 10 });
    const high = mapSettingsToDrive115Form({ v2MinRefreshIntervalMin: 999 });
    expect(low.v2MinRefreshIntervalMin).toBe(60);
    expect(high.v2MinRefreshIntervalMin).toBe(120);
  });

  it('formToDrive115Patch trims tokens and strips trailing slash on api url', () => {
    const patch = formToDrive115Patch({
      ...DEFAULT_DRIVE115_SETTINGS_FORM,
      enabled: true,
      v2ApiBaseUrl: '  https://proapi.115.com/  ',
      v2AccessToken: '  atoken  ',
      v2RefreshToken: '  rtoken  ',
      downloadDir: '  99  ',
    });
    expect(patch.v2ApiBaseUrl).toBe('https://proapi.115.com');
    expect(patch.v2AccessToken).toBe('atoken');
    expect(patch.v2RefreshToken).toBe('rtoken');
    expect(patch.downloadDir).toBe('99');
    expect(patch.defaultWpPathId).toBeUndefined();
  });

  it('applies form back to settings without dropping unrelated keys', () => {
    const next = applyDrive115FormToSettings(
      {
        drive115: {
          enabled: false,
          customKeep: true,
          defaultWpPathId: 'old',
        },
      } as any,
      {
        ...DEFAULT_DRIVE115_SETTINGS_FORM,
        enabled: true,
        downloadDir: 'cid-1',
      },
    );
    expect((next as any).drive115.enabled).toBe(true);
    expect((next as any).drive115.downloadDir).toBe('cid-1');
    expect((next as any).drive115.customKeep).toBe(true);
    expect((next as any).drive115.defaultWpPathId).toBeUndefined();
  });

  it('validates disabled form as ok', () => {
    expect(validateDrive115Form(DEFAULT_DRIVE115_SETTINGS_FORM).isValid).toBe(true);
  });

  it('validates enabled form ranges and tokens', () => {
    const bad = validateDrive115Form({
      ...DEFAULT_DRIVE115_SETTINGS_FORM,
      enabled: true,
      v2ApiBaseUrl: 'ftp://bad/',
      v2AccessToken: 'short',
      v2RefreshToken: 'tiny',
      verifyCount: 0,
      maxFailures: 99,
      v2MinRefreshIntervalMin: 10,
    });
    expect(bad.isValid).toBe(false);
    expect(bad.errors.length).toBeGreaterThanOrEqual(4);
  });

  it('warns when credentials missing while enabled', () => {
    const r = validateDrive115Form({
      ...DEFAULT_DRIVE115_SETTINGS_FORM,
      enabled: true,
    });
    expect(r.isValid).toBe(true);
    expect(r.warnings.some((w) => w.includes('token'))).toBe(true);
  });

  it('formats remain / datetime helpers', () => {
    expect(formatDrive115Remain(0)).toBe('已过期');
    expect(formatDrive115Remain(65)).toContain('分钟');
    expect(formatDrive115DateTime(null)).toBe('-');
    expect(formatDrive115DateTime(1_700_000_000)).toMatch(/\d{4}\//);
  });

  it('access token expiry labels', () => {
    const now = 1_000_000;
    expect(
      getAccessTokenExpiryLabel({ v2AccessToken: '', v2TokenExpiresAt: null }, now).text,
    ).toBe('未填写');
    expect(
      getAccessTokenExpiryLabel(
        { v2AccessToken: 'token', v2TokenExpiresAt: null },
        now,
      ).text,
    ).toContain('待验证');
    expect(
      getAccessTokenExpiryLabel(
        { v2AccessToken: 'token', v2TokenExpiresAt: now + 120 },
        now,
      ).tone,
    ).toBe('warn');
    expect(
      getAccessTokenExpiryLabel(
        { v2AccessToken: 'token', v2TokenExpiresAt: now - 1 },
        now,
      ).text,
    ).toBe('已过期');
  });

  it('refresh / access status labels', () => {
    expect(
      getRefreshTokenStatusLabel({
        ...DEFAULT_DRIVE115_SETTINGS_FORM,
        v2RefreshToken: '',
      }).text,
    ).toBe('未填写');
    expect(
      getRefreshTokenStatusLabel({
        ...DEFAULT_DRIVE115_SETTINGS_FORM,
        v2RefreshToken: 'abcdefghi',
        v2RefreshTokenStatus: 'invalid',
      }).text,
    ).toBe('无效');
    expect(
      getAccessTokenStatusLabel({
        v2AccessToken: 'token',
        v2AccessTokenStatus: 'valid',
      })?.text,
    ).toBe('可用');
    expect(
      getAccessTokenStatusLabel({
        v2AccessToken: '',
        v2AccessTokenStatus: 'valid',
      }),
    ).toBeNull();
  });

  it('computes next auto refresh and 2h count', () => {
    const next = computeNextAutoRefreshAt({
      v2LastTokenRefreshAtSec: 1000,
      v2MinRefreshIntervalMin: 60,
      v2TokenExpiresAt: 5000,
      v2AutoRefreshSkewSec: 60,
    });
    // max(1000+3600, 5000-60) = max(4600, 4940) = 4940
    expect(next).toBe(4940);
    expect(countRefreshIn2h([1, 2, 999_999_999], 1_000_000)).toBe(1);
  });

  it('extracts user info display', () => {
    const info = extractUserInfoDisplay({
      uid: 42,
      user_name: 'Alice',
      is_vip: 1,
      vip_info: { level_name: 'VIP', expire: 1_800_000_000 },
      rt_space_info: {
        all_total: { size: 100, size_format: '100 GB' },
        all_use: { size: 40, size_format: '40 GB' },
        all_remain: { size: 60, size_format: '60 GB' },
      },
    });
    expect(info?.name).toBe('Alice');
    expect(info?.uid).toBe('42');
    expect(info?.isVip).toBe(true);
    expect(info?.percent).toBe(40);
    expect(extractUserInfoDisplay(null)).toBeNull();
  });

  it('decodes openlist scan client id as non-empty digits', () => {
    const id = decodeOpenlistScanClientId();
    expect(id.length).toBeGreaterThan(0);
    expect(/^\d+$/.test(id)).toBe(true);
  });
});
