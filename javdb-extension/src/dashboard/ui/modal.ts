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