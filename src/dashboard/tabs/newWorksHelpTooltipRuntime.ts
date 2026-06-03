export interface NewWorksHelpTooltipDeps {
  doc?: Document;
  win?: Window;
}

export function attachNewWorksHelpTooltip(
  helpIcon: HTMLElement,
  helpText: string,
  deps: NewWorksHelpTooltipDeps = {},
): void {
  const doc = deps.doc || document;
  const win = deps.win || window;
  let tooltip: HTMLDivElement | null = null;

  const showTooltip = () => {
    if (tooltip) {
      tooltip.remove();
    }

    tooltip = doc.createElement('div');
    tooltip.className = 'help-tooltip';
    tooltip.textContent = helpText;
    doc.body.appendChild(tooltip);

    const iconRect = helpIcon.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let left = iconRect.left + iconRect.width / 2 - tooltipRect.width / 2;
    let top = iconRect.top - tooltipRect.height - 10;

    if (left < 10) left = 10;
    if (left + tooltipRect.width > win.innerWidth - 10) {
      left = win.innerWidth - tooltipRect.width - 10;
    }
    if (top < 10) {
      top = iconRect.bottom + 10;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.opacity = '1';
  };

  const hideTooltip = () => {
    if (tooltip) {
      tooltip.style.opacity = '0';
      win.setTimeout(() => {
        if (tooltip) {
          tooltip.remove();
          tooltip = null;
        }
      }, 200);
    }
  };

  helpIcon.addEventListener('mouseenter', showTooltip);
  helpIcon.addEventListener('mouseleave', hideTooltip);
}
