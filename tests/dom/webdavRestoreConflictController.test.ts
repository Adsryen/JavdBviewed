import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebDAVRestoreConflictController } from '../../src/dashboard/webdavRestore/conflictController';

function mountConflictModal(): void {
  document.body.innerHTML = `
    <div id="conflictResolutionModal" class="hidden">
      <span id="totalConflictsCount"></span>
      <span id="currentConflictIndex"></span>
      <span id="conflictItemTitle"></span>
      <span id="conflictItemType"></span>
      <span id="localVersionTime"></span>
      <span id="cloudVersionTime"></span>
      <div id="localVersionContent"></div>
      <div id="cloudVersionContent"></div>
      <input type="radio" name="currentResolution" value="local">
      <input type="radio" name="currentResolution" value="cloud">
      <input type="radio" name="currentResolution" value="merge">
      <button id="prevConflict"></button>
      <button id="nextConflict"></button>
      <button id="conflictResolutionConfirm"></button>
      <button id="conflictResolutionCancel"></button>
      <button id="conflictResolutionModalClose"></button>
      <button id="batchSelectLocal"></button>
      <button id="batchSelectCloud"></button>
      <button id="batchSelectMerge"></button>
      <div id="conflictProgressFill"></div>
    </div>
  `;
}

describe('WebDAV restore conflict controller', () => {
  beforeEach(() => {
    mountConflictModal();
  });

  it('renders conflicts, navigates, batches resolutions, and exposes selected resolutions', () => {
    const showMessage = vi.fn();
    const controller = new WebDAVRestoreConflictController({ showMessage });

    controller.show('video', [
      {
        id: 'AAA-001',
        local: {
          title: 'Local AAA',
          status: 'viewed',
          tags: ['本地'],
          updatedAt: Date.UTC(2026, 4, 30, 1, 0, 0),
        },
        cloud: {
          title: 'Cloud AAA',
          status: 'want',
          tags: ['云端'],
          updatedAt: Date.UTC(2026, 4, 31, 1, 0, 0),
        },
        recommendation: 'cloud',
      },
      {
        id: 'BBB-002',
        local: {
          title: 'Local BBB',
          status: 'browsed',
          updatedAt: Date.UTC(2026, 4, 29, 1, 0, 0),
        },
        cloud: {
          title: 'Cloud BBB',
          status: 'viewed',
          updatedAt: Date.UTC(2026, 4, 31, 2, 0, 0),
        },
        recommendation: 'merge',
      },
    ]);

    expect(document.getElementById('conflictResolutionModal')?.classList.contains('visible')).toBe(true);
    expect(document.getElementById('totalConflictsCount')?.textContent).toBe('2');
    expect(document.getElementById('currentConflictIndex')?.textContent).toBe('1');
    expect(document.getElementById('conflictItemTitle')?.textContent).toBe('AAA-001');
    expect(document.querySelector<HTMLInputElement>('input[name="currentResolution"][value="cloud"]')?.checked).toBe(true);
    expect(document.getElementById('localVersionContent')?.innerHTML).toContain('Local AAA');
    expect(document.getElementById('conflictProgressFill')?.style.width).toBe('50%');

    document.querySelector<HTMLInputElement>('input[name="currentResolution"][value="local"]')!.checked = true;
    document.getElementById('nextConflict')?.click();

    expect(document.getElementById('currentConflictIndex')?.textContent).toBe('2');
    expect(document.getElementById('conflictItemTitle')?.textContent).toBe('BBB-002');
    expect(controller.getResolutions()).toEqual({ 'AAA-001': 'local' });

    document.getElementById('batchSelectMerge')?.click();

    expect(controller.getResolutions()).toEqual({
      'AAA-001': 'merge',
      'BBB-002': 'merge',
    });
    expect(showMessage).toHaveBeenCalledWith('已为所有 2 个冲突设置为"智能合并"', 'success');
  });

  it('clears resolutions when conflict modal is canceled', () => {
    const controller = new WebDAVRestoreConflictController({ showMessage: vi.fn() });

    controller.show('actor', [{ id: 'actor-1', local: { name: 'Local' }, cloud: { name: 'Cloud' } }]);
    document.querySelector<HTMLInputElement>('input[name="currentResolution"][value="cloud"]')!.checked = true;
    document.getElementById('conflictResolutionConfirm')?.click();

    expect(document.getElementById('conflictResolutionModal')?.classList.contains('hidden')).toBe(true);

    controller.show('actor', [{ id: 'actor-1', local: { name: 'Local' }, cloud: { name: 'Cloud' } }]);
    document.querySelector<HTMLInputElement>('input[name="currentResolution"][value="local"]')!.checked = true;
    document.getElementById('conflictResolutionCancel')?.click();

    expect(controller.getResolutions()).toEqual({});
  });
});
