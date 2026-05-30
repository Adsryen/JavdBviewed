import type { ListDisplayControlConfig } from '../domain/config';
import { buildListDisplayControlStyles } from './styles';

export interface ApplyListDisplayControlOptions {
  document: Document;
  window: Window;
  control?: ListDisplayControlConfig;
  logger?: (...args: any[]) => void;
}

export interface ApplyListDisplayControlResult {
  applied: boolean;
  reason?: 'unsupported-host' | 'disabled';
  containersProcessed: number;
  itemWidthCalc?: string;
  marginValue?: string;
}

const STYLE_ID = 'x-list-display-control';
const ALLOWED_DOMAINS = ['javdb.com', 'javdb570.com'];

export function applyListDisplayControl(options: ApplyListDisplayControlOptions): ApplyListDisplayControlResult {
  const { document: documentRef, window: windowRef, control } = options;
  const hostname = windowRef.location.hostname;

  if (!isListDisplayControlAllowedHost(hostname)) {
    options.logger?.('[LIST DISPLAY] Domain not allowed for list display control:', hostname);
    removeListDisplayControlStyle(documentRef);
    const containersProcessed = clearListDisplayContainerOverrides(documentRef);
    return { applied: false, reason: 'unsupported-host', containersProcessed };
  }

  options.logger?.('[LIST DISPLAY] Applying list display styles...', {
    control,
    enabled: control?.enabled,
    columnCount: control?.columnCount,
    containerWidth: control?.containerWidth,
    hostname,
  });

  if (!control || !control.enabled) {
    removeListDisplayControlStyle(documentRef);
    const containersProcessed = clearListDisplayContainerOverrides(documentRef);
    options.logger?.('[LIST DISPLAY] Removed custom styles (disabled)');
    return { applied: false, reason: 'disabled', containersProcessed };
  }

  removeListDisplayControlStyle(documentRef);
  const containersProcessed = processListDisplayContainers(documentRef);
  if (containersProcessed > 0) {
    options.logger?.('[LIST DISPLAY] Processed containers:', containersProcessed);
  }

  const { columnCount, containerWidth, enableContainerExpansion } = control;
  const { styleContent, itemWidthCalc, marginValue } = buildListDisplayControlStyles({
    columnCount,
    containerWidth,
    enableContainerExpansion,
    isVideoDetailPage: windowRef.location.pathname.startsWith('/v/'),
  });

  const style = documentRef.createElement('style');
  style.id = STYLE_ID;
  style.textContent = styleContent;
  documentRef.head.appendChild(style);

  options.logger?.('[LIST DISPLAY] ✓ List display styles applied successfully', {
    columnCount,
    containerWidth,
    enableContainerExpansion,
    itemWidthCalc,
    margin: marginValue,
    containersProcessed,
  });

  return {
    applied: true,
    containersProcessed,
    itemWidthCalc,
    marginValue,
  };
}

export function processListDisplayContainers(documentRef: Document): number {
  const containers = documentRef.querySelectorAll('.movie-list.h') as NodeListOf<HTMLElement>;
  containers.forEach(container => {
    removeColumnsClasses(container);
    container.setAttribute('data-x-cols-override', 'true');
  });
  return containers.length;
}

export function clearListDisplayContainerOverrides(documentRef: Document): number {
  const containers = documentRef.querySelectorAll('.movie-list.h') as NodeListOf<HTMLElement>;
  containers.forEach(container => {
    container.removeAttribute('data-x-cols-override');
  });
  return containers.length;
}

export function removeListDisplayControlStyle(documentRef: Document): void {
  documentRef.getElementById(STYLE_ID)?.remove();
}

export function isListDisplayControlAllowedHost(hostname: string): boolean {
  return ALLOWED_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
}

function removeColumnsClasses(container: HTMLElement): void {
  for (let i = 1; i <= 8; i++) {
    container.classList.remove(`cols-${i}`);
  }
}
