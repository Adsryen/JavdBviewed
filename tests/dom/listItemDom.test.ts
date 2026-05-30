import { describe, expect, it } from 'vitest';
import {
  extractListItemVideoInfo,
  optimizeListItemTitle,
} from '../../src/features/listEnhancement/ui/listItemDom';

function createMovieItem(): HTMLElement {
  const item = document.createElement('div');
  item.className = 'item';
  item.innerHTML = `
    <a href="https://javdb.com/v/abc123">
      <div class="cover"></div>
    </a>
    <div class="video-title">
      <strong>ABC-001</strong>
      Sample Title
    </div>
    <div class="tags"><span class="tag">HD</span></div>
  `;
  document.body.appendChild(item);
  return item;
}

describe('list item DOM helpers', () => {
  it('extracts video code, title, and JavDB video url from a list item', () => {
    const item = createMovieItem();

    expect(extractListItemVideoInfo(item)).toEqual({
      code: 'ABC-001',
      title: 'Sample Title',
      url: 'https://javdb.com/v/abc123',
    });
  });

  it('returns null when required title or video link nodes are missing', () => {
    const item = document.createElement('div');
    item.innerHTML = '<div class="video-title"><strong>ABC-001</strong></div>';

    expect(extractListItemVideoInfo(item)).toBeNull();
  });

  it('adds list action button and title classes without duplicating the button', () => {
    const item = createMovieItem();
    const videoInfo = extractListItemVideoInfo(item);
    expect(videoInfo).not.toBeNull();

    optimizeListItemTitle(item, videoInfo!);
    optimizeListItemTitle(item, videoInfo!);

    const titleElement = item.querySelector('div.video-title') as HTMLElement;
    const buttons = titleElement.querySelectorAll('.x-btn');
    expect(buttons).toHaveLength(1);
    expect(buttons[0].getAttribute('title')).toBe('列表功能');
    expect(buttons[0].getAttribute('data-code')).toBe('ABC-001');
    expect(buttons[0].getAttribute('data-title')).toBe('Sample Title');
    expect(titleElement.classList.contains('x-title')).toBe(true);
    expect(titleElement.classList.contains('x-ellipsis')).toBe(true);
  });
});
