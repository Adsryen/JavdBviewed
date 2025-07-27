import { getValue, setValue } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/config';
import { logAsync } from './logger';
import { showMessage } from './ui/toast';
import type { UserProfile } from '../types';

/**
 * 从JavDB获取用户账号信息
 */
export async function fetchUserProfile(): Promise<UserProfile | null> {
    try {
        logAsync('INFO', '开始获取用户账号信息');
        
        // 发送消息到background script获取用户信息
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'fetch-user-profile' }, (response) => {
                if (response?.success) {
                    logAsync('INFO', '成功获取用户账号信息', response.profile);
                    resolve(response.profile);
                } else {
                    logAsync('ERROR', '获取用户账号信息失败', { error: response?.error });
                    resolve(null);
                }
            });
        });
    } catch (error: any) {
        logAsync('ERROR', '获取用户账号信息时发生错误', { error: error.message });
        return null;
    }
}

/**
 * 保存用户账号信息到本地存储
 */
export async function saveUserProfile(profile: UserProfile): Promise<void> {
    try {
        profile.lastUpdated = Date.now();
        await setValue(STORAGE_KEYS.USER_PROFILE, profile);
        logAsync('INFO', '用户账号信息已保存到本地存储');
    } catch (error: any) {
        logAsync('ERROR', '保存用户账号信息失败', { error: error.message });
        throw error;
    }
}

/**
 * 从本地存储获取用户账号信息
 */
export async function getUserProfile(): Promise<UserProfile | null> {
    try {
        const profile = await getValue<UserProfile | null>(STORAGE_KEYS.USER_PROFILE, null);
        return profile;
    } catch (error: any) {
        logAsync('ERROR', '从本地存储获取用户账号信息失败', { error: error.message });
        return null;
    }
}

/**
 * 清除用户账号信息
 */
export async function clearUserProfile(): Promise<void> {
    try {
        await setValue(STORAGE_KEYS.USER_PROFILE, null);
        logAsync('INFO', '用户账号信息已清除');
    } catch (error: any) {
        logAsync('ERROR', '清除用户账号信息失败', { error: error.message });
        throw error;
    }
}

/**
 * 初始化用户账号信息区域
 */
export function initUserProfileSection(): void {
    const container = document.getElementById('user-profile-section');
    if (!container) return;

    // 添加登录按钮和用户信息显示区域
    container.innerHTML = `
        <div class="user-profile-container">
            <div id="user-profile-info" class="user-profile-info" style="display: none;">
                <div class="user-basic-info">
                    <div class="user-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="user-details">
                        <div class="user-email">
                            <i class="fas fa-envelope"></i>
                            <span id="user-email-text">-</span>
                        </div>
                        <div class="user-name">
                            <i class="fas fa-user"></i>
                            <span id="user-name-text">-</span>
                        </div>
                        <div class="user-type">
                            <i class="fas fa-crown"></i>
                            <span id="user-type-text">-</span>
                        </div>
                    </div>
                    <div class="user-actions">
                        <button id="refresh-profile-btn" class="refresh-btn" title="刷新账号信息">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                        <button id="logout-btn" class="logout-btn" title="退出登录">
                            <i class="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                </div>
                <div class="user-server-stats" id="user-server-stats" style="display: none;">
                    <div class="stats-title">
                        <i class="fas fa-server"></i>
                        <span>服务器数据</span>
                    </div>
                    <div class="stats-grid">
                        <div class="stat-item want-stat">
                            <i class="fas fa-star"></i>
                            <div class="stat-content">
                                <span class="stat-label">想看</span>
                                <span class="stat-value" id="server-want-count">-</span>
                            </div>
                        </div>
                        <div class="stat-item watched-stat">
                            <i class="fas fa-check"></i>
                            <div class="stat-content">
                                <span class="stat-label">看过</span>
                                <span class="stat-value" id="server-watched-count">-</span>
                            </div>
                        </div>
                    </div>
                    <div class="stats-sync-time">
                        <i class="fas fa-clock"></i>
                        <span id="stats-sync-time-text">-</span>
                    </div>
                </div>
            </div>
            <div id="user-login-prompt" class="user-login-prompt">
                <div class="login-icon">
                    <i class="fas fa-user-slash"></i>
                </div>
                <div class="login-text">
                    <p>未登录 JavDB 账号</p>
                    <p class="login-notice">登录信息仅用于同步数据使用</p>
                    <button id="login-btn" class="login-btn">
                        <i class="fas fa-sign-in-alt"></i>
                        登录获取账号信息
                    </button>
                </div>
            </div>
        </div>
    `;

    // 绑定事件
    bindUserProfileEvents();
    
    // 加载已保存的用户信息
    loadUserProfile();
}

/**
 * 绑定用户账号相关事件
 */
function bindUserProfileEvents(): void {
    const loginBtn = document.getElementById('login-btn');
    const refreshBtn = document.getElementById('refresh-profile-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', handleRefresh);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

/**
 * 处理登录按钮点击
 */
async function handleLogin(): Promise<void> {
    const loginBtn = document.getElementById('login-btn') as HTMLButtonElement;
    if (!loginBtn) return;

    try {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 获取中...';
        
        const profile = await fetchUserProfile();
        if (profile) {
            await saveUserProfile(profile);
            displayUserProfile(profile);
            showMessage('账号信息获取成功！', 'success');
        } else {
            showMessage('获取账号信息失败，请确保已登录 JavDB', 'error');
        }
    } catch (error: any) {
        showMessage('获取账号信息时发生错误', 'error');
        logAsync('ERROR', '登录处理失败', { error: error.message });
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> 登录获取账号信息';
    }
}

/**
 * 处理刷新按钮点击
 */
async function handleRefresh(): Promise<void> {
    const refreshBtn = document.getElementById('refresh-profile-btn') as HTMLButtonElement;
    if (!refreshBtn) return;

    try {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        const profile = await fetchUserProfile();
        if (profile) {
            await saveUserProfile(profile);
            displayUserProfile(profile);
            showMessage('账号信息已更新', 'success');
        } else {
            showMessage('刷新账号信息失败', 'error');
        }
    } catch (error: any) {
        showMessage('刷新账号信息时发生错误', 'error');
        logAsync('ERROR', '刷新处理失败', { error: error.message });
    } finally {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
    }
}

/**
 * 处理退出登录按钮点击
 */
async function handleLogout(): Promise<void> {
    try {
        await clearUserProfile();
        showLoginPrompt();
        showMessage('已退出登录', 'info');
    } catch (error: any) {
        showMessage('退出登录时发生错误', 'error');
        logAsync('ERROR', '退出登录失败', { error: error.message });
    }
}

/**
 * 加载并显示用户账号信息
 */
async function loadUserProfile(): Promise<void> {
    try {
        const profile = await getUserProfile();
        if (profile && profile.isLoggedIn) {
            displayUserProfile(profile);
        } else {
            showLoginPrompt();
        }
    } catch (error: any) {
        logAsync('ERROR', '加载用户账号信息失败', { error: error.message });
        showLoginPrompt();
    }
}

/**
 * 显示用户账号信息
 */
function displayUserProfile(profile: UserProfile): void {
    const infoContainer = document.getElementById('user-profile-info');
    const loginPrompt = document.getElementById('user-login-prompt');

    if (!infoContainer || !loginPrompt) return;

    // 更新用户信息
    const emailElement = document.getElementById('user-email-text');
    const nameElement = document.getElementById('user-name-text');
    const typeElement = document.getElementById('user-type-text');

    if (emailElement) emailElement.textContent = profile.email || '-';
    if (nameElement) nameElement.textContent = profile.username || '-';
    if (typeElement) typeElement.textContent = profile.userType || '-';

    // 更新服务器统计数据
    updateServerStats(profile.serverStats);

    // 显示用户信息，隐藏登录提示
    infoContainer.style.display = 'block';
    loginPrompt.style.display = 'none';

    // 刷新数据同步区域
    refreshDataSyncSection();
}

/**
 * 更新服务器统计数据显示
 */
function updateServerStats(serverStats?: any): void {
    const statsContainer = document.getElementById('user-server-stats');
    const wantCountElement = document.getElementById('server-want-count');
    const watchedCountElement = document.getElementById('server-watched-count');
    const syncTimeElement = document.getElementById('stats-sync-time-text');

    if (!statsContainer) return;

    if (serverStats && wantCountElement && watchedCountElement && syncTimeElement) {
        // 更新统计数据
        wantCountElement.textContent = formatCount(serverStats.wantCount || 0);
        watchedCountElement.textContent = formatCount(serverStats.watchedCount || 0);

        // 更新同步时间
        const syncTimeText = serverStats.lastSyncTime ?
            formatSyncTime(serverStats.lastSyncTime) : '未同步';
        syncTimeElement.textContent = syncTimeText;

        // 显示统计数据容器
        statsContainer.style.display = 'block';
    } else {
        // 隐藏统计数据容器
        statsContainer.style.display = 'none';
    }
}

/**
 * 格式化数量显示（显示详细数字）
 */
function formatCount(count: number): string {
    // 添加千位分隔符，显示完整数字
    return count.toLocaleString('zh-CN');
}

/**
 * 格式化同步时间显示
 */
function formatSyncTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) { // 1分钟内
        return '刚刚同步';
    } else if (diff < 3600000) { // 1小时内
        const minutes = Math.floor(diff / 60000);
        return `${minutes}分钟前`;
    } else if (diff < 86400000) { // 24小时内
        const hours = Math.floor(diff / 3600000);
        return `${hours}小时前`;
    } else {
        const days = Math.floor(diff / 86400000);
        return `${days}天前`;
    }
}

/**
 * 显示登录提示
 */
function showLoginPrompt(): void {
    const infoContainer = document.getElementById('user-profile-info');
    const loginPrompt = document.getElementById('user-login-prompt');

    if (!infoContainer || !loginPrompt) return;

    // 隐藏用户信息，显示登录提示
    infoContainer.style.display = 'none';
    loginPrompt.style.display = 'block';

    // 刷新数据同步区域
    refreshDataSyncSection();
}

/**
 * 刷新数据同步区域（延迟导入避免循环依赖）
 */
function refreshDataSyncSection(): void {
    // 使用动态导入避免循环依赖
    import('./dataSync').then(({ refreshDataSyncSection }) => {
        refreshDataSyncSection();
    }).catch(error => {
        logAsync('ERROR', '刷新数据同步区域失败', { error: error.message });
    });
}
