// src/dashboard/webdavRestore.ts

import { logAsync } from './logger';
import { showMessage } from './ui/toast';

interface WebDAVFile {
    name: string;
    path: string;
    lastModified: string;
    size?: number;
}

let selectedFile: WebDAVFile | null = null;

// 格式化文件大小
function formatFileSize(bytes?: number): string {
    if (!bytes || bytes === 0) return '未知大小';

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function showWebDAVRestoreModal(): void {
    const modal = document.getElementById('webdavRestoreModal');
    if (!modal) return;

    // 重置状态
    selectedFile = null;
    resetModalState();
    
    // 显示弹窗
    modal.classList.remove('hidden');
    modal.classList.add('visible');
    
    // 绑定事件
    bindModalEvents();
    
    // 开始获取文件列表
    fetchFileList();
}

function resetModalState(): void {
    // 隐藏所有内容区域
    hideElement('webdavRestoreContent');
    hideElement('webdavRestoreError');
    hideElement('webdavRestoreOptions');
    
    // 显示加载状态
    showElement('webdavRestoreLoading');
    
    // 重置按钮状态
    const confirmBtn = document.getElementById('webdavRestoreConfirm') as HTMLButtonElement;
    if (confirmBtn) {
        confirmBtn.disabled = true;
    }
    
    // 清空文件列表
    const fileList = document.getElementById('webdavFileList');
    if (fileList) {
        fileList.innerHTML = '';
    }
}

function bindModalEvents(): void {
    // 关闭按钮
    const closeBtn = document.getElementById('webdavRestoreModalClose');
    const cancelBtn = document.getElementById('webdavRestoreCancel');
    const confirmBtn = document.getElementById('webdavRestoreConfirm');
    const retryBtn = document.getElementById('webdavRestoreRetry');
    
    if (closeBtn) {
        closeBtn.onclick = closeModal;
    }
    
    if (cancelBtn) {
        cancelBtn.onclick = closeModal;
    }
    
    if (confirmBtn) {
        confirmBtn.onclick = handleConfirmRestore;
    }
    
    if (retryBtn) {
        retryBtn.onclick = fetchFileList;
    }
    
    // 点击背景关闭
    const modal = document.getElementById('webdavRestoreModal');
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal();
            }
        };
    }
}

function fetchFileList(): void {
    logAsync('INFO', '开始获取WebDAV文件列表');
    
    // 显示加载状态
    hideElement('webdavRestoreContent');
    hideElement('webdavRestoreError');
    showElement('webdavRestoreLoading');
    
    chrome.runtime.sendMessage({ type: 'webdav-list-files' }, response => {
        if (response?.success) {
            if (response.files && response.files.length > 0) {
                displayFileList(response.files);
                logAsync('INFO', '成功获取云端文件列表', { fileCount: response.files.length });
            } else {
                showError('在云端未找到任何备份文件');
                logAsync('WARN', '云端没有任何备份文件');
            }
        } else {
            showError(response?.error || '获取文件列表失败');
            logAsync('ERROR', '从云端获取文件列表失败', { error: response?.error });
        }
    });
}

function displayFileList(files: WebDAVFile[]): void {
    hideElement('webdavRestoreLoading');
    hideElement('webdavRestoreError');
    showElement('webdavRestoreContent');
    
    const fileList = document.getElementById('webdavFileList');
    if (!fileList) return;
    
    fileList.innerHTML = '';
    
    files.forEach(file => {
        const li = document.createElement('li');
        li.className = 'webdav-file-item';
        li.dataset.filename = file.name;
        li.dataset.filepath = file.path;
        
        li.innerHTML = `
            <i class="fas fa-file-alt file-icon"></i>
            <div class="file-info">
                <span class="file-name">${file.name}</span>
                <div class="file-meta">
                    <span class="file-date">${file.lastModified}</span>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
            </div>
        `;
        
        li.addEventListener('click', () => selectFile(file, li));
        fileList.appendChild(li);
    });
}

function selectFile(file: WebDAVFile, element: HTMLElement): void {
    // 移除之前的选中状态
    const previousSelected = document.querySelector('.webdav-file-item.selected');
    if (previousSelected) {
        previousSelected.classList.remove('selected');
    }
    
    // 设置新的选中状态
    element.classList.add('selected');
    selectedFile = file;
    
    // 显示恢复选项
    showElement('webdavRestoreOptions');
    
    // 启用确认按钮
    const confirmBtn = document.getElementById('webdavRestoreConfirm') as HTMLButtonElement;
    if (confirmBtn) {
        confirmBtn.disabled = false;
    }
    
    logAsync('INFO', '用户选择了文件', { filename: file.name });
}

function handleConfirmRestore(): void {
    if (!selectedFile) return;
    
    const restoreSettings = (document.getElementById('webdavRestoreSettings') as HTMLInputElement)?.checked ?? true;
    const restoreRecords = (document.getElementById('webdavRestoreRecords') as HTMLInputElement)?.checked ?? true;
    const restoreUserProfile = (document.getElementById('webdavRestoreUserProfile') as HTMLInputElement)?.checked ?? true;

    if (!restoreSettings && !restoreRecords && !restoreUserProfile) {
        showMessage('请至少选择一项要恢复的内容', 'warn');
        return;
    }

    const options = {
        restoreSettings,
        restoreRecords,
        restoreUserProfile
    };
    
    logAsync('INFO', '开始恢复数据', { filename: selectedFile.name, options });
    
    // 禁用按钮，显示加载状态
    const confirmBtn = document.getElementById('webdavRestoreConfirm') as HTMLButtonElement;
    const cancelBtn = document.getElementById('webdavRestoreCancel') as HTMLButtonElement;
    
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 恢复中...';
    }
    
    if (cancelBtn) {
        cancelBtn.disabled = true;
    }
    
    chrome.runtime.sendMessage({ 
        type: 'webdav-restore', 
        filename: selectedFile.path, 
        options: options 
    }, response => {
        if (response?.success) {
            showMessage('数据恢复成功！页面即将刷新以应用更改。', 'success');
            logAsync('INFO', '云端数据恢复成功');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            showMessage(`恢复失败: ${response?.error || '未知错误'}`, 'error');
            logAsync('ERROR', '云端数据恢复失败', { error: response?.error });
            
            // 恢复按钮状态
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '<i class="fas fa-download"></i> 开始恢复';
            }
            
            if (cancelBtn) {
                cancelBtn.disabled = false;
            }
        }
    });
}

function showError(message: string): void {
    hideElement('webdavRestoreLoading');
    hideElement('webdavRestoreContent');
    showElement('webdavRestoreError');
    
    const errorMessage = document.getElementById('webdavRestoreErrorMessage');
    if (errorMessage) {
        errorMessage.textContent = message;
    }
}

function closeModal(): void {
    const modal = document.getElementById('webdavRestoreModal');
    if (modal) {
        modal.classList.remove('visible');
        modal.classList.add('hidden');
    }
    
    selectedFile = null;
    logAsync('INFO', '用户关闭了WebDAV恢复弹窗');
}

function showElement(id: string): void {
    const element = document.getElementById(id);
    if (element) {
        element.classList.remove('hidden');
    }
}

function hideElement(id: string): void {
    const element = document.getElementById(id);
    if (element) {
        element.classList.add('hidden');
    }
}

// 导出函数供其他模块使用
export { showWebDAVRestoreModal as default };
