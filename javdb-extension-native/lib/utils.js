export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Displays a temporary message to the user. This function assumes
 * a DOM element with the ID 'messageContainer' exists in the dashboard.
 * @param {string} text - The message to display.
 * @param {string} [type='success'] - The type of message ('success', 'error', 'info').
 */
export function showMessage(text, type = 'success') {
    const container = document.getElementById('messageContainer');
    if (!container) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;
    
    container.appendChild(messageDiv);
    
    // Animate in
    setTimeout(() => messageDiv.classList.add('show'), 10);

    // Animate out and remove
    setTimeout(() => {
        messageDiv.classList.remove('show');
        setTimeout(() => container.removeChild(messageDiv), 500);
    }, 3000);
}

/**
 * Shows a confirmation modal. This function assumes a DOM structure
 * with the ID 'confirmationModal' and its children exists in the dashboard.
 * @param {object} options - Modal options.
 * @param {string} options.title - Modal title.
 * @param {string} options.message - Modal message.
 * @param {function} options.onConfirm - Callback on confirmation.
 * @param {function} [options.onCancel] - Callback on cancellation.
 * @param {boolean} [options.showRestoreOptions=false] - Whether to show the restore options.
 */
export function showModal({ title, message, onConfirm, onCancel, showRestoreOptions = false }) {
    const modal = document.getElementById('confirmationModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalConfirmBtn = document.getElementById('modalConfirmBtn');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    const modalRestoreOptions = document.getElementById('modalRestoreOptions');
    const modalRestoreSettings = document.getElementById('modalRestoreSettings');
    const modalRestoreRecords = document.getElementById('modalRestoreRecords');

    if (!modal) return;

    modalTitle.textContent = title;
    modalMessage.textContent = message;

    if (showRestoreOptions) {
        modalRestoreOptions.classList.remove('hidden');
    } else {
        modalRestoreOptions.classList.add('hidden');
    }

    modal.classList.add('active');

    const confirmHandler = () => {
        const restoreOptions = showRestoreOptions 
            ? { restoreSettings: modalRestoreSettings.checked, restoreRecords: modalRestoreRecords.checked }
            : undefined;
        onConfirm(restoreOptions);
        closeModal();
    };

    const cancelHandler = () => {
        if (onCancel) onCancel();
        closeModal();
    };

    const closeModal = () => {
        modal.classList.remove('active');
        // Important: Remove old listeners to prevent multiple triggers
        modalConfirmBtn.removeEventListener('click', confirmHandler);
        modalCancelBtn.removeEventListener('click', cancelHandler);
    };

    modalConfirmBtn.addEventListener('click', confirmHandler);
    modalCancelBtn.addEventListener('click', cancelHandler);
} 