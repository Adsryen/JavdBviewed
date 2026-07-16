/**
 * @file drive115PlaybackModel.test.ts
 * @description 115 播放候选模型单测
 * @module features/drive115
 */
import { describe, expect, it } from 'vitest';
import {
  buildPlaySessionFromSearch,
  mapSearchItemsToPlayCandidates,
  pickDefaultPlayCandidate,
} from './drive115PlaybackModel';
import type { Drive115V2SearchItem } from './index';

const sample: Drive115V2SearchItem[] = [
  {
    file_id: '1',
    user_id: 'u',
    sha1: 'a',
    file_name: 'ABC-123.mp4',
    file_size: '1000',
    user_ptime: '',
    user_utime: '',
    pick_code: 'p1',
    parent_id: '0',
    area_id: '1',
  } as Drive115V2SearchItem,
  {
    file_id: '2',
    user_id: 'u',
    sha1: 'b',
    file_name: 'ABC-123.nfo',
    file_size: '10',
    user_ptime: '',
    user_utime: '',
    pick_code: 'p2',
    parent_id: '0',
    area_id: '1',
  } as Drive115V2SearchItem,
];

describe('drive115PlaybackModel', () => {
  it('maps search items to candidates', () => {
    const list = mapSearchItemsToPlayCandidates(sample);
    expect(list).toHaveLength(2);
    expect(list[0].pickCode).toBe('p1');
  });

  it('prefers video files as default candidate', () => {
    const def = pickDefaultPlayCandidate(mapSearchItemsToPlayCandidates(sample));
    expect(def?.fileName).toContain('.mp4');
  });

  it('builds session with candidates status', () => {
    const session = buildPlaySessionFromSearch('ABC-123', sample);
    expect(session.status).toBe('candidates');
    expect(session.candidates.length).toBe(2);
  });

  it('errors when no hits', () => {
    const session = buildPlaySessionFromSearch('NONE', []);
    expect(session.status).toBe('error');
  });
});
