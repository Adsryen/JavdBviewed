// src/dashboard/home/charts.ts

import { dbViewedStats, dbActorsStats, dbNewWorksStats, dbViewedPage, dbInsViewsRange, dbTrendsRecordsRange, dbTrendsActorsRange, dbTrendsNewWorksRange, ensureBackgroundReady } from '../dbClient';
import { aggregateMonthly } from '../../services/insights/aggregator';
import { initStatsOverview, initHomeSectionsOverview } from './overview';

function installCanvasDirectionGuard(): void {
  try {
    const w: any = window as any;
    if (w.__CANVAS_DIR_GUARD_INSTALLED__) return;
    const Ctx = (w as any).CanvasRenderingContext2D;
    if (!Ctx || !Ctx.prototype) return;
    const proto = Ctx.prototype as any;
    const desc = Object.getOwnPropertyDescriptor(proto, 'direction');
    if (!desc) return;
    const origSet = desc.set;
    const origGet = desc.get;
    const allowed = ['ltr', 'rtl', 'inherit'];
    Object.defineProperty(proto, 'direction', {
      configurable: true,
      enumerable: true,
      get: origGet ? function(this: any) { try { return origGet.call(this); } catch { return 'ltr'; } } : function(this: any) { return 'ltr'; },
      set: function(this: any, val: any) {
        try {
          const v = allowed.includes(val) ? val : 'ltr';
          if (origSet) origSet.call(this, v);
        } catch {}
      }
    });

    // 额外：在实例级别兜底，拦截 getContext('2d') 返回的 ctx 并定义安全的 direction 访问器
    const CanvasProto = (w as any).HTMLCanvasElement?.prototype;
    const origGetContext = CanvasProto && CanvasProto.getContext;
    if (CanvasProto && typeof origGetContext === 'function') {
      CanvasProto.getContext = function(this: HTMLCanvasElement, type: any, ...args: any[]) {
        const ctx: any = origGetContext.apply(this, [type, ...args]);
        try {
          if (type === '2d' && ctx) {
            const desc2 = Object.getOwnPropertyDescriptor(ctx, 'direction');
            if (!desc2 || desc2.configurable) {
              Object.defineProperty(ctx, 'direction', {
                configurable: true,
                enumerable: true,
                get() { try { return proto.direction ? (proto as any).direction : 'ltr'; } catch { return 'ltr'; } },
                set(val: any) {
                  try {
                    const v = allowed.includes(val) ? val : 'ltr';
                    if (origSet) origSet.call(ctx, v);
                  } catch { try { (ctx as any)._direction = 'ltr'; } catch {} }
                }
              });
            }
          }
        } catch {}
        return ctx;
      } as any;
    }
    w.__CANVAS_DIR_GUARD_INSTALLED__ = true;
  } catch {}
}

let echartsLoadingPromise: Promise<any> | null = null;
async function ensureEchartsLoaded(): Promise<any> {
  const w: any = window as any;
  if (w.echarts) return w.echarts;
  if (echartsLoadingPromise) return echartsLoadingPromise.then(() => (w.echarts || null));
  const inject = (src: string) => new Promise<void>((resolve, reject) => {
    try {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('load failed'));
      (document.head || document.documentElement).appendChild(s);
    } catch { resolve(); }
  });
  echartsLoadingPromise = new Promise(async (resolve) => {
    try { await inject(chrome.runtime.getURL('assets/templates/echarts.min.js')); }
    catch { try { await inject(chrome.runtime.getURL('assets/echarts.min.js')); } catch {} }
    resolve(void 0);
  });
  return echartsLoadingPromise.then(() => ((window as any).echarts || null));
}

let g2plotLoadingPromise: Promise<any> | null = null;
async function ensureG2PlotLoaded(): Promise<any> {
  const w: any = window as any;
  if (w.G2Plot) return w.G2Plot;
  if (g2plotLoadingPromise) return g2plotLoadingPromise.then(() => (w.G2Plot || null));
  const inject = (src: string) => new Promise<void>((resolve, reject) => {
    try {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('load failed'));
      (document.head || document.documentElement).appendChild(s);
    } catch { resolve(); }
  });
  g2plotLoadingPromise = new Promise(async (resolve) => {
    try { await inject(chrome.runtime.getURL('assets/templates/g2plot.min.js')); }
    catch { try { await inject(chrome.runtime.getURL('assets/g2plot.min.js')); } catch {} }
    resolve(void 0);
  });
  return g2plotLoadingPromise.then(() => ((window as any).G2Plot || null));
}

async function renderHomeChartsWithEcharts(): Promise<void> {
  try {
    installCanvasDirectionGuard();
    try { await ensureBackgroundReady(); } catch {}
    const statusEl = document.getElementById('homeStatusDonut') as HTMLDivElement | null;
    const barsEl = document.getElementById('homeNewWorksBars') as HTMLDivElement | null;
    const recordsTrendEl = document.getElementById('homeRecordsTrend') as HTMLDivElement | null;
    const actorsTrendEl = document.getElementById('homeActorsTrend') as HTMLDivElement | null;
    const newWorksTrendEl = document.getElementById('homeNewWorksTrend') as HTMLDivElement | null;
    const tagsEl = document.getElementById('homeTagsTop') as HTMLDivElement | null;
    const changeEl = document.getElementById('homeTagsChange') as HTMLDivElement | null;
    const newTagsEl = document.getElementById('homeNewTagsTop') as HTMLDivElement | null;
    if (!statusEl && !barsEl && !recordsTrendEl && !actorsTrendEl && !newWorksTrendEl && !tagsEl && !changeEl && !newTagsEl) return;
    const ech = await ensureEchartsLoaded();
    if (!ech) return;
    const W: any = window as any;
    const HC: any = (W.__HOME_CHARTS__ = W.__HOME_CHARTS__ || {});
    const getChart = (el: HTMLDivElement | null, key: string) => {
      if (!el) return null;
      const cur = HC[key];
      if (cur && cur.getDom && cur.getDom() === el) return cur;
      if (cur && cur.dispose) { try { cur.dispose(); } catch {} }
      const inst = ech.init(el);
      HC[key] = inst;
      return inst;
    };
    if (!HC._resizeBound) {
      try {
        window.addEventListener('resize', () => {
          ['statusDonut','newWorksBars','activityTrend','tagsTop','tagsChange','newTagsTop','recordsTrend','actorsTrend','newWorksTrend'].forEach((k: string) => {
            const c = HC[k];
            if (c && c.resize) { try { c.resize(); } catch {} }
          });
        });
        HC._resizeBound = true;
      } catch {}
    }
    const getVar = (name: string, fallback: string) => {
      try {
        const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return v || fallback;
      } catch { return fallback; }
    };
    const COLORS: any = {
      primary: getVar('--primary', '#3b82f6'),
      success: getVar('--success', '#22c55e'),
      info: getVar('--info', '#14b8a6'),
      warning: getVar('--warning', '#f59e0b'),
      text: getVar('--text', '#111827'),
      muted: getVar('--muted', '#6b7280'),
      border: getVar('--border', '#e5e7eb'),
      surface: getVar('--surface', '#ffffff'),
      pieBorder: getVar('--bg-primary', '#f5f7fb')
    };
    const fmtDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    let s: any = null, a: any = null, w: any = null, insRange: any = null, insAll: any = null, viewsArrRange: any[] = [];
    const parse = (s: string) => { try { const [Y,M,D] = String(s||'').split('-').map((n) => Number(n)); return new Date(Y, (M||1)-1, D||1); } catch { return new Date(); } };
    const msDay = 24*60*60*1000;
    try { s = await dbViewedStats(); } catch {}
    try { a = await dbActorsStats(); } catch {}
    try { w = await dbNewWorksStats(); } catch {}
    try {
      const { start: startStr, end: endStr } = getHomeChartsRange();
      const sDate = parse(startStr), eDate = parse(endStr);
      const span = Math.max(1, Math.round((eDate.getTime() - sDate.getTime())/msDay) + 1);
      const prevEnd = new Date(sDate.getTime() - msDay);
      const prevStart = new Date(prevEnd.getTime() - (span - 1) * msDay);
      const prevArr = await dbInsViewsRange(fmtDate(prevStart), fmtDate(prevEnd));
      viewsArrRange = await dbInsViewsRange(startStr, endStr);
      insRange = aggregateMonthly(viewsArrRange || [], { topN: 8, previousDays: prevArr || [] });
      const allViews = await dbInsViewsRange('1970-01-01', '2999-12-31');
      insAll = aggregateMonthly(allViews || [], { topN: 10 });
      try { console.info('[INSIGHTS] home echarts range', { start: startStr, end: endStr, views: (viewsArrRange || []).length, trend: Array.isArray(insRange?.trend) ? insRange.trend.length : 0, tagsTop: Array.isArray(insAll?.tagsTop) ? insAll.tagsTop.length : 0 }); } catch {}
    } catch {}

    try {
      if (statusEl) {
        const c = getChart(statusEl, 'statusDonut');
        if (c) {
          const data = [
            { name: '已观看', value: s?.byStatus?.viewed ?? 0, color: COLORS.success },
            { name: '已浏览', value: s?.byStatus?.browsed ?? 0, color: COLORS.info },
            { name: '想看', value: s?.byStatus?.want ?? 0, color: COLORS.warning },
          ];
          const total = data.reduce((s, d) => s + Number(d.value || 0), 0);
          c.setOption({
            tooltip: { trigger: 'item' },
            legend: { orient: 'vertical', left: 'left', textStyle: { color: COLORS.muted } },
            graphic: [{
              type: 'text', left: 'center', top: 'middle', z: 10,
              style: {
                text: `总数\n${total}`,
                textAlign: 'center',
                fill: COLORS.text,
                lineHeight: 18,
                fontSize: 14,
                fontWeight: 'bold',
              }
            }],
            series: [
              {
                type: 'pie', radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                minAngle: 6,
                itemStyle: { borderRadius: 10, borderWidth: 0 },
                label: { show: true, position: 'inside', color: '#fff', formatter: ({ value }: any) => `${value ?? 0}` },
                labelLine: { show: false },
                emphasis: { label: { show: true, fontWeight: 'bold' } },
                data: data.map(d => ({ name: d.name, value: d.value, itemStyle: { color: d.color } }))
              }
            ]
          });
        }
      }
    } catch {}

    try {
      if (barsEl) {
        const c = getChart(barsEl, 'newWorksBars');
        if (c) {
          const vals = [w?.today ?? 0, w?.week ?? 0, w?.unread ?? 0];
          const cats = ['今日发现', '本周发现', '未读'];
          c.setOption({
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            grid: { left: 50, right: 12, top: 10, bottom: 10 },
            xAxis: { type: 'category', data: cats, axisLine: { lineStyle: { color: COLORS.border } }, axisLabel: { color: COLORS.muted } },
            yAxis: { type: 'value', axisLine: { lineStyle: { color: COLORS.border } }, axisLabel: { color: COLORS.muted }, splitLine: { lineStyle: { color: COLORS.border } } },
            series: [{ type: 'bar', data: vals, itemStyle: { color: COLORS.primary, borderRadius: [6,6,0,0] }, barMaxWidth: 22 }]
          });
        }
      }
    } catch {}

    try {
      if (tagsEl) {
        const c = getChart(tagsEl, 'tagsTop');
        if (c) {
          const full = await getTagsTopFromRecords(50);
          const pager = document.getElementById('homeTagsPager') as HTMLDivElement | null;
          const prevBtn = document.getElementById('homeTagsPrevBtn') as HTMLButtonElement | null;
          const nextBtn = document.getElementById('homeTagsNextBtn') as HTMLButtonElement | null;
          const pageText = document.getElementById('homeTagsPageText') as HTMLSpanElement | null;
          const pageSize = 10;
          const totalPages = Math.max(1, Math.ceil(full.length / pageSize));
          const color = (idx: number) => ['#60a5fa','#34d399','#fbbf24','#f472b6','#a78bfa','#f59e0b','#ef4444','#06b6d4','#84cc16','#fb7185'][idx % 10];

          const ctrl: any = {
            page: 0,
            render() {
              const start = this.page * pageSize;
              const pageData = full.slice(start, start + pageSize);
              const option = {
                dataset: [{ source: pageData.map((d, i) => ({ label: d.name, value: d.count, color: color(i) })) }],
                grid: { left: 80, right: 12, top: 10, bottom: 10 },
                xAxis: { type: 'value', axisLine: { lineStyle: { color: COLORS.border } }, axisLabel: { color: COLORS.muted } },
                yAxis: { type: 'category', axisTick: { show: false }, axisLine: { lineStyle: { color: COLORS.border } }, axisLabel: { color: COLORS.muted } },
                series: [{ type: 'bar', encode: { x: 'value', y: 'label' }, label: { show: true, position: 'right', color: COLORS.text }, itemStyle: { color: (p: any) => p.data.color, borderRadius: [0,6,6,0] }, barMaxWidth: 18 }]
              };
              try { c.setOption(option as any, true); } catch { c.setOption(option as any); }
              this.updatePager();
            },
            updatePager() {
              try { if (pageText) pageText.textContent = `${this.page + 1}/${totalPages}`; } catch {}
              try { if (prevBtn) prevBtn.disabled = (this.page <= 0); } catch {}
              try { if (nextBtn) nextBtn.disabled = ((this.page + 1) >= totalPages); } catch {}
            }
          };
          (W as any).__HOME_CHARTS__.__tagsTopPager = ctrl;
          ctrl.render();

          if (pager) {
            if (prevBtn && !(prevBtn as any)._bound) {
              prevBtn.onclick = () => {
                const P = (W as any).__HOME_CHARTS__?.__tagsTopPager; if (!P) return;
                if (P.page > 0) { P.page--; P.render(); }
              };
              (prevBtn as any)._bound = true;
            }
            if (nextBtn && !(nextBtn as any)._bound) {
              nextBtn.onclick = () => {
                const P = (W as any).__HOME_CHARTS__?.__tagsTopPager; if (!P) return;
                if ((P.page + 1) < totalPages) { P.page++; P.render(); }
              };
              (nextBtn as any)._bound = true;
            }
          }
        }
      }
    } catch {}

    try {
      if (changeEl) {
        const c = getChart(changeEl, 'tagsChange');
        if (c) {
          const rising = Array.isArray((insRange as any)?.changes?.risingDetailed) ? (insRange as any).changes.risingDetailed : [];
          const falling = Array.isArray((insRange as any)?.changes?.fallingDetailed) ? (insRange as any).changes.fallingDetailed : [];
          const changes = ([] as any[])
            .concat(rising.map((d: any) => ({ name: d.name, change: Number((d.diffRatio || 0) * 100) })))
            .concat(falling.map((d: any) => ({ name: d.name, change: Number((d.diffRatio || 0) * 100) })))
            .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
            .slice(0, 10);
          const cats = changes.map((r: any) => r.name);
          const vals = changes.map((r: any) => Number(r.change || 0));
          c.setOption({
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p: any) => {
              const v = Array.isArray(p) ? (p[0]?.value ?? 0) : (p?.value ?? 0);
              const sign = v > 0 ? '+' : '';
              return `${sign}${v.toFixed ? v.toFixed(2) : v}%`;
            } },
            grid: { left: 80, right: 12, top: 10, bottom: 10 },
            xAxis: { type: 'value', axisLine: { lineStyle: { color: COLORS.border } }, axisLabel: { color: COLORS.muted, formatter: '{value}%' }, splitLine: { lineStyle: { color: COLORS.border } } },
            yAxis: { type: 'category', data: cats, axisTick: { show: false }, axisLine: { lineStyle: { color: COLORS.border } }, axisLabel: { color: COLORS.muted } },
            series: [{
              type: 'bar', data: vals.map((v: number) => ({ value: v, itemStyle: { color: v >= 0 ? '#16a34a' : '#ef4444', borderRadius: [0,6,6,0] } })),
              barMaxWidth: 18, label: { show: true, position: 'right', color: COLORS.text, formatter: (p: any) => `${p.value > 0 ? '+' : ''}${(p.value as number).toFixed ? (p.value as number).toFixed(2) : p.value}%` }
            }]
          });
        }
      }
    } catch {}

    // 新增标签 Top 5（ECharts）
    try {
      if (newTagsEl) {
        const c = getChart(newTagsEl, 'newTagsTop');
        if (c) {
          const list = Array.isArray((insRange as any)?.changes?.newTagsDetailed) ? (insRange as any).changes.newTagsDetailed : [];
          const top = list.slice(0, 5);
          c.setOption({
            dataset: [{ source: top.map((d: any, i: number) => ({ label: d.name, value: Number(d.count || 0), color: ['#60a5fa','#34d399','#fbbf24','#f472b6','#a78bfa'][i % 5] })) }],
            grid: { left: 80, right: 12, top: 10, bottom: 10 },
            xAxis: { type: 'value', axisLine: { lineStyle: { color: COLORS.border } }, axisLabel: { color: COLORS.muted } },
            yAxis: { type: 'category', axisTick: { show: false }, axisLine: { lineStyle: { color: COLORS.border } }, axisLabel: { color: COLORS.muted } },
            series: [{ type: 'bar', encode: { x: 'value', y: 'label' }, label: { show: true, position: 'right', color: COLORS.text }, itemStyle: { color: (p: any) => p.data.color, borderRadius: [0,6,6,0] }, barMaxWidth: 18 }]
          });
        }
      }
    } catch {}
  } catch {}
}

export async function initOrUpdateHomeCharts(): Promise<void> {
  try {
    installCanvasDirectionGuard();
    try { await ensureBackgroundReady(); } catch {}
    const statusEl = document.getElementById('homeStatusDonut') as HTMLDivElement | null;
    const barsEl = document.getElementById('homeNewWorksBars') as HTMLDivElement | null;
    const trendEl = document.getElementById('homeActivityTrend') as HTMLDivElement | null;
    const tagsEl = document.getElementById('homeTagsTop') as HTMLDivElement | null;
    const changeEl = document.getElementById('homeTagsChange') as HTMLDivElement | null;
    const newTagsEl = document.getElementById('homeNewTagsTop') as HTMLDivElement | null;
    const recordsTrendEl = document.getElementById('homeRecordsTrend') as HTMLDivElement | null;
    const actorsTrendEl = document.getElementById('homeActorsTrend') as HTMLDivElement | null;
    const newWorksTrendEl = document.getElementById('homeNewWorksTrend') as HTMLDivElement | null;
    if (!statusEl && !barsEl && !trendEl && !tagsEl && !changeEl && !newTagsEl) return;
    
    // 显示加载动画（使用绝对定位覆盖层，不清空容器）
    const showLoading = (el: HTMLElement) => {
      // 移除旧的加载层
      const oldLoading = el.querySelector('.chart-loading-overlay');
      if (oldLoading) oldLoading.remove();
      
      // 添加新的加载层
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'chart-loading-overlay';
      loadingDiv.innerHTML = '<div class="chart-loading"><div class="chart-spinner"></div><div class="chart-loading-text">加载中...</div></div>';
      el.style.position = 'relative';
      el.appendChild(loadingDiv);
    };
    
    // 隐藏加载动画
    const hideLoading = (el: HTMLElement) => {
      const loadingDiv = el.querySelector('.chart-loading-overlay');
      if (loadingDiv) loadingDiv.remove();
    };
    
    const chartElements = [statusEl, barsEl, tagsEl, changeEl, newTagsEl, recordsTrendEl, actorsTrendEl, newWorksTrendEl].filter(Boolean) as HTMLElement[];
    chartElements.forEach(showLoading);
    const G2P: any = await ensureG2PlotLoaded();
    if (!G2P) { await renderHomeChartsWithEcharts(); return; }
    const { Column, Line, Bar } = G2P;
    const W: any = window as any;
    const HC: any = (W.__HOME_CHARTS__ = W.__HOME_CHARTS__ || {});
    const getVar = (name: string, fallback: string) => {
      try {
        const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return v || fallback;
      } catch { return fallback; }
    };
    const COLORS = {
      primary: getVar('--primary', '#3b82f6'),
      success: getVar('--success', '#22c55e'),
      info: getVar('--info', '#14b8a6'),
      warning: getVar('--warning', '#f59e0b'),
      text: getVar('--text', '#111827'),
      muted: getVar('--muted', '#6b7280'),
      border: getVar('--border', '#e5e7eb'),
      surface: getVar('--surface', '#ffffff'),
      pieBorder: getVar('--bg-primary', '#f5f7fb')
    } as any;
    const msDay = 24 * 60 * 60 * 1000;
    const fmt = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    const parse = (s: string) => { try { const [Y,M,D] = String(s||'').split('-').map((n) => Number(n)); return new Date(Y, (M||1)-1, D||1); } catch { return new Date(); } };
    let s: any = null, a: any = null, w: any = null, ins: any = null, viewsArr: any[] = [], insAllG2: any = null;
    try { s = await dbViewedStats(); } catch {}
    try { a = await dbActorsStats(); } catch {}
    try { w = await dbNewWorksStats(); } catch {}
    try {
      const r = getHomeChartsRange();
      const sDate = parse(r.start), eDate = parse(r.end);
      const span = Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / msDay) + 1);
      const prevEnd = new Date(sDate.getTime() - msDay);
      const prevStart = new Date(prevEnd.getTime() - (span - 1) * msDay);
      const prevArr = await dbInsViewsRange(fmt(prevStart), fmt(prevEnd));
      viewsArr = await dbInsViewsRange(r.start, r.end);
      ins = aggregateMonthly(viewsArr || [], { topN: 8, previousDays: prevArr || [] });
      const allViews = await dbInsViewsRange('1970-01-01', '2999-12-31');
      insAllG2 = aggregateMonthly(allViews || [], { topN: 10 });
      try { console.info('[INSIGHTS] home g2plot range', { start: r.start, end: r.end, views: (viewsArr || []).length, trend: Array.isArray(ins?.trend) ? ins.trend.length : 0, tagsTop: Array.isArray(insAllG2?.tagsTop) ? insAllG2.tagsTop.length : 0 }); } catch {}
    } catch {}

    try {
      if (statusEl) {
        // 统一用 ECharts 渲染以获得圆角扇区
        const ech = await ensureEchartsLoaded();
        if (ech) {
          try {
            if (HC['statusDonut']?.destroy) { HC['statusDonut'].destroy(); }
          } catch {}
          try {
            if (HC['statusDonut']?.dispose) { HC['statusDonut'].dispose(); }
          } catch {}
          
          // 先移除加载动画，保留标题
          hideLoading(statusEl);
          // 只清除图表内容，保留标题
          const titleEl = statusEl.querySelector('.chart-title');
          statusEl.innerHTML = '';
          if (titleEl) statusEl.appendChild(titleEl);
          
          const inst = ech.init(statusEl);
          const data = [
            { name: '已观看', value: s?.byStatus?.viewed ?? 0, color: COLORS.success },
            { name: '已浏览', value: s?.byStatus?.browsed ?? 0, color: COLORS.info },
            { name: '想看', value: s?.byStatus?.want ?? 0, color: COLORS.warning },
          ];
          const total = data.reduce((s, d) => s + Number(d.value || 0), 0);
          inst.setOption({
            tooltip: { trigger: 'item' },
            legend: { orient: 'vertical', left: 'left', textStyle: { color: COLORS.muted } },
            graphic: [{
              type: 'text', left: 'center', top: 'middle', z: 10,
              style: {
                text: `总数\n${total}`,
                textAlign: 'center',
                fill: COLORS.text,
                lineHeight: 18,
                fontSize: 14,
                fontWeight: 'bold',
              }
            }],
            series: [
              {
                type: 'pie', radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                minAngle: 6,
                itemStyle: { borderRadius: 10, borderWidth: 0 },
                label: { show: true, position: 'inside', color: '#fff', formatter: ({ value }: any) => `${value ?? 0}` },
                labelLine: { show: false },
                emphasis: { label: { show: true, fontWeight: 'bold' } },
                data: data.map(d => ({ name: d.name, value: d.value, itemStyle: { color: d.color } }))
              }
            ]
          });
          HC['statusDonut'] = inst;
          
          // 简单的自适应
          if (!(HC as any)._statusDonutResizeBound) {
            try {
              window.addEventListener('resize', () => { try { HC['statusDonut']?.resize?.(); } catch {} });
              (HC as any)._statusDonutResizeBound = true;
            } catch {}
          }
        }
      }
    } catch {}

    try {
      if (barsEl) {
        if (HC['newWorksBars']?.destroy) { try { HC['newWorksBars'].destroy(); } catch {} }
        
        // 先移除加载动画，保留标题
        hideLoading(barsEl);
        const titleEl = barsEl.querySelector('.chart-title');
        barsEl.innerHTML = '';
        if (titleEl) barsEl.appendChild(titleEl);
        
        const plot = new Column(barsEl, {
          data: [
            { type: '今日发现', value: w?.today ?? 0 },
            { type: '本周发现', value: w?.week ?? 0 },
            { type: '未读', value: w?.unread ?? 0 },
          ],
          xField: 'type',
          yField: 'value',
          columnStyle: { radius: [6,6,0,0] },
          color: COLORS.primary,
          label: { position: 'top' },
          autoFit: true,
        });
        plot.render();
        HC['newWorksBars'] = plot;
      }
    } catch {}

    try {
      if (tagsEl) {
        if (HC['tagsTop']?.destroy) { try { HC['tagsTop'].destroy(); } catch {} }
        HC['tagsTop'] = null;
        
        const full = await getTagsTopFromRecords(50);
        const pageSize = 10;
        const totalPages = Math.max(1, Math.ceil(full.length / pageSize));
        const pageText = document.getElementById('homeTagsPageText') as HTMLSpanElement | null;
        const color = (idx: number) => ['#60a5fa','#34d399','#fbbf24','#f472b6','#a78bfa','#f59e0b','#ef4444','#06b6d4','#84cc16','#fb7185'][idx % 10];
        const pager = document.getElementById('homeTagsPager') as HTMLDivElement | null;
        const prevBtn = document.getElementById('homeTagsPrevBtn') as HTMLButtonElement | null;
        const nextBtn = document.getElementById('homeTagsNextBtn') as HTMLButtonElement | null;

        const ctrl: any = {
          page: 0,
          isFirstRender: true,
          render() {
            const start = this.page * pageSize;
            const list = full.slice(start, start + pageSize).map((d, i) => ({ name: d.name, value: d.count, color: color(i) }));
            try {
              if (HC['tagsTop'] && typeof HC['tagsTop'].changeData === 'function') {
                HC['tagsTop'].changeData(list);
              } else {
                if (HC['tagsTop']?.destroy) { try { HC['tagsTop'].destroy(); } catch {} }
                
                // 首次渲染时先移除加载动画，保留标题和分页器
                if (this.isFirstRender) {
                  hideLoading(tagsEl);
                  const titleEl = tagsEl.querySelector('.chart-title');
                  const pagerEl = tagsEl.querySelector('.chart-pager');
                  tagsEl.innerHTML = '';
                  if (titleEl) tagsEl.appendChild(titleEl);
                  if (pagerEl) tagsEl.appendChild(pagerEl);
                  this.isFirstRender = false;
                }
                
                const plot = new Bar(tagsEl, {
                  data: list, xField: 'value', yField: 'name', legend: false, autoFit: true,
                  barStyle: { radius: [0, 6, 6, 0] }, label: { position: 'right' }, tooltip: { showTitle: false },
                  xAxis: { min: 0, nice: true }, yAxis: { label: { autoHide: true, autoEllipsis: true } },
                  color: (d: any) => d.color,
                });
                plot.render();
                HC['tagsTop'] = plot;
              }
            } catch {
              try { if (HC['tagsTop']?.destroy) { HC['tagsTop'].destroy(); } } catch {}
              
              // 首次渲染时先移除加载动画，保留标题和分页器
              if (this.isFirstRender) {
                hideLoading(tagsEl);
                const titleEl = tagsEl.querySelector('.chart-title');
                const pagerEl = tagsEl.querySelector('.chart-pager');
                tagsEl.innerHTML = '';
                if (titleEl) tagsEl.appendChild(titleEl);
                if (pagerEl) tagsEl.appendChild(pagerEl);
                this.isFirstRender = false;
              }
              
              const plot = new Bar(tagsEl, {
                data: list, xField: 'value', yField: 'name', legend: false, autoFit: true,
                barStyle: { radius: [0, 6, 6, 0] }, label: { position: 'right' }, tooltip: { showTitle: false },
                xAxis: { min: 0, nice: true }, yAxis: { label: { autoHide: true, autoEllipsis: true } },
                color: (d: any) => d.color,
              });
              plot.render();
              HC['tagsTop'] = plot;
            }
            this.updatePager();
          },
          updatePager() {
            try { if (pageText) pageText.textContent = `${this.page + 1}/${totalPages}`; } catch {}
            try { if (prevBtn) prevBtn.disabled = (this.page <= 0); } catch {}
            try { if (nextBtn) nextBtn.disabled = ((this.page + 1) >= totalPages); } catch {}
          }
        };
        HC.__tagsTopPager = ctrl;
        ctrl.render();

        if (pager) {
          if (prevBtn && !(prevBtn as any)._bound) {
            prevBtn.onclick = () => {
              const P = HC.__tagsTopPager; if (!P) return;
              if (P.page > 0) { P.page--; P.render(); }
            };
            (prevBtn as any)._bound = true;
          }
          if (nextBtn && !(nextBtn as any)._bound) {
            nextBtn.onclick = () => {
              const P = HC.__tagsTopPager; if (!P) return;
              if ((P.page + 1) < totalPages) { P.page++; P.render(); }
            };
            (nextBtn as any)._bound = true;
          }
        }
      }
    } catch {}

    try {
      if (changeEl) {
        if (HC['tagsChange']?.destroy) { try { HC['tagsChange'].destroy(); } catch {} }
        
        // 先移除加载动画，保留标题
        hideLoading(changeEl);
        const titleEl = changeEl.querySelector('.chart-title');
        changeEl.innerHTML = '';
        if (titleEl) changeEl.appendChild(titleEl);
        
        const rising = Array.isArray((ins as any)?.changes?.risingDetailed) ? (ins as any).changes.risingDetailed : [];
        const falling = Array.isArray((ins as any)?.changes?.fallingDetailed) ? (ins as any).changes.fallingDetailed : [];
        const changes = ([] as any[])
          .concat(rising.map((d: any) => ({ name: d.name, value: Number((d.diffRatio || 0) * 100) })))
          .concat(falling.map((d: any) => ({ name: d.name, value: Number((d.diffRatio || 0) * 100) })))
          .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
          .slice(0, 10);
        const plot = new Bar(changeEl, {
          data: changes,
          xField: 'value', yField: 'name', legend: false, autoFit: true,
          barStyle: { radius: [0, 6, 6, 0] }, label: { position: 'right', formatter: (d: any) => `${d.value > 0 ? '+' : ''}${(d.value as number).toFixed ? (d.value as number).toFixed(2) : d.value}%` }, tooltip: { showTitle: false },
          xAxis: { nice: true }, yAxis: { label: { autoHide: true, autoEllipsis: true } },
          color: (d: any) => d.value >= 0 ? '#16a34a' : '#ef4444',
        });
        plot.render();
        HC['tagsChange'] = plot;
      }
    } catch {}

    // 新增标签 Top 5（G2Plot）
    try {
      if (newTagsEl) {
        if (HC['newTagsTop']?.destroy) { try { HC['newTagsTop'].destroy(); } catch {} }
        
        // 先移除加载动画，保留标题
        hideLoading(newTagsEl);
        const titleEl = newTagsEl.querySelector('.chart-title');
        newTagsEl.innerHTML = '';
        if (titleEl) newTagsEl.appendChild(titleEl);
        
        const list = Array.isArray((ins as any)?.changes?.newTagsDetailed) ? (ins as any).changes.newTagsDetailed : [];
        const top = list.slice(0, 5).map((d: any, i: number) => ({ name: d.name, value: Number(d.count || 0), color: ['#60a5fa','#34d399','#fbbf24','#f472b6','#a78bfa'][i % 5] }));
        const plot = new Bar(newTagsEl, {
          data: top,
          xField: 'value', yField: 'name', legend: false, autoFit: true,
          barStyle: { radius: [0, 6, 6, 0] }, label: { position: 'right' }, tooltip: { showTitle: false },
          xAxis: { min: 0, nice: true }, yAxis: { label: { autoHide: true, autoEllipsis: true } },
          color: (d: any) => d.color,
        });
        plot.render();
        HC['newTagsTop'] = plot;
      }
    } catch {}

    try {
      const r = getHomeChartsRange();
      if (recordsTrendEl) {
        if (HC['recordsTrend']?.destroy) { try { HC['recordsTrend'].destroy(); } catch {} }
        
        // 先移除加载动画，保留标题
        hideLoading(recordsTrendEl);
        const titleEl = recordsTrendEl.querySelector('.chart-title');
        recordsTrendEl.innerHTML = '';
        if (titleEl) recordsTrendEl.appendChild(titleEl);
        
        const rec = await dbTrendsRecordsRange(r.start, r.end, 'cumulative');
        let data = ([] as any[]).concat(
          rec.map((p: any) => ({ date: p.date, type: '总记录', value: p.total })),
          rec.map((p: any) => ({ date: p.date, type: '已观看', value: p.viewed })),
          rec.map((p: any) => ({ date: p.date, type: '已浏览', value: p.browsed })),
          rec.map((p: any) => ({ date: p.date, type: '想看', value: p.want }))
        );
        const sum = data.reduce((s, d) => s + Number(d.value || 0), 0);
        // 若无数据点，构造起止两点的0值基线，确保折线可绘制
        if (!data.length) {
          data = [
            { date: r.start, type: '总记录', value: 0 },
            { date: r.end,   type: '总记录', value: 0 },
            { date: r.start, type: '已观看', value: 0 },
            { date: r.end,   type: '已观看', value: 0 },
            { date: r.start, type: '已浏览', value: 0 },
            { date: r.end,   type: '已浏览', value: 0 },
            { date: r.start, type: '想看',   value: 0 },
            { date: r.end,   type: '想看',   value: 0 },
          ];
        }
        try { recordsTrendEl.style.display = ''; } catch {}
        const yAxisCfg: any = (sum <= 0) ? { min: 0, max: 1 } : { min: 0, nice: true };
        const plot = new Line(recordsTrendEl, { data, xField: 'date', yField: 'value', seriesField: 'type', smooth: true, autoFit: true, legend: { position: 'top' }, tooltip: { shared: true }, yAxis: yAxisCfg, color: (t: any) => {
          const m: any = { '总记录': COLORS.primary, '已观看': COLORS.success, '已浏览': COLORS.info, '想看': COLORS.warning }; return m[t?.type] || COLORS.primary; } });
        plot.render();
        HC['recordsTrend'] = plot;
      }
      if (actorsTrendEl) {
        if (HC['actorsTrend']?.destroy) { try { HC['actorsTrend'].destroy(); } catch {} }
        
        // 先移除加载动画，保留标题
        hideLoading(actorsTrendEl);
        const titleEl = actorsTrendEl.querySelector('.chart-title');
        actorsTrendEl.innerHTML = '';
        if (titleEl) actorsTrendEl.appendChild(titleEl);
        
        const act = await dbTrendsActorsRange(r.start, r.end, 'cumulative');
        let data = ([] as any[]).concat(
          act.map((p: any) => ({ date: p.date, type: '总演员数', value: p.total })),
          act.map((p: any) => ({ date: p.date, type: '女性', value: p.female })),
          act.map((p: any) => ({ date: p.date, type: '男性', value: p.male })),
        );
        const sum = data.reduce((s, d) => s + Number(d.value || 0), 0);
        // 若无数据点，构造起止两点的0值基线，确保折线可绘制
        if (!data.length) {
          data = [
            { date: r.start, type: '总演员数', value: 0 },
            { date: r.end,   type: '总演员数', value: 0 },
            { date: r.start, type: '女性',     value: 0 },
            { date: r.end,   type: '女性',     value: 0 },
            { date: r.start, type: '男性',     value: 0 },
            { date: r.end,   type: '男性',     value: 0 },
          ];
        }
        try { actorsTrendEl.style.display = ''; } catch {}
        const yAxisCfg: any = (sum <= 0) ? { min: 0, max: 1 } : { min: 0, nice: true };
        const plot = new Line(actorsTrendEl, { data, xField: 'date', yField: 'value', seriesField: 'type', smooth: true, autoFit: true, legend: { position: 'top' }, tooltip: { shared: true }, yAxis: yAxisCfg, color: (t: any) => {
          const m: any = { '总演员数': COLORS.primary, '女性': COLORS.success, '男性': COLORS.info }; return m[t?.type] || COLORS.primary; } });
        plot.render();
        HC['actorsTrend'] = plot;
      }
      if (newWorksTrendEl) {
        if (HC['newWorksTrend']?.destroy) { try { HC['newWorksTrend'].destroy(); } catch {} }
        
        // 先移除加载动画，保留标题
        hideLoading(newWorksTrendEl);
        const titleEl = newWorksTrendEl.querySelector('.chart-title');
        newWorksTrendEl.innerHTML = '';
        if (titleEl) newWorksTrendEl.appendChild(titleEl);
        
        const nw = await dbTrendsNewWorksRange(r.start, r.end, 'cumulative');
        let data = ([] as any[]).concat(
          nw.map((p: any) => ({ date: p.date, type: '总记录', value: p.total })),
          nw.map((p: any) => ({ date: p.date, type: '未读', value: p.unread })),
        );
        const sum = data.reduce((s, d) => s + Number(d.value || 0), 0);
        // 若无数据点，构造起止两点的0值基线，确保折线可绘制
        if (!data.length) {
          data = [
            { date: r.start, type: '总记录', value: 0 },
            { date: r.end,   type: '总记录', value: 0 },
            { date: r.start, type: '未读',   value: 0 },
            { date: r.end,   type: '未读',   value: 0 },
          ];
        }
        try { newWorksTrendEl.style.display = ''; } catch {}
        const yAxisCfg: any = (sum <= 0) ? { min: 0, max: 1 } : { min: 0, nice: true };
        const plot = new Line(newWorksTrendEl, { data, xField: 'date', yField: 'value', seriesField: 'type', smooth: true, autoFit: true, legend: { position: 'top' }, tooltip: { shared: true }, yAxis: yAxisCfg, color: (t: any) => {
          const m: any = { '总记录': COLORS.primary, '未读': COLORS.warning }; return m[t?.type] || COLORS.primary; } });
        plot.render();
        HC['newWorksTrend'] = plot;
      }
    } catch {}
  } catch {}
}

export async function refreshHomeOverview(): Promise<void> {
  await initStatsOverview();
  await initHomeSectionsOverview();
  try { await initOrUpdateHomeCharts(); } catch {}
}

export function bindHomeRefreshButton(): void {
  const btn = document.getElementById('homeRefreshBtn') as HTMLButtonElement | null;
  if (!btn) return;
  if ((btn as any)._bound) return;
  btn.addEventListener('click', async () => {
    try {
      btn.disabled = true;
      btn.classList.add('loading');
      await refreshHomeOverview();
    } finally {
      btn.disabled = false;
      btn.classList.remove('loading');
    }
  });
  (btn as any)._bound = true;
}

export function bindHomeChartsRangeControls(): void {
  try {
    const preset = document.getElementById('homeChartsRangePreset') as HTMLSelectElement | null;
    const start = document.getElementById('homeChartsRangeStart') as HTMLInputElement | null;
    const end = document.getElementById('homeChartsRangeEnd') as HTMLInputElement | null;
    const sep = document.getElementById('homeChartsRangeSep') as HTMLSpanElement | null;
    const apply = document.getElementById('homeChartsRangeApply') as HTMLButtonElement | null;
    if (!preset || !start || !end || !sep) return;
    const fmt = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    };
    const setVisible = (custom: boolean) => {
      try { start.style.display = custom ? '' : 'none'; } catch {}
      try { end.style.display = custom ? '' : 'none'; } catch {}
      try { sep.style.display = custom ? '' : 'none'; } catch {}
    };
    const restore = () => {
      preset.value = '30';
      const now = new Date();
      const endStr = fmt(now);
      const startStr = fmt(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));
      start.value = startStr;
      end.value = endStr;
      setVisible(false);
    };
    const applyNow = async () => {
      try {
        let s = start.value;
        let e = end.value;
        const pv = preset.value || '30';
        if (pv !== 'custom') {
          const days = Math.max(1, parseInt(pv, 10) || 30);
          const now = new Date();
          e = fmt(now);
          s = fmt(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000));
        }
        if (s && e && s > e) { const t = s; s = e; e = t; }
        await initOrUpdateHomeCharts();
      } catch {}
    };
    const debounce = (() => {
      let timer: any = null;
      return (fn: () => void, ms = 300) => { try { if (timer) clearTimeout(timer); } catch {}; timer = setTimeout(fn, ms); };
    })();
    if (!(preset as any)._rangeBound) {
      preset.onchange = () => { setVisible(preset.value === 'custom'); applyNow(); };
      const onDateChange = () => debounce(applyNow, 250);
      try { start.oninput = onDateChange; start.onchange = onDateChange; } catch {}
      try { end.oninput = onDateChange; end.onchange = onDateChange; } catch {}
      if (apply) {
        try { apply.onclick = applyNow; } catch {}
        try { (apply.style as any).display = 'none'; } catch {}
      }
      (preset as any)._rangeBound = true;
    }
    restore();
  } catch {}
}

export function getHomeChartsRange(): { start: string; end: string } {
  try {
    const fmt = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    };
    let pv = '30', s = '', e = '';
    const preset = document.getElementById('homeChartsRangePreset') as HTMLSelectElement | null;
    const start = document.getElementById('homeChartsRangeStart') as HTMLInputElement | null;
    const end = document.getElementById('homeChartsRangeEnd') as HTMLInputElement | null;
    if (preset && start && end) {
      pv = preset.value || '30';
      s = start.value || '';
      e = end.value || '';
    }
    if (pv !== 'custom') {
      const days = Math.max(1, parseInt(pv, 10) || 30);
      const now = new Date();
      e = fmt(now);
      s = fmt(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000));
    }
    if (s && e && s > e) { const t = s; s = e; e = t; }
    if (!(s && e)) {
      const now = new Date();
      e = fmt(now);
      s = fmt(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));
    }
    return { start: s, end: e };
  } catch {
    const now = new Date();
    const fmt = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    };
    const e = fmt(now);
    const s = fmt(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));
    return { start: s, end: e };
  }
}

export async function getTagsTopFromRecords(limit: number = 10): Promise<Array<{ name: string; count: number }>> {
  // 优化：在后台直接统计标签，只返回统计结果
  // 避免传输大量数据，减少前端计算压力
  try {
    const response = await chrome.runtime.sendMessage({ 
      type: 'DB:GET_ALL_TAGS',
      payload: { limit: Math.max(1, Number(limit || 10)) }
    });
    
    if (response?.success && Array.isArray(response?.tags)) {
      return response.tags;
    }
    
    return [];
  } catch (e) {
    console.error('[getTagsTopFromRecords] 查询失败:', e);
    return [];
  }
}
