import { bindRecordsImageTooltip, type BindRecordsImageTooltipOptions } from './imageTooltipController';

export interface CreateRecordsCoverElementOptions {
  title: string;
  coverUrl: string;
  tooltipImageUrl: string;
  fallbackUrl: string;
  tooltip: HTMLDivElement | null;
  bindTooltip?: (options: BindRecordsImageTooltipOptions) => void;
}

export function createRecordsCoverElement(options: CreateRecordsCoverElementOptions): HTMLDivElement {
  const cover = document.createElement('div');
  cover.className = 'video-cover skeleton';

  const image = document.createElement('img');
  image.className = 'video-cover-img';
  image.alt = options.title;

  if (options.coverUrl) {
    image.setAttribute('data-src', options.coverUrl);
  } else {
    image.src = options.fallbackUrl;
    image.classList.add('loaded');
    cover.classList.remove('skeleton');
  }

  cover.appendChild(image);

  if (options.tooltipImageUrl) {
    (options.bindTooltip || bindRecordsImageTooltip)({
      target: cover,
      tooltip: options.tooltip,
      imageUrl: options.tooltipImageUrl,
      title: options.title,
      showDelayMs: 120,
    });
  }

  return cover;
}

export function insertRecordsCoverElement(row: HTMLElement, cover: HTMLElement): void {
  if (row.firstChild) {
    row.insertBefore(cover, row.firstChild);
    return;
  }
  row.appendChild(cover);
}

export function observeRecordsCoverImage(
  coverOrRow: HTMLElement,
  observer: Pick<IntersectionObserver, 'observe'> | null | undefined,
): void {
  const image = coverOrRow.matches('.video-cover-img')
    ? coverOrRow as HTMLImageElement
    : coverOrRow.querySelector('.video-cover-img') as HTMLImageElement | null;

  if (image && image.getAttribute('data-src')) {
    observer?.observe(image);
  }
}
