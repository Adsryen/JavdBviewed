/**
 * @file videoDetailWantSync.test.ts
 * @description 影片详情页想看状态同步回归测试
 * @module tests/dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initOrchestrator } from '../../apps/extension/src/apps/content/orchestrator';
import { STATE, setCurrentFaviconState, setCurrentTitleStatus, setSuspendEarlyFaviconSync } from '../../apps/extension/src/features/contentState';
import { handleVideoDetailPage } from '../../apps/extension/src/features/videoDetail/pageHandler';
import { concurrencyManager, storageManager } from '../../apps/extension/src/features/records/content';
import type { VideoRecord } from '../../apps/extension/src/types';
import { DEFAULT_SETTINGS, VIDEO_STATUS } from '../../apps/extension/src/utils/config';

vi.mock('../../apps/extension/src/apps/content/orchestrator', () => ({
  initOrchestrator: {
    add: vi.fn(),
  },
}));

vi.mock('../../apps/extension/src/features/records/content', () => ({
  concurrencyManager: {
    startProcessingVideo: vi.fn(),
    finishProcessingVideo: vi.fn(),
  },
  storageManager: {
    addRecord: vi.fn(),
    updateRecord: vi.fn(),
    updateRecordDirect: vi.fn(),
    putRecord: vi.fn(),
  },
}));

vi.mock('../../apps/extension/src/platform/tasks', () => ({
  createTaskTimeoutGuard: vi.fn((timeoutMs: number) => ({
    timeoutMs,
    isTimedOut: () => false,
    throwIfTimedOut: () => undefined,
  })),
  createManagedTaskDescriptor: vi.fn((descriptor: Record<string, unknown>) => ({
    ...descriptor,
    taskId: String(descriptor.label || 'task'),
  })),
  runChunkedWork: vi.fn(),
  runManagedTask: vi.fn(async (_descriptor: unknown, task: () => Promise<void>) => {
    await task();
  }),
  saveSubtaskDetail: vi.fn(async () => undefined),
  yieldToMainThread: vi.fn(async () => undefined),
}));

vi.mock('../../apps/extension/src/platform/browser/toast', () => ({
  showToast: vi.fn(),
}));

vi.mock('../../apps/extension/src/platform/browser/enhancementLoadingIndicator', () => ({
  showEnhancementLoading: vi.fn(),
}));

vi.mock('../../apps/extension/src/features/externalSearch', () => ({
  renderDetailSearchLinks: vi.fn(),
}));

vi.mock('../../apps/extension/src/features/embyLibrary/content/statusBadges', () => ({
  renderDetailLibraryStatus: vi.fn(),
}));

vi.mock('../../apps/extension/src/features/videoDetail/enhancer', () => ({
  videoDetailEnhancer: {
    initCore: vi.fn(),
    loadEnhancedData: vi.fn(),
    insertTranslationPlaceholder: vi.fn(),
    runCover: vi.fn(),
    runTitle: vi.fn(),
    runFC2Breaker: vi.fn(),
    finish: vi.fn(),
    runReviewBreaker: vi.fn(),
    runRelatedLists: vi.fn(),
  },
  VideoDetailEnhancer: vi.fn(),
}));

vi.mock('../../apps/extension/src/features/videoDetail/favoriteRating', () => ({
  videoFavoriteRatingEnhancer: {
    init: vi.fn(),
  },
}));

vi.mock('../../apps/extension/src/features/actors', () => ({
  actorManager: {
    initialize: vi.fn(),
    getActorById: vi.fn(),
  },
}));

vi.mock('../../apps/extension/src/features/newWorks', () => ({
  newWorksManager: {
    getSubscriptions: vi.fn(async () => []),
  },
}));

vi.mock('../../apps/extension/src/features/actorRemarks', () => ({
  actorExtraInfoService: {
    getActorRemarks: vi.fn(),
  },
}));

function installDetailPageDom(): void {
  window.history.pushState({}, '', '/v/ssis-795');
  document.title = 'SSIS-795 测试影片 | JavDB';
  document.head.innerHTML = '<link rel="icon" href="/favicon.ico">';
  document.body.innerHTML = `
    <header>
      <a class="navbar-item" href="https://javdb.com">JavDB</a>
    </header>
    <main>
      <h2 class="title is-4"><strong>SSIS-795</strong></h2>
      <nav class="panel movie-panel-info">
        <div class="panel-block first-block"><span class="title is-4">SSIS-795</span></div>
        <div class="review-buttons">
          <form class="button_to" method="post" action="/reviews/want_to_watch" data-remote="true">
            <button type="submit" class="button is-small">想看</button>
          </form>
        </div>
      </nav>
    </main>
  `;
}

function dispatchRemoteFormClick(button: HTMLButtonElement): void {
  button.addEventListener('click', event => event.preventDefault(), { once: true });
  button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

function applyStorageMocks(): void {
  vi.mocked(storageManager.addRecord).mockImplementation(async (videoId: string, record: VideoRecord) => {
    STATE.records = { ...STATE.records, [videoId]: record };
    return { success: true, alreadyExists: false };
  });

  vi.mocked(storageManager.updateRecord).mockImplementation(async (
    videoId: string,
    updateFn: (currentRecords: Record<string, VideoRecord>) => VideoRecord,
  ) => {
    const updated = updateFn(STATE.records);
    STATE.records = { ...STATE.records, [videoId]: updated };
    return { success: true };
  });

  vi.mocked(storageManager.updateRecordDirect).mockImplementation(async (
    videoId: string,
    updateFn: (currentRecord: VideoRecord | undefined) => VideoRecord,
  ) => {
    const updated = updateFn(STATE.records[videoId]);
    STATE.records = { ...STATE.records, [videoId]: updated };
    return { success: true, record: updated };
  });

  vi.mocked(storageManager.putRecord).mockImplementation(async (record: VideoRecord) => {
    STATE.records = { ...STATE.records, [record.id]: record };
    return { success: true };
  });
}

describe('video detail want sync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    setCurrentFaviconState(null);
    setCurrentTitleStatus(null);
    setSuspendEarlyFaviconSync(false);
    STATE.records = {};
    const settings = structuredClone(DEFAULT_SETTINGS);
    settings.videoEnhancement.enableWantSync = true;
    settings.videoEnhancement.showLoadingIndicator = false;
    settings.videoEnhancement.enableActorNameMarks = false;
    STATE.settings = settings;
    STATE.originalFaviconUrl = '/favicon.ico';

    let operationIndex = 0;
    vi.mocked(concurrencyManager.startProcessingVideo).mockImplementation(async (videoId: string) => {
      operationIndex += 1;
      return `op-${videoId}-${operationIndex}`;
    });

    vi.mocked(initOrchestrator.add).mockImplementation(async (_phase, task, options) => {
      if (options?.label === 'videoStatus:initialSync') {
        await task();
      }
    });

    applyStorageMocks();
    installDetailPageDom();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    STATE.settings = null;
    STATE.records = {};
    STATE.originalFaviconUrl = '';
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  it('点击原站想看并确认页面状态后，会创建本地想看记录并刷新 favicon', async () => {
    await handleVideoDetailPage();

    const wantButton = document.querySelector<HTMLButtonElement>('form[action*="/reviews/want_to_watch"] button');
    expect(wantButton).not.toBeNull();

    if (wantButton) {
      dispatchRemoteFormClick(wantButton);
    }
    const reviewButtons = document.querySelector<HTMLElement>('.review-buttons');
    if (reviewButtons) {
      reviewButtons.innerHTML = `
        <div class="review-title">
          <a href="/users/want_watch_videos"><span class="tag">我想看這部影片</span></a>
        </div>
      `;
    }

    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(4000);

    const record = STATE.records['SSIS-795'];
    const favicon = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');

    expect(record?.status).toBe(VIDEO_STATUS.WANT);
    expect(record?.id).toBe('SSIS-795');
    expect(favicon?.href).toContain('assets/switch-want.png');
  });

  it('原站想看状态未确认时，不会提前写入本地番号库', async () => {
    await handleVideoDetailPage();

    const wantButton = document.querySelector<HTMLButtonElement>('form[action*="/reviews/want_to_watch"] button');
    expect(wantButton).not.toBeNull();

    if (wantButton) {
      dispatchRemoteFormClick(wantButton);
    }
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(4000);

    const favicon = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');

    expect(STATE.records['SSIS-795']).toBeUndefined();
    expect(favicon?.href).not.toContain('assets/switch-want.png');
  });
});
