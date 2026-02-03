/**
 * 确认弹窗组件
 */

export interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'info' | 'warning' | 'danger';
}

export class ConfirmModal {
    private modal: HTMLElement | null = null;
    private onConfirmCallback: (() => void) | null = null;
    private onCancelCallback: (() => void) | null = null;

    /**
     * 显示确认弹窗
     */
    show(options: ConfirmOptions): Promise<boolean> {
        return new Promise((resolve) => {
            this.onConfirmCallback = () => resolve(true);
            this.onCancelCallback = () => resolve(false);
            this.createModal(options);
            this.showModal();
        });
    }

    /**
     * 创建弹窗
     */
    private createModal(options: ConfirmOptions): void {
        // 移除已存在的弹窗
        this.removeModal();

        const {
            title = '确认操作',
            message,
            confirmText = '确认',
            cancelText = '取消',
            type = 'info'
        } = options;

        // 根据类型设置颜色
        const typeColors = {
            info: '#2196F3',
            warning: '#FF9800',
            danger: '#F44336'
        };

        this.modal = document.createElement('div');
        this.modal.className = 'confirm-modal';
        this.modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content confirm-modal-content">
                    <div class="modal-header">
                        <h3 style="color: ${typeColors[type]};">${title}</h3>
                    </div>
                    <div class="modal-body">
                        <p class="confirm-message">${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" id="confirmCancel">${cancelText}</button>
                        <button class="btn-${type === 'danger' ? 'danger' : 'primary'}" id="confirmOk">${confirmText}</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);
        this.setupEventListeners();
    }

    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        if (!this.modal) return;

        // 确认按钮
        const confirmBtn = this.modal.querySelector('#confirmOk');
        confirmBtn?.addEventListener('click', () => this.handleConfirm());

        // 取消按钮
        const cancelBtn = this.modal.querySelector('#confirmCancel');
        cancelBtn?.addEventListener('click', () => this.handleCancel());

        // ESC键关闭
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                this.handleCancel();
                document.removeEventListener('keydown', handleKeyDown);
            }
            if (e.key === 'Enter') {
                this.handleConfirm();
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        // 点击遮罩关闭
        const overlay = this.modal.querySelector('.modal-overlay');
        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.handleCancel();
            }
        });
    }

    /**
     * 处理确认
     */
    private handleConfirm(): void {
        if (this.onConfirmCallback) {
            this.onConfirmCallback();
        }
        this.hideModal();
    }

    /**
     * 处理取消
     */
    private handleCancel(): void {
        if (this.onCancelCallback) {
            this.onCancelCallback();
        }
        this.hideModal();
    }

    /**
     * 显示弹窗
     */
    private showModal(): void {
        if (this.modal) {
            this.modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // 添加visible类以显示弹窗
            const overlay = this.modal.querySelector('.modal-overlay');
            if (overlay) {
                overlay.classList.add('visible');
            }
        }
    }

    /**
     * 隐藏弹窗
     */
    private hideModal(): void {
        if (this.modal) {
            const overlay = this.modal.querySelector('.modal-overlay');
            if (overlay) {
                overlay.classList.remove('visible');
            }
            
            // 等待动画完成后移除弹窗
            setTimeout(() => {
                this.removeModal();
            }, 300);
        }
    }

    /**
     * 移除弹窗
     */
    private removeModal(): void {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
            document.body.style.overflow = '';
        }
    }
}

// 全局实例
let globalConfirmModal: ConfirmModal | null = null;

/**
 * 显示确认弹窗的便捷函数
 */
export function showConfirm(options: ConfirmOptions): Promise<boolean> {
    if (!globalConfirmModal) {
        globalConfirmModal = new ConfirmModal();
    }
    return globalConfirmModal.show(options);
}

/**
 * 显示信息弹窗的便捷函数
 */
export function showInfo(message: string, title?: string): Promise<boolean> {
    return showConfirm({
        title: title || '信息',
        message,
        confirmText: '确定',
        cancelText: '关闭',
        type: 'info'
    });
}

/**
 * 显示警告弹窗的便捷函数
 */
export function showWarning(message: string, title?: string): Promise<boolean> {
    return showConfirm({
        title: title || '警告',
        message,
        confirmText: '确定',
        cancelText: '取消',
        type: 'warning'
    });
}

/**
 * 显示危险操作确认弹窗的便捷函数
 */
export function showDanger(message: string, title?: string): Promise<boolean> {
    return showConfirm({
        title: title || '危险操作',
        message,
        confirmText: '确定删除',
        cancelText: '取消',
        type: 'danger'
    });
}
