import {
  buildSettingsDifferenceModalHtml,
  getSettingsDifferenceCloseState,
  getSettingsDifferenceOpenState,
  getSettingsDifferenceOverlayStyle,
  SETTINGS_DIFFERENCE_MODAL_CLASS,
  type SettingsDifferenceInput,
} from './settingsDifferenceModel';

export interface WebDAVSettingsDifferenceControllerOptions {
  logInfo: (message: string, payload?: Record<string, unknown>) => void;
}

export class WebDAVSettingsDifferenceController {
  constructor(private readonly options: WebDAVSettingsDifferenceControllerOptions) {}

  show(settingsDiff: SettingsDifferenceInput): void {
    this.options.logInfo('显示设置差异详情', { settingsDiff });

    const existingModal = document.querySelector(`.${SETTINGS_DIFFERENCE_MODAL_CLASS}`);
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = SETTINGS_DIFFERENCE_MODAL_CLASS;
    modal.style.cssText = getSettingsDifferenceOverlayStyle();
    modal.innerHTML = buildSettingsDifferenceModalHtml(settingsDiff);

    document.body.appendChild(modal);

    const openState = getSettingsDifferenceOpenState();
    document.body.style.overflow = openState.bodyOverflow;

    this.options.logInfo('美观设置差异弹窗已创建');

    const closeModal = () => {
      const closeState = getSettingsDifferenceCloseState();
      Object.assign(modal.style, closeState.closingStyle);

      setTimeout(() => {
        if (modal.parentNode) {
          modal.remove();
        }
        document.body.style.overflow = closeState.bodyOverflow;
        this.options.logInfo('设置差异弹窗已关闭');
      }, closeState.animationDurationMs);
    };

    const closeBtnHeader = modal.querySelector('#closeSettingsDiff');
    const closeBtnFooter = modal.querySelector('#closeSettingsDiffFooter');

    if (closeBtnHeader) {
      closeBtnHeader.addEventListener('click', closeModal);
    }

    if (closeBtnFooter) {
      closeBtnFooter.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });

    const modalContent = modal.querySelector('div');
    if (modalContent) {
      modalContent.addEventListener('click', (event) => {
        event.stopPropagation();
      });
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    Object.assign(modal.style, openState.initialStyle);

    requestAnimationFrame(() => {
      Object.assign(modal.style, openState.animatedStyle);
    });
  }
}
