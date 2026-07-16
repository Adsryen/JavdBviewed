export function showRecordsProgressModal(title: string, total: number): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'batch-progress';
  modal.innerHTML = `
    <div class="batch-progress-text">${title}</div>
    <div class="batch-progress-bar">
      <div class="batch-progress-fill" style="width: 0%"></div>
    </div>
    <div class="batch-progress-details">0 / ${total}</div>
  `;
  document.body.appendChild(modal);
  return modal;
}

export function updateRecordsProgressModal(modal: HTMLElement, current: number, total: number, details: string): void {
  const fill = modal.querySelector('.batch-progress-fill') as HTMLElement | null;
  const detailsElement = modal.querySelector('.batch-progress-details') as HTMLElement | null;

  const percentage = Math.round((current / total) * 100);
  if (fill) fill.style.width = `${percentage}%`;
  if (detailsElement) detailsElement.textContent = details;
}

export function hideRecordsProgressModal(modal: HTMLElement | null | undefined): void {
  if (modal?.parentNode) {
    modal.parentNode.removeChild(modal);
  }
}
