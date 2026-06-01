import {
  buildRestoreOptionViewModels,
  summarizeRestoreOptionViewModels,
  type RestoreOptionViewModel,
} from './restoreOptionsModel';

export interface WebDAVRestoreOptionsControllerOptions {
  logInfo: (message: string, payload?: Record<string, unknown>) => void;
}

export class WebDAVRestoreOptionsController {
  constructor(private readonly options: WebDAVRestoreOptionsControllerOptions) {}

  configureRestoreOptions(cloudData: any): void {
    const viewModels = buildRestoreOptionViewModels(cloudData);
    viewModels.forEach((viewModel) => this.renderRestoreOptionViewModel(viewModel));
    const summary = summarizeRestoreOptionViewModels(viewModels);

    this.options.logInfo('恢复内容选项自动配置完成', {
      availableOptions: summary.availableOptions,
      unavailableOptions: summary.unavailableOptions,
      cloudDataKeys: cloudData ? Object.keys(cloudData) : [],
    });
  }

  private renderRestoreOptionViewModel(viewModel: RestoreOptionViewModel): void {
    const checkbox = document.getElementById(viewModel.id) as HTMLInputElement | null;
    const container = checkbox?.closest('.form-group-checkbox') as HTMLElement | null;

    if (!checkbox || !container) return;

    checkbox.disabled = viewModel.disabled;
    checkbox.checked = viewModel.checked;
    container.classList.remove('available', 'warning', 'disabled', 'unavailable');

    if (viewModel.state === 'available') {
      container.classList.add('available');
      this.updateOptionStats(container, viewModel.statsText);
      return;
    }

    if (viewModel.state === 'warning') {
      container.classList.add('warning');
      this.updateOptionMessage(container, 'warning-text', 'fa-exclamation-triangle', viewModel.message || '');
      return;
    }

    container.classList.add('disabled', 'unavailable');
    this.updateOptionMessage(container, 'unavailable-text', 'fa-times-circle', viewModel.message || '');
  }

  private updateOptionStats(container: HTMLElement, statsText?: string): void {
    const small = container.querySelector('small');
    if (!small || !statsText) return;

    const originalText = small.textContent || '';
    const baseText = originalText.split('(')[0].trim();
    small.innerHTML = `${baseText} <span class="stats-info">(${statsText})</span>`;
  }

  private updateOptionMessage(container: HTMLElement, className: string, iconClass: string, message: string): void {
    const small = container.querySelector('small');
    if (small) {
      small.innerHTML = `<span class="${className}"><i class="fas ${iconClass}"></i> ${message}</span>`;
    }
  }
}
