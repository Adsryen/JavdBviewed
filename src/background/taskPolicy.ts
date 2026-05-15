export const TASK_BUCKET_LIMITS: Record<string, number> = {
  videoStatus: 6,
  translate: 1,
  actorMarks: 3,
  actorRemarks: 3,
  drive115: 4,
  'drive115-push': 3,
  insights: 3,
  videoFavoriteRating: 3,
  contentFilter: 3,
  'ui-light': 8,
  'video-light': 8,
  auxiliary: 20,
};

export function resolveTaskBucket(label: string): string {
  if (label.startsWith('videoStatus:')) return 'videoStatus';
  if (label.includes('translate')) return 'translate';
  if (label.startsWith('actorMarks')) return 'actorMarks';
  if (label.startsWith('actorRemarks')) return 'actorRemarks';
  if (label === 'drive115:push') return 'drive115-push';
  if (label.startsWith('drive115')) return 'drive115';
  if (label.startsWith('insights')) return 'insights';
  if (label.startsWith('videoFavoriteRating')) return 'videoFavoriteRating';
  if (label.startsWith('contentFilter')) return 'contentFilter';
  if (label.startsWith('ui:remove-unwanted') || label.includes(':panel')) return 'ui-light';
  if (label.startsWith('videoEnhancement:') || label.startsWith('ux:magnet:')) return 'video-light';
  return 'auxiliary';
}
