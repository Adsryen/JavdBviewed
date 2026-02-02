// src/dashboard/qa/selfCheck.ts

export function runQASelfCheck(): void {
  try {
    const requiredLinks = [
      './dashboard.css',
    ];
    const missingHeadCss = requiredLinks.filter(href => !document.querySelector(`link[href$="${href}"]`));

    const modalsRoot = document.getElementById('dashboard-modals-root');
    const modalIds = [
      'confirmationModal', 'smartRestoreModal', 'import-modal', 'migration-modal',
      'data-check-modal', 'helpPanel', 'webdavRestoreModal', 'conflictResolutionModal',
      'restoreResultModal', 'dataViewModal', 'filterRuleModal', 'orchestratorModal',
    ];
    const missingModals: string[] = [];
    const duplicateModals: string[] = [];
    for (const id of modalIds) {
      const nodes = document.querySelectorAll(`[id="${id}"]`);
      if (nodes.length === 0) missingModals.push(id);
      if (nodes.length > 1) duplicateModals.push(id);
    }

    if (!modalsRoot) {
      console.warn('[QA] 未找到 #dashboard-modals-root');
    }
    if (missingHeadCss.length) {
      console.warn('[QA] 缺少基础样式（<head> 未加载）：', missingHeadCss);
    }
    if (missingModals.length) {
      console.warn('[QA] 缺少以下模态框 ID：', missingModals);
    }
    if (duplicateModals.length) {
      console.warn('[QA] 发现重复的模态框 ID：', duplicateModals);
    }
    if (modalsRoot && missingHeadCss.length === 0 && missingModals.length === 0 && duplicateModals.length === 0) {
      console.info('[QA] 基础自检通过：样式与模态框挂载正常');
    }
  } catch (e) {
    console.warn('[QA] 自检异常：', e);
  }
}
