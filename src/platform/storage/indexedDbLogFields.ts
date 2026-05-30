import type { LogEntry } from '../../types';
import { MAX_INDEX_NUMBER } from './indexedDbSchema';

export function deriveLogSource(msg: string): 'DRIVE115' | 'GENERAL' {
  const m = String(msg || '');
  if (/\[(?:115|115V2|Drive115)\]|\b115\b|Drive115/i.test(m)) return 'DRIVE115';
  return 'GENERAL';
}

export function deriveLogCategory(msg: string): string {
  const m = String(msg || '');
  const match = m.match(/^\[([A-Z0-9]+)\]/);
  if (match) {
    const normalized = match[1].toUpperCase();
    if (normalized === '115' || normalized === '115V2' || normalized === 'DRIVE115') return 'DRIVE115';
    return normalized;
  }
  if (/\[(?:115|115V2|Drive115)\]|\b115\b|Drive115/i.test(m)) return 'DRIVE115';
  if (/\bDB\b|database/i.test(m)) return 'DB';
  if (/\bBG\b|background/i.test(m)) return 'BG';
  return 'GENERAL';
}

function buildLogsTimestampRange(fromMs?: number, toMs?: number): IDBKeyRange | undefined {
  if (fromMs != null && toMs != null) return IDBKeyRange.bound(fromMs, toMs);
  if (fromMs != null) return IDBKeyRange.lowerBound(fromMs);
  if (toMs != null) return IDBKeyRange.upperBound(toMs);
  return undefined;
}

export function buildLogsIndexedCursorSource(
  store: any,
  params: { level?: LogEntry['level']; source?: 'ALL' | 'GENERAL' | 'DRIVE115'; category?: string; fromMs?: number; toMs?: number }
): { source: any; range?: IDBKeyRange; key: 'timestamp' | 'level' | 'source' | 'category' } {
  const { level, source, category, fromMs, toMs } = params;
  const min = fromMs ?? 0;
  const max = toMs ?? MAX_INDEX_NUMBER;
  const normalizedCategory = category && category !== 'ALL' ? String(category).toUpperCase() : '';

  if (level) {
    return {
      source: store.index('by_level_timestamp'),
      range: IDBKeyRange.bound([level, min] as any, [level, max] as any),
      key: 'level',
    };
  }
  if (normalizedCategory) {
    return {
      source: store.index('by_category_timestamp'),
      range: IDBKeyRange.bound([normalizedCategory, min] as any, [normalizedCategory, max] as any),
      key: 'category',
    };
  }
  if (source && source !== 'ALL') {
    return {
      source: store.index('by_source_timestamp'),
      range: IDBKeyRange.bound([source, min] as any, [source, max] as any),
      key: 'source',
    };
  }
  return {
    source: store.index('by_timestamp'),
    range: buildLogsTimestampRange(fromMs, toMs),
    key: 'timestamp',
  };
}
