// @ts-nocheck

import { initializeGlobalState, STATE, cleanupSearchEngines } from './state';
import { initRecordsTab } from './tabs/records';
import { actorsTab } from './tabs/actors';
import { syncTab } from './tabs/sync';
import { initSettingsTab } from './tabs/settings';
import { initAdvancedSettingsTab } from './tabs/advanced';
import { initLogsTab } from './tabs/logs';
import { initializeNetworkTestTab } from './tabs/network';
import { initDrive115Tab } from './tabs/drive115';
import { initModal, showImportModal, handleFileRestoreClick } from './import';
import { logAsync } from './logger';
import { showMessage } from './ui/toast';
import { VIDEO_STATUS } from '../utils/config';
import { showWebDAVRestoreModal } from './webdavRestore';
import { setValue, getValue } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/config';
import { initUserProfileSection } from './userProfile';
import { initDataSyncSection } from './dataSync';
import { initializeDrive115Service } from '../services/drive115';
import type { VideoRecord, OldVideoRecord, VideoStatus } from '../types';

document.addEventListener('DOMContentLoaded', async () => {
    await initializeGlobalState();

    // 清理搜索引擎配置中的测试数据
    await cleanupSearchEngines();

    // 设置标题图标URL
    const titleIcon = document.getElementById('title-icon') as HTMLImageElement;
    if (titleIcon) {
        titleIcon.src = chrome.runtime.getURL('assets/favicon-32x32.png');
    }

    // 初始化115服务
    try {
        await initializeDrive115Service();
    } catch (error) {
        console.error('初始化115服务失败:', error);
    }

    initTabs();
    initRecordsTab();
    initActorsTab();
    initSyncTab();
    initSettingsTab();
    initDrive115Tab();
    initLogsTab();
    initSidebarActions();
    initUserProfileSection();
    // initDataSyncSection(); // 移除重复调用，由 initSyncTab 处理
    initStatsOverview();
    initInfoContainer();
    initHelpSystem();
    initModal();
    updateSyncStatus();
});

/**
 * 初始化演员库标签页
 */
async function initActorsTab(): Promise<void> {
    try {
        await actorsTab.initActorsTab();
    } catch (error) {
        console.error('初始化演员库标签页失败:', error);
    }
}

/**
 * 初始化数据同步标签页
 */
async function initSyncTab(): Promise<void> {
    try {
        await syncTab.initSyncTab();
    } catch (error) {
        console.error('初始化数据同步标签页失败:', error);
    }
}

function initTabs(): void {
    try {
        const tabs = document.querySelectorAll('.tab-link');
        const contents = document.querySelectorAll('.tab-content');

        // 确保 NodeList 存在且不为空
        if (!tabs || tabs.length === 0) {
            console.warn('未找到标签页链接元素');
            return;
        }

        if (!contents || contents.length === 0) {
            console.warn('未找到标签页内容元素');
            return;
        }

        const switchTab = (tabButton: Element | null) => {
            if (!tabButton) return;
            const tabId = tabButton.getAttribute('data-tab');
            if (!tabId) return;

            try {
                // 安全地遍历 NodeList
                if (tabs && tabs.forEach) {
                    tabs.forEach(t => t.classList.remove('active'));
                }
                if (contents && contents.forEach) {
                    contents.forEach(c => c.classList.remove('active'));
                }

                tabButton.classList.add('active');
                document.getElementById(tabId)?.classList.add('active');

                if (history.pushState) {
                    history.pushState(null, '', `#${tabId}`);
                } else {
                    location.hash = `#${tabId}`;
                }
            } catch (error) {
                console.error('切换标签页时出错:', error);
            }
        };

        // 安全地为每个标签页添加事件监听器
        if (tabs && tabs.forEach) {
            tabs.forEach(tab => {
                try {
                    tab.addEventListener('click', () => {
                        switchTab(tab);
                        if (tab.getAttribute('data-tab') === 'tab-logs') {
                            const refreshButton = document.getElementById('refresh-logs-button') as HTMLButtonElement;
                            if (refreshButton) {
                                refreshButton.click();
                            }
                        }
                    });
                } catch (error) {
                    console.error('为标签页添加事件监听器时出错:', error);
                }
            });
        }

        const currentHash = window.location.hash.substring(1) || 'tab-records';
        const targetTab = document.querySelector(`.tab-link[data-tab="${currentHash}"]`);
        switchTab(targetTab || (tabs.length > 0 ? tabs[0] : null));
    } catch (error) {
        console.error('初始化标签页时出错:', error);
    }
}

function initStatsOverview(): void {
    const container = document.getElementById('stats-overview');
    if (!container) return;

    try {
        // 确保 STATE.records 是数组
        const records = Array.isArray(STATE.records) ? STATE.records : [];

        const totalRecords = records.length;
        const viewedCount = records.filter(r => r && r.status === VIDEO_STATUS.VIEWED).length;
        const wantCount = records.filter(r => r && r.status === VIDEO_STATUS.WANT).length;
        const browsedCount = records.filter(r => r && r.status === VIDEO_STATUS.BROWSED).length;

        container.innerHTML = `
            <div data-stat="total">
                <span class="stat-value">${totalRecords}</span>
                <span class="stat-label">总记录</span>
            </div>
            <div data-stat="viewed">
                <span class="stat-value">${viewedCount}</span>
                <span class="stat-label">已观看</span>
            </div>
            <div data-stat="browsed">
                <span class="stat-value">${browsedCount}</span>
                <span class="stat-label">已浏览</span>
            </div>
            <div data-stat="want">
                <span class="stat-value">${wantCount}</span>
                <span class="stat-label">想看</span>
            </div>
        `;
    } catch (error) {
        console.error('初始化统计概览时出错:', error);
        container.innerHTML = `
            <div data-stat="total">
                <span class="stat-value">0</span>
                <span class="stat-label">总记录</span>
            </div>
            <div data-stat="viewed">
                <span class="stat-value">0</span>
                <span class="stat-label">已观看</span>
            </div>
            <div data-stat="browsed">
                <span class="stat-value">0</span>
                <span class="stat-label">已浏览</span>
            </div>
            <div data-stat="want">
                <span class="stat-value">0</span>
                <span class="stat-label">想看</span>
            </div>
        `;
    }
}

function initInfoContainer(): void {
    const infoContainer = document.getElementById('infoContainer');
    if (!infoContainer) return;

    const version = import.meta.env.VITE_APP_VERSION || 'N/A';
    const versionState = import.meta.env.VITE_APP_VERSION_STATE || 'unknown';

    const getStateTitle = (state: string): string => {
        switch (state) {
            case 'clean':
                return '此版本基于一个干净的、已完全提交的 Git 工作区构建。';
            case 'dev':
                return '此版本包含已暂存但尚未提交的更改 (dev/staged)。';
            case 'dirty':
                return '警告：此版本包含未跟踪或未暂存的本地修改 (dirty)！';
            default:
                return '无法确定此版本的构建状态。';
        }
    };

    infoContainer.innerHTML = `
        <div class="info-item">
            <span class="info-label">Version:</span>
            <span class="info-value version-state-${versionState}" title="${getStateTitle(versionState)}">${version}</span>
        </div>
    `;
}

function initHelpSystem(): void {
    const helpBtn = document.getElementById('helpBtn');
    const helpPanel = document.getElementById('helpPanel');
    const closeHelpBtn = document.getElementById('closeHelpBtn');
    const helpBody = helpPanel?.querySelector('.help-body');

    if (!helpBtn || !helpPanel || !closeHelpBtn || !helpBody) return;

    // 帮助内容
    const helpContent = `
        <h3><i class="fas fa-database"></i> 数据管理</h3>
        <ul>
            <li><strong>记录管理：</strong>查看、编辑、删除已保存的视频记录，支持批量操作和状态筛选</li>
            <li><strong>数据导入/导出：</strong>支持JSON格式的数据备份和恢复，兼容旧版本数据格式</li>
            <li><strong>数据统计：</strong>实时显示已观看、已浏览、想看等各类视频的数量统计</li>
        </ul>

        <h3><i class="fas fa-user-circle"></i> 账号信息</h3>
        <ul>
            <li><strong>账号登录：</strong>获取并显示JavDB账号信息，包括邮箱、用户名、用户类型</li>
            <li><strong>信息管理：</strong>支持刷新账号信息和退出登录功能</li>
            <li><strong>数据安全：</strong>登录信息仅用于数据同步，本地安全存储</li>
        </ul>

        <h3><i class="fas fa-sync-alt"></i> 数据同步</h3>
        <ul>
            <li><strong>同步全部：</strong>同步所有已观看和想看的视频数据到JavDB账号</li>
            <li><strong>分类同步：</strong>支持单独同步已观看或想看数据</li>
            <li><strong>演员收藏：</strong>同步收藏演员数据（功能即将推出）</li>
            <li><strong>实时进度：</strong>显示同步进度和结果反馈</li>
        </ul>

        <h3><i class="fas fa-cog"></i> 设置配置</h3>
        <ul>
            <li><strong>显示设置：</strong>控制在JavDB网站上是否自动隐藏已观看、已浏览或VR类型的影片</li>
            <li><strong>WebDAV备份：</strong>配置云端存储服务，实现多设备间的数据备份</li>
            <li><strong>搜索引擎：</strong>自定义外部搜索引擎，快速跳转到其他影片数据库网站</li>
        </ul>

        <h3><i class="fas fa-cloud"></i> WebDAV 备份</h3>
        <ul>
            <li><strong>自动备份：</strong>支持定时自动上传和下载数据，保持多设备数据一致性</li>
            <li><strong>手动备份：</strong>随时手动执行上传/下载操作，支持增量备份</li>
            <li><strong>兼容性：</strong>支持坚果云、TeraCloud、Yandex等主流WebDAV服务</li>
            <li><strong>完整备份：</strong>包含设置、记录、账号信息的完整数据备份</li>
        </ul>

        <h3><i class="fas fa-list-alt"></i> 日志系统</h3>
        <ul>
            <li><strong>操作日志：</strong>记录所有重要操作和错误信息，便于问题排查</li>
            <li><strong>日志筛选：</strong>支持按日志级别（INFO、WARN、ERROR）筛选显示</li>
            <li><strong>日志管理：</strong>自动清理过期日志，支持手动清空和导出</li>
        </ul>

        <h3><i class="fas fa-network-wired"></i> 网络测试</h3>
        <ul>
            <li><strong>连接测试：</strong>测试WebDAV服务器连接状态和响应时间</li>
            <li><strong>性能监控：</strong>监控同步操作的网络性能和成功率</li>
            <li><strong>故障诊断：</strong>提供详细的网络错误信息和解决建议</li>
        </ul>

        <h3><i class="fas fa-tools"></i> 高级功能</h3>
        <ul>
            <li><strong>数据结构检查：</strong>自动检测和修复数据格式问题，确保数据完整性</li>
            <li><strong>数据迁移：</strong>支持从旧版本格式自动迁移到新版本数据结构</li>
            <li><strong>JSON编辑：</strong>高级用户可直接编辑原始JSON数据，支持语法高亮</li>
        </ul>

        <h3><i class="fas fa-keyboard"></i> 快捷操作</h3>
        <ul>
            <li><strong>批量选择：</strong>使用Ctrl+点击或Shift+点击进行多选操作</li>
            <li><strong>快速筛选：</strong>点击状态标签快速筛选对应状态的记录</li>
            <li><strong>搜索功能：</strong>支持按视频ID、标题等关键词快速搜索</li>
        </ul>

        <h3><i class="fas fa-question-circle"></i> 常见问题</h3>
        <ul>
            <li><strong>数据丢失：</strong>如果数据意外丢失，可尝试从WebDAV云端恢复</li>
            <li><strong>同步失败：</strong>检查网络连接和WebDAV配置，查看日志获取详细错误信息</li>
            <li><strong>性能问题：</strong>大量数据时建议定期清理无用记录，保持数据库精简</li>
        </ul>

        <div class="help-footer">
            <p><i class="fas fa-info-circle"></i> <strong>提示：</strong>所有数据都存储在本地浏览器中，请定期备份重要数据。</p>
            <p><i class="fas fa-github"></i> 如遇到问题或有功能建议，欢迎在GitHub项目页面提交Issue。</p>
        </div>
    `;

    helpBody.innerHTML = helpContent;

    // 显示帮助面板
    helpBtn.addEventListener('click', () => {
        helpPanel.classList.remove('hidden');
        helpPanel.classList.add('visible');
    });

    // 关闭帮助面板
    const closeHelp = () => {
        helpPanel.classList.remove('visible');
        helpPanel.classList.add('hidden');
    };

    closeHelpBtn.addEventListener('click', closeHelp);

    // 点击背景关闭
    helpPanel.addEventListener('click', (e) => {
        if (e.target === helpPanel) {
            closeHelp();
        }
    });

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && helpPanel.classList.contains('visible')) {
            closeHelp();
        }
    });
}

function updateSyncStatus(): void {
    try {
        const lastSyncTimeElement = document.getElementById('lastSyncTime') as HTMLSpanElement;
        const lastSyncTimeSettings = document.getElementById('last-sync-time') as HTMLSpanElement;
        const syncIndicator = document.getElementById('syncIndicator') as HTMLDivElement;

        // 安全地获取 lastSync 时间
        const webdavSettings = STATE.settings?.webdav || {};
        const lastSync = webdavSettings.lastSync || '';

        // Update sidebar sync status
        if (lastSyncTimeElement && syncIndicator) {
            updateSyncDisplay(lastSyncTimeElement, syncIndicator, lastSync);
        }

        // Update settings page sync time
        if (lastSyncTimeSettings) {
            lastSyncTimeSettings.textContent = lastSync ? new Date(lastSync).toLocaleString('zh-CN') : '从未';
        }
    } catch (error) {
        console.error('更新同步状态时出错:', error);
        // 在出错时设置默认状态
        const lastSyncTimeElement = document.getElementById('lastSyncTime') as HTMLSpanElement;
        const lastSyncTimeSettings = document.getElementById('last-sync-time') as HTMLSpanElement;
        const syncIndicator = document.getElementById('syncIndicator') as HTMLDivElement;

        if (lastSyncTimeElement) {
            lastSyncTimeElement.textContent = '从未';
        }
        if (lastSyncTimeSettings) {
            lastSyncTimeSettings.textContent = '从未';
        }
        if (syncIndicator) {
            syncIndicator.className = 'sync-indicator';
            const statusText = syncIndicator.querySelector('.sync-status-text');
            if (statusText) {
                statusText.textContent = '未同步';
            }
        }
    }
}

function updateSyncDisplay(lastSyncTimeElement: HTMLSpanElement, syncIndicator: HTMLDivElement, lastSync: string): void {
    if (lastSync) {
        const syncDate = new Date(lastSync);
        const now = new Date();
        const diffMs = now.getTime() - syncDate.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        let timeText = '';
        if (diffDays > 0) {
            timeText = `${diffDays}天前`;
        } else if (diffHours > 0) {
            timeText = `${diffHours}小时前`;
        } else {
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            if (diffMinutes > 0) {
                timeText = `${diffMinutes}分钟前`;
            } else {
                timeText = '刚刚';
            }
        }

        lastSyncTimeElement.textContent = timeText;
        lastSyncTimeElement.title = syncDate.toLocaleString('zh-CN');

        // Update sync status
        syncIndicator.className = 'sync-indicator';
        if (diffDays > 7) {
            syncIndicator.classList.add('error');
            syncIndicator.querySelector('.sync-status-text')!.textContent = '需要同步';
        } else if (diffDays > 1) {
            syncIndicator.classList.add('synced');
            syncIndicator.querySelector('.sync-status-text')!.textContent = '已同步';
        } else {
            syncIndicator.classList.add('synced');
            syncIndicator.querySelector('.sync-status-text')!.textContent = '最新';
        }
    } else {
        lastSyncTimeElement.textContent = '从未';
        lastSyncTimeElement.title = '尚未进行过同步';
        syncIndicator.className = 'sync-indicator';
        syncIndicator.querySelector('.sync-status-text')!.textContent = '未同步';
    }
}

function setSyncingStatus(isUploading: boolean = false): void {
    const syncIndicator = document.getElementById('syncIndicator') as HTMLDivElement;
    if (!syncIndicator) return;

    syncIndicator.className = 'sync-indicator syncing';
    const statusText = syncIndicator.querySelector('.sync-status-text') as HTMLSpanElement;
    if (statusText) {
        statusText.textContent = isUploading ? '上传中...' : '同步中...';
    }
}

function initSidebarActions(): void {
    const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
    const syncNowBtn = document.getElementById('syncNow') as HTMLButtonElement;
    const syncDownBtn = document.getElementById('syncDown') as HTMLButtonElement;
    const fileListContainer = document.getElementById('fileListContainer') as HTMLDivElement;
    const fileList = document.getElementById('fileList') as HTMLUListElement;
    const clearAllBtn = document.getElementById('clearAllBtn') as HTMLButtonElement;

    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            showConfirmationModal({
                title: '确认清空所有本地记录',
                message: '您确定要清空所有本地记录吗？此操作不可撤销，且无法通过 WebDAV 恢复！',
                onConfirm: () => {
                    logAsync('INFO', '用户确认清空所有本地记录。');
                    chrome.runtime.sendMessage({ type: 'clear-all-records' }, response => {
                        if (response?.success) {
                            showMessage('所有本地记录已成功清空。', 'success');
                            logAsync('INFO', '所有本地记录已被成功清空。');
                            // Refresh the page or relevant parts to reflect the change
                            location.reload();
                        } else {
                            showMessage('清空记录失败，请稍后重试。', 'error');
                            logAsync('ERROR', '清空所有本地记录时发生错误。', { error: response.error });
                        }
                    });
                },
                onCancel: () => {
                    logAsync('INFO', '用户取消了清空所有本地记录的操作。');
                }
            });
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            logAsync('INFO', '用户点击了“导出到本地”按钮。');
            // 获取用户账号信息
            const userProfile = await getValue(STORAGE_KEYS.USER_PROFILE, null);

            const dataToExport = {
                settings: STATE.settings,
                data: STATE.records.reduce((acc, record) => {
                    acc[record.id] = record;
                    return acc;
                }, {} as Record<string, VideoRecord>),
                userProfile: userProfile
            };
            const dataStr = JSON.stringify(dataToExport, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `javdb-extension-backup-${new Date().toISOString().split('T')[0]}.json`;
            anchor.click();
            URL.revokeObjectURL(url);
            showMessage('数据导出成功（包含账号信息）', 'success');
            logAsync('INFO', '本地数据导出成功，包含用户账号信息。');
        });
    }

    const importFileInput = document.getElementById('importFile') as HTMLInputElement;

    if (importFileInput) {
        importFileInput.addEventListener('change', (event) => {
            logAsync('INFO', '用户选择了本地文件进行导入。');
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) {
                logAsync('WARN', '用户取消了文件选择。');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    showImportModal(text);
                } else {
                    showMessage('Failed to read file content.', 'error');
                    logAsync('ERROR', '无法读取文件内容，内容非字符串。');
                }
            };
            reader.onerror = () => {
                showMessage(`Error reading file: ${reader.error}`, 'error');
                logAsync('ERROR', '读取导入文件时发生错误。', { error: reader.error });
            };
            reader.readAsText(file);

            importFileInput.value = '';
        });
    }

    if (syncNowBtn) {
        syncNowBtn.addEventListener('click', () => {
            syncNowBtn.textContent = '正在上传...';
            syncNowBtn.disabled = true;
            setSyncingStatus(true);
            logAsync('INFO', '用户点击"立即上传至云端"，开始上传数据。');

            chrome.runtime.sendMessage({ type: 'webdav-upload' }, response => {
                syncNowBtn.textContent = '立即上传至云端';
                syncNowBtn.disabled = false;

                if (response?.success) {
                    showMessage('数据已成功上传至云端！', 'success');
                    logAsync('INFO', '数据成功上传至云端。');
                    // Update sync status after successful upload
                    setTimeout(() => {
                        updateSyncStatus();
                    }, 500);
                } else {
                    showMessage(`上传失败: ${response.error}`, 'error');
                    logAsync('ERROR', '数据上传至云端失败。', { error: response.error });
                    // Reset sync status on error
                    setTimeout(() => {
                        updateSyncStatus();
                    }, 500);
                }
            });
        });
    }

    if (syncDownBtn) {
        syncDownBtn.addEventListener('click', () => {
            logAsync('INFO', '用户点击"从云端恢复"，打开恢复弹窗。');
            showWebDAVRestoreModal();
        });
    }
}

// 监听来自background script的消息
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
    if (message.type === 'show-toast') {
        // 在dashboard页面显示toast通知
        showMessage(message.message, message.toastType || 'info');
    }
});

// Export functions for use in other modules
export { updateSyncStatus };

// Make updateSyncStatus available globally
(window as any).updateSyncStatus = updateSyncStatus;