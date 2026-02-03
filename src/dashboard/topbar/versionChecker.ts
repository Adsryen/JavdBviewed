/**
 * 版本检测服务
 * 自动检测当前版本与 GitHub 最新版本的对比
 */

import { checkForUpdates, getCurrentVersion, compareSemver } from '../../services/update/checker';

interface VersionInfo {
  current: string;
  latest: string | null;
  status: 'preview' | 'outdated' | 'latest' | 'unknown';
  message: string;
}

// 全局缓存版本检测结果，确保整个应用只检查一次
let cachedVersionInfo: VersionInfo | null = null;
let lastCheckTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30分钟缓存
let checkPromise: Promise<VersionInfo> | null = null; // 防止并发请求

/**
 * 检测版本状态（使用统一的 checker 服务）
 */
export async function checkVersion(): Promise<VersionInfo> {
  // 如果有缓存且未过期，直接返回
  const now = Date.now();
  if (cachedVersionInfo && (now - lastCheckTime) < CACHE_DURATION) {
    return cachedVersionInfo;
  }

  // 如果正在检查中，返回同一个 Promise，避免重复请求
  if (checkPromise) {
    return checkPromise;
  }

  const current = getCurrentVersion();
  
  checkPromise = (async () => {
    try {
      const result = await checkForUpdates(false);
      
      if (result.error || !result.latestVersion) {
        const info: VersionInfo = {
          current,
          latest: null,
          status: 'unknown',
          message: 'Unable to check for updates'
        };
        cachedVersionInfo = info;
        lastCheckTime = now;
        return info;
      }
      
      const comparison = compareSemver(current, result.latestVersion);
      let info: VersionInfo;
      
      if (comparison > 0) {
        info = {
          current,
          latest: result.latestVersion,
          status: 'preview',
          message: `Preview Version (Latest: ${result.latestVersion})`
        };
      } else if (comparison < 0) {
        info = {
          current,
          latest: result.latestVersion,
          status: 'outdated',
          message: `Update Available: ${result.latestVersion}`
        };
      } else {
        info = {
          current,
          latest: result.latestVersion,
          status: 'latest',
          message: 'Latest Version'
        };
      }
      
      cachedVersionInfo = info;
      lastCheckTime = now;
      return info;
      
    } catch (error) {
      console.error('Error checking version:', error);
      const info: VersionInfo = {
        current,
        latest: null,
        status: 'unknown',
        message: 'Unable to check for updates'
      };
      cachedVersionInfo = info;
      lastCheckTime = now;
      return info;
    } finally {
      checkPromise = null; // 清除检查中的 Promise
    }
  })();

  return checkPromise;
}

/**
 * 初始化版本显示（异步，不阻塞页面加载）
 */
export async function initVersionBadge(): Promise<void> {
  const badge = document.getElementById('version-badge');
  const badgeText = document.getElementById('version-badge-text');
  
  if (!badge || !badgeText) {
    console.warn('Version badge elements not found');
    return;
  }
  
  // 先显示加载状态，不阻塞页面
  badge.className = 'version-badge version-unknown';
  badgeText.textContent = 'Checking...';
  badge.style.display = 'inline-flex';
  
  // 异步检查版本，不等待结果
  checkVersion().then(versionInfo => {
    // 只显示状态文本，不显示版本号
    let displayText = '';
    let title = `Current: v${versionInfo.current}`;
    
    // 设置样式类
    badge.className = 'version-badge';
    
    switch (versionInfo.status) {
      case 'preview':
        badge.classList.add('version-preview');
        displayText = 'Preview';
        title += ` | Stable: ${versionInfo.latest}`;
        break;
      case 'outdated':
        badge.classList.add('version-outdated');
        displayText = 'Update Available';
        title += ` | Latest: ${versionInfo.latest}`;
        break;
      case 'latest':
        badge.classList.add('version-latest');
        displayText = 'Latest';
        if (versionInfo.latest) {
          title += ` | GitHub: ${versionInfo.latest}`;
        }
        break;
      default:
        badge.classList.add('version-unknown');
        displayText = 'Unknown';
        title = `Current: v${versionInfo.current} | Unable to check for updates`;
        break;
    }
    
    badgeText.textContent = displayText;
    badge.title = title;
    
    // 如果有更新，添加点击事件跳转到 GitHub releases
    if (versionInfo.status === 'outdated') {
      badge.style.cursor = 'pointer';
      badge.addEventListener('click', () => {
        window.open('https://github.com/Adsryen/JavdBviewed/releases/latest', '_blank');
      });
    }
  }).catch(error => {
    console.error('Failed to initialize version badge:', error);
    // 降级显示
    const current = getCurrentVersion();
    badgeText.textContent = 'Unknown';
    badge.title = `Current: v${current} | Unable to check version status`;
    badge.className = 'version-badge version-unknown';
  });
}

/**
 * 清除缓存，强制重新检查
 */
export function clearVersionCache(): void {
  cachedVersionInfo = null;
  lastCheckTime = 0;
  checkPromise = null;
}
