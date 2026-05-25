import type { TaskDetailsController } from './taskDetailsController';

export function taskDetailsSortHandler(controller: TaskDetailsController, field: string): void {
  if (controller.host.taskDetailsSortField === field) {
    controller.host.taskDetailsSortOrder = controller.host.taskDetailsSortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    controller.host.taskDetailsSortField = field;
    controller.host.taskDetailsSortOrder = 'desc';
  }

  controller.host.renderTaskDetailsTable();

  if (controller.host.taskDetailsTable) {
    const headers = controller.host.taskDetailsTable.querySelectorAll('thead th[data-sort]');
    headers.forEach((header: Element) => {
      const icon = header.querySelector('i');
      if (!icon) return;
      const headerField = header.getAttribute('data-sort');
      icon.className = headerField === field
        ? (controller.host.taskDetailsSortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down')
        : 'fas fa-sort';
    });
  }
}

export function taskDetailsSearchHandler(controller: TaskDetailsController): void {
  if (!controller.host.taskDetailsSearch) return;

  const query = controller.host.taskDetailsSearch.value.trim().toLowerCase();
  controller.host.taskDetailsSearchQuery = query;

  if (!query) {
    controller.host.taskDetailsFilteredData = [];
    controller.host.taskDetailsPageSummaryFilteredData = [];
  } else {
    controller.host.taskDetailsFilteredData = controller.host.taskDetailsData.filter((task: any) => {
      const label = (task.label || '').toLowerCase();
      const pageUrl = (task.pageUrl || '').toLowerCase();
      const subtask = (task.subtaskLabel || '').toLowerCase();
      const detail = (task.detail || '').toLowerCase();
      const mainId = (task.mainId || '').toLowerCase();
      const pageInstanceId = (task.pageInstanceId || '').toLowerCase();

      const taskNameMap: Record<string, string> = {
        'drive115:init:video': '115功能初始化-视频页',
        'drive115:init:list': '115功能初始化-列表页',
        'drive115:push': '115推送任务',
        'insights:collector': '观影标签采集器',
        'actorRemarks:actorPage': '演员备注-演员页',
        'actorRemarks:run': '演员备注-运行',
        'actorMarks:page': '演员标识-页面标记',
        'videoStatus:update': '页面影片状态更新',
        'videoStatus:observer': '页面影片状态监听',
        'videoEnhancement:clickEnhancement': '视频增强-点击增强',
        'ux:shortcuts:init': '快捷键初始化',
        'ux:magnet:autoSearch': '磁力搜索自动检索',
        'privacy:init': '隐私保护初始化',
        'ui:remove-unwanted': '移除不需要的按钮',
        'superRankingNav:init': '超级排行榜导航初始化',
        'magnetSearch:init': '磁力搜索初始化',
        'anchorOptimization:init': '锚点优化初始化',
        'listEnhancement:init': '列表增强初始化',
        'listEnhancement:reprocess': '列表增强-二次处理',
        'actorEnhancement:init': '演员增强初始化',
        'actorEnhancement:actionButtons': '演员页操作按钮增强',
        'enhancementUI:showLoadingIndicator': '增强加载提示显示',
        'emby:init': 'Emby增强初始化',
        'emby:badge': 'Emby徽标增强',
        'passwordHelper:init': '密码助手初始化',
        'defaultHide:init': '默认隐藏初始化',
        'contentFilter:init': '内容过滤初始化',
        'contentFilter:initialize': '内容过滤初始化',
        'videoEnhancement:initCore': '视频增强-核心初始化',
        'videoEnhancement:loadData': '视频增强-加载聚合数据',
        'videoEnhancement:translateCurrentTitle': '视频增强-标题定点翻译',
        'videoEnhancement:runCover': '视频增强-封面处理',
        'videoEnhancement:runTitle': '视频增强-标题处理',
        'videoEnhancement:runReviewBreaker': '视频增强-评论破解',
        'videoEnhancement:runRelatedLists': '视频增强-相关清单解锁',
        'videoEnhancement:runFC2Breaker': '视频增强-FC2破解',
        'videoEnhancement:panel': '视频增强-面板注入',
        'videoEnhancement:finish': '视频增强-完成',
        'videoFavoriteRating:init': '视频收藏评分初始化',
        'onlineAvailability:check': '在线可看性检测',
      };
      const displayName = (taskNameMap[task.label] || task.label || '').toLowerCase();

      return label.includes(query)
        || pageUrl.includes(query)
        || subtask.includes(query)
        || detail.includes(query)
        || displayName.includes(query)
        || mainId.includes(query)
        || pageInstanceId.includes(query);
    });

    controller.host.taskDetailsPageSummaryFilteredData = controller.host.taskDetailsPageSummaryData.filter((item: any) => {
      const pageUrl = (item.pageUrl || '').toLowerCase();
      const mainId = (item.mainId || '').toLowerCase();
      const pageType = (item.pageType || '').toLowerCase();
      const pageInstanceId = (item.pageInstanceId || '').toLowerCase();
      const detail = (item.detail || '').toLowerCase();
      return pageUrl.includes(query)
        || mainId.includes(query)
        || pageType.includes(query)
        || pageInstanceId.includes(query)
        || detail.includes(query);
    });
  }

  controller.host.taskDetailsCurrentPage = 1;
  controller.host.renderTaskDetailsTable();
  const total = controller.host.getRenderedTaskDetailsCount();
  const totalPages = Math.max(1, Math.ceil(total / controller.host.taskDetailsPageSize));
  controller.host.updateTaskDetailsPagination(total, totalPages);
}
