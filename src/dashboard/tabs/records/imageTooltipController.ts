export interface BindRecordsImageTooltipOptions {
  target: HTMLElement;
  tooltip: HTMLDivElement | null;
  imageUrl: string;
  title: string;
  showDelayMs?: number;
}

function positionRecordsImageTooltip(tooltip: HTMLDivElement, x: number, y: number): void {
  const padding = 8;
  const offset = 15;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const rect = tooltip.getBoundingClientRect();
  let left = x + offset;
  let top = y + offset;

  if (left + rect.width + padding > viewportWidth) left = x - rect.width - offset;
  if (top + rect.height + padding > viewportHeight) top = y - rect.height - offset;

  left = Math.max(padding, Math.min(left, viewportWidth - rect.width - padding));
  top = Math.max(padding, Math.min(top, viewportHeight - rect.height - padding));
  tooltip.style.left = `${Math.round(left)}px`;
  tooltip.style.top = `${Math.round(top)}px`;
}

function showRecordsImageTooltipContent(tooltip: HTMLDivElement, imageUrl: string, title: string): void {
  const tooltipContent = document.createElement('div');
  tooltipContent.className = 'image-tooltip-content';

  const image = document.createElement('img');
  image.src = imageUrl;
  image.alt = title;
  image.style.opacity = '0';

  const loading = document.createElement('div');
  loading.className = 'image-tooltip-loading';
  loading.textContent = '加载中...';

  image.addEventListener('load', () => {
    image.style.opacity = '1';
    loading.style.display = 'none';
  });

  image.addEventListener('error', () => {
    image.style.display = 'none';
    loading.textContent = '图片加载失败';
  });

  tooltip.innerHTML = '';
  tooltipContent.appendChild(image);
  tooltipContent.appendChild(loading);
  tooltip.appendChild(tooltipContent);
}

export function bindRecordsImageTooltip(options: BindRecordsImageTooltipOptions): void {
  const showDelayMs = options.showDelayMs ?? 200;

  options.target.addEventListener('mouseenter', (event) => {
    const tooltip = options.tooltip;
    if (!tooltip) return;

    showRecordsImageTooltipContent(tooltip, options.imageUrl, options.title);
    tooltip.style.display = 'block';
    tooltip.style.opacity = '0';

    let lastX = event.clientX;
    let lastY = event.clientY;
    const updatePosition = (mouseEvent: MouseEvent) => {
      lastX = mouseEvent.clientX;
      lastY = mouseEvent.clientY;
      positionRecordsImageTooltip(tooltip, lastX, lastY);
    };

    positionRecordsImageTooltip(tooltip, lastX, lastY);
    (options.target as any).__recordsTooltipMove = updatePosition;
    options.target.addEventListener('mousemove', updatePosition);

    setTimeout(() => {
      if (tooltip.style.display === 'block') {
        tooltip.style.opacity = '1';
        positionRecordsImageTooltip(tooltip, lastX, lastY);
      }
    }, showDelayMs);
  });

  options.target.addEventListener('mouseleave', () => {
    const tooltip = options.tooltip;
    if (tooltip) {
      tooltip.style.display = 'none';
      tooltip.style.opacity = '0';
    }

    const handler = (options.target as any).__recordsTooltipMove as ((event: MouseEvent) => void) | undefined;
    if (handler) {
      try { options.target.removeEventListener('mousemove', handler); } catch {}
      try { delete (options.target as any).__recordsTooltipMove; } catch {}
    }
  });
}
