import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebDAVRestoreOptionsController } from '../../src/dashboard/webdavRestore/restoreOptionsController';

function mountRestoreOptionsDom(): void {
  document.body.innerHTML = `
    <div id="webdavRestoreModal">
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
        <small>磁链缓存说明</small>
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
    expect(magnets.closest('.form-group-checkbox')?.classList.contains('unavailable')).toBe(true);
    expect(magnets.closest('.form-group-checkbox')?.innerHTML).toContain('磁链缓存在此备份中不可用');
    expect(logInfo).toHaveBeenCalledWith('恢复内容选项自动配置完成', {
      availableOptions: 4,
      unavailableOptions: 5,
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
});
