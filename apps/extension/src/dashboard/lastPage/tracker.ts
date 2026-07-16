/**
 * @file tracker.ts
 * @description 导航变化节流写入 + 关闭 flush
 * @module dashboard/lastPage
 */

import { buildLastPageRecord } from './model';
import { setLastPageRecord } from './storage';

const DEFAULT_THROTTLE_MS = 400;

export type LastPageTrackerOptions = {
  throttleMs?: number;
  win?: Window;
  getHash?: () => string;
};

export type LastPageTracker = {
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  flush(): Promise<void>;
};

export function createLastPageTracker(options: LastPageTrackerOptions = {}): LastPageTracker {
  const win = options.win || window;
  const throttleMs = options.throttleMs ?? DEFAULT_THROTTLE_MS;
  const getHash = options.getHash || (() => win.location.hash);

  let timer: number | null = null;
  let started = false;
  let paused = false;
  let writing: Promise<void> | null = null;

  const writeNow = async () => {
    if (paused) return;
    const record = buildLastPageRecord(getHash());
    writing = setLastPageRecord(record).catch(() => undefined);
    await writing;
    writing = null;
  };

  const scheduleWrite = () => {
    if (paused) return;
    if (timer !== null) {
      win.clearTimeout(timer);
    }
    timer = win.setTimeout(() => {
      timer = null;
      void writeNow();
    }, throttleMs);
  };

  const flush = async () => {
    if (paused) return;
    if (timer !== null) {
      win.clearTimeout(timer);
      timer = null;
    }
    if (writing) {
      await writing;
    }
    await writeNow();
  };

  const onHashChange = () => {
    scheduleWrite();
  };

  const onPageHide = () => {
    void flush();
  };

  const onVisibilityChange = () => {
    if (win.document.visibilityState === 'hidden') {
      void flush();
    }
  };

  return {
    start() {
      if (started) return;
      started = true;
      win.addEventListener('hashchange', onHashChange);
      win.addEventListener('pagehide', onPageHide);
      win.document.addEventListener('visibilitychange', onVisibilityChange);
      scheduleWrite();
    },
    stop() {
      if (!started) return;
      started = false;
      paused = false;
      if (timer !== null) {
        win.clearTimeout(timer);
        timer = null;
      }
      win.removeEventListener('hashchange', onHashChange);
      win.removeEventListener('pagehide', onPageHide);
      win.document.removeEventListener('visibilitychange', onVisibilityChange);
    },
    pause() {
      paused = true;
      if (timer !== null) {
        win.clearTimeout(timer);
        timer = null;
      }
    },
    resume() {
      if (!paused) return;
      paused = false;
      scheduleWrite();
    },
    flush,
  };
}
