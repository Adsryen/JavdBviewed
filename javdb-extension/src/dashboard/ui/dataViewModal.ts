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
    // 为“原始设置(JSON)”提供快速筛选开关（仅在 dataType=json 且 data 为对象时生效）
    enableFilter?: boolean;
    // 可选：键名到显示名的映射，用于在筛选列表显示中文
    keyLabels?: Record<string, string>;
}

export class DataViewModal {
    private modal!: HTMLElement;
    private overlay: HTMLElement | null = null;
    private titleElement!: HTMLElement;
    private textarea!: HTMLTextAreaElement;
    private editBtn!: HTMLButtonElement;
    private saveBtn!: HTMLButtonElement;
    private cancelBtn!: HTMLButtonElement;
    private copyBtn!: HTMLButtonElement;
    private downloadBtn!: HTMLButtonElement;
    private closeBtn!: HTMLButtonElement;
    private modalCloseBtn!: HTMLButtonElement;
    private infoElement!: HTMLElement;

    private currentOptions: DataViewOptions | null = null;
    private originalData: string = '';
    private isEditing: boolean = false;
    private initialized: boolean = false;
    private modalsMounted: boolean = false;
    private domObserver: MutationObserver | null = null;

    // 筛选相关状态
    private filterSidebar: HTMLElement | null = null;
    private filterEnabled: boolean = false;
    private originalObject: any = null;
    private selectedKeys: Set<string> = new Set();

    constructor() {
        // 先监听 partial 挂载事件，确保即便很早发出事件也能接收
        try {
            window.addEventListener('modals:mounted', () => {
                this.modalsMounted = true;
                if (!this.initialized) {
                    this.init();
                }
            });
        } catch {}

        // 再尝试进行一次初始化；若此时模态尚未挂载，init 会静默返回并等待事件重试
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }

        // 兜底：监听 DOM 变化，一旦 #dataViewModal 出现则尝试初始化并断开观察
        try {
            if (!document.getElementById('dataViewModal')) {
                this.domObserver = new MutationObserver(() => {
                    const el = document.getElementById('dataViewModal');
                    if (el && !this.initialized) {
                        this.init();
                        try { this.domObserver?.disconnect(); } catch {}
                        this.domObserver = null;
                    }
                });
                this.domObserver.observe(document.body, { childList: true, subtree: true });
            }
        } catch {}
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
                // 初次（DOM 仍在挂载 modals partial）时不打印错误，等 modals:mounted 后仍失败再报错
                if (this.modalsMounted) {
                    console.error('DataViewModal: 关键元素未找到，弹窗功能将不可用');
                }
                return;
            }

            this.initEventListeners();
            this.initialized = true;
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

        // 每次显示前清理上一次的筛选侧栏
        this.teardownFilterUI();

        // 如果启用筛选且数据可解析为对象，则构建筛选侧栏
        this.filterEnabled = false;
        if (options.enableFilter && options.dataType === 'json') {
            try {
                const parsed = typeof options.data === 'string' ? JSON.parse(options.data) : options.data;
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    this.originalObject = parsed;
                    this.setupFilterUI();
                }
            } catch (e) {
                // 解析失败则忽略筛选
                this.originalObject = null;
            }
        }

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

        // 移除筛选侧栏并还原布局
        this.teardownFilterUI();

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

    // ===== 筛选侧栏：仅在 JSON 查看时启用 =====
    private setupFilterUI(): void {
        if (!this.originalObject) return;
        const container = this.modal.querySelector('.data-view-container') as HTMLElement | null;
        if (!container || !this.textarea) return;

        // 标记为分栏布局
        container.classList.add('layout-split');

        // 创建侧栏
        const sidebar = document.createElement('div');
        sidebar.className = 'data-filter-sidebar';
        sidebar.innerHTML = `
          <div class="filter-header">配置筛选</div>
          <input type="search" class="filter-search" placeholder="搜索键名..."/>
          <div class="filter-actions">
            <button type="button" class="btn-mini" data-action="select-all">全选</button>
            <button type="button" class="btn-mini" data-action="clear">清空</button>
            <button type="button" class="btn-mini" data-action="reset">显示全部</button>
          </div>
          <div class="filter-list"></div>
          <div class="filter-hint">提示：勾选后仅显示所选顶级键；“显示全部”恢复完整JSON</div>
        `;

        // 将侧栏插入到文本域之前
        container.insertBefore(sidebar, this.textarea);
        this.filterSidebar = sidebar;
        this.filterEnabled = true;

        // 渲染键列表（顶级键）
        const keys = Object.keys(this.originalObject);
        const list = sidebar.querySelector('.filter-list') as HTMLElement;
        list.innerHTML = '';
        keys.sort().forEach((k) => {
            const item = document.createElement('label');
            item.className = 'filter-item';
            item.setAttribute('data-key', k);
            const label = (this.currentOptions?.keyLabels && this.currentOptions.keyLabels[k]) ? this.currentOptions.keyLabels[k] : k;
            item.innerHTML = `<input type="checkbox" value="${k}"><span title="${k}">${label}</span>`;
            list.appendChild(item);
        });

        // 事件：勾选变化
        list.addEventListener('change', () => {
            this.selectedKeys.clear();
            const checked = list.querySelectorAll('input[type="checkbox"]:checked');
            checked.forEach((el: any) => this.selectedKeys.add(String(el.value)));
            this.applyFilter();
        });

        // 事件：搜索
        const search = sidebar.querySelector('.filter-search') as HTMLInputElement;
        search.addEventListener('input', () => {
            const q = search.value.trim().toLowerCase();
            const items = list.querySelectorAll('.filter-item');
            items.forEach((el: Element) => {
                const key = (el as HTMLElement).dataset.key || '';
                (el as HTMLElement).style.display = key.toLowerCase().includes(q) ? '' : 'none';
            });
        });

        // 事件：动作按钮
        sidebar.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.matches('.btn-mini')) {
                const action = target.getAttribute('data-action');
                const boxes = list.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
                if (action === 'select-all') {
                    boxes.forEach(b => b.checked = true);
                } else if (action === 'clear') {
                    boxes.forEach(b => b.checked = false);
                } else if (action === 'reset') {
                    boxes.forEach(b => b.checked = false);
                    this.selectedKeys.clear();
                    this.textarea.value = this.originalData;
                    this.updateInfoDefault();
                    return;
                }
                // 统一触发变更
                this.selectedKeys.clear();
                const checked = list.querySelectorAll('input[type="checkbox"]:checked');
                checked.forEach((el: any) => this.selectedKeys.add(String(el.value)));
                this.applyFilter();
            }
        });
    }

    private teardownFilterUI(): void {
        const container = this.modal?.querySelector('.data-view-container') as HTMLElement | null;
        if (container) container.classList.remove('layout-split');
        if (this.filterSidebar && this.filterSidebar.parentElement) {
            this.filterSidebar.parentElement.removeChild(this.filterSidebar);
        }
        this.filterSidebar = null;
        this.filterEnabled = false;
        this.originalObject = null;
        this.selectedKeys.clear();
    }

    private applyFilter(): void {
        if (!this.filterEnabled || !this.originalObject) return;
        if (this.selectedKeys.size === 0) {
            this.textarea.value = this.originalData;
            this.updateInfoDefault();
            return;
        }
        const out: Record<string, any> = {};
        this.selectedKeys.forEach(k => {
            if (k in this.originalObject) out[k] = this.originalObject[k];
        });
        this.textarea.value = JSON.stringify(out, null, 2);
        const lines = this.textarea.value.split('\n').length;
        const chars = this.textarea.value.length;
        this.infoElement.textContent = `筛选：${this.selectedKeys.size} 项 · ${lines} 行, ${chars} 字符`;
    }

    private updateInfoDefault(): void {
        // 恢复默认信息显示（行数/字符数）
        const lines = this.originalData.split('\n').length;
        const chars = this.originalData.length;
        this.infoElement.textContent = `${lines} 行, ${chars} 字符`;
    }
}

// 创建全局实例
export const dataViewModal = new DataViewModal();
