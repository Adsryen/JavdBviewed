export const TASK_BUCKET_LIMITS: Record<string, number> = {
  translate: 1,
  actorMarks: 2,
  actorRemarks: 2,
  drive115: 1,
  insights: 2,
  videoFavoriteRating: 2,
  contentFilter: 2,
  'light-dom': 6,
};

export function resolveTaskBucket(label: string): string {
  if (label.includes('translate')) return 'translate';
  if (label.startsWith('actorMarks')) return 'actorMarks';
  if (label.startsWith('actorRemarks')) return 'actorRemarks';
  if (label.startsWith('drive115')) return 'drive115';
  if (label.startsWith('insights')) return 'insights';
  if (label.startsWith('videoFavoriteRating')) return 'videoFavoriteRating';
  if (label.startsWith('contentFilter')) return 'contentFilter';
  return 'light-dom';
}
