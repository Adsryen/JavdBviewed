/**
 * @file resolveSettingsTarget.ts
 * @description resolveSettingsTarget
 * @module features/settingsSearch
 */
import type { SettingsSearchItem, SettingsSearchTarget } from '../domain/types';

export function resolveSettingsTarget(item: SettingsSearchItem): SettingsSearchTarget {
  return {
    hash: item.hash,
    targetSelector: item.targetSelector,
    title: item.title,
  };
}
