export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    registered: '已注册',
    queued: '排队中',
    leased: '已租约',
    running: '运行中',
    paused: '已暂停',
    canceled: '已取消',
    done: '已完成',
    error: '错误',
    scheduled: '已排程',
    stale: '失联',
  };
  return map[status] || status;
}

export function getGlobalTaskStatus(task: any): string {
  const heartbeatTs = typeof task?.heartbeatTs === 'number' ? task.heartbeatTs : 0;
  const isStale = heartbeatTs > 0 && (Date.now() - heartbeatTs > 15000);
  if (isStale && ['leased', 'running'].includes(String(task?.status))) return 'stale';
  return String(task?.status || 'queued');
}

export function getWaitReasonLabel(waitReason: string | undefined): string {
  if (!waitReason || waitReason === 'none') return '无';
  if (waitReason.startsWith('bucket:')) {
    const bucket = waitReason.split(':')[1] || 'unknown';
    return `配额占满(${bucket})`;
  }
  if (waitReason === 'tab-hidden') return '页面隐藏';
  if (waitReason === 'higher-priority-wait') return '等待更高优先级任务';
  if (waitReason === 'lease-timeout') return '心跳超时取消';
  if (waitReason === 'page-closed-by-user') return '页面关闭取消';
  if (waitReason === 'page-refresh-replaced') return '页面刷新替换';
  if (waitReason === 'manual-cancel') return '手动取消';
  if (waitReason === 'task-not-found') return '任务不存在';
  if (waitReason === 'paused') return '主动暂停';
  return waitReason;
}

export function buildGlobalTaskDetail(task: any): string {
  const statusPart = `状态: ${getStatusLabel(getGlobalTaskStatus(task))}`;
  const queuePart = `队列: ${getWaitReasonLabel(task.waitReason)} | 优先级=${task.priority ?? '-'} | 阶段=${task.phase || '-'}`;
  const quotaPart = `配额: cost=${task.cost || 'unknown'} | policy=${task.visibilityPolicy || 'unknown'} | retry=${task.retryCount ?? 0}/${task.retryLimit ?? 0}`;
  const heartbeatPart = task.heartbeatTs
    ? `心跳: ${Math.max(0, Math.round((Date.now() - task.heartbeatTs) / 1000))}s 前 | tab=${task.tabId}`
    : `心跳: 无 | tab=${task.tabId}`;
  return `${statusPart}<br>${queuePart}<br>${quotaPart}<br>${heartbeatPart}`;
}

export function getTaskDescription(label: string): string {
  const map: Record<string, string> = {
    'system:init': '系统全局初始化',
    'list:observe:init': '列表页观察器初始化',
    'actorEnhancement:init': '演员页增强初始化',
    'actorEnhancement:actionButtons': '演员页操作按钮增强',
    'enhancementUI:showLoadingIndicator': '增强加载提示显示',
    'performanceOptimizer:init': '性能优化器初始化',
    'ux:shortcuts:init': '快捷键系统初始化',
    'superRankingNav:init': '超级排行榜导航初始化',
    'keyboardShortcuts:init': '快捷键系统初始化',
    // privacy:init 主 content 未接线，不在设计视图展示为可执行任务
    'ui:remove-unwanted': '移除官方按钮',
    'drive115:init:video': '115网盘功能初始化（影片页）',
    'drive115:init:list': '115网盘功能初始化（列表页）',
    'listEnhancement:init': '列表增强初始化',
    'videoStatus:initialSync': '番号库状态同步与页面标记',
    'videoStatus:finalizeStatus': '番号库状态发布与图标更新',
    'videoStatus:fullRefresh': '番号库详情全量刷新',
    'videoEnhancement:initCore': '影片页核心初始化',
    'videoEnhancement:clickEnhancement': '详情页点击增强',
    'videoStatus:update': '页面影片状态更新',
    'videoStatus:observer': '页面影片状态监听',
    'insights:collector': '观影标签采集器',
    'actorRemarks:actorPage': '演员页备注显示',
    'anchorOptimization:init': '锚点优化初始化',
    'ux:anchorOptimization:init': '锚点优化初始化',
    'contentFilter:init': '内容过滤初始化',
    'contentFilter:initialize': '内容过滤初始化',
    'ux:contentFilter': '内容过滤初始化',
    'emby:badge': 'Emby/Jellyfin 徽标增强',
    'passwordHelper:init': '密码助手初始化',
    'videoEnhancement:runCover': '影片页封面增强',
    'videoEnhancement:runTitle': '影片页标题翻译',
    'videoEnhancement:runReviewBreaker': '评论区破解',
    'videoEnhancement:runRelatedLists': '相关清单解锁',
    'videoEnhancement:runFC2Breaker': 'FC2拦截破解',
    'videoEnhancement:finish': '影片页增强完成',
    'actorRemarks:run': '演员备注快速运行',
    'videoFavoriteRating:init': '影片收藏评分初始化',
    'onlineAvailability:check': '在线可看性检测',
    'drive115:push': '115推送任务',
    'ux:magnet:autoSearch': '磁力搜索自动检索',
    'list:preview:init': '列表页预览初始化',
    'list:optimization:init': '列表页优化初始化',
  };
  return map[label] || '';
}
