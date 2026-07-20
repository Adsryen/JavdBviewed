/**
 * @file storageItemPolicy.ts
 * @description Cloud 同步 Chrome Storage 兜底项过滤规则
 * @module features/cloudSync
 */
import { getCloudStorageAssetPolicy } from '../../shared/dataAssets/assetRegistry';

export const STORAGE_ITEM_TYPE = 'storage_item';

export function shouldSyncStorageItemKey(key: string): boolean {
  if (!key) return false;
  return getCloudStorageAssetPolicy(key)?.cloud.full === true;
}
