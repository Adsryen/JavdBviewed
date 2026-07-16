export interface RestoreFooterButtonSpec {
  id: string;
  className: string;
  html: string;
}

export function buildRestoreFooterButtonSpecs(): RestoreFooterButtonSpec[] {
  return [
    {
      id: 'webdavRestoreBack',
      className: 'btn btn-secondary hidden',
      html: '<i class="fas fa-arrow-left"></i> 返回',
    },
    {
      id: 'webdavRestoreCancel',
      className: 'btn btn-secondary',
      html: '取消',
    },
  ];
}
