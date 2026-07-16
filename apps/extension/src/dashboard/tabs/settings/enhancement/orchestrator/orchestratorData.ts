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

export { getTaskDescription, getTaskLabelShort, getTaskLabelDisplay } from '../taskLabelCatalog';
