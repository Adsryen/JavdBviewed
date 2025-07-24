import { showModal, showMessage } from '../../lib/utils.js';

/**
 * Initializes the functionality for the Logs tab in the dashboard.
 * This includes fetching, rendering, and filtering logs.
 */
export function init() {
    const logLevelFilter = document.getElementById('log-level-filter');
    const refreshButton = document.getElementById('refresh-logs-button');
    const clearLogsButton = document.getElementById('clear-logs-button');
    const logBody = document.getElementById('log-body');

    // Safeguard in case the elements aren't on the page yet.
    if (!logLevelFilter || !logBody) {
        console.error("Log tab elements not found. Initialization failed.");
        return;
    }

    let allLogs = [];

    /**
     * Renders the log entries into the table based on the current filter.
     */
    const renderLogs = () => {
        const filterValue = logLevelFilter.value;
        logBody.innerHTML = ''; // Clear existing logs

        if (allLogs.length === 0) {
            const row = logBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 4;
            cell.textContent = 'No logs found.';
            cell.style.textAlign = 'center';
            return;
        }

        const filteredLogs = allLogs.filter(log => filterValue === 'ALL' || log.level === filterValue);

        // Display logs in reverse chronological order (newest first)
        for (const log of filteredLogs.slice().reverse()) {
            const row = logBody.insertRow();

            // Timestamp
            const timestampCell = row.insertCell();
            timestampCell.textContent = new Date(log.timestamp).toLocaleString();
            timestampCell.className = 'timestamp';

            // Level
            const levelCell = row.insertCell();
            levelCell.textContent = log.level;
            levelCell.className = `level level-${log.level}`;

            // Message
            const messageCell = row.insertCell();
            messageCell.textContent = log.message;
            messageCell.className = 'message';
            
            // Data
            const dataCell = row.insertCell();
            dataCell.className = 'data';
            if (log.data) {
                const pre = document.createElement('pre');
                pre.textContent = JSON.stringify(log.data, null, 2);
                dataCell.appendChild(pre);
            }
        }
    };

    /**
     * Fetches the latest logs from the background script.
     */
    const fetchLogs = () => {
        if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ type: 'get-logs' }, (response) => {
                if (response && response.success) {
                    allLogs = response.logs || [];
                    renderLogs();
                } else {
                    console.error('Failed to fetch logs:', response ? response.error : 'No response');
                    allLogs = [];
                    renderLogs();
                }
            });
        } else {
            console.error("Cannot access chrome.runtime in this context.");
            allLogs = [];
            renderLogs();
        }
    };

    /**
     * Clears all logs from storage after confirmation.
     */
    const clearLogs = () => {
        showModal({
            title: '确认清空日志',
            message: '您确定要清空所有日志记录吗？此操作无法撤销。',
            onConfirm: () => {
                chrome.storage.local.set({ 'extension_logs': [] }, () => {
                    showMessage('日志已成功清除。');
                    fetchLogs(); // Refresh the view
                });
            }
        });
    };
    
    // Attach event listeners
    logLevelFilter.addEventListener('change', renderLogs);
    refreshButton.addEventListener('click', fetchLogs);
    clearLogsButton.addEventListener('click', clearLogs);

    // Initial load of logs
    fetchLogs();
} 