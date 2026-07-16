import type { VideoRecord } from '../../../types';
import { hideRecordsProgressModal, showRecordsProgressModal, updateRecordsProgressModal } from './progressModalController';

type MessageType = 'info' | 'warn' | 'warning' | 'error' | 'success';

export interface RecordsDownloadFileInput {
  filename: string;
  content: string;
  type: string;
}

export interface CreateRecordsExportControllerOptions {
  getExportCountText: () => string;
  getRecords: () => Promise<VideoRecord[]>;
  getListName: (listId: string) => string;
  showMessage: (message: string, type: MessageType) => void;
  downloadFile?: (input: RecordsDownloadFileInput) => void;
  /** 获取当前选中的番号 ID 列表（空数组表示无选中项） */
  getSelectedRecordIds?: () => string[];
  /** 获取选中数量文本，如 "已选中 5 条" */
  getSelectedCountText?: () => string;
}

export interface RecordsExportController {
  handleExportRecords: () => Promise<void>;
}

function defaultDownloadFile(input: RecordsDownloadFileInput): void {
  const blob = new Blob([input.content], { type: input.type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = input.filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function getExportDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * 转义 CSV 单元格值，防止 Excel 自动转换格式。
 *
 * 问题场景：
 * - 全数字番号（如 "123456"）在 Excel 中会被当作数字，长数字显示为科学计数法
 * - 以 =、+、-、@ 开头的值在 Excel 中可能被当作公式
 *
 * 解决：对纯数字或以危险字符开头的值使用 ="value" 的 Excel 文本公式格式。
 * 其它值使用标准 CSV 双引号包裹。
 */
function escapeCsvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  // 纯数字：Excel 会当作 number → 科学计数法 / 前导零丢失
  // 以 = + - @ 开头：Excel 会当作公式
  if (/^\d+$/.test(value) || /^[=+\-@]/.test(value)) {
    return `"=""${escaped}"""`;
  }
  return `"${escaped}"`;
}

function buildCsvContent(records: VideoRecord[], getListName: (listId: string) => string, progressModal: HTMLElement | null): string {
  const headers = ['番号', '标题', '状态', '标签', '清单', '发行日期', '创建时间', '更新时间', 'JavDB链接', '封面链接'];
  const csvRows: string[] = [];

  csvRows.push(headers.map(h => `"${h}"`).join(','));

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    if (progressModal && i % 100 === 0) {
      updateRecordsProgressModal(progressModal, i, records.length, `已处理 ${i}/${records.length}`);
    }

    const tags = Array.isArray(record.tags) ? record.tags.join('、') : '';
    const listIds = Array.isArray(record.listIds) ? record.listIds : [];
    const listNames = listIds.map((id) => getListName(String(id))).join('、');
    const createdAt = record.createdAt ? new Date(record.createdAt).toLocaleString('zh-CN') : '';
    const updatedAt = record.updatedAt ? new Date(record.updatedAt).toLocaleString('zh-CN') : '';
    const row = [
      record.id || '',
      record.title || '',
      record.status || '',
      tags,
      listNames,
      record.releaseDate || '',
      createdAt,
      updatedAt,
      record.javdbUrl || '',
      record.javdbImage || '',
    ];

    csvRows.push(row.map(cell => escapeCsvCell(String(cell))).join(','));
  }

  return '﻿' + csvRows.join('\n');
}

export function createRecordsExportController(options: CreateRecordsExportControllerOptions): RecordsExportController {
  const downloadFile = options.downloadFile || defaultDownloadFile;

  const doExport = async (format: 'json' | 'csv', selectedIds: Set<string> | null) => {
    const allRecords = await options.getRecords();
    const records = selectedIds && selectedIds.size > 0
      ? allRecords.filter(r => selectedIds.has(r.id))
      : allRecords;

    if (records.length === 0) {
      options.showMessage('没有数据可导出', 'warn');
      return;
    }

    if (format === 'json') {
      let progressModal: HTMLElement | null = null;
      if (records.length > 1000) {
        progressModal = showRecordsProgressModal('正在生成JSON文件...', records.length);
      }

      const exportData = {
        exportTime: new Date().toISOString(),
        totalCount: records.length,
        records,
      };

      downloadFile({
        filename: `javdb-records-${getExportDate()}.json`,
        content: JSON.stringify(exportData, null, 2),
        type: 'application/json;charset=utf-8',
      });

      hideRecordsProgressModal(progressModal);
      const scope = selectedIds && selectedIds.size > 0 ? '（仅选中）' : '';
      options.showMessage(`成功导出 ${records.length} 条记录${scope}（JSON格式）`, 'success');
    } else {
      let progressModal: HTMLElement | null = null;
      if (records.length > 1000) {
        progressModal = showRecordsProgressModal('正在生成CSV文件...', records.length);
        updateRecordsProgressModal(progressModal, 0, records.length, '正在处理数据...');
      }

      downloadFile({
        filename: `javdb-records-${getExportDate()}.csv`,
        content: buildCsvContent(records, options.getListName, progressModal),
        type: 'text/csv;charset=utf-8',
      });

      hideRecordsProgressModal(progressModal);
      const scope = selectedIds && selectedIds.size > 0 ? '（仅选中）' : '';
      options.showMessage(`成功导出 ${records.length} 条记录${scope}（CSV格式）`, 'success');
    }
  };

  const handleExportRecords = async () => {
    const selectedIds = options.getSelectedRecordIds?.() ?? [];
    const hasSelection = selectedIds.length > 0;

    const scopeSection = hasSelection
      ? `<div style="margin-top: 16px;">
          <p style="margin-bottom: 8px;">导出范围：</p>
          <label style="display: block; margin-bottom: 8px; cursor: pointer;">
            <input type="radio" name="exportScope" value="all" checked style="margin-right: 8px;">
            ${options.getExportCountText()}
          </label>
          <label style="display: block; cursor: pointer;">
            <input type="radio" name="exportScope" value="selected" style="margin-right: 8px;">
            ${options.getSelectedCountText?.() ?? `仅导出选中记录（${selectedIds.length} 条）`}
          </label>
        </div>`
      : `<p style="margin-top: 16px; font-size: 12px; color: #666;">${options.getExportCountText()}</p>`;

    const modal = document.createElement('div');
    modal.className = 'custom-confirm-modal';
    modal.innerHTML = `
      <div class="custom-confirm-overlay"></div>
      <div class="custom-confirm-content">
        <div class="custom-confirm-header">
          <h3>导出番号数据</h3>
        </div>
        <div class="custom-confirm-body">
          <p>请选择导出格式：</p>
          <div style="margin-top: 12px;">
            <label style="display: block; margin-bottom: 8px; cursor: pointer;">
              <input type="radio" name="exportFormat" value="json" checked style="margin-right: 8px;">
              JSON 格式（完整数据，包含所有字段）
            </label>
            <label style="display: block; cursor: pointer;">
              <input type="radio" name="exportFormat" value="excel" style="margin-right: 8px;">
              Excel 格式（CSV文件，适合表格查看）
            </label>
          </div>
          ${scopeSection}
        </div>
        <div class="custom-confirm-footer">
          <button class="custom-confirm-cancel">取消</button>
          <button class="custom-confirm-ok">开始导出</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const overlay = modal.querySelector('.custom-confirm-overlay') as HTMLElement;
    const cancelBtn = modal.querySelector('.custom-confirm-cancel') as HTMLButtonElement;
    const okBtn = modal.querySelector('.custom-confirm-ok') as HTMLButtonElement;

    const closeModal = () => {
      modal.remove();
    };

    overlay.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    okBtn.addEventListener('click', async () => {
      const selectedFormat = (modal.querySelector('input[name="exportFormat"]:checked') as HTMLInputElement)?.value || 'json';
      const scopeRadio = modal.querySelector('input[name="exportScope"]:checked') as HTMLInputElement | null;
      const useSelected = scopeRadio?.value === 'selected';
      closeModal();
      await doExport(
        selectedFormat === 'json' ? 'json' : 'csv',
        useSelected ? new Set(selectedIds) : null,
      );
    });

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleKeydown);
      }
    };
    document.addEventListener('keydown', handleKeydown);
  };

  return { handleExportRecords };
}