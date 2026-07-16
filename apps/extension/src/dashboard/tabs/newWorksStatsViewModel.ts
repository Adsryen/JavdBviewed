import type { NewWorksStats } from '../../types';

export function buildNewWorksStatsHtml(stats: NewWorksStats): string {
  return `
                <div class="stat-card new-works-stat clickable" data-filter="all" title="点击查看所有订阅演员">
                    <div class="stat-value">${stats.totalSubscriptions}</div>
                    <div class="stat-label">订阅演员</div>
                </div>
                <div class="stat-card new-works-stat clickable" data-filter="active" title="点击查看活跃订阅">
                    <div class="stat-value">${stats.activeSubscriptions}</div>
                    <div class="stat-label">活跃订阅</div>
                </div>
                <div class="stat-card new-works-stat clickable" data-filter="allWorks" title="点击查看所有新作品">
                    <div class="stat-value">${stats.totalNewWorks}</div>
                    <div class="stat-label">总新作品</div>
                </div>
                <div class="stat-card new-works-stat clickable" data-filter="unread" title="点击查看未读作品">
                    <div class="stat-value">${stats.unreadWorks}</div>
                    <div class="stat-label">未读作品</div>
                </div>
                <div class="stat-card new-works-stat clickable" data-filter="today" title="点击查看今日发现">
                    <div class="stat-value">${stats.todayDiscovered}</div>
                    <div class="stat-label">今日发现</div>
                </div>
            `;
}

export function buildManageSubscriptionsButtonHtml(totalSubscriptions: number | undefined): string {
  const count = totalSubscriptions || 0;
  return `<i class="fas fa-list"></i> 管理订阅 <span class="badge">${count}</span>`;
}
