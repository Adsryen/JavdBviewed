import { describe, expect, it, vi } from 'vitest';
import { createRecordsSearchSuggestController } from '../../src/dashboard/tabs/records/searchSuggestController';

function createController(tags = ['高清', '字幕', '无码', '有码']) {
  document.body.innerHTML = `
    <div id="host">
      <input id="searchInput" />
      <div id="searchSuggest"></div>
    </div>
  `;
  const input = document.getElementById('searchInput') as HTMLInputElement;
  const suggest = document.getElementById('searchSuggest') as HTMLDivElement;
  const onApply = vi.fn();
  const controller = createRecordsSearchSuggestController({
    input,
    suggest,
    getTags: () => new Set(tags),
    ensureTagsLoaded: vi.fn(),
    onApply,
    debounceWaitMs: 0,
  });
  return { input, suggest, controller, onApply };
}

describe('records search suggest controller', () => {
  it('renders suggestions for hash tokens', () => {
    const { input, suggest, controller } = createController();

    input.value = '#字';
    input.setSelectionRange(2, 2);
    controller.update();

    expect(suggest.style.display).toBe('block');
    expect(Array.from(suggest.querySelectorAll('.suggest-item')).map(item => item.textContent)).toEqual(['字幕']);
  });

  it('applies hash suggestions and notifies caller', () => {
    const { input, controller, onApply } = createController();

    input.value = '#字';
    input.setSelectionRange(2, 2);
    controller.update();
    controller.apply('字幕');

    expect(input.value).toBe('#字幕');
    expect(onApply).toHaveBeenCalled();
  });

  it('applies the last segment of tag prefix suggestions', () => {
    const { input, controller } = createController();

    input.value = 'tag:高清,字';
    input.setSelectionRange(input.value.length, input.value.length);
    controller.update();
    controller.apply('字幕');

    expect(input.value).toBe('tag:高清,字幕');
  });

  it('handles keyboard navigation and escape', () => {
    const { input, suggest, controller, onApply } = createController(['字幕', '字幕精选']);

    input.value = '#字';
    input.setSelectionRange(2, 2);
    controller.update();
    controller.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    controller.handleKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(input.value).toBe('#字幕精选');
    expect(onApply).toHaveBeenCalled();

    input.value = '#字';
    input.setSelectionRange(2, 2);
    controller.update();
    controller.handleKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(suggest.style.display).toBe('none');
  });

  it('binds mouse and outside click interactions', () => {
    const { input, suggest, controller } = createController();
    controller.bind();

    input.value = '#字';
    input.setSelectionRange(2, 2);
    controller.update();
    (suggest.querySelector('.suggest-item') as HTMLElement).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(input.value).toBe('#字幕');

    input.value = '#高';
    input.setSelectionRange(2, 2);
    controller.update();
    document.body.click();

    expect(suggest.style.display).toBe('none');
  });
});
