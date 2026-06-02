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

    csvRows.push(row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
  }

  return '\uFEFF' + csvRows.join('\n');
}

export function createRecordsExportController(options: CreateRecordsExportControllerOptions): RecordsExportController {
  const downloadFile = options.downloadFile || defaultDownloadFile;

  const exportAsJSON = async () => {
    try {
      const records = await options.getRecords();
      if (records.length === 0) {
        options.showMessage('没有数据可导出', 'warn');
        return;
      }

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
      options.showMessage(`成功导出 ${records.length} 条记录（JSON格式）`, 'success');
    } catch (error: any) {
      console.error('[Records] 导出JSON失败:', error);
      options.showMessage(`导出失败: ${error.message}`, 'error');
    }
  };

  const exportAsCsv = async () => {
    try {
      const records = await options.getRecords();
      if (records.length === 0) {
        options.showMessage('没有数据可导出', 'warn');
        return;
      }

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
      options.showMessage(`成功导出 ${records.length} 条记录（CSV格式）`, 'success');
    } catch (error: any) {
      console.error('[Records] 导出CSV失败:', error);
      options.showMessage(`导出失败: ${error.message}`, 'error');
    }
  };

  const handleExportRecords = async () => {
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
          <p style="margin-top: 16px; font-size: 12px; color: #666;">
            ${options.getExportCountText()}
          </p>
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
      closeModal();
      if (selectedFormat === 'json') {
        await exportAsJSON();
      } else {
        await exportAsCsv();
      }
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
