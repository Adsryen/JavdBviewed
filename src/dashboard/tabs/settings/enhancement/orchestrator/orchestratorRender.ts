export type OrchestratorHost = any;

export function setOrchestratorConnectionStatus(host: OrchestratorHost, status: 'connecting' | 'connected' | 'disconnected' | 'idle'): void {
  if (!host.orchestratorConnectionStatus) return;
  const map = {
    connecting: { text: '连接中...', color: '#2563eb', bg: '#eff6ff' },
    connected: { text: '已连接', color: '#059669', bg: '#ecfdf5' },
    disconnected: { text: '未连接', color: '#dc2626', bg: '#fef2f2' },
    idle: { text: '全局/设计视图', color: '#64748b', bg: '#f1f5f9' },
  } as const;
  const item = map[status];
  host.orchestratorConnectionStatus.textContent = item.text;
  host.orchestratorConnectionStatus.style.color = item.color;
  host.orchestratorConnectionStatus.style.background = item.bg;
}

export function updateOrchestratorLegend(host: OrchestratorHost, mode: 'design' | 'realtime' | 'global'): void {
  if (!host.orchestratorLegend) return;
  const legendMap: Record<'design' | 'realtime' | 'global', string> = {
    design: `
      <div><strong>说明：</strong>设计视图展示当前配置生成的真实蓝图。</div>
      <div>• <strong>critical</strong>：关键路径，先执行，优先级最高。</div>
      <div>• <strong>high</strong>：高优先级，尽快进入编排。</div>
      <div>• <strong>deferred</strong>：延后执行，等待合适时机。</div>
      <div>• <strong>idle</strong>：空闲时执行，避免打断主流程。</div>
    `,
    realtime: `<div><strong>说明：</strong>实时视图已停用，使用全局视图进行页面实例聚焦。</div>`,
    global: `
      <div><strong>说明：</strong>全局视图展示任务中心里的真实任务状态，可按当前页实例、最近活跃页和活动任务聚焦。</div>
      <div>• <strong>critical</strong>：最高优先级，直接影响首屏与状态同步。</div>
      <div>• <strong>high</strong>：高优先级，优先进入租约执行。</div>
      <div>• <strong>deferred</strong>：排队后延时启动的任务。</div>
      <div>• <strong>idle</strong>：低优先级后台任务。</div>
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
