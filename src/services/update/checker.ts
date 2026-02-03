// src/services/update/checker.ts
// 负责从 GitHub Releases 检查扩展更新，并进行版本比较

export interface UpdateCheckResult {
  currentVersion: string;
  latestVersion?: string;
  hasUpdate: boolean;
  releaseUrl?: string;
  changelog?: string;
  error?: string;
}

// 获取当前扩展版本（从 manifest 读取，适用于 background/service worker）
export function getCurrentVersion(): string {
  try {
    const manifest = chrome.runtime.getManifest();
    return manifest.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

// 语义化版本比较：a > b 返回 1，a < b 返回 -1，相等返回 0
export function compareSemver(a: string, b: string): number {
  const norm = (v: string) => v.replace(/^v/i, '');
  const [aMain, aPre = ''] = norm(a).split('-', 2);
  const [bMain, bPre = ''] = norm(b).split('-', 2);

  const aNums = aMain.split('.').map(n => parseInt(n || '0', 10));
  const bNums = bMain.split('.').map(n => parseInt(n || '0', 10));

  for (let i = 0; i < Math.max(aNums.length, bNums.length); i++) {
    const ai = aNums[i] || 0;
    const bi = bNums[i] || 0;
    if (ai > bi) return 1;
    if (ai < bi) return -1;
  }

  // 主版本相等时，处理预发布标签：无预发布 > 有预发布
  if (aPre && !bPre) return -1;
  if (!aPre && bPre) return 1;
  if (aPre === bPre) return 0;
  return aPre > bPre ? 1 : -1;
}

interface GitHubRelease {
  html_url: string;
  tag_name?: string;
  name?: string;
  prerelease?: boolean;
  body?: string;
}

// 从 GitHub 获取最新 release（默认不包含 pre-release）
export async function fetchLatestRelease(includePrerelease = false): Promise<GitHubRelease | null> {
  try {
    // 方案1: 尝试通过 GitHub API 获取 releases 列表
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超时
    
    const resp = await fetch(
      'https://api.github.com/repos/Adsryen/JavdBviewed/releases',
      { 
        headers: { 
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        cache: 'no-cache',
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!resp.ok) {
      // 如果 API 失败（403 通常是速率限制），尝试备用方案
      console.warn(`[UpdateChecker] GitHub API ${resp.status}, trying fallback methods...`);
      return await fetchLatestReleaseFromJsDelivr();
    }
    
    const releases = (await resp.json()) as GitHubRelease[];
    
    if (!releases || releases.length === 0) {
      console.warn('[UpdateChecker] No releases found, trying fallback...');
      return await fetchLatestReleaseFromJsDelivr();
    }
    
    // 过滤预发布版本
    const filteredReleases = includePrerelease 
      ? releases 
      : releases.filter(r => !r.prerelease);
    
    if (filteredReleases.length === 0) {
      console.warn('[UpdateChecker] No stable releases found');
      return null;
    }
    
    // 返回第一个（最新的）release
    console.log('[UpdateChecker] Successfully fetched from GitHub API');
    return filteredReleases[0];
    
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.warn('[UpdateChecker] GitHub API timeout, trying fallback...');
    } else {
      console.warn('[UpdateChecker] GitHub API error, trying fallback:', err.message);
    }
    // 尝试备用方案
    return await fetchLatestReleaseFromJsDelivr();
  }
}

// 备用方案：从 jsdelivr 获取版本信息
async function fetchLatestReleaseFromJsDelivr(): Promise<GitHubRelease | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // 使用 jsdelivr 的 API 获取所有版本
    const resp = await fetch(
      'https://data.jsdelivr.com/v1/packages/gh/Adsryen/JavdBviewed',
      {
        signal: controller.signal,
        cache: 'no-cache'
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!resp.ok) throw new Error(`jsdelivr API ${resp.status}`);
    
    const data = await resp.json();
    
    // jsdelivr 返回的数据可能包含 tags 或 versions 数组
    const tags = data?.tags || data?.versions || [];
    
    if (tags && tags.length > 0) {
      // 获取最新的 tag（通常是第一个）
      const latestTag = tags[0];
      
      return {
        html_url: 'https://github.com/Adsryen/JavdBviewed/releases/latest',
        tag_name: latestTag,
        name: latestTag,
        prerelease: false,
        body: ''
      };
    }
    
    // 如果 jsdelivr 也失败，尝试直接从 GitHub 页面抓取
    console.warn('jsdelivr no tags, trying GitHub page scraping...');
    return await fetchLatestReleaseFromGitHubPage();
  } catch (err: any) {
    // 最后尝试从 GitHub 页面抓取
    console.warn('jsdelivr failed, trying GitHub page scraping...');
    return await fetchLatestReleaseFromGitHubPage();
  }
}

// 最后的备用方案：从 GitHub releases 页面抓取版本号
async function fetchLatestReleaseFromGitHubPage(): Promise<GitHubRelease | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // 直接访问 latest release 页面，GitHub 会重定向到最新版本
    const resp = await fetch(
      'https://github.com/Adsryen/JavdBviewed/releases/latest',
      {
        signal: controller.signal,
        redirect: 'follow'
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!resp.ok) throw new Error(`GitHub page ${resp.status}`);
    
    // 从 URL 中提取版本号（重定向后的 URL 包含版本号）
    const url = resp.url;
    const match = url.match(/\/releases\/tag\/(v?[\d.]+(?:-[\w.]+)?)/);
    
    if (match && match[1]) {
      const version = match[1];
      return {
        html_url: url,
        tag_name: version,
        name: version,
        prerelease: false,
        body: ''
      };
    }
    
    throw new Error('Could not extract version from GitHub page');
  } catch (err: any) {
    throw new Error(`All methods failed: ${err?.message || String(err)}`);
  }
}

export async function checkForUpdates(includePrerelease = false): Promise<UpdateCheckResult> {
  const current = getCurrentVersion();
  try {
    console.log(`[UpdateChecker] Checking for updates... Current version: ${current}`);
    
    const release = await fetchLatestRelease(includePrerelease);
    
    if (!release) {
      console.warn('[UpdateChecker] No release information available');
      return { 
        currentVersion: current, 
        hasUpdate: false,
        error: '无法获取版本信息，请稍后重试'
      };
    }
    
    const latest = release.tag_name || release.name || current;
    const hasUpdate = compareSemver(latest, current) > 0;
    
    console.log(`[UpdateChecker] Latest version: ${latest}, Has update: ${hasUpdate}`);
    
    return {
      currentVersion: current,
      latestVersion: latest,
      hasUpdate,
      releaseUrl: release.html_url,
      changelog: release.body,
    };
  } catch (err: any) {
    console.error('[UpdateChecker] Check failed:', err);
    return { 
      currentVersion: current, 
      hasUpdate: false, 
      error: err?.message || '检查更新失败，请检查网络连接'
    };
  }
}

