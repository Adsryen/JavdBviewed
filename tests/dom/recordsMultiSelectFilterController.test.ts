import { describe, expect, it, vi } from 'vitest';
import { createRecordsMultiSelectFilterController } from '../../src/dashboard/tabs/records/multiSelectFilterController';

function buildFixture() {
  document.body.innerHTML = `
    <input id="filterInput" />
    <div id="dropdown" style="display: none;"></div>
    <input id="searchInput" />
    <div id="optionList"></div>
    <div id="selectedContainer"></div>
  `;

  return {
    filterInput: document.getElementById('filterInput') as HTMLInputElement,
    dropdown: document.getElementById('dropdown') as HTMLElement,
    searchInput: document.getElementById('searchInput') as HTMLInputElement,
    optionList: document.getElementById('optionList') as HTMLElement,
    selectedContainer: document.getElementById('selectedContainer') as HTMLElement,
  };
}

describe('records multi select filter controller', () => {
  it('renders options, toggles selection, filters visible rows, and removes selected chips', () => {
    const elements = buildFixture();
    const selected = new Set<string>();
    const onChange = vi.fn();

    const controller = createRecordsMultiSelectFilterController({
      elements,
      selected,
      emptyText: '点击选择标签',
      selectedText: (count) => `已选择 ${count} 个标签`,
      optionAttribute: 'data-tag',
      removeAttribute: 'data-tag',
      getItems: () => [
        { id: 'tag-a', name: '无码' },
        { id: 'tag-b', name: '中文字幕' },
      ],
      onChange,
    });

    controller.render();
    controller.bind();
    expect(elements.filterInput.value).toBe('点击选择标签');
    expect(elements.optionList.querySelectorAll('.tag-option')).toHaveLength(2);

    elements.filterInput.click();
    expect(elements.dropdown.style.display).toBe('block');

    elements.optionList.querySelector<HTMLElement>('[data-tag="tag-b"]')?.click();
    expect([...selected]).toEqual(['tag-b']);
    expect(elements.filterInput.value).toBe('已选择 1 个标签');
    expect(elements.selectedContainer.textContent).toContain('中文字幕');
    expect(onChange).toHaveBeenCalledTimes(1);

    elements.searchInput.value = '无码';
    elements.searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    expect((elements.optionList.querySelector<HTMLElement>('[data-tag="tag-a"]') as HTMLElement).style.display).toBe('flex');
    expect((elements.optionList.querySelector<HTMLElement>('[data-tag="tag-b"]') as HTMLElement).style.display).toBe('none');

    elements.selectedContainer.querySelector<HTMLElement>('.remove-tag')?.click();
    expect([...selected]).toEqual([]);
    expect(elements.filterInput.value).toBe('点击选择标签');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('delegates token-backed chip removal to caller before mutating selected state', () => {
    const elements = buildFixture();
    const selected = new Set(['list-1']);
    const onRemoveTokenBackedItem = vi.fn(() => true);

    const controller = createRecordsMultiSelectFilterController({
      elements,
      selected,
      emptyText: '点击选择清单',
      selectedText: (count) => `已选择 ${count} 个清单`,
      optionAttribute: 'data-list-id',
      removeAttribute: 'data-list-id',
      getItems: () => [{ id: 'list-1', name: '收藏夹' }],
      onChange: vi.fn(),
      isTokenBackedItem: (id) => id === 'list-1',
      onRemoveTokenBackedItem,
    });

    controller.render();
    controller.bind();
    elements.selectedContainer.querySelector<HTMLElement>('.remove-tag')?.click();

    expect(onRemoveTokenBackedItem).toHaveBeenCalledWith('list-1');
    expect([...selected]).toEqual(['list-1']);
  });
});
