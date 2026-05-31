export interface OperationSummaryItemViewModel {
  label: string;
  value: number;
  iconClass: string;
}

export function buildOperationSummaryItems(summary: any): OperationSummaryItemViewModel[] {
  return [
    { label: '新增视频记录', value: summary.videoRecords.added, iconClass: 'fas fa-plus' },
    { label: '更新视频记录', value: summary.videoRecords.updated, iconClass: 'fas fa-edit' },
    { label: '保留视频记录', value: summary.videoRecords.kept, iconClass: 'fas fa-check' },
    { label: '新增演员收藏', value: summary.actorRecords.added, iconClass: 'fas fa-user-plus' },
    { label: '更新演员收藏', value: summary.actorRecords.updated, iconClass: 'fas fa-user-edit' },
    { label: '保留演员收藏', value: summary.actorRecords.kept, iconClass: 'fas fa-user-check' },
    { label: '新增新作品订阅', value: summary.newWorks?.subscriptions?.added ?? 0, iconClass: 'fas fa-bell' },
    { label: '更新新作品订阅', value: summary.newWorks?.subscriptions?.updated ?? 0, iconClass: 'fas fa-bell' },
    { label: '新增新作品记录', value: summary.newWorks?.records?.added ?? 0, iconClass: 'fas fa-bell' },
    { label: '更新新作品记录', value: summary.newWorks?.records?.updated ?? 0, iconClass: 'fas fa-bell' },
  ];
}
