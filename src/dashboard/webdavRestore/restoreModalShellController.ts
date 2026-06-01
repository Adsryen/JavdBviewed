import { buildRestoreFooterButtonSpecs } from './restoreFooterModel';
import {
  buildRestoreErrorState,
  buildRestoreFileListBackState,
  buildRestoreModalResetState,
} from './restoreModalStateModel';

export interface WebDAVRestoreModalShellControllerOptions {
  setSelectedFile: (file: any | null) => void;
  fetchFileList: () => void;
  startWizardRestore: () => void;
  logInfo: (message: string, payload?: Record<string, unknown>) => void;
}

export class WebDAVRestoreModalShellController {
  constructor(private readonly options: WebDAVRestoreModalShellControllerOptions) {}

  getRestoreModal(): HTMLElement | null {
    const root = document.getElementById('dashboard-modals-root');
    const docVisible = document.querySelector('#webdavRestoreModal.modal-overlay.visible') as HTMLElement | null;
    if (docVisible) return docVisible;

    const inRootVisible = root?.querySelector('#webdavRestoreModal.modal-overlay.visible') as HTMLElement | null;
    if (inRootVisible) return inRootVisible;

    const inRootAny = root?.querySelector('#webdavRestoreModal') as HTMLElement | null;
    if (inRootAny) return inRootAny;

    return document.getElementById('webdavRestoreModal') as HTMLElement | null;
  }

  queryInModal<T extends HTMLElement = HTMLElement>(selector: string): T | null {
    const modal = this.getRestoreModal();
    return (modal ? modal.querySelector(selector) : null) as T | null;
  }

  ensureFooterInModal(): void {
    const modal = this.getRestoreModal();
    if (!modal) return;

    const footer = this.ensureFooterElement(modal);
    if (!footer) return;

    const ids = ['webdavRestoreBack', 'webdavRestoreCancel'];
    ids.forEach((id) => {
      const scopedNodes = Array.from(modal.querySelectorAll(`[id="${id}"]`)) as HTMLElement[];
      const preferred = scopedNodes.find(node => modal.contains(node)) || scopedNodes[0] || null;

      if (preferred && !footer.contains(preferred)) {
        footer.appendChild(preferred);
      }

      const allNodes = Array.from(document.querySelectorAll(`[id="${id}"]`)) as HTMLElement[];
      allNodes.forEach((node) => {
        if (node !== preferred && !footer.contains(node)) {
          try { node.remove(); } catch {}
        }
      });
    });
  }

  createCorrectButtons(): void {
    const modal = this.getRestoreModal();
    if (!modal) return;

    const modalFooter = this.ensureFooterElement(modal);
    if (!modalFooter) return;

    modalFooter.innerHTML = '';
    buildRestoreFooterButtonSpecs().forEach((spec) => {
      const button = document.createElement('button');
      button.id = spec.id;
      button.className = spec.className;
      button.innerHTML = spec.html;
      modalFooter.appendChild(button);
    });
  }

  showWebDAVRestoreModal(): void {
    const modal = this.getRestoreModal();
    if (!modal) return;

    this.createCorrectButtons();
    this.ensureFooterInModal();

    this.options.setSelectedFile(null);
    this.resetModalState();

    modal.classList.remove('hidden');
    modal.classList.add('visible');

    try { document.body.classList.add('modal-open'); } catch {}

    this.bindModalEvents();
    this.options.fetchFileList();
  }

  resetModalState(): void {
    const modal = this.getRestoreModal();
    const state = buildRestoreModalResetState();
    state.modalClassNamesToRemove.forEach(className => modal?.classList.remove(className));

    state.hiddenElementIds.forEach((id) => this.hideElement(id));
    state.shownElementIds.forEach((id) => this.showElement(id));

    state.disabledButtonIds.forEach((id) => {
      const button = this.queryInModal<HTMLButtonElement>('#' + id);
      if (button) button.disabled = true;
    });

    state.hiddenButtonIds.forEach((id) => this.queryInModal<HTMLElement>('#' + id)?.classList.add('hidden'));
    state.clearedElementIds.forEach((id) => {
      const element = this.queryInModal<HTMLElement>('#' + id);
      if (element) element.innerHTML = '';
    });
  }

  bindModalEvents(): void {
    const closeBtn = this.queryInModal('#webdavRestoreModalClose');
    const cancelBtn = this.queryInModal('#webdavRestoreCancel');
    const confirmBtn = this.queryInModal<HTMLButtonElement>('#webdavRestoreConfirm');
    const retryBtn = this.queryInModal('#webdavRestoreRetry');
    const backBtn = this.queryInModal('#webdavRestoreBack');

    if (closeBtn) closeBtn.onclick = () => this.closeModal();
    if (cancelBtn) cancelBtn.onclick = () => this.closeModal();
    if (confirmBtn) confirmBtn.onclick = () => this.options.startWizardRestore();
    if (retryBtn) retryBtn.onclick = () => this.options.fetchFileList();
    if (backBtn) backBtn.onclick = () => this.applyRestoreFileListBackState();

    const modalEl = this.getRestoreModal();
    if (modalEl) {
      modalEl.onclick = (event) => {
        if (event.target === modalEl) this.closeModal();
      };
    }
  }

  showError(message: string): void {
    const state = buildRestoreErrorState();
    state.hiddenElementIds.forEach((id) => this.hideElement(id));
    state.shownElementIds.forEach((id) => this.showElement(id));

    const errorMessage = this.queryInModal<HTMLElement>('#' + state.errorMessageElementId);
    if (errorMessage) errorMessage.textContent = message;
  }

  applyRestoreFileListBackState(): void {
    const state = buildRestoreFileListBackState();
    const modal = this.getRestoreModal();

    state.hiddenElementIds.forEach((id) => this.hideElement(id));

    const restoreDescription = modal?.querySelector(state.shownContentSelector);
    const fileListContainer = modal?.querySelector(state.shownListSelector);
    if (restoreDescription) restoreDescription.classList.remove('hidden');
    if (fileListContainer) fileListContainer.classList.remove('hidden');

    state.disabledButtonIds.forEach((id) => {
      const button = this.queryInModal<HTMLButtonElement>('#' + id);
      if (button) button.disabled = true;
    });
    state.hiddenButtonIds.forEach((id) => this.queryInModal<HTMLElement>('#' + id)?.classList.add('hidden'));
  }

  closeModal(): void {
    const modal = document.getElementById('webdavRestoreModal');
    if (modal) {
      modal.classList.remove('visible');
      modal.classList.add('hidden');
    }

    try { document.body.classList.remove('modal-open'); } catch {}

    this.options.setSelectedFile(null);
    this.options.logInfo('用户关闭了WebDAV恢复弹窗');
  }

  showElement(id: string): void {
    const ctx = this.getRestoreModal() || document;
    const element = ctx.querySelector('#' + id) as HTMLElement | null;
    if (element) element.classList.remove('hidden');
  }

  hideElement(id: string): void {
    const ctx = this.getRestoreModal() || document;
    const element = ctx.querySelector('#' + id) as HTMLElement | null;
    if (element) element.classList.add('hidden');
  }

  updateElement(id: string, text: string): void {
    const ctx = this.getRestoreModal() || document;
    const element = ctx.querySelector('#' + id) as HTMLElement | null;
    if (element) element.textContent = text;
  }

  private ensureFooterElement(modal: HTMLElement): HTMLElement | null {
    let footer = modal.querySelector('.modal-footer') as HTMLElement | null;
    if (footer) return footer;

    const content = modal.querySelector('.modal-content') as HTMLElement | null;
    if (!content) return null;

    footer = document.createElement('div');
    footer.className = 'modal-footer';
    content.appendChild(footer);
    return footer;
  }
}
