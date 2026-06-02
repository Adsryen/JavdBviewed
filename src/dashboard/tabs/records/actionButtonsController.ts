import type { VideoRecord } from '../../../types';

export type RecordsActionButtonHandler = (record: VideoRecord, button: HTMLButtonElement) => void | Promise<void>;

export interface CreateRecordsActionButtonsOptions {
  record: VideoRecord;
  onToggleFavorite: RecordsActionButtonHandler;
  onEdit: RecordsActionButtonHandler;
  onRefresh: RecordsActionButtonHandler;
  onDelete: RecordsActionButtonHandler;
  onOpenListPicker: RecordsActionButtonHandler;
}

interface RecordsActionButtonDefinition {
  className: string;
  title: string;
  html: string;
  dataRecordId?: string;
  onClick: RecordsActionButtonHandler;
}

function createRecordsActionButton(
  record: VideoRecord,
  definition: RecordsActionButtonDefinition,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = definition.className;
  button.innerHTML = definition.html;
  button.title = definition.title;

  if (definition.dataRecordId) {
    button.setAttribute('data-record-id', definition.dataRecordId);
  }

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    void definition.onClick(record, button);
  });

  return button;
}

export function createRecordsActionButtons(options: CreateRecordsActionButtonsOptions): HTMLDivElement {
  const { record } = options;
  const container = document.createElement('div');
  container.className = 'action-buttons-container';

  const favoriteIconStyle = record.isFavorite ? 'fas' : 'far';
  const definitions: RecordsActionButtonDefinition[] = [
    {
      className: `action-button favorite-button${record.isFavorite ? ' favorited' : ''}`,
      html: `<i class="${favoriteIconStyle} fa-heart"></i>`,
      title: record.isFavorite ? '取消收藏' : '添加到收藏',
      onClick: options.onToggleFavorite,
    },
    {
      className: 'action-button edit-button',
      html: '<i class="fas fa-edit"></i>',
      title: '编辑记录',
      onClick: options.onEdit,
    },
    {
      className: 'action-button sync-button',
      html: '<i class="fas fa-sync-alt"></i>',
      title: '刷新源数据',
      onClick: options.onRefresh,
    },
    {
      className: 'action-button delete-button',
      html: '<i class="fas fa-trash"></i>',
      title: '删除记录',
      onClick: options.onDelete,
    },
    {
      className: 'action-button add-to-list-btn',
      html: '<i class="fas fa-list-ul"></i>',
      title: '添加到清单',
      dataRecordId: record.id,
      onClick: options.onOpenListPicker,
    },
  ];

  definitions.forEach((definition) => {
    container.appendChild(createRecordsActionButton(record, definition));
  });

  return container;
}
