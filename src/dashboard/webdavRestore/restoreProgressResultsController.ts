import {
  buildRestoreProgressContainerSpec,
  buildRestoreProgressEnterState,
  buildRestoreProgressLeaveState,
  formatElapsedTime,
} from './restoreProgressModel';
import {
  buildRestoreResultsContainerSpec,
  buildRestoreResultsDoneState,
  buildRestoreResultsEnterUiState,
  buildRestoreResultsReturnToListState,
} from './restoreResultsModel';

export interface WebDAVRestoreProgressResultsControllerOptions {
  getRestoreModal: () => HTMLElement | null;
  hideElement: (id: string) => void;
  showElement: (id: string) => void;
  fetchFileList: () => void;
  closeModal: () => void;
}

export class WebDAVRestoreProgressResultsController {
  private restoreTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly options: WebDAVRestoreProgressResultsControllerOptions) {}

  showProgress(): void {
    const state = buildRestoreProgressEnterState();
    const modal = document.getElementById(state.modalId);
    if (!modal) return;

    const modalBody = modal.querySelector(state.modalBodySelector);
    if (!modalBody) return;

    Array.from(modalBody.children).forEach((element) => {
      (element as HTMLElement).style.display = state.hiddenChildDisplay;
    });

    document.getElementById(buildRestoreProgressLeaveState().progressContainerId)?.remove();

    const spec = buildRestoreProgressContainerSpec();
    const progressContainer = document.createElement('div');
    progressContainer.id = spec.id;
    progressContainer.className = spec.className;
    progressContainer.innerHTML = spec.html;

    modalBody.appendChild(progressContainer);
    this.startProgressTimer();
  }

  clearProgressTimer(): void {
    if (!this.restoreTimer) return;

    clearInterval(this.restoreTimer);
    this.restoreTimer = null;
  }

  showResults(summary: any, cloudData: any): void {
    const modal = document.getElementById('webdavRestoreModal');
    if (!modal) return;

    const modalBody = modal.querySelector('.modal-body');
    if (!modalBody) return;

    this.clearProgressTimer();

    const progressLeaveState = buildRestoreProgressLeaveState();
    document.getElementById(progressLeaveState.progressContainerId)?.remove();

    const enterUiState = buildRestoreResultsEnterUiState();
    enterUiState.hiddenElementIds.forEach(this.options.hideElement);

    const resultsContainerSpec = buildRestoreResultsContainerSpec(summary, cloudData);
    const resultsContainer = document.createElement('div');
    resultsContainer.id = resultsContainerSpec.id;
    resultsContainer.className = resultsContainerSpec.className;
    resultsContainer.innerHTML = resultsContainerSpec.html;
    modalBody.appendChild(resultsContainer);

    const modalEl = this.options.getRestoreModal();
    if (enterUiState.hideFooters) this.setModalFootersDisplay(modalEl, 'none');
    enterUiState.hiddenButtonIds.forEach((id) => this.hideRestoreResultButton(id));

    this.bindResultActions(resultsContainer, modalEl);
  }

  private startProgressTimer(): void {
    this.clearProgressTimer();

    const startTime = Date.now();
    this.restoreTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const timerEl = document.getElementById('elapsedTime');
      if (timerEl) {
        timerEl.textContent = formatElapsedTime(elapsed);
      }
    }, 1000);
  }

  private bindResultActions(resultsContainer: HTMLElement, modalEl: HTMLElement | null): void {
    const resultsBackBtn = resultsContainer.querySelector('#resultsBackBtn') as HTMLButtonElement | null;
    const resultsDoneBtn = resultsContainer.querySelector('#resultsDoneBtn') as HTMLButtonElement | null;

    if (resultsBackBtn) {
      resultsBackBtn.onclick = () => this.returnToBackupList();
    }

    if (resultsDoneBtn) {
      resultsDoneBtn.onclick = () => {
        try {
          this.options.closeModal();
        } catch {}

        const doneState = buildRestoreResultsDoneState();
        this.setModalFootersDisplay(modalEl, doneState.footerDisplay);
        this.restoreResultActionButtons(doneState.restoreButtonIds, doneState.actionButtonOptions);
      };
    }
  }

  private returnToBackupList(): void {
    const returnState = buildRestoreResultsReturnToListState();
    document.getElementById(returnState.resultsContainerId)?.remove();

    const modal = this.options.getRestoreModal();
    const modalBody = modal?.querySelector(returnState.modalBodySelector) as HTMLElement | null;
    if (modalBody) {
      Array.from(modalBody.children).forEach((element) => {
        (element as HTMLElement).style.display = returnState.restoredChildDisplay;
      });
    }

    returnState.hiddenElementIds.forEach(this.options.hideElement);
    returnState.shownElementIds.forEach(this.options.showElement);

    const loadingText = modal?.querySelector(returnState.loadingTextElementSelector) as HTMLElement | null;
    if (loadingText) loadingText.textContent = returnState.loadingText;

    this.options.fetchFileList();
    this.restoreResultActionButtons(returnState.restoreButtonIds, returnState.actionButtonOptions);
    this.setModalFootersDisplay(modal, returnState.footerDisplay);
  }

  private setModalFootersDisplay(modal: Element | null | undefined, display: string): void {
    modal?.querySelectorAll('.modal-footer').forEach((footer) => {
      (footer as HTMLElement).style.display = display;
    });
  }

  private hideRestoreResultButton(id: string): void {
    const button = this.queryButton(id);
    if (!button) return;

    button.style.display = 'none';
    if (id === 'webdavRestoreConfirm') button.classList.add('hidden');
  }

  private restoreResultActionButtons(
    ids: string[],
    options: { disableConfirm?: boolean; hideBack?: boolean; hideConfirm?: boolean } = {},
  ): void {
    ids.forEach((id) => {
      const button = this.queryButton(id);
      if (!button) return;

      button.style.display = '';
      if (id === 'webdavRestoreConfirm' && options.disableConfirm) button.disabled = true;
      if (id === 'webdavRestoreConfirm' && options.hideConfirm) button.classList.add('hidden');
      if (id === 'webdavRestoreBack' && options.hideBack) button.classList.add('hidden');
    });
  }

  private queryButton(id: string): HTMLButtonElement | null {
    const modal = this.options.getRestoreModal();
    return (modal ? modal.querySelector('#' + id) : document.getElementById(id)) as HTMLButtonElement | null;
  }
}
