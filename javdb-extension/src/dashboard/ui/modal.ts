/**
 * 显示智能恢复确认弹窗
 */
export function showSmartRestoreModal({
    localRecordsCount,
    localActorsCount,
    cloudNewDataCount,
    conflictsCount,
    onConfirm,
    onCancel
}: {
    localRecordsCount: number;
    localActorsCount: number;
    cloudNewDataCount: number;
    conflictsCount: number;
    onConfirm: () => void;
    onCancel?: () => void;
}) {
    const modal = document.getElementById('smartRestoreModal') as HTMLDivElement;
    if (!modal) {
        console.error('Smart restore modal not found');
        return;
    }

    // 更新数据统计
    const localRecordsCountEl = document.getElementById('localRecordsCount');
    const localActorsCountEl = document.getElementById('localActorsCount');
    const cloudNewDataCountEl = document.getElementById('cloudNewDataCount');
    const conflictsCountEl = document.getElementById('conflictsCount');

    if (localRecordsCountEl) localRecordsCountEl.textContent = localRecordsCount.toLocaleString();
    if (localActorsCountEl) localActorsCountEl.textContent = localActorsCount.toLocaleString();
    if (cloudNewDataCountEl) cloudNewDataCountEl.textContent = cloudNewDataCount.toLocaleString();
    if (conflictsCountEl) conflictsCountEl.textContent = conflictsCount.toLocaleString();

    // 显示弹窗
    modal.classList.remove('hidden');
    modal.classList.add('visible');

    // 绑定事件
    const confirmBtn = document.getElementById('smartRestoreConfirm') as HTMLButtonElement;
    const cancelBtn = document.getElementById('smartRestoreCancel') as HTMLButtonElement;
    const closeBtn = document.getElementById('smartRestoreModalClose') as HTMLButtonElement;

    // 移除之前的事件监听器
    const newConfirmBtn = confirmBtn.cloneNode(true) as HTMLButtonElement;
    const newCancelBtn = cancelBtn.cloneNode(true) as HTMLButtonElement;
    const newCloseBtn = closeBtn.cloneNode(true) as HTMLButtonElement;

    confirmBtn.parentNode?.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode?.replaceChild(newCancelBtn, cancelBtn);
    closeBtn.parentNode?.replaceChild(newCloseBtn, closeBtn);

    // 绑定新的事件监听器
    newConfirmBtn.onclick = () => {
        modal.classList.remove('visible');
        modal.classList.add('hidden');
        onConfirm();
    };

    const handleCancel = () => {
        modal.classList.remove('visible');
        modal.classList.add('hidden');
        if (onCancel) onCancel();
    };

    newCancelBtn.onclick = handleCancel;
    newCloseBtn.onclick = handleCancel;

    // 点击背景关闭
    modal.onclick = (e) => {
        if (e.target === modal) {
            handleCancel();
        }
    };

    // ESC键关闭
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleCancel();
            document.removeEventListener('keydown', handleKeyDown);
        }
    };
    document.addEventListener('keydown', handleKeyDown);
}

export function showConfirmationModal({ title, message, onConfirm, onCancel, showRestoreOptions = false, restoreOptions = { settings: true, records: true } }: {
    title: string;
    message: string;
    onConfirm: (options?: { restoreSettings: boolean; restoreRecords: boolean }) => void;
    onCancel?: () => void;
    showRestoreOptions?: boolean;
    restoreOptions?: { settings: boolean; records: boolean };
}) {
    const modal = document.getElementById('confirmationModal') as HTMLDivElement;
    const modalTitle = document.getElementById('modalTitle') as HTMLHeadingElement;
    const modalMessage = document.getElementById('modalMessage') as HTMLParagraphElement;
    let modalConfirmBtn = document.getElementById('modalConfirmBtn') as HTMLButtonElement;
    let modalCancelBtn = document.getElementById('modalCancelBtn') as HTMLButtonElement;
    
    // Restore options elements
    const modalRestoreOptions = document.getElementById('modalRestoreOptions') as HTMLDivElement;
    const restoreSettingsCheckbox = document.getElementById('modalRestoreSettings') as HTMLInputElement;
    const restoreRecordsCheckbox = document.getElementById('modalRestoreRecords') as HTMLInputElement;

    modalTitle.textContent = title;
    modalMessage.textContent = message;

    // Handle restore options display
    if (showRestoreOptions) {
        restoreSettingsCheckbox.checked = restoreOptions.settings;
        restoreRecordsCheckbox.checked = restoreOptions.records;
        modalRestoreOptions.classList.remove('hidden');
    } else {
        modalRestoreOptions.classList.add('hidden');
    }
    
    modal.classList.add('visible');

    // Use .cloneNode to remove previous event listeners
    let newConfirmBtn = modalConfirmBtn.cloneNode(true) as HTMLButtonElement;
    modalConfirmBtn.parentNode?.replaceChild(newConfirmBtn, modalConfirmBtn);
    modalConfirmBtn = newConfirmBtn;

    const newCancelBtn = modalCancelBtn.cloneNode(true) as HTMLButtonElement;
    modalCancelBtn.parentNode?.replaceChild(newCancelBtn, modalCancelBtn);
    modalCancelBtn = newCancelBtn;

    modalConfirmBtn.onclick = () => {
        if (showRestoreOptions) {
            onConfirm({
                restoreSettings: restoreSettingsCheckbox.checked,
                restoreRecords: restoreRecordsCheckbox.checked
            });
        } else {
            onConfirm();
        }
        modal.classList.remove('visible');
    };

    modalCancelBtn.onclick = () => {
        if (onCancel) onCancel();
        modal.classList.remove('visible');
    };
} 