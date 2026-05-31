// 通用键值 map 合并（遵循策略，默认智能）
import type { MergeOptions } from './dataDiff';

export function mergeKeyedMap<T>(
  localMap: Record<string, T>,
  cloudMap: Record<string, T>,
  diff: any,
  options: MergeOptions
): { merged: Record<string, T>; summary: { added: number; updated: number; kept: number; total: number } } {
  const merged: Record<string, T> = { ...localMap };
  let added = 0;
  let updated = 0;
  const kept = Object.keys(localMap).length;

  switch (options.strategy) {
    case 'cloud-priority':
      Object.assign(merged, cloudMap);
      added = diff.summary.cloudOnlyCount;
      updated = diff.conflicts.length;
      break;
    case 'local-priority':
      for (const id of Object.keys(diff.cloudOnly)) {
        merged[id] = cloudMap[id];
        added++;
      }
      break;
    case 'custom':
      for (const id of Object.keys(diff.cloudOnly)) {
        merged[id] = cloudMap[id];
        added++;
      }
      for (const conflict of diff.conflicts as Array<{ id: string; local: T; cloud: T }>) {
        const resolution = options.customConflictResolutions?.[conflict.id] || 'merge';
        switch (resolution) {
          case 'cloud':
            merged[conflict.id] = conflict.cloud;
            updated++;
            break;
          case 'local':
            break;
          case 'merge':
          default:
            merged[conflict.id] = { ...(conflict.local as any), ...(conflict.cloud as any) } as T;
            updated++;
            break;
        }
      }
      break;
    case 'smart':
    default:
      for (const id of Object.keys(diff.cloudOnly)) {
        merged[id] = cloudMap[id];
        added++;
      }
      for (const conflict of diff.conflicts as Array<{ id: string; local: T; cloud: T }>) {
        merged[conflict.id] = { ...(conflict.local as any), ...(conflict.cloud as any) } as T;
        updated++;
      }
      break;
  }

  return {
    merged,
    summary: {
      added,
      updated,
      kept,
      total: Object.keys(merged).length,
    },
  };
}

