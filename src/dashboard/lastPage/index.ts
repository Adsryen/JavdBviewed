/**
 * @file index.ts
 * @description Dashboard 上次关闭页面恢复：跟踪写入 + 启动提示
 * @module dashboard/lastPage
 */

import { maybeShowLastPageResumePrompt } from './resumePrompt';
import { createLastPageTracker, type LastPageTracker } from './tracker';

let tracker: LastPageTracker | null = null;
let initialized = false;

/**
 * 在 initTabs + initDashboardUserMenu 之后调用。
 * 先尝试展示恢复提示；若弹出则暂停写入，直到用户前往/忽略。
 */
export async function initDashboardLastPageResume(): Promise<void> {
  if (initialized) return;
  initialized = true;

  tracker = createLastPageTracker();

  let shown = false;
  try {
    shown = await maybeShowLastPageResumePrompt({
      onResolved: () => {
        tracker?.resume();
      },
    });
  } catch (error) {
    console.warn('[Dashboard] 上次页面恢复提示失败:', error);
  }

  // 若已展示恢复气泡：先 pause 再 start，避免 start 内的初始 schedule 覆盖上次位置
  if (shown) {
    tracker.pause();
  }
  tracker.start();
}

export function stopDashboardLastPageResume(): void {
  tracker?.stop();
  tracker = null;
  initialized = false;
}

export {
  buildLastPageRecord,
  normalizeDashboardHash,
  resolveLastPageTitle,
  shouldShowLastPageResume,
} from './model';
export type { DashboardLastPageRecord } from './types';
