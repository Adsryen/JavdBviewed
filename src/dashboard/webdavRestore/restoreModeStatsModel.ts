export interface RestoreModeStatItem {
  id: string;
  value: number;
}

export function buildRestoreModeStatItems(diffResult: any): RestoreModeStatItem[] {
  return [
    { id: 'quickVideoCount', value: readSummaryNumber(diffResult?.videoRecords, 'totalLocal') },
    { id: 'quickActorCount', value: readSummaryNumber(diffResult?.actorRecords, 'totalLocal') },
    { id: 'quickNewWorksSubsCount', value: readSummaryNumber(diffResult?.newWorks?.subscriptions, 'totalLocal') },
    { id: 'quickNewWorksRecsCount', value: readSummaryNumber(diffResult?.newWorks?.records, 'totalLocal') },
    { id: 'quickConflictCount', value: calculateRestoreModeConflictCount(diffResult) },
  ];
}

export function calculateRestoreModeConflictCount(diffResult: any): number {
  return [
    readSummaryNumber(diffResult?.videoRecords, 'conflictCount'),
    readSummaryNumber(diffResult?.actorRecords, 'conflictCount'),
    readSummaryNumber(diffResult?.newWorks?.subscriptions, 'conflictCount'),
    readSummaryNumber(diffResult?.newWorks?.records, 'conflictCount'),
  ].reduce((sum, value) => sum + value, 0);
}

function readSummaryNumber(section: any, key: string): number {
  const value = Number(section?.summary?.[key] ?? 0);
  return Number.isFinite(value) ? value : 0;
}
