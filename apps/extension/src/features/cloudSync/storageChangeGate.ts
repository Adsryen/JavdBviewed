/**
 * @file storageChangeGate.ts
 * @description 标记远端应用写入，避免 Cloud 同步回声
 * @module features/cloudSync
 */

type ExpectedStorageWrite = {
  hasNewValue: boolean;
  value?: unknown;
};

const remoteWrites = new Map<string, ExpectedStorageWrite[]>();

function stableStringify(value: unknown): string {
  if (value === undefined) return 'undefined';
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function storageValuesEqual(left: unknown, right: unknown): boolean {
  return stableStringify(left) === stableStringify(right);
}

export function markCloudStorageWrite(key: string, value?: unknown): void {
  if (!key) return;
  const list = remoteWrites.get(key) ?? [];
  list.push({
    hasNewValue: arguments.length >= 2,
    value,
  });
  remoteWrites.set(key, list);
}

export function shouldSuppressCloudStorageChange(
  key: string,
  change: chrome.storage.StorageChange,
): boolean {
  const list = remoteWrites.get(key);
  if (!list?.length) return false;

  const hasNewValue = Object.prototype.hasOwnProperty.call(change, 'newValue');
  const index = list.findIndex((expected) => {
    if (expected.hasNewValue !== hasNewValue) return false;
    if (!expected.hasNewValue) return true;
    return storageValuesEqual(expected.value, change.newValue);
  });
  if (index < 0) return false;

  list.splice(index, 1);
  if (list.length) {
    remoteWrites.set(key, list);
  } else {
    remoteWrites.delete(key);
  }
  return true;
}
