import type { ListRecord, VideoRecord } from '../../types';

export type CollectionListType = 'series' | 'label';

const COLLECTION_PREFIX: Record<CollectionListType, string> = {
  series: 'series:',
  label: 'label:',
};

export function isCollectionListType(type: unknown): type is CollectionListType {
  return type === 'series' || type === 'label';
}

export function isCollectionListRecord(record: Pick<ListRecord, 'type'> | null | undefined): boolean {
  return !!record && isCollectionListType(record.type);
}

export function isVideoListRecord(record: Pick<ListRecord, 'type'> | null | undefined): boolean {
  return !!record && (record.type === 'mine' || record.type === 'favorite' || record.type === 'local');
}

export function normalizeCollectionExternalId(type: CollectionListType, raw: string): string {
  const value = String(raw || '').trim();
  return type === 'label' ? value.toUpperCase() : value;
}

export function getCollectionRecordId(type: CollectionListType, externalId: string): string {
  return `${COLLECTION_PREFIX[type]}${normalizeCollectionExternalId(type, externalId)}`;
}

export function stripCollectionRecordPrefix(type: CollectionListType, id: string): string {
  const value = String(id || '').trim();
  const prefix = COLLECTION_PREFIX[type];
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

export function getCollectionExternalId(record: Pick<ListRecord, 'id' | 'type'> & Partial<Pick<ListRecord, 'externalId'>>): string {
  if (!isCollectionListType(record.type)) return String(record.id || '').trim();
  const raw = record.externalId || stripCollectionRecordPrefix(record.type, record.id);
  return normalizeCollectionExternalId(record.type, raw);
}

export function normalizeCollectionRecord<T extends ListRecord>(record: T): T {
  if (!isCollectionListType(record.type)) return record;
  const externalId = getCollectionExternalId(record);
  return {
    ...record,
    id: getCollectionRecordId(record.type, externalId),
    externalId,
  };
}

export function normalizeListRecordForUse<T extends ListRecord>(record: T): T {
  if (isCollectionListType(record.type)) {
    return normalizeCollectionRecord(record);
  }
  return {
    ...record,
    source: record.source ?? 'javdb',
  };
}

export function getSeriesExternalIdFromUrl(seriesUrl?: string): string {
  const match = String(seriesUrl || '').match(/\/series\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]).trim() : '';
}

function normalizeComparableName(value: unknown): string {
  return String(value || '').trim().normalize('NFKC').replace(/\s+/g, ' ').toLowerCase();
}

export function matchesSeriesRecord(
  record: Partial<VideoRecord>,
  series: Pick<ListRecord, 'id' | 'name' | 'type'> & Partial<Pick<ListRecord, 'externalId'>>
): boolean {
  const externalId = getCollectionExternalId(series);
  const urlId = getSeriesExternalIdFromUrl(record.seriesUrl);
  if (urlId && externalId && urlId === externalId) return true;

  const recordSeries = normalizeComparableName(record.series);
  if (!recordSeries) return false;

  const seriesName = normalizeComparableName(series.name);
  const seriesId = normalizeComparableName(externalId);
  return (!!seriesName && recordSeries === seriesName) || (!!seriesId && recordSeries === seriesId);
}

export function matchesLabelRecord(record: Pick<VideoRecord, 'id'> | Partial<VideoRecord>, label: Pick<ListRecord, 'id' | 'type'> & Partial<Pick<ListRecord, 'externalId'>>): boolean {
  const prefix = getCollectionExternalId(label).toUpperCase();
  const id = String(record.id || '').toUpperCase();
  return !!prefix && (id === prefix || id.startsWith(`${prefix}-`));
}
