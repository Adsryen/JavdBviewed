// src/content/initOrchestrator.ts

// removed unused import: performanceOptimizer

export type InitPhase = 'critical' | 'high' | 'deferred' | 'idle';
export type InitTask = () => Promise<void> | void;

export interface InitTaskOptions {
  label?: string;           // 任务名称，便于埋点与可视化
  delayMs?: number;         // 延时执行（统一由编排器管理）
  idle?: boolean;           // 使用 requestIdleCallback 调度（deferred/idle 阶段尤为有用）
  idleTimeout?: number;     // requestIdleCallback 的超时
  priority?: number;        // 优先级（0-10，数字越大优先级越高，默认5）
  timeout?: number;         // 任务执行超时时间（毫秒），0表示不限制
  dependsOn?: string[];     // 依赖的任务标签列表
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
  
  // 并发控制
  private runningHighTasks = 0;
  private maxConcurrentHighTasks = 3; // 限制high阶段并发数
  
  // 性能指标
  private metrics = {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    timeoutTasks: 0,
    totalDuration: 0,
    avgDuration: 0,
    maxDuration: 0,
    minDuration: Infinity,
    maxDurationTask: '', // 最耗时的任务名称
  };
  
  // 任务依赖管理
  private completedTasks = new Set<string>(); // 已完成的任务标签
  private taskDependencies = new Map<string, string[]>(); // 任务依赖关系

  constructor() {
    // 根据设备性能动态调整并发数
    this.adjustConcurrencyByHardware();
  }

  private relTs(now?: number): number {
    const base = this.t0 ?? performance.now();
    const cur = typeof now === 'number' ? now : performance.now();
    return Math.max(0, cur - base);
  }

  private log(...args: any[]) {
    if (!this.verbose) return;
    try { console.log('[Orchestrator]', ...args); } catch {}
  }

  /**
   * 根据设备硬件性能动态调整并发数
   */
  private adjustConcurrencyByHardware(): void {
    try {
      const cores = navigator.hardwareConcurrency || 4;
      if (cores >= 8) {
        this.maxConcurrentHighTasks = 5; // 高性能设备
        this.log('Hardware detection: High-end device, concurrency set to 5');
      } else if (cores >= 4) {
        this.maxConcurrentHighTasks = 3; // 中等性能设备
        this.log('Hardware detection: Mid-range device, concurrency set to 3');
      } else {
        this.maxConcurrentHighTasks = 2; // 低性能设备
        this.log('Hardware detection: Low-end device, concurrency set to 2');
      }
    } catch (e) {
      this.log('Hardware detection failed, using default concurrency: 3');
    }
  }

  /**
   * 更新性能指标
   */
  private updateMetrics(durationMs: number, success: boolean, isTimeout: boolean = false, taskLabel?: string): void {
    this.metrics.totalTasks++;
    if (success) {
      this.metrics.completedTasks++;
      this.metrics.totalDuration += durationMs;
      this.metrics.avgDuration = this.metrics.totalDuration / this.metrics.completedTasks;
      
      // 更新最大耗时和对应的任务
      if (durationMs > this.metrics.maxDuration) {
        this.metrics.maxDuration = durationMs;
        this.metrics.maxDurationTask = taskLabel || 'unknown';
      }
      
      this.metrics.minDuration = Math.min(this.metrics.minDuration, durationMs);
    } else {
      if (isTimeout) {
        this.metrics.timeoutTasks++;
      } else {
        this.metrics.failedTasks++;
      }
    }
    // 任务完成后，调度保存性能指标
    this.scheduleMetricsSave();
  }

  /**
   * 获取性能指标
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * 将性能指标保存到数据库
   */
  private async saveMetricsToDatabase(): Promise<void> {
    try {
      const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
      const metrics = {
        ...this.metrics,
        pageUrl,
        timestamp: Date.now(),
      };
      
      this.log('Saving metrics to database:', metrics);
      
      // 发送到后台保存
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          type: 'orchestrator:saveMetrics',
          metrics,
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn('[Orchestrator] Failed to save metrics:', chrome.runtime.lastError);
          } else {
            this.log('Metrics saved successfully:', response);
          }
        });
      }
    } catch (e) {
      console.warn('[Orchestrator] Failed to save metrics to database:', e);
    }
  }

  /**
   * 保存单个任务的详细信息
   */
  private async saveTaskDetail(phase: InitPhase, label: string, status: 'done' | 'error', durationMs: number | undefined, error?: string): Promise<void> {
    try {
      const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
      const taskDetail = {
        label,
        phase,
        status,
        durationMs: durationMs || 0,
        pageUrl,
        timestamp: Date.now(),
        error,
      };
      
      // 发送到后台保存
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          type: 'orchestrator:saveTaskDetail',
          taskDetail,
        }, (response) => {
          if (chrome.runtime.lastError) {
            // 静默失败，不影响主流程
          }
        });
      }
    } catch (e) {
      // 静默失败
    }
  }

  /**
   * 任务完成时保存性能指标
   */
  private scheduleMetricsSave(): void {
    // 防抖：避免频繁写入数据库
    if (this.metricsSaveTimeout) {
      clearTimeout(this.metricsSaveTimeout);
    }
    this.metricsSaveTimeout = window.setTimeout(() => {
      this.saveMetricsToDatabase();
    }, 1000); // 1秒后保存
  }

  private metricsSaveTimeout?: number;

  add(phase: InitPhase, task: InitTask, options: InitTaskOptions = {}): void {
    // 记录任务依赖关系
    if (options.dependsOn && options.dependsOn.length > 0 && options.label) {
      this.taskDependencies.set(options.label, options.dependsOn);
    }
    
    this.phases[phase].push({ task, options });
    const abs = performance.now();
    const label = options.label || 'anonymous';
    this.timeline.push({ phase, label, status: 'scheduled', ts: abs });
    this.emit('task:scheduled', { phase, label, ts: abs, relativeTs: this.relTs(abs), options });
    this.log('scheduled', { phase, label, delayMs: options.delayMs, idle: options.idle, priority: options.priority, timeout: options.timeout, dependsOn: options.dependsOn, ts: Math.round(abs), relative: Math.round(this.relTs(abs)) });
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
    
    // 检查依赖是否满足
    if (st.options.dependsOn && st.options.dependsOn.length > 0) {
      const unmetDeps = st.options.dependsOn.filter(dep => !this.completedTasks.has(dep));
      if (unmetDeps.length > 0) {
        this.log('skipping task due to unmet dependencies', { label, unmetDeps });
        return Promise.resolve();
      }
    }
    
    const startMark = `orchestrator:${phase}:${label}:start`;
    const endMark = `orchestrator:${phase}:${label}:end`;
    try { performance.mark(startMark); } catch {}
    const startAbs = performance.now();
    this.timeline.push({ phase, label, status: 'running', ts: startAbs });
    this.emit('task:running', { phase, label, ts: startAbs, relativeTs: this.relTs(startAbs) });
    this.log('running', { phase, label, ts: Math.round(startAbs), relative: Math.round(this.relTs(startAbs)) });
    
    // 创建超时Promise
    const timeout = st.options.timeout || 0;
    let timeoutId: number | undefined;
    const timeoutPromise = timeout > 0 ? new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error(`Task timeout after ${timeout}ms`));
      }, timeout);
    }) : null;
    
    const taskPromise = Promise.resolve()
      .then(() => {
        // 如果有超时设置，使用 Promise.race
        if (timeoutPromise) {
          return Promise.race([st.task(), timeoutPromise]);
        }
        return st.task();
      })
      .then(() => {
        // 清除超时定时器
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }
        
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
        // 更新性能指标
        if (durationMs !== undefined) {
          this.updateMetrics(durationMs, true, false, label);
        }
        // 标记任务为已完成
        if (label !== 'anonymous') {
          this.completedTasks.add(label);
        }
        // 保存任务详细信息
        this.saveTaskDetail(phase, label, 'done', durationMs);
      })
      .catch((e) => {
        // 清除超时定时器
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }
        
        let durationMs: number | undefined = undefined;
        try {
          performance.mark(endMark);
          performance.measure(`orchestrator:${phase}:${label}`, startMark, endMark);
          const entries = performance.getEntriesByName(`orchestrator:${phase}:${label}`);
          const last = entries[entries.length - 1] as PerformanceMeasure | undefined;
          durationMs = last?.duration;
        } catch {}
        const errAbs = performance.now();
        const isTimeout = e.message && e.message.includes('timeout');
        this.timeline.push({ phase, label, status: 'error', ts: errAbs, detail: String(e), durationMs });
        console.warn(`[InitOrchestrator] task ${isTimeout ? 'timeout' : 'failed'}: phase=${phase} label=${label}`, e);
        this.emit('task:error', { phase, label, ts: errAbs, relativeTs: this.relTs(errAbs), error: String(e), durationMs, isTimeout });
        this.log('error', { phase, label, ts: Math.round(errAbs), relative: Math.round(this.relTs(errAbs)), error: String(e), durationMs: durationMs && Math.round(durationMs), isTimeout });
        // 更新性能指标
        if (durationMs !== undefined) {
          this.updateMetrics(durationMs, false, isTimeout, label);
        }
        // 保存任务详细信息（包含错误）
        this.saveTaskDetail(phase, label, 'error', durationMs, String(e));
      })
      .finally(() => {
        // 释放并发计数
        if (phase === 'high') {
          this.runningHighTasks--;
        }
      });

    // 对high阶段任务进行并发控制
    if (phase === 'high') {
      this.runningHighTasks++;
    }

    return taskPromise;
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

    // high: 受控并发，避免同时执行过多任务
    await this.runHighTasksWithConcurrencyControl();

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

  /**
   * 受控并发执行high阶段任务（支持优先级排序和依赖检查）
   */
  private async runHighTasksWithConcurrencyControl(): Promise<void> {
    // 按优先级排序任务（优先级高的先执行）
    const tasks = [...this.phases.high].sort((a, b) => {
      const priorityA = a.options.priority ?? 5;
      const priorityB = b.options.priority ?? 5;
      return priorityB - priorityA; // 降序排列
    });
    
    const runningTasks: Promise<void>[] = [];
    const pendingTasks = [...tasks]; // 待处理任务队列
    
    while (pendingTasks.length > 0 || runningTasks.length > 0) {
      // 从待处理队列中找出依赖已满足的任务
      const readyTasks: ScheduledTask[] = [];
      const notReadyTasks: ScheduledTask[] = [];
      
      for (const task of pendingTasks) {
        if (task.options.dependsOn && task.options.dependsOn.length > 0) {
          const allDepsReady = task.options.dependsOn.every(dep => this.completedTasks.has(dep));
          if (allDepsReady) {
            readyTasks.push(task);
          } else {
            notReadyTasks.push(task);
          }
        } else {
          readyTasks.push(task);
        }
      }
      
      // 更新待处理队列
      pendingTasks.length = 0;
      pendingTasks.push(...notReadyTasks);
      
      // 启动就绪的任务直到达到并发限制
      while (readyTasks.length > 0 && runningTasks.length < this.maxConcurrentHighTasks) {
        const task = readyTasks.shift()!;
        const taskPromise = this.runTask('high', task);
        runningTasks.push(taskPromise);
        
        // 任务完成后从运行列表中移除
        taskPromise.finally(() => {
          const index = runningTasks.indexOf(taskPromise);
          if (index > -1) {
            runningTasks.splice(index, 1);
          }
        });
      }
      
      // 如果没有正在运行的任务但还有待处理任务，说明存在循环依赖或依赖不存在
      if (runningTasks.length === 0 && pendingTasks.length > 0) {
        this.log('warning: circular dependency or missing dependency detected', {
          pendingTasks: pendingTasks.map(t => ({
            label: t.options.label,
            dependsOn: t.options.dependsOn
          }))
        });
        // 强制执行剩余任务以避免死锁
        for (const task of pendingTasks) {
          const taskPromise = this.runTask('high', task);
          runningTasks.push(taskPromise);
          taskPromise.finally(() => {
            const index = runningTasks.indexOf(taskPromise);
            if (index > -1) {
              runningTasks.splice(index, 1);
            }
          });
        }
        pendingTasks.length = 0;
      }
      
      // 等待至少一个任务完成
      if (runningTasks.length > 0) {
        await Promise.race(runningTasks);
      }
    }
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
    
    // 页面卸载时强制保存性能指标
    window.addEventListener('beforeunload', () => {
      try {
        // 立即保存，不使用防抖
        const pageUrl = window.location.href;
        const metrics = {
          ...initOrchestrator.getMetrics(),
          pageUrl,
          timestamp: Date.now(),
        };
        
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          // 使用同步方式发送（页面卸载时异步可能不会完成）
          chrome.runtime.sendMessage({
            type: 'orchestrator:saveMetrics',
            metrics,
          });
        }
      } catch (e) {
        console.warn('[Orchestrator] Failed to save metrics on unload:', e);
      }
    });
  }
} catch {}


// 监听来自 Dashboard 的性能指标请求
try {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      try {
        if (message && message.type === 'orchestrator:getMetrics') {
          const metrics = initOrchestrator.getMetrics();
          sendResponse({ ok: true, metrics });
          return true; // async response
        }
      } catch (err) {
        sendResponse({ ok: false, error: String(err) });
        return true;
      }
      return undefined;
    });
  }
} catch {}
