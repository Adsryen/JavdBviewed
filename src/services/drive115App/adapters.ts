import type { Drive115V2SearchItem } from '../drive115v2';
import type { Drive115File, Drive115LegacyLikeSearchResult } from './types';

export function toUnixSeconds(value: any): number {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n > 1e12 ? Math.floor(n / 1000) : Math.floor(n);
}

export function mapV2SearchItem(item: Drive115V2SearchItem | any): Drive115File {
  return {
    name: String(item?.file_name || item?.n || ''),
    pickCode: String(item?.pick_code || item?.pc || ''),
    fileId: String(item?.file_id || item?.fid || ''),
    parentId: String(item?.parent_id || item?.cid || ''),
    size: Number(item?.file_size || item?.s || 0) || 0,
    updatedAt: toUnixSeconds(item?.user_utime || item?.t || 0),
    raw: item,
  };
}

export function mapLegacySearchResult(item: Drive115LegacyLikeSearchResult | any): Drive115File {
  return {
    name: String(item?.n || item?.file_name || ''),
    pickCode: String(item?.pc || item?.pick_code || ''),
    fileId: String(item?.fid || item?.file_id || ''),
    parentId: String(item?.cid || item?.parent_id || ''),
    size: Number(item?.s || item?.file_size || 0) || 0,
    updatedAt: toUnixSeconds(item?.t || item?.user_utime || 0),
    raw: item,
  };
}
