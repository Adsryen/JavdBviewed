import { viewedPut as idbViewedPut } from '../../../../platform/storage/indexedDb';
import type { VideoRecord } from '../../../../types';
import { STORAGE_KEYS } from '../../../../utils/config';
import { md5Hex } from '../../../../shared/utils/md5';
import { getValue, setValue } from '../../../../utils/storage';
import { fetchHtml } from './cloudflareVerification';
import { parseSearchResults } from './javdbParsers';

const log = (...args: any[]) => console.log('[Sync]', ...args);

export function isFC2Video(videoId: string): boolean {
  const upper = videoId.toUpperCase();
  return upper.startsWith('FC2-') || upper.includes('FC2PPV');
}

export async function refreshFC2RecordById(videoId: string): Promise<VideoRecord> {
  log(`[refreshFC2RecordById] Starting FC2 refresh for: ${videoId}`);

  const allRecords = await getValue<Record<string, VideoRecord>>(STORAGE_KEYS.VIEWED_RECORDS, {});
  const existingRecord = allRecords[videoId];
  let movieId: string | undefined;

  if (existingRecord?.javdbUrl) {
    const match = existingRecord.javdbUrl.match(/\/v\/([a-zA-Z0-9]+)/);
    if (match) movieId = match[1];
  }

  if (!movieId) {
    log(`[refreshFC2RecordById] No movieId found, searching for ${videoId}`);
    const searchUrl = `https://javdb.com/search?q=${encodeURIComponent(videoId)}&f=all`;
    const searchHtml = await fetchHtml(searchUrl);
    const searchResult = parseSearchResults(searchHtml, videoId);

    if (!searchResult) {
      throw new Error(`无法找到FC2视频: ${videoId}`);
    }

    const match = searchResult.href.match(/\/v\/([a-zA-Z0-9]+)/);
    if (match) {
      movieId = match[1];
    } else {
      throw new Error(`无法从URL中提取movieId: ${searchResult.href}`);
    }
  }

  log(`[refreshFC2RecordById] Using movieId: ${movieId}`);

  const apiUrl = `https://jdforrepam.com/api/v4/movies/${movieId}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const salt = '71cf27bb3c0bcdf207b64abecddc970098c7421ee7203b9cdae54478478a199e7d5a6e1a57691123c1a931c057842fb73ba3b3c83bcd69c17ccf174081e3d8aa';
  const signature = `${timestamp}.lpw6vgqzsp.${md5Hex(`${timestamp}${salt}`)}`;

  log(`[refreshFC2RecordById] Fetching from API: ${apiUrl}`);

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      jdSignature: signature,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
  }

  const apiData = await response.json();
  if (!apiData.data || !apiData.data.movie) {
    throw new Error(apiData.message || '获取FC2视频信息失败');
  }

  const movie = apiData.data.movie;
  const now = Date.now();
  const updateImgServer = (url: string) => url.replace(/https:\/\/.*?\/rhe951l4q/g, 'https://c0.jdbstatic.com');

  const updatedRecord: VideoRecord = {
    id: videoId,
    title: movie.origin_title || movie.title || '',
    status: existingRecord?.status || 'browsed',
    tags: (movie.actors || []).map((actor: any) => actor.name),
    createdAt: existingRecord?.createdAt || now,
    updatedAt: now,
    releaseDate: movie.release_date || '',
    javdbUrl: `https://javdb.com/v/${movieId}`,
    javdbImage: movie.cover_url ? updateImgServer(movie.cover_url) : undefined,
  };

  allRecords[videoId] = updatedRecord;
  await setValue(STORAGE_KEYS.VIEWED_RECORDS, allRecords);

  try {
    await idbViewedPut(updatedRecord);
  } catch (e: any) {
    log('WARN', '写入 IndexedDB 失败', { videoId, error: e?.message });
  }

  log(`[refreshFC2RecordById] Successfully refreshed FC2 record for ${videoId}`);
  return updatedRecord;
}
