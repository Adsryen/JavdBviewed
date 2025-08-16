/**
 * 数据查看弹窗管理器
 * 统一管理高级配置页面的数据查看功能
 */

import { log } from '../../utils/logController';

export interface DataViewOptions {
    title: string;
    data: any;
    dataType: 'json' | 'text';
    editable?: boolean;
    onSave?: (data: string) => Promise<void>;
    onDownload?: (data: string, filename: string) => void;
    filename?: string;
    info?: string;
}

export class DataViewModal {
    private modal: HTMLElement;
    private overlay: HTMLElement | null = null;
    private titleElement: HTMLElement;
    private textarea: HTMLTextAreaElement;
    private editBtn: HTMLButtonElement;
    private saveBtn: HTMLButtonElement;
    private cancelBtn: HTMLButtonElement;
    private copyBtn: HTMLButtonElement;
    private downloadBtn: HTMLButtonElement;
    private closeBtn: HTMLButtonElement;
    private modalCloseBtn: HTMLButtonElement;
    private infoElement: HTMLElement;

    private currentOptions: DataViewOptions | null = null;
    private originalData: string = '';
    private isEditing: boolean = false;

    constructor() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    private init(): void {
        try {
            this.modal = document.getElementById('dataViewModal')!;
            // 兼容当前CSS：内层 .modal-overlay 需要切换 .visible 才会显示内容
            this.overlay = this.modal ? (this.modal.querySelector('.modal-overlay') as HTMLElement | null) : null;
            this.titleElement = document.getElementById('dataViewModalTitle')!;
            this.textarea = document.getElementById('dataViewTextarea') as HTMLTextAreaElement;
            this.editBtn = document.getElementById('dataViewEditBtn') as HTMLButtonElement;
            this.saveBtn = document.getElementById('dataViewSaveBtn') as HTMLButtonElement;
            this.cancelBtn = document.getElementById('dataViewCancelBtn') as HTMLButtonElement;
            this.copyBtn = document.getElementById('dataViewCopyBtn') as HTMLButtonElement;
            this.downloadBtn = document.getElementById('dataViewDownloadBtn') as HTMLButtonElement;
            this.closeBtn = document.getElementById('dataViewCloseBtn') as HTMLButtonElement;
            this.modalCloseBtn = document.getElementById('dataViewModalClose') as HTMLButtonElement;
            this.infoElement = document.getElementById('dataViewInfo')!;

            if (!this.modal || !this.titleElement || !this.textarea) {
                console.error('DataViewModal: 关键元素未找到，弹窗功能将不可用');
                return;
            }

            this.initEventListeners();
            log.verbose('DataViewModal: 初始化成功');
        } catch (error) {
            console.error('DataViewModal: 初始化失败', error);
        }
    }

    private initEventListeners(): void {
        // 关闭弹窗
        this.closeBtn.addEventListener('click', () => this.hide());
        this.modalCloseBtn.addEventListener('click', () => this.hide());

        // 点击背景关闭（兼容 dataViewModal 的结构，背景在 .modal-overlay 上）
        const backdrop = this.overlay ?? this.modal;
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                this.hide();
            }
        });

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            // 两种显示方式都支持：.modal.visible 或 .modal-overlay.visible
            const isShown = this.modal.classList.contains('visible') || (this.overlay?.classList.contains('visible') ?? false);
            if (e.key === 'Escape' && isShown) {
                this.hide();
            }
        });

        // 编辑功能
        this.editBtn.addEventListener('click', () => this.enableEdit());
        this.saveBtn.addEventListener('click', () => this.saveData());
        this.cancelBtn.addEventListener('click', () => this.cancelEdit());

        // 复制功能
        this.copyBtn.addEventListener('click', () => this.copyData());

        // 下载功能
        this.downloadBtn.addEventListener('click', () => this.downloadData());
    }

    public show(options: DataViewOptions): void {
        log.verbose('DataViewModal.show() 被调用', options.title);

        if (!this.modal) {
            console.error('DataViewModal: 弹窗元素未初始化');
            return;
        }

        this.currentOptions = options;
        this.titleElement.textContent = options.title;

        // 格式化数据
        if (options.dataType === 'json') {
            this.originalData = typeof options.data === 'string'
                ? options.data
                : JSON.stringify(options.data, null, 2);
        } else {
            this.originalData = String(options.data);
        }

        this.textarea.value = this.originalData;
        this.textarea.readOnly = true;

        // 更新信息显示
        if (options.info) {
            this.infoElement.textContent = options.info;
        } else {
            const lines = this.originalData.split('\n').length;
            const chars = this.originalData.length;
            this.infoElement.textContent = `${lines} 行, ${chars} 字符`;
        }

        // 控制按钮显示
        this.editBtn.style.display = options.editable ? 'inline-flex' : 'none';
        this.downloadBtn.style.display = options.filename ? 'inline-flex' : 'none';

        // 重置编辑状态
        this.resetEditState();

        // 显示弹窗：同时让外层 modal 与内层 overlay 可见，避免只出现灰色背景
        this.modal.classList.add('visible');
        if (this.overlay) {
            this.overlay.classList.add('visible');
        }
        document.body.style.overflow = 'hidden';
    }

    public hide(): void {
        if (this.isEditing) {
            if (confirm('有未保存的更改，确定要关闭吗？')) {
                this.cancelEdit();
            } else {
                return;
            }
        }

        if (this.overlay) {
            this.overlay.classList.remove('visible');
        }
        this.modal.classList.remove('visible');
        document.body.style.overflow = '';
        this.currentOptions = null;
    }

    private enableEdit(): void {
        if (!this.currentOptions?.editable) return;

        this.isEditing = true;
        this.textarea.readOnly = false;
        this.textarea.focus();

        // 切换按钮显示
        this.editBtn.classList.add('hidden');
        this.saveBtn.classList.remove('hidden');
        this.cancelBtn.classList.remove('hidden');
    }

    private async saveData(): Promise<void> {
        if (!this.currentOptions?.onSave) return;

        try {
            this.saveBtn.disabled = true;
            this.saveBtn.textContent = '保存中...';

            await this.currentOptions.onSave(this.textarea.value);
            
            this.originalData = this.textarea.value;
            this.resetEditState();
            
            // 显示成功消息
            this.showMessage('数据已保存', 'success');
        } catch (error) {
            console.error('保存数据失败:', error);
            this.showMessage('保存失败: ' + (error instanceof Error ? error.message : '未知错误'), 'error');
        } finally {
            this.saveBtn.disabled = false;
            this.saveBtn.textContent = '保存';
        }
    }

    private cancelEdit(): void {
        this.textarea.value = this.originalData;
        this.resetEditState();
    }

    private resetEditState(): void {
        this.isEditing = false;
        this.textarea.readOnly = true;
        
        this.editBtn.classList.remove('hidden');
        this.saveBtn.classList.add('hidden');
        this.cancelBtn.classList.add('hidden');
    }

    private async copyData(): Promise<void> {
        try {
            await navigator.clipboard.writeText(this.textarea.value);
            this.showMessage('已复制到剪贴板', 'success');
        } catch (error) {
            console.error('复制失败:', error);
            this.showMessage('复制失败', 'error');
        }
    }

    private downloadData(): void {
        if (!this.currentOptions?.filename) return;

        const blob = new Blob([this.textarea.value], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.currentOptions.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showMessage('文件已下载', 'success');
    }

    private showMessage(message: string, type: 'success' | 'error'): void {
        // 这里可以集成现有的消息显示系统
        log.verbose(`[${type.toUpperCase()}] ${message}`);
        
        // 如果有全局的showMessage函数，可以调用它
        if (typeof (window as any).showMessage === 'function') {
            (window as any).showMessage(message, type);
        }
    }
}

// 创建全局实例
export const dataViewModal = new DataViewModal();
