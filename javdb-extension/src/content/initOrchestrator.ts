// src/content/initOrchestrator.ts

export type InitPhase = 'critical' | 'high' | 'deferred' | 'idle';
export type InitTask = () => Promise<void> | void;

export interface InitTaskOptions {
  label?: string;           // 任务名称，便于埋点与可视化
  delayMs?: number;         // 延时执行（统一由编排器管理）
  idle?: boolean;           // 使用 requestIdleCallback 调度（deferred/idle 阶段尤为有用）
  idleTimeout?: number;     // requestIdleCallback 的超时
}

interface ScheduledTask {
  task: InitTask;
  options: InitTaskOptions;
}


class InitOrchestrator {
  private phases: { [K in InitPhase]: ScheduledTask[] } = { critical: [], high: [], deferred: [], idle: [] };
  private started = false;
  private timeline: Array<{ phase: InitPhase; label: string; status: 'scheduled' | 'running' | 'done' | 'error'; ts: number; detail?: any; durationMs?: number }>= [];
  private t0: number | null = null; // run() 开始时刻，用于相对时间
  private verbose = true; // 统一开关，控制是否打印详细日志
  private listeners: Record<string, Array<(payload: any) => void>> = {};

  private relTs(now?: number): number {
    const base = this.t0 ?? performance.now();
    const cur = typeof now === 'number' ? now : performance.now();
    return Math.max(0, cur - base);
  }

  private log(...args: any[]) {
    if (!this.verbose) return;
    try { console.log('[Orchestrator]', ...args); } catch {}
  }

  add(phase: InitPhase, task: InitTask, options: InitTaskOptions = {}): void {
    this.phases[phase].push({ task, options });
    const abs = performance.now();
    const label = options.label || 'anonymous';
    this.timeline.push({ phase, label, status: 'scheduled', ts: abs });
    this.emit('task:scheduled', { phase, label, ts: abs, relativeTs: this.relTs(abs), options });
    this.log('scheduled', { phase, label, delayMs: options.delayMs, idle: options.idle, ts: Math.round(abs), relative: Math.round(this.relTs(abs)) });
  }

  getState() {
    return {
      started: this.started,
      t0: this.t0,
      phases: Object.keys(this.phases).reduce((acc, k) => ({ ...acc, [k]: (this.phases as any)[k].map((t: ScheduledTask) => t.options.label || 'anonymous') }), {} as Record<string, string[]>),
      timeline: [...this.timeline],
    };
  }

  private runTask(phase: InitPhase, st: ScheduledTask): Promise<void> {
    const label = st.options.label || 'anonymous';
    const startMark = `orchestrator:${phase}:${label}:start`;
    const endMark = `orchestrator:${phase}:${label}:end`;
    try { performance.mark(startMark); } catch {}
    const startAbs = performance.now();
    this.timeline.push({ phase, label, status: 'running', ts: startAbs });
    this.emit('task:running', { phase, label, ts: startAbs, relativeTs: this.relTs(startAbs) });
    this.log('running', { phase, label, ts: Math.round(startAbs), relative: Math.round(this.relTs(startAbs)) });
    return Promise.resolve()
      .then(() => st.task())
      .then(() => {
        try {
          performance.mark(endMark);
          performance.measure(`orchestrator:${phase}:${label}`, startMark, endMark);
        } catch {}
        let durationMs: number | undefined = undefined;
        try {
          const entries = performance.getEntriesByName(`orchestrator:${phase}:${label}`);
          const last = entries[entries.length - 1] as PerformanceMeasure | undefined;
          durationMs = last?.duration;
        } catch {}
        const endAbs = performance.now();
        this.timeline.push({ phase, label, status: 'done', ts: endAbs, durationMs });
        this.emit('task:done', { phase, label, ts: endAbs, relativeTs: this.relTs(endAbs), durationMs });
        this.log('done', { phase, label, ts: Math.round(endAbs), relative: Math.round(this.relTs(endAbs)), durationMs: durationMs && Math.round(durationMs) });
      })
      .catch((e) => {
        let durationMs: number | undefined = undefined;
        try {
          performance.mark(endMark);
          performance.measure(`orchestrator:${phase}:${label}`, startMark, endMark);
          const entries = performance.getEntriesByName(`orchestrator:${phase}:${label}`);
          const last = entries[entries.length - 1] as PerformanceMeasure | undefined;
          durationMs = last?.duration;
        } catch {}
        const errAbs = performance.now();
        this.timeline.push({ phase, label, status: 'error', ts: errAbs, detail: String(e), durationMs });
        console.warn(`[InitOrchestrator] task failed: phase=${phase} label=${label}`, e);
        this.emit('task:error', { phase, label, ts: errAbs, relativeTs: this.relTs(errAbs), error: String(e), durationMs });
        this.log('error', { phase, label, ts: Math.round(errAbs), relative: Math.round(this.relTs(errAbs)), error: String(e), durationMs: durationMs && Math.round(durationMs) });
      });
  }

  private scheduleTask(phase: InitPhase, st: ScheduledTask): void {
    const { delayMs, idle, idleTimeout } = st.options || {};
    const exec = () => { this.runTask(phase, st); };
    if (idle) {
      // 若提供了 delayMs，则先等待 delayMs 再进入 idle 调度，确保最小延迟得到保证
      const scheduleIdle = () => {
        try {
          const ric = (window as any).requestIdleCallback as undefined | ((cb: Function, opts?: any) => number);
          if (typeof ric === 'function') {
            this.log('schedule idle', { phase, label: st.options.label || 'anonymous', timeout: idleTimeout });
            ric(() => exec(), { timeout: typeof idleTimeout === 'number' ? idleTimeout : 5000 });
            return;
          }
        } catch {}
        // fallback：无 requestIdleCallback 时，使用一个保守的延迟
        const fallbackDelay = 3000;
        this.log('schedule idle-fallback(setTimeout)', { phase, label: st.options.label || 'anonymous', delayMs: fallbackDelay });
        setTimeout(exec, fallbackDelay);
      };

      if (typeof delayMs === 'number' && delayMs > 0) {
        this.log('schedule idle(with pre-delay)', { phase, label: st.options.label || 'anonymous', delayMs, timeout: idleTimeout });
        setTimeout(scheduleIdle, delayMs);
      } else {
        scheduleIdle();
      }
      return;
    }
    if (typeof delayMs === 'number' && delayMs > 0) {
      this.log('schedule delay', { phase, label: st.options.label || 'anonymous', delayMs });
      setTimeout(exec, delayMs);
    } else {
      // microtask 排队，避免阻塞当前调用栈
      this.log('schedule microtask', { phase, label: st.options.label || 'anonymous' });
      Promise.resolve().then(exec);
    }
  }

  async run(): Promise<void> {
    if (this.started) return;
    this.started = true;
    this.t0 = performance.now();
    this.emit('run:start', { ts: this.t0, relativeTs: 0 });
    this.log('run:start', { ts: Math.round(this.t0) });

    // critical: 串行，首屏必需
    for (const st of this.phases.critical) {
      await this.runTask('critical', st);
    }

    // high: 并发（必要的 await 由任务内部负责）
    await Promise.all(this.phases.high.map((st) => this.runTask('high', st)));

    // deferred: 根据选项调度
    this.phases.deferred.forEach((st) => this.scheduleTask('deferred', st));

    // idle: 更空闲时再做
    this.phases.idle.forEach((st) => this.scheduleTask('idle', st));

    const afterSchedule = performance.now();
    this.emit('run:scheduledDeferred', { ts: afterSchedule, relativeTs: this.relTs(afterSchedule) });
    this.log('run:scheduledDeferred', { ts: Math.round(afterSchedule), relative: Math.round(this.relTs(afterSchedule)) });
  }

  on(event: string, listener: (payload: any) => void): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(listener);
  }

  off(event: string, listener: (payload: any) => void): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== listener);
  }

  private emit(event: string, payload: any): void {
    const list = this.listeners[event];
    if (!list || list.length === 0) return;
    try {
      list.forEach(fn => {
        try { fn(payload); } catch {}
      });
    } catch {}
    // 同步广播到扩展后台/页面，方便仪表盘实时可视化订阅
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
        chrome.runtime.sendMessage({ type: 'orchestrator:event', event, payload, pageUrl });
      }
    } catch {}
  }
}

export const initOrchestrator = new InitOrchestrator();

// 暴露到 window 以便后续可视化与调试（非必需，安全起见仅在内容脚本环境）
try {
  if (typeof window !== 'undefined') {
    (window as any).__initOrchestrator__ = initOrchestrator;
  }
} catch {}
