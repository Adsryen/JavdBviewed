/**
 * @file settingsReactRoots.ts
 * @description 设置页 React root 注册表（索引页 / 子页共用，避免循环依赖与双重挂载）
 * @module apps/dashboard/pages/settings
 */
import type { Root } from 'react-dom/client';

export type SettingsReactKind = 'index' | 'subpage';

type Entry = {
  kind: SettingsReactKind;
  root: Root;
  mountEl: Element;
};

const byHost = new WeakMap<Element, Entry>();

/**
 * 记录某宿主上的 React root
 */
export function setSettingsReactRoot(
  host: Element,
  kind: SettingsReactKind,
  root: Root,
  mountEl: Element,
): void {
  byHost.set(host, { kind, root, mountEl });
}

/**
 * 读取宿主上的 React root 记录
 */
export function getSettingsReactRoot(host: Element): Entry | undefined {
  return byHost.get(host);
}

/**
 * 卸载并清除宿主上的 React root（若存在）
 */
export function clearSettingsReactRoot(host: Element): void {
  const entry = byHost.get(host);
  if (!entry) return;
  try {
    entry.root.unmount();
  } catch {
    /* ignore */
  }
  byHost.delete(host);
}
