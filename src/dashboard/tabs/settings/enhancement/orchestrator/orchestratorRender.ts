import { computeDagLayers } from './orchestratorDesign';
import type { OrchestratorDesignTask } from './orchestratorDesign';

export type OrchestratorHost = any;

export function setOrchestratorConnectionStatus(host: OrchestratorHost, status: 'connecting' | 'connected' | 'disconnected' | 'idle'): void {
  if (!host.orchestratorConnectionStatus) return;
  const map = {
    connecting: { text: '连接中...', color: '#2563eb', bg: '#eff6ff' },
    connected: { text: '已连接', color: '#059669', bg: '#ecfdf5' },
    disconnected: { text: '未连接', color: '#dc2626', bg: '#fef2f2' },
    idle: { text: '静态视图', color: '#64748b', bg: '#f1f5f9' },
  } as const;
  const item = map[status];
  host.orchestratorConnectionStatus.textContent = item.text;
  host.orchestratorConnectionStatus.style.color = item.color;
  host.orchestratorConnectionStatus.style.background = item.bg;
}

export function updateOrchestratorLegend(host: OrchestratorHost, mode: 'global' | 'dag'): void {
  if (!host.orchestratorLegend) return;
  const legendMap: Record<'global' | 'dag', string> = {
    global: `
      <div><strong>说明：</strong>全局视图展示任务中心里的真实任务状态，可按当前页实例、最近活跃页和活动任务聚焦。</div>
      <div>• <strong>critical</strong>：最高优先级，直接影响首屏与状态同步。</div>
      <div>• <strong>high</strong>：高优先级，优先进入租约执行。</div>
      <div>• <strong>deferred</strong>：排队后延时启动的任务。</div>
      <div>• <strong>idle</strong>：低优先级后台任务。</div>
    `,
    dag: `
      <div><strong>说明：</strong>DAG 拓扑视图从真实蓝图自动生成，代码变更后自动刷新。</div>
      <div>• <strong>同列任务</strong>可并发执行 · <strong>左列先于右列</strong>执行 · 悬停节点查看依赖关系。</div>
    `,
  };
  host.orchestratorLegend.innerHTML = `<div class="orch-legend">${legendMap[mode]}</div>`;
}

export function renderOrchestratorPhases(host: OrchestratorHost, phases: Record<string, string[]>): void {
  if (!host.orchestratorPhases) return;
  const order: Array<'critical'|'high'|'deferred'|'idle'> = ['critical','high','deferred','idle'];
  const phaseTitle: Record<'critical'|'high'|'deferred'|'idle', string> = {
    critical: '关键（critical）',
    high: '优先（high）',
    deferred: '延迟（deferred）',
    idle: '空闲（idle）',
  };
  const html: string[] = [];
  html.push('<div class="orch-phases-grid">');
  order.forEach((p) => {
    const items = phases[p] || [];
    html.push(`
      <div class="orch-card">
        <div class="orch-card-header">
          <span class="orch-phase">${phaseTitle[p]}</span>
          <span class="orch-count">${items.length} 项</span>
        </div>
        <ul class="orch-list">
          ${items.length === 0 ? '<li class="muted">(无任务)</li>' : items.map((label: string) => {
            const desc = host.getTaskDescription(label);
            const meta = host.getDesignTaskMeta(label);
            const metaText = meta ? ` [P${meta.priority ?? 5}｜${meta.source}]` : '';
            const displayText = `${label}${metaText}${desc ? ` - ${desc}` : ''}`;
            return `<li title="${displayText}"><i class="dot"></i><span class="task-label">${label}</span>${meta ? `<span class="task-meta">P${meta.priority ?? 5} · ${meta.source}</span>` : ''}${desc ? `<span class="task-desc"> - ${desc}</span>` : ''}</li>`;
          }).join('')}
        </ul>
      </div>
    `);
  });
  html.push('</div>');
  host.orchestratorPhases.innerHTML = html.join('');
  host.ensureOrchestratorLocalStyles();
}

export function renderOrchestratorTimeline(host: OrchestratorHost, timeline: Array<{ phase: string; label: string; status: string; ts: number; detail?: any; durationMs?: number }>): void {
  if (!host.orchestratorTimeline) return;
  const mode = host.orchViewModeSel?.value || 'global';
  const filters = host.getTimelineFilters();
  const list = (timeline || []).filter((item: any) => {
    if (filters.status !== 'all' && item.status !== filters.status) return false;
    if (filters.phase !== 'all' && item.phase !== filters.phase) return false;
    if (filters.keyword && !(`${item.label}`.toLowerCase().includes(filters.keyword))) return false;
    return true;
  }).slice(-300);

  const container = host.orchestratorTimeline as HTMLElement;
  container.classList.toggle('timeline-design', mode === 'design');
  container.classList.toggle('timeline-realtime', mode !== 'design');

  const grouped: Array<{ ts: number; items: typeof list }> = [];
  list.forEach((item: any) => {
    const lastGroup = grouped[grouped.length - 1];
    if (lastGroup && Math.abs(lastGroup.ts - item.ts) < 1) {
      lastGroup.items.push(item);
    } else {
      grouped.push({ ts: item.ts, items: [item] });
    }
  });

  const rows = grouped.map((group) => {
    const isConcurrent = group.items.length > 1;
    const groupHtml = group.items.map((item: any, idx: number) => {
      const t = item.ts !== undefined ? (mode === 'design' ? `${Math.round(item.ts)} ms` : `${item.ts.toFixed(1)} ms`) : '';
      const dur = mode === 'design' ? '' : (typeof item.durationMs === 'number' ? `${Math.round(item.durationMs)} ms` : '-');
      const badgeClass = `badge ${item.status}`;
      const detail = item.detail ? `<div class="detail">${item.detail}</div>` : '';
      const desc = host.getTaskDescription(item.label);
      const concurrentMarker = isConcurrent ? `<span class="concurrent-marker" title="并发执行">⚡</span>` : '';
      const timeDisplay = idx === 0 ? t : (isConcurrent ? '↳' : t);
      return `
        <div class="row ${isConcurrent ? 'concurrent' : ''}">
          <div class="col time">${timeDisplay}</div>
          <div class="col status"><span class="${badgeClass}">${host.getStatusLabel(item.status)}</span></div>
          <div class="col phase">${item.phase}</div>
          <div class="col label" title="${item.label}">
            ${concurrentMarker}
            <div class="label-main">${item.label}</div>
            ${desc ? `<div class="label-desc">${desc}</div>` : ''}
          </div>
          ${mode === 'design' ? '' : `<div class="col duration">${dur}</div>`}
        </div>
        ${detail}
      `;
    }).join('');
    return groupHtml;
  }).join('');

  const header = mode === 'design'
    ? `
      <div class="header no-duration">
        <div class="col time">时间(相对)</div>
        <div class="col status">状态</div>
        <div class="col phase">阶段</div>
        <div class="col label">任务</div>
      </div>
    `
    : `
      <div class="header with-duration">
        <div class="col time">时间(ms)</div>
        <div class="col status">状态</div>
        <div class="col phase">阶段</div>
        <div class="col label">任务</div>
        <div class="col duration">耗时</div>
      </div>
    `;

  const hasActiveFilter = (filters.status !== 'all') || (filters.phase !== 'all') || !!filters.keyword;
  const empty = hasActiveFilter
    ? '<div class="muted">无匹配事件（请检查状态/阶段/搜索条件）</div>'
    : '<div class="muted">(暂无事件)</div>';
  host.orchestratorTimeline.innerHTML = `${header}${rows || empty}`;
  host.ensureOrchestratorLocalStyles();
  host.orchestratorTimeline.scrollTop = host.orchestratorTimeline.scrollHeight;
}

export function renderOrchestratorDag(host: OrchestratorHost, tasks: OrchestratorDesignTask[]): void {
  if (!host.orchestratorDag) return;

  const layers = computeDagLayers(tasks);
  const maxLayer = tasks.reduce((max, t) => Math.max(max, layers.get(t.label) ?? 0), 0);
  const phases: Array<'critical' | 'high' | 'deferred' | 'idle'> = ['critical', 'high', 'deferred', 'idle'];

  // grid[layer][phase] = tasks[]
  const grid: Map<number, Map<string, OrchestratorDesignTask[]>> = new Map();
  for (let l = 0; l <= maxLayer; l++) {
    const m = new Map<string, OrchestratorDesignTask[]>();
    phases.forEach(p => m.set(p, []));
    grid.set(l, m);
  }
  tasks.filter(t => t.enabled).forEach(t => {
    const layer = layers.get(t.label) ?? 0;
    grid.get(layer)?.get(t.phase)?.push(t);
  });

  const numCols = maxLayer + 1;
  const colTemplate = `72px repeat(${numCols}, minmax(170px, 1fr))`;

  const html: string[] = [];
  html.push(`<div class="orch-dag-wrap">`);
  html.push(`<div class="orch-dag-grid" style="grid-template-columns:${colTemplate}">`);

  // header row
  html.push(`<div class="orch-dag-corner"></div>`);
  for (let l = 0; l <= maxLayer; l++) {
    const sub = l === 0 ? '<br><small style="font-weight:400;opacity:.7">无依赖</small>' : '';
    html.push(`<div class="orch-dag-layer-hdr">层 ${l}${sub}</div>`);
  }

  // phase rows
  phases.forEach(phase => {
    const phaseColors: Record<string, string> = { critical: '#dc2626', high: '#d97706', deferred: '#2563eb', idle: '#6b7280' };
    html.push(`<div class="orch-dag-phase-lbl" style="color:${phaseColors[phase]}">${phase}</div>`);
    for (let l = 0; l <= maxLayer; l++) {
      const cellTasks = grid.get(l)?.get(phase) ?? [];
      html.push(`<div class="orch-dag-cell">`);
      cellTasks.forEach(t => {
        const depsText = t.dependsOn?.length ? `依赖: ${t.dependsOn.join(', ')}` : '无依赖';
        const meta = [`P${t.priority ?? 5}`, t.source, t.timeout ? `${t.timeout}ms` : ''].filter(Boolean).join(' · ');
        const borderColor = phaseColors[t.phase];
        html.push(`<div class="orch-dag-node" style="border-left-color:${borderColor}" title="${depsText}">`);
        html.push(`<span class="orch-dag-node-label">${t.label}</span>`);
        html.push(`<span class="orch-dag-node-meta">${meta}</span>`);
        html.push(`</div>`);
      });
      html.push(`</div>`);
    }
  });

  html.push(`</div></div>`);
  host.orchestratorDag.innerHTML = html.join('');
  host.ensureOrchestratorLocalStyles();
}
