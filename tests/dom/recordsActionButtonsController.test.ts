import { describe, expect, it, vi } from 'vitest';
import { createRecordsActionButtons } from '../../src/dashboard/tabs/records/actionButtonsController';
import type { VideoRecord } from '../../src/types';

function createRecord(overrides: Partial<VideoRecord> = {}): VideoRecord {
  return {
    id: 'ABC-123',
    title: '测试影片',
    status: 'viewed',
    createdAt: 1,
    updatedAt: 2,
    ...overrides,
  };
}

describe('records action buttons controller', () => {
  it('renders record action buttons in the expected order with current favorite state', () => {
    const record = createRecord({ isFavorite: true });

    const container = createRecordsActionButtons({
      record,
      onToggleFavorite: vi.fn(),
      onEdit: vi.fn(),
      onRefresh: vi.fn(),
      onDelete: vi.fn(),
      onOpenListPicker: vi.fn(),
    });

    expect(container.className).toBe('action-buttons-container');
    const buttons = Array.from(container.querySelectorAll('button'));
    expect(buttons.map(button => button.className)).toEqual([
      'action-button favorite-button favorited',
      'action-button edit-button',
      'action-button sync-button',
      'action-button delete-button',
      'action-button add-to-list-btn',
    ]);
    expect(buttons.map(button => button.title)).toEqual([
      '取消收藏',
      '编辑记录',
      '刷新源数据',
      '删除记录',
      '添加到清单',
    ]);
    expect(buttons[0].innerHTML).toBe('<i class="fas fa-heart"></i>');
    expect(buttons[4].getAttribute('data-record-id')).toBe('ABC-123');
  });

  it('stops row propagation and delegates button actions with the record and active button', () => {
    const record = createRecord();
    const callbacks = {
      onToggleFavorite: vi.fn(),
      onEdit: vi.fn(),
      onRefresh: vi.fn(),
      onDelete: vi.fn(),
      onOpenListPicker: vi.fn(),
    };
    const container = createRecordsActionButtons({ record, ...callbacks });
    const rowClick = vi.fn();
    const row = document.createElement('li');
    row.addEventListener('click', rowClick);
    row.appendChild(container);

    const favoriteButton = container.querySelector('.favorite-button') as HTMLButtonElement;
    const editButton = container.querySelector('.edit-button') as HTMLButtonElement;
    const syncButton = container.querySelector('.sync-button') as HTMLButtonElement;
    const deleteButton = container.querySelector('.delete-button') as HTMLButtonElement;
    const addToListButton = container.querySelector('.add-to-list-btn') as HTMLButtonElement;

    favoriteButton.click();
    editButton.click();
    syncButton.click();
    deleteButton.click();
    addToListButton.click();

    expect(rowClick).not.toHaveBeenCalled();
    expect(callbacks.onToggleFavorite).toHaveBeenCalledWith(record, favoriteButton);
    expect(callbacks.onEdit).toHaveBeenCalledWith(record, editButton);
    expect(callbacks.onRefresh).toHaveBeenCalledWith(record, syncButton);
    expect(callbacks.onDelete).toHaveBeenCalledWith(record, deleteButton);
    expect(callbacks.onOpenListPicker).toHaveBeenCalledWith(record, addToListButton);
  });
});
