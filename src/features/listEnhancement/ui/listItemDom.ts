import type { ListPreviewVideoInfo } from '../../previews';

export function extractListItemVideoInfo(item: HTMLElement): ListPreviewVideoInfo | null {
  const titleElement = item.querySelector('div.video-title > strong');
  const linkElement = item.querySelector('a[href*="/v/"]');

  if (!titleElement || !linkElement) return null;

  const code = titleElement.textContent?.trim() || '';
  const title = item.querySelector('div.video-title')?.textContent?.replace(code, '').trim() || '';
  const url = (linkElement as HTMLAnchorElement).href;

  return { code, title, url };
}

export function optimizeListItemTitle(item: HTMLElement, videoInfo: ListPreviewVideoInfo): void {
  const titleElement = item.querySelector('div.video-title') as HTMLElement | null;
  if (!titleElement) return;

  if (!titleElement.querySelector('.x-btn')) {
    const button = document.createElement('span');
    button.className = 'x-btn';
    button.title = '列表功能';
    button.setAttribute('data-code', videoInfo.code);
    button.setAttribute('data-title', videoInfo.title);

    titleElement.insertAdjacentElement('afterbegin', button);
  }

  if (item.querySelector('.tags')) {
    titleElement.classList.add('x-ellipsis');
  }
  titleElement.classList.add('x-title');
}
