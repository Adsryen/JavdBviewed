/**
 * @file localListInSourceModal.test.ts
 * @description 源站存入清单 modal 集成拓展本地清单 测试
 * @module tests/dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STATE } from '../../src/features/contentState';
import { LocalListInSourceModalEnhancer } from '../../src/features/videoDetail/localListInSourceModal';
import { sendRuntimeMessage } from '../../src/platform/browser/runtimeMessages';
import { showToast } from '../../src/platform/browser/toast';

vi.mock('../../src/platform/browser/runtimeMessages', () => ({
  sendRuntimeMessage: vi.fn(),
}));

vi.mock('../../src/platform/browser/toast', () => ({
  showToast: vi.fn(),
}));

const sendRuntimeMessageMock = vi.mocked(sendRuntimeMessage);
const showToastMock = vi.mocked(showToast);

async function flushAsync(times = 8): Promise<void> {
  for (let i = 0; i < times; i += 1) {
    await Promise.resolve();
  }
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function enableFeature(options?: { master?: boolean; child?: boolean }): void {
  STATE.settings = {
    ...(STATE.settings || {}),
    videoEnhancement: {
      enabled: options?.master ?? true,
      enableLocalListInSourceModal: options?.child ?? true,
    },
  } as any;
}

function mountPage(): void {
  window.history.pushState({}, '', '/v/NQ6pPb');
  document.body.innerHTML = `
    <h2 class="title is-4"><strong>SSIS-001</strong> Sample Title</h2>
    <button type="button" data-target="modal-save-list">存入清單</button>
    <div id="modal-save-list" class="modal">
      <div class="modal-card">
        <div class="modal-card-body">
          <label><input type="checkbox" name="list_ids[]" value="source-1"> 源站清单</label>
        </div>
        <footer class="modal-card-foot">
          <button type="button">完成</button>
        </footer>
      </div>
    </div>
  `;
}

function openModal(): void {
  document.querySelector('#modal-save-list')?.classList.add('is-active');
}

function mockMessages(options?: {
  lists?: Array<{ id: string; name: string; source: 'local' | 'javdb' }>;
  record?: any | null;
  putSuccess?: boolean;
  patchSuccess?: boolean;
}): void {
  const lists = options?.lists ?? [
    { id: 'local_a', name: '本地 A', source: 'local' as const },
    { id: 'local_b', name: '本地 B', source: 'local' as const },
    { id: 'javdb_x', name: '源站 X', source: 'javdb' as const },
  ];
  const record = options?.record === undefined
    ? {
      id: 'SSIS-001',
      title: 'Sample Title',
      status: 'browsed',
      tags: [],
      createdAt: 1,
      updatedAt: 1,
      listIds: ['local_a'],
    }
    : options.record;

  sendRuntimeMessageMock.mockImplementation(async (message: any) => {
    switch (message.type) {
      case 'DB:LISTS_GET_ALL_NORMALIZED':
        return {
          success: true,
          records: lists.map((item, index) => ({
            ...item,
            type: item.source === 'local' ? 'local' : 'mine',
            createdAt: index + 1,
            updatedAt: index + 1,
          })),
        };
      case 'DB:VIEWED_GET':
        return record
          ? { success: true, record }
          : { success: true };
      case 'DB:VIEWED_PUT':
        return { success: options?.putSuccess !== false };
      case 'DB:VIEWED_PATCH_LIST':
        return { success: options?.patchSuccess !== false };
      default:
        return { success: false, error: `unexpected ${message.type}` };
    }
  });
}

async function initAndOpen(enhancer: LocalListInSourceModalEnhancer): Promise<void> {
  await enhancer.init();
  openModal();
  await flushAsync();
}

describe('localListInSourceModal', () => {
  let enhancer: LocalListInSourceModalEnhancer;

  beforeEach(() => {
    vi.restoreAllMocks();
    sendRuntimeMessageMock.mockReset();
    showToastMock.mockReset();
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    STATE.settings = null as any;
    enhancer = new LocalListInSourceModalEnhancer();
    enableFeature();
    mountPage();
    mockMessages();
  });

  afterEach(() => {
    enhancer.destroy();
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    STATE.settings = null as any;
  });

  it('injects local list section when modal becomes active', async () => {
    await initAndOpen(enhancer);

    const section = document.getElementById('jdb-ext-local-lists');
    expect(section).toBeTruthy();
    expect(section?.textContent).toContain('Jav助手清单');
    expect(section?.querySelectorAll('input[type="checkbox"][data-list-id]')).toHaveLength(2);
  });

  it('does not inject when master switch is off', async () => {
    enableFeature({ master: false, child: true });
    await initAndOpen(enhancer);
    expect(document.getElementById('jdb-ext-local-lists')).toBeNull();
    expect(sendRuntimeMessageMock).not.toHaveBeenCalled();
  });

  it('does not inject when child switch is off', async () => {
    enableFeature({ master: true, child: false });
    await initAndOpen(enhancer);
    expect(document.getElementById('jdb-ext-local-lists')).toBeNull();
    expect(sendRuntimeMessageMock).not.toHaveBeenCalled();
  });

  it('renders only source === local lists', async () => {
    await initAndOpen(enhancer);

    const names = Array.from(
      document.querySelectorAll('#jdb-ext-local-lists .jdb-ext-local-lists__name'),
    ).map((node) => node.textContent);
    expect(names).toEqual(['本地 A', '本地 B']);
    expect(document.body.textContent).not.toContain('源站 X');
  });

  it('prechecks checkboxes from record listIds', async () => {
    await initAndOpen(enhancer);

    const a = document.querySelector<HTMLInputElement>('input[data-list-id="local_a"]');
    const b = document.querySelector<HTMLInputElement>('input[data-list-id="local_b"]');
    expect(a?.checked).toBe(true);
    expect(b?.checked).toBe(false);
  });

  it('patches add and remove independently for multi-select', async () => {
    await initAndOpen(enhancer);

    const b = document.querySelector<HTMLInputElement>('input[data-list-id="local_b"]');
    const a = document.querySelector<HTMLInputElement>('input[data-list-id="local_a"]');
    expect(b).toBeTruthy();
    expect(a).toBeTruthy();

    b!.checked = true;
    b!.dispatchEvent(new Event('change', { bubbles: true }));
    await flushAsync();

    a!.checked = false;
    a!.dispatchEvent(new Event('change', { bubbles: true }));
    await flushAsync();

    const patchCalls = sendRuntimeMessageMock.mock.calls
      .map((call) => call[0])
      .filter((message: any) => message.type === 'DB:VIEWED_PATCH_LIST');

    expect(patchCalls).toEqual(expect.arrayContaining([
      {
        type: 'DB:VIEWED_PATCH_LIST',
        payload: { videoId: 'SSIS-001', listId: 'local_b', action: 'add' },
      },
      {
        type: 'DB:VIEWED_PATCH_LIST',
        payload: { videoId: 'SSIS-001', listId: 'local_a', action: 'remove' },
      },
    ]));
    expect(showToastMock).toHaveBeenCalledWith('已加入「本地 B」', 'success');
    expect(showToastMock).toHaveBeenCalledWith('已移出「本地 A」', 'success');
  });

  it('creates viewed record before patch when missing', async () => {
    mockMessages({ record: null });
    await initAndOpen(enhancer);

    const b = document.querySelector<HTMLInputElement>('input[data-list-id="local_b"]');
    expect(b).toBeTruthy();
    if (!b) {
      return;
    }

    b.checked = true;
    b.dispatchEvent(new Event('change', { bubbles: true }));

    await vi.waitFor(() => {
      const types = sendRuntimeMessageMock.mock.calls.map((call) => (call[0] as any).type);
      expect(types).toContain('DB:VIEWED_PUT');
      expect(types).toContain('DB:VIEWED_PATCH_LIST');
    }, { timeout: 2000 });

    const types = sendRuntimeMessageMock.mock.calls.map((call) => (call[0] as any).type);
    const putIndex = types.indexOf('DB:VIEWED_PUT');
    const patchIndex = types.lastIndexOf('DB:VIEWED_PATCH_LIST');
    expect(putIndex).toBeGreaterThanOrEqual(0);
    expect(patchIndex).toBeGreaterThan(putIndex);

    const putMessage = sendRuntimeMessageMock.mock.calls[putIndex][0] as any;
    expect(putMessage.payload.record.id).toBe('SSIS-001');
    expect(putMessage.payload.record.status).toBe('browsed');
    expect(putMessage.payload.record.listIds).toEqual([]);
    expect(showToastMock).toHaveBeenCalledWith('已加入「本地 B」', 'success');
  });

  it('shows empty state with dashboard lists link', async () => {
    mockMessages({ lists: [] });
    await initAndOpen(enhancer);

    const section = document.getElementById('jdb-ext-local-lists');
    expect(section?.textContent).toContain('还没有本地清单');
    const link = section?.querySelector<HTMLAnchorElement>('.jdb-ext-local-lists__link');
    expect(link).toBeTruthy();
    expect(link?.href).toContain('dashboard/dashboard.html#tab-lists');
    expect(link?.target).toBe('_blank');
  });

  it('does not rewrite source-site checkboxes', async () => {
    await initAndOpen(enhancer);
    const sourceInput = document.querySelector<HTMLInputElement>('input[name="list_ids[]"]');
    expect(sourceInput).toBeTruthy();
    expect(sourceInput?.checked).toBe(false);
    expect(document.querySelectorAll('#jdb-ext-local-lists input[name="list_ids[]"]')).toHaveLength(0);
  });
});
