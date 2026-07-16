/**
 * @file createExtensionCloudClient.ts
 * @description 组装扩展侧 Cloud API 客户端
 * @module features/cloudSync
 */
import { createApiClient, type ApiClient } from '@javdb/sync-client';
import { createChromeTokenStore } from './chromeTokenStore';
import { loadCloudSettings, type CloudConnectionSettings } from './cloudSettingsStorage';

export async function createExtensionCloudClient(
  settings?: CloudConnectionSettings,
): Promise<{ api: ApiClient; settings: CloudConnectionSettings }> {
  const s = settings ?? (await loadCloudSettings());
  const tokens = createChromeTokenStore({
    getDeviceId: () => s.deviceId,
  });
  const api = createApiClient({
    baseUrl: s.baseUrl,
    tokens,
  });
  return { api, settings: s };
}
