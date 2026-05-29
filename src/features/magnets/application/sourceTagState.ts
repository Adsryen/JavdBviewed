import type { MagnetResult, MagnetSourceKey, MagnetSourceSearchState } from '../domain/types';
import { extractMagnetHash, getResultSources } from './resultMerge';

export type { MagnetSourceKey, MagnetSourceSearchState };

export interface MagnetSourceTagView {
  text: string;
  className: 'is-light' | 'is-success' | 'is-danger' | 'is-warning';
  title: string;
}

const SOURCE_LABELS: Record<string, string> = {
  sukebei: 'SUK',
  btdig: 'BTD',
  btsow: 'BTS',
  torrentz2: 'TZ2',
  javbus: 'JVB',
};

const SOURCE_KEY_BY_RESULT_SOURCE: Record<string, string> = {
  sukebei: 'sukebei',
  btdig: 'btdig',
  btsow: 'btsow',
  torrentz2: 'torrentz2',
  javbus: 'javbus',
};

export function getMagnetSourceLabel(sourceKey: string): string {
  return SOURCE_LABELS[sourceKey] || sourceKey.toUpperCase();
}

export function countUniqueResultsBySource(results: MagnetResult[]): Record<string, number> {
  const counts: Record<string, number> = {};
  const seen = new Set<string>();

  results.forEach((result) => {
    const hash = extractMagnetHash(result.magnet);
    if (seen.has(hash)) return;
    seen.add(hash);

    getResultSources(result).forEach((source) => {
      const sourceKey = SOURCE_KEY_BY_RESULT_SOURCE[source.toLowerCase()];
      if (!sourceKey) return;
      counts[sourceKey] = (counts[sourceKey] || 0) + 1;
    });
  });

  return counts;
}

export function buildMagnetSourceTagView(
  sourceKey: string,
  state: MagnetSourceSearchState,
  currentUniqueCount = 0,
  latestResultCount?: number,
): MagnetSourceTagView {
  const label = getMagnetSourceLabel(sourceKey);

  if (state === 'searching') {
    return {
      text: `${label}搜索中...`,
      className: 'is-warning',
      title: `${label} 正在搜索`,
    };
  }

  if (state === 'success') {
    const count = latestResultCount === 0 ? 0 : currentUniqueCount;
    return {
      text: `${label}✓(${count})`,
      className: 'is-success',
      title: `${label} 搜索成功，本次获取 ${latestResultCount ?? currentUniqueCount} 条，当前显示 ${currentUniqueCount} 个唯一结果`,
    };
  }

  if (state === 'failed') {
    if (currentUniqueCount > 0) {
      return {
        text: `${label}⚠(${currentUniqueCount})`,
        className: 'is-warning',
        title: `${label} 本次搜索失败，当前显示 ${currentUniqueCount} 个缓存或其他已合并结果`,
      };
    }

    return {
      text: `${label}✗(0)`,
      className: 'is-danger',
      title: `${label} 搜索失败，当前没有可显示结果`,
    };
  }

  return {
    text: `${label}搜索`,
    className: 'is-light',
    title: `${label} 等待搜索`,
  };
}
