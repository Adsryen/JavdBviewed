// src/dashboard/home/overview.ts
// 首页统计与分区概览

import { dbViewedStats, dbActorsStats, dbNewWorksStats, ensureBackgroundReady } from '../dbClient';

export async function initStatsOverview(): Promise<void> {
  const container = document.getElementById('stats-overview');
  if (!container) return;

  try {
    try { await ensureBackgroundReady(); } catch {}
    const s = await dbViewedStats();
    const total = s.total ?? 0;
    const viewed = s.byStatus?.viewed ?? 0;
    const browsed = s.byStatus?.browsed ?? 0;
    const want = s.byStatus?.want ?? 0;

    container.innerHTML = `
            <div data-stat="total">
                <span class="stat-value">${total}</span>
                <span class="stat-label">总记录</span>
            </div>
            <div data-stat="viewed">
                <span class="stat-value">${viewed}</span>
                <span class="stat-label">已观看</span>
            </div>
            <div data-stat="browsed">
                <span class="stat-value">${browsed}</span>
                <span class="stat-label">已浏览</span>
            </div>
            <div data-stat="want">
                <span class="stat-value">${want}</span>
                <span class="stat-label">想看</span>
            </div>
        `;
  } catch (error) {
    console.error('初始化统计概览时出错:', error);
    container.innerHTML = `
            <div data-stat="total">
                <span class="stat-value">0</span>
                <span class="stat-label">总记录</span>
            </div>
            <div data-stat="viewed">
                <span class="stat-value">0</span>
                <span class="stat-label">已观看</span>
            </div>
            <div data-stat="browsed">
                <span class="stat-value">0</span>
                <span class="stat-label">已浏览</span>
            </div>
            <div data-stat="want">
                <span class="stat-value">0</span>
                <span class="stat-label">想看</span>
            </div>
        `;
  }
}

// 首页：迁移“番号库/演员库/新作品”的概览统计到首页
export async function initHomeSectionsOverview(): Promise<void> {
  try {
    try { await ensureBackgroundReady(); } catch {}
    // 番号库概览
    const recordsBox = document.getElementById('homeRecordsStatsContainer');
    if (recordsBox) {
      try {
        const s = await dbViewedStats();
        const total = s.total ?? 0;
        const viewed = s.byStatus?.viewed ?? 0;
        const browsed = s.byStatus?.browsed ?? 0;
        const want = s.byStatus?.want ?? 0;
        recordsBox.innerHTML = `
                    <div class="p-home__stat-item" data-stat="total"><span class="p-home__stat-label">总记录</span><span class="p-home__stat-value">${total}</span></div>
                    <div class="p-home__stat-item" data-stat="viewed"><span class="p-home__stat-label">已观看</span><span class="p-home__stat-value">${viewed}</span></div>
                    <div class="p-home__stat-item" data-stat="browsed"><span class="p-home__stat-label">已浏览</span><span class="p-home__stat-value">${browsed}</span></div>
                    <div class="p-home__stat-item" data-stat="want"><span class="p-home__stat-label">想看</span><span class="p-home__stat-value">${want}</span></div>
                    <div class="p-home__stat-item" data-stat="last7"><span class="p-home__stat-label">近7天新增</span><span class="p-home__stat-value">${s.last7Days ?? 0}</span></div>
                    <div class="p-home__stat-item" data-stat="last30"><span class="p-home__stat-label">近30天新增</span><span class="p-home__stat-value">${s.last30Days ?? 0}</span></div>
                `;
      } catch (e) {
        recordsBox.innerHTML = '<div class="p-home__stat-item"><span class="p-home__stat-label">加载失败</span><span class="p-home__stat-value">-</span></div>';
      }
    }

    // 演员库概览
    const actorsBox = document.getElementById('homeActorsStatsContainer');
    if (actorsBox) {
      try {
        const a = await dbActorsStats();
        const female = a.byGender?.female ?? 0;
        const male = a.byGender?.male ?? 0;
        const unknown = a.byGender?.unknown ?? 0;
        const censored = a.byCategory?.censored ?? 0;
        const uncensored = a.byCategory?.uncensored ?? 0;
        actorsBox.innerHTML = `
                    <div class="p-home__stat-item" data-stat="total"><span class="p-home__stat-label">总演员数</span><span class="p-home__stat-value">${a.total ?? 0}</span></div>
                    <div class="p-home__stat-item" data-stat="female"><span class="p-home__stat-label">女性</span><span class="p-home__stat-value">${female}</span></div>
                    <div class="p-home__stat-item" data-stat="male"><span class="p-home__stat-label">男性</span><span class="p-home__stat-value">${male}</span></div>
                    <div class="p-home__stat-item" data-stat="unknown"><span class="p-home__stat-label">未知</span><span class="p-home__stat-value">${unknown}</span></div>
                    <div class="p-home__stat-item" data-stat="censored"><span class="p-home__stat-label">有码</span><span class="p-home__stat-value">${censored}</span></div>
                    <div class="p-home__stat-item" data-stat="uncensored"><span class="p-home__stat-label">无码</span><span class="p-home__stat-value">${uncensored}</span></div>
                    <div class="p-home__stat-item" data-stat="blacklisted"><span class="p-home__stat-label">黑名单</span><span class="p-home__stat-value">${a.blacklisted ?? 0}</span></div>
                    <div class="p-home__stat-item" data-stat="recentlyAdded"><span class="p-home__stat-label">最近新增</span><span class="p-home__stat-value">${a.recentlyAdded ?? 0}</span></div>
                    <div class="p-home__stat-item" data-stat="recentlyUpdated"><span class="p-home__stat-label">最近更新</span><span class="p-home__stat-value">${a.recentlyUpdated ?? 0}</span></div>
                `;
      } catch (e) {
        actorsBox.innerHTML = '<div class="p-home__stat-item"><span class="p-home__stat-label">加载失败</span><span class="p-home__stat-value">-</span></div>';
      }
    }

    // 新作品概览
    const worksBox = document.getElementById('homeNewWorksStatsContainer');
    if (worksBox) {
      try {
        const w = await dbNewWorksStats();
        worksBox.innerHTML = `
                    <div class="p-home__stat-item" data-stat="total"><span class="p-home__stat-label">总记录</span><span class="p-home__stat-value">${w.total ?? 0}</span></div>
                    <div class="p-home__stat-item" data-stat="unread"><span class="p-home__stat-label">未读</span><span class="p-home__stat-value">${w.unread ?? 0}</span></div>
                    <div class="p-home__stat-item" data-stat="today"><span class="p-home__stat-label">今日发现</span><span class="p-home__stat-value">${w.today ?? 0}</span></div>
                    <div class="p-home__stat-item" data-stat="week"><span class="p-home__stat-label">本周发现</span><span class="p-home__stat-value">${w.week ?? 0}</span></div>
                `;
      } catch (e) {
        worksBox.innerHTML = '<div class="p-home__stat-item"><span class="p-home__stat-label">加载失败</span><span class="p-home__stat-value">-</span></div>';
      }
    }
  } catch (e) {
    // 忽略首页缺失容器的情况
  }
}
