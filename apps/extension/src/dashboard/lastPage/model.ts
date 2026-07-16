/**
 * @file model.ts
 * @description 上次页面 hash 规范化、标题解析、是否展示
 * @module dashboard/lastPage
 */

import {
  buildDashboardNavHash,
  DASHBOARD_NAV_GROUPS,
  getDefaultNavState,
  resolveDashboardNavState,
} from '../tabs/navModel';
import { resolveSettingsSubPathTitle } from './settingsTitleMap';
import type { DashboardLastPageRecord } from './types';

/** 规范为带 # 的稳定 hash；空则回落到默认首页 */
export function normalizeDashboardHash(hash: string | null | undefined): string {
  const raw = (hash ?? '').trim();
  if (!raw || raw === '#') {
    return buildDashboardNavHash(getDefaultNavState());
  }

  const withHash = raw.startsWith('#') ? raw : `#${raw}`;
  const state = resolveDashboardNavState(withHash);
  return buildDashboardNavHash({
    tabId: state.tabId,
    subPath: state.subPath,
  });
}

export function resolveLastPageTitle(hash: string | null | undefined): string {
  const normalized = normalizeDashboardHash(hash);
  const state = resolveDashboardNavState(normalized);
  const group = DASHBOARD_NAV_GROUPS.find((item) => item.id === state.groupId);
  const item = group?.items.find((candidate) => candidate.id === state.itemId);

  if (state.tabId === 'tab-settings') {
    if (state.subPath) {
      return `设置 · ${resolveSettingsSubPathTitle(state.subPath)}`;
    }
    return group && item ? `${group.label} · ${item.label}` : '设置 · 设置中心';
  }

  if (group && item) {
    if (group.id === 'home') {
      return item.label;
    }
    return `${group.label} · ${item.label}`;
  }

  return normalized || '未知页面';
}

export function shouldShowLastPageResume(
  record: DashboardLastPageRecord | null | undefined,
  currentHash: string | null | undefined,
): boolean {
  if (!record || typeof record.hash !== 'string' || !record.hash.trim()) {
    return false;
  }
  return normalizeDashboardHash(record.hash) !== normalizeDashboardHash(currentHash);
}

export function buildLastPageRecord(
  hash: string | null | undefined,
  now: number = Date.now(),
): DashboardLastPageRecord {
  const normalized = normalizeDashboardHash(hash);
  return {
    hash: normalized,
    title: resolveLastPageTitle(normalized),
    updatedAt: now,
  };
}

export function parseLastPageRecord(raw: unknown): DashboardLastPageRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Partial<DashboardLastPageRecord>;
  if (typeof data.hash !== 'string' || !data.hash.trim()) return null;
  const hash = normalizeDashboardHash(data.hash);
  const title = typeof data.title === 'string' && data.title.trim()
    ? data.title.trim()
    : resolveLastPageTitle(hash);
  const updatedAt = typeof data.updatedAt === 'number' && Number.isFinite(data.updatedAt)
    ? data.updatedAt
    : Date.now();
  return { hash, title, updatedAt };
}
