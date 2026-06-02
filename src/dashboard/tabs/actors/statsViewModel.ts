export interface ActorStatsSnapshot {
  total: number;
  byGender: Record<string, number>;
  byCategory: Record<string, number>;
  blacklisted: number;
  recentlyAdded: number;
}

export function buildActorStatsHtml(stats: ActorStatsSnapshot): string {
  return `
                    <div class="stat-card new-works-stat clickable" data-filter="all" title="点击查看所有演员">
                        <div class="stat-value">${stats.total}</div>
                        <div class="stat-label">总演员数</div>
                    </div>
                    <div class="stat-card new-works-stat clickable" data-filter="female" title="点击查看女演员">
                        <div class="stat-value">${stats.byGender.female || 0}</div>
                        <div class="stat-label">女演员</div>
                    </div>
                    <div class="stat-card new-works-stat clickable" data-filter="male" title="点击查看男演员">
                        <div class="stat-value">${stats.byGender.male || 0}</div>
                        <div class="stat-label">男演员</div>
                    </div>
                    <div class="stat-card new-works-stat clickable" data-filter="censored" title="点击查看有码演员">
                        <div class="stat-value">${stats.byCategory.censored || 0}</div>
                        <div class="stat-label">有码</div>
                    </div>
                    <div class="stat-card new-works-stat clickable" data-filter="uncensored" title="点击查看无码演员">
                        <div class="stat-value">${stats.byCategory.uncensored || 0}</div>
                        <div class="stat-label">无码</div>
                    </div>
                    <div class="stat-card new-works-stat clickable" data-filter="blacklisted" title="点击查看已拉黑演员">
                        <div class="stat-value">${stats.blacklisted || 0}</div>
                        <div class="stat-label">已拉黑</div>
                    </div>
                    <div class="stat-card new-works-stat clickable" data-filter="recentlyAdded" title="点击查看本周新增演员">
                        <div class="stat-value">${stats.recentlyAdded}</div>
                        <div class="stat-label">本周新增</div>
                    </div>
                `;
}
