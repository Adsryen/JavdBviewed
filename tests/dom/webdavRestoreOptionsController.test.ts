/**
 * @file webdavRestoreOptionsController.test.ts
 * @description WebDAV restore options controller 测试
 * @module tests/dom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { WebDAVRestoreOptionsController } from '../../apps/extension/src/dashboard/webdavRestore/restoreOptionsController';

function mountRestoreOptionsDom(): void {
  document.body.innerHTML = `
    <div id="webdavRestoreModal">
      <div class="restore-options-section">
        <h5>
          <button type="button" id="webdavRestoreCategoryToggle" class="restore-category-toggle" title="全选/反选恢复类别" aria-label="全选/反选恢复类别">
            <i class="fas fa-check-square"></i>
          </button>
          恢复内容选择
        </h5>
        <div class="restore-options-grid">
      <div class="form-group-checkbox available">
        <input type="checkbox" id="webdavRestoreSettings">
        <small>扩展设置说明</small>
      </div>
      <div class="form-group-checkbox warning">
        <input type="checkbox" id="webdavRestoreRecords">
        <small>观看记录说明</small>
      </div>
      <div class="form-group-checkbox available">
        <input type="checkbox" id="webdavRestoreActorRecords">
        <small>演员库说明</small>
      </div>
      <div class="form-group-checkbox available">
        <input type="checkbox" id="webdavRestoreMagnets">
        <div class="restore-strategy-control">
          <select id="webdavRestoreMagnetsMode"><option value="merge">合并</option></select>
        </div>
        <small>磁链缓存说明</small>
      </div>
        </div>
      </div>
    </div>
  `;
}

describe('WebDAV restore options controller', () => {
  beforeEach(() => {
    mountRestoreOptionsDom();
    vi.restoreAllMocks();
  });

  it('renders available, warning, and unavailable option states from cloud data', () => {
    const logInfo = vi.fn();
    const controller = new WebDAVRestoreOptionsController({ logInfo });

    controller.configureRestoreOptions({
      settings: { display: {}, webdav: {} },
      data: {},
      actorRecords: { actorA: { id: 'actorA' } },
    });

    const settings = document.getElementById('webdavRestoreSettings') as HTMLInputElement;
    const records = document.getElementById('webdavRestoreRecords') as HTMLInputElement;
    const actors = document.getElementById('webdavRestoreActorRecords') as HTMLInputElement;
    const magnets = document.getElementById('webdavRestoreMagnets') as HTMLInputElement;
    const magnetsMode = document.getElementById('webdavRestoreMagnetsMode') as HTMLSelectElement;

    expect(settings.disabled).toBe(false);
    expect(settings.checked).toBe(true);
    expect(settings.closest('.form-group-checkbox')?.classList.contains('available')).toBe(true);
    expect(settings.closest('.form-group-checkbox')?.textContent).toContain('包含 2 项设置');

    expect(records.disabled).toBe(false);
    expect(records.checked).toBe(true);
    expect(records.closest('.form-group-checkbox')?.classList.contains('warning')).toBe(true);
    expect(records.closest('.form-group-checkbox')?.innerHTML).toContain('观看记录数据在备份中缺失');

    expect(actors.disabled).toBe(false);
    expect(actors.checked).toBe(true);
    expect(actors.closest('.form-group-checkbox')?.textContent).toContain('包含 1 个演员信息');

    expect(magnets.disabled).toBe(true);
    expect(magnets.checked).toBe(false);
    expect(magnetsMode.disabled).toBe(true);
    expect(magnets.closest('.form-group-checkbox')?.classList.contains('unavailable')).toBe(true);
    expect(magnets.closest('.form-group-checkbox')?.innerHTML).toContain('磁链缓存在此备份中不可用');
    expect(logInfo).toHaveBeenCalledWith('恢复内容选项自动配置完成', {
      availableOptions: 4,
      unavailableOptions: 6,
      cloudDataKeys: ['settings', 'data', 'actorRecords'],
    });
  });

  it('ignores missing option DOM nodes while still logging summary', () => {
    document.getElementById('webdavRestoreActorRecords')?.closest('.form-group-checkbox')?.remove();
    const logInfo = vi.fn();
    const controller = new WebDAVRestoreOptionsController({ logInfo });

    controller.configureRestoreOptions({
      settings: { display: {} },
      actorRecords: { actorA: { id: 'actorA' } },
    });

    expect(logInfo).toHaveBeenCalledWith('恢复内容选项自动配置完成', expect.objectContaining({
      cloudDataKeys: ['settings', 'actorRecords'],
    }));
    expect(document.getElementById('webdavRestoreSettings')).toBeTruthy();
  });

  it('keeps restore strategy controls in a responsive option layout', () => {
    const html = readFileSync(resolve(process.cwd(), 'apps/extension/src/dashboard/partials/modals/dashboard-modals.html'), 'utf8');
    document.body.innerHTML = html;

    const strategyControls = Array.from(document.querySelectorAll<HTMLElement>('#webdavRestoreModal .restore-strategy-control'));

    expect(strategyControls.length).toBeGreaterThan(0);
    strategyControls.forEach((control) => {
      const option = control.closest('.form-group-checkbox');
      const layout = control.closest('.restore-option-layout');
      const main = option?.querySelector('.restore-option-main');

      expect(layout).toBeTruthy();
      expect(layout?.parentElement).toBe(option);
      expect(main).toBeTruthy();
      expect(main?.parentElement).toBe(layout);
      expect(control.parentElement).toBe(layout);
    });
  });

  it('toggles enabled restore categories and keeps strategy controls in sync', () => {
    const logInfo = vi.fn();
    const controller = new WebDAVRestoreOptionsController({ logInfo });

    controller.configureRestoreOptions({
      settings: { display: {}, webdav: {} },
      data: { 'ABC-001': { id: 'ABC-001' } },
      actorRecords: { actorA: { id: 'actorA' } },
    });

    const toggle = document.getElementById('webdavRestoreCategoryToggle') as HTMLButtonElement;
    const settings = document.getElementById('webdavRestoreSettings') as HTMLInputElement;
    const records = document.getElementById('webdavRestoreRecords') as HTMLInputElement;
    const actors = document.getElementById('webdavRestoreActorRecords') as HTMLInputElement;
    const magnets = document.getElementById('webdavRestoreMagnets') as HTMLInputElement;
    const magnetsMode = document.getElementById('webdavRestoreMagnetsMode') as HTMLSelectElement;

    toggle.click();

    expect(settings.checked).toBe(false);
    expect(records.checked).toBe(false);
    expect(actors.checked).toBe(false);
    expect(magnets.checked).toBe(false);
    expect(magnets.disabled).toBe(true);
    expect(magnetsMode.disabled).toBe(true);

    toggle.click();

    expect(settings.checked).toBe(true);
    expect(records.checked).toBe(true);
    expect(actors.checked).toBe(true);
    expect(magnets.checked).toBe(false);
    expect(magnets.disabled).toBe(true);
    expect(magnetsMode.disabled).toBe(true);
  });
});
