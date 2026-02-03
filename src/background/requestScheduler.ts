// src/background/requestScheduler.ts
// 全局请求调度器：统一并发、按域并发与速率限制、in-flight 去重

export interface SchedulerConfig {
  globalMaxConcurrent: number;
  perHostMaxConcurrent: number;
  perHostRateLimitPerMin: number; // 请求/分钟
}

interface Task {
  url: string;
  options: RequestInit;
  host: string;
  resolve: (r: Response) => void;
  reject: (e: any) => void;
}

class RequestScheduler {
  private config: SchedulerConfig = {
    globalMaxConcurrent: 4,
    perHostMaxConcurrent: 1,
    perHostRateLimitPerMin: 12,
  };

  private globalActive = 0;
  private hostActive = new Map<string, number>();
  private queue: Task[] = [];
  private inFlight = new Map<string, Promise<Response>>();
  private hostTimestamps = new Map<string, number[]>(); // 每个 host 的完成时间戳（毫秒）
  private hostCooldownUntil = new Map<string, number>(); // host -> 可用的绝对时间戳
  private hostBackoffMs = new Map<string, number>(); // host -> 当前退避时长

  updateConfig(cfg: Partial<SchedulerConfig>) {
    this.config = { ...this.config, ...cfg };
  }

  /** 生成去重 key（method+url+bodyHash） */
  private buildKey(url: string, options: RequestInit): string {
    const method = (options.method || 'GET').toUpperCase();
    const body = typeof options.body === 'string' ? options.body : '';
    return `${method}:${url}:${body}`;
  }

  private getHost(url: string): string {
    try { return new URL(url).host; } catch { return 'unknown-host'; }
  }

  /** 计算 host 的下一次可用时间（基于速率限制） */
  private getHostNextAvailableTime(host: string): number {
    const limit = Math.max(1, this.config.perHostRateLimitPerMin);
    const windowMs = 60_000;
    const now = Date.now();
    const arr = (this.hostTimestamps.get(host) || []).filter(ts => now - ts < windowMs);
    this.hostTimestamps.set(host, arr);
    if (arr.length < limit) return now;
    const oldest = arr[0];
    return oldest + windowMs; // 当窗口最旧的时间过期后即可再发
  }

  private markHostRequestCompleted(host: string) {
    const arr = this.hostTimestamps.get(host) || [];
    arr.push(Date.now());
    // 仅保留窗口内的记录
    const now = Date.now();
    const windowMs = 60_000;
    this.hostTimestamps.set(host, arr.filter(ts => now - ts < windowMs));
  }

  private canStart(host: string): boolean {
    const gOk = this.globalActive < this.config.globalMaxConcurrent;
    const hActive = this.hostActive.get(host) || 0;
    const hOk = hActive < this.config.perHostMaxConcurrent;
    const tOk = this.getHostNextAvailableTime(host) <= Date.now();
    const cdUntil = this.hostCooldownUntil.get(host) || 0;
    const cdOk = Date.now() >= cdUntil;
    return gOk && hOk && tOk && cdOk;
  }

  private tryStartNext(): void {
    if (this.queue.length === 0) return;

    // 简单遍历队列，找第一个可启动的任务
    for (let i = 0; i < this.queue.length; i++) {
      const task = this.queue[i];
      if (this.canStart(task.host)) {
        this.queue.splice(i, 1);
        this.startTask(task);
        // 可能还能继续启动下一个
        i = -1; // 重新从头找，直到不满足
      }
    }

    // 对于因速率限制而暂不可启动的 host，安排一个最早可用时刻的定时器以唤醒
    const nextWake = this.computeNextWakeTime();
    if (nextWake > Date.now()) {
      const delay = Math.min(5_000, Math.max(0, nextWake - Date.now()));
      setTimeout(() => this.tryStartNext(), delay);
    }
  }

  private computeNextWakeTime(): number {
    let next = Infinity;
    for (const t of this.queue) {
      const ts = this.getHostNextAvailableTime(t.host);
      if (ts < next) next = ts;
    }
    return next === Infinity ? Date.now() : next;
  }

  private async startTask(task: Task) {
    const { host, url, options, resolve, reject } = task;
    this.globalActive++;
    this.hostActive.set(host, (this.hostActive.get(host) || 0) + 1);

    try {
      const res = await fetch(url, options);
      // 429/503：应用指数退避冷却
      if (res.status === 429 || res.status === 503) {
        this.applyBackoff(host);
      } else {
        this.resetBackoff(host);
      }
      resolve(res);
      this.markHostRequestCompleted(host);
    } catch (e) {
      // 网络错误也可以适度退避（一次）
      this.applyBackoff(host, true);
      reject(e);
    } finally {
      this.globalActive--;
      this.hostActive.set(host, Math.max(0, (this.hostActive.get(host) || 1) - 1));
      this.tryStartNext();
    }
  }

  async enqueue(url: string, options: RequestInit = {}): Promise<Response> {
    // in-flight 去重
    const key = this.buildKey(url, options);
    if (this.inFlight.has(key)) {
      return this.inFlight.get(key)!;
    }

    const host = this.getHost(url);
    const promise = new Promise<Response>((resolve, reject) => {
      const task: Task = { url, options, host, resolve, reject };
      this.queue.push(task);
      this.tryStartNext();
    });

    // 任务完成后移除去重项
    const wrapped = promise.finally(() => this.inFlight.delete(key)) as Promise<Response>;
    this.inFlight.set(key, wrapped);
    return wrapped;
  }

  private applyBackoff(host: string, light = false) {
    const base = light ? 10_000 : 30_000; // 10s(轻) 或 30s(重)
    const current = this.hostBackoffMs.get(host) || base;
    const next = Math.min(current * 2, 300_000); // 上限 5 分钟
    const until = Date.now() + current;
    this.hostCooldownUntil.set(host, Math.max(this.hostCooldownUntil.get(host) || 0, until));
    this.hostBackoffMs.set(host, next);
  }

  private resetBackoff(host: string) {
    this.hostBackoffMs.delete(host);
    // 若当前已处于冷却，不立刻清除，以避免高频震荡
  }
}

export const requestScheduler = new RequestScheduler();
