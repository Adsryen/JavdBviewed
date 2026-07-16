/**
 * @file storage.ts
 * @description 上次页面记录读写
 * @module dashboard/lastPage
 */

import { STORAGE_KEYS } from '../../utils/config';
import { getValue, setValue } from '../../utils/storage';
import { parseLastPageRecord } from './model';
import type { DashboardLastPageRecord } from './types';

export async function getLastPageRecord(): Promise<DashboardLastPageRecord | null> {
  try {
    const raw = await getValue<unknown>(STORAGE_KEYS.DASHBOARD_LAST_PAGE, null);
    return parseLastPageRecord(raw);
  } catch {
    return null;
  }
}

export async function setLastPageRecord(record: DashboardLastPageRecord): Promise<void> {
  await setValue(STORAGE_KEYS.DASHBOARD_LAST_PAGE, record);
}

export async function clearLastPageRecord(): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local?.remove) {
      await new Promise<void>((resolve) => {
        chrome.storage.local.remove([STORAGE_KEYS.DASHBOARD_LAST_PAGE], () => resolve());
      });
      return;
    }
  } catch {
    // fall through
  }
  try {
    await setValue(STORAGE_KEYS.DASHBOARD_LAST_PAGE, null);
  } catch {
    // ignore
  }
}
