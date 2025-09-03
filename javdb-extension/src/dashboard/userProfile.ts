import { logAsync } from './logger';
import { showMessage } from './ui/toast';
import type { UserProfile } from '../types';
import { userService } from './services/userService';
import { emit } from './services/eventBus';
import { getSettings, saveSettings } from '../utils/storage';
import { getDrive115V2Service, type Drive115V2UserInfo, type Drive115V2QuotaInfo } from '../services/drive115v2';
import { describe115Error } from '../services/drive115v2/errorCodes';
import { showToast } from '../content/toast';

// 115 加载并发保护
let isLoadingDrive115 = false;

// 重新导出用户服务的方法，保持向后兼容
export const fetchUserProfile = () => userService.fetchUserProfile();
export const saveUserProfile = (profile: UserProfile) => userService.saveUserProfile(profile);
export const getUserProfile = () => userService.getUserProfile();
export const clearUserProfile = () => userService.clearUserProfile();



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
                            <div class="user-actions">
                                <button id="refresh-profile-btn" class="refresh-btn" title="刷新账号信息">
                                    <i class="fas fa-sync-alt"></i>
                                </button>
                                <button id="logout-btn" class="logout-btn" title="退出登录">
                                    <i class="fas fa-sign-out-alt"></i>
                                </button>
                            </div>
                        </div>
                        <div class="user-type">
                            <i class="fas fa-crown"></i>
                            <span id="user-type-text">-</span>
                        </div>
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
        <!-- 115 用户信息独立容器（与 JavDB 并列） -->
        <div class="drive115-profile-container" style="margin-top:10px;">
            <div id="drive115-user-info" class="drive115-user-info" style="display:none;">
                <div class="stats-title" style="display:flex; align-items:center; gap:6px;">
                    <img src="../assets/115-logo.svg" alt="115" style="width:16px;height:16px;"/>
                    <span>115 账号</span>
                    <span id="drive115-user-status" style="margin-left:auto; font-size:12px; color:#888;"></span>
                    <button id="drive115-refresh-btn" class="refresh-btn" title="刷新 115 账号信息" style="margin-left:8px;">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
                <div id="drive115-user-box" class="card" style="padding:8px; border:1px solid #eee; border-radius:6px; margin-top:6px;">
                    <p style="margin:0; color:#888;">未加载</p>
                </div>
            </div>
        </div>
    `;

    // 绑定事件
    bindUserProfileEvents();
    
    // 加载已保存的用户信息
    loadUserProfile();
    // 加载 115 用户信息（仅渲染缓存，不触发网络刷新）
    loadDrive115UserInfo({ allowNetwork: false });
}

/**
 * 绑定用户账号相关事件
 */
function bindUserProfileEvents(): void {
    const loginBtn = document.getElementById('login-btn');
    const refreshBtn = document.getElementById('refresh-profile-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const drive115RefreshBtn = document.getElementById('drive115-refresh-btn');

    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', handleRefresh);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    if (drive115RefreshBtn) {
        drive115RefreshBtn.addEventListener('click', handleDrive115Refresh);
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

            // 发送用户登录状态变化事件
            emit('user-login-status-changed', {
                isLoggedIn: true,
                profile
            });
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
        // 同步刷新 115 用户信息（不触发网络刷新，仅更新缓存展示）
        await loadDrive115UserInfo({ allowNetwork: false });
    } catch (error: any) {
        showMessage('刷新账号信息时发生错误', 'error');
        logAsync('ERROR', '刷新处理失败', { error: error.message });
    } finally {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
    }
}

/**
 * 处理 115 刷新按钮点击
 */
async function handleDrive115Refresh(): Promise<void> {
    const btn = document.getElementById('drive115-refresh-btn') as HTMLButtonElement | null;
    if (!btn) return;
    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        await loadDrive115UserInfo({ allowNetwork: true }); // 仅手动触发时允许网络刷新
        showToast('115 账号信息已更新', 'success');
    } catch (error: any) {
        const msg = describe115Error(error) || error?.message || '刷新 115 账号信息时发生错误';
        showToast(msg, 'error');
        logAsync('ERROR', '115 刷新处理失败', { error: error?.message });
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sync-alt"></i>';
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

        // 发送用户退出登录事件
        emit('user-logout', {});
        emit('user-login-status-changed', {
            isLoggedIn: false
        });
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
    // 自动展示 115 用户信息的缓存（不阻塞，不触发网络刷新）
    setTimeout(() => { loadDrive115UserInfo({ allowNetwork: false }); }, 0);
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

        // 强制移除背景色 - 通过内联样式覆盖
        const statItems = statsContainer.querySelectorAll('.stat-item');
        statItems.forEach(item => {
            const element = item as HTMLElement;
            element.style.background = 'transparent';
            element.style.border = 'none';
            element.style.backgroundColor = 'transparent';
        });

        // 强制移除 stat-value 元素的背景色
        const statValues = statsContainer.querySelectorAll('.stat-value');
        statValues.forEach(value => {
            const element = value as HTMLElement;
            element.style.background = 'transparent';
            element.style.backgroundColor = 'transparent';
        });

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
 * 刷新数据同步区域（使用事件总线避免循环依赖）
 */
function refreshDataSyncSection(): void {
    try {
        // 使用事件总线通知数据同步模块刷新
        emit('data-sync-refresh-requested', {});
        // logAsync('DEBUG', '已发送数据同步刷新请求');
    } catch (error: any) {
        logAsync('ERROR', '发送数据同步刷新请求失败', { error: error.message });
    }
}

/**
 * 加载并显示 115 v2 用户信息
 */
async function loadDrive115UserInfo(opts?: { allowNetwork?: boolean }): Promise<void> {
    if (isLoadingDrive115) {
        console.debug('[drive115v2-ui] 忽略重复的 115 加载请求（上一次尚未完成）');
        return;
    }
    isLoadingDrive115 = true;
    const block = document.getElementById('drive115-user-info') as HTMLDivElement | null;
    const statusEl = document.getElementById('drive115-user-status') as HTMLSpanElement | null;
    const box = document.getElementById('drive115-user-box') as HTMLDivElement | null;
    if (!block || !box) return;

    try {
        // 读取设置（仅判断开关）
        const settings = await getSettings();
        const s = (settings as any)?.drive115 || {};
        const enabled = !!s.enabled;
        const enableV2 = !!s.enableV2;

        if (!enabled) {
            block.style.display = 'none';
            return;
        }

        block.style.display = 'block';
        // 若存在已缓存的用户信息，先行展示，避免刷新/离线时为空
        const cachedUser = (s as any).v2UserInfo as Drive115V2UserInfo | undefined;
        const cachedExpired = !!(s as any).v2UserInfoExpired;
        if (cachedUser && Object.keys(cachedUser).length > 0) {
            render115User(cachedUser, (s as any)?.v2UserInfoUpdatedAt);
            set115Status(cachedExpired ? '已过期（缓存）' : '已缓存', cachedExpired ? 'warn' : 'info');
        } else {
            set115Status('加载中…', 'info');
            box.innerHTML = '<p style="margin:0; color:#888;">加载中…</p>';
        }

        // 如果不允许网络请求，则到此为止（仅展示缓存）
        if (!(opts?.allowNetwork === true)) {
            // 若无缓存则保持“加载中…”或根据需要提示
            return;
        }

        if (!enableV2) {
            set115Status('未启用新版 115', 'warn');
            box.innerHTML = '<p style="margin:0; color:#888;">请在设置中启用新版 115（Token 模式）</p>';
            return;
        }

        const svc = getDrive115V2Service();
        // 仅在允许网络时才真实获取 115 用户信息
        console.debug('[drive115v2-ui] 调用 fetchUserInfoAuto() 获取 115 用户信息（手动）');
        const userAuto = await svc.fetchUserInfoAuto({ forceAutoRefresh: true });
        if (!userAuto.success || !userAuto.data) {
            console.debug('[drive115v2-ui] 获取 115 用户信息失败', { message: userAuto.message, raw: (userAuto as any).raw });
            const emsg = describe115Error((userAuto as any).raw) || userAuto.message || '获取用户信息失败';
            set115Status('获取失败', 'error');
            box.innerHTML = `<p style="margin:0; color:#d00;">${emsg}</p>`;
            showToast(emsg, 'error');
            const newSettings: any = { ...settings };
            newSettings.drive115 = { ...(settings as any).drive115, v2UserInfoExpired: true };
            await saveSettings(newSettings);
            return;
        }

        set115Status('已更新', 'ok');
        showToast('已更新 115 用户信息', 'success');
        render115User(userAuto.data, Date.now());
        // 持久化用户信息与时间戳，并清除过期标记
        const newSettings: any = { ...settings };
        newSettings.drive115 = {
            ...(settings as any).drive115,
            v2UserInfo: userAuto.data,
            v2UserInfoUpdatedAt: Date.now(),
            v2UserInfoExpired: false,
        };
        await saveSettings(newSettings);

        // 3) 成功后再获取额度配额：直接使用当前设置中的 access_token，避免再次触发刷新
        try {
            const s2 = await getSettings();
            const at2: string = ((s2 as any)?.drive115?.v2AccessToken || '').toString().trim();
            if (at2) {
                const quotaRet = await svc.getQuotaInfo({ accessToken: at2 });
                if (quotaRet.success && quotaRet.data) {
                    render115Quota(quotaRet.data);
                } else if (!quotaRet.success) {
                    const qmsg = quotaRet.message || '获取配额失败';
                    render115QuotaHint(qmsg);
                    showToast(qmsg, 'info');
                }
            } else {
                const qmsg = '缺少 access_token，无法获取配额';
                render115QuotaHint(qmsg);
                showToast(qmsg, 'info');
            }
        } catch (e: any) {
            const qmsg = describe115Error(e) || e?.message || '获取配额失败';
            render115QuotaHint(qmsg);
            showToast(qmsg, 'error');
        }
    } catch (e: any) {
        const msg = describe115Error(e) || e?.message || '加载失败';
        set115Status(msg, 'error');
        box.innerHTML = `<p style="margin:0; color:#d00;">${msg}</p>`;
        showToast(msg, 'error');
    } finally {
        isLoadingDrive115 = false;
    }

    function set115Status(msg: string, kind: 'ok'|'error'|'info'|'warn' = 'info') {
        if (!statusEl) return;
        statusEl.textContent = msg;
        const color = kind === 'ok' ? '#2e7d32' : kind === 'error' ? '#c62828' : kind === 'warn' ? '#ef6c00' : '#888';
        (statusEl as any).style && ((statusEl as any).style.color = color);
    }

    function render115User(u: Drive115V2UserInfo, updatedAtMs?: number) {
        const container = document.getElementById('drive115-user-box') as HTMLDivElement | null;
        if (!container) return;
        const name = u.name || (u as any).nick || (u as any).username || `UID ${u.uid || (u as any).user_id || (u as any).id || ''}`;
        const avatar = u.avatar || (u as any).avatar_middle || (u as any).avatar_small || '';
        const isVip = (() => {
            const v: any = (u as any).is_vip; if (typeof v === 'boolean') return v ? '是' : '否'; if (typeof v === 'number') return v > 0 ? '是' : '否'; return '-';
        })();
        const totalNum: number | undefined = (u as any).space_total;
        const usedNum: number | undefined = (u as any).space_used;
        const freeNum: number | undefined = (u as any).space_free;
        const spaceTotal = formatBytes(totalNum);
        const spaceUsed = formatBytes(usedNum);
        const spaceFree = formatBytes(freeNum);
        const pct = (() => {
          if (typeof usedNum === 'number' && typeof totalNum === 'number' && totalNum > 0) {
            const p = Math.min(100, Math.max(0, (usedNum / totalNum) * 100));
            return Number.isFinite(p) ? p : 0;
          }
          return NaN;
        })();
        const pctText = isNaN(pct as any) ? '-' : `${(pct >= 100 ? 100 : pct).toFixed(pct >= 10 ? 0 : 1)}%`;
        const barColor = isNaN(pct as any) ? '#90caf9' : (pct < 60 ? '#4caf50' : pct < 85 ? '#ff9800' : '#e53935');
        const updatedText = typeof updatedAtMs === 'number' ? new Date(updatedAtMs).toLocaleString() : '';

        container.innerHTML = `
          <div style="display:flex; align-items:center; gap:10px;">
            ${avatar
              ? `<img src="${avatar}" alt="avatar" style="width:40px; height:40px; border-radius:50%; object-fit:cover; box-shadow:0 0 0 1px #eee;">`
              : `<div style="width:40px; height:40px; border-radius:50%; background:#e0e0e0; color:#555; display:flex; align-items:center; justify-content:center; font-weight:600; box-shadow:0 0 0 1px #eee;">${(name||'U').toString().trim().slice(0,2).toUpperCase()}</div>`}
            <div style="flex:1;">
              <div style="font-weight:600;">${name || '-'}</div>
              <div style="font-size:12px; color:#666;">UID: ${u.uid || (u as any).user_id || (u as any).id || '-'}</div>
            </div>
            <div style="font-size:12px; color:#666;">VIP: ${isVip}${(u as any).vip_level ? `（Lv.${(u as any).vip_level}）` : ''}</div>
          </div>
          <div style="margin-top:6px; font-size:12px; color:#444;">
            <div>总空间：${spaceTotal}</div>
            <div>已使用：${spaceUsed}</div>
            <div>剩余：${spaceFree}</div>
            ${(u as any).vip_expire ? `<div>到期：${(u as any).vip_expire}</div>` : ''}
            ${(u as any).email ? `<div>邮箱：${(u as any).email}</div>` : ''}
            ${(u as any).phone ? `<div>手机：${(u as any).phone}</div>` : ''}
          </div>
          <div style="margin-top:8px;">
            <div style="display:flex; align-items:center; justify-content:space-between; font-size:12px; color:#666; margin-bottom:4px;">
              <span>空间使用</span>
              <span>${pctText}${!isNaN(pct as any) ? `（已用 ${spaceUsed} / 总 ${spaceTotal}）` : ''}</span>
            </div>
            <div style="height:8px; background:#eee; border-radius:999px; overflow:hidden;">
              <div style="height:100%; width:${!isNaN(pct as any) ? pct : 0}%; background:${barColor}; transition:width .3s ease;"></div>
            </div>
          </div>
          ${updatedText ? `<div style="margin-top:6px; font-size:11px; color:#888;">更新于：${updatedText}</div>` : ''}
        `;
    }

    function render115Quota(info: Drive115V2QuotaInfo) {
        const container = document.getElementById('drive115-user-box') as HTMLDivElement | null;
        if (!container) return;
        const list = Array.isArray(info.list) ? info.list : [];
        const totalTxt = typeof info.total === 'number' ? info.total.toString() : '-';
        const usedTxt = typeof info.used === 'number' ? info.used.toString() : undefined;
        const surplusTxt = typeof info.surplus === 'number' ? info.surplus.toString() : undefined;
        const rows = list.slice(0, 6).map(it => {
            const name = it.name ?? `类型${it.type ?? ''}`;
            const used = typeof it.used === 'number' ? it.used : undefined;
            const surplus = typeof it.surplus === 'number' ? it.surplus : undefined;
            const exp = it.expire_info?.expire_text || '';
            return `<div style="display:flex; justify-content:space-between; font-size:12px; color:#444;">
                <span>${name}${exp ? `（${exp}）` : ''}</span>
                <span>${used !== undefined ? `已用 ${used}` : ''}${surplus !== undefined ? `${used !== undefined ? ' / ' : ''}剩余 ${surplus}` : ''}</span>
            </div>`;
        }).join('');
        const summary = (usedTxt || surplusTxt) ? `<div style="font-size:12px; color:#666;">${usedTxt ? `总已用：${usedTxt}` : ''}${usedTxt && surplusTxt ? '，' : ''}${surplusTxt ? `总剩余：${surplusTxt}` : ''}</div>` : '';
        container.insertAdjacentHTML('beforeend', `
          <div style="margin-top:10px; padding-top:8px; border-top:1px dashed #e0e0e0;">
            <div style="display:flex; align-items:center; gap:6px; font-weight:600; color:#333; margin-bottom:4px;">
              <i class="fas fa-ticket-alt"></i><span>离线配额</span>
              <span style="margin-left:auto; font-size:12px; color:#888;">${totalTxt !== '-' ? `总额：${totalTxt}` : ''}</span>
            </div>
            ${rows || '<div style="font-size:12px; color:#888;">无配额信息</div>'}
            ${summary}
          </div>
        `);
    }

    function render115QuotaHint(msg: string) {
        const container = document.getElementById('drive115-user-box') as HTMLDivElement | null;
        if (!container) return;
        container.insertAdjacentHTML('beforeend', `
          <div style="margin-top:10px; font-size:12px; color:#ef6c00;">
            <i class="fas fa-exclamation-triangle"></i> ${msg}
          </div>
        `);
    }

    function formatBytes(n?: number): string {
        if (typeof n !== 'number' || isNaN(n)) return '-';
        const units = ['B','KB','MB','GB','TB','PB'];
        let v = n; let i = 0; while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
        return `${v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2)} ${units[i]}`;
    }
}
