// src/background/sync.ts
// Compatibility entry for legacy imports. Refresh implementation lives in features/records/refresh.

import { refreshRecordById as refreshRecordByIdCore } from '../features/records/refresh';
import type { VideoRecord } from '../types';

export async function refreshRecordById(videoId: string): Promise<VideoRecord> {
  return refreshRecordByIdCore(videoId);
}
