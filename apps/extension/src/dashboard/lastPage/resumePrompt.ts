/**
 * @file resumePrompt.ts
 * @description 头像旁「恢复上次页面」气泡
 * @module dashboard/lastPage
 */

import { shouldShowLastPageResume } from './model';
import { clearLastPageRecord, getLastPageRecord } from './storage';
import type { DashboardLastPageRecord } from './types';

export type ResumePromptDeps = {
  doc?: Document;
  win?: Window;
  getCurrentHash?: () => string;
  navigateToHash?: (hash: string) => void;
  getRecord?: () => Promise<DashboardLastPageRecord | null>;
  clearRecord?: () => Promise<void>;
  rootSelector?: string;
  /** 用户前往或忽略后回调（用于恢复 tracker 写入） */
  onResolved?: () => void;
  /** 自动隐藏毫秒；0 表示不自动隐藏。默认 5000 */
  autoHideMs?: number;
};

const PROMPT_ID = 'dashboard-last-page-resume';
/** 恢复气泡默认自动隐藏时间 */
export const LAST_PAGE_RESUME_AUTO_HIDE_MS = 5000;

let activeAutoHideTimer: ReturnType<typeof setTimeout> | null = null;

function clearActiveAutoHideTimer(): void {
  if (activeAutoHideTimer == null) return;
  clearTimeout(activeAutoHideTimer);
  activeAutoHideTimer = null;
}

function defaultNavigate(hash: string, win: Window): void {
  const next = hash.startsWith('#') ? hash : `#${hash}`;
  if (win.location.hash === next) {
    // 强制触发同 hash 也走导航时，仍先清掉提示
    return;
  }
  win.location.hash = next;
}

export function unmountLastPageResumePrompt(doc: Document = document): void {
  clearActiveAutoHideTimer();
  doc.getElementById(PROMPT_ID)?.remove();
}

export function mountLastPageResumePrompt(
  record: DashboardLastPageRecord,
  deps: ResumePromptDeps = {},
): HTMLElement | null {
  const doc = deps.doc || document;
  const win = deps.win || window;
  const root = doc.querySelector<HTMLElement>(deps.rootSelector || '#dashboard-user-menu-root');
  if (!root) return null;

  unmountLastPageResumePrompt(doc);

  const el = doc.createElement('div');
  el.id = PROMPT_ID;
  el.className = 'dashboard-last-page-resume';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', '恢复上次页面');
  el.innerHTML = `
    <div class="dashboard-last-page-resume__card">
      <div class="dashboard-last-page-resume__head">
        <div class="dashboard-last-page-resume__kicker">恢复上次页面</div>
        <button type="button" class="dashboard-last-page-resume__close" data-action="dismiss" aria-label="关闭">
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
      </div>
      <p class="dashboard-last-page-resume__desc">这是你上次关闭扩展前停留的页面。</p>
      <div class="dashboard-last-page-resume__page" title="${escapeAttr(record.title)}">
        <i class="fas fa-location-arrow" aria-hidden="true"></i>
        <span>${escapeHtml(record.title)}</span>
      </div>
      <div class="dashboard-last-page-resume__actions">
        <button type="button" class="dashboard-last-page-resume__btn dashboard-last-page-resume__btn--primary" data-action="go">
          前往该页面
        </button>
        <button type="button" class="dashboard-last-page-resume__btn dashboard-last-page-resume__btn--ghost" data-action="dismiss">
          忽略
        </button>
      </div>
    </div>
  `;

  const clearRecord = deps.clearRecord || clearLastPageRecord;
  const navigateToHash = deps.navigateToHash || ((hash: string) => defaultNavigate(hash, win));
  const onResolved = deps.onResolved;
  let settled = false;

  const settleUi = () => {
    if (settled) return;
    settled = true;
    clearActiveAutoHideTimer();
    el.remove();
    doc.removeEventListener('keydown', onKeydown);
  };

  const dismiss = async () => {
    if (settled) return;
    settleUi();
    try {
      await clearRecord();
    } catch {
      // ignore
    }
    onResolved?.();
  };

  const go = async () => {
    if (settled) return;
    const target = record.hash;
    settleUi();
    try {
      await clearRecord();
    } catch {
      // ignore
    }
    onResolved?.();
    navigateToHash(target);
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      void dismiss();
    }
  };

  el.addEventListener('click', (event) => {
    const action = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-action]')?.dataset.action;
    if (action === 'go') {
      event.preventDefault();
      void go();
      return;
    }
    if (action === 'dismiss') {
      event.preventDefault();
      void dismiss();
    }
  });

  doc.addEventListener('keydown', onKeydown);
  root.appendChild(el);

  const autoHideMs =
    typeof deps.autoHideMs === 'number' ? deps.autoHideMs : LAST_PAGE_RESUME_AUTO_HIDE_MS;
  if (autoHideMs > 0) {
    activeAutoHideTimer = setTimeout(() => {
      activeAutoHideTimer = null;
      void dismiss();
    }, autoHideMs);
  }

  return el;
}

export async function maybeShowLastPageResumePrompt(deps: ResumePromptDeps = {}): Promise<boolean> {
  const win = deps.win || window;
  const getCurrentHash = deps.getCurrentHash || (() => win.location.hash);
  const getRecord = deps.getRecord || getLastPageRecord;

  const record = await getRecord();
  if (!shouldShowLastPageResume(record, getCurrentHash())) {
    return false;
  }
  if (!record) return false;

  const mounted = mountLastPageResumePrompt(record, deps);
  return Boolean(mounted);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}
