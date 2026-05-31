import { isValueableTag } from '../../shared/utils/tagFilter';

export interface ViewedTagStat {
  name: string;
  count: number;
}

type SourceRecordCollection = unknown[] | Record<string, unknown> | null | undefined;
interface SourceRecord {
  record: unknown;
  sourceId?: string;
}
type RecordShapedTagSource = Record<string, { id: string; tags: string[] }>;

const TAG_FIELD_PATHS = [
  ['tags'],
  ['categories'],
  ['genres'],
  ['genre'],
  ['enhancedData', 'tags'],
  ['enhancedData', 'categories'],
  ['enhancedData', 'genres'],
  ['enhancedData', 'genre'],
  ['detail', 'tags'],
  ['detail', 'categories'],
  ['detail', 'genres'],
  ['detail', 'genre'],
  ['metadata', 'tags'],
  ['metadata', 'categories'],
  ['metadata', 'genres'],
  ['metadata', 'genre'],
] as const;

export function buildViewedTagStats(records: unknown[], limit = 50): ViewedTagStat[] {
  return buildViewedTagStatsFromSources([records], limit);
}

export function buildViewedTagStatsFromSources(sources: SourceRecordCollection[], limit = 50): ViewedTagStat[] {
  const totals = new Map<string, { name: string; count: number; firstSeenIndex: number }>();
  let nextIndex = 0;
  const recordsById = new Map<string, unknown>();
  const anonymousRecords: unknown[] = [];

  for (const source of Array.isArray(sources) ? sources : []) {
    for (const entry of normalizeRecordCollection(source)) {
      const record = entry.record;
      const id = getRecordId(record, entry.sourceId);
      if (id) {
        const existing = recordsById.get(id);
        recordsById.set(id, existing ? mergeRecordForTags(existing, record) : record);
      } else {
        anonymousRecords.push(record);
      }
    }
  }

  for (const record of [...recordsById.values(), ...anonymousRecords]) {
    const names = collectRecordTagNames(record);
    for (const name of names) {
      if (!isValueableTag(name)) continue;
      const key = normalizeTagKey(name);
      const current = totals.get(key);
      if (current) {
        current.count += 1;
      } else {
        totals.set(key, { name, count: 1, firstSeenIndex: nextIndex++ });
      }
    }
  }

  return Array.from(totals.values())
    .sort((a, b) => b.count - a.count || a.firstSeenIndex - b.firstSeenIndex)
    .map(({ name, count }) => ({ name, count }))
    .slice(0, Math.max(1, Number(limit || 50)));
}

export function buildViewedRecordSourceFromTagIndexRows(rows: unknown[]): RecordShapedTagSource {
  const records: RecordShapedTagSource = {};
  if (!Array.isArray(rows)) return records;

  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const source = row as Record<string, unknown>;
    const tag = typeof source.tag === 'string' || typeof source.tag === 'number' ? String(source.tag).trim() : '';
    const videoId = typeof source.videoId === 'string' || typeof source.videoId === 'number' ? String(source.videoId).trim() : '';
    if (!tag || !videoId) continue;

    const current = records[videoId] || { id: videoId, tags: [] };
    if (!current.tags.includes(tag)) current.tags.push(tag);
    records[videoId] = current;
  }

  return records;
}

function normalizeRecordCollection(source: SourceRecordCollection): SourceRecord[] {
  if (Array.isArray(source)) return source.map(record => ({ record }));
  if (!source || typeof source !== 'object') return [];
  return Object.entries(source).map(([sourceId, record]) => ({ sourceId, record }));
}

function getRecordId(record: unknown, fallbackId?: string): string {
  let value: unknown = fallbackId;
  if (record && typeof record === 'object') {
    value = (record as Record<string, unknown>).id ?? (record as Record<string, unknown>).videoCode ?? (record as Record<string, unknown>).code ?? fallbackId;
  }
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim().toUpperCase() : '';
}

function mergeRecordForTags(left: unknown, right: unknown): unknown {
  if (!left || typeof left !== 'object') return right;
  if (!right || typeof right !== 'object') return left;
  const merged: Record<string, unknown> = { ...(left as Record<string, unknown>), ...(right as Record<string, unknown>) };
  for (const key of ['tags', 'categories', 'genres'] as const) {
    const values = new Set<string>();
    addTagValues(values, (left as Record<string, unknown>)[key]);
    addTagValues(values, (right as Record<string, unknown>)[key]);
    if (values.size > 0) merged[key] = Array.from(values);
  }
  return merged;
}

export function collectRecordTagNames(record: unknown): string[] {
  if (!record || typeof record !== 'object') return [];
  const names = new Set<string>();
  for (const path of TAG_FIELD_PATHS) {
    addTagValues(names, readPath(record as Record<string, unknown>, path));
  }
  return Array.from(names);
}

function readPath(record: Record<string, unknown>, path: readonly string[]): unknown {
  let current: unknown = record;
  for (const key of path) {
    if (!current || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function addTagValues(target: Set<string>, value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) addTagValues(target, item);
    return;
  }
  if (value && typeof value === 'object') {
    const objectValue = value as Record<string, unknown>;
    addTagValues(target, objectValue.name ?? objectValue.label ?? objectValue.title ?? objectValue.text);
    return;
  }
  if (typeof value !== 'string' && typeof value !== 'number') return;

  for (const piece of splitTagText(String(value))) {
    const name = piece.trim();
    if (name) target.add(name);
  }
}

function splitTagText(text: string): string[] {
  return text
    .split(/[,\uFF0C/\u3001|;；\n\r\t]+/g)
    .map(part => part.trim())
    .filter(Boolean);
}

function normalizeTagKey(tag: string): string {
  return String(tag || '').trim().toLowerCase();
}
