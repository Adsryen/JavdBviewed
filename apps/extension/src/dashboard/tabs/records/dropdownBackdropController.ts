export interface CreateRecordsDropdownBackdropControllerOptions {
  dropdowns: Array<HTMLElement | null | undefined>;
  closeDropdowns: () => void;
  hostSelector?: string;
  toolbarSelector?: string;
}

export interface RecordsDropdownBackdropController {
  sync: () => void;
  getBackdrop: () => HTMLDivElement | null;
}

function isDropdownOpen(dropdown: HTMLElement | null | undefined): boolean {
  try {
    if (!dropdown) return false;
    return window.getComputedStyle(dropdown).display !== 'none';
  } catch {
    return false;
  }
}

export function createRecordsDropdownBackdropController(
  options: CreateRecordsDropdownBackdropControllerOptions,
): RecordsDropdownBackdropController {
  const hostSelector = options.hostSelector || '#tab-records .card';
  const toolbarSelector = options.toolbarSelector || '#tab-records .records-toolbar';
  let backdrop: HTMLDivElement | null = null;

  const position = () => {
    try {
      if (!backdrop) return;
      const card = backdrop.parentElement as HTMLElement | null;
      const toolbar = document.querySelector(toolbarSelector) as HTMLElement | null;
      if (!card || !toolbar) {
        backdrop.style.top = '0px';
        return;
      }

      const cardRect = card.getBoundingClientRect();
      const toolbarRect = toolbar.getBoundingClientRect();
      const top = Math.max(0, toolbarRect.bottom - cardRect.top);
      backdrop.style.top = `${top}px`;
    } catch {
      if (backdrop) backdrop.style.top = '0px';
    }
  };

  const ensureBackdrop = () => {
    if (backdrop) return backdrop;

    const element = document.createElement('div');
    element.className = 'dropdown-backdrop';
    element.addEventListener('click', () => {
      options.closeDropdowns();
      sync();
    });

    const host = (document.querySelector(hostSelector) as HTMLElement | null) || document.body;
    host.appendChild(element);
    backdrop = element;
    return element;
  };

  const sync = () => {
    const anyOpen = options.dropdowns.some(isDropdownOpen);
    if (anyOpen) {
      const element = ensureBackdrop();
      position();
      element.style.display = 'block';
      return;
    }

    if (backdrop) backdrop.style.display = 'none';
  };

  return {
    sync,
    getBackdrop: () => backdrop,
  };
}
